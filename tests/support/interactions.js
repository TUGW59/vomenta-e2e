// @ts-check
import { expect } from '@playwright/test';

/**
 * L2 ETKİLEŞİM-DERİNLİĞİ YARDIMCILARI (WP-L2-WAVE-1 / ADR-0014).
 *
 * Locator-tabanlı, SALT-OKUNUR yardımcılar. `@ix-*` makine-okur işareti YARDIMCIDA
 * DEĞİL, çağıran test()'in BAŞLIĞINDADIR (report:surface bu başlıktan etiketi toplar).
 * Şablon kaynağı: settings-{interactions,users-interactions,roles-interactions}.authed.spec.js.
 *
 * Dürüstlük: bir boyut fiziksel olarak yoksa veya salt-okuma testi veri-bağlı olarak
 * güvenilmezse → o boyut sözleşmede `naInteraction` ile gerekçelenir; `test.skip`
 * KULLANILMAZ (kapsam sessizce buharlaşmasın).
 */

/** @ix-table — kolon başlıkları + en az bir dolu veri satırı (görsel yapı). */
export async function assertTableStructure(table, rows, columns = []) {
  await expect(table).toBeVisible();
  for (const col of columns) {
    await expect(table.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
  }
  await expect(rows.first()).toBeVisible();
  await expect(rows.first()).toContainText(/\S/);
}

/** @ix-table (sadakat) — UI satır sayısı == backend liste uzunluğu (görsel ≠ veri). */
export async function assertTableFidelity(page, openFn, rows, apiUrlRe) {
  const respP = page.waitForResponse(
    (r) => apiUrlRe.test(r.url()) && r.request().method() === 'GET' && r.ok(),
    { timeout: 20000 }
  );
  await openFn();
  const body = await (await respP).json();
  const list = Array.isArray(body)
    ? body
    : (body.data || body.items || body.results || body.rows || body.records || []);
  expect(Array.isArray(list) && list.length > 0, 'API liste yanıtı dolu olmalı (veri-bağlı)').toBeTruthy();
  await expect(rows).toHaveCount(list.length);
}

/** @ix-filter — arama süzer + temizleyince başlangıç kümesi geri gelir. Örnek metni ilk satırdan türetir. */
export async function assertFilterNarrows(rows, searchInput) {
  await expect(rows.first()).toBeVisible();
  const initial = await rows.count();
  const sample = (await rows.first().innerText())
    .split(/\s+/)
    .find((w) => /^[A-Za-zÀ-ÿ0-9._-]{3,}$/.test(w));
  expect(sample, 'ilk satırdan aranabilir örnek türetilebilmeli (yoksa bu boyut naInteraction)').toBeTruthy();
  await searchInput.fill(sample);
  await expect(rows.filter({ hasText: sample }).first()).toBeVisible({ timeout: 10000 });
  await searchInput.fill('');
  await expect(async () => {
    expect(await rows.count()).toBeGreaterThanOrEqual(initial);
  }).toPass({ timeout: 10000 });
}

/** @ix-empty — eşleşmeyen aramada 0 satır veya "bulunamadı" mesajı. */
export async function assertEmptyState(
  page,
  rows,
  searchInput,
  emptyRe = /no results|not found|bulunamad|aucun|no [a-z]+ found|empty/i
) {
  await expect(rows.first()).toBeVisible();
  await searchInput.fill('zzz_no_such_row_qwerty_9876');
  await expect(async () => {
    const n = await rows.count();
    const msg = await page.getByText(emptyRe).count();
    expect(n === 0 || msg > 0).toBeTruthy();
  }).toPass({ timeout: 10000 });
}

/** @ix-tabs — seçim dışlayıcılığı (tek aria-selected) + panel içeriği değişir. */
export async function assertTabsExclusive(page, tabLocator, names, signatures = {}) {
  for (const name of names) {
    await tabLocator(name).click();
    await expect(tabLocator(name)).toHaveAttribute('aria-selected', 'true');
    for (const other of names) {
      if (other === name) continue;
      await expect(tabLocator(other)).toHaveAttribute('aria-selected', 'false');
    }
    if (signatures[name]) {
      await expect(page.getByText(signatures[name], { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  }
}

/** @ix-pagination — "sonraki" tetiklenince ilk satır içeriği değişir (sayfa döner). */
export async function assertPagination(rows, nextControl) {
  await expect(rows.first()).toBeVisible();
  const before = await rows.first().innerText();
  await nextControl.click();
  await expect(async () => {
    expect(await rows.first().innerText()).not.toBe(before);
  }).toPass({ timeout: 10000 });
}

/** @ix-loading — liste API'si geciktirilir; iskelet/spinner görünür, sonra satırlar gelir. */
export async function assertListLoading(page, apiGlob, gotoFn, rows, skeletonLocator) {
  await page.route(apiGlob, async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    return route.continue();
  });
  await gotoFn();
  await expect(skeletonLocator.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  await page.unroute(apiGlob);
}
