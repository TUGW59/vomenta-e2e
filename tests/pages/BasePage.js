// @ts-check
import { AppShell } from './AppShell.js';
import { navigateWithGatewayRetry } from '../support/gateway-navigation.js';

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
    // Authed navigasyon, canlı sunucunun aralıklı 502/503/504 blip'lerine karşı
    // SINIRLI in-process retry ile korunur (bkz. ADR-0028). YALNIZ gerçek gateway
    // kanıtında retry; gerçek locator/assertion hataları anında yükselir.
    await navigateWithGatewayRetry(this.page, {
      doGoto: () => this.page.goto(this.path, { waitUntil: 'commit' }),
      afterCommit: () => this.page.waitForLoadState('domcontentloaded').catch(() => {}),
      ready: () => this.shell.expectReady(),
      where: `authed open: ${this.path}`,
    });
  }

  /**
   * Dili endonim etiketiyle değiştirir (kenar çubuğu altındaki dil düğmesi).
   * Tek switch güvenilirdir (ardışık switch güvenilmez) → her test İngilizce başlamalı.
   * Dil sunucuda/localStorage'da kalıcı DEĞİLDİR; taze bağlam hep İngilizce açılır.
   */
  async switchLanguage(endonym) {
    await this.shell.switchLanguage(endonym);
  }
}
