// @ts-check
/**
 * PR-IMPACT RUNNER SELF-CHECK — SERT KAPI (WP-CI-E2 / Faz 2).
 *
 * Handoff §2.6'daki 8 NEGATİF durumun gerçekten non-zero verdiğini ve pozitif
 * durumların 0 verdiğini PRODUCTION'a dokunmadan kanıtlar. Karar mantığı saf
 * kütüphanededir (`pr-impact-runner-lib.mjs`); burada ona sentetik plan/gözlem
 * enjekte edilir. Playwright çağrılmaz.
 *
 * Çalıştır:  node tools/self-check-pr-impact-runner.mjs  (npm run quality:ci-runner)
 */
import { planImpact, buildImportGraph, buildImportGraphFromSources } from './pr-impact-lib.mjs';
import {
  planRun,
  interpretGroup,
  aggregate,
  validateSelection,
  buildRunGroups,
  shardGroups,
  classifyFailure,
  planRetry,
  MAX_ATTEMPTS_PER_TEST,
} from './pr-impact-runner-lib.mjs';

const root = process.cwd();
const graph = buildImportGraph({ root });
const plan = (changedFiles, extra = {}) => planImpact({ changedFiles, root, graph, ...extra });

const failures = [];
const negTable = []; // exit-code kanıt tablosu
let caseNo = 0;
const check = (label, cond, detail = '') => {
  caseNo += 1;
  if (!cond) failures.push(`Vaka ${caseNo} [${label}]: ${detail || 'başarısız'}`);
};
/** Negatif kanıt: beklenen exit 1'i kaydeder ve doğrular. */
const expectNonZero = (id, label, exitCode, detail = '') => {
  negTable.push({ id, label, exit: exitCode });
  check(label, exitCode === 1, `beklenen exit 1, gelen ${exitCode} — ${detail}`);
};

// Geçerli baz plan (pozitif) — gerçek grafik üstünden bir authed spec.
const validAuthedPlan = plan([{ path: 'tests/contacts.authed.spec.js', status: 'M' }]);

// ─────────────────────────── POZİTİF temel ───────────────────────────

// P1) Geçerli authed seçim → RUN, doğru proje grubu, exact spec taşınır.
{
  const d = planRun(validAuthedPlan);
  const authed = d.groups.find((g) => g.key === 'authed');
  check(
    'valid-run-decision',
    d.decision === 'RUN' &&
      d.exitCode === 0 &&
      !!authed &&
      authed.project === 'chromium-authed' &&
      authed.files.includes('tests/contacts.authed.spec.js'),
    `decision=${d.decision} groups=${d.groups.map((g) => g.key).join(',')}`
  );
}

// P2) Geçen grup → aggregate exit 0.
{
  const r = interpretGroup(
    { key: 'authed', kind: 'exact', expected: 1, files: ['tests/contacts.authed.spec.js'], grep: null },
    { listedCount: 3, exitCode: 0, stats: { expected: 3, unexpected: 0, flaky: 0, skipped: 0 } }
  );
  const agg = aggregate([r]);
  check('passing-group-green', r.passed && agg.overallExitCode === 0, `reason=${r.reason} exit=${agg.overallExitCode}`);
}

// P3) Docs-only plan → NOOP, exit 0 (production runtime yok).
{
  const docs = plan([{ path: 'README.md', status: 'M' }]);
  const d = planRun(docs);
  check(
    'docs-noop',
    d.decision === 'NOOP' && d.exitCode === 0 && d.groups.length === 0,
    `decision=${d.decision} groups=${d.groups.length}`
  );
}

// P4) Page Object → bağlı spec grubu (bütçe-altı sentetik grafik → cap YOK).
{
  const g = buildImportGraphFromSources({
    'tests/c.authed.spec.js': "import './pages/CPage.js';",
    'tests/pages/CPage.js': 'export class C {}',
  });
  const po = planImpact({ changedFiles: [{ path: 'tests/pages/CPage.js', status: 'M' }], root, graph: g });
  const d = planRun(po);
  const authed = d.groups.find((gr) => gr.key === 'authed');
  check(
    'page-object-maps-to-spec',
    d.decision === 'RUN' && !!authed && authed.files.includes('tests/c.authed.spec.js'),
    `groups=${d.groups.map((gr) => gr.key).join(',')}`
  );
}

