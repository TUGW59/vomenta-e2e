// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Entegrasyonlar (`/settings/integrations`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Entegrasyon kartları (Salesforce/HubSpot/Slack… + Request Access) + API Keys özet (link) +
 * Webhook Subscriptions (Add Webhook + tablo, boş-durum). Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Request Access / Add Webhook (Submit/Add) production'da GÖNDERİLMEZ; dialoglar
 * yalnızca AÇILIR + doğrulanır.
 */
export class IntegrationsPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Integrations',
      subtitle: 'Connect third-party services, manage API keys, and configure webhooks',
      requestAccess: 'Request Access', addWebhook: 'Add Webhook', manageKeys: 'Manage API Keys',
      webhookCols: ['URL', 'Events', 'Status', 'Last Delivered', 'Actions'],
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Entegrasyonlar',
      subtitle: "Üçüncü taraf hizmetlerini bağlayın, API anahtarlarını yönetin ve webhook'ları yapılandırın",
      requestAccess: 'Erişim Talep Et', addWebhook: 'Webhook Ekle', manageKeys: null,
      webhookCols: ['URL', 'Olaylar', 'Durum', 'Son Teslimat', 'İşlemler'],
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Intégrations',
      subtitle: 'Connectez des services tiers, gérez les clés API et configurez les webhooks',
      requestAccess: "Demander l'accès", addWebhook: 'Ajouter un Webhook', manageKeys: null,
      webhookCols: ['URL', 'Événements', 'Statut', 'Dernier envoi', 'Actions'],
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'التكاملات',
      subtitle: 'ربط الخدمات الخارجية وإدارة مفاتيح API وإعداد Webhooks',
      requestAccess: 'طلب الوصول', addWebhook: 'إضافة Webhook', manageKeys: null,
      webhookCols: ['الرابط', 'الأحداث', 'الحالة', 'آخر تسليم', 'الإجراءات'],
    },
  };

  static API = { webhooks: '/api/v1/webhooks', apiKeys: '/api/v1/settings/api-keys' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/integrations');
    this.heading = page.getByRole('heading', { level: 1 });
    this.addWebhookButton = page.getByRole('button', { name: IntegrationsPage.I18N.en.addWebhook, exact: true });
    this.requestAccessButton = page.getByRole('button', { name: IntegrationsPage.I18N.en.requestAccess, exact: true }).first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(IntegrationsPage.I18N.en.heading, { timeout: 30000 });
  }

  async openDialog(button) {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await button.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
