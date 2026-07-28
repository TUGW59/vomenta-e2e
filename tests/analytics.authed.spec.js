// @ts-check
import { test, expect } from './fixtures/test.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';

/**
 * ANALİTİK (`/analytics`) — Raporlar ailesinin özet/hub ekranı.
 *
 * Keşif + kanıt: docs/analitik-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com. Salt-okunur (hiçbir şey oluşturulmaz).
 *
 * ┌─ HER KONTROL İÇİN 3 KATMANLI DOĞRULAMA ─────────────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol tepki veriyor (aktif durum/popover/değer).      │
 * │ L2 — ARKA PLAN OK: doğru uca network isteği gidiyor (method+endpoint+2xx).│
 * │                    Saf istemci-tarafı (gezinme) kontrollerde L2 YOK (N/A). │
 * │ L3 — GÖREV OK   : kontrolün amacı gerçekleşiyor (dönem verisi/etiket       │
 * │                    değişir, hedef sayfaya gidilir).                        │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * Ayrıca: yapı (@smoke) ve 4 dil çeviri guard'ları (@regression) — AGENTS.md
 * "Çok dilli (i18n) doğrulama standardı" gereği.
 *
 * `test.fail()` = bulgu HÂLÂ AÇIK: test doğru davranışı doğrular, bug açıkken
 * "beklenen başarısızlık" olur (CI yeşil); düzelince "beklenmedik geçiş" →
 * o zaman `test.fail()` kaldırılıp kalıcı guard'a çevrilir.
 *
 * Bilinen hatalar: BULGU A ("Deep analytics" bölümü hiçbir dilde çevrilmiyor —
 * i18n), BULGU B (iç terim "ClickHouse" kullanıcıya sızıyor).
 */

