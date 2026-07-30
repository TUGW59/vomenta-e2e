// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Settings hub (`/settings`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/). Canlı gözlem 30 Tem 2026.
 * Radix sekmeli hub: 6 sekme (Organization/Users/Billing & Usage/Security/API Keys/Modules).
 * Her sekme panelinde ilgili özet + ilgili "dedicated page" bağlantısı bulunur.
 *
 * GÜVENLİK / BİLİNEN HATA: Billing & Usage panelindeki "Change plan"/"Billing history"
 * ve Modules panelindeki "Manage Modules" bağlantıları kök route'a ("/") düşüyor
 * (hesap billing/modül iznine sahip değil → 403 → fallback). Bunlar known-bugs
 * paketinde guard'lı: SETTINGS-BILLING-CHANGEPLAN, SETTINGS-BILLING-HISTORY, B4.
 */
export class SettingsPage extends BasePage {
  static TABS = ['Organization', 'Users', 'Billing & Usage', 'Security', 'API Keys', 'Modules'];

  /** 4 dilde doğrulanmış başlık + sekme etiketleri (30 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Settings',
      tabs: ['Organization', 'Users', 'Billing & Usage', 'Security', 'API Keys', 'Modules'],
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Ayarlar',
      tabs: ['Organizasyon', 'Kullanıcılar', 'Faturalandırma ve Kullanım', 'Güvenlik', 'API Anahtarları', 'Modüller'],
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Paramètres',
      tabs: ['Organisation', 'Utilisateurs', 'Facturation et utilisation', 'Sécurité', 'Clés API', 'Modules'],
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الإعدادات',
      tabs: ['المؤسسة', 'المستخدمون', 'الفواتير والاستخدام', 'الأمان', 'مفاتيح API', 'الوحدات'],
    },
  };

  /**
   * Sekme panellerindeki "ilgili sayfaya git" bağlantıları (30 Tem 2026 canlı).
   * heading: hedef sayfanın beklenen H1 (assertDestinationLoaded için).
   * broken:true olanlar kök route'a düşüyor → known-bugs paketinde guard'lı.
   */
  static PANEL_LINKS = {
    Organization: { link: 'Go to Organization Settings', path: '/settings/organization', heading: 'Organization', broken: false },
    Security: { link: 'Go to Security Settings', path: '/settings/security', heading: 'Security', broken: false },
    'API Keys': { link: 'Create key', path: '/settings/api-keys', heading: 'API Keys', broken: false },
    'Billing & Usage': { link: 'Change plan', path: '/settings/billing', heading: null, broken: true },
    Modules: { link: 'Manage Modules', path: '/settings/billing/marketplace', heading: null, broken: true },
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings');
    this.heading = page.getByRole('heading', { level: 1 }).first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(SettingsPage.I18N.en.heading, { timeout: 30000 });
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
}
