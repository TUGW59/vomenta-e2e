// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';
import { WorkforceEvaluationsPage } from './pages/WorkforceEvaluationsPage.js';

/**
 * İŞ GÜCÜ › KALİTE DEĞERLENDİRMELERİ (`/workforce/evaluations`) — L1 (tıklama) +
 * L2 (arka plan) salt-okunur + zorunlu test stilleri.
 *
 * Gerçek oluşturma (gerçek etkileşim ID'si + temsilci gerektirir) ayrı @mutation
 * fixme spec'inde: tests/workforce-evaluations-mutations.authed.spec.js
 */
const LANGS = [
  { code: 'en', endonym: null, dir: 'ltr' },
  { code: 'tr', endonym: 'Türkçe', dir: 'ltr' },
  { code: 'fr', endonym: 'Français', dir: 'ltr' },
  { code: 'ar', endonym: 'العربية', dir: 'rtl' },
];

test.describe('Kalite değerlendirmeleri — yapı + kontroller @smoke @regression', () => {
  test('L1: sayfa + "Değerlendirme Oluştur" + "YZ Değerlendirmesi Başlat"', async ({
    app,
  }) => {
    const e = app.workforceEvaluations;
    await e.open();
    await expect(e.createButton()).toBeVisible();
    await expect(e.aiButton()).toBeVisible();
  });

  test('L1: "Kalite Değerlendirmesi Oluştur" formu açılıyor (Interaction ID + Agent + Puan)', async ({
    app,
  }) => {
    const e = app.workforceEvaluations;
    await e.open();
    const dialog = await e.openCreateDialog();
    // Alanlar (canlı gözlem): Interaction ID · Interaction Type · Agent · Puan(%) ·
    //   Form Verileri(JSON) · Geri Bildirim.
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: WorkforceEvaluationsPage.L.submit })
    ).toBeVisible();
    // GÖNDERİLMEZ — gerçek etkileşim ID'si + temsilci gerektirir (salt L1).
    await e.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: sayfa açılışında değerlendirme listesi API\'den çekiliyor @critical', async ({
    app,
    page,
  }) => {
    const e = app.workforceEvaluations;
    const evalGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes(WorkforceEvaluationsPage.API.evaluations) &&
        r.ok(),
      { timeout: 30000 }
    );
    await e.open();
    expect((await evalGet).ok()).toBeTruthy();
  });
});

// ──────────────────── 4 DİL YÖN/BAŞLIK GUARD'I (@i18n) ────────────────────
test.describe('Kalite değerlendirmeleri — dil yönü/başlık @i18n', () => {
  for (const { code, endonym, dir } of LANGS) {
    test(`[${code}] doğru yazı yönü + başlık görünür`, async ({ app }) => {
      const e = app.workforceEvaluations;
      await e.open();
      if (endonym) await e.switchLanguage(endonym);
      await expect(e.page.locator('body')).toHaveCSS('direction', dir);
      await expect(e.heading).toBeVisible();
      await expect(e.heading).not.toHaveText('');
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Kalite değerlendirmeleri — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const e = app.workforceEvaluations;
    await e.open();
    await expectNoSevereA11y(e.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Kalite değerlendirmeleri — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/workforce/evaluations');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Kalite değerlendirmeleri — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({
    app,
    diagnostics,
  }) => {
    const e = app.workforceEvaluations;
    await e.open();
    await waitForUiToSettle(e.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Kalite değerlendirmeleri — hata-yolu @errorpath', () => {
  test('değerlendirme listesi ucu 500 dönerse sayfa çökmüyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    await mockApi(page, `**${WorkforceEvaluationsPage.API.evaluations}**`, { status: 500 });
    const e = app.workforceEvaluations;
    await page.goto('/workforce/evaluations', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(e.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Kalite değerlendirmeleri — klavye/odak @keyboard', () => {
  test('Değerlendirme Oluştur diyaloğu Escape ile kapanıyor', async ({ app }) => {
    const e = app.workforceEvaluations;
    await e.open();
    const dialog = await e.openCreateDialog();
    await expect(dialog).toBeVisible();
    await e.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Kalite değerlendirmeleri — deep-link @deeplink', () => {
  test('/workforce/evaluations doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    const e = app.workforceEvaluations;
    await page.goto('/workforce/evaluations', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(e.shell.loginHeading).toBeHidden();
    await expect(e.heading).toHaveText(WorkforceEvaluationsPage.L.heading);
  });
});
