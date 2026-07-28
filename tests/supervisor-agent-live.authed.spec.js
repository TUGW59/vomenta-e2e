// @ts-check
import { test, expect } from './fixtures/test.js';
import { AgentLivePage } from './pages/AgentLivePage.js';

/**
 * SÜPERVİZÖR → AGENT LIVE / CANLI ARACI (`/supervisor/calls`)
 *
 * Keşif + kanıt: docs/agent-live-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * Sesli AI aracısının yönettiği CANLI çağrıların cockpit listesi. Minimal sayfa:
 * kontrol (filtre/arama/buton) YOK; canlı AI çağrısı yokken boş-durum. Çağrı seçimi/
 * cockpit yalnızca canlı AI çağrısı varken → staging/canlı veri (N/A, fixme).
 * i18n SAĞLAM (4 dil, RTL); çeviri sızıntısı/timezone YOK.
 */

const I18N = AgentLivePage.I18N;

test.describe('Agent Live — yapı', () => {
  /** @type {AgentLivePage} */
  let al;
  test.beforeEach(async ({ app }) => {
    al = app.agentLive;
    await al.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(al.heading).toHaveText(I18N.en.heading);
    await expect(al.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('canlı AI çağrısı yokken boş-durum gösteriliyor', async () => {
    await expect(al.emptyState).toBeVisible();
  });
});

test.describe('Agent Live — 4 dil çeviri guard\'ları @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + boş-durum çevrili`, async ({ app }) => {
      const al = app.agentLive;
      await al.open();
      if (t.endonym) await al.switchLanguage(t.endonym);

      await expect(al.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(al.heading).toHaveText(t.heading);
      await expect(al.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(al.page.getByText(t.empty, { exact: true })).toBeVisible();
    });
  }
});

// Çağrı seçimi / cockpit: yalnızca CANLI bir AI çağrısı varken görünür/tıklanır.
// Şu an boş-durum → test edilemez. Canlı AI çağrısı üretilebilen staging'de L1/L2/L3 eklenecek.
test.describe('Agent Live — cockpit (staging planı) @regression', () => {
  test.fixme('L1/L2/L3: canlı AI çağrısı seçilince cockpit açılır (staging/canlı veri)', async () => {});
});
