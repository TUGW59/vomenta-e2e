# DEV VOMENTA E2E — Keşif Notları ve Bağlayıcı Görev Sözleşmesi

> Bu dosya, `VOMENTA-DEV-TAM-YUZEY-KESFI-CLAUDE-PROMPT.md` ile verilen **salt-okunur
> yüzey keşfi** görevinin çalışma defteridir. Görev sözleşmesinin özeti, preflight
> bulguları, kararlar ve ilerleme burada tutulur. Her iddia rota/DOM/screenshot/
> trace/console/network kanıtına dayanmalıdır.

- **Oluşturulma:** 2026-08-07
- **Rol:** Kıdemli Test Otomasyon Mühendisi / Test Otomasyon Mimarı (salt-okunur audit)
- **Kaynak sözleşme:** `~/Downloads/VOMENTA-DEV-TAM-YUZEY-KESFI-CLAUDE-PROMPT.md`

---

## 0. DEĞİŞMEZ KURALLAR (özet)

- **Salt-okunur.** Hiçbir kalıcı veri değiştirilmez. `ALLOW_MUTATING_TESTS=false` korunur.
- Yasak: create / edit / delete / save / submit / invite / send / call / message /
  connect / disconnect / upload / import / generate / approve / reject / assign /
  start / stop / retry / bulk / rol-izin değişimi / elle POST-PUT-PATCH-DELETE.
- Mutation riski olan kontrol → **`not_exercised_mutation`** + neden yazılır.
- Gizlilik: e-posta, telefon, müşteri adı, token, API key, kimlik, özel URL param'ı
  ekran görüntülerinde ve raporda **maskelenir**. Secret/PII terminale veya rapora yazılmaz.
- Dürüst doğrulama: "sayfa mevcut" ≠ "işlevsel doğrulandı". Test listesi, sadece URL/
  başlık kontrolü, generic smoke, sessiz selector fallback, hata yutma **doğrulama sayılmaz**.
- Commit / push / PR / merge **yapılmaz**.

---

## 1. PREFLIGHT BULGULARI (2026-08-07)

### 1.1 ⚠️ Repo yolu tutarsızlığı (sözleşme vs gerçek)

- Sözleşmede belirtilen repo kökü `/Users/tugce.topuz/vomenta-e2e-main-2` **bu makinede
  YOK**.
- Gerçek repo: **`/Users/tugce.topuz/vomenta-e2e-fix-auth`** (ayrıca
  `/Users/tugce.topuz/vomenta-e2e-archive` mevcut).
- Bu görev, `vomenta-e2e-fix-auth` reposunun git worktree'sinde yürütülüyor:
  `.claude/worktrees/vomenta-dev-surface-discovery-8d0103`.
- **Karar:** Gerçek repo (`vomenta-e2e-fix-auth`) kaynak kabul edildi; kullanıcıya
  bu fark açıkça bildirildi.

### 1.2 Ortam / sürüm taban çizgisi

| Alan | Değer |
|---|---|
| Repo | `/Users/tugce.topuz/vomenta-e2e-fix-auth` |
| Worktree | `.claude/worktrees/vomenta-dev-surface-discovery-8d0103` |
| Branch | `claude/vomenta-dev-surface-discovery-8d0103` |
| HEAD | `c125416533c9bbdf83de9f799a84734058a6e389` |
| origin/main | `c125416…` (worktree HEAD == origin/main; temiz çalışma ağacı) |
| Node | v24.18.0 |
| npm | 11.16.0 |
| Playwright | 1.62.0 |
| Hedef base URL (dev) | `https://app.dev.vomenta.com` |
| Dev API host | `api.dev.vomenta.com` |
| Başlangıç rotası | `https://app.dev.vomenta.com/settings/audit` |

> Not: Ana repo kökünde takip edilmeyen `_inspect_tmp.mjs` dosyası var (benim
> oluşturmadığım artık); worktree temiz. Bu dosyaya dokunulmayacak.

### 1.3 Mevcut test/keşif altyapısı (ikinci paralel sistem KURULMAYACAK)

Repo olgun bir "kalite platformu" içeriyor. İlgili parçalar:

