// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Sonuç Kodları (`/settings/disposition-codes`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Tablo (Code/Label/Category/Description/Actions) + "Add Code" dialog (Add Disposition Code).
 * Satır aksiyonları aria-label'sız ikonlar (edit/delete). Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Add Code / Create / satır sil production'da GÖNDERİLMEZ.
 */
export class DispositionCodesPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Disposition Codes',
      subtitle: 'Manage outcome codes that agents use to categorize call and interaction results.',
      add: 'Add Code', dialogTitle: 'Add Disposition Code',
      columns: ['Code', 'Label', 'Category', 'Description', 'Actions'],
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Sonuç Kodları',
      subtitle: 'Temsilcilerin çağrı ve etkileşim sonuçlarını kategorize etmek için kullandıkları sonuç kodlarını yönetin.',
      add: 'Kod Ekle', dialogTitle: null,
      columns: ['Kod', 'Etiket', 'Kategori', 'Açıklama', 'İşlemler'],
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Codes de disposition',
      subtitle: 'Gérez les codes de résultat utilisés par les agents pour catégoriser les résultats des appels et interactions.',
      add: 'Ajouter un code', dialogTitle: null,
      columns: ['Code', 'Libellé', 'Catégorie', 'Description', 'Actions'],
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'رموز التصنيف',
      subtitle: 'إدارة رموز النتائج التي يستخدمها الوكلاء لتصنيف نتائج المكالمات والتفاعلات.',
      add: 'إضافة رمز', dialogTitle: null,
      columns: ['الرمز', 'التسمية', 'الفئة', 'الوصف', 'الإجراءات'],
    },
  };

  static API = { codes: '/api/v1/disposition-codes' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/disposition-codes');
    this.heading = page.getByRole('heading', { level: 1 });
    this.addButton = page.getByRole('button', { name: DispositionCodesPage.I18N.en.add, exact: true });
    this.table = page.locator('main table').first();
    this.rows = this.table.locator('tbody tr');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(DispositionCodesPage.I18N.en.heading, { timeout: 30000 });
  }

  async openAddDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.addButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
