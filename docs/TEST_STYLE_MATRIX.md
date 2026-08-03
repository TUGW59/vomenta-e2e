# Vomenta — Sayfa × Test-Stili Kapsama Matrisi

Bu belge, **tescilli her sayfada hangi zorunlu test stilinin kapsandığını** gösterir.
✅ kapsandı · N/A gerekçeli hariç · ❌ EKSİK (sert kapı kırılır) · — o sayfa için zorunlu değil.

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run quality:styles`.
> Kaynak: `tests/contracts/tested-pages.js` + testlerin etiketleri. Kurallar: AGENTS.md → "Zorunlu test stilleri".

| Sayfa | @smoke | @i18n | @a11y | @layout | @clean | @deeplink | @regression | @keyboard | @errorpath | @visual | @perf | @data | @export | @mutation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `channels-email` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `channels-hub` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ | — | — |
| `channels-sms` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `channels-social` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ | — | ✅ |
| `channels-video` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ | — | ✅ |
| `channels-webchat` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| `channels-whatsapp` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ | — | ✅ |
| `dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | — | — |
| `main-navigation` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — |
| `reports-dashboards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `reports-sections` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ |
| `settings-api-keys` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-audit` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — |
| `settings-automations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-canned-responses` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-compliance` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `settings-data-retention` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — | ✅ |
| `settings-disposition-codes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-hours` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-hub` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |
| `settings-integrations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — | ✅ |
| `settings-organization` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-roles` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `settings-security` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-sla` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| `settings-teams` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `settings-webhooks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ |
| `voice-hub` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — | ✅ | — | — |
| `voice-queues` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | — | ✅ |
| `workforce` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `workforce-badges` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `workforce-evaluations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `workforce-schedules` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |
| `workforce-surveys` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ |
| `workforce-time-off` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |

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

- **channels-email**: `/channels/email`
- **channels-hub**: `/channels`
- **channels-sms**: `/channels/sms`
- **channels-social**: `/channels/social`
- **channels-video**: `/channels/video`
- **channels-webchat**: `/channels/webchat`
- **channels-whatsapp**: `/channels/whatsapp`
- **dashboard**: `/`
- **main-navigation**: `/`, `/inbox`, `/voice`, `/channels`, `/ai`, `/campaigns`, `/bot-builder`, `/contacts`, `/tickets`, `/analytics`, `/reports`, `/supervisor`, `/workforce`, `/settings`
- **reports-dashboards**: `/reports/dashboards`
- **reports-sections**: `/reports/call`, `/reports/agent`, `/reports/queue`, `/reports/campaign`, `/reports/channel`, `/reports/ai`, `/reports/quality`, `/reports/csat`, `/reports/billing`, `/reports/sla`
- **settings-api-keys**: `/settings/api-keys`
- **settings-audit**: `/settings/audit`
- **settings-automations**: `/settings/automations`
- **settings-canned-responses**: `/settings/canned-responses`
- **settings-compliance**: `/settings/compliance`
- **settings-data-retention**: `/settings/data-retention`
- **settings-disposition-codes**: `/settings/disposition-codes`
- **settings-hours**: `/settings/hours`
- **settings-hub**: `/settings`
- **settings-integrations**: `/settings/integrations`
- **settings-notifications**: `/settings/notifications`
- **settings-organization**: `/settings/organization`
- **settings-profile**: `/settings/profile`
- **settings-roles**: `/settings/roles`
- **settings-security**: `/settings/security`
- **settings-sla**: `/settings/sla`
- **settings-teams**: `/settings/teams`
- **settings-templates**: `/settings/templates`
- **settings-users**: `/settings/users`
- **settings-webhooks**: `/settings/webhooks`
- **voice-hub**: `/voice`
- **voice-queues**: `/voice/queues`
- **workforce**: `/workforce`
- **workforce-badges**: `/workforce/badges`
- **workforce-evaluations**: `/workforce/evaluations`
- **workforce-schedules**: `/workforce/schedules`
- **workforce-surveys**: `/workforce/surveys`
- **workforce-time-off**: `/workforce/time-off`

## N/A beyanları (gerekçeli)

- `channels-email` **@perf**: Grafik/ağır içerik yok (hesap boş-durumu + imza/yönlendirme formu).
- `channels-email` **@data**: Sayısal KPI tile yok (form + hesap listesi).
- `channels-email` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-email` **@visual**: Açılışta B17 format hatası + imza içeriği canlı → kararlı snapshot bölgesi yok.
- `channels-hub` **@keyboard**: Diyalog/menü/sekme yok (kanal kartları ızgarası + Configure bağlantıları).
- `channels-hub` **@perf**: Grafik/ağır içerik yok (statik kart ızgarası).
- `channels-hub` **@data**: Sayısal KPI tile yok (kartlar durum rozeti gösterir).
- `channels-hub` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-hub` **@mutation**: Hub salt gezinme; create/edit/delete/save yok (yazma alt sayfalarda).
- `channels-sms` **@perf**: Grafik/ağır içerik yok (gönderici/şablon listeleri + SMPP formu + dialoglar).
- `channels-sms` **@data**: Sayısal KPI tile yok (liste + config alanları).
- `channels-sms` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-sms` **@visual**: Açılışta B18 konsol hatası + canlı listeler → kararlı snapshot bölgesi yok.
- `channels-social` **@keyboard**: Diyalog/menü/sekme yok (platform kartları + Connect + ayar formu).
- `channels-social` **@perf**: Grafik/ağır içerik yok (platform kartları ızgarası).
- `channels-social` **@data**: Sayısal KPI tile yok (platform kartları).
- `channels-social` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-social` **@visual**: Açılışta B16 eksik-çeviri konsol hatası → kararlı snapshot bölgesi yok.
- `channels-video` **@keyboard**: Diyalog/menü/sekme yok (kalite/fps seçicileri + Save + Start Video Call).
- `channels-video` **@perf**: Grafik/ağır içerik yok (ayar seçicileri formu).
- `channels-video` **@data**: Sayısal KPI tile yok (kalite/fps config değerleri).
- `channels-video` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-webchat` **@perf**: Grafik/ağır içerik yok (yapılandırma formu + iki sekme).
- `channels-webchat` **@data**: Sayısal KPI tile yok (widget ayar alanları).
- `channels-webchat` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-whatsapp` **@keyboard**: API "Not Configured" boş-durumunda dialog/sekme yok (Create Template pasif); bağlantı sonrası dialog akışı staging mutation kapsamında.
- `channels-whatsapp` **@perf**: Grafik/ağır içerik yok (bağlantı boş-durumu + şablon listesi).
- `channels-whatsapp` **@data**: Sayısal KPI tile yok (config + şablon listesi).
- `channels-whatsapp` **@export**: Bu sayfada export/indirme kontrolü yok.
- `channels-whatsapp` **@visual**: Açılışta B19 konsol hatası + bağlantı durumu canlı → kararlı snapshot yok.
- `reports-dashboards` **@perf**: Grafik/ağır içerik yüklemiyor (özel pano kartlarını listeler).
- `reports-dashboards` **@data**: Sayısal KPI göstermiyor (pano kartları listeler).
- `reports-dashboards` **@export**: Bu sayfada export/indirme kontrolü yok.
- `reports-sections` **@export**: Export indirme yan-etkisi; içerik doğrulaması gated/ileride (bkz. coverage-exclusions.js).
- `settings-api-keys` **@perf**: Grafik/ağır içerik yok (anahtar listesi + dialog).
- `settings-api-keys` **@data**: Sayısal KPI yok (anahtar listesi).
- `settings-api-keys` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-audit` **@perf**: Grafik/ağır içerik yok (log tablosu + detay dialog).
- `settings-audit` **@data**: Sayısal KPI tile yok (log listesi).
- `settings-audit` **@visual**: Tablo canlı log verisi (timestamp/UUID/IP) içerir → kararlı snapshot bölgesi yok.
- `settings-automations` **@perf**: Grafik/ağır içerik yok (kural tablosu + SLA tablosu + dialog).
- `settings-automations` **@data**: Sayısal KPI tile yok (SLA süreleri tablo verisi).
- `settings-automations` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-canned-responses` **@perf**: Grafik/ağır içerik yok (hazır yanıt tablosu + dialog).
- `settings-canned-responses` **@data**: Sayısal KPI yok (hazır yanıt listesi).
- `settings-canned-responses` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-compliance` **@perf**: Grafik/ağır içerik yok (özet kart + uyumluluk tabloları).
- `settings-compliance` **@data**: Sayısal KPI tile göstermiyor (retention gün değerleri config metni; tablolar).
- `settings-compliance` **@export**: Sayfada dosya export/indirme kontrolü yok (GDPR "Export Data" kalıcı işlem → staging).
- `settings-compliance` **@visual**: 3 canlı tablo (audit/consent/GDPR: göreli zaman + tarih + UUID) → kararlı snapshot bölgesi yok, flaky.
- `settings-data-retention` **@keyboard**: Diyalog/menü/sekme yok (spinbutton + switch + buton formu).
- `settings-data-retention` **@perf**: Grafik/ağır içerik yok (saklama-süresi formu).
- `settings-data-retention` **@data**: Sayısal KPI tile yok (gün config değerleri).
- `settings-data-retention` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-disposition-codes` **@perf**: Grafik/ağır içerik yok (kod tablosu + dialog).
- `settings-disposition-codes` **@data**: Sayısal KPI yok (kod listesi).
- `settings-disposition-codes` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-hours` **@perf**: Grafik/ağır içerik yok (haftalık program formu).
- `settings-hours` **@data**: Sayısal KPI yok (saat config değerleri).
- `settings-hours` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-hub` **@perf**: Grafik/ağır içerik yok (sekmeli özet hub + paneller).
- `settings-hub` **@data**: Sayısal KPI tile yok (plan tutarı "$29" bir panel metni; tile/sayaç değil).
- `settings-hub` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-hub` **@visual**: Paneller canlı veri içerir (Users: takım üyesi listesi; Billing: plan tutarı) → kararlı snapshot bölgesi yok.
- `settings-hub` **@mutation**: Hub salt özet + gezinme; create/edit/delete/save yok (dedicated sayfalarda test edilir).
- `settings-integrations` **@perf**: Grafik/ağır içerik yok (entegrasyon kartları + webhook tablosu + dialoglar).
- `settings-integrations` **@data**: Sayısal KPI yok (kart/tablo listesi).
- `settings-integrations` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-notifications` **@keyboard**: Diyalog/menü/sekme yok (uzun switch tercih formu).
- `settings-notifications` **@perf**: Grafik/ağır içerik yok (tercih formu).
- `settings-notifications` **@data**: Sayısal KPI yok (switch tercihleri).
- `settings-notifications` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-notifications` **@visual**: Çok uzun tercih formu (onlarca switch, kategoriler) → tek kararlı snapshot bölgesi pratik değil.
- `settings-organization` **@perf**: Grafik/ağır içerik yok (statik şirket-bilgisi formu).
- `settings-organization` **@data**: Sayısal KPI göstermiyor (form alanları).
- `settings-organization` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-profile` **@perf**: Grafik/ağır içerik yok (statik profil formu + oturum tablosu).
- `settings-profile` **@data**: Sayısal KPI göstermiyor (form alanları + oturum listesi).
- `settings-profile` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-roles` **@perf**: Grafik/ağır içerik yok (rol tablosu + create dialogu).
- `settings-roles` **@export**: Bu sayfada export/indirme kontrolü yok.
- `settings-roles` **@visual**: Kararlı snapshot bölgesi yok: tablo canlı sayaç (permissions/users) içerir, Create dialogu 14 kategorili uzun/kaydırmalı liste → tam-dialog snapshot flaky.
- `settings-security` **@perf**: Grafik/ağır içerik yok (config formu + oturum/login tabloları + dialog).
- `settings-security` **@data**: Sayısal KPI tile yok (policy config değerleri).
- `settings-security` **@export**: Bu sayfada export/indirme kontrolü yok.
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
- `settings-webhooks` **@perf**: Grafik/ağır içerik yok (webhook listesi + dialog).
- `settings-webhooks` **@data**: Sayısal KPI yok (webhook listesi).
- `settings-webhooks` **@export**: Bu sayfada export/indirme kontrolü yok.
- `voice-hub` **@keyboard**: Hub <main>'inde diyalog/menü/ARIA-sekme yok (alt-nav düğmeleri = bölüm gezinmesi, nav-L3 ile kapsanır).
- `voice-hub` **@perf**: Ağır grafik kütüphanesi yok (KPI döşemeleri + mevcudiyet sayaçları + boş-durum).
- `voice-hub` **@export**: Bu sayfada export/indirme kontrolü yok (Recordings'te var).
- `voice-hub` **@visual**: İçerik canlı (aktif çağrı sayıları, temsilci mevcudiyeti, ort. bekleme) → kararlı snapshot bölgesi yok.
- `voice-hub` **@mutation**: Hub salt gerçek-zamanlı görünüm; create/edit/delete/save yok. Gerçek çağrı softphone üzerinden staging mutation'da (voice-call.mutation.authed.spec.js).
- `voice-queues` **@perf**: Grafik/ağır içerik yok (kuyruk kartları listesi + Create Queue dialogu).
- `voice-queues` **@export**: Bu sayfada export/indirme kontrolü yok.
- `voice-queues` **@visual**: Kuyruk kartları canlı veri (Waiting/Agents/Max Wait) → kararlı snapshot bölgesi yok.
- `workforce` **@perf**: Ağır grafik kütüphanesi yok; Uyum boş-durum/basit görsel, Tahmin tablo.
- `workforce` **@data**: Tahmin KPI kartları var ama ayrılmış tenant'ta 0 gösteriyor ve sekme-tıklamada AYRI fetch yok (canlı ağ: istek yok) → yakalanacak deterministik JSON ucu yok; @data anlamlı değil.
- `workforce` **@export**: Bu yüzeyde export/indirme kontrolü yok.
- `workforce` **@visual**: İçerik tarih/haftaya bağlı (çizelge grid) → kararlı snapshot bölgesi yok.
- `workforce-badges` **@perf**: Grafik/ağır içerik yok (rozet tablosu + Sıralama sekmesi + dialoglar).
- `workforce-badges` **@data**: Sayısal KPI tile yok (rozet/lider listesi).
- `workforce-badges` **@export**: Export/indirme kontrolü yok.
- `workforce-badges` **@visual**: Rozet/lider tablosu canlı veri → kararlı snapshot yok.
- `workforce-evaluations` **@perf**: Grafik/ağır içerik yok (değerlendirme tablosu + oluştur dialogu).
- `workforce-evaluations` **@data**: Sayısal KPI tile yok (puan sütunu tablo verisi).
- `workforce-evaluations` **@export**: Export/indirme kontrolü yok.
- `workforce-evaluations` **@visual**: Değerlendirme tablosu canlı veri → kararlı snapshot yok.
- `workforce-schedules` **@keyboard**: Ayrı rota salt-okunur (dialog/sekme modellenmiyor); vardiya diyaloğu /workforce yüzeyinde @keyboard ile kapsanır.
- `workforce-schedules` **@perf**: Grafik/ağır içerik yok (haftalık çizelge grid).
- `workforce-schedules` **@data**: Sayısal KPI tile yok.
- `workforce-schedules` **@export**: Export/indirme kontrolü yok.
- `workforce-schedules` **@visual**: İçerik tarih/haftaya bağlı → kararlı snapshot yok.
- `workforce-schedules` **@mutation**: Vardiya create/publish yaşam döngüsü /workforce yüzeyinde (workforce-mutations) sahiplenilir; ayrı rotada tekrar edilmez (uzlaştırma).
- `workforce-surveys` **@perf**: Grafik/ağır içerik yok (anket tablosu + dialoglar).
- `workforce-surveys` **@data**: Sayısal KPI tile yok (anket listesi).
- `workforce-surveys` **@export**: Export/indirme kontrolü yok.
- `workforce-surveys` **@visual**: Anket tablosu canlı veri → kararlı snapshot yok.
- `workforce-time-off` **@perf**: Grafik/ağır içerik yok (izin tablosu + talep dialogu).
- `workforce-time-off` **@data**: Sayısal KPI tile yok.
- `workforce-time-off` **@export**: Export/indirme kontrolü yok.
- `workforce-time-off` **@visual**: İzin tablosu canlı veri → kararlı snapshot yok.
- `workforce-time-off` **@mutation**: İzin talebi UI'dan SİLİNEMİYOR (terminal durumda yalnız durum değişir) → güvenli 0→1→0 teardown yok; L3 N/A (kanıt: dedicated + eski yüzey notları).
