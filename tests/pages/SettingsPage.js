// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Settings sayfası nesnesi (Page Object).
 */
export class SettingsPage extends BasePage {
  static TABS = ['Organization', 'Users', 'Billing & Usage', 'Security', 'API Keys', 'Modules'];

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings');
    this.heading = page.getByRole('heading', { name: 'Settings', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /**
   * Bir sekmeye tıklar ve seçili duruma geçtiğini doğrular.
   * Radix sekmelerinde tıklama yutulabildiğinden seçili olana kadar tekrar dener.
   */
  async selectTab(name) {
    const tab = this.tab(name);
    await expect(async () => {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return tab;
  }
}
