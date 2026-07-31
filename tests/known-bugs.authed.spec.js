// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp, knownBugGuard, waitForUiToSettle } from './helpers.js';

/**
 * BİLİNEN HATA REGRESYON PAKETİ
 * Kaynak: docs/Vomenta-Bug-Raporu (24–27 Tem 2026, canlı panelde birebir gözlem).
 * Canlı doğrulama: 28 Tem 2026 (bu paket app.vomenta.com'a karşı koşuldu).
 *
 * `test.fail()` = bulgu HÂLÂ AÇIK. Test doğru davranışı doğrular; bug açıkken
 * "beklenen başarısızlık" (CI yeşil kalır), bug düzelince "beklenmedik geçiş"
 * olarak işaretlenir → o zaman `test.fail()` kaldırılıp kalıcı guard'a çevrilir.
 *
 * `test.fail()` OLMAYAN testler = bulgu artık reproduce olmuyor (düzelmiş görünüyor);
 * doğru davranışı koruyan kalıcı regresyon guard'ı olarak tutuluyor:
 *   - B7 (çift açıklama), B8 (softphone menüsü) — 28 Tem'de düzgün çalışıyordu.
 *
 * `test.fixme` = güvenilir test için frontend'den data-testid bekliyor:
 *   - B5 (/channels Voice kartı) — sayfa <main> kullanmıyor, kart için stabil
 *     role/testid yok; kırılgan/yanlış-sinyal test yerine bilinçli beklemede.
 *
 * Salt-okunur. Veri-değiştiren reproduksiyon (Bulgu 6): known-bugs-invite.mutation.authed.spec.js
 * Etiketler: @regression @known-bug
 */

/** Nav (sol menü) hariç içerik metni — sol menüdeki tekrar eden etiketlerin testi kirletmesini önler. */
async function contentText(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('nav');
    const navText = nav ? nav.innerText : '';
    let body = document.body.innerText || '';
    if (navText) body = body.split(navText).join(' ');
    return body;
  });
}

/** İçerik (nav dışı) render olana kadar bekler — canlı SPA'da geç yüklenen içeriği erken kontrol etmeyi önler. */
async function waitContentLoaded(page, min = 30) {
  await expect
    .poll(async () => (await contentText(page)).length, {
      timeout: 20000,
      intervals: [300, 600, 1000, 1500, 2500],
    })
    .toBeGreaterThan(min);
}

