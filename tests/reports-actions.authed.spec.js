// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';

/**
 * Reports eylem butonlarının FONKSİYONEL testi — tıklayınca vadettiğini yapıyor mu.
 * ÖNEMLİ: Hiçbir pano/rapor/zamanlama OLUŞTURULMAZ.
 * - "New Dashboard" / "Custom Report" ilgili sayfaya GEZİNİR.
 * - "Schedule a Report" bir form (dialog) açar; form iptal edilir (kaydedilmez).
 */
test.describe('Vomenta - Reports eylem butonları (fonksiyonel)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, '/reports');
  });

  test('"New Dashboard" pano sayfasına ("Dashboards") götürüyor', async ({ page }) => {
    await page.getByRole('button', { name: 'New Dashboard', exact: true }).click();
    await assertDestinationLoaded(page, { path: '/reports/dashboards', heading: 'Dashboards' });
  });

  test('"Custom Report" pano/rapor sayfasına ("Dashboards") götürüyor', async ({ page }) => {
    await page.getByRole('button', { name: 'Custom Report', exact: true }).click();
    await assertDestinationLoaded(page, { path: '/reports/dashboards', heading: 'Dashboards' });
  });

  // Form gönderim sonucu standardı (AGENTS.md): submit SONUCU (başarı/hata) burada
  // N/A — kaydetmek prod'da bir zamanlama OLUŞTURUR (mutation) ve ajanlara bildirim
  // gönderebilir. Submit yolu staging'de bir mutation testine bırakılır; burada
  // yalnızca formun açıldığı/iptal edilebildiği (salt-okunur) doğrulanır.
  test('"Schedule a Report" formu açılıyor ve iptal edilebiliyor', async ({ page }) => {
    await page.getByRole('button', { name: 'Schedule a Report', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Schedule a Report' })).toBeVisible();

    // Zamanlamayı OLUŞTURMADAN iptal et.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});
