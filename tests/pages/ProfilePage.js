// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Profil (`/settings/profile`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Sayfa taze bağlamda İngilizce açılır; dil seçimi sunucuda kalıcı DEĞİLDİR
 * (her test İngilizce başlar). Tek dil switch güvenilirdir.
 *
 * GÜVENLİK: Bu sayfadaki veri-değiştiren kontroller (Save changes, Update Password,
 * Enable 2FA, Request reset email, Revoke) production'da TIKLANMAZ. Geri-döndürülebilir
 * Telefon düzenlemesi yalnız staging'de (mutationGuard) → settings-profile-mutations spec.
 */
export class ProfilePage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Profile',
      tabs: ['Profile', 'Security', 'Sessions', 'Notifications'],
      sig: {
        Profile: 'Personal Information',
        Security: 'Change Password',
        Sessions: 'Active Sessions',
        Notifications: 'Notification Preferences',
      },
      firstName: 'First name', saveChanges: 'Save changes',
      changePassword: 'Change Password', enable2fa: 'Enable 2FA',
      revoke: 'Revoke', notifLink: 'Open notification settings',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Profil',
      tabs: ['Profil', 'Güvenlik', 'Oturumlar', 'Bildirimler'],
      sig: {
        Profile: 'Kişisel bilgiler',
        Security: 'Şifre değiştir',
        Sessions: 'Aktif oturumlar',
        Notifications: 'Bildirim tercihleri',
      },
      firstName: 'Ad', saveChanges: 'Değişiklikleri kaydet',
      changePassword: 'Şifre değiştir', enable2fa: "2FA'yı aç",
      revoke: 'Sonlandır', notifLink: 'Bildirim ayarlarını aç',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Profil',
      tabs: ['Profil', 'Sécurité', 'Sessions', 'Notifications'],
      sig: {
        Profile: 'Informations personnelles',
        Security: 'Changer le mot de passe',
        Sessions: 'Sessions actives',
        Notifications: 'Préférences de notification',
      },
      firstName: 'Prénom', saveChanges: 'Enregistrer les modifications',
      changePassword: 'Changer le mot de passe', enable2fa: 'Activer la 2FA',
      revoke: 'Révoquer', notifLink: 'Ouvrir les paramètres de notification',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الملف الشخصي',
      tabs: ['الملف الشخصي', 'الأمان', 'الجلسات', 'الإشعارات'],
      sig: {
        Profile: 'المعلومات الشخصية',
        Security: 'تغيير كلمة المرور',
        Sessions: 'الجلسات النشطة',
        Notifications: 'تفضيلات الإشعارات',
      },
      firstName: 'الاسم الأول', saveChanges: 'حفظ التغييرات',
      changePassword: 'تغيير كلمة المرور', enable2fa: 'تفعيل',
      revoke: 'إلغاء', notifLink: 'فتح إعدادات الإشعارات',
    },
  };

  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı, 29 Tem 2026). */
  static API = {
    me: '/api/v1/auth/me', // profil verisi (GET) + Save changes (PATCH)
    sessions: '/api/v1/auth/sessions', // Sessions sekmesi tablosu (GET)
  };

  /** İngilizce sekme adları — mantıksal anahtar. */
  static TABS = ['Profile', 'Security', 'Sessions', 'Notifications'];

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/profile');
    this.heading = page.getByRole('heading', { level: 1 });
    this.saveChangesButton = page.getByRole('button', { name: ProfilePage.I18N.en.saveChanges, exact: true });
    this.firstNameInput = page.getByRole('textbox', { name: ProfilePage.I18N.en.firstName, exact: true });
    this.phoneInput = page.getByRole('textbox', { name: 'Phone', exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(ProfilePage.I18N.en.heading, { timeout: 30000 });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /**
   * Bir sekmeye tıklar ve seçili duruma geçtiğini doğrular.
   * Radix sekmelerinde tıklama yutulabildiğinden seçili olana kadar tekrar dener.
   */
  async selectTab(name) {
    const tab = this.tab(name);
    await expect(async () => {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return tab;
  }

  /** Aktif tabpanel içindeki metin (içerik imzası doğrulaması için). */
  panelText(text) {
    return this.page.getByText(text, { exact: false }).first();
  }

  /** Telefon alanının mevcut değerini okur (mutation baseline/restore için). */
  async phoneValue() {
    return (await this.phoneInput.inputValue())?.trim() ?? '';
  }

  /**
   * Telefon alanını yazıp **Save changes**'e basar ve PATCH /auth/me 2xx döndüğünü doğrular.
   * YALNIZ staging mutation spec'inde çağrılır (production'da tıklanmaz).
   * @param {string} phone E.164 telefon
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async savePhone(phone) {
    await this.phoneInput.fill(phone);
    const patch = this.page.waitForResponse(
      (r) => r.url().includes(ProfilePage.API.me) && r.request().method() === 'PATCH',
      { timeout: 15000 }
    );
    await this.saveChangesButton.click();
    const res = await patch;
    expect(res.ok(), `Save changes PATCH ${ProfilePage.API.me} 2xx döndürmeli`).toBeTruthy();
    return res;
  }
}
