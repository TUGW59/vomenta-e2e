#!/usr/bin/env node
// @ts-check
/**
 * WP-DRAFT — draft-finding üreteci negatif self-check.
 *
 * Determinizm, dürüstlük ve güvenlik kontratlarını her koşuda kanıtlar:
 *  1. classifyTriage tablosu: her satır (REAL-RED/FIXED-CANDIDATE/FLAKY/KNOWN-BUG-GREEN/GREEN).
 *  2. YALNIZ REAL-RED taslaklanır (FIXED/FLAKY/GREEN/KNOWN-BUG-GREEN → 0 taslak).
 *  3. Dedup: registry'de {file,title} olan REAL-RED skippedAlreadyKnown'a düşer (önek-toleranslı).
 *  4. İnsan-alanları SABİT: possibleCauses=[], rootCauseCandidate/rootCause=null, severity=null,
 *     repro=[], owner=null; _todo boş değil.
 *  5. parseAssertion: pozitif kalıplar + honest fallback (eşleşmezse expected/actual=null).
 *  6. DETERMİNİZM: buildDrafts iki kez → aynı; draftSlug stabil (aynı girdi→aynı, farklı→farklı).
 *  7. Üreteç registry'ye (known-bugs.js) YAZMAZ (statik tarama).
 *  8. Üreteç Date.now()/Math.random()/argümansız new Date() KULLANMAZ (statik, iki dosya).
 *  9. prepareDraftBundle güvenlik kapısı: yalnız draft-summary.json + drafts/*.json;
 *     beklenmeyen dosya REDDEDİLİR; secret'lı JSON REDDEDİLİR; .png/.zip local-only.
 * 10. Suggestion-only: summary.note registry değişmediğini beyan eder.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  classifyTriage,
  parseAssertion,
  areaFromSpecFile,
  draftSlug,
  buildDrafts,
  prepareDraftBundle,
  DRAFT_UPLOAD_ALLOWLIST,
  TRIAGE,
} from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
};

/** Playwright JSON raporu inşa yardımcı: düz test listesinden {suites:[{specs:[...]}]}. */
function makeReport(tests) {
  return {
    suites: [
      {
        specs: tests.map((t) => ({
          file: t.file,
          title: t.title,
          tests: [
            {
              expectedStatus: t.expectedStatus,
              status: t.outcome, // test-seviyesi (expected|unexpected|flaky|skipped)
              projectName: t.project || 'chromium-authed',
              annotations: t.annotations || (t.expectedStatus === 'failed' ? [{ type: 'fail' }] : []),
              results: (t.results || [{ status: t.resultStatus || 'failed', error: t.error ? { message: t.error } : undefined }]).map((r) => ({
                status: r.status,
                error: r.error ? { message: r.error } : undefined,
                attachments: r.attachments || [],
                duration: 1,
              })),
            },
          ],
        })),
      },
    ],
  };
}

// ── 1. classifyTriage tablosu ─────────────────────────────────────────────────
check('classifyTriage: tüm satırlar', () => {
  const row = (outcome, expectedStatus, extra = {}) => classifyTriage({ outcome, expectedStatus, status: 'failed', firstStatus: 'failed', attempts: 1, ...extra });
  assert.equal(row('unexpected', 'passed'), TRIAGE.REAL_RED, 'unexpected+passed→REAL-RED');
  assert.equal(row('unexpected', 'failed'), TRIAGE.FIXED_CANDIDATE, 'unexpected+failed→FIXED-CANDIDATE');
  assert.equal(row('expected', 'failed'), TRIAGE.KNOWN_BUG_GREEN, 'expected+failed→KNOWN-BUG-GREEN');
  assert.equal(row('expected', 'passed'), TRIAGE.GREEN, 'expected+passed→GREEN');
  assert.equal(row('flaky', 'failed'), TRIAGE.FLAKY, 'flaky→FLAKY');
  assert.equal(row('flaky', 'passed'), TRIAGE.FLAKY, 'flaky→FLAKY (guard fark etmez)');
  assert.equal(row('skipped', 'passed'), TRIAGE.GREEN, 'skipped→GREEN');
  // Fallback (outcome yok): result-status + retry
  assert.equal(
    classifyTriage({ outcome: 'unknown', expectedStatus: 'passed', status: 'passed', firstStatus: 'timedOut', attempts: 2 }),
    TRIAGE.FLAKY,
    'retry-pass→FLAKY (fallback)'
  );
  assert.equal(
    classifyTriage({ outcome: 'unknown', expectedStatus: 'passed', status: 'failed', firstStatus: 'failed', attempts: 1 }),
    TRIAGE.REAL_RED,
    'fallback failed+passed→REAL-RED'
  );
  assert.equal(classifyTriage(null), TRIAGE.GREEN, 'null→GREEN');
});

