// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  knownBugGuard,
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';
import { WorkforcePage } from './pages/WorkforcePage.js';

/**
 * İŞ GÜCÜ (`/workforce`)
 * Keşif + kanıt: docs/workforce-kesif/NOTLAR.md (+ screenshots/). Kapsam: docs/TEST_COVERAGE.md.
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER KONTROL İÇİN 3 KATMAN (AGENTS.md standardı) ──────────────────────────┐
 * │ L1 — TIKLAMA OK : etkileşim çalışır, UI gözlemlenebilir tepki verir.        │
 * │ L2 — ARKA PLAN OK: doğru backend ucu tetiklenir (method+endpoint). Mutasyon │
 * │                    isteği `page.route` ile YAKALANIR (prod'a yazılmaz).      │
 * │ L3 — GÖREV OK   : kontrol amacını gerçekten yerine getirir. Kalıcı kayıt    │
 * │                    (create/publish) → opt-in mutation kategorisi (ayrı spec).      │
 * └────────────────────────────────────────────────────────────────────────────┘
 * L3 mutation'lar: tests/workforce-mutations.authed.spec.js
 * (yalnızca kimliği doğrulanan staging tenant'ında `npm run test:mutation`).
 */

const I18N = WorkforcePage.I18N;
const API = WorkforcePage.API;

/** Her sekmenin içerik imzası (o sekme yüklendiğinde görünmesi beklenen). */
const TAB_CONTENT = [
  { tab: 'Schedules', button: 'Publish Schedule' },
  { tab: 'Time Off', button: 'Request Time Off' },
  { tab: 'Adherence', button: '7d' },
  { tab: 'Forecast', table: true },
  { tab: 'Badges', button: 'Create badge' },
  { tab: 'Surveys', button: 'Create survey' },
  { tab: 'Evaluations', button: 'Create Evaluation' },
];

