// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Gösterge Paneli (`/`) sayfa nesnesi — giriş sonrası açılan varsayılan ekran.
 *
 * Canlı gözlem: 3 Ağu 2026, app.vomenta.com (Browser 1, gerçek oturum).
 * Salt-okunur (hiçbir şey oluşturulmaz/kaydedilmez).
 *
 * Sayfa yapısı (yukarıdan aşağı):
 *  1. Başlık "Dashboard" + alt başlık + tarih aralığı (Today/7 Days/30 Days) +
 *     "Live" oto-yenileme toggle'ı + "Updated HH:MM AM" damgası.
 *  2. "Complete your setup" onboarding kartı (kapatılabilir, %'li — CANLI değişken).
 *  3. 4 KPI döşemesi: Active Agents / Calls Today / Avg Wait Time / CSAT Score.
 *  4. Hızlı eylemler: Start Call (softphone açar; buton) + Send SMS / Create
 *     Campaign / View Reports (gezinme linkleri).
 *  5. Queue Performance (grafik) + Agent Status Board (canlı temsilci kartları).
 *  6. Call Volume (saatlik grafik).
 *  7. "Analytics Insights" ("Deep analytics powered by ClickHouse") → 4 KPI
 *     (Total Calls / Avg Handle Time / SLA Compliance / AI Requests) + 3 alt kart
 *     (Call Volume Over Time / Channel Distribution / Agent Utilization — boş-durum)
 *     + AI Agent Performance (AI Interactions / AI Tokens Used / AI Cost).
 *  8. Live Activity Feed (boş-durum "No recent activity").
 *
 * Dil sunucuda/oturumda kalıcı OLABİLİR; testler taze bağlamda İngilizce açılır.
 * Dil değiştirici kenar çubuğu altındaki / header'daki metinli düğmedir.
 *
 * BULGULAR (bkz. tests/contracts/known-bugs.js):
 *  - DASH-CLICKHOUSE : "ClickHouse" iç terimi kullanıcıya sızıyor (4 dilde de).
 *  - DASH-AI-I18N    : AI Interactions / AI Tokens Used / AI Cost etiketleri
 *                      tr/fr/ar arayüzde çevrilmeden İngilizce kalıyor.
 */
export class DashboardPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (3 Ağu 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr',
      heading: 'Dashboard',
      subtitle: 'Real-time overview of your contact center performance',
      dates: { today: 'Today', d7: '7 Days', d30: '30 Days', live: 'Live' },
      startCall: 'Start Call',
      analyticsInsights: 'Analytics Insights',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr',
      heading: 'Gösterge Paneli',
      subtitle: 'Çağrı merkezi performansınızın gerçek zamanlı özeti',
      dates: { today: 'Bugün', d7: '7 Gün', d30: '30 Gün', live: 'Canlı' },
      startCall: 'Aramayı Başlat',
      analyticsInsights: 'Analitik İçgörüler',
    },
    fr: {
      endonym: 'Français', dir: 'ltr',
      heading: 'Tableau de bord',
      subtitle: "Vue d'ensemble en temps réel des performances du centre de contact",
      dates: { today: "Aujourd'hui", d7: '7 jours', d30: '30 jours', live: 'En direct' },
      startCall: 'Démarrer un appel',
      analyticsInsights: 'Aperçus analytiques',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl',
      heading: 'لوحة التحكم',
      subtitle: 'نظرة عامة فورية على أداء مركز الاتصال',
      dates: { today: 'اليوم', d7: '7 أيام', d30: '30 يومًا', live: 'مباشر' },
      startCall: 'بدء مكالمة',
      analyticsInsights: 'رؤى التحليلات',
    },
  };

  /** Üst KPI döşemeleri (İngilizce; açılışta değer gösterir — boş tenant'ta "0"). */
  static KPI_TILES = ['Active Agents', 'Calls Today', 'Avg Wait Time', 'CSAT Score'];

  /** "Analytics Insights" bölümündeki KPI döşemeleri. */
  static INSIGHT_KPI_TILES = ['Total Calls', 'Avg Handle Time', 'SLA Compliance', 'AI Requests'];

  /** "AI Agent Performance" kartındaki KPI döşemeleri (tr/fr/ar'da İNGİLİZCE kalır → DASH-AI-I18N). */
  static AI_METRIC_LABELS = ['AI Interactions', 'AI Tokens Used', 'AI Cost'];

  /** Açılışta beklenen bölüm başlıkları (İngilizce). */
  static SECTION_TITLES = [
    'Queue Performance', 'Agent Status Board', 'Call Volume',
    'Analytics Insights', 'AI Agent Performance', 'Live Activity Feed',
  ];

  /**
   * Hızlı eylem GEZİNME linkleri (Start Call bir buton, softphone açar → ayrı).
   * href dilden bağımsız stabil çapa; `heading` hedefin (İngilizce) sayfa başlığı
   * → L3'te hedefin gerçekten yüklendiğini kanıtlar (salt URL değil).
   */
  static QUICK_LINKS = [
    { name: 'Send SMS', path: '/channels/sms', heading: 'SMS Configuration' },
    { name: 'Create Campaign', path: '/campaigns/outbound', heading: 'Outbound Campaigns' },
    { name: 'View Reports', path: '/reports', heading: 'Reports' },
  ];

  /** Dashboard'ın canlı veri çektiği salt-okunur uç (L2 / @errorpath / @data). */
  static API = { live: '/api/v1/voice/calls/live' };

  /** İç/teknik terim sızıntısı (DASH-CLICKHOUSE) — kullanıcıya görünmemeli. */
  static INTERNAL_TERM = 'ClickHouse';

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/');
    // Seviye-1 başlık (dil değişince de aynı düğüm) — AnalyticsPage ile aynı desen.
    this.heading = page.getByRole('heading', { level: 1 }).first();
  }

  /** İngilizce açılır, başlığı doğrular ve ilk canlı verinin gelmesini bekler. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(DashboardPage.I18N.en.heading, { timeout: 30000 });
    await this.page
      .waitForResponse((r) => r.url().includes(DashboardPage.API.live), { timeout: 20000 })
      .catch(() => {});
  }

  /** Tarih aralığı butonu (Today/7 Days/30 Days) — bunlar aria-label'sız, adı = metni. */
  dateButton(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /**
   * "Live" oto-yenileme toggle'ı. ⚠ Erişilebilir ADI aksiyon-temelli aria-label'dır
   * (ör. "Otomatik yenilemeyi duraklat" / "Pause auto-refresh") → getByRole(name)
   * ile YAKALANMAZ. Görünen metinle (main içindeki tek buton) hedeflenir; "Live"
   * rozetleri (Agent Status Board / Live Activity Feed) span'dır, buton değil.
   * @param {string} text görünen "Live" metni (dil başına: Live/Canlı/En direct/مباشر)
   */
  liveToggle(text) {
    return this.page.locator('main button', { hasText: text }).first();
  }

  /** Hızlı eylem gezinme linki (main içinde, href ile — dilden bağımsız). */
  quickLink(path) {
    return this.page.locator(`main a[href="${path}"]`).first();
  }

  /** "Start Call" hızlı eylem butonu (softphone açar). */
  get startCallButton() {
    return this.page.getByRole('button', { name: DashboardPage.I18N.en.startCall, exact: true });
  }

  /** `main` görünür metni (i18n sızıntı / iç-terim taraması için). */
  async mainText() {
    return this.page.locator('main').innerText();
  }

  /** Kenar çubuğu/header'daki dil düğmesi. */
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
