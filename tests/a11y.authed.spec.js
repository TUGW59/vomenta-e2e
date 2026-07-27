// @ts-check
import { test, expect } from '@playwright/test';
import { gotoApp, severeA11yViolations } from './helpers';

/**
 * Erişilebilirlik (a11y) regresyon testleri — girişli ana sayfalar.
 * axe-core ile WCAG 2 A/AA taraması yapılır. Bilinen a11y borcu (color-contrast,
 * button-name) hariç tutulur; amaç YENİ ciddi/kritik ihlalleri yakalamaktır.
 */
const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Contacts', path: '/contacts' },
  { name: 'Tickets', path: '/tickets' },
  { name: 'Settings', path: '/settings' },
  { name: 'Reports', path: '/reports' },
];

test.describe('Vomenta - Erişilebilirlik (a11y)', () => {
  for (const p of PAGES) {
    test(`${p.name}: bilinen borç dışında ciddi/kritik a11y ihlali yok`, async ({ page }) => {
      await gotoApp(page, p.path);
      // İçeriğin render olması için kısa bekleme.
      await page.waitForTimeout(2500);

      const severe = await severeA11yViolations(page);
      // Hata olursa hangi kuralların eklendiğini gösterir.
      expect(severe.map((v) => `${v.id} (${v.impact})`)).toEqual([]);
    });
  }
});
