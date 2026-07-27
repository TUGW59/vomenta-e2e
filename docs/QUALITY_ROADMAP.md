# Uzun vadeli kalite ve test yol haritası

## Hedef

Amaç daha fazla E2E testi yazmak değil; bir değişikliğin oluşturduğu hatayı en
ucuz ve en hızlı katmanda yakalayan, sonucu güvenilir biçimde açıklayan bir kalite
sistemi kurmaktır.

Başarı ölçütleri:

- Pull request geri bildirimi 5 dakikanın altında.
- Kritik release paketi 10 dakikanın altında.
- Kritik kullanıcı yolculuklarının yüzde 100'ü otomatik kalite kapısında.
- Flaky oranı yüzde 1'in altında; kritik pakette yüzde 0.
- Test hatalarının en az yüzde 90'ı trace, ekran görüntüsü veya API cevabıyla
  doğrudan teşhis edilebilir.
- Production'da otomasyon kaynaklı veri mutasyonu sıfır.

## Kalite katmanları

```text
Her commit
  ├─ Static analiz / type check / unit test       saniyeler
  ├─ API ve component sözleşme testleri           1–3 dakika
  ├─ Playwright public smoke                      2–5 dakika
  └─ Değişen özelliğin kritik E2E testleri         5–10 dakika

Main / release
  ├─ Tüm kritik kullanıcı yolculukları
  ├─ Rol ve yetki matrisi
  └─ API contract kontrolleri

Gece
  ├─ Üç tarayıcıda tam regresyon
  ├─ Erişilebilirlik
  ├─ Görsel regresyon
  └─ Flaky ve performans eğilimi analizi
```

Playwright bütün piramidin yerine geçmez. İş kuralları uygulama reposundaki unit
ve integration testlerinde; tarayıcı entegrasyonu ve gerçek kullanıcı
yolculukları bu repoda doğrulanmalıdır.

## Faz 1 — Güvenilir temel (0–30 gün)

### Yapılacaklar

1. Ayrılmış staging tenant'ı ve otomasyon hesapları oluştur.
2. Kritik UI elemanları için frontend ekibiyle `data-testid` sözleşmesi belirle.
3. Testleri `@smoke`, `@critical`, `@mutation`, `@a11y`, `@visual` olarak sınıflandır.
4. Her kritik testin sabit tenant verisine bağımlılığını kaldır.
5. API ile veri kurma/temizleme endpoint'lerini tanımla.
6. Admin, supervisor ve agent için ayrı oturum projeleri oluştur.
7. Flaky testlerin CI'ı başarısız saymasını zorunlu kıl.

### Çıkış kriteri

- PR public smoke paketi kararlı biçimde çalışıyor.
- Main critical paketi staging üzerinde çalışıyor.
- Production'da yalnızca açıkça salt-okunur kontroller var.
- Test hesabı gerçek çalışan veya müşteri hesabı değil.
- Kritik pakette retry ile geçen test yok.

## Faz 2 — Risk bazlı kapsama (31–60 gün)

### Kritik yolculuk envanteri

Her yolculuk için aşağıdaki kayıt tutulur:

| Alan | Örnek |
|---|---|
| Yolculuk | Müşteri mesajı gelir → agent yanıtlar |
| İş etkisi | Mesaj kaybı / SLA ihlali |
| Öncelik | P0 / P1 / P2 |
| Sahip | Ürün ekibi + QA sahibi |
| Roller | Agent, supervisor |
| Veri | Tenant, channel, contact |
| Otomasyon katmanı | API contract + E2E |
| CI kapısı | PR / main / nightly |

İlk kapsanacak alanlar:

1. Login, session yenileme ve logout.
2. Inbox mesaj alma/gönderme.
3. Ticket oluşturma, atama ve durum değiştirme.
4. Contact oluşturma, arama ve ilişkilendirme.
5. Voice çağrı başlatma/bitirme temel akışı.
6. Rol ve yetki sınırları.
7. Kritik raporların doğru veri göstermesi.

### Çıkış kriteri

