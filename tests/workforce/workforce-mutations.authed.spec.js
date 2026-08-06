// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * İŞ GÜCÜ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Bunlar 3 katmanlı standardın L3 katmanıdır: kontrolün amacı KALICI kayıtla
 * gerçekleşiyor mu (workforce.authed.spec.js'te L1/L2 var, L3 buraya taşındı).
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — `ALLOW_MUTATING_TESTS=true` yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnızca ayrılmış staging tenant'ında `npm run test:mutation`.
 *
 * GÜVENLİK: her test `mutationGuard` ile başlar. `testEntity.create`, rollback'i
 *   create öncesi kaydeder ve ayrılmış haftanın vardiya sayısını `0→1→0`
 *   doğrular. Endpoint'ler canlıda doğrulandı (POST → 201, DELETE → 204).
 */
test.describe('İş Gücü — L3 mutasyonları @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test('L3 görev OK: Add Shift kalıcı vardiya oluşturuyor (POST /wfm/schedules)', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('İş Gücü: vardiya oluşturma');
    const wf = app.workforce;
    await wf.open();

    await testEntity.create({
      label: 'workforce-shift',
      prefixNaReason:
        'N/A: WFM schedule DTO/UI vardiyaya kullanıcı tanımlı ad veya iş anahtarı vermiyor; ayrılmış haftanın toplam vardiya sayısı izleniyor.',
      baseline: () => wf.automationShiftCount(),
      cleanup: () => wf.deleteFirstShift(),
      action: () => wf.createDefaultShift(),
    });

    // Kalıcı kayıt gözlemlenebilir: hücre vardiyayı gösteriyor ("09:00 - 17:00")
    await expect(wf.scheduleCell()).toContainText(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/);
  });

  test('L3 görev OK: Publish Schedule taslağı yayınlıyor ("Draft" kalkıyor)', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('İş Gücü: çizelge yayınlama (Publish Schedule)');
    const wf = app.workforce;
    await wf.open();

    await testEntity.create({
      label: 'workforce-schedule-rollback',
      prefixNaReason:
        'N/A: WFM schedule DTO/UI vardiyaya kullanıcı tanımlı ad veya iş anahtarı vermiyor; ayrılmış haftanın toplam vardiya sayısı izleniyor.',
      baseline: () => wf.automationShiftCount(),
      cleanup: () => wf.deleteFirstShift(),
      action: () => wf.createDefaultShift(),
    });

    // Yayın öncesi: taslak
    await expect(wf.scheduleCell()).toContainText('Draft');
    // Yayınla → görev gözlemlenebilir: "Draft" rozeti kalkar (yayınlandı)
    await wf.publishButton().click();
    await expect(wf.scheduleCell()).not.toContainText('Draft', { timeout: 10000 });
  });
});
