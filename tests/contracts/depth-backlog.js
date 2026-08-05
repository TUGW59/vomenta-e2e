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
  // ── FAZ 2: channels/* — TAMAMLANDI (1 deep: webchat @ix-tabs · 6 resolved-exempt:
  //    channels(hub)/email/sms/social/video/whatsapp — kart-ızgarası/config-form yüzeyleri) ──
  // ── FAZ 3: reports/* — TAMAMLANDI (11 deep, hepsi @ix-tabs: 10 ortak-kabuk bölümü
  //    Charts↔Table + /reports/dashboards All/Default/Custom). Ortak kabukta metin-arama/
  //    pager yok, tablo+boş-durum dönem-veri-bağlı → 5 veri boyutu naInteraction. ──
  // ── FAZ 4: workforce/* — TAMAMLANDI. Deep: /workforce (@ix-tabs 7 sekme + @ix-table
  //    çizelge), /workforce/schedules (@ix-table çizelge), /workforce/badges (@ix-tabs
  //    Badges↔Leaderboard). Resolved-exempt (test tenant'ında boş liste, etkileşim yüzeyi
  //    yok): /workforce/time-off, /workforce/surveys, /workforce/evaluations. ──
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
