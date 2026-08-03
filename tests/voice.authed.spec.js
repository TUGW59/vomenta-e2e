// @ts-check
import { test, expect } from './fixtures/test.js';
import { VoicePage } from './pages/VoicePage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * VOICE › Canlı Aramalar hub'ı (`/voice` → `/voice/live`).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com).
 * Hub: gerçek-zamanlı aktif çağrı görünümü — KPI döşemeleri + mevcudiyet sayaçları + boş durum.
 * GÜVENLİK (production salt-okunur): softphone / gerçek çağrı ASLA tetiklenmez.
 * Alt-navigasyon fonksiyonel (nav-L3 @regression) → voice-subnav.authed.spec.js.
 */
const I18N = VoicePage.I18N;
const API = VoicePage.API;

test.describe('Voice hub — yapı @smoke', () => {
  test('/voice, "Live Calls" başlığı + alt-başlık + boş durum ile açılıyor', async ({ app }) => {
    const v = app.voice;
    await v.open();
    expect(v.page.url()).toContain('/voice');
    await expect(v.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(v.emptyState).toBeVisible();
  });

  test('Voice alt-navigasyonunun 10 hedefi görünüyor', async ({ app }) => {
    const v = app.voice;
    await v.open();
    for (const { name } of VoicePage.SUBNAV) {
      await expect(v.subnav(name), `alt-nav "${name}" görünmeli`).toBeVisible();
    }
  });
});

test.describe('Voice hub — KPI veri sadakati @data', () => {
  test('canlı istatistik ucu çağrılıyor + "Agents Available" döşemesi DEĞER gösteriyor', async ({ app, page }) => {
    const v = app.voice;
    // Arka plan: hub açılışta canlı çağrı istatistiklerini çeker (yanıtı yakala → L2/@data kanıtı).
    const statsP = page.waitForResponse(
      (r) => r.url().includes(API.liveCalls) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await v.open();
    await statsP;
    await waitForUiToSettle(v.page);
    // Ön plan: KPI döşemesi yalnız etiketi değil bir DEĞER de göstermeli (backend boşalırsa kırılır).
    // Döşeme yapısı (canlı DOM): shadcn kartı (.rounded-lg) → başlık satırı (etiket + ikon) + değer.
    // Değer, etiketin KARDEŞİ değil kartın ayrı çocuğu → en yakın kart atasında sayı ararız.
    // Değer canlı polling ile geç dolabilir → cömert timeout (soğuk-önbellek flake'ini eler).
    const tile = v.page
      .getByText('Agents Available', { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    await expect(tile).toBeVisible({ timeout: 20000 });
    await expect(tile, 'KPI döşemesi bir sayısal değer göstermeli').toContainText(/\d/, {
      timeout: 20000,
    });
  });
});

test.describe("Voice hub — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const v = app.voice;
      await v.open();
      if (t.endonym) await v.switchLanguage(t.endonym);
      await expect(v.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(v.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(v.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
    });
  }
});

test.describe('Voice hub — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const v = app.voice;
    await v.open();
    await waitForUiToSettle(v.page);
    await expectNoSevereA11y(v.page);
  });
});

test.describe('Voice hub — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/voice');
  });
});

test.describe('Voice hub — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voice.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Voice hub — hata-yolu @errorpath', () => {
  test('canlı çağrı ucu 500 dönse de kabuk + başlık + boş durum sağlam', async ({ app, page }) => {
    await mockApi(page, `**${API.liveCalls}**`, { status: 500 });
    const v = app.voice;
    await page.goto('/voice', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Voice hub — softphone paneli (salt-okunur L1) @regression', () => {
  test('"Open softphone" düğmesi görünür ve etkin (gerçek çağrı tetiklenmez)', async ({ app }) => {
    const v = app.voice;
    await v.open();
    await expect(v.softphoneButton).toBeVisible();
    await expect(v.softphoneButton).toBeEnabled();
  });
});

test.describe('Voice hub — deep-link @deeplink', () => {
  test('/voice doğrudan açılınca /voice/live yüklüyor', async ({ app, page }) => {
    const v = app.voice;
    await page.goto('/voice', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(v.shell.loginHeading).toBeHidden();
    await expect(v.heading).toBeVisible({ timeout: 30000 });
    await expect
      .poll(() => new URL(page.url()).pathname, { message: '/voice → /voice/live yönlenmeli' })
      .toContain('/voice');
  });
});
