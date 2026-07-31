// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR › VIDEO (`/channels/video`) sayfa nesnesi.
 *
 * Keşif: docs/kanallar-kesif/NOTLAR.md (31 Tem 2026). Kalite/fps seçicileri, "Save Changes",
 * "Start Video Call". Config: GET /api/v1/channels/video/config (+ voice/video/livekit-status).
 * Canlı gözlem: açılış konsolu temiz.
 *
 * GÜVENLİK (production salt-okunur): Save Changes / Start Video Call ASLA tetiklenmez.
 */
export class ChannelVideoPage extends BasePage {
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Video Call Configuration', subtitle: 'Manage video settings, quality' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Görüntülü Arama Yapılandırması', subtitle: 'Video ayarlarını, kaliteyi' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Configuration des appels vidéo', subtitle: 'Gérez les paramètres vidéo' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'إعدادات مكالمات الفيديو', subtitle: 'إدارة إعدادات الفيديو' },
  };

  static API = { config: '/api/v1/channels/video/config' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels/video');
    this.heading = page.getByRole('heading', { name: ChannelVideoPage.I18N.en.heading, exact: true });
    this.saveButton = page.getByRole('button', { name: 'Save Changes', exact: true });
    this.startCallButton = page.getByRole('button', { name: 'Start Video Call', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }
}
