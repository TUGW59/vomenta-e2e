// @ts-check
import { test, expect } from './fixtures/test.js';
import { ContactsPage } from './pages/ContactsPage.js';

/**
 * Contacts sayfası veri/tablo etkileşim testleri (girişli, salt-okunur).
 * Veri değiştiren işlemler (Add Contact / Import) TEST EDİLMEZ.
 */
test.describe('Vomenta - Contacts (tablo & arama)', () => {
  test('tablo beklenen kolonları gösteriyor @critical', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();
    for (const col of ContactsPage.COLUMNS) {
      await expect(contacts.column(col)).toBeVisible();
    }
  });

  test('en az bir kişi listeleniyor @smoke', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();
    expect(await contacts.rows.count()).toBeGreaterThan(1);
  });

  test('arama: eşleşmeyen sorgu "No contacts found" gösteriyor', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();
    await contacts.searchFor('zzz_no_match_xyz');
    await expect(contacts.emptyState).toBeVisible({ timeout: 15000 });
  });

  test('arama: mevcut bir kişiyi ada göre filtreliyor @critical', async ({ app }) => {
    const { contacts } = app;
    await contacts.open();

    const token = await contacts.firstNameToken();
    expect(token, 'ad hücresinden bir arama terimi çıkarılabilmeli').toBeTruthy();

    await contacts.searchFor(token);
    await expect(contacts.emptyState).toBeHidden();
    await expect(contacts.table.getByText(token, { exact: false }).first()).toBeVisible();
  });
});
