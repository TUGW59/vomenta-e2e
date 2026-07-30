// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * API Anahtarları (`/settings/api-keys`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Create Key + boş-durum ("No API keys" + Generate API Key) + Create API Key dialog
 * (Key name/Expiration/Permissions). Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Create Key / Generate / Create Key (submit) production'da GÖNDERİLMEZ.
 */
export class ApiKeysPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'API Keys',
      subtitle: 'Manage API keys for programmatic access to your account',
      create: 'Create Key', generate: 'Generate API Key', dialogTitle: 'Create API Key',
      empty: 'No API keys',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'API Anahtarları',
      subtitle: 'Hesabınıza programatik erişim için API anahtarlarını yönetin',
      create: 'Anahtar Oluştur', generate: 'API Anahtarı Oluştur', dialogTitle: null, empty: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Clés API',
      subtitle: "Gérez les clés API pour l'accès programmatique à votre compte",
      create: 'Créer une clé', generate: 'Générer une clé API', dialogTitle: null, empty: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'مفاتيح API',
      subtitle: 'إدارة مفاتيح API للوصول البرمجي إلى حسابك',
      create: 'إنشاء مفتاح', generate: 'إنشاء مفتاح API', dialogTitle: null, empty: null,
    },
  };

  static API = { keys: '/api/v1/settings/api-keys' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/api-keys');
    this.heading = page.getByRole('heading', { level: 1 });
    this.createButton = page.getByRole('button', { name: ApiKeysPage.I18N.en.create, exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(ApiKeysPage.I18N.en.heading, { timeout: 30000 });
  }

  async openCreateDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.createButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
