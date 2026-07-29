# ADR-0006: Artifact secret/PII sanitizer (WP-01)

- Durum: Kabul edildi
- Tarih: 2026-07-29

## Bağlam

Testler production tenant'ına (`app.vomenta.com`) karşı koşuyor; trace, video,
screenshot ve `testInfo.attach` çıktıları gerçek müşteri verisi ve kimlik
bilgisi içerebiliyor. Önceki koşularda Voice WebSocket kimlik bilgisinin
konsola yazıldığı gözlendi. Maskeleme yalnızca `diagnostics` fixture'ında,
sınırlı (yalnız e-posta + `bearer`) ve dağınıktı; `contacts-export.csv` gibi
ekler gerçek e-posta/telefon içeriyordu. Artifact'ler CI'da saklanıp
paylaşıldığı için bu bir P0 gizlilik riski.

## Karar

Tek, Playwright'a bağımsız ortak maskeleyici: `tests/fixtures/sanitize.js`.
Hem fixture'lar hem `tools/self-check-artifact-safety.mjs` kullanır.

1. `redactText` / `redactUrl` / `redactHeaders` / `redactDeep` makine ile
   tespit edilebilir sızıntı sınıflarını maskeler: JWT, `Bearer` token,
   provider key (`sk_/pk_/rk_live|test_`), e-posta, telefon (`+…`), URL query
   değerleri + userinfo, ve hassas anahtarlı kv/header (`authorization`,
   `cookie`, `set-cookie`, `token`, `secret`, `password`, `x-api-key`, `session`…).
2. Testler ham `testInfo.attach` yerine `artifacts.safeAttach` /
   `artifacts.safeScreenshot` kullanır. `safeAttach` body'yi (JSON→`redactDeep`,
   metin/CSV→`redactText`) maskeler; `safeScreenshot` PII bölgelerini `mask`
   ile yakalama anında kapatır. `diagnostics` de ortak maskeleyiciye delege eder;
   `cleanup-errors.json` / `runtime-diagnostics.json` ekleri `redactDeep`'ten geçer.
3. Maskeleyici ile tarayıcı (`findSecrets`) AYNI desen kümesini paylaşır:
   tarayıcının tanıdığı her sızıntı maskeleyici tarafından da temizlenir.
4. `quality:artifact-safety` sert kapısı: bilerek enjekte edilen her sızıntı
   sınıfı maskeleniyor mu, tarayıcı ham girdide yakalayıp maskeli çıktıda sıfır
   buluyor mu, ve hiçbir `*.spec.js` ham `testInfo.attach` çağırıyor mu — statik
   ve fonksiyonel olarak doğrular. `quality:check` zincirine eklendi.

### Bilinçli sınır

Serbest-form kişi ADI otomatik tespit edilmez; genel isim yakalama aşırı
maskeleme/false-positive üretir (rapor/schedule adları vb.). İsim PII'si
`safeScreenshot` `mask`'i ve/veya yapısal (kolon/alan bazlı) redaksiyonla
korunur. Discovery raporu kendi pipeline'ında (structuralAria/redactUrl)
maskelenip diske `path:` ile eklendiğinden `safeAttach` istisnasıdır.

## Sonuçlar

- Token/Authorization/cookie/e-posta/telefon/provider-key/kv hiçbir ek/console
  çıktısında açık kalmaz; sızarsa CI kırılır.
- Yeni bir spec ham `testInfo.attach` eklerse kapı kırılır (safeAttach zorunlu).
- İsim ve diğer serbest-form PII için ekran görüntüsü maskesi/elle redaksiyon
  gerektiği belgeli ve bilinçli bir sınırdır; WP-05/WP-06'da yüzey bazında uygulanır.
