#!/usr/bin/env node
// @ts-check
/**
 * WP-MORNING Faz 4 — Tek komutluk, fail-safe sabah teslim orchestrator'ı.
 *
 *   npm run delivery:morning
 *
 * AMAÇ: Faz 3'te elle yürütülen "temizle → self-check → koş → (FAIL olsa bile)
 * rapor üret → güvenlik/allowlist doğrula" zincirini TEK, tekrar edilebilir ve
 * fail-closed bir Node orchestrator'ına indirger. Shell'de `cmd1 && cmd2` YETMEZ:
 * test kırılınca rapor hiç üretilmez. Bu orchestrator test exit-code'unu SAKLAR,
 * JSON üretildiyse raporu YİNE üretir, ve sonunda gerçeği yansıtan exit-code döner.
 *
 * EXIT SEMANTİĞİ (handoff §FAZ4 zorunlu davranış 9–10):
 *   0        → baseline testleri geçti VE rapor/güvenlik/allowlist geçti.
 *   non-zero → şu durumlardan herhangi biri:
 *                • preflight self-check başarısız (production'a çıkılmaz)
 *                • koşum runtime JSON üretmedi / bayat (stale rapor SUNULMAZ)
 *                • rapor üreteci başarısız
 *                • güvenlik taraması / manifest bütünlüğü / allowlist başarısız
 *                • baseline testleri FAIL (rapor ÜRETİLDİKTEN sonra non-zero)
 *
 * Yeni bağımlılık yok; yalnız Node built-in + repo yardımcıları.
 *
 * SENTETİK TEST DESTEĞİ (production'a bağlanmadan): davranış env override'larıyla
 * enjekte edilebilir — MORNING_BASELINE_CMD, MORNING_INPUT, MORNING_OUT_DIR,
 * MORNING_ENVIRONMENT, MORNING_LIST_INPUT, MORNING_SKIP_SELFCHECK,
 * MORNING_SKIP_EXTERNAL, MORNING_SKIP_LIST. Varsayılanlar = gerçek production koşumu.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  statSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { scanOutputLeaks, assertHtmlSafe } from './runtime-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── Kanonik teslim dosyaları (handoff §Teslim allowlist'i — YALNIZ bunlar) ──
/** Bu orchestrator zincirinin (generate-runtime-report) yazdığı 4 dosya. */
export const GENERATED_DELIVERY = Object.freeze([
  'SABAH-KALITE-OZETI.html',
  'SAYFA-TEST-SONUCLARI.md',
  'TEST-SONUCLARI.json',
  'SABAH-TESLIM-MANIFEST.json',
]);
/** Diğer üreteçlerin (report:findings/report:test-report) yazdığı 3 teslim dosyası. */
export const EXTERNAL_DELIVERY = Object.freeze([
  'BULGULAR.md',
  'YAPILAN-TESTLER.md',
  'YAPILMAYAN-TESTLER.md',
]);
/** Tam teslim allowlist'i = 7 dosya. Manifest KENDİNİ hash'lemez (6 hash + 1 manifest). */
export const DELIVERY_ALLOWLIST = Object.freeze([...GENERATED_DELIVERY, ...EXTERNAL_DELIVERY]);
const MANIFEST_NAME = 'SABAH-TESLIM-MANIFEST.json';
const HTML_NAME = 'SABAH-KALITE-OZETI.html';
const CANON_DIR = 'docs/raporlar';

const log = (m) => console.log(`[delivery:morning] ${m}`);
const warn = (m) => console.error(`[delivery:morning] ⚠ ${m}`);

/** Kontrollü hata: rapor üretilmeye çalışılır, ama komut fail-closed non-zero döner. */
class DeliveryError extends Error {}

