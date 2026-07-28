// @ts-check
import { expect } from '@playwright/test';
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

  /**
   * Dili endonim etiketiyle değiştirir (kenar çubuğu altındaki dil düğmesi).
   * Tek switch güvenilirdir (ardışık switch güvenilmez) → her test İngilizce başlamalı.
   * Dil sunucuda/localStorage'da kalıcı DEĞİLDİR; taze bağlam hep İngilizce açılır.
   */
  async switchLanguage(endonym) {
    const trigger = this.page.locator('button', { hasText: /English|Türkçe|Français|العربية/ }).last();
    await expect(async () => {
      await trigger.click();
      await this.page.getByText(endonym, { exact: true }).first().click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(trigger).toContainText(endonym, { timeout: 10000 });
  }
}
