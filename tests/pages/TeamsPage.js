// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Ekipler (`/settings/teams`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Ekip kartları (ad + üye sayısı) + "Create Team" dialog (Ad/Açıklama). Kart hover'da isimsiz
 * ikon buton "Edit Team name" dialogu açar (UI'da Delete YOK). Sekme YOK; İngilizce açılır.
 *
 * GÜVENLİK: Create/Edit production'da TIKLANMAZ (kart dialogu yalnız keşifte açıldı). Create
 * dialogu read-only spec'te yalnızca AÇILIR + boş-submit disabled. L3 create staging'e bırakıldı.
 */
export class TeamsPage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Teams',
      subtitle: 'Organize your agents into teams for routing and management',
      create: 'Create Team', createDialog: 'Create Team', teamName: 'Team name',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Ekipler',
      subtitle: 'Temsilcilerinizi yönlendirme ve yönetim için ekiplere ayırın',
      create: 'Ekip Oluştur', createDialog: null, teamName: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Équipes',
      subtitle: 'Organisez vos agents en équipes pour le routage et la gestion',
      create: 'Créer une équipe', createDialog: null, teamName: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'الفرق',
      subtitle: 'نظّم وكلاءك في فرق للتوجيه والإدارة',
      create: 'إنشاء فريق', createDialog: null, teamName: null,
    },
  };

  static API = { teams: '/api/v1/teams' }; // GET (liste) + POST (create)

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/teams');
    this.heading = page.getByRole('heading', { level: 1 });
    this.createButton = page.getByRole('button', { name: TeamsPage.I18N.en.create, exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(TeamsPage.I18N.en.heading, { timeout: 30000 });
  }

  async openCreateDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.createButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
