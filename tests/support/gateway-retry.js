// @ts-check
/**
 * GATEWAY-RETRY — auth setup için SINIRLI (bounded) geçici ağ geçidi retry'ı.
 *
 * Canlı production sunucusu aralıklı olarak `502/503/504` (nginx gateway) dönebilir.
 * Bu blip'ler `auth.setup.js` login akışını düşürür → storageState yazılmaz →
 * bağımlı authed rotalar HİÇ çalışmaz. Çözüm: YALNIZ gerçek gateway kanıtı olan
 * hatalarda, EN FAZLA {@link MAX_AUTH_ATTEMPTS} denemeyle yeniden dene.
 *
 * BU MODÜL SAFTIR (Playwright import ETMEZ) → deterministik Node self-check'i
 * (tools/self-check-auth-retry.mjs) tarayıcı olmadan tüm dalları doğrulayabilir.
 *
 * RETRY EDİLİR:   502 Bad Gateway · 503 Service Unavailable · 504 Gateway Timeout
 * RETRY EDİLMEZ:  yanlış credential, 401/403, locator hatası, assertion hatası,
 *                 gateway kanıtı OLMAYAN nav/heading hatası. Bunlar gerçek
 *                 başarısızlıktır; retry maskeleme olur.
 */

/** Geçici sayılan (retry edilebilir) HTTP ağ geçidi durum kodları. */
export const GATEWAY_STATUS_CODES = Object.freeze([502, 503, 504]);

/** Auth setup için toplam deneme üst sınırı ("en fazla 3 denemeli"). */
export const MAX_AUTH_ATTEMPTS = 3;

/**
 * Bir HTTP durum kodunun geçici ağ geçidi hatası olup olmadığını söyler.
 * @param {unknown} status
 * @returns {boolean}
 */
export function isGatewayStatus(status) {
  const n = Number(status);
  return Number.isInteger(n) && GATEWAY_STATUS_CODES.includes(n);
}

/**
 * Bir hatanın gateway kanıtı taşıyıp taşımadığına göre retry kararını verir.
 * Kanıt = `error.gatewayStatus` alanında 502/503/504. Başka HİÇBİR sinyal
 * (401/403, locator, assertion) retry tetiklemez.
 * @param {{gatewayStatus?: number|null}|null|undefined} evidence
 * @returns {boolean}
 */
export function shouldRetryAuth(evidence) {
  return isGatewayStatus(evidence && evidence.gatewayStatus);
}

/**
 * Bir deneme sırasında gözlemlenen HTTP durum kodları listesinden (navigasyon +
 * API/XHR yanıtları) en SON gateway kodunu (502/504/503) seçer. Sayfa 200 dönüp
 * içerik render EDEMEDİĞİNDE (arka plandaki API 503'ü login formunu bloke ettiğinde)
 * gateway kanıtı yalnız burada görünür — nginx 5xx sayfa METNİ hiç oluşmaz.
 * @param {ReadonlyArray<unknown>|null|undefined} observedStatuses
 * @returns {number|null}
 */
export function pickGatewayStatus(observedStatuses) {
  if (!Array.isArray(observedStatuses)) return null;
  for (let i = observedStatuses.length - 1; i >= 0; i--) {
    if (isGatewayStatus(observedStatuses[i])) return Number(observedStatuses[i]);
  }
  return null;
}

/**
 * Render edilmiş bir hata sayfasının metninden gateway durum kodunu çıkarır
 * (nginx 5xx sayfası: "503 Service Temporarily Unavailable" vb.). Eşleşme yoksa
 * `null` döner — böylece login formu / normal içerik yanlışlıkla gateway sayılmaz.
 * @param {unknown} text
 * @returns {number|null}
 */
export function gatewayStatusFromBodyText(text) {
  if (typeof text !== 'string' || text.length === 0) return null;
  const m = text.match(
    /\b(502|503|504)\b[\s\S]{0,40}?(Bad Gateway|Service (?:Temporarily )?Unavailable|Gateway Time-?out)/i
  );
  return m ? Number(m[1]) : null;
}

/**
 * Geçici gateway hatası olduğunu işaretleyen hata sınıfı. `gatewayStatus`
 * alanı retry kararında kullanılan tek kanıttır.
 */
export class GatewayUnavailableError extends Error {
  /**
   * @param {number} status 502/503/504
   * @param {string} where insanca bağlam (rapora ham değer sızmaz)
   */
  constructor(status, where) {
    super(`Geçici ağ geçidi hatası (${status}) — ${where}`);
    this.name = 'GatewayUnavailableError';
    /** @type {number} */
    this.gatewayStatus = status;
  }
}

/**
 * `attemptFn`'i sınırlı retry ile koşar. Başarıda döndürdüğü değeri verir.
 * Hata fırlatınca YALNIZ gateway kanıtı (`error.gatewayStatus` ∈ 502/503/504)
 * varsa ve deneme hakkı kaldıysa yeniden dener; aksi halde hatayı aynen fırlatır.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} attemptFn 1-tabanlı deneme indeksini alır
 * @param {object} [opts]
 * @param {number} [opts.maxAttempts]
 * @param {(attempt: number, error: unknown) => (void|Promise<void>)} [opts.onRetry]
 *        her retry'dan ÖNCE (yalnız retry edilecekse) çağrılır — teşhis/log içindir
 * @param {(attempt: number) => (void|Promise<void>)} [opts.sleep]
 *        retry'lar arası kısa bekleme (Playwright'ta page.waitForTimeout)
 * @returns {Promise<T>}
 */
export async function runAuthWithGatewayRetry(attemptFn, opts = {}) {
  const maxAttempts = Number.isInteger(opts.maxAttempts) && opts.maxAttempts > 0
    ? opts.maxAttempts
    : MAX_AUTH_ATTEMPTS;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptFn(attempt);
    } catch (err) {
      lastError = err;
      const gatewayStatus =
        err && typeof err === 'object' && 'gatewayStatus' in err
          ? /** @type {any} */ (err).gatewayStatus
          : null;
      const retriable = shouldRetryAuth({ gatewayStatus });
      // Son deneme veya retry edilemez hata → aynen fırlat (maskeleme yok).
      if (!retriable || attempt === maxAttempts) throw err;
      if (opts.onRetry) await opts.onRetry(attempt, err);
      if (opts.sleep) await opts.sleep(attempt);
    }
  }
  // Ulaşılamaz (döngü ya döner ya fırlatır); tip güvenliği için.
  throw lastError;
}
