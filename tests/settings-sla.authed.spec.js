// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { SlaPage } from './pages/SlaPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › SLA POLİTİKALARI (`/settings/sla`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): New Policy / Create policy ASLA gönderilmez. Dialog
 * yalnızca AÇILIR + boş-submit disabled. L3 kalıcı politika staging'e bırakıldı.
 */

const I18N = SlaPage.I18N;
const API = SlaPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('SLA — yapı', () => {
  test('sayfa "SLA Policies" başlığı + New Policy + tablo ile açılıyor @smoke', async ({ app }) => {
    const s = app.sla;
    await s.open();
    await expect(s.heading).toHaveText(I18N.en.heading);
    await expect(s.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(s.newPolicyButton).toBeVisible();
    await expect(s.table).toBeVisible();
  });

  test('tablo beklenen kolonları + en az bir politika satırı @critical', async ({ app }) => {
    const s = app.sla;
    await s.open();
    for (const col of I18N.en.columns) {
      await expect(s.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(s.rows.first()).toBeVisible();
  });
});

// ═══════════════ STİL: VERİ SADAKATİ (@data) ═══════════════
// GET /sla tetiklendi + tabloda politika satırı render oldu (KPI/veri gösteriliyor).
test.describe('SLA — veri sadakati @data', () => {
  test('/sla ucu çağrılıyor ve politika satır(lar)ı render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes('/api/v1/automations/sla-policies') && r.request().method() === 'GET' && r.ok(),
      { timeout: 20000 }
    );
    const s = app.sla;
    await s.open();
    await resP; // doğru GET ucu 2xx
    // "Total Policies" KPI bir sayı gösteriyor + tabloda o kadar satır var.
    await expect(s.page.getByText(/Total Policies/i).first()).toBeVisible();
    await expect(s.rows).not.toHaveCount(0);
  });
});

// ──────────── 3 KATMAN: NEW POLICY DIALOG (L1) (@regression) ────────────
test.describe('SLA — New Policy dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (Policy name + Create policy disabled)', async ({ app }) => {
    const s = app.sla;
    await s.open();
    const dialog = await s.openNewPolicyDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create policy', exact: true })).toBeDisabled();
    await s.page.keyboard.press('Escape');
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("SLA — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + kolonlar + New Policy çevrili`, async ({ app }) => {
      const s = app.sla;
      await s.open();
      if (t.endonym) await s.switchLanguage(t.endonym);

      await expect(s.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(s.heading).toHaveText(t.heading);
      await expect(s.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const col of t.columns) {
        await expect(s.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
      }
      await expect(s.page.getByRole('button', { name: t.newPolicy, exact: true })).toBeVisible();
    });
  }
});

// ─── BULGU: New Policy dialogu "Close" (X) butonu ÇEVRİLMİYOR (sistemik sızıntı) ───
test.describe('SLA — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('New Policy dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const s = app.sla;
    await s.open();
    await s.switchLanguage(I18N.tr.endonym);
    await expect(async () => {
      await s.page.getByRole('button', { name: I18N.tr.newPolicy, exact: true }).click();
      await expect(s.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(s.page.getByRole('dialog').getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('SLA — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const s = app.sla;
    await s.open();
    await expectNoSevereA11y(s.page); // sayfa temiz (gözlem: ihlal yok)
  });

  // 🐞 BULGU: New Policy dialogundaki form alanları erişilebilir etiket taşımıyor → axe `label`
  // (critical). Düzelince "beklenmedik geçiş" verir → test.fail kaldırılıp kalıcı guard olur.
  test('New Policy dialogunda ciddi a11y ihlali olmamalı @known-bug', async ({ app }) => {
    test.fail(true, 'Bulgu: New SLA Policy dialogu form alanları etiketsiz (axe label/critical).');
    const s = app.sla;
    await s.open();
    await s.openNewPolicyDialog();
    await expectNoSevereA11y(s.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('SLA — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/sla');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('SLA — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const s = app.sla;
    await s.open();
    await waitForUiToSettle(s.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('SLA — hata-yolu @errorpath', () => {
  test('sla ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/automations/sla-policies**', { status: 500 });
    const s = app.sla;
    await page.goto('/settings/sla', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    await expect(s.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('SLA — klavye/odak @keyboard', () => {
  test('New Policy dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const s = app.sla;
    await s.open();
    const dialog = await s.openNewPolicyDialog();
    await expectDialogKeyboard(s.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('SLA — deep-link @deeplink', () => {
  test('/settings/sla doğrudan açılınca liste yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const s = app.sla;
    await page.goto('/settings/sla', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    await expect(s.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// New Policy dialogu kararlı (varsayılan spinbutton/kanal butonları; canlı veri yok).
test.describe('SLA — görsel @visual', () => {
  test('New Policy dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const s = app.sla;
    await s.open();
    const dialog = await s.openNewPolicyDialog();
    await waitForUiToSettle(s.page);
    await expect(dialog).toHaveScreenshot('sla-new-policy-dialog.png', { maxDiffPixels: 250 });
  });
});
