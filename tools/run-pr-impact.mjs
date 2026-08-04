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
import {
  planRun,
  interpretGroup,
  aggregate,
  shardGroups,
  planRetry,
  MAX_ATTEMPTS_PER_TEST,
  RUNNER_SCHEMA_VERSION,
} from './pr-impact-runner-lib.mjs';

function parseArgs(argv) {
  const out = {
    plan: 'test-results/pr-impact/selection.json',
    root: process.cwd(),
    dryRun: false,
    shard: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--plan') out.plan = next();
    else if (a === '--root') out.root = path.resolve(next());
    else if (a === '--dry-run') out.dryRun = true; // Playwright'ı çağırmaz; kararı yazdırır
    else if (a === '--shard') out.shard = parseShard(next());
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

/** `N/M` biçimini doğrular ve {index,total} döndürür (geçersizse fail-closed). */
function parseShard(raw) {
  const m = String(raw || '').match(/^(\d+)\/(\d+)$/);
  if (!m) throw new Error(`Geçersiz --shard değeri: "${raw}" (beklenen N/M)`);
  const index = Number(m[1]);
  const total = Number(m[2]);
  if (index < 1 || total < 1 || index > total) {
    throw new Error(`Geçersiz --shard aralığı: ${index}/${total}`);
  }
  return { index, total };
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
function runPlaywright(bin, root, baseArgs, jsonOut, extraEnv = {}) {
  mkdirSync(path.dirname(jsonOut), { recursive: true });
  rmSync(jsonOut, { force: true });
  const env = { ...process.env, ...extraEnv, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut };
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

/**
 * Playwright JSON raporundan başarısız (ok=false) spec'lerin YALNIZ konum+başlığını
 * çıkarır (secret/PII taşımaz). Teşhis için: hangi test kırmızı yaptı görünsün.
 */
function collectFailures(report) {
  const out = [];
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      if (sp.ok === false) {
        const loc = sp.file ? `${path.basename(String(sp.file))}:${sp.line || '?'}` : '?';
        out.push(`${loc} › ${sp.title || '?'}`);
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of report.suites || []) walk(s);
  return out;
}

/**
 * Başarısız (unexpected) testlerin KESİN kimliğini + hata metnini çıkarır
 * (kontrollü retry sınıflandırması ve hedefli yeniden koşum için). Yalnız hedef
 * projedeki unexpected sonuçlar. Konum spec dosyasının test satırıdır → `file:line`
 * ile TEK bir test hedeflenebilir.
 * @returns {Array<{ file: string, line: number, title: string, errorText: string }>}
 */
function collectFailureDetails(report, targetProject) {
  const out = [];
  const walk = (suite) => {
    if (!suite || typeof suite !== 'object') return;
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        if (t.projectName !== targetProject) continue;
        if (t.status !== 'unexpected') continue;
        const parts = [];
        for (const r of t.results || []) {
          if (r.error) parts.push(r.error.message || '', r.error.stack || '');
          for (const e of r.errors || []) parts.push(e.message || '', e.stack || '');
        }
        out.push({
          file: spec.file ? String(spec.file) : '',
          line: Number(spec.line || 0),
          title: spec.title || '',
          errorText: parts.filter(Boolean).join('\n'),
        });
      }
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of report.suites || []) walk(s);
  return out;
}

/** `file:line` biçiminde güvenli, repo-göreli Playwright konum argümanı üretir. */
function locationArg(root, file, line) {
  if (!file || !line) return null;
  let rel = file;
  if (path.isAbsolute(file)) rel = path.relative(root, file);
  rel = rel.split(path.sep).join('/');
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null; // root dışına çıkma
  return `${rel}:${line}`;
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
    console.log(
      'Kullanım: node tools/run-pr-impact.mjs [--plan <selection.json>] [--root <dir>] ' +
        '[--shard N/M] [--dry-run]'
    );
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
  // Shard: koşum deterministik olarak parçalara bölünür (kapsam birleşimde korunur).
  const shard = opts.shard;
  const shardLabel = shard ? `${shard.index}/${shard.total}` : '1/1';
  const groups = shard ? shardGroups(decision.groups, shard.index, shard.total) : decision.groups;

  if (opts.dryRun) {
    const lines = [
      `DRY-RUN — shard=${shardLabel} — ${groups.length} grup ` +
        `(plan toplam ${decision.groups.length}), beklenen exact spec=${decision.expectedRunnableSpecCount}`,
      ...groups.map((g) => `  ${g.key} [${g.project}] files=${g.files.length} grep=${g.grep || '-'}`),
    ];
    writeSummary(lines);
    process.exit(0);
  }

  const outDir = path.join(opts.root, 'test-results', 'pr-impact');

  // Bir shard'a hiç iş düşmediyse meşru SHARD_NOOP (exit 0). Kapsam diğer shard'lar +
  // aggregate gate ile korunur; bu shard 0 test koşar ama sahte-yeşil DEĞİLDİR.
  if (groups.length === 0) {
    writeSummary([
      `SHARD_NOOP — shard=${shardLabel} — bu parçaya atanmış exact spec yok; 0 test koşuldu.`,
      'Kapsam diğer shard\'ların birleşiminde + aggregate gate\'te korunur.',
    ]);
    try {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        path.join(outDir, `run-result-shard-${shard ? shard.index : 1}.json`),
        `${JSON.stringify(
          {
            schemaVersion: RUNNER_SCHEMA_VERSION,
            shard: shardLabel,
            decision: 'SHARD_NOOP',
            groups: [],
            overallExitCode: 0,
          },
          null,
          2
        )}\n`,
        'utf8'
      );
    } catch {
      /* yazılamazsa exit-code yine korunur */
    }
    process.exit(0);
  }

  const bin = playwrightBin(opts.root);
  if (!bin) {
    writeSummary(['FAIL — yerel playwright ikilisi bulunamadı (node_modules/.bin/playwright).']);
    process.exit(1);
  }

  const shardDir = path.join(outDir, `shard-${shard ? shard.index : 1}`);
  const safeKey = (k) => k.replace(/[^\w.-]/g, '_');
  // Attempt bazında AYRI auth + artifact dizini (paylaşılan storageState yarışı yok;
  // kontrollü retry taze bağımsız login + ayrı trace/screenshot alır). Dizinler
  // önceden oluşturulur → auth.setup storageState yazımı ENOENT almaz (savunma).
  const attemptEnv = (attempt) => {
    const authDir = path.join(shardDir, `attempt-${attempt}`, '.auth');
    mkdirSync(authDir, { recursive: true });
    return { PW_AUTH_DIR: authDir };
  };
  const attemptOutput = (attempt) => path.join(shardDir, `attempt-${attempt}`, 'artifacts');

  const interpreted = [];
  const failureTitles = []; // teşhis: unexpected yapan spec konum+başlıkları (secretsiz)
  const retryLog = []; // kontrollü retry teşhisi (secretsiz)

  for (const g of groups) {
    // Güvenli argument array (shell interpolation YOK).
    //  - --grep-invert=@mutation: mutation son savunması (config'ten bağımsız).
    //  - --workers=1: shard başına tek worker (canlı sunucu yükü + determinizm).
    //  - --retries=0: genel retry YOK (kontrollü altyapı-retry aşağıda ayrıca yapılır).
    //  - --reporter=json: config reporter'ını OVERRIDE eder → JSON grup-başına dosyaya.
    const common = ['test', ...g.files, '--project', g.project, '--grep-invert=@mutation'];
    if (g.grep) common.push('--grep', g.grep);

    // Koşumdan ÖNCE (offline, tarayıcısız): seçili exact spec dosyaları diskte var mı?
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

    // ── Attempt 1 ──
    const runOut = path.join(shardDir, `attempt-1`, `run-${safeKey(g.key)}.json`);
    const ran = runPlaywright(
      bin,
      opts.root,
      [...common, '--workers=1', '--retries=0', `--output=${attemptOutput(1)}`, '--reporter=json'],
      runOut,
      attemptEnv(1)
    );
    const t = tallyReport(ran.report, g.project, g.setup);

    // ── Kontrollü altyapı-retry (EN FAZLA 1) ──
    // Yalnız yapılandırılmış 502/503/504 + izin verilen network hatası olan testler
    // KESİN kimliğiyle (file:line) yeniden koşulur. Assertion/selector/visibility → retry YOK.
    let recovered = 0;
    if (t.unexpected > 0 && MAX_ATTEMPTS_PER_TEST > 1) {
      const details = collectFailureDetails(ran.report, g.project);
      const { retry, keepRed } = planRetry(details);
      const targets = retry
        .map((f) => locationArg(opts.root, f.file, f.line))
        .filter(Boolean);
      for (const f of keepRed) {
        retryLog.push(`[${g.key}] retry YOK (${f.classification.reason}): ${path.basename(f.file || '?')}:${f.line} › ${f.title}`);
      }
      if (targets.length > 0) {
        for (const f of retry) {
          retryLog.push(`[${g.key}] kontrollü retry (${f.classification.reason}): ${path.basename(f.file || '?')}:${f.line} › ${f.title}`);
        }
        const retryOut = path.join(shardDir, `attempt-2`, `run-${safeKey(g.key)}.json`);
        const retried = runPlaywright(
          bin,
          opts.root,
          [
            'test',
            ...targets,
            '--project',
            g.project,
            '--grep-invert=@mutation',
            '--workers=1',
            '--retries=0',
            `--output=${attemptOutput(2)}`,
            '--reporter=json',
          ],
          retryOut,
          attemptEnv(2)
        );
        const rt = tallyReport(retried.report, g.project, g.setup);
        // Hedeflenen testlerden hâlâ başarısız olanlar kurtarılmış SAYILMAZ (fail-closed).
        const stillFailing = rt.unexpected + rt.flaky;
        recovered = Math.max(0, targets.length - stillFailing);
      }
    }

    // Nihai istatistik = attempt-1 − kontrollü retry ile kurtarılan.
    const finalUnexpected = Math.max(0, t.unexpected - recovered);
    if (finalUnexpected > 0) {
      for (const f of collectFailures(ran.report)) failureTitles.push(`[${g.key}] ${f}`);
    }
    const finalExit = finalUnexpected > 0 || t.flaky > 0 ? 1 : 0;

    // listedCount = attempt-1'de hedef projede GÖRÜLEN test sayısı (setup hariç).
    // exact grup 0 test → interpretGroup ZERO_TEST verir → sahte-yeşil engellenir.
    interpreted.push(
      interpretGroup(g, {
        listedCount: t.count,
        exitCode: finalExit,
        stats: {
          expected: t.expected + recovered,
          unexpected: finalUnexpected,
          flaky: t.flaky,
          skipped: t.skipped,
        },
      })
    );
  }

  const agg = aggregate(interpreted);

  // Makine-okur koşu sonucu (artifact DEĞİL; yerel/log). Shard başına ayrı dosya.
  const runResult = {
    schemaVersion: RUNNER_SCHEMA_VERSION,
    shard: shardLabel,
    decision: decision.decision,
    expectedRunnableSpecCount: decision.expectedRunnableSpecCount,
    groups: interpreted,
    overallExitCode: agg.overallExitCode,
  };
  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      path.join(outDir, `run-result-shard-${shard ? shard.index : 1}.json`),
      `${JSON.stringify(runResult, null, 2)}\n`,
      'utf8'
    );
  } catch {
    /* yazılamazsa exit-code yine de korunur */
  }

  writeSummary([
    `${agg.allGreen ? 'GREEN' : 'RED'} — shard=${shardLabel} — ${interpreted.length} grup, ` +
      `beklenen exact spec=${decision.expectedRunnableSpecCount}`,
    ...agg.lines,
    ...(retryLog.length ? ['', 'Kontrollü altyapı-retry:', ...retryLog.map((r) => `  ↻ ${r}`)] : []),
    ...(failureTitles.length ? ['', 'UNEXPECTED başarısız test(ler):', ...failureTitles.map((f) => `  ✗ ${f}`)] : []),
  ]);
  process.exit(agg.overallExitCode);
}

main();
