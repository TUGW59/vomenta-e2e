// @ts-check
/**
 * GATEWAY-NAVIGATION — authed navigasyon için SINIRLI + KAPSAMLANMIŞ geçici
 * gateway retry'ı.
 *
 * `gateway-retry.js` login akışını korur; bu ince glue AYNI kanıt makinesini
 * authed test GÖVDELERİNİN navigasyonuna (page.goto + expectReady) taşır.
 * Canlı sunucu aralıklı 502/503/504 (nginx gateway) döndüğünde, korumasız
 * authed navigasyon düz kırmızıya boyanıyordu (bkz. ADR-0028).
 *
 * KANIT KAPSAMI (evidence scope) — kritik güvenlik sözleşmesi:
 *   Her ağ 502/503/504'ü gateway kanıtı DEĞİLDİR. Yalnız sayfanın hazır
 *   olmasını GERÇEKTEN etkileyen, GÜVENİLİR first-party yanıtlar sayılır:
 *     - mevcut ana document (top-frame) navigasyonu, VEYA
 *     - first-party origin'e (baseURL ile aynı registrable domain) ait xhr/fetch.
 *   Third-party / analytics / image / font / favicon / stylesheet / script
 *   yanıtları 5xx OLSA BİLE kanıt SAYILMAZ. Origin baseURL'den (environment
 *   modelinden) türetilir; hard-code YOKTUR.
 *
 * STALE-EVIDENCE koruması: her kanıt bir `epoch` (attempt) ile etiketlenir.
 * `beginAttempt()` epoch'u ilerletir ve önceki denemenin kanıtını temizler →
 * bir denemenin 5xx'i başka bir denemenin assertion hatasını maskeleyemez.
 *
 * Playwright import ETMEZ (yalnız saf gateway-retry politikasını `page` ile
 * birleştirir) → sahte (duck-typed) page ile tarayıcısız Node self-check'inde
 * (tools/self-check-authed-nav.mjs) deterministik sürülebilir.
 *
 * Fail-closed: kanıt kapsamı DIŞINDaki her hata (generic timeout, locator,
 * assertion, 401/403, third-party 5xx) AYNEN yükselir — maskeleme yok.
 */
import {
  isGatewayStatus,
  gatewayStatusFromBodyText,
  GatewayUnavailableError,
  runAuthWithGatewayRetry,
  MAX_AUTH_ATTEMPTS,
} from './gateway-retry.js';
import { environment } from '../../config/environment.js';

/**
 * page → observer eşlemesi. Bir page'e TEK dinleyici kurulur (idempotent).
 * @type {WeakMap<object, any>}
 */
const OBSERVERS = new WeakMap();

/** baseURL host'unun registrable apex'i (ör. app.vomenta.com → vomenta.com). */
function registrableApex(hostname) {
  const parts = String(hostname || '').split('.').filter(Boolean);
  return parts.length <= 2 ? parts.join('.') : parts.slice(-2).join('.');
}

/** Environment modelinden türetilen varsayılan first-party host (hard-code yok). */
function defaultBaseHost() {
  try {
    return new URL(environment.baseURL).hostname;
  } catch {
    return '';
  }
}

/**
 * Bir host, baseHost ile aynı registrable domain'e mi ait? (app.vomenta.com ve
 * api.vomenta.com → same-site kabul; www.google-analytics.com → değil.)
 */
function isFirstPartyHost(host, baseHost) {
  if (!host || !baseHost) return false;
  if (host === baseHost) return true;
  return registrableApex(host) === registrableApex(baseHost);
}

/** resourceType → insanca okunur kaynak etiketi (secretsiz log içindir). */
function sourceLabelFor(resourceType) {
  if (resourceType === 'document') return 'main-document';
  if (resourceType === 'xhr') return 'first-party-xhr';
  if (resourceType === 'fetch') return 'first-party-fetch';
  return String(resourceType || 'unknown');
}

/**
 * Bir response'u kanıt olarak sınıflandırır; kapsam dışıysa `null` döner.
 * KABUL: (a) first-party top-frame document navigasyonu, (b) first-party
 * xhr/fetch. RED: third-party her şey; image/font/script/stylesheet/media/
 * manifest/other; alt-frame document.
 * @returns {{status:number, url:string, resourceType:string, source:string}|null}
 */
