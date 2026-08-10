// @ts-check
import { test, expect } from './fixtures/test.js';
import { CoachingPage } from './pages/CoachingPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  waitForUiToSettle,
  mockApi,
  expectDialogKeyboard,
} from './helpers.js';

/**
 * SÜPERVİZÖR → KOÇLUK / QUALITY COACHING (`/supervisor/coaching`)
 *
 * Keşif + kanıt: docs/kocluk-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * Standartlar: 3 katman (L1/L2/L3) + 4 dil i18n — bkz. AGENTS.md.
 * NOT: Değerlendirme oluşturma (POST) veri değiştirir → prod'da GERÇEKTEN oluşturulmaz;
 * submit `page.route` ile yakalanır (sahte yanıt). Gerçek kalıcı kayıt staging'de ayrı
 * mutasyon spec'ine bırakılır (bkz. AGENTS.md — production mutasyon güvenliği).
 */

const I18N = CoachingPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Koçluk — yapı', () => {
  /** @type {CoachingPage} */
  let co;
  test.beforeEach(async ({ app }) => {
    co = app.coaching;
    await co.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(co.heading).toHaveText(I18N.en.heading);
    await expect(co.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('istatistik döşemeleri görünüyor', async () => {
    for (const label of CoachingPage.STAT_TILES) {
      await expect(co.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('tablo kolonları + sekmeler görünüyor @critical', async () => {
    for (const col of CoachingPage.COLUMNS) {
      await expect(co.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    for (const t of I18N.en.tabs) {
      await expect(co.tab(t)).toBeVisible();
    }
  });

  test('kontroller mevcut (arama / New Evaluation) + boş-durum', async () => {
    await expect(co.searchInput).toBeVisible();
    await expect(co.newEvalButton).toBeVisible();
    await expect(co.page.getByText(I18N.en.empty, { exact: true })).toBeVisible();
  });
});

// ──────────────────────── 4 DİL i18n GUARD'LARI ────────────────────────
test.describe('Koçluk — 4 dil çeviri guard\'ları @i18n @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + sekmeler + New Evaluation çevrili`, async ({ app }) => {
      const co = app.coaching;
      await co.open();
      if (t.endonym) await co.switchLanguage(t.endonym);

      await expect(co.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(co.heading).toHaveText(t.heading);
      if (t.subtitle) await expect(co.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      for (const tab of t.tabs) {
        await expect(co.tab(tab)).toBeVisible();
      }
      await expect(co.page.getByRole('button', { name: t.newEval, exact: true }).first()).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: SEKMELER (L1) ═══════════════
// L2/L3: sekme değişimi (Evaluated ↔ Pending Review) boş veride sunucu isteği atmıyor
// (istemci-taraflı süzme) → doğruluk boş veriyle gözlemlenemez → N/A.
test.describe('Kontrol: Sekmeler @regression', () => {
  test('L1 tıklama OK: "Pending Review" sekmesi seçili duruma geçiyor', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    const pending = co.tab(I18N.en.tabs[1]);
    await expect(async () => {
      await pending.click();
      await expect(pending).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  });
});

// ═══════════════ KONTROL: ARAMA (L1) ═══════════════
test.describe('Kontrol: Değerlendirme arama @regression', () => {
  test('L1 tıklama OK: arama kutusuna yazılabiliyor', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    await co.searchInput.fill('Account');
    await expect(co.searchInput).toHaveValue('Account');
  });
});

// ═══════════════ KONTROL: NEW EVALUATION (L1 + skorlama L3 + contract L2) ═══════════════
test.describe('Kontrol: New Evaluation @regression', () => {
  test('L1 tıklama OK: diyalog form alanlarıyla açılıyor', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    const dialog = await co.openNewEvaluation();
    await expect(dialog.getByText('Evaluation Criteria', { exact: false })).toBeVisible();
    await expect(dialog.getByPlaceholder('Enter interaction ID')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Submit Evaluation/i })).toBeVisible();
    await dialog.getByRole('button', { name: /Cancel/i }).click();
  });

  test('L3 görev OK: kriter puanları Overall Score\'u yükseltiyor', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    const dialog = await co.openNewEvaluation();
    expect(await co.overallScore(dialog)).toBe(0); // başlangıç %0
    // Kriter yıldızlarına tıkla → skor > 0 olmalı.
    const stars = dialog.locator('button:has(svg)');
    const n = await stars.count();
    for (let g = 0; g < 5; g++) { const i = g * 5 + 3; if (i < n) await stars.nth(i).click().catch(() => {}); }
    await expect.poll(() => co.overallScore(dialog), { timeout: 5000 }).toBeGreaterThan(0);
    await dialog.getByRole('button', { name: /Cancel/i }).click();
  });

  // L2: tam doldurulunca doğru uca doğru payload ile POST atıyor.
  // İstek `route` ile YAKALANIR + sahte 200 → prod'da GERÇEK kayıt OLUŞMAZ.
  test('L2 arka plan OK: dolu form doğru DTO ile evaluations ucuna POST ediyor', async ({ app, page }) => {
    const co = app.coaching;
    await co.open();
    let payload = null;
    await page.route(`**${CoachingPage.API.evaluations}`, async (route) => {
      if (route.request().method() === 'POST') {
        payload = route.request().postDataJSON();
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"data":{}}' }); // prod'a yazma
      } else await route.continue();
    });
    const dialog = await co.openNewEvaluation();
    await co.fillEvaluation(dialog);
    await dialog.getByRole('button', { name: /Submit Evaluation/i }).click();
    await expect.poll(() => payload, { timeout: 10000 }).not.toBeNull();
    // OpenAPI CreateCoachingEvaluationDto zorunlu alanları:
    expect(payload).toMatchObject({
      interactionId: expect.any(String),
      interactionType: expect.any(String),
      agentId: expect.any(String),
      scorePercent: expect.any(Number),
    });
    expect(payload.formData).toBeTruthy();
    expect(payload.scorePercent).toBeGreaterThan(0);
  });
});

// GÖZLEM (kesin bug değil): "Submit Evaluation" boş/eksik formda AKTİF görünüyor ve
// "Interaction" alanı serbest metin "Enter interaction ID" (dropdown/arama yok). Bunlar
// UX kaygısı olabilir ama net bir kusur olarak KANITLANAMADI (doğrulama davranışı belirsiz) →
// bilinçli olarak test.fail yazılmadı; docs/kocluk-kesif/NOTLAR.md'de gözlem olarak kayıtlı.
//
// L3 (gerçek kalıcı kayıt): değerlendirme oluşturma bir mutasyondur → prod'da tetiklenmez;
// staging'de ayrı mutasyon spec'i ile doğrulanır.
test.describe('Koçluk — oluşturma L3 (staging planı) @regression', () => {
  test.fixme('L3: değerlendirme gönderimi kalıcı kayıt oluşturur (staging mutasyon)', async () => {});
});

// ═══════════════════════ STİL SÖZLEŞMESİ (C1: L1 → dedicated L2) ═══════════════════════
// Dedicated arketip: @i18n (yukarıda) + @a11y/@layout/@clean/@deeplink/@keyboard/@errorpath/@data.
// Etkileşim derinliği (@ix-tabs): supervisor-coaching-interactions.authed.spec.js.
// Hepsi SALT-OKUNUR (New Evaluation gönderilmez).

test.describe('Koçluk — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    await expectNoSevereA11y(co.page);
  });
});

test.describe('Koçluk — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/supervisor/coaching');
  });
});

