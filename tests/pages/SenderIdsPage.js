// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Kampanyalar → Gönderici Kimlikleri (`/campaigns/sender-ids`) sayfa nesnesi.
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/sender-ids/NOTLAR.md (PII-maskeli artefaktlar).
 * Canlı gözlem: 29 Tem 2026. Sayfa taze bağlamda İngilizce açılır; dil değiştirici
 * AppShell'dedir ve seçim sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar).
 */
export class SenderIdsPage extends BasePage {
  /** Dört dilde canlı gözlemlenen çeviriler (29 Tem 2026). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr',
      heading: 'Sender IDs',
      subtitle: 'Manage SMS Sender IDs for outbound campaigns. New IDs require platform admin approval.',
      requestButton: 'Request Sender ID',
      filterAll: 'All Status',
      headers: ['Sender ID', 'Type', 'Status', 'Purpose', 'Requested By', 'Review Note', 'Created at', 'Actions'],
      dialogTitle: 'Request Sender ID',
      emptyState: 'No sender IDs found',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr',
      heading: 'Gönderici Kimlikleri',
      subtitle: 'Giden kampanyalar için SMS Gönderici Kimliklerini yönetin. Yeni kimlikler platform yönetici onayı gerektirir.',
      requestButton: 'Gönderici Kimliği Talep Et',
      filterAll: 'Tüm Durumlar',
      headers: ['Gönderici Kimliği', 'Tür', 'Durum', 'Amaç', 'Talep Eden', 'İnceleme Notu', 'Oluşturulma', 'İşlemler'],
      dialogTitle: 'Gönderici Kimliği Talep Et',
      emptyState: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr',
      heading: "Identifiants d'expéditeur",
      subtitle: "Gérer les identifiants d'expéditeur SMS pour les campagnes sortantes. Les nouveaux ID nécessitent l'approbation de l'administrateur.",
      requestButton: "Demander un identifiant d'expéditeur",
      filterAll: 'Tous les statuts',
      headers: ["Identifiant d'expéditeur", 'Type', 'Statut', 'Objectif', 'Demandé par', 'Note de révision', 'Créé le', 'Actions'],
      dialogTitle: "Demander un identifiant d'expéditeur",
      emptyState: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl',
      heading: 'معرفات المرسل',
      subtitle: 'إدارة معرفات مرسل SMS للحملات الصادرة. تتطلب المعرفات الجديدة موافقة مسؤول المنصة.',
      requestButton: 'طلب معرف مرسل',
      filterAll: 'جميع الحالات',
      headers: ['معرف المرسل', 'النوع', 'الحالة', 'الغرض', 'طُلب بواسطة', 'ملاحظة المراجعة', 'تاريخ الإنشاء', 'إجراءات'],
      dialogTitle: 'طلب معرف مرسل',
      emptyState: null,
    },
  };

  /** Durum filtresi (İngilizce etiket → API ENUM). Keşifte doğrulandı. */
  static STATUS_OPTIONS = [
    { label: 'All Status', enum: null },
    { label: 'Pending', enum: 'PENDING' },
    { label: 'Approved', enum: 'APPROVED' },
    { label: 'Rejected', enum: 'REJECTED' },
    { label: 'Docs Requested', enum: 'DOCUMENTS_REQUESTED' },
  ];

  /** Request dialogu Tür (senderType) seçenekleri. */
  static TYPE_OPTIONS = ['Alphanumeric', 'Numeric', 'Shortcode'];

  /** Kontrollerin vurduğu backend uçları (Network ile doğrulandı). */
  static API = {
    list: '/api/v1/sender-ids',
    create: '/api/v1/sender-ids', // POST (mutation)
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/campaigns/sender-ids');
    const I = SenderIdsPage.I18N.en;
    this.heading = page.getByRole('heading', { level: 1 });
    this.requestButton = page.getByRole('button', { name: I.requestButton, exact: true });
    // Sayfadaki tek combobox = durum filtresi.
    this.statusFilter = page.getByRole('combobox').first();
    this.table = page.locator('table');
    this.rows = page.locator('tbody tr');
    this.emptyState = page.getByText(I.emptyState, { exact: true });
    // Request Sender ID modal dialogu.
    this.dialog = page.getByRole('dialog').first();
  }

  /** İngilizce açılır; başlık + liste (satır ya da boş-durum) yerleşene kadar bekler. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(SenderIdsPage.I18N.en.heading, { timeout: 30000 });
    // Liste iskeletten çıkana kadar bekle: ilk satır metni VEYA boş-durum görünür olmalı.
    await expect(async () => {
      const rows = await this.rows.count();
      if (rows > 0) {
        await expect(this.rows.first().locator('td').first()).toHaveText(/\S/, { timeout: 5000 });
      } else {
        await expect(this.emptyState).toBeVisible({ timeout: 5000 });
      }
    }).toPass({ timeout: 30000 });
  }

  requestButtonFor(name = SenderIdsPage.I18N.en.requestButton) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Durum filtresinde bir seçeneğe geçer (Radix Select). */
  async selectStatus(label) {
    await expect(async () => {
      await this.statusFilter.click();
      await this.page.getByRole('option', { name: label, exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(this.statusFilter).toHaveText(label, { timeout: 5000 });
  }

  /** Request Sender ID dialogunu açar ve görünür olduğunu doğrular. */
  async openRequestDialog(name = SenderIdsPage.I18N.en.requestButton) {
    await this.requestButtonFor(name).click();
    await expect(this.dialog).toBeVisible({ timeout: 10000 });
    return this.dialog;
  }

  /** Dialog alanları (erişilebilir placeholder/role ile). */
  get senderIdInput() {
    return this.dialog.getByPlaceholder('e.g. MYCOMPANY');
  }
  get purposeInput() {
    return this.dialog.getByPlaceholder('Describe how this Sender ID will be used...');
  }
  get typeSelect() {
    return this.dialog.getByRole('combobox').first();
  }
  get submitButton() {
    return this.dialog.getByRole('button', { name: 'Submit Request', exact: true });
  }
  get cancelButton() {
    return this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  /** Belirli statü rozetini taşıyan satır sayısı (L3 doğruluğu için). */
  statusBadge(text) {
    return this.page.locator('tbody').getByText(text, { exact: true });
  }
}
