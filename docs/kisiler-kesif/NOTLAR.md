# Kişiler (Contacts / People) — Keşif Notları

- **Ortam:** app.vomenta.com (canlı = **production**), route `/contacts` (= "People")
- **Tarih:** 28 Tem 2026
- **Yöntem:** Kayıtlı oturumla Playwright (salt-okunur); 4 dilde ekran görüntüsü + metin dökümü + network incelemesi. Oluşturma formu (`/contacts/new`) ve içe-aktarma sayfası (`/contacts/import`) açılıp incelendi — **hiçbir form submit edilmedi**, canlıya kayıt bırakılmadı. Silme kontrolü (`contacts.delete`) gerçek kişide **tıklanmadı**.
- **Diller:** 🇬🇧 English · 🇹🇷 Türkçe · 🇫🇷 Français · 🇸🇦 العربية (RTL)
- **API host:** `https://api.vomenta.com` (uygulama `app.vomenta.com`'da; kişiler API'si ayrı origin).

## Özet

Kişiler LİSTE sayfası **büyük ölçüde sağlam**: 4 dilde tam yerelleştirilmiş (başlık, alt başlık, 7 kolon, arama, araç çubuğu butonları, boş-durum, sayfalama, "New Contact" formu), Arapça **RTL** doğru aynalanıyor, yatay **taşma yok** (768/1024/1280 — responsive kolon gizleme). Arama/filtre/sıralama sunucu taraflı ve doğru uçları tetikliyor.

**2 çeviri sızıntısı (bulgu) tespit edildi** — ikisi de ham i18n anahtarı, 4 dilde de son kullanıcıya görünüyor:
1. 🐞 **`callContact`** — liste satırındaki telefon (ara) butonunun `aria-label`'i ham anahtar (a11y + i18n).
2. 🐞 **`contacts.delete`** — kişi **detay** sayfası Quick Actions'taki **Sil** butonu ham anahtarı gösteriyor (görünür metin).

Ayrıca birkaç a11y/tutarlılık gözlemi aşağıda.

## Bölümün yapısı

- **Başlık:** "Contacts" + alt başlık "Manage your contacts and customer information".
- **Kenar çubuğu alt-navigasyonu (Contacts grubu, "kişiler altındakiler"):**
  | Etiket (en) | Route |
  |---|---|
  | Contacts | `/contacts` |
  | **People** | `/contacts` ⚠️ (Contacts ile **aynı** href — bkz. Gözlem O3) |
  | Contact Groups | `/contacts/groups` |
  | Companies | `/contacts/companies` |
  | Segments | `/contacts/segments` |
  | Custom fields | `/contacts/custom-fields` |
- **Araç çubuğu (sağ üst):** Segments · Import · Export · **Add Contact** (birincil).
- **Kart üstü:** arama kutusu · **liste/ızgara görünüm değiştirici** (2 ikon buton) · tag filtre chip'leri (VIP · Enterprise · Customer · Lead · Prospect) · **All Companies** dropdown · **Name** sıralama chip'i.
- **Tablo (7 kolon):** Name · Email · Phone · Company · Tags · Owner · Last Contact. Satır başı: seçim checkbox'ı + avatar/ad; telefonu olan satırlarda **ara (telefon) butonu**. Satıra tıklama → kişi detayı.
- **Sayfalama:** "Showing 1–6 of 6 contacts" + "1 / 1" + prev/next ok'ları (tek sayfada pasif).

## Kontrol envanteri + 3 katman haritası (AGENTS.md standardı)

