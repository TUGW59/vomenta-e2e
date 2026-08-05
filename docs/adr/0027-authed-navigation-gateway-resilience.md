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
   - `getGatewayObserver(page)` — page'e per-deneme, KAPSAMLANMIŞ 5xx gözlemcisi
     kurar (idempotent, `WeakMap` ile page başına TEK response listener). Her
     kanıt `{status, url, resourceType, source, epoch}` taşır.
   - `assertOrGateway(observer, fn, where)` — `fn` patlarsa YALNIZ kapsamlı gerçek
     gateway kanıtı varsa `GatewayUnavailableError`'a çevirir; yoksa orijinal
     hatayı AYNEN fırlatır (fail-closed).
   - `navigateWithGatewayRetry(page, {doGoto, ready, where, afterCommit})` — her
     denemede `beginAttempt() → doGoto()` → (nav status 5xx doğrudan kanıt) →
     `afterCommit()` → `assertOrGateway(ready)`. YALNIZ kapsamlı gateway kanıtında
     ≤`MAX_AUTH_ATTEMPTS` (3) retry.

2. **Kanıt kapsamı (evidence scope) — güvenlik sözleşmesi.** Her ağ `502/503/504`'ü
   gateway kanıtı DEĞİLDİR. Yalnız sayfanın hazır olmasını GERÇEKTEN etkileyen,
   GÜVENİLİR first-party yanıtlar sayılır:
   - mevcut ana document (top-frame) navigasyonu, VEYA
   - first-party origin'e ait `xhr`/`fetch`.

   "First-party", baseURL host'u ile **aynı registrable domain** (same-site)
   demektir; origin/apex `environment.baseURL`'den türetilir, hard-code YOKTUR
   (ör. `app.vomenta.com` ve `api.vomenta.com` → kabul). Third-party / analytics /
   image / font / favicon / stylesheet / script yanıtları ve alt-frame document'ler
   `5xx` OLSA BİLE kanıt SAYILMAZ → bunlar bir retry tetikleyemez. Böylece ilgisiz
   bir arka plan 503'ü gerçek bir locator/assertion hatasını maskeleyemez.

3. **Stale-evidence politikası.** Her kanıt bir `epoch` (attempt) ile etiketlenir;
   `beginAttempt()` epoch'u ilerletir ve önceki denemenin kanıtını temizler →
   bir denemenin 5xx'i başka bir denemenin assertion hatasına sızamaz.
   **Sonuç (kapsam dışı):** `helpers.assertDestinationLoaded()` tıklama-SONRASI
   çalışır; navigasyonu tetikleyen tıklama assertion'dan ÖNCE olduğundan temiz bir
   kanıt penceresi açılamaz. Fail-closed garanti edilemediği için bu helper ağ
   kanıtı KULLANMAZ ve bu PR'da DEĞİŞTİRİLMEZ — gerçek hataları aynen yükseltir.
   Tıklama-tetikli navigasyonun gateway dayanıklılığı ayrı bir çalışmaya bırakılır.

4. **`doGoto()` exception sözleşmesi.** `navigateWithGatewayRetry` `doGoto()`'yu
   `try/catch` ile sarar:
   - exception + AYNI attempt'te kapsamlı gateway kanıtı → `GatewayUnavailableError`
     + sınırlı retry.
   - exception + kanıt yok → orijinal error nesnesi AYNEN yükselir. Generic nav
     timeout / locator / assertion hatası gateway'e ÇEVRİLMEZ.

5. **Retry gözlemlenebilirliği (secretsiz).** Retry gerçekleştiğinde tek satır,
   sınırlı bir log üretilir:
   `[authed-nav] transient gateway 503; retrying 2/3; where="gotoApp: /reports"; source="first-party-xhr"`.
   Yalnız `status` / `attempt` / `where` (rota etiketi) / `source` (kaynak sınıfı)
   yazılır. Email, token, cookie, password, storageState, response body veya URL
   ASLA loglanmaz.

