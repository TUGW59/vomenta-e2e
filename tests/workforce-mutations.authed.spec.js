// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * İŞ GÜCÜ — VERİ-DEĞİŞTİREN AKIŞLAR (staging)
 *
 * Bu akışlar canlı panelde birer mutation'dır ve PROD'da çalıştırılmaz:
 *   - @mutation etiketi + mutationGuard → production'da engelli
 *     (playwright.config.js grepInvert @mutation ile prod'dan tamamen dışlanır).
 *   - cleanup ile oluşturulan kayıt geri alınır.
 *
 * DURUM: test.fixme — staging'de (a) oluşturulan vardiyayı SİLME ve (b) çizelge
 *   YAYININI geri alma (unpublish) yolları teyit edilince açılacak. "Publish
 *   Schedule" ajanlara bildirim gönderebildiği için yalnızca izole test
 *   ortamında koşmalıdır.
 */
test.describe('Vomenta - Workforce mutasyonları @regression @mutation', () => {
  test.fixme(true, 'Staging teyidi bekliyor: vardiya silme ve çizelge yayınını geri alma yolları.');

  test('vardiya oluşturunca çizelgede görünüyor', async ({ page, mutationGuard, cleanup }) => {
    mutationGuard('İş Gücü: vardiya oluşturma');
    await gotoApp(page, '/workforce');
    await expect(page.getByRole('heading', { name: 'Workforce Management' })).toBeVisible({ timeout: 30000 });

    // Add Shift formunu aç (submit dahil)
    await page.locator('main table td .border-dashed').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add Shift' })).toBeVisible();
    // Varsayılan 09:00–17:00 ile kaydet
    await dialog.getByRole('button', { name: /Save/i }).click();

    // TEMİZLİK: oluşturulan vardiyayı sil. TODO(staging): doğru silme yolunu teyit et.
    cleanup(async () => {
      const shift = page.locator('main table td').filter({ hasText: /\d{1,2}:\d{2}/ }).first();
      if (await shift.count()) {
        await shift.click().catch(() => {});
        await page.getByRole('button', { name: /Delete|Remove|Sil/i }).first().click().catch(() => {});
      }
    });

    // Vardiya hücrede görünmeli (09:00 gibi bir saat)
    await expect(page.locator('main table').getByText(/\d{1,2}:\d{2}/).first()).toBeVisible();
  });

  test('çizelge yayınlanınca durum güncelleniyor', async ({ page, mutationGuard }) => {
    mutationGuard('İş Gücü: çizelge yayınlama (Publish Schedule)');
    await gotoApp(page, '/workforce');
    await expect(page.getByRole('heading', { name: 'Workforce Management' })).toBeVisible({ timeout: 30000 });
    // NOT: Publish ajanlara bildirim gönderebilir; yalnızca staging'de.
    await page.getByRole('button', { name: /Publish Schedule/i }).click();
    // Beklenen: yayın onayı / durum değişimi (staging'de gerçek metinle netleştirilecek).
    await expect(page.getByText(/Published|Yayınland|scheduled/i).first()).toBeVisible();
  });
});
