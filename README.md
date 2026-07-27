# Vomenta Playwright testleri

Bu depo, Vomenta web uygulamasının kritik kullanıcı akışlarını gerçek bir
tarayıcıda otomatik olarak kontrol eder. Testler şu anda canlı ortamı hedefler;
`BASE_URL` ile farklı bir test ortamına yönlendirilebilir.

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
```

Tek bir dosya veya test de çalıştırılabilir:

```bash
npx playwright test tests/tickets.authed.spec.js --project=chromium-authed
npx playwright test -g "komut paleti" --project=chromium-authed
```

## Yapı

- `playwright.config.js`: ortam adresi, tarayıcılar, raporlar ve tekrar denemeler.
- `tests/login.spec.js`: giriş gerektirmeyen kontroller.
- `tests/auth.setup.js`: bir kez giriş yapar ve geçici oturum kaydı üretir.
- `tests/*.authed.spec.js`: kayıtlı test oturumuyla çalışan girişli senaryolar.
- `tests/helpers.js`: ortak gezinme ve giriş yardımcıları.
- `.github/workflows/playwright.yml`: her push ve pull request'te çalışan CI süreci.

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

Başarısız testlerde ekran görüntüsü ve video, `test-results/` altında; HTML raporu
ise `playwright-report/` altında oluşturulur. CI raporu GitHub Actions artifact'i
olarak 30 gün saklanır.