- **Discovery crawler:** `tests/discovery/` → `crawler.js`, `observer.js`, `probes.js`,
  `reporters.js`, `safety.js`, `baseline.js`, `discovery.spec.js`
  (proje: `chromium-discovery`; script: `npm run test:discovery`).
- **Yüzey envanteri / manifest:** `tools/generate-surface-inventory.mjs`,
  `generate-readonly-manifest.mjs`, `generate-surface-depth.mjs`,
  `surface-*-lib.mjs`, `readonly-manifest-lib.mjs`.
- **Audit orkestrasyonu:** `tools/run-audit.mjs`, `audit-orchestrator-lib.mjs`,
  `audit-shard-*.mjs`, `merge-audit-shards.mjs`.
- **Raporlama:** `generate-coverage.mjs`, `generate-executive-report.mjs`,
  `generate-findings.mjs`, `generate-runtime-report.mjs`, forensic/evidence araçları.
- **Kanonik ürün yüzeyi:** `tests/contracts/product-surfaces.js` (ürün varlığı),
  `tested-pages.js` (kapsam sözleşmeleri).
- **Kaydedilmiş yüzey durumu:** `docs/SURFACE-INVENTORY.md` — **87 kayıtlı yüzey**,
  56 kapsam sözleşmeli, 27 NO_COVERAGE_CONTRACT, 4 BLOCKED, 2 dynamic.
- **Auth:** `tests/auth.setup.js` + `config/environment.js` (storage-state, rol bazlı;
  `.env.dev` ile TEST_ENV=dev). Kimlik `.env`/`.env.dev`'den; gateway retry mevcut.
- **Dev IA gözlemi:** `docs/dev-navigation-observed.md` (2026-08-07) — sidebar 5
  bölüme ayrılmış (Overview/Channels/Engagement/Operations/Admin); IA redesign **devam
  ediyor**, snapshot dondurulmuş değil.

### 1.4 Dev sidebar IA (mevcut gözlem — doğrulanacak)

| Bölüm | Öğe | Rota |
|---|---|---|
| Overview | Dashboard / Inbox | `/` · `/inbox` |
| Channels | Voice / Channels / AI | `/voice` · `/channels` · `/ai` (grup) |
| Engagement | Campaigns / Bot Builder / Contacts / Tickets | `/campaigns` · `/bot-builder` · `/contacts` · `/tickets` |
| Operations | Analytics / Reports / Supervisor / Monitoring / Workforce | `/analytics` · `/reports` · `/supervisor/coaching` · `/monitoring` · `/workforce` |
| Admin | Users & Teams / Settings | `/settings/users` · `/settings` (grup) |

**Bilinen delta'lar:** YENİ `/monitoring` alanı (`/live`, `/agents`, `/ai-summary`);
Supervisor üst-link `/supervisor` → `/supervisor/coaching`; yeni "Admin" bölümü;
nav-bölüm gruplama katmanı registry'de yok.

---

## 2. METODOLOJİ / ÇALIŞMA PLANI

1. **Preflight (bu bölüm)** — repo/ortam sabitlendi, mevcut altyapı haritalandı. ✅
2. **Auth & erişim doğrulama** — girişli tarayıcıyla `/settings/audit` gerçekten açılıyor mu?
   Son URL, redirect zinciri, rol/workspace, console/network hataları kaydedilir.
3. **Yüzey keşfi (BFS, visited-set)** — sidebar/topbar/settings/breadcrumb/DOM href +
   client-route geçişleri. Dinamik rotalar canonical pattern (`/contacts/:id`).
   Her nav öğesi bir sonuca bağlanır (keşfedildi / same-page / external / role-blocked /
   feature-disabled / mutating / broken / bilinmiyor).
4. **Sayfa başına derin inceleme** — kimlik, görünür içerik, tüm etkileşimli kontroller
   (sınıf: `safely_exercised` / `observed_only` / `not_exercised_mutation` / `blocked` /
   `missing_or_broken`), filtreler, tablolar, formlar, modal/drawer, a11y riskleri,
   console/network. Güvenli durumlar çalıştırılır; mutation'lar sadece gözlemlenir.
