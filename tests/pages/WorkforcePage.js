// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * İş Gücü (`/workforce`) sayfa nesnesi.
 *
 * Keşif notları: docs/workforce-kesif/NOTLAR.md (+ screenshots/).
 * Sayfa taze bağlamda İngilizce açılır; dil seçimi sunucuda kalıcı DEĞİLDİR
 * (her test İngilizce başlar). Tek dil switch güvenilirdir.
 */
export class WorkforcePage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Workforce Management', addShift: 'Add Shift',
      tabs: ['Schedules', 'Time Off', 'Adherence', 'Forecast', 'Badges', 'Surveys', 'Evaluations'],
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'İş Gücü Yönetimi', addShift: 'Vardiya Ekle',
      tabs: ['Programlar', 'İzinler', 'Uyum', 'Tahmin', 'Rozetler', 'Anketler', 'Değerlendirmeler'],
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Gestion des effectifs', addShift: 'Ajouter un quart',
      tabs: ['Plannings', 'Congés', 'Adhérence', 'Prévisions', 'Badges', 'Enquêtes', 'Évaluations'],
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'إدارة القوى العاملة', addShift: 'إضافة وردية',
      tabs: ['الجداول', 'الإجازات', 'الالتزام', 'التنبؤ', 'الشارات', 'الاستبيانات', 'التقييمات'],
    },
  };

  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı, 28 Tem 2026). */
  static API = {
    schedules: '/api/v1/wfm/schedules', // haftalık çizelge (GET ?startDate&endDate) + vardiya (POST)
    adherence: '/api/v1/wfm/schedules/adherence', // GET ?date=...
    forecast: '/api/v1/wfm/schedules/forecast',
    timeOff: '/api/v1/wfm/time-off',
    badges: '/api/v1/wfm/gamification/badges',
    surveys: '/api/v1/wfm/gamification/surveys',
    evaluations: '/api/v1/wfm/evaluations',
  };

  /** Veri çekmek için tıklanınca ilgili GET'i atan sekmeler (L2 hedefi). */
  static DATA_TABS = {
    'Time Off': WorkforcePage.API.timeOff,
    Badges: WorkforcePage.API.badges,
    Surveys: WorkforcePage.API.surveys,
    Evaluations: WorkforcePage.API.evaluations,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/workforce');
    this.heading = page.getByRole('heading', { level: 1 });
    this.dateRangeRe = /\d{4}-\d{2}-\d{2}\s*—\s*\d{4}-\d{2}-\d{2}/;
    this.prevWeek = page.getByRole('button', { name: 'Previous Week' });
    this.nextWeek = page.getByRole('button', { name: 'Next Week' });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WorkforcePage.I18N.en.heading, { timeout: 30000 });
  }

  tab(name) {
    // NOT: "Badges" sekmesine girince ikinci (aynı) bir tab bar mount oluyor
    //   (gözlem: yüklemede 1 tablist, sonra 2 — ikisi de görünür; olası UX kusuru,
    //   NOTLAR'da işaretli). Deterministik gezinme için ANA (ilk) tablist'e sabitliyoruz.
    return this.page.getByRole('tablist').first().getByRole('tab', { name, exact: true });
  }

  publishButton(name = 'Publish Schedule') {
    return this.page.getByRole('button', { name, exact: true });
  }

  requestTimeOffButton() {
    return this.page.getByRole('button', { name: 'Request Time Off', exact: true });
  }

  /** Radix sekmesine güvenli tıklama; seçili duruma geçtiğini doğrular. */
  async selectTab(name) {
    const tab = this.tab(name);
    await expect(async () => {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  /** Çizelgede ilk boş vardiya hücresi. NOT: semantik buton değil (div.border-dashed,
   *  aria yok) → frontend'den data-testid="schedule-cell" istenmeli (son çare CSS). */
  firstScheduleCell() {
    return this.page.locator('main table td .border-dashed').first();
  }

  addShiftDialog() {
    return this.page.getByRole('dialog');
  }

  /** İlk ajan/gün çizelge hücresi (dolu/boş fark etmez); tıklayınca Add/Edit Shift açılır. */
  scheduleCell() {
    return this.page.locator('main table tbody tr').first().locator('td').nth(1);
  }

  /** İlk boş hücreye varsayılan (09:00–17:00) vardiya oluşturur — GERÇEK POST (yalnızca mutation testi). */
  async createDefaultShift() {
    await this.firstScheduleCell().click();
    const dialog = this.addShiftDialog();
    await expect(dialog.getByRole('heading', { name: 'Add Shift', exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: /Save/i }).click();
    await expect(this.scheduleCell()).toContainText(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/, { timeout: 10000 });
  }

  /** İlk hücredeki vardiyayı siler (Edit Shift → Delete). Vardiya yoksa no-op. Cleanup için idempotent. */
  async deleteFirstShift() {
    const cell = this.scheduleCell();
    const text = await cell.innerText().catch(() => '');
    if (!/\d{1,2}:\d{2}/.test(text)) return;
    await cell.click();
    const dialog = this.addShiftDialog();
    await dialog.getByRole('button', { name: /Delete/i }).click();
    await expect(cell).not.toContainText(/\d{1,2}:\d{2}/, { timeout: 10000 });
  }

  /** Görünen hafta aralığı metni ("2026-07-27 — 2026-08-02"). */
  async dateRangeText() {
    const t = await this.page.locator('main').innerText();
    return (t.match(this.dateRangeRe) || [''])[0];
  }

  /** Adherence aralık düğmesi (7d/14d/30d). */
  adherenceRange(range) {
    return this.page.getByRole('button', { name: range, exact: true });
  }

  languageTrigger() {
    return this.page.locator('button', { hasText: /English|Türkçe|Français|العربية/ }).last();
  }

  /** Dili endonim etiketiyle değiştirir (İngilizce başlangıçtan tek switch güvenilirdir). */
  async switchLanguage(endonym) {
    const trigger = this.languageTrigger();
    await expect(async () => {
      await trigger.click();
      await this.page.getByText(endonym, { exact: true }).first().click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(this.page.getByRole('heading', { level: 1 })).not.toHaveText(
      WorkforcePage.I18N.en.heading,
      { timeout: 10000 }
    );
  }
}
