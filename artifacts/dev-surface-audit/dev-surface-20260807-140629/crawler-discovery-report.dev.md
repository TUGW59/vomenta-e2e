# Vomenta otomatik keşif ön-taraması

Üretim: 2026-08-07T11:50:50.097Z

> Bu çıktı “keşif tamamlandı” iddiası değildir. Bilinmeyen kontrollere tıklamaz,
> non-GET istekleri sunucuya ulaşmadan keser ve sayfaya özgü kapanış çalışmalarını listeler.

## Özet

- Ziyaret edilen rota: 60
- Test kaydı bulunmayan rota: 0
- Sert güvenlik/yükleme ihlali: 0
- Limit nedeniyle kuyrukta kalan: 6

## Önceki koşuya göre değişim radarı

- Baseline: var (2026-07-30T09:01:36.463Z)
- Yeni rota: 15
- Kaybolan rota: 1
- ARIA yapısı değişen rota: 1
- API endpoint envanteri değişen rota: 0

- ARIA: `/settings`

## Kapsanmayan sayfa radarı

_(Crawler’ın ulaştığı tüm rotalar tested-pages.js kaydında.)_

## Sert ihlaller

_(yok)_

## /

- Son rota: `/`
- tested-pages.js: Kayıtlı (main-navigation, dashboard)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| link | <redacted-name> |  |  |  |
| link | <redacted-name> |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /inbox

- Son rota: `/inbox`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /voice

- Son rota: `/voice`
- tested-pages.js: Kayıtlı (main-navigation, voice-hub)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels

- Son rota: `/channels`
- tested-pages.js: Kayıtlı (main-navigation, channels-hub)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /ai

- Son rota: `/ai`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /campaigns

- Son rota: `/campaigns`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /bot-builder

- Son rota: `/bot-builder`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /contacts

- Son rota: `/contacts`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /tickets

- Son rota: `/tickets`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /analytics

- Son rota: `/analytics`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports

- Son rota: `/reports`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /supervisor

- Son rota: `/supervisor`
- tested-pages.js: Kayıtlı (main-navigation)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /workforce

- Son rota: `/workforce`
- tested-pages.js: Kayıtlı (main-navigation, workforce)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings

- Son rota: `/settings`
- tested-pages.js: Kayıtlı (main-navigation, settings-hub)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 1

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| tablist | <redacted-name> |  |  |  |
| tab | <redacted-name> |  |  | true |
| tab | <redacted-name> |  |  | false |
| tab | <redacted-name> |  |  | false |
| tab | <redacted-name> |  |  | false |
| tab | <redacted-name> |  |  | false |
| tab | <redacted-name> |  |  | false |
| tabpanel | <redacted-name> |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/dashboards

- Son rota: `/reports/dashboards`
- tested-pages.js: Kayıtlı (reports-dashboards)
- Hata olayı: 4
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/call

- Son rota: `/reports/call`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/agent

- Son rota: `/reports/agent`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/queue

- Son rota: `/reports/queue`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/campaign

- Son rota: `/reports/campaign`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/channel

- Son rota: `/reports/channel`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/ai

- Son rota: `/reports/ai`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/quality

- Son rota: `/reports/quality`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/csat

- Son rota: `/reports/csat`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/billing

- Son rota: `/reports/billing`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /reports/sla

- Son rota: `/reports/sla`
- tested-pages.js: Kayıtlı (reports-sections)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/profile

- Son rota: `/settings/profile`
- tested-pages.js: Kayıtlı (settings-profile)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/organization

- Son rota: `/settings/organization`
- tested-pages.js: Kayıtlı (settings-organization)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/users

- Son rota: `/settings/users`
- tested-pages.js: Kayıtlı (settings-users)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/roles

- Son rota: `/settings/roles`
- tested-pages.js: Kayıtlı (settings-roles)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/compliance

- Son rota: `/settings/compliance`
- tested-pages.js: Kayıtlı (settings-compliance)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 6 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/teams

- Son rota: `/settings/teams`
- tested-pages.js: Kayıtlı (settings-teams)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/hours

- Son rota: `/settings/hours`
- tested-pages.js: Kayıtlı (settings-hours)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/automations

- Son rota: `/settings/automations`
- tested-pages.js: Kayıtlı (settings-automations)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| tablist | <redacted-name> |  |  |  |
| tab | <redacted-name> |  |  | true |
| tab | <redacted-name> |  |  | false |
| tabpanel | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/sla

- Son rota: `/settings/sla`
- tested-pages.js: Kayıtlı (settings-sla)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/templates

- Son rota: `/settings/templates`
- tested-pages.js: Kayıtlı (settings-templates)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| tablist | <redacted-name> |  |  |  |
| tab | <redacted-name> |  |  | true |
| tab | <redacted-name> |  |  | false |
| tabpanel | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| tablist | <redacted-name> |  |  |  |
| tab | <redacted-name> |  |  | true |
| tab | <redacted-name> |  |  | false |
| tab | <redacted-name> |  |  | false |
| tab | <redacted-name> |  |  | false |
| tabpanel | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/disposition-codes

