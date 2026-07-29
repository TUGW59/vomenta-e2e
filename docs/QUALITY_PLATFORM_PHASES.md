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
- **Son güncelleme (audit):** 2026-07-29, WP-00.

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
| **WP-01** | Artifact/secret/PII güvenliği (P0) | **PARTIAL** | `diagnostics.js` console/URL'de email+bearer maskeliyor; trace/video/HAR taraması + seed'li-secret CI self-check YOK |
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
