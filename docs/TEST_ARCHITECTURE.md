# Playwright test mimarisi

## Amaç

Bu test platformu ürünün HTML ayrıntılarına değil, kullanıcıya sunulan davranış
sözleşmelerine bağlanır. Bir UI değişikliğinin etkisi mümkün olan en dar katmanda
kalmalı; test verisi, ortam ve kimlik bilgileri test dosyalarına dağılmamalıdır.

## Bağımlılık yönü

```text
spec (iş davranışı)
  └─ fixture (uygulama, API, güvenlik politikası)
      ├─ App / Page Object (ekran davranışı)
      │   └─ AppShell / BasePage (ortak UI)
      ├─ API client (veri hazırlama ve temizleme)
      └─ environment (ortam, rol, mutasyon politikası)
```

Alt katmanlar test senaryolarını bilmez. Spec dosyaları doğrudan CSS seçicisi,
şifre, ortam URL'si veya oturum dosyası kullanmamalıdır.

## Klasör sorumlulukları

```text
config/
  environment.js       Ortam doğrulama, roller ve production koruması
tests/
  api/                  API erişimi ve feature API client'ları
  contracts/            Navigasyon ve görünür ürün sözleşmeleri
  data/                 Benzersiz test verisi fabrikaları
  fixtures/             Bütün testlerin ortak giriş noktası
  pages/                Ekran davranışları ve seçiciler
  *.spec.js             Kullanıcının gördüğü iş davranışları
```

Yeni testlerde `@playwright/test` yerine aşağıdaki import kullanılmalıdır:

```js
import { test, expect } from './fixtures/test.js';
```

Bu kurallar `npm run quality:architecture` ile otomatik denetlenir. CI testleri
tarayıcı kurmadan önce bu kapıdan geçer.

Alt klasördeki spec dosyası fixture'a göreli yolu uygun şekilde ayarlar.

## Değişikliklerin izole edilmesi

| Üründeki değişiklik | Güncellenecek yer |
|---|---|
| Buton adı veya test id | İlgili Page Object |
| Header/sidebar yapısı | `AppShell.js` |
| Ana navigasyon | `contracts/navigation.js` |
| Ortam URL'si | CI variable veya `.env` |
| Hesap/rol | CI secret veya `.env` |
| API endpoint'i | İlgili feature API client |
| İş kuralı | İlgili spec |

Page Object'lar assertion deposu değildir. Sayfanın hazır olduğunu doğrulayan
teknik kontroller Page Object'ta; iş sonucunu doğrulayan assertion spec'te kalır.

## Test sınıfları

Kanonik etiket kaydı ve **zorunlu test stilleri** artık `AGENTS.md`'dedir (risk/yapı etiketleri +
`@i18n @a11y @layout @visual @errorpath @clean @perf @keyboard @deeplink @data @export`). El kitabı:
`docs/TEST_STYLES.md`. Kısaca:

- `@smoke`: Uygulamanın temel olarak kullanılabildiğini gösteren 2–5 dakikalık set.
- `@critical`: Müşteri, gelir veya operasyon açısından kritik davranışlar.
- `@regression`: Normal regresyon kapsamı; interaktif kontrol 3-katman testleri.
- `@mutation`: Veri oluşturan, değiştiren veya silen test.
- Stil etiketleri: her test edilen sayfada arketipe göre zorunlu; `tests/contracts/tested-pages.js`'e
  tescil + `tools/style-coverage.mjs` sert kapısı (`docs/TEST_STYLE_MATRIX.md`). Karar: `docs/adr/0002`.

Örnek:

```js
test('ticket oluşturuluyor @critical @mutation', async ({
  app,
  api,
  mutationGuard,
  testEntity,
}) => {
  await mutationGuard('ticket oluşturma testi');
  await testEntity.create({
    label: 'ticket rollback',
    cleanup: () => api.delete('/api/example/by-key/e2e-ticket-key'),
    action: () => api.post('/api/example', { name: 'e2e-ticket-key' }),
  });
  // Davranışı UI ile doğrula.
});
```

Production ortamında mutation teknik olarak reddedilir; kaçış bayrağı yoktur.
`mutationGuard`, yazmadan önce staging app/API origin'lerini ve gerçek tarayıcı
`/api/v1/auth/me` yanıtındaki `tenantId`, `tenant.id`, `tenant.slug` değerlerini
yapılandırılmış ayrılmış test tenant'ıyla eşleştirir. Token okunmaz veya
loglanmaz. Guard asenkron olduğu için mutlaka `await` edilir.

## Test verisi yaşam döngüsü

Her test:

1. Benzersiz verisini `tests/data` fabrikasından üretir.
2. Ön koşulu mümkünse API üzerinden oluşturur.
3. Yalnızca hedeflenen davranışı UI üzerinden gerçekleştirir.
4. `try/finally` veya otomatik fixture ile oluşturduğu veriyi temizler.

Tercih edilen kullanım, rollback'i create işleminden önce kaydeden
`testEntity.create` fixture'ıdır:

