# Dev route graph — crawler-derived (RUN dev-surface-20260807-140629)

- **Kaynak:** `tests/discovery` crawler, `TEST_ENV=dev` → baseURL `https://app.dev.vomenta.com`
  (runtime'da iki kez doğrulandı: `environment.name=dev`, `baseURL=app.dev.vomenta.com`).
- **Ziyaret:** 60 rota · **Sert ihlal:** 0 · **maxPages:** 60 (6 kuyrukta kaldı).
- **Auth:** dev test hesabı (<dev-test-account>), Playwright auth.setup (login 6.1s).
- Non-GET istekleri browser route katmanında bloklandı (salt-okunur).

## Bölüm bazında 60 rota

**Overview:** `/` · `/inbox`
**Voice:** `/voice` · `/voice/dids` · `/voice/history` · `/voice/queues` · `/voice/recordings` · `/voice/voicemail`
**Channels:** `/channels` · `/channels/email` · `/channels/sms` · `/channels/social` · `/channels/video` · `/channels/webchat` · `/channels/whatsapp`
**AI:** `/ai`
**Engagement:** `/campaigns` · `/bot-builder` · `/contacts` · `/tickets`
**Analytics:** `/analytics`
**Reports:** `/reports` · `/reports/agent` · `/reports/ai` · `/reports/billing` · `/reports/call` · `/reports/campaign` · `/reports/channel` · `/reports/csat` · `/reports/dashboards` · `/reports/quality` · `/reports/queue` · `/reports/sla`
**Supervisor:** `/supervisor`  *(sidebar linki `/supervisor/coaching`'e gidiyor — üst-link ≠ crawler landing)*
**Workforce:** `/workforce` · `/workforce/badges` · `/workforce/evaluations` · `/workforce/schedules` · `/workforce/surveys` · `/workforce/time-off`
**Settings (22):** `/settings` · `/settings/api-keys` · `/settings/audit` · `/settings/automations` · `/settings/canned-responses` · `/settings/compliance` · `/settings/data-retention` · `/settings/disposition-codes` · `/settings/hours` · `/settings/integrations` · `/settings/notifications` · `/settings/organization` · `/settings/profile` · `/settings/roles` · `/settings/security` · `/settings/sla` · `/settings/teams` · `/settings/templates` · `/settings/users` · `/settings/webhooks`

> NOT: `/settings/*` rotaları DOĞRUDAN erişilebilir (crawler hepsini gezdi), ANCAK
> `/settings` UI'ı yalnızca 6 sekme gösteriyor (Organizasyon/Kullanıcılar/Faturalandırma/
> Güvenlik/API Anahtarları/Modüller). Yani birçok `/settings/*` rota var ama sidebar/tab
> navigasyonundan görünmüyor → **keşfedilebilirlik boşluğu** (bkz. live-findings F-004).

## Baseline drift (baseline 2026-07-30 → 2026-08-07)

**+15 yeni rota:** `/channels/{email,social,video,webchat,whatsapp}`,
`/voice/{dids,history,queues,recordings,voicemail}`,
`/workforce/{badges,evaluations,schedules,surveys,time-off}`
→ hepsi **`new_uncovered_surface`** adayı (dedicated kapsam doğrulanmalı).

**−1 kaldırılan rota:** `/campaigns/outbound` (registry/testte var, dev'de yok)
→ **`stale_test`** adayı: `campaigns-outbound.authed.spec.js` + `.mutation` spec'leri.

**ARIA değişimi:** `/settings` (hash before≠after) → sekme-tabanlı IA (bkz. F-002).

**API endpoint envanteri değişimi:** yok (networkChanged: []).
