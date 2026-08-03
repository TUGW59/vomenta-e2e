// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * VOICE › Telefon Numaraları — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (0→1→0): bir DID'i bir kuyruğa ATA (Assign) → atama L2 PUT/POST 2xx + L3 satırda
 *   "Assigned" → teardown'da GERİ AL (Unassign). Assign↔Unassign doğal olarak tersinir.
 * `testEntity.create` create-öncesi atama durumunu kaydeder ve rollback'i yapısal garanti eder.
 *
 * DURUM: test.fixme — atama KALICI değişir; production salt-okunur. Assign/Unassign uçları +
 *   dialog/seçici seçicileri staging'de teyit edilecek, sonra fixme kaldırılacak.
 * NOT: "Request Number" (provider'a yeni numara talebi) ve "Release" tersinir DEĞİL →
 *   mutation kapsamına ALINMAZ; yalnız tersinir Assign↔Unassign test edilir.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da grepInvert ile hiç çalışmaz.
 */
test.describe('Telefon Numaraları — L3 mutasyonu (staging) @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: DID Assign/Unassign uçları + atama dialog seçicileri.');

  test('L3 görev OK: DID ata → "Assigned" doğrula → atamayı geri al (Unassign)', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Voice: DID ata + geri al');
    const d = app.voiceSub('dids');
    await d.open();

    await testEntity.create({
      label: 'voice-did-assign',
      key: 'did-assign',
      // TODO(staging): hedef DID satırının mevcut atama durumunu say/oku (0→1→0 baseline).
      baseline: async () => d.page.getByRole('button', { name: /^Unassign$/ }).count(),
      // TODO(staging): atamayı geri al (Unassign → 2xx).
      cleanup: async () => {
        const un = d.page.getByRole('button', { name: /^Unassign$/ }).first();
        if (await un.count()) await un.click();
      },
      // TODO(staging): Assign akışını çalıştır (kuyruk/IVR seç → Assign → PUT/POST 2xx).
      action: async () => {
        await d.page.getByRole('button', { name: /^Assign$/ }).first().click();
      },
    });

    await expect(d.page.getByText(/Assigned/i).first()).toBeVisible();
  });
});
