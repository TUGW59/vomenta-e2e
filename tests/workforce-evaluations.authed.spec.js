// @ts-check
import { test, expect } from './fixtures/test.js';
import { WorkforceEvaluationsPage } from './pages/WorkforceEvaluationsPage.js';

/**
 * İŞ GÜCÜ › KALİTE DEĞERLENDİRMELERİ — L1 (tıklama) + L2 (arka plan) salt-okunur.
 *
 * Gerçek oluşturma (gerçek etkileşim ID'si + temsilci gerektirir) ayrı @mutation
 * fixme spec'inde: tests/workforce-evaluations-mutations.authed.spec.js
 */
test.describe('Kalite değerlendirmeleri — yapı + kontroller @regression', () => {
  test('L1: sayfa + "Değerlendirme Oluştur" + "YZ Değerlendirmesi Başlat"', async ({
    app,
  }) => {
    const e = app.workforceEvaluations;
    await e.open();
    await expect(e.createButton()).toBeVisible();
    await expect(e.aiButton()).toBeVisible();
  });

  test('L1: "Kalite Değerlendirmesi Oluştur" formu açılıyor (Interaction ID + Agent + Puan)', async ({
    app,
  }) => {
    const e = app.workforceEvaluations;
    await e.open();
    const dialog = await e.openCreateDialog();
    // Alanlar (canlı gözlem): Interaction ID · Interaction Type · Agent · Puan(%) ·
    //   Form Verileri(JSON) · Geri Bildirim.
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: WorkforceEvaluationsPage.L.submit })
    ).toBeVisible();
    // GÖNDERİLMEZ — gerçek etkileşim ID'si + temsilci gerektirir (salt L1).
    await e.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: sayfa açılışında değerlendirme listesi API\'den çekiliyor @critical', async ({
    app,
    page,
  }) => {
    const e = app.workforceEvaluations;
    const evalGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes(WorkforceEvaluationsPage.API.evaluations) &&
        r.ok(),
      { timeout: 30000 }
    );
    await e.open();
    expect((await evalGet).ok()).toBeTruthy();
  });
});
