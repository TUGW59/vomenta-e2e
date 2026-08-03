# ADR-0012: Rota kapsam derinliği matrisi (WP-SURFACE / FAZ 4)

- Durum: Kabul edildi
- Tarih: 2026-08-03
- İlişki: `WP-CI-EMERGENCY` (ADR-0010/0011) bir PR'da ilgili testin gerçekten
  koşmasını zorunlu kıldı. Bu ADR ikinci açığı kapatır: `55/55 PASS` yalnız L1
  açılış tabanını kanıtlar; her rotanın DERİNLİĞİ (L1–L5) tek, otomatik,
  şişirmeyen bir matriste görünmüyordu.

## Bağlam

Kayıtlı 55 rota için tek gerçeklik envanteri (`registered-routes.js`) ve gerçek
runtime sonucu (`TEST-SONUCLARI.json → pages[].baselineStatus`) mevcuttu. Ayrıca
sayfa × stil kapsaması (`TEST_STYLE_MATRIX.md`) ve dosya bazlı senaryo listesi
(`TEST_COVERAGE.md`) vardı. Eksik olan: **rota bazlı, seviye bazlı (L1–L5)
derinlik gerçeği** — hangi rotanın yalnız açıldığı (L1), hangisinin yüzey/stil
sözleşmesini karşıladığı, hangi derin davranışların HÂLÂ kanıtlanmadığı.

## Karar

### 1) Saf lib + CLI + sentetik self-check (ev deseni)

`tools/surface-depth-lib.mjs` (saf, yan etkisiz) modeli kurar/doğrular/render eder;
`tools/generate-surface-depth.mjs` (CLI) gerçek envanter + runtime + Playwright
`--list` etiketleriyle besler; `tools/self-check-surface-depth.mjs` tüm sözleşmeyi
TAMAMEN SENTETİK fixture'larla, production'a bağlanmadan doğrular. Bu, runtime-report
(ADR yokken WP-MORNING) üçlüsüyle aynı ayrımdır.

### 2) Kanonik seviyeler ve KANIT KAYNAKLARI (statik ≠ runtime)

| Seviye | Kanıt kaynağı | Bu fazdaki davranış |
|---|---|---|
| L1 | **Gerçek runtime** (`baselineStatus`) | PROVEN yalnız PASS/FLAKY; runtime yoksa L1 PROVEN OLAMAZ (→ NOT_RUN/L0) |
| L2 · stil | **Statik etiket** + sözleşme ilişkisi | boyut `COVERED` = test VAR; "bu koşumda çalıştı" DEĞİL |
| L2 · etkileşim | **yok** (rota düzeyi makine-okur işaret yok) | asla COVERED; en fazla `UNVERIFIED` (NO_MACHINE_SIGNAL) |
| L3 | staging (production read-only'de yasak) | hasWrites → BLOCKED/STAGING_REQUIRED; değilse N/A/NO_WRITE_SURFACE |
| L4 | rol/tenant hesap altyapısı (yok) | uniform BLOCKED/ROLE_ACCOUNTS_REQUIRED |
| L5 | provider koşum-takımı (yok) | uniform BLOCKED/PROVIDER_HARNESS_REQUIRED |

L1'in runtime, L2'nin statik olması handoff §4.4'ün ("statik test varlığı ile
gerçek runtime sonucu AYRI alanlardır") doğrudan uygulanmasıdır.

### 3) L2'nin iki katmanı — neden style-coverage'ı tekrar etmiyoruz

Mevcut style-coverage SERT KAPISI yeşil olduğundan, yalnız stil etiketine dayanan
bir L2 hiçbir ayırt edici güce sahip olmaz (her kayıtlı sayfa zaten zorunlu stili
taşır → 55/55 "complete" → şişirme). Bu yüzden L2 iki AYRI katmana bölünür:

- **Stil sözleşmesi** (tag-destekli): a11y/i18n/layout/errorpath/keyboard/clean/
  deeplink/visual/perf/data/export. Gerekçeli N/A stil sözleşmesini KARŞILAR
  (style-coverage ile aynı).
- **Etkileşim derinliği** (sekme/filtre/tablo/pagination/boş/loading): read-only
  kullanıcı davranışı (§4.3/§4.6). Bunlar için rota düzeyi makine-okur işaret
  YOKTUR → **asla `COVERED` iddia edilmez**. Uygulanabilirlik yalnız YÜZEY-ÖZGÜ
  (dedicated, `routeLevelBaseline` olmayan) arketipten okunur; dedicated arketip
  yoksa bileşenlerin yokluğu kanıtlanamaz → tüm etkileşim boyutları `UNVERIFIED`.

Sonuç dürüst manşet: **`L2·deep` (tam etkileşim derinliği kanıtlı) bu faz için
üretilemez** — çünkü etkileşim için makine-okur kanıt yoktur. Böylece "stil kapısı
yeşil = derin test edildi" yanılgısı yapısal olarak engellenir; derin etkileşim
kapsamı açıkça FAZ 5 / WP-L2-WAVE-1 borcudur.

### 4) Test↔rota ilişkisi (deterministik, iki kanal)

1. Exact `[route:/x]` işareti (baseline spec'leri; her zaman kesin).
2. Sözleşme üyeliği: `TESTED_PAGES.routes ∋ R` ve specFile ∈ o sözleşme (çok-rota
   parametreli sözleşmeler dahil — ilişki açık ve deterministik, §4.7).

Eşlenemeyen testler `unmappedTests`'e düşer ve HİÇBİR rotayı yeşile boyayamaz.
Bulgular yalnız EXACT `bug.route === route` ile bağlanır; kalan `unmappedFindings`.

### 5) Sayılar türetilir, sabit değildir

Rota evreni `REGISTERED_ROUTES`'tan; tüm toplamlar satırlardan türetilir. `55` sabit
eşik değildir; o anki benzersiz rota sayısı kanoniktir. Yeni rota eklenip matris
güncellenmezse `report:surface:check` (drift) kapısı kırılır; envanter/satır
uyuşmazlığında `validateSurfaceInvariants` fırlatır.

## Çıktılar

```text
tools/surface-depth-lib.mjs          # saf motor
tools/generate-surface-depth.mjs     # CLI (report:surface)
tools/self-check-surface-depth.mjs   # sert kapı (quality:surface)
docs/raporlar/SURFACE-DEPTH.json     # makine-okur
docs/SURFACE-DEPTH-MATRIX.md         # repo source-of-truth (drift kapısı)
```

Script'ler: `report:surface`, `report:surface:check` (üret + `git diff --exit-code`),
`quality:surface` (sentetik self-check; `quality:check` zincirine eklendi).

## Sonuçlar

- **Artı:** 55 rotanın L1–L5 derinliği tek, denetlenebilir, şişirmeyen matriste;
  L1 gerçek runtime'a bağlı; L2 statik/etkileşim ayrımı dürüst; L3–L5 sınır beyanları
  açık; bulgular rotaya bağlı; drift + invariant kapıları fail-closed.
- **Sınır:** Etkileşim derinliği (filtre/sekme/tablo/pagination/boş/loading) için
  rota düzeyi makine-okur kanıt yoktur → bu faz hiçbir rotayı `L2·deep` yapmaz;
  bu, FAZ 5'in (gerçek L2 read-only akışları + rota-düzeyi işaretler) girdisidir.
- **Değişmeyen:** Production read-only; yeni artifact upload lane yok; mevcut
  WP-SEC-B allowlist'i korunur; testlere/known-bug guard'larına dokunulmaz.
