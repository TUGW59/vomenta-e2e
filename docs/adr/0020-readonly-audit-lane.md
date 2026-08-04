# ADR-0020: Kalıcı GitHub full read-only audit lane'i

- Durum: Kabul edildi (WP-FULL-READONLY-AUDIT / FAZ 3)
- Tarih: 2026-08-03
- İlgili: [ADR-0015](0015-production-readonly-manifest.md) (read-only manifest/selector),
  [ADR-0016](0016-report-truth-gates.md) (doğruluk kapısı orchestrator),
  [ADR-0009](0009-artifact-allowlist.md) (artifact allowlist),
  [ADR-0013](0013-doc-drift-gates-pr-only.md) (drift kapıları)

## Bağlam

FAZ 1 (güvenli seçici) ve FAZ 2 (doğruluk-kapısı orchestrator) `main`'de. Ancak full
read-only audit + raporlama yalnız tek kişinin makinesinden `npm run ci:audit` ile
çalıştırılabiliyordu. Handoff §FAZ3: audit'i GitHub'da **tekrar çalıştırılabilir**,
**planlı** ve **fail-closed** hâle getir; güvenli artifact allowlist'inin dışına çıkma.

Kısıt: mevcut `.github/workflows/playwright.yml` zaten `schedule`/`workflow_dispatch`
taşıyor ama farklı semantikle (`suite: critical/full`, forensic/verify input'ları).
Audit'i o dosyanın dispatch input'larına karıştırmak sözleşmeyi bulanıklaştırırdı.

## Karar

**Ayrı, bağımsız bir workflow dosyası:** `.github/workflows/readonly-audit.yml`
(`Read-only Audit`). Kendi `workflow_dispatch` (profil enum) + `schedule` (haftalık)
tetikleyicileri, tek `readonly-audit` job'ı.

Lane, üç mevcut katmanı GitHub'da birleştirir (ikinci gerçeklik kaynağı üretmez):

1. **Seçim (FAZ 1):** `select-readonly-tests.mjs --profile=<p>` → seçilen spec dosyaları
   job summary'ye yazılır. Seçime mutation/external-cost girerse veya 0 seçim olursa
   koşum **başlamadan** non-zero.
2. **Bağımsız güvenlik kapısı:** `audit-ci.mjs assert-safe` — seçilen HER spec'in
   MANİFEST effect'inin `read-only` olduğunu diskten yeniden kurarak doğrular. Bu,
   selectörün effect filtresine ek ikinci kapıdır. Dosya-adı sanısı DEĞİL manifest
   effect'i kullanılır → `mutation-orphans` gibi ada rağmen lifecycle ile read-only
   işaretli spec'ler doğru geçer; effect=mutation bir spec sızarsa hard fail.
3. **Koşum planı:** `audit-ci.mjs plan` → seçimden güvenli `project`+`grep` GitHub
   Actions çıktısı (serbest shell argümanı yok; grep yalnız `@tag` biçimi).
4. **Doğruluk-kapısı orchestrator (FAZ 2):** `run-audit.mjs` GATING adım. Eski JSON'u
   temizler, Playwright'ı koşar (config CI json reporter → `test-results/report.json`),
   **her durumda** raporu üretir, final exit'i belirler: test FAIL → rapor olsa da
   non-zero; rapor üretilemedi/stale → non-zero. Basit `test && report` yasak.
5. **Güvenli bundle (WP-SEC-B):** yeni `readonly-audit` lane'i `artifact-policy.mjs`
   LANES enum'una eklendi (safe-summary@1). `report:artifact:prepare --lane readonly-audit`
   ham `report.json`'dan sanitize `summary.json/junit.xml/summary.html/manifest.json`
   üretir; secret/PII + şema + FS denetimi. **Yalnız** bu bundle upload edilir.
6. **Job summary:** `audit-ci.mjs summary` seçim + güvenli bundle özeti + manifest kapsam
   hunisi + known findings'ten sanitize markdown üretir; `listed != selected != executed`
   korunur; runtime JSON yoksa **RUN BLOCKER** dürüstçe raporlanır (0 bug demez).

### Kapsam kararları

- **Yalnız Chromium read-only.** `AUDIT_PROFILES`, `PROFILES`'tan TÜRETİLİR: tek projesi
  `chromium-authed`, policy-gated olmayan, production read-only profiller
  (route-baseline / readonly-critical / readonly-full / known-bug-readonly / a11y).
  Cross-browser (çok proje) ve visual (policy-gated) **FAZ 6** kapsamı → enum'a giremez.
- **Schedule default'u hafif deterministik taban** (`route-baseline-chromium`): FAZ 8
  kararlılık kanıtı (≥3 bağımsız scheduled run) için ucuz ve tekrarlanabilir.
- **Scheduled run `main`'e commit/push YAPMAZ.** Repo snapshot yalnız kontrollü PR ile
  güncellenir (handoff §"Repo snapshot güncelleme politikası"). `permissions: contents: read`.

## Enforcement (fail-closed, `quality:check` içinde)

- `quality:audit-workflow` (`self-check-audit-workflow.mjs`): `readonly-audit.yml`'ı
  YAPISAL parse eder; 13 kural (job/tetikleyici/profil-enum==AUDIT_PROFILES/selector/
  assert-safe/plan-id/orchestrator-gating/no-mask/mutation-env/permissions/summary/secure-upload).
  6 sentetik negatif kapının düştüğünü kanıtlar.
- `quality:audit-ci` (`self-check-audit-ci.mjs`): `audit-ci.mjs` saf fonksiyonlarının
  negatif matrisi + job summary'nin PII-safe ve blocker-dürüst olduğunu doğrular.
- Mevcut `quality:artifact-allowlist`: yeni workflow'u da tarar (10 upload adımı, 0 ihlal);
  `readonly-audit` lane'i LANES'te olmasaydı `ART-WORKFLOW-UNKNOWN-LANE` düşerdi.
- Mevcut `quality:audit-orchestrator`: exit matrisini (test-FAIL→rapor+kırmızı, stale→
  hard-fail) zaten kanıtlıyor. Handoff §FAZ3 "sentetik workflow testleri" bu kapılara
  DAĞITILMIŞTIR (tek dev negatif suite yerine ilgili sözleşmenin kendi self-check'i).

## Sonuçlar

- Full read-only audit artık `workflow_dispatch` (profil seçimli) ve `schedule` ile
  GitHub'da tekrar çalıştırılabilir; test kırmızı olsa da güvenli rapor/bundle üretilir,
  job sonucu sahte-yeşil olmaz.
- Uzun gerçek production koşumu (tüm Chromium read-only) **FAZ 4** işidir; bu faz altyapıyı
  kurar ve en fazla bir kontrollü doğrulama koşusu yapar.
- Cross-browser/a11y-derin/visual katmanları FAZ 6'da aynı rapor sözleşmesine bağlanacak.
