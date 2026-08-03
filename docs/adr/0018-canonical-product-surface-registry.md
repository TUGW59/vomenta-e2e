# ADR-0018 — Kanonik Ürün Yüzeyi Registry'si (Canonical Product Surface Source)

- **Durum:** Kabul edildi (WP-SURFACE-REGISTRY / Faz 1)
- **Tarih:** 2026-08-03
- **Bağlam kaynağı:** VOMENTA-SURFACE-ENVANTERI handoff §1, §4; Faz 0 gerçeklik-kilidi kapanış raporu
- **İlgili:** ADR-0012 (surface-depth-matrix), ADR-0002 (mandatory-test-styles), ADR-0016 (report-truth-gates)

## Bağlam — bugünkü döngüsel bağımlılık

"Üründe hangi yüzeyler var?" bilgisi ile "hangi yüzeyler test edildi?" iddiası bugün
tek dosyaya — `tests/contracts/tested-pages.js` — bağlı. Üç ayrı kapsam matrisi de rota
kümesini oradan türetiyor:

```
tested-pages.js (.routes)  ← TEK KAYNAK
    ├── registered-routes.js       → REGISTERED_ROUTES = buildRegisteredRoutes(TESTED_PAGES)
    ├── style-coverage.mjs         → registeredRoutes = TESTED_PAGES.flatMap(routes)
    └── generate-surface-depth.mjs → TESTED_PAGES + REGISTERED_ROUTES
```

Sonuç bir **döngüsel/örtük bağımlılık**tır: bir ürün yüzeyi için `tested-pages.js`'te
giriş yoksa, o yüzey üç matristen de **aynı anda ve sessizce** kaybolur. Kırmızı bir satır
bile görünmez — yüzey hiç var olmamış gibi davranılır. Faz 0 bunu koddan doğruladı
(`registered-routes.js:2,66`) ve en az 19 gözlenmiş-ama-kayıtsız rota + `/contacts` alt
yüzeylerini ortaya çıkardı. Kritik nokta: bunların çoğunun **dedicated testi zaten var**;
eksik olan **kayıt**tır. Yani mevcut model "eksik yüzey"i "eksik test"ten ayıramıyor.

## Karar

`tests/contracts/product-surfaces.js` adında **bağımsız, kanonik bir ürün yüzeyi
registry'si** oluşturuldu. Bu dosya:

- Yalnız **üründe var olduğu kanıtla doğrulanan** yüzeyleri tanımlar.
- **"Test edildi mi?" sorusunu CEVAPLAMAZ** — kapsam etiketi, spec dosyası, arketip ya da
  `✅` içermez (fail-closed: bu anahtarların varlığı self-check tarafından reddedilir).
- **Statik bir literal**dir; `tested-pages.js`'i **içe aktarmaz** → kırdığı döngüsel
  bağımlılık geri gelmez.
- Her yüzeyi **ürün-varlık kanıtına** bağlar: `navigation-contract`, `route-inventory`,
  `discovery-observation`, `known-bug` (ve ileride `live-observation` / `runtime-observation`).

`tested-pages.js` silinmez; **rolü değişir**: artık ürün envanteri değil, "bu yüzey için
şu testler/arketip iddia ediliyor" diyen bir **kapsam sözleşmesi**dir (migrasyon Faz 3).

## Değerlendirilen alternatifler

1. **`tested-pages.js`'i tek kaynak olarak korumak, ters kontrol eklemek.** Reddedildi:
   döngüsel bağımlılık ve "kayıt = test iddiası" karışımı kök nedende kalırdı; ters kontrol
   yalnız `MAIN_NAVIGATION`'ın 14 rotasını görebiliyor (asıl kör nokta alt yüzeyler).
