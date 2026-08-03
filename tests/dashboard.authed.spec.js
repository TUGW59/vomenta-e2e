// @ts-check
import { test, expect } from './fixtures/test.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { MAIN_NAVIGATION } from './contracts/navigation.js';
import {
  assertDestinationLoaded,
  assertNoHorizontalOverflow,
  expectContentWithin,
  expectMetricHasValue,
  expectNoSevereA11y,
  gotoApp,
  knownBugGuard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * GÖSTERGE PANELİ (`/`) — giriş sonrası açılan varsayılan ekran.
 *
 * Canlı gözlem + kanıt: DashboardPage.js başlığı (3 Ağu 2026, app.vomenta.com).
 * Salt-okunur (hiçbir şey oluşturulmaz/kaydedilmez).
 *
 * Kapsanan zorunlu stiller (tested-pages → archetype: hasData/hasCharts/
 * hasNumericKpis): @smoke @i18n @a11y @layout @clean @deeplink @regression +
 * @errorpath @perf @data. (keyboard/visual/export/mutation stilleri arketip dışı.)
 *
 * knownBugGuard = bulgu HÂLÂ AÇIK: test doğru davranışı doğrular,
 * bug açıkken "beklenen başarısızlık" olur (CI yeşil); düzelince "beklenmedik
 * geçiş" → guard kaldırılıp kalıcı regresyona çevrilir.
 */

const I18N = DashboardPage.I18N;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Gösterge Paneli — yapı', () => {
  /** @type {DashboardPage} */
  let dashboard;

  test.beforeEach(async ({ app }) => {
    dashboard = app.dashboard;
    await dashboard.open();
  });

  test('oturum geçerli — giriş formu görünmüyor @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden();
    await expect(page.getByLabel('Password')).toBeHidden();
  });

  test('başlık + alt başlık + kullanıcı menüsü görünüyor @smoke @critical', async ({ app }) => {
    await expect(dashboard.heading).toHaveText(I18N.en.heading);
    await expect(app.dashboard.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
    await expect(app.shell.userMenu).toBeVisible();
  });

  test('tarih aralığı + Live toggle görünüyor (Today / 7 Days / 30 Days / Live) @smoke', async () => {
    for (const key of ['today', 'd7', 'd30']) {
      await expect(dashboard.dateButton(I18N.en.dates[key])).toBeVisible();
    }
    await expect(dashboard.liveToggle(I18N.en.dates.live)).toBeVisible();
  });

  test('4 üst KPI döşemesi görünüyor @smoke', async () => {
    for (const label of DashboardPage.KPI_TILES) {
      await expect(dashboard.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('hızlı eylemler görünüyor (Start Call butonu + 3 gezinme linki) @smoke', async () => {
    await expect(dashboard.startCallButton).toBeVisible();
    for (const link of DashboardPage.QUICK_LINKS) {
      await expect(dashboard.quickLink(link.path)).toBeVisible();
    }
  });

  test('ana bölüm başlıkları görünüyor (Queue/Agent/Call Volume/Insights/AI/Activity) @smoke', async () => {
    for (const title of DashboardPage.SECTION_TITLES) {
      await expect(dashboard.page.getByText(title, { exact: true }).first()).toBeVisible();
    }
  });

  test('kenar menüsü tüm ana bölümleri doğru href ile içeriyor @critical', async ({ app }) => {
    for (const item of MAIN_NAVIGATION) {
      await expect(app.shell.link(item.name)).toHaveAttribute('href', item.path);
    }
  });

  test('sayfada sessiz hata yok (console-error / failed-request / 5xx) @smoke @clean', async ({ diagnostics }) => {
    // Başlık + ilk canlı veri (voice/calls/live) beforeEach'te geldi; RSC prefetch
    // gürültüsü varsayılan allowlist ile elenir.
    await waitForUiToSettle(dashboard.page);
    diagnostics.assertClean();
  });
});

// ───────────────────────── @data — KPI DEĞERLERİ ─────────────────────────
// Etiket değil, gerçek DEĞER de render olmalı (backend metrikleri boşaltırsa kırılır).
// Boş tenant'ta değerler "0"/"0s"/"0.0"/"0%" — hepsi expectMetricHasValue deseniyle eşleşir.
test.describe('Gösterge Paneli — KPI değerleri @data @regression', () => {
  test('üst KPI döşemeleri değer gösteriyor', async ({ app }) => {
    await app.dashboard.open();
    for (const label of DashboardPage.KPI_TILES) {
      await expectMetricHasValue(app.dashboard.page, label);
    }
  });

  test('"Analytics Insights" KPI döşemeleri değer gösteriyor', async ({ app }) => {
    await app.dashboard.open();
    for (const label of DashboardPage.INSIGHT_KPI_TILES) {
      await expectMetricHasValue(app.dashboard.page, label);
    }
  });
});

// ─────────────────────── @deeplink — DOĞRUDAN ERİŞİM ───────────────────────
test.describe('Gösterge Paneli — doğrudan erişim @deeplink @regression', () => {
  test('"/" doğrudan URL ile açılıyor ve Dashboard render oluyor', async ({ page }) => {
    await gotoApp(page, '/');
    await assertDestinationLoaded(page, { path: '/', heading: I18N.en.heading });
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI ────────────────────────
test.describe("Gösterge Paneli — 4 dil çeviri guard'ları @i18n @regression", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + tarih butonları + Start Call + Insights çevrili`, async ({ app, page }) => {
      const dashboard = app.dashboard;
      await dashboard.open();
      if (t.endonym) await dashboard.switchLanguage(t.endonym, t.heading);

      // Yazı yönü (Arapça = rtl)
      await expect(page.locator('html')).toHaveAttribute('dir', t.dir);
      // Başlık + alt başlık
      await expect(dashboard.heading).toHaveText(t.heading);
      await expect(page.getByText(t.subtitle, { exact: true })).toBeVisible();
      // Tarih aralığı (Today/7/30) + Live toggle (görünen metin)
      for (const key of ['today', 'd7', 'd30']) {
        await expect(dashboard.dateButton(t.dates[key])).toBeVisible();
      }
      await expect(dashboard.liveToggle(t.dates.live)).toBeVisible();
      // Start Call hızlı eylemi
      await expect(page.getByRole('button', { name: t.startCall, exact: true })).toBeVisible();
      // "Analytics Insights" bölüm başlığı
      await expect(page.getByText(t.analyticsInsights, { exact: true }).first()).toBeVisible();
    });
  }
});

// ───────────────────────── Start Call — L1 (softphone) ─────────────────────────
// L2 arka plan: N/A — softphone paneli açmak istemci-taraflı (uç isteği yok).
// L3: arama BAŞLATILMAZ (prod, salt-okunur) → yalnız dialer'ın açıldığı doğrulanır.
test.describe('Gösterge Paneli — Start Call @regression', () => {
  test('L1 tıklama OK: "Start Call" softphone dialer\'ını açıyor (tuş takımı görünür)', async ({ app, page }) => {
    const dashboard = app.dashboard;
    await dashboard.open();
    await dashboard.startCallButton.click();
    // Dialer tuş takımı açıldı mı? (dil-bağımsız rakam butonları)
    for (const digit of ['1', '2', '3']) {
      await expect(page.getByRole('button', { name: digit, exact: true }).first()).toBeVisible();
    }
  });
});

// ───────────────────────────── @a11y ─────────────────────────────
test.describe('Gösterge Paneli — erişilebilirlik @a11y @regression', () => {
  test('ciddi/kritik axe ihlali yok (bilinen borç hariç)', async ({ app, page }) => {
    await app.dashboard.open();
    await waitForUiToSettle(page);
    await expectNoSevereA11y(page);
  });
});

// ───────────────────── @layout — RESPONSIVE / YATAY TAŞMA ─────────────────────
test.describe('Gösterge Paneli — responsive / yatay taşma @layout @regression', () => {
  const VIEWPORTS = [
    { n: 'desktop', width: 1280, height: 800 },
    { n: 'mobile', width: 390, height: 844 },
  ];

  async function openDashboardAt(page, { width, height }) {
    await page.setViewportSize({ width, height });
    await page.goto('/', { waitUntil: 'commit' });
    await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForResponse((r) => r.url().includes(DashboardPage.API.live), { timeout: 20000 }).catch(() => {});
    await waitForUiToSettle(page);
  }

  for (const v of VIEWPORTS) {
    test(`[${v.n}] yatay taşma yok`, async ({ page }) => {
      await openDashboardAt(page, v);
      await assertNoHorizontalOverflow(page);
    });
  }

  // RTL: dil değiştirici kenar çubuğunda (mobilde gizli) → masaüstünde.
  test('[ar/rtl desktop] yatay taşma yok', async ({ app, page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await app.dashboard.open();
    await app.dashboard.switchLanguage(I18N.ar.endonym, I18N.ar.heading);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await waitForUiToSettle(page);
    await assertNoHorizontalOverflow(page);
  });
});

// ───────────────────────────── @perf ─────────────────────────────
test.describe('Gösterge Paneli — performans @perf @regression', () => {
  test('içerik (başlık) makul bütçe içinde görünüyor', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expectContentWithin(page, '/', heading, 8000);
  });
});

// ───────────────────────── @errorpath ─────────────────────────
// Canlı veri ucu (voice/calls/live) 500 dönse bile sayfa çökmemeli: kabuk + başlık
// render olmalı, login'e atmamalı. Prod'a YAZMAZ (yalnız GET yanıtını sahteler).
test.describe('Gösterge Paneli — hata yolu @errorpath @regression', () => {
  test('canlı veri ucu 500 dönerse sayfa yine de yükleniyor (çökmüyor)', async ({ page }) => {
    await mockApi(page, `**${DashboardPage.API.live}**`, { status: 500, body: '{"error":"boom"}' });
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText(I18N.en.heading, { timeout: 30000 });
  });
});

// ═══════════ BİLİNEN HATALAR @known-bug ═══════════
test.describe('Gösterge Paneli — bilinen hatalar @regression @known-bug', () => {
  // DASH-CLICKHOUSE — iç/teknik terim "ClickHouse" kullanıcıya dönük metinde görünüyor.
  // NOT: "Analytics Insights" bölümü ASENKRON render olur (open() yalnız voice/calls/live'ı
  // bekler) → metni okumadan ÖNCE bölümün geldiğini doğrula, yoksa yanlış "temiz".
  test('BULGU DASH-CLICKHOUSE: iç terim "ClickHouse" Dashboard\'da görünmemeli', async ({ app, page }) => {
    knownBugGuard(test, 'DASH-CLICKHOUSE');
    await app.dashboard.open();
    await expect(page.getByText(I18N.en.analyticsInsights, { exact: true }).first()).toBeVisible({ timeout: 15000 });
    const text = await app.dashboard.mainText();
    expect(text, 'kullanıcıya dönük metinde iç/teknik terim görünüyor').not.toContain(DashboardPage.INTERNAL_TERM);
  });

  // DASH-AI-I18N — AI metrik etiketleri tr/fr/ar arayüzde çevrilmeden İngilizce kalıyor.
  // Bölüm asenkron: "Analytics Insights" başlığı + AI kartı (etiketler) render olana kadar bekle.
  for (const code of ['tr', 'fr', 'ar']) {
    test(`BULGU DASH-AI-I18N [${code}]: AI metrik etiketleri ${code} arayüzde çevrili olmalı`, async ({ app, page }) => {
      knownBugGuard(test, 'DASH-AI-I18N');
      const dashboard = app.dashboard;
      await dashboard.open();
      await dashboard.switchLanguage(I18N[code].endonym, I18N[code].heading);
      await expect(page.getByText(I18N[code].analyticsInsights, { exact: true }).first()).toBeVisible({ timeout: 15000 });
      // AI kartı render beklentisi: etiketler her dilde İngilizce basıldığı için (bulgu),
      // ilk etiketin görünmesi bölümün geldiğinin dil-bağımsız kanıtıdır.
      await expect(page.getByText(DashboardPage.AI_METRIC_LABELS[0], { exact: true }).first()).toBeVisible({ timeout: 15000 });
      const text = await dashboard.mainText();
      for (const label of DashboardPage.AI_METRIC_LABELS) {
        expect(text, `${code} arayüzde çevrilmemiş İngilizce etiket sızıyor: "${label}"`).not.toContain(label);
      }
    });
  }
});
