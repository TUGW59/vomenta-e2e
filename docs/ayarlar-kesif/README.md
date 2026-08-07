# Ayarlar (Settings) — Keşif Arşivi

Bu klasör, **Ayarlar (Settings)** bölümünün test edilmeden önceki **keşif kanıtlarını** kalıcı tutar. Uygulama güncellenip testler kırmızıya döndüğünde "olması gereken" haline buradan bakılır.

## İçerik

- **[`NOTLAR.md`](NOTLAR.md)** — İnsan-okur keşif raporu: yapı, 4 dil doğrulaması, 3 katman (L1/L2/L3) matrisi, bulgular ve test çapaları.
- **`screenshots/`** — 106 kanıt ekran görüntüsü (4 dil, sekmeler, dialog/drawer durumları).
- Bu bölüm çok sayıda alt sekme içerir; kök dizindeki `raw-*.txt` dosyaları keşif sırasında alınan ham DOM/metin dökümleridir (sekme, rol, kullanıcı, güvenlik, SLA, webhook vb. — 4 dil dahil).

## İlgili testler

- `tests/settings.authed.spec.js`
- `tests/known-bugs.authed.spec.js`

Keşif kapanış matrisi şablonu: [`../DISCOVERY_COMPLETION_TEMPLATE.md`](../DISCOVERY_COMPLETION_TEMPLATE.md). Tüm dokümanların haritası: [`../README.md`](../README.md).
