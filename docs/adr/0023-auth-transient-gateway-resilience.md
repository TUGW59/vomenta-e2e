# ADR-0023: Auth setup için sınırlı geçici-gateway retry + "hiç çalışmadı" = NOT_RUN

- Durum: Kabul edildi
- Tarih: 2026-08-04
- İlişki: ADR-0016 (report truth gates — bu ADR onun NOT_RUN semantiğini keskinleştirir),
  ADR-0012 (ev deseni: saf modül + sentetik self-check). Yeni bir environment/rapor
  sistemi kurmaz; mevcut sözleşmeye iki cerrahi düzeltme ekler.

## Bağlam

Canlı production sunucusu (`app.vomenta.com`) aralıklı olarak `502/503/504` (nginx
gateway) döndürüyor — isteklerin ~%20'si, dakikalar süren dalgalar hâlinde. Bu
blip'ler `tests/auth.setup.js` login akışını düşürüyor:

```
auth.setup 503'e denk gelir
  → storageState yazılmaz
  → chromium-authed dependency başlamaz
  → 87 authed rota HİÇ çalışmaz
  → runtime rapor bunları FAIL sayar (sahte "87 route FAIL")
```

İki ayrı sorun var: (1) geçici gateway blip'i kalıcı bir başarısızlık gibi
davranıyor; (2) bağımlılık düşünce hiç çalışmayan rotalar gerçek rota-FAIL'i gibi
raporlanıyor (yanıltıcı; kırmızı ama yanlış nedenle).

## Karar

1. **Saf, test edilebilir retry modülü** — `tests/support/gateway-retry.js`
   Playwright import ETMEZ. `runAuthWithGatewayRetry(attemptFn, opts)` denemeyi
   YALNIZ hata `error.gatewayStatus ∈ {502,503,504}` taşıyorsa ve deneme hakkı
   (`MAX_AUTH_ATTEMPTS = 3`) kaldıysa tekrarlar. `isGatewayStatus`,
   `shouldRetryAuth`, `gatewayStatusFromBodyText`, `GatewayUnavailableError`
   dışa açılır. Saf olduğu için tarayıcısız deterministik self-check tüm dalları
   sürebilir.

2. **Kanıt-temelli sınıflandırma (LoginPage)** — `login()` yalnız GERÇEK gateway
   kanıtını `GatewayUnavailableError`'a çevirir. Kanıt üç kaynaktan gelir:
   (a) `page.goto` yanıt kodu 5xx, (b) ağ üzerinde gözlemlenen 5xx yanıt
   (navigasyon + API/XHR; `page.on('response')` ile toplanır, `pickGatewayStatus`
   ile seçilir), (c) render edilen nginx 5xx sayfa metni. **(b) kritik:** CI'da
   gözlendiği gibi sayfa 200 dönüp arka plan API 503'ü içeriği bloke ettiğinde
   ("Welcome back" render olmaz) kanıt YALNIZ gözlemlenen yanıtta görünür; body
   5xx metni oluşmaz. Kanıt her denemede `beginAttempt()` ile sıfırlanır (denemeye
   özgü). **Retry EDİLMEZ:** yanlış credential, 401/403, locator hatası, assertion
   hatası, gateway kanıtı olmayan nav/heading hatası — aynen yükselir.

3. **Stale storage-state hijyeni** — her denemeden ÖNCE bayat state silinir; state
   YALNIZ login TAM başarılı olunca yazılır. Yarım/başarısız denemeden oturum kalmaz.

4. **"Hiç çalışmadı" = NOT_RUN, sahte FAIL değil** — `runtime-report-lib.mjs`:
   sonuç denemesi olmayan test (`results:[]` → attempts 0, finalStatus `unknown`)
   Playwright'ın "bağımlılık düştü, test hiç başlamadı" işaretidir. Artık `notrun`
   lensine iner → rota `NOT_RUN` (reason `dependency-not-run`), `failedThisRun` 0.
   **Zayıflatma yok:** gerçekten çalışıp (attempts ≥ 1) bilinmeyen/yarıda-kesilen
   test HÂLÂ güvenli-taraf FAIL kalır. Koşum yine non-zero döner (Playwright
   exit-code + orchestrator) — pipeline kırmızı; ama 87 rota sahte FAIL'e boyanmaz.

5. **Sert kapılar** — yeni `quality:auth-retry` (6 sözleşme: 503→retry,
   503→success→PASS, 3×503→FAIL, 401/403→retry-yok, locator→retry-yok, 502/504→retry)
   `quality:check` zincirine eklendi. `quality:runtime-report` 18→19 sözleşme:
   auth-bağımlılığı-düştü→NOT_RUN (sahte-FAIL-değil) + attempts≥1-unknown→FAIL korunur.

## Neden sabit bekleme (waitForTimeout) yok

Mimari kuralı sabit beklemeyi yasaklar. Retry'lar arası yapay `sleep` YOK: her
retry taze bir `login()` = yeni `page.goto('/')` çalıştırır; navigasyonun doğal
süresi denemeleri zaten aralar ve sunucuyu yeniden yoklar.

## Sonuç

Auth, gateway dalgasına denk geldiğinde en fazla 3 denemeyle kendini toparlar;
gerçek başarısızlıklar (credential/401/403/locator) anında ve maskesiz kırmızı
kalır. Auth tamamen düşerse rotalar dürüstçe NOT_RUN görünür, pipeline yine
kırmızıdır. Runtime snapshot'ına git-diff drift kapısı EKLENMEZ (ADR-0016): canlı
koşumun ürünüdür. Tüm yeni davranış sentetik, production'a bağlanmayan
self-check'lerle doğrulanır.
