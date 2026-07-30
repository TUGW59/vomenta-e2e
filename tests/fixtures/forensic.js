// @ts-check
/**
 * WP-R3 — Forensik mod ortak yardımcıları.
 *
 * İki katman:
 *  1. SAF (Playwright'a bağımlı DEĞİL): `forensicBugId`, `forensicModeActive`,
 *     `sanitizeNetworkRecord`, `normalizePath`. Node araçları ve self-check bunları
 *     import edebilir (yalnız `./sanitize.js`'e bağlı).
 *  2. CAPTURE (`page`/`fs` kullanır): `createForensicRecorder`, `writeForensicEvidence`.
 *     Yalnız `tests/fixtures/test.js` içindeki auto-fixture tarafından, VE yalnız
 *     `FORENSIC_BUG` set iken çağrılır. Normal koşuda tamamen atıldır (dinleyici yok,
 *     dosya yazımı yok).
 *
 * GÜVENLİK KURALLARI (bağlayıcı):
 *  - Ağ özeti yalnız method + normalize path + status + süre + tip + hata kodu tutar.
 *    Header/cookie/token/body ASLA yazılmaz; path query'si tamamen düşürülür.
 *  - Yazımdan ÖNCE üretilen JSON `findSecrets` ile taranır; sızıntı varsa dosya YAZILMAZ.
 *  - Ekran görüntüsü capture ANINDA maskelenir (header kimlik yüzeyleri). Maske
 *    başarısız olursa/hata olursa güvensiz görüntü YAZILMAZ (SKIPPED notu bırakılır).
 *  - Registry ASLA değiştirilmez, hiçbir mutation yapılmaz.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { redactText, findSecrets } from './sanitize.js';

/** Forensik modu tetikleyen ortam değişkeni adı. */
export const FORENSIC_ENV = 'FORENSIC_BUG';

/**
 * Etkin forensik bulgu id'si (yoksa null). Yalnız helper/tool/fixture katmanında okunur.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string|null}
 */
export function forensicBugId(env = process.env) {
  const raw = env[FORENSIC_ENV];
  const v = raw == null ? '' : String(raw).trim();
  return v.length > 0 ? v : null;
}

/**
 * Bu bulgu için forensik mod etkin mi? Yalnız CLI/env id'si TAM eşleşirse true.
 * @param {string} id
 * @param {NodeJS.ProcessEnv} [env]
 */
export function forensicModeActive(id, env = process.env) {
  const active = forensicBugId(env);
  return active !== null && active === id;
}

/** Bulgu forensik çıktı dizini (repo köküne göreli). */
export function findingDirRel(id) {
  return join('test-results', 'findings', String(id));
}

/**
 * URL path'ini normalize eder: query TAMAMEN düşürülür, sayısal/uuid/hex segmentleri
 * `:id`'ye indirgenir (belirli kayıt kimliği/PII segmenti sızmasın). Salt path.
 * @param {string} rawUrl
 */
export function normalizePath(rawUrl) {
  let path;
  try {
    path = new URL(rawUrl).pathname;
  } catch {
    return '<invalid-url>';
  }
  return path
    .split('/')
    .map((seg) => {
      if (!seg) return seg;
      if (/^[0-9a-f]{8,}$/i.test(seg)) return ':id'; // uuid/hex/hash
      if (/^\d+$/.test(seg)) return ':id'; // sayısal id
      if (/^[0-9a-f-]{16,}$/i.test(seg)) return ':id'; // tireli uuid
      return seg;
    })
    .join('/');
}

/**
 * Ham ağ kaydını yalnız güvenli/gözlemlenebilir alanlara indirger.
 * Girdi: { method, url, status, durationMs, resourceType, failure?, redirect? }
 * @param {Record<string, unknown>} rec
 */
