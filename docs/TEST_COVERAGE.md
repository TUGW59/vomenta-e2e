# Vomenta — Tuş / Kontrol Kapsama Matrisi

Bu belge, Vomenta arayüzünde **hangi tuşların/özelliklerin otomatik testlerle kontrol edildiğini**, hangilerinin güvenlik gereği **bilerek test edilmediğini** ve nelerin **yapılacak** olduğunu gösterir. İlk kez bakan biri, projede neyin test kapsamında olduğunu buradan görebilir.

> ⚙️ Bu dosya **otomatik üretilir** — elle düzenlemeyin.
> Güncellemek için: `npm run report:coverage` (veya `node tools/generate-coverage.mjs`).
> "Test edilen" bölümü testlerden, diğer bölümler `tests/contracts/coverage-exclusions.js`'ten gelir.

## Özet

- **Test edilen senaryo:** 410
- **Test dosyası:** 33
- **Etiketler:** `@a11y` 15 · `@clean` 4 · `@critical` 45 · `@data` 1 · `@deeplink` 3 · `@errorpath` 3 · `@i18n` 12 · `@keyboard` 2 · `@known-bug` 30 · `@layout` 9 · `@perf` 1 · `@public` 2 · `@regression` 232 · `@smoke` 39 · `@visual` 3
- **Bilerek test edilmeyen (güvenlik):** 7
- **Yapılacak (güvenli, henüz kapsanmadı):** 2

## ✅ Test edilen senaryolar

### `a11y.authed.spec.js`

- Dashboard: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Contacts: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Tickets: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Settings: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Reports: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Analytics: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Workforce: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Supervisor Agents: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Voice: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Reports · Call: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- Reports · Dashboards: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`

### `analytics.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- tarih aralığı butonları mevcut (Today / 7 Days / 30 Days / 90 Days / Custom)  `@smoke`
- üst KPI döşemeleri görünüyor VE değer gösteriyor
- "AI usage" ve "Deep analytics" bölümleri görünüyor  `@smoke`
- 6 navigasyon kartı doğru hedeflerle görünüyor  `@critical`
- sayfada sessiz hata yok (console-error / failed-request / 5xx)  `@smoke`
- [en] başlık + yön + tarih butonları + AI usage + kartlar çevrili  `@regression`
- [tr] başlık + yön + tarih butonları + AI usage + kartlar çevrili  `@regression`
- [fr] başlık + yön + tarih butonları + AI usage + kartlar çevrili  `@regression`
- [ar] başlık + yön + tarih butonları + AI usage + kartlar çevrili  `@regression`
- varsayılan olarak "30 Days" aktif, diğerleri değil  `@regression`
- L1 tıklama OK: "Today" tıklanınca aktif duruma geçiyor  `@regression`
- L1 tıklama OK: "7 Days" tıklanınca aktif duruma geçiyor  `@regression`
- L1 tıklama OK: "90 Days" tıklanınca aktif duruma geçiyor  `@regression`
- L2 arka plan OK: "7 Days" tıklanınca analytics verisi API'den çekiliyor  `@regression` `@critical`
- L3 görev OK: "Today" seçilince dönem etiketleri "· Today"e dönüyor  `@regression`
- L3 görev OK: "7 Days" seçilince dönem etiketleri "· 7 Days"e dönüyor  `@regression`
- L3 görev OK: "90 Days" seçilince dönem etiketleri "· 90 Days"e dönüyor  `@regression`
- L1 tıklama OK: popover Start / End + "Apply range" ile açılıyor  `@regression`
- L2 arka plan OK: "Apply range" özel aralıkla analytics verisi çekiyor  `@regression`
- L1+L3: "Call analytics" kartı /reports/call ("Call Reports") sayfasına götürüyor  `@regression`
- L1+L3: "Agent analytics" kartı /reports/agent ("Agent Performance") sayfasına götürüyor  `@regression`
- L1+L3: "Queue analytics" kartı /reports/queue ("Queue Reports") sayfasına götürüyor  `@regression`
- L1+L3: "Campaign analytics" kartı /reports/campaign ("Campaign Reports") sayfasına götürüyor  `@regression`
- L1+L3: "AI analytics" kartı /reports/ai ("AI Reports") sayfasına götürüyor  `@regression`
- L1+L3: "Dashboards" kartı /reports/dashboards ("Dashboards") sayfasına götürüyor  `@regression`
- [desktop] yatay taşma yok  `@regression`
- [mobile] yatay taşma yok  `@regression`
- [ar/rtl desktop] yatay taşma yok  `@regression`
- BULGU A [tr]: "Deep analytics" bölümü tr arayüzde çevrili olmalı  `@regression` `@known-bug`
- BULGU A [fr]: "Deep analytics" bölümü fr arayüzde çevrili olmalı  `@regression` `@known-bug`
- BULGU A [ar]: "Deep analytics" bölümü ar arayüzde çevrili olmalı  `@regression` `@known-bug`
- BULGU B: iç terim "ClickHouse" kullanıcıya görünmemeli  `@regression` `@known-bug`

