# Kampanyalar → Giden (`/campaigns/outbound`) — Keşif Notları

> Tarih: 28 Temmuz 2026 · Ortam: canlı `app.vomenta.com` (production) · Yöntem: kayıtlı oturumla (Playwright `storageState`) 4 dilde inceleme + DOM/inspection ölçümü + network yakalama + tam sayfa ekran görüntüsü.
>
> Amaç: Sayfanın **olması gereken** halini kaydetmek, bulguları kanıtlamak ve buna göre regresyon testi yazmak. Uygulama güncellenince bu alanlar bozulursa testler kırmızıya döner ve nerede sorun olduğu anlaşılır.

Ekran görüntüleri: [`screenshots/`](screenshots/)

Bu, **Kampanyalar** bölümünün ilk alt sayfasıdır. Sıradaki alt sayfalar (aynı döngüyle incelenecek): **Şablonlar** (`/campaigns/templates`), **Gönderici Kimlikleri** (`/campaigns/sender-ids`), **DNC Listeleri** (`/campaigns/dnc`).

---

## 1. Sayfanın "olması gereken" hali (yapı)

Başlık (h1): **Outbound Campaigns** · Alt başlık: *Monitor and control active outbound dialing campaigns.*

**Üst özet kartları (4 adet):**
- **Active Campaigns** (Aktif Kampanyalar) — sayı
- **Total Contacts** (Toplam Kişiler) — sayı
- **Connected Calls** (Bağlanan Aramalar) — sayı
- **Avg Connect Rate** (Ort. Bağlanma Oranı) — yüzde

**Filtre/arama çubuğu:**
- **Arama** girişi — placeholder *Search campaigns...* (sunucu-taraflı arama, aşağıya bakın)
- **Tür filtresi** (Radix Select / combobox) — varsayılan *All types*; seçenekler: **All types / Voice / SMS / Email / WhatsApp**
- **Durum sekmeleri** (`role=tab`): **All / Running (n) / Paused (n)** — Running/Paused yanında canlı sayı

**Kampanya tablosu — kolonlar:** Campaign Name · Status · Dialer Mode · Contacts · Connected% · Actions

- **Campaign Name** hücresinde: ad + **tür rozeti** (EMAIL/VOICE/SMS/WhatsApp) + **teslim rozeti** (*Send Now* = hemen gönder) + ilerleme çubuğu (tamamlanma).
- **Status** değerleri: **Draft** (Taslak), **Completed** (Tamamlandı), **Cancelled** (İptal), ayrıca **Running/Paused** (sekmelerden). 
- **Dialer Mode**: ham enum rozeti — **PROGRESSIVE / PREDICTIVE / PREVIEW / POWER / CLICK_TO_CALL** (büyük harf, çevrilmez — veri değeri).
- **Contacts**: `bağlanan / toplam` (örn. `0 / 2`).
- **Connected%**: yüzde (0% kırmızı, 100% yeşil).
- **Actions** (satır işlem ikonları — aşağıdaki a11y bulgusuna bakın):
  - 👁 **göz** (`lucide-eye`) → kampanya detayına gider — **her satırda**.
  - ▶ **play/başlat** (`lucide-play`, yeşil) → **yalnız `Draft` durumundaki satırlarda**; başlatma onay dialogu açar.
  - 🗑 **çöp/sil** (`lucide-trash2`, kırmızı) → silme onay dialogu açar — **her satırda**.

**Sağ üstte:** **New Campaign** (Yeni Kampanya) düğmesi → `/campaigns/create` sihirbazına gider.

**Kenar çubuğu — Campaigns alt menüsü:** Outbound `/campaigns/outbound` · Templates `/campaigns/templates` · Sender IDs `/campaigns/sender-ids` · DNC Lists `/campaigns/dnc`.

---

## 2. 4 Dil Yerelleştirme Durumu

