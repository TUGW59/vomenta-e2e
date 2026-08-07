# Vomenta Kalite Platformu — Faz/İş-Paketi Durum Kaydı

> **Bu dosya tek kanonik gerçeklik kaydıdır (single source of truth).**
> Sohbet geçmişindeki dağınık "Faz 0/1/2/3…" numaraları artık kullanılmaz; her sohbet
> aynı numarayı farklı işe verdiği için (ör. "Faz 0" hem worktree ayrıştırma hem statik
> kapı; PR #37 hem discovery hem schedule) durum yönetimi bozulmuştu. Bundan sonra iş
> **WP-00 … WP-10** paketleriyle takip edilir. Bir işin "bitti" sayılması için burada
> `DONE` işaretli ve **PR/commit kanıtına** bağlı olması gerekir.

- **Taban:** `HEAD @ 7b2c277` (= merge edilmiş tip; PR #39). Bu izole worktree'de `main`/`origin/main`
  ref adları çözülmüyor; taban commit SHA ile sabitlendi.
- **Ortam:** **read-only production** (`app.vomenta.com`). `TEST_ENV` default `production`;
  `MUTATION_*` env değişkenleri ve rol hesapları repoda tanımsız → mutation/rol canlı testleri **BLOCKED**.
- **Son güncelleme (audit):** 2026-07-31, WP-R4 (fixed-candidate doğrulama mekanizması + regresyon koruması) **DONE + MERGED**; PR #51/#52/#55 merge edildi ve `main` üzerinde 3 v2 `workflow_dispatch verify_finding_id=B4` koşusuyla cross-run attestation restore, v2 namespace izolasyonu, deterministik profil fingerprint ve read-only network policy **canlı CI'da doğrulandı**. B4 üç koşuda da reproduce oldu → açık kaldı, başarılı doğrulama serisi 0, hiçbir bug kapatılmadı. (Önceki: 2026-07-30, WP-R3 forensik mod, PR #48.)

**Durum lejantı:** `DONE` (kanıtlı bitti) · `PARTIAL` (altyapı var, kapsam/enforcement eksik) ·
`BLOCKED` (dış bağımlılık — genelde staging) · `NOT STARTED`.

---

## 1. Gerçekten merge edilmiş olan (PR kanıtı — `gh` ile doğrulandı)

| PR | Başlık | Durum | Not |
|---|---|---|---|
| #36 | Mutation & keşif güvenlik kapılarını zorunlu kıl | MERGED | Governance temeli |
| #37 | Rapor schedule mutasyonu + salt-okunur keşif radarı | MERGED | Schedule mutation spec'i + discovery altyapısı |
| #38 | Faz 1: staging tenant kilidi | MERGED | Staging-only mutation guard |
| #39 | Faz 2: orphan-sıfır mutation yaşam döngüsü | MERGED | `testEntity` 0→1→0 |
| #35 | Test yönetişimi: keşif tamlığı + orphan-sıfır | **CLOSED (superseded)** | İçeriği #36–#39'a dağıldı; kapatıldı |
| #10–#34 | Bölüm testleri (supervisor, campaigns, contacts, analytics, workforce, reports, i18n kuralı, robustness helper'ları…) | MERGED | Memory'deki `claude/*` bölüm işleri; hepsi `main`'de landed |

**Branch reconciliation:** ~30 local `claude/*`/`test/*`/`codex/*` dalının büyük çoğunluğu yukarıdaki
**merge edilmiş PR'lara** karşılık geliyor → kaybolmuş WIP değil. Kayda değer istisnalar:
- `codex/phase3-discovery-completeness`: **ambiguous/superseded** — `HEAD`'e göre benzersiz içeriği güvenilir
  biçimde ayrışmıyor (linked-worktree ref sorunu). **Doğrudan devam edilmez;** gereken discovery-completeness
  işi WP-02/WP-03'te temiz yeniden kurulur.
- `AppShell.js`/`BasePage.js`'in "commit edilmemiş WIP"i aslında `96256e4` ("WIP snapshot: dil geçişi…") ile
  `HEAD` içinde **committed**. Kayıp yok.
- Settings/Profile recon spec'i ve PII içeren keşif görselleri **repoda YOK** (hiç commit edilmemiş). A1'deki
  PII-görsel riski committed duruma uygulanmıyor → WP-05/WP-01 bu konuda *önleme* yapar, temizlik değil.

---

## 2. Sabitlenmiş sayımlar (komutla doğrulanır)

> ⚠️ Bu sayımlar **taban commit `7b2c277`** anına aittir. Depo o günden bu yana
> önemli ölçüde ilerledi; aynı komutlar bugünkü ağaçta daha yüksek değerler verir.
> Tablo, dokümanın tabanıyla tutarlı kalması için bilinçli olarak sabittir — güncel
> bir denetim gerektiğinde bu bölüm ve §3 birlikte, yeni bir tabana yeniden
> sabitlenerek tazelenmelidir.

| Metrik | Değer | Doğrulama komutu |
|---|---|---|
| `test.fixme(` (gerçek çağrı) | **15** | `grep -rn "test\.fixme(" tests --include="*.spec.js"` → 16 satır; 1'i (`known-bugs-invite…:21`) docstring |
| `test.skip(` | **13** | `grep -rn "test\.skip(" tests --include="*.spec.js" \| wc -l` |
| `@known-bug` tag satırı / genişleyen test | **14 satır / ~30 test** | `grep -rn "@known-bug" tests --include="*.spec.js"`; TEST_COVERAGE.md tablosu |
| VOM/ticket referansı | **0** | Bulgular `BULGU`/`B1–B15`; issue-owner-expiry yok |
| Spec dosyası | **40** | `ls tests/*.spec.js \| wc -l` |
| MAIN_NAVIGATION rotası | **14** | `tests/contracts/navigation.js` |
| Kayıtlı rota (`tested-pages.js`) | **25** | 14 nav (generic baseline) + `/reports/dashboards` + 10 `/reports/*` |
| Discovery baseline rotası | **29** | `tests/contracts/discovery-baseline.json` |
| — endpoint fingerprint'i boş | **29/29** | Tüm rotalarda `endpoints: []` |
| — aynı ARIA hash'ini paylaşan | **25/29** | Radar sayfayı değil shell'i ölçüyor (P0) |
| Kayıtsız keşfedilmiş rota | **4** | `/campaigns/outbound`, `/channels/sms`, `/settings/organization`, `/settings/profile` |

### 15 `test.fixme` akışının dağılımı
- **Staging/canlı-veri bağımlı (14):** supervisor-agents Force→Break + offline-force-hata (2); supervisor-wallboard
  Pause/Resume/Close queue + Redirect-all + Move-call (5); supervisor-coaching değerlendirme kaydı (1);
  supervisor-agent-live cockpit (1); supervisor-interactions monitor/barge-in (1); voice-call gerçek çağrı + SMS (2);
  campaigns-outbound SCHEDULED kampanya delete teardown (1); known-bugs-invite generate+revoke / Bulgu-6 (1).
- **Frontend `data-testid` bağımlı (1):** `known-bugs.authed.spec.js:179`.

---

## 3. İş-paketi durum tablosu (WP-00 … WP-10)

| WP | Kapsam | Durum | Kanıt / engel |
|---|---|---|---|
| **WP-00** | Repo gerçekliğini kilitle (bu dosya) | **DONE (bu PR)** | branch/PR audit + sabit sayımlar + bu dosya |
| **WP-01** | Artifact/secret/PII güvenliği (P0) | **DONE** | Ortak `tests/fixtures/sanitize.js` (JWT/Bearer/Authorization/cookie/email/telefon/provider-key/kv + URL); `artifacts.safeAttach`/`safeScreenshot`; `diagnostics` delege; sert kapı `quality:artifact-safety` (seed'li-secret + spec'te ham `testInfo.attach` yasağı); ADR-0006. İsim PII otomatik değil (ekran maskesi — bilinçli sınır) |
| **WP-R1** | Bulgu registry + validator + knownBugGuard + linkage gate | **DONE + MERGED** | `tests/contracts/known-bugs.js` (31 bulgu: 28 knownBugGuard / 1 fixme / 2 permanent) + `knownBugGuard(test,id)` (helpers.js) + `tools/self-check-findings.mjs` (çift yönlü linkage + 6 negatif meta-test) `quality:check`'te. PR #44 → `origin/main` `ee4d0a2`. owner/expiry/rootCause null (uydurma yok) |
| **WP-R2** | Bulgu + test raporları (MD/JSON repo + HTML/PDF artifact) | **DONE + MERGED** | `docs/raporlar/`: `findings.json` + `BULGULAR.md` + `YAPILAN-TESTLER.md` + `YAPILMAYAN-TESTLER.md`; üreteçler `tools/generate-findings.mjs`/`generate-test-report.mjs`/`render-report-pdf.mjs` (+`report-lib.mjs`); HTML/PDF gitignored artifact; `report:findings:check` drift kapısı CI'da; coverageStatus/provenance (verified=0, executed=0); `piiReviewed` kapısı. PR #46 → `origin/main` `0bf0c0e` |
| **WP-R3** | Forensik mod + CI + nightly | **DONE + MERGED** | `report:bug -- <ID>` (`FORENSIC_BUG` → `knownBugGuard` beklenen-başarısızlığı atlar; maskeli `network-summary.json`+`safe-final-state.png`+`candidate-update.json`; `possibleCauses=[]`/`rootCauseCandidate=null`; registry değişmez); `report:artifact` upload allowlist güvenlik kapısı (yalnız JSON+PNG; ham `test-results/` yok); trace lokal-only (CI'a yüklenmez), video forensikte kapalı; `report:reconcile` nightly yalnız `fixed-candidate` önerisi; `quality:forensic` (`quality:check`'te); ADR-0007. PR #48 → `origin/main` `f1e8c7a`. Post-merge `workflow_dispatch finding_id=B4` doğrulaması geçti (yalnız B4, 0 mutation isteği, registry fingerprint sabit, yalnız 4 allowlist dosyası) |
| **WP-R4** | Fixed-candidate doğrulama mekanizması + regresyon koruması | **DONE + MERGED** | `report:verify -- <ID>` (`tools/verify-fixed-candidate.mjs`): tek bağımsız forensik koşu→attestation; `aggregateVerification` (forensic-lib) v2 uyumluluk kimlikleriyle (`schemaVersion=2`/`profileContractId`/`profileContractVersion`/`networkPolicyVersion=1`) birleştirir; eşik ≥3 bağımsız başarılı koşu + ≥2 gün; retry-pass/reproduce/infra-error/profil-uyuşmazlık/mutation serisi sıfırlar; durumlar candidate\|insufficient-evidence\|verified-fixed-proposal(**yalnız öneri**)\|reproduced\|inconclusive\|infra-error. Deterministik profil fingerprint (`tests/fixtures/scope-extract.js` `isValidScope`/`normalizeProfile` — timestamp/UUID/URL/e-posta/sayısal/metadata dışlanır) + sanitize `network-summary.json` read-only kanıtı (`assessReadOnly`; POST/PUT/PATCH/DELETE→başarı sayılmaz + CI hard-fail); v2 artifact namespace + eski v1 restore dışlama + `findingId+workflowRunId` dedupe + uyumsuz kayıtlar `ignoredAttestations`. `quality:verify` (`quality:check`'te) negatif self-check'ler. ADR-0008. PR #51 (mekanizma) `c7308f2` + PR #52 (deterministik fingerprint + read-only ağ kanıtı) `9d1db5f` + PR #55 (cross-run restore `actions:read` izni + gözlemlenebilir/retry) `e5c33d1`. **Canlı CI doğrulaması** (3 v2 `workflow_dispatch verify_finding_id=B4`: `30609277922` + `30609751033` + `30616188565`): (1) WP-R4 mekanizması canlı CI'da doğrulandı; (2) cross-run v2 attestation restore düzeltmesi ÇALIŞTI — 3. koşu önceki 2 v2 attestation'ı restore etti → considered=3 / ignored=0 / dedupDropped=0, üç farklı `workflowRunId`; (3) eski v1 artifact'ler (`30549912614`/`30550776103`) v2 namespace izolasyonuyla restore EDİLMEDİ; (4) deterministik profil fingerprint (3 koşu birebir `sha256:742e2160…` + aynı 106-scope liste) ve read-only network policy (0 mutation, yalnız GET) doğrulandı; artifact yalnız allowlist (verification-report+profile+network-summary+attestations), secret/PII gate 0 sızıntı, registry fingerprint koşu içi sabit. **(5) B4 üç canlı koşuda da `reproduced` → açık ve düzelmemiş kaldı; (6) başarılı doğrulama serisi 0'dır; (7) `verified-fixed-proposal` gerçek başarılı bir candidate üzerinde HENÜZ doğrulanmadı.** (8) Bug kapanışı (open→closed/permanent + `test.fail`/`knownBugGuard` sökme) AYRI ve insan onaylı süreçtir; **(9) WP-R4 mekanizmasının tamamlanması hiçbir bug'ın kapatıldığı anlamına gelmez.** |
| **WP-02** | Discovery fingerprint doğruluğu | **PARTIAL (P0)** | Runtime safety gate var; ama endpoint fingerprint'leri boş, 25/29 shared ARIA hash → radar shell'i ölçüyor |
| **WP-03** | Surface Manifest + discovery hard-gate | **PARTIAL** | Coverage radarı (`untestedRoutes`/`registeredNotReached`) hesaplanıyor ama **drift assert edilmiyor** (`discovery.spec.js`'de `report.changes` üzerinde `expect` yok); 4 kayıtsız rota report-only |
| **WP-04** | Evidence Registry + false-green fix | **PARTIAL** | `style-coverage.mjs` gerçek hard-gate + `[route:/path]`; ama yalnız 3 grup kayıtlı, 12/14 nav + tüm bölüm spec'leri generic baseline ile yeşil; makine-okur annotation modeli yok |
| **WP-05** | Settings/Profile kurtarma paketi | **NOT STARTED** | Repoda recon/PII artifact'i yok; kalıcı Page Object + 4 dil/RTL + errorpath yazılacak |
| **WP-06** | Feature dalgaları (6A–6E) | **PARTIAL** | Bölüm testleri var (PR #10–#34) ama rota-bazlı arketip/kontrol-registry/L1-L2-L3 modeline geçmedi; yalnız Reports arketipli |
| **WP-07** | CI/release lane'leri | **PARTIAL** | Tek workflow: PR statik+public-smoke+authed-quality; push critical; nightly full+visual(macOS)+discovery; `failOnFlakyTests` CI'da açık. Eksik: PR'da değişen-feature seçimi, contract lane, discovery drift assert |
| **WP-08** | Staging + test verisi altyapısı | **BLOCKED (platform)** | Staging origin/tenant/rol hesap/seed-reset API yok; guard hazır ve bekliyor |
| **WP-09** | Mutation & 15 fixme kapatma | **BLOCKED (staging)** | Report Schedule spec'i **DONE (execution BLOCKED)**; 14 fixme staging bekliyor |
| **WP-10** | Rol matrisi + contract + kalite ops | **NOT STARTED / kısmen BLOCKED** | Rol projeleri scaffold; can-see/cannot-see spec'i yok; OpenAPI/contract testi yok; 30 known-bug'a owner/expiry yok |

### Merge edilmiş "sağlam" temeller (değişmez kabul)
- **Staging-only mutation guard** — `config/environment.js` `assertMutationEnvironment`/`assertMutationTenant`:
  prod origin (`app.vomenta.com`) + prod API (`api.vomenta.com`) sert bloklu, kaçış bayrağı yok; üçlü tenant
  eşleşmesi (`tenantId` + `tenant.id` + `tenant.slug`); canlı `/api/v1/auth/me` preflight. `self-check-mutation-safety.mjs` ile test. (PR #38)
- **Orphan-sıfır lifecycle** — `tests/fixtures/testEntity.js`: rollback create öncesi kayıtlı, 0→1→0 baseline,
  LIFO teardown, cleanup hatası "KRİTİK ALTYAPI HATASI"; read-only orphan scan `mutation-orphans.authed.spec.js`;
  `architecture-rules.mjs` ile statik zorunlu. (PR #39)
- **Report Schedule mutation spec'i** — `reports-schedule-mutations.authed.spec.js`: POST 201 + DTO + cron
  `55 23 * * *` + list L3 + DELETE 204 + orphan poll→0. **Spec DONE, çalışması staging'e BLOCKED.**

---

## 4. Ortam & staging engeli

Aşağıdakiler staging tenant + rol hesap + (varsa) seed/reset API gelmeden **kapatılamaz**:
save/create/edit/delete gerçek akışları, 15 `test.fixme`'in 14'ü, rol/yetki matrisi (can-see/cannot-see),
concurrency/idempotency, state-machine mutation, source↔API↔UI veri uzlaştırması.

Guard hazır; açmak için gereken tek şey (WP-08 teslimatı): staging origin + `MUTATION_API_ORIGIN` +
`MUTATION_TENANT_ID` (UUID) + `MUTATION_TENANT_SLUG` + `ALLOW_MUTATING_TESTS=true` + `TEST_ENV=staging`,
ve admin/supervisor/agent rol kimlik bilgileri.

---

## 5. Önceki plandaki düzeltilen sürüklenmeler (drift)

- Mutation önek şeması **`VOMENTA_E2E_`** (aktif). `PW_`/`pw-`/`e2e-` yalnız **legacy orphan taramasında**
  tutuluyor (eski koşulardan kalıntı yakalamak için). Eski plandaki "`PW_<runId>_` kullan" yönergesi geçersiz.
- Report Schedule "repoya eklenmemiş" değerlendirmesi (A5) **yanlış**: spec repoda ve tam; yalnız staging bekliyor.
- fixme sayısı 17 değil **15**; rota sayısı tek bir "gerçek" değil, üç ayrı ölçü: 14 nav / 25 kayıtlı / 29 keşfedilmiş.

---

## 6. Güncelleme protokolü

Her WP: tek amaçlı dal → tek amaçlı PR → `npm run quality:check` + ilgili smoke/critical → CI yeşil →
merge → **bu dosyada ilgili WP satırını güncelle** → sonraki WP. Production verisi değişmez; retry'da geçen
test başarı sayılmaz. Bu dosya güncellenmeden bir WP "DONE" ilan edilmez.
