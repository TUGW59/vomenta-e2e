// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Tickets sayfası nesnesi (Page Object).
 */
export class TicketsPage extends BasePage {
  static COLUMNS = ['Ticket #', 'Subject', 'Customer', 'Priority', 'Status', 'Assigned To', 'Created'];
  static TABS = ['All', 'My Tickets', 'Unassigned', 'Urgent'];

  /**
   * Dört dilde CANLI gözlenmiş çeviriler (10 Ağu 2026, app.vomenta.com, salt-okunur).
   * NOT: `fr` başlığı çevrilmiyor — "Tickets" (EN) kalıyor (gözlenen gerçek; sekme/kolon
   * çevriliyor). `heading` alanları GERÇEK render'ı yansıtır.
   */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Tickets',
      tabs: ['All', 'My Tickets', 'Unassigned', 'Urgent'],
      columns: ['Ticket #', 'Subject', 'Customer', 'Priority', 'Status', 'Assigned To', 'Created'] },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Destek Talepleri',
      tabs: ['Tümü', 'Taleplerim', 'Atanmamış', 'Acil'],
      columns: ['Talep #', 'Konu', 'Müşteri', 'Öncelik', 'Durum', 'Atanan', 'Oluşturulma'] },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Tickets',
      tabs: ['Tous', 'Mes tickets', 'Non assignés', 'Urgent'],
      columns: ['Ticket n°', 'Sujet', 'Client', 'Priorité', 'Statut', 'Assigné à', 'Créé'] },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'التذاكر',
      tabs: ['الكل', 'تذاكري', 'غير مُعيَّنة', 'عاجلة'],
      columns: ['رقم التذكرة', 'الموضوع', 'العميل', 'الأولوية', 'الحالة', 'المُعيَّن إليه', 'تاريخ الإنشاء'] },
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/tickets');
    this.heading = page.getByRole('heading', { level: 1 });
    this.table = page.getByRole('table');
    this.rows = page.getByRole('row');
    this.search = page.getByPlaceholder(/Search tickets/);
    this.emptyState = page.getByText('No tickets found');
    this.createButton = page.getByRole('button', { name: 'Create Ticket', exact: true });
  }

  /** Tablo GÖVDE satırları = hücre içeren satırlar (kolon-başlığı satırı hariç). SALT-OKUNUR. */
  get dataRows() {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /** @ix-tabs — hidrasyon yarışına karşı retry'lı sekme seçimi (aria-selected'e kadar). */
  async selectTab(name) {
    await expect(async () => {
      await this.tab(name).click();
      await expect(this.tab(name)).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  async open() {
    await super.open();
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
