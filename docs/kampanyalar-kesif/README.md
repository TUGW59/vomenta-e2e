# Kampanyalar → Giden — Keşif Arşivi

Bu klasör, `/campaigns/outbound` bölümünün test edilmeden önceki **keşif kanıtlarını** kalıcı tutar. Uygulama güncellenince testler kırmızıya döndüğünde "olması gereken" haline buradan bakılır; ham veriler sonraki analizler için saklanır.

## İçerik

- **`NOTLAR.md`** — İnsan-okur keşif raporu: yapı, 4 dil tablosu, bulgular, 3 katman matrisi, create sihirbazı haritası, test çapaları.
- **`screenshots/`** — Kanıt ekran görüntüleri (4 dil, kampanya detayı, sihirbazın adımları, sil/başlat onay dialogları, kampanya oluşturma + başlatma).
- **`veri/`** — Scriptlerin ürettiği **ham JSON** çıktıları (DOM dökümleri, network uçları, 4 dil snapshot'ları, filtre doğruluk sonuçları, başlatma-izleme zaman çizelgesi). Silinmez.
- **`scripts/`** — Keşfi yeniden üreten çalıştırılabilir scriptler (kayıtlı oturumla, `playwright/.auth/default.json`). Kök dizinden `node docs/kampanyalar-kesif/scripts/<ad>.mjs` ile koşar.
  - `explore-outbound.mjs` — salt-okunur: yapı + network + 4 dil + tüm filtre seçeneklerinin doğruluğu → `veri/exploration.json`.
  - `start-and-monitor.mjs` — **prod mutation (kullanıcı onaylı)**: "E2E kesif TEST" kampanyasını başlatır ve durum/metrik/network davranışını ~75s izler → `veri/start-observations.json`.

## İlgili testler

- `tests/campaigns-outbound.authed.spec.js` — salt-okunur + 3 katman + 4 dil + bilinen-hata guard'ları.
- `tests/campaigns-outbound.mutation.authed.spec.js` — uçtan uca oluşturma (`@mutation`, prod'da bloke).
- Page Object'ler: `tests/pages/CampaignsOutboundPage.js`, `tests/pages/CampaignCreatePage.js`.
