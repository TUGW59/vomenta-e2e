// @ts-check
/**
 * PR-IMPACT RUNNER — SAF KARAR KÜTÜPHANESİ (WP-CI-E2 / Faz 2).
 *
 * Faz 1'in ürettiği `selection.json` planını GERÇEK Playwright koşusuna çeviren
 * kararların TAMAMI burada saf fonksiyonlarla tanımlıdır. Bu dosya:
 *   - ağa çıkmaz, Playwright'ı çağırmaz, `process.exit` çağırmaz;
 *   - CLI (`run-pr-impact.mjs`) ve sentetik self-check tarafından tüketilir.
 *
 * Neden ayrık: negatif kanıt (0-test, flaky, mutation sızması, bozuk plan…)
 * PRODUCTION'a karşı değil, bu saf mantığa ENJEKTE edilmiş sahte gözlemlerle
 * kanıtlanır (handoff §2.6). Böylece kırılma kanıtı deterministik ve offline'dır.
 *
 * Savunma sırası:
 *   1) Şema doğrulama — bozuk/tamper edilmiş plan reddedilir.
 *   2) Karar — sourceMissing / unmapped / plan.exitCode!=0 → REFUSE (non-zero).
 *   3) Mutation son-savunması — seçili herhangi bir dosya mutation spec ise REFUSE.
 *   4) Grup yürütme yorumu — 0-test / unexpected / flaky → grup kırmızı.
 */
import {
  FALLBACK_SUITES,
  PROJECTS,
} from './pr-impact-lib.mjs';

export const RUNNER_SCHEMA_VERSION = 1;

/**
 * Seçim alanı → Playwright projesi + setup bağımlılığı (playwright.config.js ile
 * birebir). `setup` grubu hedef test sayısına KATILMAZ (runner sorumluluğu #6).
 */
export const RUN_GROUPS = Object.freeze([
  { field: 'publicSpecs', key: 'public', project: PROJECTS.public, setup: null },
  { field: 'authenticatedSpecs', key: 'authed', project: PROJECTS.authed, setup: 'setup' },
  { field: 'discoverySpecs', key: 'discovery', project: PROJECTS.discovery, setup: 'setup' },
]);

const isMutationSpecPath = (rel) =>
  /\.spec\.js$/.test(rel) &&
  /(?:\.mutation\.|-mutations?\.|(?:^|\/)mutation-orphans\.)/.test(rel);

const MUTATION_TAG = /@mutation/;

// ─────────────────────────────── Şema doğrulama ───────────────────────────────

/**
 * `selection.json` planını yapısal olarak doğrular. Metin araması değil; alan
 * tipleri denetlenir. Bozuk/tamper edilmiş plan burada yakalanır.
 * @param {any} plan
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateSelection(plan) {
  const errors = [];
  const isArr = (v) => Array.isArray(v);
  const isStrArr = (v) => isArr(v) && v.every((x) => typeof x === 'string');

  if (!plan || typeof plan !== 'object' || isArr(plan)) {
    return { ok: false, errors: ['plan bir nesne değil'] };
  }
  if (plan.schemaVersion !== 1) errors.push(`schemaVersion beklenen 1, gelen ${plan.schemaVersion}`);
  if (typeof plan.status !== 'string' || plan.status === '') errors.push('status eksik/boş');
  if (typeof plan.exitCode !== 'number') errors.push('exitCode sayı değil');
  if (typeof plan.sourceMissing !== 'boolean') errors.push('sourceMissing boolean değil');

  const sel = plan.selected;
  if (!sel || typeof sel !== 'object' || isArr(sel)) {
    errors.push('selected nesnesi eksik');
  } else {
    for (const g of RUN_GROUPS) {
      if (!isStrArr(sel[g.field])) errors.push(`selected.${g.field} string[] değil`);
    }
  }
  if (!isStrArr(plan.fallbackSuites)) errors.push('fallbackSuites string[] değil');
  if (!isStrArr(plan.stagingBlockedMutationSpecs)) errors.push('stagingBlockedMutationSpecs string[] değil');
  if (!isStrArr(plan.unmappedRuntimeFiles)) errors.push('unmappedRuntimeFiles string[] değil');
  if (typeof plan.selectedRunnableSpecCount !== 'number') errors.push('selectedRunnableSpecCount sayı değil');

  // Bilinmeyen fallback kimliği (tamper) reddet.
  if (isStrArr(plan.fallbackSuites)) {
    for (const id of plan.fallbackSuites) {
      if (!FALLBACK_SUITES[id]) errors.push(`bilinmeyen fallback suite: ${id}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ─────────────────────────────── Grup üretimi ───────────────────────────────

/**
 * Plandan yürütülecek grupları üretir. Her grup güvenli argument array'iyle
 * (shell interpolation YOK) Playwright'a verilecek biçimdedir.
 * @param {any} plan doğrulanmış selection planı
 * @returns {Array<{ key: string, kind: 'exact'|'fallback', project: string,
 *   setup: string|null, files: string[], grep: string|null, expected: number }>}
 */
