// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * Kenar menüsü TIKLAMA gezinmesinin fonksiyonel testi — linke tıklayınca gerçekten
 * doğru sayfaya gidiyor mu. (href doğruluğu + doğrudan URL erişimi dashboard.authed'de test edilir.)
 *
 * Not: Bazı menü öğeleri (Voice, Channels, AI, Campaigns, Contacts, Reports...) tıklanınca
 * gezinmek yerine alt-menü açan gruplardır; onların hedef sayfaları href doğruluğu ve
 * doğrudan URL erişimi testlerinde (dashboard.authed) kapsanır. Bu test, tıklamayla
 * DOĞRUDAN gezinen "leaf" öğelere odaklanır.
 */
const LEAF_PAGES = [
  { name: 'Inbox', path: '/inbox' },
  { name: 'Tickets', path: '/tickets' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Settings', path: '/settings' },
];

test.describe('Vomenta - Kenar menüsü tıklama gezinmesi', () => {
  for (const item of LEAF_PAGES) {
    test(`"${item.name}" linkine tıklayınca ${item.path} sayfasına gidiyor`, async ({ app, page }) => {
      await gotoApp(page, '/');
      await app.shell.link(item.name).click();
      await page.waitForURL((url) => url.pathname.startsWith(item.path), { timeout: 15000 });
      // Oturum korunuyor — login sayfasına atılmadık.
      await expect(app.shell.loginHeading).toBeHidden();
    });
  }
});