// ── Ortam / enjeksiyon sözleşmesi ────────────────────────────────────────────
function readConfig() {
  const env = process.env;
  const outDir = resolve(root, env.MORNING_OUT_DIR || CANON_DIR);
  const input = resolve(root, env.MORNING_INPUT || 'test-results/report.json');
  return {
    outDir,
    input,
    environment: env.MORNING_ENVIRONMENT || 'production-read-only',
    listInput: env.MORNING_LIST_INPUT ? resolve(root, env.MORNING_LIST_INPUT) : null,
    baselineCmd: env.MORNING_BASELINE_CMD || null, // null → içsel gerçek playwright komutu
    skipSelfCheck: env.MORNING_SKIP_SELFCHECK === '1',
    skipExternal: env.MORNING_SKIP_EXTERNAL === '1',
    skipList: env.MORNING_SKIP_LIST === '1',
  };
}

/** Dar path doğrulaması: test-results/ altında ve .json — auth/workspace SİLİNMEZ. */
function assertSafeInputPath(input) {
  const rel = relative(root, input);
  if (rel.startsWith('..') || resolve(root, rel) !== input) {
    throw new DeliveryError(`güvensiz input yolu (repo dışı): ${input}`);
  }
  const norm = rel.split('\\').join('/');
  if (!norm.startsWith('test-results/') || !norm.endsWith('.json')) {
    throw new DeliveryError(`input yalnız test-results/…json olabilir, verilen: ${norm}`);
  }
}

// ── 1) Bayat runtime input'unu dar path üzerinden temizle ────────────────────
function cleanRuntimeInput(input) {
  assertSafeInputPath(input);
  if (existsSync(input)) {
    rmSync(input, { force: true });
    log(`bayat runtime input silindi: ${relative(root, input)} (yeniden kullanılamaz)`);
  }
  mkdirSync(dirname(input), { recursive: true });
}

/** Bayat/geçersiz koşumda üretilmiş teslim snapshot'ını KALDIR (stale rapor sunulmaz). */
export function removeGeneratedDelivery(outDir) {
  for (const name of GENERATED_DELIVERY) {
    const p = resolve(outDir, name);
    if (existsSync(p)) rmSync(p, { force: true });
  }
}

// ── Child process yardımcıları ───────────────────────────────────────────────
function runNode(scriptRelPath, args = [], extraEnv = {}) {
  const r = spawnSync(process.execPath, [resolve(root, scriptRelPath), ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  return r.status === null ? 1 : r.status;
}

function runBaseline(cfg) {
  if (cfg.baselineCmd) {
    // Sentetik/enjekte komut (shell string) — production'a bağlanmaz.
    const r = spawnSync(cfg.baselineCmd, {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: cfg.input,
        MORNING_INPUT_ABS: cfg.input,
      },
    });
    return r.status === null ? 1 : r.status;
  }
  // GERÇEK production route-baseline: tek Chromium authed, ≤2 worker, mutation hariç
  // (grepInvert config'te; ALLOW_MUTATING_TESTS kapalı). JSON reporter zorlanır.
  const r = spawnSync(
    'npx',
    [
      'playwright',
      'test',
      'tests/registered-routes-smoke.authed.spec.js',
      '--project=chromium-authed',
      '--workers=2',
      '--reporter=list,json',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: cfg.input },
    }
  );
  return r.status === null ? 1 : r.status;
}

/** Opsiyonel tam `--list` JSON'u (dürüst envanter için). Offline; production'a bağlanmaz. */
function buildListInventory(cfg) {
  if (cfg.listInput) return cfg.listInput;
  if (cfg.skipList) return null;
  const listPath = resolve(root, 'test-results/list.json');
  mkdirSync(dirname(listPath), { recursive: true });
  const r = spawnSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0 || !r.stdout) {
    warn('tam --list envanteri üretilemedi; runtime raporu list-input olmadan üretilecek.');
    return null;
  }
  writeFileSync(listPath, r.stdout);
  return listPath;
}

// ── Runtime JSON tazelik denetimi (bayat/eksik = geçersiz koşum) ──────────────
function assertFreshRuntimeJson(input, startedAtMs) {
  if (!existsSync(input)) {
    throw new DeliveryError('koşum runtime JSON üretmedi; teslim raporu üretilemez.');
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(input, 'utf8'));
  } catch {
    throw new DeliveryError('runtime JSON parse edilemedi (bozuk/boş).');
  }
  const started = parsed && parsed.stats && parsed.stats.startTime
    ? Date.parse(String(parsed.stats.startTime))
    : NaN;
  if (!Number.isFinite(started)) {
    throw new DeliveryError('runtime JSON stats.startTime yok; tazelik doğrulanamıyor.');
  }
  if (started < startedAtMs) {
    throw new DeliveryError(
      `bayat runtime JSON: koşum ${new Date(started).toISOString()} < orchestrator başlangıcı; önceki koşumdan kalmış.`
    );
  }
}

