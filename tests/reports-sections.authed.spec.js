// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { ReportSectionPage } from './pages/ReportSectionPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectContentWithin,
  knownBugGuard,
  mockApi,
  captureJson,
  waitForUiToSettle,
} from './helpers.js';

/**
 * RAPORLAR › DİĞER RAPOR BÖLÜMLERİ (`/reports/{key}` — 10 bölüm ortak kabuk)
 *
 * Keşif + kanıt: docs/reports-diger-kesif/NOTLAR.md.
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * Bölümler (call/agent/queue/campaign/channel/ai/quality/csat/billing/sla) AYNI kabuğu
 * paylaşır → tek parametreli Page Object + tek parametreli spec.
 *
 * ┌─ ORTAK KONTROLLER İÇİN 3 KATMAN ────────────────────────────────────────┐
 * │ L1 tıklama · L2 arka plan (network) · L3 görev. Olmayan katman "N/A".    │
 * └──────────────────────────────────────────────────────────────────────────┘
 * Davranış (L2/L3) testleri veri-dolu temsilci bölümde (agent) koşar; yapı+i18n
 * tüm bölümlerde. `/reports/custom` Panolar sayfasının aynısıdır → kapsam dışı.
 */

const SECTION_KEYS = Object.keys(ReportSectionPage.SECTIONS);
const LANG = ReportSectionPage.LANG;
const DATA_RICH = ReportSectionPage.DATA_RICH_KEY; // 'agent'

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Rapor bölümleri — yapı', () => {
  for (const key of SECTION_KEYS) {
    test(`[${key}] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule @smoke`, async ({ app }) => {
      const rp = app.reportSection(key);
      await rp.open();
      await expect(rp.heading).toHaveText(rp.headingText('en'));
      await expect(rp.chartsTab()).toBeVisible();
      await expect(rp.tableTab()).toBeVisible();
      await expect(rp.dateRangeCard).toBeVisible();
      await expect(rp.datePreset(LANG.en.today)).toBeVisible();
      await expect(rp.datePreset(LANG.en.days30)).toBeVisible();
      await expect(rp.exportButton.first()).toBeVisible();
      await expect(rp.scheduleButton).toBeVisible();
    });
  }
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@regression) ────────────────────
// Bir kez TAM yükle + dili değiştir, SONRA bölümler arası KENAR ÇUBUĞU (istemci-tarafı)
// gezinmesiyle dolaş: tam sayfa reload yok → canlı sunucuya minimum yük (503 önleme) + dil korunur.
// Tek testte kabuk (sekme/preset/yön) + TÜM bölüm başlıkları doğrulanır.
test.describe("Rapor bölümleri — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, L] of Object.entries(LANG)) {
    test(`[${code}] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili`, async ({ app, page }) => {
      const call = app.reportSection('call');
      await call.open();
      if (L.endonym) await call.switchLanguage(L.endonym);

      // Kabuk (call üzerinde): yön + Charts/Table + tarih presetleri yerelleştirilmiş.
      await expect(page.locator('html')).toHaveAttribute('dir', L.dir);
      await expect(call.chartsTab(code)).toBeVisible();
      await expect(call.tableTab(code)).toBeVisible();
      await expect(call.datePreset(L.today)).toBeVisible();
      await expect(call.datePreset(L.days30)).toBeVisible();
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveText(ReportSectionPage.SECTIONS.call.heading[code]);

      // Kalan bölüm başlıkları — istemci-tarafı sidebar navigasyonu (dil korunur, reload yok).
      for (const key of SECTION_KEYS.filter((k) => k !== 'call')) {
        await page.locator(`nav a[href="/reports/${key}"]`).first().click();
        await expect(h1, `[${code}] ${key} başlığı çevrili olmalı`)
          .toHaveText(ReportSectionPage.SECTIONS[key].heading[code], { timeout: 20000 });
      }
    });
  }
});

