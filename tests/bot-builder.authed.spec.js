// @ts-check
import { test, expect } from './fixtures/test.js';
import { BotBuilderPage } from './pages/BotBuilderPage.js';
import {
  captureJson,
  expectDialogKeyboard,
  expectNoOverflowAtViewports,
  expectNoSevereA11y,
  knownBugGuard,
  mockApi,
} from './helpers.js';

/**
 * BOT OLUŞTURUCU → LİSTE (`/bot-builder`)
 *
 * Canlı gözlem: 3 Ağu 2026, app.vomenta.com — bkz. `docs/bot-olusturucu-kesif/NOTLAR.md`.
 * Standartlar: 3 katman (L1/L2/L3) + 4 dil i18n + zorunlu stiller (AGENTS.md).
 *
 * Prod güvenliği: gerçek create/save/delete prod'a yazar → canlıda TETİKLENMEZ. Create
 * diyaloğu yalnız L1 (açılış/kapanış/klavye) düzeyinde doğrulanır; gerçek create staging
 * mutasyonudur (@mutation = N/A bu pakette). Editör derinliği ayrı pakette (Page 2).
 */

const I18N = BotBuilderPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Bot Oluşturucu — yapı', () => {
  /** @type {BotBuilderPage} */
  let bb;
  test.beforeEach(async ({ app }) => {
    bb = app.botBuilder;
    await bb.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical @deeplink', async () => {
    await expect(bb.heading).toHaveText(I18N.en.heading);
    await expect(bb.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('"Create Bot" birincil eylemi görünür ve etkin @smoke', async () => {
    await expect(bb.createButton).toBeVisible();
    await expect(bb.createButton).toBeEnabled();
  });
});

// ───────────────────────────── @data: liste ↔ API sadakati ─────────────────────────────
test.describe('Bot Oluşturucu — veri @data @regression', () => {
  test('listedeki botlar /api/v1/bots yanıtıyla tutarlı', async ({ app, page }) => {
    const jsonP = captureJson(page, '/api/v1/bots?');
    await app.botBuilder.open();
    const json = await jsonP;
    const bots = json?.data?.data ?? [];
    // Boş liste prod'da güvenle üretilemez; veri varsa API↔UI sadakati doğrulanır.
    test.skip(bots.length === 0, 'Hesapta bot yok — liste↔API sadakati veri-bağlı.');
    await expect(page.getByText(bots[0].name, { exact: true }).first()).toBeVisible();
  });
});

// ───────────────────────────── @clean (BULGU: şablon i18n) ─────────────────────────────
test.describe('Bot Oluşturucu — sessiz hata', () => {
  test('BOT-BUILDER-TEMPLATE-I18N · /bot-builder · açılışta ham i18n anahtarı/MISSING_MESSAGE olmamalı @clean @known-bug', async ({ app, diagnostics }) => {
    knownBugGuard(test, 'BOT-BUILDER-TEMPLATE-I18N');
    const bb = app.botBuilder;
    await bb.open();
    // Şablon listesi Create diyaloğunda render edilince her şablon için t('botBuilder.<ad>')
    // MISSING_MESSAGE konsol hatası düşer (ham anahtar da kullanıcıya sızar) → deterministik tetik.
    await bb.openCreateDialog();
    await expect(bb.dialog.getByText('botBuilder.', { exact: false }).first()).toBeVisible();
    diagnostics.assertClean();
  });
});

// ───────────────────────────── @a11y ─────────────────────────────
test.describe('Bot Oluşturucu — erişilebilirlik @a11y', () => {
  test('ciddi/kritik axe ihlali yok (bilinen borç hariç)', async ({ app, page }) => {
    await app.botBuilder.open();
    await expectNoSevereA11y(page);
  });
});

// ───────────────────────────── @layout ─────────────────────────────
test.describe('Bot Oluşturucu — responsive @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatay taşma yok', async ({ page }) => {
    await expectNoOverflowAtViewports(page, '/bot-builder');
  });
});