Dil, sunucuda/localStorage'da kalıcı DEĞİL → taze bağlam hep **İngilizce** açılır. Çalışan dil değiştirici: **kenar çubuğu altındaki** metinli düğme (🇬🇧 English / 🇹🇷 Türkçe / …). Bkz. hafıza notu `vomenta-workforce-i18n`.

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| `html[dir]` | ltr | ltr | ltr | **rtl** ✅ |
| `html[lang]` | en | tr | fr | ar |
| Başlık (h1) | Outbound Campaigns | Giden Kampanyalar | Campagnes sortantes | الحملات الصادرة |
| Alt başlık | Monitor and control active outbound dialing campaigns. | Aktif giden arama kampanyalarını izleyin ve kontrol edin. | Surveiller et contrôler les campagnes d'appels sortants actives. | مراقبة والتحكم في حملات الاتصال الصادرة النشطة. |
| Kart: Active Campaigns | Active Campaigns | Aktif Kampanyalar | Campagnes actives | الحملات النشطة |
| Kart: Total Contacts | Total Contacts | Toplam Kişiler | Total contacts | إجمالي جهات الاتصال |
| Kart: Connected Calls | Connected Calls | Bağlanan Aramalar | Appels connectés | المكالمات المتصلة |
| Kart: Avg Connect Rate | Avg Connect Rate | Ort. Bağlanma Oranı | Taux moyen de connexion | متوسط معدل الاتصال |
| Arama placeholder | Search campaigns... | (çevrili) | (çevrili) | البحث عن حملات... |
| Tür filtresi | All types | Tüm türler | Tous les types | جميع الأنواع |
| Sekme: All | All | Tümü | Toutes | الكل |
| Sekme: Running | Running | Çalışan | En cours | قيد التشغيل |
| Sekme: Paused | Paused | Duraklatılmış | En pause | متوقفة مؤقتاً |
| Başlık: Campaign Name | Campaign Name | Kampanya Adı | Nom de la campagne | اسم الحملة |
| Başlık: Status | Status | Durum | Statut | الحالة |
| Başlık: Dialer Mode | Dialer Mode | Arama Modu | Mode de numérotation | وضع الاتصال |
| Başlık: Contacts | Contacts | Kişiler | Contacts | جهات الاتصال |
| Başlık: Connected% | Connected% | Bağlanan% | Connecté% | متصل% |
| Başlık: Actions | Actions | İşlemler | Actions | إجراءات |
| New Campaign | New Campaign | Yeni Kampanya | Nouvelle campagne | حملة جديدة |
| Durum: Draft | Draft | Taslak | Brouillon | مسودة |
| Durum: Completed | Completed | Tamamlandı | (çevrili) | مكتمل |
| Durum: Cancelled | Cancelled | İptal | (çevrili) | ملغى |
| Teslim rozeti: Send Now | Send Now | (çevrili) | (çevrili) | أرسل الآن |

**Genel değerlendirme:** Yerelleştirme **sağlam** — Giden liste sayfasında görünür bir i18n sızıntısı **yok** (Duvar Panosu'ndaki "Refresh All/Auto-scroll" gibi bir açık İngilizce sızıntısına rastlanmadı). Başlık, alt başlık, 4 kart, arama, filtre, sekmeler, tablo başlıkları, durum ve teslim rozetleri dört dilde de çevriliyor. **Arapça RTL doğru** (`dir=rtl`, düzen aynalı: kenar çubuğu sağda, tablo sağdan sola). **Metin taşması / kırpılma yok** (dört dilde de `body` yatay taşması yok, viewport'u taşan öğe bulunamadı).

> Küçük tutarsızlık (bug değil, izlenebilir): **Dialer Mode** kolonundaki değerler tabloda **ham büyük-harf enum** (`PROGRESSIVE`) olarak, hiçbir dilde çevrilmeden gösteriliyor. Oysa **Create** sihirbazında aynı kavram dostça ve çevrilebilir adlarla (Progressive/Predictive/…) sunuluyor. Tür rozetleri (EMAIL/VOICE/SMS) gibi veri değeri sayıldı; sızıntı olarak işaretlenmedi.

---

## 🐞 BULGU 1 — Liste 10 kampanyada kapanıyor; API "sonraki sayfa var" diyor ama **pager/sonsuz kaydırma yok**

**Nerede:** Giden kampanya tablosu.

**Beklenen:** 10'dan fazla kampanya varsa kullanıcı kalanına erişebilmeli (sayfalama düğmeleri veya sonsuz kaydırma).

**Gerçekleşen:** Liste `GET /api/v1/campaigns?page=1&limit=10` ile **ilk 10** kaydı çekiyor. API yanıtı `data.hasNextPage = true` döndürüyor (yani **daha fazla kampanya var**), fakat:
- Sayfada **hiçbir sayfalama kontrolü yok** (Next/Previous/sayfa numarası bulunamadı).
- **Sonsuz kaydırma yok**: sayfa sonuna kaydırınca satır sayısı **10'da kaldı** (yeni istek/veri gelmedi).

