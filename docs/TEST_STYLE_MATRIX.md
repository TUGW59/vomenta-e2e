# Vomenta — Sayfa × Test-Stili Kapsama Matrisi

Bu belge, **tescilli her sayfada hangi zorunlu test stilinin kapsandığını** gösterir.
✅ kapsandı · N/A gerekçeli hariç · ❌ EKSİK (sert kapı kırılır) · — o sayfa için zorunlu değil.

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run quality:styles`.
> Kaynak: `tests/contracts/tested-pages.js` + testlerin etiketleri. Kurallar: AGENTS.md → "Zorunlu test stilleri".

| Sayfa | @smoke | @i18n | @a11y | @layout | @clean | @deeplink | @regression | @keyboard | @errorpath | @visual | @perf | @data | @export | @mutation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `main-navigation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| `reports-dashboards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `reports-sections` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| `settings-automations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-compliance` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `settings-hours` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-organization` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-roles` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `settings-sla` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| `settings-teams` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |

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

- **main-navigation**: `/`, `/inbox`, `/voice`, `/channels`, `/ai`, `/campaigns`, `/bot-builder`, `/contacts`, `/tickets`, `/analytics`, `/reports`, `/supervisor`, `/workforce`, `/settings`
- **reports-dashboards**: `/reports/dashboards`
- **reports-sections**: `/reports/call`, `/reports/agent`, `/reports/queue`, `/reports/campaign`, `/reports/channel`, `/reports/ai`, `/reports/quality`, `/reports/csat`, `/reports/billing`, `/reports/sla`
- **settings-automations**: `/settings/automations`
- **settings-compliance**: `/settings/compliance`
- **settings-hours**: `/settings/hours`
- **settings-organization**: `/settings/organization`
- **settings-profile**: `/settings/profile`
- **settings-roles**: `/settings/roles`
- **settings-sla**: `/settings/sla`
- **settings-teams**: `/settings/teams`
- **settings-templates**: `/settings/templates`
- **settings-users**: `/settings/users`

## N/A beyanları (gerekçeli)

- `reports-dashboards` **@perf**: Grafik/ağır içerik yüklemiyor (özel pano kartlarını listeler).
- `reports-dashboards` **@data**: Sayısal KPI göstermiyor (pano kartları listeler).
- `reports-dashboards` **@export**: Bu sayfada export/indirme kontrolü yok.
- `reports-sections` **@export**: Export indirme yan-etkisi; içerik doğrulaması gated/ileride (bkz. coverage-exclusions.js).
- `settings-automations` **@perf**: Grafik/ağır içerik yok (kural tablosu + SLA tablosu + dialog).
- `settings-automations` **@data**: Sayısal KPI tile yok (SLA süreleri tablo verisi).
- `settings-automations` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-compliance` **@perf**: Grafik/ağır içerik yok (özet kart + uyumluluk tabloları).
- `settings-compliance` **@data**: Sayısal KPI tile göstermiyor (retention gün değerleri config metni; tablolar).
- `settings-compliance` **@export**: Sayfada dosya export/indirme kontrolü yok (GDPR "Export Data" kalıcı işlem → staging).
- `settings-compliance` **@visual**: 3 canlı tablo (audit/consent/GDPR: göreli zaman + tarih + UUID) → kararlı snapshot bölgesi yok, flaky.
- `settings-hours` **@perf**: Grafik/ağır içerik yok (haftalık program formu).
- `settings-hours` **@data**: Sayısal KPI yok (saat config değerleri).
- `settings-hours` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-organization` **@perf**: Grafik/ağır içerik yok (statik şirket-bilgisi formu).
- `settings-organization` **@data**: Sayısal KPI göstermiyor (form alanları).
- `settings-organization` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-profile` **@perf**: Grafik/ağır içerik yok (statik profil formu + oturum tablosu).
- `settings-profile` **@data**: Sayısal KPI göstermiyor (form alanları + oturum listesi).
- `settings-profile` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-roles` **@perf**: Grafik/ağır içerik yok (rol tablosu + create dialogu).
- `settings-roles` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-roles` **@visual**: Kararlı snapshot bölgesi yok: tablo canlı sayaç (permissions/users) içerir, Create dialogu 14 kategorili uzun/kaydırmalı liste → tam-dialog snapshot flaky.
- `settings-sla` **@perf**: Grafik/ağır içerik yok (politika tablosu + dialog).
- `settings-sla` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-teams` **@perf**: Grafik/ağır içerik yok (ekip kartları + create dialogu).
- `settings-teams` **@data**: Sayısal KPI tile yok (kart "N members" veri metni).
- `settings-teams` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-templates` **@perf**: Grafik/ağır içerik yok (şablon tablosu + dialog).
- `settings-templates` **@data**: Sayısal KPI yok (şablon listesi).
- `settings-templates` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-users` **@perf**: Grafik/ağır içerik yok (üye tablosu + davet dialogu).
- `settings-users` **@data**: Sayısal KPI göstermiyor (üye listesi; sayaç yok).
- `settings-users` **@export**: Bu sayfada export/indirme kontrolü yok.
