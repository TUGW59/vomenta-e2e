// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * AYARLAR › BİLDİRİMLER — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (geri-döndürülebilir): bir kategori switch'inin durumunu oku → tersine çevir →
 * Save preferences → yeniden yükle → kalıcı doğrula → geri al.
 *
 * DURUM: test.fixme — Bildirim tercihi kullanıcı hesabına yazar (Save preferences); yalnız
 *   ayrılmış staging tenant'ında reversible switch-toggle + save endpoint teyidiyle koşulmalı.
 *   Prod salt-okunur; teyit sonrası test.fixme kalkar.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
test.describe('Bildirimler — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: kategori switch toggle + Save preferences + geri al.');

  test('L3 görev OK: kategori switch toggle → Save → kalıcı → geri al', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Bildirimler: kategori switch toggle + geri al');
    const n = app.notifications;
    await n.open();

    testEntity.cleanup(async () => {
      // TODO(staging): switch'i orijinal durumuna geri al + Save.
    }, 'notifications-restore');

    // TODO(staging): ilk kategori switch oku → toggle → Save preferences → yeniden yükle →
    // kalıcı doğrula → geri al.
    await expect(n.saveButton).toBeVisible();
  });
});