2. **Runtime/discovery çıktısını kanonik kaynak yapmak.** Reddedildi: bu çıktılar bayatlar
   (Faz 0'da runtime raporu `provenance=UNVERIFIED`, discovery 2026-07-30) ve canlı üründeki
   erişim/izin durumuna göre eksik kalır; kanonik model deterministik ve versiyonlanmış olmalı.
3. **Bağımsız, elle-küratörlü kanonik registry (seçilen).** Ürün-varlık bilgisini kapsam
   iddiasından ayırır; gözlem kaynakları buna karşı uzlaştırılır (Faz 2); matrisler buradan
   üretilir (Faz 5). Kayıtsız/sözleşmesiz yüzey artık **açık eksik** olarak görünür, kaybolmaz.

## Rota politikası (routeKind × lifecycle × runtimePolicy)

- **static:** sabit path. `:param` veya `{...}` içeremez.
- **dynamic:** `/:param` şablonu. **Sahte gerçek URL'ye çevrilmez.** `runtimePolicy` zorunlu
  `fixture-required`, `fixtureRef` (null olabilir) ve izinli bir `blockedReason`
  (ör. `READONLY_FIXTURE_ID_REQUIRED`) taşır. Örn. `/bot-builder/:id`.
- **redirect:** `redirectTarget` (geçerli, normalize rota) **zorunlu**.
- **conditional lifecycle:** `condition` (feature-flag/izin açıklaması) **zorunlu**.
  Örn. `/settings/billing` → billing-admin izni; standart roller 403 alır → `/`'ye döner.
- **deprecated lifecycle:** silinmeden önce `migrationRef` (migration kaydı) **zorunlu**.

Bütün enum'lar ve `blockedReason` kodları kapalı listedir; bilinmeyen değer **fail-closed
reddedilir** (`validateSurface` / `validateRegistry`).

## Source-of-truth sınırı

| Bilgi | Kaynak |
|---|---|
| Üründe hangi yüzey var? | **`PRODUCT_SURFACES`** (bu dosya) |
| Bir yüzey için hangi testler/arketip iddia ediliyor? | Kapsam sözleşmesi (`tested-pages.js`, Faz 3'te `surfaceIds`'e taşınır) |
| Bir yüzey gerçekten test edildi mi / hangi durumda? | Completeness + rapor motoru (Faz 2 / Faz 5), matris durumları (`REGISTERED`, `NO_COVERAGE_CONTRACT`, `UNREGISTERED_OBSERVED`, …) |

Registry **durum (state) taşımaz**; durumu motorlar türetir. Böylece "yüzey var" ile
"yüzey yeşil" asla karışmaz.

## Kapsam sınırı (bu ADR / Faz 1)

- Registry + saf validator kütüphanesi + negatif self-check + bu ADR.
- **`REGISTERED_ROUTES` kaynağı bu fazda DEĞİŞTİRİLMEZ** (mevcut test davranışı korunur).
- Yalnız ürün-varlık kanıtı olan 71 yüzey kaydedildi. Yalnız spec/page-object kodunda geçen
  alt yüzeyler (ör. `/ai/voice`, `/supervisor/coaching`, `/voice/live`, `/contacts/*`,
  PR#42'ye özel `/campaigns/{sender-ids,dnc,templates}`) **bilinçli dışarıda**: canlı
  read-only doğrulama (Faz 4) öncesi kayda alınmaz. Faz 2 motoru bunları
  `UNREGISTERED_OBSERVED` olarak dürüstçe raporlar; kaybolmazlar.

## Migration planı

1. **Faz 1 (bu ADR):** bağımsız registry + validator + ADR. Kaynak değişmez.
2. **Faz 2:** completeness motoru — tüm gözlem kaynaklarını (`MAIN_NAVIGATION`, kapsam
   `surfaceIds`, `[route:]` marker, `KNOWN_BUGS`, runtime, discovery, PR-impact) registry ile
   uzlaştıran sert/fail-closed kapı; `quality:check`e bağlanır.
3. **Faz 3:** `REGISTERED_ROUTES` `PRODUCT_SURFACES`'tan üretilir; kapsam sözleşmeleri
   `surfaceIds` referanslarına taşınır; dynamic/redirect/blocked policy'ler fail-closed uygulanır.
4. **Faz 4:** eksik yüzeyler canlı read-only doğrulanıp registry'ye eklenir.
5. **Faz 5:** style / surface-depth / envanter / project-status aynı kanonik modelden üretilir.

## Sonuç

Ürün yüzeyi bilgisi test kapsamı iddiasından ayrıldı. Kanonik registry bağımsız, tekil-kimlikli,
kanıt-bağlı ve fail-closed doğrulanıyor. Kayıtsız veya sözleşmesiz yüzey artık hiçbir matristen
sessizce kaybolamaz; açık eksik olarak görünecek (Faz 2+).
