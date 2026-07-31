// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * İş Gücü › Rozetler ve oyunlaştırma (`/workforce/badges`) sayfa nesnesi.
 *
 * Yapı (30 Tem 2026 canlı gözlem, test hesabı):
 *  - Başlık "Rozetler ve oyunlaştırma"; iki sekme: Rozetler / Sıralama (liderlik).
 *  - "Rozet oluştur": Ad + Kategori (vars. quality) + Puan (vars. 10) → Kaydet.
 *    Oluşturma CANLIDA doğrulandı (toast "Rozet oluşturuldu"). Uç:
 *    GET/POST `…/wfm/gamification/badges`.
 *  - "Rozet ver": Rozet (seçim) + Temsilci (seçim) + Neden (metin) → Ver.
 *    NOT gönderildi — gerçek temsilciye rozet atar + bildirim gider.
 *
 * BULGU (kritik): Rozet satırlarında DÜZENLE / SİL kontrolü YOK. Rozetler UI'dan
 *   yalnızca oluşturulabiliyor; kaldırılamıyor → oluşturulan test rozeti orphan
 *   kalır. Bu yüzden L3 create yaşam döngüsü (0→1→0) UI'dan kapatılamaz ve
 *   ilgili mutation spec'i `test.fixme` + mutation-lifecycle istisnasıdır.
 */
export class WorkforceBadgesPage extends BasePage {
  static API = {
    badges: '/api/v1/wfm/gamification/badges',
  };

  static L = {
    createButton: /^(Create badge|Rozet oluştur)$/,
    awardButton: /^(Award badge|Rozet ver)$/,
    save: /^(Save|Kaydet)$/,
    award: /^(Award|Ver)$/,
    cancel: /^(Cancel|İptal)$/,
    heading: /(Badges|Rozetler)/i,
    tabBadges: /^(Badges|Rozetler)$/,
    tabLeaderboard: /^(Leaderboard|Sıralama)$/,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/workforce/badges');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WorkforceBadgesPage.L.heading, {
      timeout: 30000,
    });
  }

  createButton() {
    return this.page.getByRole('button', { name: WorkforceBadgesPage.L.createButton });
  }

  awardButton() {
    return this.page.getByRole('button', { name: WorkforceBadgesPage.L.awardButton });
  }

  dialog() {
    return this.page.getByRole('dialog');
  }

  leaderboardTab() {
    return this.page.getByRole('tab', { name: WorkforceBadgesPage.L.tabLeaderboard });
  }

  rowByName(name) {
    return this.page.getByRole('row', { hasText: name });
  }

  // — Oluştur —

  async openCreateDialog() {
    await this.createButton().click();
    const d = this.dialog();
    await expect(d.getByRole('textbox').first()).toBeVisible({ timeout: 10000 });
    return d;
  }

  async fillBadgeName(dialog, name) {
    const nameField = dialog.getByRole('textbox').first();
    await nameField.click();
    await nameField.fill(name);
  }

  /** Create formunu gönderir; oluşturulan rozetin tabloda göründüğünü doğrular. */
  async submitCreate(dialog, name) {
    await dialog.getByRole('button', { name: WorkforceBadgesPage.L.save }).click();
    await expect(this.rowByName(name)).toBeVisible({ timeout: 15000 });
  }

  // — Ver (Award) — yalnız diyalog açma (L1); Ver gönderilmez (dışa dönük etki). —

  async openAwardDialog() {
    await this.awardButton().click();
    const d = this.dialog();
    await expect(d.getByRole('combobox').first()).toBeVisible({ timeout: 10000 });
    return d;
  }
}
