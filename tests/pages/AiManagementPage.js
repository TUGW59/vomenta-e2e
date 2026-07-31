// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * YAPAY ZEKA → Genel Bakış / AI Management (`/ai`).
 *
 * Keşif + kanıt: 31 Tem 2026 canlı gözlem (app.vomenta.com), Claude-in-Chrome.
 *
 * Yapı: 4 sekmeli tek yüzey (client-side; sekme değişiminde AYRI backend fetch YOK —
 * canlı ağ izinde yalnız `auth/me` + `voice/calls/live` görülür → sekme L2 = N/A).
 *   1) Agents        → istatistik döşemeleri (Total/Voice/Chat Bots) + bot listesi;
 *                      her botta "Configure" → /bot-builder/{id} (navigasyon).
 *   2) AI Copilot    → "AI Copilot Settings" kartı (Channel Enablement + Features).
 *   3) Supervisor    → "AI Supervisor Settings" (Auto-Evaluation switch + Scoring Criteria).
 *   4) Providers     → "AI Provider Configuration" (istatistik + sağlayıcı listesi) +
 *                      "Manage Providers" → /ai/providers (Provider Settings sayfası).
 *
 * NOT: Bu sayfa ayar mutasyonlarını (toggle/skor/API anahtarı) canlıda DEĞİŞTİRMEZ →
 * prod güvenliği (bkz. AGENTS.md). Testler salt-okunur yapı + i18n + navigasyon (L3)
 * + client-side sekme kontrolü (L1) ile sınırlıdır.
 */
export class AiManagementPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (31 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null,
      dir: 'ltr',
      heading: 'AI Management',
      subtitle: 'Configure AI agents, copilot, supervisor, and provider settings',
      tabs: { agents: 'Agents', copilot: 'AI Copilot', supervisor: 'Supervisor', providers: 'Providers' },
      statTiles: ['Total Bots', 'Voice Bots', 'Chat Bots'],
      configure: 'Configure',
      // sekme-içi çapa metinleri (görünürlük doğrulaması için)
      anchors: {
        copilot: ['AI Copilot Settings', 'Channel Enablement', 'Features'],
        supervisor: ['AI Supervisor Settings', 'Auto-Evaluation', 'Scoring Criteria'],
        providers: ['AI Provider Configuration', 'Total Providers'],
      },
      manageProviders: 'Manage Providers',
    },
    tr: {
      endonym: 'Türkçe',
      dir: 'ltr',
      heading: 'Yapay Zeka Yönetimi',
      subtitle: 'Yapay zeka temsilcilerini, yardımcısını, denetçisini ve sağlayıcı ayarlarını yapılandırın',
      tabs: { agents: 'Temsilciler', copilot: 'Yapay Zeka Yardımcısı', supervisor: 'Denetçi', providers: 'Sağlayıcılar' },
      statTiles: ['Toplam Bot', 'Sesli Botlar', 'Sohbet Botları'],
      configure: 'Yapılandır',
    },
    fr: {
      endonym: 'Français',
      dir: 'ltr',
      heading: "Gestion de l'IA",
      subtitle: 'Configurer les agents IA, le copilote, le superviseur et les paramètres des fournisseurs',
      tabs: { agents: 'Agents', copilot: 'Copilote IA', supervisor: 'Superviseur', providers: 'Fournisseurs' },
      statTiles: ['Total bots', 'Bots vocaux', 'Bots de chat'],
      configure: 'Configurer',
    },
    ar: {
      endonym: 'العربية',
      dir: 'rtl',
      heading: 'إدارة الذكاء الاصطناعي',
      subtitle: 'تكوين وكلاء الذكاء الاصطناعي والمساعد والمشرف وإعدادات المزود',
      tabs: { agents: 'الوكلاء', copilot: 'مساعد الذكاء الاصطناعي', supervisor: 'المشرف', providers: 'المزودون' },
      statTiles: ['إجمالي البوتات', 'بوتات صوتية', 'بوتات دردشة'],
      configure: 'تكوين',
    },
  };

  /** Provider Settings hedef sayfası (Manage Providers navigasyonunun L3 çapası). */
  static PROVIDER_SETTINGS = { path: '/ai/providers', heading: 'Provider Settings' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/ai');
    this.heading = page.getByRole('heading', { level: 1 });
    this.tablist = page.getByRole('tablist');
    this.manageProvidersButton = page.getByRole('button', { name: 'Manage Providers', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AiManagementPage.I18N.en.heading, { timeout: 30000 });
  }

  /**
   * Sekme (substring/case-insensitive isim eşleşmesi). İlk sekmenin görünür etiketi
   * "AI"/"IA" ön-eki taşır (ör. "AIAgents") → substring eşleşmesi ön-ekten bağımsız çalışır.
   * @param {string} name
   */
  tab(name) {
    return this.page.getByRole('tab', { name });
  }

  /** Bir sekmeyi seçer ve o sekmeye ait bir çapa metnin görünür olmasını bekler. */
  async selectTab(name, anchor) {
    await this.tab(name).click();
    if (anchor) await expect(this.page.getByText(anchor, { exact: false }).first()).toBeVisible({ timeout: 10000 });
  }

  /** İlk bottaki "Configure" düğmesi (Agents sekmesi). */
  configureButton() {
    return this.page.getByRole('button', { name: AiManagementPage.I18N.en.configure, exact: true }).first();
  }
}
