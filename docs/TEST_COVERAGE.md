# Vomenta — Tuş / Kontrol Kapsama Matrisi

Bu belge, Vomenta arayüzünde **hangi tuşların/özelliklerin otomatik testlerle kontrol edildiğini**, hangilerinin güvenlik gereği **bilerek test edilmediğini** ve nelerin **yapılacak** olduğunu gösterir. İlk kez bakan biri, projede neyin test kapsamında olduğunu buradan görebilir.

> ⚙️ Bu dosya **otomatik üretilir** — elle düzenlemeyin.
> Güncellemek için: `npm run report:coverage` (veya `node tools/generate-coverage.mjs`).
> "Test edilen" bölümü çalıştırılabilir testlerden (`fixme`/koşulsuz `skip` hariç), diğer bölümler `tests/contracts/coverage-exclusions.js`'ten gelir.

## Özet

- **Test edilen senaryo:** 1052
- **Test dosyası:** 71
- **Etiketler:** `@a11y` 57 · `@clean)` 7 · `@clean` 43 · `@critical` 70 · `@data` 17 · `@deeplink` 42 · `@errorpath` 44 · `@export` 2 · `@i18n` 184 · `@keyboard` 33 · `@known-bug` 68 · `@layout` 50 · `@perf` 2 · `@public` 2 · `@regression` 362 · `@route-baseline` 59 · `@smoke` 157 · `@visual` 21
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

### `ai-subroutes.authed.spec.js`

- [voice] /ai/voice açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [chatbot] /ai/chatbot açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [copilot] /ai/copilot açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [sentiment] /ai/sentiment açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [knowledge-base] /ai/knowledge-base açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [prompts] /ai/prompts açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [usage] /ai/usage açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [providers] /ai/providers açılıyor: başlık + bölüm görünür  `@regression` `@smoke`
- [voice] /ai/voice yüklemede sessiz hata yok ()  `@regression` `@clean)`
- [chatbot] /ai/chatbot yüklemede sessiz hata yok ()  `@regression` `@clean)`
- [copilot] /ai/copilot yüklemede sessiz hata yok ()  `@regression` `@clean)`
- [sentiment] /ai/sentiment yüklemede sessiz hata yok ()  `@regression` `@clean)`
- [knowledge-base] /ai/knowledge-base yüklemede sessiz hata yok ()  `@regression` `@clean)`
- [usage] /ai/usage yüklemede sessiz hata yok ()  `@regression` `@clean)`
- [providers] /ai/providers yüklemede sessiz hata yok ()  `@regression` `@clean)`
- KPI tile'ları bir DEĞER gösteriyor + kullanım tabloları görünüyor  `@regression`
- L1 tıklama OK: "Documents" sekmesi seçili duruma geçiyor  `@regression`
- L1 tıklama OK: "30D" aralığı seçili duruma geçiyor  `@regression`
- L1 tıklama OK: "Voice" filtresi Chat senaryosunu gizliyor  `@regression`

### `ai.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- dört sekme görünüyor  `@critical`
- Agents sekmesi: istatistik döşemeleri + bot listesi (Configure) görünüyor
- AI Copilot sekmesi: ayar kartı çapaları görünüyor
- Supervisor sekmesi: oto-değerlendirme + skor kriterleri çapaları görünüyor
- Providers sekmesi: sağlayıcı yapılandırma çapaları + Manage Providers görünüyor
- [en] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili  `@regression`
- [tr] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili  `@regression`
- [fr] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili  `@regression`
- [ar] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili  `@regression`
- L1 tıklama OK: her sekme kendi panelini gösteriyor (içerik takası)  `@regression`
- L3 navigasyon OK: "Configure" botu /bot-builder editörüne götürüyor  `@regression`
- L3 navigasyon OK: "Manage Providers" /ai/providers (Provider Settings) sayfasını yüklüyor  `@regression`

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

### `channels-email.authed.spec.js`

- sayfa "Email Channel" + Add Account + Save Changes ile açılıyor  `@smoke`
- GET /channels/email/config çağrılıyor  `@data`
- L1 tıklama OK: dialog açılıyor  `@regression`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- B21 · /channels/email · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- B17 · /channels/email · açılışta imza format hatası (FORMATTING_ERROR) olmamalı  `@clean` `@known-bug`
- Add Account dialogu odak tuzağı + Escape ile kapanma  `@keyboard`
- config 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /channels/email doğrudan açılınca yükleniyor  `@deeplink`

### `channels-hub.authed.spec.js`

