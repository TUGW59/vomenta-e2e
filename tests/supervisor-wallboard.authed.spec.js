// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertLocalClock } from './helpers.js';
import { WallboardPage } from './pages/WallboardPage.js';

/**
 * SÜPERVİZÖR DUVAR PANOSU (`/supervisor/wallboard`)
 *
 * Keşif + kanıt: docs/supervizor-panosu-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER BUTON İÇİN 3 KATMANLI KONTROL ────────────────────────────────────┐
 * │ L1 — TIKLAMA OK : butona basılıyor ve UI tepki veriyor (toggle/menü/     │
 * │                   değer/geri bildirim).                                  │
 * │ L2 — ARKA PLAN OK: doğru uca network isteği gidiyor (method+endpoint+2xx)│
 * │                   Saf istemci-tarafı kontrollerde L2 YOK (N/A) → belirtilir│
 * │ L3 — GÖREV OK   : butonun amacı gerçekten gerçekleşiyor (tema uygulanır, │
 * │                   veri/saat güncellenir, tam ekran, kaydırma, kayıt).    │
 * └──────────────────────────────────────────────────────────────────────────┘
 * Böylece bir buton bozulunca HANGİ KATMANDA koptuğu netçe görünür.
 *
 * Ayrıca: yapı (@smoke) ve 4 dil çeviri guard'ları (@regression).
 *
 * `test.fail()` = bulgu HÂLÂ AÇIK: test doğru davranışı doğrular, bug açıkken
 * "beklenen başarısızlık" olur (CI yeşil kalır); düzelince "beklenmedik geçiş"
 * → o zaman `test.fail()` kaldırılıp kalıcı guard'a çevrilir.
 *
 * Bilinen hatalar: BULGU 1 (tema seçici tema uygulamıyor — Tema L3),
 * BULGU 2 (Refresh All/Auto-scroll çevrilmiyor — i18n), BULGU 3 (Auto-scroll
 * kaydırmıyor — Auto-scroll L3), BULGU 4 (Live saati UTC — Refresh All L3).
 */

const I18N = WallboardPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Duvar Panosu — yapı', () => {
  /** @type {WallboardPage} */
  let wallboard;

  test.beforeEach(async ({ app }) => {
    wallboard = app.wallboard;
    await wallboard.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(wallboard.heading).toHaveText(I18N.en.heading);
    await expect(wallboard.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('kontrol çubuğu düğmeleri mevcut (Refresh All / Auto-scroll / Save layout / TV mode / tema)', async () => {
    await expect(wallboard.refreshAll).toBeVisible();
    await expect(wallboard.autoScroll).toBeVisible();
    await expect(wallboard.saveLayout()).toBeVisible();
    await expect(wallboard.tvMode()).toBeVisible();
    await expect(wallboard.themeSelect).toBeVisible();
  });

  test('dört kuyruk kartı listeleniyor @critical', async () => {
    for (const name of WallboardPage.QUEUE_CARDS) {
      await expect(wallboard.page.getByText(name, { exact: true }).first()).toBeVisible();
    }
  });

  test('alt metrik kartları mevcut (ASA / Queued / Volume / SLA)', async () => {
    for (const label of ['Avg speed of answer', 'Calls waiting in queue', 'Calls last hour', 'Overall SLA']) {
      await expect(wallboard.page.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI ────────────────────────
test.describe('Duvar Panosu — 4 dil çeviri guard\'ları @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + tema/kontrol etiketleri çevrili`, async ({ app }) => {
      const wallboard = app.wallboard;
      await wallboard.open();
      if (t.endonym) await wallboard.switchLanguage(t.endonym);

      await expect(wallboard.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(wallboard.heading).toHaveText(t.heading);
      await expect(wallboard.themeSelect).toHaveText(t.theme);
      await expect(wallboard.saveLayout(t.saveLayout)).toBeVisible();
      await expect(wallboard.tvMode(t.tvMode)).toBeVisible();
    });
  }
});

// ═══════════════ BUTON: REFRESH ALL (L1 + L2 + L3) ═══════════════
test.describe('Buton: Refresh All @regression', () => {
  // BULGU 4 (L3) yalnızca UTC olmayan saat diliminde görünür.
  test.use({ timezoneId: 'Europe/Istanbul', locale: 'en-US' });

  test('L1 tıklama OK: tıklayınca "refreshed" bildirimi çıkıyor', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await expect(wallboard.refreshAll).toBeEnabled();
    await wallboard.refreshAll.click();
    await expect(wallboard.refreshedToast).toBeVisible({ timeout: 8000 });
  });

  test('L2 arka plan OK: dashboard verisini API\'den çekiyor @critical', async ({ app, page }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    const request = page.waitForRequest(
      (r) => r.url().includes(WallboardPage.API.dashboard) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await wallboard.refreshAll.click();
    await request; // tetiklenmezse timeout → kırılır
  });

  // L3 görev OK: yenilenen "son-güncelleme" saati doğru (yerel) gösterilmeli.
  // BULGU 4: saat UTC basıldığı için UTC+3'te ~180 dk sapıyor → beklenen başarısızlık.
  test('L3 görev OK: gösterilen son-güncelleme saati yerel saat olmalı (UTC değil) [BULGU 4]', async ({ app, page }) => {
    test.fail(); // BULGU 4 açıkken beklenen başarısızlık (yalnızca bu testi işaretler)
    const wallboard = app.wallboard;
    await wallboard.open();
    await expect(wallboard.liveTimestamp).toBeVisible({ timeout: 15000 });
    const badgeText = (await wallboard.liveTimestamp.innerText()).trim();
    await assertLocalClock(page, badgeText); // yerel saat olmalı (UTC değil) — ortak timezone guard'ı
  });
});

// ═══════════════ BUTON: AUTO-SCROLL (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — saf istemci-tarafı davranış, network isteği beklenmez.
test.describe('Buton: Auto-scroll @regression', () => {
  test('L1 tıklama OK: tıklayınca toggle aktif duruma geçiyor', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await expect(wallboard.autoScroll).toBeEnabled();
    await wallboard.autoScroll.click();
    await expect(wallboard.autoScroll).toHaveClass(/bg-primary/); // aktif (vurgulu) durum
  });

  // L3 görev OK: içerik taşınca otomatik kaydırmalı.
  // BULGU 3: toggle açılıyor ama (TV modu dahil) hiç kaydırmıyor → beklenen başarısızlık.
  test('L3 görev OK: içerik taşınca otomatik kaydırmalı [BULGU 3]', async ({ app, page }) => {
    test.fail(); // BULGU 3 açıkken beklenen başarısızlık
    const wallboard = app.wallboard;
    await wallboard.open();
    await page.setViewportSize({ width: 1280, height: 460 }); // içerik taşsın
    await expect.poll(() => wallboard.hasScrollableOverflow(), { timeout: 8000 }).toBe(true);

    await wallboard.autoScroll.click();
    await expect(wallboard.autoScroll).toHaveClass(/bg-primary/);

    await expect
      .poll(() => wallboard.maxScrollTop(), { timeout: 8000, intervals: [500, 800, 1000, 1500, 2000, 2000] })
      .toBeGreaterThan(0);
  });
});

// ═══════════════ BUTON: TV MODE (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — fullscreen API, network isteği beklenmez.
test.describe('Buton: TV mode @regression', () => {
  test('L1 tıklama OK: buton görünür ve etkin', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await expect(wallboard.tvMode()).toBeEnabled();
  });

  test('L3 görev OK: tıklayınca tam ekrana geçiyor', async ({ app, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Headless fullscreen yalnızca chromium\'da güvenilir.');
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.tvMode().click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement), { timeout: 8000 }).toBe(true);
    await page.keyboard.press('Escape'); // temizlik
  });
});

