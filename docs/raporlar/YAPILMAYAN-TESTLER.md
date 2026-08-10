# Vomenta — Yapılmayan / Kısıtlı Testler Raporu

> ⚙️ **Otomatik üretilir** (`npm run report:test-report`). Envanter KARŞILAŞTIRMASI: `navigation.js` + `tested-pages.js` + spec dosyaları + `coverage-exclusions.js` + `skip/fixme`.
> **KAPSAM NOTU:** Bu rapor mevcut rota/sözleşme envanterine göredir; **tam ürün yüzeyi garantisi WP-03 (Surface Manifest) sonrasında** sağlanır. Şu an kayıtlı olmayan yüzeyler eksik görünebilir.

## Katman A — Yapılabilir ama İZİN / özel istek gerektiren

Güvenlik gereği prod'da çalıştırılmaz (veri değiştirir / dış yan etki / staging gerekir). Ayrılmış staging tenant + açık istek ile açılır.

### coverage-exclusions (bilinçli, güvenlik)

| kontrol | sayfa | neden | kategori |
|---|---|---|---|
| Export / Export All | Contacts, Tickets, Reports | Dosya indirir | `download` |
| Import | Contacts | Toplu veri içe aktarır | `mutation` |
| Create Ticket / Add Contact — kaydet | Tickets, Contacts | Gerçek kayıt oluşturur | `mutation` |
| Send SMS — gönder / Start Call | Channels, Voice | Gerçek mesaj/çağrı başlatır | `external-side-effect` |
| Settings — Save / durum seçimi (Away, Offline) | Settings, Header | Hesabı/ayarı kalıcı değiştirir | `mutation` |
| Google / Microsoft ile giriş | Login | Dış kimlik doğrulama akışı | `external-auth` |
| Silme (Delete) | Genel | Geri döndürülemez | `destructive` |

### staging/mutation bekleyen test.fixme/skip

