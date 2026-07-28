// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp, severeA11yViolations, waitForUiToSettle } from './helpers.js';

/**
 * Erişilebilirlik (a11y) regresyon testleri — girişli ana sayfalar.
 * axe-core ile WCAG 2 A/AA taraması yapılır. Bilinen a11y borcu (color-contrast,
 * button-name) hariç tutulur; amaç YENİ ciddi/kritik ihlalleri yakalamaktır.
 */
// Bilinen borç (color-contrast, button-name) DIŞINDA ciddi/kritik ihlali OLMAYAN
// sayfalar (canlı axe gözlemi, 28 Tem 2026). Test edilen bölümler buraya eklenir.
const PAGES = [
  { name: 'Dashboard', path: '/' },
  { name: 'Contacts', path: '/contacts' },
  { name: 'Tickets', path: '/tickets' },
  { name: 'Settings', path: '/settings' },
  { name: 'Reports', path: '/reports' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Workforce', path: '/workforce' },
  { name: 'Supervisor Agents', path: '/supervisor/agents' },
  { name: 'Voice', path: '/voice' },
  { name: 'Reports · Call', path: '/reports/call' },
  { name: 'Reports · Dashboards', path: '/reports/dashboards' },
];

// GÖZLEM (28 Tem 2026 axe): /supervisor/wallboard `label`, /inbox ve
// /campaigns/outbound `aria-valid-attr-value` ile 1'er ciddi ihlal veriyor. Ancak
// bu ihlaller ihlalli eleman geç render olduğu için yükleme zamanlamasına duyarlı
// (waitForUiToSettle ile bazen 0 görünüyor) → kararsız `test.fail` üretiyor. Sabit
// bir tekrar-üretim (deterministik bekleme) kurulana kadar bu sayfalar guard'a
// EKLENMEDİ; bilinen a11y bulguları olarak izlemede. Bkz. docs/accessibility-findings.md.

test.describe('Vomenta - Erişilebilirlik (a11y)', () => {
  for (const p of PAGES) {
    test(`${p.name}: bilinen borç dışında ciddi/kritik a11y ihlali yok`, async ({ page }) => {
      await gotoApp(page, p.path);
      await waitForUiToSettle(page);

      const severe = await severeA11yViolations(page);
      // Hata olursa hangi kuralların eklendiğini gösterir.
      expect(severe.map((v) => `${v.id} (${v.impact})`)).toEqual([]);
    });
  }
});
