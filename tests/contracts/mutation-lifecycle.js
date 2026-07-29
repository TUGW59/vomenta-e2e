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
});
