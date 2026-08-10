// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Süpervizör → Koçluk / Quality Coaching (`/supervisor/coaching`).
 *
 * Keşif + kanıt: docs/kocluk-kesif/NOTLAR.md
 * NOT: Sayfa `<main>` kullanmıyor; içerik `body` üzerinden okunur.
 */
export class CoachingPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Quality Coaching', subtitle: 'Evaluate interactions and provide coaching feedback', tabs: ['Evaluated', 'Pending Review'], newEval: 'New Evaluation', empty: 'No evaluations found' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Kalite koçluğu', subtitle: 'Etkileşimleri değerlendirin ve geri bildirim verin', tabs: ['Değerlendirilenler', 'Bekleyen inceleme'], newEval: 'Yeni değerlendirme', empty: null },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Coaching qualité', subtitle: 'Évaluez les interactions et fournissez un retour', tabs: ['Évaluées', 'En attente'], newEval: 'Nouvelle évaluation', empty: null },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'التدريب على الجودة', subtitle: null, tabs: ['تم التقييم', 'قيد المراجعة'], newEval: 'تقييم جديد', empty: 'لا توجد تقييمات' },
  };

  static COLUMNS = ['Agent', 'Type', 'Score', 'Evaluator', 'Date', 'Actions'];
  static STAT_TILES = ['Total Evaluations', 'Avg Score', 'AI Evaluations', 'Manual Evaluations'];
  static API = { evaluations: '/api/v1/supervisor/coaching/evaluations' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/supervisor/coaching');
    this.heading = page.getByRole('heading', { level: 1 });
    this.searchInput = page.getByPlaceholder('Search by agent...');
    this.newEvalButton = page.getByRole('button', { name: 'New Evaluation', exact: true }).first();
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(CoachingPage.I18N.en.heading, { timeout: 30000 });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /** @ix-tabs — hidrasyon yarışına karşı retry'lı sekme seçimi (aria-selected'e kadar). */
  async selectTab(name) {
    const t = this.tab(name);
    await expect(async () => {
      await t.click();
      await expect(t).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  /** @ix-table — değerlendirme tablosu (test tenant'ında satır boş olabilir). SALT-OKUNUR. */
  get table() {
    return this.page.getByRole('table').first();
  }

  /** Tablo GÖVDE satırları = hücre içeren satırlar. SALT-OKUNUR. */
  get rows() {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell') });
  }

  /** "New Evaluation" diyaloğunu açar. */
  async openNewEvaluation() {
    await this.newEvalButton.click();
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    return dialog;
  }

  /** Değerlendirme formunu doldurur (agent + interaction ID + kriter yıldızları + feedback). */
  async fillEvaluation(dialog, { interactionId = 'qa-test-interaction-0001' } = {}) {
    await dialog.getByRole('combobox').first().click();
    await this.page.getByRole('option').first().click();
    await dialog.getByPlaceholder('Enter interaction ID').fill(interactionId);
    // Kriter yıldızları: kriter başına 5; her kriterin bir yıldızına tıklayarak skoru > 0 yap.
    const stars = dialog.locator('button:has(svg)');
    const n = await stars.count();
    for (let g = 0; g < 5; g++) {
      const idx = g * 5 + 3;
      if (idx < n) await stars.nth(idx).click().catch(() => {});
    }
    for (const ta of await dialog.locator('textarea').all()) {
      await ta.fill('QA otomasyon değerlendirme notu.').catch(() => {});
    }
  }

  /** Dialog'daki Overall Score yüzdesini okur (ör. "40%"). */
  async overallScore(dialog) {
    return dialog.evaluate((d) => {
      const m = (d.innerText || '').match(/Overall Score\s*(\d+)%/i);
      return m ? Number(m[1]) : null;
    });
  }
}
