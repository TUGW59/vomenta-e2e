# ADR-0005: Orphan-sıfır mutation yaşam döngüsü

- Durum: Kabul edildi
- Tarih: 2026-07-29

## Bağlam

Bir cleanup callback'inin test sonunda çalışması tek başına güvenli değildir.
Create ile rollback kaydı arasında test kırılabilir; cleanup hatası yutulabilir;
önceki koşulardan kalan otomasyon verisi yeni test tarafından gerçek kullanıcı
verisi sanılabilir. Farklı dosyalardaki `e2e-`, `PW_` gibi önekler de merkezi
tarama yapılmasını zorlaştırır.

## Karar

Kalıcı test varlıkları `testEntity.create` ile yönetilir:

1. Anahtar `VOMENTA_E2E_` önekli ve benzersizdir.
2. İlgili kaynağın başlangıç otomasyon baseline'ı `0` olmalıdır.
3. Rollback create action'dan önce kaydedilir.
4. Create sonrası baseline `1` olmalıdır.
5. Teardown rollback'ten sonra baseline yeniden `0` olmalıdır.
6. Rollback veya son-baseline hatası koşuyu `KRİTİK ALTYAPI HATASI` ile kırar ve
   `cleanup-errors.json` üretir.

Kullanıcı tanımlı iş anahtarı taşımayan varlıklar sahte bir önek uydurmaz;
`prefixNaReason: "N/A: ..."` ile gerekçe ve ayrılmış kaynak sayacı sunar.

Aktif bir mutation spec'inde ham `testEntity.cleanup` statik olarak yasaktır.
Teardown yolu henüz kanıtlanmamış `test.fixme` spec'leri dosya bazlı, gerekçeli
N/A sözleşmesinde tutulur; `test.fixme` kaldırılırsa kapı kırılır.

`report:orphans` dashboard, scheduled report, contact ve WFM vardiya
baseline'larını salt-okunur tarar. Tarama da gerçek staging origin ve oturum tenant
kimliğini `mutationGuard` ile doğrular; production için kaçış yoktur.

## Sonuçlar

- Create ile rollback kaydı arasındaki orphan penceresi kapanır.
- Eski otomasyon önekleri yeni taramalarda görünür kalır.
- Kirli başlangıç tenant'ında mutasyon başlamaz.
- Cleanup başarısızlığı yeşil koşu arkasına saklanamaz.
- Yeni kalıcı mutation spec'i sayaç/rollback sağlamadan mimari kapıyı geçemez.
