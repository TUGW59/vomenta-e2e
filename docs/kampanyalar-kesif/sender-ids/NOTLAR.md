# Kampanyalar → Gönderici Kimlikleri (`/campaigns/sender-ids`) — keşif notları

Canlı gözlem: **29 Tem 2026**, `app.vomenta.com` (salt-okunur; tüm non-GET `/api/**`
istekleri tarayıcıda **bloklandı** → prod'a yazılmadı). Bkz. AGENTS.md → 3-katman,
i18n 4-dil, zorunlu stiller. İlgili: [[vomenta-campaigns-outbound]].

> **PII notu:** Tam-sayfa ekran görüntüleri sol menüde kullanıcı adı içerdiği için
> **silindi**; JSON/yaml artefaktları e-posta/telefon/isim açısından maskelendi.
> Gerekirse yalnız `main` bölgesi + maskeli olarak yeniden üretilebilir.

Bu, **Kampanyalar** bölümünün üçüncü alt sayfasıdır (Outbound ✓, Templates —, **Sender IDs ✓**, DNC —).

## Yapı

- **h1:** "Sender IDs" · alt başlık: "Manage SMS Sender IDs for outbound campaigns. New IDs require platform admin approval."
- **Tek eylem butonu:** `Request Sender ID` (sağ üst) → modal dialog açar.
- **Tek filtre:** durum `combobox` (varsayılan "All Status").
- **Tablo — 8 sütun:** `Sender ID · Type · Status · Purpose · Requested By · Review Note · Created at · Actions`.
- **Veri (test tenant'ı):** 3 kayıt, hepsi `APPROVED` / `ALPHANUMERIC`
  (3 örnek alfanümerik kimlik — adlar müşteri verisi, maskelendi). Pending/Rejected/Docs-Requested = **0**.
- **Actions sütunu:** APPROVED satırlarda **boş** (`<div class="flex gap-1"></div>` — hiç buton yok).
  Satır-içi inceleme aksiyonları (onayla/reddet/belge-iste) yalnızca **PENDING** kayıtlarda
  beklenir; tenant'ta pending kayıt olmadığı için gözlemlenemedi → **N/A**.

## Request Sender ID dialogu

- `heading[level=2]` "Request Sender ID" + açıklama.
- **Alanlar:** `Sender ID *` (textbox, placeholder "e.g. MYCOMPANY", `maxlength=20`) ·
  `Type` combobox (**Alphanumeric / Numeric / Shortcode**) · `Purpose` (textbox) ·
  `Supporting Documents (optional)` → `Choose Files` (dosya yükleme, isteğe bağlı).
- **Butonlar:** `Cancel` · `Submit Request` · `Close` (X).
- **Submit ucu:** `POST /api/v1/sender-ids`, gövde
  `{"senderId","senderType","purpose"}` (belgeler multipart olabilir; keşifte boş).
  → Gerçek talep oluşturma = **mutation** (prod'da N/A; staging mutation spec'ine bırakıldı).

## API uçları (Network ile doğrulandı)

- Liste: `GET /api/v1/sender-ids?page=1&limit=10`
  (yanıt zarfı `data.data[]` + `data.hasNextPage`/`total`).
- Filtre: `GET /api/v1/sender-ids?page=1&limit=10&filters={"status":"<ENUM>"}`
  — ENUM: `PENDING` · `APPROVED` · `REJECTED` · `DOCUMENTS_REQUESTED`.
- Talep oluştur: `POST /api/v1/sender-ids` (mutation).

## Durum filtresi (doğru çalışıyor)

| Seçenek | Gönderilen filtre | Sonuç |
|---|---|---|
| All Status | (filtre yok) | 3 satır (karışık = hepsi APPROVED) |
| Pending | `status:PENDING` | boş-durum "No sender IDs found" |
| Approved | `status:APPROVED` | 3 satır, hepsi APPROVED |
| Rejected | `status:REJECTED` | boş-durum |
| Docs Requested | `status:DOCUMENTS_REQUESTED` | boş-durum |

Her seçim doğru ENUM'la liste ucunu tetikliyor ve sonuç ölçüte uyuyor (L3 doğruluğu).

## 4 dil (i18n) — sağlam, sızıntı yok

| Alan | en | tr | fr | ar (RTL) |
|---|---|---|---|---|
| h1 | Sender IDs | Gönderici Kimlikleri | Identifiants d'expéditeur | معرفات المرسل |
| Buton | Request Sender ID | Gönderici Kimliği Talep Et | Demander un identifiant d'expéditeur | طلب معرف مرسل |
| Filtre | All Status | Tüm Durumlar | Tous les statuts | جميع الحالات |
| Dialog başlığı | Request Sender ID | Gönderici Kimliği Talep Et | Demander un identifiant d'expéditeur | طلب معرف مرسل |

- Tablo başlıkları (8) dört dilde tam çevrili. Arapça'da `html[dir=rtl]`.
- **Veri ≠ çeviri:** `ALPHANUMERIC` (Type) ve `APPROVED` (Status) rozetleri ham enum
  değeri; kişi adları ve tarih (`Jun 4, 2026`) veri alanı — çeviri sızıntısı sayılmaz
  (bkz. outbound Dialer Mode enum kararı).

## Bulgular

- **BULGU A (a11y/UX) — `@known-bug`:** Zorunlu `Sender ID` alanı boşken `Submit Request`
  butonu **her zaman enabled**; boş tıklanınca dialog açık kalıyor, POST gitmiyor **ama**
  görünür bir validasyon mesajı / `aria-invalid` **yok** → kullanıcı neden gönderilmediğini
  anlayamıyor. Kanıt: `veri/exploration3.json` (maskeli).
  Beklenen: ya buton devre dışı, ya da erişilebilir bir hata mesajı. Düzelene kadar
  `test.fail` guard.
- **BULGU B (tutarlılık) — küçük, not:** Alt yardım metni "Alphanumeric (max **11** chars)"
  derken input `maxlength=**20**`. Tür bazlı sınır (numeric/shortcode farklı) olabilir ama
  metin/kısıt uyuşmuyor. `@known-bug` guard: yardım metni 11 der ama 20 karakter girilebiliyor.

---

# Keşif kapanış matrisi

| Durum | Sonuç | Kanıt / N/A gerekçesi |
|---|---|---|
| Varsayılan / veri-dolu | Kapsandı | 3 APPROVED satır; `veri/exploration.json` (maskeli) |
| Satır seçimi / checkbox / bulk bar | N/A | Satırda checkbox yok; toplu-eylem çubuğu yok (gözlemlendi) |
| Hover / focus ile beliren kontroller | N/A | APPROVED satır Actions hücresi boş; hover'da kontrol belirmiyor |
| Kebab (`...`) / context menüleri | N/A | Satır/başlık kebab menüsü yok (gözlemlendi) |
| Dialog / drawer / detail | Kapsandı | Request Sender ID dialogu; alanlar+tür+submit+belge; dialog metni `veri/exploration2.json` |
| Loading | Kapsandı | Liste iskeleti → veri; `open()` ilk satır metni bekler |
| Boş durum | Kapsandı | Pending/Rejected/Docs "No sender IDs found" |
| Hata / abort / 5xx | Kapsandı (test) | `@errorpath` route-mock 500 → zarif hata/boş (spec) |
| Yetkisiz / rol sınırı | N/A | Yalnız ADMIN oturumu var; rol matrisi kapsam dışı (varsayılan rol) |
| Masaüstü / tablet / mobil | Kapsandı (test) | `@layout` yatay-taşma yok (3 genişlik + RTL) |
| en / tr / fr / ar + RTL | Kapsandı | 4 dil tablosu (yukarıda); `veri/exploration2.json` langs |

## Kontrol envanteri

| Durum | Role | Erişilebilir ad | L1 | L2 | L3 | N/A / bulgu |
|---|---|---|---|---|---|---|
| Varsayılan | button | Request Sender ID | ✓ | N/A (saf istemci: dialog açılır) | ✓ (dialog+alanlar) | — |
| Varsayılan | combobox | All Status (durum filtresi) | ✓ | ✓ (`filters={status}`) | ✓ (sonuç ölçüte uyar) | — |
| Dialog | combobox | Type (Alphanumeric/Numeric/Shortcode) | ✓ | N/A (istemci) | ✓ (değer güncellenir) | — |
| Dialog | button | Submit Request | ✓ (route-mock) | ✓ (`POST /sender-ids` yakalanır) | N/A prod (mutation→staging) | BULGU A |
| Dialog | button | Cancel / Close | ✓ (dialog kapanır) | N/A | N/A | — |
| Satır | — | Actions (APPROVED) | N/A | N/A | N/A | Boş hücre; review aksiyonları yalnız PENDING (yok) |

## Kapanış kanıtı

- Başlangıç/bitiş baseline'ı: liste 3 APPROVED kayıt (salt-okunur; değişmedi).
- Mutation/orphan taraması: keşifte tek POST (`sender-ids`) **bloklandı**; prod'a
  yazılmadı → orphan yok.
- Çalıştırılan komutlar: salt-okunur keşif scriptleri (silindi — geçici); veri
  `veri/exploration{,2,3}.json`, `veri/aria-en.yaml` (hepsi PII-maskeli).
- Açık bulgular / `test.fail` guard'ları: BULGU A (boş-submit sessiz validasyon),
  BULGU B (max 11 metni vs maxlength 20).
