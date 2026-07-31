// @ts-check
import { test, expect } from './fixtures/test.js';
import { knownBugGuard } from './helpers.js';
import { WorkforceBadgesPage } from './pages/WorkforceBadgesPage.js';

/**
 * İŞ GÜCÜ › ROZETLER VE OYUNLAŞTIRMA — L1 (tıklama) + L2 (arka plan) salt-okunur.
 *
 * Gerçek create (opt-in) ayrı @mutation spec'inde:
 *   tests/workforce-badges-mutations.authed.spec.js
 */
test.describe('Rozetler ve oyunlaştırma — yapı + kontroller @regression', () => {
  test('L1: sayfa + iki sekme (Rozetler/Sıralama) + oluştur/ver butonları', async ({
    app,
  }) => {
    const b = app.workforceBadges;
    await b.open();
    await expect(b.createButton()).toBeVisible();
    await expect(b.awardButton()).toBeVisible();
    await expect(
      b.page.getByRole('tab', { name: WorkforceBadgesPage.L.tabBadges })
    ).toBeVisible();
    await expect(b.leaderboardTab()).toBeVisible();
  });

  test('L1: "Rozet oluştur" formu açılıyor (Ad + Kategori + Puan)', async ({ app }) => {
    const b = app.workforceBadges;
    await b.open();
    const dialog = await b.openCreateDialog();
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: WorkforceBadgesPage.L.save })).toBeVisible();
    // GÖNDERİLMEZ — salt L1.
    await b.page.keyboard.press('Escape');
  });

  test('L1: "Rozet ver" formu açılıyor (Rozet + Temsilci + Neden)', async ({ app }) => {
    const b = app.workforceBadges;
    await b.open();
    const dialog = await b.openAwardDialog();
    // Rozet + Temsilci seçim kutuları (combobox); Neden metin alanı.
    await expect(dialog.getByRole('combobox').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: WorkforceBadgesPage.L.award })).toBeVisible();
    // GÖNDERİLMEZ — "Ver" gerçek temsilciye rozet atar + bildirim gönderir.
    await b.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: sayfa açılışında rozet listesi API\'den çekiliyor @critical', async ({
    app,
    page,
  }) => {
    const b = app.workforceBadges;
    const badgesGet = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes(WorkforceBadgesPage.API.badges) &&
        r.ok(),
      { timeout: 30000 }
    );
    await b.open();
    expect((await badgesGet).ok()).toBeTruthy();
  });
});

/**
 * BULGU (fonksiyonel) — rozet satırlarında DÜZENLE / SİL kontrolü yok.
 *
 * "Tüm rozetler" tablosunda satır-içi aksiyon (kalem/çöp) ya da satır tıklama
 * menüsü YOK; rozetler UI'dan yalnız oluşturulabiliyor, düzenlenemiyor/silinemiyor.
 * Bu, oluşturulan test rozetlerinin orphan kalmasına yol açar (temizlenemez).
 */
test.describe('Rozetler — düzenle/sil yolu bulgusu @regression', () => {
  test('bir rozet satırı en az bir aksiyon (düzenle/sil) kontrolü sunmalı', async ({
    app,
  }) => {
    knownBugGuard(test, 'WORKFORCE-BADGES-NO-EDIT-DELETE');
    const b = app.workforceBadges;
    await b.open();
    const firstDataRow = b.page.getByRole('row').nth(1); // 0 = başlık
    test.skip((await firstDataRow.count()) === 0, 'Tabloda rozet yok — kontrol atlandı.');
    // BULGU: satırda hiç buton yok → beklenen "≥1" karşılanmıyor (test.fail).
    await expect(firstDataRow.getByRole('button')).not.toHaveCount(0);
  });
});
