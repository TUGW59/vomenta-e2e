# ADR-0032 — Dev yüzey keşfi ve test kapsam adaptasyonu

- **Durum:** Kabul edildi (kayıt/karar) — 2026-08-08
- **Bağlam koşumu:** salt-okunur canlı keşif, `https://app.dev.vomenta.com`, girişli "Test User",
  tr-TR, 1440–1512px. Discovery crawler `TEST_ENV=dev` (2 kez `environment.name=dev` doğrulandı).
- **İlgili:** ADR-0025 (pr-impact), ADR-0026 (evidence), ADR-0027 (sharded readonly audit),
  ADR-0030 (RBAC capability), `tests/contracts/known-bugs.js`, `tests/contracts/product-surfaces.js`.

> **Kanıt notu:** Bu ADR, tek seferlik manuel bir keşif koşumunun **kalıcı** özetidir. Ham/efemeral
> çıktılar (crawler JSON, koşum logu, ekran görüntüleri, `page.json` anlık görüntüleri) bilinçli olarak
> repoya **alınmadı** — bunlar `test-results/` sınıfı efemeral artefaktlardır (gitignored). Kanıtlar
> canlı Chrome oturumunda maskeli inline screenshot olarak üretildi; aşağıdaki bulgular rota/DOM/
> console kanıtına dayanır. Hiçbir kalıcı veri değiştirilmedi; tüm mutation kontrolleri `not_exercised`.

---

## 1. Karar

Dev'in yeni bilgi mimarisi (IA), mevcut Playwright suite'inin varsaydığı prod IA'sından
**anlamlı biçimde saptı**. En kritik sapma **Supervisor → Monitoring migrasyonu**dur ve mevcut
supervisor spec'lerini **false-green riskine** sokar. Bu ADR:
1. Dev'de gözlemlenen yüzey haritasını ve sapmaları **kanıtla** kaydeder,
2. Mevcut `known-bugs.js` ile **dürüst uzlaştırma** yaparak neyin zaten bilindiğini ayırır,
3. Bir **P0/P1/P2 test-adaptasyon planı** ve bir **mimari düzeltme** (POM'larda final-URL guard'ı)
   önerir.

Bu ADR **kod/test değiştirmez**; adaptasyon ayrı PR'larda uygulanacaktır.

## 2. Dev yüzey haritası (kanıtlı)

- **Discovery crawler:** 60 rota, 0 sert güvenlik/yükleme ihlali (`TEST_ENV=dev`).
- **Canlı doğrulanan:** ~70 yüzey (Settings 20 · Channels 7 · Voice 6 · Reports/Analytics 13 ·
  Engagement: campaigns/bot-builder/contacts+5 alt/tickets · Overview/Ops 11 · 4 dinamik detay).
- **Sidebar IA:** 5 bölüm — Overview (`/`,`/inbox`) · Channels (`/voice`,`/channels`,`/ai`) ·
  Engagement (`/campaigns`,`/bot-builder`,`/contacts`,`/tickets`) · Operations
  (`/analytics`,`/reports`,`/supervisor/coaching`,`/monitoring`,`/workforce`) ·
  Admin (`/settings/users`,`/settings`).

### Crawler'ın kaçırdığı yüzeyler (registry + maxPages=60 nedeniyle)
`/monitoring/{live,agents,ai-summary}` (tüm alan) · `/ai/*` (~8: agents/chatbot/copilot/sentiment/
knowledge-base/prompts/usage/providers) · `/contacts/{groups,companies,segments,custom-fields,import,new}` ·
`/campaigns/{outbound,templates,sender-ids,dnc}` · `/supervisor/ai-rate-suggestions` ·
dinamik `/contacts/:id`,`/tickets/:id`,`/bot-builder/:id`,`/settings/teams/:id` · `/setup` ·
bozuk `/voice/regulatory`. → **30+ erişilebilir yüzey** crawler'ın 60'ında yok.

## 3. Bulgular — YENİ (registry'de yok) vs DOĞRULAMA (zaten known-bugs)

