# Vomenta Playwright testleri

Bu depo, Vomenta web uygulamasının kritik kullanıcı akışlarını gerçek bir
tarayıcıda otomatik olarak kontrol eder. Testler şu anda canlı ortamı hedefler;
`BASE_URL` ile farklı bir test ortamına yönlendirilebilir.

Detaylı tasarım, katman sorumlulukları ve yeni test standardı:
[docs/TEST_ARCHITECTURE.md](docs/TEST_ARCHITECTURE.md).
90 günlük uygulama planı ve ölçülebilir kalite hedefleri:
[docs/QUALITY_ROADMAP.md](docs/QUALITY_ROADMAP.md).
Depoda çalışan herkes için bağlayıcı kurallar:
[AGENTS.md](AGENTS.md) ve [CONTRIBUTING.md](CONTRIBUTING.md).

## İlk kurulum

Gereksinimler: Node.js 20 veya üzeri ve npm.

```bash
npm ci
npm run test:install
cp .env.example .env
```

Ardından `.env` içindeki `VOMENTA_EMAIL` ve `VOMENTA_PASSWORD` değerlerini
yalnızca otomasyon için ayrılmış bir test hesabıyla doldurun. `.env` ve kayıtlı
oturum dosyaları Git'e eklenmez.

## Günlük kullanım

```bash
# Hızlı başlangıç: Chromium'da giriş ekranı kontrolleri
npm test

# Chromium'da girişli smoke testleri
npm run test:smoke:auth

# Müşteri/operasyon açısından kritik testler
npm run test:critical

# Chromium'da giriş gerektiren uygulama testleri
npm run test:auth

# Chromium, Firefox ve WebKit'te tüm test paketi
npm run test:e2e

# Testleri görsel arayüzden seçerek çalıştırma
npm run test:ui

# Adım adım hata ayıklama
npm run test:debug

# Son HTML raporunu açma
npm run test:report

# Mimari kurallar + tüm testlerin yüklenmesi
npm run quality:check
```

Tek bir dosya veya test de çalıştırılabilir:

```bash
npx playwright test tests/tickets.authed.spec.js --project=chromium-authed
npx playwright test -g "komut paleti" --project=chromium-authed
```

## Mimari

- `config/environment.js`: ortam, rol, timeout ve production güvenlik politikası.
- `tests/fixtures/test.js`: uygulama, API ve güvenlik fixture'larının tek giriş noktası.
- `tests/pages/`: ortak kabuk ve feature Page Object'ları.
- `tests/contracts/`: ürünün görünür navigasyon gibi test sözleşmeleri.
- `tests/data/`: paralel çalışmaya uygun benzersiz veri fabrikaları.
- `tests/api/`: veri hazırlama/temizleme için korumalı API erişimi.
- `tests/*.spec.js`: yalnızca kullanıcı davranışını anlatan senaryolar.
- `.github/workflows/playwright.yml`: PR smoke, main critical ve gece regresyonu.

## Ekip standardı

1. Her test tek bir davranışı doğrulamalı ve sonucunu kendi üretmelidir.
2. Seçicilerde önce rol, erişilebilir isim ve label kullanılmalı; CSS sınıfları
   son seçenek olmalıdır.
3. Sabit bekleme (`waitForTimeout`) kullanılmamalı; görünürlük, URL veya veri
   gibi gerçek bir koşul beklenmelidir.
4. Canlı ortam testleri varsayılan olarak salt-okunur kalmalıdır. Veri oluşturan,
   değiştiren veya silen senaryolar ayrı bir test ortamında çalıştırılmalıdır.
5. Kimlik bilgileri ve `playwright/.auth/` içeriği commit edilmemelidir.
6. Bir özellik tamamlanmış sayılmadan önce en az `npm test`, kritik akışlarda
   ayrıca `npm run test:auth` çalıştırılmalıdır.
7. Yeni testler `test` ve `expect` değerlerini `tests/fixtures/test.js` üzerinden
   almalıdır.
8. Veri değiştiren testler `@mutation` etiketi, mutation guard ve güvenilir
   temizlik içermelidir; production ortamında çalıştırılmamalıdır.
9. `quality:architecture` yeni spec'lerde ortak fixture, sabit bekleme, doğrudan
   ortam değişkeni ve eksik ESM uzantısı gibi mimari ihlalleri CI'da engeller.

Başarısız testlerde ekran görüntüsü ve video, `test-results/` altında; HTML raporu
ise `playwright-report/` altında oluşturulur. CI raporu GitHub Actions artifact'i
olarak 30 gün saklanır.