// P4b) Broad-impact capped plan (ADR-0024) → runner bounded fallback GRUPLARINI
//      koşar; authed exact grubu OLMAZ (tam suite nightly'ye ertelendi).
{
  const po = plan([{ path: 'tests/pages/BasePage.js', status: 'M' }]); // gerçek grafik → cap
  const d = planRun(po);
  const groupKeys = d.groups.map((gr) => gr.key);
  const hasFallbacks = ['fallback:route-baseline', 'fallback:authed-critical']
    .every((k) => groupKeys.includes(k)) && !groupKeys.includes('fallback:route-quality');
  check(
    'capped-plan-runs-bounded-fallback',
    d.decision === 'RUN' &&
      po.selected.authenticatedSpecs.length === 0 &&
      po.authedDeferredToNightly.length > 0 &&
      hasFallbacks &&
      !groupKeys.includes('authed'),
    `groups=${groupKeys.join(',')}`
  );
}

// ─────────────────────────── NEGATİF kanıtlar (§2.6) ───────────────────────────

// N1) Seçili spec içinde sentetik assertion fail → grup kırmızı → exit 1.
{
  const r = interpretGroup(
    { key: 'authed', kind: 'exact', expected: 2, files: ['tests/contacts.authed.spec.js'], grep: null },
    { listedCount: 2, exitCode: 1, stats: { expected: 1, unexpected: 1, flaky: 0, skipped: 0 } }
  );
  const agg = aggregate([r]);
  expectNonZero('N1', 'synthetic-assertion-fail', agg.overallExitCode, `reason=${r.reason}`);
}

// N2) Planner runnable beklerken runner 0 test bulur → exit 1.
{
  const r = interpretGroup(
    { key: 'authed', kind: 'exact', expected: 1, files: ['tests/contacts.authed.spec.js'], grep: null },
    { listedCount: 0, exitCode: 0, stats: {} }
  );
  const agg = aggregate([r]);
  expectNonZero('N2', 'zero-test-selection', agg.overallExitCode, `reason=${r.reason}`);
}

// N3) Değişen spec'in plan çıktısından kasıtlı çıkarılması → uçtan-uca bağ kanıtı.
// Planner değişen authed spec'i grup dosyalarına TAŞIMALI; çıkarılırsa bu kırmızı olur.
{
  const d = planRun(validAuthedPlan);
  const authed = d.groups.find((g) => g.key === 'authed');
  const carried = !!authed && authed.files.includes('tests/contacts.authed.spec.js');
  // Kasıtlı çıkarma simülasyonu: aynı planı spec'i selected'tan silerek boz.
  const tampered = JSON.parse(JSON.stringify(validAuthedPlan));
  tampered.selected.authenticatedSpecs = tampered.selected.authenticatedSpecs.filter(
    (s) => s !== 'tests/contacts.authed.spec.js'
  );
  const dt = planRun(tampered);
  const stillThere = dt.groups.find((g) => g.key === 'authed');
  check(
    'changed-spec-carried',
    carried && (!stillThere || !stillThere.files.includes('tests/contacts.authed.spec.js')),
    `carried=${carried}`
  );
}

// N4) Page Object değişikliği bağlı spec'e EŞLENMEZSE (boş grup) → 0-test kırmızı.
// Grafik bağını kaybetmiş bir modül senaryosu: dosyalı grup 0 test bulur.
{
  const r = interpretGroup(
    { key: 'authed', kind: 'exact', expected: 1, files: ['tests/orphan.authed.spec.js'], grep: null },
    { listedCount: 0, exitCode: 0, stats: {} }
  );
  const agg = aggregate([r]);
  expectNonZero('N4', 'page-object-unmapped-zero', agg.overallExitCode, `reason=${r.reason}`);
}

// N5) Unknown runtime dosyası → planner unmapped → runner REFUSE exit 1.
{
  const unknown = plan([{ path: 'Dockerfile', status: 'A' }]);
  const d = planRun(unknown);
  expectNonZero('N5', 'unknown-runtime-refuse', d.exitCode, `decision=${d.decision} reason=${d.reason}`);
  check('unknown-runtime-is-refuse', d.decision === 'REFUSE', `decision=${d.decision}`);
}

