// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR › WEB CHAT (`/channels/webchat`) sayfa nesnesi.
 *
 * Keşif: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026). İki sekme: Configuration / Integration.
 * Renk + metin girdileri, 7 switch, 3 textarea, "Save Changes" + "Preview Widget".
 * Config: GET /api/v1/channels/webchat/config. Canlı durum: Connected.
 *
 * GÜVENLİK (production salt-okunur): "Save Changes" ASLA gönderilmez.
 */
export class ChannelWebchatPage extends BasePage {
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Web Chat Configuration', subtitle: 'Customize the chat widget appearance' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Canlı Sohbet Yapılandırması', subtitle: 'Sohbet aracının görünümünü' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Configuration du chat en direct', subtitle: 'Personnalisez' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'تكوين الدردشة المباشرة', subtitle: 'تخصيص مظهر وسلوك أداة الدردشة' },
  };

  static API = { config: '/api/v1/channels/webchat/config' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels/webchat');
    this.heading = page.getByRole('heading', { name: ChannelWebchatPage.I18N.en.heading, exact: true });
    this.configurationTab = page.getByRole('tab', { name: 'Configuration', exact: true });
    this.integrationTab = page.getByRole('tab', { name: 'Integration', exact: true });
    this.saveButton = page.getByRole('button', { name: 'Save Changes', exact: true });
    this.previewButton = page.getByRole('button', { name: 'Preview Widget', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }
}
