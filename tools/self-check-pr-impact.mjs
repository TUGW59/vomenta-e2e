// @ts-check
/**
 * PR-IMPACT SEÇİCİ SELF-CHECK — SERT KAPI (WP-CI-E1 / Faz 1).
 *
 * ADR-0010 §minimum sentetik matrisindeki 16 vakayı GERÇEK production çağrısı
 * yapmadan kanıtlar. Pozitif seçim kadar NEGATİF durumların (unknown runtime,
 * sourceMissing, orphan modül) gerçekten non-zero verdiğini de doğrular.
 *
 * Çalıştır:  node tools/self-check-pr-impact.mjs   (veya: npm run quality:ci-impact)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  planImpact,
  serializePlan,
  buildImportGraph,
  buildImportGraphFromSources,
  classifyFile,
} from './pr-impact-lib.mjs';

const root = process.cwd();
const cliPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'plan-pr-impact.mjs'
);

const failures = [];
let caseNo = 0;
const check = (label, cond, detail = '') => {
  caseNo += 1;
  if (!cond) failures.push(`Vaka ${caseNo} [${label}]: ${detail || 'başarısız'}`);
};

// Gerçek repodan tek seferlik grafik (page-object/fixture/contract vakaları için).
const graph = buildImportGraph({ root });
const plan = (changedFiles, extra = {}) =>
  planImpact({ changedFiles, root, graph, ...extra });

// 1) Public spec doğru projeyi seçer.
{
  const p = plan([{ path: 'tests/login.spec.js', status: 'M' }]);
  check(
    'public-spec',
    p.selected.publicSpecs.includes('tests/login.spec.js') &&
      p.selected.authenticatedSpecs.length === 0 &&
      p.exitCode === 0 &&
      p.status === 'RUNTIME_SELECTED',
    `status=${p.status} public=${JSON.stringify(p.selected.publicSpecs)}`
  );
}

// 2) Authenticated spec doğru projeyi seçer.
{
  const p = plan([{ path: 'tests/contacts.authed.spec.js', status: 'M' }]);
  check(
    'authed-spec',
    p.selected.authenticatedSpecs.includes('tests/contacts.authed.spec.js') &&
      p.selected.publicSpecs.length === 0 &&
      p.exitCode === 0,
    `authed=${JSON.stringify(p.selected.authenticatedSpecs)}`
  );
}

// 3) İki spec değişikliği duplicate üretmez.
{
  const p = plan([
    { path: 'tests/contacts.authed.spec.js', status: 'M' },
    { path: 'tests/pages/ContactsPage.js', status: 'M' },
  ]);
  const arr = p.selected.authenticatedSpecs;
  const occurrences = arr.filter((s) => s === 'tests/contacts.authed.spec.js').length;
  check(
    'no-duplicate',
    occurrences === 1 && arr.length === new Set(arr).size,
    `occurrences=${occurrences} arr=${JSON.stringify(arr)}`
  );
}

// 4) Page Object doğrudan + transitif kullanan spec'leri bulur.
{
  const leaf = plan([{ path: 'tests/pages/ContactsPage.js', status: 'M' }]);
  const base = plan([{ path: 'tests/pages/BasePage.js', status: 'M' }]);
  check(
    'page-object-direct',
    leaf.selected.authenticatedSpecs.includes('tests/contacts.authed.spec.js'),
    `direct=${JSON.stringify(leaf.selected.authenticatedSpecs)}`
  );
  check(
    'page-object-transitive',
    base.selected.authenticatedSpecs.length >= 5 &&
      base.selected.authenticatedSpecs.includes('tests/contacts.authed.spec.js'),
    `transitive count=${base.selected.authenticatedSpecs.length}`
  );
}

// 5) Shared fixture: geniş bağımlı kümesi + kritik fallback.
{
  const p = plan([{ path: 'tests/fixtures/test.js', status: 'M' }]);
  check(
    'shared-fixture-fallback',
    p.selected.authenticatedSpecs.length >= 10 &&
      p.fallbackSuites.includes('authed-critical'),
    `authed=${p.selected.authenticatedSpecs.length} fallback=${JSON.stringify(p.fallbackSuites)}`
  );
}

// 6) Contract/config → geniş güvenli fallback.
{
  const p = plan([{ path: 'playwright.config.js', status: 'M' }]);
  const has = ['route-baseline', 'route-quality', 'authed-critical'].every((s) =>
    p.fallbackSuites.includes(s)
  );
  check('config-broad-fallback', has && p.exitCode === 0, `fallback=${JSON.stringify(p.fallbackSuites)}`);
}

// 7) Docs-only → exit 0, NO_RUNTIME_REQUIRED.
{
  const p = plan([
    { path: 'README.md', status: 'M' },
    { path: 'docs/adr/0010-pr-impact-selection.md', status: 'A' },
    { path: '.env.example', status: 'M' },
  ]);
  check(
    'docs-only',
    p.status === 'NO_RUNTIME_REQUIRED' &&
      p.exitCode === 0 &&
      p.selectedRunnableSpecCount === 0 &&
      p.fallbackSuites.length === 0,
    `status=${p.status} runnable=${p.selectedRunnableSpecCount}`
  );
}

// 8) Mutation spec production runnable listesine GİRMEZ; STAGING_BLOCKED.
{
  const p = plan([{ path: 'tests/contacts-mutations.authed.spec.js', status: 'M' }]);
  check(
    'mutation-staging-blocked',
    p.stagingBlockedMutationSpecs.includes('tests/contacts-mutations.authed.spec.js') &&
      !p.selected.authenticatedSpecs.includes('tests/contacts-mutations.authed.spec.js') &&
      p.selected.publicSpecs.length === 0 &&
      p.status === 'STAGING_BLOCKED' &&
      p.exitCode === 0,
    `status=${p.status} blocked=${JSON.stringify(p.stagingBlockedMutationSpecs)}`
  );
}

// 9) Unknown runtime file → FAIL CLOSED (non-zero).
{
  const p = plan([{ path: 'Dockerfile', status: 'A' }]);
  check(
    'unknown-runtime-failclosed',
    p.unmappedRuntimeFiles.includes('Dockerfile') &&
      p.status === 'UNMAPPED_RUNTIME_CHANGE' &&
      p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 10a) Eksik base/head → sourceMissing + non-zero (kütüphane düzeyi).
{
  const p = planImpact({ changedFiles: [], root, graph, sourceMissing: true });
  check(
    'source-missing-lib',
    p.sourceMissing === true && p.status === 'SOURCE_MISSING' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 10b) Eksik base SHA → CLI gerçek git ile non-zero + sourceMissing dosyası.
{
  const outRel = 'test-results/pr-impact/selfcheck-sourcemissing.json';
  const absOut = path.join(root, outRel);
  let threw = false;
  try {
    execFileSync(
      'node',
      [cliPath, '--base', '0000000000000000000000000000000000000000', '--head', 'HEAD', '--out', outRel, '--root', root],
      { cwd: root, stdio: ['ignore', 'ignore', 'ignore'] }
    );
  } catch {
    threw = true;
  }
  let sourceMissing = false;
  try {
    sourceMissing = JSON.parse(readFileSync(absOut, 'utf8')).sourceMissing === true;
    rmSync(absOut, { force: true });
  } catch {
    /* dosya yoksa aşağıdaki check yakalar */
  }
  check('source-missing-cli', threw && sourceMissing, `threw=${threw} sourceMissing=${sourceMissing}`);
}

