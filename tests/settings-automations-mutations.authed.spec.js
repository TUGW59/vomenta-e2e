// @ts-check
import { test, expect } from './fixtures/test.js';
import { AutomationsPage } from './pages/AutomationsPage.js';

/**
 * AYARLAR › OTOMASYON — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: New Rule ile benzersiz adlı kural oluştur → tabloda görün → sil.
 *
 * DURUM: test.fixme — Kurallar tablosu şu an BOŞ (canlıda kural yok); satır silme aksiyonu
 *   (Actions kolonu) yalnız kural varken görünür ve prod'da doğrulanamadı. Staging'de kural
 *   oluşturma (POST) + satır silme (DELETE) yolu teyit edilip cleanup doldurulacak, sonra
 *   test.fixme kalkacak. Fabrikasyon yerine açık N/A (orphan-sıfır standardı).
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueRuleName = () => `PW_AUTO_RULE_${Date.now().toString(36).toUpperCase()}`;

test.describe('Otomasyon — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: kural oluşturma + satır silme yolu (tablo prod\'da boş).');

  test('L3 görev OK: kural oluştur → tabloda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Otomasyon: kural oluştur + sil');
    const a = app.automations;
    const name = uniqueRuleName();
    await a.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan kuralı satır aksiyonundan / DELETE ile sil.
    }, `rule:${name}`);

    const dialog = await a.openNewRuleDialog();
    await dialog.getByRole('textbox').first().fill(name);
    // TODO(staging): Trigger/Actions doldur → Save Rule → POST 2xx → tabloda gör → sil.
    await expect(dialog).toBeVisible();
  });
});
