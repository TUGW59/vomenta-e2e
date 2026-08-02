# ADR-0009: Güvenli CI artifact allowlist — merkezi fail-closed hat (WP-SEC-B)

- Durum: Kabul edildi
- Tarih: 2026-08-02

## Bağlam

Testler production'a (`app.vomenta.com`) karşı koşar. WP-01 (ADR-0006) her
artifact'in İÇERİĞİNİ maskeler; WP-R3/R4 (ADR-0007/0008) forensic/verification
lane'lerine dar bir upload allowlist getirdi. Ancak `playwright.yml` içindeki
**9** `actions/upload-artifact` adımından yalnız ikisi (forensic + verification)
hazırlanmış bir bundle'a bakıyordu. Kalan yedi lane ham çıktı yüklüyordu:

- `public-smoke`, `authenticated-quality`, `authenticated-critical`,
  `full-regression` → ham `playwright-report/` (+ ham `test-results/junit.xml`);
- `visual-regression`, `read-only-discovery` → ham `playwright-report/` **+ tüm
  `test-results/`** (trace `*.zip`, video `*.webm`, failure/actual/diff screenshot
  dahil — canlı müşteri verisi riski, P0);
- `nightly-known-bug-reconcile` → dar tek JSON, fakat ortak hazırlama/allowlist
  kapısından geçmeden.

Ham Playwright HTML raporu ve JUnit XML; hata mesajı/stack, console/network
gövdeleri, DOM snapshot, absolute path ve ekran görüntüsü referansları taşıyabilir.
İçerik-maskeleme (WP-01) bir güvenlik ağıdır ama **upload sınırı** değildir: neyin
CI artifact'i olarak dışarı çıktığı ayrı ve fail-closed biçimde kapatılmalıdır.

## Karar

Bütün upload lane'leri tek merkezi, fail-closed, sentetik negatif testlerle
kanıtlanmış bir güvenli allowlist hattına geçirildi.

### Model

```
ham çalışma çıktısı (test-results/report.json — Playwright JSON reporter)
  -> lane adapter/parse
  -> alan allowlist + sanitize (redactText/redactDeep)
  -> güvenli kanonik model
  -> güvenli JSON/JUnit/HTML YENİDEN üretimi (raw copy DEĞİL)
  -> secret/PII + şema + dosya sistemi denetimi
  -> ATOMİK secure upload bundle: test-results/secure-upload/<lane>/
  -> actions/upload-artifact YALNIZ bu bundle
```

- **Tek politika kaynağı:** `tools/artifact-policy.mjs`. Kanonik 9-lane enum, exact
  output allowlist, limitler (dosya/bayt/bundle), screenshot politikası, local-only
  desenler (trace/video/raw-png), stabil rule ID'ler ve atomik `finalizeBundle`.
  Her allowlist girdisi **neden / producer / validator** taşır. forensic/verification
  allowlist'leri `forensic-lib.mjs`'den **import edilir** (çelişkisiz tek kaynak).
- **Preparer:** `tools/prepare-ci-artifact.mjs --lane <lane>`. Özet lane'leri için
  JSON raporundan güvenli `summary.json` + yeniden üretilmiş `junit.xml`
  (`system-out`/`system-err`/stack/env YOK) + `summary.html` (HTML-escape, inline/
  external script ve embedded asset YOK) + `manifest.json` üretir. `nightly` için
  `fixed-candidates.json`'u şema (`candidates[]`, `registryChanged=false`) + secret
  taramasından geçirip yeniden emit eder.
- **Güvenli kanonik model:** yalnız düşük-riskli teşhis alanları (schema/policy
  version, sabit lane adı, sınırlı commit/run metadata, pass/fail/skip/flaky sayıları,
  sanitize edilmiş statik test başlığı, project, süre, retry, güvenli hata sınıfı).
  Varsayılan çıkarılan: stdout/stderr, console/network gövde/header, Authorization/
  cookie/token, URL query, DOM snapshot, ham hata mesajı/stack, attachment, absolute
  path, environment dump, screenshot/trace/video referansı, base64/blob/data URI.
- **Manifest:** `policyVersion`, `lane`, `createdByToolVersion`, `files[]`
  (relativePath/sha256/size/mediaType/validatorId), `excludedLocalOnly[]` (yalnız
  güvenli kategori adı). Absolute path / secret / env / URL query içermez. Manifest
  kendini döngüsel hash'lemez (deterministik + belgeli).