### Gerçekten yeni / asıl katma değer
| # | Alan | Bulgu | Sınıf | Öncelik |
|---|---|---|---|---|
| F-029 | Supervisor→Monitoring | `/supervisor/{agents,wallboard,interactions,calls}` dev'de `/monitoring/*`'a redirect; POM'lar `/supervisor/*` path'inde, **final-URL assert etmiyor** → false-green + coverage yok | route_drift + false_green + gap | **P0/P1** |
| F-007 | test-infra | base `.env`'in `BASE_URL=app.vomenta.com` değeri, yükleme sırası değişirse `TEST_ENV=dev` koşumunu **sessizce PROD'a** düşürür (repro) | false_green / wrong-env | **P0** |
| F-017 | `/voice/queues` | `/settings/teams`'e redirect → `voice-queues` spec false-green riski | route_drift | P1 |
| F-023 | discovery crawler | `removedRoutes` maxPages truncation'da **false-positive** (`/campaigns/outbound` canlı; başta "stale" sandım, kanıtla çürüttüm) | test-infra | P1 |
| F-027 | discovery crawler | 30+ erişilebilir yüzey keşfedilmedi (maxPages + registry) → "tam keşif" iddiası geçersiz | discovery-completeness | P1 |
| F-002/004/012 | `/settings` | 6-sekmeli IA'ya yeniden yapı; `/settings/teams/:id` dinamik (kapsamsız); sekme-state URL'de değil | route_drift/testability | P1 |
| F-010 | `/settings/users` | E-posta kolonu tüm satırlarda boş (registry'de yok — bug mu PII-gizleme mi netleşmeli) | data/render | P1 |
| F-011 | `/settings/roles` | Ürün 6 rol (ADMIN/AGENT/MANAGER/OWNER/SUPERVISOR/VIEWER); repo 3 rol biliyor; MANAGER/OWNER/VIEWER için read-only hesap yok | access_drift (blocked) | P1 |

**Coverage ❌ (dedicated spec yok):** `/settings/teams/:id`, `/tickets/:id`,
`/contacts/{groups,companies,custom-fields}`, `/campaigns/{templates,sender-ids,dnc}` (registry PR-only),
`/monitoring/{live,agents,ai-summary}`, `/supervisor/ai-rate-suggestions`, `/setup`.

### Doğrulama — mevcut `known-bugs.js`(55) ile örtüşen (yeni DEĞİL)
Canlı gözlemlenen i18n/içerik hatalarının çoğu zaten kayıtlı; bunları **tekrar-üretim** sayıyorum:
`/channels/email` ham imza anahtarı = B9/B17 · `/settings` "Manage Modules"→/ + dup desc = B4/B7 ·
`/voice/regulatory` tamamen bozuk (ham i18n + React #418/#422) = B1/B10/VOICE-REGULATORY-BROKEN ·
`/reports` ham anahtar/intl error ≈ REPORTS-AIKEY/REPORTS-INTL · dashboard ClickHouse/i18n ≈ DASH-* ·
`/ai` "ZekaTemsilciler" boşluk = B13 · `/contacts` `contacts.delete`/`callContact` ham anahtar =
CONTACTS-F2/F1 · channels social/sms/whatsapp console errors = B16/B18/B19.

**Sistemik gözlem:** ham i18n-anahtar render'ı uygulama geneline yayılmış (yeni varyantlar da
gözlendi: `reports.queueReports`, `dashboard.setupStepQueue`, `supervisor.voice.offline`,
`/contacts/segments` tamamen EN). → global "görünür metin i18n-anahtar-benzeri olmamalı" guard önerilir.

## 4. F-029 mimari analizi (kök neden)

- **Kanıt:** client-side navigasyonda `/supervisor/agents`,`/supervisor/wallboard`,`/supervisor/interactions`
  breadcrumb "İzleme" ile `/monitoring/*`'a gidiyor (URL `/supervisor/*`'ta kalmıyor).
- **Kök neden mimari, spesifik değil:** `tests/pages/BasePage.js` `open()` yalnız `goto(path)` +
  `shell.expectReady()` yapar; **hiçbir POM final URL'i assert etmez**. `AgentMonitorPage.open()` yalnız
  `H1 == "Agent Monitor"` kontrol eder. Hedef `/monitoring/agents` **aynı bileşeni** render ettiğinden,
  redirect sonrası tüm yapısal/i18n assertion'ları **geçer** → false-green.
