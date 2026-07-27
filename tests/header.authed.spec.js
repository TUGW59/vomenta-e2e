// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * Header (global) kontrollerinin FONKSİYONEL testleri — tıklayınca vadettiğini yapıyor mu.
 * Durum değiştiren seçimler (presence "Away" vb.) YAPILMAZ; menülerin açıldığı doğrulanır.
 * Tema değiştirilir ama test sonunda geri alınır.
 *
 * Not: Header her sayfada var. Dashboard'un canlı widget'ları açılır menüleri kapatabildiği
 * için testler SAKİN bir sayfada (/settings) çalışır. Açılır menüler için toPass ile
 * "aç + doğrula" tekrarlanır (menü tıklama yutulmasına karşı).
 */
test.describe('Vomenta - Header kontrolleri (fonksiyonel)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, '/settings');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible({ timeout: 30000 });
  });

  test('tema değiştirici temayı gerçekten değiştiriyor (Dark ↔ Light)', async ({ page }) => {
    const html = page.locator('html');
    const themeButton = page.getByRole('button', { name: 'Toggle theme' });

    // Koyu temaya geç
    await expect(async () => {
      await themeButton.click();
      await page.getByRole('menuitem', { name: 'Dark', exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(html).toHaveClass(/dark/);

    // Açık temaya geri dön (temizlik)
    await expect(async () => {
      await themeButton.click();
      await page.getByRole('menuitem', { name: 'Light', exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(html).toHaveClass(/light/);
  });

  test('durum (presence) menüsü seçenekleriyle açılıyor', async ({ app, page }) => {
    // Menüyü aç (yutulmaya karşı tekrar dene) ve seçenekleri doğrula.
    await expect(async () => {
      await app.shell.presenceMenu.click();
      await expect(page.getByRole('menuitem', { name: 'Away', exact: true })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByRole('menuitem', { name: 'On Break', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Offline', exact: true })).toBeVisible();
    // Durumu DEĞİŞTİRMEDEN kapat.
    await page.keyboard.press('Escape');
  });

  test('kullanıcı menüsü (avatar) Profile/Settings/Log out ile açılıyor', async ({ page }) => {
    await expect(async () => {
      await page.getByRole('button', { name: 'User menu' }).click();
      await expect(page.getByRole('menuitem', { name: 'Log out', exact: true })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByRole('menuitem', { name: 'Profile', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Settings', exact: true })).toBeVisible();
    // Çıkış YAPMADAN kapat.
    await page.keyboard.press('Escape');
  });
});
