// @ts-check

/**
 * Ürünün beklenen ana bilgi mimarisi.
 * Menü değiştiğinde dashboard testlerinin içinde dağınık listeler yerine
 * yalnızca bu sözleşme güncellenir ve değişiklik kod incelemesinde görünür olur.
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