// ── 2. YALNIZ REAL-RED taslaklanır ────────────────────────────────────────────
check('yalnız REAL-RED taslaklanır', () => {
  const report = makeReport([
    { file: 'voice-x.authed.spec.js', title: 'gerçek kırmızı', outcome: 'unexpected', expectedStatus: 'passed', error: 'Error: expect(locator).toHaveCount(expected) failed\nExpected: 0\nReceived: 1' },
    { file: 'voice-y.authed.spec.js', title: 'bilinen bug geçti', outcome: 'unexpected', expectedStatus: 'failed' },
    { file: 'voice-z.authed.spec.js', title: 'flaky', outcome: 'flaky', expectedStatus: 'passed' },
    { file: 'voice-w.authed.spec.js', title: 'bilinen yeşil', outcome: 'expected', expectedStatus: 'failed' },
  ]);
  const out = buildDrafts(report, [], {});
  assert.equal(out.drafts.length, 1, 'yalnız 1 REAL-RED taslak');
  assert.equal(out.drafts[0].record.test.title, 'gerçek kırmızı');
  assert.equal(out.summary.counts['REAL-RED'], 1);
  assert.equal(out.summary.counts['FIXED-CANDIDATE'], 1);
  assert.equal(out.summary.counts['FLAKY'], 1);
  assert.equal(out.summary.counts['KNOWN-BUG-GREEN'], 1);
  assert.equal(out.fixedCandidates.length, 1, 'fixed-candidate listelenir');
});

// ── 3. Dedup (önek-toleranslı) ────────────────────────────────────────────────
check('dedup: registry\'de olan REAL-RED atlanır (tests/ öneki toleransı)', () => {
  const report = makeReport([
    { file: 'voice-x.authed.spec.js', title: 'zaten kayıtlı', outcome: 'unexpected', expectedStatus: 'passed', error: 'boom' },
  ]);
  const registry = [{ id: 'X', test: { file: 'tests/voice-x.authed.spec.js', title: 'zaten kayıtlı' } }];
  const out = buildDrafts(report, registry, {});
  assert.equal(out.drafts.length, 0, 'kayıtlı REAL-RED taslaklanmaz');
  assert.equal(out.skippedAlreadyKnown.length, 1, 'skippedAlreadyKnown\'a düşer');
});

// ── 4. İnsan-alanları SABİT + doktrin ─────────────────────────────────────────
check('taslak: doktrin alanları sabit + _todo dolu', () => {
  const report = makeReport([
    { file: 'settings-a.authed.spec.js', title: 'x', outcome: 'unexpected', expectedStatus: 'passed', error: 'Error: expect(locator).toBeVisible() failed\nExpected: visible\nReceived: hidden' },
  ]);
  const rec = buildDrafts(report, [], {}).drafts[0].record;
  assert.deepEqual(rec.possibleCauses, [], 'possibleCauses=[]');
  assert.equal(rec.rootCauseCandidate, null, 'rootCauseCandidate=null');
  assert.equal(rec.rootCause, null, 'rootCause=null');
  assert.deepEqual(rec.suggestedFixes, [], 'suggestedFixes=[]');
  assert.equal(rec.severity, null, 'severity=null (insan)');
  assert.deepEqual(rec.repro, [], 'repro=[] (insan)');
  assert.equal(rec.owner, null, 'owner=null (insan)');
  assert.equal(rec.status, 'open', 'status=open (asla closed)');
  assert.ok(Array.isArray(rec._todo) && rec._todo.length > 0, '_todo dolu');
  assert.equal(rec.area, 'settings', 'area AUTO tahmin');
});

// ── 5. parseAssertion pozitif + honest fallback ───────────────────────────────
check('parseAssertion: kalıplar + honest fallback', () => {
  const count = parseAssertion('Error: expect(locator).toHaveCount(expected) failed\nExpected: 0\nReceived: 1');
  assert.equal(count.matcher, 'toHaveCount');
  assert.equal(count.expected, '0');
  assert.equal(count.actual, '1');
  const text = parseAssertion('expect(locator).toHaveText\nExpected string: "Kapat"\nReceived string: "Close"');
  assert.equal(text.expected, '"Kapat"');
  assert.equal(text.actual, '"Close"');
  const vis = parseAssertion('expect(locator).toBeVisible() failed\nExpected: visible\nReceived: hidden');
  assert.equal(vis.matcher, 'toBeVisible');
  const to = parseAssertion('Test timeout of 60000ms exceeded.');
  assert.equal(to.matcher, 'timeout');
  assert.ok(/60000ms/.test(to.expected));
  assert.equal(to.actual, 'zaman aşımı');
  // honest fallback: tanınmayan mesaj → expected/actual null, firstLine korunur
  const none = parseAssertion('Bilinmeyen tuhaf hata metni');
  assert.equal(none.expected, null, 'eşleşmezse expected=null (uydurmaz)');
  assert.equal(none.actual, null, 'eşleşmezse actual=null (uydurmaz)');
  assert.ok(none.firstLine && none.firstLine.length > 0, 'firstLine her zaman güvenli');
  assert.equal(parseAssertion(null).firstLine, null, 'null giriş → firstLine null');
});