- **Sonuç:** 4 supervisor spec'i kanonik olmayan bir rotaya gidip yeşil kalabilir; `/monitoring/*` gerçek
  yeni ev ise **sıfır dedicated kapsama** sahip. `/supervisor/wallboard`'ın 5 known-bug'ı + AGENTS-TZ
  artık `/monitoring` sayfalarında.
- **Sınıflandırılamayan:** hard `page.goto('/supervisor/agents')` davranışı (redirect-render mi, hata/flake mi)
  extension'la güvenilir ölçülemedi (tab error-state'e girdi; `/` de aynı hatayı verdi → araç artefaktı).
  Yer-doğrusu için **gerçek Playwright koşusu** gerekir.

## 5. Adaptasyon planı (P0/P1/P2 — uygulanacak, bu ADR'de DEĞİL)

**P0**
- Env-precedence guard (F-007): ortamı `TEST_ENV` registry'sinden türet; `BASE_URL` override'ını yalnız
  gerçek shell/CI'dan al; `name=dev` iken host `app.vomenta.com` ise erken hata fırlat.
- Supervisor→Monitoring (F-029): `supervisor-{agents,agent-live,interactions,wallboard}` POM/spec'lerini
  `/monitoring/*` kanonik rotalarına taşı; `open()`'a `await expect(page).toHaveURL(<canonical>)` ekle.
- Channels hub skeleton (F-015): `channels-hub.authed`'ın skeleton'ın ÇÖZÜLDÜĞÜNÜ assert ettiğini doğrula.

**P1**
- Yeni read-only spec'ler: `/monitoring/{live,agents,ai-summary}`, `/supervisor/ai-rate-suggestions`,
  `/tickets/:id`, `/contacts/{groups,companies,custom-fields}`, `/settings/teams/:id`.
- `/voice/queues` (F-017): redirect'i kabul et ya da spec'i deprecate; final-URL assert.
- Settings 6-sekme IA assertion (F-002); `/settings/users` e-posta hücresi netleştir (F-010).
- Rol matrisi (F-011): MANAGER/OWNER/VIEWER read-only hesapları sağlanana kadar **blocked**.
- Discovery crawler (F-023/F-027): `removedRoutes`'u yalnız kuyruk boşalınca üret; maxPages artır;
  sidebar grup genişletme + dinamik `:id` + eksik alt-rotaları registry'ye ekle.

**P2**
- Global i18n ham-anahtar guard'ı (yeni varyantları known-bugs'a ekle/guard'a bağla).
- Yüzey örtüşmesi konsolidasyonu (F-013/F-014: compliance↔data-retention+audit;
  profile-alt-sekme↔security/notifications; automations-SLA↔/settings/sla; templates↔canned-responses).
- `product-surfaces.js:238` notu güncelle: `/campaigns/{templates,sender-ids,dnc}` canlı MEVCUT
  (artık "PR-only/unverified" değil).

**Genel kabul kriterleri:** her yeni/uyarlanan spec **final URL** assert eder (redirect'i yakalar);
read-only; mutation'lar `@mutation` + `ALLOW_MUTATING_TESTS` guard'lı kalır; tekrar eden erişilebilir
adlarda (ör. audit "Görüntüle" ×8) satır-kapsamlı selector.

## 6. Sonuçlar

- **Olumlu:** dev IA sapması kanıtla belgelendi; false-green kaynağı (POM'larda URL-assert yokluğu)
  mimari düzeyde tespit edildi; adaptasyon planı önceliklendirildi; known-bugs ile dürüst uzlaştırma
  yapıldı (mükerrer "keşif" iddiası yok).
- **Olumsuz/borç:** rol-bazlı yüzey farkı (F-011) hesap yokluğu nedeniyle çıkarılamadı (blocked);
  hard-load redirect davranışı (F-029) gerçek Playwright koşusuyla teyit bekliyor; ham evidence
  repoda tutulmadı (kalıcı özet bu ADR'dedir).

## 7. Güvenlik / yöntem uyumu

Uygulamada hiçbir kalıcı veri değiştirilmedi · `ALLOW_MUTATING_TESTS=false` · tüm mutation kontrolleri
`not_exercised` · secret/şifre repoya girmedi (dev creds gitignored `.env.dev`'de) · PII maskeli ·
keşif salt-okunur (non-GET browser route katmanında bloklandı).
