# Katkı standardı

## Definition of Done

Bir değişiklik aşağıdakilerin tamamı sağlanmadan tamamlanmış sayılmaz:

- Kullanıcı davranışı ve iş riski açıkça tanımlandı.
- Uygun test katmanı seçildi; her şey E2E teste taşınmadı.
- Yeni/değişen kritik davranış için otomatik test mevcut.
- İnteraktif kontroller (buton/toggle/seçici) **en az 3 katmanda** test edildi:
  **L1** tıklama/tepki, **L2** arka plan (network), **L3** görev/amaç. Gerçekten olmayan
  katman (saf istemci → L2, mutation → L3) açık "N/A" gerekçesiyle belgelendi.
  Ayrıntı: `AGENTS.md` → "İnteraktif kontrol testi standardı (3 katman)".
- Seçiciler Page Object veya ortak component içinde.
- Test başka testlerden ve mevcut tenant verisinden bağımsız.
- Veri değişiyorsa `@mutation`, production guard ve cleanup mevcut.
- `npm run quality:check` ve ilgili test paketi geçti.
- Retry ile geçen flaky test bulunmuyor.
- Trace/diagnostics hata halinde yeterli kanıt üretiyor.

## Pull request akışı

1. Değişiklik küçük ve tek risk alanına odaklı tutulur.
2. PR şablonundaki test kanıtları doldurulur.
3. `Architecture and test discovery` zorunlu kontroldür.
4. `Public smoke / Chromium` zorunlu kontroldür.
5. Kritik davranışlarda `Critical authenticated / Chromium` geçmeden merge yapılmaz.
6. Başarısız veya flaky test override edilmez; kök neden düzeltilir.

## Test inceleme kontrolü

Reviewer şu soruları yanıtlar:

- Test gerçek kullanıcı davranışını mı, implementasyon ayrıntısını mı doğruluyor?
- İnteraktif kontrol L1/L2/L3 (tıklama / arka plan / görev) katmanlarında doğrulanıyor mu; eksik katman N/A olarak belgelenmiş mi?
- Aynı hata daha hızlı bir unit/API/component testinde yakalanabilir mi?
- Test verisi çakışmadan paralel çalışabilir mi?
- Hata mesajı neyin bozulduğunu doğrudan anlatıyor mu?
- UI değişikliği tek Page Object güncellemesiyle karşılanabilir mi?
- Production güvenliği korunuyor mu?

## İstisnalar

Kalıcı skip, quarantine, production mutasyonu veya katman sınırı ihlali normal PR
kararı değildir. Gerekçe, sahip, sona erme tarihi ve alternatifleri içeren ADR
gerektirir.
