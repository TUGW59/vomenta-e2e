# Bulgu 02 — Tarih Aralığı etiketi UTC gösteriyor (yerel değil)

- **Alan:** Raporlar › **tüm alt raporlar** (call/agent/queue — ve aynı kabuğu paylaşan diğerleri) — "Tarih Aralığı" kartı
- **Ortam:** canlı `app.vomenta.com`, 29 Tem 2026, Chromium (Playwright), timezone Europe/Istanbul (UTC+3)
- **Bulan:** kullanıcı (manuel — "genel tarih aralığı bozuk gibi") · **Doğrulayan:** otomasyon (API + UI karşılaştırması)
- **Ciddiyet:** Orta — veri yanıltıcı görünüyor (kullanıcı yanlış aralık sanıyor); sorgu doğru ama etiket yanlış
- **Durum:** Açık · **Tekrarlanabilir:** ✅ %100 (tüm alt raporlarda)

## Özet

Tarih preset'lerinde ("Bugün", "7 Gün", ...) gösterilen **Tarih Aralığı etiketi**, tarihleri
**UTC** ile biçimlendiriyor; kullanıcının yerel saat dilimine çevirmiyor. UTC+3'te başlangıç tarihi
**bir gün geride** görünüyor. Sorgulanan gerçek aralık (API) yerel-gece-yarısına göre ~doğru; hata
yalnızca **gösterilen etikette**.

## Kanıt (Playwright, timezone=Europe/Istanbul)

| Preset | UI etiketi | API `startDate` | API'nin yerel karşılığı | Sorun |
|---|---|---|---|---|
| Bugün | **Jul 28 – Jul 29** | `2026-07-28T21:00:00Z` | **Jul 29** 00:00 yerel | etiket başlangıcı 1 gün geride (dün gibi) |
| 7 Gün | **Jul 21 – Jul 29** | `2026-07-21T21:00:00Z` | **Jul 22** 00:00 yerel | 8 günmüş gibi görünüyor (aslında ~7) |
| 30 Gün | Jun 28 – Jul 29 | `2026-06-28T21:00:00Z` | Jun 29 yerel | aynı 1-gün kayması |
| 90 Gün | Apr 29 – Jul 29 | `2026-04-29T21:00:00Z` | Apr 30 yerel | aynı 1-gün kayması |

`21:00Z` = UTC+3'te ertesi gün `00:00` (yerel gece yarısı) → API aralığı doğru; ama etiket
`21:00Z`'yi **"Jul 28"** olarak (UTC günü) basıyor. call/agent/queue'da birebir aynı.

## Beklenen / Gerçekleşen

- **Beklenen:** "Bugün" → etiket "Jul 29 – Jul 29" (yerel bugün). "7 Gün" → 7 günlük yerel aralık.
- **Gerçekleşen:** başlangıç tarihi UTC'den basıldığı için bir gün erken; "Bugün" iki günmüş, "7 Gün" sekiz günmüş gibi görünüyor.

## Kök neden

Aralık uç değerleri (özellikle `startDate`) ekranda **UTC olarak** biçimlendiriliyor; kullanıcının
yerel timezone'una çevrilmiyor. Wallboard "Live" saati (BULGU 4) ve Temsilci İzleme "Last refreshed"
ile **aynı timezone-gösterim sınıfı**. Bkz. AGENTS.md → "Sessiz hata / zaman / form-gönderim standartları"
(timezone), ortak yardımcı `helpers.js → assertLocalClock`.

## Önerilen düzeltme (frontend)

Tarih Aralığı etiketini kullanıcının yerel saat dilimine göre biçimlendir (ör. tarih-fns/Intl ile
yerel gün), UTC ISO'yu doğrudan gün olarak basma. Böylece etiket API'nin yerel aralığıyla eşleşir.

## Otomatik regresyon

`tests/reports-sections.authed.spec.js` → **"Date Range timezone @regression @known-bug"** describe'ı:
`test.use({ timezoneId: 'Europe/Istanbul' })` altında "Bugün" preset'ine tıklanır ve etiket
başlangıcının **yerel bugün** olması beklenir. Bug açıkken `test.fail` (beklenen başarısızlık);
düzelince "beklenmedik geçiş" → `test.fail` kaldırılıp kalıcı guard olur.
