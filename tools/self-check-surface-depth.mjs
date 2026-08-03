#!/usr/bin/env node
// @ts-check
/**
 * SURFACE-DEPTH SELF-CHECK — SERT KAPI (WP-SURFACE / FAZ 4).
 *
 * `tools/surface-depth-lib.mjs` + `tools/generate-surface-depth.mjs`'in dürüstlük
 * sözleşmelerini (HANDOFF §4.9 self-check matrisi) TAMAMEN SENTETİK fixture'larla,
 * production'a BAĞLANMADAN doğrular. Gerçek registry/runtime dosyası kullanılmaz;
 * child-process CLI testleri enjekte edilen sentetik --runtime/--list-json ile izole
 * bir --out-dir'e yazar (docs/'a DOKUNMAZ).
 *
 * Çalıştır:  node tools/self-check-surface-depth.mjs   (npm run quality:surface)
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSurfaceModel,
  validateSurfaceInvariants,
  renderSurfaceJson,
  renderSurfaceMarkdown,
  scanOutputLeaks,
  STATUS,
  REASON_CODES,
  STYLE_DIMENSIONS,
  INTERACTION_DIMENSIONS,
} from './surface-depth-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = resolve(root, 'tools/generate-surface-depth.mjs');

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const expectThrows = (fn, label) => {
  let threw = false;
  try { fn(); } catch { threw = true; }
  ok(threw, `NEGATİF beklenen fırlatma OLMADI: ${label}`);
};

// ── Sentetik fixture'lar (gerçek kullanıcı verisi / production YOK) ───────────
const GEN_AT = '2026-08-02T06:00:00.000Z';
const SRC = { commitSha: 'abcdef012345', environment: 'production-read-only', browser: 'chromium', project: 'chromium-authed' };

const registeredRoutes = [
  { path: '/alpha', heading: 'Alpha' },   // dedicated, writes+data+dialogs+stableUI
  { path: '/beta', heading: 'Beta' },     // yalnız genel baseline (dedicated değil)
  { path: '/gamma', heading: null },      // dedicated, yazma yok, statik
  { path: '/delta', heading: null },      // sözleşme yok + runtime yok → L0
  { path: '/epsilon', heading: null },    // dedicated ama zorunlu bir stil eksik → boşluk
];

const testedPages = [
  { id: 'nav', routes: ['/beta'], routeLevelBaseline: true, specFiles: ['quality-baseline.authed.spec.js'], archetype: {}, naStyles: {} },
  { id: 'alpha', routes: ['/alpha'], specFiles: ['alpha.authed.spec.js'], archetype: { hasData: true, hasWrites: true, hasDialogs: true, hasStableUI: true }, naStyles: {} },
  { id: 'gamma', routes: ['/gamma'], specFiles: ['gamma.authed.spec.js'], archetype: { hasStableUI: true }, naStyles: {} },
  { id: 'epsilon', routes: ['/epsilon'], specFiles: ['epsilon.authed.spec.js'], archetype: {}, naStyles: {} },
];

const knownBugs = [
  { id: 'BUG-A', route: '/alpha', severity: 'high', status: 'open' },
  { id: 'BUG-X', route: '/nowhere', severity: 'low', status: 'open' },   // kayıtlı değil → unmapped
  { id: 'BUG-C', route: null, severity: 'medium', status: 'closed' },     // rota yok → unmapped
];

const runtimeReport = {
  schemaVersion: 1,
  generatedAt: GEN_AT,
  source: SRC,
  pages: [
    { route: '/alpha', baselineStatus: 'PASS', statusReason: 'passed', specFiles: ['registered-routes-smoke.authed.spec.js'], bugs: [] },
    { route: '/beta', baselineStatus: 'PASS', statusReason: 'passed', specFiles: ['registered-routes-smoke.authed.spec.js'], bugs: [] },
    { route: '/gamma', baselineStatus: 'PASS', statusReason: 'passed', specFiles: ['registered-routes-smoke.authed.spec.js'], bugs: [] },
    // /delta runtime'da YOK → L1 NOT_RUN
    { route: '/epsilon', baselineStatus: 'PASS', statusReason: 'passed', specFiles: ['registered-routes-smoke.authed.spec.js'], bugs: [] },
  ],
  unmappedTests: [{ file: 'stray.spec.js', title: '[route:/notregistered] x', routeMarker: '/notregistered', status: 'passed' }],
};

// Etiket indeksleri (Playwright --list eşdeğeri; koşum yok).
const BASELINE5 = ['i18n', 'a11y', 'layout', 'clean', 'deeplink'];
const tagsByFile = new Map([
  ['alpha.authed.spec.js', new Set([...BASELINE5, 'keyboard', 'errorpath', 'visual', 'mutation'])],
  ['gamma.authed.spec.js', new Set([...BASELINE5, 'visual'])],
  ['quality-baseline.authed.spec.js', new Set([...BASELINE5, 'smoke', 'regression', 'route-baseline'])],
  ['epsilon.authed.spec.js', new Set(['i18n', 'a11y', 'layout', 'clean'])], // deeplink EKSİK → boşluk
]);
const tagsByRoute = new Map([
  ['/beta', new Set([...BASELINE5, 'smoke', 'regression', 'route-baseline'])],
]);

const build = () => buildSurfaceModel({ registeredRoutes, testedPages, knownBugs, runtimeReport, tagsByRoute, tagsByFile, generatedAt: GEN_AT });

// ══ POZİTİF: model doğru kuruluyor ══════════════════════════════════════════
const model = build();
validateSurfaceInvariants(model); // fırlatırsa süreç çöker → negatif sinyal

const byRoute = Object.fromEntries(model.pages.map((p) => [p.route, p]));

// §4.9-1/2: her rota tam bir kez; sayı envanterle eşit.
ok(model.pages.length === registeredRoutes.length, '#2 pages sayısı envanterle eşit değil.');
ok(new Set(model.pages.map((p) => p.route)).size === model.pages.length, '#1 rota tekrarı var.');
ok(model.inventory.registeredRoutes === registeredRoutes.length, '#2 inventory.registeredRoutes yanlış.');

// L1 katmanı.
ok(byRoute['/alpha'].levels.L1.status === STATUS.PROVEN && byRoute['/alpha'].levels.L1.runtimeStatus === 'PASS', 'alpha L1 PROVEN olmalı.');
ok(byRoute['/delta'].levels.L1.status === STATUS.NOT_RUN && byRoute['/delta'].levels.L1.reasonCode === REASON_CODES.NO_RUNTIME_RESULT, '#3 delta L1 NOT_RUN + reasonCode olmalı.');
ok(byRoute['/delta'].highestProvenLevel === 'L0', '#3 delta highest L0 olmalı (runtime yok).');

// L2 stil katmanı.
ok(byRoute['/alpha'].levels.L2.style.contractMet === true, 'alpha stil sözleşmesi karşılanmalı.');
ok(byRoute['/alpha'].levels.L2.status === STATUS.PARTIAL, 'alpha L2 PARTIAL olmalı (etkileşim kanıtsız).');
ok(byRoute['/alpha'].highestProvenLevel === 'L2_STYLE', 'alpha highest L2_STYLE olmalı.');
ok(byRoute['/epsilon'].levels.L2.style.dimensions.deeplink.status === STATUS.NOT_COVERED, 'epsilon deeplink NOT_COVERED olmalı (boşluk).');
ok(byRoute['/epsilon'].levels.L2.status === STATUS.NOT_COVERED, 'epsilon L2 NOT_COVERED olmalı (stil boşluğu).');
ok(byRoute['/epsilon'].highestProvenLevel === 'L1', 'epsilon highest L1 olmalı (açılış var, stil boşluğu).');

// L2 etkileşim katmanı: hiçbir boyut COVERED üretilmez; dedicated olmayan rotada hepsi UNVERIFIED.
for (const p of model.pages) {
  for (const [d, s] of Object.entries(p.levels.L2.interaction.dimensions)) {
    ok(s.status !== STATUS.COVERED, `etkileşim/${d} sahte COVERED üretilmemeli (${p.route}).`);
  }
}
ok(byRoute['/beta'].levels.L2.interaction.surfaceArchetype === false, 'beta dedicated arketip olmamalı.');
ok(byRoute['/beta'].levels.L2.interaction.applicableCount === INTERACTION_DIMENSIONS.length, 'beta (dedicated değil) tüm etkileşim boyutları UNVERIFIED olmalı.');
ok(byRoute['/alpha'].levels.L2.interaction.surfaceArchetype === true, 'alpha dedicated arketip olmalı.');

// §4.9-5/6/7: L3/L4/L5.
ok(byRoute['/alpha'].levels.L3.status === STATUS.BLOCKED && byRoute['/alpha'].levels.L3.reasonCode === REASON_CODES.STAGING_REQUIRED, 'alpha L3 BLOCKED/STAGING olmalı (hasWrites).');
ok(byRoute['/gamma'].levels.L3.status === STATUS.NOT_APPLICABLE && byRoute['/gamma'].levels.L3.reasonCode === REASON_CODES.NO_WRITE_SURFACE, 'gamma L3 N/A/NO_WRITE olmalı.');
ok(model.pages.every((p) => p.levels.L4.status === STATUS.BLOCKED && p.levels.L4.reasonCode === REASON_CODES.ROLE_ACCOUNTS_REQUIRED), 'L4 hepsi BLOCKED/ROLE olmalı.');
ok(model.pages.every((p) => p.levels.L5.status === STATUS.BLOCKED && p.levels.L5.reasonCode === REASON_CODES.PROVIDER_HARNESS_REQUIRED), 'L5 hepsi BLOCKED/PROVIDER olmalı.');

// §4.9-10: unmapped test hiçbir rotayı yaratmaz/yeşile boyamaz.
ok(!model.pages.some((p) => p.route === '/notregistered'), '#10 unmapped test yeni rota YARATMAMALI.');
ok(model.unmappedTests.length === 1 && model.unmappedTests[0].routeMarker === '/notregistered', '#10 unmappedTests taşınmalı.');

// §4.9-11: rotasız/kayıtsız bulgu route.findings'i bozmaz.
ok(byRoute['/alpha'].findings.length === 1 && byRoute['/alpha'].findings[0].id === 'BUG-A', '#11 alpha yalnız BUG-A içermeli.');
ok(model.unmappedFindings.some((f) => f.id === 'BUG-X') && model.unmappedFindings.some((f) => f.id === 'BUG-C'), '#11 BUG-X/BUG-C unmapped olmalı.');
ok(!model.pages.some((p) => p.findings.some((f) => f.id === 'BUG-X' || f.id === 'BUG-C')), '#11 unmapped bulgu hiçbir rotada olmamalı.');

// §4.9-12: determinizm (aynı girdi → aynı çıktı) + sızıntı yok.
const j1 = renderSurfaceJson(model);
const j2 = renderSurfaceJson(build());
ok(j1 === j2, '#12 JSON deterministik değil (aynı girdi farklı çıktı).');
const md = renderSurfaceMarkdown(model);
ok(renderSurfaceMarkdown(build()) === md, '#12 Markdown deterministik değil.');
const leaks = [...scanOutputLeaks(j1), ...scanOutputLeaks(md)];
ok(leaks.length === 0, `#12 çıktıda sızıntı: ${leaks.join(',')}`);
// scanOutputLeaks gerçekten yakalıyor mu (kontrol).
ok(scanOutputLeaks('/Users/foo/secret/x').includes('absolute-path'), 'scanOutputLeaks mutlak yolu yakalamalı.');

// ══ NEGATİF: invariant kapısı gerçekten fırlatıyor mu ═══════════════════════
// §4.9-3: runtime olmadan L1 PROVEN.
expectThrows(() => { const m = clone(model); m.pages[0].levels.L1.runtimeStatus = null; validateSurfaceInvariants(m); }, '#3 L1 PROVEN + runtimeStatus null');
// §4.9-4: etkileşim doğrulanmamışken L2 COMPLETE.
expectThrows(() => { const m = clone(model); m.pages[0].levels.L2.status = STATUS.COMPLETE; validateSurfaceInvariants(m); }, '#4 L2 COMPLETE ama etkileşim UNVERIFIED');
// §4.9-4b: stil boşluğu varken L2 COMPLETE.
expectThrows(() => { const m = clone(model); const e = m.pages.find((p) => p.route === '/epsilon'); e.levels.L2.status = STATUS.COMPLETE; validateSurfaceInvariants(m); }, '#4 L2 COMPLETE ama stil boşluğu');
// §4.9-5/6/7: L3/L4/L5 COMPLETE.
expectThrows(() => { const m = clone(model); m.pages[0].levels.L3.status = STATUS.COMPLETE; validateSurfaceInvariants(m); }, '#5 L3 COMPLETE');
expectThrows(() => { const m = clone(model); m.pages[0].levels.L4.status = STATUS.COMPLETE; validateSurfaceInvariants(m); }, '#6 L4 COMPLETE');
expectThrows(() => { const m = clone(model); m.pages[0].levels.L5.status = STATUS.PROVEN; validateSurfaceInvariants(m); }, '#7 L5 PROVEN');
// §4.9-8: gerekçesiz N/A.
expectThrows(() => { const m = clone(model); const d = m.pages[0].levels.L2.style.dimensions; const k = Object.keys(d).find((x) => d[x].status === STATUS.NOT_APPLICABLE); delete d[k].reasonCode; validateSurfaceInvariants(m); }, '#8 N/A reasonCode silinmiş');
// §4.9-9: bilinmeyen status / reasonCode.
expectThrows(() => { const m = clone(model); m.pages[0].levels.L1.status = 'BOGUS'; validateSurfaceInvariants(m); }, '#9 geçersiz status');
expectThrows(() => { const m = clone(model); m.pages[0].levels.L3.reasonCode = 'BOGUS'; validateSurfaceInvariants(m); }, '#9 geçersiz reasonCode');
// Sahte etkileşim COVERED reddedilir.
expectThrows(() => { const m = clone(model); const ix = m.pages[0].levels.L2.interaction.dimensions; ix[Object.keys(ix)[0]].status = STATUS.COVERED; validateSurfaceInvariants(m); }, 'etkileşim sahte COVERED');
// §4.9-1: rota tekrarı.
expectThrows(() => { const m = clone(model); m.pages.push(clone(m.pages[0])); validateSurfaceInvariants(m); }, '#1 rota tekrarı');
// §4.9-2: sayı uyuşmazlığı (yeni route eklenip matris güncellenmezse kapı kırılır).
expectThrows(() => { const m = clone(model); m.inventory.registeredRoutes = 99; validateSurfaceInvariants(m); }, '#2 route sayısı uyuşmazlığı');
// Boş envanter fail-closed.
expectThrows(() => buildSurfaceModel({ registeredRoutes: [], testedPages, knownBugs, runtimeReport, tagsByRoute, tagsByFile, generatedAt: GEN_AT }), 'boş envanter');
// buildTagIndex sağlamlığı: bozuk rapor patlamamalı (boş indeks).
expectThrows(() => { validateSurfaceInvariants({ inventory: { registeredRoutes: 1 }, pages: [{ route: '/x', highestProvenLevel: 'ZZZ', levels: { L1: { status: STATUS.PROVEN, runtimeStatus: 'PASS' }, L2: { status: STATUS.PARTIAL, style: { contractMet: true, requiredDimensions: [], coveredOrExempt: 0, dimensions: {} }, interaction: { verified: false, applicableDimensions: [], dimensions: {} } }, L3: { status: STATUS.NOT_APPLICABLE, reasonCode: REASON_CODES.NO_WRITE_SURFACE }, L4: { status: STATUS.BLOCKED, reasonCode: REASON_CODES.ROLE_ACCOUNTS_REQUIRED }, L5: { status: STATUS.BLOCKED, reasonCode: REASON_CODES.PROVIDER_HARNESS_REQUIRED } }, findings: [] }] }); }, 'geçersiz highestProvenLevel');

// ══ CLI: izole child-process (docs/'a dokunmaz) ═════════════════════════════
const dir = mkdtempSync(join(tmpdir(), 'surface-cli-'));
try {
  const runtimePath = join(dir, 'runtime.json');
  const listPath = join(dir, 'list.json');
  // Gerçek REGISTERED_ROUTES ile uyumlu minimal sentetik girdiler (CLI gerçek envanteri import eder).
  writeFileSync(runtimePath, JSON.stringify({ schemaVersion: 1, generatedAt: GEN_AT, source: SRC, pages: [], unmappedTests: [] }));
  writeFileSync(listPath, JSON.stringify({ suites: [] })); // etiket yok → stil NOT_COVERED (geçerli durum)

  const run = (args) => spawnSync('node', [CLI, ...args], { cwd: root, encoding: 'utf8' });

  // --check: yazmadan doğrula, exit 0.
  const rc = run(['--runtime', runtimePath, '--list-json', listPath, '--out-dir', dir, '--check']);
  ok(rc.status === 0, `CLI --check exit 0 olmalı (görülen ${rc.status}). ${rc.stderr || ''}`);
  ok(!existsSync(join(dir, 'docs/raporlar/SURFACE-DEPTH.json')), 'CLI --check dosya YAZMAMALI.');

  // Gerçek yazım: exit 0 + iki çıktı + geçerli JSON + envanter 55 + sızıntı yok.
  const r1 = run(['--runtime', runtimePath, '--list-json', listPath, '--out-dir', dir]);
  ok(r1.status === 0, `CLI exit 0 olmalı (görülen ${r1.status}). ${r1.stderr || ''}`);
  const jsonOut = join(dir, 'docs/raporlar/SURFACE-DEPTH.json');
  const mdOut = join(dir, 'docs/SURFACE-DEPTH-MATRIX.md');
  ok(existsSync(jsonOut) && existsSync(mdOut), 'CLI iki çıktıyı da yazmalı.');
  const parsed = JSON.parse(readFileSync(jsonOut, 'utf8'));
  ok(parsed.pages.length === parsed.inventory.registeredRoutes, 'CLI çıktısı rota sayısı tutarlı olmalı.');
  ok(scanOutputLeaks(readFileSync(jsonOut, 'utf8')).length === 0 && scanOutputLeaks(readFileSync(mdOut, 'utf8')).length === 0, 'CLI çıktısında sızıntı olmamalı.');

  // Determinizm: ikinci koşum bit-aynı.
  const before = readFileSync(jsonOut, 'utf8');
  run(['--runtime', runtimePath, '--list-json', listPath, '--out-dir', dir]);
  ok(before === readFileSync(jsonOut, 'utf8'), 'CLI çıktısı deterministik değil.');

  // Eksik runtime dosyası → exit 1 (sessiz boş üretmez).
  const rbad = run(['--runtime', join(dir, 'yok.json'), '--list-json', listPath, '--out-dir', dir]);
  ok(rbad.status === 1, 'CLI eksik runtime dosyasinda exit 1 olmali.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} surface-depth self-check ihlali.`);
  process.exit(1);
}
console.log('✓ surface-depth self-check geçti: 12 invariant vakası + negatif kanıt + izole CLI (production yok).');
