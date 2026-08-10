// @ts-check
import { test, expect } from './fixtures/test.js';
import { InteractionsPage } from './pages/InteractionsPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  waitForUiToSettle,
  mockApi,
} from './helpers.js';

/**
 * SÜPERVİZÖR → CANLI ETKİLEŞİMLER / LIVE INTERACTIONS (`/supervisor/interactions`)
 *
 * Keşif + kanıt: docs/canli-etkilesimler-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * Standartlar: 3 katman (L1/L2/L3) + 4 dil i18n — bkz. AGENTS.md.
 * NOT: Sayfa şu an boş-durum ("No active interactions") — tüm ajanlar çevrimdışı, canlı
 * etkileşim yok. Satır-aksiyonları (canlı izleme vb.) canlı etkileşim/staging gerektirir → N/A.
 * i18n SAĞLAM (4 dil, RTL, tüm kolonlar + boş-durum çevrili); çeviri sızıntısı/timezone YOK.
 */

const I18N = InteractionsPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Canlı Etkileşimler — yapı', () => {
  /** @type {InteractionsPage} */
  let ix;
  test.beforeEach(async ({ app }) => {
    ix = app.interactions;
    await ix.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(ix.heading).toHaveText(I18N.en.heading);
    await expect(ix.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('tablo beklenen kolonları gösteriyor @critical', async () => {
    for (const col of InteractionsPage.COLUMNS) {
      await expect(ix.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
  });

  test('kontroller mevcut (kanal filtresi / arama)', async () => {
    await expect(ix.channelFilter).toBeVisible();
    await expect(ix.searchInput).toBeVisible();
  });

  test('aktif etkileşim yokken boş-durum gösteriliyor', async () => {
    await expect(ix.emptyState).toBeVisible();
  });
});

// ──────────────────────── 4 DİL i18n GUARD'LARI ────────────────────────
test.describe('Canlı Etkileşimler — 4 dil çeviri guard\'ları @i18n @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + kanal filtresi + boş-durum çevrili`, async ({ app }) => {
      const ix = app.interactions;
      await ix.open();
      if (t.endonym) await ix.switchLanguage(t.endonym);

      await expect(ix.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(ix.heading).toHaveText(t.heading);
      await expect(ix.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(ix.channelFilter).toHaveText(t.channelAll);
      await expect(ix.page.getByText(t.empty, { exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: KANAL FİLTRESİ (L1 + L2) ═══════════════
// L3 (filtrelenmiş sonuç doğruluğu): aktif etkileşim olmadığından N/A — canlı veri/staging gerekir.
test.describe('Kontrol: Kanal filtresi @regression', () => {
  test('L1 tıklama OK: menü açılıyor ve kanal seçenekleri görünüyor', async ({ app }) => {
    const ix = app.interactions;
    await ix.open();
    await ix.channelFilter.click();
    for (const opt of InteractionsPage.CHANNELS) {
      await expect(ix.page.getByRole('option', { name: opt, exact: true })).toBeVisible();
    }
    await ix.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: kanal seçince interactions API\'sini channel parametresiyle çağırıyor @critical', async ({ app, page }) => {
    const ix = app.interactions;
    await ix.open();
    const request = page.waitForRequest(
      (r) => r.url().includes(InteractionsPage.API.interactions) && /[?&]channel=voice/i.test(r.url()) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await ix.selectChannel('Voice');
    await request;
  });
});

// ═══════════════ KONTROL: ARAMA (L1) ═══════════════
// L2/L3: aktif etkileşim yokken arama sunucu isteği tetiklemiyor (istemci-taraflı süzme / no-op) →
// doğruluk boş veriyle gözlemlenemez → N/A; canlı etkileşim/staging'de doğrulanacak.
test.describe('Kontrol: Etkileşim arama @regression', () => {
  test('L1 tıklama OK: arama kutusuna yazılabiliyor', async ({ app }) => {
    const ix = app.interactions;
    await ix.open();
    await ix.searchInput.fill('Ahmet');
    await expect(ix.searchInput).toHaveValue('Ahmet');
  });
});

// ═══════════════ SATIR AKSİYONLARI — L1/L2/L3 (staging planı) ═══════════════
// "Actions" kolonu (canlı etkileşimi izleme/araya girme vb.) yalnızca AKTİF etkileşim
// varken görünür. Şu an boş-durum → test edilemez. Canlı etkileşim üretilebilen staging'de
// L1/L2/L3 eklenecek (bkz. AGENTS.md — canlı arama denetim aksiyonları).
test.describe('Canlı Etkileşimler — satır aksiyonları (staging planı) @regression', () => {
  test.fixme('L1/L2/L3: aktif etkileşim satırındaki izleme/araya-girme aksiyonları (staging/canlı veri)', async () => {});
});

// ═══════════════════════ STİL SÖZLEŞMESİ (Option A: L1 → dedicated L2·style) ═══════════════════════
// Sayfa canlı-izleme + test tenant'ında BOŞ (aktif etkileşim yok) → etkileşim derinliği
// yüzeyi yok (tüm @ix-* boyutları naInteraction, resolved-exempt). Yine de dedicated STİL
// sözleşmesi kurulur: @i18n (yukarıda) + @a11y/@layout/@clean/@deeplink/@errorpath. SALT-OKUNUR.

test.describe('Canlı Etkileşimler — erişilebilirlik @a11y', () => {
  test('sayfada ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const ix = app.interactions;
    await ix.open();
    await expectNoSevereA11y(ix.page);
  });
});

test.describe('Canlı Etkileşimler — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/supervisor/interactions');
  });
});

test.describe('Canlı Etkileşimler — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const ix = app.interactions;
    await ix.open();
    await waitForUiToSettle(ix.page);
    diagnostics.assertClean();
  });
});

test.describe('Canlı Etkileşimler — deep-link @deeplink', () => {
  test('/supervisor/interactions doğrudan açılınca yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const ix = app.interactions;
    await page.goto('/supervisor/interactions', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(ix.shell.loginHeading).toBeHidden();
    await expect(ix.heading).toHaveText(InteractionsPage.I18N.en.heading);
  });
});

test.describe('Canlı Etkileşimler — hata-yolu @errorpath', () => {
  test('interactions ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${InteractionsPage.API.interactions}**`, { status: 500 });
    const ix = app.interactions;
    await page.goto('/supervisor/interactions', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(ix.shell.loginHeading).toBeHidden();
    await expect(ix.heading).toHaveText(InteractionsPage.I18N.en.heading);
  });
});
