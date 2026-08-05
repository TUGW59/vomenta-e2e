#!/usr/bin/env node
// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 3 (ACCEPTANCE) — SHARD MERGE ORCHESTRATOR'ı (CLI) — ADR-0027.
 *
 * N shard'ın SANİTİZE payload'unu (shard-results.json) TEK deterministik birleşik
 * rapora indirger. run-audit.mjs'in doğruluk-kapısı semantiğini (false-green yasağı,
 * §3.8) MERGE düzeyinde uygular:
 *   1. Eski birleşik girdi + üretilmiş snapshot TEMİZLENİR (stale reuse engeli).
 *   2. --shards-dir altındaki tüm `shard-results.json`'lar toplanır; mergeShardPayloads
 *      ile FAIL-CLOSED birleştirilir: eksik shard / karışık commit / şema hatası → hard
 *      fail (birleşme YAPILMAZ; sahte yeşil olmaz).
 *   3. Birleşik flat payload yazılır; generate-runtime-report --flat-input ile TEK
 *      yönetici raporu (HTML/JSON/MD/manifest) üretilir (aynı sızıntı/provenance kapısı).
 *   4. FINAL exit (decideFinalExit): merge girdisi yok/eksik → non-zero; herhangi bir
 *      shard testi kırmızı → rapor üretilmiş OLSA BİLE non-zero; rapor üretilemedi → non-zero.
 *
 * Kullanım:
 *   node tools/merge-audit-shards.mjs --shards-dir test-results/audit-shards --shard-total 4 \
 *        [--out-dir docs/raporlar] [--flat-out test-results/audit-shards/merged-flat.json] \
 *        [--environment production-read-only] [--min-start-time <ISO>] [--report-cmd "<shell>"]
 */
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import { decideFinalExit, FINAL_REASON } from './audit-orchestrator-lib.mjs';
import { mergeShardPayloads, SHARD_PAYLOAD_SCHEMA_VERSION, ShardMergeError } from './audit-shard-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_OUTPUTS = ['TEST-SONUCLARI.json', 'SAYFA-TEST-SONUCLARI.md', 'SABAH-KALITE-OZETI.html', 'SABAH-TESLIM-MANIFEST.json'];

function parseArgs(argv) {
  const o = {
    shardsDir: 'test-results/audit-shards',
    shardTotal: null,
    outDir: 'docs/raporlar',
    flatOut: 'test-results/audit-shards/merged-flat.json',
    environment: 'production-read-only',
    minStartTime: null,
    reportCmd: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const kv = (k) => (a === `--${k}` ? argv[++i] : a.startsWith(`--${k}=`) ? a.slice(k.length + 3) : undefined);
    for (const k of ['shards-dir', 'shard-total', 'out-dir', 'flat-out', 'environment', 'min-start-time', 'report-cmd']) {
      const v = kv(k);
      if (v !== undefined) o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
    }
  }
  return o;
}

function log(msg) {
  console.log(`[merge-audit] ${msg}`);
}

function run(label, cmd) {
  log(`${label}: çalıştırılıyor…`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit', encoding: 'utf8' });
  const code = typeof r.status === 'number' ? r.status : r.signal ? 1 : 1;
  log(`${label}: exit ${code}`);
  return code;
}

/** shards-dir altında (özyinelemeli) tüm shard-results.json dosyalarını topla. */
function collectShardPayloadFiles(dirAbs) {
  const out = [];
  const walk = (d) => {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name === 'shard-results.json') out.push(p);
    }
  };
  walk(dirAbs);
  return out.sort();
}