- Son rota: `/settings/disposition-codes`
- tested-pages.js: Kayıtlı (settings-disposition-codes)
- Hata olayı: 2
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/canned-responses

- Son rota: `/settings/canned-responses`
- tested-pages.js: Kayıtlı (settings-canned-responses)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/integrations

- Son rota: `/settings/integrations`
- tested-pages.js: Kayıtlı (settings-integrations)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| none | <unnamed> |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 5 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/security

- Son rota: `/settings/security`
- tested-pages.js: Kayıtlı (settings-security)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 1
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| link | <redacted-name> |  |  |  |
| input | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| none | <unnamed> |  |  |  |
| switch | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| switch | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| switch | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| switch | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| switch | <unnamed> |  |  |  |
| input | <unnamed> |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | 5 checkbox gözlendi; genel production crawler seçim yapmaz, sayfaya özgü güvenli keşif gerekir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 5 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/data-retention

- Son rota: `/settings/data-retention`
- tested-pages.js: Kayıtlı (settings-data-retention)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/notifications

- Son rota: `/settings/notifications`
- tested-pages.js: Kayıtlı (settings-notifications)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/api-keys

- Son rota: `/settings/api-keys`
- tested-pages.js: Kayıtlı (settings-api-keys)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/webhooks

- Son rota: `/settings/webhooks`
- tested-pages.js: Kayıtlı (settings-webhooks)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /settings/audit

- Son rota: `/settings/audit`
- tested-pages.js: Kayıtlı (settings-audit)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| link | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| input | <redacted-name> |  |  |  |
| combobox | <unnamed> | false |  |  |
| combobox | <unnamed> |  |  |  |
| combobox | <redacted-name> | false |  |  |
| input | <redacted-name> |  |  |  |
| input | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 6 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /workforce/schedules

- Son rota: `/workforce/schedules`
- tested-pages.js: Kayıtlı (workforce-schedules)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /workforce/time-off

- Son rota: `/workforce/time-off`
- tested-pages.js: Kayıtlı (workforce-time-off)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /workforce/surveys

- Son rota: `/workforce/surveys`
- tested-pages.js: Kayıtlı (workforce-surveys)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /workforce/badges

- Son rota: `/workforce/badges`
- tested-pages.js: Kayıtlı (workforce-badges)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /workforce/evaluations

- Son rota: `/workforce/evaluations`
- tested-pages.js: Kayıtlı (workforce-evaluations)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels/webchat

- Son rota: `/channels/webchat`
- tested-pages.js: Kayıtlı (channels-webchat)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels/email

- Son rota: `/channels/email`
- tested-pages.js: Kayıtlı (channels-email)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels/sms

- Son rota: `/channels/sms`
- tested-pages.js: Kayıtlı (channels-sms)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels/whatsapp

- Son rota: `/channels/whatsapp`
- tested-pages.js: Kayıtlı (channels-whatsapp)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels/social

- Son rota: `/channels/social`
- tested-pages.js: Kayıtlı (channels-social)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /channels/video

- Son rota: `/channels/video`
- tested-pages.js: Kayıtlı (channels-video)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /voice/queues

- Son rota: `/voice/queues`
- tested-pages.js: Kayıtlı (voice-queues)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /voice/history

- Son rota: `/voice/history`
- tested-pages.js: Kayıtlı (voice-history)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /voice/voicemail

- Son rota: `/voice/voicemail`
- tested-pages.js: Kayıtlı (voice-voicemail)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /voice/recordings

- Son rota: `/voice/recordings`
- tested-pages.js: Kayıtlı (voice-recordings)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

## /voice/dids

- Son rota: `/voice/dids`
- tested-pages.js: Kayıtlı (voice-dids)
- Hata olayı: 0
- Yavaş istek: 0
- Yatay taşma: yok
- Ciddi/kritik a11y bulgusu: 0
- iframe: 0; shadow root: 0

### Görünür kontrol envanteri (maskelenmiş role + name)

| Role | Name | expanded | pressed | selected |
|---|---|---|---|---|
| link | <redacted-name> |  |  |  |
| img | <redacted-name> |  |  |  |
| link | Dashboard |  |  |  |
| none | <unnamed> |  |  |  |
| link | Settings |  |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| none | <unnamed> |  |  |  |
| button | <redacted-name> | false |  |  |
| button | <redacted-name> |  |  |  |
| button | <redacted-name> |  |  |  |
| region | <redacted-name> |  |  |  |

### Keşif kapanışına hazırlık matrisi

| Durum | Ön-tarama sonucu | Gerekçe |
|---|---|---|
| Varsayılan / veri-dolu veya görünür boş-durum | Kapsandı | Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı. |
| Seçim sonrası kontroller / toplu eylem | N/A | Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir. |
| Hover / focus ile beliren kontroller | N/A | Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir. |
| Kebab / context menüsü ve alt eylemler | N/A | 4 disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı. |
| Dialog / drawer / expanded / detail | N/A | Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz. |
| Boş / loading / hata / yetkisiz | N/A | Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez. |
| Masaüstü / tablet / mobil ve dört dil + RTL | N/A | Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur. |