// 11) Rename/delete deterministik işlenir.
{
  const renamed = plan([
    { path: 'tests/contacts.authed.spec.js', status: 'R', oldPath: 'tests/old-name.authed.spec.js' },
  ]);
  const deletedSpec = plan([{ path: 'tests/contacts.authed.spec.js', status: 'D' }]);
  const deletedModule = plan([{ path: 'tests/pages/ContactsPage.js', status: 'D' }]);
  check(
    'rename-selects-new',
    renamed.selected.authenticatedSpecs.includes('tests/contacts.authed.spec.js'),
    `authed=${JSON.stringify(renamed.selected.authenticatedSpecs)}`
  );
  check(
    'delete-spec-not-selected',
    !deletedSpec.selected.authenticatedSpecs.includes('tests/contacts.authed.spec.js') &&
      deletedSpec.reasons.some((r) => r.startsWith('SPEC_DELETED:')),
    `authed=${JSON.stringify(deletedSpec.selected.authenticatedSpecs)}`
  );
  check(
    'delete-module-fallback',
    deletedModule.fallbackSuites.length > 0 &&
      deletedModule.reasons.some((r) => r.startsWith('DELETED_MODULE_FALLBACK:')),
    `fallback=${JSON.stringify(deletedModule.fallbackSuites)}`
  );
}

// 12) Windows yol ayıracı normalize edilir.
{
  const p = plan([{ path: 'tests\\contacts.authed.spec.js', status: 'M' }]);
  check(
    'windows-path-normalized',
    p.selected.authenticatedSpecs.includes('tests/contacts.authed.spec.js'),
    `authed=${JSON.stringify(p.selected.authenticatedSpecs)}`
  );
}

