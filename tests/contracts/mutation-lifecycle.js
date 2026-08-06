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
  'tests/voice/voice-call.mutation.authed.spec.js': Object.freeze({
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
  'tests/settings/settings-profile-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: telefon PATCH kalıcılık/geri-alma staging tenant\'ında kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-organization-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: website PATCH/PUT kalıcılık/geri-alma staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-roles-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: custom rol create+delete ve orphan sayacı staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-compliance-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: consent/GDPR kaydı UI\'da hard-delete sunmuyor; purge ucu staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-teams-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: ekip silme yolu (Edit dialogunda Delete yok) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-hours-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: haftalık program Save kalıcılık/switch geri-alma staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-automations-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: kural create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-sla-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: SLA politikası satır silme (aksiyon ikonları aria-label\'sız) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-templates-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: şablon create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-disposition-codes-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: kod satır silme (aksiyon ikonları aria-label\'sız) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-canned-responses-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: hazır yanıt create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-integrations-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: webhook create+delete (tablo prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-security-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: hassas policy switch toggle+Save staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-data-retention-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: reversible spinbutton düzenle+Save staging\'de kanıtlanmadı (Run cleanup asla); spec fixme.',
  }),
  'tests/settings/settings-notifications-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: kategori switch toggle+Save preferences staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-api-keys-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: anahtar create+revoke (liste prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/settings/settings-webhooks-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: webhook create+delete (liste prod\'da boş) staging\'de kanıtlanmadı; spec fixme.',
  }),

  // İş Gücü mutasyonları — SÜRELİ istisnalar (mode/reason/owner/expiry/removalCondition).
  // Anketler (surveys) TAM CRUD sunduğu için istisna DEĞİL: gerçek 0→1→0 yaşam döngüsü
  // tests/workforce-surveys-mutations.authed.spec.js içinde testEntity.create ile kanıtlanır.
  'tests/workforce/workforce-badges-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: rozet UI\'da yalnız oluşturulur; düzenle/sil yok (WORKFORCE-BADGES-NO-EDIT-DELETE) → güvenli 0→1→0 teardown UI\'dan kapatılamaz; spec fixme.',
    owner: 'quality-guild',
    expiry: '2026-09-30',
    removalCondition:
      'Backend/DB destekli silme (veya UI düzenle/sil) staging\'de kanıtlanınca fixme kaldırılır, testEntity.create 0→1→0 döngüsüne geçilir; orphan E2E-TEST-SILINECEK-badge temizlenir.',
  }),
  'tests/workforce/workforce-evaluations-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme',
    reason:
      'N/A: manuel değerlendirme gerçek etkileşim ID + temsilci gerektirir; tablo prod\'da boş, silme yolu gözlemlenemedi → güvenli teardown kanıtlanmadı; spec fixme.',
    owner: 'quality-guild',
    expiry: '2026-09-30',
    removalCondition:
      'Staging\'de sabit test etkileşim ID + DELETE `…/wfm/evaluations/{id}` kanıtlanınca fixme kaldırılır, testEntity.create 0→1→0 döngüsüne geçilir.',
  }),

  // Kanallar bölümü mutasyonları — tümü staging-kilitli; production salt-okunur olduğundan
  // güvenli 0→1→0 (değiştir/oluştur→doğrula→geri al/sil) yolu kanıtlanana kadar test.fixme.
  'tests/channels/channels-webchat-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: widget config Save kalıcılık/geri-alma (PUT /channels/webchat/config) staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/channels/channels-email-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: e-posta hesabı ekleme gerçek IMAP/SMTP + silme ucu staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/channels/channels-sms-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: gönderici kimliği POST /sender-ids + silme ucu staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/channels/channels-whatsapp-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: WABA "Not Configured"; şablon POST/DELETE templates/whatsapp bağlı tenant\'ta kanıtlanmadı; spec fixme.',
  }),
  'tests/channels/channels-social-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: Connect harici OAuth akışı otomatikleşemez; bağlama/kaldırma ucu staging\'de kanıtlanmadı; spec fixme.',
  }),
  'tests/channels/channels-video-mutations.authed.spec.js': Object.freeze({
    mode: 'fixme', reason: 'N/A: video config Save kalıcılık/geri-alma (PUT /channels/video/config) staging\'de kanıtlanmadı; spec fixme.',
  }),
});