| # | Kontrol | L1 (tıklama/tepki) | L2 (arka plan) | L3 (görev) |
|---|---|---|---|---|
| 1 | **Arama** | metin girince liste süzülür + "Clear" çıkar | `GET /contacts?...filters={"search":"…"}` | eşleşen satır görünür / eşleşmezse boş-durum |
| 2 | **Tag chip** (VIP…) | chip aktif stile geçer ⚠️(aria-pressed yok) | `GET /contacts?...filters={"tags":["VIP"]}` | liste süzülür / boş-durum |
| 3 | **Company dropdown** | listbox açılır (`role=option`) | `GET /contacts?...` (şirket filtresi) | liste süzülür |
| 4 | **Sort chip** ("Name") | döngü: etiket/alan değişir | `GET /contacts?...sort=[{"orderBy":"lastContactedAt",…}]` | liste yeniden sıralanır |
| 5 | **Görünüm değiştirici** (liste/ızgara) | aktif ikon değişir | **N/A** (istemci-tarafı) | düzen ızgara kartlara döner |
| 6 | **Add Contact** | `/contacts/new` formuna gider | `POST /contacts` (Save'de; route ile yakalanır) | kalıcı kayıt → **opt-in @mutation** (create+delete) |
| 7 | **Import** | `/contacts/import` sayfasına gider (dosya girişli) | **N/A burada** | **N/A** (yükleme = veri değiştirir; belgeli) |
| 8 | **Export** | tıklanınca indirme başlar | `POST /contacts/export` | dosya indirme olayı (`download`) tetiklenir — **veri değiştirmez** |
| 9 | **Segments** (araç çubuğu) | `/contacts/segments`'e gider | (sayfa yüklemesi) | Segments sayfası açılır |
| 10 | **Satır → detay** | `/contacts/{id}`'ye gider | `GET /contacts/{id}` (+ `/timeline` `/notes` `/tickets`) | detay sayfası kişi adını + sekmeleri gösterir |
| 11 | **Satır ara butonu** (`callContact`) | ⚠️ TIKLANMAZ (gerçek arama başlatabilir) | — | — → yalnızca **sızıntı guard'ı** (Bulgu F1) |
| 12 | **Sayfalama** prev/next | tek sayfada pasif | — | **L3 N/A** (yalnızca 6 kişi; ikinci sayfa yok — belgeli) |

## Backend uçları (Network ile doğrulandı, 28 Tem 2026)

```
GET  /api/v1/contacts?page=1&limit=10&sort=[{"orderBy":"firstName","order":"asc"}]   # varsayılan liste
GET  /api/v1/contacts?...&filters={"search":"…"}                                     # arama
GET  /api/v1/contacts?...&filters={"tags":["VIP"]}                                   # tag filtresi
GET  /api/v1/contacts?...&sort=[{"orderBy":"lastContactedAt","order":"asc"}]         # sıralama döngüsü
GET  /api/v1/contacts/{id}  ·  /{id}/timeline  ·  /{id}/notes  ·  /{id}/tickets      # detay
GET  /api/v1/companies?limit=50   ·   /api/v1/users?limit=50   ·   /api/v1/custom-fields
POST /api/v1/contacts/export         # Export (dosya üretir, veri DEĞİŞTİRMEZ)
POST /api/v1/contacts                # Oluşturma (INFERRED — ilk mutation koşusunda teyit edilecek)
DELETE /api/v1/contacts/{id}         # Silme/cleanup (INFERRED — ilk mutation koşusunda teyit edilecek)
```

## 4 dilde durum (i18n)

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| Yön | ltr | ltr | ltr | **rtl** ✓ |
| Başlık | Contacts | Kişiler | Contacts¹ | جهات الاتصال |
| Alt başlık | Manage your contacts and customer information | Kişilerinizi ve müşteri bilgilerinizi yönetin | Gérez vos contacts et informations client | إدارة جهات الاتصال ومعلومات العملاء |
| Arama placeholder | Search by name, email, or phone… | Ad, e-posta veya telefon ile ara… | Rechercher par nom, e-mail ou téléphone… | البحث بالاسم أو البريد أو الهاتف… |
| Kolonlar | Name/Email/Phone/Company/Tags/Owner/Last Contact | Ad/E-posta/Telefon/Şirket/Etiketler/Sorumlu/Son İletişim | Nom/E-mail/Téléphone/Entreprise/Étiquettes/Responsable/Dernier contact | الاسم/البريد الإلكتروني/الهاتف/الشركة/العلامات/المسؤول/آخر تواصل |
| Butonlar | Segments·Import·Export·Add Contact | Segmentler·İçe Aktar·Dışa Aktar·Kişi Ekle | Segments·Importer·Exporter·Ajouter un contact | الشرائح·استيراد·تصدير·إضافة جهة اتصال |
| Boş-durum başlık | No contacts found | Kişi bulunamadı | Aucun contact trouvé | لم يتم العثور على جهات اتصال |
| Boş-durum alt | Try adjusting your search or filters | Arama veya filtrelerinizi ayarlamayı deneyin | Essayez d'ajuster votre recherche ou vos filtres | حاول تعديل البحث أو عوامل التصفية |
| Filtre "Clear" | Clear | Temizle | Effacer | مسح |
| Sayfalama | Showing 1–6 of 6 contacts | 1–6 / 6 kişi gösteriliyor | Affichage de 1–6 sur 6 contacts | عرض 1–6 من 6 جهة اتصال |
| **New Contact** başlık | New Contact | Yeni kişi | Nouveau contact | جهة اتصال جديدة |
| Form alanları | First/Last Name*·Email·Phone·Company·Title·Tags·Owner·Notes | Ad*·Soyad*·E-posta·Telefon·Şirket·Ünvan·Etiketler·Sorumlu·Notlar | Prénom*·Nom*·E-mail·Téléphone·Entreprise·Fonction·Étiquettes·Responsable·Notes | الاسم الأول*·اسم العائلة*·البريد الإلكتروني·الهاتف·الشركة·المسمى الوظيفي·العلامات·المسؤول·ملاحظات |
| Kaydet / İptal | Save Contact / Cancel | Kişiyi kaydet / İptal | Enregistrer le contact / Annuler | حفظ جهة الاتصال / إلغاء |

¹ Fransızca'da "Contacts" zaten geçerli Fransızca (İngilizce ile aynı yazım) → sızıntı değil.

- **Dil mekaniği:** Sayfa taze bağlamda İngilizce açılır. Dil kenar çubuğu alt köşesindeki dil düğmesinden değiştirilir; ayrıca `?lang=en|tr|fr|ar` URL parametresi de dili doğrudan ayarlar (liste + `/contacts/new` çevrildi). Testlerde repo standardına uyup kenar çubuğu **tek switch** kullanılır.
- **Veri ≠ çeviri:** Tag isimleri (VIP/Enterprise/Customer/Lead/Prospect), şirket adları (Acme Corp, test corp) ve kişi isimleri **veri**; çevrilmemeleri sızıntı sayılmaz.
- **Ham anahtar sızıntısı:** yalnızca `callContact` ve `contacts.delete` (aşağıda).

## Bulgular

### 🐞 F1 — `callContact` (liste satırı ara butonu, i18n + a11y)
Her satırdaki telefon (ara) butonu: `<button aria-label="callContact">`. `aria-label` ham i18n anahtarı; **4 dilde de** değişmiyor. Ekran okuyucu "callContact" der; çeviri sızıntısı. → `test.fail` guard (düzelince beklenmedik geçiş).

### 🐞 F2 — `contacts.delete` (kişi detayı Quick Actions "Sil" butonu, i18n)
`/contacts/{id}` → Quick Actions kartında Sil butonu görünür metni **`contacts.delete`** (kırmızı çöp ikonu). Ham anahtar; 4 dilde görünür. Ekran görüntüsü: `screenshots/en-3-contact-detail.png`. → `test.fail` guard.

### ⚠️ O1 — Tag filtre chip'lerinde semantik aktif-durum yok
Chip seçili/aktifken `aria-pressed` (veya role state) yok; yalnızca CSS sınıfı değişiyor. Seçili durum L1'de semantik doğrulanamıyor → frontend'den `data-testid`/`aria-pressed` istenmeli. L2 (network) gerçek etkiyi kanıtlıyor.

### ⚠️ O2 — Sayfalama ok'ları ikon-only, erişilebilir isim yok
Prev/Next düğmeleri yalnızca ikon; erişilebilir isim bulunamadı (a11y). Ayrıca tek sayfa olduğundan L3 (sayfa değiştirme) bu veriyle doğrulanamıyor.

### ⚠️ O3 — "People" ve "Contacts" nav aynı route
Alt-nav'da hem "Contacts" hem "People" `/contacts`'e gidiyor. Muhtemelen tasarım gereği (grup başlığı + ilk çocuk aynı sayfa); yine de çift etiket kafa karıştırıcı — teyit edilmeli. Bulgu değil, gözlem.

### ⚠️ O4 — RTL'de telefon numarası "+" konumu (kozmetik)
Arapça'da numaralar "905…+" biçiminde (artı sağda) render oluyor — yön kaynaklı kozmetik; veri, çeviri değil.

## Ekran görüntüleri (`screenshots/`)

- `{en,tr,fr,ar}-1-contacts.png` — 4 dilde liste (RTL dahil)
- `{en,tr,fr,ar}-2-add-contact.png` — 4 dilde "New Contact" formu
- `en-3-contact-detail.png` — kişi detayı (**`contacts.delete` sızıntısı görünür**)
- `en-4-import.png` — İçe Aktar sayfası
- `en-overflow-{768,1024,1280}.png` — taşma kontrolü (temiz)

## Ek keşif (Export içeriği · Etiketleme · Görünüm)

### Export CSV — içerik & 4 dil (kullanıcı isteği: "indirilen dosyayı aç, doğru mu, dil değişiyor mu, bozulma var mı")
- **Format:** `contacts-export.csv` — UTF-8 **BOM** + Excel `sep=,` satırı, ardından başlık.
- **Başlık:** `id,firstName,lastName,email,phone,company,title,tags,source,isActive,createdAt`.
- **4 dilde BİREBİR AYNI:** en/tr/ar indirmeleri **byte-identical** (md5 aynı, 759 bayt). Yani export **UI diline göre değişmiyor** — alan adları hep İngilizce (CSV/re-import için **doğru** davranış), veri = veri.
- **Bozulma yok:** Türkçe karakterler sağlam (`Tuğçe`, `Uğurlu`). UTF-8 BOM sayesinde Excel de doğru açar.
- **Sonuç:** export dili değişmiyor + bozulma yok = **beklenen davranış** (bulgu değil). Test: indir → BOM + `sep=,` + başlık + bilinen kişi (doğru kodlamayla) + diller arası tutarlılık (regresyon guard'ı).

### Etiketleme akışı
- **New Contact formu:** Tags = `role="combobox"` (placeholder "Add a tag"); yalnızca **önceden tanımlı 5 etiket** (VIP · Enterprise · Customer · Lead · Prospect) — **serbest metin etiket oluşturma YOK** (yazınca liste değişmiyor). Owner = combobox ("Assign an agent").
- **Mevcut kişide:** detay → **Details** sekmesi → "Contact Information" kartında **Edit** butonu (post-creation düzenleme/etiketleme). Bu sekmede de `contacts.delete` (F2) görünür.

### Görünüm değiştirici (liste/ızgara) — a11y (Gözlem O5)
Kart sağ üstünde 2 ikon-only buton (liste/ızgara). **Erişilebilir isim yok** → semantik seçilemiyor; frontend'den `data-testid`/`aria-label` istenmeli. L1 için konumsal (son çare CSS) seçici kullanılır.

## Toplu-eylem çubuğu (satır seçimi) — 29 Tem 2026 eklendi

Satır checkbox'ı seçilince kartın üstünde **toplu-eylem çubuğu** çıkar ("N selected" + 5 buton). İlk keşifte satır seçmediğimiz için atlanmıştı; kullanıcı işaret etti, sonradan eklendi.

| Buton | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar | Aksiyon | Uç |
|---|---|---|---|---|---|---|
| Sayaç | N selected | N seçildi | N sélectionné | N محدد | — | — |
| **Ata** | Assign | Ata | Attribuer | تعيين | dialog "Assign Owner" (owner seç + Confirm/Cancel) | PATCH /contacts/bulk (Confirm'de) |
| **Etiket** | Tag | Etiket | Étiquette | علامة | dialog "Add Tag" (etiket combobox: VIP/Enterprise/Customer/Lead/Prospect + Confirm/Cancel) | **PATCH /contacts/bulk** |
| **Kampanyaya Ekle** | Add to Campaign | Kampanyaya Ekle | Ajouter à la campagne | إضافة إلى الحملة | dialog "Add to Campaign" (kampanya seç + Confirm/Cancel) | PATCH /contacts/bulk |
| **Dışa Aktar** | Export | Dışa Aktar | Exporter | تصدير | seçili export + indirme | **POST /contacts/export** |
| **Sil** | Delete | Sil | Supprimer | حذف | **alertdialog** "Delete Contacts" (Confirm/Cancel) | **DELETE /contacts/{id}** |

- "Tümünü seç" başlık checkbox'ı → tüm satırlar ("6 selected"). 4 dilde buton/sayaç etiketleri çevrili, RTL doğru.
- **Etiketleme asıl yolu bu** (kullanıcı: "yeni eklenen üzerinden etiketleme"): seç → Etiket → VIP → Confirm. Mutation testinde bu akış + toplu Sil kullanılıyor.
- Canlıda uçtan uca doğrulandı (oluştur→toplu etiket→VIP filtre bulur→toplu sil→gider), self-cleaning.

## Planlanan testler (kapsam)

1. **`tests/contacts.authed.spec.js`** (salt-okunur, genişletilecek): yapı + 4 dil i18n guard (RTL + New Contact formu) + kontroller için L1/L2/L3 (arama, tag filtre, company dropdown, sort, görünüm değiştirici, Add Contact→form, Import→sayfa, Export, Segments, satır→detay). F1/F2 sızıntıları `test.fail` guard.
2. **`tests/contacts-mutations.authed.spec.js`** (`@mutation`, opt-in çift kilit): L3 — Add Contact kalıcı kişi oluşturur (`POST /contacts`) + `cleanup` **yalnızca oluşturulan kişiyi** siler (`DELETE /contacts/{id}`). Diğer kişilere dokunulmaz.
3. **Page Object** `ContactsPage.js` genişletilir (I18N sözlüğü, API haritası, kontrol seçicileri, `switchLanguage`, create/delete yardımcıları).
