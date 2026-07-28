// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertDestinationLoaded, gotoApp } from './helpers.js';

/**
 * Voice alt-navigasyon öğelerinin FONKSİYONEL testi — tıklayınca doğru alt-rotaya
 * gidip ilgili panelin gerçekten yüklendiğini (başlık render'ı) doğrular.
 * Gerçek çağrı/kayıt işlemi YAPILMAZ; sadece gezinme/görünüm.
 *
 * L3: tıklama → /voice/<alt> rotası + hedef panelin başlığı görünür (canlı gözlem).
 */
const SUBNAV = [
  { name: 'Queues', path: '/voice/queues', heading: 'Queues' },
  { name: 'Call History', path: '/voice/history', heading: 'Call History' },
  { name: 'Voicemails', path: '/voice/voicemail', heading: 'Voicemails' },
  { name: 'Recordings', path: '/voice/recordings', heading: 'Call Recordings' },
];

test.describe('Vomenta - Voice alt-navigasyonu (fonksiyonel)', () => {
  for (const item of SUBNAV) {
    test(`"${item.name}" alt-navigasyonu ${item.path} ("${item.heading}") panelini açıyor`, async ({ page }) => {
      await gotoApp(page, '/voice');
      const control = page.getByRole('button', { name: item.name, exact: true });
      await expect(control).toBeVisible({ timeout: 30000 });
      await control.click();
      await assertDestinationLoaded(page, { path: item.path, heading: item.heading });
    });
  }
});
