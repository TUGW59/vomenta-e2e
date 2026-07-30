// @ts-check
import { test, expect } from './fixtures/test.js';
import { TeamsPage } from './pages/TeamsPage.js';

/**
 * AYARLAR › EKİPLER — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo: Create Team ile benzersiz adlı ekip oluştur → kartlarda görün → sil.
 *
 * DURUM: test.fixme — Ekip kartının "Edit Team name" dialogunda **Delete/Sil kontrolü YOK**
 *   (yalnız Save). UI'da zero-orphan silme yolu bulunamadı; staging'de silme (kart menüsü ya da
 *   DELETE /api/v1/teams/{id}) teyidi gerekir. Teyit sonrası cleanup doldurulup test.fixme kalkar.
 *   (AGENTS.md orphan-sıfır standardı — fabrikasyon yerine açık N/A.)
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
const uniqueTeamName = () => `PW_AUTO_TEAM_${Date.now().toString(36).toUpperCase()}`;

test.describe('Ekipler — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: ekip silme yolu (Edit dialogunda Delete yok). Zero-orphan temizlik ucu gerekli.');

  test('L3 görev OK: ekip oluştur → kartlarda görün → sil', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Ekipler: ekip oluştur + sil');
    const t = app.teams;
    const name = uniqueTeamName();
    await t.open();

    testEntity.cleanup(async () => {
      // TODO(staging): oluşturulan ekibi sil (kart menüsü ya da DELETE /api/v1/teams/{id}).
    }, `team:${name}`);

    const dialog = await t.openCreateDialog();
    await dialog.getByRole('textbox').first().fill(name);
    // TODO(staging): Create → POST /teams 2xx → kartlarda görün → sil → yok.
    await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeEnabled();
  });
});
