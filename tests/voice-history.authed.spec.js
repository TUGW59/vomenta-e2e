// @ts-check
import { test, expect } from './fixtures/test.js';
import { VoiceSubPage } from './pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from './helpers.js';

/**
 * VOICE › Arama Geçmişi (`/voice/history`).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com).
 * Filtreler (All Directions / All Status / From-To Date) + geçmiş çağrı tablosu + satır
 * "Call back" (gerçek giden çağrı!) + "Details" (dialog). `GET /api/v1/voice/calls`.
 * Canlı açılış konsolu temiz.
 * GÜVENLİK (production salt-okunur): "Call back" gerçek çağrı → ASLA tıklanmaz (staging/softphone).
 */
const KEY = 'history';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('Arama Geçmişi — yapı @smoke', () => {
  test('sayfa "Call History" başlığı + alt-başlık + yön filtreleri ile açılıyor', async ({ app }) => {
    const h = app.voiceSub(KEY);
    await h.open();
    await expect(h.subtitle('en')).toBeVisible();
    await expect(h.page.getByRole('combobox').first()).toBeVisible();
  });
});

test.describe('Arama Geçmişi — veri sadakati @data', () => {
  test('GET /voice/calls çağrılıyor + geçmiş tablosu render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Arama Geçmişi — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const h = app.voiceSub(KEY);
      await h.open();
      if (t.endonym) await h.switchLanguage(t.endonym);
      await expect(h.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(h.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(h.subtitle(code)).toBeVisible();
    });
  }
});

// @a11y — VOICE-HISTORY-A11Y-LABEL bilinen hatası: tarih filtre alanları erişilebilir
// etiket taşımıyor (axe label/critical). Kanallar B20–B25 ile aynı sistemik sınıf.
test.describe('Arama Geçmişi — erişilebilirlik @a11y @known-bug', () => {
  test('VOICE-HISTORY-A11Y-LABEL · /voice/history · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'VOICE-HISTORY-A11Y-LABEL');
    const h = app.voiceSub(KEY);
    await h.open();
    await waitForUiToSettle(h.page);
    await expectNoSevereA11y(h.page);
  });
});

test.describe('Arama Geçmişi — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('Arama Geçmişi — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Arama Geçmişi — satır "Details" dialogu (salt-okunur L1 + klavye) @regression @keyboard', () => {
  test('L1: "Details" tıklanınca dialog açılıyor; klavye ile kapanıyor', async ({ app }) => {
    const h = app.voiceSub(KEY);
    // Tablo verisini bekle (yalnız başlık değil) → satır render'ından ÖNCE sayım yanlış-skip'i eler.
    const callsP = h.page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await h.open();
    await callsP;
    const details = h.page.getByRole('button', { name: 'Details', exact: true }).first();
    await details.waitFor({ timeout: 15000 }).catch(() => {});
    test.skip((await details.count()) === 0, 'Geçmiş çağrı yok; "Details" reproduce edilemiyor (veri gerektirir).');
    await details.click();
    const dialog = h.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expectDialogKeyboard(h.page, dialog);
  });
});

test.describe('Arama Geçmişi — yön filtresi (client L1) @regression', () => {
  test('L1: yön filtresi combobox\'u açılıyor; etkileşim sonrası tablo/başlık sağlam', async ({ app }) => {
    const h = app.voiceSub(KEY);
    await h.open();
    const filter = h.page.getByRole('combobox').first();
    await expect(filter).toBeVisible();
    await filter.click();
    // NOT (dürüstlük): bu test yalnız "combobox açılıyor + etkileşim sonrası sayfa sağlam
    // kalıyor" (L1) doğrular. Seçim boyutunu (seçenek görünür → seç → tablo filtreleniyor)
    // KANITLAMAZ; başlık buna göre daraltıldı (eski "seçim yapılabiliyor" fazla iddiaydı).
    // Güçlendirme (seçenek assert + filtre etkisi) koşabilir authed ortam/koşum-döngüsü bekler.
    const option = h.page.getByRole('option').first();
    if (await option.count()) await option.click();
    await expect(h.heading).toBeVisible();
  });
});

test.describe('Arama Geçmişi — hata-yolu @errorpath', () => {
  test('GET /voice/calls 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/voice/calls**', { status: 500 });
    const h = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(h.shell.loginHeading).toBeHidden();
    await expect(h.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Arama Geçmişi — deep-link @deeplink', () => {
  test('/voice/history doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const h = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(h.shell.loginHeading).toBeHidden();
    await expect(h.heading).toBeVisible({ timeout: 30000 });
  });
});
