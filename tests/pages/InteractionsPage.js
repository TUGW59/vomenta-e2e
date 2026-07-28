// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Süpervizör → Canlı Etkileşimler / Live Interactions (`/supervisor/interactions`).
 *
 * Keşif + kanıt: docs/canli-etkilesimler-kesif/NOTLAR.md
 * NOT: Sayfa aktif etkileşim yokken boş-durum gösterir (tüm ajanlar çevrimdışı).
 * Satır-aksiyonları (canlı izleme vb.) canlı etkileşim/staging gerektirir.
 */
export class InteractionsPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Live Interactions', subtitle: 'Monitor all active calls and conversations in real-time', channelAll: 'All Channels', empty: 'No active interactions' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Canlı etkileşimler', subtitle: 'Tüm aktif aramaları ve görüşmeleri gerçek zamanlı izleyin', channelAll: 'Tüm kanallar', empty: 'Aktif etkileşim yok' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Interactions en direct', subtitle: 'Surveillez tous les appels et conversations actifs en temps réel', channelAll: 'Tous les canaux', empty: 'Aucune interaction active' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'التفاعلات المباشرة', subtitle: 'راقب جميع المكالمات والمحادثات النشطة في الوقت الفعلي', channelAll: 'جميع القنوات', empty: 'لا توجد تفاعلات نشطة' },
  };

  static COLUMNS = ['Channel', 'Customer', 'Agent', 'Duration', 'Queue', 'Sentiment', 'Status', 'Actions'];
  static CHANNELS = ['All Channels', 'Voice', 'Chat', 'Email'];
  static API = { interactions: '/api/v1/supervisor/interactions' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/supervisor/interactions');
    this.heading = page.getByRole('heading', { level: 1 });
    this.channelFilter = page.getByRole('combobox').first();
    this.searchInput = page.getByPlaceholder('Search by customer, agent...');
    this.emptyState = page.getByText(InteractionsPage.I18N.en.empty, { exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(InteractionsPage.I18N.en.heading, { timeout: 30000 });
  }

  /** Kanal filtresinden bir seçenek seçer. */
  async selectChannel(name) {
    await expect(async () => {
      await this.channelFilter.click();
      await this.page.getByRole('option', { name, exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }
}
