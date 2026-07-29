// @ts-check
import { test, expect } from './fixtures/test.js';
import { RolesPage } from './pages/RolesPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › ROL YÖNETİMİ (`/settings/roles`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * GÜVENLİK (production salt-okunur): Create/Edit/Reset/Delete ASLA tıklanmaz. Create Role
 * dialogu yalnızca AÇILIR (rol OLUŞTURULMAZ). L3 create+delete (custom rol) staging'de:
 * tests/settings-roles-mutations.authed.spec.js.
 */

const I18N = RolesPage.I18N;
const API = RolesPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Roller — yapı', () => {
  test('sayfa "Role Management" başlığı + rol tablosu ile açılıyor @smoke', async ({ app }) => {
    const r = app.roles;
    await r.open();
    await expect(r.heading).toHaveText(I18N.en.heading);
    await expect(r.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(r.table).toBeVisible();
  });

  test('tablo kolonları + sistem rolleri (ADMIN/AGENT/OWNER…) görünüyor @critical', async ({ app }) => {
    const r = app.roles;
    await r.open();
    for (const col of I18N.en.columns) {
      await expect(r.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    for (const role of ['ADMIN', 'AGENT', 'OWNER']) {
      await expect(r.roleRow(role)).toBeVisible();
    }
  });
});

// ──────────── 3 KATMAN: SATIR AKSİYONLARI (L1 varlık) (@regression) ────────────
test.describe('Roller — satır aksiyonları @regression', () => {
  test('L1: sistem rolünde Edit/Reset var, Delete DISABLED (silinemez)', async ({ app }) => {
    const r = app.roles;
    await r.open();
    const adminRow = r.roleRow('ADMIN');
    await expect(adminRow.getByRole('button', { name: 'Edit role', exact: true })).toBeVisible();
    // Sistem rolü → "Delete role" disabled (yanlışlıkla silmeye karşı guard).
    await expect(adminRow.getByRole('button', { name: 'Delete role', exact: true })).toBeDisabled();
  });
});

// ──────────── 3 KATMAN: CREATE ROLE DIALOG (L1) (@regression) ────────────
test.describe('Roller — Create Role dialogu @regression', () => {
  test('L1 tıklama OK: dialog açılıyor (Ad/Açıklama + izin kategorileri + Save)', async ({ app }) => {
    const r = app.roles;
    await r.open();
    const dialog = await r.openCreateDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: I18N.en.name, exact: true })).toBeVisible();
    // İzin kategorileri render oldu (ör. Voice 0/19).
    await expect(dialog.getByRole('button', { name: /Voice\s*0\/19/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: I18N.en.save, exact: true })).toBeVisible();
    await r.page.keyboard.press('Escape');
  });
});

// ═══════════════ STİL: VERİ SADAKATİ (@data) ═══════════════
// UI'daki rol satırı sayısı ↔ API'nin döndürdüğü rol sayısı tutarlı olmalı.
test.describe('Roller — veri sadakati @data', () => {
  test('UI rol satırı sayısı, /roles yanıtındaki rol sayısıyla eşleşiyor', async ({ app, page }) => {
    // Kesin uç: /api/v1/roles (liste) — /roles/permissions/catalog ve /roles/me/permissions HARİÇ.
    const jsonP = page
      .waitForResponse((r) => /\/api\/v1\/roles(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(), { timeout: 20000 })
      .then((r) => r.json())
      .catch(() => null);
    const r = app.roles;
    await r.open();
    const json = await jsonP;
    const list = Array.isArray(json) ? json : (json?.data ?? json?.roles ?? []);
    expect(list.length, 'API en az bir rol döndürmeli').toBeGreaterThan(0);
    await expect(r.rows).toHaveCount(list.length);
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Roller — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili`, async ({ app }) => {
      const r = app.roles;
      await r.open();
      if (t.endonym) await r.switchLanguage(t.endonym);

      await expect(r.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(r.heading).toHaveText(t.heading);
      if (t.subtitle) await expect(r.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      if (t.columns) {
        for (const col of t.columns) {
          await expect(r.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
        }
      }
      const create = r.page.getByRole('button', { name: t.create, exact: true });
      await expect(create).toBeVisible();
      // Create dialog başlığı da çevrili (rol OLUŞTURULMAZ).
      await expect(async () => {
        await create.click();
        await expect(r.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: 15000 });
      await expect(r.page.getByRole('dialog').getByRole('heading', { name: t.dialogTitle, exact: true })).toBeVisible();
      await r.page.keyboard.press('Escape');
    });
  }
});

// ─── BULGU: Create Role dialogundaki "Close" (X) butonu ÇEVRİLMİYOR (i18n/a11y sızıntısı) ───
// Kullanıcılar davet dialogundaki ile AYNI sistemik sızıntı (Radix dialog varsayılan kapat).
test.describe('Roller — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('Create Role dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: dialog kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const r = app.roles;
    await r.open();
    await r.switchLanguage(I18N.tr.endonym);
    const dialog = await r.openCreateDialog();
    await expect(dialog.getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Roller — erişilebilirlik @a11y', () => {
  test('sayfada ve Create Role dialogunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const r = app.roles;
    await r.open();
    await expectNoSevereA11y(r.page);
    await r.openCreateDialog();
    await expectNoSevereA11y(r.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Roller — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/roles');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Roller — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const r = app.roles;
    await r.open();
    await waitForUiToSettle(r.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Roller — hata-yolu @errorpath', () => {
  test('roller ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.roles}`, { status: 500 });
    const r = app.roles;
    await page.goto('/settings/roles', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(r.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Roller — klavye/odak @keyboard', () => {
  test('Create Role dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const r = app.roles;
    await r.open();
    const dialog = await r.openCreateDialog();
    await expectDialogKeyboard(r.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Roller — deep-link @deeplink', () => {
  test('/settings/roles doğrudan açılınca liste yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const r = app.roles;
    await page.goto('/settings/roles', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(r.shell.loginHeading).toBeHidden();
    await expect(r.heading).toHaveText(I18N.en.heading);
  });
});

// GÖRSEL REGRESYON — N/A: Bu sayfada kararlı snapshot'lanabilir bölge yok. Rol tablosu canlı
// sayaç (permissions/users) içerir; Create Role dialogu 14 kategorili uzun/kaydırmalı liste
// olduğundan tam-dialog snapshot'ı flaky. "Flaky yok" kuralı gereği görsel guard eklenmedi;
// tested-pages.js naStyles ile beyan edildi.
