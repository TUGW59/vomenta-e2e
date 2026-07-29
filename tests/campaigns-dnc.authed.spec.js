// @ts-check
import { test, expect } from './fixtures/test.js';
import { DncListPage } from './pages/DncListPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  captureJson,
  waitForUiToSettle,
} from './helpers.js';

/**
 * KAMPANYALAR → DNC LİSTELERİ (`/campaigns/dnc`) — Aranmayacak Listesi
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/dnc/NOTLAR.md (PII-maskeli artefaktlar).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com (4 dil + network + DOM inspection).
 *
 * ┌─ HER İNTERAKTİF KONTROL İÇİN 3 KATMAN ─────────────────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol görünür/etkin, tıklanınca UI gözlemlenebilir tepki │
 * │ L2 — ARKA PLAN OK: doğru uca network isteği (method+endpoint+2xx).           │
 * │                    Mutation `page.route` ile yakalanır (PROD'A YAZILMAZ).    │
 * │ L3 — GÖREV OK   : kontrolün amacı gerçekten gerçekleşiyor. Kalıcı mutation → │
 * │                    N/A (staging mutation spec).                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Bilinen hata (test.fail = bulgu HÂLÂ AÇIK):
 *   BULGU (export) — Export `?format=csv` istiyor ama indirilen dosya `dnc-list.json`.
 *
 * Gerçek numara ekleme / CSV içe aktarma = mutation → staging spec:
 *   tests/campaigns-dnc.mutation.authed.spec.js
 */

