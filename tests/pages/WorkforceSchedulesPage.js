// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * İş Gücü › Programlar (`/workforce/schedules`) — YENİ ayrı rota (standalone).
 *
 * Bu, eski `/workforce` sekmeli yüzeyindeki "Programlar" sekmesinin dedicated-route
 * karşılığıdır (aynı bileşen/uçları paylaşır; canlı gözlem 30 Tem 2026). Eski tabbed
 * yüzey `tests/pages/WorkforcePage.js` + `workforce.authed.spec.js` tarafından hâlâ
 * kapsanıyor (paralel, silinmedi). Bu sayfa nesnesi yalnız dedicated route'u doğrular
 * (standalone başlık + kontrollerin varlığı + doğru API ucu); derin hafta-nav/publish
 * yaşam döngüsü eski spec'te olduğundan burada TEKRARLANMAZ.
 */
export class WorkforceSchedulesPage extends BasePage {
  static API = {
    schedules: '/api/v1/wfm/schedules', // GET ?startDate&endDate
  };

  static L = {
    heading: /(Schedules|Programlar)/,
    prevWeek: /^(Previous Week|Önceki Hafta)$/,
    nextWeek: /^(Next Week|Sonraki Hafta)$/,
    publish: /^(Publish Schedule|Programı Yayınla)$/,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/workforce/schedules');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WorkforceSchedulesPage.L.heading, { timeout: 30000 });
  }

  prevWeekButton() {
    return this.page.getByRole('button', { name: WorkforceSchedulesPage.L.prevWeek });
  }

  nextWeekButton() {
    return this.page.getByRole('button', { name: WorkforceSchedulesPage.L.nextWeek });
  }

  publishButton() {
    return this.page.getByRole('button', { name: WorkforceSchedulesPage.L.publish });
  }

  /**
   * Boş vardiya "+" hücresi (add-shift affordance). Tıklanınca "Vardiya Ekle/Add
   * Shift" formu açılır → gerçek interaktif kontrol. NOT: semantik buton DEĞİL
   * (div.border-dashed; role/tabindex/aria-label yok) → a11y/klavye bulgusu
   * WORKFORCE-SCHEDULE-CELL-A11Y. Semantik hedef olmadığından son çare CSS.
   */
  firstAddShiftCell() {
    return this.page.locator('main table td .border-dashed').first();
  }
}
