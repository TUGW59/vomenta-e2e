// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  knownBugGuard,
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';
import { WorkforceBadgesPage } from './pages/WorkforceBadgesPage.js';

/**
 * İŞ GÜCÜ › ROZETLER VE OYUNLAŞTIRMA (`/workforce/badges`) — L1 (tıklama) +
 * L2 (arka plan) salt-okunur + zorunlu test stilleri.
 *
 * Gerçek create (opt-in) ayrı @mutation spec'inde (staging, fixme — silme yolu yok):
 *   tests/workforce-badges-mutations.authed.spec.js
 */
const LANGS = [
  { code: 'en', endonym: null, dir: 'ltr' },
  { code: 'tr', endonym: 'Türkçe', dir: 'ltr' },
  { code: 'fr', endonym: 'Français', dir: 'ltr' },
  { code: 'ar', endonym: 'العربية', dir: 'rtl' },
];

test.describe('Rozetler ve oyunlaştırma — yapı + kontroller @smoke @regression', () => {
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

// ──────────────────── 4 DİL YÖN/BAŞLIK GUARD'I (@i18n) ────────────────────
test.describe('Rozetler — dil yönü/başlık @i18n', () => {
  for (const { code, endonym, dir } of LANGS) {
    test(`[${code}] doğru yazı yönü + başlık görünür`, async ({ app }) => {
      const b = app.workforceBadges;
      await b.open();
      if (endonym) await b.switchLanguage(endonym);
      await expect(b.page.locator('body')).toHaveCSS('direction', dir);
      await expect(b.heading).toBeVisible();
      await expect(b.heading).not.toHaveText('');
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Rozetler — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const b = app.workforceBadges;
    await b.open();
    await expectNoSevereA11y(b.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Rozetler — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/workforce/badges');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Rozetler — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({
    app,
    diagnostics,
  }) => {
    const b = app.workforceBadges;
    await b.open();
    await waitForUiToSettle(b.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Rozetler — hata-yolu @errorpath', () => {
  test('rozet listesi ucu 500 dönerse sayfa çökmüyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    await mockApi(page, `**${WorkforceBadgesPage.API.badges}**`, { status: 500 });
    const b = app.workforceBadges;
    await page.goto('/workforce/badges', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(b.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Rozetler — klavye/odak @keyboard', () => {
  test('Rozet oluştur diyaloğu Escape ile kapanıyor', async ({ app }) => {
    const b = app.workforceBadges;
    await b.open();
    const dialog = await b.openCreateDialog();
    await expect(dialog).toBeVisible();
    await b.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Rozetler — deep-link @deeplink', () => {
  test('/workforce/badges doğrudan açılınca sayfa yükleniyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    const b = app.workforceBadges;
    await page.goto('/workforce/badges', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(b.shell.loginHeading).toBeHidden();
    await expect(b.heading).toHaveText(WorkforceBadgesPage.L.heading);
  });
});
