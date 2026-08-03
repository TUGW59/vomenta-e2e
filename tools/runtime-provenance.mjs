// @ts-check
/**
 * FAZ0 — RUNTIME PROVENANCE TAZELİK/DOĞRULANABİLİRLİK MOTORU (saf kütüphane).
 *
 * Amaç: bir runtime raporunun GERÇEK, TAZE ve DOĞRULANABİLİR bir Playwright koşum
 * sonucu olduğunu kanıtlanabilir kılmak — statik `playwright test --list` çıktısı
 * veya bayat/SHA'sı uymayan bir snapshot ASLA "güncel PASS" gibi sunulamasın.
 *
 * DÜRÜSTLÜK SÖZLEŞMELERİ:
 * - `--list` (yalnız-listelenmiş) verisi runtime sonucu SAYILMAZ: gözlemlenen
 *   yürütme (results kaydı) yoksa verdict ≠ VERIFIED.
 * - Doğrulanabilir provenance zorunlu alanlar taşır: kaynak türü (sourceType),
 *   commit/head SHA, oluşturulma zamanı (generatedAt), gerçek execution kanıtı.
 *   CI için ayrıca run ID (requireRunId).
 * - Eksik/geçersiz provenance → UNVERIFIED (fail-closed). Tam ama güncel-değil
 *   (SHA uyuşmaz / bayat) → STALE. Yalnız hepsi tam+güncel ise → VERIFIED.
 * - Bu dosya SAF fonksiyon içerir (fs/CLI yan etkisi yok) → self-check tümünü
 *   sentetik fixture'larla, production'a bağlanmadan doğrular.
 */

/** Gerçek Playwright JSON koşumu için kanonik kaynak türü. */
export const RUNTIME_SOURCE_TYPE = 'playwright-json-run';

export const PROVENANCE_VERDICT = Object.freeze({
  VERIFIED: 'VERIFIED',
  STALE: 'STALE',
  UNVERIFIED: 'UNVERIFIED',
});

/** Varsayılan tazelik penceresi (saat). Bundan eski generatedAt → STALE. */
export const DEFAULT_MAX_AGE_HOURS = 36;

/** UNVERIFIED (provenance eksik/güvenilmez) yapan sebepler. */
const UNVERIFIED_REASONS = new Set([
  'sourcetype-missing-or-not-runtime',
  'commitsha-missing',
  'runid-missing',
  'no-observed-execution',
  'zero-selected',
  'generatedAt-missing-or-invalid',
]);

/**
 * Playwright `--list` çıktısını (koşum gibi sunulan yalnız-liste) tespit eder:
 * spec/test var ama HİÇBİR yerde gerçek `results` kaydı yok → yürütme olmamış.
 * @param {any} report Playwright JSON reporter/list çıktısı
 * @returns {boolean}
 */
export function isListedOnlyReport(report) {
  let specTests = 0;
  let resultRecords = 0;
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      for (const t of sp.tests || []) {
        specTests++;
        resultRecords += (t.results || []).length;
      }
    }
    for (const c of suite.suites || []) walk(c);
  };
  for (const s of (report && report.suites) || []) walk(s);
  return specTests > 0 && resultRecords === 0;
}

/** Ham Playwright raporundan toplam gözlemlenen yürütme denemesi (results) sayısı. */
export function countObservedAttempts(report) {
  let attempts = 0;
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      for (const t of sp.tests || []) attempts += (t.results || []).length;
    }
    for (const c of suite.suites || []) walk(c);
  };
  for (const s of (report && report.suites) || []) walk(s);
  return attempts;
}

/**
 * Bir runtime rapor MODELİNİN provenance'ını doğrular.
 *
 * @param {any} model buildResultModel çıktısı (source + runtime + generatedAt)
 * @param {object} [opts]
 * @param {string|null} [opts.expectedSha] beklenen commit/head SHA (ör. git HEAD)
 * @param {string|null} [opts.nowIso] "şimdi" (ISO); tazelik için
 * @param {number} [opts.maxAgeHours]
 * @param {boolean} [opts.requireRunId] CI-sınıfı: run ID zorunlu (varsayılan true)
 * @returns {{verdict:string, reasons:string[], observedExecution:boolean}}
 */
