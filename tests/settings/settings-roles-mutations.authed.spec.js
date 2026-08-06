// @ts-check
import { test, expect } from '../fixtures/test.js';
import { RolesPage } from '../pages/RolesPage.js';

/**
 * AYARLAR › ROL YÖNETİMİ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (create + delete, zero-orphan): benzersiz otomasyon adlı bir CUSTOM rol oluştur →
 * listede görün → satır aksiyonundan sil. Sistem rollerine (ADMIN/AGENT/OWNER…) DOKUNULMAZ;
 * yalnız oluşturulan custom rol (silinebilir) hedeflenir.
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — ALLOW_MUTATING_TESTS=true yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnızca ayrılmış staging tenant'ında `npm run test:mutation`.
 *
 * GÜVENLİK: mutationGuard ile başlar; testEntity.cleanup oluşturulan rolü ADINA göre bulup
 *   siler (test ortada patlasa da). Sistem rolleri silme butonu DISABLED olduğundan asla silinmez.
 */
const uniqueRoleName = () => `PW_AUTO_ROLE_${Date.now().toString(36).toUpperCase()}`;

test.describe('Roller — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: custom rol create+delete (POST/DELETE /roles) ve orphan sayacı ayrılmış staging tenant\'ında doğrulanmadı.');

  test('L3 görev OK: custom rol oluştur → listede görün → sil', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Roller: custom rol oluştur + sil');
    const r = app.roles;
    const name = uniqueRoleName();

    await r.open();
    // Bulletproof cleanup: ne olursa olsun bu addaki rolü sil (yalnızca oluşturulan).
    testEntity.cleanup(async () => {
      await r.deleteRoleByName(name);
    }, `role:${name}`);

    // 1) OLUŞTUR — GERÇEK POST /roles
    await r.createRole({ name, description: 'Playwright otomasyon — geçici' });

    // 2) KALICILIK (L3): rol listede görünüyor
    await r.open();
    await expect(r.roleRow(name)).toBeVisible({ timeout: 10000 });

    // 3) SİL — satır aksiyonundan (custom rol silinebilir) → listede yok
    await r.deleteRoleByName(name);
    await r.open();
    await expect(r.roleRow(name)).toHaveCount(0, { timeout: 10000 });
  });
});
