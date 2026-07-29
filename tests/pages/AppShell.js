// @ts-check
import { expect } from '@playwright/test';
import { environment } from '../../config/environment.js';

/**
 * Giriş sonrası tüm ekranlarda ortak olan uygulama kabuğu.
 * Header/sidebar değişiklikleri tek noktadan yönetilir.
 */
export class AppShell {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.navigation = page.locator('nav').first();
    this.loginHeading = page.getByRole('heading', { name: 'Welcome back' });
    this.globalSearch = page.getByRole('button', { name: /Search/ }).first();
    this.userMenu = page.getByRole('button', { name: 'User menu' });
    this.presenceMenu = page.getByRole('button', {
      name: new RegExp(environment.defaultUserDisplayName, 'i'),
    });
  }

  async expectReady() {
    await expect(this.navigation).toBeVisible();
    await expect(this.loginHeading).toBeHidden();
  }

  link(name) {
    return this.navigation.getByRole('link', { name, exact: true });
  }

  /**
   * Kenar çubuğu altındaki dil düğmesi (🇬🇧 English / 🇹🇷 Türkçe / …).
   * Dil seçimi sunucuda kalıcı DEĞİL → her test taze bağlamda İngilizce başlar.
   */
  languageTrigger() {
    return this.page
      .locator('button', { hasText: /English|Türkçe|Français|العربية/ })
      .last();
  }

  /**
   * Dili endonim etiketiyle değiştirir ve değişikliğin oturduğunu doğrular.
   * Tek switch güvenilirdir (ardışık switch güvenilmez) → her test İngilizce başlamalı.
   * @param {string} endonym Menüdeki dil etiketi (ör. 'Türkçe').
   */
  async switchLanguage(endonym) {
    const trigger = this.languageTrigger();
    const option = this.page.getByText(endonym, { exact: true }).first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toBeEnabled();
    await expect(async () => {
      if (!(await option.isVisible())) await trigger.click();
      await expect(option).toBeVisible({ timeout: 5000 });
      await option.click();
    }).toPass({ timeout: 30000 });
    await expect(trigger).toContainText(endonym, { timeout: 10000 });
  }
}
