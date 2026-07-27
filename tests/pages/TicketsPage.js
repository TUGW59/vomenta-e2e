// @ts-check
import { expect } from '@playwright/test';
import { gotoApp } from '../helpers';

/**
 * Tickets sayfası nesnesi (Page Object).
 */
export class TicketsPage {
  static COLUMNS = ['Ticket #', 'Subject', 'Customer', 'Priority', 'Status', 'Assigned To', 'Created'];
  static TABS = ['All', 'My Tickets', 'Unassigned', 'Urgent'];

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.table = page.getByRole('table');
    this.rows = page.getByRole('row');
    this.search = page.getByPlaceholder(/Search tickets/);
    this.emptyState = page.getByText('No tickets found');
    this.createButton = page.getByRole('button', { name: 'Create Ticket', exact: true });
  }

  async open() {
    await gotoApp(this.page, '/tickets');
    await expect(this.table).toBeVisible({ timeout: 30000 });
    // İlk veri satırının numara hücresi dolana kadar bekle.
    await expect(this.rows.nth(1).getByRole('cell').first()).toHaveText(/\S/, { timeout: 30000 });
  }

  column(name) {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /** İlk ticket'ın numarasını (ör. "T-0003") döndürür. */
  async firstTicketId() {
    return (await this.rows.nth(1).getByRole('cell').first().innerText()).trim();
  }

  async searchFor(term) {
    await this.search.fill(term);
  }

  /** Create Ticket formunu (dialog) açar ve döndürür. */
  async openCreateForm() {
    await this.createButton.click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    return dialog;
  }
}
