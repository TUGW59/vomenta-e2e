// @ts-check
import { test, expect } from './fixtures/test.js';
import { CampaignsOutboundPage } from './pages/CampaignsOutboundPage.js';

/**
 * KAMPANYALAR → GİDEN (`/campaigns/outbound`)
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com (4 dil + network + DOM inspection).
 *
 * ┌─ HER İNTERAKTİF KONTROL İÇİN 3 KATMAN ─────────────────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol görünür/etkin, tıklanınca UI gözlemlenebilir tepki │
 * │ L2 — ARKA PLAN OK: doğru uca network isteği (method+endpoint+2xx).           │
 * │                    Mutation `page.route` ile yakalanır (PROD'A YAZILMAZ).    │
 * │ L3 — GÖREV OK   : kontrolün amacı gerçekten gerçekleşiyor (liste filtrelenir,│
 * │                    gezinme olur, detay açılır …). Prod'a yazmadan doğrulan-  │
 * │                    amayan L3 (kalıcı mutation) N/A → mutasyon spec dosyasına │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Bilinen hatalar (test.fail = bulgu HÂLÂ AÇIK, düzelince "beklenmedik geçiş"):
 *   BULGU 1 — liste 10'da kapanıyor, hasNextPage:true ama pager/sonsuz-kaydırma yok.
 *   BULGU 2 — satır işlem ikonları (göz/başlat/sil) erişilebilir isimsiz (a11y).
 *
 * Veri değiştiren uçtan-uca akışlar (oluştur/sil/başlat): tests/campaigns-outbound.mutation.authed.spec.js
 */