| dosya:satır | tür | gerekçe |
|---|---|---|
| tests/agent-enforcement.agent.spec.js:37 | skip | API origin bilinmiyor (environment.apiHostname boş) — enforcement bu ortamda koşulamaz. |
| tests/agent-enforcement.agent.spec.js:99 | skip | VOMENTA_AGENT_FORBIDDEN_ENDPOINT tanımlı değil — doğrudan-uç enforcement probu atlandı. |
| tests/campaigns-outbound.mutation.authed.spec.js:29 | fixme | dan silinemiyor; staging API DELETE/teardown teyidi gerekli. |
| tests/channels-email-mutations.authed.spec.js:19 | fixme | Staging teyidi bekliyor: hesap ekleme sahte SMTP + silme ucu. |
| tests/channels-sms-mutations.authed.spec.js:19 | fixme | Staging teyidi bekliyor: POST /sender-ids + silme ucu. |
| tests/channels-social-mutations.authed.spec.js:17 | fixme | Staging teyidi bekliyor: harici OAuth (sahte sağlayıcı) + bağlantı kaldırma ucu. |
| tests/channels-video-mutations.authed.spec.js:17 | fixme | Staging teyidi bekliyor: video ayarı geri-alma ucu (PUT /channels/video/config). |
| tests/channels-webchat-mutations.authed.spec.js:17 | fixme | Staging teyidi bekliyor: widget ayarı geri-alma ucu (PUT /channels/webchat/config). |
| tests/channels-whatsapp-mutations.authed.spec.js:19 | fixme | Staging teyidi bekliyor: bağlı WABA + şablon POST/DELETE ucu. |
| tests/known-bugs.authed.spec.js:175 | skip | satırı yok; bulgu reproduce edilemiyor. |
| tests/known-bugs.authed.spec.js:283 | skip | Sesli mesaj / işlem butonu yok; bulgu reproduce edilemiyor. |
| tests/known-bugs.authed.spec.js:349 | skip | Reddedilmiş talep yok; bulgu reproduce edilemiyor. |
| tests/settings-data-retention-mutations.authed.spec.js:19 | fixme | Staging teyidi bekliyor: reversible spinbutton düzenle+Save+geri al; Run cleanup ASLA. |
| tests/settings-disposition-codes-mutations.authed.spec.js:19 | fixme | Staging teyidi bekliyor: satır silme yolu (aksiyon ikonları aria-label\ |
| tests/settings-notifications-mutations.authed.spec.js:18 | fixme | Staging teyidi bekliyor: kategori switch toggle + Save preferences + geri al. |
| tests/settings-security-mutations.authed.spec.js:20 | fixme | Staging teyidi bekliyor: hassas config; policy switch toggle+revert + save endpoint. |
| tests/settings-sla-mutations.authed.spec.js:20 | fixme | Staging teyidi bekliyor: satır silme yolu (aksiyon ikonları aria-label\ |
| tests/settings-teams-mutations.authed.spec.js:21 | fixme | Staging teyidi bekliyor: ekip silme yolu (Edit dialogunda Delete yok). Zero-orphan temizlik ucu gerekli. |
| tests/voice-dids-mutations.authed.spec.js:20 | fixme | Staging teyidi bekliyor: DID Assign/Unassign uçları + atama dialog seçicileri. |
| tests/voice-history.authed.spec.js:96 | skip | reproduce edilemiyor (veri gerektirir). |
| tests/voice-ivr-mutations.authed.spec.js:17 | fixme | Staging teyidi bekliyor: IVR create POST + delete DELETE uçları + dialog seçicileri. |
| tests/voice-queues-mutations.authed.spec.js:19 | fixme | Staging teyidi bekliyor: queue create POST + delete DELETE uçları + dialog alan seçicileri. |
| tests/voice-recordings.authed.spec.js:88 | skip | reproduce edilemiyor (veri gerektirir). |
| tests/voice-recordings.authed.spec.js:111 | skip | Kayıt yok; Delete onayı reproduce edilemiyor (veri gerektirir). |
| tests/voice-regulatory.authed.spec.js:49 | skip | Bu koşuda voiceRegulatory bozukluğu reproduce olmadı (render kararsız). |
| tests/voice-sip-trunks.authed.spec.js:66 | skip | de görünmedi (i18n çeviri sızıntısı reproduce olmadı). |

## Katman B — Yapılmayan (diğer sebepler)

### Veri-bağımlı / data-testid bekleyen / dil-koşullu skip & fixme

| dosya:satır | tür | gerekçe |
|---|---|---|
| tests/agent-enforcement.agent.spec.js:33 | skip |  |
| tests/bot-builder-editor.authed.spec.js:55 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:71 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:84 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:96 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:107 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:126 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:138 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:155 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:172 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder-editor.authed.spec.js:187 | skip | Hesapta bot yok — editör veri-bağlı. |
| tests/bot-builder.authed.spec.js:54 | skip | Hesapta bot yok — liste↔API sadakati veri-bağlı. |
| tests/bot-builder.authed.spec.js:162 | skip | Hesapta bot yok — kart→editör navigasyonu veri-bağlı. |
| tests/campaigns-outbound.authed.spec.js:419 | skip | Bu tenantta 10+ kampanya yok; sayfalama gerekmiyor. |
| tests/channels-hub.authed.spec.js:154 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/channels-video.authed.spec.js:105 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/channels-webchat.authed.spec.js:130 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/contacts-mutations.authed.spec.js:39 | skip | VOMENTA_TEST_CONTACT_PHONE eksik |
| tests/known-bugs-invite.mutation.authed.spec.js:25 | fixme |  |
| tests/known-bugs.authed.spec.js:157 | fixme |  |
| tests/known-bugs.authed.spec.js:293 | skip | Arayüz Türkçe değil; yerelleştirme sızıntısı yalnızca TR arayüzde geçerli. |
| tests/known-bugs.authed.spec.js:313 | skip | Arayüz Türkçe değil; bitişik yazım hatası yalnızca TR arayüzde geçerli. |
| tests/known-bugs.authed.spec.js:336 | skip |  |
| tests/login.spec.js:79 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/registered-routes-smoke.authed.spec.js:75 | fixme |  |
| tests/reports-dashboards.authed.spec.js:175 | skip | da güvenilir. |
| tests/reports-dashboards.authed.spec.js:324 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/reports-sections.authed.spec.js:250 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-api-keys-mutations.authed.spec.js:19 | fixme | da boş). |
| tests/settings-api-keys.authed.spec.js:143 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-automations-mutations.authed.spec.js:20 | fixme | da boş). |
| tests/settings-automations.authed.spec.js:163 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-canned-responses-mutations.authed.spec.js:18 | fixme | da boş). |
| tests/settings-canned-responses.authed.spec.js:152 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-compliance-mutations.authed.spec.js:19 | fixme |  |
| tests/settings-data-retention.authed.spec.js:129 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-disposition-codes.authed.spec.js:155 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-hours-mutations.authed.spec.js:18 | fixme | ında doğrulanmadı. |
| tests/settings-hours.authed.spec.js:140 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-integrations-mutations.authed.spec.js:19 | fixme | da boş). |
| tests/settings-integrations.authed.spec.js:161 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-organization-mutations.authed.spec.js:26 | fixme | ında doğrulanmadı. |
| tests/settings-organization.authed.spec.js:175 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-profile-mutations.authed.spec.js:28 | fixme | ında doğrulanmadı. |
| tests/settings-profile-mutations.authed.spec.js:35 | skip | VOMENTA_TEST_CONTACT_PHONE eksik |
| tests/settings-profile.authed.spec.js:276 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-roles-interactions.authed.spec.js:36 | skip | Roller yanıtı liste değil/boş (veri-bağlı). |
| tests/settings-roles-mutations.authed.spec.js:24 | fixme | ında doğrulanmadı. |
| tests/settings-roles-rbac-enforcement.authed.spec.js:72 | skip |  |
| tests/settings-roles-rbac.authed.spec.js:189 | skip |  |
| tests/settings-roles-rbac.authed.spec.js:239 | skip |  |
| tests/settings-security.authed.spec.js:164 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-sla.authed.spec.js:183 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-teams.authed.spec.js:155 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-templates-mutations.authed.spec.js:20 | fixme | da boş). |
| tests/settings-templates.authed.spec.js:174 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-users-interactions.authed.spec.js:40 | skip | Örnek isim türetilemedi (veri-bağlı). |
| tests/settings-users.authed.spec.js:196 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/settings-webhooks-mutations.authed.spec.js:19 | fixme | da boş). |
| tests/settings-webhooks.authed.spec.js:146 | skip | Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı. |
| tests/supervisor-agent-live.authed.spec.js:55 | fixme |  |
| tests/supervisor-agents.authed.spec.js:197 | fixme |  |
| tests/supervisor-agents.authed.spec.js:198 | fixme |  |
| tests/supervisor-agents.authed.spec.js:282 | skip | VOMENTA_TEST_AGENT_EMAIL eksik |
| tests/supervisor-coaching.authed.spec.js:160 | fixme |  |
| tests/supervisor-interactions.authed.spec.js:108 | fixme |  |
| tests/supervisor-wallboard.authed.spec.js:163 | skip | da güvenilir. |
| tests/supervisor-wallboard.authed.spec.js:278 | fixme |  |
| tests/supervisor-wallboard.authed.spec.js:279 | fixme |  |
| tests/supervisor-wallboard.authed.spec.js:280 | fixme |  |
| tests/supervisor-wallboard.authed.spec.js:281 | fixme |  |
| tests/supervisor-wallboard.authed.spec.js:282 | fixme |  |
| tests/voice-call.mutation.authed.spec.js:33 | fixme | de doğrulanacak. |
| tests/voice-call.mutation.authed.spec.js:35 | skip | VOMENTA_TEST_PHONE tanımlı değil. |
| tests/voice-call.mutation.authed.spec.js:68 | fixme | de doğrulanacak. |
| tests/voice-call.mutation.authed.spec.js:70 | skip | VOMENTA_TEST_PHONE tanımlı değil. |
| tests/workforce-badges-mutations.authed.spec.js:28 | fixme |  |
| tests/workforce-badges.authed.spec.js:93 | skip | Tabloda rozet yok — kontrol atlandı. |
| tests/workforce-evaluations-mutations.authed.spec.js:29 | fixme |  |
| tests/workforce-schedules.authed.spec.js:90 | skip | hücresi yok — kontrol atlandı. |
| tests/workforce-surveys.authed.spec.js:83 | skip | Tabloda anket yok — a11y kontrolü atlandı. |

### İncelendi, standart test edilemedi (coverage-TODO)

| kontrol | sayfa |
|---|---|
| Bildirimler paneli — standart dialog/menü açmıyor (incelendi) | Header |
| Dil menüsü — görünür menü açmıyor (incelendi) | Header |

### Yüzey boşluğu (envanter karşılaştırması)

- **Rota-bazlı arketip/derin kapsam yok** (yalnız generic baseline ile örtülü) — sıradaki nav yüzeyleri WP-04/WP-06 bekliyor:
  `/inbox` · `/ai` · `/campaigns` · `/bot-builder` · `/analytics` · `/reports` · `/supervisor`
- **Keşfedilen kayıtsız rotalar** (discovery-baseline − kayıtlı envanter; dinamik türetilir, tested-pages'te tam sözleşme yok):
  _yok — tüm keşif rotaları kayıtlı._
- Kayıtlı arketip rotaları (tested-pages, main-navigation dışı): 66 adet — çoğunlukla `reports` alt rotaları.