**Kanıt (inspection):**
- `GET /api/v1/campaigns?page=1&limit=10` → `data.data.length = 10`, `data.hasNextPage = **true**`.
- Aşağı kaydırma sonrası DOM satır sayısı: `10 → 10` (değişmedi).
- DOM'da pager düğmesi taraması: **yok**.

**Sonuç:** İlk 10'dan sonraki kampanyalara arayüzden erişilemiyor (yalnızca arama/filtre ile daraltılırsa görünürler). Regresyon testinde `test.fail` (bilinen hata) ile işaretlendi; sayfalama/sonsuz-kaydırma eklenince "beklenmedik geçiş" verip kalıcı guard'a çevrilecek.

---

## 🐞 BULGU 2 (a11y) — Satır işlem ikonları (göz / başlat / sil) **erişilebilir isimsiz**

**Nerede:** Actions kolonundaki ikon düğmeleri.

**Gerçekleşen:** `lucide-eye`, `lucide-play`, `lucide-trash2` ikonlu üç düğmenin de **`aria-label`/`title` yok, metin içeriği boş**. Ekran okuyucu için üçü de isimsiz düğme; klavye/AT kullanıcısı ne yaptığını ayırt edemez. Bu, Contacts sayfasındaki bilinen `button-name` borcuyla aynı sınıftır (bkz. `docs/accessibility-findings.md`).

**Etki (test):** Bu düğmeler `getByRole('button', { name })` ile seçilemiyor. Frontend'den **`data-testid`** (örn. `campaign-row-view` / `-start` / `-delete`) veya `aria-label` isteniyor. O gelene kadar testler son çare olarak **satır içindeki lucide ikon svg sınıfına** göre çapalıyor (bu bir uygulama-ayrıntısı seçicidir ve `data-testid` talebiyle birlikte belgelendi).

---

## 🔬 Fonksiyonel / Network incelemesi — kontroller GERÇEKTEN iş yapıyor mu?

Her kontrol tıklanıp Network + DOM/state ölçüldü. **Güvenlik:** mutation-tetikleyen düğmeler (**Sil**, **Başlat**) incelenirken `api.vomenta.com`'a giden **tüm yazma istekleri (POST/PUT/PATCH/DELETE) engellendi** — prod'a hiçbir değişiklik gitmedi.

| Kontrol | Sonuç | Kanıt (tıklamada olan) |
|---|---|---|
| **Arama** (Search campaigns) | ✅ Çalışıyor (sunucu-taraflı) | `GET /api/v1/campaigns?...&filters={"search":"..."}`; liste daralıyor ("test camp 2" → 1 satır). |
| **Tür filtresi** (All types→Voice) | ✅ Çalışıyor | `GET /api/v1/campaigns?...&filters={"campaignType":"VOICE"}`; liste 4 VOICE satırına düşüyor. |
| **Durum sekmesi** (All→Running) | ✅ Çalışıyor | `GET /api/v1/campaigns?...&filters={"status":"RUNNING"}`; `aria-selected=true` Running'e geçiyor. |
| **Göz (view)** | ✅ Çalışıyor | `/campaigns/{id}` sayfasına gider + `GET /api/v1/campaigns/{id}` (+ contacts, contact-groups, disposition-codes). Detay h1 = kampanya adı. |
| **New Campaign** | ✅ Çalışıyor | `/campaigns/create` sihirbazına gider; h1 "Create Campaign"; kanal/queue/sender-id/template verileri yüklenir. |
| **Sil (trash)** | ✅ L1 güvenli | Tıklayınca **onay dialogu** açılıyor: *"This will permanently delete this campaign and all its data. This action cannot be undone."* — tıklamada **yazma isteği yok**. Onaylanınca → `DELETE /api/v1/campaigns/{id}` (mutation). |
| **Başlat (play, yalnız Draft)** | ✅ L1 güvenli | Tıklayınca **onay dialogu**: *"This will start the campaign and begin contacting the listed contacts."* — tıklamada yazma yok. Onaylanınca → `POST /api/v1/campaigns/{id}/start` (mutation). |

Sayfa yükünde vurulan uçlar: `GET /api/v1/campaigns?page=1&limit=10` (liste), `GET /api/v1/campaigns/stats` (özet kartları).

