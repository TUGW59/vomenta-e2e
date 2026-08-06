# Süpervizör → Agent Live / Canlı Aracı (`/supervisor/calls`) — Keşif Notları

> Tarih: 29 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla 4 dilde inceleme + Network/DOM + ekran görüntüsü. Mutasyonsuz.

Ekran görüntüleri: [`screenshots/`](screenshots/)

## 1. Yapı
Başlık **Agent Live** · Alt başlık *Live calls currently handled by a voice AI agent. Select one to open its cockpit.*
Sesli **AI aracısı**nın yönettiği canlı çağrıların "cockpit" listesi. **Kontrol yok** (filtre/arama/buton/sekme yok; combobox=0, input=0).
Backend: `GET /api/v1/supervisor/active-ai-sessions` (+ `/voice/calls/live`).

**Boş durum:** Canlı AI çağrısı yokken → **"No live AI calls"** + "When a voice AI agent picks up a call, it'll appear here in real time." Timestamp/saat gösterilmiyor → timezone N/A.

## 2. 4 Dil — SAĞLAM ✅ (sızıntı yok)
| Öğe | en | tr | fr | ar |
|---|---|---|---|---|
| dir | ltr | ltr | ltr | **rtl** ✅ |
| Başlık | Agent Live | Canlı Aracı | Agent en direct | الوكيل المباشر |
| Alt başlık | Live calls currently handled by a voice AI agent… | Şu anda bir sesli yapay zeka aracısı tarafından yönetilen canlı çağrılar… | Appels en direct actuellement gérés par un agent IA vocal… | المكالمات المباشرة التي يتولاها حاليًا وكيل ذكاء اصطناعي صوتي… |
| Boş durum | No live AI calls | Canlı yapay zeka çağrısı yok | Aucun appel IA en direct | لا توجد مكالمات ذكاء اصطناعي مباشرة |

Tüm görünür metin 4 dilde çevrili; **Arapça RTL doğru**. Çeviri sızıntısı yok.

## 3. Kontroller / 3 Katman
Sayfada interaktif kontrol yok. Tek etkileşim: **canlı AI çağrısı satırına tıklayıp cockpit açmak** — bu yalnızca AKTİF bir AI çağrısı varken mümkün. Şu an boş-durum → L1/L2/L3 test edilemez → **staging/canlı veri** planı (`test.fixme`).

## 4. Bulgu
- **Bug bulunmadı.** i18n sağlam, boş-durum doğru + çevrili, timezone gösterimi yok.

## Test karşılığı
`tests/supervisor/supervisor-agent-live.authed.spec.js` (+ `tests/pages/AgentLivePage.js`, `app.agentLive`).
Yapı @smoke/@critical + 4 dil guard'ları @regression + cockpit staging-fixme. **7/7 yeşil** (chromium-authed).