function classifyEvidence(page, response, baseHost) {
  const status = response.status();
  if (!isGatewayStatus(status)) return null;

  let url = '';
  try {
    url = typeof response.url === 'function' ? response.url() : '';
  } catch {
    url = '';
  }
  let host = '';
  try {
    host = url ? new URL(url).hostname : '';
  } catch {
    host = '';
  }
  // Kapsam kuralı 1: first-party olmayan hiçbir şey kanıt değildir.
  if (!isFirstPartyHost(host, baseHost)) return null;

  const req = typeof response.request === 'function' ? response.request() : null;
  const resourceType =
    req && typeof req.resourceType === 'function' ? req.resourceType() : 'other';

  // Kapsam kuralı 2: ana document navigasyonu (yalnız top-frame + nav isteği).
  if (resourceType === 'document') {
    let mainFrame = true;
    try {
      if (typeof response.frame === 'function' && typeof page.mainFrame === 'function') {
        mainFrame = response.frame() === page.mainFrame();
      }
    } catch {
      mainFrame = true;
    }
    const isNav =
      req && typeof req.isNavigationRequest === 'function' ? req.isNavigationRequest() : true;
    if (mainFrame && isNav) {
      return { status, url, resourceType, source: 'main-document' };
    }
    return null; // alt-frame / non-nav document → kanıt değil
  }

  // Kapsam kuralı 3: yalnız first-party xhr/fetch sayfanın hazır olmasını etkiler.
  if (resourceType === 'xhr' || resourceType === 'fetch') {
    return { status, url, resourceType, source: sourceLabelFor(resourceType) };
  }

  // image/font/stylesheet/script/media/manifest/other → 5xx olsa da kanıt değil.
  return null;
}

/**
 * Bir page'e per-deneme, KAPSAMLANMIŞ 5xx gözlemcisi kurar (idempotent, page
 * başına TEK response listener). Her kanıt `{status, url, resourceType, source,
 * epoch}` taşır.
 * @param {any} page Playwright Page (veya self-check'te sahte)
 * @param {{baseHost?: string}} [opts]
 */
export function getGatewayObserver(page, opts = {}) {
  const existing = OBSERVERS.get(page);
  if (existing) return existing;

  const baseHost = opts.baseHost || defaultBaseHost();
  /** @type {Array<{status:number,url:string,resourceType:string,source:string,epoch:number}>} */
  const evidence = [];
  let epoch = 0;

  page.on('response', (response) => {
    try {
      const classified = classifyEvidence(page, response, baseHost);
      if (classified) evidence.push({ ...classified, epoch });
    } catch {
      // Kanıt sınıflandırması ASLA test akışını bozmamalı (fail-open değil —
      // sınıflandırma başarısızsa kanıt yok sayılır → retry tetiklenmez).
    }
  });

  const observer = {
    /** Yeni bir deneme: epoch ilerler, önceki denemenin kanıtı silinir. */
    beginAttempt() {
      epoch += 1;
      evidence.length = 0;
    },
    get epoch() {
      return epoch;
    },
    get evidence() {
      return evidence;
    },
    /**
     * Mevcut denemede (epoch) kapsamlı gateway kanıtı arar: önce first-party ağ
     * yanıtı (en güçlü), yoksa render edilen nginx 5xx sayfa metni. Kanıt yoksa
     * `null` → retry EDİLMEZ.
     * @returns {Promise<{status:number, source:string}|null>}
     */
    async detectEvidence() {
      const scoped = evidence.filter((e) => e.epoch === epoch && isGatewayStatus(e.status));
      if (scoped.length) {
        const last = scoped[scoped.length - 1];
        return { status: last.status, source: last.source };
      }
      try {
        const bodyText = await page.locator('body').innerText({ timeout: 2_000 });
        const fromBody = gatewayStatusFromBodyText(bodyText);
        return isGatewayStatus(fromBody)
          ? { status: Number(fromBody), source: 'document-body' }
          : null;
      } catch {
        return null;
      }
    },
  };
  OBSERVERS.set(page, observer);
  return observer;
}

/** Kapsamlı kanıttan (status + source) geçici gateway hatası üretir. */
function makeGatewayError(evidence, where) {
  const err = new GatewayUnavailableError(Number(evidence.status), where);
  // Secretsiz retry logu için kaynak etiketi (email/token/body ASLA).
  /** @type {any} */ (err).gatewaySource = evidence.source || 'unknown';
  return err;
}

