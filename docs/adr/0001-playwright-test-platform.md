# ADR-0001: Playwright test platformu mimarisi

- Durum: Kabul edildi
- Tarih: 2026-07-27

## Bağlam

Test paketi büyüdükçe doğrudan seçici, ortam bilgisi ve test verisi kullanan spec
dosyaları ürün değişikliklerinde toplu kırılmaya ve production riski oluşmasına
neden olur.

## Karar

Test platformu aşağıdaki bağımlılık yönünü kullanır:

```text
spec → fixture → page/API/data → environment
```

- Spec iş davranışını tanımlar.
- UI bilgisi Page Object ve AppShell içinde tutulur.
- Bütün test bağımlılıkları ortak fixture üzerinden verilir.
- Test verisi API ile hazırlanır ve otomatik temizlenir.
- Production mutasyonları iki katmanla engellenir.
- Smoke, critical ve regression paketleri risk bazlı çalışır.
- Flaky test CI başarısı sayılmaz.
- Mimari kurallar otomatik kalite kapısıyla uygulanır.

## Sonuçlar

- UI refactor'ları daha dar alanda karşılanır.
- Testler paralel ve birbirinden bağımsız çalışabilir.
- Hatalar trace ve runtime diagnostics ile teşhis edilir.
- Yeni feature'lar aynı iskeleti izler.
- Katman eklemek başlangıçta az miktarda ek kod gerektirir.

## Değişiklik yönetimi

Bu karar sessizce delinemez. Temel bağımlılık yönü, production güvenliği veya
flaky politikası değiştirilecekse yeni bir ADR gereklidir.
