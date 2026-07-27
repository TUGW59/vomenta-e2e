// @ts-check
import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Giriş sonrası ana sayfaların içerik testleri.
 * Kayıtlı oturumu (playwright/.auth/user.json) kullanır.
 *
 * goto'da 'commit' beklemesi + başlık için cömert timeout: SPA'nın ağır sayfaları
 * (analytics vb.) ve gerçek sunucu yükü altında Firefox/WebKit'te kararlı çalışır.
 */

// Sayfa -> beklenen ana başlık
const PAGES = [
  { path: '/inbox', heading: 'Inbox' },
  { path: '/contacts', heading: 'Contacts' },
  { path: '/tickets', heading: 'Tickets' },
  { path: '/reports', heading: 'Reports' },
  { path: '/analytics', heading: 'Analytics' },
];

/** Sayfaya git (ortak gotoApp yardımcısı ile). */
async function openPage(page, path) {
  await gotoApp(page, path);
}

test.describe('Vomenta - Sayfa içerikleri (girişli)', () => {
  for (const p of PAGES) {
    test(`${p.path} sayfası "${p.heading}" başlığıyla açılıyor`, async ({ page }) => {
      await openPage(page, p.path);
      await expect(
        page.getByRole('heading', { name: p.heading, exact: true }).first()
      ).toBeVisible({ timeout: 30000 });
    });
  }

  test('Reports sayfası tüm rapor kategorilerini gösteriyor', async ({ page }) => {
    await openPage(page, '/reports');
    for (const cat of [
      'Call Reports',
      'Agent Performance',
      'Queue Reports',
      'Campaign Reports',
      'Channel Reports',
    ]) {
      await expect(
        page.getByRole('heading', { name: cat, exact: true })
      ).toBeVisible({ timeout: 30000 });
    }
  });

  test('Analytics sayfası alt bölümleri gösteriyor', async ({ page }) => {
    await openPage(page, '/analytics');
    await expect(
      page.getByRole('heading', { name: 'AI usage', exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole('heading', { name: 'Deep analytics', exact: true })
    ).toBeVisible({ timeout: 30000 });
  });
});
