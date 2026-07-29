// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { DashboardsPage } from './pages/DashboardsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * RAPORLAR › PANOLAR (`/reports/dashboards`)
 *
 * Keşif + kanıt: docs/reports-panolar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER KONTROL İÇİN 3 KATMAN ─────────────────────────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol tepki veriyor (diyalog/aria/değer/toast).      │
 * │ L2 — ARKA PLAN  : doğru uca network (method+endpoint+2xx). Saf istemci   │
 * │                   kontrolde YOK (N/A) → açıkça belirtilir.               │
 * │ L3 — GÖREV OK   : amaç gerçekleşiyor (filtre, clipboard, builder açılır).│
 * └──────────────────────────────────────────────────────────────────────────┘
 * Böylece bir kontrol bozulunca HANGİ KATMANDA koptuğu netçe görünür.
 *
 * Mutasyon gerektiren doğrulama (Create/Duplicate/Delete kalıcı sonucu) prod'a
 * yazmadan güvenli yapılamaz → `tests/reports-dashboards-mutations.authed.spec.js`
 * içinde (mutation etiketli) `test.fixme` iskeleti.
 *
 * `test.fail()` = bulgu HÂLÂ AÇIK (doğru davranışı doğrular; bug açıkken "beklenen
 * başarısızlık", düzelince "beklenmedik geçiş" → o zaman kalıcı guard'a çevrilir).
 *
 * Bilinen hata: BULGU 1 (Paylaş diyaloğu yatay taşıyor — Paylaş L3).
 */

const I18N = DashboardsPage.I18N;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Panolar — yapı', () => {
  /** @type {DashboardsPage} */
  let dashboards;

  test.beforeEach(async ({ app }) => {
    dashboards = app.dashboards;
    await dashboards.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(dashboards.heading).toHaveText(I18N.en.heading);
    await expect(dashboards.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('üç sekme görünüyor (Tümü / Varsayılan / Özel) @smoke', async () => {
    for (const name of I18N.en.tabs) {
      await expect(dashboards.tab(name)).toBeVisible();
    }
  });

  test('bölüm başlıkları görünüyor (Varsayılan / Özel Panolar) @smoke', async () => {
    for (const name of I18N.en.sections) {
      await expect(dashboards.page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
  });

  test('"Create Dashboard" eylem düğmesi görünüyor @smoke', async () => {
    await expect(dashboards.createButton()).toBeVisible();
  });

  test('en az bir özel pano kartı listeleniyor @critical', async () => {
    // Veri-bağımsız: sayıyı sabitleme; yalnızca "≥1 özel pano var" (paylaş ikonuyla sayılır).
    // toBeVisible auto-retry → kartlar skeleton'dan sonra render olurken flaky sayımı önler.
    await expect(dashboards.customShareButtons.first()).toBeVisible({ timeout: 15000 });
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@regression) ────────────────────────
test.describe("Panolar — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + sekme/bölüm/eylem etiketleri çevrili`, async ({ app }) => {
      const dashboards = app.dashboards;
      await dashboards.open();
      if (t.endonym) await dashboards.switchLanguage(t.endonym);

      // Dil oturana kadar yerelleştirilmiş başlığı bekle (skeleton'a karşı çapa).
      await expect(dashboards.heading).toHaveText(t.heading, { timeout: 15000 });
      await expect(dashboards.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(dashboards.page.locator('html')).toHaveAttribute('lang', t.lang);

      await expect(dashboards.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      for (const name of t.tabs) {
        await expect(dashboards.tab(name)).toBeVisible();
      }
      for (const name of t.sections) {
        await expect(dashboards.page.getByRole('heading', { name, exact: true })).toBeVisible();
      }
      await expect(dashboards.createButton(t.create)).toBeVisible();
      await expect(dashboards.editButton(t.edit)).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: SEKME FİLTRESİ (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — sekme salt istemci-tarafı filtre (tıklamada 0 network).
test.describe('Kontrol: Sekme filtresi @regression', () => {
  /** @type {DashboardsPage} */
  let dashboards;
  test.beforeEach(async ({ app }) => { dashboards = app.dashboards; await dashboards.open(); });

  test('L1 tıklama OK: sekmeye tıklayınca seçili duruma geçiyor', async () => {
    for (const name of I18N.en.tabs) {
      const tab = dashboards.tab(name);
      await expect(async () => {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
      }).toPass({ timeout: 15000 });
    }
  });

  test('L3 görev OK: sekme kart listesini gerçekten filtreliyor', async () => {
    // Kartlar render olana kadar bekle (skeleton'a karşı), sonra say.
    await expect(dashboards.customShareButtons.first()).toBeVisible({ timeout: 15000 });
    const total = await dashboards.customCardCount();
    expect(total, 'en az 1 özel pano beklenir').toBeGreaterThan(0);

    // Varsayılan sekmesi → özel kartlar gizlenir (0).
    await dashboards.tab(I18N.en.tabs[1]).click();
    await expect(dashboards.customShareButtons).toHaveCount(0);

    // Özel sekmesi → özel kartlar geri gelir (toplamla aynı).
    await dashboards.tab(I18N.en.tabs[2]).click();
    await expect(dashboards.customShareButtons).toHaveCount(total);
  });
});

// ═══════════════ KONTROL: PAYLAŞ (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — paylaşım bağlantısı pano id'sinden istemci tarafında üretilir
// (diyalog açılışında 0 network — keşifte doğrulandı).
test.describe('Kontrol: Paylaş @regression', () => {
  /** @type {DashboardsPage} */
  let dashboards;
  test.beforeEach(async ({ app }) => { dashboards = app.dashboards; await dashboards.open(); });

  test('L1 tıklama OK: paylaş diyaloğu açılıyor ve bağlantıyı gösteriyor @critical', async () => {
    const dialog = await dashboards.openShareDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.shareTitle })).toBeVisible();
    await expect(dialog.getByText(/\/reports\/dashboards\?id=/)).toBeVisible();
  });

  // L3 görev OK: diyalog içeriği kartın içinde kalmalı (yatayda taşmamalı).
  // BULGU 1: uzun URL diyaloğu ~266px taşırıyor (flex-1 kapsayıcıda min-w-0 yok) → beklenen başarısızlık.
  // Yöne DUYARSIZ ölçüm: scrollWidth-clientWidth (sağ-kenar kontrolü RTL'de taşmayı kaçırır).
  for (const [code, t] of Object.entries(I18N)) {
    test(`L3 görev OK: [${code}] paylaş diyaloğu yatayda taşmamalı [BULGU 1] @layout @known-bug`, async ({ app }) => {
      test.fail(); // BULGU 1 açıkken beklenen başarısızlık (yalnızca bu testi işaretler)
      const d = app.dashboards;
      await d.open();
      if (t.endonym) await d.switchLanguage(t.endonym);
      const dialog = await d.openShareDialog();
      await expect(dialog.getByRole('heading', { name: t.shareTitle })).toBeVisible();

      const overflow = await d.dialogHorizontalOverflowPx();
      expect(overflow, `diyalog yatay taşma=${overflow}px (BULGU 1: min-w-0 eksik)`).toBeLessThanOrEqual(2);
    });
  }
});

// ═══════════════ KONTROL: KOPYALA BAĞLANTI (diyalog içi) (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — clipboard işlemi, network isteği beklenmez.
// NOT: Headless tarayıcıda clipboard yazımı için izin GEREKİR (gerçek tarayıcıda kullanıcı
// jesti ile izinsiz çalışır — uygulama hatası değil). İzin verilmezse uygulama "Failed to
// copy link" gösterir. Bu yüzden iki test de izin verir ve Chromium'a kısıtlıdır.
test.describe('Kontrol: Kopyala bağlantı @regression', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'clipboard izni yalnızca Chromium\'da güvenilir.');

  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('L1 tıklama OK: kopyalayınca "Link copied" bildirimi çıkıyor', async ({ app }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    await dashboards.openShareDialog();
    await dashboards.copyLinkButton().click();
    await expect(dashboards.page.getByText(/link copied/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('L3 görev OK: panoya (clipboard) paylaşım URL\'si yazılıyor', async ({ app, page }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    await dashboards.openShareDialog();
    await dashboards.copyLinkButton().click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText().catch(() => '')), { timeout: 8000 })
      .toMatch(/\/reports\/dashboards\?id=.*shared=true/);
  });
});

// ═══════════════ KONTROL: CREATE DASHBOARD (L1) ═══════════════
// L2/L3: pano OLUŞTURMA = mutation, prod'a yazmadan güvenli doğrulanamaz → N/A (bkz. mutations spec).
// Burada yalnızca L1: diyalog açılıyor, alanlar var, OLUŞTURMADAN iptal edilebiliyor.
test.describe('Kontrol: Create Dashboard @regression', () => {
  test('L1 tıklama OK: oluştur diyaloğu açılıyor ve iptal edilebiliyor (kayıt YOK)', async ({ app }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    await dashboards.createButton().click();

    const dialog = dashboards.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Create Dashboard' })).toBeVisible();
    // İki alan: ad + açıklama.
    await expect(dialog.getByPlaceholder(/My Custom Dashboard/i)).toBeVisible();
    await expect(dialog.getByPlaceholder(/What is this dashboard for/i)).toBeVisible();

    // OLUŞTURMADAN iptal et.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});

// ═══════════════ KONTROL: EDIT (kart) (L1 + L3) ═══════════════
// L2: düzenlemeyi KAYDET = mutation → N/A (bkz. mutations spec). Diyalog açılışı hâlihazırdaki
// veriyi kullanır (yeni dashboard-özel network yok). Burada L1 (diyalog açılır) + L3 (builder yüklenir).
test.describe('Kontrol: Edit @regression', () => {
  test('L1+L3: Düzenle builder diyaloğunu açıyor (Add Widget) ve iptal edilebiliyor (kayıt YOK)', async ({ app }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    await dashboards.editButton().click();

    const dialog = dashboards.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Builder imzası: başlık "Edit:" + "Add Widget" + kaydet/iptal.
    await expect(dialog.getByRole('heading', { name: /^Edit:/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Add Widget' })).toBeVisible();

    // KAYDETMEDEN iptal et.
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Panolar — erişilebilirlik @a11y', () => {
  test('sayfada ve paylaş diyaloğunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    await expectNoSevereA11y(dashboards.page); // bilinen borç (button-name/contrast) hariç
    await dashboards.openShareDialog();
    await expectNoSevereA11y(dashboards.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
// Not: Paylaş diyaloğu taşması (BULGU 1) yukarıda "Kontrol: Paylaş" L3'te @layout @known-bug ile izleniyor.
test.describe('Panolar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/reports/dashboards');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Panolar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    await waitForUiToSettle(dashboards.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
// API mock'u prod'a YAZMAZ; tamamen deterministik.
test.describe('Panolar — hata-yolu @errorpath', () => {
  test('liste ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, kart yok)', async ({ app, page }) => {
    await mockApi(page, `**${DashboardsPage.API.list}**`, { status: 500 });
    const dashboards = app.dashboards;
    await dashboards.open(); // kabuk + başlık yine görünmeli
    await expect(dashboards.heading).toHaveText(I18N.en.heading);
    // Başarısız fetch'ten sonra bozuk/eski kart RENDER EDİLMEMELİ.
    await expect(dashboards.customShareButtons).toHaveCount(0);
  });

  test('liste ucu boş [] dönerse özel pano listesi boş (patlamıyor)', async ({ app, page }) => {
    await mockApi(page, `**${DashboardsPage.API.list}**`, { status: 200, body: '[]' });
    const dashboards = app.dashboards;
    await dashboards.open();
    await expect(dashboards.heading).toHaveText(I18N.en.heading);
    await expect(dashboards.customShareButtons).toHaveCount(0);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Panolar — klavye/odak @keyboard', () => {
  test('paylaş diyaloğu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    const dialog = await dashboards.openShareDialog();
    await expectDialogKeyboard(dashboards.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Panolar — deep-link @deeplink', () => {
  test('paylaşım bağlantısı doğrudan açılınca pano görünümü yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const dashboards = app.dashboards;
    await dashboards.open();
    const dialog = await dashboards.openShareDialog();
    const shareUrl = (await dialog.getByText(/\/reports\/dashboards\?id=/).innerText()).trim();
    const path = shareUrl.replace(/^https?:\/\/[^/]+/, ''); // ortam-URL'si sabitlenmez
    await page.keyboard.press('Escape');

    await page.goto(path, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(dashboards.shell.loginHeading).toBeHidden(); // login'e düşmedi
    await expect(dashboards.heading).toBeVisible();
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Yalnızca kararlı UI; canlı/değişken bölge (paylaşım URL'si) maskelenir.
test.describe('Panolar — görsel @visual', () => {
  test('paylaş diyaloğu görünümü değişmedi (URL maskeli)', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const dashboards = app.dashboards;
    await dashboards.open();
    const dialog = await dashboards.openShareDialog();
    await waitForUiToSettle(dashboards.page);
    await expect(dialog).toHaveScreenshot('share-dialog.png', {
      mask: [dialog.getByText(/\/reports\/dashboards\?id=/)], // canlı URL'yi maskele
      maxDiffPixels: 150,
    });
  });
});
