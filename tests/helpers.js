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
 * Sayfadaki taşmayı ölçer (yön-duyarsız, RTL-güvenli). Document düzeyinde yatay/
 * dikey taşma + yatay taşan kapların listesi (teşhis için). Yatay taşma ölçümü
 * genişlik karşılaştırmasına dayanır (scrollWidth > clientWidth); bu, RTL'de de
 * doğru çalışır (scrollLeft işaretinden bağımsız).
 * @param {import('@playwright/test').Page} page
 * @param {{ axis?: 'x'|'y'|'both', tolerance?: number }} [opts]
 */
export async function scanOverflow(page, { axis = 'both', tolerance = 2 } = {}) {
  return page.evaluate(
    ({ axis, tolerance }) => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const de = document.scrollingElement || document.documentElement;
      const wantX = axis === 'x' || axis === 'both';
      const wantY = axis === 'y' || axis === 'both';
      const offenders = [];
      if (wantX) {
        const walk = (el) => {
          if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + tolerance) {
            const cs = getComputedStyle(el);
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 60),
              scrollW: el.scrollWidth,
              clientW: el.clientWidth,
              overflowX: cs.overflowX,
              sample: norm(el.textContent).slice(0, 40),
            });
          }
          for (const c of el.children) walk(c);
        };
        walk(document.body);
      }
      return {
        horizontal: wantX ? de.scrollWidth > de.clientWidth + tolerance : undefined,
        vertical: wantY ? de.scrollHeight > de.clientHeight + tolerance : undefined,
        offenders: offenders.slice(0, 15),
      };
    },
    { axis, tolerance }
  );
}

/**
 * Sayfanın yatay olarak KAYMADIĞINI doğrular (document düzeyi). Yatay kayma tipik
 * bir responsive/RTL kusurudur. Hata mesajı taşan kapları listeler (teşhis).
 * @param {import('@playwright/test').Page} page
 */
export async function assertNoHorizontalOverflow(page) {
  const { horizontal, offenders } = await scanOverflow(page, { axis: 'x' });
  expect(
    horizontal,
    `Sayfa yatay kayıyor (document). İlk taşan kaplar: ${JSON.stringify(offenders.slice(0, 3))}`
  ).toBe(false);
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

/**
 * Bir KPI/metrik kutucuğunun yalnızca ETİKETİ değil, bir DEĞER de gösterdiğini
 * doğrular. Backend bozulup tüm metrikleri boşaltırsa (etiket durur, değer kaybolur)
 * bu guard kırılır. Kutucuk yapısı: etiket yaprak düğüm, üst kap "etiket değer".
 * Değer deseni sayı / % / $ / saat (0:00) / boş-durum işareti (— · N/A) kabul eder.
 * @param {import('@playwright/test').Page} page
 * @param {string} label - Kutucuğun etiketi (örn. 'Active calls')
 * @param {{ pattern?: RegExp, timeout?: number }} [opts]
 */
export async function expectMetricHasValue(page, label, { pattern = /\d|%|\$|—|N\/A/, timeout = 10000 } = {}) {
  await expect
    .poll(
      async () =>
        page.evaluate((lbl) => {
          const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
          const main = document.querySelector('main') || document.body;
          const leaf = [...main.querySelectorAll('*')].find(
            (e) => e.children.length === 0 && norm(e.textContent) === lbl
          );
          if (!leaf || !leaf.parentElement) return '';
          return norm(leaf.parentElement.textContent).replace(lbl, '').trim();
        }, label),
      { timeout, message: `"${label}" kutucuğunda değer (sayı/işaret) görünmeli` }
    )
    .toMatch(pattern);
}