test.describe('Koçluk — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const co = app.coaching;
    await co.open();
    await waitForUiToSettle(co.page);
    diagnostics.assertClean();
  });
});

test.describe('Koçluk — deep-link @deeplink', () => {
  test('/supervisor/coaching doğrudan açılınca yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const co = app.coaching;
    await page.goto('/supervisor/coaching', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(co.shell.loginHeading).toBeHidden();
    await expect(co.heading).toHaveText(CoachingPage.I18N.en.heading);
  });
});

test.describe('Koçluk — klavye/odak @keyboard', () => {
  test('New Evaluation dialogu odak tuzağı + Escape ile kapanma (GÖNDERİLMEZ)', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    const dialog = await co.openNewEvaluation();
    await expectDialogKeyboard(co.page, dialog);
  });
});

test.describe('Koçluk — hata-yolu @errorpath', () => {
  test('evaluations ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${CoachingPage.API.evaluations}**`, { status: 500 });
    const co = app.coaching;
    await page.goto('/supervisor/coaching', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(co.shell.loginHeading).toBeHidden();
    await expect(co.heading).toHaveText(CoachingPage.I18N.en.heading);
  });
});

test.describe('Koçluk — sayısal döşeme değeri @data', () => {
  test('istatistik döşemesi (Total Evaluations) API-bağlı bir DEĞER gösteriyor', async ({ app, page }) => {
    const co = app.coaching;
    // Veri-bağlılık: döşeme değeri backend koçluk ucundan gelir (görsel değil).
    const respP = page.waitForResponse(
      (r) => r.url().includes('/supervisor/coaching') && r.request().method() === 'GET' && r.ok(),
      { timeout: 15000 }
    );
    await co.open();
    await respP;
    // Değer etiketin BÜYÜKEBEVEYNİNDE tutulur (ai/usage tile deseni) → paylaşılan
    // expectMetricHasValue (yalnız ebeveyn) yetmez; tile kabını tarayıp sayı/işaret ara.
    const label = co.page.getByText('Total Evaluations', { exact: true }).first();
    await expect(async () => {
      const txt = await label.evaluate((el) => {
        const tile = el.closest('[class*="card"],[class*="tile"],[class*="stat"]') ||
          el.parentElement?.parentElement || el.parentElement;
        return tile ? tile.textContent || '' : '';
      });
      expect(/\d|%|—|N\/A/.test(txt), 'tile kabında sayısal değer görünmeli').toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});