/**
 * `assertionFn`'i koşar; başarısız olursa YALNIZ kapsamlı gerçek gateway kanıtı
 * varsa hatayı geçici {@link GatewayUnavailableError}'a çevirir; yoksa orijinal
 * hatayı AYNEN fırlatır (fail-closed).
 *
 * DİKKAT: Bu fonksiyon ağ kanıtına güvenir. Çağıran, kanıt penceresini yeni bir
 * `observer.beginAttempt()` ile açmalıdır; aksi halde önceki bir denemenin 5xx'i
 * stale kanıt olarak sızabilir. (Bu yüzden `assertDestinationLoaded` gibi
 * tıklama-sonrası, epoch açamayan yollar bu helper'ı KULLANMAZ — bkz. ADR-0028.)
 * @param {{detectEvidence: () => Promise<{status:number, source:string}|null>}} observer
 * @param {() => Promise<unknown>} assertionFn
 * @param {string} where
 */
export async function assertOrGateway(observer, assertionFn, where) {
  try {
    await assertionFn();
  } catch (err) {
    const ev = await observer.detectEvidence();
    if (ev && isGatewayStatus(ev.status)) {
      throw makeGatewayError(ev, where);
    }
    throw err;
  }
}

/** Secretsiz, sınırlı retry logu (yalnız status/attempt/where/source). */
function logRetry({ status, nextAttempt, maxAttempts, where, source }) {
  // where bir rota/etiket (secret değil); url/body/token/cookie ASLA loglanmaz.
  console.warn(
    `[authed-nav] transient gateway ${status}; retrying ${nextAttempt}/${maxAttempts}; ` +
      `where=${JSON.stringify(String(where))}; source=${JSON.stringify(String(source || 'unknown'))}`
  );
}

/**
 * Authed navigasyonu sınırlı, kapsamlanmış gateway-retry ile koşar. HER denemede:
 *   observer.beginAttempt() → doGoto() → (nav status 5xx doğrudan kanıt) →
 *   afterCommit() → assertOrGateway(ready).
 *
 * doGoto() EXCEPTION sözleşmesi:
 *   - exception + AYNI attempt'te kapsamlı gateway kanıtı → GatewayUnavailableError
 *     + sınırlı retry.
 *   - exception + kanıt yok → orijinal error AYNEN yükselir (generic timeout /
 *     locator / assertion gateway'e ÇEVRİLMEZ).
 *
 * Sabit sleep YOK (mimari waitForTimeout yasağı; taze goto doğal aralama sağlar).
 *
 * @param {any} page
 * @param {object} o
 * @param {() => Promise<{status?: () => number, url?: () => string}|null>} o.doGoto
 * @param {() => Promise<void>} o.ready
 * @param {string} o.where insanca bağlam (ör. path — secret değil)
 * @param {() => Promise<void>} [o.afterCommit]
 */
export async function navigateWithGatewayRetry(page, { doGoto, ready, where, afterCommit }) {
  const observer = getGatewayObserver(page);
  return runAuthWithGatewayRetry(
    async () => {
      observer.beginAttempt();

      let response;
      try {
        response = await doGoto();
      } catch (gotoErr) {
        // doGoto patladı (ör. 503 sırasında nav timeout). YALNIZ bu attempt'te
        // kapsamlı gateway kanıtı varsa çevir; yoksa orijinal hata aynen.
        const ev = await observer.detectEvidence();
        if (ev && isGatewayStatus(ev.status)) throw makeGatewayError(ev, where);
        throw gotoErr;
      }

      // Navigasyon yanıtının durum kodu doğrudan (ana document) gateway kanıtıdır.
      const navStatus =
        response && typeof response.status === 'function' ? response.status() : null;
      if (isGatewayStatus(navStatus)) {
        throw makeGatewayError({ status: Number(navStatus), source: 'main-document' }, where);
      }

      if (afterCommit) await afterCommit();
      // expectReady vb. — kapsamlı kanıt varsa retry, yoksa orijinal hata aynen.
      await assertOrGateway(observer, ready, where);
    },
    {
      maxAttempts: MAX_AUTH_ATTEMPTS,
      onRetry: (attempt, err) => {
        const status = err && /** @type {any} */ (err).gatewayStatus;
        const source = err && /** @type {any} */ (err).gatewaySource;
        logRetry({
          status,
          nextAttempt: attempt + 1,
          maxAttempts: MAX_AUTH_ATTEMPTS,
          where,
          source,
        });
      },
    }
  );
}
