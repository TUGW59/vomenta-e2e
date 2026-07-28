# Süpervizör → Temsilci İzleme / Agent Monitor (`/supervisor/agents`) — Keşif Notları

> Tarih: 28 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla 4 dilde inceleme + Network/DOM (inspection) ölçümü + ekran görüntüsü. Yıkıcı eylemler **prod'da tetiklenmedi**.

Ekran görüntüleri: [`screenshots/`](screenshots/)

---

## 1. Sayfanın yapısı

Başlık: **Agent Monitor** (TR: *Ajan İzleme*) · Alt başlık: *Real-time agent status and performance*.
Durum satırı: **Live updates** + **Last refreshed at HH:MM** (⚠ saat yanlış — aşağıda).

**Kontroller:**
- **Durum filtresi** (combobox): All Status / Available / On Call / Wrap-Up / On Break / Away / Lunch / Training / Offline
- **Agent arama** (input, "Search agents...")
- **Analyze** (Anomaly detection): transkript `textarea` + **Analyze** butonu (metin girilene kadar devre dışı)
- Her satırda **Force** (ajanın durumunu zorla değiştir menüsü)
- **Previous / Next** sayfalama

**İstatistik döşemeleri:** Total, Available, On Call, Wrap-Up, Break, Offline, Calls Today, Avg AHT.
**Tablo kolonları:** Agent, Status, Current Interaction, AHT, Calls, CSAT, Actions.

---

## 2. 4 Dil Yerelleştirme Durumu — SAĞLAM ✅

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| `html[dir]` | ltr | ltr | ltr | **rtl** ✅ |
| Başlık | Agent Monitor | Ajan İzleme | Moniteur des agents | مراقب الوكلاء |
| Alt başlık | Real-time agent status and performance | Gerçek zamanlı ajan durumu ve performansı | Statut et performance des agents en temps réel | حالة الوكيل والأداء في الوقت الفعلي |
| Live updates | Live updates | Canlı güncellemeler | Mises à jour en direct | تحديثات مباشرة |
| Durum filtresi | All Status | Tüm Durumlar | Tous les statuts | جميع الحالات |
| Analyze | Analyze | Analiz et | Analyser | تحليل |
| Force | Force | Zorla | Forcer | إجبار |
| İstatistikler | Total/Available/On Call/Wrap-Up/Break/Offline/Calls Today/Avg AHT | Toplam/Uygun/Aramada/Tamamlama/Mola/Çevrimdışı/Bugünkü Aramalar/Ort. OİS | Total/Disponible/En appel/Clôture/Pause/Hors ligne/Appels aujourd'hui/TMT moyen | الإجمالي/متاح/في مكالمة/إنهاء/استراحة/غير متصل/مكالمات اليوم/متوسط AHT |

**Sonuç:** Duvar Panosu'nun aksine bu sayfada **çeviri sızıntısı yok** — Force, Analyze, tüm etiketler, tablo başlıkları ve durum filtresi 4 dilde çevrili. **Arapça RTL doğru**.
**Küçük gözlem (bug değil):** "AHT" kısaltması en/ar'de aynen kalıyor (tr=OİS, fr=TMT). Tutarsız ama yaygın kabul edilen kısaltma.

---

## 3. Kontrollerin 3 Katmanlı (L1/L2/L3) Durumu

Backend ucu: `GET /api/v1/supervisor/agents?status=...&search=...&page=...&limit=...`

| Kontrol | L1 Tıklama | L2 Arka plan | L3 Görev |
|---|---|---|---|
| **Durum filtresi** | ✅ menü + 9 seçenek | ✅ `GET agents?status=OFFLINE` | ✅ tablo o duruma filtreleniyor |
| **Agent arama** | ✅ yazılabiliyor | ✅ `GET agents?search=Account` | ✅ eşleşene daralıyor (Account Agent kalır, Product Team gizlenir) |
| **Force** (ajan durumu) | ✅ menü açılır (Available/Break/Lunch/Training/Offline) | ⚠ YIKICI → staging @mutation | ⚠ YIKICI → staging @mutation |
| **Analyze** (anomali) | ✅ transkript girilince buton etkinleşiyor | ⚠ AI analiz isteği → ayrıca | ⚠ AI sonucu (deterministik değil) → ayrıca |
| **Sayfalama** | ✅ Prev/Next mevcut (tek sayfada Next devre dışı) | — N/A | — N/A (>20 ajan gerekir) |

> ⚠ **Force** ajanın durumunu canlı sistemde değiştirir (mutation, socket.io olabilir) → prod'da tetiklenmedi. L2/L3 yalnızca staging'de `@mutation` + `mutationGuard` + `cleanup` (durumu geri al) ile; şimdilik `test.fixme` stub.

---

## 🐞 BULGU — "Last refreshed" saati UTC gösteriliyor (Duvar Panosu BULGU 4 ile aynı sınıf)

**Beklenen:** "Last refreshed at" kullanıcının yerel saatini göstermeli.
**Gerçekleşen:** Sunucunun **UTC** zamanı yerele çevrilmeden basılıyor → Türkiye'de (UTC+3) **~3 saat geride**.

**Inspection kanıtı** (tarayıcı tz = Europe/Istanbul):
- Header duvar saati: **03:37 PM** (yerel, doğru)
- "Last refreshed at **12:37 PM**" (UTC — yerel değil) ❌
- Dört dilde de aynı: TR "Son yenileme: 12:38 PM", FR "Dernière actualisation à 12:39 PM", AR "آخر تحديث في 12:39 PM".

Yani timezone hatası tek sayfaya özgü değil; **süpervizör bölümünde yaygın** (Duvar Panosu'nda da vardı). Test: `test.fail` (düzelince uyarır).

---

## Test karşılığı

`tests/supervisor-agents.authed.spec.js` (+ `tests/pages/AgentMonitorPage.js`, `app.agentMonitor`).
Yapı @smoke/@critical, 4 dil guard'ları @regression, her kontrol için L1/L2/L3 (Durum filtresi ve Arama tam yeşil), Force/Analyze L1 + staging fixme, timezone `test.fail`. **19/19 yeşil** (chromium-authed). Dil değiştirici artık `BasePage.switchLanguage`.