const I18N = AnalyticsPage.I18N;
const PRESETS = ['today', 'd7', 'd90']; // "d30" varsayılan aktif; ayrı test edilir.

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Analitik — yapı', () => {
  /** @type {AnalyticsPage} */
  let analytics;

  test.beforeEach(async ({ app }) => {
    analytics = app.analytics;
    await analytics.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(analytics.heading).toHaveText(I18N.en.heading);
    await expect(
      analytics.page.getByText('Explore performance across calls, agents, queues, campaigns, and AI.', { exact: true })
    ).toBeVisible();
  });

  test('tarih aralığı butonları mevcut (Today / 7 Days / 30 Days / 90 Days / Custom) @smoke', async () => {
    for (const key of ['today', 'd7', 'd30', 'd90', 'custom']) {
      await expect(analytics.dateButton(I18N.en.dates[key])).toBeVisible();
    }
  });

  test('üst KPI döşemeleri görünüyor', async () => {
    for (const label of AnalyticsPage.KPI_TILES) {
      await expect(analytics.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('"AI usage" ve "Deep analytics" bölümleri görünüyor @smoke', async () => {
    await expect(analytics.aiUsageHeading).toBeVisible();
    await expect(analytics.deepAnalyticsHeading).toBeVisible();
  });

  test('6 navigasyon kartı doğru hedeflerle görünüyor @critical', async () => {
    for (const card of AnalyticsPage.NAV_CARDS) {
      await expect(analytics.navCard(card.href)).toBeVisible();
    }
    await expect(analytics.allReportsLink).toBeVisible();
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI ────────────────────────
test.describe("Analitik — 4 dil çeviri guard'ları @regression", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + tarih butonları + AI usage + kartlar çevrili`, async ({ app }) => {
      const analytics = app.analytics;
      await analytics.open();
      if (t.endonym) await analytics.switchLanguage(t.endonym, t.heading);

      // Yazı yönü (Arapça = rtl)
      await expect(analytics.page.locator('html')).toHaveAttribute('dir', t.dir);
      // Başlık
      await expect(analytics.heading).toHaveText(t.heading);
      // Tarih butonları
      for (const key of ['today', 'd7', 'd30', 'd90', 'custom']) {
        await expect(analytics.dateButton(t.dates[key])).toBeVisible();
      }
      // "AI usage" bölüm başlığı
      await expect(analytics.page.getByRole('heading', { name: t.aiUsage, exact: true })).toBeVisible();
      // "All reports" linki
      await expect(analytics.allReportsLink).toContainText(t.allReports);
      // 6 navigasyon kartı (href stabil, metin çevrili)
      for (const card of AnalyticsPage.NAV_CARDS) {
        await expect(analytics.navCard(card.href)).toContainText(card[code]);
      }
    });
  }
});

// ═══════════ TARİH ARALIĞI: VARSAYILAN + L1 (TIKLAMA) ═══════════
// NOT: Aktif durum yalnızca CSS sınıfı (`bg-secondary`) ile işaretleniyor;
// `aria-pressed` YOK → frontend'den semantik durum/`data-testid` istendi
// (docs/analitik-kesif/NOTLAR.md → Gözlem C). Semantik gelene kadar son çare sınıf.
test.describe('Tarih aralığı — varsayılan + L1 tıklama @regression', () => {
  test('varsayılan olarak "30 Days" aktif, diğerleri değil', async ({ app }) => {
    const analytics = app.analytics;
    await analytics.open();
    await expect(analytics.dateButton(I18N.en.dates.d30)).toHaveClass(/bg-secondary/);
    await expect(analytics.dateButton(I18N.en.dates.d7)).not.toHaveClass(/bg-secondary/);
  });

  for (const key of PRESETS) {
    test(`L1 tıklama OK: "${I18N.en.dates[key]}" tıklanınca aktif duruma geçiyor`, async ({ app }) => {
      const analytics = app.analytics;
      await analytics.open();
      const btn = analytics.dateButton(I18N.en.dates[key]);
      await btn.click();
      await expect(btn).toHaveClass(/bg-secondary/);
    });
  }
});

// ═══════════ TARİH ARALIĞI: L2 (ARKA PLAN) ═══════════
test.describe('Tarih aralığı — L2 arka plan @regression', () => {
  test('L2 arka plan OK: "7 Days" tıklanınca analytics verisi API\'den çekiliyor @critical', async ({ app }) => {
    const analytics = app.analytics;
    await analytics.open();
    const request = analytics.page.waitForRequest(
      (r) => r.url().includes(AnalyticsPage.API.analytics) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await analytics.dateButton(I18N.en.dates.d7).click();
    await request; // tetiklenmezse timeout → kırılır
  });
});

// ═══════════ TARİH ARALIĞI: L3 (GÖREV) ═══════════
// Seçilen aralık gerçekten uygulanmalı: bölüm başlıklarındaki "· 30 Days"
// dönem etiketleri seçilen aralığa dönmeli.
test.describe('Tarih aralığı — L3 görev @regression', () => {
  const TOKENS = { today: 'Today', d7: '7 Days', d90: '90 Days' };

  for (const key of PRESETS) {
    test(`L3 görev OK: "${I18N.en.dates[key]}" seçilince dönem etiketleri "· ${TOKENS[key]}"e dönüyor`, async ({ app }) => {
      const analytics = app.analytics;
      await analytics.open();
      // Başlangıçta 30 Days etiketleri var.
      await expect.poll(() => analytics.periodLabelCount('30 Days'), { timeout: 10000 }).toBeGreaterThan(0);

      await analytics.dateButton(I18N.en.dates[key]).click();

      await expect.poll(() => analytics.periodLabelCount(TOKENS[key]), { timeout: 10000 }).toBeGreaterThan(0);
      await expect.poll(() => analytics.periodLabelCount('30 Days'), { timeout: 10000 }).toBe(0);
    });
  }
});

// ═══════════ CUSTOM TARİH SEÇİCİ (L1 + L2) ═══════════
// L3 görev: özel aralık uygulanınca dönem etiketleri "· N Days" kalıbını
// kullanmaz (özel tarih) → L3 için deterministik gözlem yok, N/A.
test.describe('Custom tarih seçici @regression', () => {
  test('L1 tıklama OK: popover Start / End + "Apply range" ile açılıyor', async ({ app }) => {
    const analytics = app.analytics;
    await analytics.open();
    const dialog = await analytics.openCustomRange();
    await expect(dialog.getByText(I18N.en.custom.start, { exact: true })).toBeVisible();
    await expect(dialog.getByText(I18N.en.custom.end, { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: I18N.en.custom.apply, exact: true })).toBeVisible();
    await expect(dialog.locator('input[type="date"]')).toHaveCount(2);
  });

  test('L2 arka plan OK: "Apply range" özel aralıkla analytics verisi çekiyor', async ({ app }) => {
    const analytics = app.analytics;
    await analytics.open();
    const dialog = await analytics.openCustomRange();
    const dates = dialog.locator('input[type="date"]');
    await dates.nth(0).fill('2026-07-10');
    await dates.nth(1).fill('2026-07-20');

    const request = analytics.page.waitForRequest(
      (r) => r.url().includes(AnalyticsPage.API.analytics) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await dialog.getByRole('button', { name: I18N.en.custom.apply, exact: true }).click();
    await request;
  });
});

// ═══════════ NAVİGASYON KARTLARI (L1 + L3) ═══════════
// L2 arka plan: YOK (N/A) — istemci-taraflı SPA gezinmesi; kartın kendine ait
// bir uç isteği yok. L3, hedef sayfanın GERÇEKTEN yüklendiğini doğrular: doğru
// URL + hedefin beklenen başlığı görünür (salt URL eşleşmesi yeterli değil;
// bkz. AGENTS.md "İnteraktif kontrol testi standardı" → navigasyon L3).
test.describe('Navigasyon kartları @regression', () => {
  for (const card of AnalyticsPage.NAV_CARDS) {
    test(`L1+L3: "${card.en}" kartı ${card.href} ("${card.dest}") sayfasına götürüyor`, async ({ app, page }) => {
      const analytics = app.analytics;
      await analytics.open();
      await analytics.navCard(card.href).click();
      // Doğru rotaya gitti mi?
      await page.waitForURL((u) => u.pathname === card.href, { timeout: 15000 });
      await expect(app.shell.loginHeading).toBeHidden();
      // Hedef sayfa gerçekten yüklendi mi? (beklenen başlık render oldu)
      await expect(
        page.getByRole('heading', { name: card.dest, exact: true }).first()
      ).toBeVisible({ timeout: 15000 });
    });
  }
});

// ═══════════ BİLİNEN HATALAR (i18n) @known-bug ═══════════
test.describe('Analitik — bilinen hatalar (i18n) @regression @known-bug', () => {
  // BULGU A — "Deep analytics" bölümü ve içindeki başlıklar hiçbir dilde çevrilmiyor.
  // Mevcut B12 (known-bugs.spec) yalnızca TR'yi işaretliyor; bu guard tr/fr/ar üçünü de kapsar.
  for (const code of ['tr', 'fr', 'ar']) {
    test(`BULGU A [${code}]: "Deep analytics" bölümü ${code} arayüzde çevrili olmalı`, async ({ app }) => {
      test.fail(); // BULGU A açıkken beklenen başarısızlık
      const analytics = app.analytics;
      await analytics.open();
      await analytics.switchLanguage(I18N[code].endonym, I18N[code].heading);
      const text = await analytics.mainText();
      for (const leak of AnalyticsPage.DEEP_LEAKS) {
        expect(text, `${code} arayüzde çevrilmemiş İngilizce metin sızıyor: "${leak}"`).not.toContain(leak);
      }
    });
  }

  // BULGU B — iç/teknik terim "ClickHouse" kullanıcıya dönük metinde görünüyor (İngilizce dahil).
  test('BULGU B: iç terim "ClickHouse" kullanıcıya görünmemeli', async ({ app }) => {
    test.fail(); // BULGU B açıkken beklenen başarısızlık
    const analytics = app.analytics;
    await analytics.open();
    const text = await analytics.mainText();
    expect(text, 'kullanıcıya dönük metinde iç/teknik terim görünüyor').not.toContain(AnalyticsPage.INTERNAL_TERM);
  });
});
