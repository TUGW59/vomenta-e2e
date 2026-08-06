// @ts-check
import { test, expect } from '../fixtures/test.js';
import { gotoApp, scanOverflow, waitForUiToSettle } from '../helpers.js';

/**
 * RAPORLAR — DİNAMİK ROTA TARAMASI (yeni raporlar TEST YAZILMADAN kapsansın)
 *
 * Kenar menüsündeki tüm `/reports/*` linkleri **çalışma zamanında** keşfedilir; her birine
 * baseline uygulanır: sayfa gerçekten yükleniyor (login'e düşmüyor) + görünür h1 + document
 * düzeyinde yatay taşma yok + console/ağ temiz. Böylece ileride **eklenecek** bir rapor sayfası,
 * kimse test yazmasa bile bu guard'a takılır (yükleme/taşma/sessiz-hata regresyonu).
 *
 * NOT: Bu, sayfaya-özgü derin 3-katman/i18n testinin YERİNE geçmez; onları tetikleyen bir
 * ağ olarak baseline güvenlik sağlar. Derin kapsam için sayfa `tested-pages.js`'e tescil edilir.
 */
test.describe('Raporlar — dinamik rota taraması @regression @clean', () => {
  test('kenar menüsündeki her /reports/* rotası baseline geçiyor', async ({ page, diagnostics }) => {
    await gotoApp(page, '/reports/dashboards'); // kenar menüsünü yükle
    await waitForUiToSettle(page);

    // Kenar çubuğundaki Rapor alt-linkleri geç render olabilir → görünene kadar bekle.
    const reportLinks = page.locator('nav a[href*="/reports/"]');
    await expect.poll(() => reportLinks.count(), { timeout: 15000 }).toBeGreaterThanOrEqual(5);

    const routes = await reportLinks.evaluateAll((els) =>
      [...new Set(
        els
          .map((e) => {
            try { return new URL(e.href).pathname; } catch { return ''; }
          })
          .filter((p) => /^\/reports\/[^/]+$/.test(p))
      )]
    );
    expect(routes.length, 'kenar menüsünde en az birkaç rapor rotası keşfedilmeli').toBeGreaterThanOrEqual(5);

    for (const route of routes) {
      await gotoApp(page, route);
      await waitForUiToSettle(page);
      const h1 = page.getByRole('heading', { level: 1 }).first();
      await expect(h1, `[${route}] görünür h1`).toBeVisible({ timeout: 20000 });
      await expect(h1, `[${route}] h1 boş değil`).toHaveText(/\S/);
      const { horizontal, offenders } = await scanOverflow(page, { axis: 'x' });
      expect(horizontal, `[${route}] document yatay taşıyor. İlk taşanlar: ${JSON.stringify(offenders.slice(0, 3))}`).toBe(false);
    }

    // Hiçbir rotada (allowlist dışı) console-error / failed-request / 5xx olmamalı.
    diagnostics.assertClean();
  });
});
