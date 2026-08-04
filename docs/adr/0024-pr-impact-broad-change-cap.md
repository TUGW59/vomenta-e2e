# ADR-0024: PR-impact broad-change cap — geniş authed fan-out'u nightly'ye ertele

- Durum: Kabul edildi
- Tarih: 2026-08-04
- İlişki: ADR-0010 (PR-impact seçici motoru), ADR-0011 (runner enforcement),
  ADR-0017 (nightly shard stability). Bu ADR seçim motoruna bir sınır (cap) ekler;
  yeni bir sistem kurmaz.

## Bağlam

PR-impact seçici, değişen dosyalardan etkilenen testleri ters-import grafiğiyle
çıkarır. Bu repoda paylaşılan altyapı — `tests/helpers.js`, `tests/pages/App.js`
(page-object hub), `tests/pages/LoginPage.js`, `tests/support/*`, fixture'lar —
neredeyse TÜM authed spec'ler tarafından (doğrudan veya App/helpers üzerinden
transitif) import edilir. Ölçüm: bu modüllerden herhangi birine dokunmak 117
authed spec'in ~80'ini seçtiriyor.

Sonuç: auth altyapısına dokunan HERHANGİ bir PR (bu PR dahil), PR-impact lane'inin
45-dk kutusuna sığmayan ~tüm authed suite'i (≈1275 test) seçiyor ve job **45-dk
timeout'ta cancel** oluyordu (0 test failure, 0×503 — saf kapasite aşımı). Bu,
kodun doğruluğu değil, PR lane'inin exhaustive suite için tasarlanmamış olmasıdır;
exhaustive kapsam nightly full-regression'ın (tarayıcı×shard matrisi, 60-dk hücre)
işidir (ADR-0017).

## Karar

1. **Bounded cap (`AUTHED_PR_BUDGET = 12`)** — `planImpact` seçilen authed spec
   sayısı bütçeyi aşarsa TAM expansion'ı bırakır, temsili bounded fallback koşar ve
   tam listeyi `authedDeferredToNightly`'ye yazar + `BROAD_IMPACT_CAP:` reason ekler.
   **Sessiz kırpma YOK** (ADR-0016 dürüstlük ilkesi): ne ertelendiği ve neden,
   planda görünür. Bütçe-altı değişiklikler (ör. tek authed spec) HÂLÂ doğrudan
   hedefli koşulur.

2. **Bounded fallback = route-baseline + authed-critical** — `route-quality`
   (`quality-baseline.authed.spec.js`) BROAD_FALLBACK'ten çıkarıldı: zaten her PR'da
   ayrı `authenticated-quality` job'ında (`test:quality:pr`) koşuluyor. PR-impact'te
   tekrarı hem gereksiz hem de ~28-dk fazladan canlı yük (503 dalgasına maruziyet).
   route-baseline her rotayı authed açar; authed-critical kritik akışları koşar →
   hızlı, temsili kapsam (~16-20 dk). Bu değişiklik config/contract/auth-setup broad
   fallback yollarını da sadeleştirir; quality-baseline kapsamı dedicated job'da korunur.

3. **Exhaustive kapsam nightly'de** — ertelenen authed suite nightly full-regression
   (schedule) tarafından tarayıcı×shard matrisiyle tam koşulur. PR lane = hızlı
   temsili sinyal; nightly = exhaustive. (Bu, auth-setup değişikliğinin ZATEN bounded
   fallback'e indiği mevcut davranışla tutarlıdır — cap onu graph-module fan-out'una
   da genişletir.)

4. **Sert kapılar** — `quality:ci-impact` (broad-impact-cap + cap-boundary +
   real-shared-module-capped vakaları) ve `quality:ci-runner` (capped plan → bounded
   fallback grupları, authed exact grup YOK) sentetik kanıtlarla korur.

## Sonuç

Auth/paylaşılan-altyapı PR'ları artık PR-impact lane'inde bounded temsili set koşar
(45-dk kutusuna rahat sığar, 503 maruziyeti düşük), tam authed kapsam nightly'ye
dürüstçe ertelenir. Timeout artışı GEREKMEZ. Tek authed spec gibi dar değişiklikler
hedefli koşulmaya devam eder.
