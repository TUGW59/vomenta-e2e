// @ts-check
import { test, expect } from './fixtures/test.js';
import { BotBuilderEditorPage } from './pages/BotBuilderEditorPage.js';
import { assertNoHorizontalOverflow, expectNoSevereA11y, knownBugGuard } from './helpers.js';

/**
 * BOT OLUŞTURUCU → AKIŞ EDİTÖRÜ (`/bot-builder/{id}`)
 *
 * Canlı gözlem: 3 Ağu 2026, app.vomenta.com — bkz. `docs/bot-olusturucu-kesif/NOTLAR.md`.
 * Standartlar: 3 katman (L1/L3) + 4 dil i18n + zorunlu stiller (AGENTS.md).
 *
 * Editöre giriş VERİ-BAĞLI: listedeki ilk bot editöre götürür (hesapta bot yoksa test.skip).
 * Editör URL'si (bot id) bir kez listeden keşfedilip modül önbelleğine alınır; diğer testler
 * doğrudan deep-link ile açılır → tek liste yükü (prod'a saygılı, deterministik). Önbellek TEMBEL
 * doldurulur; her test kendi başına çalışır (çalışma sırasına bağımlı DEĞİL).
 *
 * Prod güvenliği: Save Draft / Publish / Test / Versions yan-etkili → canlıda TETİKLENMEZ
 * (mutation = N/A, staging). Testler salt-okunur yapı + i18n + navigasyon ile sınırlıdır.
 *
 * N/A beyanları (stil etiketi olmadan): keyboard — salt-okunur kapsamda diyalog yok
 * (Versions/Test panelleri staging); data/perf/export/visual — editör tuvali canlı/oynak,
 * sayısal KPI ve indirme yok, kararlı snapshot bölgesi yok.
 */

const I18N = BotBuilderEditorPage.I18N;

/** Modül önbelleği: editör URL + bot adı (bir kez keşfedilir, workers=1'de paylaşılır). */
let cachedUrl = null;
let cachedName = null;

/**
 * Editörü açar: ilk çağrıda listeden keşfeder + önbelleğe alır; sonrakiler doğrudan deep-link.
 * @returns {Promise<{url:string,name:string}|null>} bot yoksa null
 */
async function gotoEditor(app, page) {
  const ed = app.botBuilderEditor;
  if (!cachedUrl) {
    const name = await ed.openFirstFromList();
    if (!name) return null;
    cachedUrl = page.url();
    cachedName = name;
    return { url: cachedUrl, name: cachedName };
  }
  await page.goto(cachedUrl, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await expect(ed.editorTab).toBeVisible({ timeout: 20000 });
  return { url: cachedUrl, name: cachedName };
}

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Bot editörü — yapı', () => {
  test('editör yükleniyor: sekmeler + bot adı + Save Draft/Publish + geri dön @smoke @critical', async ({ app, page }) => {
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');

    await expect(ed.tab(I18N.en.tabEditor)).toBeVisible();
    await expect(ed.tab(I18N.en.tabAnalytics)).toBeVisible();
    await expect(page.getByRole('heading', { name: ctx.name }).first()).toBeVisible();
    await expect(ed.saveDraftButton).toBeVisible();
    await expect(ed.publishButton).toBeVisible();
    await expect(ed.backLink).toBeVisible();
  });
});

// ───────────────────────────── @deeplink ─────────────────────────────
test.describe('Bot editörü — derin bağlantı @deeplink', () => {
  test('editör URL\'si doğrudan (tam yükleme) açılıyor', async ({ app, page }) => {
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');

    await page.goto(ctx.url, { waitUntil: 'commit' }); // tam (sunucu) yükleme
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(ed.editorTab).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: ctx.name }).first()).toBeVisible();
  });
});

// ───────────────────────────── @clean ─────────────────────────────
test.describe('Bot editörü — sessiz hata @clean', () => {
  test('editör açılışında editöre özgü console/ağ hatası yok', async ({ app, page, diagnostics }) => {
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');
    // Editöre listeden gelinebildiğinden, listenin bilinen şablon-i18n gürültüsü
    // (BOT-BUILDER-TEMPLATE-I18N) allowlist'lenir — editörün KENDİ hatası yine yakalanır.
    diagnostics.assertClean([/MISSING_MESSAGE: botBuilder\./]);
  });
});

// ───────────────────────────── @a11y (BULGU: link-name + tuval odak) ─────────────────────────────
test.describe('Bot editörü — erişilebilirlik @a11y', () => {
  test('BOT-BUILDER-EDITOR-A11Y · /bot-builder/{id} · ciddi axe ihlali (bilinen borç) — düzelene kadar guard @known-bug', async ({ app, page }) => {
    knownBugGuard(test, 'BOT-BUILDER-EDITOR-A11Y');
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');
    // Editörde borç-dışı ciddi ihlaller var (link-name + scrollable-region-focusable) → beklenen fail.
    await expectNoSevereA11y(page);
  });
});