export function sanitizeNetworkRecord(rec) {
  /** @type {Record<string, unknown>} */
  const out = {
    method: String(rec.method || '').toUpperCase(),
    path: redactText(normalizePath(String(rec.url || ''))),
    status: typeof rec.status === 'number' ? rec.status : null,
    durationMs: typeof rec.durationMs === 'number' && rec.durationMs >= 0 ? Math.round(rec.durationMs) : null,
    resourceType: rec.resourceType ? String(rec.resourceType) : null,
  };
  if (rec.failure) out.failure = redactText(String(rec.failure));
  if (rec.redirect) out.redirect = true;
  return out;
}

/**
 * Sayfadaki ağ trafiğini güvenli özet için kaydeder (body/header YOK).
 * @param {import('@playwright/test').Page} page
 */
export function createForensicRecorder(page) {
  /** @type {Record<string, unknown>[]} */
  const records = [];
  /** @type {Promise<unknown>[]} */
  const pending = [];

  const onFinished = (request) => {
    const p = (async () => {
      try {
        const response = await request.response();
        const timing = request.timing();
        records.push({
          method: request.method(),
          url: request.url(),
          status: response ? response.status() : null,
          durationMs: timing && timing.responseEnd >= 0 ? timing.responseEnd : null,
          resourceType: request.resourceType(),
          redirect: request.redirectedFrom() != null || undefined,
        });
      } catch {
        /* yanıt alınamadı — atla */
      }
    })();
    pending.push(p);
  };

  const onFailed = (request) => {
    records.push({
      method: request.method(),
      url: request.url(),
      status: null,
      durationMs: null,
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText || 'failed',
    });
  };

  page.on('requestfinished', onFinished);
  page.on('requestfailed', onFailed);

  return {
    records,
    async stop() {
      page.off('requestfinished', onFinished);
      page.off('requestfailed', onFailed);
      await Promise.allSettled(pending);
    },
  };
}

/**
 * Forensik kanıtı diske yazar: `network-summary.json` (maskeli) + `safe-final-state.png`
 * (header kimlik yüzeyleri capture anında maskeli). Sanitizer başarısızsa dosya yazılmaz.
 * @param {{ page: import('@playwright/test').Page, id: string, records: Record<string, unknown>[], masks?: import('@playwright/test').Locator[] }} args
 * @returns {Promise<{ networkSummary: boolean, screenshot: boolean }>}
 */
export async function writeForensicEvidence({ page, id, records, masks = [] }) {
  const dir = findingDirRel(id);
  mkdirSync(dir, { recursive: true });
  const result = { networkSummary: false, screenshot: false };

  // ── network-summary.json (maskeli, sanitizer kapısı) ──
  const summary = {
    findingId: id,
    environment: 'production-readonly',
    note: 'Yalnız method + normalize path + status + süre + tip + hata kodu. Header/cookie/token/body kaydedilmez.',
    total: records.length,
    requests: records.map(sanitizeNetworkRecord),
  };
  const netJson = JSON.stringify(summary, null, 2);
  const leaks = findSecrets(netJson);
  if (leaks.length) {
    writeFileSync(
      join(dir, 'network-summary.SKIPPED.txt'),
      `network-summary.json YAZILMADI: sanitizer sonrası sızıntı tespit edildi (${leaks.join(', ')}).\n`
    );
  } else {
    writeFileSync(join(dir, 'network-summary.json'), netJson + '\n');
    result.networkSummary = true;
  }

  // ── safe-final-state.png (capture-anı maskeli; hata → güvensiz görüntü yazma) ──
  try {
    const buf = await page.screenshot({ mask: masks, animations: 'disabled', fullPage: false });
    writeFileSync(join(dir, 'safe-final-state.png'), buf);
    result.screenshot = true;
  } catch {
    writeFileSync(
      join(dir, 'safe-final-state.SKIPPED.txt'),
      'safe-final-state.png YAZILMADI: maskeli ekran görüntüsü alınamadı (sayfa kapanmış olabilir).\n'
    );
  }

  return result;
}