function finish(decision) {
  log(
    `SONUÇ: final ${decision.finalExit} (${decision.reason})` +
      (decision.reason === FINAL_REASON.TEST_FAILED
        ? ' — NOT: birleşik rapor üretildi; yönetici gerçeği görür ama koşum kırmızıdır.'
        : '')
  );
  process.exit(decision.finalExit);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const shardsDirAbs = resolve(root, o.shardsDir);
  const outDirAbs = resolve(root, o.outDir);
  const flatOutAbs = resolve(root, o.flatOut);
  const expectedTotal = o.shardTotal != null ? Number(o.shardTotal) : null;

  // 1) TEMİZLİK — eski birleşik girdi + üretilmiş snapshot (stale reuse engeli).
  if (existsSync(flatOutAbs)) rmSync(flatOutAbs, { force: true });
  for (const f of REQUIRED_OUTPUTS) {
    const p = join(outDirAbs, f);
    if (existsSync(p)) rmSync(p, { force: true });
  }

  // 2) Shard payload'larını topla + FAIL-CLOSED birleştir.
  const files = collectShardPayloadFiles(shardsDirAbs);
  log(`bulunan shard payload: ${files.length} (${relative(root, shardsDirAbs)} altında)`);
  const payloads = [];
  for (const f of files) {
    try {
      payloads.push(JSON.parse(readFileSync(f, 'utf8')));
    } catch {
      log(`UYARI: parse edilemedi, atlanıyor: ${relative(root, f)}`);
    }
  }

  let merged;
  try {
    merged = mergeShardPayloads(payloads, expectedTotal != null ? { expectedTotal } : {});
  } catch (err) {
    const code = err instanceof ShardMergeError ? err.code : 'MERGE_ERROR';
    log(`HATA: birleşme reddedildi (fail-closed) [${code}]: ${err instanceof Error ? err.message : String(err)}`);
    // Merge girdisi yok/eksik/karışık → runtime JSON yok muamelesi (stale rapor kullanılmaz).
    finish(decideFinalExit({ runtimeJsonExists: false, reportProduced: false, testExitCode: 1, reportExitCode: 1 }));
    return;
  }
  log(
    `birleşti: shard ${merged.shardCount}/${merged.shardTotal} · test ${merged.tests.length} · ` +
      `aggregate testExit ${merged.aggregateTestExitCode} · commit ${merged.commitSha ? merged.commitSha.slice(0, 8) : '—'}`
  );
  for (const s of merged.perShard) {
    log(`  shard ${s.shardIndex}: test ${s.testCount} · exit ${s.testExitCode} · started ${s.startedAt}`);
  }

  // 3) Stale ön-kontrolü (opsiyonel): en erken shard başlangıcı < min → stale.
  let staleDetected = false;
  if (o.minStartTime) {
    const min = Date.parse(o.minStartTime);
    const started = Date.parse(merged.startedAt);
    if (!Number.isFinite(started) || started < min) staleDetected = true;
  }

  // 4) Birleşik flat payload yaz (generate-runtime-report --flat-input girdisi).
  const flatPayload = {
    schemaVersion: SHARD_PAYLOAD_SCHEMA_VERSION,
    tests: merged.tests,
    source: {
      commitSha: merged.commitSha,
      project: 'chromium-authed',
      environment: o.environment,
      browser: 'chromium',
      runStartedAt: merged.startedAt,
      runId: process.env.GITHUB_RUN_ID || null,
    },
  };
  mkdirSync(dirname(flatOutAbs), { recursive: true });
  writeFileSync(flatOutAbs, JSON.stringify(flatPayload, null, 2) + '\n');
  log(`birleşik flat payload → ${relative(root, flatOutAbs)}`);

  // 5) RAPOR — yalnız stale değilse. generate-runtime-report kendi kapılarını uygular.
  let reportExitCode = 1;
  let reportProduced = false;
  if (!staleDetected) {
    const reportCmd =
      o.reportCmd ||
      `node tools/generate-runtime-report.mjs --flat-input ${JSON.stringify(o.flatOut)} --out-dir ${JSON.stringify(
        o.outDir
      )} --environment ${JSON.stringify(o.environment)}${o.minStartTime ? ` --min-start-time ${JSON.stringify(o.minStartTime)}` : ''}`;
    reportExitCode = run('report (merged)', reportCmd);
    reportProduced = REQUIRED_OUTPUTS.every((f) => existsSync(join(outDirAbs, f)));
  } else {
    log('rapor atlandı: stale girdi (en erken shard başlangıcı min-start-time altında).');
  }

  // 6) FINAL exit — merge girdisi VAR (runtimeJsonExists=true); false-green yasağı korunur.
  finish(
    decideFinalExit({
      runtimeJsonExists: true,
      staleDetected,
      reportProduced,
      testExitCode: merged.aggregateTestExitCode,
      reportExitCode,
    })
  );
}

main();
