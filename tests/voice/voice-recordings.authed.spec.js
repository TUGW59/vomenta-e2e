// @ts-check
import { test, expect } from '../fixtures/test.js';
import { VoiceSubPage } from '../pages/VoiceSubPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
  knownBugGuard,
} from '../helpers.js';

/**
 * VOICE › Arama Kayıtları (`/voice/recordings`).
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com).
 * From/To Date filtreleri + kayıt tablosu + satır Play/Download/Delete. `GET /voice/recordings`.
 * Download bir <button> → tıklayınca `GET /voice/recordings/<id>/stream` (indirme-olayı YOK; ağdan doğrulanır).
 * Delete → alertdialog (onay). Canlı açılış konsolu temiz.
 * GÜVENLİK (production salt-okunur): Delete ONAYLANMAZ (alertdialog Escape ile kapatılır).
 */
const KEY = 'recordings';
const META = VoiceSubPage.SECTIONS[KEY];

test.describe('Arama Kayıtları — yapı @smoke', () => {
  test('sayfa "Call Recordings" başlığı + alt-başlık ile açılıyor', async ({ app }) => {
    const r = app.voiceSub(KEY);
    await r.open();
    await expect(r.subtitle('en')).toBeVisible();
  });
});

test.describe('Arama Kayıtları — veri sadakati @data', () => {
  test('GET /voice/recordings çağrılıyor + tablo render ediliyor', async ({ app, page }) => {
    const resP = page.waitForResponse(
      (r) => r.url().includes(META.api) && r.request().method() === 'GET' && r.status() < 400,
      { timeout: 20000 }
    );
    await app.voiceSub(KEY).open();
    await resP;
    await expect(page.locator('table, [role="table"]').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Arama Kayıtları — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(META.i18n)) {
    test(`[${code}] başlık + yön + alt başlık çevrili`, async ({ app }) => {
      const r = app.voiceSub(KEY);
      await r.open();
      if (t.endonym) await r.switchLanguage(t.endonym);
      await expect(r.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(r.page.getByRole('heading', { name: t.heading, exact: true }).first()).toBeVisible();
      await expect(r.subtitle(code)).toBeVisible();
    });
  }
});

// @a11y — VOICE-RECORDINGS-A11Y-LABEL bilinen hatası: tarih filtre alanları etiketsiz (label/critical).
test.describe('Arama Kayıtları — erişilebilirlik @a11y @known-bug', () => {
  test('VOICE-RECORDINGS-A11Y-LABEL · /voice/recordings · form alanları erişilebilir etiket taşımalı (label)', async ({ app }) => {
    knownBugGuard(test, 'VOICE-RECORDINGS-A11Y-LABEL');
    const r = app.voiceSub(KEY);
    await r.open();
    await waitForUiToSettle(r.page);
    await expectNoSevereA11y(r.page);
  });
});

test.describe('Arama Kayıtları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, META.path);
  });
});

test.describe('Arama Kayıtları — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    await app.voiceSub(KEY).open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Arama Kayıtları — indirme @export', () => {
  test('"Download" tıklanınca kayıt stream ucu (GET .../recordings/<id>/stream) çağrılıyor', async ({ app, page }) => {
    const r = app.voiceSub(KEY);
    await r.open();
    const dl = page.getByRole('button', { name: 'Download', exact: true }).first();
    await dl.waitFor({ timeout: 15000 }).catch(() => {});
    test.skip((await dl.count()) === 0, 'Kayıt yok; "Download" reproduce edilemiyor (veri gerektirir).');
    // Download indirme-OLAYI üretmiyor; export EYLEMİ ağ katmanında doğrulanır: tıklama
    // kayıt stream ucuna GET tetiklemeli (kontrol doğru uca BAĞLI). Yanıt STATÜSÜ backend/
    // veriye bağlı (canlıda 500 gözlendi — bkz. NOTLAR "gözlem"); export eylemi burada
    // statüden bağımsız doğrulanır (kontrolün kablolaması), veri-bağlı 500 ayrı borç.
    const streamP = page.waitForResponse(
      (res) => /\/api\/v1\/voice\/recordings\/[^/]+\/stream/.test(res.url()) && res.request().method() === 'GET',
      { timeout: 15000 }
    );
    await dl.click();
    const res = await streamP;
    expect(res.url(), 'Download kayıt stream ucuna GET tetiklemeli (export eylemi bağlı)').toMatch(
      /\/api\/v1\/voice\/recordings\/[^/]+\/stream/
    );
  });
});

test.describe('Arama Kayıtları — "Delete" onay dialogu (salt-okunur L1 + klavye) @regression @keyboard', () => {
  test('L1: "Delete Recording" tıklanınca onay alertdialog\'u açılıyor; klavye ile kapanıyor (ONAYLANMAZ)', async ({ app }) => {
    const r = app.voiceSub(KEY);
    await r.open();
    const del = r.page.getByRole('button', { name: 'Delete Recording', exact: true }).first();
    await del.waitFor({ timeout: 15000 }).catch(() => {});
    test.skip((await del.count()) === 0, 'Kayıt yok; Delete onayı reproduce edilemiyor (veri gerektirir).');
    await del.click();
    const dialog = r.page.getByRole('alertdialog').or(r.page.getByRole('dialog')).first();
    await expect(dialog).toBeVisible();
    // @keyboard: Escape ile kapanır → silme ONAYLANMAZ (prod salt-okunur).
    await expectDialogKeyboard(r.page, dialog);
  });
});

test.describe('Arama Kayıtları — hata-yolu @errorpath', () => {
  test('GET /voice/recordings 500 dönse de kabuk + başlık sağlam', async ({ app, page }) => {
    await mockApi(page, '**/api/v1/voice/recordings**', { status: 500 });
    const r = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(r.shell.loginHeading).toBeHidden();
    await expect(r.heading).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Arama Kayıtları — deep-link @deeplink', () => {
  test('/voice/recordings doğrudan açılınca yükleniyor', async ({ app, page }) => {
    const r = app.voiceSub(KEY);
    await page.goto(META.path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(r.shell.loginHeading).toBeHidden();
    await expect(r.heading).toBeVisible({ timeout: 30000 });
  });
});