// ═══════════════ KONTROL: CHARTS / TABLE SEKMESİ (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — görünüm istemci tarafında değişir (tıklamada 0 network).
test.describe(`Kontrol: Charts/Table sekmesi (${DATA_RICH}) @regression`, () => {
  /** @type {ReportSectionPage} */
  let rp;
  test.beforeEach(async ({ app }) => { rp = app.reportSection(DATA_RICH); await rp.open(); });

  test('L1 tıklama OK: sekmeler seçili duruma geçiyor', async () => {
    await expect(async () => {
      await rp.tableTab().click();
      await expect(rp.tableTab()).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(async () => {
      await rp.chartsTab().click();
      await expect(rp.chartsTab()).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  });

  test('L3 görev OK: Charts grafik gösteriyor, Table tabloya geçiyor @critical', async () => {
    await rp.chartsTab().click();
    await expect.poll(() => rp.charts.count(), { timeout: 15000 }).toBeGreaterThan(0);

    await rp.tableTab().click();
    await expect.poll(() => rp.charts.count(), { timeout: 8000 }).toBe(0);
    await expect(rp.page.locator('table').first()).toBeVisible();
  });
});

// ═══════════════ KONTROL: DATE RANGE PRESET (L1 + L2 + L3) ═══════════════
test.describe(`Kontrol: Date Range preset (${DATA_RICH}) @regression`, () => {
  /** @type {ReportSectionPage} */
  let rp;
  test.beforeEach(async ({ app }) => { rp = app.reportSection(DATA_RICH); await rp.open(); });

  // L1: seçili sinyal SEMANTİK DEĞİL (aria-pressed yok) → CSS `border-primary` son çare.
  // Frontend'den `aria-pressed`/`data-testid` talep edildi (keşif notlarında).
  test('L1 tıklama OK: seçilen preset vurgulanıyor (border-primary)', async () => {
    await rp.datePreset(LANG.en.days30).click();
    await expect(rp.datePreset(LANG.en.days30)).toHaveClass(/border-primary/);
  });

  test('L2 arka plan OK: preset yeni tarih aralığıyla veri çekiyor @critical', async ({ page }) => {
    const req = page.waitForRequest(
      (r) => r.url().includes(ReportSectionPage.apiFor(DATA_RICH)) && r.url().includes('startDate') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await rp.datePreset(LANG.en.days30).click();
    await req; // tetiklenmezse timeout → kırılır
  });

  test('L3 görev OK: Date Range etiketi güncelleniyor', async () => {
    const before = await rp.dateRangeText(); // varsayılan 7 gün aralığı
    await rp.datePreset(LANG.en.days30).click();
    await expect.poll(() => rp.dateRangeText(), { timeout: 8000 }).not.toBe(before);
  });
});

// ═══════════════ BOŞ DURUM (graceful) ═══════════════
// campaign/channel/billing: seçili dönemde veri yok → grafik yerine düzgün boş-durum.
// Veri-bağımsız: sayfa YA grafik YA da boş-durum mesajı gösterir (hata sınırı/patlama DEĞİL).
test.describe('Rapor bölümleri — boş durum @regression', () => {
  test('boş bölüm (campaign) düzgün içerik/boş-durum çözüyor (patlamıyor)', async ({ app }) => {
    const rp = app.reportSection('campaign');
    await rp.open();
    await expect
      .poll(
        async () => (await rp.charts.count()) > 0 || (await rp.page.getByText(/No data available/i).count()) > 0,
        { timeout: 20000 }
      )
      .toBe(true);
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe(`Rapor bölümleri — erişilebilirlik (${DATA_RICH}) @a11y`, () => {
  test('sayfada ciddi/kritik a11y ihlali yok (Charts + Table)', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await expectNoSevereA11y(rp.page);
    await rp.tableTab().click();
    await expectNoSevereA11y(rp.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe(`Rapor bölümleri — düzen/taşma (${DATA_RICH}) @layout`, () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, `/reports/${DATA_RICH}`);
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe(`Rapor bölümleri — console/ağ temizliği (${DATA_RICH}) @clean`, () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await waitForUiToSettle(rp.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe(`Rapor bölümleri — hata-yolu (${DATA_RICH}) @errorpath`, () => {
  test('rapor ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, grafik yok)', async ({ app, page }) => {
    await mockApi(page, `**${ReportSectionPage.apiFor(DATA_RICH)}**`, { status: 500 });
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await expect(rp.heading).toHaveText(rp.headingText('en'));
    // 500 sonrası grafik render EDİLMEMELİ; app patlamamalı (başlık görünür).
    await expect.poll(() => rp.charts.count(), { timeout: 8000 }).toBe(0);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
// Charts/Table sekme listesi klavyeyle işletilebilmeli (WAI-ARIA tablist: Ok tuşları).
test.describe(`Rapor bölümleri — klavye/odak (${DATA_RICH}) @keyboard`, () => {
  test('sekmeler klavyeyle gezilebiliyor (Charts→Table, ok tuşu)', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await rp.chartsTab().focus();
    await expect(rp.chartsTab()).toBeFocused();
    await rp.page.keyboard.press('ArrowRight');
    await expect(rp.tableTab()).toBeFocused(); // roving tabindex → sonraki sekmeye odak
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe(`Rapor bölümleri — deep-link (${DATA_RICH}) @deeplink`, () => {
  test('bölüm rotası doğrudan açılınca yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const rp = app.reportSection(DATA_RICH);
    await page.goto(`/reports/${DATA_RICH}`, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(rp.shell.loginHeading).toBeHidden();
    await expect(rp.heading).toHaveText(rp.headingText('en'), { timeout: 30000 });
  });
});

// ═══════════════ STİL: PERFORMANS (@perf) — GECE (cömert bütçe) ═══════════════
test.describe(`Rapor bölümleri — performans (${DATA_RICH}) @perf`, () => {
  test('grafikler bütçe içinde render oluyor', async ({ app, page }) => {
    const rp = app.reportSection(DATA_RICH);
    // İçerik = ilk grafik görünür. Canlı-prod varyansı için cömert bütçe (15 sn).
    await expectContentWithin(page, `/reports/${DATA_RICH}`, rp.charts, 15_000);
  });
});

// ═══════════════ STİL: VERİ DOĞRULUĞU A (@data) — GECE ═══════════════
// A: Tarayıcının API'den aldığı JSON ↔ UI sadakati. Aynı yanıttan türediği için deterministik.
// (B: kaynak/BigQuery karşılaştırması test DIŞI, MCP kapalı-pencere denetimi → docs/data-audit/.)
test.describe('Rapor bölümleri — veri doğruluğu (call) @data', () => {
  test('UI "Total Calls" KPI, API data.summary.totalCalls ile eşleşiyor', async ({ app, page }) => {
    const rp = app.reportSection('call');
    const jsonP = captureJson(page, ReportSectionPage.apiFor('call')); // navigasyondan ÖNCE dinle
    await rp.open();
    const json = await jsonP;
    const total = json?.data?.summary?.totalCalls;
    expect(typeof total, 'API data.summary.totalCalls sayısal olmalı').toBe('number');
    // UI KPI kartı aynı değeri göstermeli (UI, API'yi sadık yansıtıyor mu).
    const card = page.getByText('Total Calls', { exact: true }).locator('..');
    await expect(card).toContainText(String(total));
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Kararlı UI: boş-durum bölümü (campaign) — canlı grafik yok, deterministik.
test.describe('Rapor bölümleri — görsel @visual', () => {
  test('boş-durum (campaign) görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const rp = app.reportSection('campaign');
    await rp.open();
    await rp.page.getByText(/No data available/i).first().waitFor({ timeout: 20000 });
    await waitForUiToSettle(rp.page);
    await expect(rp.page.getByText(/No data available/i).first()).toHaveScreenshot('campaign-empty.png', {
      maxDiffPixels: 150,
    });
  });
});

// ═══════════════ KONTROL: YAPAY ZEKA İÇGÖRÜLERİ (L1 + L2) ═══════════════
// L3 (içgörü içeriğinin doğruluğu) canlı/oynak → N/A; L1 (tetikleniyor) + L2 (doğru uç) kanıtlanır.
test.describe(`Kontrol: AI Insights (${DATA_RICH}) @regression`, () => {
  test('L1+L2: tıklayınca insights ucuna POST gidiyor', async ({ app, page }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await expect(rp.aiInsightsButton).toBeEnabled();
    const req = page.waitForResponse(
      (r) => r.url().includes(ReportSectionPage.insightsApiFor(DATA_RICH)) && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await rp.aiInsightsButton.click();
    const res = await req;
    expect(res.status(), 'insights POST 2xx').toBeLessThan(400);
  });
});

// ═══════════════ KONTROL: EXPORT (L1) ═══════════════
// L2/L3 (gerçek indirme + dosya içeriği) = yan-etkili indirme → @export N/A (coverage-exclusions).
test.describe(`Kontrol: Export (${DATA_RICH}) @regression`, () => {
  test('L1 tıklama OK: menü CSV/Excel/PDF seçenekleriyle açılıyor', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await rp.exportButton.first().click();
    await expect(rp.exportMenuItem(/CSV/i)).toBeVisible();
    await expect(rp.exportMenuItem(/Excel/i)).toBeVisible();
    await expect(rp.exportMenuItem(/PDF/i)).toBeVisible();
    await rp.page.keyboard.press('Escape'); // indirmeyi TETİKLEMEDEN kapat
  });
});

// ═══════════════ KONTROL: SCHEDULE (L1) ═══════════════
// L2/L3 (gerçek create→list→delete) gated mutation spec'inde:
// tests/reports-schedule-mutations.authed.spec.js. Burada salt-okunur L1 korunur.
test.describe(`Kontrol: Schedule (${DATA_RICH}) @regression`, () => {
  test('L1 tıklama OK: "Schedule This Report" diyaloğu açılıyor ve iptal edilebiliyor', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await rp.scheduleButton.click();
    const dialog = rp.page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /Schedule This Report/i })).toBeVisible();
    await rp.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

// ═══════════════ KONTROL: GRAFİK TÜRÜ Bar/Line/Area (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — istemci tarafı yeniden çizim, network yok.
test.describe(`Kontrol: Grafik türü (${DATA_RICH}) @regression`, () => {
  test('L1+L3: "line" seçilince grafik çizgi türüne geçiyor (recharts-line)', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await rp.chartsTab().click();
    await expect.poll(() => rp.charts.count(), { timeout: 15000 }).toBeGreaterThan(0);
    await rp.chartType('line').click();
    await expect.poll(() => rp.page.locator('.recharts-line').count(), { timeout: 8000 }).toBeGreaterThan(0);
    await rp.chartType('area').click();
    await expect.poll(() => rp.page.locator('.recharts-area').count(), { timeout: 8000 }).toBeGreaterThan(0);
  });
});

// ═══════════════ KONTROL: GRUPLANDIR FİLTRESİ (L1 + L2) ═══════════════
test.describe(`Kontrol: Group By filtresi (${DATA_RICH}) @regression`, () => {
  test('L1+L2: "By Week" seçilince groupBy=week ile veri çekiyor', async ({ app, page }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    const req = page.waitForRequest(
      (r) => r.url().includes(ReportSectionPage.apiFor(DATA_RICH)) && /groupBy=week/i.test(r.url()) && r.method() === 'GET',
      { timeout: 12000 }
    );
    await rp.filterCombo('By Day').click();
    await page.getByRole('option', { name: 'By Week', exact: true }).click();
    await req; // groupBy=week isteği gitti (L2)
    await expect(rp.filterCombo('By Week')).toBeVisible(); // L1: değer güncellendi
  });
});

// ═══════════════ KONTROL: TOOLBAR SWITCH'LERİ (L1) ═══════════════
// L2/L3: Standard mod düzen değişimi + Auto-refresh poll'u deterministik gözlemlenemez → N/A (yalnızca L1).
test.describe(`Kontrol: Toolbar switch'leri (${DATA_RICH}) @regression`, () => {
  test('L1 tıklama OK: Standard ve Auto-refresh switch\'leri durum değiştiriyor', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await expect(rp.autoRefreshSwitch).toHaveAttribute('aria-checked', 'false');
    await rp.autoRefreshSwitch.click();
    await expect(rp.autoRefreshSwitch).toHaveAttribute('aria-checked', 'true');
    await rp.standardModeSwitch.click();
    await expect(rp.standardModeSwitch).toHaveAttribute('aria-checked', 'true');
  });
});

// ═══════════════ KONTROL: TABLO (agent) yapısı + pager (L1) ═══════════════
test.describe(`Kontrol: Tablo yapısı (${DATA_RICH}) @regression`, () => {
  test('Tablo sekmesinde başlık + veri satırları + sayfa boyutu kontrolü var', async ({ app }) => {
    const rp = app.reportSection(DATA_RICH);
    await rp.open();
    await rp.tableTab().click();
    await expect(rp.table).toBeVisible({ timeout: 15000 });
    // başlık satırı + en az bir veri satırı
    await expect(rp.table.locator('thead th').first()).toBeVisible();
    await expect.poll(() => rp.table.locator('tbody tr').count(), { timeout: 10000 }).toBeGreaterThan(0);
    // sayfa boyutu kontrolü (per-page)
    await expect(rp.page.getByText(/per page|sayfa başına/i).first()).toBeVisible();
  });
});

// ═══════════════ BİLİNEN HATA: DATE RANGE ETİKETİ UTC (yerel değil) @known-bug ═══════════════
// Aralık API'de yerel-gece yarısına göre doğru; ANCAK gösterilen etiket UTC ile basılıyor →
// UTC+3'te başlangıç bir gün geride görünüyor ("Bugün" → dün–bugün). Wallboard BULGU 4 ile aynı sınıf.
// Manuel rapor: docs/manuel-test-raporu/02-tarih-araligi-utc.md
test.describe('Rapor bölümleri — Date Range timezone @regression @known-bug', () => {
  test.use({ timezoneId: 'Europe/Istanbul', locale: 'en-US' });

  test('L3: "Today" preset tarih etiketi YEREL bugünü göstermeli (UTC değil) [BULGU]', async ({ app }) => {
    knownBugGuard(test, 'REPORTS-SECTIONS-TZ'); // BULGU açıkken beklenen başarısızlık (etiket UTC → dün gösteriyor)
    const rp = app.reportSection('call');
    await rp.open();
    await rp.datePreset('Today').click();
    await expect.poll(() => rp.dateRangeStartLabel(), { timeout: 8000 }).not.toBe('');
    const startLabel = await rp.dateRangeStartLabel();
    const localToday = await rp.page.evaluate(() =>
      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    );
    expect(startLabel, `etiket başlangıcı="${startLabel}" yerel bugün="${localToday}" olmalı`).toBe(localToday);
  });
});
