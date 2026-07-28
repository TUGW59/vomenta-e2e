# İş Gücü (Workforce) — Test Kapsam Raporu

> Bu dosya OTOMATİK üretilir: `node tools/workforce-coverage.mjs`. Elle düzenlemeyin.

Kaynak spec'ler: `tests/workforce.authed.spec.js`, `tests/workforce-mutations.authed.spec.js` · Toplam test: **7**

## Özet

- ✅ Prod'da kapsanan (salt-okunur): **13**
- 🔒 Opt-in (yalnızca `npm run test:mutation`): **2**
- ❌ Henüz test yok: **5**

## Kapsam matrisi

| Alan | Öğe | Tip | Durum | Test(ler) |
|---|---|---|---|---|
| Genel | Sayfa başlığı yükleniyor | salt-okunur | ✅ Kapsanıyor | sayfa başlığı ve 7 sekme görünüyor @smoke |
| Genel | 7 sekme yükleniyor + imza kontrolü | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Yerelleştirme | 4 dil çeviri (en/tr/fr/ar) | salt-okunur | ✅ Kapsanıyor | <dil> · Workforce <dil> diline doğru çevriliyor (başlık, sekmeler, yön, form) |
| Yerelleştirme | Arapça RTL (dir=rtl) | salt-okunur | ✅ Kapsanıyor | <dil> · Workforce <dil> diline doğru çevriliyor (başlık, sekmeler, yön, form) |
| Yerelleştirme | Ham i18n anahtarı yok | salt-okunur | ✅ Kapsanıyor | <dil> · Workforce <dil> diline doğru çevriliyor (başlık, sekmeler, yön, form) |
| Schedules | Çizelge tablosu + Publish butonu görünür | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Schedules | Tarih navigasyonu (önceki/sonraki hafta) | salt-okunur | ✅ Kapsanıyor | tarih navigasyonu önceki/sonraki haftaya gidiyor |
| Schedules | Add Shift formu açılıyor (Start/End/Break) | salt-okunur | ❌ Test yok | — |
| Schedules | Vardiya oluşturma (Add Shift → Save) | mutation | 🔒 Opt-in (test:mutation) | vardiya oluşturulunca çizelgede  |
| Schedules | Publish Schedule (yayınlama + sonrası) | mutation | 🔒 Opt-in (test:mutation) | çizelge yayınlanınca vardiyanın  |
| Time Off | Sekme + "Request Time Off" + boş durum | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Time Off | İzin talebi oluşturma | mutation | ❌ Test yok | — |
| Adherence | Sekme + 7d/14d/30d filtreleri | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Forecast | Sekme + tahmin tablosu (veri) | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Badges | Sekme + Award/Create badge + boş durum | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Badges | Rozet oluşturma / verme | mutation | ❌ Test yok | — |
| Surveys | Sekme + Create survey + boş durum | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Surveys | Anket oluşturma | mutation | ❌ Test yok | — |
| Evaluations | Sekme + Create/Trigger Evaluation | salt-okunur | ✅ Kapsanıyor | 7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke |
| Evaluations | Değerlendirme oluşturma / AI tetikleme | mutation | ❌ Test yok | — |

## Notlar

- 🔒 **Opt-in mutation'lar** normal koşularda/CI'da çalışmaz; yalnızca `npm run test:mutation` (canlı için `test:mutation:prod`) ile çalışır. Çift kilit + cleanup. Bkz. docs/adr/0002-opt-in-mutation-tests.md.
- ❌ işaretli mutation'lar (izin talebi, rozet, anket, değerlendirme oluşturma) henüz yazılmadı — eklenebilir.
- Keşif detayı ve ekran görüntüleri: `docs/workforce-kesif/NOTLAR.md`.
