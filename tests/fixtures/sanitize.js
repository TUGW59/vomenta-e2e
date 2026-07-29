// @ts-check
/**
 * WP-01 — Ortak secret/PII maskeleyici (P0 güvenlik).
 *
 * Playwright'a bağımlı DEĞİL: hem test fixture'ları (`diagnostics`, `artifacts`)
 * hem node araçları (`tools/self-check-artifact-safety.mjs`) import edebilir.
 *
 * Amaç: hiçbir trace / video / screenshot / console / JSON / CSV artifact'ında
 * token, Authorization, cookie, e-posta, telefon, müşteri adı veya URL query
 * değeri açık kalmasın. Maskeleyici (`redact*`) ile tarayıcı (`findSecrets`) AYNI
 * desenleri paylaşır: tarayıcının tanıdığı her sızıntı maskeleyici tarafından da
 * temizlenir — bu, self-check'in "kaçışsız" garantisidir.
 */

export const REDACTION = Object.freeze({
  email: '<redacted-email>',
  phone: '<redacted-phone>',
  jwt: '<redacted-jwt>',
  bearer: 'Bearer <redacted>',
  key: '<redacted-key>',
  value: '<redacted>',
});

/** Değeri (JSON alanı / HTTP header) tamamen maskelenmesi gereken hassas anahtarlar. */
export const SENSITIVE_KEY =
  /(authorization|cookie|set-cookie|x-api-key|token|secret|password|passwd|pwd|api[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|client[-_ ]?secret|session|bearer)/i;

// Metin-içi maskeleme desenleri. Nicelikler ReDoS'a karşı sınırlıdır.
// `to` string ise sabit yerine geçer; fonksiyon ise (match, ...groups) alır.
const REDACT_PATTERNS = [
  { re: /eyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g, to: REDACTION.jwt },
  { re: /bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, to: REDACTION.bearer },
  { re: /\b[rps]k_(?:live|test)_[A-Za-z0-9]{10,}\b/g, to: REDACTION.key },
  // key: value / key=value biçiminde hassas alan → değeri düşür, anahtarı ve
  // (varsa) çevreleyen tırnakları koru (idempotent + tarayıcı ile tutarlı).
  {
    re: /("?(?:authorization|cookie|set-cookie|x-api-key|token|secret|password|passwd|pwd|api[-_]?key|access[-_]?token|refresh[-_]?token|client[-_]?secret|session)"?\s*[:=]\s*)("?)[^"\s,;}&]+\2/gi,
    to: (_m, keyPart, quote) => `${keyPart}${quote}<redacted>${quote}`,
  },
  { re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, to: REDACTION.email },
  { re: /\+\d[\d\s().-]{7,14}\d/g, to: REDACTION.phone },
];

/**
 * Serbest metni maskeler.
 * @param {unknown} input
 * @param {{ maxLen?: number }} [opts]
 * @returns {string}
 */
export function redactText(input, opts = {}) {
  if (input == null) return '';
  let s = String(input);
  for (const { re, to } of REDACT_PATTERNS) {
    s = s.replace(re, typeof to === 'function' ? to : () => to);
  }
  if (typeof opts.maxLen === 'number' && s.length > opts.maxLen) {
    s = `${s.slice(0, opts.maxLen)}…`;
  }
  return s;
}

/**
 * URL'i güvenli hale getirir: userinfo düşürülür, tüm query DEĞERLERİ maskelenir
 * (anahtarlar teşhis için korunur).
 * @param {string} raw
 * @returns {string}
 */
export function redactUrl(raw) {
  try {
    const url = new URL(String(raw));
    if (url.username) url.username = REDACTION.value;
    if (url.password) url.password = REDACTION.value;
    for (const key of url.searchParams.keys()) {
      url.searchParams.set(key, REDACTION.value);
    }
    return url.toString();
  } catch {
    return '<invalid-url>';
  }
}

/**
 * HTTP header nesnesini maskeler.
 * @param {Record<string, unknown>} [headers]
 */
export function redactHeaders(headers = {}) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTION.value : redactText(value);
  }
  return out;
}

/**
 * Nesneyi/diziyi özyinelemeli maskeler: hassas anahtarların değeri tamamen
 * düşürülür, string değerlere `redactText` uygulanır. JSON artifact'i için.
 * @param {unknown} value
 * @returns {unknown}
 */
export function redactDeep(value, _seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof value === 'string') return redactText(value);
  if (typeof value !== 'object') return value;
  if (_seen.has(value)) return '<circular>';
  _seen.add(value);
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, _seen));
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTION.value : redactDeep(v, _seen);
  }
  return out;
}

// Tarayıcı desenleri (maskeleyiciyle AYNI sızıntı sınıfları). Maskeleme sonrası
// üretilen `<redacted*>` yer tutucuları BİLEREK eşleşmez (değer `<` ile başlar).
const SCAN_PATTERNS = [
  { type: 'jwt', re: /eyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/ },
  { type: 'bearer', re: /bearer\s+[A-Za-z0-9._~+/=-]{8,}/i },
  { type: 'provider-key', re: /\b[rps]k_(?:live|test)_[A-Za-z0-9]{10,}\b/ },
  { type: 'email', re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { type: 'phone', re: /\+\d[\d\s().-]{7,14}\d/ },
  {
    type: 'sensitive-kv',
    re: /("?(?:authorization|cookie|set-cookie|x-api-key|token|secret|password|passwd|pwd|api[-_]?key|access[-_]?token|refresh[-_]?token|client[-_]?secret|session)"?\s*[:=]\s*"?)[^"\s,;}&<][^"\s,;}&]*/i,
  },
];

/**
 * Bir metinde/JSON string'inde tanınan sızıntı türlerini döndürür.
 * Boş dizi = temiz. Self-check ve artifact taraması bunu kullanır.
 * @param {unknown} input
 * @returns {string[]}
 */
export function findSecrets(input) {
  const s = typeof input === 'string' ? input : JSON.stringify(input ?? '');
  return SCAN_PATTERNS.filter(({ re }) => re.test(s)).map(({ type }) => type);
}
