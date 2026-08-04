// @ts-check
import { expect } from '@playwright/test';
import {
  isGatewayStatus,
  pickGatewayStatus,
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
    /**
     * Bu denemede gözlemlenen 5xx gateway durum kodları (navigasyon + API/XHR).
     * `beginAttempt()` her denemede sıfırlar → kanıt denemeye özgüdür.
     * @type {number[]}
     */
    this._gatewayStatuses = [];
    // Ağ üzerindeki GERÇEK 502/503/504 kanıtı: sayfa 200 dönüp içerik render
    // edemediğinde (arka plan API 503'ü) gateway kanıtı YALNIZ burada görünür.
    this.page.on('response', (response) => {
      const status = response.status();
      if (isGatewayStatus(status)) this._gatewayStatuses.push(status);
    });
  }

  /** Yeni bir login denemesi başlar: önceki denemenin gateway kanıtını temizle. */
  beginAttempt() {
    this._gatewayStatuses = [];
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
    // gateway blip'inde de düşebilir; YALNIZ gerçek 5xx kanıtı (gözlemlenen ağ
    // yanıtı veya render edilen nginx 5xx sayfası) varsa GatewayUnavailableError'a
    // çevrilir (retry edilir). Aksi halde (yanlış credential, locator, assertion)
    // orijinal hata AYNEN yükselir.
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
   * Bir assertion'ı koşar; başarısız olursa YALNIZ gerçek gateway kanıtı
   * (gözlemlenen 5xx ağ yanıtı VEYA sayfada render edilen nginx 5xx metni)
   * varsa hatayı geçici {@link GatewayUnavailableError}'a çevirir (retry edilir).
   * Gateway kanıtı yoksa (locator/assertion/credential/redirect/401/403) orijinal
   * hata değiştirilmeden yükselir → retry EDİLMEZ.
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
   * Mevcut denemede gateway kanıtı arar: önce ağ üzerinde gözlemlenen 5xx
   * yanıt (en güçlü sinyal), yoksa render edilen nginx 5xx sayfa metni. Kanıt
   * yoksa null → retry edilmez.
   * @returns {Promise<number|null>}
   */
  async _detectGatewayEvidence() {
    const fromNetwork = pickGatewayStatus(this._gatewayStatuses);
    if (isGatewayStatus(fromNetwork)) return fromNetwork;
    try {
      const bodyText = await this.page.locator('body').innerText({ timeout: 2_000 });
      return gatewayStatusFromBodyText(bodyText);
    } catch {
      return null;
    }
  }
}
