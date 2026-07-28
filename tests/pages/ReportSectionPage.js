// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Raporlar'ın ORTAK KABUĞUNU paylaşan rapor bölümleri (`/reports/{key}`).
 *
 * Keşif notları: docs/reports-diger-kesif/NOTLAR.md
 * 10 bölüm (call/agent/queue/campaign/channel/ai/quality/csat/billing/sla) aynı kabuğu
 * paylaşır: h1 + Date Range presetleri + Charts/Table sekmeleri + Bar/Line/Area + Export/Schedule.
 * Bu yüzden bölüm başına ayrı Page Object yerine TEK parametreli Page Object kullanılır.
 *
 * Sayfa taze bağlamda İngilizce açılır; dil kalıcı değildir (her test İngilizce başlar).
 * NOT: `/reports/custom` Panolar sayfasını render eder (alias) → burada KAPSAM DIŞI (bkz. DashboardsPage).
 */
export class ReportSectionPage extends BasePage {
  /** Bölüm başlıkları (h1) — 4 dilde doğrulanmış (28 Tem 2026). */
  static SECTIONS = {
    call: { heading: { en: 'Call Reports', tr: 'Arama Raporları', fr: "Rapports d'appels", ar: 'تقارير المكالمات' } },
    agent: { heading: { en: 'Agent Performance', tr: 'Ajan Performansı', fr: 'Performance des agents', ar: 'أداء الوكيل' } },
    queue: { heading: { en: 'Queue Reports', tr: 'Kuyruk Raporları', fr: "Rapports de files d'attente", ar: 'تقارير قوائم الانتظار' } },
    campaign: { heading: { en: 'Campaign Reports', tr: 'Kampanya Raporları', fr: 'Rapports de campagnes', ar: 'تقارير الحملات' } },
    channel: { heading: { en: 'Channel Reports', tr: 'Kanal Raporları', fr: 'Rapports par canal', ar: 'تقارير القنوات' } },
    ai: { heading: { en: 'AI Reports', tr: 'Yapay Zeka Raporları', fr: 'Rapports IA', ar: 'تقارير الذكاء الاصطناعي' } },
    quality: { heading: { en: 'Quality Reports', tr: 'Kalite Raporları', fr: 'Rapports qualité', ar: 'تقارير الجودة' } },
    csat: { heading: { en: 'CSAT Reports', tr: 'CSAT Raporları', fr: 'Rapports CSAT', ar: 'تقارير CSAT' } },
    billing: { heading: { en: 'Billing & Usage', tr: 'Faturalama ve kullanım', fr: 'Facturation et usage', ar: 'الفوترة والاستخدام' } },
    sla: { heading: { en: 'SLA Reports', tr: 'SLA Raporları', fr: 'Rapports SLA', ar: 'تقارير SLA' } },
  };

  /** Tüm bölümlerde AYNI olan kabuk etiketleri + dil değiştirici endonim + yön. */
  static LANG = {
    en: { endonym: null, dir: 'ltr', charts: 'Charts', table: 'Table', today: 'Today', days7: '7 Days', days30: '30 Days', days90: '90 Days', custom: 'Custom' },
    tr: { endonym: 'Türkçe', dir: 'ltr', charts: 'Grafikler', table: 'Tablo', today: 'Bugün', days7: '7 Gün', days30: '30 Gün', days90: '90 Gün', custom: 'Özel' },
    fr: { endonym: 'Français', dir: 'ltr', charts: 'Graphiques', table: 'Tableau', today: "Aujourd'hui", days7: '7 jours', days30: '30 jours', days90: '90 jours', custom: 'Personnalisé' },
    ar: { endonym: 'العربية', dir: 'rtl', charts: 'رسوم بيانية', table: 'جدول', today: 'اليوم', days7: '7 أيام', days30: '30 يوماً', days90: '90 يوماً', custom: 'مخصص' },
  };

  /** Veri-dolu (grafikli) temsilci bölüm — davranış (L2/L3) testleri için. Boş bölümler: campaign/channel/billing. */
  static DATA_RICH_KEY = 'agent';
  static EMPTY_KEYS = ['campaign', 'channel', 'billing'];

  static apiFor(key) {
    return `/api/v1/reports/${key}`;
  }

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} key - SECTIONS anahtarı (ör. 'call')
   */
  constructor(page, key) {
    super(page, `/reports/${key}`);
    this.key = key;
    this.heading = page.getByRole('heading', { level: 1 });
    this.exportButton = page.getByRole('button', { name: /^Export/ });
    this.scheduleButton = page.getByRole('button', { name: 'Schedule', exact: true });
    this.dateRangeCard = page.getByText(/Date Range|Tarih Aralığı|Plage de dates|نطاق التاريخ/i).first();
    this.charts = page.locator('.recharts-wrapper');
  }

  headingText(lang = 'en') {
    return ReportSectionPage.SECTIONS[this.key].heading[lang];
  }

  /** İngilizce açılır ve İngilizce başlığın göründüğünü doğrular. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(this.headingText('en'), { timeout: 30000 });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  chartsTab(lang = 'en') {
    return this.tab(ReportSectionPage.LANG[lang].charts);
  }

  tableTab(lang = 'en') {
    return this.tab(ReportSectionPage.LANG[lang].table);
  }

  datePreset(name) {
    return this.page.getByRole('button', { name, exact: true }).first();
  }

  /** "Date Range … <aralık>" kartının tüm metni (aralık değişimini gözlemlemek için). */
  async dateRangeText() {
    return (await this.dateRangeCard.locator('..').innerText()).replace(/\s+/g, ' ').trim();
  }

  // languageTrigger()/switchLanguage() BasePage'den miras alınır.
}
