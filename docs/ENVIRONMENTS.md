# Ortamlar (production / dev / staging)

Bu depo **tek repodur** ve testler **aynı kod** ile birden çok ortama karşı koşar.
Ortamlar arasındaki tek fark hedef **URL** ve **giriş bilgisidir** — bunlar koda
değil, konfigürasyona aittir. Bu yüzden her ortam için ayrı repo/branch **açılmaz**;
ortam çalışma-zamanında seçilir.

> Neden ayrı repo değil? Ayrı repo, her test düzeltmesini iki yere uygulamayı
> gerektirir ve kaçınılmaz drift üretir. Testler aynıdır; yalnız hedef değişir.

## Ortam modeli

Üç katman birlikte çalışır:

1. **Kayıt (registry) — `config/environments.js`**: Ortam gerçeğinin tek doğruluk
   kaynağı. Her ortam bir satır: `name`, `baseURL`, `hostname`, `apiHostname`,
   `vpnOnly`, `mutable`. **Yeni ortam eklemek = buraya bir satır.**
2. **Çözümleyici — `config/environment.js`**: Kaydı okuyup çalışma-zamanı
   `environment` nesnesini üretir (baseURL, isProduction, mutable, timeouts…).
   `playwright.config.js` yalnızca bunu tüketir; hiçbir yerde URL hardcode yoktur.
3. **Kimlikler — ortam-başına `.env` dosyaları**: `.env` (genel/production) ve
   `.env.dev` (dev). Gerçek değerler yalnızca burada; **repoya girmez** (gitignore).
   Şablonlar: `.env.example`, `.env.dev.example`.

## Ortam nasıl seçilir

Ortamı **`TEST_ENV`** belirler ve bunu genellikle hazır scriptler ayarlar:

```bash
npm run test:prod         # production'a karşı authed suite (app.vomenta.com)
npm run test:prod:smoke   # production'a karşı yalnız @smoke
npm run test:dev          # dev'e karşı authed suite (app.dev.vomenta.com) — VPN gerekir
npm run test:dev:smoke    # dev'e karşı yalnız @smoke — VPN gerekir
```

Çözümleme önceliği (`config/environment.js`):

1. **Açık override**: shell/CI veya `.env.<env>` içinde `BASE_URL` verilmişse o kullanılır.
2. **TEST_ENV kaydı**: `TEST_ENV=dev` → URL registry'den (`app.dev.vomenta.com`) gelir.
   Base `.env`'deki eski/kalıntı `BASE_URL` ortamlar arası **sızmaz**.
3. Geriye dönük: yalnız `.env`'de `BASE_URL` varsa o kullanılır.
4. Hiçbiri yoksa **production** varsayılanı.

`TEST_ENV` script/shell'den gelir (dotenv dosyasından değil). `.env.<env>` dosyası
o ortamın kimlik bilgisini taşır ve base `.env`'i **ezer** (dev hesabı ile prod
admin hesabı karışmaz).

## Dev kurulumu (ilk kez)

```bash
cp .env.dev.example .env.dev
# .env.dev içine DEV TEST hesabının bilgilerini girin:
#   VOMENTA_EMAIL, VOMENTA_PASSWORD, VOMENTA_USER_DISPLAY_NAME (dev hesabının adı)
```

Sonra **şirket VPN'ine bağlıyken**:

```bash
npm run test:dev:smoke
```

> **VPN zorunlu.** Dev yalnızca şirket VPN'i ile erişilebilir. VPN kapalıyken
> testler ağ hatası verir. Bu nedenle dev suite **CI'da (GitHub-hosted runner)
> koşmaz** — VPN'e erişimi yoktur. Dev testleri lokalde + VPN'de çalıştırılır.
> İleride VPN içinde bir self-hosted runner ile CI'a taşınabilir.

`VOMENTA_USER_DISPLAY_NAME` dev'de prod'dan **farklıdır** — `AppShell` giriş yapan
kullanıcıyı bu adla doğrular; dev hesabının başlıkta göründüğü adı yazın.

## Dev'de yazma (mutation) politikası

**Güvenli varsayılan: dev de salt-okunur.** `config/environments.js` içinde
`dev.mutable = false`'tur ve mutation kilidi (`assertMutationEnvironment`) yalnız
`name === 'staging'` ortamına izin verir; dev'de `@mutation` testleri otomatik
reddedilir. Production'da yazma zaten teknik olarak imkânsızdır.

İleride dev'de yazmayı bilinçli olarak açmak isterseniz (yalnızca gerçekten
gerekirse):

1. `config/environments.js` → `dev.mutable = true`.
2. `assertMutationEnvironment`'ı `name === 'staging'` yerine `candidate.mutable`
   kontrolüne genelleştirin (production'ı hostname ile reddetmeye devam edin).
3. `tools/self-check-mutation-safety.mjs` beklenen mesajlarını lockstep güncelleyin.
4. Dev'in kendi `MUTATION_API_ORIGIN` / `MUTATION_TENANT_ID` / `MUTATION_TENANT_SLUG`
   değerlerini `.env.dev`'e girin — üçlü tenant guard dev tenant'ını doğrular.

Bu değişiklik güvenlik sözleşmesini değiştirdiği için ayrı ve gözden geçirilmiş
bir adım olarak yapılmalıdır.

## Yeni bir ortam eklemek

`config/environments.js` kaydına bir satır ekleyin; gerekiyorsa `.env.<name>`
oluşturun ve `package.json`'a `test:<name>` scripti ekleyin. Başka hiçbir yeri
değiştirmeniz gerekmez — tüm test kodu ortamdan bağımsızdır.

## "Yenilenmiş UI" geldiğinde adaptasyon

Bu depo iki katmana ayrılır ve UI yenilenince yalnız ikincisi değişir:

- **Yeniden kullanılabilir iskele (değişmez)**: fixture'lar (mutationGuard,
  testEntity, diagnostics), tüm `quality:*` ratchet'ler, CI, ortam registry'si,
  seçici sözleşmesi (`getByRole → getByLabel → data-testid`).
- **Ürün-sözleşme katmanı (yeniden türetilir)**: Page Object'lar, metin/i18n
  değerleri, `product-surfaces.js` / `tested-pages.js` / `role-permissions.js`
  registry'leri, discovery baseline'ları.

Yenilenmiş UI dev'e geldiğinde önerilen sıra:

1. Dev'e karşı `npm run test:discovery` ile ARIA-yapı baseline'ını güncelleyin.
2. Değişen ekranların Page Object seçicilerini ve metinlerini güncelleyin
   (kırılgan seçiciler `data-testid`'e taşınmalı; ratchet'ler drift'i kırmızı yakalar).
3. Yüzey registry'lerini dev gerçeğine göre yeniden doğrulayın; fail-closed
   eşleşme sessiz kapsam kaybını engeller.

İlgili: [TEST_ARCHITECTURE.md](TEST_ARCHITECTURE.md).
