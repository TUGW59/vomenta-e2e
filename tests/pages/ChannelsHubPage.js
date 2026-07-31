// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * KANALLAR HUB (`/channels`) sayfa nesnesi.
 *
 * Keşif + kanıt: docs/kanallar-kesif/NOTLAR.md. Canlı gözlem: 31 Tem 2026, app.vomenta.com.
 * 7 kanal kartı (Voice / Web Chat / Email / SMS / WhatsApp / Social / Video); her kartta
 * bir "Configure" bağlantısı. Alt-kanal config'leri GET /api/v1/channels/<kanal>/config ile
 * çekilir. Sekme YOK. Kartlar durum rozeti gösterir (Connected / Not configured).
 *
 * GÜVENLİK: yalnız okuma + gezinme. Hub'da yazma yok.
 */
export class ChannelsHubPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Channels',
      subtitle: 'Configure and manage your communication channels',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Kanallar',
      subtitle: 'İletişim kanallarınızı yapılandırın',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Canaux',
      subtitle: 'Configurez et gérez vos canaux',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'القنوات',
      subtitle: 'تكوين وإدارة قنوات الاتصال',
    },
  };

  /** Kart başlıkları (İngilizce) — hub yapısını doğrulamak için. */
  static CARDS = ['Voice', 'Web Chat', 'Email', 'SMS', 'WhatsApp', 'Social Media', 'Video'];

  /** Her kartın "Configure" bağlantısının gittiği rota (Voice diğerlerinden farklı → /voice). */
  static CONFIGURE_HREFS = {
    'Web Chat': '/channels/webchat',
    Email: '/channels/email',
    SMS: '/channels/sms',
    WhatsApp: '/channels/whatsapp',
    'Social Media': '/channels/social',
    Video: '/channels/video',
  };

  static API = { config: '/api/v1/channels/' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/channels');
    this.heading = page.getByRole('heading', { name: ChannelsHubPage.I18N.en.heading, exact: true });
    this.configureLinks = page.getByRole('link', { name: 'Configure', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Verilen kart başlığını taşıyan kart kabını döndürür (durum rozeti + Configure içerir). */
  card(title) {
    return this.page.locator('div', { hasText: title })
      .filter({ has: this.page.getByRole('link', { name: 'Configure', exact: true }) })
      .last();
  }
}
