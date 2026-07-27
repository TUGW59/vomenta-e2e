// @ts-check

/**
 * Ürünün beklenen ana bilgi mimarisi.
 * Menü değiştiğinde dashboard testlerinin içinde dağınık listeler yerine
 * yalnızca bu sözleşme güncellenir ve değişiklik kod incelemesinde görünür olur.
 */
export const MAIN_NAVIGATION = Object.freeze([
  { name: 'Dashboard', path: '/' },
  { name: 'Inbox', path: '/inbox' },
  { name: 'Voice', path: '/voice' },
  { name: 'Channels', path: '/channels' },
  { name: 'AI', path: '/ai' },
  { name: 'Campaigns', path: '/campaigns' },
  { name: 'Bot Builder', path: '/bot-builder' },
  { name: 'Contacts', path: '/contacts' },
  { name: 'Tickets', path: '/tickets' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Reports', path: '/reports' },
  { name: 'Supervisor', path: '/supervisor' },
  { name: 'Workforce', path: '/workforce' },
  { name: 'Settings', path: '/settings' },
]);
