// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/** Kampanyalar → Şablonlar (`/campaigns/templates`) sayfa nesnesi. */
export class CampaignTemplatesPage extends BasePage {
  static API = {
    list: '/api/v1/channels/templates/sms',
    item: (id) => `/api/v1/channels/templates/sms/${id}`,
  };

  /** 29 Tem 2026'da ayrılmış test tenant'ında gözlemlenen metinler. */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'SMS Templates',
      newTemplate: 'New Template',
      headers: ['Template Name', 'Message Body', 'Created at'],
      createTitle: 'Create Template',
      subtitle: 'Manage reusable SMS message templates for your campaigns.',
      nameLabel: 'Template Name', bodyLabel: 'Message Body',
      namePlaceholder: 'e.g. Welcome Message',
      cancel: 'Cancel', create: 'Create',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'SMS Şablonları',
      newTemplate: 'Yeni Şablon',
      headers: ['Şablon Adı', 'Mesaj İçeriği', 'Oluşturulma'],
      createTitle: 'Şablon Oluştur',
      subtitle: 'Kampanyalarınız için yeniden kullanılabilir SMS mesaj şablonlarını yönetin.',
      nameLabel: 'Şablon Adı', bodyLabel: 'Mesaj İçeriği',
      namePlaceholder: 'ör. Hoş Geldiniz Mesajı',
      cancel: 'İptal', create: 'Oluştur',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Modèles SMS',
      newTemplate: 'Nouveau modèle',
      headers: ['Nom du modèle', 'Corps du message', 'Créé le'],
      createTitle: 'Créer un modèle',
      subtitle: 'Gérez les modèles de messages SMS réutilisables pour vos campagnes.',
      nameLabel: 'Nom du modèle', bodyLabel: 'Corps du message',
      namePlaceholder: 'ex. Message de bienvenue',
      cancel: 'Annuler', create: 'Créer',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'قوالب الرسائل القصيرة',
      newTemplate: 'قالب جديد',
      headers: ['اسم القالب', 'نص الرسالة', 'تاريخ الإنشاء'],
      createTitle: 'إنشاء قالب',
      subtitle: 'إدارة قوالب رسائل SMS القابلة لإعادة الاستخدام لحملاتك.',
      nameLabel: 'اسم القالب', bodyLabel: 'نص الرسالة',
      namePlaceholder: 'مثال: رسالة ترحيب',
      cancel: 'إلغاء', create: 'إنشاء',
    },
  };

  constructor(page) {
    super(page, '/campaigns/templates');
    this.heading = page.getByRole('heading', { level: 1 });
    this.table = page.locator('table');
    this.rows = page.locator('tbody tr');
    this.dialog = page.getByRole('dialog');
    this.confirmDialog = page.getByRole('alertdialog');
  }

  async open() {
    const loaded = this.page.waitForResponse(
      (response) =>
        response.url().includes(CampaignTemplatesPage.API.list) &&
        response.request().method() === 'GET',
      { timeout: 30_000 }
    );
    await super.open();
    await loaded;
    await expect(this.heading).toHaveText(CampaignTemplatesPage.I18N.en.heading, {
      timeout: 30_000,
    });
  }

  newTemplateButton(name = CampaignTemplatesPage.I18N.en.newTemplate) {
    return this.page.getByRole('button', { name, exact: true });
  }

  row(name) {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  rowAction(row, kind) {
    // BULGU: ikon-only edit/delete düğmelerinde erişilebilir isim/testid yok.
    // Frontend aria-label/data-testid sağlayana kadar son çare ikon sınıfı.
    const icon = kind === 'edit' ? 'lucide-pencil' : 'lucide-trash2';
    return row.locator(`button:has(svg.${icon})`);
  }

  async openCreate(name = CampaignTemplatesPage.I18N.en.newTemplate) {
    await this.newTemplateButton(name).click();
    await expect(this.dialog).toBeVisible();
    return this.dialog;
  }

  nameInput(placeholder = CampaignTemplatesPage.I18N.en.namePlaceholder) {
    return this.dialog.getByPlaceholder(placeholder, { exact: true });
  }

  bodyInput() {
    return this.dialog.locator('textarea');
  }

  async openEdit(name) {
    const row = this.row(name);
    await expect(row).toHaveCount(1);
    await this.rowAction(row, 'edit').click();
    await expect(this.dialog).toBeVisible();
    return this.dialog;
  }

  async openDelete(name) {
    const row = this.row(name);
    await expect(row).toHaveCount(1);
    await this.rowAction(row, 'delete').click();
    await expect(this.confirmDialog).toBeVisible();
    return this.confirmDialog;
  }
}
