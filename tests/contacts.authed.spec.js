// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Contacts sayfası veri/tablo etkileşim testleri (girişli, salt-okunur).
 * Veri değiştiren işlemler (Add Contact / Import) TEST EDİLMEZ.
 */

async function openContacts(page) {
  await page.goto('/contacts', { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await expect(page.getByRole('table')).toBeVisible({ timeout: 30000 });
  // İlk veri satırının ad hücresi dolana kadar bekle (skeleton/loading değil).
  await expect(
    page.getByRole('row').nth(1).getByRole('cell').nth(1)
  ).toHaveText(/\S/, { timeout: 30000 });
}

const COLUMNS = ['Name', 'Email', 'Phone', 'Company', 'Tags', 'Owner', 'Last Contact'];

test.describe('Vomenta - Contacts (tablo & arama)', () => {
  test('tablo beklenen kolonları gösteriyor', async ({ page }) => {
    await openContacts(page);
    for (const col of COLUMNS) {
      await expect(
        page.getByRole('columnheader', { name: col, exact: true })
      ).toBeVisible();
    }
  });

  test('en az bir kişi listeleniyor', async ({ page }) => {
    await openContacts(page);
    // Satır sayısı = başlık + en az 1 veri satırı
    expect(await page.getByRole('row').count()).toBeGreaterThan(1);
  });

  test('arama: eşleşmeyen sorgu boş-durum ("No contacts found") gösteriyor', async ({ page }) => {
    await openContacts(page);
    const search = page.getByPlaceholder(/Search by name/);
    await expect(search).toBeVisible();

    await search.fill('zzz_no_match_xyz');
    await expect(page.getByText('No contacts found')).toBeVisible({ timeout: 15000 });
    // (Aramanın tersine çalışması "ada göre filtreliyor" testinde pozitif olarak doğrulanır.)
  });

  test('arama: mevcut bir kişiyi ada göre filtreliyor', async ({ page }) => {
    await openContacts(page);
    const rows = page.getByRole('row');
    await expect(rows.nth(1)).toBeVisible();

    // İlk kişinin ad hücresinden en uzun kelimeyi arama terimi olarak al (veriden bağımsız).
    const nameText = (await rows.nth(1).getByRole('cell').nth(1).innerText())
      .replace(/\s+/g, ' ')
      .trim();
    const token = nameText.split(' ').sort((a, b) => b.length - a.length)[0];
    expect(token, 'ad hücresinden bir arama terimi çıkarılabilmeli').toBeTruthy();

    const search = page.getByPlaceholder(/Search by name/);
    await search.fill(token);

    await expect(page.getByText('No contacts found')).toBeHidden();
    await expect(page.getByRole('table').getByText(token, { exact: false }).first()).toBeVisible();
  });
});
