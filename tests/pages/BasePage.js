// @ts-check
import { expect } from '@playwright/test';
import { AppShell } from './AppShell.js';
import { navigateWithGatewayRetry } from '../support/gateway-navigation.js';

/**
 * Girişli ekranların ortak gezinme davranışı.
 */
export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} path açılacak rota (page.goto hedefi)
   * @param {{ expectedLandingPath?: string }} [options]
   *   `expectedLandingPath`: POM'un GERÇEKTEN İNMESİ beklenen kanonik yol. Varsayılan
   *   = `path`. Belgelenmiş alias/redirect için override edilir (ör. VoicePage:
   *   `/voice` → `/voice/live`). Bkz. `assertLanded()` (F-029 route-drift guard).
   */
  constructor(page, path, options = {}) {
    this.page = page;
    this.path = path;
    this.shell = new AppShell(page);
    this.expectedLandingPath = options.expectedLandingPath ?? path;
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
    // F-029 ROUTE-DRIFT GUARD: kabuk hazır olduktan sonra GERÇEKTEN kanonik rotaya
    // inildiğini KANITLA. Aksi hâlde bir POM `/supervisor/agents`'a gidip istemci
    // tarafında `/monitoring/agents`'a düşse ve içerik AYNI olsa bile tüm içerik
    // assertion'ları GEÇER → sessiz false-green. Bu guard drift'i GÜRÜLTÜLÜ patlatır.
    await this.assertLanded();
  }

  /**
   * F-029 route-drift/redirect guard'ı (ADR-0034). `expectedLandingPath` altına
   * İNİLDİĞİNİ doğrular: ya birebir eşleşme ya da onun bir alt-yolu (kanonik hub →
   * alt-sayfa alias'ları için). Kök `/` muaftır (her yol `startsWith('/')`).
   *
   * NOT: `startsWith` bilinçli seçilir — belgelenmiş hub→alt-yol alias'larını
   * (ör. `/voice` → `/voice/live`) tolere ederken alanlar-arası drift'i (ör.
   * `/supervisor/*` → `/monitoring/*`) YAKALAR. Tam-eşleşme isteyen POM
   * `expectedLandingPath`'i tam hedefe (ör. `/voice/live`) sabitler.
   */
  async assertLanded() {
    const expected = this.expectedLandingPath;
    if (!expected || expected === '/') return; // kök: guard anlamsız (her yol eşleşir)
    const actual = new URL(this.page.url()).pathname;
    const prefix = expected.endsWith('/') ? expected : `${expected}/`;
    const landed = actual === expected || actual.startsWith(prefix);
    expect(
      landed,
      `Route drift (F-029): '${this.path}' açıldı ama beklenen kanonik yol ` +
        `'${expected}' yerine '${actual}' konumuna inildi. İçerik aynı görünse bile ` +
        'bu bir rota migrasyonu/redirect kanıtıdır; POM path\'ini gerçeğe göre ' +
        'güncelleyin veya ADR-0034 uyarınca yüzey kaydını gözden geçirin.'
    ).toBe(true);
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
