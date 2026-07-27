// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Giriş sonrası (authenticated) Vomenta panel testleri.
 * Kayıtlı oturumu (playwright/.auth/user.json) kullanır — bkz. auth.setup.js.
 */

// Kenar menüsündeki ana gezinme öğeleri (isim -> yol)
const NAV_ITEMS = [
  { name: 'Dashboard', path: '/' },
  { name: 'Inbox', path: '/inbox' },
  { name: 'Voice', path: '/voice' },
  { name: 'Channels', path: '/channels' },
  { name: 'AI', path: '/ai' },
  { name: 'Campaigns', path: '/campaigns' },
  { name: 'Bot Builder', path: '/bot-builder' },
  { name: 'Contacts', path: '/contacts' },
  { name: 'Tickets', path: '/tickets' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Reports', path: '/reports' },
  { name: 'Supervisor', path: '/supervisor' },
  { name: 'Workforce', path: '/workforce' },
  { name: 'Settings', path: '/settings' },
];

test.describe('Vomenta - Giriş sonrası panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // SPA'nın render olmasını bekle (kenar menüsü görünene kadar).
    await page.locator('nav').first().waitFor({ state: 'visible', timeout: 30000 });
  });

  test('oturum geçerli — giriş formu görünmüyor', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden();
    await expect(page.getByLabel('Password')).toBeHidden();
  });

  test('panel (Dashboard) ve kullanıcı adı görünüyor', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tuğçe Topuz' })).toBeVisible();
  });

  test('kenar menüsü tüm ana bölümleri içeriyor', async ({ page }) => {
    const nav = page.locator('nav').first();
    for (const item of NAV_ITEMS) {
      await expect(
        nav.getByRole('link', { name: item.name, exact: true })
      ).toBeVisible();
    }
  });

  test('menü linkleri doğru href değerlerine sahip', async ({ page }) => {
    const nav = page.locator('nav').first();
    for (const item of NAV_ITEMS) {
      await expect(
        nav.getByRole('link', { name: item.name, exact: true })
      ).toHaveAttribute('href', item.path);
    }
  });

  test('arama kutusu ve tarih filtreleri görünüyor', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Search/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '7 Days', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '30 Days', exact: true })).toBeVisible();
  });
});

/**
 * Her ana sayfaya doğrudan URL ile erişim — ayrı testler halinde (paralelleşir).
 * 'commit' beklemesi: SPA yönlendirmelerinde navigasyonun iptal olmasını önler ve
 * ağır kaynakların yüklenmesini beklemez. Bazı sayfalar alt-rotaya yönlenir
 * (ör. /voice -> /voice/live), bu yüzden URL'nin istenen yolu İÇERMESİNİ bekleriz.
 */
test.describe('Vomenta - Sayfalara doğrudan erişim (oturum korunuyor)', () => {
  for (const item of NAV_ITEMS.filter((i) => i.path !== '/')) {
    test(`${item.path} doğrudan açılıyor`, async ({ page }) => {
      await page.goto(item.path, { waitUntil: 'commit' });
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden();
      expect(page.url()).toContain(item.path);
    });
  }
});
