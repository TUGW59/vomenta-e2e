// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Denetim Günlüğü (`/settings/audit`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * SALT-OKUMA log: arama + filtreler (Action/User combobox) + tarih aralığı + tablo
 * (Timestamp/User/Action/Entity/Entity ID/Changes/IP + View) + Export (CSV indirir) + Full Export.
 * Satır "View" → "Change details" dialog. Yazma YOK (mutation yok). Taze bağlamda İngilizce.
 *
 * GÜVENLİK: Export dosya indirir (salt-okuma; veri değiştirmez) — test edilir.
 */
export class AuditLogPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Audit Log',
      subtitle: 'Track all actions and changes in your workspace',
      export: 'Export', view: 'View', viewDialog: 'Change details',
      columns: ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Changes', 'IP Address'],
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Denetim Günlüğü',
      subtitle: 'Çalışma alanınızdaki tüm eylemleri ve değişiklikleri izleyin',
      export: 'Dışa aktar', view: 'Görüntüle', viewDialog: null,
      columns: ['Zaman damgası', 'Kullanıcı', 'Eylem', 'Varlık', 'Varlık ID', 'Değişiklikler', 'IP adresi'],
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: "Journal d'audit",
      subtitle: 'Suivez toutes les actions et modifications de votre espace',
      export: 'Exporter', view: 'Voir', viewDialog: null,
      columns: ['Horodatage', 'Utilisateur', 'Action', 'Entité', 'ID entité', 'Modifications', 'Adresse IP'],
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'سجل التدقيق',
      subtitle: 'تتبع جميع الإجراءات والتغييرات في مساحة العمل',
      export: 'تصدير', view: null, viewDialog: null,
      columns: ['الطابع الزمني', 'المستخدم', 'الإجراء', 'الكيان', 'معرّف الكيان', 'التغييرات', 'عنوان IP'],
    },
  };

  static API = { logs: '/api/v1/compliance/audit-logs' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/audit');
    this.heading = page.getByRole('heading', { level: 1 });
    this.exportButton = page.getByRole('button', { name: AuditLogPage.I18N.en.export, exact: true });
    this.table = page.locator('main table').first();
    this.rows = this.table.locator('tbody tr');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AuditLogPage.I18N.en.heading, { timeout: 30000 });
  }

  /** İlk satırın "View" butonuyla "Change details" dialogunu açar. */
  async openViewDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.page.getByRole('button', { name: AuditLogPage.I18N.en.view, exact: true }).first().click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