- **Atomiklik:** hedef güvenle temizlenir → aynı FS'te `.tmp` dizine yazılır → tüm
  üretilen dosyalar RE-taranır → manifest en son → tüm kontroller geçerse atomik
  rename. Hata → `.tmp` ve final bundle KALMAZ. Önceki başarılı koşudan kalmış stale
  bundle yeni başarısız hazırlamada yüklenemez (finalize başta hedefi siler).
- **Fail-closed FS:** allowlist dışı dosya, `..`/absolute/NUL/path traversal, symlink/
  regular-file dışı giriş, gizli/dotfile, desteklenmeyen binary, decode/JSON/şema
  hatası, dosya/adet/bundle limiti, secret/PII hit, boş/eksik output → non-zero
  (stabil rule ID; eşleşen hassas değer ASLA loglanmaz).
- **Screenshot:** ham baseline/actual/diff PNG upload = **DENY** (görsel diff canlı
  müşteri verisi taşıyabilir). Özet lane'leri hiç PNG kabul etmez. Forensic
  `safe-final-state.png` yalnız mevcut maskeli-capture kontratıyla (ADR-0007) kabul
  edilir; ad'da `safe` geçmesi kanıt değildir.
- **Trace/video:** `*.zip`/`*.webm`/`*.mp4` CI upload = **DENY** (lokal-only). Runtime
  teşhis üretimi (AGENTS.md tracing standardı) ZAYIFLATILMAZ; üretilse bile hazırlanmış
  bundle'a girmez.

### Workflow statik enforcement

`tools/self-check-artifact-allowlist.mjs` iki kapıyı her koşuda kanıtlar:

1. **Politika/preparer negatif matrisi:** `finalizeBundle`/`validateSourceEntry`
   sentetik fixture'larla fail-closed (unexpected/secret/symlink/traversal/hidden/
   size/count/schema/screenshot/trace-local-only/atomic/stale/log-safety) — her ihlal
   stabil rule ID, hassas değer loglanmaz.
2. **Workflow taraması:** `.github/workflows/**` içindeki bütün `upload-artifact`
   kullanımları **yapısal YAML alt-küme parser'ıyla** (regex satır ezberi değil)
   çözülür. Reddedilenler: ham `playwright-report/` · ham/genel `test-results/` · glob/
   repo-kökü · trace/video/raw-screenshot · eksik `if-no-files-found: error` ·
   ready-guard/preparer bağı olmayan secure upload · kayıt dışı lane · tanınmayan
   action sürümü. Gerçek workflow 0 ihlalle geçer; ileride eklenecek ham bir upload
   adımı CI'da bu kapıyı düşürür.

`quality:artifact-allowlist` → `quality:check` zincirinde (unutulabilir ayrı komut
değil).

### Workflow güvenlik bağı

Her secure lane: `prepare` step'i (`id`, `if: !cancelled()`) preparer'ı koşar ve
başarıda `ready=true` yazar; upload YALNIZ `!cancelled() && steps.<id>.outputs.ready
== 'true'` iken ve YALNIZ `test-results/secure-upload/<lane>/` yoluna bakar; hepsinde
`if-no-files-found: error`. Preparer fail ederse (`bash -e`) `ready` yazılmaz → upload
atlanır; test failure artifact güvenlik failure'ı tarafından gizlenmez; `continue-on-
error` ile kapı yumuşatılmaz. forensic/verification lane'leri kendi gated preparer'larını
(`report:bug`/`report:verify`, non-zero-on-unsafe + `if-no-files-found: error`) korur.

### Kaynak

Güvenli kanonik modelin makine-okunur kaynağı için CI reporter setine
`json -> test-results/report.json` eklendi (mevcut `flattenPlaywrightReport` bu şekli
zaten çözüyor; JUnit XML'i elle parse etmekten daha az kırılgan). Bu dosya ASLA ham
upload edilmez; `test-results/` gitignore + upload dışıdır.

## Sonuçlar

- 9/9 upload adımı hazırlanmış bundle'a bakar; ham `playwright-report/`, ham/genel
  `test-results/`, trace/video ve onaysız screenshot CI'dan çıkamaz.
- Yeni bir raw upload eklemek statik kapıyı düşürür → sızıntı yüzeyi kalıcı kapalı.
- Görsel/discovery lane'leri artık yalnız güvenli sayısal/test özeti + manifest yükler;
  görüntü faydası gerekiyorsa geniş mask mimarisi ayrı bir pakete bırakılır (bu paket
  şişmez).
- Kapsam dışı ve AÇIK: `IR-SEC` (repo public/rotation/history) hâlâ P0; bu PR onu
  kapatmaz. `WP-CI-EMERGENCY` ayrı sonraki pakettir.
