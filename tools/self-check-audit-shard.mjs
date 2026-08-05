#!/usr/bin/env node
// @ts-check
/**
 * SHARDED AUDIT MERGE ÇEKİRDEĞİ SELF-CHECK — SERT KAPI (FAZ 3 ACCEPTANCE, ADR-0027).
 *
 * tools/audit-shard-lib.mjs saf fonksiyonlarını TAMAMEN SENTETİK doğrular (diske/prod'a
 * dokunmadan): validateShardPayload + mergeShardPayloads fail-closed davranır (eksik
 * shard, çakışan indeks, karışık commit, şema hatası, bozuk kayıt), birleşim
 * DETERMİNİSTİK'tir (girdi sırasından bağımsız) ve merged flatTests runtime-report
 * motoruna (buildResultModel) BESLENEBİLİR (uçtan uca sözleşme).
 *
 * Çalıştır:  node tools/self-check-audit-shard.mjs  (npm run quality:audit-shard)
 */
import assert from 'node:assert/strict';
import {
  SHARD_PAYLOAD_SCHEMA_VERSION,
  SHARD_RULES,
  ShardMergeError,
  validateShardPayload,
  mergeShardPayloads,
  shardSortKey,
} from './audit-shard-lib.mjs';
import { buildResultModel } from './runtime-report-lib.mjs';

const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (e) {
    failures.push(`${label}: ${e.message}`);
  }
};

/** fn ShardMergeError fırlatmalı; code === ruleId olmalı. */
function expectCode(fn, code, label) {
  try {
    fn();
  } catch (e) {
    if (e instanceof ShardMergeError) {
      assert.equal(e.code, code, `${label}: beklenen ${code}, gelen ${e.code}`);
      return;
    }
    throw new Error(`${label}: ShardMergeError bekleniyordu, gelen: ${e.message}`);
  }
  throw new Error(`${label}: hata (${code}) beklenirken FIRLATILMADI`);
}

/** Güvenli düz test kaydı (flattenRuntimeTests şeması) fabrikası. */
function rec(over = {}) {
  return {
    file: 'a.spec.js',
    title: 'demo',
    routeMarker: null,
    project: 'chromium-authed',
    expectedStatus: 'passed',
    finalStatus: 'passed',
    firstStatus: 'passed',
    attempts: 1,
    durationMs: 5,
    skipReason: '',
    tags: [],
    ...over,
  };
}

/** Geçerli shard payload fabrikası. */
function shard(index, total, over = {}) {
  return {
    schemaVersion: SHARD_PAYLOAD_SCHEMA_VERSION,
    shardIndex: index,
    shardTotal: total,
    commitSha: 'a'.repeat(40),
    startedAt: `2026-08-04T0${index}:00:00.000Z`,
    testExitCode: 0,
    project: 'chromium-authed',
    tests: [rec({ title: `t${index}` })],
    ...over,
  };
}

// ── validateShardPayload negatifleri ────────────────────────────────────────
check('geçerli payload → doğrulanır', () => {
  assert.equal(validateShardPayload(shard(1, 4)), true);
});
check('nesne değil → PAYLOAD-INVALID', () => {
  expectCode(() => validateShardPayload(null), SHARD_RULES.PAYLOAD_INVALID, 'null');
  expectCode(() => validateShardPayload([]), SHARD_RULES.PAYLOAD_INVALID, 'array');
});
check('yanlış schemaVersion → SCHEMA-MISMATCH', () => {
  expectCode(() => validateShardPayload(shard(1, 4, { schemaVersion: 99 })), SHARD_RULES.SCHEMA_MISMATCH, 'schema');
});
check('geçersiz shardTotal → TOTAL-MISMATCH', () => {
  expectCode(() => validateShardPayload(shard(1, 0)), SHARD_RULES.TOTAL_MISMATCH, 'total0');
});
check('indeks aralık dışı → INDEX-RANGE', () => {
  expectCode(() => validateShardPayload(shard(5, 4)), SHARD_RULES.INDEX_RANGE, 'idx5/4');
  expectCode(() => validateShardPayload(shard(0, 4)), SHARD_RULES.INDEX_RANGE, 'idx0');
});
check('testExitCode sayı değil → PAYLOAD-INVALID', () => {
  expectCode(() => validateShardPayload(shard(1, 4, { testExitCode: 'x' })), SHARD_RULES.PAYLOAD_INVALID, 'exit');
});
check('startedAt ISO değil → PAYLOAD-INVALID', () => {
  expectCode(() => validateShardPayload(shard(1, 4, { startedAt: 'dün' })), SHARD_RULES.PAYLOAD_INVALID, 'iso');
});
check('tests dizi değil → PAYLOAD-INVALID', () => {
  expectCode(() => validateShardPayload(shard(1, 4, { tests: {} })), SHARD_RULES.PAYLOAD_INVALID, 'tests');
});
check('bozuk test kaydı → TEST-RECORD-INVALID', () => {
  expectCode(() => validateShardPayload(shard(1, 4, { tests: [{ file: 'a' }] })), SHARD_RULES.TEST_RECORD_INVALID, 'rec');
});