### `campaigns-outbound.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- dört özet kartı listeleniyor  `@smoke`
- arama, tür filtresi ve durum sekmeleri mevcut  `@smoke`
- tablo başlıkları doğru sırada  `@smoke` `@critical`
- New Campaign düğmesi görünür ve etkin  `@smoke`
- [en] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili  `@regression`
- [tr] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili  `@regression`
- [fr] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili  `@regression`
- [ar] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili  `@regression`
- L1 tıklama OK: metin yazılabiliyor  `@regression`
- L2 arka plan OK: arama filtresiyle liste ucunu çağırıyor  `@regression` `@critical`
- L3 görev OK: eşleşmeyen arama boş-durumu gösteriyor (liste gerçekten filtreleniyor)  `@regression`
- L1 tıklama OK: seçilen değer trigger'da güncelleniyor  `@regression`
- L2 arka plan OK: campaignType filtresiyle liste ucunu çağırıyor  `@regression` `@critical`
- L3 görev OK: "Voice" seçilince listede yalnız VOICE kampanyaları kalıyor  `@regression`
- L3 görev OK: "SMS" seçilince listede yalnız SMS kampanyaları kalıyor  `@regression`
- L3 görev OK: "Email" seçilince listede yalnız EMAIL kampanyaları kalıyor  `@regression`
- L3 görev OK: "WhatsApp" seçilince listede yalnız WhatsApp kampanyaları kalıyor  `@regression`
- L1 tıklama OK: Running sekmesi seçili duruma geçiyor  `@regression`
- L2 arka plan OK: status filtresiyle liste ucunu çağırıyor  `@regression` `@critical`
- L3 görev OK: "All" karışık durumları gösteriyor (en az bir Completed)  `@regression`
- L3 görev OK: "Running" sekmesi diğer durumları listeden çıkarıyor  `@regression`
- L3 görev OK: "Paused" sekmesi diğer durumları listeden çıkarıyor  `@regression`
- L1 tıklama OK: tıklanınca create rotasına gidiyor  `@regression`
- L2 arka plan OK: create sayfası kanal verisini çekiyor  `@regression` `@critical`
- L3 görev OK: "Create Campaign" sihirbazı görünüyor  `@regression`
- L1 tıklama OK: göz ikonuna basınca detay rotasına gidiyor  `@regression`
- L2 arka plan OK: seçilen kampanyanın detayını API'den çekiyor  `@regression` `@critical`
- L3 görev OK: doğru kampanyanın detay sayfası açılıyor (ad eşleşiyor)  `@regression`
- L1 tıklama OK: çöp ikonu kalıcı-silme onay dialogu açıyor (mutation göndermeden)  `@regression`
- L2 arka plan OK: onaylayınca DELETE /campaigns/{id} gidiyor (route ile yakalanır, prod'a yazılmaz)  `@regression` `@critical`
- L3 görev OK — N/A: gerçek silme kalıcı mutation, prod'a yazmadan doğrulanamaz (bkz. mutasyon spec dosyasi)  `@regression`
- L1 tıklama OK: play ikonu başlatma onay dialogu açıyor (mutation göndermeden)  `@regression`
- L2 arka plan OK: onaylayınca POST /campaigns/{id}/start gidiyor (route ile yakalanır)  `@regression` `@critical`
- L3 hata yolu OK: start 400 dönünce "Failed to start" hata toast'ı gösteriliyor  `@regression`
- 6 adımlı stepper + Adım 1 alanları görünüyor; Cancel geri döndürüyor  `@regression`
- göz ile açılan detayda sekmeler ve metrik kartları var  `@regression`
- BULGU 1: 10+ kampanya varsa sayfalama/daha-fazla kontrolü olmalı  `@regression` `@known-bug`
- BULGU 2: satır işlem ikonlarının (göz/sil) erişilebilir ismi olmalı  `@regression` `@known-bug`

### `contacts.authed.spec.js`

- başlık, alt başlık ve 7 kolon görünüyor  `@smoke`
- araç çubuğu butonları ve arama mevcut  `@critical`
- en az bir kişi listeleniyor  `@smoke`
- [en] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili  `@regression`
- [tr] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili  `@regression`
- [fr] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili  `@regression`
- [ar] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili  `@regression`
- L1 tıklama OK: terim girince liste süzülür ve "Clear" çıkar  `@regression`
- L2 arka plan OK: arama filters={"search":…} ile API sorgusu atıyor  `@regression` `@critical`
- L3 görev OK: eşleşen kişi görünür, eşleşmeyen sorgu boş-durum gösterir  `@regression`
- L1 tıklama OK: 5 tag chip görünür ve tıklanabilir  `@regression`
- L2 arka plan OK: chip tıklanınca filters={"tags":[…]} sorgusu atılıyor  `@regression` `@critical`
- L3 görev OK: filtre listeyi süzüyor (VIP kişisi yoksa boş-durum)  `@regression`
- L1 tıklama OK: dropdown açılıyor (All Companies + en az bir şirket)  `@regression`
- L2 arka plan OK: bir şirket seçilince liste yeniden çekiliyor  `@regression`
- L3 görev OK: seçilen şirket dropdown tetikleyicisinde yansıyor  `@regression`
- L1 tıklama OK: sort chip görünür ve tıklanabilir  `@regression`
- L2 arka plan OK: sort chip yeni sort=[…] ile sorgu atıyor  `@regression` `@critical`
- L3 görev OK: satır sırası değişiyor  `@regression`
- L1 tıklama OK: ızgara butonu tıklanınca aktif duruma geçiyor  `@regression`
- L3 görev OK: ızgara görünümü tabloyu değiştiriyor, listeye dönünce tablo geri geliyor  `@regression`
- L1 tıklama OK: New Contact formunu açıyor (9 alan + Kaydet/İptal)  `@regression`
- L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ)  `@regression`
- L1 tıklama OK: /contacts/import sayfasını (dosya girişli) açıyor  `@regression`
- L1 tıklama OK: Export tıklanınca indirme başlıyor  `@regression`
- L2 arka plan OK: Export POST /contacts/export ucunu tetikliyor  `@regression` `@critical`
- L3 görev OK: indirilen CSV içeriği doğru (başlık + kodlama), bozulma yok  `@regression`
- L3 görev OK: farklı dilde indirme dili değiştirmez / bozulmaz (en == ar başlık)  `@regression`
- L1 tıklama OK: /contacts/segments sayfasını açıyor  `@regression`
- L1 tıklama OK: satıra tıklayınca /contacts/{id} detayına gidiyor  `@regression`
- L2 arka plan OK: detay kişi + timeline uçlarından veri çekiyor  `@regression` `@critical`
- L3 görev OK: detay sayfası kişi adını ve sekmeleri gösteriyor  `@regression`
- L1 OK: tek sayfada prev/next pasif ve sayaç "of N" gösteriyor  `@regression`
- L1 tıklama OK: bir satır seçilince "1 selected" + 5 toplu buton çıkıyor  `@regression`
- L3 görev OK: "tümünü seç" tüm satırları seçiyor (sayaç = toplam)  `@regression`
- [en] toplu çubuk buton etiketleri çevrili  `@regression`
- [tr] toplu çubuk buton etiketleri çevrili  `@regression`
- [fr] toplu çubuk buton etiketleri çevrili  `@regression`
- [ar] toplu çubuk buton etiketleri çevrili  `@regression`
- L1 tıklama OK: "Assign Owner" diyaloğu açılıyor (Confirm/Cancel)  `@regression`
- L1 tıklama OK: "Add Tag" diyaloğu açılıyor (Confirm/Cancel)  `@regression`
- L1 tıklama OK: "Add to Campaign" diyaloğu açılıyor (Confirm/Cancel)  `@regression`
- L1 tıklama OK: seçili export indirme başlatıyor  `@regression`
- L2 arka plan OK: toplu export POST /contacts/export tetikliyor  `@regression` `@critical`
- L1 tıklama OK: Sil onay alertdialog'u açıyor; İptal listeyi değiştirmiyor  `@regression`
- BULGU F1: satır ara butonu erişilebilir ismi ham anahtar "callContact" olmamalı  `@regression`
- BULGU F2: kişi detayı sil butonu ham anahtar "contacts.delete" göstermemeli  `@regression`

### `dashboard-actions.authed.spec.js`

