# ADR-0017: Nightly cross-browser kararlılığı — tarayıcı × shard matrisi

- Durum: Kabul edildi (WP-NIGHT-STABILITY / FAZ 7)
- Tarih: 2026-08-03
- İlgili: [ADR-0009](0009-artifact-allowlist.md) (artifact allowlist), [ADR-0013](0013-doc-drift-gates-pr-only.md)

## Bağlam

`.github/workflows/playwright.yml` nightly (`schedule: 0 1 * * *`) hattında iki job her gece **iptal (cancelled)** oluyordu; son 6 scheduled run 5× cancelled + 1× failure — hiç yeşil yok.

Ölçülen kök neden (hang değil, kapasite uyuşmazlığı):

- **`full-regression`** = `npm run test:e2e` = filtresiz `playwright test` → **3854 test** = authed suite **1275 test × 3 tarayıcı** (`chromium-authed` + `firefox-authed` + `webkit-authed`) + discovery/login. Ayar `workers=2, retries=2`, test-timeout 60s, canlı prod, **45-dk kutu**. 3854 test / 2 worker → 45 dk'ya sığması matematiksel olarak imkânsız → kendi `timeout-minutes`'ına çarpıp cancelled.
- **`visual-regression / macOS`** = 64 `@visual` test, tek koşum, **30-dk kutu** → 2/3 run 30-dk'da cancelled.

Net etki: nightly sıfır yeşil cross-browser/visual sinyali üretiyordu.

## Değerlendirilen seçenekler

1. **Sadece timeout artırmak** — reddedildi (handoff §7.3: "timeout artırımı tek başına çözüm değil"; 3854 test için makul bir kutuya sığmaz).
2. **Klasik blob-merge sharding** (her shard `--reporter=blob` → ara artifact → `merge-reports`) — reddedildi: blob raporları canlı prod verisi (attachment/trace/screenshot) taşıyabilir; job'lar arası ham blob upload'ı merkezi artifact güvenlik politikasına (`ART_WORKFLOW_RAW_UPLOAD`) takılır.
3. **Cross-browser'ı @critical'e daraltmak** — reddedildi: kapsam düşürür (handoff §7.4).
4. **Tarayıcı × shard matrisi + per-hücre güvenli özet** — SEÇİLDİ.

## Karar

`full-regression` ve `visual-regression` job'ları GitHub Actions **matris**iyle tarayıcıya (ve full için ayrıca shard'a) bölünür. Her matris hücresi kendi `test-results/report.json`'unu üretir ve mevcut `prepare-ci-artifact` ile **kendi güvenli sayısal özetini** hazırlar; ham blob/merge yoktur.

- `full-regression`: `matrix.browser ∈ {chromium-authed, firefox-authed, webkit-authed} × matrix.shard ∈ {1,2}` → 6 paralel hücre. Adım: `playwright test --project=<browser> --shard=<s>/2`. `--project` setup dependency'sini + `storageState`'i otomatik koşar (auth korunur). Kutu 45→**60** dk; `retries` 2→**1**.
- `visual-regression`: `matrix.browser ∈ {chromium-authed, firefox-authed, webkit-authed}` → 3 hücre. Adım: `test:visual -- --project=<browser>`. `retries=0`, kutu 30 dk korunur.
- `fail-fast: false` → bir tarayıcı/parça kırmızı olunca diğerleri iptal edilmez; her tarayıcının gerçek sonucu ayrı görünür (handoff §7.5).

### Shard sayısı (K=2) gerekçesi

GitHub Actions runner-**dakikasıyla** ücretlendirir. Toplam test-dakikası sabittir; daha çok shard = daha çok runner = her runner'da tekrarlanan kurulum (npm ci + tarayıcı) → daha çok toplam dakika. K=2 en az runner (6) → en düşük ek maliyet ve en düşük prod eşzamanlılığı (flaky riski). Gece koştuğu için ~55 dk'lık cüzdan-saati (wall-clock) önemsiz; 60-dk kutu güvenli tamamlanmayı sağlar. Nihai K, kontrollü bir `workflow_dispatch suite=full` koşumunun gerçek süreleriyle doğrulanır.

