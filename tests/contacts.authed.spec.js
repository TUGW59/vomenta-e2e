// @ts-check
import { test, expect } from '@playwright/test';
import { ContactsPage } from './pages/ContactsPage';

/**
 * Contacts sayfası veri/tablo etkileşim testleri (girişli, salt-okunur).
 * Veri değiştiren işlemler (Add Contact / Import) TEST EDİLMEZ.
 */
test.describe('Vomenta - Contacts (tablo & arama)', () => {
  test('tablo beklenen kolonları gösteriyor', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    for (const col of ContactsPage.COLUMNS) {
      await expect(contacts.column(col)).toBeVisible();
    }
  });

  test('en az bir kişi listeleniyor', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    expect(await contacts.rows.count()).toBeGreaterThan(1);
  });

  test('arama: eşleşmeyen sorgu "No contacts found" gösteriyor', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();
    await contacts.searchFor('zzz_no_match_xyz');
    await expect(contacts.emptyState).toBeVisible({ timeout: 15000 });
  });

  test('arama: mevcut bir kişiyi ada göre filtreliyor', async ({ page }) => {
    const contacts = new ContactsPage(page);
    await contacts.open();

    const token = await contacts.firstNameToken();
    expect(token, 'ad hücresinden bir arama terimi çıkarılabilmeli').toBeTruthy();

    await contacts.searchFor(token);
    await expect(contacts.emptyState).toBeHidden();
    await expect(contacts.table.getByText(token, { exact: false }).first()).toBeVisible();
  });
});
