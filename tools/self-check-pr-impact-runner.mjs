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
import { planImpact, buildImportGraph } from './pr-impact-lib.mjs';
import {
  planRun,
  interpretGroup,
  aggregate,
  validateSelection,
  buildRunGroups,
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

// P4) Page Object → bağlı spec grubu (handoff §2.6.4 pozitif tarafı).
{
  const po = plan([{ path: 'tests/pages/ContactsPage.js', status: 'M' }]);
  const d = planRun(po);
  const authed = d.groups.find((g) => g.key === 'authed');
  check(
    'page-object-maps-to-spec',
    d.decision === 'RUN' && !!authed && authed.files.includes('tests/contacts.authed.spec.js'),
    `groups=${d.groups.map((g) => g.key).join(',')}`
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
