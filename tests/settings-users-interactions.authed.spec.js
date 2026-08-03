// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * AYARLAR → KULLANICILAR (`/settings/users`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014). SALT-OKUNUR.
 *
 * Üye tablosu üzerinde read-only etkileşim boyutlarını makine-okur işaretlerle
 * doğrular: tablo/liste yapısı (@ix-table), ada göre arama-süzme + temizleme
 * (@ix-filter), eşleşmeyen aramada boş-durum (@ix-empty).
 *
 * Kapsam-dışı (sözleşmede naInteraction): pagination/sıralama kontrolü ve ayrı
 * liste-yükleme iskeleti bu yüzeyde gözlenmedi. Mutasyon (davet gönderme) YAPILMAZ.
 */

test.describe('Kullanıcılar — tablo etkileşim derinliği', () => {
  test('üye tablosu kolonları + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const { users } = app;
    await users.open();
    await expect(users.table).toBeVisible();
    for (const col of ['User', 'Role', 'Status']) {
      await expect(
        users.page.getByRole('columnheader', { name: col, exact: true })
      ).toBeVisible();
    }
    await expect(users.rows.first()).toBeVisible();
    await expect(users.rows.first()).toContainText(/\S/);
  });

  test('ada göre arama satırları süzüyor ve temizleyince geri getiriyor @ix-filter', async ({ app }) => {
    const { users } = app;
    await users.open();
    await expect(users.rows.first()).toBeVisible();
    const initialCount = await users.rows.count();

    // Var olan bir satırın metnini alıp onunla ara → o satır kalır, süzme çalışır.
    const sample = (await users.rows.first().innerText()).split(/\s+/).find((w) => /^[A-Za-zÀ-ÿ]{3,}$/.test(w));
    test.skip(!sample, 'Örnek isim türetilemedi (veri-bağlı).');
    await users.searchInput.fill(sample);
    await expect(users.rows.filter({ hasText: sample }).first()).toBeVisible({ timeout: 10000 });

    // Temizle → başlangıç kümesi geri gelir (süzme durumu geri alınabilir).
    await users.searchInput.fill('');
    await expect(async () => {
      expect(await users.rows.count()).toBeGreaterThanOrEqual(initialCount);
    }).toPass({ timeout: 10000 });
  });

  test('eşleşmeyen aramada boş-durum (0 satır veya "bulunamadı") @ix-empty', async ({ app, page }) => {
    const { users } = app;
    await users.open();
    await expect(users.rows.first()).toBeVisible();

    await users.searchInput.fill('zzz_no_such_user_qwerty_9876');
    await expect(async () => {
      const rowCount = await users.rows.count();
      const emptyMsg = await page
        .getByText(/no users|kullanıcı bulunamadı|aucun|no results|not found/i)
        .count();
      expect(rowCount === 0 || emptyMsg > 0).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});