6. **DRY: LoginPage delegasyonu** — LoginPage'in constructor'daki
   `page.on('response')` + `_gatewayStatuses` + `_detectGatewayEvidence()` mantığı
   paylaşımlı, kapsamlanmış observer'a taşındı; `_assertOrGateway` import edilen
   fonksiyona delege eder. Login akış davranışı ve `auth.setup.js` DEĞİŞMEDİ (login
   API çağrısı first-party xhr olduğundan gerçek gateway blip'i hâlâ retry edilir).

7. **Kritik "sayfa 200 ama arka plan API 503" yolu** — CI'daki asıl senaryo:
   navigasyon 200 döner ama arka plandaki **first-party** API 503'ü içeriği bloke
   eder; `expectReady()` patlar ama render edilen sayfada 5xx METNİ oluşmaz. Kanıt
   YALNIZ gözlemlenen first-party ağ yanıtında görünür. Bu yol self-check'te C2
   sözleşmesiyle kilitlenir.

8. **Sert kapı** — yeni `quality:authed-nav` **20 sözleşme** (11 navigasyon:
   nav-503→retry, sayfa-200-ama-first-party-API-503→retry, kanıt-yok→retry-yok,
   401→retry-yok, 3×503→FAIL, 502/504→retry, body-text→retry, third-party-503→
   retry-yok, stale-evidence-reddi, doGoto-exception+503→retry, doGoto-exception+
   kanıtsız→orijinal; + 9 birim: first-party-doc/xhr/fetch kabul, third-party/
   image/font/alt-frame red, observer idempotent+tek-listener, `assertOrGateway`
   iki-dal, secretsiz retry-log formatı) `quality:check` zincirine `quality:auth-retry`
   yanına eklendi. Modül Playwright import etmediği için sahte page ile tarayıcısız
   sürülür.

## Neden sabit bekleme (waitForTimeout) yok

Mimari kuralı sabit beklemeyi yasaklar (`tools/validate-architecture.mjs` statik
zorlar). `runAuthWithGatewayRetry`'a `sleep` opt'u VERİLMEZ: her retry taze bir
`goto` çalıştırır; navigasyonun doğal süresi denemeleri zaten aralar ve sunucuyu
yeniden yoklar.

## Kapsam dışı

- `helpers.assertDestinationLoaded()` — tıklama-sonrası, temiz kanıt penceresi
  açılamadığından ağ kanıtı KULLANMAZ (bkz. Karar §3, stale-evidence). Bu PR'da
  değiştirilmez.
- `helpers.expectContentWithin()` (@perf süre ölçümü) DOKUNULMAZ: retry süreyi
  bozar, ölçümü geçersiz kılar. @perf navigasyonu gateway dalgasında hâlâ düşebilir.
- `playwright.config.js` `retries` / `failOnFlakyTests` DEĞİŞMEZ (ADR-0025).

## Sonuç

Authed navigasyon, YALNIZ kapsamlı gerçek gateway kanıtında (first-party ana
document veya first-party xhr/fetch 5xx) en fazla 3 denemeyle kendini toparlar;
gateway dalgası geçince test PASS olur. Gerçek locator/assertion/401/403 hataları
ve ilgisiz third-party/asset 5xx'leri hiçbir yolda `GatewayUnavailableError`'a
çevrilmez — anında ve maskesiz kırmızı kalır (fail-closed). Bu iddia, negatif
sözleşmelerle (third-party-503→retry-yok, stale-evidence-reddi, doGoto-exception+
kanıtsız→orijinal, kanıt-yok→retry-yok) sentetik olarak kanıtlanır. Nightly
`full-regression` + `visual-regression` lane'leri artık geçici 503'lerden kırmızıya
dönmez. Tüm yeni davranış production'a bağlanmayan self-check ile doğrulanır.
