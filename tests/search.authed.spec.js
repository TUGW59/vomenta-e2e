// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Giriş sonrası arama (komut paleti) testleri.
 * Kayıtlı oturumu (playwright/.auth/user.json) kullanır.
 */
test.describe('Vomenta - Arama (komut paleti)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Search butonu komut paletini açıyor', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder(/Search pages/)).toBeVisible();
  });

  test('komut paleti klavye kısayolu (⌘K / Ctrl+K) ile açılıyor', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+KeyK');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByPlaceholder(/Search pages/)).toBeVisible();
  });

  test('arama kutusuna yazılabiliyor ve Escape ile kapanıyor', async ({ page }) => {
    await page.getByRole('button', { name: /Search/ }).first().click();
    const input = page.getByPlaceholder(/Search pages/);
    await expect(input).toBeVisible();

    await input.fill('reports');
    await expect(input).toHaveValue('reports');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
