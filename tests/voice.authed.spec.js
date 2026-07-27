// @ts-check
import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

/**
 * Voice sayfası testleri (girişli, salt-okunur).
 * Gerçek çağrı BAŞLATILMAZ.
 */

async function openVoice(page) {
  await gotoApp(page, '/voice');
  await expect(
    page.getByRole('heading', { name: 'Live Calls', exact: true })
  ).toBeVisible({ timeout: 30000 });
}

test.describe('Vomenta - Voice', () => {
  test('/voice, Live Calls sayfasına açılıyor', async ({ page }) => {
    await openVoice(page);
    expect(page.url()).toContain('/voice');
  });

  test('aktif çağrı yokken boş durum gösteriliyor', async ({ page }) => {
    await openVoice(page);
    await expect(page.getByText('No active calls right now')).toBeVisible();
  });

  test('Voice alt-navigasyon öğeleri görünüyor', async ({ page }) => {
    await openVoice(page);
    for (const name of ['Queues', 'Call History', 'Voicemails', 'Recordings', 'Phone Numbers']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
  });
});
