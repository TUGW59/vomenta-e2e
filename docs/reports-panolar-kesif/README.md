# Raporlar › Panolar — Keşif Arşivi

Bu klasör, **Raporlar › Panolar** (`/reports/dashboards`) bölümünün test edilmeden önceki **keşif kanıtlarını** kalıcı tutar. Uygulama güncellenip testler kırmızıya döndüğünde "olması gereken" haline buradan bakılır.

## İçerik

- **[`NOTLAR.md`](NOTLAR.md)** — İnsan-okur keşif raporu: yapı, 4 dil doğrulaması, 3 katman (L1/L2/L3) matrisi, bulgular ve test çapaları.
- **`screenshots/`** — 7 kanıt ekran görüntüsü (4 dil, sekmeler, dialog/drawer durumları).

## İlgili testler

- `tests/reports-dashboards.authed.spec.js`
- `tests/reports-dashboards-mutations.authed.spec.js`

Keşif kapanış matrisi şablonu: [`../DISCOVERY_COMPLETION_TEMPLATE.md`](../DISCOVERY_COMPLETION_TEMPLATE.md). Tüm dokümanların haritası: [`../README.md`](../README.md).
