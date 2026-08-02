// @ts-check
/**
 * PR-IMPACT RUNNER CLI (WP-CI-E2 / Faz 2).
 *
 * `selection.json` planını okur, saf karar kütüphanesiyle (pr-impact-runner-lib)
 * yürütülecek grupları belirler ve HER grubu GERÇEK Playwright ile — güvenli
 * argument array kullanarak (shell interpolation YOK) — çalıştırır.
 *
 * Sözleşme (handoff §2.4):
 *   1) Şema doğrulanır; bozuk plan reddedilir.
 *   2) sourceMissing / unmapped runtime → koşmayı reddeder (non-zero).
 *   3) Her proje grubu EXACT spec listesiyle koşar.
 *   4) Argument array — string interpolation yok.
 *   5) Koşumdan ÖNCE `--list` ile hedef test sayısı doğrulanır (0 → kırmızı).
 *   6) Setup/dependency testleri hedef sayıdan ayrı raporlanır.
 *   7) Birden çok grupta herhangi biri kırmızıysa genel exit non-zero.
 *   8) Retry sonucu flaky ise başarıya çevrilmez.
 *   9) Mutation etiketi/spec'i son savunma katmanında yeniden reddedilir.
 *  10) Kısa, secretsiz step summary üretilir.
 *
 * Bu araç production'a karşı GERÇEK test koşabilir; ama karar mantığı saf
 * kütüphanededir ve negatif kanıt oradan sentetik olarak doğrulanır.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { planRun, interpretGroup, aggregate, RUNNER_SCHEMA_VERSION } from './pr-impact-runner-lib.mjs';

function parseArgs(argv) {
  const out = { plan: 'test-results/pr-impact/selection.json', root: process.cwd(), dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--plan') out.plan = next();
    else if (a === '--root') out.root = path.resolve(next());
    else if (a === '--dry-run') out.dryRun = true; // Playwright'ı çağırmaz; kararı yazdırır
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

/** Yerel Playwright ikilisini bulur (npx ağ çağrısından kaçınır). */
function playwrightBin(root) {
  const local = path.join(root, 'node_modules', '.bin', 'playwright');
  return existsSync(local) ? local : null;
}

/**
 * Playwright JSON raporunu hedef projeye göre yürür; setup HARİÇ sayar.
 * @returns {{ count: number, expected: number, unexpected: number, flaky: number, skipped: number, setup: number }}
 */
function tallyReport(report, targetProject, setupProject) {
  const acc = { count: 0, expected: 0, unexpected: 0, flaky: 0, skipped: 0, setup: 0 };
  const walk = (suite) => {
    if (!suite || typeof suite !== 'object') return;
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const proj = t.projectName;
        if (proj === setupProject) {
          acc.setup += 1;
          continue;
        }
        if (proj !== targetProject) continue;
        acc.count += 1;
        switch (t.status) {
          case 'unexpected':
            acc.unexpected += 1;
            break;
          case 'flaky':
            acc.flaky += 1;
            break;
          case 'skipped':
            acc.skipped += 1;
            break;
          default:
            acc.expected += 1;
        }
      }
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of report.suites || []) walk(s);
  return acc;
}

/**
 * Bir Playwright koşusunu çalıştırır ve JSON raporunu döndürür.
 * @returns {{ exitCode: number, report: any }}
 */
function runPlaywright(bin, root, baseArgs, jsonOut) {
  mkdirSync(path.dirname(jsonOut), { recursive: true });
  rmSync(jsonOut, { force: true });
  const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut };
  let exitCode = 0;
  try {
    execFileSync(bin, baseArgs, {
      cwd: root,
      env,
      stdio: ['ignore', 'ignore', 'inherit'], // stdout gürültüsünü bastır; hatalar stderr'de
    });
  } catch (e) {
    exitCode = typeof e.status === 'number' ? e.status : 1;
  }
  let report = { suites: [] };
  try {
    report = JSON.parse(readFileSync(jsonOut, 'utf8'));
  } catch {
    /* rapor yoksa boş; çağıran 0-test/hata olarak ele alır */
  }
  return { exitCode, report };
}

