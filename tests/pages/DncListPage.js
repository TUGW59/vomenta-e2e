// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Kampanyalar → DNC Listeleri (`/campaigns/dnc`) sayfa nesnesi.
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/dnc/NOTLAR.md (PII-maskeli artefaktlar).
 * Canlı gözlem: 29 Tem 2026. Sayfa taze bağlamda İngilizce açılır; dil değiştirici
 * AppShell'dedir ve seçim sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar).
 */
export class DncListPage extends BasePage {
  /** Dört dilde canlı gözlemlenen çeviriler (29 Tem 2026). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr',
      heading: 'Do Not Call List',
      subtitle: 'Manage numbers excluded from outbound campaigns for compliance.',
      exportButton: 'Export',
      bulkImport: 'Bulk Import',
      addNumber: 'Add Number',
      cards: ['Total DNC Numbers', 'Showing', 'Page'],
      searchPlaceholder: 'Search by phone number...',
      headers: ['Phone Number', 'Reason', 'Added By', 'Date Added', 'Actions'],
      addDialogTitle: 'Add Number to DNC',
      bulkDialogTitle: 'Bulk Import DNC Numbers',
      emptyState: 'No DNC entries found',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr',
      heading: 'Aranmayacak Listesi',
      subtitle: 'Uyumluluk için giden kampanyalardan hariç tutulan numaraları yönetin.',
      exportButton: 'Dışa Aktar',
      bulkImport: 'Toplu İçe Aktarma',
      addNumber: 'Numara Ekle',
      cards: ['Toplam DNC Numarası', 'Gösterilen', 'Sayfa'],
      searchPlaceholder: null,
      headers: ['Telefon Numarası', 'Sebep', 'Ekleyen', 'Eklenme Tarihi', 'İşlemler'],
      addDialogTitle: "DNC'ye Numara Ekle",
      bulkDialogTitle: null,
      emptyState: 'DNC kaydı bulunamadı',
    },
    fr: {
      endonym: 'Français', dir: 'ltr',
      heading: 'Liste de numéros exclus',
      subtitle: 'Gérer les numéros exclus des campagnes sortantes pour la conformité.',
      exportButton: 'Exporter',
      bulkImport: 'Import en masse',
      addNumber: 'Ajouter un numéro',
      cards: ['Total numéros DNC', 'Affichés', 'Page'],
      searchPlaceholder: null,
      headers: ['Numéro de téléphone', 'Raison', 'Ajouté par', "Date d'ajout", 'Actions'],
      addDialogTitle: 'Ajouter un numéro au DNC',
      bulkDialogTitle: null,
      emptyState: 'Aucune entrée DNC trouvée',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl',
      heading: 'قائمة عدم الاتصال',
      subtitle: 'إدارة الأرقام المستبعدة من الحملات الصادرة للامتثال.',
      exportButton: 'تصدير',
      bulkImport: 'استيراد جماعي',
      addNumber: 'إضافة رقم',
      cards: ['إجمالي أرقام DNC', 'يُعرض', 'الصفحة'],
      searchPlaceholder: null,
      headers: ['رقم الهاتف', 'السبب', 'أضيف بواسطة', 'تاريخ الإضافة', 'إجراءات'],
      addDialogTitle: 'إضافة رقم إلى DNC',
      bulkDialogTitle: null,
      emptyState: 'لم يتم العثور على سجلات DNC',
    },
  };

  /** Add Number dialogu Reason (sebep) seçenekleri. */
  static REASON_OPTIONS = [
    'Customer Request', 'Legal Requirement', 'Internal Policy',
    'Regulatory Compliance', 'Duplicate / Invalid',
  ];

  /** Kontrollerin vurduğu backend uçları (Network ile doğrulandı). */
  static API = {
    list: '/api/v1/dnc',
    export: '/api/v1/dnc/export',
    create: '/api/v1/dnc', // POST (mutation)
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/campaigns/dnc');
    const I = DncListPage.I18N.en;
    this.heading = page.getByRole('heading', { level: 1 });
    this.exportButton = page.getByRole('button', { name: I.exportButton, exact: true });
    this.bulkImportButton = page.getByRole('button', { name: I.bulkImport, exact: true });
    this.addNumberButton = page.getByRole('button', { name: I.addNumber, exact: true });
    this.searchInput = page.getByPlaceholder(I.searchPlaceholder);
    this.table = page.locator('table');
    this.rows = page.locator('tbody tr');
    this.emptyState = page.getByText(I.emptyState, { exact: true });
    this.dialog = page.getByRole('dialog').first();
  }

  /** İngilizce açılır; başlık + liste (satır ya da boş-durum) yerleşene kadar bekler. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(DncListPage.I18N.en.heading, { timeout: 30000 });
    await expect(async () => {
      const rows = await this.rows.count();
      // Boş-durum de tbody tr içinde tek satır olarak render olur → metniyle ayır.
      if (rows > 0 && !(await this.emptyState.isVisible().catch(() => false))) {
        await expect(this.rows.first().locator('td').first()).toHaveText(/\S/, { timeout: 5000 });
      } else {
        await expect(this.emptyState).toBeVisible({ timeout: 5000 });
      }
    }).toPass({ timeout: 30000 });
  }

  buttonFor(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** KPI kartının değer paragrafını (etiketin kardeşi) döndürür. */
  card(label) {
    return this.page.locator('div').filter({
      has: this.page.getByText(label, { exact: true }),
    }).filter({ hasText: label }).last();
  }

  async openAddDialog(name = DncListPage.I18N.en.addNumber) {
    await this.buttonFor(name).click();
    await expect(this.dialog).toBeVisible({ timeout: 10000 });
    return this.dialog;
  }

  async openBulkImportDialog(name = DncListPage.I18N.en.bulkImport) {
    await this.buttonFor(name).click();
    await expect(this.dialog).toBeVisible({ timeout: 10000 });
    return this.dialog;
  }

  // Add Number dialog alanları.
  get phoneInput() {
    return this.dialog.locator('input').first();
  }
  get reasonSelect() {
    return this.dialog.getByRole('combobox').first();
  }
  get addSubmit() {
    return this.dialog.getByRole('button', { name: 'Add to DNC', exact: true });
  }
  get dialogCancel() {
    return this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  async selectReason(option) {
    await this.reasonSelect.click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    await expect(this.reasonSelect).toHaveText(option);
  }
}
