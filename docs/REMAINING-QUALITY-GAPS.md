# Remaining Quality Gaps

> **Elle yazılır — otomatik ÜRETİLMEZ.** (Generated raporlar: `docs/PROJECT-STATUS.md`,
> `docs/raporlar/*`.) Bu dosya, denetimle KANITLANMIŞ kalan açıkları ve dış bağımlılıkları
> tek yerde tutar. Bir açık kapandığında bu dosyadan da düş.

## Baseline

- **main SHA:** `eda4a28` (audit sırasında `HEAD == origin/main`, çalışma ağacı temiz)
- **Audit tarihi:** 2026-08-09
- **Ortam:** `production-read-only` (`https://app.vomenta.com`). Yerelde `.env` YOK →
  authed/rol/mutation runtime bu makinede ÜRETİLEMEZ (yalnız CI'da secret'larla).
- **Doğrulama ile teyit edilenler (varsayım değil):**
  - `report:drift:check` → exit 0 (committed raporlar kontratlarla senkron; **drift yok**)
  - `npm run quality:check` → exit 0 (~40 self-check + yeni yutulan-assertion kapısı)
  - `playwright test --list` → 4052 test / 100 dosya, exit 0 (bozuk/toplanamayan spec yok)
  - Canlı prod **public smoke: 10/10 PASS** (`login.spec.js`, read-only) — gerçek runtime kanıtı

---

## Confirmed gaps

### P0

- **[ÇÖZÜLDÜ — bu oturum] Yutulan assertion (false-green) — `tests/support/interactions.js:105`.**
  `assertListLoading` (`@ix-loading`) iskelet görünürlüğünü `.catch(() => {})` ile yutuyordu →
  boyut sessizce PASS. (Ölü kod: hiçbir spec çağırmıyor, yani canlı patlama yarıçapı yoktu ama
  biri kablolarsa kısmi false-green olurdu.)
  - **Kanıt:** grep `assertListLoading` → interactions.js dışında 0 kullanım; satır 105 swallow.
  - **Çözüm:** `.catch(...)` kaldırıldı → iskelet artık gerçekten assert ediliyor.
  - **Kalıcı guard:** `tools/self-check-no-swallowed-assertions.mjs` (deterministik mini-parser;
    `expect(...).<matcher>().catch(...)` yutmasını yakalar, `waitFor().catch()`+`test.skip` ve
    `expect(await p.catch(...))` gibi meşru desenleri reddetmez) → `quality:check`'e bağlandı
    (`quality:swallowed-assertions`). 229 dosya tarandı, 0 ihlal; 6 meta-test geçti.

### P1

- **CI orphan — rol-scoped enforcement spec'i HİÇBİR lane'de koşmuyor (CI false-green sınıfı).**
  `tests/agent-enforcement.agent.spec.js` yalnız `chromium-agent` projesinde koşar
  (`playwright.config.js` `optionalRoleProjects`). Ama **hiçbir workflow `chromium-agent`'ı
  hedeflemiyor**: nightly `full-regression` matrisi yalnız `[chromium-authed, firefox-authed,
  webkit-authed]`; `.github/workflows/` içinde `chromium-agent` / `.agent.spec` / `VOMENTA_AGENT`
  referansı = **0**.
  - **Etki:** `VOMENTA_AGENT_*` credential'ı CI'a eklense BİLE spec dormant kalır — COV-01'in
    "credential gelince otomatik aktifleşir" varsayımı EKSİK (CI lane'i de gerekiyor).
  - **Kanıt:** `grep -rn "chromium-agent\|agent.spec\|VOMENTA_AGENT" .github/workflows/` → NONE;
    `full-regression` matrix (playwright.yml:428) sadece 3 browser-authed.
  - **Önerilen çözüm (credential GEREKTİRMEZ, PR-kilidi riski YOK):**
    1. `tools/run-role-enforcement.mjs`: `configuredRoles()`'u okur; credential'lı her rol için
       `playwright test --project=chromium-<role>` koşar; credential yoksa GÖRÜNÜR "no role
       credentials — skipping (fail-closed)" basıp exit 0 (asla `--project` hatası vermez).
    2. `playwright.yml`'ye nightly/dispatch (NON-REQUIRED) `role-enforcement` job'ı → bu script'i
       çağırır. Required set'e EKLENMEZ (PR'ları kilitlemez).
    3. `tools/self-check-role-enforcement-lane.mjs`: her rol-scoped spec deseni için bir CI
       lane'inin var olduğunu YAML-subset parser ile statik doğrular (regression guard).
  - **DoD:** self-check yeşil; credential yokken script exit 0 + görünür skip; credential varken
    otomatik koşar. **NOT: gerçek GH-Actions koşumuyla doğrulanmalı → ayrı PR.**

