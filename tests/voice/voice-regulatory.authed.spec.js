// @ts-check
import { test, expect } from '../fixtures/test.js';
import {
  gotoApp,
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  waitForUiToSettle,
  knownBugGuard,
} from '../helpers.js';
import { AppShell } from '../pages/AppShell.js';

/**
 * VOICE › Regulatory / KYC (`/voice/regulatory`) — BOZUK SAYFA.
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2–3 Ağu 2026, app.vomenta.com).
 * Bu rota Voice bölüm alt-navigasyonunda YOK (B10) ve tüm `voiceRegulatory` i18n namespace
 * eksik (B1) → <main> ham anahtar veya BOŞ render ediyor + konsol `MISSING_MESSAGE:
 * voiceRegulatory` (VOICE-REGULATORY-BROKEN, deterministik). Bu spec bozuk durumu kapsamlı
 * belgeler: çalışan baseline stiller normal koşar; i18n/console + bölüm düzeni known-bug
 * guard'ları ile beklenen-başarısızlık olarak sabitlenir.
 * B1/B10 known-bugs.authed.spec.js'te ayrıca izlenir (tekrar edilmez).
 */
const ROUTE = '/voice/regulatory';

test.describe('Regulatory — yapı @smoke', () => {
  test('/voice/regulatory rotası oturum korunarak yükleniyor (içerik bozuk olsa da kabuk sağlam)', async ({ page }) => {
    await gotoApp(page, ROUTE);
    expect(page.url()).toContain('/voice/regulatory');
    await expect(new AppShell(page).loginHeading).toBeHidden();
    await expect(page.locator('main')).toBeAttached();
  });
});

// @i18n + @clean — VOICE-REGULATORY-BROKEN: voiceRegulatory namespace eksik → ham anahtar/boş
// içerik + konsol MISSING_MESSAGE. İki baseline stil de aynı kök nedenden kırılır → tek guard.
// Sayfa render'ı KARARSIZ (bazen ham anahtar/hata, bazen temiz) → B14/AI-PROMPTS-CONSOLE deseni:
// bulgu reproduce olduysa knownBugGuard ile beklenen-başarısızlık; olmadıysa test.skip
// (beklenmedik-geçiş yerine atlanır).
test.describe('Regulatory — i18n/console bozuk @i18n @clean @known-bug', () => {
  test('VOICE-REGULATORY-BROKEN · /voice/regulatory · açılışta MISSING_MESSAGE / ham i18n olmamalı @clean', async ({ page, diagnostics }) => {
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await gotoApp(page, ROUTE);
    await waitForUiToSettle(page);
    const mainText = await page.locator('main').innerText().catch(() => '');
    const reproduced =
      mainText.includes('voiceRegulatory.') ||
      consoleErrors.some((t) => /MISSING_MESSAGE: voiceRegulatory|voiceRegulatory/.test(t));
    test.skip(!reproduced, 'Bu koşuda voiceRegulatory bozukluğu reproduce olmadı (render kararsız).');

    knownBugGuard(test, 'VOICE-REGULATORY-BROKEN');
    expect(mainText, 'ham i18n anahtarı görünmemeli (voiceRegulatory.*)').not.toContain('voiceRegulatory.');
    diagnostics.assertClean();
  });
});

test.describe('Regulatory — erişilebilirlik @a11y', () => {
  test('ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ page }) => {
    await gotoApp(page, ROUTE);
    await waitForUiToSettle(page);
    await expectNoSevereA11y(page);
  });
});

test.describe('Regulatory — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ page }) => {
    await expectNoOverflowAtViewports(page, ROUTE);
  });
});

// @regression — B10: bölüm düzeni kayıp; çalışan Voice sayfalarındaki üst alt-nav (Live Calls…)
// bu sayfada YOK. Bölüm gezinme kontrolünün varlığı guard'lı beklenen-başarısızlıkla sabitlenir.
test.describe('Regulatory — bölüm düzeni (Voice alt-nav) @regression @known-bug', () => {
  test('B10 · /voice/regulatory · Voice alt-navigasyonu (Live Calls) sayfada görünmeli', async ({ page }) => {
    knownBugGuard(test, 'B10');
    await gotoApp(page, ROUTE);
    await waitForUiToSettle(page);
    await expect(
      page.getByRole('button', { name: 'Live Calls', exact: true }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Regulatory — deep-link @deeplink', () => {
  test('/voice/regulatory doğrudan açılınca oturum korunuyor', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(new AppShell(page).loginHeading).toBeHidden();
    expect(page.url()).toContain('/voice/regulatory');
  });
});