// ───────────────────────────── @layout ─────────────────────────────
test.describe('Bot editörü — responsive @layout', () => {
  test('masaüstü tuval / mobil-tablet "Desktop Screen Required" kapısı; yatay taşma yok', async ({ app, page }) => {
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(ed.editorTab).toBeVisible();
    await assertNoHorizontalOverflow(page);

    for (const size of [{ width: 375, height: 812 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(size);
      await expect(ed.gateHeading).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
  });
});

// ───────────────────────────── @i18n (4 dil) ─────────────────────────────
test.describe('Bot editörü — çok dilli @i18n @regression', () => {
  test('İngilizce sekme + üst eylem etiketleri', async ({ app, page }) => {
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');
    await expect(ed.tab(I18N.en.tabEditor)).toBeVisible();
    await expect(ed.tab(I18N.en.tabAnalytics)).toBeVisible();
    await expect(ed.saveDraftButton).toBeVisible();
    await expect(ed.publishButton).toBeVisible();
  });

  for (const code of /** @type {const} */ (['tr', 'fr', 'ar'])) {
    const t = I18N[code];
    test(`${code}: sekmeler + Kaydet/Yayınla çevrili + yön (${t.dir})`, async ({ app, page }) => {
      const ed = app.botBuilderEditor;
      const ctx = await gotoEditor(app, page);
      test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');
      await ed.switchLanguage(t.endonym);

      await expect(ed.tab(t.tabEditor)).toBeVisible({ timeout: 15000 });
      await expect(ed.tab(t.tabAnalytics)).toBeVisible();
      await expect(page.getByRole('button', { name: t.save, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: t.publish, exact: true })).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => getComputedStyle(document.body).direction))
        .toBe(t.dir);
    });
  }

  test('BOT-BUILDER-EDITOR-GATE-I18N · /bot-builder/{id} · dar-ekran kapısı fr\'de çevrilmeli @i18n @known-bug', async ({ app, page }) => {
    knownBugGuard(test, 'BOT-BUILDER-EDITOR-GATE-I18N');
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');
    await ed.switchLanguage(I18N.fr.endonym);
    await page.setViewportSize({ width: 375, height: 812 });
    // Mobilde yalnızca dar-ekran kapısının H2'si görünür (bot adı H2'si gizli). Görünür H2'nin metni
    // aktif dilde (fr) olmalı; şu an İngilizce "Desktop Screen Required" → beklenen fail.
    // (Önce kapının render olmasını bekle ki not.toHaveText render-boşluğunda yanlış geçmesin.)
    const gateH2 = page.getByRole('heading', { level: 2 }).filter({ visible: true });
    await expect(gateH2).toBeVisible({ timeout: 10000 });
    await expect(gateH2).not.toHaveText(I18N.en.gate, { timeout: 6000 });
  });
});

// ─────────────────── L1: sekme takası (client-side) ───────────────────
test.describe('Kontrol: editör sekmeleri @regression', () => {
  test('L1 tıklama OK: Analytics ↔ Editor sekme takası', async ({ app, page }) => {
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');

    await ed.tab(I18N.en.tabAnalytics).click();
    await expect(ed.tab(I18N.en.tabAnalytics)).toHaveAttribute('aria-selected', 'true');
    await ed.tab(I18N.en.tabEditor).click();
    await expect(ed.tab(I18N.en.tabEditor)).toHaveAttribute('aria-selected', 'true');
    // Sekme değişimi client-side (ayrı backend fetch yok) → L2 N/A.
  });
});

// ─────────────────── L3: geri dön → liste navigasyonu ───────────────────
test.describe('Kontrol: geri dön → liste @regression', () => {
  test('L3 navigasyon OK: geri dön /bot-builder listesini yüklüyor', async ({ app, page }) => {
    const ed = app.botBuilderEditor;
    const ctx = await gotoEditor(app, page);
    test.skip(!ctx, 'Hesapta bot yok — editör veri-bağlı.');

    await ed.backLink.click();
    await page.waitForURL((url) => url.pathname === '/bot-builder', { timeout: 15000 });
    // Hedef gerçekten yüklendi: liste başlığı (H1 "Bot Builder") görünür (salt URL yeterli değil).
    await expect(page.getByRole('heading', { level: 1, name: 'Bot Builder' })).toBeVisible({ timeout: 15000 });
  });
});