// ───────────────────────────── @i18n (4 dil) ─────────────────────────────
test.describe('Bot Oluşturucu — çok dilli @i18n @regression', () => {
  test('İngilizce başlık/alt başlık/eylem', async ({ app }) => {
    const bb = app.botBuilder;
    await bb.open();
    await expect(bb.heading).toHaveText(I18N.en.heading);
    await expect(bb.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
    await expect(bb.createButton).toBeVisible();
  });

  for (const code of /** @type {const} */ (['tr', 'fr', 'ar'])) {
    const t = I18N[code];
    test(`${code}: başlık/alt başlık/eylem + yön (${t.dir})`, async ({ app }) => {
      const bb = app.botBuilder;
      await bb.open();
      await bb.switchLanguage(t.endonym);
      await expect(bb.heading).toHaveText(t.heading, { timeout: 15000 });
      await expect(bb.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(bb.page.getByRole('button', { name: t.createButton, exact: true })).toBeVisible();
      await expect
        .poll(() => bb.page.evaluate(() => getComputedStyle(document.body).direction))
        .toBe(t.dir);
      // Create diyaloğu başlığı da aktif dilde çevrili olmalı (oluşturma formu i18n kapsamı).
      await bb.openCreateDialog(t.dialog.heading);
      await expect(bb.dialog.getByText(t.dialog.subtitle, { exact: false }).first()).toBeVisible();
    });
  }

  test('Create diyaloğu İngilizce çevrili (başlık/alanlar/eylemler)', async ({ app }) => {
    const bb = app.botBuilder;
    await bb.open();
    await bb.openCreateDialog();
    for (const label of I18N.en.dialog.labels) {
      await expect(bb.dialog.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(bb.dialog.getByRole('button', { name: I18N.en.dialog.cancel, exact: true })).toBeVisible();
    await expect(bb.dialog.getByRole('button', { name: I18N.en.dialog.submit, exact: true })).toBeVisible();
  });
});

// ─────────────────── @keyboard + L1: Create diyaloğu ───────────────────
test.describe('Kontrol: Create Bot diyaloğu @regression', () => {
  test('L1 tıklama OK: "Create Bot" diyaloğu açar', async ({ app }) => {
    const bb = app.botBuilder;
    await bb.open();
    await bb.openCreateDialog();
    await expect(bb.dialog.getByText(I18N.en.dialog.subtitle, { exact: false })).toBeVisible();
  });

  test('klavye: odak tuzağı + Escape ile kapanır @keyboard', async ({ app, page }) => {
    const bb = app.botBuilder;
    await bb.open();
    await bb.openCreateDialog();
    await expectDialogKeyboard(page, bb.dialog);
  });

  test('BOT-BUILDER-CLOSE-I18N · /bot-builder · diyalog kapat düğmesi çevrilmeli @i18n @known-bug', async ({ app }) => {
    knownBugGuard(test, 'BOT-BUILDER-CLOSE-I18N');
    const bb = app.botBuilder;
    await bb.open();
    await bb.switchLanguage(I18N.tr.endonym);
    await bb.openCreateDialog();
    // Kapat düğmesi Türkçe'de "Kapat" olmalı (şu an "Close" kalıyor → beklenen başarısızlık).
    await expect(bb.dialog.getByRole('button', { name: 'Kapat' })).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────── L3: kart → editör navigasyonu ───────────────────
test.describe('Kontrol: bot kartı → editör @regression', () => {
  test('L3 navigasyon OK: bir bot kartı /bot-builder/{id} editörünü yüklüyor', async ({ app, page }) => {
    const bb = app.botBuilder;
    await bb.open();
    // Bot adını açılış sonrası DOM'dan al (belirli bir XHR'ı beklemeye bağlı değil → deterministik).
    const name = await bb.firstBotName();
    test.skip(!name, 'Hesapta bot yok — kart→editör navigasyonu veri-bağlı.');

    await bb.botCard(name).click();
    await page.waitForURL((url) => /\/bot-builder\/.+/.test(url.pathname), { timeout: 15000 });
    // URL doğru olsa bile içerik render'ı doğrulanır: oturum + kabuk + editöre özgü kimlik öğesi.
    // (Editör "Back to Bots" kontrolü erişilebilir ad taşımıyor → button-name borcu; onun yerine
    // editöre özgü kararlı "Editor" sekmesi + bot adı başlığı doğrulanır.)
    await expect(bb.shell.loginHeading).toBeHidden();
    await expect(bb.shell.navigation).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Editor', exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name }).first()).toBeVisible();
  });
});

// ─────────────────── @errorpath: liste API hatası ───────────────────
test.describe('Bot Oluşturucu — hata yolu @errorpath', () => {
  test('/api/v1/bots 500 dönerse sayfa çökmeden başlığı/oluşturma eylemini korur', async ({ page }) => {
    await mockApi(page, '**/api/v1/bots?**', { status: 500, body: '{"success":false,"message":"error"}' });
    await page.goto('/bot-builder', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    // Zarif bozulma: iskele (başlık + birincil eylem) yine render olur; beyaz ekran/crash yok.
    await expect(page.getByRole('heading', { level: 1, name: I18N.en.heading })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: I18N.en.createButton, exact: true })).toBeVisible();
  });
});