5. **Kanıt** — mevcut artifact isimlendirmesiyle uyumlu; her sayfa için maskeli full-page
   screenshot + benzersiz durum görüntüleri + `page.json` + `notes.md` + console/network özeti.
6. **Kapsam karşılaştırması** — dev yüzeyi ↔ mevcut Page Object / spec / registry;
   coverage state: `verified` / `covered-unverified` / `partial` / `blocked` / `missing` /
   `excluded`; drift türleri (`stale_test`, `new_uncovered_surface`, `selector_drift`,
   `route_drift`, `content_drift`, `table_or_filter_drift`, `access_drift`, `behavior_drift`,
   `false_green_candidate`).
7. **Kör nokta avı** — false-green, yanlış locator, fallback maskeleme, sadece-listeleme,
   doğrulanmayan filtre/tablo/modal, yutulan console/network, flaky retry, role-gated körlük.
8. **Test uyarlama planı (P0/P1/P2)** — sadece kanıtla. Keşif bitmeden toplu test kodu
   değişikliği YOK.

**Kanıt kök dizini (planlanan):** mevcut `artifacts/`/`reports/` standardına uyulacak;
uygun standart yoksa `artifacts/dev-surface-audit/<RUN_ID>/` sözleşme şablonu kullanılacak.

---

## 3. İLERLEME GÜNLÜĞÜ

| Tarih | Adım | Durum | Not |
|---|---|---|---|
| 2026-08-07 | Preflight repo/ortam | ✅ | Repo yolu tutarsızlığı raporlandı (main-2 yok) |
| 2026-08-07 | Mevcut altyapı haritası | ✅ | Discovery/audit/manifest sistemi mevcut |
| 2026-08-07 | Notlar dosyası oluşturuldu | ✅ | Bu dosya |
| 2026-08-07 | `/settings/audit` auth doğrulama | ✅ | Girişli Chrome (Test User, tr-TR) ile fonksiyonel açıldı |
| 2026-08-07 | Rota + topbar envanteri | ✅ | 16 sidebar rota + 6 topbar kontrol + 1 external (workspace) |
| 2026-08-07 | Artifact scaffold + run metadata | ✅ | `artifacts/dev-surface-audit/dev-surface-20260807-140629/` |
| 2026-08-07 | `/settings/audit` page packet | ✅ | `pages/01-settings-audit/page.json` |
| 2026-08-07 | Dev creds wired (`.env.dev`) | ✅ | Kullanıcının `e.env/vomenta.txt` dev bloğundan, şifre yazdırılmadan |
| 2026-08-07 | Playwright discovery crawler (dev) | ✅ | 60 rota, 0 sert ihlal; `crawler-discovery-report.dev.{json,md}` |
| 2026-08-07 | Route graph + baseline drift | ✅ | `02-route-graph.md` (+15 yeni, −1 kaldırılan, /settings ARIA) |
| 2026-08-07 | Env origin doğrulaması | ✅ | Crawl DEV'de koştu (API=api.dev); F-007 latent env-bug, F-008 asset-origin |

### 1.7 Crawler sonuçları (dev, doğrulanmış)

- **60 dev rotası** gezildi, **0 sert güvenlik/yükleme ihlali**. Rapor:
  `artifacts/dev-surface-audit/dev-surface-20260807-140629/crawler-discovery-report.dev.{json,md}`.
- **Baseline drift (2026-07-30 → bugün):** +15 yeni rota (channels/voice/workforce alt-rotaları),
  −1 kaldırılan (`/campaigns/outbound`), `/settings` ARIA değişimi (sekme IA).
- **Ortam doğrulaması:** crawl gerçekten **dev**'de koştu (`environment.name=dev`,
  `baseURL=app.dev.vomenta.com`, canlı API=`api.dev.vomenta.com`). Erken "prod'a koştu"
  şüphesi kanıtla çürütüldü: asset/prefetch origin'i `app.vomenta.com` olsa da sayfa+API dev.