/** Güvenli (secretsiz) step summary yazar. */
function writeSummary(lines) {
  const body = ['### PR-impact runner', '', '```', ...lines, '```', ''].join('\n');
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (target) {
    try {
      appendFileSync(target, `${body}\n`);
    } catch {
      /* summary yazılamazsa yut; ana exit-code korunur */
    }
  }
  console.error(body);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('Kullanım: node tools/run-pr-impact.mjs [--plan <selection.json>] [--root <dir>] [--dry-run]');
    process.exit(0);
  }

  const absPlan = path.isAbsolute(opts.plan) ? opts.plan : path.join(opts.root, opts.plan);
  let rawPlan;
  try {
    rawPlan = JSON.parse(readFileSync(absPlan, 'utf8'));
  } catch (e) {
    writeSummary([`FAIL — plan okunamadı/parse edilemedi: ${absPlan}`]);
    process.exit(1);
  }

  const decision = planRun(rawPlan);

  if (decision.decision === 'REFUSE') {
    writeSummary([`REFUSE — ${decision.reason}`, 'Runner koşmayı reddetti (fail-closed).']);
    process.exit(decision.exitCode); // 1
  }
  if (decision.decision === 'NOOP') {
    writeSummary([`NOOP — ${decision.reason}`, 'Production runtime gerekmiyor; 0 test koşuldu.']);
    process.exit(0);
  }

  // ── RUN ──
  if (opts.dryRun) {
    const lines = [
      `DRY-RUN — ${decision.groups.length} grup, beklenen exact spec=${decision.expectedRunnableSpecCount}`,
      ...decision.groups.map((g) => `  ${g.key} [${g.project}] files=${g.files.length} grep=${g.grep || '-'}`),
    ];
    writeSummary(lines);
    process.exit(0);
  }

  const bin = playwrightBin(opts.root);
  if (!bin) {
    writeSummary(['FAIL — yerel playwright ikilisi bulunamadı (node_modules/.bin/playwright).']);
    process.exit(1);
  }

  const interpreted = [];
  const outDir = path.join(opts.root, 'test-results', 'pr-impact');
  const safeKey = (k) => k.replace(/[^\w.-]/g, '_');
  for (const g of decision.groups) {
    // Güvenli argument array (shell interpolation YOK).
    //  - --grep-invert=@mutation: mutation son savunması (config'ten bağımsız).
    //  - --reporter=json: config reporter'ını OVERRIDE eder → JSON gerçekten
    //    PLAYWRIGHT_JSON_OUTPUT_NAME'e yazılır. (Config'in json reporter'ı sabit
    //    `test-results/report.json`'a yazar; onu okumak grup başına çakışır.)
    const common = ['test', ...g.files, '--project', g.project, '--grep-invert=@mutation'];
    if (g.grep) common.push('--grep', g.grep);

    // Koşumdan ÖNCE (offline, tarayıcısız): seçili exact spec dosyaları gerçekten
    // diskte var mı? Yoksa plan tamper/rename kaçağıdır → grup kırmızı.
    const missing = g.files.filter((f) => !existsSync(path.join(opts.root, f)));
    if (missing.length > 0) {
      interpreted.push({
        key: g.key,
        passed: false,
        reason: `SPEC_FILE_MISSING:${missing.join(',')}`,
        listedCount: 0,
        ran: 0,
        unexpected: 0,
        flaky: 0,
      });
      continue;
    }

    // Gerçek koşu (retries=0 → flaky maskesi yok). JSON dosyaya yazılır ve okunur.
    const runOut = path.join(outDir, `run-${safeKey(g.key)}.json`);
    const ran = runPlaywright(bin, opts.root, [...common, '--retries=0', '--reporter=json'], runOut);
    const t = tallyReport(ran.report, g.project, g.setup);

    // listedCount = koşuda hedef projede GÖRÜLEN test sayısı (setup hariç). exact
    // grup 0 test → interpretGroup ZERO_TEST verir → sahte-yeşil engellenir.
    interpreted.push(
      interpretGroup(g, {
        listedCount: t.count,
        exitCode: ran.exitCode,
        stats: { expected: t.expected, unexpected: t.unexpected, flaky: t.flaky, skipped: t.skipped },
      })
    );
  }

  const agg = aggregate(interpreted);

  // Makine-okur koşu sonucu (artifact DEĞİL; yerel/log).
  const runResult = {
    schemaVersion: RUNNER_SCHEMA_VERSION,
    decision: decision.decision,
    expectedRunnableSpecCount: decision.expectedRunnableSpecCount,
    groups: interpreted,
    overallExitCode: agg.overallExitCode,
  };
  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, 'run-result.json'), `${JSON.stringify(runResult, null, 2)}\n`, 'utf8');
  } catch {
    /* yazılamazsa exit-code yine de korunur */
  }

  writeSummary([
    `${agg.allGreen ? 'GREEN' : 'RED'} — ${interpreted.length} grup, beklenen exact spec=${decision.expectedRunnableSpecCount}`,
    ...agg.lines,
  ]);
  process.exit(agg.overallExitCode);
}

main();
