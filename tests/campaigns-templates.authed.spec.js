// @ts-check
import { test, expect } from './fixtures/test.js';
import { TemplatesPage } from './pages/TemplatesPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * KAMPANYALAR → ŞABLONLAR (`/campaigns/templates`) — SMS Templates
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/templates/NOTLAR.md (PII-maskeli artefaktlar).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com (4 dil + network + DOM inspection).
 *
 * ┌─ HER İNTERAKTİF KONTROL İÇİN 3 KATMAN ─────────────────────────────────────┐
 * │ L1 — TIKLAMA OK · L2 — ARKA PLAN (mutation `page.route` ile, PROD'A YAZILMAZ)│
 * │ L3 — GÖREV OK (kalıcı mutation → prod'da N/A, staging mutation spec)         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Bilinen hatalar (test.fail = bulgu HÂLÂ AÇIK):
 *   BULGU A — Message Body placeholder'ı ham çeviri anahtarı "campaigns.templateContentPlaceholder".
 *   BULGU B — Satır Edit/Delete ikonları erişilebilir isimsiz (a11y button-name).
 *
 * Gerçek oluşturma/düzenleme/silme = mutation → staging spec:
 *   tests/campaigns-templates.mutation.authed.spec.js
 */

const I18N = TemplatesPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('SMS Şablonları — yapı @smoke', () => {
  /** @type {TemplatesPage} */
  let tp;
  test.beforeEach(async ({ app }) => { tp = app.templates; await tp.open(); });

  test('başlık ve alt başlık görünüyor @critical', async () => {
    await expect(tp.heading).toHaveText(I18N.en.heading);
    await expect(tp.page.getByText(I18N.en.subtitle, { exact: true }).first()).toBeVisible();
  });

  test('New Template butonu ve tablo mevcut', async () => {
    await expect(tp.newButton).toBeVisible();
    await expect(tp.newButton).toBeEnabled();
    await expect(tp.table).toBeVisible();
  });

  test('tablo başlıkları doğru sırada @critical', async () => {
    for (const header of I18N.en.headers) {
      await expect(tp.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
    }
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────────
test.describe('SMS Şablonları — 4 dil çeviri guard\'ları @regression @i18n', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık/buton/tablo başlıkları çevrili`, async ({ app }) => {
      const tp = app.templates;
      await tp.open();
      if (t.endonym) await tp.shell.switchLanguage(t.endonym);

      await expect(tp.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(tp.page.locator('html')).toHaveAttribute('lang', code);
      await expect(tp.heading).toHaveText(t.heading);
      await expect(tp.page.getByText(t.subtitle, { exact: true }).first()).toBeVisible();
      await expect(tp.buttonFor(t.newButton)).toBeVisible();
      for (const header of t.headers) {
        await expect(tp.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
      }
    });
  }
});

// ═══════════════ BUTON: NEW TEMPLATE (L1 + L2 + L3) ═══════════════
test.describe('Buton: New Template @regression', () => {
  /** @type {TemplatesPage} */
  let tp;
  test.beforeEach(async ({ app }) => { tp = app.templates; await tp.open(); });

  test('L1 tıklama OK: tıklanınca "Create Template" dialogu açılıyor', async () => {
    await tp.openCreateDialog();
    await expect(tp.dialog.getByRole('heading', { name: I18N.en.createDialogTitle, exact: true })).toBeVisible();
  });

  test('L2 arka plan OK — N/A: dialog açılışı saf istemci-tarafı (network yok)', () => {
    // Kasıtlı boş: dialog açmak backend'e istek atmaz. Backend etkileşimi "Create"te.
  });

  test('L3 görev OK: dialog ad + gövde alanları ve GSM-7 sayacını gösteriyor', async () => {
    await tp.openCreateDialog();
    await expect(tp.nameInput).toBeVisible();
    await expect(tp.bodyInput).toBeVisible();
    await expect(tp.dialog.getByText(/GSM-7/)).toBeVisible();
    await expect(tp.dialog.getByText(/0\/160/)).toBeVisible();
  });

  test('Create butonu boş alanla disabled, alanlar dolunca enable (validasyon)', async () => {
    await tp.openCreateDialog();
    await expect(tp.createSubmit).toBeDisabled();
    await tp.nameInput.fill('PW Guard Template');
    await tp.bodyInput.fill('Hello from guard');
    await expect(tp.createSubmit).toBeEnabled();
  });

  test('Cancel dialogu kapatıyor', async () => {
    await tp.openCreateDialog();
    await tp.dialogCancel.click();
    await expect(tp.dialog).toBeHidden();
  });
});

// ═══════════════ KONTROL: GSM-7 KARAKTER SAYACI (L1 + L3) ═══════════════
test.describe('Kontrol: Mesaj karakter sayacı @regression', () => {
  test('L3 görev OK: gövdeye yazınca sayaç kalan karakteri doğru güncelliyor', async ({ app }) => {
    const tp = app.templates;
    await tp.open();
    await tp.openCreateDialog();
    await expect(tp.dialog.getByText(/0\/160/)).toBeVisible();
    await tp.bodyInput.fill('12345'); // 5 karakter
    await expect(tp.dialog.getByText(/5\/160/)).toBeVisible();
  });
});

// ═══════════════ BUTON: CREATE (SUBMIT) (L1 + L2) ═══════════════
// L3 (gerçek oluşturma) = kalıcı mutation → prod'da N/A (staging mutation spec).
test.describe('Buton: Create (submit) @regression', () => {
  /** @type {TemplatesPage} */
  let tp;
  test.beforeEach(async ({ app }) => { tp = app.templates; await tp.open(); await tp.openCreateDialog(); });

  test('L1 tıklama OK: alanlar doldurulup gönderilince dialog kapanıyor (POST route ile yakalanır, prod\'a yazılmaz)', async ({ page }) => {
    await page.route(`**${TemplatesPage.API.create}`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"id":"00000000-0000-4000-8000-000000000000"}}' });
      } else { await route.continue(); }
    });
    await tp.nameInput.fill('PW Test Template');
    await tp.bodyInput.fill('Hello from E2E');
    await tp.createSubmit.click();
    await expect(tp.dialog).toBeHidden({ timeout: 10000 });
  });

  test('L2 arka plan OK: gönderince POST /channels/templates/sms gidiyor + gövde sözleşmesi @critical', async ({ page }) => {
    let postHit = false; let sentBody = null;
    await page.route(`**${TemplatesPage.API.create}`, async (route) => {
      if (route.request().method() === 'POST') {
        postHit = true; sentBody = route.request().postDataJSON();
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"id":"00000000-0000-4000-8000-000000000000"}}' });
      } else { await route.continue(); }
    });
    await tp.nameInput.fill('PW Test Template');
    await tp.bodyInput.fill('Hello from E2E');
    await tp.createSubmit.click();
    await expect.poll(() => postHit, { timeout: 10000 }).toBe(true);
    expect(sentBody, 'POST gövdesi name + content taşımalı').toMatchObject({
      name: 'PW Test Template',
      content: 'Hello from E2E',
    });
  });

  test('L3 görev OK — N/A: gerçek oluşturma kalıcı mutation, prod\'a yazmadan doğrulanamaz (bkz. mutasyon spec)', () => {
    // Kasıtlı boş: katman N/A olarak belgelendi. Gerçek create + cleanup:
    // tests/campaigns-templates.mutation.authed.spec.js
  });
});

// ═══════════════ SATIR AKSİYON: EDIT (L1 + L3) ═══════════════
test.describe('Satır: Edit Template @regression', () => {
  /** @type {TemplatesPage} */
  let tp;
  test.beforeEach(async ({ app }) => { tp = app.templates; await tp.open(); });

  test('L1 tıklama OK: Edit ikonu "Edit Template" dialogunu açıyor', async () => {
    await tp.rowAction(tp.rows.first(), 'edit').click();
    await expect(tp.dialog.getByRole('heading', { name: 'Edit Template', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('L3 görev OK: Edit dialogu mevcut şablon adıyla ön-dolu açılıyor (kaynak↔dialog tutarlılığı)', async () => {
    const nameCell = (await tp.rows.first().locator('td').first().innerText()).trim();
    await tp.rowAction(tp.rows.first(), 'edit').click();
    await expect(tp.dialog).toBeVisible({ timeout: 10000 });
    // Ad alanı satırdaki adla dolu gelmeli (görünüm tutarlılığı).
    await expect(tp.nameInput).toHaveValue(nameCell);
  });
});

// ═══════════════ SATIR AKSİYON: DELETE (L1 + L2) ═══════════════
// L3 (gerçek silme) = kalıcı mutation → prod'da N/A. MEVCUT şablon SİLİNMEZ:
// L1 onay dialogunu iptal eder; L2 DELETE'i route ile yakalar (prod'a YAZILMAZ).
test.describe('Satır: Delete Template @regression', () => {
  /** @type {TemplatesPage} */
  let tp;
  test.beforeEach(async ({ app }) => { tp = app.templates; await tp.open(); });

  test('L1 tıklama OK: Delete ikonu kalıcı-silme onay dialogu açıyor; İptal hiçbir şeyi silmez', async () => {
    await tp.rowAction(tp.rows.first(), 'delete').click();
    await expect(tp.confirmDialog).toBeVisible({ timeout: 10000 });
    await expect(tp.confirmDialog).toContainText(/cannot be undone/i);
    await tp.confirmDialog.getByRole('button', { name: /^Cancel$/i }).click();
    await expect(tp.confirmDialog).toBeHidden();
  });

  test('L2 arka plan OK: onaylayınca DELETE …/templates/sms/{id} gidiyor (route ile yakalanır, prod\'a yazılmaz) @critical', async ({ page }) => {
    let deleteHit = false;
    await page.route(TemplatesPage.API.itemGlob, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteHit = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
      } else { await route.continue(); }
    });
    await tp.rowAction(tp.rows.first(), 'delete').click();
    await expect(tp.confirmDialog).toBeVisible({ timeout: 10000 });
    await tp.confirmDialog.getByRole('button', { name: /^Delete$/i }).click();
    await expect.poll(() => deleteHit, { timeout: 10000 }).toBe(true);
  });

  test('L3 görev OK — N/A: gerçek silme kalıcı mutation, prod\'a yazmadan doğrulanamaz (bkz. mutasyon spec)', () => {
    // Kasıtlı boş: katman N/A. Gerçek silme (kendi oluşturduğumuz şablon):
    // tests/campaigns-templates.mutation.authed.spec.js
  });
});

// ═══════════════ STİL: KLAVYE (@keyboard) ═══════════════
test.describe('SMS Şablonları — klavye @keyboard', () => {
  test('Create dialogunda odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const tp = app.templates;
    await tp.open();
    const dialog = await tp.openCreateDialog();
    await expectDialogKeyboard(tp.page, dialog);
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('SMS Şablonları — erişilebilirlik @a11y', () => {
  test('sayfada ve Create diyaloğunda ciddi/kritik a11y ihlali yok (bilinen borç hariç)', async ({ app }) => {
    const tp = app.templates;
    await tp.open();
    await expectNoSevereA11y(tp.page);
    await tp.openCreateDialog();
    await expectNoSevereA11y(tp.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('SMS Şablonları — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/campaigns/templates');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
// BULGU C — sayfa yüklenirken console-error "INVALID_MESSAGE: MALFORMED_ARGUMENT"
// iki kez atılıyor (templates/page bundle). Muhtemelen BULGU A ile aynı kök neden:
// i18n mesaj formatlayıcı bozuk/eksik bir çeviri anahtarında patlıyor. Düzelene kadar
// @clean bir @known-bug guard'ıdır (test.fail); düzelince "beklenmedik geçiş" → guard kaldırılır.
test.describe('SMS Şablonları — console/ağ temizliği @clean @known-bug', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    test.fail(); // BULGU C açıkken beklenen başarısızlık (INVALID_MESSAGE: MALFORMED_ARGUMENT)
    const tp = app.templates;
    await tp.open();
    await waitForUiToSettle(tp.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('SMS Şablonları — deep-link @deeplink', () => {
  test('rota doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const tp = app.templates;
    await page.goto('/campaigns/templates', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(tp.shell.loginHeading).toBeHidden();
    await expect(tp.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });
});

// ═══════════════ STİL: HATA YOLU (@errorpath) ═══════════════
test.describe('SMS Şablonları — hata yolu @errorpath', () => {
  test('liste ucu 500 dönünce sayfa çökmüyor (kabuk + başlık ayakta)', async ({ app, page }) => {
    await mockApi(page, `**${TemplatesPage.API.list}**`, { status: 500 });
    const tp = app.templates;
    await page.goto('/campaigns/templates', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(tp.shell.loginHeading).toBeHidden();
    await expect(tp.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });

  test('liste ucu boş dönünce sayfa yine de yükleniyor (boş liste)', async ({ app, page }) => {
    await mockApi(page, `**${TemplatesPage.API.list}**`, {
      status: 200,
      body: JSON.stringify({ success: true, data: { data: [] } }),
    });
    const tp = app.templates;
    await page.goto('/campaigns/templates', { waitUntil: 'commit' });
    await expect(tp.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });
});

// ═══════════════ BİLİNEN HATALAR (test.fail = bulgu açık) ═══════════════
test.describe('SMS Şablonları — bilinen hatalar @regression @known-bug', () => {
  // BULGU A — Message Body placeholder'ı ham çeviri anahtarı.
  test('BULGU A: Message Body placeholder\'ı ham çeviri anahtarı olmamalı', async ({ app }) => {
    test.fail(); // BULGU A açıkken beklenen başarısızlık
    const tp = app.templates;
    await tp.open();
    await tp.openCreateDialog();
    const ph = await tp.bodyInput.getAttribute('placeholder');
    // Ham anahtar (nokta içeren "campaigns.xxx") son kullanıcıya sızmamalı.
    expect(ph, `placeholder ham çeviri anahtarı sızdırıyor: "${ph}"`).not.toMatch(/^[a-z]+\.[a-zA-Z]+/);
  });

  // BULGU B — satır Edit/Delete ikonları erişilebilir isimsiz.
  test('BULGU B: satır Edit/Delete ikonlarının erişilebilir ismi olmalı', async ({ app }) => {
    test.fail(); // BULGU B açıkken beklenen başarısızlık
    const tp = app.templates;
    await tp.open();
    await expect(tp.rowAction(tp.rows.first(), 'edit')).toHaveAccessibleName(/.+/, { timeout: 4000 });
    await expect(tp.rowAction(tp.rows.first(), 'delete')).toHaveAccessibleName(/.+/, { timeout: 4000 });
  });
});
