// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Kampanyalar → Şablonlar (`/campaigns/templates`) sayfa nesnesi.
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/templates/NOTLAR.md (PII-maskeli artefaktlar).
 * Canlı gözlem: 29 Tem 2026. Sayfa taze bağlamda İngilizce açılır; dil değiştirici
 * AppShell'dedir ve seçim sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar).
 */
export class TemplatesPage extends BasePage {
  /** Dört dilde canlı gözlemlenen sayfa-düzeyi çeviriler (29 Tem 2026). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr',
      heading: 'SMS Templates',
      subtitle: 'Manage reusable SMS message templates for your campaigns.',
      newButton: 'New Template',
      headers: ['Template Name', 'Message Body', 'Created at'],
      createDialogTitle: 'Create Template',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr',
      heading: 'SMS Şablonları',
      subtitle: 'Kampanyalarınız için yeniden kullanılabilir SMS mesaj şablonlarını yönetin.',
      newButton: 'Yeni Şablon',
      headers: ['Şablon Adı', 'Mesaj İçeriği', 'Oluşturulma'],
      createDialogTitle: null, // keşifte gözlemlenmedi
    },
    fr: {
      endonym: 'Français', dir: 'ltr',
      heading: 'Modèles SMS',
      subtitle: 'Gérez les modèles de messages SMS réutilisables pour vos campagnes.',
      newButton: 'Nouveau modèle',
      headers: ['Nom du modèle', 'Corps du message', 'Créé le'],
      createDialogTitle: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl',
      heading: 'قوالب الرسائل القصيرة',
      subtitle: 'إدارة قوالب رسائل SMS القابلة لإعادة الاستخدام لحملاتك.',
      newButton: 'قالب جديد',
      headers: ['اسم القالب', 'نص الرسالة', 'تاريخ الإنشاء'],
      createDialogTitle: null,
    },
  };

  /** Kontrollerin vurduğu backend uçları (Network ile doğrulandı). */
  static API = {
    list: '/api/v1/channels/templates/sms',
    create: '/api/v1/channels/templates/sms', // POST
    // Düzenle/sil: /api/v1/channels/templates/sms/{id} (PUT/PATCH/DELETE)
    itemGlob: '**/api/v1/channels/templates/sms/*',
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/campaigns/templates');
    const I = TemplatesPage.I18N.en;
    this.heading = page.getByRole('heading', { level: 1 });
    this.newButton = page.getByRole('button', { name: I.newButton, exact: true });
    this.table = page.locator('table');
    this.rows = page.locator('tbody tr');
    this.dialog = page.getByRole('dialog').first();
    this.confirmDialog = page.getByRole('alertdialog').or(page.getByRole('dialog')).first();
  }

  /** İngilizce açılır; başlık + ilk satır (veri) yerleşene kadar bekler. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(TemplatesPage.I18N.en.heading, { timeout: 30000 });
    await expect(this.rows.first().locator('td').first()).toHaveText(/\S/, { timeout: 30000 });
  }

  buttonFor(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  async openCreateDialog(name = TemplatesPage.I18N.en.newButton) {
    await this.buttonFor(name).click();
    await expect(this.dialog).toBeVisible({ timeout: 10000 });
    return this.dialog;
  }

  // Create/Edit dialog alanları.
  get nameInput() {
    return this.dialog.getByPlaceholder('e.g. Welcome Message');
  }
  /** Mesaj gövdesi textbox'ı: adın dışındaki ikinci textbox (placeholder sızıntısı BULGU A). */
  get bodyInput() {
    return this.dialog.getByRole('textbox').nth(1);
  }
  get createSubmit() {
    return this.dialog.getByRole('button', { name: 'Create', exact: true });
  }
  get dialogCancel() {
    return this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  /**
   * Satır işlem ikon düğmeleri. BULGU B (a11y): erişilebilir isimleri yok →
   * konuma çapalanır (0 = Edit, 1 = Delete). Frontend'den `data-testid` isteniyor.
   * @param {import('@playwright/test').Locator} row
   * @param {'edit'|'delete'} kind
   */
  rowAction(row, kind) {
    return row.locator('button').nth(kind === 'edit' ? 0 : 1);
  }

  /** Ada göre şablon satırı. */
  row(name) {
    return this.rows.filter({ hasText: name }).first();
  }
}
