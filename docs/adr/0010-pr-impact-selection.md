# ADR-0010: PR değişiklik-etkisi seçici motoru (WP-CI-E1)

- Durum: Kabul edildi
- Tarih: 2026-08-03

## Bağlam

Depoda 100 spec dosyası (99 `*.authed.spec.js` + `login.spec.js`) ve 52 page
object var. Buna karşın bir **pull request** olayında CI yalnız üç job koşuyor:

- `architecture` (yalnız node self-check),
- `public-smoke` → `chromium` projesi = yalnız `tests/login.spec.js`,
- `authenticated-quality` → sabit tek dosya `tests/quality-baseline.authed.spec.js`.

`authenticated-critical` yalnız push/dispatch'te koşar. Sonuç: bir PR'da değişen
herhangi bir `*.authed.spec.js` veya page object ile **ilgili testin gerçekten
koştuğu garanti değildir**. CI yanlış testleri koşup yeşil olabilir (false-green).
Faz 0 (Gerçeklik Kilidi) bu beş açığı dosya/satır kanıtıyla doğruladı:

1. Değişen arbitrary spec doğrudan seçilmiyor.
2. Page Object → spec deterministik eşlenmiyor.
3. Shared fixture/helper/config için açık fallback yok.
4. 0-test durumu ayrı hard-failure olarak kanıtlanmıyor.
5. Mutation spec değişikliği prod-dışı olarak açıkça raporlanmıyor.

Bu ADR, bu açıkları kapatan **seçici motorunu** tanımlar. Motor bu fazda
workflow'a BAĞLANMAZ (Faz 2 işi); önce motor + sentetik self-check tamamlanır.

## Karar

Değişen dosyalardan çalıştırılacak testleri çıkaran, deterministik, makine-okur
ve **fail-closed** bir motor eklenir. Karar sırası:

1. **Spec-köklü ters import bağımlılık grafiği (birincil).** Kökler
   `tests/**/*.spec.js`. Statik `import ... from`, side-effect `import '...'` ve
   `export ... from` izlenir; bir modül değiştiğinde onu **transitif** olarak
   kullanan spec'ler bulunur.
2. **Açık yol-tabanlı sınıflandırma kuralları (ikincil).** Playwright
   projeleriyle hizalı: `login.spec.js`→`chromium`, `*.authed.spec.js`→
   `chromium-authed`, `discovery/*`→`chromium-discovery`.
3. **Fail-closed fallback (üçüncül).** Grafiğin çözemediği ama runtime'ı
   etkileyebilecek dosyalarda geniş-güvenli fallback suite; hiç eşlenemeyen
   runtime kaynağı ise **non-zero**.

### Dosyalar

```
tools/pr-impact-lib.mjs       # saf motor (grafik + sınıflandırma + plan)
tools/plan-pr-impact.mjs      # CLI: git diff → selection.json
tools/self-check-pr-impact.mjs# 21 sentetik kontrol (production çağrısı yok)
```

Yeni script'ler: `ci:impact:plan` (plan üret) ve `quality:ci-impact` (self-check).
`quality:ci-impact`, deterministik olduğu kanıtlandığı için `quality:check`
zincirine eklenir.

### Etki sınıfları

| Sınıf | Örnek | Davranış |
|---|---|---|
| public-spec | `tests/login.spec.js` | Exact spec, `chromium` |
| authed-spec | `tests/x.authed.spec.js` | Exact spec, `chromium-authed` |
| discovery-spec | `tests/discovery/*.spec.js` | `chromium-discovery`; prod mutation yok |
| mutation-spec | `*.mutation.*` / `*-mutations.*` / `mutation-orphans` | **Prod'da koşmaz**; `STAGING_BLOCKED` |
| graph-module | `tests/pages/**`, `tests/fixtures/**`, `tests/helpers.js`, `tests/api/**`, `tests/data/**` | Ters grafikteki bağlı spec'ler (fixture/helper'da + `authed-critical`) |
| contract | `tests/contracts/**` | Geniş fallback + grafik bağımlıları |
| config | `playwright.config.js`, `config/**`, `package.json`, `package-lock.json` | Geniş güvenli fallback |
| auth-setup | `tests/auth.setup.js` | Tüm authed lane → geniş fallback |
| ci-tooling | `tools/**`, `.github/**` | Self-check yeterli; prod spec gerektirmez |
| visual-snapshot | `*-snapshots/**`, `*.png` | PR'da @visual koşmaz; policy notu |
| docs | `*.md`, `docs/**` | Runtime gerekmez |
| unknown-runtime | yukarıdakilerin hiçbiri | **Fail closed**, non-zero |

### Mutation güvenliği (çift katman)