// 13) Import cycle sonsuz döngü üretmez (b ↔ c).
{
  const sources = {
    'tests/cyc.spec.js': "import { test } from './fixtures/test.js';\nimport './cyc-b.js';",
    'tests/cyc-b.js': "import './cyc-c.js';\nexport const b = 1;",
    'tests/cyc-c.js': "import './cyc-b.js';\nexport const c = 1;",
  };
  const g = buildImportGraphFromSources(sources);
  const p = planImpact({ changedFiles: [{ path: 'tests/cyc-c.js', status: 'M' }], graph: g });
  check(
    'import-cycle-safe',
    p.selected.publicSpecs.includes('tests/cyc.spec.js'),
    `public=${JSON.stringify(p.selected.publicSpecs)}`
  );
}

// 14) Çözülemeyen repo-içi import → warning + fallback (sessizce yok sayılmaz).
{
  const sources = {
    'tests/shared-x.js': 'export const x = 1;',
    'tests/y.spec.js':
      "import { test } from './fixtures/test.js';\nimport './shared-x.js';\nimport './does-not-exist.js';",
  };
  const g = buildImportGraphFromSources(sources);
  const p = planImpact({ changedFiles: [{ path: 'tests/shared-x.js', status: 'M' }], graph: g });
  check(
    'unresolved-import-warns',
    p.graphWarnings.some((w) => w.includes('does-not-exist.js')) &&
      p.fallbackSuites.length > 0 &&
      p.selected.publicSpecs.includes('tests/y.spec.js'),
    `warnings=${JSON.stringify(p.graphWarnings)} fallback=${JSON.stringify(p.fallbackSuites)}`
  );
}

// 15) Çıktıda absolute path / secret / PII bulunmaz.
{
  const p = plan([{ path: 'playwright.config.js', status: 'M' }]);
  const text = serializePlan(p);
  const abs = /\/(Users|home|private|var|tmp)\//.test(text) || /[A-Za-z]:\\/.test(text);
  const email = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const key = new RegExp('-----' + 'BEGIN').test(text);
  check('no-abs-no-secret', !abs && !email && !key, `abs=${abs} email=${email} key=${key}`);
}

// 16) Aynı girdi iki kez aynı JSON'u üretir (determinizm).
{
  const input = [
    { path: 'tests/contacts.authed.spec.js', status: 'M' },
    { path: 'tests/pages/BasePage.js', status: 'M' },
    { path: 'playwright.config.js', status: 'M' },
  ];
  const a = serializePlan(plan(input));
  const b = serializePlan(plan(input));
  check('deterministic', a === b, 'iki koşum farklı JSON üretti');
}

// Ek güvenlik: sınıflandırma tablosu beklenen sınıfları döndürür.
{
  const expect = {
    'tests/login.spec.js': 'public-spec',
    'tests/contacts.authed.spec.js': 'authed-spec',
    'tests/contacts-mutations.authed.spec.js': 'mutation-spec',
    'tests/voice-call.mutation.authed.spec.js': 'mutation-spec',
    'tests/mutation-orphans.authed.spec.js': 'mutation-spec',
    'tests/discovery/discovery.spec.js': 'discovery-spec',
    'tests/pages/ContactsPage.js': 'graph-module',
    'tests/fixtures/test.js': 'graph-module',
    'tests/contracts/navigation.js': 'contract',
    'tests/auth.setup.js': 'auth-setup',
    'config/environment.js': 'config',
    'playwright.config.js': 'config',
    'tools/plan-pr-impact.mjs': 'ci-tooling',
    '.github/workflows/playwright.yml': 'ci-tooling',
    'README.md': 'docs',
    '.env.example': 'docs',
    '.env.sample': 'docs',
    'tests/login.spec.js-snapshots/login.png': 'visual-snapshot',
    'Dockerfile': 'unknown-runtime',
  };
  const bad = Object.entries(expect).filter(([f, c]) => classifyFile(f) !== c);
  check(
    'classification-table',
    bad.length === 0,
    bad.map(([f, c]) => `${f}: beklenen ${c}, gelen ${classifyFile(f)}`).join('; ')
  );
}

// ─────────────────────────────── Sonuç ───────────────────────────────
if (failures.length > 0) {
  for (const f of failures) console.error('  ✗ ' + f);
  console.error(`\n${failures.length} PR-impact self-check ihlali (${caseNo} kontrol).`);
  process.exit(1);
}
console.log(`PR-impact seçici self-check geçti: ${caseNo} sentetik kontrol, production çağrısı yok.`);
