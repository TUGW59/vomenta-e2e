// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Süpervizör Duvar Panosu (`/supervisor/wallboard`) sayfa nesnesi.
 *
 * Keşif notları: docs/supervizor-panosu-kesif/NOTLAR.md
 * Sayfa taze bağlamda İngilizce açılır; dil değiştirici kenar çubuğu altındaki
 * metinli düğmedir ve seçim sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar).
 */
export class WallboardPage extends BasePage {
  /**
   * Dört dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem).
   * `endonym`: kenar çubuğu dil menüsündeki etiket. `theme`: tema seçicinin
   * açılıştaki (yerelleştirilmiş) değeri.
   */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Supervisor wallboard', subtitle: 'Real-time contact center overview', theme: 'Dark', saveLayout: 'Save layout', tvMode: 'TV mode' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Süpervizör duvar panosu', subtitle: 'Gerçek zamanlı çağrı merkezi özeti', theme: 'Karanlık', saveLayout: 'Düzeni kaydet', tvMode: 'TV modu' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Mur du superviseur', subtitle: null, theme: 'Sombre', saveLayout: 'Enregistrer la disposition', tvMode: 'Mode TV' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'لوحة المشرف', subtitle: 'نظرة عامة على مركز الاتصال في الوقت الفعلي', theme: 'داكن', saveLayout: 'حفظ التخطيط', tvMode: 'وضع التلفزيون' },
  };

  /** Çevrilmeyen kuyruk kartı adları (veri/isim). */
  static QUEUE_CARDS = ['AI Created Queue', 'General Support', 'Sales', 'Software'];

  /**
   * Kuyruk kartı "⋮ Queue actions" menü öğeleri.
   * en: İngilizce etiketler. tr.translated: çevrilen 4 öğe; tr.leaked: çevrilmeyen (BULGU 5).
   * NOT: Bu eylemler VERİ DEĞİŞTİRİR/YIKICIDIR → prod'da tetiklenmez (L2/L3 staging @mutation).
   */
  static QUEUE_ACTIONS = {
    en: ['Move call', 'Pause queue', 'Resume queue', 'Close queue', 'Redirect all calls'],
    tr: {
      translated: ['Aramayı taşı', 'Kuyruğu duraklat', 'Kuyruğu kapat', 'Tüm aramaları yönlendir'],
      leaked: ['Resume queue'], // çevrilmeden İngilizce kalıyor
    },
  };

  /** Kontrollerin tıklandığında vurduğu backend uçları (Network incelemesiyle doğrulandı). */
  static API = {
    dashboard: '/api/v1/supervisor/dashboard',
    config: '/api/v1/supervisor/wallboard/config',
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/supervisor/wallboard');
    this.heading = page.getByRole('heading', { level: 1 });
    // Sayfadaki tek combobox = tema seçici (Light/Dark/Auto).
    this.themeSelect = page.getByRole('combobox');
    this.refreshAll = page.getByRole('button', { name: 'Refresh All' });
    this.autoScroll = page.getByRole('button', { name: 'Auto-scroll' });
    // "Live/Canlı" badge'inin yanındaki son-güncelleme saati (yenileme ikonlu span).
    // Header'daki duvar saati farklı ikon (lucide-clock) kullanır — bu ondan ayrıdır.
    this.liveTimestamp = page.locator('span:has(svg.lucide-refresh-cw)').first();
    // "Refresh [30] s" — otomatik yenileme aralığı (saniye) girişi.
    this.refreshInterval = page.locator('input[type="number"]').first();
    // Refresh All'dan sonra çıkan bilgilendirme toast'ı (UI geri bildirimi).
    this.refreshedToast = page.getByText(/refreshed/i).first();
    // Kuyruk kartındaki "⋮ Queue actions" menü butonu. Dil-bağımsız: İngilizce
    // aria-label VEYA ellipsis ikonu (aria-label bazı dillerde yerelleşebilir).
    // NOT: ikon seçici son çaredir; frontend'den stabil data-testid istenmeli.
    this.queueMenuButton = page
      .getByRole('button', { name: 'Queue actions' })
      .or(page.locator('button:has(svg.lucide-ellipsis-vertical)'))
      .first();
  }

  /** İlk kuyruk kartının ⋮ menüsünü açar (hiçbir eylem tetiklemez — yalnızca açar). */
  async openQueueMenu() {
    await expect(async () => {
      await this.queueMenuButton.click();
      await expect(this.page.getByRole('menuitem').first()).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  /** İngilizce açılır ve başlığın göründüğünü doğrular. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WallboardPage.I18N.en.heading, { timeout: 30000 });
  }

  saveLayout(name = WallboardPage.I18N.en.saveLayout) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Sayfadaki tüm kaydırılabilir kapların (+ window/document) en büyük scrollTop'u. */
  async maxScrollTop() {
    return this.page.evaluate(() => {
      let max = Math.max(window.scrollY, document.scrollingElement?.scrollTop ?? 0);
      const walk = (el) => {
        const s = getComputedStyle(el);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4) {
          max = Math.max(max, el.scrollTop);
        }
        for (const c of el.children) walk(c);
      };
      walk(document.body);
      return Math.round(max);
    });
  }

  /** Sayfada kaydırılacak taşan içerik var mı (viewport küçültüldüğünde anlamlı). */
  async hasScrollableOverflow() {
    return this.page.evaluate(() => {
      if (document.scrollingElement && document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight + 4) return true;
      let found = false;
      const walk = (el) => {
        const s = getComputedStyle(el);
        if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4) found = true;
        for (const c of el.children) walk(c);
      };
      walk(document.body);
      return found;
    });
  }

  tvMode(name = WallboardPage.I18N.en.tvMode) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Tema seçicide bir seçeneğe (Light/Dark/Auto) geçer. */
  async selectTheme(optionName) {
    await expect(async () => {
      await this.themeSelect.click();
      await this.page.getByRole('option', { name: optionName, exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(this.themeSelect).toHaveText(optionName, { timeout: 5000 });
  }

  /** `<html>` üzerinde gerçekten uygulanmış temayı ölçer (inspection düzeyi). */
  async appliedTheme() {
    return this.page.evaluate(() => ({
      htmlClass: document.documentElement.className,
      dataTheme: document.documentElement.getAttribute('data-theme'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    }));
  }

  // languageTrigger()/switchLanguage() BasePage'den miras alınır.
}
