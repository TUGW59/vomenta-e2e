// @ts-check
/**
 * L2·style RATCHET BACKLOG'u (tools/style-ratchet.mjs okur — ADR-0031).
 *
 * "Hiçbir rota eksik kalmasın" makine-garantisi. Her KAYITLI rota şu üç durumdan
 * birinde OLMALI:
 *   (a) L2·style veya L2·deep (stil sözleşmesi karşılandı),
 *   (b) burada `PENDING` (koşulabilir ama stil sözleşmesi henüz yazılmadı — yapılacak iş),
 *   (c) burada `defer:*` (yapısal olarak L2·style'a çıkamaz: dinamik/blocked rota).
 *
 * Bir rota L2·style'a çıkınca PENDING girdisini buradan SİL — kapı ileriye dönük daralır.
 * `defer:*` HARİÇ tüm girdiler boşalınca: her koşulabilir rota stil-kapsamlı demektir.
 *
 * NOT (2026-08-06): greenfield stil sözleşmesi authoring'i KOŞABİLİR AUTHED ORTAM ister
 * (yerel `.env` test hesabı VEYA staging URL). O gelene kadar bu liste işi GÖRÜNÜR tutar;
 * kör-CI grind yapılmaz. Her rota, ortam gelince gerçek koşum döngüsüyle bitirilir.
 * Bkz. [[l0-runtime-capture]], ADR-0031.
 */
export const STYLE_BACKLOG = Object.freeze({
  // ── PENDING (18) — L1 proven (açılış kanıtlı), tam stil sözleşmesi yazılacak ──
  // ai/* (8)
  '/ai/prompts': 'PENDING:ai (⚠AI-PROMPTS-CONSOLE)',
  '/ai/chatbot': 'PENDING:ai',
  '/ai/copilot': 'PENDING:ai',
  '/ai/knowledge-base': 'PENDING:ai',
  '/ai/providers': 'PENDING:ai',
  '/ai/sentiment': 'PENDING:ai',
  '/ai/usage': 'PENDING:ai',
  '/ai/voice': 'PENDING:ai',
  // campaigns/* (1) — /campaigns/outbound C1'de dedicated L2·deep oldu → style-backlog'dan silindi.
  '/campaigns/create': 'PENDING:campaigns (CampaignCreatePage POM VAR)',
  // contacts/* (2)
  '/contacts/import': 'PENDING:contacts',
  '/contacts/segments': 'PENDING:contacts',
  // supervisor/* — hepsinde spec+POM VAR, findings-öncelikli dalga
  // /supervisor/agents: WAVE-STYLE-1'de L2·style'a çıkarıldı (tested-pages'e kaydedildi).
  '/supervisor/calls': 'PENDING:supervisor',
  // /supervisor/coaching: C1'de dedicated L2·deep oldu (@ix-tabs + stil) → style-backlog'dan silindi.
  '/supervisor/wallboard': 'PENDING:supervisor (WallboardPage POM+spec VAR; ⚠5 bug — en yüksek risk)',
  // voice hub alt (1)
  '/voice/live': 'PENDING:voice (canlı çağrı görünümü; VoicePage /voice/live)',

  // ── defer:blocked (4) — @route-blocked (dinamik param / redirect-gated) → baseline koşulamaz ──
  '/bot-builder/:id': 'defer:blocked-dynamic (id parametresi; canonical bot gerektirir)',
  '/contacts/:id': 'defer:blocked-dynamic (id parametresi; canonical kişi gerektirir)',
  '/settings/billing': 'defer:blocked-redirect (⚠SETTINGS-BILLING-REDIRECT; yönlenme-gated)',
  '/settings/billing/marketplace': 'defer:blocked (billing alt-yüzeyi)',

  // ── defer:blocked (5) — F-029/ADR-0034 DEV-only IA; PROD'da 404 (2026-08-09 authed probe) ──
  // readonly-blocked (FEATURE_FLAG_OFF): prod'da erişilemediği için stil sözleşmesi
  // koşulamaz. Prod'a çıkınca (lifecycle→active) buradan SİL + L2·style'a çıkar.
  '/monitoring': 'defer:blocked (F-029 dev-only IA; prod 404 — ADR-0034)',
  '/monitoring/live': 'defer:blocked (F-029 dev-only IA; prod 404 — ADR-0034)',
  '/monitoring/agents': 'defer:blocked (F-029 dev-only IA; prod 404 — ADR-0034)',
  '/monitoring/ai-summary': 'defer:blocked (F-029 dev-only IA; prod 404 — ADR-0034)',
  '/supervisor/ai-rate-suggestions': 'defer:blocked (F-029 dev-only IA; prod 404 — ADR-0034)',
});
