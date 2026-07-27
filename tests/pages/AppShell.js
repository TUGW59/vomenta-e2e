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
}
