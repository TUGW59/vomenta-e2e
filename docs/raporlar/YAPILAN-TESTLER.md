# Vomenta — Yapılan Testler Raporu

> ⚙️ **Otomatik üretilir** (`npm run report:test-report`). Kaynak: `playwright test --list` (statik collection).
> **UYARI:** Bu rapor testlerin **listelendiğini** gösterir, **çalıştığını değil.** Hiçbir kayıt `executed`/`verified`/`high` değildir (gerçek koşum kanıtı — JUnit/trace — bu kapsamda değil). `generic` = ortak baseline; **"kapsam tamamlandı" anlamına gelmez.**

Kolonlar: `coverageStatus` (verified|partial|generic|blocked) · `evidenceLevel` (L1|L2|L3) · `executionStatus` (executed|listed-only|skipped|fixme) · `confidence` (high|medium|low) · `provenance` (değerin kaynağı).

## Özet

- **Listelenen test:** 1255 / 131 dosya
- **coverageStatus:** verified 0 · partial 1202 · generic 9 · blocked 44
- **executionStatus:** executed 0 · listed-only 1211 · skipped 0 · fixme 44
> `executed`/`verified` = 0: bu üreteç testleri çalıştırmaz; gerçek koşum WP-R2 dışıdır.

## Alan × kapsam özeti

| alan | toplam | partial | generic | blocked |
|---|---|---|---|---|
| analytics | 33 | 33 | 0 | 0 |
| auth | 11 | 11 | 0 | 0 |
| campaigns | 40 | 39 | 0 | 1 |
| channels | 95 | 89 | 0 | 6 |
| contacts | 48 | 48 | 0 | 0 |
| cross-cutting | 35 | 34 | 0 | 1 |
| dashboard | 29 | 29 | 0 | 0 |
| discovery | 1 | 1 | 0 | 0 |
| inbox | 5 | 5 | 0 | 0 |
| other | 156 | 143 | 9 | 4 |
| reports | 91 | 91 | 0 | 0 |
| settings | 348 | 331 | 0 | 17 |
| shell | 21 | 21 | 0 | 0 |
| supervisor | 88 | 78 | 0 | 10 |
| tickets | 6 | 6 | 0 | 0 |
| voice | 143 | 140 | 0 | 3 |
| workforce | 105 | 103 | 0 | 2 |

## Ayrıntı (dosya bazlı)

