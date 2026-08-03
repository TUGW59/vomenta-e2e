// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 2 — RUNTIME TREND GEÇMİŞİ YAZICISI (saf kütüphane).
 *
 * §item12: "önceki koşumla delta". Executive rapor (`executive-report-lib::computeTrend`)
 * ZATEN `docs/raporlar/history/executive-*.json` snapshotlarından delta üretir ve
 * <2 uygun snapshot varsa DÜRÜSTÇE INSUFFICIENT_HISTORY der; ama BİLEREK history'ye
 * YAZMAZ (sahte trend engeli). Eksik parça buydu: gerçek bir koşumun SONUNDA
 * sanitize edilmiş, executive-uyumlu bir snapshot yazan araç.
 *
 * Bu dosya saf/yan-etkisizdir; fs/CLI yan etkisi `append-runtime-history.mjs`tedir
 * → self-check tümünü sentetik fixture'larla doğrular.
 *
 * DÜRÜSTLÜK: Snapshot ancak commit SHA + run ID VARSA trend'e uygundur
 * (computeTrend ikisini de şart koşar). runId olmayan (yerel) koşum snapshot'ı
 * YAZILMAZ → yerel koşumlar sahte trend üretemez.
 */

/**
 * Runtime modelinden (TEST-SONUCLARI.json) executive-uyumlu trend snapshot'ı kurar.
 * @param {any} runtimeModel  buildResultModel çıktısı (parse'lı).
 * @param {number} executiveSchemaVersion  executive-report-lib SCHEMA_VERSION (eşleşmezse trend eler).
 * @returns {{schemaVersion:number, source:{commitSha:(string|null), runId:(string|null)}, generatedAt:(string|null), runtime:{routeStatusTotals:object}, failingTestKeys:string[]}}
 */
export function buildHistorySnapshot(runtimeModel, executiveSchemaVersion) {
  const src = (runtimeModel && runtimeModel.source) || {};
  const rt = (runtimeModel && runtimeModel.runtime) || {};
  const totals = rt.routeStatusTotals || {};
  const keys = Array.isArray(runtimeModel && runtimeModel.failingTestKeys) ? runtimeModel.failingTestKeys : [];
  return {
    schemaVersion: Number(executiveSchemaVersion),
    source: {
      commitSha: src.commitSha ? String(src.commitSha).slice(0, 40) : null,
      runId: src.runId ? String(src.runId).slice(0, 32) : null,
    },
    generatedAt: runtimeModel && runtimeModel.generatedAt ? String(runtimeModel.generatedAt).slice(0, 40) : null,
    runtime: {
      routeStatusTotals: {
        PASS: Number(totals.PASS) || 0,
        FAIL: Number(totals.FAIL) || 0,
        FLAKY: Number(totals.FLAKY) || 0,
        BLOCKED: Number(totals.BLOCKED) || 0,
        NOT_RUN: Number(totals.NOT_RUN) || 0,
      },
    },
    failingTestKeys: keys.map((k) => String(k).slice(0, 160)).sort(),
  };
}

/**
 * Snapshot trend'e UYGUN mu? computeTrend: aynı schemaVersion + commit SHA + run ID.
 * (Yerel koşumda runId genelde null → uygun değil → yazılmaz, sahte trend olmaz.)
 * @param {any} snapshot
 * @param {number} executiveSchemaVersion
 */
export function isEligibleForTrend(snapshot, executiveSchemaVersion) {
  return !!(
    snapshot &&
    Number(snapshot.schemaVersion) === Number(executiveSchemaVersion) &&
    snapshot.source &&
    snapshot.source.commitSha &&
    snapshot.source.runId
  );
}

/** Trend snapshot dosya adı (run ID bazlı, güvenli). runId yoksa fırlatır. */
export function historyFilename(snapshot) {
  const runId = snapshot && snapshot.source && snapshot.source.runId;
  if (!runId) throw new Error('historyFilename: runId olmadan snapshot yazılamaz.');
  const safeRun = String(runId).replace(/[^0-9A-Za-z_-]/g, '').slice(0, 32);
  if (!safeRun) throw new Error('historyFilename: runId sanitize sonrası boş.');
  return `executive-${safeRun}.json`;
}

/**
 * `executive-*.json` adlarını en YENİ N tanesi kalacak biçimde döndürür. runId
 * NÜMERİK ise sayısal, değilse leksik sıralanır (kısa/uzun runId karışmasın).
 * @param {string[]} filenames
 * @param {number} maxEntries
 * @returns {{keep:string[], remove:string[]}}
 */
export function rotateHistory(filenames, maxEntries) {
  const max = Math.max(1, Number(maxEntries) || 1);
  const names = (filenames || []).filter((n) => /^executive-.+\.json$/i.test(n));
  const rank = (n) => {
    const m = /^executive-(.+)\.json$/i.exec(n);
    const id = m ? m[1] : n;
    return /^\d+$/.test(id) ? Number(id) : id;
  };
  const sorted = names.slice().sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (typeof ra === 'number' && typeof rb === 'number') return ra - rb;
    return String(ra).localeCompare(String(rb));
  });
  const keep = sorted.slice(Math.max(0, sorted.length - max));
  const remove = sorted.slice(0, Math.max(0, sorted.length - max));
  return { keep, remove };
}

/** Snapshot metni (deterministik). */
export function serializeSnapshot(snapshot) {
  return JSON.stringify(snapshot, null, 2) + '\n';
}
