// @ts-check
import { AppShell } from './AppShell.js';

/**
 * Girişli ekranların ortak gezinme davranışı.
 */
export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} path
   */
  constructor(page, path) {
    this.page = page;
    this.path = path;
    this.shell = new AppShell(page);
  }

  async open() {
    await this.page.goto(this.path, { waitUntil: 'commit' });
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.shell.expectReady();
  }
}
