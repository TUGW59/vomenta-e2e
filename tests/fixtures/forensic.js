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
import { verificationProfileFor } from '../contracts/verification-profiles.js';
import { extractPermissionScopes, isValidScope } from './scope-extract.js';

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

// ── FAZ 2 — Konum kanıtı (opt-in hedef locator) ──────────────────────────────
/**
 * Test-başına forensik "hedef" locator tutucusu (opt-in). Bir spec, bulgunun
 * hatalı/ilgili elemanını `markForensicTarget(locator)` ile işaretler; forensik
 * fixture teardown'da bu hedef `location.png` için kutulanır. İşaretlenmezse
 * `location.png` yerine açık `location.SKIPPED.txt` bırakılır (sahte konum ÜRETİLMEZ).
 * Forensik koşu `--workers=1` + tek test grep'idir; fixture setup'ında sıfırlanır.
 * @type {{ locator: import('@playwright/test').Locator, label: string|null }|null}
 */
let forensicTarget = null;

/**
 * Forensik konum kanıtı için hedef elemanı işaretler. Yalnız capture katmanınca okunur;
 * ürüne/registry'ye dokunmaz, mutation yapmaz. Normal koşuda zararsızdır (forensik
 * fixture yalnız `FORENSIC_BUG` set iken okur ve her test başında sıfırlar).
 * @param {import('@playwright/test').Locator} locator
 * @param {{ label?: string }} [opts]  label yalnız meta amaçlı; görüntüye BASILMAZ.
 */
export function markForensicTarget(locator, opts = {}) {
  if (!locator) return;
  forensicTarget = { locator, label: opts.label ? String(opts.label) : null };
}

/** İşaretli forensik hedefi döndürür (yoksa null). */
export function getForensicTarget() {
  return forensicTarget;
}

/** Hedef tutucusunu sıfırlar (fixture setup'ında her test başında çağrılır). */
export function resetForensicTarget() {
  forensicTarget = null;
}

/**
 * SAF geometri: element boundingBox'ını viewport'a clamp'ler; görünür kesişim yoksa null.
 * Tarayıcıya bağımlı DEĞİL, deterministik (birim-test edilebilir).
 * @param {{x:number,y:number,width:number,height:number}|null|undefined} box
 * @param {{width:number,height:number}|null|undefined} viewport
 * @returns {{x:number,y:number,width:number,height:number}|null}
 */
