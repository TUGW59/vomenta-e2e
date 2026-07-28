// @ts-check
import { test, expect } from './fixtures/test.js';
import { DashboardsPage } from './pages/DashboardsPage.js';

/**
 * RAPORLAR › PANOLAR — VERİ-DEĞİŞTİREN AKIŞLAR (staging)
 *
 * Bu akışlar canlı panelde birer mutation'dır ve PROD'da çalıştırılmaz:
 *   - @mutation etiketi + mutationGuard → production'da engelli
 *     (playwright.config.js grepInvert @mutation ile prod'dan tamamen dışlanır).
 *   - cleanup ile oluşturulan kayıt (pano) geri alınır (silinir).
 *
 * Bu spec, ana spec'teki Create/Duplicate/Delete için "N/A" bırakılan L2/L3 (mutation)
 * katmanlarını KAPATIR: pano gerçekten oluşuyor mu, çoğaltma bir kopya ekliyor mu,
 * silme kartı kaldırıyor mu — hepsi geri-alınabilir şekilde.
 *
 * DURUM: test.fixme — mutation'lar yalnızca AYRILMIŞ bir test hesabına/tenant'a karşı
 *   çalıştırılır (AGENTS.md temel ilke 3). Otomasyon şu an ortak/test hesabında; ayrı
 *   tenant + silme (Delete onay diyaloğu) seçicileri teyit edilince açılacak.
 *   Komut: `npm run test:mutation` (staging).
 */
test.describe('Panolar — mutasyonları @regression @mutation', () => {
  test.fixme(true, 'Ayrılmış test tenant + Create/Delete diyalog seçicileri teyidi bekliyor.');

  test.describe.configure({ mode: 'serial' }); // aynı canlı kaynağı paylaşırlar

  test('Create Dashboard: pano oluşunca özel listeye ekleniyor (L2+L3)', async ({ app, page, mutationGuard, cleanup }) => {
    mutationGuard('Panolar: pano oluşturma');
    const dashboards = app.dashboards;
    await dashboards.open();
    const before = await dashboards.customCardCount();

    const name = `e2e-temp-${Date.now()}`;
    await dashboards.createButton().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder(/My Custom Dashboard/i).fill(name);

    // L2: oluşturma POST'unu doğrula (uç staging'de teyit edilecek).
    const created = page.waitForResponse(
      (r) => r.url().includes(DashboardsPage.API.list) && r.request().method() === 'POST' && r.ok(),
      { timeout: 15000 }
    );
    await dialog.getByRole('button', { name: /Create|Save/i }).click();
    await created;

    // TEMİZLİK: oluşturulan panoyu sil. TODO(staging): Delete onay akışını teyit et.
    cleanup(async () => {
      const card = page.locator('div', { hasText: name }).last();
      await card.locator('button:has(svg.lucide-trash2)').click().catch(() => {});
      await page.getByRole('button', { name: /Delete|Sil|Confirm|Onayla/i }).last().click().catch(() => {});
    });

    // L3: yeni pano özel listede görünmeli (sayaç +1).
    await expect.poll(() => dashboards.customCardCount(), { timeout: 10000 }).toBe(before + 1);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  });

  test('Duplicate: çoğaltma bir "(Copy)" ekliyor (L2+L3)', async ({ app, page, mutationGuard, cleanup }) => {
    mutationGuard('Panolar: pano çoğaltma');
    const dashboards = app.dashboards;
    await dashboards.open();
    const before = await dashboards.customCardCount();

    await dashboards.customDuplicateButtons.first().click();

    cleanup(async () => {
      const copy = page.locator('div', { hasText: '(Copy)' }).last();
      await copy.locator('button:has(svg.lucide-trash2)').click().catch(() => {});
      await page.getByRole('button', { name: /Delete|Sil|Confirm|Onayla/i }).last().click().catch(() => {});
    });

    // L3: kart sayısı +1 ve bir "(Copy)" kartı beliriyor.
    await expect.poll(() => dashboards.customCardCount(), { timeout: 10000 }).toBe(before + 1);
    await expect(page.getByText(/\(Copy\)/).last()).toBeVisible();
  });

  test('Delete: silme kartı listeden kaldırıyor (L2+L3)', async ({ app, page, mutationGuard }) => {
    mutationGuard('Panolar: pano silme');
    const dashboards = app.dashboards;
    await dashboards.open();

    // Ön koşul: silinecek geçici bir pano OLUŞTUR (başka testin verisine dokunma).
    const name = `e2e-del-${Date.now()}`;
    await dashboards.createButton().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder(/My Custom Dashboard/i).fill(name);
    await dialog.getByRole('button', { name: /Create|Save/i }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 });
    const before = await dashboards.customCardCount();

    // Sil + onay (staging'de gerçek onay diyaloğu metniyle netleştirilecek).
    const card = page.locator('div', { hasText: name }).last();
    await card.locator('button:has(svg.lucide-trash2)').click();
    await page.getByRole('button', { name: /Delete|Sil|Confirm|Onayla/i }).last().click().catch(() => {});

    // L3: kart kayboluyor (sayaç -1).
    await expect.poll(() => dashboards.customCardCount(), { timeout: 10000 }).toBe(before - 1);
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});
