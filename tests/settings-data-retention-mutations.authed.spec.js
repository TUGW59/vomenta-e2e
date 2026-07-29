// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * AYARLAR › VERİ SAKLAMA — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (geri-döndürülebilir): bir saklama-süresi spinbutton değerini oku → değiştir →
 * Save changes → yeniden yükle → kalıcı doğrula → eski değere geri al.
 *
 * DURUM: test.fixme — "Run cleanup now" GERİ ALINAMAZ veri silme yapar (asla test edilmez).
 *   "Save changes" saklama süresini değiştirir (tüm tenant'ı etkiler); yalnız ayrılmış staging
 *   tenant'ında reversible spinbutton düzenlemesi + save endpoint teyidiyle koşulmalı. Prod
 *   salt-okunur; teyit sonrası test.fixme kalkar.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 */
test.describe('Veri Saklama — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: reversible spinbutton düzenle+Save+geri al; Run cleanup ASLA.');

  test('L3 görev OK: saklama süresi değiştir → Save → kalıcı → geri al', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Veri Saklama: saklama süresi düzenle + geri al');
    const d = app.dataRetention;
    await d.open();

    testEntity.cleanup(async () => {
      // TODO(staging): spinbutton değerini orijinaline geri al + Save.
    }, 'data-retention-restore');

    // TODO(staging): ilk spinbutton oku → değiştir → Save changes → yeniden yükle →
    // kalıcı doğrula → geri al. "Run cleanup now" ASLA tıklanmaz (geri alınamaz silme).
    await expect(d.saveButton).toBeVisible();
  });
});
