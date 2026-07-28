// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Kampanyalar → Giden (`/campaigns/outbound`) sayfa nesnesi.
 *
 * Keşif notları: docs/kampanyalar-kesif/NOTLAR.md (+ screenshots/).
 * Sayfa taze bağlamda İngilizce açılır; dil değiştirici AppShell'dedir ve seçim
 * sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar).
 */
export class CampaignsOutboundPage extends BasePage {
  /**
   * Dört dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem).
   * `endonym`: kenar çubuğu dil menüsündeki etiket (en için null).
   */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr',
      heading: 'Outbound Campaigns',
      subtitle: 'Monitor and control active outbound dialing campaigns.',
      cards: ['Active Campaigns', 'Total Contacts', 'Connected Calls', 'Avg Connect Rate'],
      searchPlaceholder: 'Search campaigns...',
      filterAll: 'All types',
      tabs: { all: 'All', running: 'Running', paused: 'Paused' },
      headers: ['Campaign Name', 'Status', 'Dialer Mode', 'Contacts', 'Connected%', 'Actions'],
      newCampaign: 'New Campaign',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr',
      heading: 'Giden Kampanyalar',
      subtitle: 'Aktif giden arama kampanyalarını izleyin ve kontrol edin.',
      cards: ['Aktif Kampanyalar', 'Toplam Kişiler', 'Bağlanan Aramalar', 'Ort. Bağlanma Oranı'],
      searchPlaceholder: null,
      filterAll: 'Tüm türler',
      tabs: { all: 'Tümü', running: 'Çalışan', paused: 'Duraklatılmış' },
      headers: ['Kampanya Adı', 'Durum', 'Arama Modu', 'Kişiler', 'Bağlanan%', 'İşlemler'],
      newCampaign: 'Yeni Kampanya',
    },
    fr: {
      endonym: 'Français', dir: 'ltr',
      heading: 'Campagnes sortantes',
      subtitle: "Surveiller et contrôler les campagnes d'appels sortants actives.",
      cards: ['Campagnes actives', 'Total contacts', 'Appels connectés', 'Taux moyen de connexion'],
      searchPlaceholder: null,
      filterAll: 'Tous les types',
      tabs: { all: 'Toutes', running: 'En cours', paused: 'En pause' },
      headers: ['Nom de la campagne', 'Statut', 'Mode de numérotation', 'Contacts', 'Connecté%', 'Actions'],
      newCampaign: 'Nouvelle campagne',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl',
      heading: 'الحملات الصادرة',
      subtitle: 'مراقبة والتحكم في حملات الاتصال الصادرة النشطة.',
      cards: ['الحملات النشطة', 'إجمالي جهات الاتصال', 'المكالمات المتصلة', 'متوسط معدل الاتصال'],
      searchPlaceholder: null,
      filterAll: 'جميع الأنواع',
      tabs: { all: 'الكل', running: 'قيد التشغيل', paused: 'متوقفة مؤقتاً' },
      headers: ['اسم الحملة', 'الحالة', 'وضع الاتصال', 'جهات الاتصال', 'متصل%', 'إجراءات'],
      newCampaign: 'حملة جديدة',
    },
  };

  /** Tür filtresi (combobox) seçenekleri. */
  static TYPE_OPTIONS = ['All types', 'Voice', 'SMS', 'Email', 'WhatsApp'];

  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı). */
  static API = {
    list: '/api/v1/campaigns',
    stats: '/api/v1/campaigns/stats',
    /** @param {string} id */
    detail: (id) => `/api/v1/campaigns/${id}`,
    /** @param {string} id */
    start: (id) => `/api/v1/campaigns/${id}/start`,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/campaigns/outbound');
    this.heading = page.getByRole('heading', { level: 1 });
    // Filtre çubuğundaki arama girişi (yerelleşmiş placeholder POM I18N'den).
    this.searchInput = page.getByPlaceholder(CampaignsOutboundPage.I18N.en.searchPlaceholder);
    // Sayfadaki tek combobox = tür filtresi.
    this.typeFilter = page.getByRole('combobox').first();
    this.newCampaign = page.getByRole('button', { name: CampaignsOutboundPage.I18N.en.newCampaign });
    this.table = page.locator('table');
    this.rows = page.locator('tbody tr');
    // Silme/başlatma onay dialogu.
    this.confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog')).first();
  }

  /** İngilizce açılır ve başlığın göründüğünü doğrular. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(CampaignsOutboundPage.I18N.en.heading, { timeout: 30000 });
    // Liste iskeletten çıkana kadar bekle: ilk satırın ilk hücresi metin içermeli
    // (skeleton'da boş; veri gelince dolar) — okuma yapan testlerde flaky'yi önler.
    await expect(this.rows.first().locator('td').first()).toHaveText(/\S/, { timeout: 30000 });
  }

  /** İçinde belirli işlem ikonu bulunan ilk satır (satır sırasından bağımsız). */
  rowWithAction(kind) {
    const icon = { view: 'lucide-eye', start: 'lucide-play', delete: 'lucide-trash2' }[kind];
    return this.page.locator('tbody tr').filter({ has: this.page.locator(`button:has(svg.${icon})`) }).first();
  }

  /**
   * Draft satır = hem başlat (play) hem sil (trash) ikonu bulunan ilk satır.
   * (Scheduled satırlarda play VAR ama trash YOK → onları eler; başlat onay
   * metni Draft'ta doğrulandığı için başlat testleri bunu hedefler.)
   */
  draftRow() {
    return this.page
      .locator('tbody tr')
      .filter({ has: this.page.locator('button:has(svg.lucide-play)') })
      .filter({ has: this.page.locator('button:has(svg.lucide-trash2)') })
      .first();
  }

  newCampaignButton(name = CampaignsOutboundPage.I18N.en.newCampaign) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Ada göre kampanya satırı. */
  row(name) {
    return this.rows.filter({ hasText: name }).first();
  }

  /**
   * Satır işlem ikon düğmeleri. A11Y BORCU (BULGU 2): bu düğmelerin erişilebilir
   * ismi yok → `getByRole('button',{name})` çalışmaz. Frontend'den `data-testid`
   * (campaign-row-view/-start/-delete) isteniyor; o gelene kadar SON ÇARE olarak
   * lucide ikon svg sınıfına çapalanır (uygulama-ayrıntısı seçici).
   * @param {import('@playwright/test').Locator} row
   * @param {'view'|'start'|'delete'} kind
   */
  rowAction(row, kind) {
    const icon = { view: 'lucide-eye', start: 'lucide-play', delete: 'lucide-trash2' }[kind];
    return row.locator(`button:has(svg.${icon})`);
  }

  /** Tür filtresinde bir seçeneğe geçer (Radix Select). */
  async selectType(optionName) {
    await expect(async () => {
      await this.typeFilter.click();
      await this.page.getByRole('option', { name: optionName, exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(this.typeFilter).toHaveText(optionName, { timeout: 5000 });
  }

  /** Durum sekmesi (All/Running/Paused) — yerelleşmiş ada göre. */
  tab(name) {
    return this.page.getByRole('tab', { name: new RegExp(`^${name}`) });
  }

  async selectTab(name) {
    const t = this.tab(name);
    await expect(async () => {
      await t.click();
      await expect(t).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }
}
