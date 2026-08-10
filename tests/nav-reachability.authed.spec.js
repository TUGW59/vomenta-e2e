// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';
import { MAIN_NAVIGATION } from './contracts/navigation.js';

/**
 * NAV-REACHABILITY (ORPHAN + MENÜ-YÜKLEME GATE).
 *
 * Gözlem (6 Ağu 2026, canlı): `/`'a inince kenar menüsü ~3 sn boyunca yalnız 2 öğe
 * (Dashboard + Settings) gösteren bir FALLBACK render ediyor, sonra izin/menü verisi
 * çözülünce TEK SEFERDE 14 öğeye tamamlanıyor. Bu geçiş penceresinde Voice/Channels/
 * Campaigns/Supervisor/Workforce vb. menüde YOK → kullanıcı "tıklayarak ulaşamıyorum"
 * deneyimini yaşıyor (sayfalar URL'den açılıyor olsa da).
 *
 * Bu spec iki bağımsız şeyi zorlar:
 *   BLOK 1 (URL): her rota doğrudan URL ile beklenen başlıkla render ediyor mu?
 *   BLOK 2 (MENÜ): kenar menüsü, KABUL EDİLEBİLİR SÜRE içinde `MAIN_NAVIGATION`'ın
 *                  TAMAMINI tıklanabilir olarak sunuyor mu? — asla-dolmayan (orphan)
 *                  VE çok-yavaş-dolan (menü-yükleme regresyonu) durumlarını yakalar.
 *
 * ÖNEMLİ (yarış tuzağı): Menü BLOK'u başka rotaya gidip `/`'a DÖNEREK ölçülmez; SPA
 * geçişinde önceki sayfanın menüsü DOM'da bayat kalıp yanlış-pozitif üretir. Taze `/`
 * yüklemesi üzerinde, menü tamamlanana kadar POLL edilerek ölçülür.
 */

// Menünün tamamlanması için bütçe. Gözlenen tipik dolum ~3 sn; 10 sn KASITLI olarak
// cömert. KARAR (ürün sahibi): async menü yüklemesi 5 sn'ye kadar NORMAL, bug DEĞİL —
// bu yüzden bütçeyi 5 sn'nin ALTINA çekme. Amaç yalnız "menü HİÇ dolmuyor / aşırı
// yavaş" regresyonlarını flaky olmadan yakalamak (10 sn = 5 sn kabul + emniyet payı).
const MENU_COMPLETE_BUDGET_MS = 10_000;

/** `/`'ta kenar menüsündeki tıklanabilir kontrol isimleri (link+buton). */
async function navNames(page) {
  const nav = page.locator('nav').first();
  const ctrls = nav.getByRole('link').or(nav.getByRole('button'));
  const n = await ctrls.count();
  const names = new Set();
  for (let i = 0; i < n; i++) {
    const nm = ((await ctrls.nth(i).getAttribute('aria-label')) || (await ctrls.nth(i).textContent()) || '')
      .trim()
      .replace(/\s+/g, ' ');
    if (nm) names.add(nm);
  }
  return names;
}

/** `item.name` menüde bir kontrol adı olarak (birebir ya da grup-öneki) mevcut mu? */
function isReachable(names, item) {
  return [...names].some((nm) => nm === item.name || nm.startsWith(item.name));
}

test.describe('Nav reachability — direct URL', () => {
  for (const item of MAIN_NAVIGATION) {
    test(`"${item.name}" (${item.path}): doğrudan URL ile açılıyor`, async ({ page }) => {
      await gotoApp(page, item.path);
      await assertDestinationLoaded(page, { path: item.path, heading: item.heading });
    });
  }
});

test.describe('Nav reachability — orphan & menü-yükleme gate', () => {
  test(`kenar menüsü ${MENU_COMPLETE_BUDGET_MS}ms içinde tüm MAIN_NAVIGATION öğelerini tıklanabilir sunmalı`, async ({ page }) => {
    await gotoApp(page, '/');
    await expect(page.locator('nav').first()).toBeVisible();

    // Menü tamamlanana kadar poll et; bütçeyi aşarsa son eksik listesiyle patla.
    let missing = MAIN_NAVIGATION.map((i) => `${i.name} (${i.path})`);
    let last = new Set();
    await expect(async () => {
      last = await navNames(page);
      missing = MAIN_NAVIGATION.filter((i) => !isReachable(last, i)).map((i) => `${i.name} (${i.path})`);
      expect(missing, `menüde eksik: ${missing.join(', ')}`).toEqual([]);
    }).toPass({ timeout: MENU_COMPLETE_BUDGET_MS, intervals: [200, 300, 500] });

    // Bütçe içinde tamamlandı (yukarıdaki toPass geçtiyse). Ek güvence:
    expect(
      missing,
      `ORPHAN/MENÜ: şu öğeler ${MENU_COMPLETE_BUDGET_MS}ms içinde menüde tıklanabilir olmadı ` +
        `(menüdekiler: ${[...last].join(', ') || '—'}):\n  - ${missing.join('\n  - ')}`,
    ).toEqual([]);
  });
});
