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
    // F-015 SKELETON LOCATOR: hub yüklenirken kart ızgarasının yerine geçen Tailwind
    // `animate-pulse` placeholder'ları (<main> içinde; canlı gözlem: yüklenirken 42 düğüm,
    // çözülünce 0). Kalıcı skeleton = hub içeriği hiç gelmedi. `<main>`'e kapsandı ki
    // shell'deki alakasız bir pulse yanlış-pozitif üretmesin.
    this.loadingSkeleton = page.locator('main .animate-pulse');
    // "≥1 GERÇEK kanal kartı render oldu" sinyali: Email kartının Configure bağlantısı.
    // href tabanlı, satır-kapsamlı (kırılgan `.first()`/geniş CSS DEĞİL). Bilinçli Email:
    // skeleton çözülene kadar render OLMAZ ('Voice' başlığı statik link olarak erken
    // geldiği için "yüklendi" sinyali değildir — canlı gözlem, 9 Ağu 2026 prod).
    this.emailCardLink = page.locator('a[href="/channels/email"]');
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
    await this.assertLoaded();
  }

  /**
   * F-015 FALSE-GREEN GUARD'ı: heading/shell'in görünmesi TEK BAŞINA yetmez. Hub'ın
   * gerçekten yüklendiğini KANITLAR: (1) skeleton placeholder KAYBOLDU ve (2) en az 1
   * gerçek kanal kartı render OLDU. Dev'de hub 6+ sn sonra bile kalıcı skeleton'da
   * takılı kalabiliyor (kartlar HİÇ gelmiyor); heading yine görünür olduğundan eski
   * assertion'lar GEÇER → sessiz false-green. Bu guard onu gürültülü patlatır.
   *
   * Prod sağlıklı (skeleton ~3 sn içinde çözülüp 7 kart render oluyor — 9 Ağu 2026
   * canlı gözlem), dolayısıyla prod'da yeşil kalır; dev regresyonu ileride prod'a
   * gelirse yakalar.
   */
  async assertLoaded() {
    await expect(this.loadingSkeleton).toHaveCount(0, { timeout: 30000 });
    await expect(this.emailCardLink).toBeVisible({ timeout: 30000 });
  }

  /** Verilen kart başlığını taşıyan kart kabını döndürür (durum rozeti + Configure içerir). */
  card(title) {
    return this.page.locator('div', { hasText: title })
      .filter({ has: this.page.getByRole('link', { name: 'Configure', exact: true }) })
      .last();
  }
}
