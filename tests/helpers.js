// @ts-check
import { expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

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
 * SPA sayfasına sağlam şekilde git.
 * 'commit' beklemesi: SPA yönlendirmelerinde navigasyonun iptal olmasını önler ve
 * ağır kaynakları beklemez; ardından DOM'un yerleşmesi beklenir.
 * @param {import('@playwright/test').Page} page
 * @param {string} path - Örn. '/contacts'
 */
export async function gotoApp(page, path) {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * Giriş sayfası üzerinden UI ile giriş yapar ve panelin yüklendiğini doğrular.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
  await page.goto('/');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  // Giriş başarılıysa "Welcome back" başlığı kaybolur.
  await expect(
    page.getByRole('heading', { name: 'Welcome back' })
  ).toBeHidden({ timeout: 30000 });
}