// N6) Mutation spec production runnable listesine SIZARSA → son savunma REFUSE exit 1.
{
  const leak = JSON.parse(JSON.stringify(validAuthedPlan));
  leak.selected.authenticatedSpecs = [
    'tests/contacts.authed.spec.js',
    'tests/contacts-mutations.authed.spec.js', // kasıtlı sızıntı
  ];
  const d = planRun(leak);
  expectNonZero('N6', 'mutation-leak-refuse', d.exitCode, `decision=${d.decision} reason=${d.reason}`);
  check(
    'mutation-leak-is-refuse',
    d.decision === 'REFUSE' && /MUTATION_LEAK/.test(d.reason),
    `decision=${d.decision} reason=${d.reason}`
  );
  // Ek: buildRunGroups mutation'ı bir gruba koysa bile assertNoMutation yakalar.
  const groups = buildRunGroups(leak);
  check('mutation-leak-detected-in-groups', groups.some((g) => g.files.some((f) => /mutations?\./.test(f))), 'grup üretimi');
}

// N7) Eksik base SHA / shallow → sourceMissing → REFUSE exit 1.
{
  const d = planRun({ ...validAuthedPlan, sourceMissing: true, status: 'SOURCE_MISSING', exitCode: 1 });
  expectNonZero('N7', 'source-missing-refuse', d.exitCode, `decision=${d.decision} reason=${d.reason}`);
  check('source-missing-is-refuse', d.decision === 'REFUSE' && d.reason === 'SOURCE_MISSING', d.reason);
}

// N8) Bozuk / tamper edilmiş selection.json → şema reddi → REFUSE exit 1.
{
  const broken = [
    { label: 'schemaVersion-bozuk', p: { ...validAuthedPlan, schemaVersion: 99 } },
    { label: 'selected-eksik', p: { ...validAuthedPlan, selected: undefined } },
    { label: 'fallback-tamper', p: { ...validAuthedPlan, fallbackSuites: ['UYDURMA-SUITE'] } },
    { label: 'selected-tip-hatası', p: { ...validAuthedPlan, selected: { publicSpecs: 'x', authenticatedSpecs: [], discoverySpecs: [] } } },
  ];
  let allRefused = true;
  for (const b of broken) {
    const v = validateSelection(b.p);
    const d = planRun(b.p);
    if (!(v.ok === false && d.decision === 'REFUSE' && d.exitCode === 1)) {
      allRefused = false;
      failures.push(`Vaka(N8) tamper[${b.label}] reddedilmedi: ok=${v.ok} decision=${d.decision}`);
    }
  }
  expectNonZero('N8', 'tampered-selection-refuse', allRefused ? 1 : 0, 'tüm bozuk planlar reddedilmeli');
}

// ─────────────────────────── Ek sağlamlık ───────────────────────────

// E1) Çok gruplu koşumda tek bir grup kırmızıysa genel exit non-zero (#7).
{
  const green = interpretGroup(
    { key: 'public', kind: 'exact', expected: 1, files: ['tests/login.spec.js'], grep: null },
    { listedCount: 1, exitCode: 0, stats: { expected: 1 } }
  );
  const red = interpretGroup(
    { key: 'authed', kind: 'exact', expected: 1, files: ['tests/contacts.authed.spec.js'], grep: null },
    { listedCount: 2, exitCode: 1, stats: { expected: 1, unexpected: 1 } }
  );
  const agg = aggregate([green, red]);
  check('one-red-fails-all', agg.overallExitCode === 1 && !agg.allGreen, `exit=${agg.overallExitCode}`);
}

// E2) Flaky başarıya çevrilmez (#8): flaky>0 → grup kırmızı.
{
  const r = interpretGroup(
    { key: 'authed', kind: 'exact', expected: 1, files: ['tests/contacts.authed.spec.js'], grep: null },
    { listedCount: 1, exitCode: 0, stats: { expected: 0, unexpected: 0, flaky: 1 } }
  );
  check('flaky-not-pass', !r.passed && /FLAKY/.test(r.reason), `reason=${r.reason}`);
}

// E3) grep-only fallback (dosyasız) 0 test bulsa da kırmızı DEĞİL (güvenlik ağı).
{
  const r = interpretGroup(
    { key: 'fallback:authed-critical', kind: 'fallback', expected: 0, files: [], grep: '@critical' },
    { listedCount: 0, exitCode: 0, stats: {} }
  );
  check('grep-fallback-zero-ok', r.passed, `reason=${r.reason}`);
}

