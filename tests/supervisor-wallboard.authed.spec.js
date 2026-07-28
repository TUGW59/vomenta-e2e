// @ts-check
import { test, expect } from './fixtures/test.js';
import { WallboardPage } from './pages/WallboardPage.js';

/**
 * SÜPERVİZÖR DUVAR PANOSU (`/supervisor/wallboard`)
 *
 * Keşif + kanıt: docs/supervizor-panosu-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * Kapsam:
 *  1) Yapı (@smoke @critical) — başlık, kontrol çubuğu, kartlar, metrikler.
 *  2) 4 dil çeviri guard'ları (@regression) — güncelleme çeviriyi/RTL'yi bozarsa kırmızıya döner.
 *  3) Bilinen hatalar (@regression @known-bug, `test.fail`):
 *     - BULGU 1: Tema seçici (Light/Dark/Auto) HİÇBİR tema uygulamıyor.
 *     - BULGU 2: "Refresh All" / "Auto-scroll" hiçbir dilde çevrilmiyor.
 *
 * `test.fail()` = bulgu HÂLÂ AÇIK: test doğru davranışı doğrular, bug açıkken
 * "beklenen başarısızlık" olur (CI yeşil kalır); düzelince "beklenmedik geçiş"
 * → o zaman `test.fail()` kaldırılıp kalıcı guard'a çevrilir.
 */

const I18N = WallboardPage.I18N;

