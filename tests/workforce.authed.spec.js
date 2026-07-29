// @ts-check
import { test, expect } from './fixtures/test.js';
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
test.describe("İş Gücü — 4 dil çeviri guard'ları @regression", () => {
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
