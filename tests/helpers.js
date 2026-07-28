// @ts-check
import { expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { AppShell } from './pages/AppShell.js';
import { LoginPage } from './pages/LoginPage.js';

/**
 * Ortak test yardımcıları.
 */

/**
 * Uygulamada MEVCUT (bilinen) a11y borcu — bu kurallar regresyon kontrolünden hariç tutulur.
 * color-contrast: birçok sayfada düşük renk kontrastı.
 * button-name: bazı ikon-butonlarda erişilebilir isim eksik.
 * Not: Bunlar gerçek iyileştirme fırsatlarıdır; hariç tutmak yeni ihlalleri yakalamayı sürdürür.
 */
export const A11Y_KNOWN_DEBT = ['color-contrast', 'button-name'];

/**
 * Sayfayı axe ile tarar; bilinen borç DIŞINDaki ciddi/kritik ihlalleri döndürür.
 * @param {import('@playwright/test').Page} page
 */
export async function severeA11yViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  return results.violations.filter(
    (v) => ['critical', 'serious'].includes(v.impact) && !A11Y_KNOWN_DEBT.includes(v.id)
  );
}

/**
 * Sabit süre beklemeden browser render kuyruğunun ve fontların yerleşmesini bekler.
 * @param {import('@playwright/test').Page} page
 */
export async function waitForUiToSettle(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  });
}

/**
 * SPA sayfasına sağlam şekilde git.
 * 'commit' beklemesi: SPA yönlendirmelerinde navigasyonun iptal olmasını önler ve
 * ağır kaynakları beklemez; ardından DOM'un yerleşmesi beklenir.
 * @param {import('@playwright/test').Page} page
 * @param {string} path - Örn. '/contacts'
 */
export async function gotoApp(page, path) {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await new AppShell(page).expectReady();
}

/**
 * Bir gezinme kontrolü (link/kart/menü/sekme) tetiklendikten SONRA, hedef sayfanın
 * GERÇEKTEN yüklendiğini doğrular: doğru rota + oturum korunmuş + hedefin beklenen
 * başlığı görünür. Salt URL eşleşmesi yeterli DEĞİLDİR — URL doğru olsa bile sayfa
 * boş/404/bozuk kabuk olabilir. Bkz. AGENTS.md "İnteraktif kontrol testi standardı
 * (3 katman)" → navigasyon L3 kuralı.
 * @param {import('@playwright/test').Page} page
 * @param {{ path?: string, heading: string, exact?: boolean, timeout?: number }} expected
 *   path: beklenen rota (pathname startsWith; grup rotaları alt-rotaya yönlenebilir).
 *   heading: hedef sayfada görünmesi beklenen başlık (herhangi seviye h1..h6).
 */
export async function assertDestinationLoaded(page, { path, heading, exact = true, timeout = 15000 }) {
  if (path) {
    await page.waitForURL((url) => url.pathname.startsWith(path), { timeout });
  }
  // Oturum korunuyor — login sayfasına atılmadık.
  await expect(new AppShell(page).loginHeading).toBeHidden();
  // Hedef içeriği gerçekten render oldu.
  await expect(page.getByRole('heading', { name: heading, exact }).first()).toBeVisible({ timeout });
}

/**
 * Giriş sayfası üzerinden UI ile giriş yapar ve panelin yüklendiğini doğrular.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
  await new LoginPage(page).login(email, password);
}