// E4) Çıktı determinizmi: aynı plan iki kez aynı kararı verir.
{
  const a = JSON.stringify(planRun(validAuthedPlan).groups);
  const b = JSON.stringify(planRun(validAuthedPlan).groups);
  check('deterministic-decision', a === b, 'iki koşum farklı grup üretti');
}

// ───────────── WP-CI-SHARD (ADR-0025) sharding — SAF kapsam kanıtı ─────────────

// S1) Bölme deterministik + kapsam korunur: tüm shard'ların birleşimi = tüm exact
//     dosyalar, ve hiçbir dosya iki shard'a birden gitmez (çakışma yok).
{
  const groups = [
    { key: 'authed', kind: 'exact', project: 'chromium-authed', setup: 'setup', grep: null,
      files: ['tests/a.authed.spec.js', 'tests/b.authed.spec.js', 'tests/c.authed.spec.js', 'tests/d.authed.spec.js'] },
    { key: 'public', kind: 'exact', project: 'chromium', setup: null, grep: null,
      files: ['tests/x.spec.js', 'tests/y.spec.js'] },
  ];
  const total = 3;
  const seen = new Map(); // file -> shard indeks sayısı
  let all = [];
  for (let i = 1; i <= total; i++) {
    for (const g of shardGroups(groups, i, total)) {
      for (const f of g.files) {
        seen.set(f, (seen.get(f) || 0) + 1);
        all.push(f);
      }
    }
  }
  const expected = ['tests/a.authed.spec.js','tests/b.authed.spec.js','tests/c.authed.spec.js','tests/d.authed.spec.js','tests/x.spec.js','tests/y.spec.js'];
  const noDup = [...seen.values()].every((n) => n === 1);
  const complete = expected.every((f) => seen.has(f)) && seen.size === expected.length;
  check('shard-union-complete-disjoint', noDup && complete, `union=${all.sort().join(',')} dupOrMissing`);
}

// S2) Determinizm: aynı girdi + shard → aynı çıktı; girdi sırası bağımsız.
{
  const g1 = [{ key: 'authed', kind: 'exact', project: 'chromium-authed', setup: 'setup', grep: null,
    files: ['tests/b.authed.spec.js', 'tests/a.authed.spec.js'] }];
  const g2 = [{ key: 'authed', kind: 'exact', project: 'chromium-authed', setup: 'setup', grep: null,
    files: ['tests/a.authed.spec.js', 'tests/b.authed.spec.js'] }];
  const s1 = JSON.stringify(shardGroups(g1, 1, 2));
  const s2 = JSON.stringify(shardGroups(g2, 1, 2));
  check('shard-deterministic-order-independent', s1 === s2, `s1=${s1} s2=${s2}`);
}

// S3) grep-only fallback YALNIZ shard 1'de koşar (bölünemez; tekrar gereksiz yük).
{
  const groups = [{ key: 'fallback:authed-critical', kind: 'fallback', project: 'chromium-authed', setup: 'setup', grep: '@critical', files: [] }];
  const onS1 = shardGroups(groups, 1, 3).some((g) => g.key === 'fallback:authed-critical');
  const onS2 = shardGroups(groups, 2, 3).some((g) => g.key === 'fallback:authed-critical');
  const onS3 = shardGroups(groups, 3, 3).some((g) => g.key === 'fallback:authed-critical');
  check('grep-fallback-shard1-only', onS1 && !onS2 && !onS3, `s1=${onS1} s2=${onS2} s3=${onS3}`);
}

// S4) Boş shard meşrudur (shard sayısı > dosya sayısı): grup listesi boş → SHARD_NOOP.
{
  const groups = [{ key: 'authed', kind: 'exact', project: 'chromium-authed', setup: 'setup', grep: null, files: ['tests/only.authed.spec.js'] }];
  const emptyOnes = [2, 3].every((i) => shardGroups(groups, i, 3).length === 0);
  const oneHasIt = shardGroups(groups, 1, 3).length + shardGroups(groups, 2, 3).length + shardGroups(groups, 3, 3).length === 1;
  check('shard-empty-is-legal', emptyOnes && oneHasIt, `emptyOnes=${emptyOnes} total=${oneHasIt}`);
}

