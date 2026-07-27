// @ts-check
import { expect } from '@playwright/test';
import { gotoApp } from '../helpers';

/**
 * Contacts sayfası nesnesi (Page Object).
 * Selector'lar ve etkileşimler tek yerde toplanır.
 */
export class ContactsPage {
  static COLUMNS = ['Name', 'Email', 'Phone', 'Company', 'Tags', 'Owner', 'Last Contact'];

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.table = page.getByRole('table');
    this.rows = page.getByRole('row');
    this.search = page.getByPlaceholder(/Search by name/);
    this.emptyState = page.getByText('No contacts found');
  }

  async open() {
    await gotoApp(this.page, '/contacts');
    await expect(this.table).toBeVisible({ timeout: 30000 });
    // İlk veri satırının ad hücresi dolana kadar bekle (skeleton değil).
    await expect(this.rows.nth(1).getByRole('cell').nth(1)).toHaveText(/\S/, { timeout: 30000 });
  }

  column(name) {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  /** İlk kişinin ad hücresindeki en uzun kelimeyi arama terimi olarak döndürür. */
  async firstNameToken() {
    const text = (await this.rows.nth(1).getByRole('cell').nth(1).innerText())
      .replace(/\s+/g, ' ')
      .trim();
    return text.split(' ').sort((a, b) => b.length - a.length)[0];
  }

  async searchFor(term) {
    await this.search.fill(term);
  }
}
