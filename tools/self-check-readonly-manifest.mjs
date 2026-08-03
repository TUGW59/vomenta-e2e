// @ts-check
/**
 * READ-ONLY MANİFEST + SEÇİCİ SELF-CHECK — SERT KAPI (ADR-0015, FAZ 1).
 *
 * Tamamen sentetik + gerçek-kaynak karışımı; ağa/production'a dokunmaz, test
 * KOŞMAZ. Doğruladıkları:
 *   A) Gerçek disk manifesti kurulur + değişmezleri geçer.
 *   B) Determinizm: aynı HEAD → bit-bit aynı serileştirme.
 *   C) Drift: committed READONLY-MANIFEST.json/.md taze üretimle birebir.
 *   D) Pozitif güvenlik: production seçimleri mutation/external-cost içermez.
 *   E) Negatif matris (HANDOFF FAZ 1 §"Negatif/self-check matrisi", 10 madde).
 *
 * Çalıştır:  node tools/self-check-readonly-manifest.mjs  (npm run quality:readonly-manifest)
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  EFFECT,
  ENVIRONMENT,
  AUTH,
  PROFILE_NAMES,
  classifySpec,
  buildManifest,
  validateManifest,
  selectProfile,
  serializeManifest,
  renderManifestMarkdown,
  assertNoExecutedClaim,
} from './readonly-manifest-lib.mjs';
import { buildFromDisk, diskSpecFiles } from './generate-readonly-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = resolve(root, 'docs/raporlar/READONLY-MANIFEST.json');
const MD_OUT = resolve(root, 'docs/raporlar/READONLY-MANIFEST.md');

const errors = [];
const check = (name, fn) => {
  try {
    fn();
  } catch (e) {
    errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
};

// Yardımcı: minimal manifest kaydı üretici (poison senaryoları için).
const entry = (over = {}) => ({
  id: over.id || over.pathPattern || 'tests/x.authed.spec.js',
  pathPattern: over.pathPattern || over.id || 'tests/x.authed.spec.js',
  kind: 'authed',
  effect: EFFECT.READ_ONLY,
  auth: AUTH.AUTHENTICATED,
  authRole: 'default',
  environment: ENVIRONMENT.BOTH,
  projects: ['chromium-authed', 'firefox-authed', 'webkit-authed'],
  surface: 'other',
  routes: [],
  capabilities: ['auth:default'],
  timeoutClass: 'default',
  artifactClass: 'sanitized-bundle',
  lifecycleMode: null,
  owningPackage: 'vomenta-e2e',
  exclusionReason: null,
  ...over,
});
const manifestOf = (entries) => ({
  schemaVersion: 1,
  sources: [],
  counts: {},
  entries,
});

// ───────────────────────── A) Gerçek manifest + değişmezler ─────────────────────────
let realManifest;
check('A.build+validate', () => {
  realManifest = buildFromDisk(); // içinde validateManifest çağrılır
  assert.ok(realManifest.entries.length > 0, 'manifest boş.');
  assert.ok(
    realManifest.counts.productionSafeReadOnly > 0,
    'production-safe read-only spec 0.'
  );
  // Aritmetik tutarlılık.
  const { totalSpecs, productionSafeReadOnly, mutationExcluded, externalCostExcluded } =
    realManifest.counts;
  assert.equal(
    totalSpecs,
    productionSafeReadOnly + mutationExcluded + externalCostExcluded,
    'sayı tutarsız: total ≠ readonly + mutation + external-cost.'
  );
});

// ───────────────────────── B) Determinizm ─────────────────────────
check('B.deterministic', () => {
  const a = serializeManifest(buildFromDisk());
  const b = serializeManifest(buildFromDisk());
  assert.equal(a, b, 'aynı HEAD iki üretim farklı (deterministik değil).');
});

// ───────────────────────── C) Drift (committed snapshot) ─────────────────────────
check('C.drift.json', () => {
  const fresh = serializeManifest(realManifest || buildFromDisk());
  let committed;
  try {
    committed = readFileSync(JSON_OUT, 'utf8');
  } catch {
    throw new Error(
      'READONLY-MANIFEST.json yok — `npm run report:readonly-manifest` çalıştırıp commit\'leyin.'
    );
  }
  assert.equal(committed, fresh, 'READONLY-MANIFEST.json drift (regenerate + commit).');
});
check('C.drift.md', () => {
  const fresh = renderManifestMarkdown(realManifest || buildFromDisk());
  let committed;
  try {
    committed = readFileSync(MD_OUT, 'utf8');
  } catch {
    throw new Error('READONLY-MANIFEST.md yok — regenerate + commit.');
  }
  assert.equal(committed, fresh, 'READONLY-MANIFEST.md drift (regenerate + commit).');
});

// ───────────────────────── D) Pozitif güvenlik: seçimler read-only ─────────────────────────
check('D.selections-safe', () => {
  const m = realManifest || buildFromDisk();
  const readOnlyIds = new Set(
    m.entries.filter((e) => e.effect === EFFECT.READ_ONLY).map((e) => e.pathPattern)
  );
  for (const name of PROFILE_NAMES) {
    const sel = selectProfile(m, name, { isProduction: true });
    assertNoExecutedClaim(sel);
    assert.ok(sel.selectedSpecFileCount > 0, `${name}: 0 seçim.`);
    for (const f of sel.selectedSpecFiles) {
      assert.ok(readOnlyIds.has(f), `${name}: seçim read-only olmayan spec içeriyor: ${f}`);
    }
  }
  // readonly-full-chromium = tüm read-only chromium-authed spec dosyaları.
  const full = selectProfile(m, 'readonly-full-chromium', { isProduction: true });
  const expected = m.entries
    .filter((e) => e.effect === EFFECT.READ_ONLY && e.projects.includes('chromium-authed'))
    .map((e) => e.pathPattern)
    .sort();
  assert.deepEqual(full.selectedSpecFiles, expected, 'readonly-full seçimi beklenenle eşleşmiyor.');
});

// ───────────────────────── E) Negatif matris (10) ─────────────────────────

// #1 Mutation spec bir production profilinin AÇIK kapsamına girerse → fail.
// (route-baseline profili registered-routes-smoke dosyasını açıkça hedefler.)
check('E1.mutation-into-profile', () => {
  const poisoned = manifestOf([
    entry({
      pathPattern: 'tests/registered-routes-smoke.authed.spec.js',
      effect: EFFECT.MUTATION,
      environment: ENVIRONMENT.STAGING,
      projects: ['chromium-authed'],
      exclusionReason: 'x',
    }),
  ]);
  assert.throws(
    () => selectProfile(poisoned, 'route-baseline-chromium', { isProduction: true }),
    /PROFILE_SELECTS_UNSAFE/
  );
});

// #2 External-cost spec bir production profilinin AÇIK kapsamına girerse → fail.
check('E2.external-cost-into-profile', () => {
  const poisoned = manifestOf([
    entry({
      pathPattern: 'tests/registered-routes-smoke.authed.spec.js',
      effect: EFFECT.EXTERNAL_COST,
      environment: ENVIRONMENT.STAGING,
      projects: ['chromium-authed'],
      exclusionReason: 'x',
    }),
  ]);
  assert.throws(
    () => selectProfile(poisoned, 'route-baseline-chromium', { isProduction: true }),
    /PROFILE_SELECTS_UNSAFE/
  );
});

// #2b Grep-tabanlı geniş profilde mutation SESSİZCE değil, effect ile dışlanır
// (seçime hiç girmez) — pozitif güvenlik D bölümünde de doğrulanır.
check('E2b.grep-excludes-mutation-silently-safe', () => {
  const m = manifestOf([
    entry({ pathPattern: 'tests/ro.authed.spec.js' }),
    entry({
      pathPattern: 'tests/w-mutations.authed.spec.js',
      effect: EFFECT.MUTATION,
      environment: ENVIRONMENT.STAGING,
      projects: ['chromium-authed'],
      exclusionReason: 'x',
    }),
  ]);
  const sel = selectProfile(m, 'readonly-full-chromium', { isProduction: true });
  assert.deepEqual(sel.selectedSpecFiles, ['tests/ro.authed.spec.js']);
});

// #3 Yeni etiketsiz/konvansiyon-dışı spec → classify fail-closed.
check('E3.unclassified-spec', () => {
  assert.throws(() => classifySpec('tests/whatever.spec.js'), /UNCLASSIFIED_SPEC/);
  assert.throws(() => classifySpec('tests/foo-bar.spec.js'), /UNCLASSIFIED_SPEC/);
});

// #4 Manifestte olup diskte olmayan spec → fail.
check('E4.manifest-not-on-disk', () => {
  const m = manifestOf([entry({ pathPattern: 'tests/ghost.authed.spec.js' })]);
  assert.throws(
    () => validateManifest(m, { diskSpecFiles: [], knownRoutes: [] }),
    /MANIFEST_SPEC_NOT_ON_DISK/
  );
});

// #5 Diskte olup manifestte olmayan spec → fail.
check('E5.disk-not-in-manifest', () => {
  const m = manifestOf([entry({ pathPattern: 'tests/a.authed.spec.js' })]);
  assert.throws(
    () =>
      validateManifest(m, {
        diskSpecFiles: ['tests/a.authed.spec.js', 'tests/b.authed.spec.js'],
        knownRoutes: [],
      }),
    /DISK_SPEC_NOT_IN_MANIFEST/
  );
});

// #6 Duplicate stable id → fail.
check('E6.duplicate-id', () => {
  const m = manifestOf([
    entry({ id: 'dup', pathPattern: 'tests/a.authed.spec.js' }),
    entry({ id: 'dup', pathPattern: 'tests/b.authed.spec.js' }),
  ]);
  assert.throws(
    () =>
      validateManifest(m, {
        diskSpecFiles: ['tests/a.authed.spec.js', 'tests/b.authed.spec.js'],
        knownRoutes: [],
      }),
    /DUPLICATE_STABLE_ID/
  );
});

// #7 Bilinmeyen rota/yüzey → fail.
check('E7.unknown-route', () => {
  const m = manifestOf([
    entry({ pathPattern: 'tests/a.authed.spec.js', routes: ['/not-registered'] }),
  ]);
  assert.throws(
    () =>
      validateManifest(m, {
        diskSpecFiles: ['tests/a.authed.spec.js'],
        knownRoutes: ['/'],
      }),
    /UNKNOWN_ROUTE/
  );
});

// #8 Güvenli profil seçimi 0 → fail.
check('E8.zero-selection', () => {
  // chromium-authed projesi olmayan tek kayıt → readonly-full 0 seçer.
  const m = manifestOf([
    entry({ pathPattern: 'tests/login.spec.js', auth: AUTH.PUBLIC, projects: ['chromium'] }),
  ]);
  assert.throws(
    () => selectProfile(m, 'readonly-full-chromium', { isProduction: true }),
    /PROFILE_ZERO_SELECTION/
  );
});

// #9 --list sonucu "executed" gibi sunulamaz.
check('E9.no-executed-claim', () => {
  assert.throws(() => assertNoExecutedClaim({ executed: 5 }), /EXECUTED_CLAIM_FORBIDDEN/);
  assert.throws(() => assertNoExecutedClaim({ passed: 1 }), /EXECUTED_CLAIM_FORBIDDEN/);
  // Gerçek seçim çıktısında böyle bir alan olmamalı.
  const sel = selectProfile(realManifest || buildFromDisk(), 'readonly-full-chromium', {
    isProduction: true,
  });
  assert.doesNotThrow(() => assertNoExecutedClaim(sel));
  assert.ok(!('executed' in sel) && !('passed' in sel), 'seçim executed/passed içeriyor.');
});

// #10 Production profili staging env gerektiriyorsa → fail.
check('E10.production-requires-staging', () => {
  // read-only ama environment=staging (çelişki) → production seçimi reddeder.
  const poisoned = manifestOf([
    entry({
      pathPattern: 'tests/weird.authed.spec.js',
      effect: EFFECT.READ_ONLY,
      environment: ENVIRONMENT.STAGING,
      projects: ['chromium-authed'],
    }),
  ]);
  assert.throws(
    () => selectProfile(poisoned, 'readonly-full-chromium', { isProduction: true }),
    /PROFILE_REQUIRES_STAGING/
  );
  // validate de bu çelişkiyi bağımsız yakalar.
  assert.throws(
    () =>
      validateManifest(poisoned, {
        diskSpecFiles: ['tests/weird.authed.spec.js'],
        knownRoutes: [],
      }),
    /READONLY_STAGING_ONLY_CONTRADICTION/
  );
});

// Bonus: INVALID_PROFILE fail-closed.
check('E.invalid-profile', () => {
  assert.throws(
    () => selectProfile(realManifest || buildFromDisk(), 'nope', { isProduction: true }),
    /INVALID_PROFILE/
  );
});

// Bonus: disk envanteri boş değil (walkSpecFiles sağlığı).
check('E.disk-nonempty', () => {
  assert.ok(diskSpecFiles().length > 0, 'disk spec envanteri boş.');
});

// ─────────────────────────────── Sonuç ───────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} read-only manifest self-check ihlali.`);
  process.exit(1);
}
const m = realManifest || buildFromDisk();
console.log(
  `Read-only manifest self-check geçti: ${m.counts.totalSpecs} spec ` +
    `(${m.counts.productionSafeReadOnly} production-safe), ${PROFILE_NAMES.length} profil, ` +
    'determinizm + drift + 10-madde negatif matris yeşil.'
);
