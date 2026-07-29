# Kampanyalar → Şablonlar (`/campaigns/templates`) — keşif notları

Canlı gözlem: **29 Tem 2026**, `app.vomenta.com` (salt-okunur; tüm non-GET `/api/**`
istekleri tarayıcıda **bloklandı** → prod'a yazılmadı; tam-sayfa ekran görüntüsü yok,
JSON artefaktları maskeli). Bkz. AGENTS.md → 3-katman, i18n 4-dil, zorunlu stiller.
İlgili: [[vomenta-campaigns-outbound]], [[vomenta-campaigns-sender-ids]], [[vomenta-campaigns-dnc]].

Bu, **Kampanyalar** bölümünün kalan alt sayfasıdır (Outbound ✓, Sender IDs ✓, DNC ✓, **Templates ✓** → bölüm tamam).

## Yapı

- **h1:** "SMS Templates" · alt başlık: "Manage reusable SMS message templates for your campaigns."
- **Tek eylem butonu:** `New Template` → `Create Template` modal dialogu açar (ayrı sayfaya gitmez).
- **Tablo — 4 sütun:** `Template Name · Message Body · Created at · (Actions — başlık boş)`.
- **Veri:** test tenant'ında 1 şablon ("Campaign Template" / gövde "Test template" / Jun 2, 2026).
- **Satır Actions hücresi:** 2 **ikon-only** buton → 1.'si `Edit Template` dialogu, 2.'si
  `Delete Template` onay dialogu ("Are you sure … This cannot be undone." Cancel/Delete).
- **Yok:** sekme, arama, filtre combobox'ı (gözlemlendi).

## Create/Edit Template dialogu

- `heading[level=2]` "Create Template" (düzenlemede "Edit Template").
- Alt açıklama sayfa alt başlığıyla **aynı** metni tekrarlıyor ("Manage reusable …") — küçük içerik tekrarı.
- **Alanlar:** `Template Name` (textbox "e.g. Welcome Message") · `Message Body` (textbox) ·
  **GSM-7 karakter sayacı** ("0/160" → yazınca "32/160 · 128 left", encoding göstergesi).
- **Butonlar:** `Cancel` · `Create` (**alanlar boşken disabled**, dolunca enable → düzgün validasyon) · `Close`.
- **Submit ucu:** `POST /api/v1/channels/templates/sms` gövde `{name, content}`.

## API uçları (Network ile doğrulandı)

- Liste: `GET /api/v1/channels/templates/sms` (yanıt zarfı `data.data[]`/`data[]`).
- Oluştur: `POST /api/v1/channels/templates/sms` gövde `{name, content}` (mutation).
- Düzenle: `PUT/PATCH /api/v1/channels/templates/sms/{id}` (mutation; Edit dialog).
- Sil: `DELETE /api/v1/channels/templates/sms/{id}` (mutation; onay dialogu).

## 4 dil (i18n)

| Alan | en | tr | fr | ar (RTL) |
|---|---|---|---|---|
| h1 | SMS Templates | SMS Şablonları | Modèles SMS | قوالب الرسائل القصيرة |
| Alt başlık | Manage reusable SMS message templates for your campaigns. | Kampanyalarınız için yeniden kullanılabilir SMS mesaj şablonlarını yönetin. | Gérez les modèles de messages SMS réutilisables pour vos campagnes. | إدارة قوالب رسائل SMS القابلة لإعادة الاستخدام لحملاتك. |
| New Template | New Template | Yeni Şablon | Nouveau modèle | قالب جديد |
| Başlıklar | Template Name / Message Body / Created at | Şablon Adı / Mesaj İçeriği / Oluşturulma | Nom du modèle / Corps du message / Créé le | اسم القالب / نص الرسالة / تاريخ الإنشاء |

Arapça'da `html[dir=rtl]`. (Create dialog başlığının tr/fr/ar karşılıkları keşifte
gözlemlenmedi → i18n guard'ı yalnız gözlemlenen sayfa-düzeyi etiketleri assert eder.)

## Bulgular

- **BULGU A (i18n sızıntısı) — `@known-bug`:** Create/Edit dialogunda **Message Body**
  alanının placeholder'ı ham çeviri anahtarı **`campaigns.templateContentPlaceholder`**
  olarak görünüyor (İngilizce dahil hiçbir dilde çevrilmemiş bir iç anahtar son kullanıcıya
  sızıyor). Kanıt: `veri/exploration.json` dialog.aria. Düzelene kadar `test.fail`.