// ── Güvenlik + manifest bütünlüğü doğrulaması (fail-closed) ───────────────────
export function validateDeliverySecurity(outDir) {
  const problems = [];
  for (const name of GENERATED_DELIVERY) {
    const p = resolve(outDir, name);
    if (!existsSync(p)) {
      problems.push(`üretilen teslim dosyası eksik: ${name}`);
      continue;
    }
    const text = readFileSync(p, 'utf8');
    const leaks = scanOutputLeaks(text);
    if (leaks.length) problems.push(`${name} güvenlik sızıntısı: ${leaks.join(', ')}`);
    if (name === HTML_NAME) {
      try {
        assertHtmlSafe(text);
      } catch (e) {
        problems.push(`${HTML_NAME} güvensiz: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  return problems;
}

export function validateManifestIntegrity(outDir) {
  const problems = [];
  const manifestPath = resolve(outDir, MANIFEST_NAME);
  if (!existsSync(manifestPath)) return ['manifest yok: ' + MANIFEST_NAME];
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return ['manifest parse edilemedi.'];
  }
  if (!Array.isArray(manifest.files)) return ['manifest.files dizisi yok.'];
  for (const entry of manifest.files) {
    const rel = String(entry.relativePath || '');
    const name = basename(rel);
    // Manifest kendini hash'lememeli.
    if (name === MANIFEST_NAME) {
      problems.push('manifest kendini hash\'lemiş (yasak).');
      continue;
    }
    // Yalnız allowlist'teki dosyalar hash'lenebilir.
    if (!DELIVERY_ALLOWLIST.includes(name)) {
      problems.push(`manifest allowlist dışı dosya hash'liyor: ${rel}`);
      continue;
    }
    if (!rel.startsWith(`${CANON_DIR}/`)) {
      problems.push(`manifest kanonik olmayan yol: ${rel}`);
    }
    // Generator üretilen dosyaları out-dir'e yazar; harici teslim dosyalarını
    // (BULGULAR/YAPILAN/YAPILMAYAN) daima kanonik docs/raporlar'dan hash'ler.
    // Doğrulamayı aynı kaynak önceliğiyle yap: önce out-dir, yoksa kanonik yol.
    let onDisk = resolve(outDir, name);
    if (!existsSync(onDisk)) onDisk = resolve(root, rel);
    if (!existsSync(onDisk)) {
      problems.push(`manifest kaydı diskte yok: ${name}`);
      continue;
    }
    const buf = readFileSync(onDisk);
    const size = statSync(onDisk).size;
    const sha256 = createHash('sha256').update(buf).digest('hex');
    if (entry.size !== size) problems.push(`${name} boyut uyuşmuyor (manifest ${entry.size} ≠ disk ${size}).`);
    if (entry.sha256 !== sha256) problems.push(`${name} sha256 uyuşmuyor.`);
  }
  return problems;
}

// ── Teslim allowlist doğrulaması (exact — eksik/beklenmedik reddedilir) ───────
export function validateDeliveryAllowlist(outDir, skipExternal) {
  const problems = [];
  const expected = skipExternal ? [...GENERATED_DELIVERY] : [...DELIVERY_ALLOWLIST];
  for (const name of expected) {
    if (!existsSync(resolve(outDir, name))) {
      problems.push(`allowlist teslim dosyası eksik: ${name}`);
    }
  }
  return problems;
}

// ── Ana akış ─────────────────────────────────────────────────────────────────
function main() {
  const cfg = readConfig();
  const startedAt = new Date();
  const startedAtMs = startedAt.getTime();
  log(`başladı ${startedAt.toISOString()} · env=${cfg.environment} · out=${relative(root, cfg.outDir) || '.'}`);

  mkdirSync(cfg.outDir, { recursive: true });

  // 1) Bayat runtime input'u temizle (yeniden kullanılamaz).
  cleanRuntimeInput(cfg.input);

  // 2) Rota envanteri / self-check — production'a çıkmadan önce sert kapı.
  if (!cfg.skipSelfCheck) {
    log('preflight: quality:architecture + quality:routes-baseline + quality:runtime-report');
    const preflight =
      runNode('tools/validate-architecture.mjs') ||
      runNode('tools/self-check-routes-baseline.mjs') ||
      runNode('tools/self-check-runtime-report.mjs');
    if (preflight !== 0) {
      throw new DeliveryError('preflight self-check başarısız; production koşumuna çıkılmadı.');
    }
  }

  // 3) Route baseline koşumu — exit-code SAKLANIR (FAIL olsa bile devam).
  log('route baseline koşuluyor…');
  const testExitCode = runBaseline(cfg);
  log(`route baseline bitti · testExitCode=${testExitCode}`);

  // 4) Runtime JSON tazelik denetimi. Bayat/eksikse: stale snapshot'ı kaldır + non-zero.
  try {
    assertFreshRuntimeJson(cfg.input, startedAtMs);
  } catch (e) {
    removeGeneratedDelivery(cfg.outDir);
    throw e instanceof DeliveryError ? e : new DeliveryError(String(e));
  }

  // 5) Harici teslim üreteçleri (findings + statik test raporu). FAIL olsa bile
  //    runtime raporu üretmeye devam edilir; ama üreteç hatası fail-closed'dur.
  let reportFailed = false;
  if (!cfg.skipExternal) {
    log('report:findings + report:test-report');
    if (runNode('tools/generate-findings.mjs') !== 0) reportFailed = true;
    if (runNode('tools/generate-test-report.mjs') !== 0) reportFailed = true;
  }

  // 6) Runtime raporu (json/md/html/manifest) — kaynak koşumdaki gerçek JSON.
  //    --min-start-time ile ikinci kez bayat koruması. FAIL koşumda bile üretir.
  log('report:runtime (generate-runtime-report)');
  const listInput = buildListInventory(cfg);
  const genArgs = [
    '--input', cfg.input,
    '--environment', cfg.environment,
    '--min-start-time', startedAt.toISOString(),
    '--out-dir', cfg.outDir,
  ];
  if (listInput) genArgs.push('--list-input', listInput);
  const runtimeExit = runNode('tools/generate-runtime-report.mjs', genArgs);
  if (runtimeExit !== 0) reportFailed = true;

  if (reportFailed) {
    throw new DeliveryError('rapor üreteci başarısız (fail-closed).');
  }

  // 7) Güvenlik taraması + manifest bütünlüğü.
  const secProblems = [
    ...validateDeliverySecurity(cfg.outDir),
    ...validateManifestIntegrity(cfg.outDir),
  ];
  if (secProblems.length) {
    for (const p of secProblems) warn(p);
    throw new DeliveryError(`güvenlik/manifest doğrulaması başarısız (${secProblems.length}).`);
  }

  // 8) Teslim allowlist (exact).
  const alProblems = validateDeliveryAllowlist(cfg.outDir, cfg.skipExternal);
  if (alProblems.length) {
    for (const p of alProblems) warn(p);
    throw new DeliveryError(`teslim allowlist doğrulaması başarısız (${alProblems.length}).`);
  }

  // 9) Nihai exit: test FAIL ise rapor ÜRETİLDİKTEN sonra non-zero.
  if (testExitCode !== 0) {
    warn(`baseline testleri FAIL (exit ${testExitCode}); rapor üretildi ama teslim non-zero döner (false-green yok).`);
    process.exit(testExitCode || 1);
  }

  log('TAMAM: baseline geçti, rapor + güvenlik + allowlist doğrulandı. exit 0.');
}

// Yalnız doğrudan çalıştırıldığında main() koşar; import edildiğinde (self-check)
// yalnız saf yardımcılar/sabitler dışa açılır.
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  try {
    main();
  } catch (e) {
    if (e instanceof DeliveryError) {
      warn(e.message);
      process.exit(1);
    }
    warn(`beklenmedik hata: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}
