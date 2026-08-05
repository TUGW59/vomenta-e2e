// @ts-check
import { expect } from '@playwright/test';
import { isGatewayStatus, GatewayUnavailableError } from '../support/gateway-retry.js';
import { getGatewayObserver, assertOrGateway } from '../support/gateway-navigation.js';

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.email = page.getByLabel('Email address');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Log in' });
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    // Per-deneme 5xx gözlemcisi paylaşımlı modülden gelir (DRY) — ağ üzerindeki
    // GERÇEK 502/503/504 kanıtını toplar. Sayfa 200 dönüp içerik render
    // edemediğinde (arka plan API 503'ü) gateway kanıtı YALNIZ burada görünür.
    this._observer = getGatewayObserver(page);
  }

  /** Yeni bir login denemesi başlar: önceki denemenin gateway kanıtını temizle. */
  beginAttempt() {
    this._observer.beginAttempt();
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
   * hata değiştirilmeden yükselir → retry EDİLMEZ. Kanıt tespiti paylaşımlı
   * observer'a delege edilir (DRY — bkz. support/gateway-navigation.js).
   * @param {() => Promise<unknown>} assertionFn
   * @param {string} where
   */
  async _assertOrGateway(assertionFn, where) {
    await assertOrGateway(this._observer, assertionFn, where);
  }
}
