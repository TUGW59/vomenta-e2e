// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Veri Saklama (`/settings/data-retention`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Config formu: 5 saklama-süresi spinbutton (Recordings/CDR/Chat/Voicemail/Audit) + Automatic
 * Cleanup switch + "Run cleanup now" (⚠️ veri siler) + "Save changes". Sekme/dialog YOK.
 *
 * GÜVENLİK: Run cleanup now / Save changes production'da TIKLANMAZ.
 */
export class DataRetentionPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Data Retention',
      subtitle: 'Configure how long different types of data are kept before automatic deletion',
      save: 'Save changes', runCleanup: 'Run cleanup now', section: 'Retention Periods',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Veri Saklama',
      subtitle: 'Farklı veri türlerinin ne kadar süre saklanacağını yapılandırın',
      save: 'Değişiklikleri kaydet', runCleanup: null, section: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Conservation des données',
      subtitle: 'Configurez la durée de conservation des différents types de données avant la suppression automatique',
      save: 'Enregistrer les modifications', runCleanup: 'Lancer le nettoyage maintenant', section: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الاحتفاظ بالبيانات',
      subtitle: 'إعداد مدة الاحتفاظ بأنواع البيانات المختلفة قبل الحذف التلقائي',
      save: 'حفظ التغييرات', runCleanup: 'تشغيل التنظيف الآن', section: null,
    },
  };

  static API = { retention: '/api/v1/compliance/data-retention' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/data-retention');
    this.heading = page.getByRole('heading', { level: 1 });
    this.saveButton = page.getByRole('button', { name: DataRetentionPage.I18N.en.save, exact: true });
    this.runCleanupButton = page.getByRole('button', { name: DataRetentionPage.I18N.en.runCleanup, exact: true });
    this.spinButtons = page.getByRole('spinbutton');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(DataRetentionPage.I18N.en.heading, { timeout: 30000 });
  }
}
