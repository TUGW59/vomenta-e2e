// @ts-check
/**
 * HAM `test.fail(true, 'Bulgu: …')` ENVANTERİ — registry-DIŞI beklenen-başarısızlıklar.
 *
 * Bazı ürün bug'ları (çoğu i18n/a11y) `known-bugs.js` registry'sine `knownBugGuard`
 * ile bağlanmak yerine spec içinde doğrudan `test.fail(true, 'Bulgu: …')` ile
 * işaretlenmiştir. Bunlar false-green DEĞİLDİR (her birinin ARDINDA gerçek terminal
 * assertion vardır → bug düzelince unexpected-pass ile RED olur). Ama registry ile
 * çapraz-kontrol edilmedikleri için stale/duplicate DRIFT edebilirler.
 *
 * Bu dosya, bu paralel mekanizmayı TEK yerde uzlaştırır. `self-check-raw-expected-fails.mjs`:
 *   - Bu listede OLMAYAN bir ham `test.fail(true, …)` → FAIL (bilinçli kaydet).
 *   - Spec'te artık KARŞILIĞI OLMAYAN liste girdisi → FAIL (stale, sil).
 *   - `registryFinding` non-null ise → `known-bugs.js`'te var olmalı (dedup bağı).
 *
 * `includes`: aynı dosyadaki siteyi tekilleştiren, mesajda geçen KARARLI alt-dize.
 * `registryFinding`: aynı ürün bug'ı registry'de de izleniyorsa id; yoksa null
 *   (bilinçli spec-yerel expected-fail). NOT: "kapat butonu Close" sınıfı registry'de
 *   yalnız BOT-BUILDER yüzeyi için var (`BOT-BUILDER-CLOSE-I18N`); settings diyalogları
 *   ayrı ayrı registry'de İZLENMİYOR → null. Uydurma bağ kurulmaz.
 */
export const RAW_EXPECTED_FAILS = Object.freeze([
  { file: 'tests/settings-api-keys.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat (X) butonu erişilebilir ismi 4 dilde İngilizce "Close" — i18n/a11y (WCAG 4.1.2). Ürün bug.', registryFinding: null },
  { file: 'tests/settings-audit.authed.spec.js', includes: 'Full Export', reason: '"Full Export" butonu tr/fr/ar arayüzde İngilizce kalıyor — i18n. Ürün bug.', registryFinding: null },
  { file: 'tests/settings-audit.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-automations.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-canned-responses.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-compliance.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-disposition-codes.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-roles.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-security.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-security.authed.spec.js', includes: 'sayı alanları etiketsiz', reason: 'Güvenlik ayarları sayı alanları etiketsiz — a11y (axe label/critical). Ürün bug.', registryFinding: null },
  { file: 'tests/settings-sla.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-sla.authed.spec.js', includes: 'form alanları etiketsiz', reason: 'New SLA Policy dialog form alanları etiketsiz — a11y (axe label/critical). Ürün bug.', registryFinding: null },
  { file: 'tests/settings-teams.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-templates.authed.spec.js', includes: 'placeholder', reason: 'New Template textarea placeholder\'ı çevrilmemiş ham i18n anahtarı. Ürün bug.', registryFinding: null },
  { file: 'tests/settings-templates.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-users.authed.spec.js', includes: 'kapat buton', reason: 'Davet dialogu kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
  { file: 'tests/settings-webhooks.authed.spec.js', includes: 'kapat buton', reason: 'Diyalog kapat butonu i18n "Close". Ürün bug.', registryFinding: null },
]);
