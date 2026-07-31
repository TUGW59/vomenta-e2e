// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR › WHATSAPP (`/channels/whatsapp`) sayfa nesnesi.
 *
 * Keşif: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026). Kontroller: Configure, Create Template,
 * Save Changes. Canlı durum: "WhatsApp Business API Not Configured" + "No templates yet".
 * Config: GET /api/v1/channels/whatsapp/config (+ templates/whatsapp, .../connection).
 *
 * BİLİNEN HATA: B19 — açılışta `INVALID_MESSAGE: MALFORMED_ARGUMENT` konsol hataları.
 *
 * GÜVENLİK (production salt-okunur): Configure / Create Template / Save ASLA gönderilmez.
 */
export class ChannelWhatsappPage extends BasePage {
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'WhatsApp Business', subtitle: 'Manage WhatsApp Business API connection' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'WhatsApp Business', subtitle: 'WhatsApp Business API bağlantısını' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'WhatsApp Business', subtitle: 'Gérer la connexion à l' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'واتساب للأعمال', subtitle: 'إدارة اتصال واجهة واتساب للأعمال' },
  };

  static API = { config: '/api/v1/channels/whatsapp/config', templates: '/api/v1/channels/templates/whatsapp' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels/whatsapp');
    this.heading = page.getByRole('heading', { name: ChannelWhatsappPage.I18N.en.heading, exact: true }).first();
    this.createTemplateButton = page.getByRole('button', { name: 'Create Template', exact: true });
    this.saveButton = page.getByRole('button', { name: 'Save Changes', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }
}
