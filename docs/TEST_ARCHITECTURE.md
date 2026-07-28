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
}) => {
  mutationGuard('ticket oluşturma testi');
  // Test verisini API ile hazırla, davranışı UI ile doğrula, finally ile temizle.
});
```

Production ortamında `@mutation` testleri yapılandırma tarafından filtrelenir.
Ayrıca API yazma işlemleri ve `mutationGuard` ikinci bir güvenlik katmanı sağlar.
Mutasyon testleri staging'de ve yalnızca ayrılmış test tenant'ında çalışmalıdır.

## Test verisi yaşam döngüsü

Her test:

1. Benzersiz verisini `tests/data` fabrikasından üretir.
2. Ön koşulu mümkünse API üzerinden oluşturur.
3. Yalnızca hedeflenen davranışı UI üzerinden gerçekleştirir.
4. `try/finally` veya otomatik fixture ile oluşturduğu veriyi temizler.

Tercih edilen kullanım, test başarısız olsa bile çalışan cleanup fixture'ıdır:

```js
test('örnek @mutation', async ({ api, cleanup }) => {
  const response = await api.post('/api/example', { name: 'test' });
  const record = await response.json();
  cleanup(() => api.delete(`/api/example/${record.id}`));
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
