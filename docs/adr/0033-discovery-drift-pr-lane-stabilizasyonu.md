# ADR-0033 — Discovery drift'in PR-lane stabilizasyonu (monitoring vs per-PR)

- **Durum:** Kabul edildi — 2026-08-09
- **İlgili:** ADR-0010 (pr-impact seçici), ADR-0024 (broad-impact cap), ADR-0025 (sharded PR lane),
  ADR-0032 (dev yüzey keşfi; F-023/F-027), `tests/discovery/baseline.js`,
  `tests/discovery/discovery.spec.js`, `tests/discovery/crawler.js`, `tools/pr-impact-lib.mjs`,
  `tools/self-check-discovery.mjs`.

> **Kanıt notu:** Bu ADR bir karar kaydıdır ve kod/test ile **birlikte** merge edilir. Değişiklik
> saf-mantık + offline self-check ile kanıtlanır; canlı prod'a hiçbir kalıcı yazma yapılmaz.

---

## 1. Bağlam ve problem (P1-7)

`config/`'e dokunan her PR, PR change-impact lane'inde ters import-grafiği üzerinden
`tests/discovery/discovery.spec.js`'i seçtiriyordu (`discovery.spec.js` → `config/environment.js`
import'u). Bu spec **CANLI prod'a** (`app.vomenta.com`) karşı crawl yapıp sonucu commit'li statik
baseline (`tests/contracts/discovery-baseline.json`) ile karşılaştırıyor. Prod aktif geliştirildiği
için ARIA yapısı ve endpoint envanteri **sürekli ve beklenen** biçimde değişiyor → drift → sert FAIL
(`ASSERTION_SELECTOR_VISIBILITY`, retry yok; bkz. `pr-impact-runner-lib.classifyFailure`).

Kanıt (önceki oturum): baseline #143 ile 46→66 rotaya tazelendikten **sonra** bile bir sonraki PR
koşumu drift'te patladı → sorun bayat baseline değil, **doğası gereği** canlı-prod-crawl vs statik-
baseline karşılaştırmasının per-PR determinizminin olmaması. Ayrıca `maxPages` truncation'ı, keşfedilen
(seed-dışı) bir rotayı (ör. `/campaigns/outbound`, ADR-0032 F-023) yanlışlıkla "removed-route" sayıyordu.

## 2. Karar

**Seçenek B (önerilen) + F-023 fix + drift-policy sertleştirmesi.** Gerekçe: canlı-prod crawl-vs-
baseline bir **MONITORING** kontrolüdür, per-PR birim doğrulaması değil. Bu yüzden:

1. **PR lane'den çıkar (asıl kök-neden kesimi).** `tools/pr-impact-lib.mjs` içinde seçilen tüm
   discovery spec'leri (doğrudan düzenleme VEYA config/contract ters-grafik fan-out'u) artık
   `selected.discoverySpecs` yerine yeni `discoveryDeferredToNightly` alanına gider ve
   `DISCOVERY_DEFERRED_TO_NIGHTLY:<spec>` reason'ı ile **görünür** biçimde nightly'ye ertelenir
   (sessiz kırpma yok). Discovery **mantığı** PR'da offline `tools/self-check-discovery.mjs` ile
   korunmaya devam eder (canlı prod gerekmez). Canlı crawl yalnız nightly `read-only-discovery`
   job'ında (schedule / `workflow_dispatch suite=full`, `DISCOVERY_MAX_PAGES=80`) koşar.

2. **Drift politikasını sertleştir (`evaluateDriftPolicy`).** Nightly monitoring sinyali de kararlı
   ve anlamlı olsun diye canlı-prod-**beklenen** drift artık BLOK değil advisory'dir:
   - `ariaChanged` → **info** (annotation), `networkChanged` (added+removed) → **info**,
     `addedRoutes` → **info**.
   - `removedRoutes` → **FAIL** (kararlı regresyon sinyali) olarak kalır.

3. **F-023 (removedRoutes false-positive) düzeltmesi.** `crawler.js` artık gerçekten navigate edilen
   rotaları `attemptedRoutes` olarak raporlar. `compareDiscoveryBaseline`, baseline'da olup koşum
   fingerprint'inde olmayan rotaları ikiye ayırır:
   - denenip bulunamayan (`attemptedRoutes`'ta var) → `removedRoutes` (FAIL),
   - hiç denenmeyen (maxPages truncation / kapsam) → `unvisitedBaselineRoutes` (info).

## 3. Değişmeyen güvenlik sözleşmesi

`report.hardFailures` (oturum/origin kaybı, document 5xx, engellenen non-GET istek) **drift değildir**
ve `discovery.spec.js` içinde **koşulsuz, her hâlde BLOK** olarak assert edilmeye devam eder — asla
advisory yapılmaz. Gerçek regresyon (gerçekten kaldırılmış rota) da sessizce yeşile alınmaz. Yalnız
canlı-prod-beklenen yüzey drift'i advisory'ye indirilmiştir.

## 4. Alternatif (reddedildi): Seçenek A

Discovery'yi PR lane'de tutup yalnız drift assertion'ını yumuşatmak. Reddedildi çünkü canlı prod
crawl'ı PR kritik yolunda tutmak, PR'ı geçici prod 5xx dalgalarına ve ~40 sayfalık crawl'ın zamanlama
gürültüsüne maruz bırakmaya devam eder — monitoring yükü per-PR gate'e ait değildir. (Not: bu ADR yine
de A'nın drift-policy sertleştirmesini benimser; böylece nightly monitoring de stabil olur.)

## 5. Sözleşme kilidi (self-check)

- `tools/self-check-discovery.mjs`: aria/endpoint/added/unvisited → info (pozitif); gerçek-removed →
  FAIL (negatif); F-023 truncation vs gone ayrımı (compareDiscoveryBaseline) offline kanıtlanır.
- `tools/self-check-pr-impact.mjs`: doğrudan discovery-spec ve config değişikliği → `discoverySpecs`
  boş + `discoveryDeferredToNightly` dolu + reason; config yine BROAD_FALLBACK ile PR kapsamı alır.
