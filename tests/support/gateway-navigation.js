// @ts-check
/**
 * GATEWAY-NAVIGATION — authed navigasyon için SINIRLI geçici gateway retry'ı.
 *
 * `gateway-retry.js` login akışını korur; bu ince glue AYNI kanıt makinesini
 * authed test GÖVDELERİNİN navigasyonuna (page.goto + expectReady) taşır.
 * Canlı sunucu aralıklı 502/503/504 (nginx gateway) döndüğünde, korumasız
 * authed navigasyon düz kırmızıya boyanıyordu (bkz. ADR-0027).
 *
 * Playwright import ETMEZ (yalnız saf gateway-retry politikasını `page` ile
 * birleştirir) → sahte (duck-typed) page ile tarayıcısız Node self-check'inde
 * (tools/self-check-authed-nav.mjs) deterministik sürülebilir.
 *
 * Fail-closed: YALNIZ gerçek gateway kanıtı (gözlemlenen 5xx ağ yanıtı VEYA
 * render edilen nginx 5xx sayfa metni) retry tetikler. Gerçek locator/assertion/
 * 401/403 hataları AYNEN yükselir — maskeleme yok.
 */
import {
  isGatewayStatus,
  pickGatewayStatus,
  gatewayStatusFromBodyText,
  GatewayUnavailableError,
  runAuthWithGatewayRetry,
  MAX_AUTH_ATTEMPTS,
} from './gateway-retry.js';

/**
 * page → observer eşlemesi. Bir page'e TEK dinleyici kurulur (idempotent):
 * navigateWithGatewayRetry + assertDestinationLoaded aynı page'i paylaşabilir.
 * @type {WeakMap<object, any>}
 */
const OBSERVERS = new WeakMap();

/**
 * Bir page'e per-deneme 5xx gözlemcisi kurar (idempotent). LoginPage
 * constructor + beginAttempt + _detectGatewayEvidence mantığının paylaşımlı hâli.
 * @param {any} page Playwright Page (veya self-check'te sahte)
 * @returns {{beginAttempt: () => void, statuses: number[], detectEvidence: () => Promise<number|null>}}
 */
export function getGatewayObserver(page) {
  const existing = OBSERVERS.get(page);
  if (existing) return existing;
  /** @type {number[]} */
  const statuses = [];
  // Ağ üzerindeki GERÇEK 502/503/504 kanıtı: sayfa 200 dönüp içerik render
  // edemediğinde (arka plan API 503'ü) gateway kanıtı YALNIZ burada görünür.
  page.on('response', (response) => {
    const status = response.status();
    if (isGatewayStatus(status)) statuses.push(status);
  });
  const observer = {
    /** Yeni bir deneme başlar: önceki denemenin gateway kanıtını temizle. */
    beginAttempt() {
      statuses.length = 0;
    },
    get statuses() {
      return statuses;
    },
    /**
     * Mevcut denemede gateway kanıtı arar: önce ağ üzerinde gözlemlenen 5xx
     * yanıt (en güçlü sinyal), yoksa render edilen nginx 5xx sayfa metni.
     * Kanıt yoksa null → retry edilmez.
     * @returns {Promise<number|null>}
     */
    async detectEvidence() {
      const fromNetwork = pickGatewayStatus(statuses);
      if (isGatewayStatus(fromNetwork)) return fromNetwork;
      try {
        const bodyText = await page.locator('body').innerText({ timeout: 2_000 });
        return gatewayStatusFromBodyText(bodyText);
      } catch {
        return null;
      }
    },
  };
  OBSERVERS.set(page, observer);
  return observer;
}

/**
 * `assertionFn`'i koşar; başarısız olursa YALNIZ gerçek gateway kanıtı varsa
 * hatayı geçici {@link GatewayUnavailableError}'a çevirir; yoksa orijinal hatayı
 * AYNEN fırlatır (fail-closed). LoginPage._assertOrGateway ile birebir sözleşme.
 * @param {{detectEvidence: () => Promise<number|null>}} observer
 * @param {() => Promise<unknown>} assertionFn
 * @param {string} where insanca bağlam
 */
export async function assertOrGateway(observer, assertionFn, where) {
  try {
    await assertionFn();
  } catch (err) {
    const status = await observer.detectEvidence();
    if (isGatewayStatus(status)) {
      throw new GatewayUnavailableError(Number(status), where);
    }
    throw err;
  }
}

/**
 * Authed navigasyonu sınırlı gateway-retry ile koşar. HER denemede:
 *   observer.beginAttempt() → doGoto() (nav status 5xx doğrudan kanıt) →
 *   afterCommit() → assertOrGateway(ready).
 * YALNIZ gateway kanıtında ≤{@link MAX_AUTH_ATTEMPTS} retry; başka her hata
 * anında yükselir. Sabit sleep YOK (mimari waitForTimeout yasağı; taze goto
 * doğal aralama sağlar).
 *
 * @param {any} page
 * @param {object} o
 * @param {() => Promise<{status?: () => number}|null>} o.doGoto ör. () => page.goto(path,{waitUntil:'commit'})
 * @param {() => Promise<void>} o.ready ör. () => shell.expectReady()
 * @param {string} o.where insanca bağlam (ör. path)
 * @param {() => Promise<void>} [o.afterCommit] ör. () => page.waitForLoadState('domcontentloaded').catch(()=>{})
 */
export async function navigateWithGatewayRetry(page, { doGoto, ready, where, afterCommit }) {
  const observer = getGatewayObserver(page);
  return runAuthWithGatewayRetry(
    async () => {
      observer.beginAttempt();
      const response = await doGoto();
      // Navigasyon yanıtının durum kodu doğrudan gateway kanıtıdır (502/503/504).
      const navStatus = response && response.status ? response.status() : null;
      if (isGatewayStatus(navStatus)) {
        throw new GatewayUnavailableError(Number(navStatus), where);
      }
      if (afterCommit) await afterCommit();
      // expectReady vb. — gateway kanıtı varsa retry, yoksa orijinal hata aynen.
      await assertOrGateway(observer, ready, where);
    },
    { maxAttempts: MAX_AUTH_ATTEMPTS }
  );
}
