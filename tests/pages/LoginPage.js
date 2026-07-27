// @ts-check
import { expect } from '@playwright/test';

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.email = page.getByLabel('Email address');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Log in' });
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
  }

  async open() {
    await this.page.goto('/');
    await expect(this.heading).toBeVisible();
  }

  async login(email, password) {
    await this.open();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
    await expect(this.heading).toBeHidden({ timeout: 30_000 });
    await expect(this.page.locator('nav').first()).toBeVisible({ timeout: 30_000 });
  }
}