- "Send SMS" /channels/sms ("SMS Configuration") sayfasına götürüyor
- "Create Campaign" /campaigns/outbound ("Outbound Campaigns") sayfasına götürüyor
- "View Reports" /reports ("Reports") sayfasına götürüyor

### `dashboard.authed.spec.js`

- oturum geçerli — giriş formu görünmüyor  `@smoke`
- panel ve kullanıcı menüsü görünüyor  `@smoke` `@critical`
- kenar menüsü tüm ana bölümleri içeriyor  `@critical`
- menü linkleri doğru href değerlerine sahip
- arama kutusu ve tarih filtreleri görünüyor
- panelde sessiz hata yok (console-error / failed-request / 5xx)  `@smoke`
- /inbox doğrudan açılıyor ("Inbox")
- /voice doğrudan açılıyor ("Live Calls")
- /channels doğrudan açılıyor ("Channels")
- /ai doğrudan açılıyor ("AI Management")
- /campaigns doğrudan açılıyor ("Campaigns")
- /bot-builder doğrudan açılıyor ("Bot Builder")
- /contacts doğrudan açılıyor ("Contacts")
- /tickets doğrudan açılıyor ("Tickets")
- /analytics doğrudan açılıyor ("Analytics")
- /reports doğrudan açılıyor ("Reports")
- /supervisor doğrudan açılıyor ("Supervisor")
- /workforce doğrudan açılıyor ("Workforce Management")
- /settings doğrudan açılıyor ("Settings")

### `discovery/discovery.spec.js`

- salt-okunur uygulama keşfi rapor ve kapsam radarı üretir

### `forms.authed.spec.js`

- Create Ticket formu beklenen alanlarla açılıyor
- boş gönderim "Subject is required." uyarısı veriyor ve kaydetmiyor

### `header.authed.spec.js`

- tema değiştirici temayı gerçekten değiştiriyor (Dark ↔ Light)
- durum (presence) menüsü seçenekleriyle açılıyor
- kullanıcı menüsü (avatar) Profile/Settings/Log out ile açılıyor

### `inbox.authed.spec.js`

- Inbox ve Soft Phone panelleri görünüyor
- konuşma arama kutusu görünüyor ve yazılabiliyor
- eşleşmeyen aramada boş-durum mesajı gösteriliyor
- kanal / atama filtre çipleri görünüyor
- sağ panel sekmeleri görünüyor ve tıklanınca seçili oluyor

### `known-bugs.authed.spec.js`

- B1 · /voice/regulatory · ham i18n anahtarları görünmemeli  `@regression` `@known-bug`
- B2 · /campaigns · ilerleme yüzdesi 100ü aşmamalı  `@regression` `@known-bug`
- B3 · /inbox · ham i18n anahtarı inbox.noMessagesYet görünmemeli  `@regression` `@known-bug`
- B4 · /settings · "Manage Modules" kök sayfaya atmamalı  `@regression` `@known-bug`
- B5 · /channels · Ses kartı yanlışlıkla "Yapılandırılmadı" göstermemeli  `@regression` `@known-bug`
- B6 · /settings · davet satırları ayırt edilebilir olmalı (placeholder "Invited User" değil)  `@regression` `@known-bug`
- B7 · /settings · Modüller açıklaması iki kez render edilmemeli  `@regression` `@known-bug`
- B8 · Softphone · müsaitlik açılır menüsü GÖRSEL olarak açılmalı  `@regression` `@known-bug`
- B9 · /channels/email · varsayılan imza ham i18n anahtarı göstermemeli  `@regression` `@known-bug`
- B10 · /voice/regulatory · Voice sekme çubuğu görünmeli (bölüm düzeni)  `@regression` `@known-bug`
- B11 · /voice/voicemail · İşlemler butonlarının erişilebilir ismi olmalı  `@regression` `@known-bug`
- B12 · /analytics · TR arayüzde İngilizce/iç metin sızmamalı  `@regression` `@known-bug`
- B13 · /ai · sekme etiketinde boşluk eksik olmamalı ("Yapay ZekaTemsilciler")  `@regression` `@known-bug`
- B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı  `@regression` `@known-bug`
- B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli  `@regression` `@known-bug`

### `login.spec.js`

- doğru sayfa başlığı ile yükleniyor  `@smoke` `@public`
- karşılama başlıkları görünüyor
- giriş formu tüm temel alanları içeriyor  `@smoke` `@public`
- SSO (Google ve Microsoft) butonları görünüyor
- e-posta ve şifre alanlarına yazılabiliyor
- e-posta alanı geçersiz adresi native doğrulama ile reddediyor
- 'Forgot password?' linki şifre sıfırlama sayfasına gidiyor
- 'Sign up' linki kayıt sayfasına gidiyor
- erişilebilirlik: bilinen borç dışında ciddi/kritik a11y ihlali yok  `@a11y`
- görsel: giriş sayfası anlık görüntüsü değişmedi  `@visual`

### `logout.authed.spec.js`

- kullanıcı menüsünden çıkış yapılabiliyor

### `navigation.authed.spec.js`

- "Inbox" linkine tıklayınca /inbox ("Inbox") sayfasına gidiyor
- "Tickets" linkine tıklayınca /tickets ("Tickets") sayfasına gidiyor
- "Analytics" linkine tıklayınca /analytics ("Analytics") sayfasına gidiyor
- "Settings" linkine tıklayınca /settings ("Settings") sayfasına gidiyor

### `pages.authed.spec.js`

- /inbox sayfası "Inbox" başlığıyla açılıyor
- /contacts sayfası "Contacts" başlığıyla açılıyor
- /tickets sayfası "Tickets" başlığıyla açılıyor
- /reports sayfası "Reports" başlığıyla açılıyor
- /analytics sayfası "Analytics" başlığıyla açılıyor
- Reports sayfası tüm rapor kategorilerini gösteriyor
- Analytics sayfası alt bölümleri gösteriyor

### `quality-baseline.authed.spec.js`

- yapı ve doğrudan erişim çalışıyor  `@smoke` `@deeplink`
- bilinen borç dışında ciddi/kritik ihlal yok  `@a11y`
- LTR ve Arapça RTL görünüm mobil/tablet/masaüstünde taşmıyor  `@layout`
- yüklemede console, ağ veya HTTP 5xx hatası yok  `@clean`
- en dil/yön kabuğu çalışıyor  `@i18n`
- tr dil/yön kabuğu çalışıyor  `@i18n`
- fr dil/yön kabuğu çalışıyor  `@i18n`
- ar dil/yön kabuğu çalışıyor  `@i18n`
- interaktif kontrol envanteri erişilebilir isim taşıyor  `@regression`

### `reports-actions.authed.spec.js`

