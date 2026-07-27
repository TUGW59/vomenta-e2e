// @ts-check
import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Inbox sayfası testleri (girişli, salt-okunur).
 */

async function openInbox(page) {
  await gotoApp(page, '/inbox');
  await expect(
    page.getByRole('heading', { name: 'Inbox', exact: true })
  ).toBeVisible({ timeout: 30000 });
}

test.describe('Vomenta - Inbox', () => {
  test('Inbox ve Soft Phone panelleri görünüyor', async ({ page }) => {
    await openInbox(page);
    await expect(page.getByRole('heading', { name: 'Soft Phone', exact: true })).toBeVisible();
  });

  test('konuşma arama kutusu görünüyor ve yazılabiliyor', async ({ page }) => {
    await openInbox(page);
    const search = page.getByPlaceholder('Search conversations...');
    await expect(search).toBeVisible();
    await search.fill('Arda');
    await expect(search).toHaveValue('Arda');
  });

  test('eşleşmeyen aramada boş-durum mesajı gösteriliyor', async ({ page }) => {
    await openInbox(page);
    const search = page.getByPlaceholder('Search conversations...');
    await expect(search).toBeVisible();
    await search.fill('zzz_no_match_xyz');
    await expect(page.getByText(/No conversations/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('kanal / atama filtre çipleri görünüyor', async ({ page }) => {
    await openInbox(page);
    for (const name of ['Mine', 'Chat', 'Email']) {
      await expect(page.getByRole('button', { name, exact: true }).first()).toBeVisible();
    }
  });

  test('sağ panel sekmeleri görünüyor ve tıklanınca seçili oluyor', async ({ page }) => {
    await openInbox(page);
    const TABS = ['Customer', 'AI Assist', 'History'];
    for (const name of TABS) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
    for (const name of TABS) {
      const tab = page.getByRole('tab', { name, exact: true });
      await expect(async () => {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
      }).toPass({ timeout: 15000 });
    }
  });
});
