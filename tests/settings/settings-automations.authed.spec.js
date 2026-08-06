// @ts-check
import { test, expect } from '../fixtures/test.js';
import { environment } from '../../config/environment.js';
import { AutomationsPage } from '../pages/AutomationsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from '../helpers.js';

/**
 * AYARLAR › OTOMASYON KURALLARI (`/settings/automations`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): New Rule / Save Rule ASLA gönderilmez. Dialog yalnızca
 * AÇILIR + boş-submit disabled. L3 kalıcı kural staging'e bırakıldı.
 */

const I18N = AutomationsPage.I18N;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Otomasyon — yapı', () => {
  test('sayfa başlığı + 2 sekme + New Rule ile açılıyor @smoke', async ({ app }) => {
    const a = app.automations;
    await a.open();
    await expect(a.heading).toHaveText(I18N.en.heading);
    for (const name of I18N.en.tabs) await expect(a.tab(name)).toBeVisible();
    await expect(a.newRuleButton).toBeVisible();
  });

  test('Rules sekmesi boş-durum, SLA Policies sekmesi tabloyu gösteriyor @critical', async ({ app }) => {
    const a = app.automations;
    await a.open();
    await a.selectTab('Rules');
    await expect(a.page.getByText(I18N.en.emptyRules, { exact: false }).first()).toBeVisible();
    await a.selectTab('SLA Policies');
    await expect(a.page.getByRole('columnheader', { name: 'Policy Name', exact: true })).toBeVisible();
  });
});

// ──────────── 3 KATMAN: SEKME + NEW RULE DIALOG (@regression) ────────────
test.describe('Otomasyon — sekmeler + New Rule dialogu @regression', () => {
  test('L1: sekmeler tıklanınca aria-selected=true', async ({ app }) => {
    const a = app.automations;
    await a.open();
    for (const name of I18N.en.tabs) {
      const tab = await a.selectTab(name);
      await expect(tab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('L1: New Rule dialogu açılıyor (Rule Name + Save Rule disabled)', async ({ app }) => {
    const a = app.automations;
    await a.open();
    const dialog = await a.openNewRuleDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save Rule', exact: true })).toBeDisabled();
    await a.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Otomasyon — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + sekmeler + New Rule çevrili`, async ({ app }) => {
      const a = app.automations;
      await a.open();
      if (t.endonym) await a.switchLanguage(t.endonym);

      await expect(a.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(a.heading).toHaveText(t.heading);
      await expect(a.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const name of t.tabs) await expect(a.tab(name)).toBeVisible();
      await expect(a.page.getByRole('button', { name: t.newRule, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: New Rule dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('Otomasyon — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('New Rule dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const a = app.automations;
    await a.open();
    await a.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await a.page.getByRole('button', { name: I18N.tr.newRule, exact: true }).click();
      await expect(a.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(a.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Otomasyon — erişilebilirlik @a11y', () => {
  test('sayfada ve New Rule dialogunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const a = app.automations;
    await a.open();
    await expectNoSevereA11y(a.page);
    await a.openNewRuleDialog();
    await expectNoSevereA11y(a.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Otomasyon — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/automations');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Otomasyon — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const a = app.automations;
    await a.open();
    await waitForUiToSettle(a.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Otomasyon — hata-yolu @errorpath', () => {
  test('otomasyon ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/automation**', { status: 500 });
    const a = app.automations;
    await page.goto('/settings/automations', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(a.shell.loginHeading).toBeHidden();
    await expect(a.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Otomasyon — klavye/odak @keyboard', () => {
  test('New Rule dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const a = app.automations;
    await a.open();
    const dialog = await a.openNewRuleDialog();
    await expectDialogKeyboard(a.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Otomasyon — deep-link @deeplink', () => {
  test('/settings/automations doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const a = app.automations;
    await page.goto('/settings/automations', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(a.shell.loginHeading).toBeHidden();
    await expect(a.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Rules boş-durumu kararlı (canlı veri yok).
test.describe('Otomasyon — görsel @visual', () => {
  test('Rules boş-durumu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const a = app.automations;
    await a.open();
    await a.selectTab('Rules');
    await waitForUiToSettle(a.page);
    await expect(a.page.getByRole('tabpanel').first()).toHaveScreenshot('automations-rules-empty.png', { maxDiffPixels: 250 });
  });
});