- "New Dashboard" pano sayfasına ("Dashboards") götürüyor
- "Custom Report" pano/rapor sayfasına ("Dashboards") götürüyor
- "Schedule a Report" formu açılıyor ve iptal edilebiliyor

### `reports-dashboards.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- üç sekme görünüyor (Tümü / Varsayılan / Özel)  `@smoke`
- bölüm başlıkları görünüyor (Varsayılan / Özel Panolar)  `@smoke`
- "Create Dashboard" eylem düğmesi görünüyor  `@smoke`
- en az bir özel pano kartı listeleniyor  `@critical`
- [en] başlık + yön + sekme/bölüm/eylem etiketleri çevrili  `@i18n`
- [tr] başlık + yön + sekme/bölüm/eylem etiketleri çevrili  `@i18n`
- [fr] başlık + yön + sekme/bölüm/eylem etiketleri çevrili  `@i18n`
- [ar] başlık + yön + sekme/bölüm/eylem etiketleri çevrili  `@i18n`
- L1 tıklama OK: sekmeye tıklayınca seçili duruma geçiyor  `@regression`
- L3 görev OK: sekme kart listesini gerçekten filtreliyor  `@regression`
- L1 tıklama OK: paylaş diyaloğu açılıyor ve bağlantıyı gösteriyor  `@regression` `@critical`
- L3 görev OK: [en] paylaş diyaloğu yatayda taşmamalı [BULGU 1]  `@regression` `@layout` `@known-bug`
- L3 görev OK: [tr] paylaş diyaloğu yatayda taşmamalı [BULGU 1]  `@regression` `@layout` `@known-bug`
- L3 görev OK: [fr] paylaş diyaloğu yatayda taşmamalı [BULGU 1]  `@regression` `@layout` `@known-bug`
- L3 görev OK: [ar] paylaş diyaloğu yatayda taşmamalı [BULGU 1]  `@regression` `@layout` `@known-bug`
- L1 tıklama OK: kopyalayınca "Link copied" bildirimi çıkıyor  `@regression`
- L3 görev OK: panoya (clipboard) paylaşım URL'si yazılıyor  `@regression`
- L1 tıklama OK: oluştur diyaloğu açılıyor ve iptal edilebiliyor (kayıt YOK)  `@regression`
- L1+L3: Düzenle builder diyaloğunu açıyor (Add Widget) ve iptal edilebiliyor (kayıt YOK)  `@regression`
- sayfada ve paylaş diyaloğunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- liste ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, kart yok)  `@errorpath`
- liste ucu boş [] dönerse özel pano listesi boş (patlamıyor)  `@errorpath`
- paylaş diyaloğu odak tuzağı ve Escape ile kapanma  `@keyboard`
- paylaşım bağlantısı doğrudan açılınca pano görünümü yükleniyor (login'e düşmüyor)  `@deeplink`
- paylaş diyaloğu görünümü değişmedi (URL maskeli)  `@visual`

### `reports-route-sweep.authed.spec.js`

- kenar menüsündeki her /reports/* rotası baseline geçiyor  `@regression` `@clean`

### `reports-sections.authed.spec.js`

- [call] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [agent] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [queue] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [campaign] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [channel] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [ai] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [quality] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [csat] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [billing] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [sla] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule  `@smoke`
- [en] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili  `@i18n`
- [tr] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili  `@i18n`
- [fr] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili  `@i18n`
- [ar] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili  `@i18n`
- L1 tıklama OK: sekmeler seçili duruma geçiyor  `@regression`
- L3 görev OK: Charts grafik gösteriyor, Table tabloya geçiyor  `@regression` `@critical`
- L1 tıklama OK: seçilen preset vurgulanıyor (border-primary)  `@regression`
- L2 arka plan OK: preset yeni tarih aralığıyla veri çekiyor  `@regression` `@critical`
- L3 görev OK: Date Range etiketi güncelleniyor  `@regression`
- boş bölüm (campaign) düzgün içerik/boş-durum çözüyor (patlamıyor)  `@regression`
- sayfada ciddi/kritik a11y ihlali yok (Charts + Table)  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- rapor ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, grafik yok)  `@errorpath`
- sekmeler klavyeyle gezilebiliyor (Charts→Table, ok tuşu)  `@keyboard`
- bölüm rotası doğrudan açılınca yükleniyor (login'e düşmüyor)  `@deeplink`
- grafikler bütçe içinde render oluyor  `@perf`
- UI "Total Calls" KPI, API data.summary.totalCalls ile eşleşiyor  `@data`
- boş-durum (campaign) görünümü değişmedi  `@visual`
- L1+L2: tıklayınca insights ucuna POST gidiyor  `@regression`
- L1 tıklama OK: menü CSV/Excel/PDF seçenekleriyle açılıyor  `@regression`
- L1 tıklama OK: "Schedule This Report" diyaloğu açılıyor ve iptal edilebiliyor  `@regression`
- L1+L3: "line" seçilince grafik çizgi türüne geçiyor (recharts-line)  `@regression`
- L1+L2: "By Week" seçilince groupBy=week ile veri çekiyor  `@regression`
- L1 tıklama OK: Standard ve Auto-refresh switch'leri durum değiştiriyor  `@regression`
- Tablo sekmesinde başlık + veri satırları + sayfa boyutu kontrolü var  `@regression`
- L3: "Today" preset tarih etiketi YEREL bugünü göstermeli (UTC değil) [BULGU]  `@regression` `@known-bug`

### `reports.authed.spec.js`

- sayfa başlığı ve tarih aralığı seçici görünüyor
- sekmeler tıklanınca seçili oluyor VE paneli o içeriği gösteriyor
- rapor eylem butonları görünüyor
- Report Types sekmesi rapor kategorilerini gösteriyor
- sayfa intl FORMATTING_ERROR sessiz hatası üretmemeli  `@known-bug`
- AI Insights panelinde ham i18n anahtarı sızmamalı (reports.aiInsightsDesc)  `@known-bug`

### `responsive.authed.spec.js`

- mobilde masaüstü kenar menüsü gizli  `@layout`
- mobilde hamburger (Open menu) butonu görünür  `@layout`

### `search.authed.spec.js`

- Search butonu komut paletini açıyor
- komut paleti klavye kısayolu (⌘K / Ctrl+K) ile açılıyor
- arama kutusuna yazılabiliyor ve Escape ile kapanıyor

### `settings.authed.spec.js`

- sayfa "Settings" başlığıyla açılıyor  `@smoke`
- tüm sekmeler görünüyor  `@critical`
- her sekme tıklanınca seçili oluyor VE paneli o içeriği gösteriyor

### `settings-profile.authed.spec.js`  (Ayarlar › Profil — keşif: `docs/ayarlar-kesif/NOTLAR.md`)

- sayfa "Profile" başlığı + 4 alt sekme ile açılıyor  `@smoke`
- User menu → Profile navigasyonu sayfayı yüklüyor  `@smoke`
- Profile sekmesi kişisel-bilgi formunu render ediyor (Email disabled)  `@critical`
- L1: her sekme tıklanınca `aria-selected=true`  `@regression`
- L3: her sekme paneli kendi içerik imzasını gösteriyor  `@regression`
- L2: Sessions sekmesi `GET /auth/sessions` çekiyor + tablo render  `@regression`
- L1: Timezone / Language combobox popover seçenekleri listeliyor  `@regression`
- L3: bildirim ayarları linki `/settings/notifications` yüklüyor  `@regression`
- mutasyon kontrolleri MEVCUT ama tıklanmıyor (Save/Password/2FA/Revoke — L3 N/A prod)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + sekmeler + panel imzaları çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok (her alt sekmede)  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok (allowlist dışı)  `@clean`
- profil/oturum ucu 500 → kabuk sağlam / tablo yok  `@errorpath`
- sekmeler ok tuşlarıyla gezilebiliyor; Language popover Escape ile kapanıyor  `@keyboard`
- `/settings/profile` doğrudan açılıyor  `@deeplink`
- Profile kişisel-bilgi kartı görünümü değişmedi (gece)  `@visual`

### `settings-profile-mutations.authed.spec.js`  (yalnız staging tenant)

- L3: Telefon değiştir → Save (`PATCH /auth/me`) → kalıcı → eski değere geri al  `@regression` `@mutation`

### `settings-organization.authed.spec.js`  (Ayarlar › Kuruluş)

- sayfa "Organization" başlığı + Company Information formu ile açılıyor  `@smoke`
- form alanları render ediliyor (Company name/Website/Domain + Save)  `@critical`
- L1: Save changes formda değişiklik olunca aktifleşiyor (dirty)  `@regression`
- L2: sayfa açılınca `GET /settings/organization` çekiliyor + form dolu  `@regression`
- L1: Currency combobox seçenekleri listeliyor  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + bölüm + Save çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok (allowlist dışı)  `@clean`
- kuruluş ucu 500 → kabuk sağlam  `@errorpath`
- Currency popover Escape ile kapanıyor  `@keyboard`
- `/settings/organization` doğrudan açılıyor  `@deeplink`
- Company Information formu görünümü değişmedi (gece)  `@visual`

### `settings-organization-mutations.authed.spec.js`  (yalnız staging tenant)

- L3: Website değiştir → Save (`PATCH/PUT /settings/organization`) → kalıcı → eski değere geri al  `@regression` `@mutation`

### `settings-users.authed.spec.js`  (Ayarlar › Kullanıcılar ve Roller)

- sayfa "Users & Roles" başlığı + üye tablosu ile açılıyor  `@smoke`
- tablo beklenen kolonları + en az bir üye satırı gösteriyor  `@critical`
- L1+L3: ada göre arama eşleşen üyeyi süzüyor  `@regression`
- L1: Invite User dialogu açılıyor (Email/Role/Team + Send disabled)  `@regression`
- L3 (kalıcı davet) N/A: prod salt-okunur — staging lane'ine bırakıldı  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + kolonlar + Invite + dialog çevrili  `@i18n`
- 🐞 davet dialogu "Close" butonu çevrilmiyor (Kapat değil)  `@i18n` `@known-bug` (test.fail)
- sayfada + davet dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok (allowlist dışı)  `@clean`
- kullanıcı listesi 500 → kabuk sağlam  `@errorpath`
- davet dialogu odak tuzağı + Escape ile kapanma  `@keyboard`
- `/settings/users` doğrudan açılıyor  `@deeplink`
- davet dialogu görünümü değişmedi (gece)  `@visual`
- L3 davet mutasyonu → `known-bugs-invite.mutation.authed.spec.js` (staging)  `@mutation`

### `settings-roles.authed.spec.js`  (Ayarlar › Rol Yönetimi)

- sayfa "Role Management" başlığı + rol tablosu ile açılıyor  `@smoke`
- tablo kolonları + sistem rolleri (ADMIN/AGENT/OWNER…) görünüyor  `@critical`
- L1: sistem rolünde Edit/Reset var, Delete DISABLED (silinemez)  `@regression`
- L1: Create Role dialogu açılıyor (Ad/Açıklama + izin kategorileri + Save)  `@regression`
- UI rol satırı sayısı `/roles` yanıtındaki rol sayısıyla eşleşiyor  `@data`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + kolonlar + Create + dialog çevrili  `@i18n`
- 🐞 Create Role dialogu "Close" butonu çevrilmiyor  `@i18n` `@known-bug` (test.fail)
- sayfada + Create dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok  `@clean`
- roller ucu 500 → kabuk sağlam  `@errorpath`
- Create Role dialogu odak tuzağı + Escape ile kapanma  `@keyboard`
- `/settings/roles` doğrudan açılıyor  `@deeplink`
- (görsel N/A: canlı sayaç + uzun kaydırmalı dialog → flaky)

### `settings-roles-mutations.authed.spec.js`  (yalnız staging tenant)

- L3: custom rol oluştur (`POST /roles`) → listede görün → sil (`DELETE /roles/{id}`)  `@regression` `@mutation`

### `settings-compliance.authed.spec.js`  (Ayarlar › Uyumluluk ve Veri Gizliliği)

- sayfa başlığı + tüm bölümler (Data Retention/GDPR/Audit/Consent/Requests) render  `@smoke`
- bölüm eylem butonları görünüyor (Log Consent / Create Request)  `@critical`
- L3: "Manage Retention" → `/settings/data-retention` yüklüyor  `@regression`
- L3: "View More" → `/settings/audit` yüklüyor  `@regression`
- L1: Log Consent dialogu açılıyor (alanlar + gönder disabled)  `@regression`
- L1: Create Request dialogu açılıyor (alanlar + Export Data disabled)  `@regression`
- L3 (kalıcı kayıt) N/A: prod salt-okunur — staging  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + eylem butonları çevrili  `@i18n`
- 🐞 dialog "Close" butonu çevrilmiyor (Users/Roles ile sistemik)  `@i18n` `@known-bug` (test.fail)
- sayfada + Log Consent dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok  `@clean`
- onay listesi ucu 500 → kabuk sağlam  `@errorpath`
- Log Consent dialogu odak tuzağı + Escape  `@keyboard`
- `/settings/compliance` doğrudan açılıyor  `@deeplink`
- (görsel N/A: 3 canlı tablo göreli zaman/tarih/UUID → flaky)

### `settings-compliance-mutations.authed.spec.js`  (staging; test.fixme)

- L3: onay kaydı oluştur → görün → temizle — UI'da hard-delete yok; staging purge ucu teyidi bekliyor  `@regression` `@mutation`

### `settings-teams.authed.spec.js`  (Ayarlar › Ekipler)

- sayfa "Teams" başlığı + Create Team + ekip kartı ile açılıyor  `@smoke`
- en az bir ekip kartı üye sayısıyla görünüyor  `@critical`
- L1: Create Team dialogu açılıyor (Ad/Açıklama + Create disabled)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + Create butonu çevrili  `@i18n`
- 🐞 Create Team dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug` (test.fail)
- sayfada + Create dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok  `@clean`
- ekip listesi 500 → kabuk sağlam  `@errorpath`
- Create Team dialogu odak tuzağı + Escape  `@keyboard`
- `/settings/teams` doğrudan açılıyor  `@deeplink`
- Create Team dialogu görünümü değişmedi (gece)  `@visual`

### `settings-teams-mutations.authed.spec.js`  (staging; test.fixme)

- L3: ekip oluştur → görün → sil — Edit dialogunda Delete yok; staging silme ucu teyidi bekliyor  `@regression` `@mutation`

### `settings-hours.authed.spec.js`  (Ayarlar › Çalışma Saatleri)

- sayfa başlığı + haftalık program + Save changes ile açılıyor  `@smoke`
- 7 günlük Open switch; Pzt-Cum açık, Cmt/Paz kapalı  `@critical`
- Holiday Calendar + Add (boşken disabled)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + Save/Add çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + RTL yatay-taşma yok  `@layout`
- console/ağ hatası yok  `@clean`
- business-hours ucu 500 → kabuk sağlam  `@errorpath`
- Timezone combobox açılıp Escape ile kapanıyor  `@keyboard`
- `/settings/hours` doğrudan açılıyor  `@deeplink`
- haftalık program görünümü değişmedi (gece)  `@visual`

### `settings-hours-mutations.authed.spec.js`  (yalnız staging tenant)

- L3: Cumartesi Open switch toggle → Save → kalıcı → geri al (reversible, zero-orphan)  `@regression` `@mutation`

### `settings-automations.authed.spec.js`  (Ayarlar › Otomasyon Kuralları)

- sayfa başlığı + 2 sekme (Rules/SLA Policies) + New Rule  `@smoke`
- Rules boş-durum, SLA Policies tablo kolonları  `@critical`
- L1: sekmeler aria-selected=true  `@regression`
- L1: New Rule dialogu açılıyor (Save Rule disabled)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + sekmeler + New Rule çevrili  `@i18n`
- 🐞 New Rule dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug`
- a11y / layout / clean / errorpath / keyboard / deeplink / visual (Rules boş-durum)

### `settings-automations-mutations.authed.spec.js`  (staging; test.fixme)

- L3: kural oluştur → görün → sil — tablo prod'da boş; staging teyidi bekliyor  `@regression` `@mutation`

### `settings-sla.authed.spec.js`  (Ayarlar › SLA Politikaları)

- sayfa "SLA Policies" başlığı + New Policy + tablo  `@smoke`
- tablo kolonları + en az bir politika satırı  `@critical`
- /automations/sla-policies çağrılıyor + satır render  `@data`
- L1: New Policy dialogu (Create policy disabled)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + kolonlar + New Policy çevrili  `@i18n`
- 🐞 New Policy dialogu form alanları etiketsiz (axe label/critical)  `@a11y` `@known-bug` (test.fail)
- 🐞 New Policy dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug`
- layout / clean / errorpath / keyboard / deeplink / visual (New Policy dialog)

### `settings-sla-mutations.authed.spec.js`  (staging; test.fixme)

- L3: SLA politikası oluştur → görün → sil — satır aksiyonları aria-label'sız; staging teyidi  `@regression` `@mutation`

### `settings-templates.authed.spec.js`  (Ayarlar › Şablonlar)

- sayfa başlığı + üst sekmeler + New Template  `@smoke`
- şablon tablosu kolonları + boş-durum  `@critical`
- L1: üst sekmeler aria-selected=true + New Template dialogu (Create disabled)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + üst sekmeler + New Template çevrili  `@i18n`
- 🐞 New Template içerik placeholder'ı ham anahtar (settings.templatesPage.contentPlaceholder)  `@i18n` `@known-bug`
- 🐞 New Template dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug`
- a11y / layout / clean / errorpath / keyboard / deeplink / visual (New Template dialog)

### `settings-templates-mutations.authed.spec.js`  (staging; test.fixme)

- L3: şablon oluştur → görün → sil — tablo prod'da boş; staging teyidi  `@regression` `@mutation`

### `settings-disposition-codes.authed.spec.js`  (Ayarlar › Sonuç Kodları)

- sayfa başlığı + Add Code + tablo  `@smoke`
- tablo kolonları + bilinen kodlar (SALE/NO_ANSWER)  `@critical`
- L1: Add Code dialogu (Code/Label + Create)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + kolonlar + Add çevrili  `@i18n`
- 🐞 Add Code dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug`
- a11y / layout / clean / errorpath / keyboard / deeplink / visual (Add Code dialog)

### `settings-disposition-codes-mutations.authed.spec.js`  (staging; test.fixme)

- L3: kod oluştur → görün → sil — satır aksiyonları aria-label'sız; staging teyidi  `@regression` `@mutation`

### `settings-canned-responses.authed.spec.js`  (Ayarlar › Hazır Yanıtlar)

- sayfa başlığı + New canned response + tablo/boş-durum  `@smoke`
- tablo kolonları  `@critical`
- L1: Create dialogu (Title/Shortcode + Create disabled)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + kolonlar + New çevrili  `@i18n`
- 🐞 Create dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug`
- a11y / layout / clean / errorpath / keyboard / deeplink / visual (Create dialog)

### `settings-canned-responses-mutations.authed.spec.js`  (staging; test.fixme)

- L3: hazır yanıt oluştur → görün → sil — tablo prod'da boş; staging teyidi  `@regression` `@mutation`

### `settings-integrations.authed.spec.js`  (Ayarlar › Entegrasyonlar)

- sayfa başlığı + entegrasyon kartları (Salesforce/Slack) + Webhook bölümü  `@smoke`
- Webhook tablosu kolonları + boş-durum  `@critical`
- L3: "Manage API Keys" → /settings/api-keys; L1: Request Access + Add Webhook dialogları  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + Request Access + Add Webhook çevrili  `@i18n`
- a11y / layout / clean / errorpath / keyboard / deeplink / visual (Request Access dialog)
- (gözlem: activeKeysCount ham anahtarı yükleme-anı flaş; kararlı guard yok — NOTLAR)

### `settings-integrations-mutations.authed.spec.js`  (staging; test.fixme)

- L3: webhook oluştur → görün → sil — tablo prod'da boş; staging teyidi  `@regression` `@mutation`

### `settings-security.authed.spec.js`  (Ayarlar › Güvenlik)

- sayfa başlığı + Password Policies + Save (disabled)  `@smoke`
- Session Management / Active Sessions / IP Whitelist görünüyor  `@critical`
- L3: Manage API Keys → /settings/api-keys; L1: Add IP dialogu  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + Save Policy + Add IP çevrili  `@i18n`
- 🐞 spinbutton alanları etiketsiz (axe label/critical, 3 düğüm)  `@a11y` `@known-bug` (test.fail)
- 🐞 Add IP dialogu "Close" butonu çevrilmiyor (sistemik)  `@i18n` `@known-bug`
- layout / clean / errorpath / keyboard / deeplink / visual (Add IP dialog)

### `settings-security-mutations.authed.spec.js`  (staging; test.fixme)

- L3: password policy switch toggle → Save → kalıcı → geri al — hassas config; staging teyidi  `@regression` `@mutation`

### `settings-data-retention.authed.spec.js`  (Ayarlar › Veri Saklama)

- sayfa başlığı + saklama süreleri + Save changes  `@smoke`
- 5 saklama-süresi spinbutton değerleriyle + Run cleanup mevcut  `@critical`
- L1: Save/Run cleanup/Auto Cleanup switch mevcut (tıklanmıyor)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + Save changes çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok (spinbutton'lar etiketli)  `@a11y`
- layout / clean / errorpath / deeplink / visual (retention formu); @keyboard N/A (dialog/tab yok)

### `settings-data-retention-mutations.authed.spec.js`  (staging; test.fixme)

- L3: saklama süresi değiştir → Save → kalıcı → geri al; Run cleanup ASLA  `@regression` `@mutation`

### `supervisor-agent-live.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- canlı AI çağrısı yokken boş-durum gösteriliyor
- [en] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- [tr] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- [fr] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- [ar] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- L1/L2/L3: canlı AI çağrısı seçilince cockpit açılır (staging/canlı veri)  `@regression`

### `supervisor-agents.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- istatistik döşemeleri görünüyor (Total/Available/Offline/Calls Today/Avg AHT)
- temsilci tablosu beklenen kolonları gösteriyor  `@critical`
- kontroller mevcut (durum filtresi / arama / Analyze)
- [en] başlık + yön + kontrol etiketleri çevrili  `@regression`
- [tr] başlık + yön + kontrol etiketleri çevrili  `@regression`
- [fr] başlık + yön + kontrol etiketleri çevrili  `@regression`
- [ar] başlık + yön + kontrol etiketleri çevrili  `@regression`
- L1 tıklama OK: menü açılıyor ve durum seçenekleri görünüyor  `@regression`
- L2 arka plan OK: durum seçince agents API'sini status parametresiyle çağırıyor  `@regression` `@critical`
- L3 görev OK: seçilen duruma göre tablo filreleniyor  `@regression`
- L1 tıklama OK: arama kutusuna yazılabiliyor  `@regression`
- L2 arka plan OK: arama agents API'sini search parametresiyle çağırıyor  `@regression`
- L3 görev OK: arama tabloyu eşleşen ajana daraltıyor  `@regression`
- L1 tıklama OK: Force menüsü açılıyor ve zorla-durum seçenekleri görünüyor  `@regression`
- L1 tıklama OK: durum seçince onay diyaloğu zorunlu-sebep ile açılıyor (iptal edilir)  `@regression`
- L2/L3: çevrimdışı ajanı zorlama hatasının tam HTTP kodu/mesajı doğrulanır (staging)  `@regression`
- L1 tıklama OK: transkript girilince Analyze butonu etkinleşiyor  `@regression`
- L2 arka plan OK: Analyze transkripti detect-anomaly ucuna POST ediyor  `@regression`
- L3 görev OK: analiz sonucu (risk) arayüzde gösteriliyor  `@regression`
- L1: Previous/Next butonları mevcut, tek sayfada Next devre dışı  `@regression`
- L1+L3: ızgara/liste arasında geçiş tablo düzenini değiştiriyor  `@regression`
- L1+L2+L3: satıra tıklayınca panel açılıyor, status-history çekiliyor, veri tutarlı  `@regression`
- L1: aksiyon ikonları mevcut ve çevrimdışı ajanda devre dışı  `@regression`
- L3 doğruluk: sunucu yanıtındaki her ajan seçilen durumla eşleşiyor  `@regression`
- BULGU: "Last refreshed" saati yerel saat olmalı (UTC değil)  `@regression` `@known-bug`

### `supervisor-coaching.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- istatistik döşemeleri görünüyor
- tablo kolonları + sekmeler görünüyor  `@critical`
- kontroller mevcut (arama / New Evaluation) + boş-durum
- [en] başlık + yön + sekmeler + New Evaluation çevrili  `@regression`
- [tr] başlık + yön + sekmeler + New Evaluation çevrili  `@regression`
- [fr] başlık + yön + sekmeler + New Evaluation çevrili  `@regression`
- [ar] başlık + yön + sekmeler + New Evaluation çevrili  `@regression`
- L1 tıklama OK: "Pending Review" sekmesi seçili duruma geçiyor  `@regression`
- L1 tıklama OK: arama kutusuna yazılabiliyor  `@regression`
- L1 tıklama OK: diyalog form alanlarıyla açılıyor  `@regression`
- L3 görev OK: kriter puanları Overall Score'u yükseltiyor  `@regression`
- L2 arka plan OK: dolu form doğru DTO ile evaluations ucuna POST ediyor  `@regression`
- L3: değerlendirme gönderimi kalıcı kayıt oluşturur (staging mutasyon)  `@regression`

### `supervisor-interactions.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- tablo beklenen kolonları gösteriyor  `@critical`
- kontroller mevcut (kanal filtresi / arama)
- aktif etkileşim yokken boş-durum gösteriliyor
- [en] başlık + yön + kanal filtresi + boş-durum çevrili  `@regression`
- [tr] başlık + yön + kanal filtresi + boş-durum çevrili  `@regression`
- [fr] başlık + yön + kanal filtresi + boş-durum çevrili  `@regression`
- [ar] başlık + yön + kanal filtresi + boş-durum çevrili  `@regression`
- L1 tıklama OK: menü açılıyor ve kanal seçenekleri görünüyor  `@regression`
- L2 arka plan OK: kanal seçince interactions API'sini channel parametresiyle çağırıyor  `@regression` `@critical`
- L1 tıklama OK: arama kutusuna yazılabiliyor  `@regression`
- L1/L2/L3: aktif etkileşim satırındaki izleme/araya-girme aksiyonları (staging/canlı veri)  `@regression`

### `supervisor-wallboard.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- kontrol çubuğu düğmeleri mevcut (Refresh All / Auto-scroll / Save layout / TV mode / tema)
- dört kuyruk kartı listeleniyor  `@critical`
- alt metrik kartları mevcut (ASA / Queued / Volume / SLA)
- [en] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- [tr] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- [fr] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- [ar] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- L1 tıklama OK: tıklayınca "refreshed" bildirimi çıkıyor  `@regression`
- L2 arka plan OK: dashboard verisini API'den çekiyor  `@regression` `@critical`
- L3 görev OK: gösterilen son-güncelleme saati yerel saat olmalı (UTC değil) [BULGU 4]  `@regression`
- L1 tıklama OK: tıklayınca toggle aktif duruma geçiyor  `@regression`
- L3 görev OK: içerik taşınca otomatik kaydırmalı [BULGU 3]  `@regression`
- L1 tıklama OK: buton görünür ve etkin  `@regression`
- L3 görev OK: tıklayınca tam ekrana geçiyor  `@regression`
- L2 arka plan OK: düzeni PUT ile config ucuna gönderiyor  `@regression`
- L1 tıklama OK: seçenek seçince gösterilen değer değişiyor  `@regression`
- L3 görev OK: "Dark" seçilince koyu tema uygulanmalı [BULGU 1]  `@regression`
- L1 tıklama OK: değer düzenlenebiliyor  `@regression`
- L1 tıklama OK: ⋮ menüsü açılıyor ve 5 eylem görünüyor  `@regression` `@critical`
- i18n: Türkçe'de menü eylemleri çevrili (Resume queue hariç)  `@regression`
- BULGU 5: "Resume queue" Türkçe menüde çevrilmeli  `@regression`
- BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli  `@regression` `@known-bug`

### `tickets.authed.spec.js`

- tablo beklenen kolonları gösteriyor  `@critical`
- sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor
- en az bir ticket listeleniyor  `@smoke`
- arama: ticket numarasına göre tek sonuca filtreliyor  `@critical`
- sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor
- arama: eşleşmeyen sorgu "No tickets found" boş-durumu gösteriyor

### `voice-subnav.authed.spec.js`

- "Queues" alt-navigasyonu /voice/queues ("Queues") panelini açıyor
- "Call History" alt-navigasyonu /voice/history ("Call History") panelini açıyor
- "Voicemails" alt-navigasyonu /voice/voicemail ("Voicemails") panelini açıyor
- "Recordings" alt-navigasyonu /voice/recordings ("Call Recordings") panelini açıyor

### `voice.authed.spec.js`

- /voice, Live Calls sayfasına açılıyor
- aktif çağrı yokken boş durum gösteriliyor
- Voice alt-navigasyon öğeleri görünüyor

### `workforce.authed.spec.js`

- başlık ve 7 sekme görünüyor  `@smoke`
- Schedules çizelgesi ve Publish butonu mevcut  `@critical`
- [en] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@regression`
- [tr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@regression`
- [fr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@regression`
- [ar] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@regression`
- L1 tıklama OK: her sekme tıklanınca seçili duruma geçiyor  `@regression`
- L2 arka plan OK: veri sekmeleri ilgili API ucundan veri çekiyor  `@regression` `@critical`
- L3 görev OK: her sekme kendi içeriğini gösteriyor  `@regression`
- L1 tıklama OK: Previous Week tarih aralığını değiştiriyor  `@regression`
- L2 arka plan OK: Previous Week seçilen hafta için çizelge çekiyor  `@regression` `@critical`
- L3 görev OK: gösterilen hafta tam olarak bir hafta geri kayıyor  `@regression`
- L1 tıklama OK: 7d/14d/30d düğmeleri görünür ve tıklanabilir  `@regression`
- L2 arka plan OK: 14d seçilince adherence verisi API'den çekiliyor  `@regression`
- L1 tıklama OK: çizelge hücresi "Add Shift" formunu açıyor (Start/End/Break)  `@regression`
- L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ)  `@regression`
- L1 tıklama OK: buton görünür ve etkin  `@regression`
- L1 tıklama OK: form açılıyor (Start/End Date, Reason) ve tarih dolunca Submit etkinleşiyor  `@regression`
- L2 arka plan OK: Submit doğru uca POST gönderiyor (prod'a YAZILMAZ)  `@regression`
- L1 tıklama OK: "Create badge" formu açılıyor ("Create badge")  `@regression`
- L1 tıklama OK: "Award badge" formu açılıyor ("Award badge")  `@regression`
- L1 tıklama OK: "Create survey" formu açılıyor ("Create survey")  `@regression`
- L1 tıklama OK: "Create Evaluation" formu açılıyor ("Create Quality Evaluation")  `@regression`

## ⛔ Bilerek test edilmeyen tuşlar (güvenlik)

| Kontrol | Sayfa | Neden | Tür |
|---|---|---|---|
| Export / Export All | Contacts, Tickets, Reports | Dosya indirir | `download` |
| Import | Contacts | Toplu veri içe aktarır | `mutation` |
| Create Ticket / Add Contact — kaydet | Tickets, Contacts | Gerçek kayıt oluşturur | `mutation` |
| Send SMS — gönder / Start Call | Channels, Voice | Gerçek mesaj/çağrı başlatır | `external-side-effect` |
| Settings — Save / durum seçimi (Away, Offline) | Settings, Header | Hesabı/ayarı kalıcı değiştirir | `mutation` |
| Google / Microsoft ile giriş | Login | Dış kimlik doğrulama akışı | `external-auth` |
| Silme (Delete) | Genel | Geri döndürülemez | `destructive` |

## ◻️ Yapılacak (güvenli, henüz kapsanmadı)

| Kontrol | Sayfa |
|---|---|
| Bildirimler paneli — standart dialog/menü açmıyor (incelendi) | Header |
| Dil menüsü — görünür menü açmıyor (incelendi) | Header |

### `settings-notifications.authed.spec.js`  (Ayarlar › Bildirimler)

- sayfa başlığı + Email Category Preferences + Save  `@smoke`
- kategori switch'leri + Delivery Channels bölümü  `@critical`
- L1: Save/Enable push/kategori switch'leri mevcut (tıklanmıyor)  `@regression`
- [en/tr/fr/ar] başlık + yön (RTL) + alt başlık + Save + Enable push çevrili  `@i18n`
- a11y / layout / clean / errorpath / deeplink; @keyboard + @visual N/A (dialog yok, uzun form)

### `settings-notifications-mutations.authed.spec.js`  (staging; test.fixme)

- L3: kategori switch toggle → Save → kalıcı → geri al  `@regression` `@mutation`
