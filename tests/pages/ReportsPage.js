// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Raporlar ana sayfası (`/reports`) ve "Scheduled Reports" yönetim yüzeyi.
 *
 * Schedule kartlarının Actions düğmesi erişilebilir isim taşıyor; bu yüzden
 * silme akışı DOM/CSS ayrıntısına değil role + görünen iş adına dayanır.
 */
export class ReportsPage extends BasePage {
  static API = {
    scheduled: '/api/v1/reports/scheduled',
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/reports');
    this.heading = page.getByRole('heading', { name: 'Reports', exact: true });
    this.scheduledSection = page.getByText('Scheduled Reports', { exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
    await expect(this.scheduledSection).toBeVisible({ timeout: 30000 });
  }

  scheduledReportName(name) {
    return this.page.getByText(name, { exact: true });
  }

  /** Bilinen otomasyon önekleriyle başlayan schedule adlarının toplamı. */
  async automationScheduledReportCount(prefixes) {
    await this.open();
    const pattern = new RegExp(
      `^(?:${prefixes.map(escapeRegExp).join('|')}).+`
    );
    return this.page.getByText(pattern).count();
  }

  /** İsim ve erişilebilir Actions düğmesini birlikte içeren schedule kartı. */
  scheduledReportCard(name) {
    return this.page
      .locator('div')
      .filter({ has: this.scheduledReportName(name) })
      .filter({ has: this.page.getByRole('button', { name: 'Actions', exact: true }) })
      .last();
  }

  /**
   * Schedule kartını UI'dan siler: Actions → Delete → (varsa) onay.
   * DELETE 204 yanıtını döndürür ve kartın kaybolmasını bekler.
   * @param {string} name
   */
  async deleteScheduledReportByName(name) {
    const card = this.scheduledReportCard(name);
    await card.getByRole('button', { name: 'Actions', exact: true }).click();

    const deleted = this.page.waitForResponse(
      (response) =>
        response.url().includes(`${ReportsPage.API.scheduled}/`) &&
        response.request().method() === 'DELETE',
      { timeout: 15000 }
    );
    await this.page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

    const confirm = this.page.getByRole('alertdialog').or(this.page.getByRole('dialog'));
    if (await confirm.count()) {
      await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
    }

    const response = await deleted;
    await expect(this.scheduledReportName(name)).toHaveCount(0, { timeout: 15000 });
    return response;
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
