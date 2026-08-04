// @ts-check
import { expect } from '@playwright/test';
import {
  isGatewayStatus,
  gatewayStatusFromBodyText,
  GatewayUnavailableError,
} from '../support/gateway-retry.js';

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
    // Navigasyon yanıtının durum kodu doğrudan gateway kanıtıdır (502/503/504).
    const response = await this.page.goto('/');
    const status = response ? response.status() : null;
    if (isGatewayStatus(status)) {
      throw new GatewayUnavailableError(Number(status), 'giriş sayfası yüklenemedi');
    }
    await this._assertOrGateway(
      () => expect(this.heading).toBeVisible(),
      'giriş başlığı görünmedi'
    );
  }

  async login(email, password) {
    await this.open();
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
    // Giriş sonrası: başlık gizlenmeli ve navigasyon görünmeli. Bu adımlar
    // gateway blip'inde de düşebilir; YALNIZ sayfa gerçekten 5xx kanıtı
    // gösteriyorsa GatewayUnavailableError'a çevrilir (retry edilir). Aksi halde
    // (yanlış credential, locator, assertion) orijinal hata AYNEN yükselir.
    await this._assertOrGateway(
      () => expect(this.heading).toBeHidden({ timeout: 30_000 }),
      'giriş sonrası başlık gizlenmedi'
    );
    await this._assertOrGateway(
      () => expect(this.page.locator('nav').first()).toBeVisible({ timeout: 30_000 }),
      'giriş sonrası navigasyon görünmedi'
    );
  }

  /**
   * Bir assertion'ı koşar; başarısız olursa YALNIZ sayfa 502/503/504 gateway
   * kanıtı taşıyorsa hatayı geçici {@link GatewayUnavailableError}'a çevirir
   * (retry edilir). Gateway kanıtı yoksa (locator/assertion/credential/redirect)
   * orijinal hata değiştirilmeden yükselir → retry EDİLMEZ.
   * @param {() => Promise<unknown>} assertionFn
   * @param {string} where
   */
  async _assertOrGateway(assertionFn, where) {
    try {
      await assertionFn();
    } catch (err) {
      const status = await this._detectGatewayEvidence();
      if (isGatewayStatus(status)) {
        throw new GatewayUnavailableError(Number(status), where);
      }
      throw err;
    }
  }

  /**
   * Mevcut sayfada nginx 5xx gateway sayfasının izini arar. Kanıt yoksa null.
   * @returns {Promise<number|null>}
   */
  async _detectGatewayEvidence() {
    try {
      const bodyText = await this.page.locator('body').innerText({ timeout: 2_000 });
      return gatewayStatusFromBodyText(bodyText);
    } catch {
      return null;
    }
  }
}
