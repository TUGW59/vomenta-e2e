// @ts-check
import { test } from './fixtures/test.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';

/**
 * Dashboard hızlı eylem butonlarının FONKSİYONEL testi — tıklayınca doğru sayfaya
 * götürüyor mu. Bunlar birer link; yalnızca GEZİNME yaparlar (veri göndermez).
 * Hedef sayfada bir gönderim/kaydetme YAPILMAZ.
 *
 * L3: yalnızca URL değil, hedef sayfanın başlığı da görünür olmalı.
 */
const QUICK_ACTIONS = [
  { name: 'Send SMS', path: '/channels/sms', heading: 'SMS Configuration' },
  { name: 'Create Campaign', path: '/campaigns/outbound', heading: 'Outbound Campaigns' },
  { name: 'View Reports', path: '/reports', heading: 'Reports' },
];

test.describe('Vomenta - Dashboard hızlı eylemleri (gezinme)', () => {
  for (const action of QUICK_ACTIONS) {
    test(`"${action.name}" ${action.path} ("${action.heading}") sayfasına götürüyor`, async ({ page }) => {
      await gotoApp(page, '/');
      await page.getByRole('link', { name: action.name, exact: true }).click();
      await assertDestinationLoaded(page, { path: action.path, heading: action.heading });
    });
  }
});