export function buildRunGroups(plan) {
  const groups = [];
  for (const g of RUN_GROUPS) {
    const files = plan.selected[g.field] || [];
    if (files.length === 0) continue;
    groups.push({
      key: g.key,
      kind: 'exact',
      project: g.project,
      setup: g.setup,
      files: [...files],
      grep: null,
      expected: files.length, // her exact spec ≥1 test bekler (0-test → kırmızı)
    });
  }
  for (const id of plan.fallbackSuites || []) {
    const suite = FALLBACK_SUITES[id];
    if (!suite) continue; // validateSelection zaten reddeder; savunma
    groups.push({
      key: `fallback:${id}`,
      kind: 'fallback',
      project: suite.project,
      // fallback exact dosya listesi authed → setup; public grep → setup yok.
      setup: suite.project === PROJECTS.public ? null : 'setup',
      files: suite.files ? [...suite.files] : [],
      grep: suite.grep || null,
      // grep-only fallback için hedef bilinmez (güvenlik ağı) → 0-test uyarı, kırmızı değil.
      expected: suite.files ? suite.files.length : 0,
    });
  }
  return groups;
}

/**
 * Mutation son-savunması: hiçbir grupta mutation spec dosyası veya @mutation grep
 * olamaz (runner sorumluluğu #9). İhlal → yürütülMEmesi gereken hata.
 * @param {ReturnType<typeof buildRunGroups>} groups
 * @returns {string[]} ihlal mesajları (boşsa temiz)
 */
export function assertNoMutation(groups) {
  const violations = [];
  for (const grp of groups) {
    for (const f of grp.files) {
      if (isMutationSpecPath(f)) violations.push(`mutation spec grupta: ${grp.key} → ${f}`);
    }
    if (grp.grep && MUTATION_TAG.test(grp.grep)) {
      violations.push(`@mutation grep grupta: ${grp.key} → ${grp.grep}`);
    }
  }
  return violations;
}

// ─────────────────────────────── Üst-düzey karar ───────────────────────────────

/**
 * Plandan yürütme kararını üretir. Playwright'ı ÇAĞIRMAZ; yalnız ne yapılacağını
 * söyler. CLI bu kararı alır, gerçek koşuyu yapar.
 *
 * @param {any} rawPlan
 * @returns {{
 *   decision: 'REFUSE'|'NOOP'|'RUN',
 *   reason: string,
 *   exitCode: number,
 *   groups: ReturnType<typeof buildRunGroups>,
 *   expectedRunnableSpecCount: number,
 * }}
 */
export function planRun(rawPlan) {
  const { ok, errors } = validateSelection(rawPlan);
  if (!ok) {
    return {
      decision: 'REFUSE',
      reason: `INVALID_SELECTION: ${errors.join('; ')}`,
      exitCode: 1,
      groups: [],
      expectedRunnableSpecCount: 0,
    };
  }

  // Planner fail-closed durumları → runner da koşmayı reddeder (non-zero).
  if (rawPlan.sourceMissing === true) {
    return { decision: 'REFUSE', reason: 'SOURCE_MISSING', exitCode: 1, groups: [], expectedRunnableSpecCount: 0 };
  }
  if ((rawPlan.unmappedRuntimeFiles || []).length > 0) {
    return {
      decision: 'REFUSE',
      reason: `UNMAPPED_RUNTIME_CHANGE: ${rawPlan.unmappedRuntimeFiles.join(', ')}`,
      exitCode: 1,
      groups: [],
      expectedRunnableSpecCount: 0,
    };
  }
  if (rawPlan.exitCode !== 0) {
    return { decision: 'REFUSE', reason: `PLANNER_NONZERO:${rawPlan.status}`, exitCode: 1, groups: [], expectedRunnableSpecCount: 0 };
  }

  const groups = buildRunGroups(rawPlan);

  // Mutation son-savunması — sınıflandırma yanlışsa bile prod'a mutation girmez.
  const mut = assertNoMutation(groups);
  if (mut.length > 0) {
    return { decision: 'REFUSE', reason: `MUTATION_LEAK: ${mut.join('; ')}`, exitCode: 1, groups: [], expectedRunnableSpecCount: 0 };
  }

  const expectedRunnableSpecCount = groups
    .filter((g) => g.kind === 'exact')
    .reduce((n, g) => n + g.files.length, 0);

  // Çalıştırılacak hiçbir grup yoksa (yalnız docs/mutation/staging) → NOOP.
  if (groups.length === 0) {
    return {
      decision: 'NOOP',
      reason: `NO_RUNTIME:${rawPlan.status}`,
      exitCode: 0,
      groups: [],
      expectedRunnableSpecCount: 0,
    };
  }

  return {
    decision: 'RUN',
    reason: `RUN:${groups.length} grup`,
    exitCode: 0,
    groups,
    expectedRunnableSpecCount,
  };
}