- **İki gerçek infra bulgusu:**
  - **F-007 (P0, latent):** base `.env`'in `BASE_URL=app.vomenta.com` değeri, yükleme sırası
    değişirse `TEST_ENV=dev` koşumunu sessizce PROD'a düşürebilir (repro edildi). Bu koşumda
    tetiklenmedi ama guard eklenmeli.
  - **F-008 (P2):** dev app statik asset + RSC prefetch origin'i prod (`app.vomenta.com`);
    crawler'ın "err" saydığı `ERR_ABORTED`'lar benign prefetch abort'ları (test sinyali gürültüsü).

### 1.8 Bulgu özeti (şu ana kadar, kanıtlı)

| # | Rota | Bulgu | Tür | Öncelik |
|---|---|---|---|---|
| F-001 | `/channels/email` | Ham i18n anahtarı `channels.emailPage.defaultSignatureText` render | content bug | P1 |
| F-002 | `/settings` | 6-sekmeli IA'ya yeniden yapılandırma (ARIA drift doğrulandı) | route_drift | P1 |
| F-003 | `/settings` | Sekme durumu URL'de değil (deep-link yok) | testability | P2 |
| F-004 | `/settings/audit` + tümü | Birçok `/settings/*` rota var, sekme/sidebar'da görünmüyor | nav gap | P1 |
| F-005 | `/settings` Modüller | Açıklama tekrarı + "Yönet Modüller" bozuk Türkçe | content/i18n | P2 |
| F-006 | `/settings/audit` | Satır aksiyonları aynı ad "Görüntüle" → selector riski | a11y/selector | P2 |
| F-007 | test-infra | `.env` BASE_URL prod'a düşürebilir (latent) | false_green | P0 |
| F-008 | dev app | Asset/prefetch origin prod; err'ler benign | dev-config/noise | P2 |
| ~~F-009~~ | `/campaigns/outbound` | **DÜZELTİLDİ: kaldırılMAMIŞ, canlı** (crawler false-removed) → bkz F-023 | — | — |
| F-010 | `/settings/users` | E-posta kolonu tüm satırlarda boş | data/render | P1 |
| F-011 | `/settings/roles` | Ürün 6 rol, repo 3 rol biliyor (MANAGER/OWNER/VIEWER yok) | access_drift | P1 |
| F-012 | `/settings/teams/:id` | Dinamik rota + tab-state tutarsızlığı (query vs yok) | new_surface/testability | P2 |
| F-013 | `/settings/profile` | İç sekmeler `/settings/security`+`/settings/notifications`'ı dupluyor | surface-dup | P2 |
| F-014 | `/settings/*` | Yüzey örtüşmesi: compliance/automations-SLA/templates-canned çoklu giriş | IA/canonical | P2 |
| F-015 | `/channels` | Hub kalıcı loading skeleton — kartlar render olmuyor | false_green/broken | P1 |
| F-016 | `/voice`≡`/voice/dids` | Aynı sayfa (Voice ayrı hub değil) | route alias | P2 |
| F-017 | `/voice/queues` | `/settings/teams`'e redirect (queues=teams) | route_drift | P1 |
| F-018 | `/voice/regulatory` | TAMAMEN BOZUK: ham i18n + React #418/#422 + intl err; crawler-missed | broken/new-surface | P1 |
| F-019 | global | intl FORMATTING_ERROR "queueName" (çağrı-transfer i18n) | console error | P2 |
| F-020 | `/channels/social`,`/sms` | WhatsApp içerik sızması; SMPP bind failed (veri) | content/observed | P2 |

| F-021 | `/reports` hub | Queue Reports kartı ham i18n (`reports.queueReports*`) | content/i18n | P2 |

| F-022 | `/contacts/segments` | Çevrilmemiş İngilizce (breadcrumb TR, içerik EN) | content/i18n | P2 |
| F-023 | crawler | `removedRoutes` maxPages truncation'da false-positive (F-009'u tetikledi) | test-infra | P1 |

