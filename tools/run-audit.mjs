#!/usr/bin/env node
// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 2 — DOĞRULUK KAPISI ORCHESTRATOR (CLI).
 *
 * "Basit `test && report` zinciri" YASAK (§3.8). Bu orchestrator:
 *   1. Eski runtime JSON + üretilmiş snapshot'ı TEMİZLER (stale reuse engeli).
 *   2. Playwright'ı çalıştırır, TEST exit code'unu saklar (kırılsa da devam).
 *   3. Yeni runtime JSON GERÇEKTEN oluştuysa rapor generator'ı çalıştırır.
 *   4. Generator kendi güvenlik/şema/sızıntı kapılarını uygular; REPORT exit
 *      code'u + zorunlu çıktıların varlığı saklanır.
 *   5. decideFinalExit (saf çekirdek) ile FINAL exit belirlenir:
 *        test FAIL → rapor üretilmiş OLSA BİLE non-zero;
 *        rapor üretilemedi → test PASS olsa bile non-zero;
 *        runtime JSON yok / stale → hard fail.
 *
 * Test/rapor komutları enjekte edilebilir (--test-cmd/--report-cmd) → self-check
 * production'a bağlanmadan tüm exit matrisini uçtan uca doğrular.
 *
 * Kullanım:
 *   node tools/run-audit.mjs [--project chromium-authed] [--grep @route-baseline]
 *        [--runtime-json test-results/report.json] [--out-dir docs/raporlar]
 *        [--min-start-time <ISO>] [--test-cmd "<shell>"] [--report-cmd "<shell>"]
 *        [--environment production-read-only]
 */
