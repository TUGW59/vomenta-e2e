# Vomenta — Sayfa Test Sonuçları (Sabah Read-only Koşumu)

> ⚙️ **Otomatik üretilir** (`npm run report:runtime`). Kaynak: Playwright **gerçek koşum** JSON raporu (statik `--list` DEĞİL).
> **Kanıt:** commit `88033f03ef638c926243e66ae525c66805bfd0a1` · ortam `production-read-only` · tarayıcı `chromium` · proje `setup` · üretim `2026-08-02T19:46:28.218Z`

## Rota durum özeti

- **Kayıtlı rota:** 55 · sözleşme sayfası: 36
- **PASS** 55 · **FAIL** 0 · **FLAKY** 0 · **BLOCKED** 0 · **NOT_RUN** 0  _(toplam 55)_
- **Koşum:** seçilen 56 · çalışan 56 · geçen 56 · başarısız 0 · flaky 0 · atlanan 0
- **Bilinen bulgu:** 50 (open 49 · fixed-candidate 0 · closed 1)

## Bu rapor neyi kanıtlar / ne kanıtlamaz

- **Kanıtlar:** kayıtlı her rotanın sabah koşumundaki read-only açılış (erişim/URL/temel yüzey) sonucu; gerçek çalıştırılan test sayısı; FAIL/BLOCKED/NOT_RUN gizlenmeden.
- **Kanıtlamaz:** derin fonksiyon kapsamı, mutation/RBAC/dış-servis senaryoları (staging bekler), cross-browser/visual. Sayfa PASS = "tam fonksiyon kapsamı" DEĞİL.

## Tüm kayıtlı rotalar

| rota | sözleşme | durum | seçilen | çalışan | geçen | başarısız | flaky | atlanan | süre(ms) | bulgular |
|---|---|---|---|---|---|---|---|---|---|---|
| / | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5423 |  |
| /inbox | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6108 | B3 B8 |
| /voice | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7707 |  |
| /channels | channels-hub,main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8210 | B5 |
| /ai | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8119 | B13 B15 |
| /campaigns | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7158 | B2 |
| /bot-builder | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5246 |  |
| /contacts | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6946 | CONTACTS-F1 CONTACTS-F2 |
| /tickets | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6016 |  |
| /analytics | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5458 | ANALYTICS-A ANALYTICS-B B12 |
| /reports | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5576 | REPORTS-AIKEY REPORTS-INTL |
| /supervisor | main-navigation | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7099 |  |
| /workforce | main-navigation,workforce | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4567 | WORKFORCE-ADHERENCE-I18N WORKFORCE-ADHERENCE-RANGE-STATE |
| /settings | main-navigation,settings-hub | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4849 | B4 B6 B7 SETTINGS-BILLING-CHANGEPLAN SETTINGS-BILLING-HISTORY |
| /reports/dashboards | reports-dashboards | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7895 | DASHBOARDS-SHARE-OVERFLOW |
| /reports/call | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5441 | REPORTS-SECTIONS-TZ |
| /reports/agent | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6143 |  |
| /reports/queue | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6505 |  |
| /reports/campaign | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5780 |  |
| /reports/channel | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5084 |  |
| /reports/ai | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5925 |  |
| /reports/quality | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8502 |  |
| /reports/csat | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7056 |  |
| /reports/billing | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5191 |  |
| /reports/sla | reports-sections | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 8048 |  |
| /settings/profile | settings-profile | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6772 |  |
| /settings/organization | settings-organization | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5100 |  |
| /settings/users | settings-users | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5573 |  |
| /settings/roles | settings-roles | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5584 |  |
| /settings/compliance | settings-compliance | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4286 |  |
| /settings/teams | settings-teams | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4051 |  |
| /settings/hours | settings-hours | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7755 |  |
| /settings/automations | settings-automations | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4384 |  |
| /settings/sla | settings-sla | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6618 |  |
| /settings/templates | settings-templates | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6518 |  |
| /settings/disposition-codes | settings-disposition-codes | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5223 |  |
| /settings/canned-responses | settings-canned-responses | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5709 |  |
| /settings/integrations | settings-integrations | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5701 |  |
| /settings/security | settings-security | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5731 |  |
| /settings/data-retention | settings-data-retention | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5380 |  |
| /settings/notifications | settings-notifications | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4469 |  |
| /settings/api-keys | settings-api-keys | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5236 |  |
| /settings/webhooks | settings-webhooks | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5494 |  |
| /settings/audit | settings-audit | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6580 |  |
| /workforce/schedules | workforce-schedules | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7188 | WORKFORCE-SCHEDULE-CELL-A11Y |
| /workforce/time-off | workforce-time-off | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5057 |  |
| /workforce/surveys | workforce-surveys | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7619 | WORKFORCE-SURVEYS-ICON-A11Y |
| /workforce/badges | workforce-badges | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4667 | WORKFORCE-BADGES-NO-EDIT-DELETE |
| /workforce/evaluations | workforce-evaluations | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6912 |  |
| /channels/webchat | channels-webchat | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6559 | B20 |
| /channels/email | channels-email | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6970 | B17 B21 B9 |
| /channels/sms | channels-sms | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 7113 | B18 B22 |
| /channels/whatsapp | channels-whatsapp | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 6074 | B19 B23 |
| /channels/social | channels-social | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 5290 | B16 B24 |
| /channels/video | channels-video | ✅ PASS | 1 | 1 | 1 | 0 | 0 | 0 | 4254 | B25 |

## Bulgu özeti (severity × status)

- Toplam 50 · open 49 · fixed-candidate 0 · closed 1
- Rotaya bağlanamayan bulgu (unmappedFindings): 14
- Rotaya eşlenmeyen test sonucu (unmappedTests): 1 — sayfa durumuna SAYILMAZ (sahte PASS engeli).