const startDate = (rangeText) => (String(rangeText).match(/(\d{4}-\d{2}-\d{2})/) || [])[1] ?? null;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('İş Gücü — yapı', () => {
  test('başlık ve 7 sekme görünüyor @smoke', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await expect(wf.heading).toHaveText(I18N.en.heading);
    for (const name of I18N.en.tabs) {
      await expect(wf.tab(name)).toBeVisible();
    }
  });

  test('Schedules çizelgesi ve Publish butonu mevcut @critical', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await expect(wf.page.locator('main table').first()).toBeVisible();
    await expect(wf.publishButton()).toBeVisible();
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI ────────────────────────
test.describe("İş Gücü — 4 dil çeviri guard'ları @i18n @regression", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yazı yönü + sekmeler + oluşturma formu çevrili`, async ({ app }) => {
      const wf = app.workforce;
      await wf.open();
      if (t.endonym) await wf.switchLanguage(t.endonym);

      await expect(wf.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(wf.heading).toHaveText(t.heading);
      for (const name of t.tabs) {
        await expect(wf.tab(name)).toBeVisible();
      }
      // Oluşturma formu başlığı da çevrili (submit YOK)
      await wf.firstScheduleCell().click();
      await expect(wf.addShiftDialog().getByRole('heading', { name: t.addShift, exact: true })).toBeVisible();
      await wf.page.keyboard.press('Escape');
    });
  }
});

// ═══════════════ KONTROL: SEKME NAVİGASYONU (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Sekme navigasyonu @regression', () => {
  test('L1 tıklama OK: her sekme tıklanınca seçili duruma geçiyor', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    for (const name of I18N.en.tabs) {
      await wf.selectTab(name); // aria-selected=true olana kadar doğrular
      await expect(wf.tab(name)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('L2 arka plan OK: veri sekmeleri ilgili API ucundan veri çekiyor @critical', async ({ app, page }) => {
    const wf = app.workforce;
    await wf.open();
    for (const [name, endpoint] of Object.entries(WorkforcePage.DATA_TABS)) {
      const req = page.waitForRequest(
        (r) => r.url().includes(endpoint) && r.method() === 'GET',
        { timeout: 10000 }
      );
      await wf.selectTab(name);
      await req; // tetiklenmezse timeout → kırılır
    }
  });

  test('L3 görev OK: her sekme kendi içeriğini gösteriyor', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    for (const c of TAB_CONTENT) {
      await wf.selectTab(c.tab);
      if (c.button) {
        await expect(wf.page.getByRole('button', { name: c.button, exact: true }).first()).toBeVisible();
      } else if (c.table) {
        await expect(wf.page.locator('main table').first()).toBeVisible();
      }
    }
  });
});

// ═══════════════ KONTROL: TARİH NAVİGASYONU (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Tarih navigasyonu (Previous/Next Week) @regression', () => {
  test('L1 tıklama OK: Previous Week tarih aralığını değiştiriyor', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    const before = await wf.dateRangeText();
    expect(before, 'tarih aralığı görünmeli').not.toBe('');
    await wf.prevWeek.click();
    await expect.poll(() => wf.dateRangeText(), { timeout: 8000 }).not.toBe(before);
  });

  test('L2 arka plan OK: Previous Week seçilen hafta için çizelge çekiyor @critical', async ({ app, page }) => {
    const wf = app.workforce;
    await wf.open();
    const req = page.waitForRequest(
      (r) => r.url().includes(API.schedules) && r.url().includes('startDate') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await wf.prevWeek.click();
    await req;
  });

  test('L3 görev OK: gösterilen hafta tam olarak bir hafta geri kayıyor', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    const before = await wf.dateRangeText();
    await wf.prevWeek.click();
    await expect.poll(() => wf.dateRangeText(), { timeout: 8000 }).not.toBe(before);
    const after = await wf.dateRangeText();
    const days = (new Date(startDate(before)).getTime() - new Date(startDate(after)).getTime()) / 86_400_000;
    expect(days, `önce=${before} sonra=${after}`).toBe(7);
  });
});

// ═══════════════ KONTROL: ADHERENCE ARALIĞI 7d/14d/30d (L1 + L2) ═══════════════
// L3 görev OK: N/A — hesapta adherence verisi yok ("No adherence data"); aralık
//   seçiminin gözlemlenebilir son-durumu (dolu grafik) prod'a veri yazmadan
//   doğrulanamaz. Veri gelince L3 eklenmeli.
test.describe('Kontrol: Adherence aralığı @regression', () => {
  test('L1 tıklama OK: 7d/14d/30d düğmeleri görünür ve tıklanabilir', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Adherence');
    for (const r of ['7d', '14d', '30d']) {
      await expect(wf.adherenceRange(r)).toBeEnabled();
    }
    // NOT: seçili (active) durum için semantik sinyal (aria-pressed) yok →
    //   frontend'den data-testid/aria-pressed istenmeli. L2 gerçek etkiyi kanıtlar.
    await wf.adherenceRange('14d').click();
  });

  test("L2 arka plan OK: 14d seçilince adherence verisi API'den çekiliyor", async ({ app, page }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Adherence');
    const req = page.waitForRequest(
      (r) => r.url().includes(API.adherence) && r.url().includes('date=') && r.method() === 'GET',
      { timeout: 10000 }
    );
    await wf.adherenceRange('14d').click();
    await req;
  });
});

// ═══════════════ KONTROL: ADD SHIFT ("+") (L1 + L2) ═══════════════
// L3 görev OK: kalıcı kayıt (vardiya oluşturma) → opt-in mutation kategorisi.
//   Bkz. tests/workforce-mutations.authed.spec.js (yalnızca staging'de npm run test:mutation).
test.describe('Kontrol: Add Shift @regression', () => {
  test('L1 tıklama OK: çizelge hücresi "Add Shift" formunu açıyor (Start/End/Break)', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.firstScheduleCell().click();
    const dialog = wf.addShiftDialog();
    await expect(dialog.getByRole('heading', { name: 'Add Shift', exact: true })).toBeVisible();
    for (const field of ['Start Time', 'End Time', 'Break (minutes)']) {
      await expect(dialog.getByText(field, { exact: false }).first()).toBeVisible();
    }
    await wf.page.keyboard.press('Escape');
  });

  test("L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ)", async ({ app, page }) => {
    const wf = app.workforce;
    await wf.open();
    let posted = false;
    await page.route(`**${API.schedules}`, async (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); // prod'a yazma
      } else {
        await route.continue();
      }
    });
    await wf.firstScheduleCell().click();
    await wf.addShiftDialog().getByRole('button', { name: /Save/i }).click();
    await expect.poll(() => posted, { timeout: 10000 }).toBe(true);
  });
});

// ═══════════════ KONTROL: PUBLISH SCHEDULE (L1) ═══════════════
// L2 + L3: N/A burada — boş çizelgede Publish ağ isteği üretmiyor; tam davranış
//   yalnızca "vardiya oluştur → yayınla" akışında görülür → opt-in mutation kategorisi.
//   Bkz. tests/workforce-mutations.authed.spec.js.
test.describe('Kontrol: Publish Schedule @regression', () => {
  test('L1 tıklama OK: buton görünür ve etkin', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await expect(wf.publishButton()).toBeEnabled();
  });
});

// ═══════════ KONTROL: REQUEST TIME OFF (İzinler / Time Off) (L1 + L2) ═══════════
// L3 görev OK: N/A — izin talebi UI'dan SİLİNEMİYOR. Yalnızca PATCH ile durum
//   değişir (Pending → Approved/Rejected); terminal durumda "Actions" kaybolur ve
//   bir DELETE ucu yoktur (API DELETE → 401). Gerçek create KALICI kayıt bırakır →
//   L3 opt-in mutation GÜVENLİ DEĞİL, yazılmadı. L2 doğru ucu prod'a yazmadan kanıtlar.
//   Kanıt: docs/workforce-kesif/NOTLAR.md (28 Tem 2026 canlı gözlem).
test.describe('Kontrol: Request Time Off @regression', () => {
  test('L1 tıklama OK: form açılıyor (Start/End Date, Reason) ve tarih dolunca Submit etkinleşiyor', async ({
    app,
  }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Time Off');
    await wf.requestTimeOffButton().click();
    const d = wf.addShiftDialog(); // getByRole('dialog')
    await expect(d.getByRole('heading', { name: 'Request Time Off', exact: true })).toBeVisible();

    const submit = d.getByRole('button', { name: 'Submit', exact: true });
    await expect(submit).toBeDisabled(); // tarih girilmeden pasif
    const dates = d.locator('input[type="date"]');
    await dates.nth(0).fill('2026-09-15');
    await dates.nth(1).fill('2026-09-17');
    await expect(submit).toBeEnabled(); // tarih dolunca etkinleşir (gözlemlenebilir tepki)
    await wf.page.keyboard.press('Escape'); // GÖNDERME YOK
  });

  test("L2 arka plan OK: Submit doğru uca POST gönderiyor (prod'a YAZILMAZ)", async ({ app, page }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Time Off');
    let posted = false;
    await page.route(`**${API.timeOff}`, async (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' }); // prod'a yazma
      } else {
        await route.continue();
      }
    });
    await wf.requestTimeOffButton().click();
    const d = wf.addShiftDialog();
    await d.locator('input[type="date"]').nth(0).fill('2026-09-15');
    await d.locator('input[type="date"]').nth(1).fill('2026-09-17');
    await d.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect.poll(() => posted, { timeout: 10000 }).toBe(true);
  });
});

// ═══════ KONTROL: Gamification/Değerlendirme oluşturma formları (L1) ═══════
// Create badge (Name/Category/Points), Award badge (Badge/Agent/Reason),
// Create survey (JSON sorular), Create Evaluation (JSON Form Data) — hepsi
// `POST /api/v1/wfm/gamification/*` veya `/wfm/evaluations`'a gider.
//
// L1 — form açılır (bu testler). ✓
// L2 — N/A (bu turda): formlar boş submit'te istek atmıyor; valid veri girişi
//   karmaşık (var olan rozet/ajan seçimi, JSON alanlar) ve yanlış girişte gerçek
//   kayıt oluşma riski var. Uydurma test yazılmaz → valid-veri L2 staging'de eklenir.
// L3 — N/A: oluşturulan kayıtların güvenli silme yolu doğrulanamadı (Time Off gibi
//   kalıcı kayıt riski). Bkz. docs/workforce-kesif/NOTLAR.md.
const CREATE_FORMS = [
  { tab: 'Badges', button: 'Create badge', title: 'Create badge' },
  { tab: 'Badges', button: 'Award badge', title: 'Award badge' },
  { tab: 'Surveys', button: 'Create survey', title: 'Create survey' },
  { tab: 'Evaluations', button: 'Create Evaluation', title: 'Create Quality Evaluation' },
];
test.describe('Kontrol: İş Gücü oluşturma formları (L1) @regression', () => {
  for (const c of CREATE_FORMS) {
    test(`L1 tıklama OK: "${c.button}" formu açılıyor ("${c.title}")`, async ({ app }) => {
      const wf = app.workforce;
      await wf.open();
      await wf.selectTab(c.tab);
      await wf.page.getByRole('button', { name: c.button, exact: true }).click();
      const d = wf.addShiftDialog();
      await expect(d.getByRole('heading', { name: c.title, exact: true })).toBeVisible();
      await expect(d.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
      await wf.page.keyboard.press('Escape');
    });
  }
});

// ═══════════════ UYUM (Adherence) — sekme derin kapsamı @regression ═══════════════
// Ayrı rota YOK; derin kapsam yalnız /workforce sekmesinde sahiplenilir.
// L1 kontrol + L2 API (range→adherence GET) yukarıda "Adherence aralığı" başlığında
// kanıtlanıyor. Burada sekme içeriği + boş-durum + hata-yolu eklenir.
// Canlı gözlem (31 Tem 2026): "Adherence Trend" paneli + 7d/14d/30d; hesapta veri yok →
//   boş-durum "No historical adherence data available"; altında "Real-time schedule
//   adherence" tablosu. (Boş-durum/panel metni İngilizce fallback — bkz. i18n bulgusu.)
test.describe('Uyum (Adherence) — sekme içeriği @regression', () => {
  test('sekme açılıyor; aralık kontrolleri + veri/boş-durum görünür', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Adherence');
    // Temel kontroller.
    for (const r of ['7d', '14d', '30d']) {
      await expect(wf.adherenceRange(r)).toBeVisible();
    }
    // Boş durum VEYA veri: hesapta adherence verisi yoksa boş-durum metni görünür;
    // her hâlükârda gerçek-zamanlı uyum tablosu/trend görseli render edilir (panel çökmez).
    const panel = wf.page.locator('main');
    const emptyState = panel.getByText(/No historical adherence data available/i);
    const chartOrTable = panel.locator('canvas, svg, table');
    await expect
      .poll(async () => (await emptyState.count()) + (await chartOrTable.count()), {
        timeout: 10000,
        message: 'Adherence paneli boş-durum metni ya da grafik/tablo göstermeli',
      })
      .toBeGreaterThan(0);
  });

  test('adherence ucu 500 dönse de sekme çökmüyor @errorpath', async ({ app, page }) => {
    await mockApi(page, `**${API.adherence}**`, { status: 500 });
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Adherence');
    // Aralık seçimi adherence fetch'ini tetikler (artık 500) — kabuk sağlam, panel çökmez.
    await wf.adherenceRange('7d').click();
    await expect(wf.adherenceRange('7d')).toBeVisible();
    await expect(wf.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ TAHMİN (Forecast) — sekme derin kapsamı @regression ═══════════════
// Ayrı rota YOK; derin kapsam yalnız /workforce sekmesinde sahiplenilir.
// Canlı gözlem (31 Tem 2026): Forecast sekmesi KPI kartları (Toplam tahmin / Yoğun saat /
//   Gerekli maksimum temsilci / Veri kaynağı=Historical) + "Saatlik tahmin" (hourly)
//   tablosunu gösterir. L2 API = N/A: sekme tıklamasında AYRI bir GET tetiklenmez
//   (canlı ağ incelemesi: istek yok; orijinal yazar da Forecast'i DATA_TABS'a koymadı) —
//   tahmin verisi çizelge/sayfa yükünde gelir; schedules L2 zaten kanıtlar. Tekrar yok.
test.describe('Tahmin (Forecast) — sekme içeriği @regression', () => {
  test('sekme açılıyor; KPI kartları + saatlik tahmin tablosu görünür', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Forecast');
    await expect(wf.tab('Forecast')).toHaveAttribute('aria-selected', 'true');
    // Tahmin içeriği: saatlik tahmin tablosu (canlı gözlem) — panel boş/çökmüş değil.
    const table = wf.page.locator('main table').first();
    await expect(table).toBeVisible();
    // Boş-durum dahil en az bir saat satırı render edilmeli (00:00 → …).
    await expect(table.locator('tbody tr').first()).toBeVisible();
  });

  test('KPI kartları veri kaynağını gösteriyor (boş tenant\'ta 0 değerleri)', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.selectTab('Forecast');
    // "Historical" veri kaynağı kartı (canlı gözlem) — panel gerçek veri/özet gösteriyor.
    await expect(wf.page.getByText(/Historical/i).first()).toBeVisible();
  });
});

// ═══════════ BULGU (i18n): Uyum paneli İngilizce fallback (@i18n) ═══════════
// Sekme etiketleri çevrili ama Uyum panel içeriği (başlık + boş-durum) İngilizce kalıyor.
// knownBugGuard ile "bilinen açık" olarak işaretli (WORKFORCE-ADHERENCE-I18N).
test.describe('İş Gücü — Uyum paneli i18n sızıntısı @i18n @regression', () => {
  test('Türkçe seçiliyken Uyum paneli İngilizce fallback göstermemeli', async ({ app }) => {
    knownBugGuard(test, 'WORKFORCE-ADHERENCE-I18N');
    const wf = app.workforce;
    await wf.open();
    await wf.switchLanguage('Türkçe');
    // Türkçe UI'da Uyum sekmesi ("Uyum") — I18N.tr.tabs[2].
    await wf.selectTab(I18N.tr.tabs[2]);
    // BULGU: panel başlığı İngilizce fallback ("Adherence Trend"); beklenen: görünmez (çevrili).
    await expect(wf.page.getByText('Adherence Trend', { exact: false })).toHaveCount(0);
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('İş Gücü — erişilebilirlik @a11y', () => {
  test('sayfada ve Uyum/Tahmin sekmelerinde ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await expectNoSevereA11y(wf.page); // bilinen borç (button-name/contrast) hariç
    for (const name of ['Adherence', 'Forecast']) {
      await wf.selectTab(name);
      await expectNoSevereA11y(wf.page);
    }
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('İş Gücü — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstü + Arapça RTL yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/workforce');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('İş Gücü — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({
    app,
    diagnostics,
  }) => {
    const wf = app.workforce;
    await wf.open();
    await waitForUiToSettle(wf.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('İş Gücü — klavye/odak @keyboard', () => {
  test('Add Shift diyaloğu Escape ile kapanıyor', async ({ app }) => {
    const wf = app.workforce;
    await wf.open();
    await wf.firstScheduleCell().click();
    const dialog = wf.addShiftDialog();
    await expect(dialog).toBeVisible();
    await wf.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});

// ═══════════════ STİL: HATA-YOLU (sayfa düzeyi) (@errorpath) ═══════════════
test.describe('İş Gücü — hata-yolu (sayfa) @errorpath', () => {
  test('çizelge ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({
    app,
    page,
  }) => {
    await mockApi(page, `**${API.schedules}**`, { status: 500 });
    const wf = app.workforce;
    await page.goto('/workforce', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(wf.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('İş Gücü — deep-link @deeplink', () => {
  test('/workforce doğrudan açılınca yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const wf = app.workforce;
    await page.goto('/workforce', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(wf.shell.loginHeading).toBeHidden();
    await expect(wf.heading).toHaveText(I18N.en.heading);
  });
});
