# Vomenta — Sayfa Test Sonuçları (Sabah Read-only Koşumu)

> ⚙️ **Otomatik üretilir** (`npm run report:runtime`). Kaynak: Playwright **gerçek koşum** JSON raporu (statik `--list` DEĞİL).
> **Kanıt:** commit `0707f82699d7cf6847719034d830e5c50d360f63` · ortam `production-read-only` · tarayıcı `chromium` · proje `chromium-authed` · run `31096164216` · üretim `2026-08-06T11:16:12.542Z`

## Rota durum özeti

- **Kayıtlı rota:** 87 · sözleşme sayfası: 48
- **PASS** 83 · **FAIL** 0 · **FLAKY** 0 · **BLOCKED** 0 · **NOT_RUN** 4  _(toplam 87)_
- **Koşum:** seçilen 87 · çalışan 87 · geçen 87 · başarısız 0 · flaky 0 · atlanan 0
- **Kapsam hunisi (ayrı semantik):** tanımlı 134 → production-safe seçilebilir 98 → bu koşumda seçilen 87 → gerçekten çalışan 87  ·  staging gerektiren 36  ·  politikayla dışlanan (SKIPPED_BY_POLICY) 36  ·  EXPECTED_KNOWN_BUG 0
- ℹ️ **`listed != selected != executed != passed`** — bu sayılar aynı şey DEĞİLDİR; her biri ayrı kapsam katmanıdır.
- **Bilinen bulgu:** 61 (open 60 · fixed-candidate 0 · closed 1)

## Bu rapor neyi kanıtlar / ne kanıtlamaz

- **Kanıtlar:** kayıtlı her rotanın sabah koşumundaki read-only açılış (erişim/URL/temel yüzey) sonucu; gerçek çalıştırılan test sayısı; FAIL/BLOCKED/NOT_RUN gizlenmeden.
- **Kanıtlamaz:** derin fonksiyon kapsamı, mutation/RBAC/dış-servis senaryoları (staging bekler), cross-browser/visual. Sayfa PASS = "tam fonksiyon kapsamı" DEĞİL.

## Dikkat gerektiren rotalar (FAIL / FLAKY / BLOCKED / NOT_RUN)

| rota | durum | neden | çalışan | spec dosyaları | bulgular |
|---|---|---|---|---|---|
| /bot-builder/:id | ⚪ NOT_RUN | inventory-only | 0 |  |  |
| /contacts/:id | ⚪ NOT_RUN | inventory-only | 0 |  |  |
| /settings/billing | ⚪ NOT_RUN | inventory-only | 0 |  | SETTINGS-BILLING-REDIRECT(high/open) |
| /settings/billing/marketplace | ⚪ NOT_RUN | inventory-only | 0 |  |  |

## Tüm kayıtlı rotalar

