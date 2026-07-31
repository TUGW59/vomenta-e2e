// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * İş Gücü › CSAT anketleri (`/workforce/surveys`) sayfa nesnesi.
 *
 * ÖNEMLİ — YAPI DEĞİŞİKLİĞİ (30 Tem 2026 canlı gözlem): İş Gücü artık tek sayfa +
 * Radix sekmeler DEĞİL; her alt bölüm ayrı bir rotadır (`/workforce/surveys`,
 * `/workforce/badges`, `/workforce/evaluations`, `/workforce/schedules`, …).
 * Eski `WorkforcePage` sekme tabanlı gezinme bu yeni yapıya karşı kırıktır.
 *
 * Yaşam döngüsü CANLIDA doğrulandı (test hesabı, Tuğçe Topuz tenant'ı):
 *   oluştur (Anket oluştur → Gönder) → görüntüle (Sonuçlar) → düzenle
 *   (Anketi düzenle → Kaydet) → sil (çöp ikon → "Anketi sil" onay → Sil).
 * Uçlar: GET/POST `…/wfm/gamification/surveys`,
 *   PATCH/DELETE `…/surveys/{id}`, GET `…/surveys/{id}/responses`.
 *
 * BULGU (a11y): satır düzenle (kalem) ve sil (çöp) ikon-butonlarının
 *   erişilebilir adı YOK → satır-içi yapısal seçim gerekiyor (aşağıya bkz.).
 *
 * Dile dayanıklılık: taze bağlam İngilizce açılır; etiketler EN|TR regex ile
 *   eşleştirilir (canlı gözlem Türkçe idi, İngilizce varsayılan hâlâ İngilizce).
 */
export class WorkforceSurveysPage extends BasePage {
  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı). */
  static API = {
    surveys: '/api/v1/wfm/gamification/surveys',
    responses: (id) => `/api/v1/wfm/gamification/surveys/${id}/responses`,
  };

  /** EN|TR etiket regex'leri (varsayılan İngilizce, canlı gözlem Türkçe). */
  static L = {
    createButton: /^(Create survey|Anket oluştur)$/,
    resultsButton: /^(Results|Sonuçlar)$/,
    submit: /^(Submit|Create|Save|Gönder)$/,
    save: /^(Save|Kaydet)$/,
    cancel: /^(Cancel|İptal)$/,
    editHeading: /^(Edit survey|Anketi düzenle)$/,
    deleteHeading: /^(Delete survey|Anketi sil)$/,
    deleteConfirm: /^(Delete|Sil)$/,
    heading: /(CSAT Surveys|CSAT anketleri)/i,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/workforce/surveys');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WorkforceSurveysPage.L.heading, {
      timeout: 30000,
    });
  }

  createButton() {
    return this.page.getByRole('button', { name: WorkforceSurveysPage.L.createButton });
  }

  dialog() {
    return this.page.getByRole('dialog');
  }

  /** "Anketler" tablosundaki bir anket satırı (ada göre; sıralamadan bağımsız). */
  rowByName(name) {
    return this.page.getByRole('row', { hasText: name });
  }

  /**
   * Bir satırın çöp (sil) ikon-butonu. A11y BULGUSU: erişilebilir adı yok →
   * satırdaki son buton olarak konumdan seçiyoruz (Sonuçlar · kalem · çöp).
   */
  deleteIconFor(name) {
    return this.rowByName(name).getByRole('button').last();
  }

  /**
   * Bir satırın kalem (düzenle) ikon-butonu. A11y BULGUSU: adı yok → "Sonuçlar"
   * (adlı) ile çöp (son) arasındaki orta ikon.
   */
  editIconFor(name) {
    return this.rowByName(name).getByRole('button').nth(1);
  }

  resultsButtonFor(name) {
    return this.rowByName(name).getByRole('button', {
      name: WorkforceSurveysPage.L.resultsButton,
    });
  }

  // — Oluştur —

  async openCreateDialog() {
    await this.createButton().click();
    const d = this.dialog();
    await expect(d.getByRole('textbox').first()).toBeVisible({ timeout: 10000 });
    return d;
  }

  /**
   * Create formunu doldurur (yalnız Ad zorunlu; diğerlerinin makul varsayılanları var:
   * Kanallar=WEBCHAT, Tetikleyici=CONVERSATION_RESOLVED, Sorular=örnek JSON).
   */
  async fillSurveyName(dialog, name) {
    const nameField = dialog.getByRole('textbox').first();
    await nameField.click();
    await nameField.fill(name);
  }

  /** Create formunu gönderir; oluşturulan satırın tabloda göründüğünü doğrular. */
  async submitCreate(dialog, name) {
    await dialog.getByRole('button', { name: WorkforceSurveysPage.L.submit }).first().click();
    await expect(this.rowByName(name)).toBeVisible({ timeout: 15000 });
  }

  // — Görüntüle (Sonuçlar) —

  /** Sonuçlar diyaloğunu açar; başlık = anket adı, yanıt tablosu görünür. */
  async openResults(name) {
    await this.resultsButtonFor(name).click();
    const d = this.dialog();
    await expect(d.getByRole('heading', { name })).toBeVisible({ timeout: 10000 });
    return d;
  }

  // — Düzenle —

  async openEditDialog(name) {
    await this.editIconFor(name).click();
    const d = this.dialog();
    await expect(
      d.getByRole('heading', { name: WorkforceSurveysPage.L.editHeading })
    ).toBeVisible({ timeout: 10000 });
    return d;
  }

  /** Edit diyaloğunda Ad'ı değiştirip Kaydet; yeni adın tabloda göründüğünü doğrular. */
  async renameTo(dialog, newName) {
    const nameField = dialog.getByRole('textbox').first();
    await nameField.click();
    await nameField.fill(newName);
    await dialog.getByRole('button', { name: WorkforceSurveysPage.L.save }).click();
    await expect(this.rowByName(newName)).toBeVisible({ timeout: 15000 });
  }

  // — Sil —

  /** Çöp ikon → onay diyaloğu ("Anketi sil") → Sil; satırın kaybolduğunu doğrular. */
  async deleteByName(name) {
    const row = this.rowByName(name);
    if ((await row.count()) === 0) return; // idempotent cleanup
    await this.deleteIconFor(name).click();
    const confirm = this.dialog();
    await expect(
      confirm.getByRole('heading', { name: WorkforceSurveysPage.L.deleteHeading })
    ).toBeVisible({ timeout: 10000 });
    await confirm.getByRole('button', { name: WorkforceSurveysPage.L.deleteConfirm }).click();
    await expect(this.rowByName(name)).toHaveCount(0, { timeout: 15000 });
  }

  /**
   * Adında verilen metni (ör. benzersiz taban-token) taşıyan anket satırı sayısı.
   * Sayfayı açar → sayar. Rename sonrası da token korunduğu için baseline stabildir.
   */
  async countContaining(token) {
    await this.open();
    return this.page.getByRole('row').filter({ hasText: token }).count();
  }

  /**
   * Adında verilen token'ı taşıyan TÜM anketleri siler (idempotent cleanup).
   * Rollback güvenli olsun diye rename'den bağımsız çalışır; sonsuz döngüye karşı
   * üst sınır taşır.
   */
  async deleteAllContaining(token) {
    await this.open();
    for (let guard = 0; guard < 25; guard += 1) {
      const rows = this.page.getByRole('row').filter({ hasText: token });
      const count = await rows.count();
      if (count === 0) return;
      await rows.first().getByRole('button').last().click();
      const confirm = this.dialog();
      await confirm
        .getByRole('button', { name: WorkforceSurveysPage.L.deleteConfirm })
        .click();
      await expect(rows).toHaveCount(count - 1, { timeout: 15000 });
    }
  }
}
