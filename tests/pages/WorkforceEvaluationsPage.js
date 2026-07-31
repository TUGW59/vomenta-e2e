// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * İş Gücü › Kalite değerlendirmeleri (`/workforce/evaluations`) sayfa nesnesi.
 *
 * Yapı (30 Tem 2026 canlı gözlem, test hesabı):
 *  - Başlık "Kalite değerlendirmeleri"; boş-durum "Henüz değerlendirme yok."
 *  - Butonlar: "Değerlendirme Oluştur" (manuel) + "YZ Değerlendirmesi Başlat".
 *  - Tablo kolonları: Puan · Temsilci · Değerlendirici · Tür · Tarih · YZ · İşlemler.
 *  - "Kalite Değerlendirmesi Oluştur" formu: Interaction ID (gerçek çağrı/konuşma
 *    ID'si) · Interaction Type (seçim) · Agent (seçim) · Puan % (0–100) ·
 *    Form Verileri (JSON) · Geri Bildirim → Değerlendirme Oluştur.
 *
 * NEDEN L3 FIXME: Manuel oluşturma GERÇEK bir etkileşim ID'si + gerçek temsilci
 *   gerektirir (dışa dönük, gerçek veriye bağlı) ve tablo boş olduğundan satır
 *   "İşlemler" (düzenle/sil) yolu prod'da gözlemlenemedi. Bu yüzden create→sil
 *   yaşam döngüsü staging'de kanıtlanana kadar mutation spec'i `test.fixme` +
 *   mutation-lifecycle istisnasıdır. Uç: GET/POST `…/wfm/evaluations`.
 */
export class WorkforceEvaluationsPage extends BasePage {
  static API = {
    evaluations: '/api/v1/wfm/evaluations',
  };

  static L = {
    createButton: /^(Create Evaluation|Değerlendirme Oluştur)$/,
    aiButton: /^(Start AI Evaluation|YZ Değerlendirmesi Başlat)$/,
    submit: /^(Create Evaluation|Değerlendirme Oluştur)$/,
    cancel: /^(Cancel|İptal)$/,
    heading: /(Quality [Ee]valuations|Kalite değerlendirmeleri)/,
    createHeading: /(Create Quality Evaluation|Kalite Değerlendirmesi Oluştur)/,
    emptyState: /(No evaluations yet|Henüz değerlendirme yok)/,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/workforce/evaluations');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WorkforceEvaluationsPage.L.heading, {
      timeout: 30000,
    });
  }

  createButton() {
    return this.page.getByRole('button', { name: WorkforceEvaluationsPage.L.createButton });
  }

  aiButton() {
    return this.page.getByRole('button', { name: WorkforceEvaluationsPage.L.aiButton });
  }

  dialog() {
    return this.page.getByRole('dialog');
  }

  /** Manuel değerlendirme oluşturma diyaloğunu açar (L1). */
  async openCreateDialog() {
    await this.createButton().click();
    const d = this.dialog();
    await expect(
      d.getByRole('heading', { name: WorkforceEvaluationsPage.L.createHeading })
    ).toBeVisible({ timeout: 10000 });
    return d;
  }
}