Mutation-only spec'ler **dosya-adı konvansiyonuyla** ayrılır: `*.mutation.*`,
`*-mutations.*`, `mutation-orphans.*`. Faz 0 bu konvansiyonun kesinliğini
doğruladı: dosya adında "mutation" olmayan 9 salt-okunur spec `@mutation`
kelimesini yalnız **yorumlarda** (ayrı mutation spec'ine atıf) taşır — gerçek
etiket değil. Böylece mutation-only tespiti dosya adından güvenilir yapılır.

Bu sınıflandırma yalnız **raporu** etkiler; **güvenliği** değil. Prod-mutation
yasağı bundan bağımsız olarak `playwright.config.js` içindeki
`grepInvert: /@mutation/` ile gerçek etiket üzerinden her hâlükârda uygulanır.
Yani yanlış sınıflandırma bile prod'a mutation sızdıramaz. Faz 2 runner'ı,
`--list` ile seçilen gerçek test sayısını doğrulayan üçüncü katmanı ekler.

### Ters grafik kapsamı ve bilinen genişlik

Parser statik ESM sözdizimini destekler (`import/export ... from`, side-effect
`import`). Yalnız repo-içi göreli (`./`, `../`) belirteçler kenar olur; dış
paketler ve `node:` builtin'leri grafik dışıdır. Çözülemeyen göreli import veya
**dinamik** `import('...')` sessizce yok sayılmaz — `graphWarnings`'e yazılır ve
geniş fallback tetikler (fail-closed). Depoda gerçek dinamik import yoktur.

**Önemli yapısal gerçek:** `tests/pages/App.js` 50 page object'i toplayan bir
barrel'dır; `tests/fixtures/test.js` onu import eder; 100 spec de fixture'ı
import eder. Dolayısıyla **herhangi bir page object veya paylaşılan fixture
değişikliği, ters grafik üzerinden neredeyse tüm authed suite'e yayılır.** Bu bir
motor hatası değil, mevcut test mimarisinin dürüst transitif etkisidir: seçici
FAZLA seçer, asla kaçırmaz (fail-safe). Doğrudan spec değişikliği ise dar ve
kesin kalır. Bu genişliği daraltmak (App barrel'ını parçalamak) ayrı bir test
mimarisi işidir; bu ADR'in kapsamı dışındadır. Faz 2, geniş seçimlerde koşum
stratejisini (batch/temsili fallback) belirleyecektir.

### Sıfır-test politikası

`selectedRunnableSpecCount=0` her zaman hata değildir; dört durum ayrılır:

- **docs/ci/visual-only** → `NO_RUNTIME_REQUIRED`, exit 0.
- **yalnız mutation spec** → `STAGING_BLOCKED`, prod run yok, exit 0 (statik
  güvenlik kapıları `quality:check`'te koşar).
- **runtime-etkili ama eşlenen runnable spec 0** → `UNMAPPED_RUNTIME_CHANGE`,
  exit non-zero.
- **kaynak commit yok / shallow** → `SOURCE_MISSING`, exit non-zero.

Faz 2 runner'ı ayrıca "seçici koş dedi ama Playwright 0 test buldu" durumunu
`ZERO_TEST_SELECTION` olarak non-zero raporlar. Bu dört+bir durum aynı "0 test"
mesajında eritilmez.

### Girdi/çıktı sözleşmesi

CLI iki modu destekler: (1) git modu (`--base/--head` veya `GITHUB_BASE_REF/
GITHUB_SHA`), merge-base semantiği için üç-nokta karşılaştırma; (2) sentetik mod
(`--changed`, `--changed-status`, `--from-json`). Base/head doğrulanmadan diff
hesaplanmaz. Plan `test-results/pr-impact/selection.json`'a yazılır (gitignore).
Çıktı: absolute path yok, secret/PII yok, diff snippet yok; anahtar/dizi sırası
deterministik. Bu fazda artifact upload yoktur.

## Sonuç

- 21 sentetik self-check vakası production çağrısı yapmadan geçer.
- Doğrudan spec + transitif bağımlılık eşlemesi kanıtlıdır.
- Bilinmeyen runtime değişikliği sessizce yeşil değildir (fail-closed).
- Mutation prod seçimine girmez ve açıkça raporlanır.
- Workflow bu fazda değişmez (Faz 2).

## Alternatifler

- **Sabit dosya-adı tablosu:** reddedildi — kırılgan, page object→spec ilişkisini
  ve transitif etkiyi kaçırır.
- **Her değişiklikte tüm suite:** reddedildi — timeout/gürültü; yine de mutation
  ayrımı ve 0-test politikası gerekir.
- **AST tabanlı parser (ağır bağımlılık):** şimdilik gereksiz; statik ESM için
  regex + göreli çözümleme yeterli ve fail-closed. İhtiyaç doğarsa ayrı ADR.
