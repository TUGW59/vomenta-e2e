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

/** "09:24", "9:24 AM", "12:24 PM" → gece yarısından beri dakika (NaN = eşleşmedi). */
export function parseClockToMinutes(text) {
  const m = String(text).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

/** İki "dakika" değeri arasındaki dairesel (24s sarma) en kısa fark. */
export function circularMinuteDiff(a, b) {
  const d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
}

/**
 * Kullanıcıya görünen bir saat metninin YEREL saat dilimine uygun olduğunu doğrular
 * (sunucunun UTC'sini çevirmeden basma hatasını yakalar). Bkz. AGENTS.md timezone
 * standardı. Test, UTC olmayan bir timezone'da çalıştırılmalı (`test.use({ timezoneId })`).
 * @param {import('@playwright/test').Page} page
 * @param {string} clockText - Ekrandan okunan saat (ör. "09:24", "12:24 PM")
 * @param {{ maxDiffMin?: number }} [opts]
 */
export async function assertLocalClock(page, clockText, { maxDiffMin = 5 } = {}) {
  const badgeMin = parseClockToMinutes(clockText);
  const localMin = await page.evaluate(() => new Date().getHours() * 60 + new Date().getMinutes());
  const diff = circularMinuteDiff(badgeMin, localMin);
  expect(
    diff,
    `saat="${clockText}" (=${badgeMin}dk) yerel=${localMin}dk fark=${diff}dk (yerel saat bekleniyor, UTC değil)`
  ).toBeLessThanOrEqual(maxDiffMin);
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

// ═══════════════ STİL TOOLKIT'İ (net-new) ═══════════════
// docs/TEST_STYLES.md + AGENTS.md "Zorunlu test stilleri". Taşma (scanOverflow/
// assertNoHorizontalOverflow) ve @clean (diagnostics.assertClean fixture) BURADA
// TEKRARLANMAZ — zaten mevcut; bu blok yalnızca eksik stil primitiflerini ekler.

/** Responsive/@layout için standart viewport matrisi. */
export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

/**
 * @layout — Bir sayfayı mobil/tablet/masaüstünde açar ve hiçbirinde yatay taşma olmadığını doğrular.
 * Viewport-agnostik gezinme: `gotoApp` masaüstü kenar çubuğunun GÖRÜNÜR olmasını bekler; mobilde
 * kenar çubuğu hamburger'a katlandığı için (responsive) onun yerine oturumun geçerliliği doğrulanır.
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 * @param {Record<string, {width:number,height:number}>} viewports
 */
export async function expectNoOverflowAtViewports(page, path, viewports = VIEWPORTS) {
  const shell = new AppShell(page);
  for (const [name, size] of Object.entries(viewports)) {
    await page.setViewportSize(size);
    await page.goto(path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(shell.loginHeading, `[${name}] oturum geçerli`).toBeHidden();
    await waitForUiToSettle(page);
    await assertNoHorizontalOverflow(page); // origin/main helper (scanOverflow tabanlı, RTL-güvenli)
  }
}

/**
 * @a11y — Bilinen borç DIŞINDA ciddi/kritik axe ihlali OLMADIĞINI doğrular (okunur mesaj).
 * @param {import('@playwright/test').Page} page
 */
export async function expectNoSevereA11y(page) {
  const severe = await severeA11yViolations(page);
  expect(severe.map((v) => `${v.id} (${v.impact})`), 'ciddi/kritik a11y ihlali').toEqual([]);
}

/**
 * @errorpath — Bir API ucunu (glob) sahte yanıtla değiştirir: hata / boş / yavaş / abort.
 * Prod'a YAZMAZ, tamamen deterministiktir.
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp} urlGlob
 * @param {{ status?:number, body?:string, contentType?:string, abort?:boolean, delayMs?:number }} opts
 */
export async function mockApi(page, urlGlob, opts = {}) {
  const { status = 500, body = '{}', contentType = 'application/json', abort = false, delayMs = 0 } = opts;
  await page.route(urlGlob, async (route) => {
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (abort) return route.abort('failed');
    return route.fulfill({ status, contentType, body });
  });
}

/**
 * @data — Tarayıcının bir API ucundan aldığı JSON'u yakalar. Tetikleyiciden ÖNCE çağrılıp saklanmalı:
 *   const p = captureJson(page, '/api/v1/reports/agent'); await rp.open(); const json = await p;
 * @param {import('@playwright/test').Page} page
 * @param {string} urlIncludes
 * @param {{ timeout?:number }} opts
 * @returns {Promise<any>}
 */
export async function captureJson(page, urlIncludes, opts = {}) {
  const { timeout = 15_000 } = opts;
  const res = await page.waitForResponse((r) => r.url().includes(urlIncludes) && r.ok(), { timeout });
  return res.json();
}

/**
 * @perf — Sayfaya gidip içerik (readyLocator) görünene kadar geçen süreyi ölçer, bütçe altında mı doğrular.
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 * @param {import('@playwright/test').Locator} readyLocator
 * @param {number} budgetMs
 * @returns {Promise<number>}
 */
export async function expectContentWithin(page, path, readyLocator, budgetMs) {
  await page.goto(path, { waitUntil: 'commit' });
  const start = Date.now();
  await readyLocator.first().waitFor({ state: 'visible', timeout: budgetMs + 10_000 });
  const elapsed = Date.now() - start;
  expect(elapsed, `içerik yükleme süresi (ms), bütçe=${budgetMs}`).toBeLessThanOrEqual(budgetMs);
  return elapsed;
}

/**
 * @keyboard — Açık diyalogda odak tuzağı (Tab sonrası odak içeride) ve Escape ile kapanma.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} dialog
 */
export async function expectDialogKeyboard(page, dialog) {
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  const focusInside = await dialog.evaluate((d) => d.contains(document.activeElement));
  expect(focusInside, 'Tab sonrası odak diyalog içinde kalmalı (focus trap)').toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}