const I18N = DncListPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('DNC Listeleri — yapı @smoke', () => {
  /** @type {DncListPage} */
  let dnc;
  test.beforeEach(async ({ app }) => { dnc = app.dncList; await dnc.open(); });

  test('başlık ve alt başlık görünüyor @critical', async () => {
    await expect(dnc.heading).toHaveText(I18N.en.heading);
    await expect(dnc.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('Export / Bulk Import / Add Number butonları ve arama mevcut', async () => {
    await expect(dnc.exportButton).toBeVisible();
    await expect(dnc.bulkImportButton).toBeVisible();
    await expect(dnc.addNumberButton).toBeVisible();
    await expect(dnc.searchInput).toBeVisible();
  });

  test('üç KPI kartı görünüyor', async () => {
    for (const label of I18N.en.cards) {
      await expect(dnc.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('tablo başlıkları doğru sırada @critical', async () => {
    for (const header of I18N.en.headers) {
      await expect(dnc.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
    }
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────────
test.describe('DNC Listeleri — 4 dil çeviri guard\'ları @regression @i18n', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + buton/kart/tablo başlıkları çevrili`, async ({ app }) => {
      const dnc = app.dncList;
      await dnc.open();
      if (t.endonym) await dnc.shell.switchLanguage(t.endonym);

      await expect(dnc.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(dnc.page.locator('html')).toHaveAttribute('lang', code);
      await expect(dnc.heading).toHaveText(t.heading);
      await expect(dnc.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(dnc.buttonFor(t.exportButton)).toBeVisible();
      await expect(dnc.buttonFor(t.bulkImport)).toBeVisible();
      await expect(dnc.buttonFor(t.addNumber)).toBeVisible();
      for (const label of t.cards) {
        await expect(dnc.page.getByText(label, { exact: true }).first()).toBeVisible();
      }
      for (const header of t.headers) {
        await expect(dnc.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
      }
      await expect(dnc.page.getByText(t.emptyState, { exact: true })).toBeVisible();
    });

    test(`[${code}] Add Number dialog başlığı çevrili`, async ({ app }) => {
      const dnc = app.dncList;
      await dnc.open();
      if (t.endonym) await dnc.shell.switchLanguage(t.endonym);
      await dnc.openAddDialog(t.addNumber);
      await expect(dnc.dialog.getByRole('heading', { name: t.addDialogTitle, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: ARAMA (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Arama @regression', () => {
  /** @type {DncListPage} */
  let dnc;
  test.beforeEach(async ({ app }) => { dnc = app.dncList; await dnc.open(); });

  test('L1 tıklama OK: metin yazılabiliyor', async () => {
    await dnc.searchInput.fill('+1555');
    await expect(dnc.searchInput).toHaveValue('+1555');
  });

  test('L2 arka plan OK: arama liste ucunu yazılan terimle yeniden çağırıyor @critical', async ({ page }) => {
    // Arama parametre adını canlıda sabitlemiyoruz; ilk yüklemede olmayan yazılan
    // rakamlar (1234567) sorgu dizesinde belirmeli → bu istek aramanın kendisidir.
    const request = page.waitForRequest(
      (r) => r.url().includes(DncListPage.API.list) && r.url().includes('1234567') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await dnc.searchInput.fill('+15551234567');
    await request;
  });

  test('L3 görev OK: eşleşmeyen arama boş-durumu koruyor', async () => {
    await dnc.searchInput.fill('+19998887766');
    await expect(dnc.emptyState).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════ KPI KARTLARI — API↔UI DOĞRULUĞU (@data) ═══════════════
test.describe('DNC Listeleri — KPI doğruluğu @data', () => {
  test('"Total DNC Numbers" kartı liste ucundaki totalCount ile tutarlı', async ({ app, page }) => {
    const dnc = app.dncList;
    const jsonP = captureJson(page, `${DncListPage.API.list}?page=1`);
    await dnc.open();
    const body = await jsonP;
    const total = body?.data?.totalCount;
    expect(typeof total, 'liste yanıtı totalCount taşımalı').toBe('number');
    // "Total DNC Numbers" etiketinin kartında totalCount değeri görünmeli.
    await expect(
      dnc.page.getByText(I18N.en.cards[0], { exact: true }).locator('..'),
      'Total kartı totalCount değerini göstermeli'
    ).toContainText(String(total));
  });
});

// ═══════════════ BUTON: ADD NUMBER (L1 + L3) ═══════════════
test.describe('Buton: Add Number @regression', () => {
  /** @type {DncListPage} */
  let dnc;
  test.beforeEach(async ({ app }) => { dnc = app.dncList; await dnc.open(); });

  test('L1 tıklama OK: tıklanınca "Add Number to DNC" dialogu açılıyor', async () => {
    await dnc.openAddDialog();
    await expect(dnc.dialog.getByRole('heading', { name: I18N.en.addDialogTitle, exact: true })).toBeVisible();
  });

  test('L2 arka plan OK — N/A: dialog açılışı saf istemci-tarafı (network yok)', () => {
    // Kasıtlı boş: dialog açmak backend'e istek atmaz. Backend etkileşimi "Add to DNC"te.
  });

  test('L3 görev OK: dialog telefon alanı + sebep seçici + gönder butonunu gösteriyor', async () => {
    await dnc.openAddDialog();
    await expect(dnc.phoneInput).toBeVisible();
    await expect(dnc.reasonSelect).toBeVisible();
    await expect(dnc.addSubmit).toBeVisible();
  });

  test('Cancel dialogu kapatıyor', async () => {
    await dnc.openAddDialog();
    await dnc.dialogCancel.click();
    await expect(dnc.dialog).toBeHidden();
  });

  test('boş submit → "Phone number is required" validasyonu gösteriliyor (doğru davranış)', async () => {
    await dnc.openAddDialog();
    await dnc.addSubmit.click();
    await expect(dnc.dialog).toBeVisible(); // dialog açık kalır
    await expect(dnc.dialog.getByText(/Phone number is required/i)).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ KONTROL: REASON SEÇİCİSİ — dialog içi (L1 + L3) ═══════════════
test.describe('Kontrol: Reason seçicisi (dialog) @regression', () => {
  /** @type {DncListPage} */
  let dnc;
  test.beforeEach(async ({ app }) => { dnc = app.dncList; await dnc.open(); await dnc.openAddDialog(); });

  test('L1 tıklama OK: beş sebep seçeneği açılıyor', async () => {
    await dnc.reasonSelect.click();
    for (const opt of DncListPage.REASON_OPTIONS) {
      await expect(dnc.page.getByRole('option', { name: opt, exact: true })).toBeVisible();
    }
  });

  test('L2 arka plan OK — N/A: form seçimi saf istemci-tarafı (network yok)', () => {
    // Kasıtlı boş: sebep seçimi backend'e istek atmaz; submit'te gövdeye yansır.
  });

  test('L3 görev OK: "Legal Requirement" seçilince trigger değeri güncelleniyor', async () => {
    await dnc.selectReason('Legal Requirement');
    await expect(dnc.reasonSelect).toHaveText('Legal Requirement');
  });
});

// ═══════════════ BUTON: ADD TO DNC (SUBMIT) (L1 + L2) ═══════════════
// L3 (gerçek ekleme) = kalıcı mutation → prod'da N/A (staging mutation spec).
test.describe('Buton: Add to DNC (submit) @regression', () => {
  /** @type {DncListPage} */
  let dnc;
  test.beforeEach(async ({ app }) => { dnc = app.dncList; await dnc.open(); await dnc.openAddDialog(); });

  test('L1 tıklama OK: telefon+sebep doldurulup gönderilince dialog kapanıyor (POST route ile yakalanır, prod\'a yazılmaz)', async ({ page }) => {
    await page.route(`**${DncListPage.API.create}`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"id":"00000000-0000-4000-8000-000000000000"}}' });
      } else { await route.continue(); }
    });
    await dnc.phoneInput.fill('+15551234567');
    await dnc.selectReason('Customer Request');
    await dnc.addSubmit.click();
    await expect(dnc.dialog).toBeHidden({ timeout: 10000 });
  });

  test('L2 arka plan OK: gönderince POST /dnc gidiyor + gövde sözleşmesi (route ile yakalanır) @critical', async ({ page }) => {
    let postHit = false; let sentBody = null;
    await page.route(`**${DncListPage.API.create}`, async (route) => {
      if (route.request().method() === 'POST') {
        postHit = true; sentBody = route.request().postDataJSON();
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"id":"00000000-0000-4000-8000-000000000000"}}' });
      } else { await route.continue(); }
    });
    await dnc.phoneInput.fill('+15551234567');
    await dnc.selectReason('Customer Request');
    await dnc.addSubmit.click();
    await expect.poll(() => postHit, { timeout: 10000 }).toBe(true);
    expect(sentBody, 'POST gövdesi phoneNumber + reason taşımalı').toMatchObject({
      phoneNumber: '+15551234567',
      reason: 'Customer Request',
    });
  });

  test('L3 görev OK — N/A: gerçek ekleme kalıcı mutation, prod\'a yazmadan doğrulanamaz (bkz. mutasyon spec)', () => {
    // Kasıtlı boş: katman N/A olarak belgelendi. Gerçek ekleme + cleanup:
    // tests/campaigns-dnc.mutation.authed.spec.js
  });
});

// ═══════════════ BUTON: BULK IMPORT (L1 + L3) ═══════════════
test.describe('Buton: Bulk Import @regression', () => {
  /** @type {DncListPage} */
  let dnc;
  test.beforeEach(async ({ app }) => { dnc = app.dncList; await dnc.open(); });

  test('L1 tıklama OK: tıklanınca CSV içe-aktarma dialogu açılıyor', async () => {
    await dnc.openBulkImportDialog();
    await expect(dnc.dialog.getByRole('heading', { name: I18N.en.bulkDialogTitle, exact: true })).toBeVisible();
  });

  test('L2 arka plan OK — N/A: dialog açılışı saf istemci-tarafı; gerçek CSV upload = mutation (staging)', () => {
    // Kasıtlı boş: dialog açmak istek atmaz; CSV upload mutation'dır → staging.
  });

  test('L3 görev OK: dialog CSV yükleme + şablon indirme + Import kontrollerini gösteriyor', async () => {
    await dnc.openBulkImportDialog();
    await expect(dnc.dialog.getByText(/Upload a CSV file/i)).toBeVisible();
    await expect(dnc.dialog.getByRole('button', { name: /Download Template/i })).toBeVisible();
    await expect(dnc.dialog.getByRole('button', { name: /^Import$/i })).toBeVisible();
  });
});

// ═══════════════ BUTON: EXPORT (@export) ═══════════════
test.describe('DNC Listeleri — export @export @regression', () => {
  test('L1+L2: Export tıklanınca indirme başlıyor ve GET /dnc/export ucu çağrılıyor', async ({ app, page }) => {
    const dnc = app.dncList;
    await dnc.open();
    const reqP = page.waitForRequest(
      (r) => r.url().includes(DncListPage.API.export) && r.method() === 'GET',
      { timeout: 10000 }
    );
    const downloadP = page.waitForEvent('download', { timeout: 15000 });
    await dnc.exportButton.click();
    await reqP;
    const download = await downloadP;
    expect(download.suggestedFilename()).toMatch(/dnc/i);
  });
});

// ═══════════════ STİL: KLAVYE (@keyboard) ═══════════════
test.describe('DNC Listeleri — klavye @keyboard', () => {
  test('Add Number dialogunda odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const dnc = app.dncList;
    await dnc.open();
    const dialog = await dnc.openAddDialog();
    await expectDialogKeyboard(dnc.page, dialog);
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('DNC Listeleri — erişilebilirlik @a11y', () => {
  test('sayfada ve Add Number diyaloğunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const dnc = app.dncList;
    await dnc.open();
    await expectNoSevereA11y(dnc.page);
    await dnc.openAddDialog();
    await expectNoSevereA11y(dnc.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('DNC Listeleri — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/campaigns/dnc');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('DNC Listeleri — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const dnc = app.dncList;
    await dnc.open();
    await waitForUiToSettle(dnc.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('DNC Listeleri — deep-link @deeplink', () => {
  test('rota doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const dnc = app.dncList;
    await page.goto('/campaigns/dnc', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(dnc.shell.loginHeading).toBeHidden();
    await expect(dnc.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });
});

// ═══════════════ STİL: HATA YOLU (@errorpath) ═══════════════
test.describe('DNC Listeleri — hata yolu @errorpath', () => {
  test('liste ucu 500 dönünce sayfa çökmüyor (kabuk + başlık ayakta)', async ({ app, page }) => {
    await mockApi(page, `**${DncListPage.API.list}?**`, { status: 500 });
    const dnc = app.dncList;
    await page.goto('/campaigns/dnc', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(dnc.shell.loginHeading).toBeHidden();
    await expect(dnc.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });
});

// ═══════════════ BİLİNEN HATA (test.fail = bulgu açık) ═══════════════
test.describe('DNC Listeleri — bilinen hatalar @regression @known-bug', () => {
  // BULGU — Export ?format=csv istiyor ama indirilen dosya dnc-list.json.
  test('BULGU: Export csv istendiğinde indirilen dosya .csv olmalı (şu an .json)', async ({ app, page }) => {
    test.fail(); // BULGU açıkken beklenen başarısızlık
    const dnc = app.dncList;
    await dnc.open();
    const downloadP = page.waitForEvent('download', { timeout: 15000 });
    await dnc.exportButton.click();
    const download = await downloadP;
    // Export ucu ?format=csv çağırıyor → dosya .csv beklenir; gerçekte .json iniyor.
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });
});
