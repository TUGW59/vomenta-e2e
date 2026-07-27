// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp, waitForUiToSettle } from './helpers.js';

/**
 * BİLİNEN HATA REGRESYON PAKETİ
 * Kaynak: docs/Vomenta-Bug-Raporu (24–27 Tem 2026, canlı panelde birebir gözlem).
 *
 * Her test bulgunun BEKLENEN (doğru) davranışını doğrular; bulgu hâlâ açık olduğu
 * için şu an `test.fail()` ile "beklenen başarısızlık" olarak işaretlidir:
 *   - Bulgu açıkken  → test fail eder ama CI YEŞİL kalır (beklenen başarısızlık).
 *   - Bulgu düzelince → test geçer, Playwright "beklenmedik geçiş" olarak İŞARETLER.
 *     Bu, ekibe "artık `test.fail()`'i kaldır, kalıcı regresyon guard'ına çevir"
 *     sinyalidir.
 *
 * Salt-okunur: hiçbir test veri oluşturmaz/değiştirmez. Veri-değiştiren
 * reproduksiyon (Bulgu 6) ayrı dosyada: known-bugs-invite.mutation.authed.spec.js
 *
 * ⚠ CANLI KALİBRASYON GEREKENLER (ilk gerçek koşudan sonra seçici teyidi):
 *   B5 (Ses kartı durumu) ve B8 (softphone açılır menü) sağlam bir data-testid
 *   ister; frontend ekibinden istenmeli (AGENTS.md seçici politikası).
 *
 * Etiketler: @regression @known-bug
 */

/** Arayüz Türkçe mi? (Bazı bulgular yalnızca TR arayüzde geçerli.) */
async function isTurkishUI(page) {
  const body = await page.locator('body').innerText();
  return /Gösterge Paneli|Gelen Kutusu|Ayarlar|Kanallar|Kuyruklar/.test(body);
}

