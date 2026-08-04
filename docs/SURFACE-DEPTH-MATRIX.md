# Vomenta — Rota Kapsam Derinliği Matrisi (L1–L5)

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run report:surface`.
> Kaynak: `tests/contracts/registered-routes.js` (envanter) + `docs/raporlar/TEST-SONUCLARI.json` (L1 runtime) + Playwright etiketleri (L2 statik). Kurallar: HANDOFF §4 · ADR-0012.
> **Kanıt:** commit `88033f03ef638c926243e66ae525c66805bfd0a1` · ortam `production-read-only` · tarayıcı `chromium` · runtime üretim `2026-08-02T19:46:28.218Z`

## Bu rapor neyi kanıtlar / ne kanıtlamaz

- **L1 (PROVEN):** rotanın GERÇEK read-only runtime açılış sonucu (erişim/URL/temel yüzey). Runtime sonucu olmayan rota L1 PROVEN olamaz.
- **L2 iki katman:** (a) **Stil sözleşmesi** — a11y/i18n/layout/errorpath/keyboard/clean/deeplink/visual/perf/data/export için STATİK etiket kanıtı (`COVERED` = test VAR; bu koşumda çalıştı demek DEĞİL). (b) **Etkileşim derinliği** — sekme/filtre/tablo/pagination/boş/loading için, ilgili `@ix-*` makine-okur işaretini taşıyan bir dedicated etkileşim testi VARSA `COVERED`, yoksa dürüstçe `UNVERIFIED` (ADR-0014). Kanıt standardı stil ile AYNI: etiket = o boyut için gerçek test var.
- **`L2·style`** = açılış + stil sözleşmesi kapsandı, etkileşim derinliği kanıtsız. **`L2·deep`** = ayrıca tüm geçerli etkileşim boyutu `@ix-*` işaretli testle kanıtlı (yüzeyde bulunmayan boyut açık gerekçeyle N/A — `naInteraction`).
- **L3/L4/L5:** production read-only + rol/tenant/provider altyapısı olmadan KANITLANAMAZ → tasarım gereği `BLOCKED`/`NOT_APPLICABLE`. Eksik değil, dürüst sınır beyanı.

## Özet (türetilmiş — sabit sayı yok)

- **Kayıtlı rota:** 71 · sözleşme sayfası: 48
- **L1:** PROVEN 55 · not-proven 16
- **L2 stil sözleşmesi:** karşılandı 65 · gerçek boşluk 6
- **L2 durum:** COMPLETE 3 · PARTIAL 62 · NOT_COVERED 6
- **Etkileşim derinliği tam doğrulanmayan rota:** 66 — en az bir geçerli boyut hâlâ `@ix-*` işaretsiz (WP-L2-WAVE-1 dalgalarının hedefi). İşaretli boyutlar "etkileşim (doğrulanan/geçerli)" sütununda sayılır.
- **L3:** BLOCKED(staging) 46 · N/A(no-write) 25
- **L4:** BLOCKED(rol/tenant) 71 · **L5:** BLOCKED(provider) 71
- **En yüksek seviye dağılımı:** L0 16 · L1 0 · L2·style 52 · L2·deep 3
- **Bilinen bulgu:** 61 (open 60 · fixed-candidate 0 · closed 1) · rotaya bağlı open bulgu: 58 (33 rota)
- **Rotaya eşlenmeyen test sonucu (unmappedTests):** 1 — hiçbir rotayı yeşile boyamaz. **Rotaya bağlanamayan bulgu:** 2

## Kapsam derinliği — tüm kayıtlı rotalar

| rota | sözleşme | en yüksek | L1 | L2 | stil (kapsanan/zorunlu) | etkileşim (doğrulanan/geçerli) | L3 | L4 | L5 | bulgular |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | dashboard,main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | N/A | ⛔ rol | ⛔ provider | DASH-AI-I18N(low/open) DASH-CLICKHOUSE(medium/open) |
| `/ai` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | B13(low/open) B15(medium/open) |
| `/ai/prompts` |  | ⚪ L0 | ⚪ NOT_RUN | ❌ NOT_COVERED | 0/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | AI-PROMPTS-CONSOLE(medium/open) |
| `/analytics` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | ANALYTICS-A(medium/open) ANALYTICS-B(medium/open) B12(medium/open) |
| `/bot-builder` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | BOT-BUILDER-CLOSE-I18N(low/open) BOT-BUILDER-TEMPLATE-I18N(high/open) |
| `/bot-builder/:id` |  | ⚪ L0 | ⚪ NOT_RUN | ❌ NOT_COVERED | 0/5 | 0/6 | N/A | ⛔ rol | ⛔ provider |  |
| `/campaigns` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | B2(high/open) |
| `/campaigns/outbound` |  | ⚪ L0 | ⚪ NOT_RUN | ❌ NOT_COVERED | 0/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | CAMPAIGNS-ICON-A11Y(medium/open) CAMPAIGNS-PAGER(medium/open) |
| `/channels` | channels-hub,main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | N/A | ⛔ rol | ⛔ provider | B5(medium/open) |
| `/channels/email` | channels-email | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B17(medium/open) B21(medium/open) B9(medium/open) |
| `/channels/sms` | channels-sms | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B18(medium/open) B22(medium/open) |
| `/channels/social` | channels-social | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 6/6 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B16(medium/open) B24(medium/open) |
| `/channels/video` | channels-video | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B25(medium/open) |
| `/channels/webchat` | channels-webchat | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider | B20(medium/open) |
| `/channels/whatsapp` | channels-whatsapp | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 6/6 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B19(medium/open) B23(medium/open) |
| `/contacts` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | CONTACTS-F1(medium/open) CONTACTS-F2(medium/open) |
| `/inbox` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | B3(high/open) B8(high/closed) |
| `/reports` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | REPORTS-AIKEY(medium/open) REPORTS-INTL(medium/open) |
| `/reports/agent` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/ai` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/billing` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/call` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider | REPORTS-SECTIONS-TZ(medium/open) |
| `/reports/campaign` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/channel` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/csat` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/dashboards` | reports-dashboards | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider | DASHBOARDS-SHARE-OVERFLOW(medium/open) |
| `/reports/quality` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/queue` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/reports/sla` | reports-sections | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 11/11 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings` | main-navigation,settings-hub | ✅ L2·deep | ✅ PROVEN | ✅ COMPLETE | 7/7 | 1/1 | N/A | ⛔ rol | ⛔ provider | B4(high/open) B6(medium/open) B7(medium/open) SETTINGS-BILLING-CHANGEPLAN(high/open) SETTINGS-BILLING-HISTORY(high/open) |
| `/settings/api-keys` | settings-api-keys | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/audit` | settings-audit | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | N/A | ⛔ rol | ⛔ provider |  |
| `/settings/automations` | settings-automations | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/billing` |  | ⚪ L0 | ⚪ NOT_RUN | ❌ NOT_COVERED | 0/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | SETTINGS-BILLING-REDIRECT(high/open) |
| `/settings/canned-responses` | settings-canned-responses | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/compliance` | settings-compliance | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/data-retention` | settings-data-retention | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/disposition-codes` | settings-disposition-codes | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/hours` | settings-hours | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/integrations` | settings-integrations | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/notifications` | settings-notifications | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 6/6 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/organization` | settings-organization | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/profile` | settings-profile | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/roles` | settings-roles | ✅ L2·deep | ✅ PROVEN | ✅ COMPLETE | 8/8 | 1/1 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/security` | settings-security | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/sla` | settings-sla | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 9/9 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/teams` | settings-teams | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/templates` | settings-templates | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/users` | settings-users | ✅ L2·deep | ✅ PROVEN | ✅ COMPLETE | 8/8 | 3/3 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/settings/webhooks` | settings-webhooks | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/supervisor` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider |  |
| `/supervisor/agents` |  | ⚪ L0 | ⚪ NOT_RUN | ❌ NOT_COVERED | 0/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | AGENTS-TZ(medium/open) |
| `/supervisor/wallboard` |  | ⚪ L0 | ⚪ NOT_RUN | ❌ NOT_COVERED | 0/5 | 0/6 | N/A | ⛔ rol | ⛔ provider | WALLBOARD-AUTOSCROLL(medium/open) WALLBOARD-I18N(medium/open) WALLBOARD-LIVE-TZ(medium/open) WALLBOARD-RESUME-I18N(low/open) WALLBOARD-THEME(medium/open) |
| `/tickets` | main-navigation | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 5/5 | 0/6 | N/A | ⛔ rol | ⛔ provider |  |
| `/voice` | main-navigation,voice-hub | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | N/A | ⛔ rol | ⛔ provider |  |
| `/voice/dids` | voice-dids | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B14(medium/open) |
| `/voice/history` | voice-history | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 7/7 | 0/5 | N/A | ⛔ rol | ⛔ provider | VOICE-HISTORY-A11Y-LABEL(medium/open) |
| `/voice/ivr` | voice-ivr | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/voice/queues` | voice-queues | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/voice/recordings` | voice-recordings | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 8/8 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | VOICE-RECORDINGS-A11Y-LABEL(medium/open) |
| `/voice/regulatory` | voice-regulatory | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 5/5 | 0/0 | N/A | ⛔ rol | ⛔ provider | B1(critical/open) B10(medium/open) VOICE-REGULATORY-BROKEN(high/open) |
| `/voice/sip-settings` | voice-sip-settings | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 5/5 | 0/0 | N/A | ⛔ rol | ⛔ provider |  |
| `/voice/sip-trunks` | voice-sip-trunks | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | VOICE-SIP-TRUNKS-SUBTITLE-I18N(low/open) |
| `/voice/skills` | voice-skills | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 6/6 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/voice/voicemail` | voice-voicemail | ⚪ L0 | ⚪ NOT_RUN | 🟡 PARTIAL | 6/6 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | B11(medium/open) VOICEMAIL-PAGER-I18N(medium/open) |
| `/workforce` | main-navigation,workforce | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider | WORKFORCE-ADHERENCE-I18N(low/open) WORKFORCE-ADHERENCE-RANGE-STATE(low/open) |
| `/workforce/badges` | workforce-badges | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/6 | ⛔ staging | ⛔ rol | ⛔ provider | WORKFORCE-BADGES-NO-EDIT-DELETE(medium/open) |
| `/workforce/evaluations` | workforce-evaluations | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider |  |
| `/workforce/schedules` | workforce-schedules | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 6/6 | 0/5 | N/A | ⛔ rol | ⛔ provider | WORKFORCE-SCHEDULE-CELL-A11Y(medium/open) |
| `/workforce/surveys` | workforce-surveys | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | ⛔ staging | ⛔ rol | ⛔ provider | WORKFORCE-SURVEYS-ICON-A11Y(medium/open) |
| `/workforce/time-off` | workforce-time-off | 🟡 L2·style | ✅ PROVEN | 🟡 PARTIAL | 7/7 | 0/5 | N/A | ⛔ rol | ⛔ provider |  |

## L2 stil boyutu detayı (statik etiket kapsamı)

Hücreler: ✅ COVERED (test var) · ❌ NOT_COVERED (zorunlu, eksik) · N/A gerekçeli · — zorunlu değil.

| rota | @i18n | @a11y | @layout | @clean | @deeplink | @keyboard | @errorpath | @visual | @perf | @data | @export |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | — |
| `/ai` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/ai/prompts` | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | — | — |
| `/analytics` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/bot-builder` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/bot-builder/:id` | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | — | — |
| `/campaigns` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/campaigns/outbound` | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | — | — |
| `/channels` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | N/A | ✅ | N/A |
| `/channels/email` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/channels/sms` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/channels/social` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A | N/A | ✅ | N/A |
| `/channels/video` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | N/A | ✅ | N/A |
| `/channels/webchat` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A |
| `/channels/whatsapp` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A | N/A | ✅ | N/A |
| `/contacts` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/inbox` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/reports` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/reports/agent` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/ai` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/billing` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/call` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/campaign` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/channel` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/csat` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/dashboards` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/reports/quality` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/queue` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/reports/sla` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `/settings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/settings/api-keys` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/audit` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | ✅ |
| `/settings/automations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/billing` | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | — | — |
| `/settings/canned-responses` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/compliance` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/settings/data-retention` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/disposition-codes` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/hours` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/integrations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A | N/A | N/A | N/A |
| `/settings/organization` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/roles` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/settings/security` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/sla` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A |
| `/settings/teams` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/users` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/settings/webhooks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A |
| `/supervisor` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/supervisor/agents` | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | — | — |
| `/supervisor/wallboard` | ❌ | ❌ | ❌ | ❌ | ❌ | — | — | — | — | — | — |
| `/tickets` | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| `/voice` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/dids` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/history` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/ivr` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/queues` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/recordings` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | ✅ |
| `/voice/regulatory` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A | N/A | N/A |
| `/voice/sip-settings` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A | N/A | N/A |
| `/voice/sip-trunks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/skills` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A | N/A | ✅ | N/A |
| `/voice/voicemail` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | N/A | N/A | ✅ | N/A |
| `/workforce` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/workforce/badges` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/workforce/evaluations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/workforce/schedules` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/workforce/surveys` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/workforce/time-off` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |

## L2 etkileşim boyutu detayı (makine-okur işaret kapsamı)

Hücreler: ✅ COVERED (ilgili `@ix-*` işaretli dedicated etkileşim testi var) · 🔎 UNVERIFIED (bileşen geçerli ama işaret yok) · N/A gerekçeli (`naInteraction` — yüzeyde bulunmuyor) · — geçerli değil (arketip beyan etmiyor).

| rota | tabs | search-filter | table-list | pagination-sort | empty-state | loading-state |
|---|---|---|---|---|---|---|
| `/` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/ai` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/ai/prompts` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/analytics` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/bot-builder` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/bot-builder/:id` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/campaigns` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/campaigns/outbound` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels/email` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels/sms` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels/social` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels/video` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels/webchat` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/channels/whatsapp` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/contacts` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/inbox` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/agent` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/ai` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/billing` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/call` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/campaign` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/channel` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/csat` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/dashboards` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/quality` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/queue` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/reports/sla` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings` | ✅ | N/A | N/A | N/A | N/A | N/A |
| `/settings/api-keys` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/audit` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/automations` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/billing` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/canned-responses` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/compliance` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/data-retention` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/disposition-codes` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/hours` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/integrations` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/notifications` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/organization` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/profile` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/roles` | — | N/A | ✅ | N/A | N/A | N/A |
| `/settings/security` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/sla` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/teams` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/templates` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/settings/users` | — | ✅ | ✅ | N/A | ✅ | N/A |
| `/settings/webhooks` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/supervisor` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/supervisor/agents` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/supervisor/wallboard` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/tickets` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/dids` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/history` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/ivr` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/queues` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/recordings` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/regulatory` | — | — | — | — | — | — |
| `/voice/sip-settings` | — | — | — | — | — | — |
| `/voice/sip-trunks` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/skills` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/voice/voicemail` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/workforce` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/workforce/badges` | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/workforce/evaluations` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/workforce/schedules` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/workforce/surveys` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |
| `/workforce/time-off` | — | 🔎 | 🔎 | 🔎 | 🔎 | 🔎 |

## Staging/rol/provider nedeniyle bloklu seviyeler

- **L3 (mutation/CRUD):** 46 rota yazma yüzeyine sahip → `STAGING_REQUIRED` (production read-only'de kanıtlanamaz). 25 rota yazma yüzeyi yok → `NO_WRITE_SURFACE`.
- **L4 (rol/permission/tenant):** 71 rota → `ROLE_ACCOUNTS_REQUIRED` (rol/tenant hesap altyapısı yok).
- **L5 (uçtan-uca provider):** 71 rota → `PROVIDER_HARNESS_REQUIRED` (SMS/çağrı/e-posta/WhatsApp test koşum-takımı yok).
