// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Analitik (`/analytics`) sayfa nesnesi.
 *
 * Keşif notları: docs/analitik-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * Sayfa taze bağlamda İngilizce açılır; dil değiştirici kenar çubuğu altındaki
 * metinli düğmedir ve seçim sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar).
 *
 * Tek interaktif kontrol grubu: tarih aralığı butonları (Today/7 Days/30 Days/
 * 90 Days/Custom). Varsayılan seçili = "30 Days". Seçili buton `bg-secondary`
 * sınıfını alır — ⚠ `aria-pressed` YOK (a11y/test isteği: docs → Gözlem C).
 */
export class AnalyticsPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Analytics', aiUsage: 'AI usage', allReports: 'All reports',
      dates: { today: 'Today', d7: '7 Days', d30: '30 Days', d90: '90 Days', custom: 'Custom' },
      custom: { start: 'Start', end: 'End', apply: 'Apply range' },
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Analitik', aiUsage: 'Yapay zekâ kullanımı', allReports: 'Tüm raporlar',
      dates: { today: 'Bugün', d7: '7 Gün', d30: '30 Gün', d90: '90 Gün', custom: 'Özel' },
      custom: { start: 'Başlangıç', end: 'Bitiş', apply: 'Aralığı uygula' },
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Analytique', aiUsage: 'Utilisation IA', allReports: 'Tous les rapports',
      dates: { today: "Aujourd'hui", d7: '7 jours', d30: '30 jours', d90: '90 jours', custom: 'Personnalisé' },
      custom: null, // fr Custom popover çevirisi ayrıca gözlemlenmedi → assert edilmez.
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'التحليلات', aiUsage: 'استخدام الذكاء الاصطناعي', allReports: 'جميع التقارير',
      dates: { today: 'اليوم', d7: '7 أيام', d30: '30 يومًا', d90: '90 يومًا', custom: 'مخصص' },
      custom: null, // ar Custom popover çevirisi ayrıca gözlemlenmedi → assert edilmez.
    },
  };

  /**
   * "How this hub works" altındaki 6 navigasyon kartı. `href` dilden bağımsız
   * stabil çapa; kart adları 4 dilde doğrulanmış çevirilerdir. `dest`: karta
   * tıklayınca açılan hedef sayfanın (İngilizce) h1 başlığı — L3'te hedefin
   * gerçekten yüklendiğini kanıtlamak için (salt URL değil; bkz. AGENTS.md).
   */
  static NAV_CARDS = [
    { href: '/reports/call', dest: 'Call Reports', en: 'Call analytics', tr: 'Arama analitiği', fr: 'Analytique des appels', ar: 'تحليلات المكالمات' },
    { href: '/reports/agent', dest: 'Agent Performance', en: 'Agent analytics', tr: 'Temsilci analitiği', fr: 'Analytique des agents', ar: 'تحليلات الوكلاء' },
    { href: '/reports/queue', dest: 'Queue Reports', en: 'Queue analytics', tr: 'Kuyruk analitiği', fr: "Analytique des files d'attente", ar: 'تحليلات قوائم الانتظار' },
    { href: '/reports/campaign', dest: 'Campaign Reports', en: 'Campaign analytics', tr: 'Kampanya analitiği', fr: 'Analytique des campagnes', ar: 'تحليلات الحملات' },
    { href: '/reports/ai', dest: 'AI Reports', en: 'AI analytics', tr: 'Yapay zekâ analitiği', fr: 'Analytique IA', ar: 'تحليلات الذكاء الاصطناعي' },
    { href: '/reports/dashboards', dest: 'Dashboards', en: 'Dashboards', tr: 'Panolar', fr: 'Tableaux de bord', ar: 'لوحات المعلومات' },
  ];

  /** Açılışta beklenen KPI döşemeleri (İngilizce; çeviri i18n testinde ayrı ele alınmaz). */
  static KPI_TILES = ['Active calls', 'Agents online', 'Total calls today'];

  /** Tıklamada vurulan salt-okunur analytics uçlarının ortak öneki. */
  static API = { analytics: '/api/v1/analytics/' };

  /** "Deep analytics" bölümünde tr/fr/ar üçünde de İngilizce kalan metinler (BULGU A). */
  static DEEP_LEAKS = [
    'Deep analytics', 'Call abandonment', 'Abandonment rate over time',
    'Calls by hour of day', 'Agent utilization', 'Campaign contact rate',
    'Chat response time', 'Billing & usage',
  ];

  /** İç/teknik terim sızıntısı (BULGU B) — kullanıcıya görünmemeli. */
  static INTERNAL_TERM = 'ClickHouse';

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/analytics');
    this.heading = page.getByRole('heading', { level: 1 });
    this.aiUsageHeading = page.getByRole('heading', { name: AnalyticsPage.I18N.en.aiUsage, exact: true });
    this.deepAnalyticsHeading = page.getByRole('heading', { name: 'Deep analytics', exact: true });
    // "All reports" linki tek başına /reports'a gider (kartlar /reports/* ).
    this.allReportsLink = page.locator('main a[href="/reports"]');
  }

  /** İngilizce açılır ve başlığın göründüğünü doğrular. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AnalyticsPage.I18N.en.heading, { timeout: 30000 });
    // İlk analytics verisi gelene kadar bekle (dönem etiketleri/render otursun).
    await this.page
      .waitForResponse((r) => r.url().includes(AnalyticsPage.API.analytics), { timeout: 20000 })
      .catch(() => {});
  }

  /** Tarih aralığı butonu (verilen isimle). */
  dateButton(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Bir kartın main içindeki linki (href ile — dilden bağımsız). */
  navCard(href) {
    return this.page.locator(`main a[href="${href}"]`);
  }

  /** `main` içinde "· <token>" biçimli dönem etiketlerinin sayısı (L3 ölçümü). */
  async periodLabelCount(token) {
    return this.page.evaluate((tk) => {
      const t = (document.querySelector('main') || document.body).innerText;
      const re = new RegExp('·\\s*' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      return (t.match(re) || []).length;
    }, token);
  }

  /** `main` görünür metni (i18n sızıntı taraması için). */
  async mainText() {
    return this.page.locator('main').innerText();
  }

  /** "Custom/Özel" tarih seçici popover'ını açar ve döndürür. */
  async openCustomRange(label = AnalyticsPage.I18N.en.dates.custom) {
    await this.dateButton(label).click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    return dialog;
  }

  /** Kenar çubuğu altındaki dil düğmesi. */
  languageTrigger() {
    return this.page.locator('button', { hasText: /English|Türkçe|Français|العربية/ }).last();
  }

  /**
   * Dili endonim etiketiyle değiştirir (İngilizce başlangıçtan tek geçiş) ve
   * başlığın yerelleştiğini doğrular. Ardışık switch güvenilmez.
   */
  async switchLanguage(endonym, expectedHeading) {
    const trigger = this.languageTrigger();
    await expect(async () => {
      await trigger.click();
      await this.page.getByText(endonym, { exact: true }).first().click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    if (expectedHeading) {
      await expect(this.heading).toHaveText(expectedHeading, { timeout: 15000 });
    }
  }
}
