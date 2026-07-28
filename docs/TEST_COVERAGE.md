# Vomenta — Tuş / Kontrol Kapsama Matrisi

Bu belge, Vomenta arayüzünde **hangi tuşların/özelliklerin otomatik testlerle kontrol edildiğini**, hangilerinin güvenlik gereği **bilerek test edilmediğini** ve nelerin **yapılacak** olduğunu gösterir. İlk kez bakan biri, projede neyin test kapsamında olduğunu buradan görebilir.

> ⚙️ Bu dosya **otomatik üretilir** — elle düzenlemeyin.
> Güncellemek için: `npm run report:coverage` (veya `node tools/generate-coverage.mjs`).
> "Test edilen" bölümü testlerden, diğer bölümler `tests/contracts/coverage-exclusions.js`'ten gelir.

## Özet

- **Test edilen senaryo:** 128
- **Test dosyası:** 22
- **Etiketler:** `@critical` 10 · `@known-bug` 19 · `@public` 2 · `@regression` 26 · `@smoke` 10
- **Bilerek test edilmeyen (güvenlik):** 7
- **Yapılacak (güvenli, henüz kapsanmadı):** 2

## ✅ Test edilen senaryolar

### `a11y.authed.spec.js`

- Dashboard: bilinen borç dışında ciddi/kritik a11y ihlali yok
- Contacts: bilinen borç dışında ciddi/kritik a11y ihlali yok
- Tickets: bilinen borç dışında ciddi/kritik a11y ihlali yok
- Settings: bilinen borç dışında ciddi/kritik a11y ihlali yok
- Reports: bilinen borç dışında ciddi/kritik a11y ihlali yok

### `contacts.authed.spec.js`

- tablo beklenen kolonları gösteriyor  `@critical`
- en az bir kişi listeleniyor  `@smoke`
- arama: eşleşmeyen sorgu "No contacts found" gösteriyor
- arama: mevcut bir kişiyi ada göre filtreliyor  `@critical`

### `dashboard-actions.authed.spec.js`

- "Send SMS" /channels/sms sayfasına götürüyor
- "Create Campaign" /campaigns/outbound sayfasına götürüyor
- "View Reports" /reports sayfasına götürüyor

### `dashboard.authed.spec.js`

- oturum geçerli — giriş formu görünmüyor  `@smoke`
- panel ve kullanıcı menüsü görünüyor  `@smoke` `@critical`
- kenar menüsü tüm ana bölümleri içeriyor  `@critical`
- menü linkleri doğru href değerlerine sahip
- arama kutusu ve tarih filtreleri görünüyor
- /inbox doğrudan açılıyor
- /voice doğrudan açılıyor
- /channels doğrudan açılıyor
- /ai doğrudan açılıyor
- /campaigns doğrudan açılıyor
- /bot-builder doğrudan açılıyor
- /contacts doğrudan açılıyor
- /tickets doğrudan açılıyor
- /analytics doğrudan açılıyor
- /reports doğrudan açılıyor
- /supervisor doğrudan açılıyor
- /workforce doğrudan açılıyor
- /settings doğrudan açılıyor

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
- erişilebilirlik: bilinen borç dışında ciddi/kritik a11y ihlali yok
- görsel: giriş sayfası anlık görüntüsü değişmedi

### `logout.authed.spec.js`

- kullanıcı menüsünden çıkış yapılabiliyor

### `navigation.authed.spec.js`

- "Inbox" linkine tıklayınca /inbox sayfasına gidiyor
- "Tickets" linkine tıklayınca /tickets sayfasına gidiyor
- "Analytics" linkine tıklayınca /analytics sayfasına gidiyor
- "Settings" linkine tıklayınca /settings sayfasına gidiyor

### `pages.authed.spec.js`

- /inbox sayfası "Inbox" başlığıyla açılıyor
- /contacts sayfası "Contacts" başlığıyla açılıyor
- /tickets sayfası "Tickets" başlığıyla açılıyor
- /reports sayfası "Reports" başlığıyla açılıyor
- /analytics sayfası "Analytics" başlığıyla açılıyor
- Reports sayfası tüm rapor kategorilerini gösteriyor
- Analytics sayfası alt bölümleri gösteriyor