## Dürüstçe kaydedilen kapsam notları

- `full-regression` artık yalnız üç **authed** projeyi koşar. Login-only smoke (`login.spec.js` ×3) `public-smoke` lane'inde, `chromium-discovery` ise ayrı `read-only-discovery` lane'inde koşar → tekrar kaldırıldı, kapsam kaybı değil. Tek küçük istisna: firefox/webkit için login **sayfasının** cross-browser görünümü artık nightly'de koşmaz (tek sayfa; kabul edildi).
- `failOnFlakyTests` korunur: `retries=1` ile retry'da geçen test PASS değil FLAKY sayılır ve run'ı kırar (handoff §7.4). "3 ardışık yeşil scheduled run" kararlılık ölçütü bu yüzden gerçek flake-yokluğu gerektirir.

## Sonuçlar

- Artifact allowlist etkisi yok: matris upload **adım** sayısını değiştirmez (statik 9 upload adımı korunur); `name` matris-templatelenir, `path` aynı güvenli lane'de kalır → `LANES` kaydı değişmez. `quality:artifact-allowlist` + `quality:ci-workflow` yeşil.
- `WP-NIGHT-STABILITY: COMPLETE` ancak **3 ardışık scheduled nightly** yeşil olduktan sonra yazılır; o zamana kadar `STABILITY-PENDING`.

## Güncelleme (v2) — ilk kontrollü koşumdan öğrenilen

v1 (K=2) merge sonrası bir `workflow_dispatch suite=full` koşumu (run 30845051091) matrisin **yapısal olarak çalıştığını** (tarayıcı×shard hücreleri CI'da ayrı) doğruladı, ama iki gerçek sorunu ölçtü:

1. **Chromium shard'ı 60dk'ya sığmadı.** `chromium-authed --shard=x/2` = 638 test → her iki chromium shard'ı 60dk timeout'ta cancelled. webkit-authed/2 de (auth geçtiği hâlde) 60dk'da bitmedi. Yani tek shard başına 638 test canlı prod'da (başarısız/askıda testler 60s timeout×retry bütçesini yiyor) çok fazla.
2. **Tek prod hesabı 9 eşzamanlı login'i kaldırmıyor.** 6 full + 3 visual hücresi aynı anda tek `VOMENTA_EMAIL` ile `auth.setup.js` login'ini denedi; bazı hücreler (ör. firefox/webkit shard 1) login `toBeVisible()` hatasıyla ~2dk'da düştü. Kanıt: aynı tarayıcının bir shard'ı 2dk'da login'de patlarken diğeri 60dk koştu (deterministik değil = eşzamanlılık çakışması). Auth state'i job'lar arası paylaşmak secret sızıntısı olduğundan (politika yasağı) çözüm eşzamanlılığı sınırlamak.

**v2 değişiklikleri:**
- `full-regression`: shard 2→**4** (638→~160 test/hücre; 60dk'ya sığar) + `strategy.max-parallel: 3` (bu job'da aynı anda en çok 3 login).
- `visual-regression`: `strategy.max-parallel: 1` (görsel hücreleri sırayla → full ile eşzamanlı toplam login baskısını azaltır).
- Net: eşzamanlı login ~9 → ~4. Gece koştuğu için artan cüzdan-saati (12 full hücresi, 3 dalga) önemsiz; runner-dakikası artışı kararlılık için kabul edildi.

Bu best-effort'tır: tek prod hesabıyla tamamen temiz olmayabilir. v2 de yetmezse dürüst sonuç `STABILITY-BLOCKED: tek prod hesabı eşzamanlı-auth tavanı` olur ve ikinci test hesabı/staging (owner işi, EK A) gerekir.
