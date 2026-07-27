// @ts-check
import { test, expect } from './fixtures/test.js';
import { TicketsPage } from './pages/TicketsPage.js';

/**
 * Form doğrulama testleri (girişli).
 * ÖNEMLİ: Kayıt OLUŞTURULMAZ — sadece boş/geçersiz gönderimde doğrulama davranışı
 * test edilir (doğrulama zaten kaydı engeller), sonra form kapatılır.
 */
test.describe('Vomenta - Form doğrulama (Create Ticket)', () => {
  test('Create Ticket formu beklenen alanlarla açılıyor', async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.open();

    const dialog = await tickets.openCreateForm();
    await expect(dialog.getByRole('heading', { name: 'Create Ticket' })).toBeVisible();
    await expect(dialog.getByPlaceholder('Brief description of the issue')).toBeVisible();
    await expect(dialog.getByPlaceholder('Detailed description...')).toBeVisible();
  });

  test('boş gönderim "Subject is required." uyarısı veriyor ve kaydetmiyor', async ({ page }) => {
    const tickets = new TicketsPage(page);
    await tickets.open();

    const dialog = await tickets.openCreateForm();
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