### `reports-actions.authed.spec.js`

- "New Dashboard" pano sayfasına götürüyor
- "Custom Report" pano/rapor sayfasına götürüyor
- "Schedule a Report" formu açılıyor ve iptal edilebiliyor

### `reports.authed.spec.js`

- sayfa başlığı ve tarih aralığı seçici görünüyor
- sekmeler görünüyor ve tıklanınca seçili duruma geçiyor
- rapor eylem butonları görünüyor
- Report Types sekmesi rapor kategorilerini gösteriyor

### `responsive.authed.spec.js`

- mobilde masaüstü kenar menüsü gizli
- mobilde hamburger (Open menu) butonu görünür

### `search.authed.spec.js`

- Search butonu komut paletini açıyor
- komut paleti klavye kısayolu (⌘K / Ctrl+K) ile açılıyor
- arama kutusuna yazılabiliyor ve Escape ile kapanıyor

### `settings.authed.spec.js`

- sayfa "Settings" başlığıyla açılıyor  `@smoke`
- tüm sekmeler görünüyor  `@critical`
- her sekme tıklanınca seçili duruma geçiyor

### `supervisor-wallboard.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- kontrol çubuğu düğmeleri mevcut (Refresh All / Auto-scroll / Save layout / TV mode / tema)
- dört kuyruk kartı listeleniyor  `@critical`
- alt metrik kartları mevcut (ASA / Queued / Volume / SLA)
- [en] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- [tr] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- [fr] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- [ar] başlık + yön + tema/kontrol etiketleri çevrili  `@regression`
- "Refresh All" veriyi yeniden çekiyor (dashboard API çağrısı)  `@regression` `@critical`
- "Save layout" düzeni PUT ile kaydediyor  `@regression`
- "TV mode" tam ekrana geçiriyor  `@regression`
- BULGU 1: tema seçici "Dark" seçilince koyu tema uygulanmalı  `@regression` `@known-bug`
- BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli  `@regression` `@known-bug`
- BULGU 3: Auto-scroll içerik taşınca otomatik kaydırmalı  `@regression` `@known-bug`
- BULGU 4: "Live" badge son-güncelleme saati yerel saati göstermeli (UTC değil)  `@regression` `@known-bug`

### `tickets.authed.spec.js`

- tablo beklenen kolonları gösteriyor  `@critical`
- sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor
- en az bir ticket listeleniyor  `@smoke`
- arama: ticket numarasına göre tek sonuca filtreliyor  `@critical`
- sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor
- arama: eşleşmeyen sorgu "No tickets found" boş-durumu gösteriyor

### `voice-subnav.authed.spec.js`

- "Queues" alt-navigasyonu tıklanınca çalışıyor
- "Call History" alt-navigasyonu tıklanınca çalışıyor
- "Voicemails" alt-navigasyonu tıklanınca çalışıyor
- "Recordings" alt-navigasyonu tıklanınca çalışıyor

### `voice.authed.spec.js`

- /voice, Live Calls sayfasına açılıyor
- aktif çağrı yokken boş durum gösteriliyor
- Voice alt-navigasyon öğeleri görünüyor

### `workforce.authed.spec.js`

- sayfa başlığı ve 7 sekme görünüyor  `@smoke`
- 7 sekme de yükleniyor ve imza kontrolü görünüyor  `@smoke`
- tarih navigasyonu önceki/sonraki haftaya gidiyor
- çizelge hücresine tıklayınca "Add Shift" formu açılıyor (Start/End/Break)
- en · Workforce English diline doğru çevriliyor (başlık, sekmeler, yön, form)
- tr · Workforce Türkçe diline doğru çevriliyor (başlık, sekmeler, yön, form)
- fr · Workforce Français diline doğru çevriliyor (başlık, sekmeler, yön, form)
- ar · Workforce العربية diline doğru çevriliyor (başlık, sekmeler, yön, form)

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