- sayfa "Channels" başlığı + 7 kanal kartı + Configure bağlantıları ile açılıyor  `@smoke`
- her kanal kartının Configure bağlantısı doğru rotaya işaret ediyor  `@critical`
- kanal config uçları çağrılıyor (GET /channels/<kanal>/config 2xx)  `@data`
- L1+L3: Email kartı Configure → /channels/email gerçekten yükleniyor  `@regression`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- kanal config uçları 500 dönse de kabuk + hub başlığı sağlam  `@errorpath`
- /channels doğrudan açılınca hub yükleniyor (login'e düşmüyor)  `@deeplink`
- kanal kartları ızgarası görünümü değişmedi  `@visual`

### `channels-sms.authed.spec.js`

- sayfa "SMS Configuration" + Send SMS + Add Sender + Save Changes ile açılıyor  `@smoke`
- GET /channels/sms/config çağrılıyor  `@data`
- L1 tıklama OK: dialog açılıyor  `@regression`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- B22 · /channels/sms · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- B18 · /channels/sms · açılışta MALFORMED_ARGUMENT konsol hatası olmamalı  `@clean` `@known-bug`
- Add Sender dialogu odak tuzağı + Escape ile kapanma  `@keyboard`
- config 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /channels/sms doğrudan açılınca yükleniyor  `@deeplink`

### `channels-social.authed.spec.js`

- sayfa "Social Media Channels" + Connect + Save Changes ile açılıyor  `@smoke`
- GET /channels/social/config çağrılıyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- B24 · /channels/social · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- B16 · /channels/social · açılışta eksik çeviri (MISSING_MESSAGE) konsol hatası olmamalı  `@clean` `@known-bug`
- config 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /channels/social doğrudan açılınca yükleniyor  `@deeplink`

### `channels-video.authed.spec.js`

- sayfa "Video Call Configuration" + Save Changes ile açılıyor  `@smoke`
- GET /channels/video/config çağrılıyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- B25 · /channels/video · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- config 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /channels/video doğrudan açılınca yükleniyor  `@deeplink`
- yapılandırma formu görünümü değişmedi  `@visual`

### `channels-webchat.authed.spec.js`

- sayfa "Web Chat Configuration" + sekmeler + Save Changes ile açılıyor  `@smoke`
- GET /channels/webchat/config çağrılıyor  `@data`
- L1+L3: Integration sekmesine geçince aria-selected + gömme içeriği  `@regression`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- B20 · /channels/webchat · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- sekmeler klavye ile gezilebilir (ArrowRight → Integration seçili)  `@keyboard`
- config 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /channels/webchat doğrudan açılınca yükleniyor  `@deeplink`
- yapılandırma sekmesi görünümü değişmedi  `@visual`

### `channels-whatsapp.authed.spec.js`

- sayfa "WhatsApp Business" + Save Changes ile açılıyor  `@smoke`
- GET /channels/whatsapp/config çağrılıyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- B23 · /channels/whatsapp · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- B19 · /channels/whatsapp · açılışta MALFORMED_ARGUMENT konsol hatası olmamalı  `@clean` `@known-bug`
- config 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /channels/whatsapp doğrudan açılınca yükleniyor  `@deeplink`

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

- L1+L3: "Send SMS" /channels/sms ("SMS Configuration") sayfasına götürüyor  `@regression`
- L1+L3: "Create Campaign" /campaigns/outbound ("Outbound Campaigns") sayfasına götürüyor  `@regression`
- L1+L3: "View Reports" /reports ("Reports") sayfasına götürüyor  `@regression`

### `dashboard.authed.spec.js`

- oturum geçerli — giriş formu görünmüyor  `@smoke`
- başlık + alt başlık + kullanıcı menüsü görünüyor  `@smoke` `@critical`
- tarih aralığı + Live toggle görünüyor (Today / 7 Days / 30 Days / Live)  `@smoke`
- 4 üst KPI döşemesi görünüyor  `@smoke`
- hızlı eylemler görünüyor (Start Call butonu + 3 gezinme linki)  `@smoke`
- ana bölüm başlıkları görünüyor (Queue/Agent/Call Volume/Insights/AI/Activity)  `@smoke`
- kenar menüsü tüm ana bölümleri doğru href ile içeriyor  `@critical`
- sayfada sessiz hata yok (console-error / failed-request / 5xx)  `@smoke` `@clean`
- üst KPI döşemeleri değer gösteriyor  `@data` `@regression`
- "Analytics Insights" KPI döşemeleri değer gösteriyor  `@data` `@regression`
- "/" doğrudan URL ile açılıyor ve Dashboard render oluyor  `@deeplink` `@regression`
- [en] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili  `@i18n` `@regression`
- [tr] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili  `@i18n` `@regression`
- [fr] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili  `@i18n` `@regression`
- [ar] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili  `@i18n` `@regression`
- L1 tıklama OK: "Start Call" softphone dialer'ını açıyor (tuş takımı görünür)  `@regression`
- ciddi/kritik axe ihlali yok (bilinen borç hariç)  `@a11y` `@regression`
- [desktop] yatay taşma yok  `@layout` `@regression`
- [mobile] yatay taşma yok  `@layout` `@regression`
- [ar/rtl desktop] yatay taşma yok  `@layout` `@regression`
- içerik (başlık) makul bütçe içinde görünüyor  `@perf` `@regression`
- canlı veri ucu 500 dönerse sayfa yine de yükleniyor (çökmüyor)  `@errorpath` `@regression`
- BULGU DASH-CLICKHOUSE: iç terim "ClickHouse" Dashboard'da görünmemeli  `@regression` `@known-bug`
- BULGU DASH-AI-I18N [tr]: AI metrik etiketleri tr arayüzde çevrili olmalı  `@regression` `@known-bug`
- BULGU DASH-AI-I18N [fr]: AI metrik etiketleri fr arayüzde çevrili olmalı  `@regression` `@known-bug`
- BULGU DASH-AI-I18N [ar]: AI metrik etiketleri ar arayüzde çevrili olmalı  `@regression` `@known-bug`

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
- AI-PROMPTS-CONSOLE · /ai/prompts · konsolda MALFORMED_ARGUMENT (ICU) hatası olmamalı  `@regression` `@known-bug`
- B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı  `@regression` `@known-bug`
- B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli  `@regression` `@known-bug`
- SETTINGS-BILLING-REDIRECT · /settings/billing deep-link kök sayfaya atmamalı  `@regression` `@known-bug`
- SETTINGS-BILLING-CHANGEPLAN · Ayarlar "Change plan" kök sayfaya atmamalı  `@regression` `@known-bug`
- SETTINGS-BILLING-HISTORY · Ayarlar "Billing history" kök sayfaya atmamalı  `@regression` `@known-bug`

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

### `registered-routes-smoke.authed.spec.js`

- [route:/] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/inbox] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/voice] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/ai] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/campaigns] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/bot-builder] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/contacts] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/tickets] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/analytics] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/supervisor] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/workforce] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/dashboards] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/call] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/agent] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/queue] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/campaign] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/channel] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/ai] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/quality] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/csat] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/billing] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/reports/sla] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/profile] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/organization] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/users] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/roles] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/compliance] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/teams] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/hours] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/automations] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/sla] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/templates] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/disposition-codes] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/canned-responses] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/integrations] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/security] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/data-retention] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/notifications] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/api-keys] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/webhooks] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/settings/audit] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/workforce/schedules] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/workforce/time-off] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/workforce/surveys] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/workforce/badges] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/workforce/evaluations] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels/webchat] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels/email] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels/sms] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels/whatsapp] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels/social] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/channels/video] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/voice/queues] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/voice/history] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/voice/voicemail] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`
- [route:/voice/recordings] kayıtlı rota read-only baseline  `@smoke` `@route-baseline`

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

### `settings-api-keys.authed.spec.js`

- sayfa başlığı + Create Key + boş-durum ile açılıyor  `@smoke`
- L1 tıklama OK: dialog açılıyor (Key name/Permissions + Create Key disabled)  `@regression`
- [en] başlık + yön + alt başlık + Create/Generate çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Create/Generate çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Create/Generate çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Create/Generate çevrili  `@i18n`
- Create Key dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- api-keys ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Create Key dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/api-keys doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`
- Create Key dialogu görünümü değişmedi  `@visual`