// ── 6. Determinizm + slug ─────────────────────────────────────────────────────
check('determinizm: buildDrafts iki kez aynı; slug stabil', () => {
  const report = makeReport([
    { file: 'voice-b.authed.spec.js', title: 'b1', outcome: 'unexpected', expectedStatus: 'passed', error: 'boom' },
    { file: 'voice-a.authed.spec.js', title: 'a1', outcome: 'unexpected', expectedStatus: 'passed', error: 'boom' },
  ]);
  const a = JSON.stringify(buildDrafts(report, [], {}));
  const b = JSON.stringify(buildDrafts(report, [], {}));
  assert.equal(a, b, 'aynı girdi → aynı çıktı');
  assert.equal(draftSlug('f.js', 't'), draftSlug('f.js', 't'), 'slug stabil');
  assert.notEqual(draftSlug('f.js', 't'), draftSlug('f.js', 'u'), 'farklı girdi → farklı slug');
  // drafts slug'a göre sıralı (deterministik)
  const out = buildDrafts(report, [], {});
  const slugs = out.drafts.map((d) => d.slug);
  assert.deepEqual(slugs, [...slugs].sort(), 'drafts slug sıralı');
});

// ── 7. Üreteç registry'ye YAZMAZ (statik) ─────────────────────────────────────
check('draft-finding + forensic-lib known-bugs.js\'e YAZMAZ', () => {
  for (const f of ['draft-finding.mjs', 'forensic-lib.mjs']) {
    const src = readFileSync(join(root, 'tools', f), 'utf8');
    const writesRegistry =
      /(write|append)FileSync[^\n]*known-bugs/i.test(src) ||
      /known-bugs[^\n]*(write|append)FileSync/i.test(src);
    assert.ok(!writesRegistry, `${f} registry'ye yazıyor görünüyor`);
  }
});

// ── 8. Determinizm statik tarama (iki dosya) ──────────────────────────────────
check('üreteç Date.now()/Math.random()/argümansız new Date() içermez', () => {
  for (const f of ['draft-finding.mjs', 'forensic-lib.mjs']) {
    const src = readFileSync(join(root, 'tools', f), 'utf8');
    assert.ok(!/Date\.now\s*\(/.test(src), `${f}: Date.now() kullanılmamalı`);
    assert.ok(!/Math\.random\s*\(/.test(src), `${f}: Math.random() kullanılmamalı`);
    assert.ok(!/new Date\s*\(\s*\)/.test(src), `${f}: argümansız new Date() kullanılmamalı`);
  }
});

// ── 9. prepareDraftBundle güvenlik kapısı ─────────────────────────────────────
check('prepareDraftBundle: allowlist + secret + local-only', () => {
  const scratch = resolve(root, 'test-results', '.draft-selfcheck');
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(join(scratch, 'drafts'), { recursive: true });
  writeFileSync(join(scratch, 'draft-summary.json'), JSON.stringify({ ok: true }) + '\n');
  writeFileSync(join(scratch, 'drafts', 'a.json'), JSON.stringify({ id: 'DRAFT-a' }) + '\n');
  writeFileSync(join(scratch, 'drafts', 'leak.json'), JSON.stringify({ token: 'ghp_' + 'A'.repeat(36) }) + '\n');
  writeFileSync(join(scratch, 'unexpected.txt'), 'nope');
  writeFileSync(join(scratch, 'trace.zip'), 'binary');
  writeFileSync(join(scratch, 'test-failed-1.png'), 'binary');
  const res = prepareDraftBundle(scratch);
  assert.ok(res.copied.includes('draft-summary.json'), 'summary kopyalanır');
  assert.ok(res.copied.includes('drafts/a.json'), 'temiz draft kopyalanır');
  assert.ok(res.rejected.some((r) => r.name === 'drafts/leak.json'), 'secret\'lı draft reddedilir');
  assert.ok(res.rejected.some((r) => r.name === 'unexpected.txt'), 'beklenmeyen dosya reddedilir');
  assert.ok(res.skippedLocal.includes('trace.zip'), '.zip local-only');
  assert.ok(res.skippedLocal.includes('test-failed-1.png'), 'test-*.png local-only');
  assert.deepEqual(DRAFT_UPLOAD_ALLOWLIST, ['draft-summary.json'], 'allowlist beklenen');
  rmSync(scratch, { recursive: true, force: true });
});

// ── 10. Suggestion-only ───────────────────────────────────────────────────────
check('suggestion-only: summary registry değişmediğini beyan eder', () => {
  const out = buildDrafts(makeReport([]), [], {});
  assert.ok(/Registry DEĞİŞMEDİ/i.test(out.summary.note), 'note registry değişmediğini söyler');
  assert.equal(areaFromSpecFile('nonsense-file.js'), null, 'bilinmeyen area → null');
});

if (failures.length > 0) {
  console.error(`Draft-finding self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  'Draft-finding self-check geçti: classifyTriage tablosu (5 sınıf + fallback), yalnız REAL-RED ' +
    'taslaklanır, önek-toleranslı dedup, doktrin alanları sabit (possibleCauses/rootCause), ' +
    'parseAssertion honest-fallback, determinizm (bayt-aynı + stabil slug), registry YAZMAZ + ' +
    'Date.now/random YOK (statik), prepareDraftBundle allowlist/secret/local-only, suggestion-only.'
);
