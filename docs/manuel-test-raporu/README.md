# Manuel Test Raporu — Vomenta

Bu klasör, keşif/manuel test sırasında bulunan ama henüz (veya yalnızca kısmen)
otomatik teste dönüştürülmüş bulguların kaydıdır. Amaç: bulguyu **kanıtıyla**
belgelemek, bir sahibe iletmek ve otomatik regresyon testi ile bağını kurmak.

## Bulgular

| # | Başlık | Alan | Ciddiyet | Durum | Otomatik test |
|---|---|---|---|---|---|
| 01 | [Paylaş diyaloğunda yatay taşma](01-panolar-paylas-tasma.md) | Raporlar › Panolar | Orta (görsel/UX) | Açık | `reports-dashboards.authed.spec.js` → Paylaş L3 `test.fail` |
| 02 | [Tarih Aralığı etiketi UTC (yerel değil)](02-tarih-araligi-utc.md) | Raporlar › tüm alt raporlar | Orta (veri/UX yanıltıcı) | Açık | `reports-sections.authed.spec.js` → Date Range timezone `test.fail` |

## Nasıl daha otomatik yakalarız?

Bu tür **düzen/taşma (layout overflow)** hatalarını gelecekte otomatik yakalamak
için önerilen strateji ayrı bir belgede: [**KATMAN-TASMA-STRATEJISI.md**](KATMAN-TASMA-STRATEJISI.md).
