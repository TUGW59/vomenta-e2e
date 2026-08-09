# ADR-0035 — Kanallar hub kalıcı skeleton / false-green guard (F-015)

- **Durum:** Kabul edildi — 2026-08-09
- **İlgili:** ADR-0032 (dev yüzey keşfi; F-015 / P0-3), ADR-0034 (BasePage route-drift guard),
  `tests/pages/ChannelsHubPage.js`, `tests/channels-hub.authed.spec.js`,
  `tests/contracts/known-bugs.js` (B5).

> **Kanıt notu:** Bu ADR bir karar kaydıdır; kod/test ile birlikte merge edilir. Değişiklik
> canlı prod'a hiçbir kalıcı yazma yapmaz; yalnız read-only navigasyon + in-browser gözlemle
> kanıtlanır (salt-okunur ürün ethos'u).

---

## 1. Bağlam ve problem (F-015)

Dev keşfinde (app.dev.vomenta.com, girişli in-browser gözlem, ADR-0032) `/channels` hub'ının 6+
saniye sonra bile **loading skeleton**'da kaldığı, kanal kartlarının HİÇ render olmadığı gözlendi
(bireysel `/channels/*` alt sayfaları çalışıyordu). Klasik **false-green adayı**: heading/shell
yüklendiği için crawler/spec "sağlıklı" der, ama asıl içerik (kanal kartları) hiç gelmez.

`ChannelsHubPage.open()` yalnız `super.open()` + `heading` görünürlüğünü doğruluyordu; ayrıca
`open()`'ı kullanan @a11y/@clean/@i18n/@data/@regression testleri **skeleton'ın çözüldüğünü ve
kartların render olduğunu ASSERT ETMİYORDU** → hub kalıcı skeleton'da takılıyken bu testler yeşil
kalabilirdi.

## 2. PROD yer-gerçeği (önce doğrula: PROD vs DEV)

F-015 DEV'de tespit edildi; CI/spec'ler PROD'da (app.vomenta.com) koşar. Bu yüzden fix'ten önce
PROD davranışı Playwright ile sert `page.goto` + yeterli beklemeyle ölçüldü (girişli, 9 Ağu 2026):

- Heading "Channels" ~5.6 sn'de görünür. O anda `<main>` içinde **42 adet `.animate-pulse`
  skeleton düğümü**, 0 Configure bağlantısı; yalnız statik "Voice" başlığı mevcut.
- ~+3 sn içinde (toplam ~8.6 sn) skeleton **tamamen çözülür**: `animate-pulse` = 0, **7 Configure
  bağlantısı**, 7 kart başlığı, tüm href'ler doğru. +7 sn'de stabil.
- Konsol/network'te asılı/failed veri isteği yok.

**Sonuç:** PROD sağlıklı — skeleton görünür ama ~3 sn içinde çözülüp kartlar render olur. F-015
**dev'e özgü** bir regresyondur; PROD'da GERÇEK bir bug DEĞİLDİR.

## 3. Karar

PROD sağlıklı olduğundan (ADR-0032 P0-3'teki iki koldan ilki), spec **sıkılaştırılır**; known-bug
`test.fail`/`knownBugGuard` kaydı AÇILMAZ (prod'da gerçek bir bug yok — dürüstlük ilkesi). Sıkılaşan
assert PROD'da yeşil kalır ve dev regresyonu ileride prod'a gelirse GÜRÜLTÜLÜ yakalar.

- `ChannelsHubPage`'e stabil, satır-kapsamlı locator'lar eklendi:
  - `loadingSkeleton = main .animate-pulse` — skeleton placeholder'ları (yüklenince 0'a düşer;
    `<main>`'e kapsandı ki shell'deki alakasız pulse yanlış-pozitif üretmesin).
  - `emailCardLink = a[href="/channels/email"]` — "≥1 gerçek kanal kartı render oldu" sinyali
    (href tabanlı, kırılgan `.first()`/geniş CSS değil). Bilinçli Email: skeleton çözülene kadar
    render olmaz ('Voice' başlığı statik link olarak erken geldiği için "yüklendi" sinyali değil).
- Yeni `ChannelsHubPage.assertLoaded()`: skeleton KAYBOLDU (`toHaveCount(0)`) **ve** ≥1 gerçek
  kart görünür. `open()` bunu heading'den sonra çağırır → `open()`'ı kullanan tüm sağlıklı-yol
  testleri artık gerçekten yüklenmiş içeriği garanti eder.
- `channels-hub.authed.spec.js`'e açık, adlandırılmış guard testi eklendi (@smoke @data):
  "yükleme tamamlanır: skeleton KAYBOLUR + gerçek kanal kartları render olur" — skeleton 0 +
  7 Configure bağlantısı + Email kartı görünür.

**Not — @errorpath/@deeplink dokunulmadı:** bunlar `open()` yerine doğrudan `page.goto` kullanır.
Özellikle @errorpath kanal config uçlarını 500'e mock'lar; orada kartlar bilinçli olarak render
OLMAYABİLİR, yalnız shell+heading sağlamlığı beklenir. Skeleton-çözülme assert'i yalnız sağlıklı
yola (open()) uygulanır.

**B5 ile ilişki:** B5 (Voice kartının yanlış "Not configured" durumu) `/channels` üzerinde ayrı bir
bulgudur (durum etiketi doğruluğu; skeleton/yükleme değil). F-015 ile çakışmaz; B5 `fixme` olarak
korunur.

## 4. Sonuçlar

- **Olumlu:** `/channels` hub'ında false-green kapatıldı; skeleton-çözülme artık POM (`open()`) +
  açık spec düzeyinde kanıtlanıyor. PROD yer-gerçeği kanıtla belgelendi (dev bulgusu körü körüne
  devralınmadı). PROD CI sessizce kırılmadı.
- **Sınır:** dev'de kalıcı skeleton'un kök nedeni (dev-only veri/config akışı) bu iş kapsamında
  çözülmedi; guard yalnız regresyonun prod'a sızmasını yakalar. Ürün tarafı düzeltme dev ekibinde.
- **Doğrulama:** tüm `channels-hub.authed` spec'i PROD'da koştu (15 passed; @errorpath bir
  transient gateway blip'inde flaky olup retry'da geçti — bu değişiklikten bağımsız).
  `npm run quality:check` exit 0; `report:sync` türetilen docs güncellendi.
