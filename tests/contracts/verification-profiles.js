// @ts-check
/**
 * WP-R4 — Doğrulama izin/rol profilleri (registry'den AYRI config; known-bugs.js ŞEMASI
 * DEĞİŞMEZ).
 *
 * Bazı bulgular (ör. B4) yalnız BELİRLİ bir izin/oturum profilinde reproduce olur.
 * "verified-fixed" ancak bulgunun ORİJİNAL hata bağlamındaki profille doğrulanırsa
 * geçerlidir (WP-R4 tasarım kararı #7). Bu dosya, bir bulgu için beklenen normalize
 * profil kısıtını (allowlisted izin ANAHTARLARI — değer/secret/PII YOK) tanımlar.
 *
 * `version`: profil kontratı sürümü — profil fingerprint'ine katılır (kontrat değişince
 *   fingerprint bilinçli değişir; ama run-id/timestamp/sıra fingerprint'e GİRMEZ).
 * `require`: bu izin ANAHTARLARININ profilde bulunması beklenir.
 * `forbid` : bu izin ANAHTARLARININ profilde bulunMAMASI beklenir (yetkisiz bağlam).
 * `permissionsUrlIncludes`: profilin okunacağı salt-okunur izin ucu (yalnız anahtarlar
 *   çıkarılır; yanıt gövdesi diske YAZILMAZ).
 *
 * Profil kısıtı OLMAYAN bulgular için doğrulama profil-bağımsızdır (profileVerified=true).
 * Kısıtı OLAN bulguda profil okunamaz/eşleşmezse koşu `inconclusive` sayılır — pass değil.
 */

/** @typedef {{ version: number, permissionsUrlIncludes: string, require: string[], forbid: string[], note: string }} VerificationProfile */

/** @type {Record<string, VerificationProfile>} */
export const VERIFICATION_PROFILES = Object.freeze({
  // B4: "Manage Modules → / (kök) fallback" bulgusu, kayıttaki technicalEvidence'a göre
  // hesabın settings.billing.*/modül-yönetim izni OLMADIĞI (yetkisiz) bağlamda gözlendi.
  // Bu nedenle B4 doğrulaması yalnız AYNI yetkisiz profilde geçerlidir: bu izinler
  // profilde BULUNMAMALI. Farklı (yetkili) bir profilde geçiş, orijinal bulguyu
  // doğrulamaz → inconclusive.
  B4: {
    version: 1,
    permissionsUrlIncludes: '/api/v1/roles/me/permissions',
    require: [],
    forbid: ['settings.billing.view', 'settings.billing.manage', 'modules.manage'],
    note: 'Orijinal hata bağlamı: hesap settings.billing.*/modules yönetim iznine sahip DEĞİL (yetkisiz → kök fallback).',
  },
});

/** Bir bulgunun doğrulama profil kısıtını döndürür (yoksa null → profil-bağımsız). */
export function verificationProfileFor(id) {
  return Object.prototype.hasOwnProperty.call(VERIFICATION_PROFILES, id)
    ? VERIFICATION_PROFILES[id]
    : null;
}
