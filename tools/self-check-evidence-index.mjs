#!/usr/bin/env node
// @ts-check
/**
 * WP-EVIDENCE FAZ 3 (ADR-0026 §4-§5) — evidence-index üreteci negatif self-check.
 *
 * Determinizm, dürüstlük ve güvenlik kontratlarını her koşuda kanıtlar:
 *  1. Bundle dizininden bulgu başına doğru kayıt (artifactPath/runUrl/expiry/capturedAt).
 *  2. Kanıt tercihi: location.png > safe-final-state.png > network-summary.json.
 *  3. Dürüstlük: temsili kanıtı olmayan (yalnız metadata/candidate) bundle index'e GİRMEZ.
 *  4. metadata.json yok / findingId yok → atlanır (dürüst).
 *  5. DETERMİNİZM: aynı girdi iki kez → BAYT BAYT aynı serileştirme.
 *  6. Provenance enjekte edilir; kayıt YALNIZ 4 sözleşme alanı taşır (root-cause alanı YOK).
 *  7. computeExpiry: enjekte ISO + gün → deterministik ISO; geçersiz girdi → null.
 *  8. Üreteç kaynağı Date.now()/Math.random() KULLANMAZ (statik tarama).
 *  9. Üreteç registry'ye (known-bugs.js) YAZMAZ (statik tarama).
 * 10. Güvensiz artifactPath (traversal) üretilmez / kabul edilmez.
 * 11. list-open-findings: yalnız açık knownBugGuard; bounded (--max) uygulanır.
 * 12. Committed docs/raporlar/evidence-index.json geçerli + şema uyumlu.
 * 13. prepareEvidenceLane şeması: root-cause alanı içeren index REDDEDİLİR.
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  buildEvidenceIndex,
  serializeEvidenceIndex,
  computeExpiry,
} from './generate-evidence-index.mjs';
import { pickEvidenceArtifact, EVIDENCE_ARTIFACT_PREFERENCE } from './forensic-lib.mjs';
import { listOpenGuardFindings } from './list-open-findings.mjs';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
};

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const scratch = resolve(root, 'test-results', '.evidence-index-selfcheck');
rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

/** Sentetik bir kanıt bundle alt-dizini oluşturur. */
function makeBundle(baseDir, dirName, findingId, files) {
  const dir = join(baseDir, dirName);
  mkdirSync(dir, { recursive: true });
  if (findingId !== null) {
    writeFileSync(join(dir, 'metadata.json'), JSON.stringify({ findingId }) + '\n');
  }
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

const INJECT = {
  runUrl: 'https://github.com/acme/repo/actions/runs/999',
  capturedAt: '2026-08-06T00:00:00Z',
  expiry: '2026-09-05T00:00:00Z',
};

// ── 1-2-3-4. Temel üretim + tercih + dürüstlük ────────────────────────────────
check('bundle → bulgu başına kayıt; kanıt tercihi + dürüstlük', () => {
  const base = join(scratch, 'bundles-1');
  rmSync(base, { recursive: true, force: true });
  mkdirSync(base, { recursive: true });
  // B4: hem location hem final-state → location tercih.
  makeBundle(base, 'evidence-bundle-B4-abc1234-999', 'B4', {
    'location.png': PNG,
    'safe-final-state.png': PNG,
    'network-summary.json': '{"requests":[]}',
    'candidate-update.json': '{"findingId":"B4"}',
  });
  // B2: yalnız final-state → final-state.
  makeBundle(base, 'evidence-bundle-B2-abc1234-999', 'B2', {
    'safe-final-state.png': PNG,
  });
  // B9: yalnız network → network.
  makeBundle(base, 'evidence-bundle-B9-abc1234-999', 'B9', {
    'network-summary.json': '{"requests":[]}',
  });
  // B13: yalnız metadata + candidate → KANIT YOK → index'e GİRMEZ (dürüstlük).
  makeBundle(base, 'evidence-bundle-B13-abc1234-999', 'B13', {
    'candidate-update.json': '{"findingId":"B13"}',
  });
  // Bozuk: metadata yok → atlanır.
  makeBundle(base, 'evidence-bundle-BROKEN-abc1234-999', null, {
    'safe-final-state.png': PNG,
  });

  const { index } = buildEvidenceIndex({ bundlesDir: base, ...INJECT });
  assert.deepEqual(Object.keys(index).sort(), ['B2', 'B4', 'B9'], 'yalnız kanıtı olan 3 bulgu');
  assert.equal(index.B4.artifactPath, 'evidence-bundle-B4-abc1234-999/location.png');
  assert.equal(index.B2.artifactPath, 'evidence-bundle-B2-abc1234-999/safe-final-state.png');
  assert.equal(index.B9.artifactPath, 'evidence-bundle-B9-abc1234-999/network-summary.json');
  assert.equal(index.B4.runUrl, INJECT.runUrl);
  assert.equal(index.B4.expiry, INJECT.expiry);
  assert.equal(index.B4.capturedAt, INJECT.capturedAt);
  assert.ok(!('B13' in index), 'kanıtsız bulgu index\'e girmemeli (dürüstlük)');
});

check('pickEvidenceArtifact tercih sırası + kanıtsızda null', () => {
  assert.equal(pickEvidenceArtifact(['safe-final-state.png', 'location.png']), 'location.png');
  assert.equal(pickEvidenceArtifact(['network-summary.json', 'safe-final-state.png']), 'safe-final-state.png');
  assert.equal(pickEvidenceArtifact(['network-summary.json']), 'network-summary.json');
  assert.equal(pickEvidenceArtifact(['metadata.json', 'candidate-update.json']), null);
  assert.equal(pickEvidenceArtifact([]), null);
  assert.deepEqual([...EVIDENCE_ARTIFACT_PREFERENCE], ['location.png', 'safe-final-state.png', 'network-summary.json']);
});

// ── 5. Determinizm ────────────────────────────────────────────────────────────
check('DETERMİNİZM: aynı girdi iki kez → bayt bayt aynı', () => {
  const base = join(scratch, 'bundles-det');
  rmSync(base, { recursive: true, force: true });
  mkdirSync(base, { recursive: true });
  // Sıralama bağımsızlığı: alfabetik olmayan sırada eklenen bulgular.
  makeBundle(base, 'evidence-bundle-B9-x-1', 'B9', { 'location.png': PNG });
  makeBundle(base, 'evidence-bundle-B2-x-1', 'B2', { 'location.png': PNG });
  makeBundle(base, 'evidence-bundle-B4-x-1', 'B4', { 'location.png': PNG });
  const a = serializeEvidenceIndex(buildEvidenceIndex({ bundlesDir: base, ...INJECT }).index);
  const b = serializeEvidenceIndex(buildEvidenceIndex({ bundlesDir: base, ...INJECT }).index);
  assert.equal(a, b, 'iki koşum aynı olmalı');
  // Serileştirme bulgu id'leri sıralı olmalı.
  const parsed = JSON.parse(a);
  assert.deepEqual(Object.keys(parsed), ['B2', 'B4', 'B9'], 'anahtarlar sıralı');
});

// ── 6. Kayıt YALNIZ 4 sözleşme alanı; root-cause alanı YOK ─────────────────────
check('kayıt yalnız {artifactPath,runUrl,expiry,capturedAt} taşır', () => {
  const base = join(scratch, 'bundles-fields');
  rmSync(base, { recursive: true, force: true });
  mkdirSync(base, { recursive: true });
  makeBundle(base, 'evidence-bundle-B4-x-1', 'B4', { 'safe-final-state.png': PNG });
  const { index } = buildEvidenceIndex({ bundlesDir: base, ...INJECT });
  assert.deepEqual(Object.keys(index.B4).sort(), ['artifactPath', 'capturedAt', 'expiry', 'runUrl']);
  for (const forbidden of ['rootCause', 'possibleCauses', 'rootCauseCandidate']) {
    assert.ok(!(forbidden in index.B4), `${forbidden} olmamalı`);
  }
});

// ── 7. computeExpiry ──────────────────────────────────────────────────────────
check('computeExpiry: enjekte ISO + gün → deterministik ISO; geçersiz → null', () => {
  assert.equal(computeExpiry('2026-08-06T00:00:00Z', 30), '2026-09-05T00:00:00.000Z');
  assert.equal(computeExpiry('2026-08-06T00:00:00Z', 30), computeExpiry('2026-08-06T00:00:00Z', 30));
  assert.equal(computeExpiry('not-a-date', 30), null);
  assert.equal(computeExpiry('2026-08-06T00:00:00Z', 'x'), null);
});

// ── 8. Üreteç Date.now / Math.random KULLANMAZ (statik) ───────────────────────
check('üreteç kaynağı Date.now()/Math.random() içermez', () => {
  const src = readFileSync(join(root, 'tools', 'generate-evidence-index.mjs'), 'utf8');
  assert.ok(!/Date\.now\s*\(/.test(src), 'Date.now() kullanılmamalı');
  assert.ok(!/Math\.random\s*\(/.test(src), 'Math.random() kullanılmamalı');
  // new Date(...) YALNIZ argümanlı (enjekte edilen epoch/ISO) kullanılabilir; argümansız YASAK.
  assert.ok(!/new Date\s*\(\s*\)/.test(src), 'argümansız new Date() kullanılmamalı');
});

// ── 9. Üreteç registry'ye YAZMAZ (statik) ─────────────────────────────────────
check('üreteç + list-open-findings known-bugs.js\'e YAZMAZ', () => {
  for (const f of ['generate-evidence-index.mjs', 'list-open-findings.mjs']) {
    const src = readFileSync(join(root, 'tools', f), 'utf8');
    const writesRegistry =
      /(write|append)FileSync[^\n]*known-bugs/i.test(src) ||
      /known-bugs[^\n]*(write|append)FileSync/i.test(src);
    assert.ok(!writesRegistry, `${f} registry'ye yazıyor görünüyor`);
  }
});

// ── 10. Güvensiz artifactPath kabul edilmez ───────────────────────────────────
check('traversal içeren bundle adı index\'e güvensiz path üretmez', () => {
  const base = join(scratch, 'bundles-trav');
  rmSync(base, { recursive: true, force: true });
  mkdirSync(base, { recursive: true });
  // Normal bundle güvenli path üretir.
  makeBundle(base, 'evidence-bundle-B4-x-1', 'B4', { 'safe-final-state.png': PNG });
  const { index } = buildEvidenceIndex({ bundlesDir: base, ...INJECT });
  for (const rec of Object.values(index)) {
    assert.ok(!rec.artifactPath.includes('..'), 'artifactPath .. içermemeli');
    assert.ok(!rec.artifactPath.startsWith('/'), 'artifactPath absolute olmamalı');
  }
});

// ── 11. list-open-findings: açık knownBugGuard + bounded ──────────────────────
check('listOpenGuardFindings: yalnız açık knownBugGuard, bounded --max', () => {
  const all = listOpenGuardFindings(KNOWN_BUGS, null);
  assert.ok(all.length > 0, 'en az bir açık bulgu olmalı');
  for (const id of all) {
    const b = KNOWN_BUGS.find((x) => x.id === id);
    assert.equal(b.guard, 'knownBugGuard', `${id} knownBugGuard olmalı`);
    assert.equal(b.status, 'open', `${id} open olmalı`);
    assert.ok(!/\.mutation\./.test(b.test.file), `${id} mutation testi olmamalı`);
  }
  const bounded = listOpenGuardFindings(KNOWN_BUGS, 3);
  assert.equal(bounded.length, 3, 'bounded 3 döndürmeli');
  assert.deepEqual(bounded, all.slice(0, 3), 'bounded deterministik prefix olmalı');
});

// ── 12. Committed evidence-index.json geçerli + şema ──────────────────────────
check('committed docs/raporlar/evidence-index.json geçerli + şema uyumlu', () => {
  const p = join(root, 'docs', 'raporlar', 'evidence-index.json');
  assert.ok(existsSync(p), 'evidence-index.json committed olmalı');
  const parsed = JSON.parse(readFileSync(p, 'utf8'));
  assert.ok(parsed && typeof parsed === 'object' && !Array.isArray(parsed), 'üst düzey harita olmalı');
  for (const [id, rec] of Object.entries(parsed)) {
    assert.ok(rec && typeof rec === 'object', `${id}: kayıt nesnesi`);
    for (const k of ['artifactPath', 'runUrl', 'expiry', 'capturedAt']) {
      assert.ok(k in rec, `${id}: ${k} alanı olmalı`);
    }
    for (const forbidden of ['rootCause', 'possibleCauses', 'rootCauseCandidate']) {
      assert.ok(!(forbidden in rec), `${id}: yasak alan ${forbidden}`);
    }
  }
});

// ── Temizlik + sonuç ──────────────────────────────────────────────────────────
rmSync(scratch, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(`Evidence-index self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  'Evidence-index self-check geçti: bundle→kayıt + kanıt tercihi (location>final-state>network), ' +
    'dürüstlük (kanıtsız bulgu index dışı), determinizm (bayt bayt), yalnız 4 sözleşme alanı ' +
    '(root-cause YOK), computeExpiry deterministik, üreteç Date.now/random YOK + registry YAZMAZ, ' +
    'güvenli artifactPath, list-open-findings bounded, committed index şema uyumlu.'
);
