// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Güvenlik (`/settings/security`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Config sayfası: Password Policies (uzunluk/expiry + 3 switch + Save) · 2FA switch · Session
 * Management (timeout + Active Sessions + Revoke) · Login History · IP Whitelist (Add IP) ·
 * API Keys özet (link). Sekme YOK. Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Save/Revoke/Add IP/2FA production'da GÖNDERİLMEZ (hassas erişim config'i).
 */
export class SecurityPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Security',
      subtitle: 'Configure password policies, 2FA, sessions, and access controls',
      savePolicy: 'Save Password Policy', addIp: 'Add IP', ipDialog: 'Add IP to Whitelist',
      openContacts: 'Open Contacts', manageKeys: 'Manage API Keys',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Güvenlik',
      subtitle: "Şifre politikalarını, 2FA'yı, oturumları ve erişim kontrollerini yapılandırın",
      savePolicy: 'Şifre Politikasını Kaydet', addIp: 'IP Ekle', ipDialog: null,
      openContacts: null, manageKeys: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Sécurité',
      subtitle: "Configurez les politiques de mot de passe, la 2FA, les sessions et les contrôles d'accès",
      savePolicy: 'Enregistrer la politique de mot de passe', addIp: 'Ajouter une IP', ipDialog: null,
      openContacts: null, manageKeys: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الأمان',
      subtitle: 'إعداد سياسات كلمة المرور والمصادقة الثنائية والجلسات وضوابط الوصول',
      savePolicy: 'حفظ سياسة كلمة المرور', addIp: 'إضافة IP', ipDialog: null,
      openContacts: null, manageKeys: null,
    },
  };

  static API = { security: '/api/v1/settings/security', sessions: '/api/v1/auth/sessions', ipWhitelist: '/api/v1/settings/ip-whitelist' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/security');
    this.heading = page.getByRole('heading', { level: 1 });
    this.savePolicyButton = page.getByRole('button', { name: SecurityPage.I18N.en.savePolicy, exact: true });
    this.addIpButton = page.getByRole('button', { name: SecurityPage.I18N.en.addIp, exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(SecurityPage.I18N.en.heading, { timeout: 30000 });
  }

  async openAddIpDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.addIpButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
