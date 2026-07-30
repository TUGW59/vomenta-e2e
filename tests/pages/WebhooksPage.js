// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Webhooks (`/settings/webhooks`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Add Webhook + boş-durum ("No webhooks configured") + Add Webhook dialog (URL/Secret/Events —
 * /settings/integrations ile aynı dialog). Taze bağlamda İngilizce açılır.
 *
 * NOT: Başlık "Webhooks" 4 dilde de aynı (marka/teknik terim → sızıntı DEĞİL).
 * GÜVENLİK: Add Webhook / Add production'da GÖNDERİLMEZ.
 */
export class WebhooksPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Webhooks',
      subtitle: 'Configure webhooks to receive real-time events from your contact center',
      add: 'Add Webhook', dialogTitle: 'Add webhook', empty: 'No webhooks configured',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Webhooks',
      subtitle: 'İletişim merkezinizden gerçek zamanlı olaylar almak için webhook yapılandırın',
      add: 'Webhook Ekle', dialogTitle: null, empty: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Webhooks',
      subtitle: 'Configurez les webhooks pour recevoir des événements en temps réel de votre centre de contact',
      add: 'Ajouter un webhook', dialogTitle: null, empty: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'Webhooks',
      subtitle: 'اضبط webhooks لاستقبال الأحداث الفورية من مركز الاتصال',
      add: 'إضافة Webhook', dialogTitle: null, empty: null,
    },
  };

  static API = { webhooks: '/api/v1/webhooks' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/webhooks');
    this.heading = page.getByRole('heading', { level: 1 });
    this.addButton = page.getByRole('button', { name: WebhooksPage.I18N.en.add, exact: true }).first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WebhooksPage.I18N.en.heading, { timeout: 30000 });
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
