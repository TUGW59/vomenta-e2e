// @ts-check
import { test, expect } from '../fixtures/test.js';
import { VoicePage } from '../pages/VoicePage.js';
import { assertDestinationLoaded, gotoApp } from '../helpers.js';

/**
 * Voice bölümü alt-navigasyonunun FONKSİYONEL testi (nav-L3 @regression) — her alt-nav
 * düğmesine tıklayınca DOĞRU alt-rotaya gidip hedef panelin gerçekten yüklendiğini
 * (başlık render'ı) doğrular. Salt URL eşleşmesi yetersizdir (AGENTS.md nav-L3).
 *
 * Keşif: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026) — alt-nav 10 hedef; eski test yalnız 4'ünü
 * biliyordu (IVR Builder / Phone Numbers / SIP Trunks / SIP settings / Skills gözden kaçmıştı).
 * Gerçek çağrı/kayıt işlemi YAPILMAZ; sadece gezinme/görünüm.
 */
test.describe('Voice alt-navigasyonu (fonksiyonel nav-L3) @regression', () => {
  for (const item of VoicePage.SUBNAV) {
    test(`"${item.name}" → ${item.path} ("${item.heading}") panelini açıyor`, async ({ page }) => {
      await gotoApp(page, '/voice');
      const control = page.getByRole('button', { name: item.name, exact: true });
      await expect(control).toBeVisible({ timeout: 30000 });
      await control.click();
      await assertDestinationLoaded(page, { path: item.path, heading: item.heading });
    });
  }
});
