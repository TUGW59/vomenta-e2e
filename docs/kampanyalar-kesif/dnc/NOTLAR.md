# Kampanyalar → DNC Listeleri (`/campaigns/dnc`) — keşif notları

Canlı gözlem: **29 Tem 2026**, `app.vomenta.com` (salt-okunur; tüm non-GET `/api/**`
istekleri tarayıcıda **bloklandı** → prod'a yazılmadı; tam-sayfa ekran görüntüsü
alınmadı, JSON artefaktları maskeli). Bkz. AGENTS.md → 3-katman, i18n 4-dil, zorunlu
stiller. İlgili: [[vomenta-campaigns-outbound]], [[vomenta-campaigns-sender-ids]].

Bu, **Kampanyalar** bölümünün **son** alt sayfasıdır (Outbound ✓, Templates —, Sender IDs ✓, **DNC ✓**).

## Yapı

- **h1:** "Do Not Call List" · alt başlık: "Manage numbers excluded from outbound campaigns for compliance."
- **Üç eylem butonu:** `Export` · `Bulk Import` · `Add Number`.
- **Üç KPI kartı:** `Total DNC Numbers` · `Showing` · `Page` (sayısal değer → `@data`).
- **Arama:** `Search by phone number...` (textbox).
- **Tablo — 5 sütun:** `Phone Number · Reason · Added By · Date Added · Actions`.
- **Boş durum:** "No DNC entries found" (test tenant'ında 0 kayıt).
- **Actions sütunu:** kayıt olmadığı için satır aksiyonu (sil vb.) gözlemlenemedi → **N/A** (kayıt varken silme beklenir).

## Kontroller ve akışlar

- **Add Number → dialog:** başlık "Add Number to DNC"; alanlar `Phone Number (E.164)`
  (zorunlu) + `Reason` combobox (**Customer Request / Legal Requirement / Internal
  Policy / Regulatory Compliance / Duplicate / Invalid**); butonlar `Cancel` /
  `Add to DNC` / `Close`. **Boş submit → görünür validasyon "Phone number is required"**
  (sender-ids'in aksine DÜZGÜN çalışıyor). Submit ucu: `POST /api/v1/dnc` gövde
  `{phoneNumber, reason, source:"manual"}`.
- **Bulk Import → dialog:** başlık "Bulk Import DNC Numbers"; CSV yükleme (`Click to
  upload CSV`, `Download Template`), `Import`/`Cancel`/`Close`. Beklenen kolon: `phone`
  (E.164). Yükleme = mutation → staging.
- **Export:** `GET /api/v1/dnc/export?format=csv` → tarayıcı indirmesi tetikliyor.

## API uçları (Network ile doğrulandı)

- Liste: `GET /api/v1/dnc?page=1&limit=10` — yanıt `data.data[]` + `data.hasNextPage` + `data.totalCount`.
- Export: `GET /api/v1/dnc/export?format=csv` (salt-okunur; indirme).
- Ekle: `POST /api/v1/dnc` gövde `{phoneNumber, reason, source}` (mutation).
- Toplu içe aktar: CSV upload (mutation; uç keşifte tetiklenmedi).

## 4 dil (i18n) — sağlam, sızıntı yok

| Alan | en | tr | fr | ar (RTL) |
|---|---|---|---|---|
| h1 | Do Not Call List | Aranmayacak Listesi | Liste de numéros exclus | قائمة عدم الاتصال |
| Add Number | Add Number | Numara Ekle | Ajouter un numéro | إضافة رقم |
| Export | Export | Dışa Aktar | Exporter | تصدير |
| Bulk Import | Bulk Import | Toplu İçe Aktarma | Import en masse | استيراد جماعي |
| Dialog başlığı | Add Number to DNC | DNC'ye Numara Ekle | Ajouter un numéro au DNC | إضافة رقم إلى DNC |
| Boş durum | No DNC entries found | DNC kaydı bulunamadı | Aucune entrée DNC trouvée | لم يتم العثور على سجلات DNC |

- Tablo başlıkları (5) dört dilde tam çevrili. Arapça'da `html[dir=rtl]`.
- **Küçük tutarsızlık (not, bulgu değil):** "DNC" kısaltması ve enum sebep değerleri
  bazı dillerde ham kalıyor (veri/teknik kısaltma — sızıntı sayılmaz). TR submit butonu
  "Aramayın Listesine Ekle" başlıktaki "Aranmayacak" ile birebir aynı terimi kullanmıyor
  (çeviri tutarlılığı; iş açısından anlaşılır, hard bulgu değil).

## Bulgular

- **BULGU (export) — `@known-bug`:** `Export` butonu `?format=csv` ile istek atıyor ama
  indirilen dosya adı `dnc-list.json` (uzantı/istenen biçim uyuşmuyor). Kullanıcı CSV
  beklerken JSON iniyor. `@export` guard'ı indirme adını doğruluyor; düzelene kadar
  `test.fail`.

---

# Keşif kapanış matrisi

| Durum | Sonuç | Kanıt / N/A gerekçesi |
|---|---|---|
| Varsayılan / veri-dolu | Kısmi | Test tenant'ında 0 DNC kaydı → yalnız boş-durum gözlendi |
| Satır seçimi / checkbox / bulk bar | N/A | Satır yok; checkbox/bulk-bar gözlemlenmedi |
| Hover / focus ile beliren kontroller | N/A | Satır yok; Actions hücresi boş-durumda yok |
| Kebab / context menüleri | N/A | Kebab menüsü yok (gözlemlendi) |
| Dialog / drawer / detail | Kapsandı | Add Number + Bulk Import dialogları; `veri/exploration{,2}.json` |
| Loading | Kapsandı | Liste iskeleti → boş-durum; `open()` başlık + boş-durum/satır bekler |
| Boş durum | Kapsandı | "No DNC entries found"; canlı + `@errorpath` boş-yanıt mock |
| Hata / abort / 5xx | Kapsandı (test) | `@errorpath` route-mock 500 → kabuk ayakta |
| Yetkisiz / rol sınırı | N/A | Yalnız ADMIN oturumu; rol matrisi kapsam dışı |
| Masaüstü / tablet / mobil | Kapsandı (test) | `@layout` yatay-taşma yok (3 genişlik + RTL) |
| en / tr / fr / ar + RTL | Kapsandı | 4 dil tablosu (yukarıda); `veri/exploration.json` langs |

## Kontrol envanteri

| Durum | Role | Erişilebilir ad | L1 | L2 | L3 | N/A / bulgu |
|---|---|---|---|---|---|---|
| Varsayılan | textbox | Search by phone number... | ✓ | ✓ (liste ucu `search`) | ✓ (boş-durum/filtre) | 0 kayıt → boş-durum |
| Varsayılan | button | Export | ✓ (indirme) | ✓ (`GET /dnc/export`) | guard: dosya adı | BULGU export csv/json |
| Varsayılan | button | Bulk Import | ✓ (dialog) | N/A (dialog istemci) | ✓ (CSV dialog alanları) | upload = mutation→staging |
| Varsayılan | button | Add Number | ✓ (dialog) | N/A (dialog istemci) | ✓ (form alanları) | — |
| Dialog | combobox | Reason (5 seçenek) | ✓ | N/A (istemci) | ✓ (değer güncellenir) | — |
| Dialog | button | Add to DNC | ✓ (route-mock) | ✓ (`POST /dnc`) | N/A prod (mutation→staging) | boş submit validasyon ✓ |
| KPI | — | Total DNC Numbers / Showing / Page | — | ✓ (`@data` API↔UI) | — | totalCount=0 |
| Satır | — | Actions | N/A | N/A | N/A | 0 kayıt → gözlemlenemedi |

## Kapanış kanıtı

- Başlangıç/bitiş baseline'ı: 0 DNC kaydı (salt-okunur; değişmedi).
- Mutation/orphan taraması: keşifte tek POST (`/dnc`) **bloklandı** → orphan yok.
- Çalıştırılan komutlar: salt-okunur keşif scriptleri (silindi — geçici); veri
  `veri/exploration{,2}.json`, `veri/aria-en.yaml` (PII-maskeli, tam-sayfa SS yok).
- Açık bulgular / `test.fail` guard'ları: BULGU (export csv/json uyumsuzluğu).