- **BULGU B (a11y button-name) — `@known-bug`:** Satır işlem ikonları (Edit/Delete)
  **erişilebilir isimsiz** (yalnız ikon). `getByRole('button',{name})` çalışmaz; POM
  konuma (nth) çapalanır. Frontend'den `aria-label`/`data-testid` isteniyor (outbound
  BULGU 2 ile aynı borç). Düzelene kadar `test.fail`.
- **BULGU C (sessiz hata / console-error) — `@known-bug`:** Sayfa yüklenirken
  console'a **`INVALID_MESSAGE: MALFORMED_ARGUMENT`** hatası **iki kez** düşüyor
  (templates/page bundle). Muhtemelen BULGU A ile aynı kök neden: i18n mesaj
  formatlayıcı, bozuk/eksik bir çeviri anahtarında (ör. `campaigns.templateContentPlaceholder`)
  patlıyor. `_rsc=` prefetch iptalleri (Next.js) zararsız ve allowlist'te; bu ayrı ve
  gerçek. `@clean` testi düzelene kadar `test.fail` guard'ı.

---

# Keşif kapanış matrisi

| Durum | Sonuç | Kanıt / N/A gerekçesi |
|---|---|---|
| Varsayılan / veri-dolu | Kapsandı | 1 şablon satırı + Actions ikonları; `veri/exploration{,2}.json` |
| Satır seçimi / checkbox / bulk bar | N/A | Satırda checkbox yok; toplu-eylem yok (gözlemlendi) |
| Hover / focus ile beliren kontroller | N/A | Actions ikonları satırda hep görünür; hover ek kontrol yok |
| Kebab / context menüleri | N/A | Kebab yok; iki ayrı ikon buton (edit/delete) |
| Dialog / drawer / detail | Kapsandı | Create + Edit + Delete-confirm dialogları |
| Loading | Kapsandı | Liste iskeleti → veri; `open()` ilk satır bekler |
| Boş durum | N/A | Tenant'ta 1 şablon var; boş-durum gözlemlenemedi (mock ile @errorpath boş yanıt test edilir) |
| Hata / abort / 5xx | Kapsandı (test) | `@errorpath` route-mock 500 → kabuk ayakta |
| Yetkisiz / rol sınırı | N/A | Yalnız ADMIN oturumu; rol matrisi kapsam dışı |
| Masaüstü / tablet / mobil | Kapsandı (test) | `@layout` yatay-taşma yok (3 genişlik + RTL) |
| en / tr / fr / ar + RTL | Kapsandı | 4 dil tablosu (yukarıda) |

## Kontrol envanteri

| Durum | Role | Erişilebilir ad | L1 | L2 | L3 | N/A / bulgu |
|---|---|---|---|---|---|---|
| Varsayılan | button | New Template | ✓ (dialog) | N/A (istemci) | ✓ (form alanları+sayaç) | — |
| Dialog | textbox | Template Name / Message Body | ✓ | N/A | ✓ (sayaç güncellenir) | BULGU A placeholder sızıntısı |
| Dialog | button | Create | ✓ (route-mock) | ✓ (`POST /channels/templates/sms`) | N/A prod (mutation→staging) | boş alanla disabled ✓ |
| Dialog | button | Cancel/Close | ✓ (kapanır) | N/A | N/A | — |
| Satır | button (ikon) | Edit | ✓ ("Edit Template" dialog) | N/A | ✓ (dialog açılır) | BULGU B isimsiz |
| Satır | button (ikon) | Delete | ✓ (onay dialogu) | ✓ (`DELETE …/{id}` route-mock) | N/A prod (mutation→staging) | BULGU B isimsiz |

## Kapanış kanıtı

- Başlangıç/bitiş baseline'ı: 1 şablon (salt-okunur; değişmedi).
- Mutation/orphan taraması: keşifte POST/DELETE **bloklandı** → prod'a yazılmadı, orphan yok.
- Çalıştırılan komutlar: salt-okunur keşif scriptleri (silindi — geçici); veri
  `veri/exploration{,2}.json`, `veri/aria-en.yaml` (PII-maskeli, tam-sayfa SS yok).
- Açık bulgular / `test.fail` guard'ları: BULGU A (placeholder çeviri-anahtarı sızıntısı),
  BULGU B (satır ikonları erişilebilir isimsiz).