const I18N = CampaignsOutboundPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Giden Kampanyalar — yapı', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => {
    oc = app.campaignsOutbound;
    await oc.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(oc.heading).toHaveText(I18N.en.heading);
    await expect(oc.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('dört özet kartı listeleniyor @smoke', async () => {
    for (const label of I18N.en.cards) {
      await expect(oc.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('arama, tür filtresi ve durum sekmeleri mevcut @smoke', async () => {
    await expect(oc.searchInput).toBeVisible();
    await expect(oc.typeFilter).toHaveText(I18N.en.filterAll);
    await expect(oc.tab(I18N.en.tabs.all)).toBeVisible();
    await expect(oc.tab(I18N.en.tabs.running)).toBeVisible();
    await expect(oc.tab(I18N.en.tabs.paused)).toBeVisible();
  });

  test('tablo başlıkları doğru sırada @smoke @critical', async () => {
    for (const header of I18N.en.headers) {
      await expect(oc.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
    }
  });

  test('New Campaign düğmesi görünür ve etkin @smoke', async () => {
    await expect(oc.newCampaign).toBeVisible();
    await expect(oc.newCampaign).toBeEnabled();
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI ────────────────────────
// i18n bu sayfada sağlam (sızıntı yok) → yeşil guard'lar. Bir çeviri bozulursa
// hangi etiketin regrese olduğu net görünür.
test.describe('Giden Kampanyalar — 4 dil çeviri guard\'ları @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili`, async ({ app }) => {
      const oc = app.campaignsOutbound;
      await oc.open();
      if (t.endonym) await oc.shell.switchLanguage(t.endonym);

      await expect(oc.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(oc.page.locator('html')).toHaveAttribute('lang', code);
      await expect(oc.heading).toHaveText(t.heading);
      await expect(oc.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      for (const label of t.cards) {
        await expect(oc.page.getByText(label, { exact: true }).first()).toBeVisible();
      }
      await expect(oc.typeFilter).toHaveText(t.filterAll);
      await expect(oc.tab(t.tabs.all)).toBeVisible();
      await expect(oc.tab(t.tabs.running)).toBeVisible();
      await expect(oc.tab(t.tabs.paused)).toBeVisible();
      for (const header of t.headers) {
        await expect(oc.table.getByRole('columnheader', { name: header, exact: true })).toBeVisible();
      }
      await expect(oc.newCampaignButton(t.newCampaign)).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: ARAMA (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Arama @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  test('L1 tıklama OK: metin yazılabiliyor', async () => {
    await oc.searchInput.fill('test');
    await expect(oc.searchInput).toHaveValue('test');
  });

  test('L2 arka plan OK: arama filtresiyle liste ucunu çağırıyor @critical', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => r.url().includes(CampaignsOutboundPage.API.list) && r.url().includes('search') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await oc.searchInput.fill('test camp');
    await request; // tetiklenmezse timeout → kırılır
  });

  test('L3 görev OK: eşleşmeyen arama boş-durumu gösteriyor (liste gerçekten filtreleniyor)', async () => {
    await oc.searchInput.fill('zzzz-eslesmeyen-kampanya-xyz');
    await expect(oc.page.getByText(/No campaigns match your filters/i)).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════ KONTROL: TÜR FİLTRESİ (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Tür filtresi @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  test('L1 tıklama OK: seçilen değer trigger\'da güncelleniyor', async () => {
    await oc.selectType('Voice');
    await expect(oc.typeFilter).toHaveText('Voice');
  });

  test('L2 arka plan OK: campaignType filtresiyle liste ucunu çağırıyor @critical', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => r.url().includes(CampaignsOutboundPage.API.list) && r.url().includes('campaignType') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await oc.selectType('Voice');
    await request;
  });

  // L3 — her tür seçildiğinde listede BAŞKA tür rozeti KALMAMALI (boş-durum da geçerli).
  // Keşif: Voice→5, SMS→7, Email→1, WhatsApp→0 (boş) — hepsi doğru filtreliyor.
  const TYPE_BADGES = { Voice: 'VOICE', SMS: 'SMS', Email: 'EMAIL', WhatsApp: 'WhatsApp' };
  for (const [opt, badge] of Object.entries(TYPE_BADGES)) {
    test(`L3 görev OK: "${opt}" seçilince listede yalnız ${badge} kampanyaları kalıyor`, async () => {
      await oc.selectType(opt);
      for (const other of Object.values(TYPE_BADGES).filter((b) => b !== badge)) {
        await expect(
          oc.page.locator('tbody').getByText(other, { exact: true }),
          `${opt} filtresinde ${other} rozeti görünmemeli`
        ).toHaveCount(0, { timeout: 10000 });
      }
    });
  }
});

// ═══════════════ KONTROL: DURUM SEKMELERİ (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Durum sekmeleri @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  test('L1 tıklama OK: Running sekmesi seçili duruma geçiyor', async () => {
    await oc.selectTab(I18N.en.tabs.running);
    await expect(oc.tab(I18N.en.tabs.running)).toHaveAttribute('aria-selected', 'true');
  });

  test('L2 arka plan OK: status filtresiyle liste ucunu çağırıyor @critical', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => r.url().includes(CampaignsOutboundPage.API.list) && r.url().includes('status') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await oc.selectTab(I18N.en.tabs.running);
    await request;
  });

  test('L3 görev OK: "All" karışık durumları gösteriyor (en az bir Completed)', async () => {
    await expect(oc.page.locator('tbody').getByText('Completed', { exact: true }).first()).toBeVisible();
  });

  // Running/Paused seçilince tamamlanan/taslak/iptal durumları listeden çıkmalı.
  // (Tenant'ta 0 running/paused → boş-durum; assertion her iki halde de doğru.)
  for (const key of ['running', 'paused']) {
    test(`L3 görev OK: "${I18N.en.tabs[key]}" sekmesi diğer durumları listeden çıkarıyor`, async () => {
      await oc.selectTab(I18N.en.tabs[key]);
      for (const hidden of ['Completed', 'Cancelled', 'Draft']) {
        await expect(
          oc.page.locator('tbody').getByText(hidden, { exact: true }),
          `${I18N.en.tabs[key]} sekmesinde ${hidden} durumu görünmemeli`
        ).toHaveCount(0, { timeout: 10000 });
      }
    });
  }
});

// ═══════════════ BUTON: NEW CAMPAIGN (L1 + L2 + L3) ═══════════════
test.describe('Buton: New Campaign @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  test('L1 tıklama OK: tıklanınca create rotasına gidiyor', async ({ page }) => {
    await oc.newCampaign.click();
    await expect(page).toHaveURL(/\/campaigns\/create$/, { timeout: 15000 });
  });

  test('L2 arka plan OK: create sayfası kanal verisini çekiyor @critical', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => r.url().includes('/api/v1/campaigns/channels') && r.method() === 'GET',
      { timeout: 15000 }
    );
    await oc.newCampaign.click();
    await request;
  });

  test('L3 görev OK: "Create Campaign" sihirbazı görünüyor', async ({ page }) => {
    await oc.newCampaign.click();
    await expect(page.getByRole('heading', { name: 'Create Campaign' })).toBeVisible({ timeout: 15000 });
  });
});

// ═══════════════ BUTON: KAMPANYA GÖRÜNTÜLE / GÖZ (L1 + L2 + L3) ═══════════════
test.describe('Buton: Kampanya görüntüle (göz) @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  test('L1 tıklama OK: göz ikonuna basınca detay rotasına gidiyor', async ({ page }) => {
    const firstRow = oc.rows.first();
    await oc.rowAction(firstRow, 'view').click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]{36}$/, { timeout: 15000 });
  });

  test('L2 arka plan OK: seçilen kampanyanın detayını API\'den çekiyor @critical', async ({ page }) => {
    const request = page.waitForRequest(
      (r) => /\/api\/v1\/campaigns\/[0-9a-f-]{36}(\?|$)/.test(r.url()) && r.method() === 'GET',
      { timeout: 15000 }
    );
    await oc.rowAction(oc.rows.first(), 'view').click();
    await request;
  });

  test('L3 görev OK: doğru kampanyanın detay sayfası açılıyor (ad eşleşiyor)', async ({ page }) => {
    const firstRow = oc.rows.first();
    const cellText = (await firstRow.locator('td').first().innerText()).trim();
    // Ad, tür rozetinden (VOICE/SMS/EMAIL/WhatsApp) önceki kısımdır.
    const name = cellText.split(/VOICE|SMS|EMAIL|WhatsApp/)[0].trim();
    await oc.rowAction(firstRow, 'view').click();
    const detailHeading = page.getByRole('heading', { level: 1 });
    await expect(detailHeading).toBeVisible({ timeout: 15000 });
    expect(name.length, `satır adı çıkarılamadı: "${cellText}"`).toBeGreaterThan(0);
    await expect(detailHeading).toContainText(name);
  });
});

