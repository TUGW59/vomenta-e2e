# Vomenta — Tuş / Kontrol Kapsama Matrisi

Bu belge, Vomenta arayüzünde **hangi tuşların/özelliklerin otomatik testlerle kontrol edildiğini**, hangilerinin güvenlik gereği **bilerek test edilmediğini** ve nelerin **yapılacak** olduğunu gösterir. İlk kez bakan biri, projede neyin test kapsamında olduğunu buradan görebilir.

> ⚙️ Bu dosya **otomatik üretilir** — elle düzenlemeyin.
> Güncellemek için: `npm run report:coverage` (veya `node tools/generate-coverage.mjs`).
> "Test edilen" bölümü testlerden, diğer bölümler `tests/contracts/coverage-exclusions.js`'ten gelir.

## Özet

- **Test edilen senaryo:** 83
- **Test dosyası:** 17
- **Etiketler:** `@critical` 7 · `@public` 2 · `@smoke` 7
- **Bilerek test edilmeyen (güvenlik):** 7
- **Yapılacak (güvenli, henüz kapsanmadı):** 4

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

### `tickets.authed.spec.js`

- tablo beklenen kolonları gösteriyor  `@critical`
- sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor
- en az bir ticket listeleniyor  `@smoke`
- arama: ticket numarasına göre tek sonuca filtreliyor  `@critical`
- sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor
- arama: eşleşmeyen sorgu "No tickets found" boş-durumu gösteriyor

### `voice.authed.spec.js`

- /voice, Live Calls sayfasına açılıyor
- aktif çağrı yokken boş durum gösteriliyor
- Voice alt-navigasyon öğeleri görünüyor

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
| New Dashboard / Custom Report / Schedule a Report | Reports |
| Voice alt-navigasyonu (Queues, Call History, Voicemails...) | Voice |
| Bildirimler paneli | Header |
| Dil menüsü | Header |
