// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * YAPAY ZEKA → KULLANIM (`/ai/usage`).
 *
 * Keşif + kanıt: docs/ (ai-subroutes.authed.spec.js gözlemi) + canlı probe (10 Ağu 2026,
 * app.vomenta.com, salt-okunur; oturum auth.setup.js). Sayfa: 4 KPI döşemesi (Total Tokens/
 * Cost/Requests/Avg) + 2 kullanım TABLOSU ("Usage by Feature" / "Usage by Model") + dönem
 * seçici (combobox). Sekme/arama YOK. Veri GET /api/v1/ai/usage'den gelir.
 *
 * PROD GÜVENLİĞİ: salt-okunur analitik sayfa; mutasyon yüzeyi yok.
 */
export class AiUsagePage extends BasePage {
  /** Dört dilde CANLI gözlenmiş başlık + yön (10 Ağu 2026). */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'AI Usage' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Yapay Zeka Kullanımı' },
    fr: { endonym: 'Français', dir: 'ltr', heading: "Utilisation de l'IA" },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'استخدام الذكاء الاصطناعي' },
  };

  /** KPI döşeme etiketleri (EN). Değer etiketin büyükebeveyninde tutulur (tile deseni). */
  static KPIS = ['Total Tokens', 'Total Cost', 'Total Requests', 'Avg Cost / Request'];

  static API = { usage: '/api/v1/ai/usage' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/ai/usage');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AiUsagePage.I18N.en.heading, { timeout: 30000 });
  }

  /** @ix-table — kullanım tabloları ("Usage by Feature" / "Usage by Model"). SALT-OKUNUR. */
  get table() {
    return this.page.getByRole('table').first();
  }

  /** Tablo GÖVDE satırları = hücre içeren satırlar (kolon-başlığı hariç). SALT-OKUNUR. */
  get rows() {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }
}
