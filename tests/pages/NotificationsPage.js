// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Bildirimler (`/settings/notifications`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Uzun tercih formu: Browser Push · Email Category Preferences (7 kategori switch) · Delivery
 * Channels (In-App/Email/Push, onlarca switch) · Save preferences. Sekme/dialog YOK.
 *
 * GÜVENLİK: Save preferences / switch / Enable push production'da TIKLANMAZ.
 */
export class NotificationsPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Notifications',
      subtitle: 'Configure notification preferences',
      save: 'Save preferences', enablePush: 'Enable push notifications',
      emailSection: 'Email Category Preferences', deliverySection: 'Delivery Channels',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Bildirimler',
      subtitle: 'Bildirim tercihlerini yapılandırın',
      save: 'Tercihleri kaydet', enablePush: 'Anlık bildirimleri etkinleştir',
      emailSection: null, deliverySection: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Notifications',
      subtitle: 'Configurez les préférences de notifications',
      save: 'Enregistrer les préférences', enablePush: 'Activer les notifications push',
      emailSection: null, deliverySection: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الإشعارات',
      subtitle: 'إعداد تفضيلات الإشعارات',
      save: 'حفظ التفضيلات', enablePush: 'تفعيل الإشعارات الفورية',
      emailSection: null, deliverySection: null,
    },
  };

  static API = { prefs: '/api/v1/notifications/preferences', emailPrefs: '/api/v1/notifications/email-preferences' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/notifications');
    this.heading = page.getByRole('heading', { level: 1 });
    this.saveButton = page.getByRole('button', { name: NotificationsPage.I18N.en.save, exact: true }).first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(NotificationsPage.I18N.en.heading, { timeout: 30000 });
  }
}
