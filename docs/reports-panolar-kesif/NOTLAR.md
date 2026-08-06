# Raporlar › Panolar (`/reports/dashboards`) — Keşif Notları

> Tarih: 28 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla (Playwright `storageState`) 4 dilde inceleme + DOM/inspection ölçümü + tam sayfa ekran görüntüsü.
>
> Amaç: Sayfanın **olması gereken** halini kaydetmek, bulguları kanıtlamak ve buna göre regresyon testi yazmak. Uygulama güncellenince bu alanlar bozulursa testler kırmızıya döner ve **hangi katmanda** sorun olduğu anlaşılır.

Ekran görüntüleri: [`screenshots/`](screenshots/)

İlgili testler: [`tests/reports/reports-dashboards.authed.spec.js`](../../tests/reports/reports-dashboards.authed.spec.js) · Page Object: [`tests/pages/DashboardsPage.js`](../../tests/pages/DashboardsPage.js)
İlgili bulgu (manuel rapor): [`docs/manuel-test-raporu/01-panolar-paylas-tasma.md`](../manuel-test-raporu/01-panolar-paylas-tasma.md)

---

## 1. Sayfanın "olması gereken" hali (yapı)

Kenar menüsü: **Raporlar › Panolar**. Breadcrumb: *[Kullanıcı] › Gösterge Paneli › Raporlar › Panolar*.

