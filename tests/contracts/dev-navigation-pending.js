// @ts-check
/**
 * DEV IA — BEKLEYEN (PENDING) GÖZLEM MODELİ (2026-08-07, app.dev.vomenta.com).
 *
 * Dev'de sol panel yeniden düzenleniyor (bölümlere ayrıldı, /monitoring alanı eklendi,
 * Supervisor hedefi /supervisor/coaching oldu, Admin bölümü geldi). Redesign DEVAM
 * ETTİĞİ için bu yapı henüz KANONİK registry'ye (PRODUCT_SURFACES / MAIN_NAVIGATION)
 * bağlanmadı — hareketli hedefe karşı erken migrasyon churn yaratır.
 *
 * Bu dosya BİLİNÇLİ olarak fail-closed kapılara ve uzlaştırma araçlarına BAĞLI DEĞİLDİR
 * (araçlar yalnız belirli isimli export'ları import eder; bu dosyayı hiçbir araç kaynak
 * saymaz). Amacı: yeni IA'yı KODDA yakalamak, grup/bölüm-farkındalıklı gezinme için
 * hazır tutmak ve IA donunca yapılacak tam migrasyona kaynak olmak.
 *
 * IA donunca migrasyon (bkz. docs/NAVIGATION.md):
 *   1) PRODUCT_SURFACES: /monitoring (+children) ekle; settings-users → navigation:'main';
 *      supervisor nav hedefi /supervisor/coaching; nav-bölüm alanı eklenebilir.
 *   2) MAIN_NAVIGATION: yeni üst-düzey listeyi yansıt (fail-closed kapı tutarlılığı zorlar).
 *   3) registered-routes / tested-pages / discovery-baseline: /monitoring* için güncelle.
 *   4) navigation.authed.spec.js: bölüm/grup davranışını yeni panele göre güncelle.
 */

/** Gözlem meta verisi. */
export const DEV_NAV_OBSERVED_AT = '2026-08-07';

/**
 * Sol panelin bölüm (section) yapısı. `group: true` = tıklayınca alt-menü açan grup
 * (chevron); `false` = doğrudan gezinen yaprak. Admin öğelerinin grup davranışı bu turda
 * tam doğrulanmadı (null = doğrulanacak).
 * @type {ReadonlyArray<{ section: string, items: ReadonlyArray<{ label: string, route: string, group: (boolean|null) }> }>}
 */
export const DEV_NAV_SECTIONS = Object.freeze([
  { section: 'Overview', items: Object.freeze([
    { label: 'Dashboard', route: '/', group: false },
    { label: 'Inbox', route: '/inbox', group: false },
  ]) },
  { section: 'Channels', items: Object.freeze([
    { label: 'Voice', route: '/voice', group: true },
    { label: 'Channels', route: '/channels', group: true },
    { label: 'AI', route: '/ai', group: true },
  ]) },
  { section: 'Engagement', items: Object.freeze([
    { label: 'Campaigns', route: '/campaigns', group: true },
    { label: 'Bot Builder', route: '/bot-builder', group: false },
    { label: 'Contacts', route: '/contacts', group: true },
    { label: 'Tickets', route: '/tickets', group: false },
  ]) },
  { section: 'Operations', items: Object.freeze([
    { label: 'Analytics', route: '/analytics', group: false },
    { label: 'Reports', route: '/reports', group: true },
    { label: 'Supervisor', route: '/supervisor/coaching', group: true },
    { label: 'Monitoring', route: '/monitoring', group: true },
    { label: 'Workforce', route: '/workforce', group: true },
  ]) },
  { section: 'Admin', items: Object.freeze([
    { label: 'Users & Teams', route: '/settings/users', group: null },
    { label: 'Settings', route: '/settings', group: null },
  ]) },
]);

/**
 * YENİ /monitoring alanı (gözlem 2026-08-07). Eski Supervisor canlı-izleme yüzeylerini
 * devralıyor gibi görünüyor. Registry'ye HENÜZ alınmadı.
 */
export const DEV_MONITORING_AREA = Object.freeze({
  area: 'monitoring',
  root: '/monitoring',
  children: Object.freeze(['/monitoring/live', '/monitoring/agents', '/monitoring/ai-summary']),
});

/** Tüm gözlenen üst-düzey nav rotaları (kayıt sırasında, düzleştirilmiş). */
export const DEV_NAV_ROUTES = Object.freeze(
  DEV_NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.route))
);

/** Bir rotanın hangi bölümde olduğunu döndürür (yoksa null). */
export function devSectionOf(route) {
  const hit = DEV_NAV_SECTIONS.find((s) => s.items.some((i) => i.route === route));
  return hit ? hit.section : null;
}
