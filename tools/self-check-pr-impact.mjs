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
  AUTHED_PR_BUDGET,
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

// 3) İki spec değişikliği duplicate üretmez (bütçe-altı sentetik grafik → cap YOK).
{
  const sources = {
    'tests/x.authed.spec.js': "import './pages/XPage.js';",
    'tests/pages/XPage.js': 'export class X {}',
  };
  const g = buildImportGraphFromSources(sources);
  const p = planImpact({
    changedFiles: [
      { path: 'tests/x.authed.spec.js', status: 'M' },
      { path: 'tests/pages/XPage.js', status: 'M' },
    ],
    graph: g,
  });
  const arr = p.selected.authenticatedSpecs;
  const occurrences = arr.filter((s) => s === 'tests/x.authed.spec.js').length;
  check(
    'no-duplicate',
    occurrences === 1 && arr.length === new Set(arr).size,
    `occurrences=${occurrences} arr=${JSON.stringify(arr)}`
  );
}

// 4) Page Object doğrudan + transitif kullanan spec'leri bulur (bütçe-altı grafik).
{
  const sources = {
    'tests/a.authed.spec.js': "import './pages/APage.js';",
    'tests/b.authed.spec.js': "import './pages/APage.js';",
    'tests/pages/APage.js': "import './Base.js';\nexport class A {}",
    'tests/pages/Base.js': 'export class Base {}',
  };
  const g = buildImportGraphFromSources(sources);
  const direct = planImpact({ changedFiles: [{ path: 'tests/pages/APage.js', status: 'M' }], graph: g });
  const trans = planImpact({ changedFiles: [{ path: 'tests/pages/Base.js', status: 'M' }], graph: g });
  check(
    'page-object-direct',
    direct.selected.authenticatedSpecs.includes('tests/a.authed.spec.js') &&
      direct.selected.authenticatedSpecs.includes('tests/b.authed.spec.js'),
    `direct=${JSON.stringify(direct.selected.authenticatedSpecs)}`
  );
  check(
    'page-object-transitive',
    trans.selected.authenticatedSpecs.length === 2 &&
      trans.selected.authenticatedSpecs.includes('tests/a.authed.spec.js'),
    `transitive=${JSON.stringify(trans.selected.authenticatedSpecs)}`
  );
}

// 5) Broad-impact cap (ADR-0024): bütçeyi aşan authed fan-out → PR lane bounded
//    fallback + tam suite nightly'ye ERTELENİR (authed=0, deferred kaydedilir).
{
  // Sentetik: 1 paylaşılan modül + (bütçe+1) authed spec → cap tetiklenir.
  const sources = {};
  const overBudget = AUTHED_PR_BUDGET + 1;
  for (let i = 0; i < overBudget; i++) {
    sources[`tests/s${i}.authed.spec.js`] = "import './pages/Hub.js';";
  }
  sources['tests/pages/Hub.js'] = 'export class Hub {}';
  const g = buildImportGraphFromSources(sources);
  const capped = planImpact({ changedFiles: [{ path: 'tests/pages/Hub.js', status: 'M' }], graph: g });
  check(
    'broad-impact-cap',
    capped.selected.authenticatedSpecs.length === 0 &&
      capped.authedDeferredToNightly.length === overBudget &&
      ['route-baseline', 'authed-critical'].every((s) => capped.fallbackSuites.includes(s)) &&
      !capped.fallbackSuites.includes('route-quality') &&
      capped.reasons.some((r) => r.startsWith('BROAD_IMPACT_CAP:')) &&
      capped.exitCode === 0,
    `authed=${capped.selected.authenticatedSpecs.length} deferred=${capped.authedDeferredToNightly.length} fallback=${JSON.stringify(capped.fallbackSuites)}`
  );

  // Sınır: TAM bütçe kadar authed spec → cap YOK (doğrudan hedefli koşum).
  const atBudget = {};
  for (let i = 0; i < AUTHED_PR_BUDGET; i++) {
    atBudget[`tests/t${i}.authed.spec.js`] = "import './pages/Hub2.js';";
  }
  atBudget['tests/pages/Hub2.js'] = 'export class Hub2 {}';
  const g2 = buildImportGraphFromSources(atBudget);
  const notCapped = planImpact({ changedFiles: [{ path: 'tests/pages/Hub2.js', status: 'M' }], graph: g2 });
  check(
    'cap-boundary-not-capped',
    notCapped.selected.authenticatedSpecs.length === AUTHED_PR_BUDGET &&
      notCapped.authedDeferredToNightly.length === 0 &&
      !notCapped.reasons.some((r) => r.startsWith('BROAD_IMPACT_CAP:')),
    `authed=${notCapped.selected.authenticatedSpecs.length} deferred=${notCapped.authedDeferredToNightly.length}`
  );
}

