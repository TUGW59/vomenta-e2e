# Süpervizör → Canlı Etkileşimler / Live Interactions (`/supervisor/interactions`) — Keşif Notları

> Tarih: 29 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla 4 dilde inceleme + Network/DOM (inspection) + ekran görüntüsü. Mutasyonsuz.

Ekran görüntüleri: [`screenshots/`](screenshots/)

## 1. Yapı
Başlık **Live Interactions** · Alt başlık *Monitor all active calls and conversations in real-time*.
Kontroller: **kanal filtresi** (combobox "All Channels" → Voice/Chat/Email) + **arama** ("Search by customer, agent...") + "N active" sayacı.
Tablo kolonları: Channel, Customer, Agent, Duration, Queue, Sentiment, Status, Actions.
Backend: `GET /api/v1/supervisor/interactions?channel=&page=&limit=` (+ `/voice/calls/live`).

**Boş durum:** Aktif etkileşim yokken (tüm ajanlar çevrimdışı) → **"No active interactions"** + yönlendirme metni. Bu tur satır-aksiyonları (Actions kolonu) görünmüyor.

## 2. 4 Dil — SAĞLAM ✅ (sızıntı yok)
| Öğe | en | tr | fr | ar |
|---|---|---|---|---|
| dir | ltr | ltr | ltr | **rtl** ✅ |
| Başlık | Live Interactions | Canlı etkileşimler | Interactions en direct | التفاعلات المباشرة |
| Alt başlık | Monitor all active calls… | Tüm aktif aramaları ve görüşmeleri… | Surveillez tous les appels… | راقب جميع المكالمات… |
| Kanal filtresi | All Channels | Tüm kanallar | Tous les canaux | جميع القنوات |
| Sayaç | 0 active | 0 aktif | 0 actif(s) | 0 نشط |
| Kolonlar | Channel/Customer/Agent/Duration/Queue/Sentiment/Status/Actions | Kanal/Müşteri/Temsilci/Süre/Kuyruk/Duygu durumu/Durum/İşlemler | Canal/Client/Agent/Durée/File/Sentiment/Statut/Actions | القناة/العميل/الوكيل/المدة/الطابور/المشاعر/الحالة/إجراءات |
| Boş durum | No active interactions | Aktif etkileşim yok | Aucune interaction active | لا توجد تفاعلات نشطة |

Tüm görünür metin (kolonlar + boş-durum + sayaç dahil) 4 dilde çevrili; **Arapça RTL doğru**. Çeviri sızıntısı yok.

## 3. Kontrollerin 3 Katmanlı Durumu
| Kontrol | L1 | L2 | L3 |
|---|---|---|---|
| **Kanal filtresi** | ✅ menü + 4 seçenek | ✅ `GET interactions?channel=voice` | ⚠ N/A — aktif etkileşim yok (filtre sonucu boş; canlı veri/staging) |
| **Arama** | ✅ yazılabiliyor | ⚠ boş veriyle istek atmıyor (istemci-taraflı/no-op olası) | ⚠ N/A — boş veri |
| **Satır aksiyonları** (izleme/araya girme) | — | — | ⚠ N/A — yalnızca AKTİF etkileşimde görünür → staging/canlı veri |

## 4. Bulgu / Gözlem
- **Bug bulunmadı.** i18n sağlam, kanal filtresi doğru uca istek atıyor, timezone gösterimi yok (boş-durum saat göstermiyor).
- Zengin satır-aksiyonları (canlı çağrı/sohbet izleme) **canlı etkileşim** gerektirir; bu tur boş-durum nedeniyle test edilemedi → staging planı (`test.fixme`).

## Test karşılığı
`tests/supervisor/supervisor-interactions.authed.spec.js` (+ `tests/pages/InteractionsPage.js`, `app.interactions`).
Yapı @smoke/@critical, 4 dil guard'ları @regression, kanal filtresi L1+L2, arama L1, satır-aksiyonları staging-fixme. **12/12 yeşil** (chromium-authed).
