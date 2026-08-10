# Vomenta — Proje Durumu (PROJECT-STATUS)

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run report:project-status` (veya `npm run report:all`).
> Kaynak: `docs/raporlar/SURFACE-INVENTORY.json` + `docs/raporlar/SURFACE-DEPTH.json` — İKİSİ DE kanonik
> `tests/contracts/product-surfaces.js`'ten türer. Bu rapor onları rota anahtarında BİRLEŞTİRİR
> (WP-SURFACE-UNIFIED / FAZ 5 / ADR-0022). Her kanonik yüzey burada TAM BİR KEZ görünür.
> **Kanıt:** commit `0707f82699d7cf6847719034d830e5c50d360f63` · ortam `production-read-only` · tarayıcı `chromium` · runtime `2026-08-06T11:16:12.542Z`

## Bu rapor neyi kanıtlar / ne kanıtlamaz

- Her yüzey TEK, fail-closed bir proje-durumu sınıfına düşer. Sınıf bir "yeşil rozet" değildir:
  `NO_CONTRACT` = üründe var + açılıyor ama dedicated kapsam sözleşmesi YOK; `NOT_RUN` = koşulabilir
  ama bu koşumda runtime sonucu yok; `L2·style (unverified)` = stil kanıtlı ama etkileşim derinliği kanıtsız.
- `L2·deep` dışındaki hiçbir sınıf "tam kapsandı" DEĞİLDİR. Rollup, envanter (sözleşme) + derinlik
  (L1 runtime + L2) modellerinin BİRLEŞİMİDİR; iki model rota spine'ında birebir uzlaşmazsa rapor
  fail-closed kırılır (drift kapısı). L3/L4/L5 (mutation/rol/provider) tasarım gereği bu görünümde yoktur.

## Özet (türetilmiş — sabit sayı yok)

- **Kanonik yüzey:** 92
- **L2·deep:** 38 · **L2·style (unverified):** 27 · **L1·style-gap:** 0
- **NO_CONTRACT:** 18 · **NOT_RUN:** 0 · **FAIL:** 0 · **BLOCKED:** 9 · **REDIRECT:** 0 · **DEPRECATED:** 0
- **Etkileşim derinliği doğrulanmayan (unverified) yüzey:** 27
- **Açık bulgu:** 60 (34 yüzeyde)

### Rollup dağılımı

| durum | yüzey |
|---|--:|
| ⛔ BLOCKED | 9 |
| ✅ L2·deep | 38 |
| 🟡 L2·style (unverified) | 27 |
| 🟠 NO_CONTRACT | 18 |

### Alan (area) dağılımı

| alan | yüzey |
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

## Tüm kanonik yüzeyler (her yüzey tam bir kez)

| id | route | area | sözleşme | L1 | L2 | etkileşim (kanıtlı/geçerli) | en yüksek | açık bulgu | PROJE DURUMU |
|---|---|---|:--:|:--:|---|:--:|---|--:|---|
| ai | /ai | ai | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| ai-chatbot | /ai/chatbot | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| ai-copilot | /ai/copilot | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| ai-knowledge-base | /ai/knowledge-base | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| ai-prompts | /ai/prompts | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | 1 | 🟠 NO_CONTRACT |
| ai-providers | /ai/providers | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| ai-sentiment | /ai/sentiment | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| ai-usage | /ai/usage | ai | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| ai-voice | /ai/voice | ai | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| analytics | /analytics | analytics | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 3 | 🟠 NO_CONTRACT |
| bot-builder | /bot-builder | bot-builder | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| bot-builder-detail | /bot-builder/:id | bot-builder | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| campaigns | /campaigns | campaigns | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟠 NO_CONTRACT |
| campaigns-create | /campaigns/create | campaigns | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| campaigns-outbound | /campaigns/outbound | campaigns | ✔ | ✅ | COMPLETE | 4/4 | L2_DEEP | 2 | ✅ L2·deep |
| channels | /channels | channels | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| channels-email | /channels/email | channels | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 3 | 🟡 L2·style (unverified) |
| channels-sms | /channels/sms | channels | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| channels-social | /channels/social | channels | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| channels-video | /channels/video | channels | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| channels-webchat | /channels/webchat | channels | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| channels-whatsapp | /channels/whatsapp | channels | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| contacts | /contacts | contacts | ✔ | ✅ | COMPLETE | 3/3 | L2_DEEP | 2 | ✅ L2·deep |
| contacts-detail | /contacts/:id | contacts | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| contacts-import | /contacts/import | contacts | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| contacts-segments | /contacts/segments | contacts | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| dashboard | / | dashboard | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| inbox | /inbox | inbox | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟠 NO_CONTRACT |
| monitoring | /monitoring | monitoring | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| monitoring-agents | /monitoring/agents | monitoring | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| monitoring-ai-summary | /monitoring/ai-summary | monitoring | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| monitoring-live | /monitoring/live | monitoring | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| reports | /reports | reports | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| reports-agent | /reports/agent | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-ai | /reports/ai | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-billing | /reports/billing | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-call | /reports/call | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| reports-campaign | /reports/campaign | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-channel | /reports/channel | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-csat | /reports/csat | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-dashboards | /reports/dashboards | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| reports-quality | /reports/quality | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-queue | /reports/queue | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| reports-sla | /reports/sla | reports | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings | /settings | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 5 | ✅ L2·deep |
| settings-api-keys | /settings/api-keys | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-audit | /settings/audit | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-automations | /settings/automations | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-billing | /settings/billing | settings | — | ⚪ | NOT_COVERED | 0/6 | L0 | 1 | ⛔ BLOCKED |
| settings-billing-marketplace | /settings/billing/marketplace | settings | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| settings-canned-responses | /settings/canned-responses | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-compliance | /settings/compliance | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-data-retention | /settings/data-retention | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-disposition-codes | /settings/disposition-codes | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-hours | /settings/hours | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-integrations | /settings/integrations | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-notifications | /settings/notifications | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-organization | /settings/organization | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-profile | /settings/profile | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-roles | /settings/roles | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-security | /settings/security | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-sla | /settings/sla | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-teams | /settings/teams | settings | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| settings-templates | /settings/templates | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| settings-users | /settings/users | settings | ✔ | ✅ | COMPLETE | 3/3 | L2_DEEP | — | ✅ L2·deep |
| settings-webhooks | /settings/webhooks | settings | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| supervisor | /supervisor | supervisor | — | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟠 NO_CONTRACT |
| supervisor-agents | /supervisor/agents | supervisor | ✔ | ✅ | COMPLETE | 3/3 | L2_DEEP | 1 | ✅ L2·deep |
| supervisor-ai-rate-suggestions | /supervisor/ai-rate-suggestions | supervisor | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| supervisor-calls | /supervisor/calls | supervisor | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| supervisor-coaching | /supervisor/coaching | supervisor | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| supervisor-interactions | /supervisor/interactions | supervisor | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| supervisor-wallboard | /supervisor/wallboard | supervisor | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 6 | 🟡 L2·style (unverified) |
| tickets | /tickets | tickets | ✔ | ✅ | COMPLETE | 4/4 | L2_DEEP | 1 | ✅ L2·deep |
| voice | /voice | voice | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| voice-dids | /voice/dids | voice | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| voice-history | /voice/history | voice | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| voice-ivr | /voice/ivr | voice | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | — | ✅ L2·deep |
| voice-live | /voice/live | voice | — | ✅ | NOT_COVERED | 0/6 | L1 | — | 🟠 NO_CONTRACT |
| voice-queues | /voice/queues | voice | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| voice-recordings | /voice/recordings | voice | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| voice-regulatory | /voice/regulatory | voice | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 3 | 🟡 L2·style (unverified) |
| voice-sip-settings | /voice/sip-settings | voice | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| voice-sip-trunks | /voice/sip-trunks | voice | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| voice-skills | /voice/skills | voice | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| voice-voicemail | /voice/voicemail | voice | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 2 | ✅ L2·deep |
| workforce | /workforce | workforce | ✔ | ✅ | COMPLETE | 2/2 | L2_DEEP | 2 | ✅ L2·deep |
| workforce-badges | /workforce/badges | workforce | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| workforce-evaluations | /workforce/evaluations | workforce | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |
| workforce-schedules | /workforce/schedules | workforce | ✔ | ✅ | COMPLETE | 1/1 | L2_DEEP | 1 | ✅ L2·deep |
| workforce-surveys | /workforce/surveys | workforce | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| workforce-time-off | /workforce/time-off | workforce | ✔ | ✅ | PARTIAL | 0/0 | L2_STYLE | — | 🟡 L2·style (unverified) |