// ─────────────────────────── Grup sonucu yorumu ───────────────────────────

/**
 * Bir grubun gözlenen sonucunu (Playwright'tan) yorumlar.
 *
 * `observed`:
 *   - listedCount: koşumdan ÖNCE `--list` ile bulunan HEDEF test sayısı
 *                  (setup/dependency HARİÇ).
 *   - exitCode:    Playwright'ın grup için döndürdüğü çıkış kodu.
 *   - stats:       { expected, unexpected, flaky, skipped } (setup HARİÇ hedef).
 *
 * Kurallar (fail-closed):
 *   - exact grup listedCount==0 → ZERO_TEST (kırmızı). Planner runnable beklerken
 *     runner 0 test bulursa sahte-yeşil engellenir (handoff §2.6.2).
 *   - stats.unexpected>0 → kırmızı.
 *   - stats.flaky>0 → kırmızı (retry flaky'yi başarıya çevirmez, sorumluluk #8).
 *   - exitCode!=0 → kırmızı.
 *
 * @param {{ key: string, kind: string, expected: number, files: string[], grep: string|null }} group
 * @param {{ listedCount: number, exitCode: number, stats?: { expected?: number, unexpected?: number, flaky?: number, skipped?: number } }} observed
 * @returns {{ key: string, passed: boolean, reason: string, listedCount: number,
 *   ran: number, unexpected: number, flaky: number }}
 */
export function interpretGroup(group, observed) {
  const listedCount = Number(observed.listedCount || 0);
  const stats = observed.stats || {};
  const unexpected = Number(stats.unexpected || 0);
  const flaky = Number(stats.flaky || 0);
  const ran = Number(stats.expected || 0) + unexpected + flaky;

  const fail = (reason) => ({ key: group.key, passed: false, reason, listedCount, ran, unexpected, flaky });

  // 0-test kapısı: exact grup (ya da dosyalı fallback) test bulamazsa kırmızı.
  const expectsTests = group.kind === 'exact' || group.files.length > 0;
  if (expectsTests && listedCount === 0) return fail('ZERO_TEST_SELECTION');
  if (unexpected > 0) return fail(`UNEXPECTED_FAILURES:${unexpected}`);
  if (flaky > 0) return fail(`FLAKY_NOT_PASS:${flaky}`);
  if (observed.exitCode !== 0) return fail(`NONZERO_EXIT:${observed.exitCode}`);

  return { key: group.key, passed: true, reason: 'OK', listedCount, ran, unexpected, flaky };
}

/**
 * Grup yorumlarını toplar. Herhangi biri kırmızıysa genel çıkış non-zero
 * (runner sorumluluğu #7). Ayrıca güvenli (secretsiz) özet satırları üretir.
 * @param {Array<ReturnType<typeof interpretGroup>>} interpreted
 * @returns {{ overallExitCode: number, allGreen: boolean, lines: string[] }}
 */
export function aggregate(interpreted) {
  const lines = [];
  let allGreen = true;
  for (const r of interpreted) {
    if (!r.passed) allGreen = false;
    lines.push(
      `${r.passed ? 'PASS' : 'FAIL'} ${r.key} — listed=${r.listedCount} ran=${r.ran} ` +
        `unexpected=${r.unexpected} flaky=${r.flaky} (${r.reason})`
    );
  }
  return { overallExitCode: allGreen ? 0 : 1, allGreen, lines };
}