// ═══════════════ BUTON: SAVE LAYOUT (L1 + L2) ═══════════════
// L3 görev OK (kalıcı kayıt) prod'a YAZMADAN güvenli doğrulanamaz (mutation gerektirir) → N/A.
// L2, doğru uca PUT'un gittiğini kanıtlar (istek ağda yakalanır, prod DEĞİŞMEZ).
test.describe('Buton: Save layout @regression', () => {
  test('L1 tıklama OK: buton görünür ve etkin', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await expect(wallboard.saveLayout()).toBeEnabled();
  });

  test('L2 arka plan OK: düzeni PUT ile config ucuna gönderiyor', async ({ app, page }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    let putHit = false;
    await page.route(`**${WallboardPage.API.config}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putHit = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); // prod'a yazma
      } else {
        await route.continue();
      }
    });
    await wallboard.saveLayout().click();
    await expect.poll(() => putHit, { timeout: 10000 }).toBe(true);
  });
});

// ═══════════════ KONTROL: TEMA SEÇİCİ (L1 + L3) ═══════════════
// L2 arka plan: YOK (N/A) — tema tercihi istemci tarafı, network isteği beklenmez.
test.describe('Kontrol: Tema seçici @regression', () => {
  test('L1 tıklama OK: seçenek seçince gösterilen değer değişiyor', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.selectTheme('Dark');
    await expect(wallboard.themeSelect).toHaveText('Dark'); // trigger değeri güncelleniyor
    await wallboard.selectTheme('Light');
    await expect(wallboard.themeSelect).toHaveText('Light');
  });

  // L3 görev OK: seçilen tema sayfaya uygulanmalı.
  // BULGU 1: "Dark" seçilince <html> koyu temaya geçmeli; class 'light' kalıyor → beklenen başarısızlık.
  test('L3 görev OK: "Dark" seçilince koyu tema uygulanmalı [BULGU 1]', async ({ app }) => {
    test.fail(); // BULGU 1 açıkken beklenen başarısızlık
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.selectTheme('Dark');
    await expect(wallboard.page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });
  });
});

// ═══════════════ KONTROL: REFRESH ARALIĞI (L1) ═══════════════
// L2/L3: aralık değişiminin poll sıklığına etkisi güvenilir/deterministik gözlemlenemez → N/A (yalnızca L1).
test.describe('Kontrol: Refresh aralığı @regression', () => {
  test('L1 tıklama OK: değer düzenlenebiliyor', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await expect(wallboard.refreshInterval).toHaveValue('30'); // varsayılan
    await wallboard.refreshInterval.fill('10');
    await expect(wallboard.refreshInterval).toHaveValue('10');
  });
});

// ═══════════════ KONTROL: KUYRUK EYLEMLERİ (⋮) ═══════════════
// ⋮ menü butonu: L1 = menü açılır + öğeler görünür. L2/L3 = N/A (menü açıcı).
// Menü ÖĞELERİ (Pause/Resume/Close/Redirect/Move) VERİ DEĞİŞTİRİR/YIKICIDIR →
// prod'da TETİKLENMEZ; L2/L3'leri staging @mutation ile (aşağıda test.fixme).
test.describe('Kontrol: Kuyruk eylemleri (⋮) @regression', () => {
  test('L1 tıklama OK: ⋮ menüsü açılıyor ve 5 eylem görünüyor @critical', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.openQueueMenu();
    for (const name of WallboardPage.QUEUE_ACTIONS.en) {
      await expect(wallboard.page.getByRole('menuitem', { name, exact: true })).toBeVisible();
    }
    await wallboard.page.keyboard.press('Escape'); // hiçbir eylem tetiklemeden kapat
  });

  test('i18n: Türkçe\'de menü eylemleri çevrili (Resume queue hariç)', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.switchLanguage(I18N.tr.endonym);
    await wallboard.openQueueMenu();
    for (const name of WallboardPage.QUEUE_ACTIONS.tr.translated) {
      await expect(wallboard.page.getByRole('menuitem', { name, exact: true })).toBeVisible();
    }
    await wallboard.page.keyboard.press('Escape');
  });

  // BULGU 5 — "Resume queue" hiçbir dilde çevrilmiyor (menü içi çeviri sızıntısı).
  // Türkçe menüde diğer 4 öğe çevriliyken bu İngilizce kalıyor.
  test('BULGU 5: "Resume queue" Türkçe menüde çevrilmeli', async ({ app }) => {
    test.fail(); // BULGU 5 açıkken beklenen başarısızlık
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.switchLanguage(I18N.tr.endonym);
    await wallboard.openQueueMenu();
    // Beklenen: İngilizce "Resume queue" artık olmamalı (çevrilmiş olmalı) → şu an var → patlar.
    await expect(wallboard.page.getByRole('menuitem', { name: 'Resume queue', exact: true })).toHaveCount(0);
  });
});

// Kuyruk eylemlerinin L2/L3'ü (backend + gerçek etki) YIKICIDIR → prod'da tetiklenmez.
// Aşağıdakiler yalnızca BELGELEME amaçlı `test.fixme` stub'larıdır (çalışmaz).
// Staging'de gerçekten uygulanınca: ayrı `*.mutation.authed.spec.js` dosyasına taşınır,
// `@mutation` etiketi + `mutationGuard` + `cleanup` (geri-alma) eklenir (bkz. AGENTS.md).
test.describe('Kuyruk eylemleri — L2/L3 yıkıcı (staging planı) @regression', () => {
  test.fixme('L2/L3: "Pause queue" backend\'e pause isteği atar ve kuyruk duraklar (staging mutation)', async () => {});
  test.fixme('L2/L3: "Resume queue" backend\'e resume isteği atar ve kuyruk devam eder (staging mutation)', async () => {});
  test.fixme('L2/L3: "Close queue" backend\'e close isteği atar ve kuyruk kapanır (staging mutation)', async () => {});
  test.fixme('L2/L3: "Redirect all calls" onay sonrası yönlendirme isteği atar (staging mutation)', async () => {});
  test.fixme('L2/L3: "Move call" hedef seçme diyaloğu açar ve taşıma isteği atar (staging mutation)', async () => {});
});

// ═══════════════ i18n: BULGU 2 (çeviri sızıntısı) ═══════════════
test.describe('Duvar Panosu — bilinen hatalar (i18n) @regression @known-bug', () => {
  // BULGU 2 — "Refresh All"/"Auto-scroll" hiçbir dilde çevrilmiyor.
  test('BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli', async ({ app }) => {
    test.fail(); // BULGU 2 açıkken beklenen başarısızlık
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.switchLanguage(I18N.tr.endonym);
    // İçerik skeleton'dan çıkana kadar bekle (yerelleşmiş "Düzeni kaydet" gelsin).
    await expect(wallboard.saveLayout(I18N.tr.saveLayout)).toBeVisible();
    await expect(wallboard.page.getByRole('button', { name: 'Refresh All' })).toHaveCount(0);
    await expect(wallboard.page.getByRole('button', { name: 'Auto-scroll' })).toHaveCount(0);
  });
});
