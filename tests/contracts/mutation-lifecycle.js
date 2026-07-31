// @ts-check

/**
 * Kalıcı `testEntity.create` yaşam döngüsünden açıkça ayrılan spec'ler.
 *
 * - `fixme`: Teardown yolu henüz kanıtlanmamış devre dışı mutasyon. `test.fixme`
 *   kaldırılırsa mimari validator hard failure üretir.
 * - `read-only`: Ayrılmış staging tenant'ında çalışan, hiçbir write yapmayan
 *   güvenlik denetimi. Spec açık salt-okunur işaretini taşımak zorundadır.
 */
export const MUTATION_LIFECYCLE_EXCLUSIONS = Object.freeze({
  'tests/campaigns-outbound.mutation.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: SCHEDULED kampanya için staging DELETE/orphan sayacı kanıtlanmadı; spec fixme.',
  }),
  'tests/known-bugs-invite.mutation.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: davet revoke endpointi ve prefix sayacı staging üzerinde kanıtlanmadı; spec fixme.',
  }),
  'tests/voice-call.mutation.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: çağrı/SMS dışa dönük ve kalıcı kullanıcı-adlı entity değil; güvenli sonuç/teardown yolu kanıtlanana kadar testler fixme.',
  }),
  'tests/mutation-orphans.authed.spec.js': Object.freeze({
    mode: 'read-only',
    reason:
      'N/A: bu spec create/edit/delete yapmaz; ayrılmış staging tenant baseline’ını salt-okunur doğrular.',
  }),

  // Ayarlar bölümü mutasyonları — tümü staging-kilitli ve ayrılmış staging tenant'ında
  // teardown/save-endpoint henüz kanıtlanmadığından test.fixme. Prod'da @mutation grepInvert
  // ile zaten filtrelenir. Kanıtlanınca fixme kaldırılıp testEntity.create yaşam döngüsüne geçilir.
  'tests/settings-profile-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: telefon PATCH kalıcılık/geri-alma staging tenant\'ında kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-organization-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: website PATCH/PUT kalıcılık/geri-alma staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-roles-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: custom rol create+delete ve orphan sayacı staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-compliance-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: consent/GDPR kaydı UI\'da hard-delete sunmuyor; purge ucu staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-teams-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: ekip silme yolu (Edit dialogunda Delete yok) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-hours-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: haftalık program Save kalıcılık/switch geri-alma staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-automations-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: kural create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-sla-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: SLA politikası satır silme (aksiyon ikonları aria-label\'sız) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-templates-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: şablon create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-disposition-codes-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: kod satır silme (aksiyon ikonları aria-label\'sız) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-canned-responses-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: hazır yanıt create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-integrations-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: webhook create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-security-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: hassas policy switch toggle+Save staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-data-retention-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: reversible spinbutton düzenle+Save staging\'de kanıtlanmadı (Run cleanup asla); spec fixme.',
  }),
  'tests/settings-notifications-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: kategori switch toggle+Save preferences staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-api-keys-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: anahtar create+revoke (liste prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings-webhooks-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: webhook create+delete (liste prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),

  // İş Gücü gamification/kalite mutasyonları (yeni /workforce/{badges,evaluations} rotaları).
  'tests/workforce-badges-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: rozet create canlıda çalışıyor ama UI\'da düzenle/sil yok; güvenli teardown (0→1→0) kanıtlanamadı; spec fixme.',
  }),
  'tests/workforce-evaluations-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: manuel değerlendirme gerçek etkileşim ID\'si + temsilci ister; create+sil ve orphan sayacı staging\'de kanıtlanmadı; spec fixme.',
  }),
});