### `analytics.authed.spec.js` — _analytics_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| tarih aralığı butonları mevcut (Today / 7 Days / 30 Days / 90 Days / Custom) | @smoke | — | listed-only | partial | medium | list-exec |
| üst KPI döşemeleri görünüyor VE değer gösteriyor |  | — | listed-only | partial | medium | list-exec |
| "AI usage" ve "Deep analytics" bölümleri görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| 6 navigasyon kartı doğru hedeflerle görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| sayfada sessiz hata yok (console-error / failed-request / 5xx) | @smoke | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| varsayılan olarak "30 Days" aktif, diğerleri değil | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Today" tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "7 Days" tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "90 Days" tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: "7 Days" tıklanınca analytics verisi API'den çekiliyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Today" seçilince dönem etiketleri "· Today"e dönüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "7 Days" seçilince dönem etiketleri "· 7 Days"e dönüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "90 Days" seçilince dönem etiketleri "· 90 Days"e dönüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: popover Start / End + "Apply range" ile açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: "Apply range" özel aralıkla analytics verisi çekiyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Call analytics" kartı /reports/call ("Call Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Agent analytics" kartı /reports/agent ("Agent Performance") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Queue analytics" kartı /reports/queue ("Queue Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Campaign analytics" kartı /reports/campaign ("Campaign Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "AI analytics" kartı /reports/ai ("AI Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Dashboards" kartı /reports/dashboards ("Dashboards") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [desktop] yatay taşma yok | @regression | — | listed-only | partial | medium | list-exec |
| [mobile] yatay taşma yok | @regression | — | listed-only | partial | medium | list-exec |
| [ar/rtl desktop] yatay taşma yok | @regression | — | listed-only | partial | medium | list-exec |
| BULGU A [tr]: "Deep analytics" bölümü tr arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU A [fr]: "Deep analytics" bölümü fr arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU A [ar]: "Deep analytics" bölümü ar arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU B: iç terim "ClickHouse" kullanıcıya görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `login.spec.js` — _auth_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| doğru sayfa başlığı ile yükleniyor | @smoke @public | — | listed-only | partial | medium | list-exec |
| karşılama başlıkları görünüyor |  | — | listed-only | partial | medium | list-exec |
| giriş formu tüm temel alanları içeriyor | @smoke @public | — | listed-only | partial | medium | list-exec |
| SSO (Google ve Microsoft) butonları görünüyor |  | — | listed-only | partial | medium | list-exec |
| e-posta ve şifre alanlarına yazılabiliyor |  | — | listed-only | partial | medium | list-exec |
| e-posta alanı geçersiz adresi native doğrulama ile reddediyor |  | — | listed-only | partial | medium | list-exec |
| 'Forgot password?' linki şifre sıfırlama sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| 'Sign up' linki kayıt sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| erişilebilirlik: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| görsel: giriş sayfası anlık görüntüsü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `logout.authed.spec.js` — _auth_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| kullanıcı menüsünden çıkış yapılabiliyor |  | — | listed-only | partial | medium | list-exec |

### `campaigns-outbound.authed.spec.js` — _campaigns_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| dört özet kartı listeleniyor | @smoke | — | listed-only | partial | medium | list-exec |
| arama, tür filtresi ve durum sekmeleri mevcut | @smoke | — | listed-only | partial | medium | list-exec |
| tablo başlıkları doğru sırada | @smoke @critical | — | listed-only | partial | medium | list-exec |
| New Campaign düğmesi görünür ve etkin | @smoke | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: metin yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: arama filtresiyle liste ucunu çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: eşleşmeyen arama boş-durumu gösteriyor (liste gerçekten filtreleniyor) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçilen değer trigger'da güncelleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: campaignType filtresiyle liste ucunu çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Voice" seçilince listede yalnız VOICE kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "SMS" seçilince listede yalnız SMS kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Email" seçilince listede yalnız EMAIL kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "WhatsApp" seçilince listede yalnız WhatsApp kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Running sekmesi seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: status filtresiyle liste ucunu çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "All" karışık durumları gösteriyor (en az bir Completed) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Running" sekmesi diğer durumları listeden çıkarıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Paused" sekmesi diğer durumları listeden çıkarıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: tıklanınca create rotasına gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: create sayfası kanal verisini çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Create Campaign" sihirbazı görünüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: göz ikonuna basınca detay rotasına gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: seçilen kampanyanın detayını API'den çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: doğru kampanyanın detay sayfası açılıyor (ad eşleşiyor) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: çöp ikonu kalıcı-silme onay dialogu açıyor (mutation göndermeden) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: onaylayınca DELETE /campaigns/{id} gidiyor (route ile yakalanır, prod'a yazılmaz) | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK — N/A: gerçek silme kalıcı mutation, prod'a yazmadan doğrulanamaz (bkz. mutasyon spec dosyasi) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: play ikonu başlatma onay dialogu açıyor (mutation göndermeden) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: onaylayınca POST /campaigns/{id}/start gidiyor (route ile yakalanır) | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 hata yolu OK: start 400 dönünce "Failed to start" hata toast'ı gösteriliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| 6 adımlı stepper + Adım 1 alanları görünüyor; Cancel geri döndürüyor | @regression | — | listed-only | partial | medium | list-exec |
| göz ile açılan detayda sekmeler ve metrik kartları var | @regression | — | listed-only | partial | medium | list-exec |
| BULGU 1: 10+ kampanya varsa sayfalama/daha-fazla kontrolü olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU 2: satır işlem ikonlarının (göz/sil) erişilebilir ismi olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `campaigns-outbound.mutation.authed.spec.js` — _campaigns_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: sihirbaz uçtan uca kampanya OLUŞTURUYOR (create → detay → cleanup) | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-email-mutations.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: e-posta hesabı ekle → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-email.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Email Channel" + Add Account + Save Changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /channels/email/config çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| B21 · /channels/email · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| B17 · /channels/email · açılışta imza format hatası (FORMATTING_ERROR) olmamalı | @clean @known-bug | — | listed-only | partial | medium | list-exec |
| Add Account dialogu odak tuzağı + Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| config 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels/email doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `channels-hub.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Channels" başlığı + 7 kanal kartı + Configure bağlantıları ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| her kanal kartının Configure bağlantısı doğru rotaya işaret ediyor | @critical | — | listed-only | partial | medium | list-exec |
| kanal config uçları çağrılıyor (GET /channels/<kanal>/config 2xx) | @data | — | listed-only | partial | medium | list-exec |
| L1+L3: Email kartı Configure → /channels/email gerçekten yükleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kanal config uçları 500 dönse de kabuk + hub başlığı sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels doğrudan açılınca hub yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| kanal kartları ızgarası görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `channels-sms-mutations.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: gönderici kimliği ekle → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-sms.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "SMS Configuration" + Send SMS + Add Sender + Save Changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /channels/sms/config çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| B22 · /channels/sms · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| B18 · /channels/sms · açılışta MALFORMED_ARGUMENT konsol hatası olmamalı | @clean @known-bug | — | listed-only | partial | medium | list-exec |
| Add Sender dialogu odak tuzağı + Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| config 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels/sms doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `channels-social-mutations.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: platform bağla → bağlı görün → bağlantıyı kaldır | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-social.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Social Media Channels" + Connect + Save Changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /channels/social/config çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| B24 · /channels/social · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| B16 · /channels/social · açılışta eksik çeviri (MISSING_MESSAGE) konsol hatası olmamalı | @clean @known-bug | — | listed-only | partial | medium | list-exec |
| config 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels/social doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `channels-video-mutations.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: video ayarını değiştir → kaydet → eski değere döndür | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-video.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Video Call Configuration" + Save Changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /channels/video/config çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| B25 · /channels/video · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| config 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels/video doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |
| yapılandırma formu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `channels-webchat-interactions.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Configuration ↔ Integration üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `channels-webchat-mutations.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: widget ayarını değiştir → kaydet → eski değere döndür | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-webchat.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Web Chat Configuration" + sekmeler + Save Changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /channels/webchat/config çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| L1+L3: Integration sekmesine geçince aria-selected + gömme içeriği | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| B20 · /channels/webchat · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| sekmeler klavye ile gezilebilir (ArrowRight → Integration seçili) | @keyboard | — | listed-only | partial | medium | list-exec |
| config 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels/webchat doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |
| yapılandırma sekmesi görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `channels-whatsapp-mutations.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: şablon oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `channels-whatsapp.authed.spec.js` — _channels_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "WhatsApp Business" + Save Changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /channels/whatsapp/config çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| B23 · /channels/whatsapp · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| B19 · /channels/whatsapp · açılışta MALFORMED_ARGUMENT konsol hatası olmamalı | @clean @known-bug | — | listed-only | partial | medium | list-exec |
| config 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /channels/whatsapp doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `contacts-mutations.authed.spec.js` — _contacts_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kişi oluştur → ara → toplu Etiket (VIP) → toplu Sil | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `contacts.authed.spec.js` — _contacts_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık, alt başlık ve 7 kolon görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| araç çubuğu butonları ve arama mevcut | @critical | — | listed-only | partial | medium | list-exec |
| en az bir kişi listeleniyor | @smoke | — | listed-only | partial | medium | list-exec |
| [en] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: terim girince liste süzülür ve "Clear" çıkar | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: arama filters={"search":…} ile API sorgusu atıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: eşleşen kişi görünür, eşleşmeyen sorgu boş-durum gösterir | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: 5 tag chip görünür ve tıklanabilir | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: chip tıklanınca filters={"tags":[…]} sorgusu atılıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: filtre listeyi süzüyor (VIP kişisi yoksa boş-durum) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: dropdown açılıyor (All Companies + en az bir şirket) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: bir şirket seçilince liste yeniden çekiliyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: seçilen şirket dropdown tetikleyicisinde yansıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: sort chip görünür ve tıklanabilir | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sort chip yeni sort=[…] ile sorgu atıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: satır sırası değişiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: ızgara butonu tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: ızgara görünümü tabloyu değiştiriyor, listeye dönünce tablo geri geliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: New Contact formunu açıyor (9 alan + Kaydet/İptal) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ) | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: /contacts/import sayfasını (dosya girişli) açıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Export tıklanınca indirme başlıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Export POST /contacts/export ucunu tetikliyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: indirilen CSV içeriği doğru (başlık + kodlama), bozulma yok | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: farklı dilde indirme dili değiştirmez / bozulmaz (en == ar başlık) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: /contacts/segments sayfasını açıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: satıra tıklayınca /contacts/{id} detayına gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: detay kişi + timeline uçlarından veri çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: detay sayfası kişi adını ve sekmeleri gösteriyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 OK: tek sayfada prev/next pasif ve sayaç "of N" gösteriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: bir satır seçilince "1 selected" + 5 toplu buton çıkıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "tümünü seç" tüm satırları seçiyor (sayaç = toplam) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Assign Owner" diyaloğu açılıyor (Confirm/Cancel) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Add Tag" diyaloğu açılıyor (Confirm/Cancel) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Add to Campaign" diyaloğu açılıyor (Confirm/Cancel) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçili export indirme başlatıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: toplu export POST /contacts/export tetikliyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Sil onay alertdialog'u açıyor; İptal listeyi değiştirmiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| BULGU F1: satır ara butonu erişilebilir ismi ham anahtar "callContact" olmamalı | @regression | — | listed-only | partial | medium | list-exec |
| BULGU F2: kişi detayı sil butonu ham anahtar "contacts.delete" göstermemeli | @regression | — | listed-only | partial | medium | list-exec |

### `a11y.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Dashboard: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Contacts: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Tickets: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Settings: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Reports: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Analytics: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Workforce: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Supervisor Agents: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Voice: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Reports · Call: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Reports · Dashboards: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |

### `known-bugs-invite.mutation.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| yeni davet listede e-posta + "Beklemede" ile ayırt edilebilir görünmeli | @regression @known-bug @mutation | — | fixme | blocked | low | list-exec |

### `known-bugs.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| B1 · /voice/regulatory · ham i18n anahtarları görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B2 · /campaigns · ilerleme yüzdesi 100ü aşmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B3 · /inbox · ham i18n anahtarı inbox.noMessagesYet görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B4 · /settings · "Manage Modules" kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B5 · /channels · Ses kartı yanlışlıkla "Yapılandırılmadı" göstermemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B6 · /settings · davet satırları ayırt edilebilir olmalı (placeholder "Invited User" değil) | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B7 · /settings · Modüller açıklaması iki kez render edilmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B8 · Softphone · müsaitlik açılır menüsü GÖRSEL olarak açılmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B9 · /channels/email · varsayılan imza ham i18n anahtarı göstermemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B10 · /voice/regulatory · Voice sekme çubuğu görünmeli (bölüm düzeni) | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B11 · /voice/voicemail · İşlemler butonlarının erişilebilir ismi olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B12 · /analytics · TR arayüzde İngilizce/iç metin sızmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B13 · /ai · sekme etiketinde boşluk eksik olmamalı ("Yapay ZekaTemsilciler") | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| AI-PROMPTS-CONSOLE · /ai/prompts · konsolda MALFORMED_ARGUMENT (ICU) hatası olmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| SETTINGS-BILLING-REDIRECT · /settings/billing deep-link kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| SETTINGS-BILLING-CHANGEPLAN · Ayarlar "Change plan" kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| SETTINGS-BILLING-HISTORY · Ayarlar "Billing history" kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `mutation-orphans.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| dashboard otomasyon kayıtları sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |
| schedule otomasyon kayıtları sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |
| contact otomasyon kayıtları sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |
| workforce vardiya baseline’ı sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |

### `dashboard-actions.authed.spec.js` — _dashboard_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L1+L3: "Send SMS" /channels/sms ("SMS Configuration") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Create Campaign" /campaigns/outbound ("Outbound Campaigns") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "View Reports" /reports ("Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |

### `dashboard.authed.spec.js` — _dashboard_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| oturum geçerli — giriş formu görünmüyor | @smoke | — | listed-only | partial | medium | list-exec |
| başlık + alt başlık + kullanıcı menüsü görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| tarih aralığı + Live toggle görünüyor (Today / 7 Days / 30 Days / Live) | @smoke | — | listed-only | partial | medium | list-exec |
| 4 üst KPI döşemesi görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| hızlı eylemler görünüyor (Start Call butonu + 3 gezinme linki) | @smoke | — | listed-only | partial | medium | list-exec |
| ana bölüm başlıkları görünüyor (Queue/Agent/Call Volume/Insights/AI/Activity) | @smoke | — | listed-only | partial | medium | list-exec |
| kenar menüsü tüm ana bölümleri doğru href ile içeriyor | @critical | — | listed-only | partial | medium | list-exec |
| sayfada sessiz hata yok (console-error / failed-request / 5xx) | @smoke @clean | — | listed-only | partial | medium | list-exec |
| üst KPI döşemeleri değer gösteriyor | @data @regression | — | listed-only | partial | medium | list-exec |
| "Analytics Insights" KPI döşemeleri değer gösteriyor | @data @regression | — | listed-only | partial | medium | list-exec |
| "/" doğrudan URL ile açılıyor ve Dashboard render oluyor | @deeplink @regression | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Start Call" softphone dialer'ını açıyor (tuş takımı görünür) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| ciddi/kritik axe ihlali yok (bilinen borç hariç) | @a11y @regression | — | listed-only | partial | medium | list-exec |
| [desktop] yatay taşma yok | @layout @regression | — | listed-only | partial | medium | list-exec |
| [mobile] yatay taşma yok | @layout @regression | — | listed-only | partial | medium | list-exec |
| [ar/rtl desktop] yatay taşma yok | @layout @regression | — | listed-only | partial | medium | list-exec |
| içerik (başlık) makul bütçe içinde görünüyor | @perf @regression | — | listed-only | partial | medium | list-exec |
| canlı veri ucu 500 dönerse sayfa yine de yükleniyor (çökmüyor) | @errorpath @regression | — | listed-only | partial | medium | list-exec |
| BULGU DASH-CLICKHOUSE: iç terim "ClickHouse" Dashboard'da görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU DASH-AI-I18N [tr]: AI metrik etiketleri tr arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU DASH-AI-I18N [fr]: AI metrik etiketleri fr arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU DASH-AI-I18N [ar]: AI metrik etiketleri ar arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `discovery/discovery.spec.js` — _discovery_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| salt-okunur uygulama keşfi rapor ve kapsam radarı üretir |  | — | listed-only | partial | medium | list-exec |

### `inbox.authed.spec.js` — _inbox_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Inbox ve Soft Phone panelleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| konuşma arama kutusu görünüyor ve yazılabiliyor |  | — | listed-only | partial | medium | list-exec |
| eşleşmeyen aramada boş-durum mesajı gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| kanal / atama filtre çipleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| sağ panel sekmeleri görünüyor ve tıklanınca seçili oluyor |  | — | listed-only | partial | medium | list-exec |

### `ai-subroutes.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| [voice] /ai/voice açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [chatbot] /ai/chatbot açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [copilot] /ai/copilot açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [sentiment] /ai/sentiment açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [knowledge-base] /ai/knowledge-base açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [prompts] /ai/prompts açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [usage] /ai/usage açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [providers] /ai/providers açılıyor: başlık + bölüm görünür | @regression @smoke | — | listed-only | partial | medium | list-exec |
| [voice] /ai/voice yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| [chatbot] /ai/chatbot yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| [copilot] /ai/copilot yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| [sentiment] /ai/sentiment yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| [knowledge-base] /ai/knowledge-base yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| [usage] /ai/usage yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| [providers] /ai/providers yüklemede sessiz hata yok () | @regression @clean) | — | listed-only | partial | medium | list-exec |
| KPI tile'ları bir DEĞER gösteriyor + kullanım tabloları görünüyor | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Documents" sekmesi seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "30D" aralığı seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Voice" filtresi Chat senaryosunu gizliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |

### `ai.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| dört sekme görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| Agents sekmesi: istatistik döşemeleri + bot listesi (Configure) görünüyor |  | — | listed-only | partial | medium | list-exec |
| AI Copilot sekmesi: ayar kartı çapaları görünüyor |  | — | listed-only | partial | medium | list-exec |
| Supervisor sekmesi: oto-değerlendirme + skor kriterleri çapaları görünüyor |  | — | listed-only | partial | medium | list-exec |
| Providers sekmesi: sağlayıcı yapılandırma çapaları + Manage Providers görünüyor |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: her sekme kendi panelini gösteriyor (içerik takası) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 navigasyon OK: "Configure" botu /bot-builder editörüne götürüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 navigasyon OK: "Manage Providers" /ai/providers (Provider Settings) sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `bot-builder-editor.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| editör yükleniyor: sekmeler + bot adı + Save Draft/Publish + geri dön | @smoke @critical | — | listed-only | partial | medium | list-exec |
| editör URL'si doğrudan (tam yükleme) açılıyor | @deeplink | — | listed-only | partial | medium | list-exec |
| editör açılışında editöre özgü console/ağ hatası yok | @clean | — | listed-only | partial | medium | list-exec |
| BOT-BUILDER-EDITOR-A11Y · /bot-builder/{id} · ciddi axe ihlali (bilinen borç) — düzelene kadar guard | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| masaüstü tuval / mobil-tablet "Desktop Screen Required" kapısı; yatay taşma yok | @layout | — | listed-only | partial | medium | list-exec |
| İngilizce sekme + üst eylem etiketleri | @i18n @regression | — | listed-only | partial | medium | list-exec |
| tr: sekmeler + Kaydet/Yayınla çevrili + yön (ltr) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| fr: sekmeler + Kaydet/Yayınla çevrili + yön (ltr) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| ar: sekmeler + Kaydet/Yayınla çevrili + yön (rtl) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| BOT-BUILDER-EDITOR-GATE-I18N · /bot-builder/{id} · dar-ekran kapısı fr'de çevrilmeli | @i18n @regression @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: Analytics ↔ Editor sekme takası | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 navigasyon OK: geri dön /bot-builder listesini yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `bot-builder.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical @deeplink | — | listed-only | partial | medium | list-exec |
| "Create Bot" birincil eylemi görünür ve etkin | @smoke | — | listed-only | partial | medium | list-exec |
| listedeki botlar /api/v1/bots yanıtıyla tutarlı | @data @regression | — | listed-only | partial | medium | list-exec |
| BOT-BUILDER-TEMPLATE-I18N · /bot-builder · açılışta ham i18n anahtarı/MISSING_MESSAGE olmamalı | @clean @known-bug | — | listed-only | partial | medium | list-exec |
| ciddi/kritik axe ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatay taşma yok | @layout | — | listed-only | partial | medium | list-exec |
| İngilizce başlık/alt başlık/eylem | @i18n @regression | — | listed-only | partial | medium | list-exec |
| tr: başlık/alt başlık/eylem + yön (ltr) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| fr: başlık/alt başlık/eylem + yön (ltr) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| ar: başlık/alt başlık/eylem + yön (rtl) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| Create diyaloğu İngilizce çevrili (başlık/alanlar/eylemler) | @i18n @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Create Bot" diyaloğu açar | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| klavye: odak tuzağı + Escape ile kapanır | @regression @keyboard | — | listed-only | partial | medium | list-exec |
| BOT-BUILDER-CLOSE-I18N · /bot-builder · diyalog kapat düğmesi çevrilmeli | @regression @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| L3 navigasyon OK: bir bot kartı /bot-builder/{id} editörünü yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| /api/v1/bots 500 dönerse sayfa çökmeden başlığı/oluşturma eylemini korur | @errorpath | — | listed-only | partial | medium | list-exec |

### `quality-baseline.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| yapı ve doğrudan erişim çalışıyor | @smoke @deeplink | — | listed-only | generic | low | list-exec |
| bilinen borç dışında ciddi/kritik ihlal yok | @a11y | — | listed-only | generic | low | list-exec |
| LTR ve Arapça RTL görünüm mobil/tablet/masaüstünde taşmıyor | @layout | — | listed-only | generic | low | list-exec |
| yüklemede console, ağ veya HTTP 5xx hatası yok | @clean | — | listed-only | generic | low | list-exec |
| en dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| tr dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| fr dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| ar dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| interaktif kontrol envanteri erişilebilir isim taşıyor | @regression | — | listed-only | generic | low | list-exec |

### `registered-routes-smoke.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| [route:/] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/prompts] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/chatbot] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/copilot] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/knowledge-base] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/providers] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/sentiment] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/usage] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/ai/voice] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/analytics] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/bot-builder] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/campaigns] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/campaigns/outbound] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/campaigns/create] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels/email] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels/sms] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels/social] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels/video] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels/webchat] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/channels/whatsapp] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/contacts] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/contacts/import] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/contacts/segments] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/inbox] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/agent] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/ai] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/billing] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/call] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/campaign] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/channel] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/csat] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/dashboards] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/quality] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/queue] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/reports/sla] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/api-keys] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/audit] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/automations] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/canned-responses] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/compliance] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/data-retention] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/disposition-codes] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/hours] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/integrations] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/notifications] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/organization] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/profile] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/roles] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/security] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/sla] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/teams] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/templates] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/users] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/settings/webhooks] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/supervisor] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/supervisor/agents] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/supervisor/calls] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/supervisor/coaching] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/supervisor/interactions] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/supervisor/wallboard] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/tickets] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/live] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/dids] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/history] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/ivr] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/queues] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/recordings] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/regulatory] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/sip-settings] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/sip-trunks] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/skills] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/voice/voicemail] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/workforce] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/workforce/badges] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/workforce/evaluations] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/workforce/schedules] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/workforce/surveys] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/workforce/time-off] kayıtlı rota read-only baseline | @smoke @route-baseline | — | listed-only | partial | medium | list-exec |
| [route:/bot-builder/:id] kayıtlı rota blocked (READONLY_FIXTURE_ID_REQUIRED) | @route-blocked | — | fixme | blocked | low | list-exec |
| [route:/contacts/:id] kayıtlı rota blocked (READONLY_FIXTURE_ID_REQUIRED) | @route-blocked | — | fixme | blocked | low | list-exec |
| [route:/settings/billing] kayıtlı rota blocked (READONLY_403_FORBIDDEN) | @route-blocked | — | fixme | blocked | low | list-exec |
| [route:/settings/billing/marketplace] kayıtlı rota blocked (READONLY_403_FORBIDDEN) | @route-blocked | — | fixme | blocked | low | list-exec |

### `reports-actions.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "New Dashboard" pano sayfasına ("Dashboards") götürüyor |  | — | listed-only | partial | medium | list-exec |
| "Custom Report" pano/rapor sayfasına ("Dashboards") götürüyor |  | — | listed-only | partial | medium | list-exec |
| "Schedule a Report" formu açılıyor ve iptal edilebiliyor |  | — | listed-only | partial | medium | list-exec |

### `reports-dashboards-interactions.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| All Dashboards / Default / Custom Dashboards sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `reports-dashboards-mutations.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Create Dashboard: pano oluşunca özel listeye ekleniyor (L2 POST 201 + L3 kart) | @regression @mutation | L2 | listed-only | partial | medium | list-exec+title-inferred |
| Duplicate: çoğaltma bir "(Copy)" ekliyor (L3) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |
| Delete: silme kartı listeden kaldırıyor (L2 DELETE 204 + L3) | @regression @mutation | L2 | listed-only | partial | medium | list-exec+title-inferred |

### `reports-dashboards.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| üç sekme görünüyor (Tümü / Varsayılan / Özel) | @smoke | — | listed-only | partial | medium | list-exec |
| bölüm başlıkları görünüyor (Varsayılan / Özel Panolar) | @smoke | — | listed-only | partial | medium | list-exec |
| "Create Dashboard" eylem düğmesi görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| en az bir özel pano kartı listeleniyor | @critical | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: sekmeye tıklayınca seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: sekme kart listesini gerçekten filtreliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: paylaş diyaloğu açılıyor ve bağlantıyı gösteriyor | @regression @critical | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [en] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [tr] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [fr] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [ar] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: kopyalayınca "Link copied" bildirimi çıkıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: panoya (clipboard) paylaşım URL'si yazılıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: oluştur diyaloğu açılıyor ve iptal edilebiliyor (kayıt YOK) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: Düzenle builder diyaloğunu açıyor (Add Widget) ve iptal edilebiliyor (kayıt YOK) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| sayfada ve paylaş diyaloğunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| liste ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, kart yok) | @errorpath | — | listed-only | partial | medium | list-exec |
| liste ucu boş [] dönerse özel pano listesi boş (patlamıyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| paylaş diyaloğu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| paylaşım bağlantısı doğrudan açılınca pano görünümü yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| paylaş diyaloğu görünümü değişmedi (URL maskeli) | @visual | — | listed-only | partial | medium | list-exec |

### `reports-route-sweep.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| kenar menüsündeki her /reports/* rotası baseline geçiyor | @regression @clean | — | listed-only | partial | medium | list-exec |

### `reports-schedule-mutations.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L2+L3: schedule oluşturuluyor, listeleniyor ve hemen siliniyor | @regression @mutation | L2 | listed-only | partial | medium | list-exec+title-inferred |
| güvenlik: tenantta geçici e2e schedule kalıntısı yok | @regression @mutation | — | listed-only | partial | medium | list-exec |

### `reports-sections-interactions.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| [call] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [agent] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [queue] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [campaign] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [channel] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [ai] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [quality] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [csat] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [billing] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |
| [sla] Charts ↔ Table üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `reports-sections.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| [call] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [agent] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [queue] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [campaign] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [channel] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [ai] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [quality] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [csat] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [billing] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [sla] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [en] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: sekmeler seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: Charts grafik gösteriyor, Table tabloya geçiyor | @regression @critical | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçilen preset vurgulanıyor (border-primary) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: preset yeni tarih aralığıyla veri çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: Date Range etiketi güncelleniyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| boş bölüm (campaign) düzgün içerik/boş-durum çözüyor (patlamıyor) | @regression | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok (Charts + Table) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| rapor ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, grafik yok) | @errorpath | — | listed-only | partial | medium | list-exec |
| sekmeler klavyeyle gezilebiliyor (Charts→Table, ok tuşu) | @keyboard | — | listed-only | partial | medium | list-exec |
| bölüm rotası doğrudan açılınca yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| grafikler bütçe içinde render oluyor | @perf | — | listed-only | partial | medium | list-exec |
| UI "Total Calls" KPI, API data.summary.totalCalls ile eşleşiyor | @data | — | listed-only | partial | medium | list-exec |
| boş-durum (campaign) görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |
| L1+L2: tıklayınca insights ucuna POST gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: menü CSV/Excel/PDF seçenekleriyle açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Schedule This Report" diyaloğu açılıyor ve iptal edilebiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "line" seçilince grafik çizgi türüne geçiyor (recharts-line) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L2: "By Week" seçilince groupBy=week ile veri çekiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Standard ve Auto-refresh switch'leri durum değiştiriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| Tablo sekmesinde başlık + veri satırları + sayfa boyutu kontrolü var | @regression | — | listed-only | partial | medium | list-exec |
| L3: "Today" preset tarih etiketi YEREL bugünü göstermeli (UTC değil) [BULGU] | @regression @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `reports.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı ve tarih aralığı seçici görünüyor |  | — | listed-only | partial | medium | list-exec |
| sekmeler tıklanınca seçili oluyor VE paneli o içeriği gösteriyor |  | — | listed-only | partial | medium | list-exec |
| rapor eylem butonları görünüyor |  | — | listed-only | partial | medium | list-exec |
| Report Types sekmesi rapor kategorilerini gösteriyor |  | — | listed-only | partial | medium | list-exec |
| sayfa intl FORMATTING_ERROR sessiz hatası üretmemeli | @known-bug | — | listed-only | partial | medium | list-exec |
| AI Insights panelinde ham i18n anahtarı sızmamalı (reports.aiInsightsDesc) | @known-bug | — | listed-only | partial | medium | list-exec |

### `settings-api-keys-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| boş-durum mesajı render ediliyor ("No API keys") | @ix-empty | — | listed-only | partial | medium | list-exec |

### `settings-api-keys-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: API anahtarı oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-api-keys.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Create Key + boş-durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Key name/Permissions + Create Key disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create Key dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| api-keys ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create Key dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/api-keys doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Create Key dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-audit-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| log tablosu kolonları + en az bir dolu satır görünüyor | @ix-table | — | listed-only | partial | medium | list-exec |

### `settings-audit.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Export + tablo ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları + en az bir log satırı görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "View" → "Change details" dialogu açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| Export tıklanınca audit-log CSV indiriliyor | @export | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| "Full Export" butonu Türkçede çevrili olmalı (şu an İngilizce) | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| View dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| audit-logs ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| View dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/audit doğrudan açılınca log yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-automations-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Rules ↔ SLA Policies sekmeleri dışlayıcı seçilir + panel değişir | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `settings-automations-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kural oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-automations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + 2 sekme + New Rule ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| Rules sekmesi boş-durum, SLA Policies sekmesi tabloyu gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| L1: sekmeler tıklanınca aria-selected=true | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: New Rule dialogu açılıyor (Rule Name + Save Rule disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| New Rule dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve New Rule dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| otomasyon ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| New Rule dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/automations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Rules boş-durumu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-canned-responses-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| boş-durum mesajı render ediliyor ("No canned responses yet") | @ix-empty | — | listed-only | partial | medium | list-exec |

### `settings-canned-responses-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: hazır yanıt oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-canned-responses.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + New canned response + tablo/boş-durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Title/Shortcode + Create disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| canned ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/canned-responses doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Create dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-compliance-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: onay kaydı oluştur → listede görün → temizle | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-compliance.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + tüm bölümler render ediliyor | @smoke | — | listed-only | partial | medium | list-exec |
| bölüm eylem butonları görünüyor (Log Consent / Create Request) | @critical | — | listed-only | partial | medium | list-exec |
| L3: "Manage Retention" → /settings/data-retention sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3: "View More" → /settings/audit sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Log Consent dialogu açılıyor (alanlar + Log Consent disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Create Request dialogu açılıyor (alanlar + Export Data disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 (kalıcı kayıt) N/A: prod salt-okunur — staging lane'ine bırakıldı | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Log Consent dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve Log Consent dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| onay listesi ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Log Consent dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/compliance doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-data-retention-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: saklama süresi değiştir → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-data-retention.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + saklama süreleri + Save changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| 5 saklama-süresi spinbutton'u değerleriyle görünüyor + Run cleanup mevcut | @critical | — | listed-only | partial | medium | list-exec |
| L1: Save changes + Run cleanup now + Automatic Cleanup switch mevcut (tıklanmıyor) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| retention ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| /settings/data-retention doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| saklama-süresi formu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-disposition-codes-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| kod tablosu kolonları + en az bir dolu satır | @ix-table | — | listed-only | partial | medium | list-exec |

### `settings-disposition-codes-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kod oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-disposition-codes.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Add Code + tablo ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları + bilinen kodlar (SALE/NO_ANSWER) görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Code/Label alanları + Create) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Add Code dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kod ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add Code dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/disposition-codes doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Add Code dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-hours-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Cumartesi Open switch toggle → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-hours.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + haftalık program + Save changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| 7 günlük Open switch'i var; Pzt-Cum açık, Cmt/Paz kapalı | @critical | — | listed-only | partial | medium | list-exec |
| Holiday Calendar bölümü + Add (boşken disabled) | @regression | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| business-hours ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Timezone combobox açılıp Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/hours doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| haftalık program görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-integrations-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: webhook oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-integrations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + entegrasyon kartları + Webhook bölümü ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| Webhook tablosu kolonları + boş-durum | @critical | — | listed-only | partial | medium | list-exec |
| L3: "Manage API Keys" → /settings/api-keys yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Request Access "Request … Integration" dialogunu açıyor (Submit tıklanmaz) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Add Webhook dialogu açılıyor (URL/Secret/Events) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| webhooks ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/integrations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Request Access dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sekme seçimi dışlayıcı + panel içeriği değişiyor | @ix-tabs | — | listed-only | partial | medium | list-exec |
| sekmeler-arası gidiş-dönüşte seçim + içerik tutarlı | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `settings-notifications-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kategori switch toggle → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-notifications.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Email Category Preferences + Save ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| kategori switch'leri + Delivery Channels bölümü görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1: Save preferences + Enable push + kategori switch'leri mevcut (tıklanmıyor) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| tercihler ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| /settings/notifications doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-organization-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Website değiştir → Save → kalıcı → eski değere geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-organization.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Organization" başlığı + Company Information formu ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| form alanları render ediliyor (Company name/Website/Domain + Save) | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: Save changes formda değişiklik olunca aktifleşiyor (dirty) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılınca kuruluş ayarları çekiliyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Currency açılınca para birimi seçenekleri listeleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kuruluş ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Currency popover Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/organization doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Company Information formu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-profile-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| 4 sekme dışlayıcı seçilir + panel içerik imzası değişir | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `settings-profile-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Telefon değiştir → Save → kalıcı → eski değere geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-profile.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Profile" başlığı + 4 alt sekme ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| User menu → Profile navigasyonu sayfayı yüklüyor | @smoke | — | listed-only | partial | medium | list-exec |
| Profile sekmesi kişisel-bilgi formunu render ediyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: her sekme tıklanınca aria-selected=true | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: her sekme paneli KENDİ içerik imzasını gösteriyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Sessions sekmesi oturum listesini çekiyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Timezone açılınca seçenekler listeleniyor (UTC dahil) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Language açılınca çok-dilli seçenekler listeleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: link /settings/notifications sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| Save/Password/2FA/Revoke kontrolleri MEVCUT ama tıklanmıyor (yan-etki) |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ve her alt sekmede ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| profil ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| oturum ucu 500 dönerse Sessions sekmesi zarifçe çöküyor (tablo yok) | @errorpath | — | listed-only | partial | medium | list-exec |
| sekmeler ok tuşlarıyla gezilebiliyor (Radix roving tabindex) | @keyboard | — | listed-only | partial | medium | list-exec |
| Language popover Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/profile doğrudan açılınca profil yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Profile sekmesi kişisel-bilgi kartı görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-roles-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| rol tablosu kolonları + satır sayısı /roles yanıtıyla eşleşiyor | @ix-table | — | listed-only | partial | medium | list-exec |

### `settings-roles-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: custom rol oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-roles.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Role Management" başlığı + rol tablosu ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları + sistem rolleri (ADMIN/AGENT/OWNER…) görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1: sistem rolünde Edit/Reset var, Delete DISABLED (silinemez) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: dialog açılıyor (Ad/Açıklama + izin kategorileri + Save) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| UI rol satırı sayısı, /roles yanıtındaki rol sayısıyla eşleşiyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create Role dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve Create Role dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| roller ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create Role dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/roles doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-security-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: password policy switch toggle → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-security.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Password Policies + Save (disabled) ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| bölümler: Session Management / IP Whitelist / API Keys görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L3: "Open Contacts" → /contacts; "Manage API Keys" → /settings/api-keys | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Add IP dialogu açılıyor (IP/CIDR + Add to Whitelist disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Add IP dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali olmamalı (şu an: label/critical spinbutton) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| security ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add IP dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/security doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Add IP dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-sla-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| politika tablosu kolonları + en az bir dolu satır | @ix-table | — | listed-only | partial | medium | list-exec |

### `settings-sla-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: SLA politikası oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-sla.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "SLA Policies" başlığı + New Policy + tablo ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo beklenen kolonları + en az bir politika satırı | @critical | — | listed-only | partial | medium | list-exec |
| /sla ucu çağrılıyor ve politika satır(lar)ı render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Policy name + Create policy disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| New Policy dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| New Policy dialogunda ciddi a11y ihlali olmamalı | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| sla ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| New Policy dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/sla doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| New Policy dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-teams-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: ekip oluştur → kartlarda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-teams.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Teams" başlığı + Create Team + ekip kartı ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| en az bir ekip kartı üye sayısıyla görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Ad/Açıklama + Create disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create Team dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve Create Team dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| ekip listesi 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create Team dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/teams doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Create Team dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-templates-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Message templates ↔ Canned Responses üst sekmeleri dışlayıcı seçilir | @ix-tabs | — | listed-only | partial | medium | list-exec |

### `settings-templates-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: şablon oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-templates.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + üst sekmeler + New Template ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| şablon tablosu kolonları + boş-durum | @critical | — | listed-only | partial | medium | list-exec |
| L1: üst sekmeler tıklanınca aria-selected=true | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: New Template dialogu açılıyor (Name + Create disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| içerik alanı placeholder'ı ham anahtar "settings.templatesPage.contentPlaceholder" GÖSTERMEMELİ | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| New Template dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| şablon ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| New Template dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/templates doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| New Template dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-users-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| üye tablosu kolonları + en az bir veri satırı gösteriyor | @ix-table | — | listed-only | partial | medium | list-exec |
| ada göre arama satırları süzüyor ve temizleyince geri getiriyor | @ix-filter | — | listed-only | partial | medium | list-exec |
| eşleşmeyen aramada boş-durum (0 satır veya "bulunamadı") | @ix-empty | — | listed-only | partial | medium | list-exec |

### `settings-users.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Users & Roles" başlığı + üye tablosu ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo beklenen kolonları gösteriyor + en az bir üye satırı | @critical | — | listed-only | partial | medium | list-exec |
| L1+L3 görev OK: ada göre arama eşleşen üyeyi süzüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Invite User dialogu açılıyor (Email/Role/Team + Send disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 (kalıcı davet) N/A: prod salt-okunur — staging mutation lane'ine bırakıldı | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| davet dialogundaki kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve davet dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kullanıcı listesi 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| davet dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/users doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| davet dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-webhooks-interactions.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| boş-durum mesajı render ediliyor ("No webhooks configured") | @ix-empty | — | listed-only | partial | medium | list-exec |

### `settings-webhooks-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: webhook oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-webhooks.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Add Webhook + boş-durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (URL + Events + Create webhook disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| webhooks ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/webhooks doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Settings" başlığıyla açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tüm sekmeler görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1+L3: her sekme tıklanınca seçili oluyor VE paneli o içeriği gösteriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Organization" paneli → /settings/organization (başlık "Organization") | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Security" paneli → /settings/security (başlık "Security") | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "API Keys" paneli → /settings/api-keys (başlık "API Keys") | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| billing/subscription 500 dönse de hub sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| sekmelerde ok tuşu odağı taşıyor ve seçimi değiştiriyor (aria-selected) | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings doğrudan açılınca hub yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `forms.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Create Ticket formu beklenen alanlarla açılıyor |  | — | listed-only | partial | medium | list-exec |
| boş gönderim "Subject is required." uyarısı veriyor ve kaydetmiyor |  | — | listed-only | partial | medium | list-exec |

### `header.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| tema değiştirici temayı gerçekten değiştiriyor (Dark ↔ Light) |  | — | listed-only | partial | medium | list-exec |
| durum (presence) menüsü seçenekleriyle açılıyor |  | — | listed-only | partial | medium | list-exec |
| kullanıcı menüsü (avatar) Profile/Settings/Log out ile açılıyor |  | — | listed-only | partial | medium | list-exec |

### `navigation.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "Inbox" linkine tıklayınca /inbox ("Inbox") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| "Tickets" linkine tıklayınca /tickets ("Tickets") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| "Analytics" linkine tıklayınca /analytics ("Analytics") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| "Settings" linkine tıklayınca /settings ("Settings") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |

### `pages.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| /inbox sayfası "Inbox" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /contacts sayfası "Contacts" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /tickets sayfası "Tickets" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /reports sayfası "Reports" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /analytics sayfası "Analytics" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| Reports sayfası tüm rapor kategorilerini gösteriyor |  | — | listed-only | partial | medium | list-exec |
| Analytics sayfası alt bölümleri gösteriyor |  | — | listed-only | partial | medium | list-exec |

### `responsive.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| mobilde masaüstü kenar menüsü gizli | @layout | — | listed-only | partial | medium | list-exec |
| mobilde hamburger (Open menu) butonu görünür | @layout | — | listed-only | partial | medium | list-exec |

### `search.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Search butonu komut paletini açıyor |  | — | listed-only | partial | medium | list-exec |
| komut paleti klavye kısayolu (⌘K / Ctrl+K) ile açılıyor |  | — | listed-only | partial | medium | list-exec |
| arama kutusuna yazılabiliyor ve Escape ile kapanıyor |  | — | listed-only | partial | medium | list-exec |

### `supervisor-agent-live.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| canlı AI çağrısı yokken boş-durum gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1/L2/L3: canlı AI çağrısı seçilince cockpit açılır (staging/canlı veri) | @regression | L1 | fixme | blocked | low | list-exec+title-inferred |

### `supervisor-agents.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| istatistik döşemeleri görünüyor (Total/Available/Offline/Calls Today/Avg AHT) |  | — | listed-only | partial | medium | list-exec |
| temsilci tablosu beklenen kolonları gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| kontroller mevcut (durum filtresi / arama / Analyze) |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: menü açılıyor ve durum seçenekleri görünüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: durum seçince agents API'sini status parametresiyle çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: seçilen duruma göre tablo filreleniyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: arama kutusuna yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: arama agents API'sini search parametresiyle çağırıyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: arama tabloyu eşleşen ajana daraltıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Force menüsü açılıyor ve zorla-durum seçenekleri görünüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: durum seçince onay diyaloğu zorunlu-sebep ile açılıyor (iptal edilir) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2/L3: "Force → Break" ajanın durumunu backend'de Break yapar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: çevrimdışı ajanı zorlama hatasının tam HTTP kodu/mesajı doğrulanır (staging) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L1 tıklama OK: transkript girilince Analyze butonu etkinleşiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Analyze transkripti detect-anomaly ucuna POST ediyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: analiz sonucu (risk) arayüzde gösteriliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Previous/Next butonları mevcut, tek sayfada Next devre dışı | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: ızgara/liste arasında geçiş tablo düzenini değiştiriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L2+L3: satıra tıklayınca panel açılıyor, status-history çekiliyor, veri tutarlı | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: aksiyon ikonları mevcut ve çevrimdışı ajanda devre dışı | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 doğruluk: sunucu yanıtındaki her ajan seçilen durumla eşleşiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| BULGU: "Last refreshed" saati yerel saat olmalı (UTC değil) | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `supervisor-coaching.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| istatistik döşemeleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| tablo kolonları + sekmeler görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| kontroller mevcut (arama / New Evaluation) + boş-durum |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Pending Review" sekmesi seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: arama kutusuna yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: diyalog form alanlarıyla açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: kriter puanları Overall Score'u yükseltiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: dolu form doğru DTO ile evaluations ucuna POST ediyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3: değerlendirme gönderimi kalıcı kayıt oluşturur (staging mutasyon) | @regression | L3 | fixme | blocked | low | list-exec+title-inferred |

### `supervisor-interactions.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| tablo beklenen kolonları gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| kontroller mevcut (kanal filtresi / arama) |  | — | listed-only | partial | medium | list-exec |
| aktif etkileşim yokken boş-durum gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: menü açılıyor ve kanal seçenekleri görünüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: kanal seçince interactions API'sini channel parametresiyle çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: arama kutusuna yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1/L2/L3: aktif etkileşim satırındaki izleme/araya-girme aksiyonları (staging/canlı veri) | @regression | L1 | fixme | blocked | low | list-exec+title-inferred |

### `supervisor-wallboard.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| kontrol çubuğu düğmeleri mevcut (Refresh All / Auto-scroll / Save layout / TV mode / tema) |  | — | listed-only | partial | medium | list-exec |
| dört kuyruk kartı listeleniyor | @critical | — | listed-only | partial | medium | list-exec |
| alt metrik kartları mevcut (ASA / Queued / Volume / SLA) |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: tıklayınca "refreshed" bildirimi çıkıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: dashboard verisini API'den çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: gösterilen son-güncelleme saati yerel saat olmalı (UTC değil) [BULGU 4] | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: tıklayınca toggle aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: içerik taşınca otomatik kaydırmalı [BULGU 3] | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: buton görünür ve etkin | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: tıklayınca tam ekrana geçiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: düzeni PUT ile config ucuna gönderiyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçenek seçince gösterilen değer değişiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Dark" seçilince koyu tema uygulanmalı [BULGU 1] | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: değer düzenlenebiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: ⋮ menüsü açılıyor ve 5 eylem görünüyor | @regression @critical | L1 | listed-only | partial | medium | list-exec+title-inferred |
| i18n: Türkçe'de menü eylemleri çevrili (Resume queue hariç) | @regression | — | listed-only | partial | medium | list-exec |
| BULGU 5: "Resume queue" Türkçe menüde çevrilmeli | @regression | — | listed-only | partial | medium | list-exec |
| L2/L3: "Pause queue" backend'e pause isteği atar ve kuyruk duraklar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Resume queue" backend'e resume isteği atar ve kuyruk devam eder (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Close queue" backend'e close isteği atar ve kuyruk kapanır (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Redirect all calls" onay sonrası yönlendirme isteği atar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Move call" hedef seçme diyaloğu açar ve taşıma isteği atar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `tickets.authed.spec.js` — _tickets_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| tablo beklenen kolonları gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor |  | — | listed-only | partial | medium | list-exec |
| en az bir ticket listeleniyor | @smoke | — | listed-only | partial | medium | list-exec |
| arama: ticket numarasına göre tek sonuca filtreliyor | @critical | — | listed-only | partial | medium | list-exec |
| sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor |  | — | listed-only | partial | medium | list-exec |
| arama: eşleşmeyen sorgu "No tickets found" boş-durumu gösteriyor |  | — | listed-only | partial | medium | list-exec |

### `voice-call.mutation.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3: softphone ile test numarası aranıyor ve çağrı kuruluyor | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3: test numarasına SMS gönderiliyor (channels.sms.send) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `voice-dids-mutations.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: DID ata → "Assigned" doğrula → atamayı geri al (Unassign) | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `voice-dids.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Phone Numbers" + "Pending Requests" ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /dids çağrılıyor + numara tablosu render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "Request Number" tıklanınca "Request Phone Number" dialogu açılıyor; klavye ile kapanıyor (gönderilmez) | @regression @keyboard | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /dids 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/dids doğrudan açılınca yükleniyor (RSC yarışı toleranslı) | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-history.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Call History" başlığı + alt-başlık + yön filtreleri ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /voice/calls çağrılıyor + geçmiş tablosu render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| VOICE-HISTORY-A11Y-LABEL · /voice/history · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "Details" tıklanınca dialog açılıyor; klavye ile kapanıyor | @regression @keyboard | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: yön filtresi combobox'u açılıp seçim yapılabiliyor; tablo sağlam | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /voice/calls 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/history doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-ivr-mutations.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: IVR oluştur → listede doğrula → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `voice-ivr.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "IVR Builder" başlığı + alt-başlık + "Create IVR" ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /ivr çağrılıyor + IVR tablosu render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "Create IVR" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez) | @regression @keyboard | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /ivr 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/ivr doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-queues-mutations.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kuyruk oluştur → listede doğrula → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `voice-queues.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Queues" başlığı + alt-başlık + "Create Queue" ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /queues çağrılıyor + en az bir kuyruk kartı render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "Create Queue" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez) | @regression @keyboard | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /queues 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/queues doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-recordings.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Call Recordings" başlığı + alt-başlık ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /voice/recordings çağrılıyor + tablo render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| VOICE-RECORDINGS-A11Y-LABEL · /voice/recordings · form alanları erişilebilir etiket taşımalı (label) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| "Download" tıklanınca kayıt stream ucu (GET .../recordings/<id>/stream) çağrılıyor | @export | — | listed-only | partial | medium | list-exec |
| L1: "Delete Recording" tıklanınca onay alertdialog'u açılıyor; klavye ile kapanıyor (ONAYLANMAZ) | @regression @keyboard | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /voice/recordings 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/recordings doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-regulatory.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| /voice/regulatory rotası oturum korunarak yükleniyor (içerik bozuk olsa da kabuk sağlam) | @smoke | — | listed-only | partial | medium | list-exec |
| VOICE-REGULATORY-BROKEN · /voice/regulatory · açılışta MISSING_MESSAGE / ham i18n olmamalı | @i18n @clean @known-bug @clean | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| B10 · /voice/regulatory · Voice alt-navigasyonu (Live Calls) sayfada görünmeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| /voice/regulatory doğrudan açılınca oturum korunuyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-sip-settings.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "SIP & phone settings" + SIP extension/Display name alanları ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "SIP extension" alanına değer girilebiliyor ve yansıyor (yalnız localStorage, sunucuya yazmaz) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| /voice/sip-settings doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-sip-trunks.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "SIP Trunks" başlığı + "Add SIP Trunk" ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /voice/sip-trunks çağrılıyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| VOICE-SIP-TRUNKS-SUBTITLE-I18N · /voice/sip-trunks · alt-başlık seçili dile çevrilmeli | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "Add SIP Trunk" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez) | @regression @keyboard | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /voice/sip-trunks 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/sip-trunks doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-skills.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Skills-Based Routing" başlığı + alt-başlık + "Select Queue" ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /queues çağrılıyor (kuyruk seçici doldurulur) | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| L1: "Select Queue" açılıp bir kuyruk seçilebiliyor; sayfa sağlam | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /queues 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/skills doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice-subnav.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "Live Calls" → /voice/live ("Live Calls") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "Queues" → /voice/queues ("Queues") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "IVR Builder" → /voice/ivr ("IVR Builder") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "Phone Numbers" → /voice/dids ("Phone Numbers") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "Call History" → /voice/history ("Call History") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "Voicemails" → /voice/voicemail ("Voicemails") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "Recordings" → /voice/recordings ("Call Recordings") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "SIP Trunks" → /voice/sip-trunks ("SIP Trunks") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "SIP settings" → /voice/sip-settings ("SIP & phone settings") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |
| "Skills" → /voice/skills ("Skills-Based Routing") panelini açıyor | @regression | — | listed-only | partial | medium | list-exec |

### `voice-voicemail.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Voicemails" başlığı + alt-başlık ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| GET /voicemails çağrılıyor + tablo render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| VOICEMAIL-PAGER-I18N · /voice/voicemail · açılışta ham i18n pager anahtarı / MISSING_MESSAGE olmamalı | @clean @known-bug | — | listed-only | partial | medium | list-exec |
| L1: "All Status" filtresi açılıp seçim yapılabiliyor; sayfa sağlam | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| GET /voicemails 500 dönse de kabuk + başlık sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| /voice/voicemail doğrudan açılınca yükleniyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `voice.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| /voice, "Live Calls" başlığı + alt-başlık + boş durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| Voice alt-navigasyonunun 10 hedefi görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| canlı istatistik ucu çağrılıyor + "Agents Available" döşemesi DEĞER gösteriyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| ciddi/kritik a11y ihlali yok (bilinen borç hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| canlı çağrı ucu 500 dönse de kabuk + başlık + boş durum sağlam | @errorpath | — | listed-only | partial | medium | list-exec |
| "Open softphone" düğmesi görünür ve etkin (gerçek çağrı tetiklenmez) | @regression | — | listed-only | partial | medium | list-exec |
| /voice doğrudan açılınca /voice/live yüklüyor | @deeplink | — | listed-only | partial | medium | list-exec |

### `workforce-badges-mutations.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Rozet oluştur kalıcı kayıt yaratıyor (silme yolu gelince aktifleşir) | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `workforce-badges.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L1: sayfa + iki sekme (Rozetler/Sıralama) + oluştur/ver butonları | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: "Rozet oluştur" formu açılıyor (Ad + Kategori + Puan) | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: "Rozet ver" formu açılıyor (Rozet + Temsilci + Neden) | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılışında rozet listesi API'den çekiliyor | @smoke @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| bir rozet satırı en az bir aksiyon (düzenle/sil) kontrolü sunmalı | @regression | — | listed-only | partial | medium | list-exec |
| [en] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| rozet listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Rozet oluştur diyaloğu Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /workforce/badges doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `workforce-evaluations-mutations.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Değerlendirme oluştur kalıcı kayıt yaratıyor (staging kanıtı gelince aktifleşir) | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `workforce-evaluations.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L1: sayfa + "Değerlendirme Oluştur" + "YZ Değerlendirmesi Başlat" | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: "Kalite Değerlendirmesi Oluştur" formu açılıyor (Interaction ID + Agent + Puan) | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılışında değerlendirme listesi API'den çekiliyor | @smoke @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| [en] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| değerlendirme listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Değerlendirme Oluştur diyaloğu Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /workforce/evaluations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `workforce-mutations.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Add Shift kalıcı vardiya oluşturuyor (POST /wfm/schedules) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: Publish Schedule taslağı yayınlıyor ("Draft" kalkıyor) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `workforce-schedules.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L1: standalone sayfa yükleniyor + hafta nav + Programı Yayınla görünür | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılışında haftalık çizelge API'den çekiliyor | @smoke @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| [en] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| boş vardiya "+" hücresi buton rolü + klavye erişimi + erişilebilir ad taşımalı | @a11y @keyboard | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| çizelge ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| /workforce/schedules doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `workforce-surveys-mutations.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Anket oluştur kalıcı kayıt yaratıyor ve silinebiliyor (0→1→0) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `workforce-surveys.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L1: sayfa yükleniyor ve "Anket oluştur" formu açılıyor (Ad + Gönder) | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılışında anket listesi API'den çekiliyor | @smoke @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| satır aksiyon ikonları erişilebilir ad taşımalı | @regression | — | listed-only | partial | medium | list-exec |
| [en] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok (bilinen ikon-adı borcu hariç) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| anket listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Anket oluştur diyaloğu Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /workforce/surveys doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `workforce-time-off.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L1: standalone sayfa + "İzin talep et" formu açılıyor | @smoke @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılışında izin listesi API'den çekiliyor | @smoke @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| [en] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] doğru yazı yönü + başlık görünür | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| izin listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| İzin talep et diyaloğu Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /workforce/time-off doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `workforce.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve 7 sekme görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| Schedules çizelgesi ve Publish butonu mevcut | @critical | — | listed-only | partial | medium | list-exec |
| [en] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @i18n @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: her sekme tıklanınca seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: veri sekmeleri ilgili API ucundan veri çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: her sekme kendi içeriğini gösteriyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Previous Week tarih aralığını değiştiriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Previous Week seçilen hafta için çizelge çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: gösterilen hafta tam olarak bir hafta geri kayıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: 7d/14d/30d düğmeleri görünür ve tıklanabilir | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: 14d seçilince adherence verisi API'den çekiliyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: çizelge hücresi "Add Shift" formunu açıyor (Start/End/Break) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ) | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: buton görünür ve etkin | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: form açılıyor (Start/End Date, Reason) ve tarih dolunca Submit etkinleşiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Submit doğru uca POST gönderiyor (prod'a YAZILMAZ) | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Create badge" formu açılıyor ("Create badge") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Award badge" formu açılıyor ("Award badge") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Create survey" formu açılıyor ("Create survey") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Create Evaluation" formu açılıyor ("Create Quality Evaluation") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| sekme açılıyor; aralık kontrolleri + veri/boş-durum görünür | @regression | — | listed-only | partial | medium | list-exec |
| adherence ucu 500 dönse de sekme çökmüyor | @regression @errorpath | — | listed-only | partial | medium | list-exec |
| sekme açılıyor; KPI kartları + saatlik tahmin tablosu görünür | @regression | — | listed-only | partial | medium | list-exec |
| KPI kartları veri kaynağını gösteriyor (boş tenant'ta 0 değerleri) | @regression | — | listed-only | partial | medium | list-exec |
| Türkçe seçiliyken Uyum paneli İngilizce fallback göstermemeli | @i18n @regression | — | listed-only | partial | medium | list-exec |
| aktif 7d/14d/30d aralığı erişilebilir seçili-durum sinyali taşımalı | @a11y @regression | — | listed-only | partial | medium | list-exec |
| sayfada ve Uyum/Tahmin sekmelerinde ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| Add Shift diyaloğu Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| çizelge ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| /workforce doğrudan açılınca yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
