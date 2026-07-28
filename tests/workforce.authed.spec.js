// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';

/**
 * İş Gücü (Workforce) — işlevsel + 4 dilde yerelleştirme REGRESYON GUARD'ları.
 * (Keşif ve ekran görüntüleri: docs/workforce-kesif/)
 *
 * Amaç: mevcut DOĞRU durumu kilitlemek. Testler şu an geçer; ileride bir
 * güncelleme başlığı/sekmeleri/yazı yönünü/oluşturma formunu bozarsa test
 * KIRMIZIYA döner ve hangi dilde/nerede bozulduğunu gösterir.
 *
 * Salt-okunur: "Add Shift" formu yalnızca AÇILIR, submit EDİLMEZ (prod'a kayıt bırakılmaz).
 */

const LANGS = [
  {
    key: 'en', endonym: 'English', dir: 'ltr',
    heading: 'Workforce Management',
    tabs: ['Schedules', 'Time Off', 'Adherence', 'Forecast', 'Badges', 'Surveys', 'Evaluations'],
    addShift: 'Add Shift',
  },
  {
    key: 'tr', endonym: 'Türkçe', dir: 'ltr',
    heading: 'İş Gücü Yönetimi',
    tabs: ['Programlar', 'İzinler', 'Uyum', 'Tahmin', 'Rozetler', 'Anketler', 'Değerlendirmeler'],
    addShift: 'Vardiya Ekle',
  },
  {
    key: 'fr', endonym: 'Français', dir: 'ltr',
    heading: 'Gestion des effectifs',
    tabs: ['Plannings', 'Congés', 'Adhérence', 'Prévisions', 'Badges', 'Enquêtes', 'Évaluations'],
    addShift: 'Ajouter un quart',
  },
  {
    key: 'ar', endonym: 'العربية', dir: 'rtl',
    heading: 'إدارة القوى العاملة',
    tabs: ['الجداول', 'الإجازات', 'الالتزام', 'التنبؤ', 'الشارات', 'الاستبيانات', 'التقييمات'],
    addShift: 'إضافة وردية',
  },
];

/**
 * 7 sekmenin imza kontrolü — sekme yüklendiğinde görünmesi beklenen öğe.
 * (Keşif: docs/workforce-kesif/NOTLAR.md · KAPSAM.md)
 */
const TAB_SIGNATURES = [
  { tab: 'Schedules', button: 'Publish Schedule' },
  { tab: 'Time Off', button: 'Request Time Off', empty: 'No time off requests' },
  { tab: 'Adherence', button: '7d' },
  { tab: 'Forecast', table: true },
  { tab: 'Badges', button: 'Create badge', empty: 'No badges yet' },
  { tab: 'Surveys', button: 'Create survey', empty: 'No CSAT surveys' },
  { tab: 'Evaluations', button: 'Create Evaluation' },
];

async function openWorkforce(page) {
  await gotoApp(page, '/workforce');
  await expect(page.getByRole('heading', { name: 'Workforce Management', exact: true })).toBeVisible({
    timeout: 30000,
  });
}

/**
 * Çizelge hücresine tıklayıp "Add Shift" diyaloğunu açar.
 * NOT: "+" hücreleri semantik buton değil (div.border-dashed, aria yok). Stabil
 *   seçim için frontend'den data-testid (ör. data-testid="schedule-cell") istenmeli.
 */
async function openAddShift(page) {
  const cell = page.locator('main table td .border-dashed').first();
  await expect(cell).toBeVisible({ timeout: 15000 });
  await cell.click();
}

/**
 * Kenar menüsündeki dil düğmesinden dili değiştirir (İngilizce başlangıçtan tek geçiş).
 * Menü, açık dile göre endonim etiketler gösterir (English/Türkçe/Français/العربية).
 */
async function setLanguage(page, endonym) {
  const switcher = page.locator('button').filter({ hasText: /English|Türkçe|Français|العربية/ }).last();
  await expect(async () => {
    await switcher.click();
    await expect(page.getByText('Français', { exact: true }).first()).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await page.getByText(endonym, { exact: true }).first().click();
}

test.describe('Vomenta - Workforce (İş Gücü)', () => {
  test('sayfa başlığı ve 7 sekme görünüyor @smoke', async ({ page }) => {
    await openWorkforce(page);
    for (const name of LANGS[0].tabs) {
      await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
    }
  });

  test('7 sekme de yükleniyor ve imza kontrolü görünüyor @smoke', async ({ page }) => {
    await openWorkforce(page);
    for (const s of TAB_SIGNATURES) {
      // Tıklama yutulmasına karşı: sekmeye tıkla + imza öğesi görünene kadar tekrar dene.
      await expect(async () => {
        await page.getByRole('tab', { name: s.tab, exact: true }).click();
        if (s.button) {
          await expect(page.getByRole('button', { name: s.button, exact: true }).first()).toBeVisible({ timeout: 2500 });
        } else if (s.table) {
          await expect(page.locator('main table').first()).toBeVisible({ timeout: 2500 });
        }
      }).toPass({ timeout: 15000 });
      if (s.empty) {
        await expect(page.getByText(s.empty, { exact: false }).first()).toBeVisible();
      }
    }
  });

  test('tarih navigasyonu önceki/sonraki haftaya gidiyor', async ({ page }) => {
    await openWorkforce(page);
    const range = () =>
      page.locator('main').innerText().then((t) => (t.match(/\d{4}-\d{2}-\d{2}\s*—\s*\d{4}-\d{2}-\d{2}/) || [''])[0]);
    const initial = await range();
    expect(initial, 'tarih aralığı görünmeli').not.toBe('');

    await page.getByRole('button', { name: 'Previous Week' }).click();
    await expect.poll(range, { timeout: 8000 }).not.toBe(initial);
    const past = await range();

    await page.getByRole('button', { name: 'Next Week' }).click();
    await expect.poll(range, { timeout: 8000 }).not.toBe(past);
  });

  test('çizelge hücresine tıklayınca "Add Shift" formu açılıyor (Start/End/Break)', async ({ page }) => {
    await openWorkforce(page);
    await openAddShift(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Add Shift', exact: true })).toBeVisible();
    for (const field of ['Start Time', 'End Time', 'Break (minutes)']) {
      await expect(dialog.getByText(field, { exact: false }).first()).toBeVisible();
    }
    // Submit YOK — sadece formun açıldığı doğrulanıyor.
    await page.keyboard.press('Escape');
  });

  for (const lang of LANGS) {
    test(`${lang.key} · Workforce ${lang.endonym} diline doğru çevriliyor (başlık, sekmeler, yön, form)`, async ({
      page,
    }) => {
      await openWorkforce(page);
      if (lang.key !== 'en') {
        await setLanguage(page, lang.endonym);
        await expect(page.getByRole('heading', { name: lang.heading, exact: true })).toBeVisible({
          timeout: 15000,
        });
      }

      // Başlık çevrilmiş
      await expect(page.getByRole('heading', { name: lang.heading, exact: true })).toBeVisible();
      // Sekmeler çevrilmiş
      for (const name of lang.tabs) {
        await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
      }
      // Yazı yönü (Arapça = rtl)
      expect(await page.evaluate(() => getComputedStyle(document.body).direction), `yazı yönü ${lang.dir} olmalı`).toBe(
        lang.dir
      );
      // Oluşturma formu başlığı çevrilmiş
      await openAddShift(page);
      await expect(
        page.getByRole('dialog').getByRole('heading', { name: lang.addShift, exact: true })
      ).toBeVisible();
      await page.keyboard.press('Escape');
    });
  }
});
