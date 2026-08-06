# Vomenta Playwright Test Platformu

[![Playwright CI](https://github.com/TUGW59/vomenta-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/TUGW59/vomenta-e2e/actions/workflows/playwright.yml)

Bu depo, Vomenta web uygulamasının kritik kullanıcı akışlarını gerçek bir
tarayıcıda uçtan uca (E2E) doğrular. Amaç yalnızca çok test yazmak değil; bir
değişikliğin oluşturduğu hatayı **en ucuz katmanda yakalayan ve sonucunu
güvenilir biçimde açıklayan** bir kalite sistemi kurmaktır.

Testler varsayılan olarak canlı ortamı (`app.vomenta.com`) hedefler ve
**salt-okunur** kalır; `BASE_URL` ile farklı bir ortama yönlendirilebilir. Veri
değiştiren (`@mutation`) senaryolar yalnızca ayrılmış bir staging tenant'ında
çalışır — production'da kaçış yolu yoktur.

## İçindekiler

- [Belgeler](#belgeler)
- [İlk kurulum](#ilk-kurulum)
- [Günlük kullanım](#günlük-kullanım)
- [Proje yapısı](#proje-yapısı)
- [Ekip standardı](#ekip-standardı)
- [Test kanıtları](#test-kanıtları)

## Belgeler

| Belge | İçerik |
|-------|--------|
| [docs/README.md](docs/README.md) | **Tüm dokümantasyonun haritası** — buradan başlayın |
| [AGENTS.md](AGENTS.md) | Depoda çalışan herkes için bağlayıcı test kuralları ve standartları |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Definition of Done, PR akışı, inceleme kontrol listesi |
| [docs/TEST_ARCHITECTURE.md](docs/TEST_ARCHITECTURE.md) | Katman sorumlulukları ve yeni test tasarım standardı |
| [docs/TEST_STYLES.md](docs/TEST_STYLES.md) | Zorunlu test stilleri el kitabı |
| [docs/MUTATION-TESTS-GUIDE.md](docs/MUTATION-TESTS-GUIDE.md) | **Veri değiştiren (`@mutation`) testler** — yazım, çalıştırma, güvenlik, CI ve sorun giderme rehberi |
| [docs/QUALITY_ROADMAP.md](docs/QUALITY_ROADMAP.md) | 90 günlük uygulama planı ve ölçülebilir kalite hedefleri |
| [docs/adr/](docs/adr/README.md) | Mimari Karar Kayıtları (ADR) dizini |

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

**Testleri çalıştırma:**

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
```

Tek bir dosya veya test:

```bash
npx playwright test tests/tickets.authed.spec.js --project=chromium-authed
npx playwright test -g "komut paleti" --project=chromium-authed
```

**Geliştirme ve hata ayıklama:**

```bash
# Testleri görsel arayüzden seçerek çalıştırma
npm run test:ui

# Adım adım hata ayıklama
npm run test:debug

# Son HTML raporunu açma
npm run test:report
```

**Kalite kapıları ve keşif:**

```bash
# Mimari kurallar + tüm testlerin yüklenmesi (CI'ın ilk kapısı)
npm run quality:check

# Salt-okunur otomatik rota ön-taraması + kapsam radarı
npm run test:discovery

# Onaylı yapısal ARIA + endpoint fingerprint baseline'ını bilinçli yenileme
npm run test:discovery:update-baseline
```

**Veri değiştiren (`@mutation`) testler — yalnızca staging:**

> Bu testler uygulama verisini gerçekten değiştirir (kayıt oluştur/güncelle/sil,
> ayar/rol değişimi, form gönderme vb.). Bu **klasik "mutation testing" (Stryker gibi
> kod mutasyonu) DEĞİLDİR.** Nasıl yazılır/çalıştırılır/güvence altına alınır: tam rehber
> [docs/MUTATION-TESTS-GUIDE.md](docs/MUTATION-TESTS-GUIDE.md); doğrulanmış envanter
> [docs/raporlar/MUTATION-INVENTORY.md](docs/raporlar/MUTATION-INVENTORY.md).

```bash
# .env: TEST_ENV=staging, production dışı BASE_URL + MUTATION_API_ORIGIN,
# MUTATION_TENANT_ID ve MUTATION_TENANT_SLUG zorunludur.
npm run test:mutation           # tümünü koştur (staging)
npm run test:mutation:list      # yalnız listele (env gerektirmez, çalıştırmaz)
npm run test:mutation:ui        # UI modunda seçerek koştur
npm run test:mutation:headed    # tarayıcı görünür
npm run test:mutation:debug     # PWDEBUG adım-adım
npm run test:mutation:report    # son HTML raporu aç

# Mutation koşularından önce/sonra ayrılmış staging tenant'ta salt-okunur
# otomasyon kalıntısı denetimi (dashboard, schedule, contact, WFM vardiya).
# Aynı staging/tenant değişkenleri zorunludur; production'da çalışmaz.
npm run report:orphans
```

## Proje yapısı

- `config/environment.js`: ortam, rol, timeout ve production güvenlik politikası.
- `tests/fixtures/test.js`: uygulama, API ve güvenlik fixture'larının tek giriş noktası.
- `tests/pages/`: ortak kabuk ve feature Page Object'ları.
- `tests/contracts/`: ürünün görünür navigasyon gibi test sözleşmeleri.
- `tests/data/`: paralel çalışmaya uygun benzersiz veri fabrikaları.
- `tests/api/`: veri hazırlama/temizleme için korumalı API erişimi.
- `tests/discovery/`: non-GET kilitli BFS ön-taraması, sensörler ve maskelenmiş raporlar.
- `tests/*.spec.js`: yalnızca kullanıcı davranışını anlatan senaryolar.
- `.github/workflows/playwright.yml`: PR smoke, main critical ve gece regresyonu.

Katman sorumlulukları ve bağımlılık yönü: [docs/TEST_ARCHITECTURE.md](docs/TEST_ARCHITECTURE.md).

## Ekip standardı

1. Her test tek bir davranışı doğrulamalı ve sonucunu kendi üretmelidir.
2. Seçicilerde önce rol, erişilebilir isim ve label kullanılmalı; CSS sınıfları
   son seçenek olmalıdır.
3. Sabit bekleme (`waitForTimeout`) kullanılmamalı; görünürlük, URL veya veri
   gibi gerçek bir koşul beklenmelidir.
4. Canlı ortam testleri varsayılan olarak salt-okunur kalmalıdır. Veri oluşturan,
   değiştiren veya silen senaryolar ayrı bir test ortamında çalıştırılmalıdır.
5. Kimlik bilgileri ve `playwright/.auth/` içeriği commit edilmemelidir.
6. Bir özellik tamamlanmış sayılmadan önce en az `npm test`; girişli veya kritik
   akışlarda ayrıca `npm run test:smoke:auth` ve `npm run test:critical`
   çalıştırılmalıdır (bkz. AGENTS.md → "Zorunlu doğrulama").
7. Yeni testler `test` ve `expect` değerlerini `tests/fixtures/test.js` üzerinden
   almalıdır.
8. Veri değiştiren testler `@mutation`, `await mutationGuard(...)` ve
   `testEntity.create` yaşam döngüsü içermelidir. Benzersiz otomasyon anahtarıyla
   başlangıç/create/bitiş baseline'ı `0→1→0` kanıtlanır; yalnızca kimliği
   doğrulanan ayrılmış staging tenant'ında çalışır. Production kaçışı yoktur.
9. `quality:architecture` yeni spec'lerde ortak fixture, sabit bekleme, doğrudan
   ortam değişkeni ve eksik ESM uzantısı gibi mimari ihlalleri CI'da engeller.

Tam "tamamlandı" tanımı ve inceleme kontrol listesi: [CONTRIBUTING.md](CONTRIBUTING.md).

## Test kanıtları

Başarısız testlerde ekran görüntüsü ve video `test-results/` altında, HTML raporu
ise `playwright-report/` altında oluşturulur. CI raporu GitHub Actions artifact'i
olarak 30 gün saklanır. Trace başarısızlıkta otomatik kaydedilir
(`trace: retain-on-failure`); kök-neden analizi Trace Viewer ile yapılır.