/** Radix sekmesine güvenli tıklama (tıklama yutulmasına karşı seçili olana kadar dener). */
async function selectTab(page, name) {
  const tab = page.getByRole('tab', { name });
  await expect(async () => {
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

/** Arayüz Türkçe mi? (Bazı bulgular yalnızca TR arayüzde geçerli.) */
async function isTurkishUI(page) {
  const body = await page.locator('body').innerText();
  return /Gösterge Paneli|Gelen Kutusu|Ayarlar|Kanallar|Kuyruklar/.test(body);
}

/** Sayfadaki en büyük yüzde değeri (yoksa 0). "%200" ve "200%" biçimlerini yakalar. */
async function maxPercentageOnPage(page) {
  return page.evaluate(() => {
    const text = document.body.innerText || '';
    const nums = [...text.matchAll(/%\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*%/g)].map((m) =>
      parseFloat((m[1] ?? m[2]).replace(',', '.'))
    );
    return nums.length ? Math.max(...nums) : 0;
  });
}

/** Ham i18n anahtarı sayfada (metin, input değeri veya contenteditable) görünüyor mu? */
async function rawKeyVisible(page, key) {
  return page.evaluate((k) => {
    if ((document.body.innerText || '').includes(k)) return true;
    for (const el of document.querySelectorAll('input, textarea')) {
      if ((/** @type {HTMLInputElement} */ (el).value || '').includes(k)) return true;
    }
    for (const el of document.querySelectorAll('[contenteditable]')) {
      if ((el.textContent || '').includes(k)) return true;
    }
    return false;
  }, key);
}

test.describe('Vomenta - Bilinen hatalar (regresyon) @regression @known-bug', () => {
  // ── B1 · 🔴 KRİTİK · /voice/regulatory · (28 Tem: AÇIK — 9 ham anahtar) ──────
  test('B1 · /voice/regulatory · ham i18n anahtarları görünmemeli', async ({ page }) => {
    knownBugGuard(test, 'B1');
    await gotoApp(page, '/voice/regulatory');
    // KYC içeriği yüklendi mi: "KYC" içeren aksiyon butonu her iki durumda da (bozuk: "voiceRegulatory.startKyc", düzgün: "Start KYC") vardır.
    await expect(page.getByRole('button', { name: /KYC/i }).first()).toBeVisible({ timeout: 20000 });
    const text = await page.locator('body').innerText();
    for (const key of [
      'voiceRegulatory.title',
      'voiceRegulatory.subtitle',
      'voiceRegulatory.startKyc',
      'voiceRegulatory.howItWorksTitle',
      'voiceRegulatory.listTitle',
      'voiceRegulatory.emptyTitle',
    ]) {
      expect(text, `ham i18n anahtarı görünüyor: ${key}`).not.toContain(key);
    }
  });

  // ── B2 · 🟠 YÜKSEK · /campaigns · (28 Tem: AÇIK — %200 gözlendi) ─────────────
  test('B2 · /campaigns · ilerleme yüzdesi 100ü aşmamalı', async ({ page }) => {
    knownBugGuard(test, 'B2');
    await gotoApp(page, '/campaigns');
    // Kampanya kartları (yüzde metni) render olana kadar bekle.
    await expect
      .poll(async () => /%\s*\d+|\d+\s*%/.test(await contentText(page)), { timeout: 20000 })
      .toBe(true);
    expect(await maxPercentageOnPage(page), 'sayfada 100ü aşan yüzde var').toBeLessThanOrEqual(100);
    const bars = page.getByRole('progressbar');
    for (let i = 0; i < (await bars.count()); i++) {
      const now = await bars.nth(i).getAttribute('aria-valuenow');
      if (now !== null) expect(Number(now), `progressbar aria-valuenow=${now}`).toBeLessThanOrEqual(100);
    }
  });

  // ── B3 · 🟠 YÜKSEK · /inbox · (28 Tem: AÇIK) ────────────────────────────────
  test('B3 · /inbox · ham i18n anahtarı inbox.noMessagesYet görünmemeli', async ({ page }) => {
    knownBugGuard(test, 'B3');
    await gotoApp(page, '/inbox');
    await expect(page.getByRole('heading', { name: 'Soft Phone', exact: true })).toBeVisible({
      timeout: 30000,
    });
    await waitContentLoaded(page, 50);
    expect(await contentText(page), 'ham anahtar görünüyor').not.toContain('inbox.noMessagesYet');
  });

  // ── B4 · 🟠 YÜKSEK · /settings › Modüller · (28 Tem: AÇIK — tıklama → "/") ───
  test('B4 · /settings · "Manage Modules" kök sayfaya atmamalı', async ({ page }) => {
    knownBugGuard(test, 'B4');
    await gotoApp(page, '/settings');
    await selectTab(page, /Modules|Modüller/i);
    const manage = page
      .getByRole('link', { name: /Manage Modules|Yönet Modüller/i })
      .or(page.getByRole('button', { name: /Manage Modules|Yönet Modüller/i }))
      .first();
    await expect(manage).toBeVisible();
    await manage.click();
    // bug akışı: /settings → (geçici) /settings/billing/marketplace → "/" (fallback).
    // Kök'e ("/") yönlenme gözlendiğinde bounced=true. waitForURL ara-URL'ye kilitlenmez
    // → paralel koşumda da deterministik (ara-URL'ye kilitlenme yarışı elenir).
    const bounced = await page
      .waitForURL((u) => new URL(u).pathname === '/', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    expect(bounced, 'buton kök route (/) sayfasına düşüyor').toBe(false);
  });

  // ── B5 · 🟡 ORTA · /channels · Ses kartı durumu ─────────────────────────────
  test('B5 · /channels · Ses kartı yanlışlıkla "Yapılandırılmadı" göstermemeli', async ({ page }) => {
    test.fixme(
      true,
      '/channels <main> kullanmıyor ve Voice kartı için stabil role/testid yok. Frontend data-testid (ör. data-testid="channel-card-voice") ekleyince açılacak.'
    );
    await gotoApp(page, '/channels');
    // TODO(testid): const voiceCard = page.getByTestId('channel-card-voice');
    // await expect(voiceCard).not.toContainText(/Not configured|Yapılandırılmadı/i);
  });

  // ── B6 · 🟡 ORTA · /settings › Kullanıcılar · (veri gerektirir) ──────────────
  test('B6 · /settings · davet satırları ayırt edilebilir olmalı (placeholder "Invited User" değil)', async ({
    page,
  }) => {
    await gotoApp(page, '/settings');
    await selectTab(page, /Users|Kullanıcılar/i);
    await waitContentLoaded(page);
    const invitedRows = page.getByRole('row').filter({ hasText: 'Invited User' });
    const count = await invitedRows.count();
    test.skip(count === 0, 'Bekleyen "Invited User" satırı yok; bulgu reproduce edilemiyor.');

    knownBugGuard(test, 'B6');
    expect(count, 'ayırt edilemeyen "Invited User" placeholder satır sayısı').toBe(0);
  });

  // ── B7 · 🟡 ORTA · /settings › Modüller · (30 Tem: YENİDEN AÇIK — div+p tekrarı) ──
  // Açıklama iki görünür öğede (bir <div>, bir <p>) tekrar ediyor. Eski guard yalnız
  // `main p` karşılaştırdığı için div+p tekrarını kaçırıyordu (false-green). Guard artık
  // panelin TÜM görünür leaf öğelerinde tekrar arar → gerçek çift-render'ı yakalar.
  test('B7 · /settings · Modüller açıklaması iki kez render edilmemeli', async ({ page }) => {
    knownBugGuard(test, 'B7');
    await gotoApp(page, '/settings');
    await selectTab(page, /Modules|Modüller/i);
    await waitContentLoaded(page);
    const duplicate = await page.evaluate(() => {
      const scope =
        document.querySelector('[role="tabpanel"]:not([hidden])') || document.querySelector('main');
      if (!scope) return null;
      /** @type {Map<string, number>} */
      const seen = new Map();
      for (const el of scope.querySelectorAll('*')) {
        if (el.children.length) continue; // yalnız leaf öğeler
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const visible =
          r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
        if (!visible) continue;
        const t = (el.textContent || '').trim();
        if (t.length <= 20) continue; // veri/isim değil, açıklama metni ölçeğinde
        seen.set(t, (seen.get(t) || 0) + 1);
      }
      for (const [t, n] of seen) if (n > 1) return t;
      return null;
    });
    expect(duplicate, `açıklama görünürde iki kez render ediliyor: "${duplicate ?? ''}"`).toBeNull();
  });

  // ── B8 · 🟠 YÜKSEK · Softphone · (28 Tem: DÜZELMİŞ — kalıcı guard) ───────────
  test('B8 · Softphone · müsaitlik açılır menüsü GÖRSEL olarak açılmalı', async ({ page }) => {
    await gotoApp(page, '/inbox');
    await expect(page.getByRole('heading', { name: 'Soft Phone', exact: true })).toBeVisible();
    const trigger = page
      .getByRole('button', {
        name: /(Available|Müsait|Away|Uzakta|Busy|Meşgul|On Break|Molada|Offline|Çevrimdışı)/i,
      })
      .last();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const menu = page.getByRole('menu').or(page.getByRole('listbox')).first();
    await expect(menu).toBeVisible();
    const geom = await menu.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { opacity: parseFloat(getComputedStyle(el).opacity), w: r.width, h: r.height };
    });
    expect(geom.opacity, 'menü opacity 0 (görünmüyor)').toBeGreaterThan(0);
    expect(geom.w > 0 && geom.h > 0, 'menünün görünür boyutu yok').toBeTruthy();
  });

  // ── B9 · 🟡 ORTA · /channels/email · (28 Tem: AÇIK — ham anahtar input'ta) ───
  test('B9 · /channels/email · varsayılan imza ham i18n anahtarı göstermemeli', async ({ page }) => {
    knownBugGuard(test, 'B9');
    await gotoApp(page, '/channels/email');
    // İmza alanı (textarea/contenteditable) render olana kadar bekle.
    await expect(page.locator('textarea, [contenteditable]').first()).toBeVisible({ timeout: 20000 });
    expect(
      await rawKeyVisible(page, 'channels.emailPage.defaultSignatureText'),
      'ham anahtar görünüyor'
    ).toBe(false);
  });

  // ── B10 · 🟡 ORTA · /voice/regulatory · (28 Tem: AÇIK — üst sekme çubuğu yok) ─
  test('B10 · /voice/regulatory · Voice sekme çubuğu görünmeli (bölüm düzeni)', async ({ page }) => {
    knownBugGuard(test, 'B10');
    await gotoApp(page, '/voice/regulatory');
    await waitContentLoaded(page);
    // Çalışan Voice sayfalarında üst sekme çubuğu içerik alanında "Live Calls" başlığını
    // tekrar eder (sol menüye ek olarak). Bu sayfada bölüm düzeni kaybolduğu için yok.
    expect(
      await contentText(page),
      'Voice üst sekme çubuğu (Live Calls) içerik alanında yok → bölüm düzeni kayıp'
    ).toContain('Live Calls');
  });

  // ── B11 · 🟡 ORTA · /voice/voicemail · (veri gerektirir) ────────────────────
  test('B11 · /voice/voicemail · İşlemler butonlarının erişilebilir ismi olmalı', async ({ page }) => {
    await gotoApp(page, '/voice/voicemail');
    await waitForUiToSettle(page);
    const unlabeled = await page.evaluate(() => {
      const scope = document.querySelector('table, [role="table"], main');
      if (!scope) return -1;
      const buttons = [...scope.querySelectorAll('button, [role="button"]')];
      if (buttons.length === 0) return -1;
      return buttons.filter((b) => {
        const name = (
          b.getAttribute('aria-label') ||
          b.getAttribute('title') ||
          b.textContent ||
          ''
        ).trim();
        return name.length === 0;
      }).length;
    });
    test.skip(unlabeled === -1, 'Sesli mesaj / işlem butonu yok; bulgu reproduce edilemiyor.');

    knownBugGuard(test, 'B11');
    expect(unlabeled, 'erişilebilir ismi olmayan işlem butonu sayısı').toBe(0);
  });

  // ── B12 · 🟡 ORTA · /analytics · (yalnızca TR arayüz) ───────────────────────
  test('B12 · /analytics · TR arayüzde İngilizce/iç metin sızmamalı', async ({ page }) => {
    await gotoApp(page, '/analytics');
    await waitContentLoaded(page);
    test.skip(!(await isTurkishUI(page)), 'Arayüz Türkçe değil; yerelleştirme sızıntısı yalnızca TR arayüzde geçerli.');

    knownBugGuard(test, 'B12');
    const text = await page.locator('main').innerText();
    for (const leak of [
      'Deep analytics',
      'Call abandonment',
      'Abandonment rate over time',
      'Calls by hour of day',
      'Agent utilization',
      'ClickHouse',
    ]) {
      expect(text, `TR arayüzde çevrilmemiş/iç metin sızıyor: "${leak}"`).not.toContain(leak);
    }
  });

  // ── B13 · 🔵 DÜŞÜK · /ai · (yalnızca TR arayüz) ─────────────────────────────
  test('B13 · /ai · sekme etiketinde boşluk eksik olmamalı ("Yapay ZekaTemsilciler")', async ({ page }) => {
    await gotoApp(page, '/ai');
    await waitContentLoaded(page);
    test.skip(!(await isTurkishUI(page)), 'Arayüz Türkçe değil; bitişik yazım hatası yalnızca TR arayüzde geçerli.');

    knownBugGuard(test, 'B13');
    expect(await page.locator('body').innerText(), 'sekme etiketinde boşluk eksik: "ZekaTemsilciler"').not.toContain(
      'ZekaTemsilciler'
    );
  });

  // ── AI-PROMPTS-CONSOLE · 🟡 ORTA · /ai/prompts · (konsol ICU hatası; veri/tenant'a bağlı) ──
  // Sayfa yüklemede next-intl "INVALID_MESSAGE: MALFORMED_ARGUMENT" hatası basıyor
  // (ai/prompts/page chunk) — kişisel tenant'ta canlı gözlendi (31 Tem 2026). Ancak
  // hata prompt/şablon VERİSİNE bağlı; CI test kimliğinin tenant'ında reproduce
  // OLMAYABİLİR → B14 deseni: reproduce edilemezse test.skip (beklenmedik-geçiş yerine
  // atlanır). Reproduce olunca knownBugGuard ile beklenen-başarısızlık doğrulanır.
  test('AI-PROMPTS-CONSOLE · /ai/prompts · konsolda MALFORMED_ARGUMENT (ICU) hatası olmamalı', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await gotoApp(page, '/ai/prompts?lang=en');
    await waitContentLoaded(page);
    await waitForUiToSettle(page);

    const malformed = errors.filter((t) => /MALFORMED_ARGUMENT|INVALID_MESSAGE/.test(t));
    test.skip(
      malformed.length === 0,
      'Konsol ICU hatası bu oturum/tenant verisinde reproduce olmuyor (kişisel tenant gözlemi).'
    );
    knownBugGuard(test, 'AI-PROMPTS-CONSOLE');
    expect(malformed, `konsolda ICU/intl hatası: ${malformed.slice(0, 2).join(' | ')}`).toEqual([]);
  });

  // ── B14 · 🟡 ORTA · /voice/dids › Bekleyen Talepler · (veri gerektirir) ──────
  test('B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı', async ({ page }) => {
    await gotoApp(page, '/voice/dids');
    await waitContentLoaded(page);
    const rejected = page.getByText(/Rejection:/).first();
    test.skip((await rejected.count()) === 0, 'Reddedilmiş talep yok; bulgu reproduce edilemiyor.');

    knownBugGuard(test, 'B14');
    const hasTooltip = await rejected.evaluate((el) => {
      let node = /** @type {Element|null} */ (el);
      while (node) {
        if (node.getAttribute && node.getAttribute('title')) return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(hasTooltip, 'red nedeni tooltip/title ile tam okunamıyor').toBe(true);
  });

  // ── B15 · 🟡 ORTA · Sol menü üst-başlığı · (28 Tem: AÇIK — URL değişmiyor) ───
  // Not: navigation.authed.spec.js grup başlıklarının "yalnız alt-menü açtığını" MEVCUT
  //   davranış olarak belgeliyor. Bu test bug raporunun BEKLENTİSİNİ kodlar (bir UX kararı).
  test('B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli', async ({ page }) => {
    knownBugGuard(test, 'B15');
    await gotoApp(page, '/ai/voice');
    const header = page
      .getByRole('link', { name: /^(AI|Yapay Zeka)$/i })
      .or(page.getByRole('button', { name: /^(AI|Yapay Zeka)$/i }))
      .first();
    await expect(header).toBeVisible();
    await header.click();
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 8000, intervals: [400, 800, 1500] })
      .toBe('/ai');
  });

  // ── SETTINGS-BILLING-REDIRECT · 🟠 YÜKSEK · /settings/billing · (30 Tem: AÇIK) ──
  // Hesap billing/modül iznine sahip değil → korunan uçlar (billing/usage, billing/invoices)
  // 403 → sayfa ~1.5sn sonra "/"ye (Dashboard) düşüyor. B4 (marketplace) ile aynı sınıf.
  test('SETTINGS-BILLING-REDIRECT · /settings/billing deep-link kök sayfaya atmamalı', async ({ page }) => {
    knownBugGuard(test, 'SETTINGS-BILLING-REDIRECT');
    await gotoApp(page, '/settings/billing');
    // Kök route'a ("/") yönlenme GÖZLENDİĞİNDE bounced=true. Düzelirse hiç "/"ye
    // gitmez → waitForURL timeout → bounced=false (deterministik, zamanlama-yarışsız).
    const bounced = await page
      .waitForURL((u) => new URL(u).pathname === '/', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    expect(bounced, '/settings/billing deep-link kök route (/) sayfasına düşüyor').toBe(false);
  });

  // ── SETTINGS-BILLING-CHANGEPLAN · 🟠 YÜKSEK · /settings › Billing & Usage · (30 Tem: AÇIK) ──
  test('SETTINGS-BILLING-CHANGEPLAN · Ayarlar "Change plan" kök sayfaya atmamalı', async ({ page }) => {
    knownBugGuard(test, 'SETTINGS-BILLING-CHANGEPLAN');
    await gotoApp(page, '/settings');
    await selectTab(page, /Billing & Usage|Fatura|Kullanım/i);
    const link = page.getByRole('link', { name: /Change plan|Plan.*değiştir/i }).first();
    await expect(link).toBeVisible();
    await link.click();
    // "Change plan" → /settings/billing → "/" (fallback). Kök'e düşerse bounced=true.
    const bounced = await page
      .waitForURL((u) => new URL(u).pathname === '/', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    expect(bounced, '"Change plan" kök route (/) sayfasına düşüyor').toBe(false);
  });

  // ── SETTINGS-BILLING-HISTORY · 🟠 YÜKSEK · /settings › Billing & Usage · (30 Tem: AÇIK) ──
  test('SETTINGS-BILLING-HISTORY · Ayarlar "Billing history" kök sayfaya atmamalı', async ({ page }) => {
    knownBugGuard(test, 'SETTINGS-BILLING-HISTORY');
    await gotoApp(page, '/settings');
    await selectTab(page, /Billing & Usage|Fatura|Kullanım/i);
    const link = page.getByRole('link', { name: /Billing history|Fatura geçmişi/i }).first();
    await expect(link).toBeVisible();
    await link.click();
    const bounced = await page
      .waitForURL((u) => new URL(u).pathname === '/', { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    expect(bounced, '"Billing history" kök route (/) sayfasına düşüyor').toBe(false);
  });
});