- P0/P1 yolculukların tamamı bir kalite kapısına bağlı.
- Her kritik yolculuğun ürün ve test sahibi belli.
- Yetki testleri hem “görebilir” hem “göremez” senaryolarını içeriyor.
- Test verileri paralel çalışmada çakışmıyor ve otomatik temizleniyor.

## Faz 3 — Hızlı değişiklik algılama (61–90 gün)

### Değişiklik-etki eşlemesi

Kod alanları test etiketleriyle eşleştirilir:

```text
contacts/**  → contacts API + contacts critical E2E
tickets/**   → tickets API + tickets critical E2E
auth/**      → login/session + tüm rol smoke testleri
navigation/**→ AppShell + navigasyon sözleşmesi
shared-ui/** → component + a11y + seçili visual testler
```

PR'da önce değişen alanın testleri, ardından kısa smoke paketi çalışır. Tam
regresyon PR süresini uzatmadan gece paketinde kalır.

### Sözleşme testleri

- Backend OpenAPI şeması CI'da doğrulanır.
- Frontend'in kullandığı response alanları consumer contract ile korunur.
- Feature flag açık/kapalı durumları ayrı proje veya fixture olarak yönetilir.
- Kritik üçüncü taraf servisleri doğrudan E2E bağımlılığı yapmak yerine kontrollü
  sandbox/mocking ile test edilir.

### Çıkış kriteri

- Değişen feature'ın doğru test paketi otomatik seçiliyor.
- API kırılması UI testinden önce contract testinde yakalanıyor.
- Ortak component değişiklikleri component/a11y katmanında dakikalar içinde
  geri bildirim veriyor.

## Faz 4 — Sürekli kalite operasyonu (90 gün ve sonrası)

### Haftalık

- Flaky test panosunu incele.
- En yavaş 10 testi ve gereksiz UI veri hazırlığını iyileştir.
- Karantinadaki testleri sahip ve son tarihle takip et.

### Aylık

- Kritik yolculuk envanterini ürün roadmap'iyle karşılaştır.
- Son production hatalarının hangi katmanda yakalanması gerektiğini analiz et.
- Kullanılmayan veya aynı riski tekrar eden testleri kaldır.
- Tarayıcı ve Playwright sürümünü kontrollü PR ile güncelle.

### Her incident sonrası

1. Hatanın kök nedenini belirle.
2. En düşük uygun test katmanında önce başarısız olan regresyon testi yaz.
3. Düzeltmeyi uygula ve testi geçir.
4. Aynı hata sınıfını yakalayacak sözleşme veya guard ekle.

## Flaky test politikası

Retry yalnızca trace ve teşhis materyali toplar. Retry'da geçen test CI'da
başarısız sayılır.

- Kritik flaky: aynı gün sahip atanır, release'i bloklar.
- Diğer flaky: en geç 3 iş gününde düzeltilir.
- Karantina sessiz `skip` değildir; issue numarası, sahip ve son tarih gerektirir.
- Test 20 ardışık çalışmada geçmeden karantinadan çıkarılmaz.

## Hata raporunun içermesi gerekenler

- Ortam ve commit SHA.
- Test adı, feature ve rol.
- İlk başarısız adım.
- Playwright trace.
- Ekran görüntüsü ve gerekiyorsa video.
- İlgili network isteğinin status/body özeti; secret'lar maskelenmiş olmalı.
- Retry sonucu ve önceki flaky geçmişi.

## Sahiplik modeli

- Ürün ekibi: kritik yolculuk ve beklenen davranış.
- Geliştirici: unit/component/API testleri ve test edilebilir seçiciler.
- QA/quality owner: E2E mimarisi, risk matrisi ve flaky yönetimi.
- Platform ekibi: CI kapasitesi, secret'lar, staging tenant ve rapor saklama.

Test kodu feature kodunun “sonradan eklenen kontrolü” değildir. Definition of Done
içinde test katmanı, gözlemlenebilirlik ve rollback kriteri birlikte bulunmalıdır.