// ═══════════════ BUTON: KAMPANYA SİL / ÇÖP (L1 + L2) ═══════════════
// L3 görev OK (gerçek silme) prod'a YAZMADAN güvenli doğrulanamaz (mutation) → N/A.
// L2, doğru uca DELETE'in gittiğini kanıtlar (istek ağda yakalanır, prod DEĞİŞMEZ).
test.describe('Buton: Kampanya sil (çöp) @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  // NOT: Çöp ikonu yalnız Draft/Completed/Cancelled satırlarda var; SCHEDULED
  // satırlarda YOK (bkz. NOTLAR §gözlem). Bu yüzden "çöp ikonu olan ilk satır"
  // hedeflenir — satır sırasından/statüsünden bağımsız.
  test('L1 tıklama OK: çöp ikonu kalıcı-silme onay dialogu açıyor (mutation göndermeden)', async () => {
    const row = oc.rowWithAction('delete');
    await expect(row).toBeVisible();
    await oc.rowAction(row, 'delete').click();
    await expect(oc.confirmDialog).toBeVisible();
    await expect(oc.confirmDialog).toContainText(/permanently delete/i);
    // İptal → hiçbir şey silinmez.
    await oc.confirmDialog.getByRole('button', { name: /^Cancel$/i }).click();
    await expect(oc.confirmDialog).toBeHidden();
  });

  test('L2 arka plan OK: onaylayınca DELETE /campaigns/{id} gidiyor (route ile yakalanır, prod\'a yazılmaz) @critical', async ({ page }) => {
    let deleteHit = false;
    await page.route('**/api/v1/campaigns/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteHit = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); // prod'a yazma
      } else {
        await route.continue();
      }
    });
    const row = oc.rowWithAction('delete');
    await expect(row).toBeVisible();
    await oc.rowAction(row, 'delete').click();
    await expect(oc.confirmDialog).toBeVisible();
    await oc.confirmDialog.getByRole('button', { name: /^Delete$/i }).click();
    await expect.poll(() => deleteHit, { timeout: 10000 }).toBe(true);
  });

  test('L3 görev OK — N/A: gerçek silme kalıcı mutation, prod\'a yazmadan doğrulanamaz (bkz. mutasyon spec dosyasi)', () => {
    // Kasıtlı boş: katman N/A olarak belgelendi (sessiz atlanmadı).
    // Gerçek silme + doğrulama: tests/campaigns-outbound.mutation.authed.spec.js
  });
});

