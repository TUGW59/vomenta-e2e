#!/usr/bin/env node
// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 3 (ACCEPTANCE) — TEK SHARD ORCHESTRATOR'ı (CLI) — ADR-0027.
 *
 * Sharded read-only audit lane'inin matrix parçasıdır. run-audit.mjs'in doğruluk-kapısı
 * semantiğini (false-green yasağı, §3.8) TEK SHARD düzeyinde uygular:
 *   1. Eski runtime JSON + eski shard payload TEMİZLENİR (stale reuse engeli).
 *   2. Playwright bu parça için koşar (`--shard=i/N`), TEST exit code saklanır (kırılsa DA devam).
 *   3. Runtime JSON GERÇEKTEN oluştuysa → flattenRuntimeTests ile SANİTİZE düz kayıtlar
 *      çıkarılır ve güvenli shard payload (shard-results.json) yazılır. Bu payload merge
 *      job'ının TEK girdisidir; ham report.json ASLA artifact sınırından geçmez.
 *   4. FINAL exit: runtime JSON yok/stale → hard fail; payload yazılamadı → fail; test
 *      kırmızı → payload yazılmış OLSA BİLE non-zero (yönetici gerçeği görsün, ama shard
 *      job'ı kırmızı kalsın). Payload testExitCode taşır → merge katmanı bağımsız gate eder.
 *
 * GÜVENLİK: mutation/external-cost runtime'da grepInvert ile elenir (config @mutation +
 * bu CLI'ın --grep-invert "@mutation|@external-cost" belt-and-suspenders'ı). ALLOW_MUTATING_TESTS
 * bu lane'de false; selectör + audit-ci assert-safe seçimi zaten fail-closed doğrular.
 *
 * Kullanım:
 *   node tools/audit-shard-run.mjs --shard-index 1 --shard-total 4 \
 *        [--project chromium-authed] [--grep @critical] \
 *        [--grep-invert "@mutation|@external-cost"] \
 *        [--runtime-json test-results/report.json] [--out test-results/audit-shards/shard-1.json] \
 *        [--test-cmd "<shell>"]   # self-check enjeksiyonu (production'a bağlanmadan)
 */
import { existsSync, rmSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import { flattenRuntimeTests } from './runtime-report-lib.mjs';
import { SHARD_PAYLOAD_SCHEMA_VERSION } from './audit-shard-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const o = {
    project: 'chromium-authed',
    grep: '',
    grepInvert: '@mutation|@external-cost',
    shardIndex: null,
    shardTotal: null,
    runtimeJson: 'test-results/report.json',
    out: null,
    testCmd: null,
    keepInput: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    const kv = (k) => (a === `--${k}` ? next() : a.startsWith(`--${k}=`) ? a.slice(k.length + 3) : undefined);
    for (const k of ['project', 'grep', 'grep-invert', 'shard-index', 'shard-total', 'runtime-json', 'out', 'test-cmd']) {
      const v = kv(k);
      if (v !== undefined) o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
    }
    if (a === '--keep-input') o.keepInput = true;
  }
  return o;
}

function log(msg) {
  console.log(`[audit-shard] ${msg}`);
}

function run(label, cmd) {
  log(`${label}: çalıştırılıyor…`);
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit', encoding: 'utf8' });
  const code = typeof r.status === 'number' ? r.status : r.signal ? 1 : 1;
  log(`${label}: exit ${code}`);
  return code;
}

function resolveCommitSha() {
  if (process.env.GITHUB_SHA) return String(process.env.GITHUB_SHA);
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const shardIndex = Number(o.shardIndex);
  const shardTotal = Number(o.shardTotal);
  if (!Number.isInteger(shardIndex) || !Number.isInteger(shardTotal) || shardIndex < 1 || shardTotal < 1 || shardIndex > shardTotal) {
    log(`HATA: geçersiz --shard-index/--shard-total (${o.shardIndex}/${o.shardTotal}).`);
    process.exit(2);
  }
  const runtimeJsonAbs = resolve(root, o.runtimeJson);
  // Sabit ad: her shard job'ı izole FS'te koşar; artifact ADI shard indeksiyle ayrışır.
  const outAbs = resolve(root, o.out || join('test-results', 'audit-shards', 'shard-results.json'));

  // 1) TEMİZLİK — eski runtime JSON + eski shard payload (stale reuse engeli).
  if (!o.keepInput && existsSync(runtimeJsonAbs)) {
    rmSync(runtimeJsonAbs, { force: true });
    log(`temizlendi: ${relative(root, runtimeJsonAbs)}`);
  }
  if (existsSync(outAbs)) rmSync(outAbs, { force: true });

  // 2) TEST — bu parça. Kırılsa DA devam; exit saklanır.
  const grepFlag = o.grep ? ` --grep=${JSON.stringify(o.grep)}` : '';
  const grepInvertFlag = o.grepInvert ? ` --grep-invert=${JSON.stringify(o.grepInvert)}` : '';
  const testCmd =
    o.testCmd ||
    `npx playwright test --project=${o.project}${grepFlag}${grepInvertFlag} --shard=${shardIndex}/${shardTotal}`;
  const testExitCode = run(`test shard ${shardIndex}/${shardTotal}`, testCmd);

  // 3) Runtime JSON GERÇEKTEN oluştu mu? Oluşmadıysa payload yazılamaz (stale reuse yasak).
  const runtimeJsonExists = existsSync(runtimeJsonAbs) && statSync(runtimeJsonAbs).size > 0;
  let payloadWritten = false;
  if (runtimeJsonExists) {
    let report;
    try {
      report = JSON.parse(readFileSync(runtimeJsonAbs, 'utf8'));
    } catch {
      report = null;
    }
    if (report && typeof report === 'object' && Array.isArray(report.suites)) {
      const tests = flattenRuntimeTests(report); // ZATEN sanitize (redact + slice; ham stack yok)
      const startedAt =
        report.stats && report.stats.startTime ? String(report.stats.startTime) : new Date().toISOString();
      const payload = {
        schemaVersion: SHARD_PAYLOAD_SCHEMA_VERSION,
        shardIndex,
        shardTotal,
        commitSha: resolveCommitSha(),
        startedAt,
        testExitCode,
        project: o.project,
        tests,
      };
      mkdirSync(dirname(outAbs), { recursive: true });
      writeFileSync(outAbs, JSON.stringify(payload, null, 2) + '\n');
      payloadWritten = true;
      log(`shard payload yazıldı → ${relative(root, outAbs)} (test ${tests.length}, exit ${testExitCode})`);
    } else {
      log('HATA: runtime JSON beklenen şemada değil (suites yok); payload yazılamadı.');
    }
  } else {
    log('HATA: runtime JSON yok (test rapor üretmeden çöktü); payload yazılamadı — stale reuse yasak.');
  }

  // 4) FINAL exit — false-green yasağı (§3.8) shard düzeyinde.
  const testFailed = testExitCode !== 0;
  if (!payloadWritten) {
    log('SONUÇ: payload üretilemedi → shard non-zero (merge bu shard\'ı EKSİK görecek, birleşme hard-fail).');
    process.exit(1);
  }
  if (testFailed) {
    log('SONUÇ: payload üretildi ama test kırmızı → shard non-zero (payload testExitCode taşır; artifact yine yüklenir).');
    process.exit(1);
  }
  log('SONUÇ: shard yeşil (test geçti, payload üretildi).');
  process.exit(0);
}

main();