| rota | sözleşme | durum | seçilen | çalışan | geçen | başarısız | flaky | atlanan | süre(ms) | bulgular |
|---|---|---|---|---|---|---|---|---|---|---|
| / | dashboard,main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9317 | DASH-AI-I18N DASH-CLICKHOUSE |
| /ai | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10513 | B13 B15 |
| /ai/prompts |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12886 | AI-PROMPTS-CONSOLE |
| /ai/chatbot |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12144 |  |
| /ai/copilot |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13517 |  |
| /ai/knowledge-base |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12982 |  |
| /ai/providers |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13485 |  |
| /ai/sentiment |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13989 |  |
| /ai/usage |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12827 |  |
| /ai/voice |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12583 |  |
| /analytics | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13663 | ANALYTICS-A ANALYTICS-B B12 |
| /bot-builder | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12616 | BOT-BUILDER-CLOSE-I18N BOT-BUILDER-TEMPLATE-I18N |
| /bot-builder/:id |  | ⚪ NOT_RUN | 0 | 0 | 0 | 0 | 0 | 0 |  |  |
| /campaigns | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13020 | B2 |
| /campaigns/outbound |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13703 | CAMPAIGNS-ICON-A11Y CAMPAIGNS-PAGER |
| /campaigns/create |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11919 |  |
| /channels | channels-hub,main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10286 | B5 |
| /channels/email | channels-email | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11470 | B17 B21 B9 |
| /channels/sms | channels-sms | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10720 | B18 B22 |
| /channels/social | channels-social | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9683 | B16 B24 |
| /channels/video | channels-video | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9245 | B25 |
| /channels/webchat | channels-webchat | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7678 | B20 |
| /channels/whatsapp | channels-whatsapp | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11873 | B19 B23 |
| /contacts | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12066 | CONTACTS-F1 CONTACTS-F2 |
| /contacts/import |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13799 |  |
| /contacts/segments |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13547 |  |
| /contacts/:id |  | ⚪ NOT_RUN | 0 | 0 | 0 | 0 | 0 | 0 |  |  |
| /inbox | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13107 | B3 B8 |
| /reports | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12979 | REPORTS-AIKEY REPORTS-INTL |
| /reports/agent | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13623 |  |
| /reports/ai | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12905 |  |
| /reports/billing | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12901 |  |
| /reports/call | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12090 | REPORTS-SECTIONS-TZ |
| /reports/campaign | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13700 |  |
| /reports/channel | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12994 |  |
| /reports/csat | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11055 |  |
| /reports/dashboards | reports-dashboards | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10496 | DASHBOARDS-SHARE-OVERFLOW |
| /reports/quality | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10583 |  |
| /reports/queue | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10463 |  |
| /reports/sla | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9831 |  |
| /settings | main-navigation,settings-hub | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8175 | B4 B6 B7 SETTINGS-BILLING-CHANGEPLAN SETTINGS-BILLING-HISTORY |
| /settings/api-keys | settings-api-keys | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6685 |  |
| /settings/audit | settings-audit | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5622 |  |
| /settings/automations | settings-automations | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4851 |  |
| /settings/billing |  | ⚪ NOT_RUN | 0 | 0 | 0 | 0 | 0 | 0 |  | SETTINGS-BILLING-REDIRECT |
| /settings/billing/marketplace |  | ⚪ NOT_RUN | 0 | 0 | 0 | 0 | 0 | 0 |  |  |
| /settings/canned-responses | settings-canned-responses | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7247 |  |
| /settings/compliance | settings-compliance | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5948 |  |
| /settings/data-retention | settings-data-retention | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10613 |  |
| /settings/disposition-codes | settings-disposition-codes | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11991 |  |
| /settings/hours | settings-hours | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9593 |  |
| /settings/integrations | settings-integrations | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10280 |  |
| /settings/notifications | settings-notifications | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10078 |  |
| /settings/organization | settings-organization | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13073 |  |
| /settings/profile | settings-profile | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 14765 |  |
| /settings/roles | settings-roles | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12907 |  |
| /settings/security | settings-security | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7724 |  |
| /settings/sla | settings-sla | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 10573 |  |
| /settings/teams | settings-teams | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12166 |  |
| /settings/templates | settings-templates | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13338 |  |
| /settings/users | settings-users | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11859 |  |
| /settings/webhooks | settings-webhooks | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11843 |  |
| /supervisor | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13024 |  |
| /supervisor/agents |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 14543 | AGENTS-TZ |
| /supervisor/calls |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 11435 |  |
| /supervisor/coaching |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13212 |  |
| /supervisor/interactions |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 12107 |  |
| /supervisor/wallboard |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6966 | WALLBOARD-AUTOSCROLL WALLBOARD-I18N WALLBOARD-LIVE-TZ WALLBOARD-RESUME-I18N WALLBOARD-THEME |
| /tickets | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6677 |  |
| /voice | main-navigation,voice-hub | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8553 |  |
| /voice/live |  | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7078 |  |
| /voice/dids | voice-dids | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5911 | B14 |
| /voice/history | voice-history | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9869 | VOICE-HISTORY-A11Y-LABEL |
| /voice/ivr | voice-ivr | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8797 |  |
| /voice/queues | voice-queues | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7149 |  |
| /voice/recordings | voice-recordings | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 13977 | VOICE-RECORDINGS-A11Y-LABEL |
| /voice/regulatory | voice-regulatory | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 16995 | B1 B10 VOICE-REGULATORY-BROKEN |
| /voice/sip-settings | voice-sip-settings | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9631 |  |
| /voice/sip-trunks | voice-sip-trunks | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 9766 | VOICE-SIP-TRUNKS-SUBTITLE-I18N |
| /voice/skills | voice-skills | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8436 |  |
| /voice/voicemail | voice-voicemail | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8421 | B11 VOICEMAIL-PAGER-I18N |
| /workforce | main-navigation,workforce | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6473 | WORKFORCE-ADHERENCE-I18N WORKFORCE-ADHERENCE-RANGE-STATE |
| /workforce/badges | workforce-badges | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5937 | WORKFORCE-BADGES-NO-EDIT-DELETE |
| /workforce/evaluations | workforce-evaluations | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8106 |  |
| /workforce/schedules | workforce-schedules | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8534 | WORKFORCE-SCHEDULE-CELL-A11Y |
| /workforce/surveys | workforce-surveys | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5452 | WORKFORCE-SURVEYS-ICON-A11Y |
| /workforce/time-off | workforce-time-off | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6957 |  |

## Bulgu özeti (severity × status)

- Toplam 61 · open 60 · fixed-candidate 0 · closed 1
- Rotaya bağlanamayan bulgu (unmappedFindings): 2
- Rotaya eşlenmeyen test sonucu (unmappedTests): 4 — sayfa durumuna SAYILMAZ (sahte PASS engeli).
