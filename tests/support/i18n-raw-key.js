// @ts-check
/**
 * Sistemik i18n ham-anahtar sezgisi (ADR-0032 P1 · F-001/018/021/022/024/026/028).
 *
 * Amaç: bir sayfada ÇEVRİLMEMİŞ i18n anahtarının (ör. `channels.emailPage.defaultSignatureText`,
 * `voiceRegulatory.startKyc`, `contacts.delete`, `supervisor.voice.offline`) görünür metin
 * olarak render edilip edilmediğini yüksek kesinlikle tespit etmek.
 *
 * Tasarım kısıtı — YANLIŞ POZİTİFTEN kaçın: canlı sayfalarda meşru noktalı dizeler var
 * (e-posta `marketing@x.com`, alan adı `test.vomenta.com`, `smtp-relay.gmail.com`,
 * dosya `discovery-report.json`, sürüm `v1.2.3`, sayı `99.9`, URL). Bunlar anahtar SAYILMAZ.
 * Ayırt edici sezgi: i18n anahtarı = boşluksuz noktalı tanımlayıcı, `@`/`/`/`:` içermez,
 * TLD/dosya-uzantısıyla bitmez, rakamla başlamaz/`.rakam` içermez VE
 * (bir segmenti camelCase'tir) YA DA (ilk segment bilinen bir i18n ad-uzayıdır).
 */

/** Uygulamanın bilinen i18n üst-ad-uzayları (kanıt: known-bugs.js + ADR-0032 bulguları). */
export const KNOWN_I18N_NAMESPACES = Object.freeze(
  new Set([
    'common', 'nav', 'auth', 'onboarding', 'dashboard', 'inbox',
    'channels', 'voice', 'voiceRegulatory', 'ai', 'campaigns', 'contacts',
    'tickets', 'bot', 'botBuilder', 'analytics', 'reports', 'supervisor',
    'monitoring', 'workforce', 'settings',
  ])
);

/** Son segmenti alan adı / dosya uzantısı olan noktalı dizeleri elemek için. */
const TLD_OR_EXT =
  /\.(com|net|org|io|co|ai|dev|app|gov|edu|tr|de|fr|uk|us|json|js|mjs|ts|jsx|tsx|css|scss|md|txt|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|zip|pdf|csv|xml|yaml|yml|html?|gmail|vomenta|example)$/i;

/** Boşluksuz, en az bir noktalı, harf/rakam segmentli tanımlayıcı. */
const DOTTED_IDENT = /^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+$/;

/** Bir segment camelCase mi (içeride küçük→büyük geçiş)? */
const hasCamelSegment = (segments) => segments.some((seg) => /[a-z][A-Z]/.test(seg));

/**
 * Verilen metin bir ham i18n anahtarı mı?
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isRawI18nKey(raw) {
  if (typeof raw !== 'string') return false;
  const s = raw.trim();
  if (!s || /\s/.test(s)) return false; // boşluk → cümle/metin, anahtar değil
  if (s.includes('@') || s.includes('/') || s.includes(':')) return false; // e-posta/URL/path
  if (!DOTTED_IDENT.test(s)) return false; // noktalı tanımlayıcı değil (tire, vb. elenir)
  if (/^\d/.test(s) || /\.\d/.test(s)) return false; // sürüm/ondalık (v1.2.3, 99.9)
  if (TLD_OR_EXT.test(s)) return false; // alan adı / dosya uzantısı
  const segments = s.split('.');
  return hasCamelSegment(segments) || KNOWN_I18N_NAMESPACES.has(segments[0]);
}

/**
 * Bir dize kümesinden ham i18n anahtarlarını (benzersiz, sıralı) döndürür.
 * @param {Iterable<string>} strings
 * @returns {string[]}
 */
export function findRawI18nKeys(strings) {
  const found = new Set();
  for (const s of strings) if (isRawI18nKey(s)) found.add(s.trim());
  return [...found].sort();
}
