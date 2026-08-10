// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Süpervizör → Temsilci İzleme / Agent Monitor (`/supervisor/agents`).
 *
 * Keşif + kanıt: docs/temsilci-izleme-kesif/NOTLAR.md
 * Taze bağlamda İngilizce açılır; dil değiştirici kenar çubuğu altındaki metinli düğme.
 */
export class AgentMonitorPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem). */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Agent Monitor', subtitle: 'Real-time agent status and performance', live: 'Live updates', statusAll: 'All Status', analyze: 'Analyze', force: 'Force' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Ajan İzleme', subtitle: 'Gerçek zamanlı ajan durumu ve performansı', live: 'Canlı güncellemeler', statusAll: 'Tüm Durumlar', analyze: 'Analiz et', force: 'Zorla' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Moniteur des agents', subtitle: 'Statut et performance des agents en temps réel', live: 'Mises à jour en direct', statusAll: 'Tous les statuts', analyze: 'Analyser', force: 'Forcer' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'مراقب الوكلاء', subtitle: 'حالة الوكيل والأداء في الوقت الفعلي', live: 'تحديثات مباشرة', statusAll: 'جميع الحالات', analyze: 'تحليل', force: 'إجبار' },
  };

  /** Durum filtresi seçenekleri (İngilizce). */
  static STATUS_OPTIONS = ['All Status', 'Available', 'On Call', 'Wrap-Up', 'On Break', 'Away', 'Lunch', 'Training', 'Offline'];

  /** "Force" menüsü öğeleri = ajanın durumunu ZORLA değiştir (MUTATION → prod'da tetiklenmez). */
  static FORCE_STATUSES = ['Available', 'Break', 'Lunch', 'Training', 'Offline'];

  /** Kontrollerin vurduğu backend ucu (Network incelemesiyle doğrulandı). */
  static API = { agents: '/api/v1/supervisor/agents' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/supervisor/agents');
    this.heading = page.getByRole('heading', { level: 1 });
    this.statusFilter = page.getByRole('combobox').first();
    this.searchInput = page.getByPlaceholder('Search agents...');
    this.analyzeTextarea = page.locator('textarea').first();
    this.analyzeButton = page.getByRole('button', { name: 'Analyze', exact: true });
    this.forceButton = page.getByRole('button', { name: 'Force', exact: true }).first();
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.prevButton = page.getByRole('button', { name: 'Previous', exact: true });
    // "Live updates" + "Last refreshed at HH:MM" satırındaki zaman.
    this.lastRefreshed = page.getByText(/Last refreshed at|Son yenileme|Dernière actualisation|آخر تحديث/i).first();
    // Görünüm toggle: liste / ızgara (ikon-only butonlar — aria-label YOK, a11y açığı).
    this.viewListButton = page.locator('button:has(svg.lucide-list)').first();
    this.viewGridButton = page.locator('button:has(svg.lucide-layout-grid)').first();
    // Satır aksiyon ikonları (canlı arama denetimi) — çevrimdışı ajanda disabled.
    this.listenButton = page.getByTitle('Listen').first();
    this.whisperButton = page.getByTitle('Whisper').first();
    this.bargeButton = page.getByTitle('Barge In').first();
  }

  static ANALYZE_API = '/api/v1/ai/copilot/supervisor/detect-anomaly';
  static FORCE_STATUS_API = '/force-status'; // PATCH /api/v1/supervisor/agents/{id}/force-status

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AgentMonitorPage.I18N.en.heading, { timeout: 30000 });
  }

  /** Veri satırları (başlık satırı hariç). */
  dataRows() {
    return this.page.getByRole('row');
  }

  /** @ix-table — ajan tablosu (kolon başlıklı liste). SALT-OKUNUR. */
  get table() {
    return this.page.getByRole('table').first();
  }

  /** Tablo GÖVDE satırları = hücre (`role=cell`) içeren satırlar → kolon-başlığı
   *  satırı (yalnız `columnheader` taşır) hariç. SALT-OKUNUR. */
  get rows() {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /** Durum filtresinden bir seçenek seçer. */
  async selectStatus(name) {
    await expect(async () => {
      await this.statusFilter.click();
      await this.page.getByRole('option', { name, exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  /** İlk satırın "Force" menüsünü açar (yalnızca açar — durum DEĞİŞTİRMEZ). */
  async openForceMenu() {
    await expect(async () => {
      await this.forceButton.click();
      await expect(this.page.getByRole('menuitem').first()).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  /** Adıyla bir ajan satırına tıklayıp detay panelini (drawer) açar. */
  async openDetailDrawer(agentName) {
    await this.page.getByText(agentName, { exact: true }).first().click();
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    return this.page.getByRole('dialog');
  }
}