| F-024 | `/` | Ham i18n `dashboard.setupStepQueue` + setup %100/banner çelişkisi | content/i18n | P2 |
| F-025 | `/ai` | "Yapay ZekaTemsilciler" boşluk eksik | content | P3 |
| F-026 | `/monitoring/agents` | Ham i18n `supervisor.voice.offline` (Durum) | content/i18n | P2 |
| F-027 | crawler | 30+ erişilebilir yüzey keşfedilmedi (maxPages+registry) | discovery-gap | P1 |

| F-028 | `/contacts/:id` | Ham i18n `contacts.delete` + "Activity" sekmesi EN | content/i18n | P2 |

### 1.14 Dinamik detay rotaları — DOĞRULANDI
- `/contacts/:id`, `/tickets/:id`, `/bot-builder/:id`, `/settings/teams/:id` — hepsi canlı açıldı,
  canonical pattern kuruldu, healthy (F-028 hariç). Hepsi crawler'ın 60'ında yok (F-027). Test için fixture :id gerekir.

### 1.13 Paket 5 (Overview + Ops) — TAMAMLANDI (hızlı sağlık taraması)
- **Sağlıklı:** dashboard, inbox, ai, monitoring/{live,agents,ai-summary}, supervisor/{coaching,ai-rate-suggestions},
  workforce(+schedules). Detay: `artifacts/.../packet-05-overview-ops.md`.
- **F-024/025/026** i18n/çelişki; **F-027** crawler 30+ yüzey kaçırdı.
- **Sistemik i18n ailesi:** F-001/F-018/F-021/F-022/F-024/F-026 — uygulama genelinde eksik i18n → global guard önerisi.

### 1.12 Paket 4 (Engagement) — TAMAMLANDI
- **Hub'lar (5):** campaigns, campaigns/outbound (CANLI), bot-builder (6 bot), contacts, tickets.
- **Crawler-missed alt-rotalar (9+):** contacts/{groups,companies,segments,custom-fields,import,new},
  campaigns/{outbound,templates,sender-ids,dnc}. Dinamik: contacts/:id, tickets/:id, bot-builder/:id, campaigns/:id.
- **F-009 ÇÜRÜTÜLDÜ** → F-023 (crawler false-removed). **F-022** segments i18n.
- Detay: `artifacts/.../packet-04-engagement.md`. Tüm mutation'lar not_exercised.

### 1.11 Paket 3 (Reports + Analytics) — TAMAMLANDI (13/13)
- **Sağlıklı:** analytics + 11 report detail (ortak şablon: tarih/gruplama/filtre/Bar-Line-Area/
  Export/Zamanla/AI + KPI + grafik) + hub. Gerçek veri, iyi empty-state (csat/billing/campaign/channel).
- **F-021:** hub Queue kartı ham i18n. `/reports/dashboards` aslında "Panolar" (farklı sayfa tipi).
- **Kör nokta:** 11 sayfa ortak şablon → sadece başlık assert eden test F-015 tarzı skeleton/empty'yi
  kaçırır (false-green). Detay: `artifacts/.../packet-03-reports-analytics.md`.

### 1.10 Paket 2 (Channels + Voice) — TAMAMLANDI
- **Channels (7):** email(F-001), webchat, sms, whatsapp, social(F-020), video → **hub `/channels` BOZUK (F-015)**.
- **Voice:** `/voice`≡`/voice/dids` (F-016); `/voice/queues`→teams (F-017); `/voice/history`≈`/voice/recordings`;
  `/voice/voicemail` empty; **`/voice/regulatory` TAMAMEN BOZUK + crawler-missed (F-018)**.
- **Route konsolidasyon:** crawler'ın 13 rotası ~11 benzersiz yüzeye iniyor + 1 crawler-missed (regulatory).
- Detay + kanıt: `artifacts/.../packet-02-channels-voice.md`. Tüm mutation'lar not_exercised.

### 1.9 Paket 1 (Settings) — TAMAMLANDI (20/20 canlı doğrulandı)
- **Live-verified (20/20):** audit, settings(+Modüller sekmesi), users, roles, teams, api-keys,
  webhooks, integrations, security, organization, profile, notifications, automations,
  canned-responses, compliance, data-retention, disposition-codes, hours, sla, templates.
  Detay + kanıt tablosu: `artifacts/.../packet-01-settings.md`. 0 broken sayfa.
