// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp, waitForUiToSettle } from './helpers.js';
import { buildUserInvite } from './data/factories.js';

/**
 * BULGU 6 — VERİ-DEĞİŞTİREN REPRODUKSİYON (davet oluşturarak)
 *
 * Salt-okunur sürüm known-bugs.authed.spec.js içinde (mevcut davetleri kontrol eder).
 * Bu test bulguyu AKTİF olarak üretir: yeni bir kullanıcı davet eder, ardından
 * davet satırının ayırt edilebilir (e-posta + "Beklemede") göründüğünü doğrular.
 *
 * GÜVENLİK:
 *   - @mutation etiketi + mutationGuard → production'da (app.vomenta.com) çalışmaz.
 *     Ayrıca playwright.config.js grepInvert @mutation ile prod'da tamamen dışlanır.
 *   - cleanup ile davet her durumda (test fail olsa da) geri alınır.
 *   - Yalnızca staging'de, BASE_URL + ALLOW_MUTATING_TESTS=true ile koşar.
 *
 * DURUM: test.fixme — davet akışının seçicileri ve daveti geri alma (revoke)
 *   endpoint'i STAGING'de bir kez teyit edilmeli. Teyit sonrası aşağıdaki iki
 *   TODO doldurulup `test.fixme(...)` satırı kaldırılır.
 */
test.describe('Vomenta - Bulgu 6 daveti üreterek doğrula @regression @known-bug @mutation', () => {
  test.fixme(
    true,
    'Staging seçici/endpoint teyidi bekliyor: davet dialog alanları ve daveti geri alma (revoke) yolu.'
  );

  test('yeni davet listede e-posta + "Beklemede" ile ayırt edilebilir görünmeli', async ({
    app,
    page,
    api,
    mutationGuard,
    cleanup,
  }) => {
    mutationGuard('Bulgu 6: kullanıcı daveti oluşturma');
    const invite = buildUserInvite();

    await gotoApp(page, '/settings');
    await page.getByRole('tab', { name: /Users|Kullanıcılar/i }).click();
    await waitForUiToSettle(page);

    // Daveti oluştur (UI).
    await page.getByRole('button', { name: /Invite User|Kullanıcı Davet Et|Davet Et/i }).click();
    await page.getByLabel(/Email|E-posta/i).fill(invite.email);
    await page.getByRole('button', { name: /Send Invite|Daveti Gönder|Gönder/i }).click();

    // TEMİZLİK: daveti geri al. TODO: staging'de doğru revoke yolunu teyit et.
    cleanup(async () => {
      // Öncelik API; yoksa UI'dan satırı kaldır.
      await api.delete(`/api/settings/invites/${encodeURIComponent(invite.email)}`).catch(async () => {
        const row = page.getByRole('row').filter({ hasText: invite.email });
        if (await row.count()) {
          await row
            .getByRole('button', { name: /Revoke|Remove|Delete|Geri Al|Kaldır|Sil/i })
            .first()
            .click()
            .catch(() => {});
        }
      });
    });

    // Beklenen (doğru davranış): satır davet e-postasını ve "Beklemede" durumunu gösterir,
    // "Invited User" + boş e-posta placeholder'ı DEĞİL.
    const inviteRow = page.getByRole('row').filter({ hasText: invite.email });
    await expect(inviteRow, 'davet satırı e-posta ile görünmüyor').toBeVisible();
    await expect(inviteRow).toContainText(/Pending|Beklemede/i);
    await expect(inviteRow).not.toContainText('Invited User');
  });
});
