// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * İŞ GÜCÜ — VERİ-DEĞİŞTİREN AKIŞLAR (opt-in, çift kilitli)
 *
 * ÇALIŞTIRMA — yalnızca açıkça:
 *   - Staging:  npm run test:mutation
 *   - Canlı:    npm run test:mutation:prod   (ALLOW_PROD_MUTATIONS=true — bilinçli)
 * Normal koşular (test:auth/regression/e2e) ve CI bu testleri ÇALIŞTIRMAZ (Kilit 1: grepInvert @mutation).
 * Prod'a yazmak ayrıca Kilit 2 (assertMutationsAllowed → ALLOW_PROD_MUTATIONS) ister.
 * Gerekçe: docs/adr/ADR-0001-opt-in-mutations.md
 *
 * DAVRANIŞ (28 Tem canlı keşif): vardiya "Add Shift" ile Draft olarak oluşur; hücreye
 * tıklayınca "Edit Shift" → Delete ile silinir. "Publish Schedule" Draft etiketini kaldırır
 * (yayınlar). UI'da unpublish yok; temizlik vardiyayı silerek yapılır.
 *
 * ⚠ Publish canlı tenant'ta gerçek etki yapar (ajanlara bildirim gidebilir, geri alınamayabilir).
 */

/** Çizelgedeki (dolu) ilk vardiya hücresi — saat içerir. */
function shiftCell(page) {
  return page.locator('main table td').filter({ hasText: /\d{1,2}:\d{2}/ }).first();
}

/** Dolu hücreyi Edit Shift'ten siler (cleanup için idempotent). */
async function deleteShiftIfPresent(page) {
  const cell = shiftCell(page);
  if ((await cell.count()) === 0 || !(await cell.isVisible().catch(() => false))) return;
  await cell.click().catch(() => {});
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    await dialog.getByRole('button', { name: /^Delete$/i }).click().catch(() => {});
  }
  await page.keyboard.press('Escape').catch(() => {});
}

async function openWorkforce(page) {
  await gotoApp(page, '/workforce');
  await expect(page.getByRole('heading', { name: 'Workforce Management', exact: true })).toBeVisible({
    timeout: 30000,
  });
}

async function addDraftShift(page) {
  await page.locator('main table td .border-dashed').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Add Shift', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: /^Save$/i }).click();
}

test.describe('Vomenta - Workforce mutasyonları @regression @mutation', () => {
  // Testler AYNI canlı çizelgeyi (ajan/hafta) paylaşır → paralelde birbirine karışır.
  // Seri çalış: her test kendi vardiyasını oluşturur, doğrular ve temizler.
  test.describe.configure({ mode: 'serial' });

  test('vardiya oluşturulunca çizelgede "Draft" olarak görünüyor', async ({ page, mutationGuard, cleanup }) => {
    mutationGuard('İş Gücü: vardiya oluşturma');
    await openWorkforce(page);
    cleanup(() => deleteShiftIfPresent(page));

    await addDraftShift(page);

    const cell = shiftCell(page);
    await expect(cell).toBeVisible();
    await expect(cell).toContainText('09:00');
    await expect(cell).toContainText(/Draft/i);
  });

  test('çizelge yayınlanınca vardiyanın "Draft" etiketi kalkıyor (published)', async ({
    page,
    mutationGuard,
    cleanup,
  }) => {
    mutationGuard('İş Gücü: çizelge yayınlama (Publish Schedule)');
    await openWorkforce(page);
    cleanup(() => deleteShiftIfPresent(page));

    // Yayınlanacak bir Draft vardiya oluştur.
    await addDraftShift(page);
    const cell = shiftCell(page);
    await expect(cell).toContainText(/Draft/i);

    // Yayınla — Draft etiketi kalkmalı, vardiya kalmalı.
    await page.getByRole('button', { name: /Publish Schedule/i }).click();
    await expect(cell).not.toContainText(/Draft/i, { timeout: 15000 });
    await expect(cell).toContainText('09:00');
  });
});