// ═══════════════ BUTON: KAMPANYA BAŞLAT / PLAY (L1 + L2) ═══════════════
// Yalnız Draft satırlarında görünür. L3 (gerçek başlatma) = mutation → N/A (prod).
test.describe('Buton: Kampanya başlat (play) @regression', () => {
  /** @type {CampaignsOutboundPage} */
  let oc;
  test.beforeEach(async ({ app }) => { oc = app.campaignsOutbound; await oc.open(); });

  // Play (başlat) ikonu Draft ve Scheduled satırlarda bulunur → "play ikonu olan
  // ilk satır" hedeflenir (satır sırasından bağımsız).
  test('L1 tıklama OK: play ikonu başlatma onay dialogu açıyor (mutation göndermeden)', async () => {
    const row = oc.draftRow();
    await expect(row, 'Play ikonu olan en az bir satır (Draft/Scheduled) bekleniyor.').toBeVisible();
    await oc.rowAction(row, 'start').click();
    await expect(oc.confirmDialog).toBeVisible();
    await expect(oc.confirmDialog).toContainText(/start the campaign/i);
    await oc.confirmDialog.getByRole('button', { name: /^Cancel$/i }).click();
    await expect(oc.confirmDialog).toBeHidden();
  });

  test('L2 arka plan OK: onaylayınca POST /campaigns/{id}/start gidiyor (route ile yakalanır) @critical', async ({ page }) => {
    let startHit = false;
    await page.route('**/api/v1/campaigns/*/start', async (route) => {
      if (route.request().method() === 'POST') {
        startHit = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); // prod'a yazma
      } else {
        await route.continue();
      }
    });
    const row = oc.draftRow();
    await expect(row).toBeVisible();
    await oc.rowAction(row, 'start').click();
    await expect(oc.confirmDialog).toBeVisible();
    await oc.confirmDialog.getByRole('button', { name: /^Start$/i }).click();
    await expect.poll(() => startHit, { timeout: 10000 }).toBe(true);
  });

  // L3 (BAŞARI yolu) — gerçek başlatma/arama kalıcı mutation → prod'da N/A (mutasyon spec).
  // L3 (HATA yolu) — GÖZLEMLENEBİLİR ve doğru: keşifte "test group" kişisinin telefonu
  // olmadığı için POST /start → 400 döndü ve UI "Failed to start campaign" toast'ı gösterdi.
  // Bunu route-mock 400 ile prod'a yazmadan guard'lıyoruz (başarı yolu değil, hata geri bildirimi).
  test('L3 hata yolu OK: start 400 dönünce "Failed to start" hata toast\'ı gösteriliyor', async ({ page }) => {
    await page.route('**/api/v1/campaigns/*/start', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'Campaign has no contacts with phone numbers to dial' } }),
        });
      } else {
        await route.continue();
      }
    });
    const row = oc.draftRow();
    await expect(row).toBeVisible();
    await oc.rowAction(row, 'start').click();
    await expect(oc.confirmDialog).toBeVisible();
    await oc.confirmDialog.getByRole('button', { name: /^Start$/i }).click();
    await expect(page.getByText(/Failed to start campaign/i)).toBeVisible({ timeout: 8000 });
  });
});

