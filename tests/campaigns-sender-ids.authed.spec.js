// @ts-check
import { test, expect } from './fixtures/test.js';
import { SenderIdsPage } from './pages/SenderIdsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * KAMPANYALAR → GÖNDERİCİ KİMLİKLERİ (`/campaigns/sender-ids`)
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/sender-ids/NOTLAR.md (PII-maskeli artefaktlar).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com (4 dil + network + DOM inspection).
 *
 * ┌─ HER İNTERAKTİF KONTROL İÇİN 3 KATMAN ─────────────────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol görünür/etkin, tıklanınca UI gözlemlenebilir tepki │
 * │ L2 — ARKA PLAN OK: doğru uca network isteği (method+endpoint+2xx).           │
 * │                    Mutation `page.route` ile yakalanır (PROD'A YAZILMAZ).    │
 * │ L3 — GÖREV OK   : kontrolün amacı gerçekten gerçekleşiyor (liste filtrelenir,│
 * │                    dialog açılır, sonuç ölçüte uyar …). Kalıcı mutation N/A. │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Bilinen hatalar (test.fail = bulgu HÂLÂ AÇIK, düzelince "beklenmedik geçiş"):
 *   BULGU A — Request dialogunda boş zorunlu alanla submit: buton hep enabled,
 *             POST gitmiyor ama görünür validasyon mesajı / aria-invalid YOK (a11y/UX).
 *   BULGU B — Yardım metni "max 11 chars" derken input maxlength=20 (tutarsızlık).
 *
 * Gerçek talep oluşturma (POST /sender-ids) = mutation → staging spec:
 *   tests/campaigns-sender-ids.mutation.authed.spec.js
 */

const I18N = SenderIdsPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Gönderici Kimlikleri — yapı @smoke', () => {
  /** @type {SenderIdsPage} */
  let sp;
  test.beforeEach(async ({ app }) => {
    sp = app.senderIds;
    await sp.open();
  });

  test('başlık ve alt başlık görünüyor @critical', async () => {
    await expect(sp.heading).toHaveText(I18N.en.heading);
    await expect(sp.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('Request Sender ID butonu, durum filtresi ve tablo mevcut', async () => {
    await expect(sp.requestButton).toBeVisible();
    await expect(sp.requestButton).toBeEnabled();
    await expect(sp.statusFilter).toHaveText(I18N.en.filterAll);
    await expect(sp.table).toBeVisible();
  });

  test('tablo başlıkları doğru sırada @critical', async () => {
    for (const header of I18N.en.headers) {
      await expect(sp.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
    }
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────────
// i18n bu sayfada sağlam (sızıntı yok) → yeşil guard'lar. Bir çeviri bozulursa
// hangi etiketin/dilin regrese olduğu net görünür.
test.describe('Gönderici Kimlikleri — 4 dil çeviri guard\'ları @regression @i18n', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık/buton/filtre/tablo başlıkları çevrili`, async ({ app }) => {
      const sp = app.senderIds;
      await sp.open();
      if (t.endonym) await sp.shell.switchLanguage(t.endonym);

      await expect(sp.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(sp.page.locator('html')).toHaveAttribute('lang', code);
      await expect(sp.heading).toHaveText(t.heading);
      await expect(sp.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(sp.requestButtonFor(t.requestButton)).toBeVisible();
      await expect(sp.statusFilter).toHaveText(t.filterAll);
      for (const header of t.headers) {
        await expect(sp.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
      }
    });

    test(`[${code}] Request dialog başlığı çevrili`, async ({ app }) => {
      const sp = app.senderIds;
      await sp.open();
      if (t.endonym) await sp.shell.switchLanguage(t.endonym);
      await sp.openRequestDialog(t.requestButton);
      await expect(sp.dialog.getByRole('heading', { name: t.dialogTitle, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: DURUM FİLTRESİ (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Durum filtresi @regression', () => {
  /** @type {SenderIdsPage} */
  let sp;
  test.beforeEach(async ({ app }) => { sp = app.senderIds; await sp.open(); });

  test('L1 tıklama OK: seçilen değer trigger\'da güncelleniyor', async () => {
    await sp.selectStatus('Approved');
    await expect(sp.statusFilter).toHaveText('Approved');
  });

  test('L2 arka plan OK: status filtresiyle liste ucunu çağırıyor @critical', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => r.url().includes(SenderIdsPage.API.list) && r.url().includes('PENDING') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await sp.selectStatus('Pending');
    await request; // tetiklenmezse timeout → kırılır
  });

  // L3 — her statü seçilince listede yalnız o statü kalmalı (boş-durum da geçerli).
  // Keşif: Approved→3 satır (hepsi APPROVED), Pending/Rejected/Docs→boş-durum.
  const BADGES = { Approved: 'APPROVED', Pending: 'PENDING', Rejected: 'REJECTED' };
  for (const [label, badge] of Object.entries(BADGES)) {
    test(`L3 görev OK: "${label}" seçilince yalnız ${badge} kayıtları (ya da boş-durum)`, async () => {
      await sp.selectStatus(label);
      // Diğer statülerin rozeti listede KALMAMALI.
      for (const other of Object.values(BADGES).filter((b) => b !== badge)) {
        await expect(
          sp.statusBadge(other),
          `${label} filtresinde ${other} rozeti görünmemeli`
        ).toHaveCount(0, { timeout: 10000 });
      }
      // Sonuç: ya seçilen statü rozeti var ya da boş-durum metni.
      const badgeCount = await sp.statusBadge(badge).count();
      if (badgeCount === 0) {
        await expect(sp.emptyState).toBeVisible();
      }
    });
  }
});

// ═══════════════ BUTON: REQUEST SENDER ID (L1 + L2 + L3) ═══════════════
test.describe('Buton: Request Sender ID @regression', () => {
  /** @type {SenderIdsPage} */
  let sp;
  test.beforeEach(async ({ app }) => { sp = app.senderIds; await sp.open(); });

  test('L1 tıklama OK: tıklanınca talep dialogu açılıyor', async () => {
    await sp.openRequestDialog();
    await expect(sp.dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
  });

  test('L2 arka plan OK — N/A: dialog açılışı saf istemci-tarafı (network yok)', () => {
    // Kasıtlı boş: dialog açmak backend'e istek atmaz (gözlemlendi) → L2 yok.
    // Backend etkileşimi Submit Request'te (aşağıda) doğrulanır.
  });

  test('L3 görev OK: dialog talep formu alanlarını (Sender ID/Type/Purpose/belge) gösteriyor', async () => {
    await sp.openRequestDialog();
    await expect(sp.senderIdInput).toBeVisible();
    await expect(sp.typeSelect).toBeVisible();
    await expect(sp.purposeInput).toBeVisible();
    await expect(sp.dialog.getByRole('button', { name: 'Choose Files' })).toBeVisible();
    await expect(sp.submitButton).toBeVisible();
  });

  test('Cancel dialogu kapatıyor', async () => {
    await sp.openRequestDialog();
    await sp.cancelButton.click();
    await expect(sp.dialog).toBeHidden();
  });
});

// ═══════════════ KONTROL: TÜR (TYPE) SEÇİCİSİ — dialog içi (L1 + L3) ═══════════════
// Saf istemci-tarafı form kontrolü → L2 (backend) N/A.
test.describe('Kontrol: Tür seçicisi (dialog) @regression', () => {
  /** @type {SenderIdsPage} */
  let sp;
  test.beforeEach(async ({ app }) => { sp = app.senderIds; await sp.open(); await sp.openRequestDialog(); });

  test('L1 tıklama OK: seçenekler açılıyor (Alphanumeric/Numeric/Shortcode)', async () => {
    await sp.typeSelect.click();
    for (const opt of SenderIdsPage.TYPE_OPTIONS) {
      await expect(sp.page.getByRole('option', { name: opt, exact: true })).toBeVisible();
    }
  });

  test('L2 arka plan OK — N/A: form seçimi saf istemci-tarafı (network yok)', () => {
    // Kasıtlı boş: tür seçimi backend'e istek atmaz; submit'te gövdeye yansır.
  });

  test('L3 görev OK: "Numeric" seçilince trigger değeri güncelleniyor', async () => {
    await sp.typeSelect.click();
    await sp.page.getByRole('option', { name: 'Numeric', exact: true }).click();
    await expect(sp.typeSelect).toHaveText('Numeric');
  });
});

// ═══════════════ BUTON: SUBMIT REQUEST (L1 + L2) ═══════════════
// L3 (gerçek talep oluşturma) = kalıcı mutation → prod'da N/A (staging mutation spec).
test.describe('Buton: Submit Request @regression', () => {
  /** @type {SenderIdsPage} */
  let sp;
  test.beforeEach(async ({ app }) => { sp = app.senderIds; await sp.open(); await sp.openRequestDialog(); });

  test('L1 tıklama OK: alanlar doldurulup gönderilince dialog kapanıyor (POST route ile yakalanır, prod\'a yazılmaz)', async ({ page }) => {
    await page.route(`**${SenderIdsPage.API.create}`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"id":"00000000-0000-4000-8000-000000000000"}}' });
      } else {
        await route.continue();
      }
    });
    await sp.senderIdInput.fill('E2ETESTSID');
    await sp.purposeInput.fill('e2e guard purpose');
    await sp.submitButton.click();
    await expect(sp.dialog).toBeHidden({ timeout: 10000 });
  });

  test('L2 arka plan OK: gönderince POST /sender-ids gidiyor (route ile yakalanır) @critical', async ({ page }) => {
    let postHit = false;
    let sentBody = null;
    await page.route(`**${SenderIdsPage.API.create}`, async (route) => {
      if (route.request().method() === 'POST') {
        postHit = true;
        sentBody = route.request().postDataJSON();
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"success":true,"data":{"id":"00000000-0000-4000-8000-000000000000"}}' });
      } else {
        await route.continue();
      }
    });
    await sp.senderIdInput.fill('E2ETESTSID');
    await sp.purposeInput.fill('e2e guard purpose');
    await sp.submitButton.click();
    await expect.poll(() => postHit, { timeout: 10000 }).toBe(true);
    // Sözleşme: gövde beklenen alanları taşımalı.
    expect(sentBody, 'POST gövdesi senderId/senderType taşımalı').toMatchObject({
      senderId: 'E2ETESTSID',
      senderType: 'ALPHANUMERIC',
    });
  });

  test('L3 görev OK — N/A: gerçek talep kalıcı mutation, prod\'a yazmadan doğrulanamaz (bkz. mutasyon spec)', () => {
    // Kasıtlı boş: katman N/A olarak belgelendi (sessiz atlanmadı).
    // Gerçek oluşturma + cleanup: tests/campaigns-sender-ids.mutation.authed.spec.js
  });
});

// ═══════════════ STİL: KLAVYE (@keyboard) ═══════════════
test.describe('Gönderici Kimlikleri — klavye @keyboard', () => {
  test('Request dialogunda odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const sp = app.senderIds;
    await sp.open();
    const dialog = await sp.openRequestDialog();
    await expectDialogKeyboard(sp.page, dialog);
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Gönderici Kimlikleri — erişilebilirlik @a11y', () => {
  test('sayfada ve talep diyaloğunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const sp = app.senderIds;
    await sp.open();
    await expectNoSevereA11y(sp.page); // bilinen borç (button-name/contrast) hariç
    await sp.openRequestDialog();
    await expectNoSevereA11y(sp.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Gönderici Kimlikleri — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/campaigns/sender-ids');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Gönderici Kimlikleri — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const sp = app.senderIds;
    await sp.open();
    await waitForUiToSettle(sp.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Gönderici Kimlikleri — deep-link @deeplink', () => {
  test('rota doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const sp = app.senderIds;
    await page.goto('/campaigns/sender-ids', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(sp.shell.loginHeading).toBeHidden();
    await expect(sp.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });
});

// ═══════════════ STİL: HATA YOLU (@errorpath) ═══════════════
test.describe('Gönderici Kimlikleri — hata yolu @errorpath', () => {
  test('liste ucu 500 dönünce sayfa çökmüyor (kabuk + başlık ayakta)', async ({ app, page }) => {
    await mockApi(page, `**${SenderIdsPage.API.list}**`, { status: 500 });
    const sp = app.senderIds;
    await page.goto('/campaigns/sender-ids', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    // Zarif başarısızlık: kabuk + başlık render olmalı, login'e düşmemeli.
    await expect(sp.shell.loginHeading).toBeHidden();
    await expect(sp.heading).toHaveText(I18N.en.heading, { timeout: 30000 });
  });

  test('liste ucu boş dönünce boş-durum gösteriliyor', async ({ app, page }) => {
    await mockApi(page, `**${SenderIdsPage.API.list}**`, {
      status: 200,
      body: JSON.stringify({ success: true, data: { data: [], hasNextPage: false, total: 0 } }),
    });
    const sp = app.senderIds;
    await page.goto('/campaigns/sender-ids', { waitUntil: 'commit' });
    await expect(sp.emptyState).toBeVisible({ timeout: 30000 });
  });
});

// ═══════════════ BİLİNEN HATALAR (test.fail = bulgu açık) ═══════════════
test.describe('Gönderici Kimlikleri — bilinen hatalar @regression @known-bug', () => {
  // BULGU A — boş zorunlu alanla submit: görünür validasyon mesajı / aria-invalid YOK.
  test('BULGU A: boş zorunlu alanla submit görünür validasyon göstermeli', async ({ app }) => {
    test.fail(); // BULGU A açıkken beklenen başarısızlık
    const sp = app.senderIds;
    await sp.open();
    await sp.openRequestDialog();
    await sp.submitButton.click();
    // Dialog açık kalır (POST gitmez) — doğru davranış AMA kullanıcıya geri bildirim yok.
    await expect(sp.dialog).toBeVisible();
    // Beklenen (bulgu açıkken karşılanmaz): erişilebilir bir validasyon mesajı ya da aria-invalid.
    const invalid = sp.senderIdInput.and(sp.page.locator('[aria-invalid="true"]'));
    const errorMsg = sp.dialog.getByRole('alert')
      .or(sp.dialog.getByText(/required|zorunlu|gerekli|obligatoire|مطلوب/i));
    await expect(invalid.or(errorMsg).first()).toBeVisible({ timeout: 4000 });
  });

  // BULGU B — yardım metni "max 11 chars" der ama input maxlength=20.
  test('BULGU B: Sender ID input\'u yardım metnindeki 11 karakter sınırını uygulamalı', async ({ app }) => {
    test.fail(); // BULGU B açıkken beklenen başarısızlık
    const sp = app.senderIds;
    await sp.open();
    await sp.openRequestDialog();
    // Yardım metni "max 11 chars" diyor → maxlength 11 beklenir; gerçekte 20.
    await expect(sp.senderIdInput).toHaveAttribute('maxlength', '11');
  });
});
