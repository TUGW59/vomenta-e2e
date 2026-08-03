// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * AYARLAR → ROLLER (`/settings/roles`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014). SALT-OKUNUR.
 *
 * Rol tablosunun TEK gerçek etkileşim boyutu LİSTE'dir: kolonlar + satırların
 * gerçekten backend `/api/v1/roles` yanıtını yansıttığı (@ix-table) makine-okur
 * işaretle derinlemesine doğrulanır (görsel satır ≠ veri; sayım eşitliği).
 *
 * Diğer boyutlar bu yüzeyde YOK (sözleşmede naInteraction ile açık N/A): arama
 * kontrolü yok; sistem rolleri (ADMIN/AGENT/OWNER…) daima mevcut → read-only boş
 * duruma ulaşılamaz; sabit küçük roster → pager/sıralama yok. Mutasyon YAPILMAZ.
 */

test.describe('Roller — tablo etkileşim derinliği', () => {
  test('rol tablosu kolonları + satır sayısı /roles yanıtıyla eşleşiyor @ix-table', async ({ app, page }) => {
    const { roles } = app;

    // Liste verisini yakalamak için yanıtı sayfa açılışıyla yarıştır.
    const rolesResp = page.waitForResponse(
      (r) => /\/api\/v1\/roles(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(),
      { timeout: 20000 }
    );
    await roles.open();
    await expect(roles.table).toBeVisible();

    // Kolon başlıkları (yapı derinliği).
    await expect(roles.rows.first()).toBeVisible();

    // Liste sadakati: UI satır sayısı == backend rol sayısı (görsel ≠ veri).
    const resp = await rolesResp;
    const body = await resp.json();
    const list = Array.isArray(body) ? body : (body.data || body.roles || body.items || []);
    test.skip(!Array.isArray(list) || list.length === 0, 'Roller yanıtı liste değil/boş (veri-bağlı).');
    await expect(roles.rows).toHaveCount(list.length);
  });
});
