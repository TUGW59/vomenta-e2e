// @ts-check
/**
 * WP-RUNGUARD — Paralel Playwright koşum koruması (fail-fast, güvenli).
 *
 * SORUN: Aynı repo çalışma dizininde iki `playwright test` süreci aynı anda
 * koşarsa, paylaşılan `playwright/.auth/<role>.json` oturum dosyaları ve
 * `test-results/` artifact dizinleri üzerinde yarışır. Setup oturumunu ÜRETEN
 * koşum ile onu OKUYAN authed koşum çakışınca gözlemlenen hata:
 *   "Error reading storage state from playwright/.auth/default.json: ENOENT".
 * (Ör. bir UI oturumu + ayrı bir CLI koşumu aynı anda çalıştığında.)
 *
 * ÇÖZÜM: Koşum başında exclusive bir kilit dosyası alınır; CANLI bir eşzaman
 * koşum tespit edilirse AÇIK ve GÜVENLİ bir mesajla hızlıca durulur. Kilit koşum
 * sonunda serbest bırakılır; süreç çökerse bayat kilit (PID ölü) bir sonraki
 * koşumda güvenle devralınır. Hiçbir assertion zayıflatılmaz, test atlanmaz.
 *
 * NOT (CI): GitHub Actions'ta her job AYRI runner/checkout'ta koşar; kilit
 * yalnız aynı makinedeki paralel YEREL koşumları hedefler. Tek koşumlu CI
 * job'larında no-op'tur (kilidi alır, teardown'da bırakır).
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_PATH = resolve(root, 'test-results/.playwright-run.lock');

/** PID gerçekten canlı mı? (signal 0 = varlık kontrolü, sinyal göndermez.) */
function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM = süreç var ama sinyal izni yok → yine canlı sayılır.
    return Boolean(err && err.code === 'EPERM');
  }
}

/**
 * Koşum kilidini alır. Canlı bir eşzaman koşum varsa fail-fast atar.
 * @returns {string} kilit dosyasının yolu
 */
export function acquireRunLock() {
  mkdirSync(dirname(LOCK_PATH), { recursive: true });

  if (existsSync(LOCK_PATH)) {
    let holder = null;
    try {
      holder = JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
    } catch {
      holder = null; // Bozuk/yarım kilit → bayat kabul et, devral.
    }
    if (holder && holder.pid !== process.pid && pidAlive(holder.pid)) {
      throw new Error(
        `Paralel Playwright koşumu tespit edildi (PID ${holder.pid}, ${holder.startedAt}). ` +
          'Aynı çalışma dizininde iki koşum, paylaşılan playwright/.auth ve test-results/ ' +
          'dizinlerinde yarışır ve "ENOENT default.json" gibi oturum hatalarına yol açar. ' +
          'Önce diğer koşumu veya Playwright UI oturumunu kapatın, sonra tekrar deneyin. ' +
          `Kilit bayatsa (koşum çökmüşse) silmek güvenlidir: ${LOCK_PATH}`
      );
    }
  }

  writeFileSync(
    LOCK_PATH,
    JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + '\n'
  );
  return LOCK_PATH;
}

/** Kilidi yalnız sahibiysek serbest bırakır (en iyi çaba; koşumu asla bozmaz). */
export function releaseRunLock() {
  try {
    if (!existsSync(LOCK_PATH)) return;
    const holder = JSON.parse(readFileSync(LOCK_PATH, 'utf8'));
    if (holder && holder.pid === process.pid) rmSync(LOCK_PATH, { force: true });
  } catch {
    /* teardown en iyi çaba: kilit serbest bırakılamazsa koşum sonucunu etkileme. */
  }
}