export function computeLocationOverlay(box, viewport) {
  if (!box || !viewport) return null;
  const vw = Number(viewport.width);
  const vh = Number(viewport.height);
  if (!(vw > 0) || !(vh > 0)) return null;
  const bx = Number(box.x);
  const by = Number(box.y);
  const bw = Number(box.width);
  const bh = Number(box.height);
  if ([bx, by, bw, bh].some((n) => Number.isNaN(n))) return null;
  const x1 = Math.max(0, bx);
  const y1 = Math.max(0, by);
  const x2 = Math.min(vw, bx + bw);
  const y2 = Math.min(vh, by + bh);
  const width = x2 - x1;
  const height = y2 - y1;
  if (!(width > 0) || !(height > 0)) return null; // viewport ile kesişmiyor
  return { x: x1, y: y1, width, height };
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
 * WP-R4 — Doğrulama profil yakalama (YALNIZ `VERIFY_PROFILE=1` iken; report:bug/WP-R3'ü
 * ETKİLEMEZ). Bulgunun izin ucundan YALNIZ yapısal olarak izin taşıyan bağlamlardan
 * deterministik scope-ANAHTARLARINI çıkarır (bkz. scope-extract.js: timestamp/UUID/URL/
 * e-posta/sayısal/metadata yapısal olarak dışlanır). Yanıt gövdesi diske YAZILMAZ.
 * @param {import('@playwright/test').Page} page
 * @param {string} findingId
 */
export function createProfileCapture(page, findingId) {
  const cfg = verificationProfileFor(findingId);
  if (!cfg || process.env.VERIFY_PROFILE !== '1') {
    return { active: false, get keys() { return []; }, stop() {} };
  }
  /** @type {Set<string>} */
  const keys = new Set();
  /** @type {Promise<unknown>[]} */
  const pending = [];
  const onResp = (resp) => {
    const p = (async () => {
      try {
        if (resp.request().method() !== 'GET') return;
        if (!resp.url().includes(cfg.permissionsUrlIncludes)) return;
        const json = await resp.json();
        for (const scope of extractPermissionScopes(json)) keys.add(scope);
      } catch {
        /* json değil / okunamadı — atla */
      }
    })();
    pending.push(p);
  };
  page.on('response', onResp);
  return {
    active: true,
    get keys() { return [...keys]; },
    async stop() {
      page.off('response', onResp);
      await Promise.allSettled(pending);
    },
  };
}

/**
 * Yakalanan izin anahtarlarını (yapısal geçerli scope + secret/PII taramalı, sıralı,
 * benzersiz) diske yazar: `test-results/findings/<id>/profile.json`. Ham yanıt gövdesi
 * yazılmaz. Deterministik (timestamp/sıra fingerprint'e girmez — bkz. normalizeProfile).
 * @param {string} id
 * @param {string[]} rawKeys
 */
export function writeCapturedProfile(id, rawKeys) {
  const dir = findingDirRel(id);
  mkdirSync(dir, { recursive: true });
  const keys = [...new Set((rawKeys || []).map((k) => String(k).trim()))]
    .filter((k) => isValidScope(k))
    .filter((k) => findSecrets(k).length === 0)
    .sort();
  const body = JSON.stringify({ findingId: id, environment: 'production-readonly', keys }, null, 2);
  if (findSecrets(body).length) {
    writeFileSync(join(dir, 'profile.SKIPPED.txt'), 'profile.json YAZILMADI: sanitizer sızıntı buldu.\n');
    return { written: false, count: 0 };
  }
  writeFileSync(join(dir, 'profile.json'), body + '\n');
  return { written: true, count: keys.length };
}

/**
 * Kimlik(overlay) çizgisi maskeli görüntüye eklenir: hedef locator'ın viewport'a
 * clamp'lenmiş kutusunu, `safe-final-state.png` ile AYNI PII maskeleriyle işaretli
 * `location.png` olarak yazar. Hedef yok / eşleşmiyor / görünmez / maskeleme hatası →
 * görsel YAZILMAZ; açık `location.SKIPPED.txt` bırakılır (sahte konum ÜRETİLMEZ).
 * Enjekte edilen overlay yalnız istemci-tarafı geçici bir DOM kutusudur (ürün/ağ
 * mutasyonu değil) ve capture'dan hemen sonra kaldırılır.
 * @param {{ page: import('@playwright/test').Page, dir: string, masks: import('@playwright/test').Locator[], target: { locator: import('@playwright/test').Locator, label: string|null }|null }} args
 * @returns {Promise<boolean>} location.png yazıldıysa true
 */
async function captureLocationEvidence({ page, dir, masks, target }) {
  const skip = (reason) => {
    writeFileSync(join(dir, 'location.SKIPPED.txt'), `location.png YAZILMADI: ${reason}\n`);
    return false;
  };
  if (!target || !target.locator) {
    return skip('hedef locator işaretlenmedi (markForensicTarget çağrılmadı)');
  }
  const OVERLAY_ID = '__forensic_location_box__';
  try {
    const el = target.locator.first();
    if ((await el.count()) === 0) {
      return skip('hedef locator eşleşmedi (eleman final state\'te yok)');
    }
    try {
      await el.scrollIntoViewIfNeeded({ timeout: 2000 });
    } catch {
      /* kaydırma zorunlu değil — boundingBox yine denenir */
    }
    const box = await el.boundingBox();
    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    const overlay = computeLocationOverlay(box, viewport);
    if (!overlay) {
      return skip('hedef görünür değil / boundingBox alınamadı (viewport ile kesişim yok)');
    }
    await page.evaluate(
      ({ id, rect }) => {
        document.getElementById(id)?.remove();
        const d = document.createElement('div');
        d.id = id;
        Object.assign(d.style, {
          position: 'fixed',
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          border: '3px solid #e11d48',
          boxShadow: '0 0 0 3px rgba(225,29,72,0.35)',
          borderRadius: '2px',
          zIndex: '2147483647',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        });
        document.body.appendChild(d);
      },
      { id: OVERLAY_ID, rect: overlay }
    );
    let buf;
    try {
      buf = await page.screenshot({ mask: masks, animations: 'disabled', fullPage: false });
    } finally {
      await page.evaluate((id) => document.getElementById(id)?.remove(), OVERLAY_ID).catch(() => {});
    }
    writeFileSync(join(dir, 'location.png'), buf);
    return true;
  } catch (error) {
    const msg = String((error && error.message) || error).split('\n')[0];
    return skip(`maskeli konum görüntüsü alınamadı (${msg})`);
  }
}

/**
 * Forensik kanıtı diske yazar: `network-summary.json` (maskeli) + `safe-final-state.png`
 * (header kimlik yüzeyleri capture anında maskeli) + `location.png` (hedef işaretliyse;
 * aynı maskelerle, kutulu). Sanitizer/maskeleme başarısızsa ilgili dosya YAZILMAZ.
 * @param {{ page: import('@playwright/test').Page, id: string, records: Record<string, unknown>[], masks?: import('@playwright/test').Locator[], target?: { locator: import('@playwright/test').Locator, label: string|null }|null }} args
 * @returns {Promise<{ networkSummary: boolean, screenshot: boolean, location: boolean }>}
 */
export async function writeForensicEvidence({ page, id, records, masks = [], target = null }) {
  const dir = findingDirRel(id);
  mkdirSync(dir, { recursive: true });
  const result = { networkSummary: false, screenshot: false, location: false };

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

  // ── location.png (hedef locator kutulu; aynı maskeler; hata/hedefsiz → SKIPPED) ──
  result.location = await captureLocationEvidence({ page, dir, masks, target });

  return result;
}
