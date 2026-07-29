// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/** Kampanyalar → Gönderici Kimlikleri (`/campaigns/sender-ids`) sayfa nesnesi. */
export class CampaignSenderIdsPage extends BasePage {
  static API = {
    list: '/api/v1/sender-ids',
    item: (id) => `/api/v1/sender-ids/${id}`,
    documents: (id) => `/api/v1/sender-ids/${id}/documents`,
  };

  /** 29 Tem 2026'da ayrılmış test tenant'ında gözlemlenen görünür sözleşme. */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Sender IDs',
      subtitle: 'Manage SMS Sender IDs for outbound campaigns. New IDs require platform admin approval.',
      request: 'Request Sender ID', allStatus: 'All Status',
      headers: ['Sender ID', 'Type', 'Status', 'Purpose', 'Requested By', 'Review Note', 'Created at', 'Actions'],
      formSubtitle: 'Submit a new Sender ID for approval. Approved IDs can be used in SMS campaigns.',
      senderLabel: 'Sender ID *', senderPlaceholder: 'e.g. MYCOMPANY',
      senderHelp: 'Alphanumeric (max 11 chars) or numeric',
      typeLabel: 'Type', defaultType: 'Alphanumeric',
      purposeLabel: 'Purpose', purposePlaceholder: 'Describe how this Sender ID will be used...',
      documentsLabel: 'Supporting Documents (optional)',
      chooseFiles: 'Choose Files', cancel: 'Cancel', submit: 'Submit Request',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Gönderici Kimlikleri',
      subtitle: 'Giden kampanyalar için SMS Gönderici Kimliklerini yönetin. Yeni kimlikler platform yönetici onayı gerektirir.',
      request: 'Gönderici Kimliği Talep Et', allStatus: 'Tüm Durumlar',
      headers: ['Gönderici Kimliği', 'Tür', 'Durum', 'Amaç', 'Talep Eden', 'İnceleme Notu', 'Oluşturulma', 'İşlemler'],
      formSubtitle: 'Onay için yeni bir Gönderici Kimliği gönderin. Onaylanan kimlikler SMS kampanyalarında kullanılabilir.',
      senderLabel: 'Gönderici Kimliği *', senderPlaceholder: 'e.g. MYCOMPANY',
      senderHelp: 'Alfanümerik (maks. 11 karakter) veya sayısal',
      typeLabel: 'Tür', defaultType: 'Alfanümerik',
      purposeLabel: 'Amaç', purposePlaceholder: 'Bu Gönderici Kimliğinin nasıl kullanılacağını açıklayın...',
      documentsLabel: 'Destekleyici belgeler (isteğe bağlı)',
      chooseFiles: 'Dosya seç', cancel: 'İptal', submit: 'Talebi Gönder',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: "Identifiants d'expéditeur",
      subtitle: "Gérer les identifiants d'expéditeur SMS pour les campagnes sortantes. Les nouveaux ID nécessitent l'approbation de l'administrateur.",
      request: "Demander un identifiant d'expéditeur", allStatus: 'Tous les statuts',
      headers: ["Identifiant d'expéditeur", 'Type', 'Statut', 'Objectif', 'Demandé par', 'Note de révision', 'Créé le', 'Actions'],
      formSubtitle: "Soumettre un nouvel identifiant d'expéditeur pour approbation. Les ID approuvés peuvent être utilisés dans les campagnes SMS.",
      senderLabel: "Identifiant d'expéditeur *", senderPlaceholder: 'e.g. MYCOMPANY',
      senderHelp: 'Alphanumérique (max 11 caractères) ou numérique',
      typeLabel: 'Type', defaultType: 'Alphanumérique',
      purposeLabel: 'Objectif', purposePlaceholder: "Décrivez comment cet identifiant d'expéditeur sera utilisé...",
      documentsLabel: 'Documents justificatifs (optionnel)',
      chooseFiles: 'Choisir des fichiers', cancel: 'Annuler', submit: 'Soumettre la demande',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'معرفات المرسل',
      subtitle: 'إدارة معرفات مرسل SMS للحملات الصادرة. تتطلب المعرفات الجديدة موافقة مسؤول المنصة.',
      request: 'طلب معرف مرسل', allStatus: 'جميع الحالات',
      headers: ['معرف المرسل', 'النوع', 'الحالة', 'الغرض', 'طُلب بواسطة', 'ملاحظة المراجعة', 'تاريخ الإنشاء', 'إجراءات'],
      formSubtitle: 'أرسل معرف مرسل جديد للموافقة. يمكن استخدام المعرفات الموافق عليها في حملات SMS.',
      senderLabel: 'معرف المرسل *', senderPlaceholder: 'e.g. MYCOMPANY',
      senderHelp: 'أبجدي رقمي (حد أقصى 11 حرف) أو رقمي',
      typeLabel: 'النوع', defaultType: 'أبجدي رقمي',
      purposeLabel: 'الغرض', purposePlaceholder: 'صف كيف سيتم استخدام معرف المرسل هذا...',
      documentsLabel: 'مستندات داعمة (اختياري)',
      chooseFiles: 'اختر الملفات', cancel: 'إلغاء', submit: 'إرسال الطلب',
    },
  };

  constructor(page) {
    super(page, '/campaigns/sender-ids');
    this.heading = page.getByRole('heading', { level: 1 });
    this.table = page.locator('table');
    this.rows = page.locator('tbody tr');
    this.statusFilter = page.getByRole('combobox').first();
    this.dialog = page.getByRole('dialog');
  }

  async open() {
    const loaded = this.page.waitForResponse(
      (response) => {
        const url = new URL(response.url());
        return url.pathname === CampaignSenderIdsPage.API.list &&
          response.request().method() === 'GET';
      },
      { timeout: 30_000 }
    );
    await super.open();
    await loaded;
    await expect(this.heading).toHaveText(CampaignSenderIdsPage.I18N.en.heading, {
      timeout: 30_000,
    });
  }

  requestButton(name = CampaignSenderIdsPage.I18N.en.request) {
    return this.page.getByRole('button', { name, exact: true });
  }

  row(senderId) {
    return this.rows.filter({ has: this.page.getByText(senderId, { exact: true }) });
  }

  async openRequest(name = CampaignSenderIdsPage.I18N.en.request) {
    await this.requestButton(name).click();
    await expect(this.dialog).toBeVisible();
    return this.dialog;
  }

  senderIdInput(placeholder = CampaignSenderIdsPage.I18N.en.senderPlaceholder) {
    return this.dialog.getByPlaceholder(placeholder, { exact: true });
  }

  senderType() {
    return this.dialog.getByRole('combobox');
  }

  purposeInput(placeholder = CampaignSenderIdsPage.I18N.en.purposePlaceholder) {
    return this.dialog.getByPlaceholder(placeholder, { exact: true });
  }

  fileInput() {
    return this.dialog.locator('input[type=file]');
  }

  submitButton(name = CampaignSenderIdsPage.I18N.en.submit) {
    return this.dialog.getByRole('button', { name, exact: true });
  }

  async selectStatus(name) {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  async selectSenderType(name) {
    await this.senderType().click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }
}
