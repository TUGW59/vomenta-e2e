// @ts-check
import { test, expect } from './fixtures/test.js';
import { AiManagementPage } from './pages/AiManagementPage.js';
import { assertDestinationLoaded } from './helpers.js';

/**
 * YAPAY ZEKA → GENEL BAKIŞ / AI MANAGEMENT (`/ai`)
 *
 * Canlı gözlem: 31 Tem 2026, app.vomenta.com (Claude-in-Chrome ile gezildi).
 * Standartlar: 3 katman (L1/L2/L3) + 4 dil i18n — bkz. AGENTS.md.
 *
 * Yüzey: 4 sekme (Agents / AI Copilot / Supervisor / Providers). Sekme değişimi
 * CLIENT-SIDE'dır (canlı ağ izinde sekme başına AYRI fetch YOK) → sekme kontrolü
 * için L2 (arka plan doğrulaması) N/A; gözlemlenebilir etki içerik takasıdır (L1).
 *
 * Prod güvenliği: ayar mutasyonları (Auto-Evaluation switch, skor girdileri, API
 * anahtarları) canlıda TETİKLENMEZ → salt-okunur yapı + navigasyon + i18n test edilir.
 */

const I18N = AiManagementPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Yapay Zeka Yönetimi — yapı', () => {
  /** @type {AiManagementPage} */
  let ai;
  test.beforeEach(async ({ app }) => {
    ai = app.aiManagement;
    await ai.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(ai.heading).toHaveText(I18N.en.heading);
    await expect(ai.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('dört sekme görünüyor @critical', async () => {
    for (const name of Object.values(I18N.en.tabs)) {
      await expect(ai.tab(name)).toBeVisible();
    }
  });

  test('Agents sekmesi: istatistik döşemeleri + bot listesi (Configure) görünüyor', async () => {
    for (const label of I18N.en.statTiles) {
      await expect(ai.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(ai.configureButton()).toBeVisible();
  });

  test('AI Copilot sekmesi: ayar kartı çapaları görünüyor', async () => {
    await ai.selectTab(I18N.en.tabs.copilot);
    for (const anchor of I18N.en.anchors.copilot) {
      await expect(ai.page.getByText(anchor, { exact: false }).first()).toBeVisible();
    }
  });

  test('Supervisor sekmesi: oto-değerlendirme + skor kriterleri çapaları görünüyor', async () => {
    await ai.selectTab(I18N.en.tabs.supervisor);
    for (const anchor of I18N.en.anchors.supervisor) {
      await expect(ai.page.getByText(anchor, { exact: false }).first()).toBeVisible();
    }
  });

  test('Providers sekmesi: sağlayıcı yapılandırma çapaları + Manage Providers görünüyor', async () => {
    await ai.selectTab(I18N.en.tabs.providers);
    for (const anchor of I18N.en.anchors.providers) {
      await expect(ai.page.getByText(anchor, { exact: false }).first()).toBeVisible();
    }
    await expect(ai.manageProvidersButton).toBeVisible();
  });
});

// ──────────────────────── 4 DİL i18n GUARD'LARI ────────────────────────
test.describe("Yapay Zeka Yönetimi — 4 dil çeviri guard'ları @regression", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + sekmeler + döşeme etiketleri + Configure çevrili`, async ({ app }) => {
      const ai = app.aiManagement;
      await ai.open();
      if (t.endonym) await ai.switchLanguage(t.endonym);

      await expect(ai.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(ai.heading).toHaveText(t.heading);
      await expect(ai.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      for (const name of Object.values(t.tabs)) {
        await expect(ai.tab(name)).toBeVisible();
      }
      // Agents sekmesi (varsayılan) döşeme etiketleri + Configure düğmesi çevrili.
      for (const label of t.statTiles) {
        await expect(ai.page.getByText(label, { exact: true }).first()).toBeVisible();
      }
      await expect(
        ai.page.getByRole('button', { name: t.configure, exact: true }).first()
      ).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: SEKMELER (L1) ═══════════════
// L2/L3: sekme değişimi client-side'dır (AYRI fetch yok) → arka plan/görev doğrulaması N/A.
// Gözlemlenebilir etki: doğru panel içeriği görünür + önceki panelin çapası gizlenir.
test.describe('Kontrol: Sekmeler @regression', () => {
  test('L1 tıklama OK: her sekme kendi panelini gösteriyor (içerik takası)', async ({ app }) => {
    const ai = app.aiManagement;
    await ai.open();
    const firstTile = ai.page.getByText(I18N.en.statTiles[0], { exact: true }).first();
    await expect(firstTile).toBeVisible(); // Agents (varsayılan)

    const cases = [
      { tab: I18N.en.tabs.copilot, anchor: I18N.en.anchors.copilot[0] },
      { tab: I18N.en.tabs.supervisor, anchor: I18N.en.anchors.supervisor[0] },
      { tab: I18N.en.tabs.providers, anchor: I18N.en.anchors.providers[0] },
    ];
    for (const c of cases) {
      await ai.selectTab(c.tab, c.anchor);
      // Agents döşemesi artık görünmemeli (panel gerçekten takas edildi).
      await expect(firstTile).toBeHidden();
    }
    // Agents'a geri dön → döşeme yeniden görünür.
    await ai.selectTab(I18N.en.tabs.agents);
    await expect(firstTile).toBeVisible();
  });
});

// ═══════════════ KONTROL: CONFIGURE → BOT BUILDER (navigasyon L3) ═══════════════
test.describe('Kontrol: Configure (bot → Bot Builder) @regression', () => {
  test('L3 navigasyon OK: "Configure" botu /bot-builder editörüne götürüyor', async ({ app, page }) => {
    const ai = app.aiManagement;
    await ai.open();
    await ai.configureButton().click();
    await page.waitForURL((url) => url.pathname.startsWith('/bot-builder/'), { timeout: 15000 });
    // Oturum korundu + kabuk yerinde (boş/404/login değil).
    await expect(ai.shell.loginHeading).toBeHidden();
    await expect(ai.shell.navigation).toBeVisible();
  });
});

// ═══════════════ KONTROL: MANAGE PROVIDERS → PROVIDER SETTINGS (navigasyon L3) ═══════════════
test.describe('Kontrol: Manage Providers @regression', () => {
  test('L3 navigasyon OK: "Manage Providers" /ai/providers (Provider Settings) sayfasını yüklüyor', async ({ app, page }) => {
    const ai = app.aiManagement;
    await ai.open();
    await ai.selectTab(I18N.en.tabs.providers, I18N.en.anchors.providers[0]);
    await ai.manageProvidersButton.click();
    await assertDestinationLoaded(page, AiManagementPage.PROVIDER_SETTINGS);
  });
});