### 3 katmanlı kontrol matrisi (testlerin dayandığı model)

Her kontrol **L1** (tıklama/UI tepki) · **L2** (doğru uca network) · **L3** (amaç gerçekleşiyor) katmanlarında test edilir. Gerçekten olmayan katman **N/A** olarak belgelenir; prod'a yazmadan doğrulanamayan L3 (kalıcı mutation) **N/A** işaretlenir ve staging/@mutation'a bırakılır.

| Kontrol | L1 Tıklama | L2 Arka plan | L3 Görev |
|---|---|---|---|
| **Arama** | ✅ değer girilir, liste güncellenir | ✅ `GET campaigns?filters={search}` | ✅ liste eşleşmelere daralır |
| **Tür filtresi** | ✅ seçilen değer trigger'da | ✅ `GET campaigns?filters={campaignType}` | ✅ liste türe göre filtrelenir |
| **Durum sekmesi** | ✅ `aria-selected=true` | ✅ `GET campaigns?filters={status}` | ✅ liste duruma göre filtrelenir |
| **Göz (view)** | ✅ detaya gider | ✅ `GET /campaigns/{id}` | ✅ detay sayfası kampanya adıyla açılır |
| **New Campaign** | ✅ create'e gider | ✅ create verileri yüklenir | ✅ "Create Campaign" sihirbazı görünür |
| **Sil (trash)** | ✅ onay dialogu açılır | ✅ onayda `DELETE /campaigns/{id}` (route ile yakalanır, prod'a yazılmaz) | ⛔ N/A prod (gerçek silme = mutation → staging/@mutation) |
| **Başlat (play)** | ✅ onay dialogu açılır | ✅ onayda `POST /campaigns/{id}/start` (route ile yakalanır) | ⛔ N/A prod (gerçek başlatma = mutation → staging/@mutation) |
| **Sayfalama** | ❌ **BULGU 1**: pager yok / sonsuz kaydırma yok | — | ❌ 10+ kampanyaya erişilemiyor |

Test karşılığı: `tests/campaigns-outbound.authed.spec.js` — her kontrol kendi `describe`'ında `L1/L2/L3` başlıklı testlerle. Bozuk L3/bulgular `test.fail` (bilinen hata).

### Satır işlem ikonları duruma göre değişir (gözlem)

| Durum | Actions ikonları |
|---|---|
| **Draft** | 👁 göz · ▶ başlat · 🗑 sil |
| **Completed / Cancelled** | 👁 göz · 🗑 sil |
| **Scheduled** | 👁 göz · ▶ başlat · ~~🗑 sil~~ **(SİL YOK)** |

## ✅ Gözlem — "Başlat" (Start) HATA geri bildirimi ÇALIŞIYOR (hata yolu doğrulandı)

**Nerede:** Liste satırındaki ▶ (başlat) ikonu → onay dialogu → **Start**.

**Gerçekleşen (kullanıcı onayıyla prod'da gözlendi — ham veri `veri/start-observations.json`):**
- "E2E kesif TEST" kampanyası (VOICE/Scheduled, 1 kişi ama kişinin **telefonu yok**) başlatılmak istendi.
- `POST /api/v1/campaigns/{id}/start` → **HTTP 400** `{ code: "BAD_REQUEST", message: "Campaign … has no contacts with phone numbers to dial" }`.
- **UI kırmızı bir hata toast'ı gösterdi: "Failed to start campaign. Please try again."** (görsel: `screenshots/` — start-fail toast). Kampanya durumu doğru şekilde **"Scheduled" kaldı** (başlatılmadı), arama yapılmadı.

**Sonuç:** Başlatma başarısızlığı kullanıcıya **doğru şekilde bildiriliyor** — bu bir bug DEĞİL. Test: `page.route` ile 400 taklit edilerek prod'a yazmadan **pozitif guard** olarak yazıldı (Buton: Kampanya başlat → *L3 hata yolu*).

> ⚠ **DÜZELTME (ölçüm hatası):** İlk `start-observations.json` koşusunda `afterStartToast: []` görünmüştü; bu YANLIŞTI — sonner toast'ı geçici (birkaç sn) olduğu için **tek-sefer sorgu** onu kaçırdı. Ekran görüntüsü toast'ın gösterildiğini kesin kanıtladı. **Ders:** toast/geçici bildirimleri tek-sefer değil, kısa aralıklarla **poll** ederek gözle.
>
> Küçük UX gözlemi (bug değil): toast **genel** ("Please try again.") — backend'in spesifik nedenini ("no contacts with phone numbers") kullanıcıya taşımıyor. İyileştirilebilir ama işlevsel doğru.

> Not: Bu kişinin telefon numarası olmadığından kampanya zaten gerçek arama yapamazdı (başlatma güvenliydi). Başarı-yolu L3'ü (gerçek arama başlatma) kalıcı mutation → prod'da N/A.

## 🐞 Gözlem — SCHEDULED kampanya UI'dan SİLİNEMİYOR

> 🐞 **Gözlem/olası bulgu — SCHEDULED kampanya UI'dan SİLİNEMİYOR.** Bir kampanya "Schedule Once/Recurring" ile planlandığında **liste satırında çöp ikonu yok**; **detay sayfasında da yalnız "Start" var, "Delete" yok**; **Settings sekmesinde de silme/iptal düğmesi yok**. Yani planlanmış bir kampanyayı arayüzden kaldırmanın bir yolu görünmüyor (yalnız Start edilebiliyor). `DELETE /api/v1/campaigns/{id}` ucu mevcut ama bu duruma bağlı hiçbir UI tetikleyicisi yok. Bu, hem bir ürün gözlemi hem de mutasyon testinin **teardown**'ını etkiler (bkz. `campaigns-outbound.mutation.authed.spec.js` → `test.fixme`). Kasıtlı mı yoksa eksik mi olduğu ürün ekibiyle netleştirilmeli. Bu davranış otomatik teste dökülmedi çünkü doğrulaması bir SCHEDULED kampanya var-etmeyi (mutation) gerektirir ve o kampanya sonradan UI'dan temizlenemez.

---

## 3. Kampanya Detayı (`/campaigns/{id}`) — göz ikonuyla açılır

Göz ikonu **modal değil, ayrı sayfaya** (`/campaigns/{uuid}`) götürür.

- Geri oku + **h1 = kampanya adı** + **durum rozeti** (Draft/…).
- Sağ üstte: **Start** (yeşil) ve **Delete** (kırmızı) düğmeleri (Draft için).
- Üst metrik kartları (6): Total Contacts · Dialing now · Contacted · Connected · Contact Rate · Connect Rate.
- **Campaign Progress** çubuğu (`% complete`, `x / y connected`).
- Sekmeler: **Overview / Contacts / Results / Settings**.
- Overview: Success/Contact/Attempt Rate + Failed kartları; **Real-Time Metrics**; **Campaign Info** (Schedule Type, Dialer Mode, Caller ID, Queue, Schedule, Period); Contact Status Summary.

Detay yükünde: `GET /api/v1/campaigns/{id}`, `.../contacts?page=1&limit=10`, `/contact-groups`, `/disposition-codes`.

---

## 4. Yeni Kampanya Sihirbazı (`/campaigns/create`) — New Campaign ile açılır

Modal değil, **ayrı sayfa**. h1 "Create Campaign" · alt başlık *Set up a new outbound campaign*.

**Stepper (6 adım):** **Type → Contacts → Channel → Schedule → Retry & Pacing → Review**. Altta her adımda **Back / Next** (ilk adımda Cancel/Next), son adımda **Create Campaign**.

| Adım | İçerik / alanlar | İlerlemek için zorunlu |
|---|---|---|
| **1. Type** | Campaign Name \* · Description · Campaign Channel \* (kartlar: **Voice / SMS / Email / WhatsApp**) · Dialer Mode (kartlar: **Preview / Progressive / Predictive / Power / Click-to-Call**) | **Campaign Name** (Voice+Progressive varsayılan seçili) |
| **2. Contacts** | Contact Source: **Upload CSV** (dropzone, "Download Template") **veya** Contact Group → *Select Contact Group* (mevcut gruplar: SoftPhone / test group / Sigma) | Bir kaynak + (grup seçilirse) bir grup |
| **3. Channel** (Voice) | AI Voice Agent (Optional) · **Caller ID Number** (combobox + E.164 elle) · **Assign to Queue** · Agent Script | Voice'ta **Caller ID + Queue** (aksi halde Next sessizce ilerlemez — validasyon) |
| **4. Schedule** | **Schedule Type** (kartlar: **Send Now** / **Schedule Once** / **Recurring**) · **Start Date \*** · End Date · Days of Week (Daily/Weekdays/Weekly/Bi-weekly/Custom + Sun–Sat) · Calling Hours Start (HH:MM) · Timezone · *TCPA uyarısı* | "Schedule Once/Recurring"de **Start Date** (boşsa "Set a valid start date" hatası); "Send Now" tarih istemez ama **kampanyayı hemen başlatır** |
| **5. Retry & Pacing** | Max Attempts per Contact · Retry Interval (minutes) · Pace Rate (calls per minute) · Enable DNC Checking (switch) | — (varsayılanlar) |
| **6. Review** | Özet + **Create Campaign** düğmesi | — |

Yükte: `GET /api/v1/campaigns/channels`, `/contact-groups`, `/sender-ids/approved`, `/channels/templates/sms`, `/queues`, `/dids`, `/voice-ai/config`, `/settings/business-hours`.

**Oluşturma (uçtan uca — kullanıcı onayıyla prod'da 1 kez yapıldı):**
- `POST /api/v1/campaigns` → **201 Created**; yanıt `data.id` döner ve arayüz `/campaigns/{id}` detayına yönlendirir; sağ altta **"Campaign created"** toast'ı çıkar.
- Kanıt kampanyası: ad **"E2E kesif TEST (silinebilir)"**, id `56b8d243-da42-48a0-9e6e-be443501f808`, tip VOICE, durum **SCHEDULED**, `scheduledStart: 2030-01-01` (kasıtlı **uzak gelecek** → hiç arama yapmaz; "Send Now" seçilmedi çünkü o gerçek aramayı hemen başlatırdı). Görsel: [`create-result.png`](screenshots/create-result.png).
- ⚠ Ufak tutarsızlık: başarı toast'ı *"Added 0 contacts from group"* derken detay **Total Contacts = 1** gösteriyor (kişi kaydı asenkron; kozmetik).

> ⚠ **Kampanya oluşturmak/silmek/başlatmak MUTATION'dır** (`POST /campaigns`, `DELETE /campaigns/{id}`, `POST /campaigns/{id}/start`). Depo kuralı gereği prod'da **otomatik** mutation testi koşmaz; oluşturma akışı `@mutation` + `mutationGuard` + `cleanup` ile ve ayrılmış test hesabı/staging'de koşar (bkz. `tests/campaigns-outbound.mutation.authed.spec.js`). Keşifteki tek gerçek oluşturma bilinçli ve tek seferlikti; kalan tüm buton incelemeleri **yazma istekleri engellenerek** yapıldı.

---

## Test yazımı için sağlam çapalar (seçiciler)

- Başlık: `page.getByRole('heading', { level: 1 })` — tek h1 (`Outbound Campaigns`).
- Arama: `page.getByPlaceholder(/Search campaigns/i)` (yerelleşince POM I18N'den).
- Tür filtresi: `page.getByRole('combobox')` (sayfadaki tek combobox); seçenekler `role=option` (All types/Voice/SMS/Email/WhatsApp).
- Sekmeler: `page.getByRole('tab', { name: /All|Running|Paused/ })`; seçili sinyal `aria-selected`.
- New Campaign: `page.getByRole('button', { name: 'New Campaign' })` (yerelleşince POM I18N).
- Tablo satırı: `page.locator('tbody tr').filter({ hasText: '<ad>' })`.
- Satır işlem ikonları (**a11y borcu — data-testid isteniyor**): son çare `row.locator('button:has(svg.lucide-eye)')`, `…lucide-play`, `…lucide-trash2`.
- Onay dialogu: `page.getByRole('dialog')` / `alertdialog`; onay düğmeleri `getByRole('button', { name: /^Delete$|^Start$/ })`, iptal `/Cancel|İptal|Annuler|إلغاء/`.
- Mutation güvenliği (L2): `page.route('**://api.vomenta.com/**', …)` ile POST/DELETE yakalanıp `200` ile karşılanır → **prod'a yazılmaz**.
- Her test **taze bağlamda İngilizce** başlar; dile **tek switch** yapılır.
- Backend uçları: liste `GET /api/v1/campaigns?page&limit&filters`, özet `GET /api/v1/campaigns/stats`, detay `GET /api/v1/campaigns/{id}`, sil `DELETE /api/v1/campaigns/{id}`, başlat `POST /api/v1/campaigns/{id}/start`.
