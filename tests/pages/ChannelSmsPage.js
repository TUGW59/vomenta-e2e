// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR › SMS (`/channels/sms`) sayfa nesnesi.
 *
 * Keşif: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026). Kontroller: Send SMS, Add Sender,
 * Create Template, Transceiver (SMPP host/port/şifre), Save & Test, Save Changes.
 * Config: GET /api/v1/channels/sms/config (+ sender-ids, templates/sms, channels/sms/messages).
 *
 * BİLİNEN HATA: B18 — açılışta `INVALID_MESSAGE: MALFORMED_ARGUMENT` konsol hataları.
 *
 * GÜVENLİK (production salt-okunur): Send SMS / Add Sender / Save ASLA gönderilmez.
 */
export class ChannelSmsPage extends BasePage {
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'SMS Configuration', subtitle: 'Manage sender IDs, templates' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'SMS Yapılandırması', subtitle: 'Gönderici kimliklerini, şablonları' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Configuration SMS', subtitle: 'Gérer les identifiants d' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'إعدادات الرسائل القصيرة', subtitle: 'إدارة معرّفات المرسل والقوالب' },
  };

  static API = { config: '/api/v1/channels/sms/config', senderIds: '/api/v1/sender-ids' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels/sms');
    this.heading = page.getByRole('heading', { name: ChannelSmsPage.I18N.en.heading, exact: true });
    this.sendSmsButton = page.getByRole('button', { name: 'Send SMS', exact: true });
    this.addSenderButton = page.getByRole('button', { name: 'Add Sender', exact: true });
    this.createTemplateButton = page.getByRole('button', { name: 'Create Template', exact: true });
    this.saveButton = page.getByRole('button', { name: 'Save Changes', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Add Sender dialogunu açar (yalnız açar; göndermez). */
  async openAddSenderDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.addSenderButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
