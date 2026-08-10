# Vomenta — Yüzey Envanteri (SURFACE-INVENTORY)

> **OTOMATİK ÜRETİLDİ** — `tools/generate-surface-inventory.mjs`. ELLE DÜZENLEMEYİN.
> Kaynak: kanonik `tests/contracts/product-surfaces.js` (ÜRÜN VARLIĞI) + kapsam sözleşmeleri
> (`tested-pages.js`) + surface-completeness uzlaştırması. WP-SURFACE-RECONCILE / FAZ 4 / ADR-0021.

Bu envanter "test edildi mi?" DEĞİL şu üç ayrı soruyu yanıtlar: (1) üründe hangi yüzeyler
var? (2) hangileri kanonik registry'ye kayıtlı? (3) hangilerinde *dedicated* kapsam
sözleşmesi var? `main-navigation` dedicated kapsam SAYILMAZ. `✅` ile stil/runtime/feature
kapsamı KARIŞTIRILMAZ (o ayrım TEST_STYLE_MATRIX / SURFACE-DEPTH / SAYFA-TEST-SONUCLARI'nda).

## Özet

- **Kayıtlı yüzey:** 92
- **Kapsam sözleşmesi olan:** 64 · **NO_COVERAGE_CONTRACT:** 19
- **Dynamic:** 2 · **BLOCKED (fixture/rol/staging):** 9 · **REDIRECT:** 0 · **DEPRECATED:** 0
- **Observed-but-unregistered:** 0 · **Ambiguous:** 0 · **Held (PR-only/unverified):** 3
- **Uzlaştırılan kaynak:** 8 (470 gözlem)

### Alan (area) dağılımı

| Alan | Yüzey |
|---|--:|
| ai | 9 |
| analytics | 1 |
| bot-builder | 2 |
| campaigns | 3 |
| channels | 7 |
| contacts | 4 |
| dashboard | 1 |
| inbox | 1 |
| monitoring | 4 |
| reports | 12 |
| settings | 22 |
| supervisor | 7 |
| tickets | 1 |
| voice | 12 |
| workforce | 6 |

### Runtime politikası dağılımı

| runtimePolicy | Yüzey |
|---|--:|
| fixture-required | 2 |
| readonly-baseline | 83 |
| readonly-blocked | 7 |

## 1. Kayıtlı yüzeyler (registered surfaces)

| id | route | area | routeKind | lifecycle | nav | runtimePolicy | baseline | contract? | status |
|---|---|---|---|---|---|---|---|:--:|---|
| ai | /ai | ai | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-chatbot | /ai/chatbot | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-copilot | /ai/copilot | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-knowledge-base | /ai/knowledge-base | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-prompts | /ai/prompts | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-providers | /ai/providers | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-sentiment | /ai/sentiment | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| ai-usage | /ai/usage | ai | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| ai-voice | /ai/voice | ai | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| analytics | /analytics | analytics | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| bot-builder | /bot-builder | bot-builder | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| bot-builder-detail | /bot-builder/:id | bot-builder | dynamic | active | secondary | fixture-required | blocked | — | BLOCKED |
| campaigns | /campaigns | campaigns | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| campaigns-create | /campaigns/create | campaigns | static | active | contextual | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| campaigns-outbound | /campaigns/outbound | campaigns | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels | /channels | channels | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels-email | /channels/email | channels | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels-sms | /channels/sms | channels | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels-social | /channels/social | channels | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels-video | /channels/video | channels | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels-webchat | /channels/webchat | channels | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| channels-whatsapp | /channels/whatsapp | channels | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| contacts | /contacts | contacts | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| contacts-detail | /contacts/:id | contacts | dynamic | active | contextual | fixture-required | blocked | — | BLOCKED |
| contacts-import | /contacts/import | contacts | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| contacts-segments | /contacts/segments | contacts | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| dashboard | / | dashboard | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| inbox | /inbox | inbox | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| monitoring | /monitoring | monitoring | static | conditional | hidden | readonly-blocked | blocked | — | BLOCKED |
| monitoring-agents | /monitoring/agents | monitoring | static | conditional | hidden | readonly-blocked | blocked | — | BLOCKED |
| monitoring-ai-summary | /monitoring/ai-summary | monitoring | static | conditional | hidden | readonly-blocked | blocked | — | BLOCKED |
| monitoring-live | /monitoring/live | monitoring | static | conditional | hidden | readonly-blocked | blocked | — | BLOCKED |
| reports | /reports | reports | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| reports-agent | /reports/agent | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-ai | /reports/ai | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-billing | /reports/billing | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-call | /reports/call | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-campaign | /reports/campaign | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-channel | /reports/channel | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-csat | /reports/csat | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-dashboards | /reports/dashboards | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-quality | /reports/quality | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-queue | /reports/queue | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| reports-sla | /reports/sla | reports | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings | /settings | settings | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-api-keys | /settings/api-keys | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-audit | /settings/audit | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-automations | /settings/automations | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-billing | /settings/billing | settings | static | conditional | secondary | readonly-blocked | blocked | — | BLOCKED |
| settings-billing-marketplace | /settings/billing/marketplace | settings | static | conditional | secondary | readonly-blocked | blocked | — | BLOCKED |
| settings-canned-responses | /settings/canned-responses | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-compliance | /settings/compliance | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-data-retention | /settings/data-retention | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-disposition-codes | /settings/disposition-codes | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-hours | /settings/hours | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-integrations | /settings/integrations | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-notifications | /settings/notifications | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-organization | /settings/organization | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-profile | /settings/profile | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-roles | /settings/roles | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-security | /settings/security | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-sla | /settings/sla | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-teams | /settings/teams | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-templates | /settings/templates | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-users | /settings/users | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| settings-webhooks | /settings/webhooks | settings | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| supervisor | /supervisor | supervisor | static | active | main | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| supervisor-agents | /supervisor/agents | supervisor | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| supervisor-ai-rate-suggestions | /supervisor/ai-rate-suggestions | supervisor | static | conditional | secondary | readonly-blocked | blocked | — | BLOCKED |
| supervisor-calls | /supervisor/calls | supervisor | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| supervisor-coaching | /supervisor/coaching | supervisor | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| supervisor-interactions | /supervisor/interactions | supervisor | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| supervisor-wallboard | /supervisor/wallboard | supervisor | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| tickets | /tickets | tickets | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice | /voice | voice | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-dids | /voice/dids | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-history | /voice/history | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-ivr | /voice/ivr | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-live | /voice/live | voice | static | active | secondary | readonly-baseline | runnable | — | NO_COVERAGE_CONTRACT |
| voice-queues | /voice/queues | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-recordings | /voice/recordings | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-regulatory | /voice/regulatory | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-sip-settings | /voice/sip-settings | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-sip-trunks | /voice/sip-trunks | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-skills | /voice/skills | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| voice-voicemail | /voice/voicemail | voice | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| workforce | /workforce | workforce | static | active | main | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| workforce-badges | /workforce/badges | workforce | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| workforce-evaluations | /workforce/evaluations | workforce | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| workforce-schedules | /workforce/schedules | workforce | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| workforce-surveys | /workforce/surveys | workforce | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |
| workforce-time-off | /workforce/time-off | workforce | static | active | secondary | readonly-baseline | runnable | ✔ | COVERED_CONTRACT |

## 2. Observed but unregistered (hedef: 0)

Yok — repo içi tüm rota kaynakları kanonik registry ile uzlaştı (0 UNREGISTERED_OBSERVED, 0 AMBIGUOUS).

## 3. Registered but NO_COVERAGE_CONTRACT

Üründe var ve kayıtlı; ama *dedicated* kapsam sözleşmesi YOK. Kaybolmaz — dürüstçe eksik
görünür (baseline smoke'u alır, matriste `NO_COVERAGE_CONTRACT`). Dedicated kapsam FAZ 6 dalgalarında yazılır.

| id | route | area |
|---|---|---|
| ai | /ai | ai |
| ai-chatbot | /ai/chatbot | ai |
| ai-copilot | /ai/copilot | ai |
| ai-knowledge-base | /ai/knowledge-base | ai |
| ai-prompts | /ai/prompts | ai |
| ai-providers | /ai/providers | ai |
| ai-sentiment | /ai/sentiment | ai |
| ai-voice | /ai/voice | ai |
| analytics | /analytics | analytics |
| bot-builder | /bot-builder | bot-builder |
| campaigns | /campaigns | campaigns |
| campaigns-create | /campaigns/create | campaigns |
| contacts-import | /contacts/import | contacts |
| contacts-segments | /contacts/segments | contacts |
| inbox | /inbox | inbox |
| reports | /reports | reports |
| supervisor | /supervisor | supervisor |
| supervisor-wallboard | /supervisor/wallboard | supervisor |
| voice-live | /voice/live | voice |

## 4. Dynamic / BLOCKED (reason-code'lu; sahte PASS üretmez)

| id | route | routeKind | baseline | blockedReason |
|---|---|---|---|---|
| bot-builder-detail | /bot-builder/:id | dynamic | blocked | READONLY_FIXTURE_ID_REQUIRED |
| contacts-detail | /contacts/:id | dynamic | blocked | READONLY_FIXTURE_ID_REQUIRED |
| monitoring | /monitoring | static | blocked | READONLY_FEATURE_FLAG_OFF |
| monitoring-agents | /monitoring/agents | static | blocked | READONLY_FEATURE_FLAG_OFF |
| monitoring-ai-summary | /monitoring/ai-summary | static | blocked | READONLY_FEATURE_FLAG_OFF |
| monitoring-live | /monitoring/live | static | blocked | READONLY_FEATURE_FLAG_OFF |
| settings-billing | /settings/billing | static | blocked | READONLY_403_FORBIDDEN |
| settings-billing-marketplace | /settings/billing/marketplace | static | blocked | READONLY_403_FORBIDDEN |
| supervisor-ai-rate-suggestions | /supervisor/ai-rate-suggestions | static | blocked | READONLY_FEATURE_FLAG_OFF |

## 5. Deprecated / Redirect (alias)

Yok. (Not: `/voice` → `/voice/live` istemci-tarafı yönlenmesi taşır; `/voice` main-nav hub olarak
kayıtlı, `/voice/live` gerçek içerik yüzeyidir — redirect ayrı bir kanonik yüzey olarak modellenmemiştir.)

## 6. Held candidates — bilinçli EKLENMEYEN (kaybolmaz)

Kanıtı yetersiz olduğu için registry'ye ALINMADI. "Var olmayan eski route'u sırf PR'da
yazıyor diye active ekleme" (HANDOFF FAZ 4). Görünür kalır; gelecek fazda canlı doğrulanır.

| route | area | reason | evidenceRef |
|---|---|---|---|
| /campaigns/dnc | campaigns | PR-only (#42); güncel main'de kanıt yok | PR #42 |
| /campaigns/sender-ids | campaigns | PR-only (#42); güncel main'de kanıt yok (0 spec/page-object/discovery/known-bug) | PR #42 |
| /campaigns/templates | campaigns | PR-only (#42); güncel main'de kanıt yok | PR #42 |

## 7. Evidence source rollup (ürün-varlık kanıt tipi → kaç yüzey)

| evidence type | yüzey |
|---|--:|
| discovery-observation | 46 |
| known-bug | 35 |
| live-observation | 5 |
| navigation-contract | 14 |
| page-object | 18 |
| route-inventory | 65 |

