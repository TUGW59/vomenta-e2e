// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * İŞ GÜCÜ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Bunlar 3 katmanlı standardın L3 katmanıdır: kontrolün amacı KALICI kayıtla
 * gerçekleşiyor mu (workforce.authed.spec.js'te L1/L2 var, L3 buraya taşındı).
 *
 * ÇİFT KİLİT (config/environment.js · playwright.config.js):
 *   Kilit 1 — `ALLOW_MUTATING_TESTS=true` yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — CANLI tenant'a yazmak için ayrıca `ALLOW_PROD_MUTATIONS=true`.
 *   Çalıştırma: `npm run test:mutation` (staging) / `npm run test:mutation:prod` (canlı).
 *
 * GÜVENLİK: her test `mutationGuard` ile başlar ve `cleanup` ile oluşturduğu
 *   vardiyayı SİLER (DELETE /wfm/schedules/{id}). Endpoint'ler canlıda doğrulandı
 *   (POST → 201, DELETE → 204). Yalnızca ayrılmış test hesabında koşmalı.
 */
test.describe('İş Gücü — L3 mutasyonları @regression @mutation', () => {
  test('L3 görev OK: Add Shift kalıcı vardiya oluşturuyor (POST /wfm/schedules)', async ({
    app,
    mutationGuard,
    cleanup,
  }) => {
    mutationGuard('İş Gücü: vardiya oluşturma');
    const wf = app.workforce;
    await wf.open();
    await wf.deleteFirstShift(); // önceki koşudan artık kalmışsa temizle

    // Oluştur → cleanup'ı HEMEN kaydet (test sonrası her hâlde silinsin)
    cleanup(async () => {
      await wf.deleteFirstShift();
    });
    await wf.createDefaultShift();

    // Kalıcı kayıt gözlemlenebilir: hücre vardiyayı gösteriyor ("09:00 - 17:00")
    await expect(wf.scheduleCell()).toContainText(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/);
  });

  test('L3 görev OK: Publish Schedule taslağı yayınlıyor ("Draft" kalkıyor)', async ({
    app,
    mutationGuard,
    cleanup,
  }) => {
    mutationGuard('İş Gücü: çizelge yayınlama (Publish Schedule)');
    const wf = app.workforce;
    await wf.open();
    await wf.deleteFirstShift();

    cleanup(async () => {
      await wf.deleteFirstShift();
    });
    await wf.createDefaultShift();

    // Yayın öncesi: taslak
    await expect(wf.scheduleCell()).toContainText('Draft');
    // Yayınla → görev gözlemlenebilir: "Draft" rozeti kalkar (yayınlandı)
    await wf.publishButton().click();
    await expect(wf.scheduleCell()).not.toContainText('Draft', { timeout: 10000 });
  });
});
