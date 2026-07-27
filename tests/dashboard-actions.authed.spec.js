// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * Dashboard hızlı eylem butonlarının FONKSİYONEL testi — tıklayınca doğru sayfaya
 * götürüyor mu. Bunlar birer link; yalnızca GEZİNME yaparlar (veri göndermez).
 * Hedef sayfada bir gönderim/kaydetme YAPILMAZ.
 */
const QUICK_ACTIONS = [
  { name: 'Send SMS', path: '/channels/sms' },
  { name: 'Create Campaign', path: '/campaigns/outbound' },
  { name: 'View Reports', path: '/reports' },
];

test.describe('Vomenta - Dashboard hızlı eylemleri (gezinme)', () => {
  for (const action of QUICK_ACTIONS) {
    test(`"${action.name}" ${action.path} sayfasına götürüyor`, async ({ app, page }) => {
      await gotoApp(page, '/');
      await page.getByRole('link', { name: action.name, exact: true }).click();
      await page.waitForURL((url) => url.pathname.startsWith(action.path), { timeout: 15000 });
      await expect(app.shell.loginHeading).toBeHidden();
    });
  }
});
