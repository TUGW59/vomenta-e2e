// @ts-check
import { test, expect } from '../fixtures/test.js';
import { SlaPage } from '../pages/SlaPage.js';

/**
 * AYARLAR › SLA POLİTİKALARI — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: New Policy ile benzersiz adlı SLA politikası oluştur → tabloda görün → sil.
 *
 * DURUM: test.fixme — Satır aksiyon butonları (edit/delete) **aria-label taşımıyor** (button-name
 *   borcu); prod salt-okunur olduğundan hangi ikonun "sil" olduğu + onay akışı doğrulanamadı.
 *   Staging'de silme yolu (satır ikon / DELETE /api/v1/sla/{id}) teyit edilip cleanup doldurulacak.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueName = () => `PW_AUTO_SLA_${Date.now().toString(36).toUpperCase()}`;

test.describe('SLA — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: satır silme yolu (aksiyon ikonları aria-label\'sız).');

  test('L3 görev OK: SLA politikası oluştur → tabloda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('SLA: politika oluştur + sil');
    const s = app.sla;
    const name = uniqueName();
    await s.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan politikayı satır aksiyonundan / DELETE ile sil.
    }, `sla:${name}`);

    const dialog = await s.openNewPolicyDialog();
    await dialog.getByRole('textbox').first().fill(name);
    // TODO(staging): Create policy → POST 2xx → tabloda gör → sil → yok.
    await expect(dialog).toBeVisible();
  });
});
