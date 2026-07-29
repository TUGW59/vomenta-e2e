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
- Test edilen sayfa/bölümün görünür metni **4 dilde** (en/tr/fr/ar) doğrulandı;
  Arapça `rtl` yönü kontrol edildi; çeviri sızıntısı veya iç/teknik terim sızıntısı
  bulgu olarak raporlandı ve düzelene kadar `test.fail` guard'ıyla işaretlendi.
  Ayrıntı: `AGENTS.md` → "Çok dilli (i18n) doğrulama standardı".
- Navigasyon kontrolleri (link/kart/menü) için L3, hedef sayfanın **gerçekten
  yüklendiğini** (beklenen başlık/içerik görünür) doğruluyor; salt URL eşleşmesiyle
  yetinilmedi. Ayrıntı: `AGENTS.md` → "İnteraktif kontrol testi standardı (3 katman)".
- L3, "bir tepki oldu"la yetinmiyor; sonucun **doğruluğunu** kanıtlıyor (filtre →
  dönen kayıtlar ölçüte uyuyor, arama → yalnızca eşleşen kalıyor, analiz → sonuç
  anlamlı). Detay paneli/drawer verisi kaynak satır/kartla **tutarlı** (view-consistency).
  Ayrıntı: `AGENTS.md` → "İnteraktif kontrol testi standardı (3 katman)".
- İkon-only butonlar (görünüm toggle, satır ikonları, ⋮) erişilebilir isim (`aria-label`)
  taşıyor; eksikse a11y **bulgu**su olarak raporlandı. Ayrıntı: `AGENTS.md` →
  "Responsive / taşma ve erişilebilirlik standardı".
- Sekme testi `aria-selected` + panel içerik imzasını doğruluyor; KPI/metrik
  kartları etiket değil **değer** de doğruluyor (boş/veri ayrımı). Ayrıntı:
  `AGENTS.md` → "İçerik ve değer derinliği standardı".
- Kritik akışta "sessiz hata yok" (`diagnostics.assertClean`), kullanıcıya görünen
  saatler yerel TZ (`assertLocalClock`), oluşturma formunda submit-sonucu doğrulanmış
  veya açık N/A. Ayrıntı: `AGENTS.md` → "Sessiz hata / zaman / form-gönderim standartları".
- Test edilen sayfa `tests/contracts/tested-pages.js`'e tescil edildi; **zorunlu test stilleri**
  (baseline + arketip koşullu) kapsandı ya da `naStyles` ile gerekçeli **N/A** verildi.
  `npm run quality:styles` (stil matrisi) yeşil. Ayrıntı: `AGENTS.md` → "Zorunlu test stilleri",
  el kitabı `docs/TEST_STYLES.md`.
- Seçiciler Page Object veya ortak component içinde.
- Test başka testlerden ve mevcut tenant verisinden bağımsız.
- Veri değişiyorsa `@mutation`, staging-only guard ve `testEntity.create`
  (`0→1→0` baseline + create öncesi rollback kaydı) yaşam döngüsü
  mevcut; rollback mutasyondan önce kaydedildi, retry `0`, lane worker'ı `1`.
- Keşif notunda varsayılan + seçim/bulk + hover/focus + menüler + dialog/drawer +
  boş/loading/hata + responsive/i18n durumlarını içeren `Keşif kapanış matrisi`
  tamamlandı; olmayan durumlar gerekçeli N/A.
- Negatif assertion hedef UI ve ilgili veri isteği hazır olduktan sonra yapılıyor;
  kısmi avatar/baş-harf eşleşmesi iş kimliği olarak kullanılmıyor.
- `npm run quality:check` ve ilgili test paketi geçti.
- Retry ile geçen flaky test bulunmuyor.
- Trace/diagnostics hata halinde yeterli kanıt üretiyor. Trace başarısızlıkta
  **otomatik** kaydediliyor (`trace: retain-on-failure`); bir bug bulunduğunda veya
  davranış şüpheli olduğunda kök-neden **Trace Viewer** ile (paket + DOM snapshot)
  netleştirildi. Ayrıntı: `AGENTS.md` → "Teşhis ve izleme (Tracing) standardı".

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
- Görünür metin 4 dilde (en/tr/fr/ar) doğrulanıyor mu; Arapça `rtl` kontrol edilmiş mi; çeviri/iç-terim sızıntısı bulgu olarak `test.fail` ile işaretlenmiş mi?
- Navigasyon L3'ü hedef sayfanın gerçekten yüklendiğini (başlık/içerik) doğruluyor mu, yoksa yalnızca URL'e mi bakıyor?
- L3 "çalışıyor"la mı yetiniyor yoksa sonucun **doğruluğunu** mu kanıtlıyor; detay/drawer verisi kaynak satırla tutarlı mı?
- İkon-only butonların erişilebilir ismi var mı; eksikse bulgu olarak işaretlenmiş mi?
- Bir bug/şüpheli durum için kök-neden **Tracing** ile netleştirildi mi (paket/DOM); mutasyon prod'da tetiklenmeden mi teşhis edildi?
- Aynı hata daha hızlı bir unit/API/component testinde yakalanabilir mi?
- Test verisi çakışmadan paralel çalışabilir mi?
- Hata mesajı neyin bozulduğunu doğrudan anlatıyor mu?
- UI değişikliği tek Page Object güncellemesiyle karşılanabilir mi?
- Production güvenliği korunuyor mu?
- Checkbox/seçim, hover/focus ve `...` menüleri denenerek sonradan beliren bütün
  kontroller envantere girdi mi?
- Rollback create/write işleminden önce mi kayıtlı; başlangıç/create/bitiş
  baseline'ı `0→1→0` mı; cleanup hatası görünür mü; mutation retry gerçekten
  `0` mı?

## İstisnalar

Kalıcı skip, quarantine, production mutasyonu veya katman sınırı ihlali normal PR
kararı değildir. Gerekçe, sahip, sona erme tarihi ve alternatifleri içeren ADR
gerektirir.
