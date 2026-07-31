// @ts-check
import { test, expect } from './fixtures/test.js';
import { knownBugGuard } from './helpers.js';
import { WorkforceSurveysPage } from './pages/WorkforceSurveysPage.js';

/**
 * İŞ GÜCÜ › CSAT ANKETLERİ — L1 (tıklama) + L2 (arka plan) salt-okunur kontroller.
 *
 * Veri-değiştirmez → her koşuda çalışır (opt-in gerekmez). Gerçek create→görüntüle→
 * düzenle→sil yaşam döngüsü ayrı @mutation spec'indedir:
 *   tests/workforce-surveys-mutations.authed.spec.js
 */
test.describe('CSAT anketleri — yapı + kontroller @regression', () => {
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