- **[ÇÖZÜLDÜ — bu oturum] Hygiene — ham `test.fail(true, …)` registry ile çapraz-kontrol edilmiyor (17 site / 12 dosya).**
  `settings-*.authed.spec.js` içinde ham `test.fail(true, 'Bulgu: …')` var (çoğu aynı i18n
  "Close" bug'ı ~12 diyalogda). Her birinin ARKASINDA gerçek terminal assertion var → bug
  düzelince unexpected-pass → RED (**false-green DEĞİL**). Ama `known-bugs.js` registry'siyle
  bağlı değillerdi → stale/duplicate drift riski. (Registry'de yalnız `BOT-BUILDER-CLOSE-I18N`
  var; settings yüzeyleri izlenmiyordu.)
  - **Çözüm:** `tests/contracts/raw-expected-fails.js` envanteri (17 girdi; file+includes+reason+
    `registryFinding`) + `tools/self-check-raw-expected-fails.mjs` uzlaştırma kapısı (kayıtsız
    ham test.fail → fail; stale girdi → fail; non-null registryFinding registry'de yoksa → fail;
    5 meta-test). `quality:raw-test-fail` olarak `quality:check`'e bağlandı. 17 ↔ 17.

- **Minor — koşullu seçim başlığı fazla iddia ediyor — `tests/voice-history.authed.spec.js:113`.**
  "yön filtresi seçim yapılabiliyor" başlıklı test, combobox boş dönerse seçimi hiç denemez
  (yalnız combobox+heading görünür assert edilir). Terminal assertion var → zero-signal değil;
  boş-veri durumunda "seçim" boyutu vacuous. Düşük önem.

---

## Blocked externally

Aşağıdakiler E2E reposunda ALTYAPI olarak hazır; yalnız dış bağımlılık (credential / staging /
provider) gelince tamamlanabilir. Hepsi ratchet/self-check ile GÖRÜNÜR tutuluyor — kör-CI grind yok.

- **Authed etkileşim kapsamı (L2·style 18 PENDING + L2·deep ~9 PENDING).** `style-backlog.js` /
  `depth-backlog.js` ratchet'leriyle sabit. Greenfield stil/derinlik sözleşmesi authoring'i
  **koşabilir authed ortam** ister (yerel `.env` test hesabı VEYA staging URL). **ENVIRONMENT_BLOCKER.**
  (Kör authoring = kanıtsız kontrat = tam da bu denetimin yasakladığı false-green.)
- **RBAC çapraz-rol enforcement (L4).** Framework + kontrat + auth'suz negatif testler hazır (COV-01).
  Gerçek "agent 403 alıyor mu" testi `VOMENTA_AGENT/ADMIN/SUPERVISOR_*` bekliyor. **ROLE_ACCOUNT_BLOCKER.**
  (+ yukarıdaki P1 CI-lane işi credential gelince gerçek koşum için gerekli.)
- **Mutation / L3.** `mutation.yml` fail-closed (`ALLOW_MUTATING_TESTS` yalnız orada, `environment:
  staging` onayı + staging secret'ları gerekli). Header'a göre staging henüz bağlanmadı (Faz 8).
  36 mutation spec dormant. **STAGING_BLOCKER.** Production mutation kaçış bayrağı YOK (korunur).
- **Provider / L5.** Gerçek harici servis olmadan schema/adapter/mock yazılabilir; gerçek entegrasyon
  doğrulaması mock ile "verified" işaretlenmez. **PROVIDER_BLOCKER.**
- **`evidence-index.json` boş (`{}`).** Evidence hattı FAZ 0→5 TAMAMLANDI (implementation).
  Index, açık-guard'lı bulgular için evidence lane dispatch edildikçe dolar (OPERATIONAL state).
  `quality:evidence-index` + `quality:findings-evidence` boş index'i dürüstçe "Kanıt: yok" olarak
  doğruluyor. **Kod açığı değil.**
- **Executive rapor "provenance STALE / advisory DRIFT".** Runtime verisi 2026-08-06 (commit
  `0707f82`) — current main'e karşı taze **authed** runtime yok (CI+credential gerekir). ADR-0033
  ile PR-bloklayan lane'den çıkarıldı (advisory). Dürüstçe kendini etiketliyor. **Kod açığı değil.**

---

## Rejected / stale findings

- **"Evidence pipeline eksik/kopuk."** REDDEDİLDİ — FAZ 0→5 merge'li; index boşluğu operasyonel,
  kasıtlı ve dürüst etiketli (`docs/EVIDENCE-PIPELINE-PLAN.md` DURUM notu).
- **"Report drift var."** REDDEDİLDİ — `report:drift:check` + `report:executive:check` +
  `report:readonly-manifest:check` hepsi exit 0.
- **"Required check'ler false-green (public smoke yalnız login; @critical PR'da koşmuyor)."**
  BİR AÇIK DEĞİL, BİLİNÇLİ TASARIM TRADE-OFF'U. `@critical`'ı required yapmak `authenticated-critical`
  (push-only, PR'da SKIPPED) yüzünden tüm PR'ları ebediyen "pending"de kilitler. PR-zamanı authed
  kapsama `Authenticated route quality` + change-impact ile sağlanır; tam kritik suite post-merge
  (push) + nightly koşar. Tek-prod-hesabı/auth-kırılganlığı bağlamında kabul edilmiş risk
  (bkz. branch-protection notu). Required set'i genişleterek "düzeltme" YAPILMAMALI.
- **`knownBugGuard` "düzelince yeşile döner" riski.** REDDEDİLDİ — `test.fail()` tabanlı; bug
  düzelince unexpected-pass → RED (doğru expected-fail tasarımı, 60 site).
- **`owner`/`rootCause` boş = eksik.** REDDEDİLDİ — 61 bulgu çoğunlukla PRODUCT_BUG; `rootCause`
  politika gereği uydurulmaz (hepsi null), `owner` organizasyonel bilgi. Dürüst boş bırakılmış.

---

## Completed existing systems (yeniden yapma)

Evidence pipeline (FAZ 0→5) · drift kapıları tek `report:drift:check`'e indirgenmiş (CI-04) ·
açık-bulgu ratchet + 4 negatif meta-test (REP-01) · RBAC framework + auth'suz negatif + role
kontratı (COV-01) · read-only manifest (rol-scoped sınıflandırma dahil) · surface
registry/inventory/depth + reconciliation · discovery baseline + PR-lane drift stabilizasyonu
(ADR-0033) · auth/authed-nav gateway resilience (ADR-0023/0028) · pr-impact seçim+runner+gate ·
sharded readonly audit · ~40 deterministik self-check · F-007 fail-closed ortam guard'ı ·
mutation safety fail-closed.

---

## Execution order

1. ✅ **P0 yutulan-assertion false-green + kalıcı guard** (bu oturum — TAMAMLANDI)
2. ✅ **P1 hygiene** — ham `test.fail(true,…)` ↔ registry uzlaştırması (bu oturum — TAMAMLANDI)
3. **P1 CI orphan** — rol-enforcement runner + nightly lane + self-check (kod+self-check burada; GH-Actions ile doğrula)
4. **Minor** — `voice-history:113` başlık/iddia hizalaması
5. **Dış-bloklu** — credential/staging/provider geldikçe: RBAC çapraz-rol → authed L2 backlog →
   mutation/L3 → provider/L5; her biri gerçek koşum döngüsüyle bitirilir.

---

## Definition of Done

- Her açık: implementation + targeted validation + regression/self-check + ilgili quality gate.
- Runtime gerektiren iş: gerçek runtime kanıtı (authed ise CI+credential). Yoksa açıkça
  `IMPLEMENTED, RUNTIME NOT VERIFIED` denir.
- Hiçbir güvenlik değişmezi gevşetilmez; production'a yazılmaz; `rootCause`/`owner` uydurulmaz.
- Kapanan açık bu dosyadan düşer; ratchet ileriye dönük daralır.
