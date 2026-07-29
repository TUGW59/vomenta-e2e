# Vomenta — Sayfa × Test-Stili Kapsama Matrisi

Bu belge, **tescilli her sayfada hangi zorunlu test stilinin kapsandığını** gösterir.
✅ kapsandı · N/A gerekçeli hariç · ❌ EKSİK (sert kapı kırılır) · — o sayfa için zorunlu değil.

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run quality:styles`.
> Kaynak: `tests/contracts/tested-pages.js` + testlerin etiketleri. Kurallar: AGENTS.md → "Zorunlu test stilleri".

| Sayfa | @smoke | @i18n | @a11y | @layout | @clean | @deeplink | @regression | @keyboard | @errorpath | @visual | @perf | @data | @export | @mutation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `campaigns-dnc` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| `campaigns-sender-ids` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `campaigns-templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `main-navigation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| `reports-dashboards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `reports-sections` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |

## Rota düzeyi baseline kanıtı

| Rota | @smoke | @i18n | @a11y | @layout | @clean | @deeplink | @regression |
|---|---|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/inbox` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/voice` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/channels` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/ai` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/campaigns` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/bot-builder` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/contacts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/tickets` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/analytics` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/reports` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/supervisor` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/workforce` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/settings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Rotalar

- **campaigns-dnc**: `/campaigns/dnc`
- **campaigns-sender-ids**: `/campaigns/sender-ids`
- **campaigns-templates**: `/campaigns/templates`
- **main-navigation**: `/`, `/inbox`, `/voice`, `/channels`, `/ai`, `/campaigns`, `/bot-builder`, `/contacts`, `/tickets`, `/analytics`, `/reports`, `/supervisor`, `/workforce`, `/settings`
- **reports-dashboards**: `/reports/dashboards`
- **reports-sections**: `/reports/call`, `/reports/agent`, `/reports/queue`, `/reports/campaign`, `/reports/channel`, `/reports/ai`, `/reports/quality`, `/reports/csat`, `/reports/billing`, `/reports/sla`

## N/A beyanları (gerekçeli)

- `campaigns-dnc` **@perf**: Grafik/ağır içerik yüklemiyor (tek liste tablosu).
- `campaigns-sender-ids` **@perf**: Grafik/ağır içerik yüklemiyor (tek liste tablosu).
- `campaigns-sender-ids` **@data**: Sayısal KPI göstermiyor (durum bazlı liste tablosu).
- `campaigns-sender-ids` **@export**: Bu sayfada export/indirme kontrolü yok.
- `campaigns-templates` **@perf**: Grafik/ağır içerik yüklemiyor (tek liste tablosu).
- `campaigns-templates` **@data**: Sayısal KPI göstermiyor (şablon listesi).
- `campaigns-templates` **@export**: Bu sayfada export/indirme kontrolü yok.
- `reports-dashboards` **@perf**: Grafik/ağır içerik yüklemiyor (özel pano kartlarını listeler).
- `reports-dashboards` **@data**: Sayısal KPI göstermiyor (pano kartları listeler).
- `reports-dashboards` **@export**: Bu sayfada export/indirme kontrolü yok.
- `reports-sections` **@export**: Export indirme yan-etkisi; içerik doğrulaması gated/ileride (bkz. coverage-exclusions.js).
