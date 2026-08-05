# ADR-0027: Authed navigasyon için sınırlı geçici-gateway retry

- Durum: Kabul edildi
- Tarih: 2026-08-05
- İlişki: ADR-0023 (auth setup için gateway retry — bu ADR onun kapsamını
  `auth.setup.js` login akışından authed test GÖVDELERİNİN navigasyonuna
  genişletir), ADR-0012 (ev deseni: saf modül + tarayıcısız sentetik self-check),
  ADR-0025 (bu retry test-runner retry'ı DEĞİL; in-process — `failOnFlakyTests`
  ve `PLAYWRIGHT_RETRIES` DEĞİŞMEZ). Yeni bir environment/rapor sistemi kurmaz;
  mevcut kanıt makinesini paylaşımlı bir modüle çıkarıp navigasyona uygular.

## Bağlam

Canlı production sunucusu (`app.vomenta.com`) aralıklı olarak `502/503/504`
(nginx gateway) döndürüyor, dakikalar süren dalgalar hâlinde. ADR-0023 bu
blip'lere karşı YALNIZ login akışını (`auth.setup.js`) koruyordu. Login başarıyla
`storageState` yazdıktan sonra, authed test gövdelerinin HER navigasyonu
(`page.goto` + `expectReady`) korumasızdı:

```
Error: expect(locator).toBeVisible() failed
> 23 | await expect(this.navigation).toBeVisible();
18 × locator resolved to <h1>503 Service Temporarily Unavailable</h1>
```

Bir 503 dalgası bu navigasyonlara çarptığında test düz kırmızıya boyanıyordu.
`failOnFlakyTests: isCI` açık olduğu için test-runner retry'ında geçen test PASS
sayılmaz (FLAKY = kırmızı); genel retry'ı artırmak (ADR-0025) çözüm değildir.
Çözüm **in-process** olmalı: navigasyon, yalnız gerçek gateway kanıtında,
denemeyi kendi içinde tekrarlamalı.

## Karar

1. **Paylaşımlı, saf glue modülü** — `tests/support/gateway-navigation.js`
   Playwright import ETMEZ; yalnız saf `gateway-retry.js` politikasını `page` ile
   birleştirir. Üç dışa-açılan primitif:
   - `getGatewayObserver(page)` — page'e per-deneme 5xx gözlemcisi kurar
     (idempotent, `WeakMap` ile page başına TEK dinleyici). `page.on('response')`
     artık authed context'te de kurulur.
   - `assertOrGateway(observer, fn, where)` — `fn` patlarsa YALNIZ gerçek gateway
     kanıtı varsa `GatewayUnavailableError`'a çevirir; yoksa orijinal hatayı AYNEN
     fırlatır (fail-closed).
   - `navigateWithGatewayRetry(page, {doGoto, ready, where, afterCommit})` — her
     denemede `beginAttempt() → doGoto()` (nav status 5xx doğrudan kanıt) →
     `afterCommit()` → `assertOrGateway(ready)`. YALNIZ gateway kanıtında
     ≤`MAX_AUTH_ATTEMPTS` (3) retry.

2. **Çağrı noktaları** — `BasePage.open()` (53 page object) ve `helpers.gotoApp()`
   (~112 spec) `navigateWithGatewayRetry` ile sarıldı. `assertDestinationLoaded()`
   tıklama-sonrası olduğundan (goto yok, tıklama retry edilemez) yalnız içerik
   assertion'ları `assertOrGateway` ile sarıldı: gerçek gateway kanıtı dürüst
   `GatewayUnavailableError` olarak yüzeye çıkar, retry döngüsüne ALINMAZ.

3. **DRY: LoginPage delegasyonu** — LoginPage'in constructor'daki
   `page.on('response')` + `_gatewayStatuses` + `_detectGatewayEvidence()` mantığı
   paylaşımlı observer'a taşındı; `_assertOrGateway` import edilen fonksiyona
   delege eder. Login davranışı ve `auth.setup.js` DEĞİŞMEDİ.

4. **Kritik "sayfa 200 ama arka plan API 503" yolu** — CI'daki asıl senaryo:
   navigasyon 200 döner ama arka plandaki API 503'ü içeriği bloke eder;
   `expectReady()` patlar ama render edilen sayfada 5xx METNİ oluşmaz. Kanıt
   YALNIZ gözlemlenen ağ yanıtında görünür (`page.on('response')` → observer →
   `pickGatewayStatus`). Bu yol açıkça belgelenip self-check'te #2 sözleşmesiyle
   kilitlenir.

5. **Sert kapı** — yeni `quality:authed-nav` (7 sözleşme: nav-503→retry,
   sayfa-200-ama-API-503→ağ-kanıtıyla-retry, kanıt-yok→retry-yok, 401→retry-yok,
   3×503→FAIL, 502/504→retry, body-text→retry + `assertOrGateway` iki-dal birim)
   `quality:check` zincirine `quality:auth-retry` yanına eklendi. Modül Playwright
   import etmediği için sahte page ile tarayıcısız sürülür.

## Neden sabit bekleme (waitForTimeout) yok

Mimari kuralı sabit beklemeyi yasaklar (`tools/validate-architecture.mjs` statik
zorlar). `runAuthWithGatewayRetry`'a `sleep` opt'u VERİLMEZ: her retry taze bir
`goto` çalıştırır; navigasyonun doğal süresi denemeleri zaten aralar ve sunucuyu
yeniden yoklar.

## Kapsam dışı

- `helpers.expectContentWithin()` (@perf süre ölçümü) DOKUNULMAZ: retry süreyi
  bozar, ölçümü geçersiz kılar. @perf navigasyonu gateway dalgasında hâlâ düşebilir.
- `playwright.config.js` `retries` / `failOnFlakyTests` DEĞİŞMEZ (ADR-0025).

## Sonuç

Authed navigasyon, gerçek gateway kanıtında en fazla 3 denemeyle kendini
toparlar; gateway dalgası geçince test PASS olur. Gerçek locator/assertion/401/403
hataları hiçbir yolda `GatewayUnavailableError`'a çevrilmez — anında ve maskesiz
kırmızı kalır (fail-closed). Nightly `full-regression` + `visual-regression`
lane'leri artık geçici 503'lerden kırmızıya dönmez. Tüm yeni davranış sentetik,
production'a bağlanmayan self-check ile doğrulanır.