// 5b) Gerçek repo paylaşılan modülü (BasePage ~tüm authed suite'e fan-out) → cap.
{
  const p = plan([{ path: 'tests/pages/BasePage.js', status: 'M' }]);
  check(
    'real-shared-module-capped',
    p.selected.authenticatedSpecs.length === 0 &&
      p.authedDeferredToNightly.length > AUTHED_PR_BUDGET &&
      p.fallbackSuites.includes('authed-critical') &&
      p.reasons.some((r) => r.startsWith('BROAD_IMPACT_CAP:')) &&
      p.exitCode === 0,
    `authed=${p.selected.authenticatedSpecs.length} deferred=${p.authedDeferredToNightly.length} fallback=${JSON.stringify(p.fallbackSuites)}`
  );
}

// 6) Contract/config → geniş güvenli fallback (route-quality HARİÇ: ayrı
//    authenticated-quality job'ında zaten koşulur → PR lane'de tekrar edilmez).
{
  const p = plan([{ path: 'playwright.config.js', status: 'M' }]);
  const has = ['route-baseline', 'authed-critical'].every((s) => p.fallbackSuites.includes(s));
  check(
    'config-broad-fallback',
    has && !p.fallbackSuites.includes('route-quality') && p.exitCode === 0,
    `fallback=${JSON.stringify(p.fallbackSuites)}`
  );
}

