// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Şablonlar (`/settings/templates`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * İç içe sekmeler: ÜST tablist (Message templates / Canned Responses) + İÇ kanal tablist
 * (Canned Responses/Email/SMS/WhatsApp) + New Template dialog + tablo (boş-durum). Taze bağlamda EN.
 *
 * GÜVENLİK: New Template / Create production'da GÖNDERİLMEZ. Dialog yalnızca AÇILIR + disabled.
 */
export class TemplatesPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Templates', subtitle: 'Manage message templates',
      newTemplate: 'New Template', topTabs: ['Message templates', 'Canned Responses'],
      dialogTitle: 'New Template', columns: ['Name', 'Preview', 'Language', 'Variables'],
      empty: 'No templates in this category',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Şablonlar', subtitle: 'Mesaj şablonlarını yönetin',
      newTemplate: 'Yeni Şablon', topTabs: ['Mesaj şablonları', 'Hazır yanıtlar'],
      dialogTitle: null, columns: ['Ad', 'Önizleme', 'Dil', 'Değişkenler'], empty: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Modèles', subtitle: 'Gérez les modèles de messages',
      newTemplate: 'Nouveau modèle', topTabs: ['Modèles de messages', 'Réponses prédéfinies'],
      dialogTitle: null, columns: ['Nom', 'Aperçu', 'Langue', 'Variables'], empty: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'القوالب', subtitle: 'إدارة قوالب الرسائل',
      newTemplate: 'قالب جديد', topTabs: ['قوالب الرسائل', 'ردود جاهزة'],
      dialogTitle: null, columns: ['الاسم', 'معاينة', 'اللغة', 'المتغيرات'], empty: null,
    },
  };

  static API = { templates: '/api/v1/templates' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/templates');
    this.heading = page.getByRole('heading', { level: 1 });
    this.newTemplateButton = page.getByRole('button', { name: TemplatesPage.I18N.en.newTemplate, exact: true });
    this.topTablist = page.getByRole('tablist').first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(TemplatesPage.I18N.en.heading, { timeout: 30000 });
  }

  /** ÜST seviye sekme (Message templates / Canned Responses). */
  topTab(name) {
    return this.topTablist.getByRole('tab', { name, exact: true });
  }

  async openNewTemplateDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.newTemplateButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
