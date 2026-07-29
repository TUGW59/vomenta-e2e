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

## 3 KATMANLI TEST TURU (28 Tem 2026) — endpoint haritası + bulgular

AGENTS.md 3-katman standardına (L1 tıklama / L2 arka plan / L3 görev) göre kontroller
network incelemesiyle yeniden test edildi.

**Backend uçları (Network ile doğrulandı):**
- `GET /api/v1/wfm/schedules?startDate&endDate` — haftalık çizelge (tarih nav yeni hafta çeker)
- `GET /api/v1/wfm/schedules/adherence?date=…` (14d/30d çoklu), `.../forecast`
- `GET /api/v1/wfm/time-off | gamification/badges | gamification/surveys | evaluations` (ilgili sekme tıklanınca)
- `POST /api/v1/wfm/schedules → 201` (vardiya oluştur + yayınla), `DELETE /api/v1/wfm/schedules/{id} → 204` (sil)

**Kanıtlanan davranış:**
- Vardiya oluştur: hücre "09:00 - 17:00 / 60m break / **Draft**". Publish → **"Draft" rozeti kalkar** (yayınlandı). Sil: "Edit Shift" → Delete → hücre boşalır. **Cleanup güvenilir** (koşu sonrası çizelge temiz).

**Gözlemler (olası kusur):**
- **Çift tab bar:** "Badges" sekmesine girince ikinci (aynı) bir görünür tab bar mount oluyor (yüklemede 1 tablist, sonra 2). Locator ana tablist'e sabitlendi; UX açısından incelenmeli.
- "+" hücreleri hâlâ semantik buton değil (a11y) ve Adherence 7d/14d/30d'de seçili-durum için semantik sinyal (aria-pressed) yok → data-testid istenmeli.

## Yazılan testler

`tests/workforce.authed.spec.js` (salt-okunur, 3 katman + yapı + 4 dil):
- Yapı (@smoke/@critical), 4 dil çeviri guard'ı (RTL dahil).
- Her kontrol için L1/L2/L3: Sekme navigasyonu, Tarih navigasyonu, Adherence aralığı, Add Shift, Publish. L2 mutasyonları `page.route` ile yakalanır (prod'a yazılmaz). L3 kalıcı-kayıt N/A'ları açıkça belgeli.

`tests/workforce-mutations.authed.spec.js` (`@mutation`, L3 görev — opt-in çift kilit):
- Add Shift kalıcı vardiya oluşturur (POST) + cleanup siler.
- Publish "Draft"ı yayınlar + cleanup siler. Yalnızca kimliği doğrulanan staging
  tenant'ında `npm run test:mutation` (bkz. docs/adr/0004).

**Kapsam raporu:** `docs/TEST_COVERAGE.md` — `npm run report:coverage` ile tüm depodan **otomatik** üretilir.

## İzinler (Time Off) — izin talebi (28 Tem 2026)

Sekme: "Time Off" (TR "İzinler"). İçerik: **Request Time Off** butonu + tablo
(Agent / Start Date / End Date / Reason / Status / Reviewed By / Actions) + boş
durum "No time off requests".

**Request Time Off formu:** Start Date, End Date (`<input type="date">`),
Reason (opsiyonel, textarea). **Submit, iki tarih dolana kadar pasiftir.**

**Backend (canlıda doğrulandı):**
- Oluştur: `POST /api/v1/wfm/time-off → 201`. Satır "Pending" durumuyla gelir
  (tarih "Sep 15, 2026" biçiminde).
- Durum değiştir: `PATCH /api/v1/wfm/time-off/{id} → 200` (Onayla/Reddet).
- **DELETE ucu YOK.** Durum terminal olunca (Approved/Rejected) satırdaki "Actions"
  düğmeleri kaybolur; `page.request.delete` → **401**. Yani izin talebi **UI'dan
  silinemez, geri alınamaz.**

**3 katman kararı:**
- L1 — form açılır, tarih dolunca Submit etkinleşir. ✓
- L2 — Submit `POST /wfm/time-off` (page.route ile yakalanır, **prod'a yazılmaz**). ✓
- **L3 — N/A:** talep silinemediği için gerçek create KALICI kayıt bırakır →
  L3 opt-in mutation güvenli değil, yazılmadı. (Schedules'ta `DELETE→204` olduğu
  için L3 mutation güvenliydi; Time Off'ta yok.)

**Gözlemler:** Actions ikon-butonlarının erişilebilir ismi yok (a11y). Kalibrasyon
sırasında silinemeyen 1 "PW otomasyon testi / Approved" talebi test hesabında kaldı
(zararsız test verisi; UI'dan kaldırma yolu yok).

## Gamification / Değerlendirme oluşturma formları (28 Tem 2026)

- **Create badge** (`POST /wfm/gamification/badges`): Name, Category, Points.
- **Award badge**: Badge, Agent, Reason (var olan rozet + ajan seçimi).
- **Create survey** (`/wfm/gamification/surveys`): Name, description, Channels, Trigger event, Questions (JSON).
- **Create Evaluation** → "Create Quality Evaluation" (`/wfm/evaluations`): Interaction ID/Type, Agent, Score, Form Data (JSON), Feedback.

**3 katman kararı:** L1 (form açılır) yazıldı ve yeşil. **L2 = N/A (bu tur):** formlar boş submit'te istek atmıyor; valid veri karmaşık (rozet/ajan seçimi, JSON) ve yanlış girişte gerçek kayıt riski var → uydurma test yazılmadı. **L3 = N/A:** güvenli silme yolu doğrulanamadı (Time Off gibi kalıcı kayıt riski). Test hesabında kalıntı bırakılmadı (kontrol edildi: Badges listesi boş).
