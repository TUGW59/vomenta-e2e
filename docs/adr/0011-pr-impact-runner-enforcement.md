# ADR-0011: PR-impact runner ve workflow statik enforcement (WP-CI-E2)

- Durum: Kabul edildi
- Tarih: 2026-08-03
- İlişki: ADR-0010'un (seçici motoru) devamıdır. Faz 1 motoru _plan_ üretiyordu
  ama hiçbir CI job'ına bağlı değildi; bu ADR planı gerçek koşuya bağlar ve
  workflow'un sahte-yeşil üretmesini yapısal olarak engeller.

## Bağlam

Faz 0, pull request olayında CI'ın yalnız sabit iki test dosyası koştuğunu
(false-green) kanıtladı. Faz 1 (ADR-0010) değişen dosyalardan ilgili testleri
deterministik ve fail-closed seçen motoru + `selection.json` planını üretti,
ama **workflow'a dokunmadı**. Bu ADR üç şeyi ekler: (1) planı tüketip gerçek
Playwright'ı çağıran runner, (2) planı üretip runner'ı gate'leyen `pr-impact`
job'ı, (3) job sözleşmesini YAPISAL doğrulayan enforcement self-check.

## Karar

### 1) Runner: saf karar + ince CLI ayrımı

`tools/pr-impact-runner-lib.mjs` (saf) tüm kararları verir; `tools/run-pr-impact.mjs`
(CLI) yalnız gerçek Playwright'ı çağırır. Ayrımın nedeni **negatif kanıt**:
0-test / flaky / mutation-sızması / bozuk-plan durumlarının non-zero verdiği,
PRODUCTION'a dokunmadan, saf mantığa sentetik gözlem enjekte edilerek kanıtlanır
(`tools/self-check-pr-impact-runner.mjs`). Bu, Faz 1'deki motor/CLI ayrımının
aynısıdır.

Runner sözleşmesi (handoff §2.4):

1. `selection.json` şeması yapısal doğrulanır (`validateSelection`); bozuk/tamper
   edilmiş plan reddedilir.
2. `sourceMissing` veya unmapped runtime veya `plan.exitCode!=0` → **REFUSE**
   (non-zero), Playwright hiç çağrılmaz.
3. Her seçim grubu (`publicSpecs`→`chromium`, `authenticatedSpecs`→
   `chromium-authed`, `discoverySpecs`→`chromium-discovery`) ve her fallback suite
   EXACT argument array'iyle koşulur — **shell interpolation yok** (`execFileSync`).
4. Koşumdan ÖNCE (offline) seçili exact spec dosyaları diskte doğrulanır
   (yoksa `SPEC_FILE_MISSING` → kırmızı). Koşu `--reporter=json` ile çalışır;
   raporda hedef projede **0 test** görülürse exact grup **kırmızı**
   (`ZERO_TEST_SELECTION`). Not: Playwright `--list` modu JSON dosyası YAZMADIĞI
   ve config json reporter'ı sabit `test-results/report.json`'a yazdığı için,
   sayım ayrı `--list` yerine gerçek koşu raporundan alınır; `--reporter=json`
   CLI'da config reporter'ını override ederek çıktıyı grup-başına dosyaya yazar.
5. Setup/dependency (`setup` projesi) testleri hedef sayıdan **ayrı** sayılır.
6. Birden çok grupta herhangi biri kırmızıysa genel exit **non-zero**.
7. Koşu `--retries=0` iledir; ayrıca rapor `flaky>0` verirse grup **kırmızı**
   (retry flaky'yi başarıya çevirmez).
8. Her gruba `--grep-invert=@mutation` eklenir + seçili dosyalar mutation spec ise
   `planRun` REFUSE verir → mutation **son savunma katmanında yeniden reddedilir**.
9. Kısa, secretsiz step summary (`GITHUB_STEP_SUMMARY`) üretilir; sonuç
   `test-results/pr-impact/run-result.json`'a yazılır (artifact upload YOK).

0-test politikası fallback tipine göre ayrışır: **exact** grup ya da **dosyalı**
fallback 0 test → kırmızı; **grep-only** fallback (ör. `authed-critical` = `@critical`)
0 test → uyarı ama kırmızı değil (güvenlik ağıdır, hedef bilinmez).

### 2) `pr-impact` job'ı

`architecture`'dan sonra, yalnız `pull_request` olayında koşar. `fetch-depth: 0`
ile checkout (merge-base diff için tüm geçmiş + base ref). Base = `origin/<base_ref>`,
Head = `github.sha` (PR birleşme SHA'sı). Planner önce planı üretir; runner planı
tüketip Chromium'da koşar ve exit-code'uyla job'ı **gate** eder. `continue-on-error`,
`|| true`, exit-code yutma YOK. `ALLOW_MUTATING_TESTS` üst düzeyde `'false'` kalır;
job override etmez. Yeni ham artifact upload lane'i açılmaz (§2.3).

### 3) Workflow statik enforcement

`tools/self-check-ci-workflow.mjs`, WP-CI'ye ait bağımsız YAML alt-küme parser'ıyla
(`tools/yaml-subset.mjs`) job'ı YAPISAL doğrular — metin araması değil. 12 kural:
job mevcut, `needs: architecture`, `on.pull_request` + job PR-koşullu, planner +
runner adımları çağrılıyor, `continue-on-error:true` yok, `|| true` yok, mutation
env true değil, upload-artifact adımı yok, checkout `fetch-depth: 0`, runner gating.
`quality:check` zincirine `quality:ci-runner` + `quality:ci-workflow` eklendi;
motor/runner/workflow değişikliği bu kapıları düşürmeden yeşil olamaz.

## Neden `yaml-subset.mjs` ayrı bir dosya

Aynı parser WP-SEC-B `self-check-artifact-allowlist.mjs` içinde de gömülüdür; ama
o modül import edildiğinde **kendi self-check'ini çalıştırır** (yan etki). WP-CI
enforcement'ının o yan etkiye ve WP-SEC-B dosyasına bağlanmaması için parser saf,
bağımsız bir WP-CI dosyasına kopyalandı. Bu bilinçli ve sınırlı bir çoğaltmadır.

## Sonuçlar

- Artı: PR'da değişen ilgili dosya, ilgili test koşmadan yeşil OLAMAZ; sabit-dosya
  false-green kapanır. Negatif kırılmalar (§2.6) sentetik ve deterministik kanıtlı.
- Artı: Mutation prod'a çift+üçüncü katmanla giremez (dosya-adı + `grepInvert` +
  runner `--grep-invert`/REFUSE).
- Eksi: Config/package.json değişikliği geniş fallback tetikler (bu PR dahil) →
  authed suite koşar; kasıtlı (fail-safe). Barrel/fixture kuplajı (ADR-0010) hâlâ
  geniş seçim üretir; daraltma test-mimarisi işidir.
- Sınır: Runner'ın gerçek Playwright JSON ayrıştırması ilk kez canlı PR koşusunda
  uçtan uca doğrulanır; saf karar mantığı offline tam kapsanır.

## Kapsam dışı (sonraki fazlar)

Bağımsız PR denetimi + onaylı merge + post-merge CI (Faz 3 / WP-CI-E3). Artifact
upload lane'i, Surface Manifest, cross-browser PR koşumu bu ADR'de yoktur.