// ═══════════════ CREATE SİHİRBAZI — YAPI (submit YOK) ═══════════════
test.describe('Create sihirbazı — yapı @regression', () => {
  test('6 adımlı stepper + Adım 1 alanları görünüyor; Cancel geri döndürüyor', async ({ app, page }) => {
    const wiz = app.campaignCreate;
    await wiz.open();
    for (const step of ['Type', 'Contacts', 'Channel', 'Schedule', 'Retry & Pacing', 'Review']) {
      await expect(wiz.step(step)).toBeVisible();
    }
    await expect(wiz.nameInput).toBeVisible();
    await expect(wiz.descriptionInput).toBeVisible();
    for (const channel of ['Voice', 'SMS', 'Email', 'WhatsApp']) {
      await expect(wiz.channelCard(channel).first()).toBeVisible();
    }
    await expect(wiz.cancelButton).toBeVisible();
    await expect(wiz.nextButton).toBeVisible();

    await wiz.cancelButton.click();
    await expect(page).toHaveURL(/\/campaigns(\/outbound)?$/, { timeout: 15000 });
  });
});

// ═══════════════ KAMPANYA DETAYI — YAPI ═══════════════
test.describe('Kampanya detayı — yapı @regression', () => {
  test('göz ile açılan detayda sekmeler ve metrik kartları var', async ({ app, page }) => {
    const oc = app.campaignsOutbound;
    await oc.open();
    await oc.rowAction(oc.rows.first(), 'view').click();
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]{36}$/, { timeout: 15000 });

    for (const tab of ['Overview', 'Contacts', 'Results', 'Settings']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible();
    }
    await expect(page.getByText('Total Contacts', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Campaign Progress', { exact: true })).toBeVisible();
  });
});

// ═══════════════ BİLİNEN HATALAR (test.fail = bulgu açık) ═══════════════
test.describe('Giden Kampanyalar — bilinen hatalar @regression @known-bug', () => {
  // BULGU 1 — liste 10'da kapanıyor; API hasNextPage:true ama sayfalama/sonsuz-kaydırma yok.
  test('BULGU 1: 10+ kampanya varsa sayfalama/daha-fazla kontrolü olmalı', async ({ app, page }) => {
    test.fail(); // BULGU 1 açıkken beklenen başarısızlık
    const oc = app.campaignsOutbound;
    // Liste yanıtını yakalamak için open sırasında dinle.
    const respP = page.waitForResponse(
      (r) => r.url().includes('/api/v1/campaigns?page=1') && r.request().method() === 'GET',
      { timeout: 30000 }
    );
    await oc.open();
    const body = await (await respP).json();
    const hasNext = body?.data?.hasNextPage === true;
    test.skip(!hasNext, 'Bu tenantta 10+ kampanya yok; sayfalama gerekmiyor.');

    // Doğru davranış: kalan kampanyalara erişim (pager VEYA 10\'dan fazla satır).
    const pager = page.getByRole('button', { name: /next|sonraki|load more|daha fazla|önceki|previous/i })
      .or(page.getByRole('navigation', { name: /pagination/i }));
    const rowCount = await oc.rows.count();
    expect(await pager.count() > 0 || rowCount > 10,
      `hasNextPage=true ama sayfalama kontrolü yok ve yalnız ${rowCount} satır görünüyor`).toBe(true);
  });

  // BULGU 2 — satır işlem ikonları erişilebilir isimsiz (a11y button-name).
  // göz TÜM satırlarda; çöp yalnız silinebilir (Draft/Completed) satırlarda → ayrı ayrı hedeflenir.
  test('BULGU 2: satır işlem ikonlarının (göz/sil) erişilebilir ismi olmalı', async ({ app }) => {
    test.fail(); // BULGU 2 açıkken beklenen başarısızlık
    const oc = app.campaignsOutbound;
    await oc.open();
    await expect(oc.rowAction(oc.rows.first(), 'view')).toHaveAccessibleName(/.+/, { timeout: 4000 });
    await expect(oc.rowAction(oc.rowWithAction('delete'), 'delete')).toHaveAccessibleName(/.+/, { timeout: 4000 });
  });

  // NOT: "BULGU 4" (start başarısız → sessiz) HATALI çıktı; uygulama 400'de
  // "Failed to start campaign" toast'ı GÖSTERİYOR (ilk keşifte geçici toast tek-sefer
  // sorguda kaçırılmıştı). Artık pozitif guard: "Buton: Kampanya başlat › L3 hata yolu".
});