import { existsSync, rmSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import { decideFinalExit, FINAL_REASON } from './audit-orchestrator-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_OUTPUTS = ['TEST-SONUCLARI.json', 'SAYFA-TEST-SONUCLARI.md', 'SABAH-KALITE-OZETI.html', 'SABAH-TESLIM-MANIFEST.json'];

function parseArgs(argv) {
  const o = {
    project: 'chromium-authed',
    grep: '@route-baseline',
    runtimeJson: 'test-results/report.json',
    outDir: 'docs/raporlar',
    minStartTime: null,
    environment: 'production-read-only',
    testCmd: null,
    reportCmd: null,
    keepInput: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    const kv = (k) => (a === `--${k}` ? next() : a.startsWith(`--${k}=`) ? a.slice(k.length + 3) : undefined);
    for (const k of ['project', 'grep', 'runtime-json', 'out-dir', 'min-start-time', 'environment', 'test-cmd', 'report-cmd']) {
      const v = kv(k);
      if (v !== undefined) {
        const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        o[camel] = v;
      }
    }
    if (a === '--keep-input') o.keepInput = true;
  }
  return o;
}

/** Güvenli, içerik taşımayan log satırı. */
function log(msg) {
  console.log(`[run-audit] ${msg}`);
}

function run(label, cmd, cwd) {
  log(`${label}: çalıştırılıyor…`);
  const r = spawnSync(cmd, { cwd, shell: true, stdio: 'inherit', encoding: 'utf8' });
  const code = typeof r.status === 'number' ? r.status : r.signal ? 1 : 1;
  log(`${label}: exit ${code}`);
  return code;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const runtimeJsonAbs = resolve(root, o.runtimeJson);
  const outDirAbs = resolve(root, o.outDir);

  // 1) TEMİZLİK — eski runtime JSON + üretilmiş snapshot dosyaları. Stale reuse
  //    engeli: bir sonraki adım GERÇEKTEN yeni JSON üretmezse rapor katmanı
  //    "runtime JSON yok" görüp hard-fail eder.
  if (!o.keepInput && existsSync(runtimeJsonAbs)) {
    rmSync(runtimeJsonAbs, { force: true });
    log(`temizlendi: ${relative(root, runtimeJsonAbs)}`);
  }
  for (const f of REQUIRED_OUTPUTS) {
    const p = join(outDirAbs, f);
    if (existsSync(p)) rmSync(p, { force: true });
  }

  // 2) TEST — Playwright (veya enjekte edilen komut). Kırılsa DA devam; exit saklanır.
  const testCmd =
    o.testCmd ||
    `npx playwright test --project=${o.project} --grep=${JSON.stringify(o.grep)} --reporter=json --output=test-results`;
  // NOT: gerçek koşumda JSON reporter yolu playwright.config'ten gelir; --reporter=json
  //      stdout'a basar, bu yüzden gerçek kullanımda reporter yapılandırması tercih edilir.
  const testExitCode = run('test', testCmd, root);

  // 3) Runtime JSON GERÇEKTEN oluştu mu? Oluşmadıysa rapor katmanına GEÇME.
  const runtimeJsonExists = existsSync(runtimeJsonAbs) && statSync(runtimeJsonAbs).size > 0;

  // 3b) Stale ön-kontrolü (opsiyonel): generator'dan AYRI, distinct gerekçe için.
  let staleDetected = false;
  if (runtimeJsonExists && o.minStartTime) {
    try {
      const parsed = JSON.parse(readFileSync(runtimeJsonAbs, 'utf8'));
      const started = parsed && parsed.stats && parsed.stats.startTime ? Date.parse(String(parsed.stats.startTime)) : NaN;
      const min = Date.parse(o.minStartTime);
      if (!Number.isFinite(started) || started < min) staleDetected = true;
    } catch {
      staleDetected = true; // parse edilemeyen girdi taze sayılmaz
    }
  }

  // 4) RAPOR — yalnız taze JSON varsa. Generator kendi kapılarını uygular.
  let reportExitCode = 1;
  let reportProduced = false;
  if (runtimeJsonExists && !staleDetected) {
    const reportCmd =
      o.reportCmd ||
      `node tools/generate-runtime-report.mjs --input ${JSON.stringify(o.runtimeJson)} --out-dir ${JSON.stringify(
        o.outDir
      )} --environment ${JSON.stringify(o.environment)}${o.minStartTime ? ` --min-start-time ${JSON.stringify(o.minStartTime)}` : ''}`;
    reportExitCode = run('report', reportCmd, root);
    reportProduced = REQUIRED_OUTPUTS.every((f) => existsSync(join(outDirAbs, f)));

    // Rapor başarıyla üretildiyse trend geçmişine sanitize snapshot ekle (§item12).
    // Best-effort: runId yoksa (yerel) yazmaz; başarısızlığı final exit'i YEŞİLDEN
    // KIRMIZIYA çevirmez (zenginleştirme katmanı, doğruluk kapısı değil) ama loglanır.
    if (!o.testCmd && reportProduced && reportExitCode === 0) {
      const histCode = run(
        'history',
        `node tools/append-runtime-history.mjs --input ${JSON.stringify(join(o.outDir, 'TEST-SONUCLARI.json'))} --history-dir ${JSON.stringify(join(o.outDir, 'history'))}`,
        root
      );
      if (histCode !== 0) log('UYARI: trend geçmişi eklenemedi (final exit etkilenmez).');
    }
  } else {
    log(runtimeJsonExists ? 'rapor atlandı: stale girdi.' : 'rapor atlandı: runtime JSON yok (stale reuse yasak).');
  }

  // 5) FINAL exit — saf çekirdek karar verir.
  const decision = decideFinalExit({ runtimeJsonExists, staleDetected, reportProduced, testExitCode, reportExitCode });
  log(
    `SONUÇ: test=${testExitCode} report=${reportProduced ? reportExitCode : 'üretilmedi'} ` +
      `runtimeJson=${runtimeJsonExists ? 'var' : 'yok'}${staleDetected ? ' stale' : ''} → final ${decision.finalExit} (${decision.reason})`
  );
  if (decision.reason === FINAL_REASON.TEST_FAILED) {
    log('NOT: rapor başarıyla üretildi; yönetici gerçeği görebilir ama koşum kırmızıdır.');
  }
  process.exit(decision.finalExit);
}

main();
