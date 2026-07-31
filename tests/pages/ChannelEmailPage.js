// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR › EMAIL (`/channels/email`) sayfa nesnesi.
 *
 * Keşif: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026). "Add Account" (dialog açar), imza
 * textarea'sı, 2 switch, "Save Changes". Canlı durum: "No email account connected".
 * Config: GET /api/v1/channels/email/config.
 *
 * BİLİNEN HATALAR (bkz. tests/contracts/known-bugs.js):
 *  - B9  — imza textarea değerinde ham anahtar `channels.emailPage.defaultSignatureText`.
 *  - B17 — açılışta `FORMATTING_ERROR: intl string context variable "p"` konsol hatası
 *          (varsayılan imza HTML'i `<p>...</p>` intl formatlamasını bozuyor).
 *
 * GÜVENLİK (production salt-okunur): Add Account / Save Changes ASLA gönderilmez.
 */
export class ChannelEmailPage extends BasePage {
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Email Channel', subtitle: 'Manage email accounts, signatures' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'E-posta Kanalı', subtitle: 'E-posta hesaplarını, imzaları' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Canal e-mail', subtitle: 'Gérer les comptes e-mail' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'قناة البريد الإلكتروني', subtitle: 'إدارة حسابات البريد الإلكتروني' },
  };

  static API = { config: '/api/v1/channels/email/config' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels/email');
    this.heading = page.getByRole('heading', { name: ChannelEmailPage.I18N.en.heading, exact: true });
    this.addAccountButton = page.getByRole('button', { name: 'Add Account', exact: true });
    this.saveButton = page.getByRole('button', { name: 'Save Changes', exact: true });
    this.signature = page.locator('main textarea').first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Add Account dialogunu açar (yalnız açar; kaydetmez). */
  async openAddAccountDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.addAccountButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
