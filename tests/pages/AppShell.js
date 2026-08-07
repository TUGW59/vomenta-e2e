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
    // Presence düğmesi giriş yapan kullanıcının adıyla bulunur (ortam-özel,
    // VOMENTA_USER_DISPLAY_NAME). Ad tanımlı değilse boş regex TÜM düğmeleri
    // eşleştirir → onun yerine stabil "User menu" düğmesine düşülür.
    const displayName = environment.defaultUserDisplayName;
    this.presenceMenu = displayName
      ? page.getByRole('button', { name: new RegExp(displayName, 'i') })
      : this.userMenu;
  }

  async expectReady() {
    await expect(this.navigation).toBeVisible();
    await expect(this.loginHeading).toBeHidden();
  }

  link(name) {
    return this.navigation.getByRole('link', { name, exact: true });
  }

  /**
   * GRUP-FARKINDALIKLI sidebar gezinmesi. Düz menüde doğrudan linke tıklar; sayfa
   * bir grubun (ör. yeniden düzenlenmiş sol panelde açılır alt-menü) altındaysa önce
   * grubu açıp sonra çocuğa tıklar. Böylece sayfalar bir grubun altına taşınsa bile
   * tıklama-gezinme testleri kırılmaz.
   *
   * NOT: Rota-tabanlı gezinme (BasePage.open → goto) her zaman en dayanıklı yoldur ve
   * IA değişiminden etkilenmez; bu yardımcı YALNIZCA sidebar tıklama davranışını test
   * etmek/gerektiğinde kullanılır. `parent` verilirse o grubu açar.
   *
   * @param {string} name Tıklanacak (çocuk) link adı.
   * @param {{ parent?: string }} [opts] parent: önce açılacak grup adı.
   */
  async openViaSidebar(name, opts = {}) {
    const target = this.link(name);
    if (opts.parent) {
      const group = this.navigation
        .getByRole('button', { name: opts.parent, exact: true })
        .or(this.navigation.getByRole('link', { name: opts.parent, exact: true }))
        .first();
      // Çocuk zaten görünür değilse grubu aç (accordion/disclosure).
      if (!(await target.isVisible().catch(() => false))) {
        await group.click();
      }
    }
    await target.click();
  }

  /**
   * Kenar çubuğu altındaki dil düğmesi (🇬🇧 English / 🇹🇷 Türkçe / …).
   * Dil seçimi sunucuda kalıcı DEĞİL → her test taze bağlamda İngilizce başlar.
   */
  languageTrigger() {
    // `:not([role="combobox"])`: bazı sayfalarda (ör. /settings/profile) sayfanın KENDİ
    // "Language" form alanı da bir dil-adı (Türkçe…) içerir ve bir combobox'tır; onu
    // dışlayarak yalnızca kenar çubuğundaki dil DÜĞMESİni hedefleriz (aksi halde `.last()`
    // form alanını seçip yanlış menüyü açabilir).
    return this.page
      .locator('button:not([role="combobox"])', { hasText: /English|Türkçe|Français|العربية/ })
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
