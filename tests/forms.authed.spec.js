// @ts-check
import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Form doğrulama testleri (girişli).
 * ÖNEMLİ: Kayıt OLUŞTURULMAZ — sadece boş/geçersiz gönderimde doğrulama davranışı
 * test edilir (doğrulama zaten kaydı engeller), sonra form kapatılır.
 */

test.describe('Vomenta - Form doğrulama (Create Ticket)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, '/tickets');
    await expect(
      page.getByRole('button', { name: 'Create Ticket', exact: true })
    ).toBeVisible({ timeout: 30000 });
  });

  test('Create Ticket formu beklenen alanlarla açılıyor', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Ticket', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Create Ticket' })).toBeVisible();
    await expect(dialog.getByPlaceholder('Brief description of the issue')).toBeVisible();
    await expect(dialog.getByPlaceholder('Detailed description...')).toBeVisible();
  });

  test('boş gönderim "Subject is required." uyarısı veriyor ve kaydetmiyor', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Ticket', exact: true }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Alanlar boşken kaydetmeyi dene (dialog içindeki "Create Ticket" gönder butonu).
    await dialog.getByRole('button', { name: 'Create Ticket', exact: true }).click();

    // Doğrulama uyarısı görünür ve form açık kalır (kayıt oluşmaz).
    await expect(page.getByText('Subject is required.')).toBeVisible();
    await expect(dialog).toBeVisible();

    // Temizlik: formu iptal et.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});
