// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * Voice alt-navigasyon öğelerinin FONKSİYONEL testi — tıklayınca çalışıyor mu
 * (sayfa /voice içinde kalıyor, oturum korunuyor, çökme yok).
 * Gerçek çağrı/kayıt işlemi YAPILMAZ; sadece gezinme/görünüm.
 */
const SUBNAV = ['Queues', 'Call History', 'Voicemails', 'Recordings'];

test.describe('Vomenta - Voice alt-navigasyonu (fonksiyonel)', () => {
  for (const name of SUBNAV) {
    test(`"${name}" alt-navigasyonu tıklanınca çalışıyor`, async ({ app, page }) => {
      await gotoApp(page, '/voice');
      const item = page.getByRole('button', { name, exact: true });
      await expect(item).toBeVisible({ timeout: 30000 });
      await item.click();
      // Oturum korunuyor ve hâlâ Voice bölümündeyiz.
      await expect(app.shell.loginHeading).toBeHidden();
      expect(page.url()).toContain('/voice');
    });
  }
});