/** Sayfadaki en büyük yüzde değerini döndürür (yoksa 0). "%200" ve "200%" biçimlerini yakalar. */
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
  // ── B1 · 🔴 KRİTİK · /voice/regulatory ──────────────────────────────────────
  test('B1 · /voice/regulatory · ham i18n anahtarları görünmemeli', async ({ page }) => {
    test.fail(); // Bulgu 1: sayfadaki tüm metinler ham i18n anahtarı olarak basılıyor.
    await gotoApp(page, '/voice/regulatory');
    await waitForUiToSettle(page);
    const keys = [
      'voiceRegulatory.title',
      'voiceRegulatory.subtitle',
      'voiceRegulatory.startKyc',
      'voiceRegulatory.howItWorksTitle',
      'voiceRegulatory.howItWorksDesc',
      'voiceRegulatory.listTitle',
      'voiceRegulatory.emptyTitle',
    ];
    for (const key of keys) {
      expect(await rawKeyVisible(page, key), `ham i18n anahtarı görünüyor: ${key}`).toBe(false);
    }
  });

  // ── B2 · 🟠 YÜKSEK · /campaigns ──────────────────────────────────────────────
  test('B2 · /campaigns · ilerleme yüzdesi 100ü aşmamalı', async ({ page }) => {
    test.fail(); // Bulgu 2: bir kampanya kartı %200 ilerleme gösteriyor (üst sınır aşımı).
    await gotoApp(page, '/campaigns');
    await waitForUiToSettle(page);

    // (a) Metinde görünen hiçbir yüzde 100'ü aşmamalı.
    expect(await maxPercentageOnPage(page), 'sayfada 100ü aşan yüzde var').toBeLessThanOrEqual(100);

    // (b) Erişilebilir ilerleme çubuklarının değeri de 0–100 aralığında olmalı.
    const bars = page.getByRole('progressbar');
    for (let i = 0; i < (await bars.count()); i++) {
      const now = await bars.nth(i).getAttribute('aria-valuenow');
      if (now !== null) {
        expect(Number(now), `progressbar aria-valuenow=${now}`).toBeLessThanOrEqual(100);
      }
    }
  });

  // ── B3 · 🟠 YÜKSEK · /inbox ──────────────────────────────────────────────────
  test('B3 · /inbox · ham i18n anahtarı inbox.noMessagesYet görünmemeli', async ({ page }) => {
    test.fail(); // Bulgu 3: konuşma önizlemesi yerine ham anahtar basılıyor.
    await gotoApp(page, '/inbox');
    await expect(page.getByRole('heading', { name: 'Soft Phone', exact: true })).toBeVisible({
      timeout: 30000,
    });
    await waitForUiToSettle(page);
    expect(await rawKeyVisible(page, 'inbox.noMessagesYet'), 'ham anahtar görünüyor').toBe(false);
  });

  // ── B4 · 🟠 YÜKSEK · /settings › Modüller ────────────────────────────────────
  test('B4 · /settings · "Yönet Modüller" kök sayfaya atmamalı', async ({ page }) => {
    test.fail(); // Bulgu 4: buton (href=/settings/billing/marketplace) tıklanınca "/" (dashboard) açıyor.
    await gotoApp(page, '/settings');
    await page.getByRole('tab', { name: /Modules|Modüller/i }).click();

    const manage = page
      .getByRole('link', { name: /Manage Modules|Yönet Modüller/i })
      .or(page.getByRole('button', { name: /Manage Modules|Yönet Modüller/i }))
      .first();
    await expect(manage).toBeVisible();
    await manage.click();

    // Beklenen: modül yönetimi (marketplace) açılır; kök route'a düşmez.
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 10000, intervals: [400, 800, 1500] })
      .not.toBe('/');
  });

  // ── B5 · 🟡 ORTA · /channels ─────────────────────────────────────────────────
  // ⚠ KALİBRASYON: Ses kartı için data-testid ideal; şimdilik başlık-komşuluğu ile.
  test('B5 · /channels · Ses kartı yanlışlıkla "Yapılandırılmadı" göstermemeli', async ({ page }) => {
    test.fail(); // Bulgu 5: numara/IVR/kuyruk kuruluyken kart "Yapılandırılmadı" diyor.
    await gotoApp(page, '/channels');
    await waitForUiToSettle(page);

    const voiceHeading = page.getByRole('heading', { name: /^(Voice|Ses)$/i }).first();
    await expect(voiceHeading).toBeVisible();
    // Başlığın bulunduğu kart bileşeni (birkaç seviye üst) "not configured" rozetini içermemeli.
    const voiceCard = voiceHeading.locator('xpath=ancestor::*[self::article or self::li or self::section][1]');
    await expect(voiceCard).not.toContainText(/Not configured|Yapılandırılmadı/i);
  });

  // ── B6 · 🟡 ORTA · /settings › Kullanıcılar ──────────────────────────────────
  test('B6 · /settings · davet satırları ayırt edilebilir olmalı (placeholder "Invited User" değil)', async ({
    page,
  }) => {
    await gotoApp(page, '/settings');
    await page.getByRole('tab', { name: /Users|Kullanıcılar/i }).click();
    await waitForUiToSettle(page);

    const invitedRows = page.getByRole('row').filter({ hasText: 'Invited User' });
    const count = await invitedRows.count();
    test.skip(count === 0, 'Bekleyen "Invited User" satırı yok; bulgu reproduce edilemiyor.');

    test.fail(); // Bulgu 6: davetler "Invited User" + boş e-posta ile ayırt edilemez görünüyor.
    // Beklenen: en azından davet e-postası + "Beklemede" durumu; placeholder satır olmamalı.
    expect(count, 'ayırt edilemeyen "Invited User" placeholder satır sayısı').toBe(0);
  });

  // ── B7 · 🟡 ORTA · /settings › Modüller ──────────────────────────────────────
  test('B7 · /settings · Modüller açıklaması iki kez render edilmemeli', async ({ page }) => {
    test.fail(); // Bulgu 7: modül açıklama paragrafı ekranda iki kez üst üste basılıyor.
    await gotoApp(page, '/settings');
    await page.getByRole('tab', { name: /Modules|Modüller/i }).click();
    await waitForUiToSettle(page);

    const paragraphs = (await page.locator('main p').allInnerTexts())
      .map((t) => t.trim())
      .filter((t) => t.length > 20);
    const seen = new Set();
    const duplicate = paragraphs.find((t) => (seen.has(t) ? true : (seen.add(t), false)));
    expect(duplicate ?? null, `açıklama iki kez görünüyor: "${duplicate ?? ''}"`).toBeNull();
  });

  // ── B8 · 🟠 YÜKSEK · Softphone widget (her sayfa) ────────────────────────────
  // ⚠ KALİBRASYON: softphone açıcı için data-testid ideal. Header presence menüsü
  //   (header.authed.spec.js) çalışıyor; bu bulgu AYRI softphone widget'ıyla ilgili.
  test('B8 · Softphone · müsaitlik açılır menüsü GÖRSEL olarak açılmalı', async ({ page }) => {
    test.fail(); // Bulgu 8: menü DOM'da açılıyor ama görsel katman render edilmiyor.
    await gotoApp(page, '/inbox');
    const softphone = page.getByRole('heading', { name: 'Soft Phone', exact: true });
    await expect(softphone).toBeVisible();

    // Softphone içindeki müsaitlik açıcısı (● Available/Müsait ⌄). Header'daki değil, en yakın softphone kontrolü.
    const trigger = page
      .getByRole('button', {
        name: /(Available|Müsait|Away|Uzakta|Busy|Meşgul|On Break|Molada|Offline|Çevrimdışı)/i,
      })
      .last();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const menu = page.getByRole('menu').or(page.getByRole('listbox')).first();
    await expect(menu).toBeVisible();

    // Görsel olarak gerçekten görünür mü: opacity>0, boyutu var ve viewport içinde.
    const geom = await menu.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { opacity: parseFloat(getComputedStyle(el).opacity), w: r.width, h: r.height, x: r.x, y: r.y };
    });
    const vp = page.viewportSize() ?? { width: 1280, height: 720 };
    expect(geom.opacity, 'menü opacity 0 (görünmüyor)').toBeGreaterThan(0);
    expect(geom.w > 0 && geom.h > 0, 'menünün görünür boyutu yok').toBeTruthy();
    expect(
      geom.x < vp.width && geom.y < vp.height && geom.x + geom.w > 0 && geom.y + geom.h > 0,
      'menü viewport dışında konumlanmış'
    ).toBeTruthy();
  });

  // ── B9 · 🟡 ORTA · /channels/email ───────────────────────────────────────────
  test('B9 · /channels/email · varsayılan imza ham i18n anahtarı göstermemeli', async ({ page }) => {
    test.fail(); // Bulgu 9: imza alanı channels.emailPage.defaultSignatureText ham anahtarını içeriyor.
    await gotoApp(page, '/channels/email');
    const settingsBtn = page.getByRole('button', { name: /Email Settings|E-posta Ayarları/i }).first();
    if (await settingsBtn.count()) {
      await settingsBtn.click().catch(() => {});
    }
    await waitForUiToSettle(page);
    expect(
      await rawKeyVisible(page, 'channels.emailPage.defaultSignatureText'),
      'ham anahtar görünüyor'
    ).toBe(false);
  });

  // ── B10 · 🟡 ORTA · /voice/regulatory ────────────────────────────────────────
  test('B10 · /voice/regulatory · Voice sekme çubuğu görünmeli (bölüm düzeni)', async ({ page }) => {
    test.fail(); // Bulgu 10: sayfa Voice bölüm düzeni yerine dashboard düzeniyle açılıyor; sekme çubuğu kayboluyor.
    await gotoApp(page, '/voice/regulatory');
    await waitForUiToSettle(page);
    // Diğer Voice sayfalarındaki alt-navigasyon burada da görünmeli.
    const queues = page
      .getByRole('button', { name: /Queues|Kuyruklar/i })
      .or(page.getByRole('link', { name: /Queues|Kuyruklar/i }))
      .first();
    await expect(queues, 'Voice sekme çubuğu (Kuyruklar) /voice/regulatory sayfasında yok').toBeVisible();
  });

  // ── B11 · 🟡 ORTA · /voice/voicemail ─────────────────────────────────────────
  test('B11 · /voice/voicemail · İşlemler butonlarının erişilebilir ismi olmalı', async ({ page }) => {
    await gotoApp(page, '/voice/voicemail');
    await waitForUiToSettle(page);

    const unlabeled = await page.evaluate(() => {
      const scope = document.querySelector('table, [role="table"], main');
      if (!scope) return -1;
      const buttons = [...scope.querySelectorAll('button, [role="button"]')];
      if (buttons.length === 0) return -1; // veri yok
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

    test.fail(); // Bulgu 11: İşlemler sütunundaki ikon-butonlar etiketsiz (tooltip/label yok).
    expect(unlabeled, 'erişilebilir ismi olmayan işlem butonu sayısı').toBe(0);
  });

  // ── B12 · 🟡 ORTA · /analytics (yalnızca TR arayüz) ──────────────────────────
  test('B12 · /analytics · TR arayüzde İngilizce/iç metin sızmamalı', async ({ page }) => {
    await gotoApp(page, '/analytics');
    await waitForUiToSettle(page);
    test.skip(!(await isTurkishUI(page)), 'Arayüz Türkçe değil; yerelleştirme sızıntısı yalnızca TR arayüzde geçerli.');

    test.fail(); // Bulgu 12: TR arayüzde alt bölüm İngilizce; ayrıca iç altyapı adı "ClickHouse" sızıyor.
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

  // ── B13 · 🔵 DÜŞÜK · /ai (yalnızca TR arayüz) ────────────────────────────────
  test('B13 · /ai · sekme etiketinde boşluk eksik olmamalı ("Yapay ZekaTemsilciler")', async ({ page }) => {
    await gotoApp(page, '/ai');
    await waitForUiToSettle(page);
    test.skip(!(await isTurkishUI(page)), 'Arayüz Türkçe değil; bitişik yazım hatası yalnızca TR arayüzde geçerli.');

    test.fail(); // Bulgu 13: "Yapay Zeka" ile "Temsilciler" bitişik yazılmış.
    const text = await page.locator('body').innerText();
    expect(text, 'sekme etiketinde boşluk eksik: "ZekaTemsilciler"').not.toContain('ZekaTemsilciler');
  });

  // ── B14 · 🟡 ORTA · /voice/dids › Bekleyen Talepler ──────────────────────────
  test('B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı', async ({ page }) => {
    await gotoApp(page, '/voice/dids');
    await waitForUiToSettle(page);

    const rejected = page.getByText(/Rejection:/).first();
    const hasRejected = (await rejected.count()) > 0;
    test.skip(!hasRejected, 'Reddedilmiş talep yok; bulgu reproduce edilemiyor.');

    test.fail(); // Bulgu 14: red nedeni hücrede kırpılıyor, tooltip/genişletme yok → tam neden okunamıyor.
    // Beklenen: kırpılan hücre tam metni bir title/tooltip ile sunar.
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

  // ── B15 · 🟡 ORTA · Sol menü üst-başlıkları ──────────────────────────────────
  // Not: navigation.authed.spec.js grup başlıklarının "yalnız alt-menü açtığını" MEVCUT
  //   davranış olarak belgeliyor. Bu test, bug raporunun BEKLENTİSİNİ (üst-başlık bölüm
  //   köküne de gitmeli) kodlar; bir UX kararı olduğu için düşük risklidir.
  test('B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli', async ({ page }) => {
    test.fail(); // Bulgu 15: /ai/voice'dayken "Yapay Zeka/AI" üst-başlığı yalnız accordion açıyor; URL değişmiyor.
    await gotoApp(page, '/ai/voice');
    const header = page
      .getByRole('button', { name: /^(AI|Yapay Zeka)$/i })
      .or(page.getByRole('link', { name: /^(AI|Yapay Zeka)$/i }))
      .first();
    await expect(header).toBeVisible();
    await header.click();
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 8000, intervals: [400, 800, 1500] })
      .toBe('/ai');
  });
});