// 7) Docs-only → exit 0, NO_RUNTIME_REQUIRED.
{
  const p = plan([
    { path: 'README.md', status: 'M' },
    { path: 'docs/adr/0010-pr-impact-selection.md', status: 'A' },
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

// 8) Root .env deletion → successful security remediation.
{
  const p = plan([{ path: '.env', status: 'D' }]);
  check(
    'env-delete-security-remediation',
    p.status === 'SECURITY_REMEDIATION' &&
      p.exitCode === 0 &&
      p.selectedRunnableSpecCount === 0 &&
      p.reasons.some((r) => r.startsWith('SECURITY_REMEDIATION:')),
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 9) .env add/modify/rename → fail closed.
{
  const add = plan([{ path: '.env', status: 'A' }]);
  const mod = plan([{ path: '.env', status: 'M' }]);
  const rename = plan([{ path: '.env', status: 'R', oldPath: 'old.env' }]);
  check(
    'env-add-fail',
    add.status === 'ENV_POLICY_VIOLATION' && add.exitCode === 1,
    `status=${add.status} exit=${add.exitCode}`
  );
  check(
    'env-modify-fail',
    mod.status === 'ENV_POLICY_VIOLATION' && mod.exitCode === 1,
    `status=${mod.status} exit=${mod.exitCode}`
  );
  check(
    'env-rename-fail',
    rename.status === 'ENV_POLICY_VIOLATION' && rename.exitCode === 1,
    `status=${rename.status} exit=${rename.exitCode}`
  );
}

// 9a) .env deletion + generated docs → explicit quality/security-only plan.
{
  const p = plan([
    { path: '.env', status: 'D' },
    { path: 'docs/TEST_COVERAGE.md', status: 'M' },
    { path: 'docs/raporlar/YAPILAN-TESTLER.md', status: 'M' },
    { path: 'docs/raporlar/YAPILMAYAN-TESTLER.md', status: 'M' },
  ]);
  check(
    'env-delete-plus-generated-docs',
    p.status === 'QUALITY_ONLY' && p.exitCode === 0 && p.selectedRunnableSpecCount === 0,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 9b) .env deletion + tooling file → no unmapped fallback.
{
  const p = plan([{ path: '.env', status: 'D' }, { path: 'tools/pr-impact-lib.mjs', status: 'M' }]);
  check(
    'env-delete-plus-tooling-no-unmapped',
    p.exitCode === 0 && p.status === 'NO_RUNTIME_REQUIRED' && p.unmappedRuntimeFiles.length === 0,
    `status=${p.status} exit=${p.exitCode} unmapped=${JSON.stringify(p.unmappedRuntimeFiles)}`
  );
}

// 9c) .env deletion + PR #75 real scenario → planner should succeed.
{
  const p = plan([
    { path: '.env', status: 'D' },
    { path: 'tools/pr-impact-lib.mjs', status: 'M' },
    { path: 'tools/self-check-pr-impact.mjs', status: 'M' },
  ]);
  check(
    'env-delete-pr75-scenario',
    p.exitCode === 0 && p.status === 'NO_RUNTIME_REQUIRED' && p.unmappedRuntimeFiles.length === 0,
    `status=${p.status} exit=${p.exitCode} unmapped=${JSON.stringify(p.unmappedRuntimeFiles)}`
  );
}

// 9d) .env add/modify/rename + tooling → fail closed.
{
  const add = plan([{ path: '.env', status: 'A' }, { path: 'tools/pr-impact-lib.mjs', status: 'M' }]);
  const mod = plan([{ path: '.env', status: 'M' }, { path: 'tools/pr-impact-lib.mjs', status: 'M' }]);
  const rename = plan([{ path: '.env', status: 'R', oldPath: 'old.env' }, { path: 'tools/pr-impact-lib.mjs', status: 'M' }]);
  check('env-add-with-tooling-fail', add.status === 'ENV_POLICY_VIOLATION' && add.exitCode === 1, `status=${add.status} exit=${add.exitCode}`);
  check('env-modify-with-tooling-fail', mod.status === 'ENV_POLICY_VIOLATION' && mod.exitCode === 1, `status=${mod.status} exit=${mod.exitCode}`);
  check('env-rename-with-tooling-fail', rename.status === 'ENV_POLICY_VIOLATION' && rename.exitCode === 1, `status=${rename.status} exit=${rename.exitCode}`);
}

// 9e) .env deletion + unknown runtime → fail closed.
{
  const p = plan([{ path: '.env', status: 'D' }, { path: 'Dockerfile', status: 'A' }]);
  check(
    'env-delete-plus-unknown-runtime-fail',
    p.status === 'UNMAPPED_RUNTIME_CHANGE' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 9f) .env deletion + mutation spec → mutation policy preserved.
{
  const p = plan([{ path: '.env', status: 'D' }, { path: 'tests/contacts-mutations.authed.spec.js', status: 'M' }]);
  check(
    'env-delete-plus-mutation-policy',
    p.status === 'STAGING_BLOCKED' && p.exitCode === 0 && p.stagingBlockedMutationSpecs.includes('tests/contacts-mutations.authed.spec.js'),
    `status=${p.status} blocked=${JSON.stringify(p.stagingBlockedMutationSpecs)}`
  );
}

// 10) Only explicit generated docs files → explicit quality-only plan.
{
  const p = plan([
    { path: 'docs/TEST_COVERAGE.md', status: 'M' },
    { path: 'docs/raporlar/YAPILAN-TESTLER.md', status: 'M' },
    { path: 'docs/raporlar/YAPILMAYAN-TESTLER.md', status: 'M' },
  ]);
  check(
    'generated-docs-quality-only',
    p.status === 'QUALITY_ONLY' && p.exitCode === 0 && p.selectedRunnableSpecCount === 0,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 11) Random docs file → fail closed.
{
  const p = plan([{ path: 'docs/notes.md', status: 'M' }]);
  check(
    'random-docs-fail',
    p.status === 'QUALITY_ONLY_POLICY_VIOLATION' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 11a) Kanıt hattı planı + numaralı evidence-pipeline ADR'si birlikte (SALT docs/) →
//      izinli saf-doküman PR → NO_RUNTIME_REQUIRED, exit 0.
{
  const p = plan([
    { path: 'docs/EVIDENCE-PIPELINE-PLAN.md', status: 'A' },
    { path: 'docs/adr/0025-evidence-pipeline.md', status: 'A' },
  ]);
  check(
    'evidence-pipeline-docs-only-green',
    p.status === 'NO_RUNTIME_REQUIRED' &&
      p.exitCode === 0 &&
      p.selectedRunnableSpecCount === 0 &&
      p.fallbackSuites.length === 0,
    `status=${p.status} exit=${p.exitCode} runnable=${p.selectedRunnableSpecCount}`
  );
}

// 11b) Yalnız numaralı ADR (SALT docs/adr) → izinli → NO_RUNTIME_REQUIRED, exit 0.
{
  const p = plan([{ path: 'docs/adr/0023-auth-transient-gateway-resilience.md', status: 'A' }]);
  check(
    'numbered-adr-only-green',
    p.status === 'NO_RUNTIME_REQUIRED' && p.exitCode === 0 && p.selectedRunnableSpecCount === 0,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 11c) Yalnız kanıt hattı planı (SALT docs/) → izinli → NO_RUNTIME_REQUIRED, exit 0.
{
  const p = plan([{ path: 'docs/EVIDENCE-PIPELINE-PLAN.md', status: 'M' }]);
  check(
    'evidence-plan-only-green',
    p.status === 'NO_RUNTIME_REQUIRED' && p.exitCode === 0 && p.selectedRunnableSpecCount === 0,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 11d) Kontrolsüz docs/adr (numarasız) → HÂLÂ fail-closed (genel docs/adr/** izni YOK).
{
  const p = plan([{ path: 'docs/adr/notes.md', status: 'A' }]);
  check(
    'unnumbered-adr-fail',
    p.status === 'QUALITY_ONLY_POLICY_VIOLATION' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 11e) Numaralı ADR + rastgele docs birlikte → izinli-dışı dosya var → fail-closed.
{
  const p = plan([
    { path: 'docs/adr/0025-evidence-pipeline.md', status: 'A' },
    { path: 'docs/random-note.md', status: 'A' },
  ]);
  check(
    'allowed-adr-plus-random-docs-fail',
    p.status === 'QUALITY_ONLY_POLICY_VIOLATION' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 12) Generated docs + unknown runtime → fail closed (runtime var → quality-only DEĞİL;
//     bilinmeyen-runtime dosyası UNMAPPED ile fail-closed kalır).
{
  const p = plan([
    { path: 'docs/TEST_COVERAGE.md', status: 'M' },
    { path: 'Dockerfile', status: 'A' },
  ]);
  check(
    'generated-plus-unknown-fail',
    p.status === 'UNMAPPED_RUNTIME_CHANGE' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 12b) Üretilen doc + BEKLENMEDİK üretilen doc (surface) + gerçek authed spec →
//      quality-only DEĞİL; spec seçilir (WP-L2-WAVE-1 senaryosu: spec + doc regen).
{
  const p = plan([
    { path: 'docs/TEST_COVERAGE.md', status: 'M' },
    { path: 'docs/SURFACE-DEPTH-MATRIX.md', status: 'M' },
    { path: 'docs/adr/0014-l2-interaction-signal.md', status: 'A' },
    { path: 'tests/settings-interactions.authed.spec.js', status: 'A' },
  ]);
  check(
    'generated-plus-surface-plus-authed-spec',
    (p.status === 'RUNTIME_SELECTED' || p.status === 'FALLBACK_SELECTED') &&
      p.exitCode === 0 &&
      p.selected.authenticatedSpecs.includes('tests/settings-interactions.authed.spec.js'),
    `status=${p.status} authed=${JSON.stringify(p.selected.authenticatedSpecs)}`
  );
}

// 13) Generated docs + normal runtime test → runtime plan, not quality-only.
{
  const p = plan([
    { path: 'docs/TEST_COVERAGE.md', status: 'M' },
    { path: 'tests/login.spec.js', status: 'M' },
  ]);
  check(
    'generated-plus-runtime',
    p.status === 'RUNTIME_SELECTED' &&
      p.exitCode === 0 &&
      p.selected.publicSpecs.includes('tests/login.spec.js'),
    `status=${p.status} public=${JSON.stringify(p.selected.publicSpecs)}`
  );
}

// 14) Generated docs + mutation test → not quality-only.
{
  const p = plan([
    { path: 'docs/TEST_COVERAGE.md', status: 'M' },
    { path: 'tests/contacts-mutations.authed.spec.js', status: 'M' },
  ]);
  check(
    'generated-plus-mutation',
    p.status === 'STAGING_BLOCKED' && p.exitCode === 0,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 15) No explanation/empty plan → fail closed.
{
  const p = planImpact({ changedFiles: [], root, graph });
  check(
    'empty-plan-requires-explicit-reason',
    p.status === 'PLAN_EXPLAIN_REQUIRED' && p.exitCode === 1,
    `status=${p.status} exit=${p.exitCode}`
  );
}

// 16) Mutation spec production runnable listesine GİRMEZ; STAGING_BLOCKED.
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

// 17) Unknown runtime file → FAIL CLOSED (non-zero).
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
