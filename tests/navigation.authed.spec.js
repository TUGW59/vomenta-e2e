// @ts-check
import { test } from './fixtures/test.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';

/**
 * Kenar menüsü TIKLAMA gezinmesinin fonksiyonel testi — linke tıklayınca gerçekten
 * doğru sayfaya gidiyor mu. (href doğruluğu + doğrudan URL erişimi dashboard.authed'de test edilir.)
 *
 * Not: Bazı menü öğeleri (Voice, Channels, AI, Campaigns, Contacts, Reports...) tıklanınca
 * gezinmek yerine alt-menü açan gruplardır; onların hedef sayfaları href doğruluğu ve
 * doğrudan URL erişimi testlerinde (dashboard.authed) kapsanır. Bu test, tıklamayla
 * DOĞRUDAN gezinen "leaf" öğelere odaklanır.
 *
 * L3: yalnızca URL değil, hedef sayfanın başlığı da görünür olmalı (assertDestinationLoaded).
 */
const LEAF_PAGES = [
  { name: 'Inbox', path: '/inbox', heading: 'Inbox' },
  { name: 'Tickets', path: '/tickets', heading: 'Tickets' },
  { name: 'Analytics', path: '/analytics', heading: 'Analytics' },
  { name: 'Settings', path: '/settings', heading: 'Settings' },
];

test.describe('Vomenta - Kenar menüsü tıklama gezinmesi', () => {
  for (const item of LEAF_PAGES) {
    test(`"${item.name}" linkine tıklayınca ${item.path} ("${item.heading}") sayfasına gidiyor`, async ({ app, page }) => {
      await gotoApp(page, '/');
      await app.shell.link(item.name).click();
      await assertDestinationLoaded(page, { path: item.path, heading: item.heading });
    });
  }
});
