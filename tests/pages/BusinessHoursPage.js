// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Çalışma Saatleri (`/settings/hours`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Tek formlu config sayfası: Schedule Timezone (combobox) · Weekly Schedule (7 gün: Open switch +
 * Start/End) · Holiday Calendar (Date/name + Add) · After Hours Mode (switch) · Save changes.
 * Sekme YOK. Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Save changes / switch / Add production'da TIKLANMAZ. Geri-döndürülebilir gün-switch
 * düzenlemesi yalnız staging'de: tests/settings-hours-mutations.authed.spec.js.
 */
export class BusinessHoursPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Business Hours',
      subtitle: 'Configure working hours and holidays',
      save: 'Save changes', add: 'Add',
      weekly: 'Weekly Schedule', holidays: 'Holiday Calendar', afterHours: 'After Hours Mode',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Çalışma Saatleri',
      subtitle: 'Çalışma saatlerini ve tatilleri yapılandırın',
      save: 'Değişiklikleri kaydet', add: 'Ekle',
      weekly: null, holidays: null, afterHours: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Heures de travail',
      subtitle: 'Configurez les heures de travail et les jours fériés',
      save: 'Enregistrer les modifications', add: 'Ajouter',
      weekly: null, holidays: null, afterHours: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'ساعات العمل',
      subtitle: 'تهيئة ساعات العمل والإجازات',
      save: 'حفظ التغييرات', add: 'إضافة',
      weekly: null, holidays: null, afterHours: null,
    },
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/hours');
    this.heading = page.getByRole('heading', { level: 1 });
    this.saveButton = page.getByRole('button', { name: BusinessHoursPage.I18N.en.save, exact: true });
    this.addHolidayButton = page.getByRole('button', { name: BusinessHoursPage.I18N.en.add, exact: true });
    this.daySwitches = page.getByRole('switch');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(BusinessHoursPage.I18N.en.heading, { timeout: 30000 });
  }
}
