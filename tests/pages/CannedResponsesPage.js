// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Hazır Yanıtlar (`/settings/canned-responses`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Arama + "New canned response" dialog + tablo (Title/Shortcode/Preview/Category; boş-durum).
 * Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: New canned response / Create production'da GÖNDERİLMEZ.
 */
export class CannedResponsesPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Canned Responses',
      subtitle: 'Quick-reply text snippets for the inbox chat — agents can insert these during live conversations.',
      create: 'New canned response', dialogTitle: 'Create canned response',
      columns: ['Title', 'Shortcode', 'Preview', 'Category'],
      empty: 'No canned responses yet',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Hazır yanıtlar',
      subtitle: 'Gelen kutusu sohbeti için hızlı yanıt metin parçacıkları — temsilciler canlı görüşmeler sırasında bunları ekleyebilir.',
      create: 'Yeni hazır yanıt', dialogTitle: null,
      columns: ['Başlık', 'Kısayol', 'Önizleme', 'Kategori'], empty: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Réponses prédéfinies',
      subtitle: 'Extraits de texte de réponse rapide pour la boîte de réception — les agents peuvent les insérer lors des conversations en direct.',
      create: 'Nouvelle réponse prédéfinie', dialogTitle: null,
      columns: ['Titre', 'Raccourci', 'Aperçu', 'Catégorie'], empty: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'ردود جاهزة',
      subtitle: 'نصوص رد سريعة لصندوق الوارد — يمكن للوكلاء إدراجها أثناء المحادثات المباشرة.',
      create: 'رد جاهز جديد', dialogTitle: null,
      columns: ['العنوان', 'الاختصار', 'معاينة', 'الفئة'], empty: null,
    },
  };

  static API = { canned: '/api/v1/chat/canned-responses' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/canned-responses');
    this.heading = page.getByRole('heading', { level: 1 });
    this.createButton = page.getByRole('button', { name: CannedResponsesPage.I18N.en.create, exact: true });
    this.searchInput = page.getByRole('textbox').first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(CannedResponsesPage.I18N.en.heading, { timeout: 30000 });
  }

  async openCreateDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.createButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
