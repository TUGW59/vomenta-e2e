# İş Gücü (Workforce) — Keşif Notları

- **Ortam:** app.vomenta.com (canlı), route `/workforce`
- **Tarih:** 28 Tem 2026
- **Yöntem:** Kayıtlı oturumla Playwright; 4 dilde ekran görüntüsü + metin dökümü; oluşturma formu açıldı (submit YOK, prod'a kayıt bırakılmadı).
- **Diller:** 🇬🇧 English · 🇸🇦 العربية (RTL) · 🇹🇷 Türkçe · 🇫🇷 Français

## Özet

İş Gücü Yönetimi bölümü **sağlam durumda**: 4 dilde de tam yerelleştirilmiş, Arapça **RTL** doğru render ediliyor, vardiya **oluşturma formu** açılıyor ve çevrilmiş. Bilinen-hata raporundaki gibi bariz bir bug **bulunmadı**. Birkaç küçük gözlem (a11y + tutarlılık) aşağıda.

## Bölümün yapısı

- **Başlık:** "Workforce Management" + alt başlık "Schedules, time off, and adherence tracking".
- **Sekmeler (7):** Schedules · Time Off · Adherence · Forecast · Badges · Surveys · Evaluations.
- **Schedules görünümü:** haftalık çizelge tablosu — satır = ajan/takım (Account Agent, Invited User, Product Team), sütun = haftanın günleri (Mon 07-27 … Sun 08-02). Her hücrede **"+"** ile o güne vardiya eklenir. Sağ üstte tarih aralığı ok'ları + **"Publish Schedule"**.
- **Oluşturma akışı ("+"):** "Add Shift" diyaloğu açılır → alanlar: **Start Time** (vars. 09:00), **End Time** (vars. 17:00), **Break (minutes)** (vars. 60) → **Cancel / Save**.

## 7 sekmenin envanteri (tamamı incelendi)

| Sekme | Durum | Ana kontroller | Boş-durum metni |
|---|---|---|---|
| **Schedules** | 4 ajan satırı, çizelge dolu | Publish Schedule · tarih ok'ları · her hücrede "+" | — |
| **Time Off** | boş | Request Time Off | "No time off requests" |
| **Adherence** | veri yok | 7d / 14d / 30d filtreleri | "No historical adherence data available" |
| **Forecast** | **veri var (25 satır)** | tahmin tablosu (buton yok) | — |
| **Badges** | boş | Award badge · Create badge | "No badges yet. Create one to get started." |
| **Surveys** | boş | Create survey | "No CSAT surveys" |
| **Evaluations** | boş | Create Evaluation · Trigger AI Evaluation | "No evaluations yet." |

- Hiçbir sekmede ham i18n anahtarı yok. Ekran görüntüleri: `screenshots/tab-01…07-*.png`.

## Tarih navigasyonu & Yayınlama

- **Tarih okları** "Previous Week" / "Next Week" (aria-label'lı ✓) çalışıyor; 3 hafta geri gidildi (2026-07-06'ya). **Geçmiş haftalarda vardiya verisi yok** — çizelge hiç doldurulmamış/yayınlanmamış (`screenshots/schedule-past-weeks.png`).
- **Publish Schedule** butonu var ve aktif; **tıklanmadı** — canlı bir mutasyon ve ajanlara bildirim gönderebilir. Yalnızca staging'de test edilmeli.
- **Oluşturma akışları** (Add Shift, Request Time Off, Create badge/survey/evaluation, Publish) canlıda **tetiklenmedi**; formlar açılıp incelendi.

## 4 dilde durum

| Dil | Yön | Başlık | Sekmeler çevrildi? | Oluşturma formu | Sonuç |
|---|---|---|---|---|---|
| English | ltr | Workforce Management | — | Add Shift (Start/End/Break) | ✅ |
| Türkçe | ltr | İş Gücü Yönetimi | ✅ Programlar, İzinler, Uyum, Tahmin, Rozetler, Anketler, Değerlendirmeler | Vardiya Ekle (Başlangıç/Bitiş Saati, Mola) | ✅ |
| Français | ltr | Gestion des effectifs | ✅ Plannings, Congés, Adhérence, Prévisions, Badges, Enquêtes, Évaluations | Ajouter un quart (Heure de début/fin, Pause) | ✅ |
| العربية | **rtl** | إدارة القوى العاملة | ✅ الجداول, الإجازات, الالتزام, التنبؤ, الشارات, الاستبيانات, التقييمات | إضافة وردية (وقت البدء/الانتهاء, استراحة) | ✅ |

- **RTL (Arapça):** `dir=rtl`, kenar menü sağa, içerik aynalanmış, günler/sekmeler/sütun başlığı ("الوكيل") çevrili. **Doğru.**
- **Sütun başlığı "Agent":** TR'de "Ajan", AR'de "الوكيل" olarak **çevrilmiş**. Metin taramasında görünen "Agent" kelimesi **veri** satırlarından ("Account Agent", "Invited User", "Product Team" = ajan/takım isimleri), UI değil → **sızıntı değil.**
- **Fransızca "Badges":** zaten geçerli Fransızca (badges) → sorun değil.
- **Ham i18n anahtarı:** hiçbir dilde görülmedi.

## Küçük gözlemler (bug değil, iyileştirme fırsatı)

1. **Çizelge "+" hücreleri semantik buton değil.** Hücre bir `<div class="…border-dashed">` (SVG "+"), `<button>` veya `role`/`aria-label` yok → klavyeyle sekme/enter ile erişilemez, ekran okuyucu "vardiya ekle" demez. **Erişilebilirlik açığı.** (Test için de stabil `data-testid` gerekiyor.)
2. **Dil menüsü etiket tutarsızlığı.** İngilizce arayüzde diller endonim gösteriliyor (English, Türkçe, Français, العربية); Arapça arayüzde Arapça gösteriliyor (الإنجليزية, التركية, الفرنسية). Kozmetik.
3. **Header'daki "Language" butonu (aria-label="Language", sağ üst) beklenen dil menüsünü açmadı;** çalışan kontrol kenar menüsünün altındaki dil düğmesi. Teyit edilmeli (gerçek bir kusur olabilir).
4. **"Add Shift" diyalog alt başlığı** ("Haftalık ajan programlarını planlayın ve yayınlayın") bölüm açıklamasını tekrar ediyor; vardiyaya özel bir açıklama değil. Kozmetik.

## Ekran görüntüleri (`screenshots/`)

- `en-1-workforce.png`, `tr-1-workforce.png`, `fr-1-workforce.png`, `ar-1-workforce.png` — 4 dilde çizelge
- `en-2-create.png`, `tr-2-create.png`, `fr-2-create.png`, `ar-2-create.png` — 4 dilde "Add Shift" formu
- `ar-3-reopen-menu.png` — Arapça dil menüsü (açılıyor; etiketler Arapça)
- `01-dil-menu.png` — İngilizce dil menüsü (endonim etiketler)

## Bundan sonra yazılan testler

`tests/workforce.authed.spec.js` (salt-okunur, submit yok):
1. Sayfa başlığı + 7 sekme görünür (@smoke).
2. 7 sekme de yükleniyor ve imza kontrolü/boş-durumu görünüyor (@smoke).
3. Tarih navigasyonu önceki/sonraki haftaya gidiyor.
4. Çizelge hücresine tıklayınca "Add Shift" formu açılır (Start/End/Break) — submit yok.
5. **4 dil için yerelleştirme testi:** başlık, sekmeler, yazı yönü (Arapça=rtl) ve oluşturma formu başlığı beklenen çeviriyle eşleşir.

`tests/workforce-mutations.authed.spec.js` (staging, `@mutation` + `test.fixme`):
- Vardiya oluşturma (Add Shift → Save) + temizlik.
- Publish Schedule + sonrası. Prod'da otomatik engelli.

**Kapsam raporu:** `docs/workforce-kesif/KAPSAM.md` — `node tools/workforce-coverage.mjs` ile **otomatik** üretilir; neyin test edildiğini/edilmediğini gösterir (❌ işaretli mutation'lar henüz yazılmadı).