// ── mergeShardPayloads happy path + determinism ──────────────────────────────
check('4 shard tam küme → birleşir, testFailed=false', () => {
  const m = mergeShardPayloads([shard(1, 4), shard(2, 4), shard(3, 4), shard(4, 4)], { expectedTotal: 4 });
  assert.equal(m.shardCount, 4);
  assert.equal(m.shardTotal, 4);
  assert.equal(m.tests.length, 4);
  assert.equal(m.testFailed, false);
  assert.equal(m.aggregateTestExitCode, 0);
  assert.equal(m.commitSha, 'a'.repeat(40));
  assert.equal(m.startedAt, '2026-08-04T01:00:00.000Z'); // en erken
});
check('birleşim girdi sırasından bağımsız DETERMİNİSTİK', () => {
  const a = mergeShardPayloads([shard(1, 3), shard(2, 3), shard(3, 3)]);
  const b = mergeShardPayloads([shard(3, 3), shard(1, 3), shard(2, 3)]);
  assert.deepEqual(
    a.tests.map(shardSortKey),
    b.tests.map(shardSortKey),
    'farklı sırada gelen shard\'lar aynı birleşik sırayı üretmeli'
  );
});
check('bir shard testExitCode≠0 → testFailed=true, aggregate≠0', () => {
  const m = mergeShardPayloads([shard(1, 2), shard(2, 2, { testExitCode: 1 })], { expectedTotal: 2 });
  assert.equal(m.testFailed, true);
  assert.notEqual(m.aggregateTestExitCode, 0);
});

// ── mergeShardPayloads fail-closed negatifleri ───────────────────────────────
check('eksik shard → MISSING (3/4)', () => {
  expectCode(() => mergeShardPayloads([shard(1, 4), shard(2, 4), shard(3, 4)], { expectedTotal: 4 }), SHARD_RULES.MISSING_SHARD, 'missing');
});
check('boş liste → MISSING', () => {
  expectCode(() => mergeShardPayloads([]), SHARD_RULES.MISSING_SHARD, 'empty');
});
check('çakışan indeks → DUPLICATE-INDEX', () => {
  expectCode(() => mergeShardPayloads([shard(1, 2), shard(1, 2)]), SHARD_RULES.DUPLICATE_INDEX, 'dup');
});
check('karışık shardTotal → TOTAL-MISMATCH', () => {
  expectCode(() => mergeShardPayloads([shard(1, 2), shard(2, 3)]), SHARD_RULES.TOTAL_MISMATCH, 'mixed-total');
});
check('expectedTotal uyuşmazlığı → TOTAL-MISMATCH', () => {
  expectCode(() => mergeShardPayloads([shard(1, 2), shard(2, 2)], { expectedTotal: 4 }), SHARD_RULES.TOTAL_MISMATCH, 'expected');
});
check('commit drift → COMMIT-DRIFT', () => {
  expectCode(
    () => mergeShardPayloads([shard(1, 2), shard(2, 2, { commitSha: 'b'.repeat(40) })], { expectedTotal: 2 }),
    SHARD_RULES.COMMIT_DRIFT,
    'drift'
  );
});

// ── uçtan uca: merged flatTests → buildResultModel (report motoru sözleşmesi) ─
check('merged flatTests buildResultModel\'e beslenir (rota PASS)', () => {
  const merged = mergeShardPayloads(
    [
      shard(1, 2, { tests: [rec({ title: 'ana [route:/x]', routeMarker: '/x', tags: ['route-baseline'] })] }),
      shard(2, 2, { tests: [rec({ title: 'diğer', routeMarker: null })] }),
    ],
    { expectedTotal: 2 }
  );
  const model = buildResultModel({
    registeredRoutes: [{ path: '/x', heading: 'X' }],
    testedPages: [],
    knownBugs: [],
    flatTests: merged.tests,
    source: { commitSha: merged.commitSha, environment: 'production-read-only', browser: 'chromium', runStartedAt: merged.startedAt },
    generatedAt: '2026-08-04T05:00:00.000Z',
  });
  assert.equal(model.pages.length, 1, 'tek kayıtlı rota');
  assert.equal(model.runtime.routeStatusTotals.PASS, 1, '/x PASS olmalı');
  assert.equal(model.runtime.selectedThisRun, 2, 'iki test birleşti');
  assert.equal(model.unmappedTests.length, 1, 'işaretsiz test unmapped');
});

if (failures.length > 0) {
  console.error(`Sharded audit merge self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(
  'Sharded audit merge self-check geçti: validateShardPayload + mergeShardPayloads fail-closed ' +
    '(missing/duplicate/total/commit-drift/schema/record), birleşim deterministik, merged flatTests ' +
    'buildResultModel sözleşmesine uyuyor.'
);
