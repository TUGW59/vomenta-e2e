// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR › SOCIAL MEDIA (`/channels/social`) sayfa nesnesi.
 *
 * Keşif: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026). 6 platform kartı, her birinde "Connect";
 * "Save Changes". Config: GET /api/v1/channels/social/config (+ .../connections).
 *
 * BİLİNEN HATA: B16 — açılışta `MISSING_MESSAGE: channels.socialPage.platformNames. (en)`
 *   eksik çeviri anahtarı → konsol hatası.
 *
 * GÜVENLİK (production salt-okunur): Connect / Save Changes ASLA gönderilmez.
 */
export class ChannelSocialPage extends BasePage {
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Social Media Channels', subtitle: 'Connect and manage your social media' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Sosyal Medya Kanalları', subtitle: 'Facebook, Instagram, Twitter ve Telegram' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Canaux de réseaux sociaux', subtitle: 'Gérer les connexions Facebook' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'قنوات التواصل الاجتماعي', subtitle: 'إدارة اتصالات' },
  };

  static API = { config: '/api/v1/channels/social/config' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels/social');
    this.heading = page.getByRole('heading', { name: ChannelSocialPage.I18N.en.heading, exact: true });
    this.connectButtons = page.getByRole('button', { name: 'Connect', exact: true });
    this.saveButton = page.getByRole('button', { name: 'Save Changes', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }
}
