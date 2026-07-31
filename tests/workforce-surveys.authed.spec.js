// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  knownBugGuard,
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';
import { WorkforceSurveysPage } from './pages/WorkforceSurveysPage.js';

/**
 * İŞ GÜCÜ › CSAT ANKETLERİ (`/workforce/surveys`) — ayrı rota.
 * L1 (tıklama) + L2 (arka plan) salt-okunur kontroller + zorunlu test stilleri.
 *
 * Veri-değiştirmez → her koşuda çalışır (opt-in gerekmez). Gerçek create→görüntüle→
 * düzenle→sil yaşam döngüsü ayrı @mutation spec'indedir (staging):
 *   tests/workforce-surveys-mutations.authed.spec.js
 *
 * Not (uzlaştırma): 4-dil derin çeviri kanıtı /workforce sekmeli yüzeyinde
 *   (workforce.authed.spec.js @i18n) sahiplenilir; burada @i18n yalnız ayrı rotanın
 *   dil-yönü + başlık davranışını yapısal doğrular (fr/ar metni TAHMİN edilmez).
 */
const LANGS = [
  { code: 'en', endonym: null, dir: 'ltr' },
  { code: 'tr', endonym: 'Türkçe', dir: 'ltr' },
  { code: 'fr', endonym: 'Français', dir: 'ltr' },
  { code: 'ar', endonym: 'العربية', dir: 'rtl' },
];

test.describe('CSAT anketleri — yapı + kontroller @smoke @regression', () => {
  test('L1: sayfa yükleniyor ve "Anket oluştur" formu açılıyor (Ad + Gönder)', async ({
    app,
  }) => {
    const s = app.workforceSurveys;
    await s.open();
    await expect(s.createButton()).toBeVisible();

    const dialog = await s.openCreateDialog();
    // Create formu alanları (canlı gözlem): Ad · açıklama · Kanallar · Tetikleyici · Sorular(JSON)
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: WorkforceSurveysPage.L.submit }).first()
    ).toBeVisible();
    // GÖNDERİLMEZ — salt L1.
    await s.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: sayfa açılışında anket listesi API\'den çekiliyor @critical', async ({
    app,
    page,
  }) => {
    const s = app.workforceSurveys;
    const surveysGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes(WorkforceSurveysPage.API.surveys) &&
        r.ok(),
      { timeout: 30000 }
    );
    await s.open();
    const res = await surveysGet;
    expect(res.ok()).toBeTruthy();
  });
});

/**
 * BULGU (a11y) — satır aksiyon ikonları erişilebilir adsız.
 *
 * "Anketler" tablosundaki düzenle (kalem) ve sil (çöp) ikon-butonlarının
 * accessible name'i YOK; ekran okuyucu "button" der ve testler konumdan seçmek
 * zorunda kalır. Var olan bir anket satırı yoksa test atlanır (create yapmaz).
 */
test.describe('CSAT anketleri — a11y bulgusu (ikon aria-label) @regression', () => {
  test('satır aksiyon ikonları erişilebilir ad taşımalı', async ({ app }) => {
    knownBugGuard(test, 'WORKFORCE-SURVEYS-ICON-A11Y');
    const s = app.workforceSurveys;
    await s.open();
    const anyRow = s.page
      .getByRole('row')
      .filter({ has: s.page.getByRole('button', { name: WorkforceSurveysPage.L.resultsButton }) })
      .first();
    test.skip((await anyRow.count()) === 0, 'Tabloda anket yok — a11y kontrolü atlandı.');

    // Sonuçlar (adlı) dışındaki satır-içi ikon butonlar: hepsi erişilebilir ad taşımalı.
    const iconButtons = anyRow.getByRole('button').filter({
      hasNot: s.page.getByRole('button', { name: WorkforceSurveysPage.L.resultsButton }),
    });
    const count = await iconButtons.count();
    for (let i = 0; i < count; i += 1) {
      const name = (await iconButtons.nth(i).getAttribute('aria-label')) || '';
      // BULGU: bu boş → test.fail ile "bilinen açık" olarak işaretli.
      expect(name.trim(), 'ikon-buton aria-label taşımalı').not.toBe('');
    }
  });
});

// ──────────────────── 4 DİL YÖN/BAŞLIK GUARD'I (@i18n) ────────────────────
// Ayrı rota için yapısal dil kanıtı: dil değişince yön doğru, başlık görünür.
// Derin çeviri metni /workforce sekmeli yüzeyinde sahiplenilir (tekrar yok).
test.describe('CSAT anketleri — dil yönü/başlık @i18n', () => {
  for (const { code, endonym, dir } of LANGS) {
    test(`[${code}] doğru yazı yönü + başlık görünür`, async ({ app }) => {
      const s = app.workforceSurveys;
      await s.open();
      if (endonym) await s.switchLanguage(endonym);
      await expect(s.page.locator('body')).toHaveCSS('direction', dir);
      await expect(s.heading).toBeVisible();
      await expect(s.heading).not.toHaveText('');
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('CSAT anketleri — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok (bilinen ikon-adı borcu hariç)', async ({
    app,
  }) => {
    const s = app.workforceSurveys;
    await s.open();
    await expectNoSevereA11y(s.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('CSAT anketleri — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/workforce/surveys');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('CSAT anketleri — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({
    app,
    diagnostics,
  }) => {
    const s = app.workforceSurveys;
    await s.open();
    await waitForUiToSettle(s.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
// Liste ucu 500 dönse de kabuk/oturum korunur, sahte satır render edilmez.
test.describe('CSAT anketleri — hata-yolu @errorpath', () => {
  test('anket listesi ucu 500 dönerse sayfa çökmüyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    await mockApi(page, `**${WorkforceSurveysPage.API.surveys}**`, { status: 500 });
    const s = app.workforceSurveys;
    await page.goto('/workforce/surveys', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    // Başarısız fetch sonrası sahte anket satırı olmamalı (yalnız başlık satırı).
    await expect(s.page.getByRole('row').filter({ hasText: 'VOMENTA_E2E_' })).toHaveCount(0);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('CSAT anketleri — klavye/odak @keyboard', () => {
  test('Anket oluştur diyaloğu Escape ile kapanıyor', async ({ app }) => {
    const s = app.workforceSurveys;
    await s.open();
    const dialog = await s.openCreateDialog();
    await expect(dialog).toBeVisible();
    await s.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('CSAT anketleri — deep-link @deeplink', () => {
  test('/workforce/surveys doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    const s = app.workforceSurveys;
    await page.goto('/workforce/surveys', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(s.shell.loginHeading).toBeHidden();
    await expect(s.heading).toHaveText(WorkforceSurveysPage.L.heading);
  });
});
