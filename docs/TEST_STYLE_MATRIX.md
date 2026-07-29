# Vomenta — Sayfa × Test-Stili Kapsama Matrisi

Bu belge, **tescilli her sayfada hangi zorunlu test stilinin kapsandığını** gösterir.
✅ kapsandı · N/A gerekçeli hariç · ❌ EKSİK (sert kapı kırılır) · — o sayfa için zorunlu değil.

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run quality:styles`.
> Kaynak: `tests/contracts/tested-pages.js` + testlerin etiketleri. Kurallar: AGENTS.md → "Zorunlu test stilleri".

| Sayfa | @smoke | @i18n | @a11y | @layout | @clean | @deeplink | @regression | @keyboard | @errorpath | @visual | @perf | @data | @export | @mutation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `campaign-sender-ids` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `campaign-templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `reports-dashboards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `reports-sections` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | — |

## Rotalar

- **campaign-sender-ids**: `/campaigns/sender-ids`
- **campaign-templates**: `/campaigns/templates`
- **reports-dashboards**: `/reports/dashboards`
- **reports-sections**: `/reports/call`, `/reports/agent`, `/reports/queue`, `/reports/campaign`, `/reports/channel`, `/reports/ai`, `/reports/quality`, `/reports/csat`, `/reports/billing`, `/reports/sla`

## N/A beyanları (gerekçeli)

- `campaign-sender-ids` **@perf**: Grafik veya ağır içerik yok; yalnız Sender ID talepleri tablosu var.
- `campaign-sender-ids` **@data**: Sayısal KPI göstermiyor.
- `campaign-sender-ids` **@export**: Export/indirme kontrolü yok.
- `campaign-templates` **@perf**: Grafik veya ağır içerik yok; yalnız SMS şablonu tablosu var.
- `campaign-templates` **@data**: Sayısal KPI göstermiyor.
- `campaign-templates` **@export**: Export/indirme kontrolü yok.
- `reports-dashboards` **@perf**: Grafik/ağır içerik yüklemiyor (özel pano kartlarını listeler).
- `reports-dashboards` **@data**: Sayısal KPI göstermiyor (pano kartları listeler).
- `reports-dashboards` **@export**: Bu sayfada export/indirme kontrolü yok.
- `reports-sections` **@export**: Export indirme yan-etkisi; içerik doğrulaması gated/ileride (bkz. coverage-exclusions.js).