- **Başlık (h1):** *Dashboards* (TR: *Panolar*) · **Alt başlık:** *Custom dashboards with widgets and real-time metrics.* (TR: *Özel panolar, widget'lar ve gerçek zamanlı metrikler.*)
- **Sağ üst eylem:** **Create Dashboard** (`+` ikonlu) → tıklayınca **Oluştur diyaloğu** açılır (iki alan: ad `e.g. My Custom Dashboard` + açıklama `What is this dashboard for?`). *Not: `/reports` ana sayfasındaki "New Dashboard" bu sayfaya götürür; buradaki "Create Dashboard" ise diyalog açar.*
- **Sekmeler (`role=tab`):** *All Dashboards* (açılışta seçili) · *Default* · *Custom Dashboards*. **Salt istemci-tarafı filtre** (tıklamada 0 network).
- **Bölümler (`h2`):** *Default Dashboards* (sayaç `0`, boş durum) · *Custom Dashboards* (sayaç `N`).
- **Özel pano kartları** — her kartta: ikon, başlık (ör. *test dashboard (Copy)*), açıklama, *N widgets*, tarih, *Created by X* ve alt eylem düğmeleri:
  - **Edit** (kalem, `lucide-pencil`) → **Düzenleme (builder) diyaloğu** açar: başlık *Edit: <ad>*, *Add Widget*, widget önizleme kartları, *Cancel* + *Save Dashboard*. (Aynı URL'de kalır, gezinme yok.)
  - **Paylaş** (`lucide-share2`) → **Paylaş diyaloğu** açar. ⚠ **Erişilebilir isim YOK** (aşağıda a11y notu).
  - **Kopyala/Çoğalt** (`lucide-copy`) → panoyu çoğaltır (bir kopya oluşturur = **mutation**). "(Copy)" kartı bunun kanıtı.
  - **Sil** (`lucide-trash2`, kırmızı) → panoyu siler (**mutation**).

**Paylaş diyaloğu (Share Dashboard):**
- Başlık *Share Dashboard*, açıklama *Share "<ad>" with others by copying the link below.*
- Salt-okunur bağlantı alanı (`<p class="truncate">` içinde, `div.flex-1` kapsayıcısında) + **kopyala** düğmesi (`lucide-link`).
- Alt not: *Anyone with this link can view this dashboard (read-only).*
- Alt **Close** düğmesi + sağ üst **X** (Radix, `sr-only` "Close").
- **Açılışta 0 network** — bağlantı pano id'sinden istemci tarafında üretilir.
- **Kopyala düğmesi ÇALIŞIYOR:** panoya (clipboard) tam URL yazılır + "copied" toast'ı çıkar.

**API:** Liste `GET https://api.vomenta.com/api/v1/reports/dashboards` ile yüklenir.

---

## 2. 4 Dil Yerelleştirme Durumu — SAĞLAM ✅

Dil, sunucuda/localStorage'da kalıcı DEĞİL → taze bağlam hep **İngilizce** açılır. Çalışan dil değiştirici: **kenar çubuğu altındaki** metinli düğme (🇬🇧 English / 🇹🇷 Türkçe / …). Bkz. hafıza notu `vomenta-workforce-i18n`, referans `WallboardPage`.

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| `html[lang]` | en | tr | fr | ar |
| `html[dir]` | ltr | ltr | ltr | **rtl** ✅ |
| Başlık (h1) | Dashboards | Panolar | Tableaux de bord | لوحات المعلومات |
| Alt başlık | Custom dashboards with widgets and real-time metrics. | Özel panolar, widget'lar ve gerçek zamanlı metrikler. | Tableaux de bord personnalisés avec widgets et métriques en temps réel. | لوحات مخصصة مع أدوات ومقاييس في الوقت الفعلي. |
| Sekme 1 | All Dashboards | Tüm Panolar | Tous les tableaux de bord | جميع لوحات المعلومات |
| Sekme 2 | Default | Varsayılan | Par défaut | افتراضي |
| Sekme 3 | Custom Dashboards | Özel Panolar | Tableaux de bord personnalisés | اللوحات المخصصة |
| Bölüm (varsayılan) | Default Dashboards | Varsayılan Panolar | Tableaux de bord par défaut | اللوحات الافتراضية |
| Bölüm (özel) | Custom Dashboards | Özel Panolar | Tableaux de bord personnalisés | اللوحات المخصصة |
| Create düğmesi | Create Dashboard | Gösterge Paneli Oluştur | Créer un tableau de bord | إنشاء لوحة تحكم |
| Edit (kart) | Edit | Düzenle | Modifier | تعديل |
| Paylaş diyalog başlığı | Share Dashboard | Panoyu Paylaş | Partager le tableau de bord | مشاركة اللوحة |
| Paylaş alt notu | Anyone with this link can view this dashboard (read-only). | Bu bağlantıya sahip herkes panoyu görüntüleyebilir (salt okunur). | Toute personne disposant de ce lien peut consulter ce tableau de bord (lecture seule). | أي شخص يملك هذا الرابط يمكنه عرض اللوحة (للقراءة فقط). |
| Close düğmesi | Close | Kapat | Fermer | إغلاق |

**Genel değerlendirme:** Yerelleştirme **sağlam**; **Arapça RTL doğru** (`dir=rtl`, düzen aynalı). Başlık, alt başlık, sekmeler, bölüm başlıkları, Create/Edit, paylaş diyalog metinleri ve Close düğmesi dört dilde de çevrili.

**Küçük gözlemler (bug değil, izlenebilir):**
- **i18n sızıntısı (minör):** Paylaş diyaloğunun sağ üst **X** düğmesinin erişilebilir ismi tüm dillerde İngilizce **"Close"** kalıyor (Radix Dialog varsayılan `sr-only`). Görsel değil, yalnızca ekran okuyucu/erişilebilirlik etiketi. Alttaki asıl Close düğmesi çevriliyor (Kapat/Fermer/إغلاق).
- **Terminoloji tutarsızlığı (tr):** Başlık *Panolar* iken Create düğmesi *Gösterge Paneli Oluştur* diyor (Pano ↔ Gösterge Paneli). İşlevsel hata değil.

---

## 🐞 BULGU 1 (Kullanıcının bulduğu) — Paylaş diyaloğunda YATAY TAŞMA

**Nerede:** Özel pano kartındaki **Paylaş** (`lucide-share2`) düğmesine basınca açılan **Share Dashboard** diyaloğu.

**Beklenen:** Uzun paylaşım URL'si diyalog kartının içinde kalmalı (kısaltılmalı `…` veya kutuya sığmalı); kopyala ve Close düğmeleri diyaloğun içinde görünmeli.

**Gerçekleşen:** Uzun URL diyalog kartını **yatayda taşırıyor**; kopyala düğmesi ve alt **Close** düğmesi kartın **dışına** itiliyor (kullanıcının ekran görüntüsündeki taşma).

**Inspection (DOM) kanıtı:**

| Ölçüm | Değer |
|---|---|
| Diyalog kartı genişliği | **512 px** (`max-w-lg`) |
| Diyalog `scrollWidth` / `clientWidth` | **777 / 510** → ~**266 px yatay taşma** |
| URL elemanı `<p class="… truncate">` | `overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0` ✅ (doğru) |
| URL elemanı `scrollWidth`/`clientWidth` | 677 / 677 → **kısaltılmıyor** (kutu tam içeriğe genişlemiş) |
| Kapsayıcı `div.flex-1 rounded-md border bg-muted/50 px-3 py-2` | `flex: 1 1 0%` ama **`min-width: auto`** ⚠ (`min-w-0` YOK) |

**Kök neden:** Klasik flexbox kısaltma hatası. `truncate` elemanı doğru ayarlı; ancak kapsayıcı `flex-1` öğesinde `min-width: auto` (varsayılan) olduğu için öğe **içeriğinin doğal genişliğinin altına küçülemiyor**. Böylece kutu URL'nin tam 677 px'ine kadar büyüyor, `truncate` hiç devreye girmiyor ve satır (URL kutusu + kopyala düğmesi) 512 px'lik diyaloğu ~266 px aşıyor. Diyalog içeriğinde `overflow` kısıtı da olmadığından kopyala + Close düğmeleri kartın dışına taşıyor.

**Önerilen düzeltme (frontend):** `flex-1` kapsayıcısına **`min-w-0`** eklemek (Tailwind), ve/veya diyalog içeriğine `overflow-hidden`. O zaman `truncate` gerçekten `…` ile kısaltır ve her şey 512 px içinde kalır.

**Dört dilde de tekrarlanıyor:** en/tr/fr'de taşma **sağa** (spillRight 266, spillLeft 0); Arapça (RTL) **sola** aynalanır (spillRight 0, spillLeft 266). Her iki durumda da `dialog.scrollWidth(777) > clientWidth(510)`.

> **Test kalitesi dersi (önemli):** Taşmayı yönden bağımsız ölçmek gerekir. Yalnızca sağ kenar taşmasına bakan bir test Arapça'da (RTL) taşmayı **kaçırır** (spillRight=0). Doğru, yöne duyarsız sinyal: **`dialog.scrollWidth <= dialog.clientWidth + tolerans`**. Testte bu kullanıldı.

**Kanıt görselleri:** [`en-02-share-dialog.png`](screenshots/en-02-share-dialog.png) (kopyala + Close diyalog dışında, sağda), [`en-03-share-dialog-crop.png`](screenshots/en-03-share-dialog-crop.png) (URL sağdan kesiliyor), [`ar-share-dialog.png`](screenshots/ar-share-dialog.png) (RTL — taşma sola aynalı), [`tr-share-dialog.png`](screenshots/tr-share-dialog.png), [`fr-share-dialog.png`](screenshots/fr-share-dialog.png).

---

## 🔬 A11y notu (bug değil ama borç) — Kart ikon düğmelerinin erişilebilir ismi YOK

Özel pano kartındaki **Paylaş / Çoğalt / Sil** düğmeleri yalnızca ikon (`lucide-share2` / `lucide-copy` / `lucide-trash2`); **metin, `aria-label` ve `title` yok**. Sonuç:
- **Erişilebilirlik açığı:** ekran okuyucu bu düğmeleri isimsiz okur (`button-name` ihlali; mevcut a11y borcuyla tutarlı, bkz. `docs/accessibility-findings.md`).
- **Test kırılganlığı:** `getByRole('button', {name})` ile seçilemiyorlar → testte `svg` sınıfı (`button:has(svg.lucide-share2)`) son çare olarak kullanıldı ve **frontend'den `data-testid` talep edildi** (seçici politikası gereği).

---

## 🧭 3 Katmanlı Kontrol Matrisi (testlerin dayandığı model)

Her kontrol **L1** (tıklama/tepki) · **L2** (arka plan/network) · **L3** (görev/amaç) katmanlarında incelendi. Gerçekten olmayan katman **N/A** gerekçesiyle belgelenir (uydurulmaz). Mutation gerektiren doğrulama prod'a yazmadan yapılamaz → ayrı `@mutation` (fixme) iskeletine bırakılır.

| Kontrol | L1 Tıklama | L2 Arka plan | L3 Görev |
|---|---|---|---|
| **Sekme** (All/Default/Custom) | ✅ `aria-selected=true` | — **N/A** (istemci filtresi, 0 network) | ✅ kart listesi filtreleniyor (Default→0 özel, Custom→N) |
| **Create Dashboard** | ✅ Oluştur diyaloğu açılıyor (ad+açıklama alanları) | POST (mutation) → **gated** | pano oluşuyor (mutation) → **@mutation fixme** |
| **Edit** (kart) | ✅ Düzenleme diyaloğu açılıyor (*Add Widget/Cancel/Save*) | GET okuma / kaydet=PUT (mutation) | ✅ builder yükleniyor (widget önizlemeleri) |
| **Paylaş** (kart) | ✅ Paylaş diyaloğu açılıyor (bağlantıyı gösteriyor) | — **N/A** (0 network, istemci bağlantısı) | ❌ **BULGU 1: diyalog taşıyor** → `test.fail` |
| **Kopyala bağlantı** (diyalog içi) | ✅ "copied" toast'ı | — **N/A** (clipboard) | ✅ clipboard = paylaşım URL'si |
| **Çoğalt** (kart) | (mutation) → **gated** | POST | yeni "(Copy)" kartı (mutation) → **@mutation fixme** |
| **Sil** (kart) | (mutation) → **gated** | DELETE | kart kaldırılır (mutation) → **@mutation fixme** |

**Test karşılığı:** `tests/reports/reports-dashboards.authed.spec.js` — yapı (@smoke), 4 dil çeviri guard'ları (@regression), her kontrol için L1/L2/L3 başlıklı test'ler, BULGU 1 için `test.fail` (bilinen hata). Mutation yaşam döngüsü (create/duplicate/delete) `tests/reports/reports-dashboards-mutations.authed.spec.js` içinde `@mutation` + `test.fixme` iskeleti (prod'da engelli).

---

## Test yazımı için sağlam çapalar (seçiciler)

- Başlık: `getByRole('heading', { level: 1 })`.
- Sekmeler: `getByRole('tab', { name })`.
- Create: `getByRole('button', { name: <yerelleştirilmiş> })` (ya da `button:has(svg.lucide-plus)`).
- Kart eylemleri: **Edit** yerelleştirilmiş `getByRole('button', {name})`; **Paylaş/Çoğalt/Sil** ikon düğmeleri isimsiz → `button:has(svg.lucide-share2 | lucide-copy | lucide-trash2)` (**`data-testid` talep edildi**).
- Diyaloglar: `getByRole('dialog')`; içinde `getByRole('heading')`, alanlar `input`, kopyala `button:has(svg.lucide-link)`.
- Taşma ölçümü (yöne duyarsız): diyalog elemanında `scrollWidth <= clientWidth + tolerans`.
- Her test **taze bağlamda İngilizce** başlar; dile **tek switch** yapılır (ardışık switch güvenilmez).
