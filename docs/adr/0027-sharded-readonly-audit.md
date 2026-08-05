# ADR-0027: Sharded read-only audit lane (4 parça + deterministik birleştirme)

- Durum: Kabul edildi (WP-FULL-READONLY-AUDIT / FAZ 3 kabul işi)
- Tarih: 2026-08-04
- İlgili: [ADR-0020](0020-readonly-audit-lane.md) (tek-job audit lane — bu ADR onu değiştirir),
  [ADR-0015](0015-production-readonly-manifest.md) (read-only manifest/selector),
  [ADR-0016](0016-report-truth-gates.md) (doğruluk kapısı orchestrator / false-green yasağı),
  [ADR-0009](0009-artifact-allowlist.md) (artifact allowlist),
  [ADR-0017](0017-nightly-shard-stability.md) (nightly tarayıcı×shard matrisi — blob-merge reddi)

## Bağlam

FAZ 3 (ADR-0020) audit lane'ini `readonly-full-chromium` profilinde çalıştırmak
mümkün değildi: bu profil **1281 read-only test** (81 spec) içerir ve CI'da
`workers=2` ile ~88 dakika sürer. ADR-0020 lane'i tek job + 45 dk timeout ile
kurulmuştu (hafif `route-baseline` için boyutlanmıştı). Sert timeout job'ı **iptal**
eder; `if: !cancelled()` artifact adımları iptal durumunda ÇALIŞMAZ → rapor/kanıt
üretilmeden koşum çöp olur. Yani "bütün manifest-onaylı Chromium read-only testler"
tek audited koşumda çalıştırılamıyordu.

Repo'nun full suite için mevcut kalıbı **sharding**'dir (playwright.yml full-regression:
tarayıcı × 2 shard, 60 dk). Fakat o job audit raporunu üretmez ve ADR-0017'de blob
tabanlı birleştirme bilinçli REDDEDİLMİŞTİR (karmaşık, opak).

## Karar

Audit lane'i **4 shard'lı matrix + ayrı birleştirme job'ına** dönüştür; birleştirmeyi
**Playwright blob-merge yerine SANİTİZE düz kayıt (flattenRuntimeTests) düzeyinde
deterministik** yap. Böylece hiçbir ham `report.json` artifact sınırından geçmez.

### 1. Shard matrix job (`readonly-audit`)

- `strategy: { fail-fast: false, max-parallel: 3, matrix: { shard: [1,2,3,4] } }`.
- Her parça `audit-shard-run.mjs` ile `--shard=i/4` koşar (run-audit'in false-green
  yasağı, parça düzeyi): eski girdi temizlenir → Playwright çalışır (exit saklanır) →
  runtime JSON'dan `flattenRuntimeTests` ile **sanitize düz kayıtlar** çıkarılıp
  `shard-results.json` (merge carrier) yazılır → test FAIL ise payload üretilse DE
  parça KIRMIZI (payload `testExitCode` taşır).
- Mutation/external-cost: config `grepInvert:/@mutation/` + runner `--grep-invert
  "@mutation|@external-cost"` + selector fail-closed + `audit-ci assert-safe` +
  `ALLOW_MUTATING_TESTS=false` (dört bağımsız kapı).
- Her parça KENDİ güvenli bundle'ını yükler: lane `readonly-audit-shard`
  (safe-summary trio + `shard-results.json`), artifact adı `readonly-audit-shard-<i>-secure`.

### 2. Birleştirme job (`readonly-audit-merge`)

- `needs: readonly-audit`, `if: !cancelled()` (bir parça kırmızı olsa DA birleşik
  rapor üretilsin — §3.8 dürüst rapor).
- Tüm shard bundle'larını indirir (MERGE-MULTIPLE YOK → `shard-results.json`'lar
  çakışmaz), `merge-audit-shards.mjs` ile birleştirir:
  - `audit-shard-lib.mergeShardPayloads` **fail-closed**: eksik shard (1..N tam küme
    değilse), çakışan indeks, karışık `shardTotal`, **karışık commit SHA** → hard fail.
  - Birleşim **deterministik**: kayıtlar `(file, routeMarker, title, project, status)`
    ile sıralanır → shard tamamlanma sırasından bağımsız stabil çıktı.
  - `aggregateTestExitCode = OR(shard testExitCode)` → herhangi bir parça kırmızıysa
    birleşik sonuç kırmızı.
- Birleşik düz payload `generate-runtime-report.mjs --flat-input` ile TEK yönetici
  raporuna (HTML/JSON/MD + manifest) dönüşür. Rapor motoru DEĞİŞMEDİ; yalnız
  `buildResultModel` opsiyonel `flatTests` girdisi + generator opsiyonel `--flat-input`
  kabul eder (raw ve merge yolları aynı sızıntı/provenance/invariant kapılarından geçer).
- FINAL exit `decideFinalExit` ile: merge girdisi eksik/karışık → non-zero; herhangi
  bir shard testi kırmızı → rapor üretilse DE non-zero; rapor üretilemedi → non-zero.
- Birleşik bundle lane `readonly-audit-merged` (safe-summary trio + yönetici
  HTML/JSON/MD + manifest), artifact adı `readonly-audit-merged-secure`.

### 3. Güvenlik sınırı

Ham `report.json` (hata mesajı/stack/stdout taşır) ASLA yüklenmez ve shard'lar
arasında AKMAZ. Shard'lar arası tek veri `flattenRuntimeTests` çıktısıdır (başlık
redakte + kısaltılmış; ham stack yok) ve `finalizeBundle` içinde ikinci kez
secret/PII + şema + FS denetiminden geçer. Yeni lane'ler `readonly-audit-shard` ve
`readonly-audit-merged` merkezi allowlist'e (`artifact-policy.mjs LANES`) eklenir;
upload adımları `if-no-files-found: error` + `ready`-guard + prepared secure path.

## Sonuçlar

- `readonly-full-chromium` artık tek audited koşumda çalışabilir: 4 paralel parça
  (~22 dk/parça) → toplam duvar-saati 45 dk timeout altında; birleştirme ~20 dk.
- False-green yasağı iki katmanda korunur (parça + birleştirme); retry-pass FLAKY kalır.
- Yapısal kapılar güncellendi: `self-check-audit-workflow.mjs` iki-job sharded yapıyı
  (matrix 4×/max-parallel 3/fail-fast false + merge needs/if/download/orchestrator/
  summary) 11 sentetik negatifle enforce eder; `self-check-audit-shard.mjs` merge
  çekirdeğini (eksik/çakışan/drift/şema) sentetik doğrular; `self-check-artifact-allowlist.mjs`
  upload envanteri 10→11 (shard+merged).
- ADR-0017'nin blob-merge reddi korunur: burada birleştirme blob değil, sanitize düz
  kayıt düzeyindedir (opak değil, tam denetlenebilir, deterministik).

## Reddedilen alternatifler

- **Tek job timeout'u 45→180 dk yükseltmek:** iptal riskini ötelerdi ama tek uzun
  koşum kırılganlığı + paralellik kaybı; kanıt yine tek noktada.
- **Playwright blob-merge (`merge-reports`):** ADR-0017'de reddedildi (opaklık); ham
  blob artifact sınırından geçerdi (secret yüzeyi).
- **route-baseline+critical'ı "full" yerine kabul etmek:** kullanıcı açıkça reddetti;
  "bütün manifest-onaylı read-only testler" alt kümeyle karşılanmaz.
