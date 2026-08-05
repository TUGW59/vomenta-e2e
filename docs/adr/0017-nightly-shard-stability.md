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

## v3 — `@clean` websocket sınıfı (2026-08-04)

Matris altyapısı yapısal olarak çalışsa da (iptal→tamamlanma), iki kontrollü dispatch koşumu (run 30845051091, 30851028695) nightly'nin hâlâ **kırmızı** kaldığını ve firefox/chromium shard'larının 60 dk'da cancelled olduğunu ölçtü. Suite ~%93 yeşil; baskın kırmızı+yavaşlık sürücüsü **tek** app davranışıydı.

**Kök neden:** app `wss://api.vomenta.com/socket.io/?agentId=undefined&tenantId=undefined` ile socket açıp düşürüyor; **firefox/webkit** bunu `console-error` logluyor, **chromium loglamıyor** → `@clean` (assertClean) firefox/webkit'te çok sayıda sayfada düşüyordu (ff/4=15, webkit/4=7, chromium/4=3 fail). Bu, 22 ayrı bug değil **tek kök neden**; her başarısız `@clean` 60 s timeout'a doğru bekleyip retry ile shard süresini yiyordu → aynı anda hem kırmızı hem yavaş.

**Karar (record + allowlist):** App-tarafı düzeltme ayrı repo olduğundan, bulguyu **gizlemeden** ele alıyoruz:
- Bulgu `APP-WSS-UNDEFINED-IDS` `tests/contracts/known-bugs.js`'e kaydedildi (`guard: 'fixme'`, status `open`, owner görünür); `docs/raporlar/findings.json` + `BULGULAR.md` regenerate edildi.
- `tests/fixtures/test.js` `DEFAULT_DIAGNOSTICS_ALLOWLIST`'e finding-id yorumlu, **dar** ve tarayıcı-agnostik regex eklendi: `/socket\.io[^\s]*(agentId=undefined|tenantId=undefined)/`.
- **Honesty-core:** yalnız `undefined`-id imzası tolere edilir. Geçerli id'li gerçek socket hataları, redakte edilmiş URL'ler, alakasız console-error ve 5xx **hâlâ** yakalanır (deterministik regex proof ile doğrulandı). Ham "hepsini sustur" yok.
- `redactText` `agentId=undefined`'i korur (secret değil) → console-error text eşleşir; `redactUrl` query değerlerini maskelediğinden request-failed URL'i bilerek eşleşmez (chromium'da fail sayısının düşük olması sürücünün console-error olduğunu doğrular).

**Kalan riskler (STABILITY-PENDING):** `failOnFlakyTests` korunur; canlı prod'da artık flaky tam sıfırlanamayabilir (tam determinizm staging gerektirir → ayrı program). Coaching [tr]/[fr] i18n triyajı ve olası shard kalibrasyonu (Faz B/C) dispatch ölçümüne bağlı. Regex, dispatch'te yakalanan gerçek `runtime-diagnostics.json`'a göre teyit edilecek.

## v4 — Eşzamanlı-login (auth) tavanı: ölçülen gerçek blocker (2026-08-04)

v3 (record+allowlist) sonrası kontrollü `workflow_dispatch suite=full` (run **30868877612**, base 991ff4c) koştu ve **@clean'in nightly kırmızısının baskın nedeni OLMADIĞINI** kanıtladı. Per-hücre log:
- **4 hücre** (webkit-1/2, firefox-2, chromium-2): `[setup] tests/auth.setup.js › kimlik doğrula` LOGIN FAIL — login sonrası `nav` 30 s'de görünmedi (retry de düştü) → **"1 failed, 637 did not run"**; `@clean` HİÇ koşmadı.
- **2 hücre** (chromium-1, firefox-1): auth.setup hard-fail etmedi ama oturum yarı-authed kaldı → **her** sayfa testi `nav` (15 s) görünmüyor diye yavaşça düştü → 639 test 60 dk'ya sığmadı → cancelled.

**Kök neden (tek):** dispatch/schedule'da ~11 authed job (full 6 + visual 3 + discovery + reconcile) **TEK prod hesabıyla aynı anda login** oluyor → hesap eşzamanlı oturumu güvenilir taşımıyor → bozuk/yarı-authed oturum. **Shard boyutu kanıtlanmış blocker DEĞİL** (sağlıklı oturum süresi ölçülemedi — tüm hücrelerde oturum bozuktu). Bu, v2 notundaki "STABILITY-BLOCKED: tek prod hesabı eşzamanlı-auth tavanı" tahmininin doğrulanması.

**Karar (eşzamanlı login'i gerçekten sınırla; körlemesine allowlist genişletme YOK):**
1. `full-regression` matrisine **`max-parallel: 2`**. **Açık uyarı:** `max-parallel` GitHub Actions'ta YALNIZCA kendi job'ının matris hücrelerini kısıtlar; **farklı job'ları etkilemez**. Bu yüzden cross-job login çakışması ayrıca (2) ile sınırlanır.
2. `visual-regression`, `read-only-discovery` → `needs: [architecture, full-regression]`; `nightly-known-bug-reconcile` → `needs: [architecture, visual-regression]`. Decoupled `if` (`!cancelled() && needs.architecture.result=='success' && (schedule||dispatch-full)`) → full başarısız/cancelled olsa da koşarlar (kapsam düşmez) ama login'leri full'unkilerle ÜST ÜSTE binmez. `visual` `max-parallel: 1`. → **tepe eşzamanlı login ~2.**
3. `@clean` allowlist deseni **daraltıldı**: `wss://…socket.io` + **HEM** `agentId=undefined` **HEM** `tenantId=undefined` (sıra bağımsız). Tek-id anomalisi, geçerli id, redakte URL, alakasız console-error, 5xx HÂLÂ yakalanır (10-vaka deterministik regex proof). Fixture browser/route-scope alanı taşımadığından scope yerine imza daraltıldı (dürüst eşdeğer).

**Shard kalibrasyonu bilinçli ERTELENDİ:** geçerli süre verisi yok (tüm oturumlar bozuktu) + shard artırmak daha çok eşzamanlı login = sorunu büyütür. Bu round'da shard browser başına 3 (yalnız hücrelerin BİTİP gerçek süre üretmesi için, mp2 login'i 2'de tutar). Oturum sağlıklı olunca (bir sonraki dispatch) ölçülen sürelere göre "hiçbir shard 60 dk'ya yaklaşmasın" hedefiyle kalibre edilir.

**Başarı ölçütü (yeşil tek başına yeterli DEĞİL):** test sayısı düşmemeli, beklenmeyen hata maskelenmemeli, en az **2 ardışık kontrollü nightly/dispatch yeşil**. mp=2 hâlâ oturum bozuyorsa sonraki round mp=1 (tam seri). PR'da tutulur; doğrulama gösterilmeden merge YOK.
