// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Kullanıcılar ve Roller (`/settings/users`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Liste sayfası: arama + üye tablosu (Ad/E-posta/Rol/Durum/Son Giriş/İşlemler) + satır kebab
 * (Edit/Deactivate) + "Invite User" dialog. Sayfa taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Invite/Edit/Deactivate production'da TIKLANMAZ. Invite mutasyonu (davet + geri alma)
 * staging'e bırakıldı (bkz. known-bugs-invite.mutation.authed.spec.js; revoke ucu teyidi bekliyor).
 */
export class UsersPage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Users & Roles',
      subtitle: 'Manage who has access to your workspace',
      invite: 'Invite User', columns: ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'],
      dialogTitle: 'Invite User', email: 'Email address', send: 'Send Invitation', cancel: 'Cancel',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Kullanıcılar ve Roller',
      subtitle: 'Çalışma alanınıza kimlerin erişimi olduğunu yönetin',
      invite: 'Kullanıcı Davet Et', columns: ['Ad', 'E-posta', 'Rol', 'Durum', 'Son Giriş', 'İşlemler'],
      dialogTitle: 'Kullanıcı Davet Et', email: 'E-posta adresi', send: 'Davet Gönder', cancel: 'İptal',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Utilisateurs et rôles',
      subtitle: 'Gérez les accès à votre espace de travail',
      invite: 'Inviter un utilisateur', columns: ['Nom', 'E-mail', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'],
      dialogTitle: 'Inviter un utilisateur', email: 'Adresse e-mail', send: "Envoyer l'invitation", cancel: 'Annuler',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'المستخدمون والأدوار',
      subtitle: 'إدارة من لديه حق الوصول إلى مساحة عملك',
      invite: 'دعوة مستخدم', columns: ['الاسم', 'البريد الإلكتروني', 'الدور', 'الحالة', 'آخر تسجيل دخول', 'إجراءات'],
      dialogTitle: 'دعوة مستخدم', email: 'عنوان البريد الإلكتروني', send: 'إرسال الدعوة', cancel: 'إلغاء',
    },
  };

  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı, 29 Tem 2026). */
  static API = {
    users: '/api/v1/users', // GET ?page&limit (liste)
    roles: '/api/v1/roles', // GET (davet dialog rol seçenekleri)
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/users');
    this.heading = page.getByRole('heading', { level: 1, name: UsersPage.I18N.en.heading });
    this.inviteButton = page.getByRole('button', { name: UsersPage.I18N.en.invite, exact: true });
    this.table = page.locator('main table').first();
    this.rows = this.table.locator('tbody tr');
    this.searchInput = page.getByRole('textbox', { name: /Search users|Kullanıcı ara|Rechercher des utilisateurs|بحث/i });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** "Invite User" dialogunu açar ve döndürür. */
  async openInviteDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.inviteButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