```js
test('örnek @mutation', async ({ api, mutationGuard, testEntity }) => {
  await mutationGuard('örnek oluşturma');
  await testEntity.create({
    label: 'örnek rollback',
    cleanup: () => api.delete('/api/example/by-key/e2e-example-key'),
    action: () => api.post('/api/example', { name: 'e2e-example-key' }),
  });
});
```

Başka bir testin oluşturduğu kayda veya production'da bulunan ilk tablo satırına
bağımlılık zamanla kaldırılmalıdır.

## Seçici sözleşmesi

Öncelik sırası:

1. `getByRole` + erişilebilir isim
2. `getByLabel`
3. Ürün ekibiyle kararlaştırılmış `data-testid`
4. Stabil iş anahtarı

CSS sınıfları, DOM sırası ve uzun zincirler ürünün görsel refactor'larında kolayca
kırılır. Kritik etkileşimler için frontend ekibi `data-testid` değerlerini geriye
uyumlu test sözleşmesi olarak yönetmelidir.

## Roller

Varsayılan hesap mevcut `.authed.spec.js` paketini çalıştırır. Yeni rol testleri
`*.admin.spec.js`, `*.supervisor.spec.js` ve `*.agent.spec.js` biçiminde
ayrılmalıdır. Kimlik bilgileri şu secret adlarını kullanır:

- `VOMENTA_ADMIN_EMAIL` / `VOMENTA_ADMIN_PASSWORD`
- `VOMENTA_SUPERVISOR_EMAIL` / `VOMENTA_SUPERVISOR_PASSWORD`
- `VOMENTA_AGENT_EMAIL` / `VOMENTA_AGENT_PASSWORD`

Her rol ayrı storage state üretmelidir; roller aynı oturum dosyasını paylaşmaz.
İlgili e-posta ve şifre birlikte tanımlandığında Playwright yapılandırması rolün
setup ve Chromium projesini otomatik olarak ekler.

## Otomatik teşhis

Ortak fixture her testte aşağıdakileri dinler:

- Tarayıcı console hataları
- Başarısız network istekleri
- HTTP 5xx cevapları

Test başarısız olduğunda değerleri maskelenmiş `runtime-diagnostics.json` rapora
eklenir. Playwright trace, ekran görüntüsü ve video ile birlikte ilk inceleme için
gerekli kanıt tek çalıştırmada üretilir.

## Salt-okunur otomatik keşif

`npm run test:discovery`, ana navigasyon ve sayfa içi aynı-origin linklerden
başlayarak rotaları BFS ile ön-tarar. Ayrı `chromium-discovery` projesinde çalışır;
normal smoke/critical/regression lane'lerine dahil değildir.

Crawler hiçbir UI kontrolüne tıklamaz ve GET/HEAD/OPTIONS dışındaki istekleri
sunucuya ulaşmadan keser. Her sayfada hata/ağ zamanı, axe, taşma, frame/shadow-root,
maskelenmiş kontrol envanteri ve yapısal ARIA imzası toplar; rotaları
`tested-pages.js` ile karşılaştırır. Raporlar `test-results/` altında JSON ve
Markdown olarak test ekine yazılır.

Commit edilen `tests/contracts/discovery-baseline.json`, ham metin/gövde yerine
normalize edilmiş ARIA yapı hash'i ve maskelenmiş fetch/XHR endpoint kümesi tutar.
Her normal koşu rota ekleme/kaybı, ARIA yapı değişimi ve endpoint envanteri diff'i
üretir. Bilinçli ürün değişikliğinde baseline
`npm run test:discovery:update-baseline` ile yenilenir ve diff kod incelemesinde
görülür.

Bu otomasyon keşif kapanışı değildir. Seçim, hover/focus, menü, dialog/drawer,
boş/loading/error/yetkisiz, dört dil ve responsive durumlar AGENTS.md'deki
`Keşif kapanış matrisi` standardıyla sayfaya özgü tamamlanır. Güvenlik ve karar
gerekçesi: `docs/adr/0003-read-only-discovery-crawler.md`.

## CI kalite kapıları

- Pull request: public Chromium smoke.
- Main/master push: authenticated critical Chromium.
- Her gece: Chromium, Firefox ve WebKit tam regresyon.
- Manuel: critical veya full paket seçimi.

Flaky test başarı sayılmaz. Retry tanı koymak ve trace toplamak içindir; tekrar
çalışınca geçen testler ayrı iş olarak takip edilip kararlılaştırılmalıdır.

## Yeni test kontrol listesi

- Test tek bir gözlemlenebilir iş davranışını mı doğruluyor?
- Test başka bir testten ve var olan tenant verisinden bağımsız mı?
- Seçiciler Page Object veya ortak component içinde mi?
- Veri değişiyorsa `@mutation`, guard ve temizlik mevcut mu?
- Production'da güvenli mi?
- Test adı hata raporunda neyin bozulduğunu anlatıyor mu?
- En az Chromium'da tekrar çalıştırıldığında kararlı mı?
