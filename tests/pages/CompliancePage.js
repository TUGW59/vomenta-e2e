// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Uyumluluk ve Veri Gizliliği (`/settings/compliance`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Çok bölümlü pano: Data Retention özeti (+link) · GDPR Compliance bilgi · Audit Logs tablo
 * (+View More) · Consent Records (Log Consent + satır Revoke) · GDPR Requests (Create Request).
 * Sekme YOK. Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Log Consent / Revoke / Create Request production'da TIKLANMAZ (kalıcı uyumluluk
 * kaydı / yasal onay değiştirir; UI'da silme yok → zero-orphan temizliği yapılamaz). Dialoglar
 * yalnızca AÇILIR + boş-submit disabled doğrulanır. L3 kalıcı kayıt staging'e bırakıldı.
 */
export class CompliancePage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Compliance & Data Privacy',
      subtitle: 'Manage data retention, GDPR requests, and consent records',
      logConsent: 'Log Consent', createRequest: 'Create Request', revoke: 'Revoke',
      sections: ['Data Retention', 'GDPR Compliance', 'Audit Logs', 'Consent Records', 'GDPR Requests'],
      logConsentDialog: 'Log Consent Record', createRequestDialog: 'Create GDPR Request',
      manageRetention: 'Manage Retention', viewMore: 'View More',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Uyumluluk ve Veri Gizliliği',
      subtitle: 'Veri saklama, KVKK/GDPR talepleri ve onay kayıtlarını yönetin',
      logConsent: 'Onay Kaydet', createRequest: 'Talep Oluştur', revoke: 'İptal Et',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Conformité et protection des données',
      subtitle: 'Gérez la rétention des données, les demandes RGPD et les consentements',
      logConsent: 'Enregistrer un consentement', createRequest: 'Créer une demande', revoke: 'Révoquer',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الامتثال وخصوصية البيانات',
      subtitle: 'إدارة الاحتفاظ بالبيانات وطلبات GDPR وسجلات الموافقة',
      logConsent: 'تسجيل الموافقة', createRequest: 'إنشاء طلب', revoke: 'إلغاء',
    },
  };

  /** Backend uçları (Network incelemesiyle doğrulandı, 29 Tem 2026). */
  static API = {
    consent: '/api/v1/compliance/consent',
    gdpr: '/api/v1/compliance/gdpr/requests',
    retention: '/api/v1/compliance/data-retention',
    audit: '/api/v1/compliance/audit-logs',
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/compliance');
    this.heading = page.getByRole('heading', { level: 1 });
    this.logConsentButton = page.getByRole('button', { name: CompliancePage.I18N.en.logConsent, exact: true });
    this.createRequestButton = page.getByRole('button', { name: CompliancePage.I18N.en.createRequest, exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(CompliancePage.I18N.en.heading, { timeout: 30000 });
  }

  /** Verilen tetikleyici butonla bir dialog açar ve döndürür (Radix tıklama-yutma toleranslı). */
  async openDialog(button) {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await button.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