### `settings-audit.authed.spec.js`

- sayfa başlığı + Export + tablo ile açılıyor  `@smoke`
- tablo kolonları + en az bir log satırı görünüyor  `@critical`
- L1 tıklama OK: "View" → "Change details" dialogu açılıyor  `@regression`
- Export tıklanınca audit-log CSV indiriliyor  `@export`
- [en] başlık + yön + alt başlık + kolonlar + Export çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + kolonlar + Export çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + kolonlar + Export çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + kolonlar + Export çevrili  `@i18n`
- "Full Export" butonu Türkçede çevrili olmalı (şu an İngilizce)  `@i18n` `@known-bug`
- View dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- audit-logs ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- View dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/audit doğrudan açılınca log yükleniyor (login'e düşmüyor)  `@deeplink`

### `settings-automations.authed.spec.js`

- sayfa başlığı + 2 sekme + New Rule ile açılıyor  `@smoke`
- Rules sekmesi boş-durum, SLA Policies sekmesi tabloyu gösteriyor  `@critical`
- L1: sekmeler tıklanınca aria-selected=true  `@regression`
- L1: New Rule dialogu açılıyor (Rule Name + Save Rule disabled)  `@regression`
- [en] başlık + yön + alt başlık + sekmeler + New Rule çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + sekmeler + New Rule çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + sekmeler + New Rule çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + sekmeler + New Rule çevrili  `@i18n`
- New Rule dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ve New Rule dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- otomasyon ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- New Rule dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/automations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`
- Rules boş-durumu görünümü değişmedi  `@visual`

### `settings-canned-responses.authed.spec.js`

- sayfa başlığı + New canned response + tablo/boş-durum ile açılıyor  `@smoke`
- tablo kolonları görünüyor  `@critical`
- L1 tıklama OK: dialog açılıyor (Title/Shortcode + Create disabled)  `@regression`
- [en] başlık + yön + alt başlık + kolonlar + New çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + kolonlar + New çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + kolonlar + New çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + kolonlar + New çevrili  `@i18n`
- Create dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- canned ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Create dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/canned-responses doğrudan açılınca liste yükleniyor (login'e düşmüyor)  `@deeplink`
- Create dialogu görünümü değişmedi  `@visual`

### `settings-compliance.authed.spec.js`

- sayfa başlığı + tüm bölümler render ediliyor  `@smoke`
- bölüm eylem butonları görünüyor (Log Consent / Create Request)  `@critical`
- L3: "Manage Retention" → /settings/data-retention sayfasını yüklüyor  `@regression`
- L3: "View More" → /settings/audit sayfasını yüklüyor  `@regression`
- L1: Log Consent dialogu açılıyor (alanlar + Log Consent disabled)  `@regression`
- L1: Create Request dialogu açılıyor (alanlar + Export Data disabled)  `@regression`
- L3 (kalıcı kayıt) N/A: prod salt-okunur — staging lane'ine bırakıldı  `@regression`
- [en] başlık + yön + alt başlık + eylem butonları çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + eylem butonları çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + eylem butonları çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + eylem butonları çevrili  `@i18n`
- Log Consent dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ve Log Consent dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- onay listesi ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Log Consent dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/compliance doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`

### `settings-data-retention.authed.spec.js`

- sayfa başlığı + saklama süreleri + Save changes ile açılıyor  `@smoke`
- 5 saklama-süresi spinbutton'u değerleriyle görünüyor + Run cleanup mevcut  `@critical`
- L1: Save changes + Run cleanup now + Automatic Cleanup switch mevcut (tıklanmıyor)  `@regression`
- [en] başlık + yön + alt başlık + Save changes çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Save changes çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Save changes çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Save changes çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- retention ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- /settings/data-retention doğrudan açılınca form yükleniyor (login'e düşmüyor)  `@deeplink`
- saklama-süresi formu görünümü değişmedi  `@visual`

### `settings-disposition-codes.authed.spec.js`

- sayfa başlığı + Add Code + tablo ile açılıyor  `@smoke`
- tablo kolonları + bilinen kodlar (SALE/NO_ANSWER) görünüyor  `@critical`
- L1 tıklama OK: dialog açılıyor (Code/Label alanları + Create)  `@regression`
- [en] başlık + yön + alt başlık + kolonlar + Add çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + kolonlar + Add çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + kolonlar + Add çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + kolonlar + Add çevrili  `@i18n`
- Add Code dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- kod ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Add Code dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/disposition-codes doğrudan açılınca liste yükleniyor (login'e düşmüyor)  `@deeplink`
- Add Code dialogu görünümü değişmedi  `@visual`

### `settings-hours.authed.spec.js`

- sayfa başlığı + haftalık program + Save changes ile açılıyor  `@smoke`
- 7 günlük Open switch'i var; Pzt-Cum açık, Cmt/Paz kapalı  `@critical`
- Holiday Calendar bölümü + Add (boşken disabled)  `@regression`
- [en] başlık + yön + alt başlık + Save/Add çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Save/Add çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Save/Add çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Save/Add çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- business-hours ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Timezone combobox açılıp Escape ile kapanıyor  `@keyboard`
- /settings/hours doğrudan açılınca form yükleniyor (login'e düşmüyor)  `@deeplink`
- haftalık program görünümü değişmedi  `@visual`

### `settings-integrations.authed.spec.js`

- sayfa başlığı + entegrasyon kartları + Webhook bölümü ile açılıyor  `@smoke`
- Webhook tablosu kolonları + boş-durum  `@critical`
- L3: "Manage API Keys" → /settings/api-keys yüklüyor  `@regression`
- L1: Request Access "Request … Integration" dialogunu açıyor (Submit tıklanmaz)  `@regression`
- L1: Add Webhook dialogu açılıyor (URL/Secret/Events)  `@regression`
- [en] başlık + yön + alt başlık + Request Access + Add Webhook çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Request Access + Add Webhook çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Request Access + Add Webhook çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Request Access + Add Webhook çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- webhooks ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Add Webhook dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/integrations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`
- Request Access dialogu görünümü değişmedi  `@visual`

### `settings-notifications.authed.spec.js`

- sayfa başlığı + Email Category Preferences + Save ile açılıyor  `@smoke`
- kategori switch'leri + Delivery Channels bölümü görünüyor  `@critical`
- L1: Save preferences + Enable push + kategori switch'leri mevcut (tıklanmıyor)  `@regression`
- [en] başlık + yön + alt başlık + Save + Enable push çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Save + Enable push çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Save + Enable push çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Save + Enable push çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- tercihler ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- /settings/notifications doğrudan açılınca form yükleniyor (login'e düşmüyor)  `@deeplink`

### `settings-organization.authed.spec.js`

- sayfa "Organization" başlığı + Company Information formu ile açılıyor  `@smoke`
- form alanları render ediliyor (Company name/Website/Domain + Save)  `@critical`
- L1 tıklama OK: Save changes formda değişiklik olunca aktifleşiyor (dirty)  `@regression`
- L2 arka plan OK: sayfa açılınca kuruluş ayarları çekiliyor  `@regression`
- L1 tıklama OK: Currency açılınca para birimi seçenekleri listeleniyor  `@regression`
- [en] başlık + yön + alt başlık + bölüm + Save çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + bölüm + Save çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + bölüm + Save çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + bölüm + Save çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- kuruluş ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Currency popover Escape ile kapanıyor  `@keyboard`
- /settings/organization doğrudan açılınca form yükleniyor (login'e düşmüyor)  `@deeplink`
- Company Information formu görünümü değişmedi  `@visual`

### `settings-profile.authed.spec.js`

- sayfa "Profile" başlığı + 4 alt sekme ile açılıyor  `@smoke`
- User menu → Profile navigasyonu sayfayı yüklüyor  `@smoke`
- Profile sekmesi kişisel-bilgi formunu render ediyor  `@critical`
- L1 tıklama OK: her sekme tıklanınca aria-selected=true  `@regression`
- L3 görev OK: her sekme paneli KENDİ içerik imzasını gösteriyor  `@regression`
- L2 arka plan OK: Sessions sekmesi oturum listesini çekiyor  `@regression`
- L1 tıklama OK: Timezone açılınca seçenekler listeleniyor (UTC dahil)  `@regression`
- L1 tıklama OK: Language açılınca çok-dilli seçenekler listeleniyor  `@regression`
- L3 görev OK: link /settings/notifications sayfasını yüklüyor  `@regression`
- Save/Password/2FA/Revoke kontrolleri MEVCUT ama tıklanmıyor (yan-etki)
- [en] başlık + yön + sekmeler + panel imzaları çevrili  `@i18n`
- [tr] başlık + yön + sekmeler + panel imzaları çevrili  `@i18n`
- [fr] başlık + yön + sekmeler + panel imzaları çevrili  `@i18n`
- [ar] başlık + yön + sekmeler + panel imzaları çevrili  `@i18n`
- sayfada ve her alt sekmede ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- profil ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- oturum ucu 500 dönerse Sessions sekmesi zarifçe çöküyor (tablo yok)  `@errorpath`
- sekmeler ok tuşlarıyla gezilebiliyor (Radix roving tabindex)  `@keyboard`
- Language popover Escape ile kapanıyor  `@keyboard`
- /settings/profile doğrudan açılınca profil yükleniyor (login'e düşmüyor)  `@deeplink`
- Profile sekmesi kişisel-bilgi kartı görünümü değişmedi  `@visual`

### `settings-roles.authed.spec.js`

- sayfa "Role Management" başlığı + rol tablosu ile açılıyor  `@smoke`
- tablo kolonları + sistem rolleri (ADMIN/AGENT/OWNER…) görünüyor  `@critical`
- L1: sistem rolünde Edit/Reset var, Delete DISABLED (silinemez)  `@regression`
- L1 tıklama OK: dialog açılıyor (Ad/Açıklama + izin kategorileri + Save)  `@regression`
- UI rol satırı sayısı, /roles yanıtındaki rol sayısıyla eşleşiyor  `@data`
- [en] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili  `@i18n`
- Create Role dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ve Create Role dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- roller ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Create Role dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/roles doğrudan açılınca liste yükleniyor (login'e düşmüyor)  `@deeplink`

### `settings-security.authed.spec.js`

- sayfa başlığı + Password Policies + Save (disabled) ile açılıyor  `@smoke`
- bölümler: Session Management / IP Whitelist / API Keys görünüyor  `@critical`
- L3: "Open Contacts" → /contacts; "Manage API Keys" → /settings/api-keys  `@regression`
- L1: Add IP dialogu açılıyor (IP/CIDR + Add to Whitelist disabled)  `@regression`
- [en] başlık + yön + alt başlık + Save Policy + Add IP çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Save Policy + Add IP çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Save Policy + Add IP çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Save Policy + Add IP çevrili  `@i18n`
- Add IP dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali olmamalı (şu an: label/critical spinbutton)  `@a11y` `@known-bug`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- security ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Add IP dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/security doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`
- Add IP dialogu görünümü değişmedi  `@visual`

### `settings-sla.authed.spec.js`

- sayfa "SLA Policies" başlığı + New Policy + tablo ile açılıyor  `@smoke`
- tablo beklenen kolonları + en az bir politika satırı  `@critical`
- /sla ucu çağrılıyor ve politika satır(lar)ı render ediliyor  `@data`
- L1 tıklama OK: dialog açılıyor (Policy name + Create policy disabled)  `@regression`
- [en] başlık + yön + alt başlık + kolonlar + New Policy çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + kolonlar + New Policy çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + kolonlar + New Policy çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + kolonlar + New Policy çevrili  `@i18n`
- New Policy dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- New Policy dialogunda ciddi a11y ihlali olmamalı  `@a11y` `@known-bug`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- sla ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- New Policy dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/sla doğrudan açılınca liste yükleniyor (login'e düşmüyor)  `@deeplink`
- New Policy dialogu görünümü değişmedi  `@visual`

### `settings-teams.authed.spec.js`

- sayfa "Teams" başlığı + Create Team + ekip kartı ile açılıyor  `@smoke`
- en az bir ekip kartı üye sayısıyla görünüyor  `@critical`
- L1 tıklama OK: dialog açılıyor (Ad/Açıklama + Create disabled)  `@regression`
- [en] başlık + yön + alt başlık + Create butonu çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Create butonu çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Create butonu çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Create butonu çevrili  `@i18n`
- Create Team dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ve Create Team dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- ekip listesi 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Create Team dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/teams doğrudan açılınca liste yükleniyor (login'e düşmüyor)  `@deeplink`
- Create Team dialogu görünümü değişmedi  `@visual`

### `settings-templates.authed.spec.js`

- sayfa başlığı + üst sekmeler + New Template ile açılıyor  `@smoke`
- şablon tablosu kolonları + boş-durum  `@critical`
- L1: üst sekmeler tıklanınca aria-selected=true  `@regression`
- L1: New Template dialogu açılıyor (Name + Create disabled)  `@regression`
- [en] başlık + yön + alt başlık + üst sekmeler + New Template çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + üst sekmeler + New Template çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + üst sekmeler + New Template çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + üst sekmeler + New Template çevrili  `@i18n`
- içerik alanı placeholder'ı ham anahtar "settings.templatesPage.contentPlaceholder" GÖSTERMEMELİ  `@i18n` `@known-bug`
- New Template dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- şablon ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- New Template dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/templates doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`
- New Template dialogu görünümü değişmedi  `@visual`

### `settings-users.authed.spec.js`

- sayfa "Users & Roles" başlığı + üye tablosu ile açılıyor  `@smoke`
- tablo beklenen kolonları gösteriyor + en az bir üye satırı  `@critical`
- L1+L3 görev OK: ada göre arama eşleşen üyeyi süzüyor  `@regression`
- L1 tıklama OK: Invite User dialogu açılıyor (Email/Role/Team + Send disabled)  `@regression`
- L3 (kalıcı davet) N/A: prod salt-okunur — staging mutation lane'ine bırakıldı  `@regression`
- [en] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili  `@i18n`
- davet dialogundaki kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ve davet dialogunda ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- kullanıcı listesi 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- davet dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/users doğrudan açılınca liste yükleniyor (login'e düşmüyor)  `@deeplink`
- davet dialogu görünümü değişmedi  `@visual`

### `settings-webhooks.authed.spec.js`

- sayfa başlığı + Add Webhook + boş-durum ile açılıyor  `@smoke`
- L1 tıklama OK: dialog açılıyor (URL + Events + Create webhook disabled)  `@regression`
- [en] başlık + yön + alt başlık + Add Webhook çevrili  `@i18n`
- [tr] başlık + yön + alt başlık + Add Webhook çevrili  `@i18n`
- [fr] başlık + yön + alt başlık + Add Webhook çevrili  `@i18n`
- [ar] başlık + yön + alt başlık + Add Webhook çevrili  `@i18n`
- Add Webhook dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")  `@i18n` `@known-bug`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- webhooks ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- Add Webhook dialogu odak tuzağı ve Escape ile kapanma  `@keyboard`
- /settings/webhooks doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`
- Add Webhook dialogu görünümü değişmedi  `@visual`

### `settings.authed.spec.js`

- sayfa "Settings" başlığıyla açılıyor  `@smoke`
- tüm sekmeler görünüyor  `@critical`
- L1+L3: her sekme tıklanınca seçili oluyor VE paneli o içeriği gösteriyor  `@regression`
- L3 görev OK: "Organization" paneli → /settings/organization (başlık "Organization")  `@regression`
- L3 görev OK: "Security" paneli → /settings/security (başlık "Security")  `@regression`
- L3 görev OK: "API Keys" paneli → /settings/api-keys (başlık "API Keys")  `@regression`
- [en] başlık + yön + 6 sekme etiketi çevrili  `@i18n`
- [tr] başlık + yön + 6 sekme etiketi çevrili  `@i18n`
- [fr] başlık + yön + 6 sekme etiketi çevrili  `@i18n`
- [ar] başlık + yön + 6 sekme etiketi çevrili  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstünde sayfa yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- billing/subscription 500 dönse de hub sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- sekmelerde ok tuşu odağı taşıyor ve seçimi değiştiriyor (aria-selected)  `@keyboard`
- /settings doğrudan açılınca hub yükleniyor (login'e düşmüyor)  `@deeplink`

### `supervisor-agent-live.authed.spec.js`

- başlık ve alt başlık görünüyor  `@smoke` `@critical`
- canlı AI çağrısı yokken boş-durum gösteriliyor
- [en] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- [tr] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- [fr] başlık + yön + alt başlık + boş-durum çevrili  `@regression`
- [ar] başlık + yön + alt başlık + boş-durum çevrili  `@regression`

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

### `voice-history.authed.spec.js`

- sayfa "Call History" başlığı + alt-başlık + yön filtreleri ile açılıyor  `@smoke`
- GET /voice/calls çağrılıyor + geçmiş tablosu render ediliyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- VOICE-HISTORY-A11Y-LABEL · /voice/history · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- L1: "Details" tıklanınca dialog açılıyor; klavye ile kapanıyor  `@regression` `@keyboard`
- L1: yön filtresi combobox'u açılıp seçim yapılabiliyor; tablo sağlam  `@regression`
- GET /voice/calls 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /voice/history doğrudan açılınca yükleniyor  `@deeplink`

### `voice-queues.authed.spec.js`

- sayfa "Queues" başlığı + alt-başlık + "Create Queue" ile açılıyor  `@smoke`
- GET /queues çağrılıyor + en az bir kuyruk kartı render ediliyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok (bilinen borç hariç)  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- L1: "Create Queue" tıklanınca dialog açılıyor; klavye ile kapanıyor (gönderilmez)  `@regression` `@keyboard`
- GET /queues 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /voice/queues doğrudan açılınca yükleniyor  `@deeplink`

### `voice-recordings.authed.spec.js`

- sayfa "Call Recordings" başlığı + alt-başlık ile açılıyor  `@smoke`
- GET /voice/recordings çağrılıyor + tablo render ediliyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- VOICE-RECORDINGS-A11Y-LABEL · /voice/recordings · form alanları erişilebilir etiket taşımalı (label)  `@a11y` `@known-bug`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- "Download" tıklanınca kayıt stream ucu (GET .../recordings/<id>/stream) çağrılıyor  `@export`
- L1: "Delete Recording" tıklanınca onay alertdialog'u açılıyor; klavye ile kapanıyor (ONAYLANMAZ)  `@regression` `@keyboard`
- GET /voice/recordings 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /voice/recordings doğrudan açılınca yükleniyor  `@deeplink`

### `voice-subnav.authed.spec.js`

- "Live Calls" → /voice/live ("Live Calls") panelini açıyor  `@regression`
- "Queues" → /voice/queues ("Queues") panelini açıyor  `@regression`
- "IVR Builder" → /voice/ivr ("IVR Builder") panelini açıyor  `@regression`
- "Phone Numbers" → /voice/dids ("Phone Numbers") panelini açıyor  `@regression`
- "Call History" → /voice/history ("Call History") panelini açıyor  `@regression`
- "Voicemails" → /voice/voicemail ("Voicemails") panelini açıyor  `@regression`
- "Recordings" → /voice/recordings ("Call Recordings") panelini açıyor  `@regression`
- "SIP Trunks" → /voice/sip-trunks ("SIP Trunks") panelini açıyor  `@regression`
- "SIP settings" → /voice/sip-settings ("SIP & phone settings") panelini açıyor  `@regression`
- "Skills" → /voice/skills ("Skills-Based Routing") panelini açıyor  `@regression`

### `voice-voicemail.authed.spec.js`

- sayfa "Voicemails" başlığı + alt-başlık ile açılıyor  `@smoke`
- GET /voicemails çağrılıyor + tablo render ediliyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok (bilinen borç hariç)  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- VOICEMAIL-PAGER-I18N · /voice/voicemail · açılışta ham i18n pager anahtarı / MISSING_MESSAGE olmamalı  `@clean` `@known-bug`
- L1: "All Status" filtresi açılıp seçim yapılabiliyor; sayfa sağlam  `@regression`
- GET /voicemails 500 dönse de kabuk + başlık sağlam  `@errorpath`
- /voice/voicemail doğrudan açılınca yükleniyor  `@deeplink`

### `voice.authed.spec.js`

- /voice, "Live Calls" başlığı + alt-başlık + boş durum ile açılıyor  `@smoke`
- Voice alt-navigasyonunun 10 hedefi görünüyor  `@smoke`
- canlı istatistik ucu çağrılıyor + "Agents Available" döşemesi DEĞER gösteriyor  `@data`
- [en] başlık + yön + alt başlık çevrili  `@i18n`
- [tr] başlık + yön + alt başlık çevrili  `@i18n`
- [fr] başlık + yön + alt başlık çevrili  `@i18n`
- [ar] başlık + yön + alt başlık çevrili  `@i18n`
- ciddi/kritik a11y ihlali yok (bilinen borç hariç)  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- canlı çağrı ucu 500 dönse de kabuk + başlık + boş durum sağlam  `@errorpath`
- "Open softphone" düğmesi görünür ve etkin (gerçek çağrı tetiklenmez)  `@regression`
- /voice doğrudan açılınca /voice/live yüklüyor  `@deeplink`

### `workforce-badges.authed.spec.js`

- L1: sayfa + iki sekme (Rozetler/Sıralama) + oluştur/ver butonları  `@smoke` `@regression`
- L1: "Rozet oluştur" formu açılıyor (Ad + Kategori + Puan)  `@smoke` `@regression`
- L1: "Rozet ver" formu açılıyor (Rozet + Temsilci + Neden)  `@smoke` `@regression`
- L2 arka plan OK: sayfa açılışında rozet listesi API'den çekiliyor  `@smoke` `@regression` `@critical`
- bir rozet satırı en az bir aksiyon (düzenle/sil) kontrolü sunmalı  `@regression`
- [en] doğru yazı yönü + başlık görünür  `@i18n`
- [tr] doğru yazı yönü + başlık görünür  `@i18n`
- [fr] doğru yazı yönü + başlık görünür  `@i18n`
- [ar] doğru yazı yönü + başlık görünür  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- rozet listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor)  `@errorpath`
- Rozet oluştur diyaloğu Escape ile kapanıyor  `@keyboard`
- /workforce/badges doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`

### `workforce-evaluations.authed.spec.js`

- L1: sayfa + "Değerlendirme Oluştur" + "YZ Değerlendirmesi Başlat"  `@smoke` `@regression`
- L1: "Kalite Değerlendirmesi Oluştur" formu açılıyor (Interaction ID + Agent + Puan)  `@smoke` `@regression`
- L2 arka plan OK: sayfa açılışında değerlendirme listesi API'den çekiliyor  `@smoke` `@regression` `@critical`
- [en] doğru yazı yönü + başlık görünür  `@i18n`
- [tr] doğru yazı yönü + başlık görünür  `@i18n`
- [fr] doğru yazı yönü + başlık görünür  `@i18n`
- [ar] doğru yazı yönü + başlık görünür  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- değerlendirme listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor)  `@errorpath`
- Değerlendirme Oluştur diyaloğu Escape ile kapanıyor  `@keyboard`
- /workforce/evaluations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`

### `workforce-schedules.authed.spec.js`

- L1: standalone sayfa yükleniyor + hafta nav + Programı Yayınla görünür  `@smoke` `@regression`
- L2 arka plan OK: sayfa açılışında haftalık çizelge API'den çekiliyor  `@smoke` `@regression` `@critical`
- [en] doğru yazı yönü + başlık görünür  `@i18n`
- [tr] doğru yazı yönü + başlık görünür  `@i18n`
- [fr] doğru yazı yönü + başlık görünür  `@i18n`
- [ar] doğru yazı yönü + başlık görünür  `@i18n`
- boş vardiya "+" hücresi buton rolü + klavye erişimi + erişilebilir ad taşımalı  `@a11y` `@keyboard`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- çizelge ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor)  `@errorpath`
- /workforce/schedules doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`

### `workforce-surveys.authed.spec.js`

- L1: sayfa yükleniyor ve "Anket oluştur" formu açılıyor (Ad + Gönder)  `@smoke` `@regression`
- L2 arka plan OK: sayfa açılışında anket listesi API'den çekiliyor  `@smoke` `@regression` `@critical`
- satır aksiyon ikonları erişilebilir ad taşımalı  `@regression`
- [en] doğru yazı yönü + başlık görünür  `@i18n`
- [tr] doğru yazı yönü + başlık görünür  `@i18n`
- [fr] doğru yazı yönü + başlık görünür  `@i18n`
- [ar] doğru yazı yönü + başlık görünür  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok (bilinen ikon-adı borcu hariç)  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- anket listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor)  `@errorpath`
- Anket oluştur diyaloğu Escape ile kapanıyor  `@keyboard`
- /workforce/surveys doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`

### `workforce-time-off.authed.spec.js`

- L1: standalone sayfa + "İzin talep et" formu açılıyor  `@smoke` `@regression`
- L2 arka plan OK: sayfa açılışında izin listesi API'den çekiliyor  `@smoke` `@regression` `@critical`
- [en] doğru yazı yönü + başlık görünür  `@i18n`
- [tr] doğru yazı yönü + başlık görünür  `@i18n`
- [fr] doğru yazı yönü + başlık görünür  `@i18n`
- [ar] doğru yazı yönü + başlık görünür  `@i18n`
- sayfada ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- izin listesi ucu 500 dönerse sayfa çökmüyor (login'e düşmüyor)  `@errorpath`
- İzin talep et diyaloğu Escape ile kapanıyor  `@keyboard`
- /workforce/time-off doğrudan açılınca sayfa yükleniyor (login'e düşmüyor)  `@deeplink`

### `workforce.authed.spec.js`

- başlık ve 7 sekme görünüyor  `@smoke`
- Schedules çizelgesi ve Publish butonu mevcut  `@critical`
- [en] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@i18n` `@regression`
- [tr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@i18n` `@regression`
- [fr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@i18n` `@regression`
- [ar] başlık + yazı yönü + sekmeler + oluşturma formu çevrili  `@i18n` `@regression`
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
- sekme açılıyor; aralık kontrolleri + veri/boş-durum görünür  `@regression`
- adherence ucu 500 dönse de sekme çökmüyor  `@regression` `@errorpath`
- sekme açılıyor; KPI kartları + saatlik tahmin tablosu görünür  `@regression`
- KPI kartları veri kaynağını gösteriyor (boş tenant'ta 0 değerleri)  `@regression`
- Türkçe seçiliyken Uyum paneli İngilizce fallback göstermemeli  `@i18n` `@regression`
- aktif 7d/14d/30d aralığı erişilebilir seçili-durum sinyali taşımalı  `@a11y` `@regression`
- sayfada ve Uyum/Tahmin sekmelerinde ciddi/kritik a11y ihlali yok  `@a11y`
- mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor  `@layout`
- sayfa yüklenirken console/ağ hatası yok (allowlist dışı)  `@clean`
- Add Shift diyaloğu Escape ile kapanıyor  `@keyboard`
- çizelge ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor)  `@errorpath`
- /workforce doğrudan açılınca yükleniyor (login'e düşmüyor)  `@deeplink`

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
