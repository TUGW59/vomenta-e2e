// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Yeni Kampanya sihirbazı (`/campaigns/create`) sayfa nesnesi.
 *
 * Keşif notları: docs/kampanyalar-kesif/NOTLAR.md §4 (6 adımlı stepper).
 * Adımlar: Type → Contacts → Channel → Schedule → Retry & Pacing → Review.
 *
 * NOT: Bu sayfayı SUBMIT etmek bir MUTATION'dır (`POST /api/v1/campaigns`).
 * Yalnızca `@mutation` + `mutationGuard` + `cleanup` ile ve staging/ayrılmış
 * hesapta çalıştırılır. Yapı testleri submit ETMEDEN yürür.
 */
export class CampaignCreatePage extends BasePage {
  static STEPS = ['Type', 'Contacts', 'Channel', 'Schedule', 'Retry & Pacing', 'Review'];

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/campaigns/create');
    this.heading = page.getByRole('heading', { name: 'Create Campaign' });
    this.nameInput = page.getByPlaceholder(/Spring Promo/i);
    this.descriptionInput = page.getByPlaceholder(/Brief description of the campaign/i);
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    this.createButton = page.getByRole('button', { name: 'Create Campaign', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Stepper'daki adım etiketini döner. */
  step(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  channelCard(name) {
    return this.page.getByText(name, { exact: true });
  }

  /**
   * Sonraki adıma geçer. Sabit bekleme YOK: adım geçişi, çağıran tarafın bir
   * sonraki adıma özgü elemanla etkileşmesiyle (Playwright auto-wait) doğrulanır.
   */
  async next() {
    await expect(this.nextButton).toBeEnabled();
    await this.nextButton.click();
  }

  // ── Adım doldurma yardımcıları (yalnız @mutation akışında submit'e kadar) ──

  /** Adım 1 — Type. */
  async fillType(name) {
    await this.nameInput.fill(name);
  }

  /** Adım 2 — Contacts: kayıtlı gruptan seç. */
  async chooseContactGroup(groupNameRegex) {
    await this.page.getByText('Contact Group', { exact: true }).click();
    const combo = this.page.locator('main [role=combobox]').first();
    await combo.click();
    await this.page.getByRole('option', { name: groupNameRegex }).first().click();
  }

  /** Adım 3 — Channel (Voice): caller ID + queue (Voice'ta zorunlu). */
  async fillVoiceChannel() {
    const pick = async (labelText, avoid) => {
      const combo = this.page
        .locator(`main :text-is("${labelText}")`)
        .locator('xpath=following::*[@role="combobox"][1]')
        .first();
      await combo.click();
      const opts = await this.page.locator('[role=option]').allTextContents();
      let i = opts.findIndex((o) => !avoid.test(o));
      if (i < 0) i = 0;
      await this.page.locator('[role=option]').nth(i).click();
    };
    await pick('Caller ID Number', /None|manually/i);
    await pick('Assign to Queue', /^None$/i);
  }

  /**
   * Adım 4 — Schedule: "Schedule Once" (varsayılan) + uzak-gelecek başlangıç
   * tarihi (kampanya HEMEN aramasın diye; "Send Now" bilinçle seçilmez).
   */
  async scheduleForFuture(dateISO = '2030-01-01') {
    await this.page.locator('main input[type="date"]').first().fill(dateISO);
  }

  /** Adım 6 — Review: kampanyayı oluştur (MUTATION). */
  async submit() {
    await expect(this.createButton).toBeEnabled();
    await this.createButton.click();
  }
}