// S5) Geçersiz shard parametresi fail-closed (throw).
{
  let threw = 0;
  for (const [i, t] of [[0, 3], [4, 3], [1, 0], [2, 1]]) {
    try { shardGroups([], i, t); } catch { threw++; }
  }
  check('shard-invalid-throws', threw === 4, `throws=${threw}/4`);
}

// ─────── WP-CI-SHARD (ADR-0025) kontrollü altyapı-retry — SAF sınıflandırma ───────

// R1) 502/503/504 gateway kanıtı → 'infra' (retry uygun).
{
  const a = classifyFailure('503 Service Temporarily Unavailable\nnginx');
  const b = classifyFailure('502 Bad Gateway');
  const c = classifyFailure('', [200, 504]); // gözlemlenen ağ yanıtı
  check('retry-gateway-infra', a.class === 'infra' && b.class === 'infra' && c.class === 'infra', `${a.reason}/${b.reason}/${c.reason}`);
}

// R2) İzin verilen network hatası → 'infra'.
{
  const a = classifyFailure('Error: socket hang up');
  const b = classifyFailure('page.goto: net::ERR_CONNECTION_RESET at https://app...');
  const c = classifyFailure('getaddrinfo EAI_AGAIN app.vomenta.com');
  check('retry-network-infra', a.class === 'infra' && b.class === 'infra' && c.class === 'infra', `${a.reason}/${b.reason}/${c.reason}`);
}

// R3) Assertion/selector/visibility → 'test' (retry YOK); ağ ifadesi geçse bile deny kazanır.
{
  const assertion = classifyFailure('Error: expect(received).toBeVisible()\nlocator resolved to hidden');
  const selector = classifyFailure("locator.click: Timed out 15000ms waiting for locator('nav')");
  const mixed = classifyFailure('expect(locator).toBeVisible() failed; also saw ECONNRESET in logs');
  check(
    'retry-assertion-selector-no-retry',
    assertion.class === 'test' && selector.class === 'test' && mixed.class === 'test',
    `${assertion.class}/${selector.class}/${mixed.class}`
  );
}

// R4) Kanıt yok → fail-closed 'test' (retry YOK).
{
  const a = classifyFailure('Some unexpected error with no infra evidence');
  const b = classifyFailure('');
  const auth = classifyFailure('Login failed: 401 Unauthorized'); // yetki hatası infra DEĞİL
  check('retry-failclosed-test', a.class === 'test' && b.class === 'test' && auth.class === 'test', `${a.reason}/${b.reason}/${auth.reason}`);
}

// R5) planRetry yalnız infra'yı retry kovasına koyar; test'i kırmızı tutar.
{
  const { retry, keepRed } = planRetry([
    { file: 'tests/a.authed.spec.js', line: 10, title: 'gw', errorText: '503 Service Unavailable' },
    { file: 'tests/b.authed.spec.js', line: 20, title: 'assert', errorText: 'expect(x).toBe(1)' },
    { file: 'tests/c.authed.spec.js', line: 30, title: 'net', errorText: 'socket hang up' },
  ]);
  check(
    'planRetry-splits-infra-vs-test',
    retry.length === 2 && keepRed.length === 1 &&
      retry.every((f) => f.classification.class === 'infra') &&
      keepRed[0].classification.class === 'test',
    `retry=${retry.length} keepRed=${keepRed.length}`
  );
}

// R6) Kontrollü retry bütçesi = EN FAZLA 1 (MAX_ATTEMPTS_PER_TEST = 2).
{
  check('retry-budget-one', MAX_ATTEMPTS_PER_TEST === 2, `MAX_ATTEMPTS_PER_TEST=${MAX_ATTEMPTS_PER_TEST}`);
}

// ─────────────────────────────── Sonuç ───────────────────────────────
console.error('\nNegatif kanıt exit-code tablosu:');
for (const n of negTable) console.error(`  ${n.id} ${n.label}: exit ${n.exit}`);

if (failures.length > 0) {
  console.error('');
  for (const f of failures) console.error('  ✗ ' + f);
  console.error(`\n${failures.length} runner self-check ihlali (${caseNo} kontrol).`);
  process.exit(1);
}
console.log(`\nPR-impact runner self-check geçti: ${caseNo} kontrol, ${negTable.length} negatif kanıt non-zero, production çağrısı yok.`);