- **Yeni dinamik rota:** `/settings/teams/:id` (crawler'ın 60'ında yok) → new_uncovered_surface.
- **Empty state kanıtı:** api-keys, webhooks, canned-responses, sla, templates.
- **Zengin veri:** roles(6), teams(9), users(9+), automations(5 kural), disposition-codes(10).
- Tüm mutation kontrolleri `not_exercised_mutation`.

### 1.5 Auth / tarayıcı bulguları

- **In-app Browser (mcp__Claude_Browser__) girişli DEĞİL:** `/settings/audit` login
  duvarına (`https://app.dev.vomenta.com`, "Welcome back") yönlendi. Asistan kimlik
  bilgisi GİRMEDİ (yasak).
- **Kullanıcının gerçek Chrome'u (Claude in Chrome / Browser 1) girişli:** `/settings/audit`
  redirect olmadan açıldı; oturum **Test User**, dil **Türkçe (tr-TR)**, viewport 1440×812.
- Bağlantı ilk denemede 1 kez düştü (deviceId 81b8… disconnect); kalan tek cihaz
  (7d7ab0c2…) seçilip bağlanıldı. Kullanıcı Browser 1'i seçti.
- ⚠️ **Kanıt kısıtı:** Chrome extension `save_to_disk` ekran görüntüsünü repo dosya
  sistemine yazmıyor (extension deposuna gidiyor). Screenshot kanıtları şu an konuşma
  akışında (inline) mevcut; repo `pages/*/*.png` dosyaları için ayrı bir yakalama
  yöntemi gerekiyor (Playwright authed context veya extension export). Bu, sözleşmenin
  "her sayfa için diskte maskeli screenshot" maddesi için açık bir kısıttır.
- `vomenta-e2e-main-2` = aynı proje; `/private/tmp/...` altındaki eski worktree yolları
  bunu doğruluyor (proje yerelde `vomenta-e2e-fix-auth` adıyla mevcut).

---

### 1.6 🔴 BLOCKER — Playwright crawler kimlik doğrulaması

- `.env.dev`, `.env.dev.example` ile **birebir aynı** (placeholder); `VOMENTA_EMAIL`
  ve `VOMENTA_PASSWORD` **BOŞ**. Repoda gerçek dev kimlik bilgisi yok.
- `TEST_ENV=dev npm run test:discovery` bu yüzden auth.setup'ta düştü:
  *"Kimlik doğrulama ön-koşulu eksik: VOMENTA_EMAIL ve VOMENTA_PASSWORD tanımlı değil"*
  (`tests/auth.setup.js:29` → `config/environment.js:158`). Exit fail; discovery raporu üretilmedi.
- Asistan kimlik bilgisi giremez/veremez (yasak). **Çözüm (kullanıcı yapmalı):**
  `/Users/tugce.topuz/vomenta-e2e-fix-auth/.env.dev` içine gerçek dev
  `VOMENTA_EMAIL` / `VOMENTA_PASSWORD` yazılmalı (dosya gitignored; asistan değerleri
  görmez). Sonra crawler yeniden çalıştırılıp disk kanıtı + trace üretilecek.
- **Bu arada:** kullanıcının girişli gerçek Chrome oturumu (Test User) tam çalışıyor;
  canlı keşif buradan sürüyor (inline screenshot kanıtı ile).

## 4. AÇIK BLOCKER / SINIRLAR

- 🔴 `.env.dev` boş kimlik → Playwright crawler login olamıyor (bkz. 1.6). Disk
  screenshot/trace kanıtı bu düzeltilene kadar üretilemez.

- Sözleşmedeki `vomenta-e2e-main-2` yolu yok → gerçek repo `vomenta-e2e-fix-auth` kullanıldı.
- Rol matrisi: yalnız mevcut oturum rolü ile görülen yüzey tüm ürün kapsamı sayılmayacak;
  hazır read-only rol hesabı yoksa eksiklik blocker olarak kaydedilecek.
- Mutation/staging gerektiren davranışlar salt-okunur kapsamla "kapatıldı" gösterilmeyecek.