test.describe('Duvar Panosu — yapı', () => {
  /** @type {WallboardPage} */
  let wallboard;

  test.beforeEach(async ({ app }) => {
    wallboard = app.wallboard;
    await wallboard.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(wallboard.heading).toHaveText(I18N.en.heading);
    await expect(
      wallboard.page.getByText(I18N.en.subtitle, { exact: true })
    ).toBeVisible();
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
    for (const label of [
      'Avg speed of answer',
      'Calls waiting in queue',
      'Calls last hour',
      'Overall SLA',
    ]) {
      await expect(wallboard.page.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

test.describe('Duvar Panosu — 4 dil çeviri guard\'ları @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + tema/kontrol etiketleri çevrili`, async ({ app }) => {
      const wallboard = app.wallboard;
      await wallboard.open();

      if (t.endonym) await wallboard.switchLanguage(t.endonym);

      // Metin yönü (Arapça RTL, diğerleri LTR).
      await expect(wallboard.page.locator('html')).toHaveAttribute('dir', t.dir);
      // Başlık yerelleştirilmiş.
      await expect(wallboard.heading).toHaveText(t.heading);
      // Tema seçici açılış değeri yerelleştirilmiş (Dark → Karanlık/Sombre/داكن).
      await expect(wallboard.themeSelect).toHaveText(t.theme);
      // Kontroller yerelleştirilmiş.
      await expect(wallboard.saveLayout(t.saveLayout)).toBeVisible();
      await expect(wallboard.tvMode(t.tvMode)).toBeVisible();
    });
  }
});

test.describe('Duvar Panosu — buton fonksiyonları @regression', () => {
  /**
   * Kontrollerin GERÇEKTEN iş yaptığını doğrular (yalnızca "görünüyor mu" değil).
   * Network incelemesiyle doğrulandı (docs/supervizor-panosu-kesif/NOTLAR.md).
   * Güncelleme bu bağlantıları koparırsa test kırmızıya döner.
   */

  test('"Refresh All" veriyi yeniden çekiyor (dashboard API çağrısı) @critical', async ({ app, page }) => {
    const wallboard = app.wallboard;
    await wallboard.open();

    // Tıklamadan hemen önce isteği beklemeye başla (otomatik yenileme 30 sn'de bir → çakışma olası değil).
    const request = page.waitForRequest(
      (r) => r.url().includes(WallboardPage.API.dashboard) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await wallboard.refreshAll.click();
    await request; // tetiklenmezse timeout → test kırılır
  });

  test('"Save layout" düzeni PUT ile kaydediyor', async ({ app, page }) => {
    const wallboard = app.wallboard;
    await wallboard.open();

    // PUT'u ağda YAKALA ve sahte 200 döndür → prod verisi DEĞİŞMEZ (mutation değil),
    // ama butonun doğru uca PUT attığı doğrulanır.
    let putHit = false;
    await page.route(`**${WallboardPage.API.config}`, async (route) => {
      if (route.request().method() === 'PUT') {
        putHit = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        await route.continue();
      }
    });

    await wallboard.saveLayout().click();
    await expect.poll(() => putHit, { timeout: 10000 }).toBe(true);
  });

  test('"TV mode" tam ekrana geçiriyor', async ({ app, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Headless fullscreen yalnızca chromium\'da güvenilir.');
    const wallboard = app.wallboard;
    await wallboard.open();

    await wallboard.tvMode().click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement), { timeout: 8000 })
      .toBe(true);

    await page.keyboard.press('Escape'); // temizlik
  });
});

test.describe('Duvar Panosu — bilinen hatalar @regression @known-bug', () => {
  /**
   * BULGU 1 — Tema seçici hiçbir tema uygulamıyor.
   * "Dark" seçilince `<html>` koyu temaya geçmeli; şu an class `light` olarak kalıyor.
   * Seçicinin kendi metni "Dark"a döner (o çalışır) ama tema UYGULANMAZ → bu assertion patlar.
   */
  test.fail();
  test('BULGU 1: tema seçici "Dark" seçilince koyu tema uygulanmalı', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();

    await wallboard.selectTheme('Dark'); // seçicinin görünen değeri "Dark" olur (bu kısım çalışır)

    // Beklenen: <html> koyu temaya geçer. Gerçekte: hiç değişmez → beklenen başarısızlık.
    await expect(wallboard.page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });
  });

  /**
   * BULGU 2 — "Refresh All" / "Auto-scroll" hiçbir dilde çevrilmiyor.
   * Türkçe'de sayfa çevriliyken bu iki düğme İngilizce kalıyor.
   * Beklenen: İngilizce adlı düğmeler artık bulunmamalı (çevrilmiş olmalı) → şu an bulunuyor → patlar.
   */
  test.fail();
  test('BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli', async ({ app }) => {
    const wallboard = app.wallboard;
    await wallboard.open();
    await wallboard.switchLanguage(I18N.tr.endonym);

    // Dil geçişi sonrası içerik skeleton'dan çıkıp render olana kadar bekle
    // (yerelleştirilmiş "Düzeni kaydet" kontrol çubuğunun geldiğini kanıtlar).
    await expect(wallboard.saveLayout(I18N.tr.saveLayout)).toBeVisible();

    // Türkçe arayüzde İngilizce etiketli düğmeler kalmamalı.
    await expect(wallboard.page.getByRole('button', { name: 'Refresh All' })).toHaveCount(0);
    await expect(wallboard.page.getByRole('button', { name: 'Auto-scroll' })).toHaveCount(0);
  });

  /**
   * BULGU 3 — Auto-scroll hiç kaydırmıyor.
   * Toggle görsel olarak açılıyor (buton bg-primary olur) ama içerik taşsa bile
   * otomatik kaydırma yapmıyor (normal görünüm + TV modu, ikisinde de scroll = 0).
   * Beklenen: ON iken bir süre sonra scroll pozisyonu 0'ın üstüne çıkar → şu an çıkmıyor.
   */
  test.fail();
  test('BULGU 3: Auto-scroll içerik taşınca otomatik kaydırmalı', async ({ app, page }) => {
    const wallboard = app.wallboard;
    await wallboard.open();

    // İçeriğin taşması için viewport'u kısalt (auto-scroll ancak taşınca anlamlı).
    await page.setViewportSize({ width: 1280, height: 460 });
    await expect.poll(() => wallboard.hasScrollableOverflow(), { timeout: 8000 }).toBe(true);

    await wallboard.autoScroll.click(); // toggle ON (buton bg-primary olur — bu kısım çalışır)
    await expect(wallboard.autoScroll).toHaveClass(/bg-primary/);

    // Beklenen: birkaç saniye içinde otomatik kaydırma başlar (scrollTop artar).
    // Gerçekte: hiç kaydırmaz → poll timeout → beklenen başarısızlık.
    await expect
      .poll(() => wallboard.maxScrollTop(), { timeout: 8000, intervals: [500, 800, 1000, 1500, 2000, 2000] })
      .toBeGreaterThan(0);
  });
});
