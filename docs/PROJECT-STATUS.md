# Vomenta — Proje Durumu (PROJECT-STATUS)

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run report:project-status` (veya `npm run report:all`).
> Kaynak: `docs/raporlar/SURFACE-INVENTORY.json` + `docs/raporlar/SURFACE-DEPTH.json` — İKİSİ DE kanonik
> `tests/contracts/product-surfaces.js`'ten türer. Bu rapor onları rota anahtarında BİRLEŞTİRİR
> (WP-SURFACE-UNIFIED / FAZ 5 / ADR-0022). Her kanonik yüzey burada TAM BİR KEZ görünür.
> **Kanıt:** commit `88033f03ef638c926243e66ae525c66805bfd0a1` · ortam `production-read-only` · tarayıcı `chromium` · runtime `2026-08-02T19:46:28.218Z`

## Bu rapor neyi kanıtlar / ne kanıtlamaz

- Her yüzey TEK, fail-closed bir proje-durumu sınıfına düşer. Sınıf bir "yeşil rozet" değildir:
  `NO_CONTRACT` = üründe var + açılıyor ama dedicated kapsam sözleşmesi YOK; `NOT_RUN` = koşulabilir
  ama bu koşumda runtime sonucu yok; `L2·style (unverified)` = stil kanıtlı ama etkileşim derinliği kanıtsız.
- `L2·deep` dışındaki hiçbir sınıf "tam kapsandı" DEĞİLDİR. Rollup, envanter (sözleşme) + derinlik
  (L1 runtime + L2) modellerinin BİRLEŞİMİDİR; iki model rota spine'ında birebir uzlaşmazsa rapor
  fail-closed kırılır (drift kapısı). L3/L4/L5 (mutation/rol/provider) tasarım gereği bu görünümde yoktur.

## Özet (türetilmiş — sabit sayı yok)

- **Kanonik yüzey:** 87
- **L2·deep:** 12 · **L2·style (unverified):** 34 · **L1·style-gap:** 0
- **NO_CONTRACT:** 9 · **NOT_RUN:** 28 · **FAIL:** 0 · **BLOCKED:** 4 · **REDIRECT:** 0 · **DEPRECATED:** 0
- **Etkileşim derinliği doğrulanmayan (unverified) yüzey:** 65
- **Açık bulgu:** 58 (33 yüzeyde)

### Rollup dağılımı

| durum | yüzey |
|---|--:|
| ⛔ BLOCKED | 4 |
| ✅ L2·deep | 12 |
| 🟡 L2·style (unverified) | 34 |
| 🟠 NO_CONTRACT | 9 |
| ⚪ NOT_RUN | 28 |

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
| reports | 12 |
| settings | 22 |
| supervisor | 6 |
| tickets | 1 |
| voice | 12 |
| workforce | 6 |

## Tüm kanonik yüzeyler (her yüzey tam bir kez)

| id | route | area | sözleşme | L1 | L2 | etkileşim (kanıtlı/geçerli) | en yüksek | açık bulgu | PROJE DURUMU |
|---|---|---|:--:|:--:|---|:--:|---|--:|---|
| ai | /ai | ai | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| ai-chatbot | /ai/chatbot | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| ai-copilot | /ai/copilot | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| ai-knowledge-base | /ai/knowledge-base | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| ai-prompts | /ai/prompts | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | 1 | ⚪ NOT_RUN |
| ai-providers | /ai/providers | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| ai-sentiment | /ai/sentiment | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| ai-usage | /ai/usage | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| ai-voice | /ai/voice | ai | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| analytics | /analytics | analytics | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 3 | 🟠 NO_CONTRACT |
| bot-builder | /bot-builder | bot-builder | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| bot-builder-detail | /bot-builder/:id | bot-builder | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| campaigns | /campaigns | campaigns | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟠 NO_CONTRACT |
| campaigns-create | /campaigns/create | campaigns | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| campaigns-outbound | /campaigns/outbound | campaigns | — | ⚪ | NOT_COVERED | 0/6 | L0 | 2 | ⚪ NOT_RUN |
| channels | /channels | channels | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| channels-email | /channels/email | channels | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 3 | 🟡 L2·style (unverified) |
| channels-sms | /channels/sms | channels | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| channels-social | /channels/social | channels | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| channels-video | /channels/video | channels | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| channels-webchat | /channels/webchat | channels | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| channels-whatsapp | /channels/whatsapp | channels | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| contacts | /contacts | contacts | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| contacts-detail | /contacts/:id | contacts | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⛔ BLOCKED |
| contacts-import | /contacts/import | contacts | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| contacts-segments | /contacts/segments | contacts | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| dashboard | / | dashboard | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| inbox | /inbox | inbox | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟠 NO_CONTRACT |
| reports | /reports | reports | — | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟠 NO_CONTRACT |
| reports-agent | /reports/agent | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-ai | /reports/ai | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-billing | /reports/billing | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-call | /reports/call | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| reports-campaign | /reports/campaign | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-channel | /reports/channel | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-csat | /reports/csat | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-dashboards | /reports/dashboards | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| reports-quality | /reports/quality | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-queue | /reports/queue | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
| reports-sla | /reports/sla | reports | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟡 L2·style (unverified) |
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
| supervisor-agents | /supervisor/agents | supervisor | — | ⚪ | NOT_COVERED | 0/6 | L0 | 1 | ⚪ NOT_RUN |
| supervisor-calls | /supervisor/calls | supervisor | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| supervisor-coaching | /supervisor/coaching | supervisor | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| supervisor-interactions | /supervisor/interactions | supervisor | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| supervisor-wallboard | /supervisor/wallboard | supervisor | — | ⚪ | NOT_COVERED | 0/6 | L0 | 5 | ⚪ NOT_RUN |
| tickets | /tickets | tickets | — | ✅ | PARTIAL | 0/6 | L2_STYLE | — | 🟠 NO_CONTRACT |
| voice | /voice | voice | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | — | 🟡 L2·style (unverified) |
| voice-dids | /voice/dids | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | 1 | ⚪ NOT_RUN |
| voice-history | /voice/history | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | 1 | ⚪ NOT_RUN |
| voice-ivr | /voice/ivr | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | — | ⚪ NOT_RUN |
| voice-live | /voice/live | voice | — | ⚪ | NOT_COVERED | 0/6 | L0 | — | ⚪ NOT_RUN |
| voice-queues | /voice/queues | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | — | ⚪ NOT_RUN |
| voice-recordings | /voice/recordings | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | 1 | ⚪ NOT_RUN |
| voice-regulatory | /voice/regulatory | voice | ✔ | ⚪ | PARTIAL | 0/0 | L0 | 3 | ⚪ NOT_RUN |
| voice-sip-settings | /voice/sip-settings | voice | ✔ | ⚪ | PARTIAL | 0/0 | L0 | — | ⚪ NOT_RUN |
| voice-sip-trunks | /voice/sip-trunks | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | 1 | ⚪ NOT_RUN |
| voice-skills | /voice/skills | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | — | ⚪ NOT_RUN |
| voice-voicemail | /voice/voicemail | voice | ✔ | ⚪ | PARTIAL | 0/5 | L0 | 2 | ⚪ NOT_RUN |
| workforce | /workforce | workforce | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | 2 | 🟡 L2·style (unverified) |
| workforce-badges | /workforce/badges | workforce | ✔ | ✅ | PARTIAL | 0/6 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| workforce-evaluations | /workforce/evaluations | workforce | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | — | 🟡 L2·style (unverified) |
| workforce-schedules | /workforce/schedules | workforce | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| workforce-surveys | /workforce/surveys | workforce | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | 1 | 🟡 L2·style (unverified) |
| workforce-time-off | /workforce/time-off | workforce | ✔ | ✅ | PARTIAL | 0/5 | L2_STYLE | — | 🟡 L2·style (unverified) |

