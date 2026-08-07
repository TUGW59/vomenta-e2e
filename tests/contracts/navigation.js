// @ts-check
import { PRODUCT_SURFACES } from './product-surfaces.js';

/**
 * Ürünün beklenen ana bilgi mimarisi.
 * Menü değiştiğinde dashboard testlerinin içinde dağınık listeler yerine
 * yalnızca bu sözleşme güncellenir ve değişiklik kod incelemesinde görünür olur.
 *
 * FAZ 3 (WP-SURFACE-MIGRATION): `MAIN_NAVIGATION` artık kanonik ürün yüzeyi
 * registry'sinin (`PRODUCT_SURFACES`) DOĞRULANAN ALT KÜMESİDİR. Aşağıdaki
 * fail-closed kapı, bu listenin registry'deki `navigation: 'main'` yüzeyleriyle
 * BİREBİR (ne fazla ne eksik) olmasını import anında zorlar. Böylece nav ile
 * kanonik envanter arasında sessiz sapma olamaz. `heading` alanı registry'de
 * TUTULMAZ (canlı gözlem metadata'sı); yalnız burada, nav L3 doğrulaması için.
 */
// `heading`: o rotaya gidildiğinde görünmesi beklenen sayfa başlığı (canlı gözlem,
// 28 Tem 2026). Navigasyon L3 doğrulaması için — hedef sayfanın gerçekten yüklendiğini
// kanıtlar (salt URL değil). Grup rotaları alt-rotaya yönlenebilir (/voice → /voice/live).
export const MAIN_NAVIGATION = Object.freeze([
  { name: 'Dashboard', path: '/', heading: 'Dashboard' },
  { name: 'Inbox', path: '/inbox', heading: 'Inbox' },
  { name: 'Voice', path: '/voice', heading: 'Live Calls' },
  { name: 'Channels', path: '/channels', heading: 'Channels' },
  { name: 'AI', path: '/ai', heading: 'AI Management' },
  { name: 'Campaigns', path: '/campaigns', heading: 'Campaigns' },
  { name: 'Bot Builder', path: '/bot-builder', heading: 'Bot Builder' },
  { name: 'Contacts', path: '/contacts', heading: 'Contacts' },
  { name: 'Tickets', path: '/tickets', heading: 'Tickets' },
  { name: 'Analytics', path: '/analytics', heading: 'Analytics' },
  { name: 'Reports', path: '/reports', heading: 'Reports' },
  { name: 'Supervisor', path: '/supervisor', heading: 'Supervisor' },
  { name: 'Workforce', path: '/workforce', heading: 'Workforce Management' },
  { name: 'Settings', path: '/settings', heading: 'Settings' },
]);

/**
 * FAIL-CLOSED: MAIN_NAVIGATION, kanonik registry'nin `navigation: 'main'` yüzeyleriyle
 * BİREBİR olmalı. Registry'ye main-nav yüzeyi eklenir/çıkarılır ya da bir nav path'i
 * registry'de main değilse import anında patlar (bozuk düzenleme hemen görünür).
 */
(function assertNavigationIsRegistrySubset() {
  const mainSurfaces = PRODUCT_SURFACES.filter((s) => s.navigation === 'main');
  const surfaceByRoute = new Map(mainSurfaces.map((s) => [s.route, s]));
  const navPaths = new Set();
  const errs = [];
  for (const item of MAIN_NAVIGATION) {
    if (navPaths.has(item.path)) errs.push(`Yinelenen nav path: ${item.path}`);
    navPaths.add(item.path);
    if (!surfaceByRoute.has(item.path)) {
      errs.push(`MAIN_NAVIGATION '${item.path}' kanonik registry'de navigation:'main' bir yüzey değil.`);
    }
  }
  for (const s of mainSurfaces) {
    if (!navPaths.has(s.route)) {
      errs.push(`Registry navigation:'main' yüzeyi '${s.route}' (${s.id}) MAIN_NAVIGATION'da eksik.`);
    }
  }
  if (errs.length) {
    throw new Error(`MAIN_NAVIGATION kanonik registry alt kümesi değil:\n  - ${errs.join('\n  - ')}`);
  }
})();

/**
 * SIDEBAR AĞACI — kenar menüsünün hiyerarşisini KANONİK REGISTRY'DEN TÜRETİR.
 * Ayrı bir liste elle tutulmaz: tek kaynak `PRODUCT_SURFACES`'tir. Üst düzey =
 * `navigation:'main'`; alt öğeler = o yüzeyi `parentId` ile işaret eden ve
 * `navigation:'secondary'` olan yüzeyler.
 *
 * NEDEN ADAPTASYON İÇİN ÖNEMLİ: Dev'de bilgi mimarisi değişip sayfalar taşındığında
 * (ör. sol paneldeki öğe sayısı azaltılıp bazı sayfalar bir grubun altına alındığında)
 * YALNIZCA registry'deki `navigation`/`parentId` alanları güncellenir; bu ağaç, türev
 * MAIN_NAVIGATION ve grup-farkındalıklı gezinme (AppShell.openViaSidebar) otomatik takip
 * eder. "Tıklayınca gezinir mi yoksa alt-menü mü açar" davranışı UI gözlemine bağlıdır ve
 * navigation.authed.spec.js tarafından doğrulanır; burada rota/hiyerarşi gerçeği tutulur.
 *
 * @param {readonly any[]} [surfaces]
 * @returns {ReadonlyArray<{ id:string, route:string, area:string, heading:(string|null),
 *   children: ReadonlyArray<{ id:string, route:string }> }>}
 */
export function buildSidebarTree(surfaces = PRODUCT_SURFACES) {
  const headingByRoute = new Map(MAIN_NAVIGATION.map((n) => [n.path, n.heading]));
  return Object.freeze(
    surfaces
      .filter((s) => s.navigation === 'main')
      .map((s) =>
        Object.freeze({
          id: s.id,
          route: s.route,
          area: s.area,
          heading: headingByRoute.get(s.route) ?? null,
          children: Object.freeze(
            surfaces
              .filter((c) => c.parentId === s.id && c.navigation === 'secondary')
              .map((c) => Object.freeze({ id: c.id, route: c.route }))
          ),
        })
      )
  );
}

/** Registry'den türetilmiş kenar menüsü ağacı (üst öğeler + alt-menü çocukları). */
export const SIDEBAR_TREE = buildSidebarTree();

/**
 * Üst düzey bir nav öğesinin registry'de alt-rotaları (secondary çocukları) var mı?
 * DİKKAT: Bu YAPISAL bir gerçektir; UI'da "tıklayınca alt-menü açar mı yoksa gezinir mi"
 * DEĞİLDİR (ör. Settings'in çok çocuğu vardır ama tıklanınca /settings'e gider = yaprak).
 * UI davranışı navigation.authed.spec.js'te gözlemle doğrulanır.
 */
export function hasSubRoutes(route) {
  const node = SIDEBAR_TREE.find((n) => n.route === route);
  return Boolean(node && node.children.length > 0);
}
