// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * YAPAY ZEKA alt rotaları (`/ai/*`) — tek parametreli ortak kabuk.
 *
 * Keşif + kanıt: 31 Tem 2026 canlı gözlem (app.vomenta.com), Claude-in-Chrome.
 * Her alt rota kendi <main> başlığı (h1) + belirgin bir bölüm çapası taşır. Sayfa
 * verisi RSC ile sunucudan gelir (canlı ağ: sekme/rota etkileşiminde client XHR YOK,
 * yalnız `auth/me` + `voice/calls/live` polling) → per-etkileşim yakalanacak API
 * ucu yok → bu yüzeylerde L2 (arka plan doğrulaması) N/A.
 *
 * PROD GÜVENLİĞİ: bu rotalardaki create/edit/delete/clone/test/AI-call/switch/input
 * kontrolleri mutasyon (bazıları gerçek AI çağrısı/masraf) üretir → canlıda
 * TETİKLENMEZ. Buradaki testler salt-okunur açılış + client-side sekme/filtre +
 * konsol/güvenli-yapı ile sınırlıdır. Mutasyon L3'leri staging'e bırakılır.
 */
export class AiSubPage extends BasePage {
  /**
   * key → { path, heading (EN h1), section (belirgin bölüm çapası), consoleClean }.
   * consoleClean=false: sayfa yüklemede bilinen konsol hatası var (bkz. known-bugs).
   */
  static SECTIONS = Object.freeze({
    voice: { path: '/ai/voice', heading: 'Voice AI', section: 'Voice AI Configurations', consoleClean: true },
    chatbot: { path: '/ai/chatbot', heading: 'Chatbot', section: 'Chat Bot Configurations', consoleClean: true },
    copilot: { path: '/ai/copilot', heading: 'AI Copilot', section: 'Copilot Usage', consoleClean: true },
    sentiment: { path: '/ai/sentiment', heading: 'Sentiment Analysis', section: 'Sentiment Trend', consoleClean: true },
    'knowledge-base': { path: '/ai/knowledge-base', heading: 'Knowledge Base', section: 'Semantic search', consoleClean: true },
    prompts: { path: '/ai/prompts', heading: 'AI Prompts & Scenarios', section: 'Create Scenario', consoleClean: false },
    usage: { path: '/ai/usage', heading: 'AI Usage', section: 'Usage by Feature', consoleClean: true },
    providers: { path: '/ai/providers', heading: 'Provider Settings', section: 'Configured Providers', consoleClean: true },
  });

  /**
   * @param {import('@playwright/test').Page} page
   * @param {keyof typeof AiSubPage.SECTIONS} key
   */
  constructor(page, key) {
    const meta = AiSubPage.SECTIONS[key];
    if (!meta) throw new Error(`AiSubPage: bilinmeyen alt rota "${key}"`);
    super(page, meta.path);
    this.key = key;
    this.meta = meta;
    this.heading = page.getByRole('heading', { name: meta.heading }).first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Belirgin bölüm çapası (görünürlük doğrulaması). */
  section() {
    return this.page.getByText(this.meta.section, { exact: false }).first();
  }
}
