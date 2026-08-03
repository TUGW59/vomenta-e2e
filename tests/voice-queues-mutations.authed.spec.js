// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * VOICE › Kuyruklar — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (0→1→0): "Create Queue" dialogunu doldur → oluştur (POST 2xx) → listede doğrula →
 * teardown'da oluşturulan kuyruğu sil (DELETE). Ayrılmış staging tenant'ta güvenli.
 * `testEntity.create` create-öncesi baseline'ı kaydeder ve 0→1→0 rollback'i yapısal garanti eder.
 *
 * DURUM: test.fixme — kuyruk oluşturmak KALICI kayıt üretir; production salt-okunur.
 *   Güvenli 0→1→0 yalnız staging'de yapılır; POST/DELETE uçları + dialog alan seçicileri
 *   (9 alan) staging'de teyit edilecek, sonra fixme kaldırılacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da grepInvert ile hiç çalışmaz.
 */
test.describe('Kuyruklar — L3 mutasyonu (staging) @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: queue create POST + delete DELETE uçları + dialog alan seçicileri.');

  test('L3 görev OK: kuyruk oluştur → listede doğrula → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Voice: kuyruk oluştur + sil');
    const q = app.voiceSub('queues');
    await q.open();

    const name = `E2E-TEST-SILINECEK-queue-${Date.now()}`;
    await testEntity.create({
      label: `voice-queue:${name}`,
      key: name,
      // TODO(staging): kuyruk listesinden otomasyon/test kayıtlarını say (0→1→0 baseline).
      baseline: async () => q.page.getByRole('button', { name: /Queue Settings$/ }).count(),
      // TODO(staging): oluşturulan kuyruğu "Delete queue <name>" ile sil (DELETE 2xx).
      cleanup: async () => {
        const del = q.page.getByRole('button', { name: `Delete queue ${name}` });
        if (await del.count()) await del.first().click();
      },
      // TODO(staging): Create Queue dialogunu aç → adı+gerekli alanları doldur → Kaydet (POST 2xx).
      action: async () => {
        await q.page.getByRole('button', { name: 'Create Queue', exact: true }).click();
        await expect(q.page.getByRole('dialog')).toBeVisible();
      },
    });

    // L3: yeni kuyruk kartı listede görünür.
    await expect(q.page.getByText(name, { exact: true })).toBeVisible();
  });
});
