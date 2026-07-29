// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Kuruluş (`/settings/organization`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Tek formlu sayfa (sekme yok): Company Information. "Save changes" formda değişiklik
 * olana kadar DISABLED (istemci-tarafı dirty kontrolü). Sayfa taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: "Save changes" production'da TIKLANMAZ (şirket verisini platform genelinde
 * değiştirir). Geri-döndürülebilir Website düzenlemesi yalnız staging'de:
 * tests/settings-organization-mutations.authed.spec.js.
 */
export class OrganizationPage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Organization',
      subtitle: 'Manage your company details and preferences',
      section: 'Company Information',
      companyName: 'Company name', website: 'Website', domain: 'Domain',
      save: 'Save changes',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Kuruluş',
      subtitle: 'Şirket bilgilerinizi ve tercihlerinizi yönetin',
      section: 'Şirket Bilgileri',
      companyName: 'Şirket adı', website: 'Web sitesi', domain: 'Alan Adı',
      save: 'Değişiklikleri kaydet',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Organisation',
      subtitle: 'Gérez les détails et préférences de votre entreprise',
      section: "Informations de l'entreprise",
      companyName: "Nom de l'entreprise", website: 'Site web', domain: 'Domaine',
      save: 'Enregistrer les modifications',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'المؤسسة',
      subtitle: 'إدارة تفاصيل شركتك وتفضيلاتها',
      section: 'معلومات الشركة',
      companyName: 'اسم الشركة', website: 'الموقع الإلكتروني', domain: 'النطاق',
      save: 'حفظ التغييرات',
    },
  };

  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı, 29 Tem 2026). */
  static API = {
    organization: '/api/v1/settings/organization', // GET (yükleme) + Save changes (PATCH/PUT)
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/organization');
    this.heading = page.getByRole('heading', { level: 1 });
    // "Company name *" — yıldız etiketin parçası; accessible name'e sızıyor → substring eşle.
    this.companyNameInput = page.getByRole('textbox', { name: /Company name/i });
    this.websiteInput = page.getByRole('textbox', { name: 'Website', exact: true });
    this.domainInput = page.getByRole('textbox', { name: 'Domain', exact: true });
    this.saveButton = page.getByRole('button', { name: OrganizationPage.I18N.en.save, exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(OrganizationPage.I18N.en.heading, { timeout: 30000 });
  }

  /** Website alanının mevcut değeri (mutation baseline/restore için). */
  async websiteValue() {
    return (await this.websiteInput.inputValue())?.trim() ?? '';
  }

  /**
   * Website alanını yazıp Save changes'e basar ve PATCH/PUT /settings/organization 2xx döndüğünü
   * doğrular. YALNIZ staging mutation spec'inde çağrılır (production'da tıklanmaz).
   * @param {string} website
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async saveWebsite(website) {
    await this.websiteInput.fill(website);
    const save = this.page.waitForResponse(
      (r) => r.url().includes(OrganizationPage.API.organization) &&
        ['PATCH', 'PUT'].includes(r.request().method()),
      { timeout: 15000 }
    );
    await expect(this.saveButton).toBeEnabled(); // dirty olunca aktifleşir
    await this.saveButton.click();
    const res = await save;
    expect(res.ok(), `Save changes ${OrganizationPage.API.organization} 2xx döndürmeli`).toBeTruthy();
    return res;
  }
}
