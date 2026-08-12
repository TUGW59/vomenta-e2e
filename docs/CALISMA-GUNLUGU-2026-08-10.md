# Çalışma Günlüğü — 2026-08-10: Repo doğrulama + bug-raporlama otomasyonu

Bu oturumda yapılan işlerin özeti (kalıcı kayıt). Tüm değişiklikler PR ile main'e girdi;
doktrin korundu (registry immutable, prod read-only, main'e auto-push yok).

## 1. Doğrulama
- Bağımlılıklar kuruldu; `quality:check` (statik kalite kapıları) **yeşil**.
- Public smoke (auth'suz) **2/2**; ardından `.env` (gerçek prod creds) ile authed smoke **200/200 + 3 flaky-recovered**.
- Flaky 3 deep-link testi izole edildi (retry'sız **24/24** → gerçek kusur değil, ortamsal blip).
- Tam authed regression (**1347 test**) koşuldu ve `test.fail()` semantiğiyle **otoriter** sınıflandırıldı:
  **REAL-RED 5 · FIXED-CANDIDATE 3 · FLAKY 15 · KNOWN-BUG-GREEN 71.** (Ham ✘ sayısı yanıltır;
  `@known-bug` beklenen-başarısızlıkları yeşildir.) Workforce `:55/:66` izolede geçti → ortamsal.

## 2. Düzeltilen iki gerçek defect
- **RBAC katalog normalizer** (PR #155): `settings-roles-rbac.authed.spec.js` katalog kontratı
  production'da kırmızıydı ama ürün DOĞRUYDU — canlı `/catalog` `data.permissions[]` altında 113
  izinle birebir; test'in `catalogKeys()`'i `{success,data:{permissions}}` zarfını tanımıyordu. Düzeltildi.
- **reconcile önek bug'ı** (PR #156): Playwright JSON `spec.file` öneksiz, registry `test.file`
  `tests/` önekli → `reconcile()` lookup'ı hep ıskalıyor, beklenmedik geçen guard'lar **0**
  fixed-candidate sanılıyordu (sessiz yanlış-negatif). `^tests/` normalize ile düzeltildi (0→3).

## 3. Bug-raporlama otomasyonu (yeni sistem)
- **`report:draft`** (PR #157): kırmızı testi triyaj eden, YALNIZ REAL-RED için "NEREDE/NASIL
  ulaşılır/NE bozuk" metadata'lı TASLAK bulgu üreten öneri-only araç (`tools/draft-finding.mjs`,
  `forensic-lib.mjs` fonksiyonları, `quality:draft` self-check). Registry'ye ASLA yazmaz.
- **Doktrin belgesi** `docs/BUG-REPORTING.md` (PR #157): iyi bug raporu anatomisi + yaşam döngüsü +
  iş akışı. `AGENTS.md`'den linkli.
- **CI nightly draft lane** (PR #162): `known-bug-draft` lane + `prepareDraftLane` ingester +
  `nightly-draft-findings` job.

## 4. Kanıt-autofill (BULGULAR.md "Kanıt: yok" → gerçek kanıt)
- **Kök sorun:** forensik-yakalama + `evidence-index.json` üretimi CI'da vardı ama index HİÇ
  land edilmiyordu (job onu yalnız artifact yüklüyor, commit/PR yok) → committed index `{}` → 59
  bulguda "Kanıt: yok". Kanıt "Option A": commit edilecek tek şey index; render `maskeli kanıt
  \`<bundle>/<dosya>\` ([CI koşumu](runUrl))` — maskeli PNG repoya GİRMEZ.
- **FAZ 1 (PR #165, açık):** `known-bug-evidence-index` job'ına yazma izni + `report:build` regen +
  honesty gate + `bot/evidence-refresh` **auto-PR**; nightly kapsam **12→tüm açık bulgular**.
- **SONRAKİ:** FAZ 2 = `markForensicTarget` sweep (~43 görsel/layout/a11y/i18n guard testi;
  boxed `location.png`; şu an yalnız 1 spec işaretli). Detay: `EVIDENCE-PIPELINE-PLAN.md` +
  bu oturumun planı.

## PR özeti
| PR | Konu | Durum |
|---|---|---|
| #155 | fix(rbac) katalog normalizer | merged |
| #156 | fix(reconcile) `tests/` önek | merged |
| #157 | feat(reporting) report:draft + doktrin | merged |
| #162 | ci(reporting) nightly draft lane + job | merged |
| #165 | ci(evidence) autofill FAZ 1 (index auto-PR) | açık (review) |

## Bilinen tuzaklar (bu oturumda doğrulandı)
- Repo'da **auto-merge kapalı** ve PR author self-approve edemez → merge admin bypass veya
  maintainer onayıyla olur (bkz. `ci-branch-protection-required-checks`).
- **GITHUB_TOKEN ile açılan PR** başka workflow'u tetiklemez → `bot/evidence-refresh` PR'ının
  kendi required-check'leri maintainer re-run (veya PAT) gerektirebilir.
- Spec satır kayması, satır-numarası tutan üretilen dokümanları (`YAPILMAYAN-TESTLER.md`)
  bayatlatır → `report:sync` + commit (PR #155'te yaşandı).