export function verifyRuntimeProvenance(model, opts = {}) {
  const {
    expectedSha = null,
    nowIso = null,
    maxAgeHours = DEFAULT_MAX_AGE_HOURS,
    requireRunId = true,
  } = opts;

  const reasons = [];
  const src = (model && model.source) || {};
  const rt = (model && model.runtime) || {};

  // 1) Kaynak türü — gerçek koşum mu?
  if (src.sourceType !== RUNTIME_SOURCE_TYPE) reasons.push('sourcetype-missing-or-not-runtime');

  // 2) Commit/head SHA mevcut mu?
  const sha = typeof src.commitSha === 'string' && src.commitSha ? src.commitSha : null;
  if (!sha) reasons.push('commitsha-missing');

  // 3) Run ID (CI-sınıfı doğrulanabilirlik).
  const runId = src.runId != null && String(src.runId) ? String(src.runId) : null;
  if (requireRunId && !runId) reasons.push('runid-missing');

  // 4) Gerçek execution kanıtı — listelenmiş-yalnız veri PASS sayılmaz.
  const observedAttempts = Number(rt.observedAttempts);
  const observedExecution = Number.isFinite(observedAttempts) && observedAttempts > 0;
  if (!observedExecution) reasons.push('no-observed-execution');
  if (!(Number(rt.selectedThisRun) > 0)) reasons.push('zero-selected');

  // 5) Oluşturulma zamanı geçerli mi + tazelik.
  const genIso = model && model.generatedAt ? String(model.generatedAt) : null;
  const genMs = genIso ? Date.parse(genIso) : NaN;
  if (!Number.isFinite(genMs)) reasons.push('generatedAt-missing-or-invalid');

  // 6) SHA eşleşmesi (STALE sınıfı).
  if (sha && expectedSha && sha !== expectedSha) reasons.push('sha-mismatch');

  // 7) Bayatlık (STALE sınıfı).
  if (Number.isFinite(genMs) && nowIso) {
    const nowMs = Date.parse(nowIso);
    if (Number.isFinite(nowMs)) {
      const ageHours = (nowMs - genMs) / 3_600_000;
      if (ageHours > maxAgeHours) reasons.push('stale-generatedAt');
    }
  }

  // Verdict önceliği: eksik/güvenilmez (UNVERIFIED) > güncel-değil (STALE) > VERIFIED.
  let verdict = PROVENANCE_VERDICT.VERIFIED;
  if (reasons.some((r) => UNVERIFIED_REASONS.has(r))) verdict = PROVENANCE_VERDICT.UNVERIFIED;
  else if (reasons.length) verdict = PROVENANCE_VERDICT.STALE;

  return { verdict, reasons, observedExecution };
}

/**
 * KOMMİTLENMİŞ (repo'daki) runtime raporunun dürüstlüğünü zorlar (fail-closed):
 * bayat/SHA-uyuşmaz/listelenmiş-yalnız bir rapor "güncel PASS" gibi SUNULAMAZ.
 *
 * Kural:
 * - Rapor gerçekten VERIFIED (SHA HEAD ile eşleşir, taze, gözlemlenen yürütme) → OK.
 * - Aksi halde OK YALNIZCA rapor kendini DÜRÜSTÇE STALE/UNVERIFIED ilan ederse
 *   (`model.provenance.verdict`). Sessiz/işaretsiz bayat rapor = maskeleme → throw.
 * - `provenance.verdict === 'VERIFIED'` ama canlı doğrulama VERIFIED değilse = yalan → throw.
 *
 * @param {any} model kommitlenmiş runtime rapor modeli
 * @param {object} opts { expectedSha, nowIso, maxAgeHours?, requireRunId? }
 * @returns {{verdict:string, declared:string|null, reasons:string[]}}
 */
export function assertCommittedReportHonest(model, opts = {}) {
  const live = verifyRuntimeProvenance(model, {
    requireRunId: false, // yerel koşum run ID taşımayabilir; SHA+execution+tazelik yeterli
    ...opts,
  });
  const declared =
    model && model.provenance && typeof model.provenance.verdict === 'string'
      ? model.provenance.verdict
      : null;

  if (live.verdict === PROVENANCE_VERDICT.VERIFIED) {
    // Taze ve doğrulanabilir. Yanlış bir STALE/UNVERIFIED ilanı zararsızdır.
    return { verdict: live.verdict, declared, reasons: live.reasons };
  }

  // Buradan sonra rapor doğrulanamıyor (STALE/UNVERIFIED).
  if (declared === PROVENANCE_VERDICT.VERIFIED) {
    const err = new Error(
      `Runtime rapor VERIFIED ilan ediyor ama doğrulanamıyor (${live.verdict}: ${live.reasons.join(', ')}).`
    );
    err.name = 'RuntimeProvenanceError';
    throw err;
  }
  if (declared !== PROVENANCE_VERDICT.STALE && declared !== PROVENANCE_VERDICT.UNVERIFIED) {
    const err = new Error(
      `Doğrulanamayan runtime rapor açıkça STALE/UNVERIFIED ilan etmeli (bulunan: ${declared ?? 'yok'}; ` +
        `sebep: ${live.reasons.join(', ')}). Bayat/işaretsiz rapor güncel PASS gibi sunulamaz.`
    );
    err.name = 'RuntimeProvenanceError';
    throw err;
  }
  return { verdict: live.verdict, declared, reasons: live.reasons };
}
