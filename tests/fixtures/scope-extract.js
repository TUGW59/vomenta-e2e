// @ts-check
/**
 * WP-R4 takip — Deterministik izin/scope çıkarımı (saf; harici bağımlılık YOK).
 *
 * Gerçek `/api/v1/roles/me/permissions` yanıtından yakalanan 106 gerçek anahtarın
 * yapısal analizi (30 Tem 2026, run 30549912614):
 *   - hepsi noktalı, 2–4 segment; her segment harf-başlangıçlı camelCase
 *     (ör. `settings.apiKeys.manage`, `voice.recordings.play.masked`, `wfm.view`)
 *   - underscore YOK, tire YOK, iki-nokta YOK, rakam YOK, boşluk YOK
 *   - tek kirlilik: gevşek eski tarama bir ISO timestamp'ı (`2026-…Z`) yakalamıştı
 *
 * Bu yüzden çıkarım: (a) YAPISAL dışlama (timestamp/UUID/URL/e-posta/sayısal/boşluk),
 * (b) kanıta dayalı scope şekli, (c) yalnız yapısal olarak izin taşıyan bağlamlardan
 * (scope-string dizileri, boolean-map anahtarları, bilinen izin alanları) toplama.
 * Fingerprint'e run-id/timestamp/sıra GİRMEZ (bkz. normalizeProfile).
 */

/** İzin taşıyan bilinen alan adları (öncelikli çıkarım bağlamı). */
export const PERMISSION_FIELD_RE =
  /^(permissions?|scopes?|grantedpermissions|permissionkeys|allowedscopes|acl|privileges|grants)$/i;

const ISO_RE = /\d{4}-\d{2}-\d{2}(t|\s)?\d{0,2}/i; // 2026-07-30 / 2026-07-30T14:...
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Noktalı scope: ≥2 segment; her segment harf-başlangıçlı (iç rakam serbest — geleceğe
// dönük); tire/altçizgi/iki-nokta YOK (gerçek veride yok, timestamp'i de eler).
const SCOPE_RE = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/;

/**
 * Bir string geçerli izin/scope anahtarı mı? Yapısal dışlama + kanıta dayalı şekil.
 * @param {unknown} s
 */
export function isValidScope(s) {
  if (typeof s !== 'string') return false;
  const v = s.trim();
  if (v.length < 3 || v.length > 80) return false;
  if (/\s/.test(v)) return false; // boşluk
  if (v.includes('@') || v.includes('/') || v.includes(':')) return false; // e-posta / URL / timestamp saati
  if (v.includes('_') || v.includes('-')) return false; // gerçek scope'larda yok; UUID/tarih eler
  if (/\d{4}/.test(v)) return false; // yıl-benzeri (timestamp) — 4 ardışık rakam
  if (ISO_RE.test(v)) return false; // ISO tarih/saat
  if (UUID_RE.test(v)) return false; // UUID
  if (/^\d+$/.test(v)) return false; // sayısal id
  return SCOPE_RE.test(v);
}

/**
 * JSON'dan YALNIZ yapısal olarak izin taşıyan bağlamlardan geçerli scope'ları çıkarır:
 *  - dizi elemanı olan scope-string'ler,
 *  - boolean-map anahtarları ({ "settings.view": true }),
 *  - bilinen izin alanı (PERMISSION_FIELD_RE) altındaki scalar scope-string.
 * Rasgele scalar string değerleri (metadata) TOPLANMAZ. Sonuç benzersiz + sıralı.
 * @param {unknown} json
 * @returns {string[]}
 */
export function extractPermissionScopes(json) {
  const out = new Set();
  const visit = (node, depth) => {
    if (node == null || depth > 8) return;
    if (Array.isArray(node)) {
      for (const el of node) {
        if (typeof el === 'string') {
          if (isValidScope(el)) out.add(el);
        } else visit(el, depth + 1);
      }
      return;
    }
    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (v === true && isValidScope(k)) out.add(k); // boolean-map
        if (PERMISSION_FIELD_RE.test(k) && typeof v === 'string' && isValidScope(v)) out.add(v); // scalar izin alanı
        visit(v, depth + 1);
      }
    }
  };
  visit(json, 0);
  return [...out].sort();
}
