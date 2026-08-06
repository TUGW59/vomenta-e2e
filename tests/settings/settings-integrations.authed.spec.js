// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { IntegrationsPage } from '../pages/IntegrationsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › ENTEGRASYONLAR (`/settings/integrations`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Request Access / Add Webhook (Submit/Add) ASLA gönderilmez;
 * dialoglar yalnızca AÇILIR.
 */

const I18N = IntegrationsPage.I18N;
const API = IntegrationsPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Entegrasyonlar — yapı', () => {
  test('sayfa başlığı + entegrasyon kartları + Webhook bölümü ile açılıyor @smoke', async ({ app }) => {
    const i = app.integrations;
    await i.open();
    await expect(i.heading).toHaveText(I18N.en.heading);
    // Entegrasyon kartları (isimler = veri): Salesforce, Slack.
    await expect(i.page.getByText('Salesforce', { exact: false }).first()).toBeVisible();
    await expect(i.page.getByText('Slack', { exact: false }).first()).toBeVisible();
    await expect(i.addWebhookButton).toBeVisible();
  });

  test('Webhook tablosu kolonları + boş-durum @critical', async ({ app }) => {
    const i = app.integrations;
    await i.open();
    for (const col of I18N.en.webhookCols) {
      await expect(i.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(i.page.getByText('No webhooks configured yet', { exact: false }).first()).toBeVisible();
  });
});

// ──────────── 3 KATMAN: NAVİGASYON + DIALOG'LAR (@regression) ────────────
test.describe('Entegrasyonlar — navigasyon + dialoglar @regression', () => {
  test('L3: "Manage API Keys" → /settings/api-keys yüklüyor', async ({ app, page }) => {
    const i = app.integrations;
    await i.open();
    await page.getByRole('link', { name: I18N.en.manageKeys, exact: true }).click();
    await page.waitForURL((u) => u.pathname.startsWith('/settings/api-keys'), { timeout: 15000 });
    await expect(i.shell.loginHeading).toBeHidden();
  });

  test('L1: Request Access "Request … Integration" dialogunu açıyor (Submit tıklanmaz)', async ({ app }) => {
    const i = app.integrations;
    await i.open();
    const dialog = await i.openDialog(i.requestAccessButton);
    await expect(dialog.getByRole('button', { name: /Submit Request/i })).toBeVisible();
    await i.page.keyboard.press('Escape');
  });

  test('L1: Add Webhook dialogu açılıyor (URL/Secret/Events)', async ({ app }) => {
    const i = app.integrations;
    await i.open();
    const dialog = await i.openDialog(i.addWebhookButton);
    await expect(dialog.getByRole('heading', { name: I18N.en.addWebhook, exact: true })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'URL', exact: true })).toBeVisible();
    await expect(dialog.getByRole('checkbox', { name: 'call.started', exact: true })).toBeVisible();
    await i.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Entegrasyonlar — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + Request Access + Add Webhook çevrili`, async ({ app }) => {
      const i = app.integrations;
      await i.open();
      if (t.endonym) await i.switchLanguage(t.endonym);

      await expect(i.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(i.heading).toHaveText(t.heading);
      await expect(i.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      await expect(i.page.getByRole('button', { name: t.requestAccess, exact: true }).first()).toBeVisible();
      await expect(i.page.getByRole('button', { name: t.addWebhook, exact: true })).toBeVisible();
    });
  }
});

// NOT (gözlem): Keşif anlık görüntüsünde API Keys özetinde ham i18n anahtarı
// `settings.integrationsPage.activeKeysCount` görüldü; ancak sayı yüklendikten sonra kaybolduğu
// için (yükleme-anı flaş'ı) kararlı bir guard yazılamadı. NOTLAR'da geçici gözlem olarak belgeli.

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Entegrasyonlar — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const i = app.integrations;
    await i.open();
    await expectNoSevereA11y(i.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Entegrasyonlar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/integrations');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Entegrasyonlar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const i = app.integrations;
    await i.open();
    await waitForUiToSettle(i.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Entegrasyonlar — hata-yolu @errorpath', () => {
  test('webhooks ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.webhooks}**`, { status: 500 });
    const i = app.integrations;
    await page.goto('/settings/integrations', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(i.shell.loginHeading).toBeHidden();
    await expect(i.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Entegrasyonlar — klavye/odak @keyboard', () => {
  test('Add Webhook dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const i = app.integrations;
    await i.open();
    const dialog = await i.openDialog(i.addWebhookButton);
    await expectDialogKeyboard(i.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Entegrasyonlar — deep-link @deeplink', () => {
  test('/settings/integrations doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const i = app.integrations;
    await page.goto('/settings/integrations', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(i.shell.loginHeading).toBeHidden();
    await expect(i.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Request Access dialogu kararlı (kısa, canlı veri yok).
test.describe('Entegrasyonlar — görsel @visual', () => {
  test('Request Access dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const i = app.integrations;
    await i.open();
    const dialog = await i.openDialog(i.requestAccessButton);
    await waitForUiToSettle(i.page);
    await expect(dialog).toHaveScreenshot('integrations-request-dialog.png', { maxDiffPixels: 250 });
  });
});
