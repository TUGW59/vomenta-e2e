// @ts-check
/**
 * L2·deep RATCHET BACKLOG'u (tools/depth-ratchet.mjs okur — ADR-0029).
 *
 * Her DEDICATED rota şu üç terminal durumdan birinde OLMALI:
 *   (a) L2·deep, (b) resolved-exempt (L2·style + applicableDimensions=[]),
 *   (c) burada gerekçeli listeli.
 * Bir rota çözülünce (deep veya exempt) buradan SİL — böylece kapı ileriye dönük daralır.
 * `defer:*` HARİÇ tüm girdiler boşalınca tüm dedicated etkileşim yüzeyleri kanıtlanmış demektir.
 *
 * NOT: FAZ 0 pilotu `/settings/audit` bu listede DEĞİLDİR — pilotta doğrudan L2·deep yapılır.
 */
export const DEPTH_BACKLOG = Object.freeze({
  // ── FAZ 1: settings/* kalanı — TAMAMLANDI (5 deep: automations/templates/profile/
  //    disposition-codes/sla · 11 resolved-exempt: api-keys/canned-responses/compliance/
  //    data-retention/hours/integrations/notifications/organization/security/teams/webhooks) ──
  // ── FAZ 2: channels/* (7) ──
  '/channels': 'FAZ2-channels',
  '/channels/email': 'FAZ2-channels',
  '/channels/sms': 'FAZ2-channels',
  '/channels/social': 'FAZ2-channels',
  '/channels/video': 'FAZ2-channels',
  '/channels/webchat': 'FAZ2-channels',
  '/channels/whatsapp': 'FAZ2-channels',
  // ── FAZ 3: reports/* (11) ──
  '/reports/agent': 'FAZ3-reports',
  '/reports/ai': 'FAZ3-reports',
  '/reports/billing': 'FAZ3-reports',
  '/reports/call': 'FAZ3-reports',
  '/reports/campaign': 'FAZ3-reports',
  '/reports/channel': 'FAZ3-reports',
  '/reports/csat': 'FAZ3-reports',
  '/reports/dashboards': 'FAZ3-reports',
  '/reports/quality': 'FAZ3-reports',
  '/reports/queue': 'FAZ3-reports',
  '/reports/sla': 'FAZ3-reports',
  // ── FAZ 4: workforce/* (6) ──
  '/workforce': 'FAZ4-workforce',
  '/workforce/badges': 'FAZ4-workforce',
  '/workforce/evaluations': 'FAZ4-workforce',
  '/workforce/schedules': 'FAZ4-workforce',
  '/workforce/surveys': 'FAZ4-workforce',
  '/workforce/time-off': 'FAZ4-workforce',
  // ── FAZ 5: kalan (2) ──
  '/': 'FAZ5-misc (dashboard)',
  '/voice': 'FAZ5-misc (voice hub)',
  // ── DEFER: L0 voice alt-rotaları (runtime yok → deep olamaz; kapsam-dışı) ──
  '/voice/dids': 'defer:L0',
  '/voice/history': 'defer:L0',
  '/voice/ivr': 'defer:L0',
  '/voice/queues': 'defer:L0',
  '/voice/recordings': 'defer:L0',
  '/voice/regulatory': 'defer:L0',
  '/voice/sip-settings': 'defer:L0',
  '/voice/sip-trunks': 'defer:L0',
  '/voice/skills': 'defer:L0',
  '/voice/voicemail': 'defer:L0',
});
