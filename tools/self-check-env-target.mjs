// @ts-check
/**
 * self-check: ortam-hedefi tutarlılık guard'ı (F-007 / ADR-0032).
 *
 * Doğrular: `TEST_ENV=dev` koşumu, base `.env`'den SIZAN bir prod `BASE_URL` yüzünden
 * SESSİZCE app.vomenta.com'a düşemez — modül yüklenirken FAIL-CLOSED durur.
 *
 * Katman 1 (saf fonksiyon): `assertEnvironmentConsistency` doğrudan test edilir
 *   (hermetik; `.env`/child-process bağımlılığı yok).
 * Katman 2 (entegrasyon): environment.js child-process'te GERÇEKTEN yüklenir ve
 *   guard'ın modül-yükleme yolunda çağrıldığı kanıtlanır (env yalnız değişkenle
 *   kontrol edilir → CI'da `.env` dosyası olmasa da deterministik).
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { assertEnvironmentConsistency } from '../config/environment.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Katman 1: saf guard — TUTARLI ortamlar geçmeli ──
assert.doesNotThrow(
  () => assertEnvironmentConsistency('production', 'https://app.vomenta.com'),
  'production + prod host tutarlı olmalı'
);
assert.doesNotThrow(
  () => assertEnvironmentConsistency('dev', 'https://app.dev.vomenta.com'),
  'dev + dev host tutarlı olmalı'
);
// staging: sabit hostname yok → özel URL alabilir → muaf.
assert.doesNotThrow(
  () => assertEnvironmentConsistency('staging', 'https://staging.example.com'),
  'staging (sabit host yok) muaf olmalı'
);
// bilinmeyen ad → muaf (registry'de yok).
assert.doesNotThrow(() => assertEnvironmentConsistency('bilinmeyen', 'https://x.example.com'));

// ── Katman 1: saf guard — TUTARSIZLIK (F-007) FAIL-CLOSED ──
assert.throws(
  () => assertEnvironmentConsistency('dev', 'https://app.vomenta.com'),
  /F-007|tutarsızlık/i,
  'dev adı + PROD host FAIL-CLOSED olmalı (F-007 sızıntı senaryosu)'
);
assert.throws(
  () => assertEnvironmentConsistency('production', 'https://app.dev.vomenta.com'),
  /F-007|tutarsızlık/i,
  'production adı + DEV host FAIL-CLOSED olmalı'
);

// ── Katman 2: entegrasyon — modül-yükleme guard'ı gerçekten çağrılıyor mu? ──
/** environment.js'i verilen env ile child-process'te yükler; {name} {baseURL} yazar. */
function resolveEnvInChild(env) {
  const script =
    "import('./config/environment.js').then((m) => {" +
    "process.stdout.write(m.environment.name + ' ' + m.environment.baseURL);" +
    '});';
  return execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: repoRoot,
    // Yalnız değişkenle kontrol: açık BASE_URL, environment.js'in dotenv'inden ÖNCE
    // yakalanır → yerelde `.env*` olsa da sonuç deterministik.
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// 2a) TUTARLI dev → name=dev + dev origin, exit 0.
{
  const out = resolveEnvInChild({ TEST_ENV: 'dev', BASE_URL: 'https://app.dev.vomenta.com' });
  assert.match(
    out.trim(),
    /^dev https:\/\/app\.dev\.vomenta\.com$/,
    `tutarlı dev beklenirken alınan: "${out.trim()}"`
  );
}

// 2b) SIZINTI: TEST_ENV=dev + prod BASE_URL → modül yüklenirken THROW (non-zero exit).
{
  let threw = false;
  let stderr = '';
  try {
    resolveEnvInChild({ TEST_ENV: 'dev', BASE_URL: 'https://app.vomenta.com' });
  } catch (error) {
    threw = true;
    stderr = String(error.stderr || error.message || '');
  }
  assert.ok(
    threw,
    'F-007: dev koşumunun prod BASE_URL ile SESSİZCE geçmesi engellenmeliydi (child exit 0 verdi)'
  );
  assert.match(
    stderr,
    /F-007|tutarsızlık/i,
    `beklenen guard hatası (F-007), alınan stderr: ${stderr.slice(0, 240)}`
  );
}

console.log('self-check-env-target: OK — F-007 fail-closed ortam-tutarlılık guard\'ı doğrulandı.');
