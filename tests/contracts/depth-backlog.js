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
  // ── FAZ 5: kalan (2) — TAMAMLANDI (ikisi de resolved-exempt: / = KPI/grafik/kart
  //    özeti; /voice = canlı-çağrı hub'ı, test tenant'ında boş. Kapsanabilir sekme/tablo/
  //    filtre etkileşimi yok → tüm geçerli boyut naInteraction). ──
  // ── supervisor/agents: WAVE-L2-DEEP-2'de ÇÖZÜLDÜ → L2·deep (tablo/@ix-table,
  //    arama/@ix-filter, boş-durum/@ix-empty kanıtlı; pagination+loading dürüst N/A).
  //    supervisor-agents-interactions.authed.spec.js — prod'da retries=0 kararlı.
  // ── voice/* alt-rotaları: PR #122 (L0 runtime-yakalama) bunları L2·style'a çıkardı
  //    (artık L1 proven + stil sözleşmeli) → ARTIK L2·deep ADAYI (defer:L0 değil).
  //    WAVE-L2-DEEP-2'de ÇÖZÜLENLER:
  //    • L2·deep (tablo/@ix-table, prod'da yeşil): history, recordings, voicemail, dids, ivr.
  //    • resolved-exempt (probe'da role=table YOK + satır-içi arama/filtre yüzeyi yok →
  //      tüm boyut naInteraction, applicable=0): queues (kuyruk kartları), skills (kuyruk-kapsam
  //      combobox + kart üye paneli), sip-trunks (liste test tenant'ında boş "No SIP Trunks").
  //    • /voice/regulatory + /voice/sip-settings: zaten resolved-exempt (salt-config/özet).
  //    → voice/* için bekleyen backlog KALMADI.
});
