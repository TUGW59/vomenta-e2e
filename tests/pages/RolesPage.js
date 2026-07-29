// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Rol Yönetimi (`/settings/roles`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Liste: rol tablosu (Name/Description/Permissions/System/Users/Actions) + satır aksiyonları
 * (Edit role / Reset to defaults / Delete role — sistem rolleri için Delete DISABLED) +
 * "Create Role" dialogu (Ad/Açıklama + 14 izin kategorisi). Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: Create/Edit/Reset/Delete production'da TIKLANMAZ. Create+Delete (custom rol)
 * geri-döndürülebilir mutasyon yalnız staging'de: settings-roles-mutations.authed.spec.js.
 */
export class RolesPage extends BasePage {
  /** 4 dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Role Management',
      subtitle: 'Create and manage user roles with granular permissions',
      create: 'Create Role', columns: ['Name', 'Description', 'Permissions', 'System', 'Users', 'Actions'],
      dialogTitle: 'Create Role', name: 'Role Name', description: 'Description', save: 'Save', cancel: 'Cancel',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Rol Yönetimi',
      subtitle: 'Ayrıntılı izinlerle kullanıcı rollerini oluşturun ve yönetin',
      create: 'Rol Oluştur', columns: ['Ad', 'Açıklama', 'İzinler', 'Sistem', 'Kullanıcılar', 'İşlemler'],
      dialogTitle: 'Rol Oluştur', name: 'Rol Adı', description: 'Açıklama', save: 'Kaydet', cancel: 'İptal',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Gestion des rôles',
      subtitle: 'Créez et gérez les rôles utilisateurs avec des autorisations granulaires',
      create: 'Créer un rôle', columns: ['Nom', 'Description', 'Autorisations', 'Système', 'Utilisateurs', 'Actions'],
      dialogTitle: 'Créer un rôle', name: 'Nom du rôle', description: 'Description', save: 'Enregistrer', cancel: 'Annuler',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'إدارة الأدوار',
      subtitle: 'إنشاء أدوار المستخدمين وإدارتها مع صلاحيات دقيقة',
      create: 'إنشاء دور', columns: ['الاسم', 'الوصف', 'الصلاحيات', 'النظام', 'المستخدمون', 'الإجراءات'],
      dialogTitle: 'إنشاء دور', name: 'اسم الدور', description: 'الوصف', save: 'حفظ', cancel: 'إلغاء',
    },
  };

  /** Kontrollerin vurduğu backend uçları (Network incelemesiyle doğrulandı, 29 Tem 2026). */
  static API = {
    roles: '/api/v1/roles', // GET (liste) + POST (Create) + DELETE /{id}
    catalog: '/api/v1/roles/permissions/catalog',
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/roles');
    this.heading = page.getByRole('heading', { level: 1 });
    this.createButton = page.getByRole('button', { name: RolesPage.I18N.en.create, exact: true });
    this.table = page.locator('main table').first();
    this.rows = this.table.locator('tbody tr');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(RolesPage.I18N.en.heading, { timeout: 30000 });
  }

  /** "Create Role" dialogunu açar ve döndürür. */
  async openCreateDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.createButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }

  /** Belirli bir rolün satırı (ada göre, tam iş kimliği). */
  roleRow(name) {
    return this.rows.filter({ hasText: name }).first();
  }

  /**
   * Create Role dialogunu doldurup kaydeder ve POST /roles 2xx döndüğünü doğrular.
   * YALNIZ staging mutation spec'inde çağrılır (production'da tıklanmaz).
   * @param {{ name: string, description?: string }} data
   * @returns {Promise<import('@playwright/test').Response>}
   */
  async createRole({ name, description }) {
    const dialog = await this.openCreateDialog();
    await dialog.getByRole('textbox', { name: RolesPage.I18N.en.name, exact: true }).fill(name);
    if (description) {
      await dialog.getByRole('textbox', { name: RolesPage.I18N.en.description, exact: true }).fill(description);
    }
    const post = this.page.waitForResponse(
      (r) => r.url().includes(RolesPage.API.roles) && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await dialog.getByRole('button', { name: RolesPage.I18N.en.save, exact: true }).click();
    const res = await post;
    expect(res.ok(), `Create Role POST ${RolesPage.API.roles} 2xx döndürmeli`).toBeTruthy();
    return res;
  }

  /**
   * Ada göre custom rolü satır aksiyonundan siler (varsa). Cleanup için idempotent.
   * @param {string} name
   */
  async deleteRoleByName(name) {
    await this.open();
    const row = this.roleRow(name);
    if (!(await row.count())) return; // zaten yok
    const del = row.getByRole('button', { name: 'Delete role', exact: true });
    if (!(await del.isEnabled().catch(() => false))) return; // sistem rolü / silinemez
    await del.click();
    // Onay dialogu çıkarsa onayla.
    const confirm = this.page.getByRole('button', { name: /Delete|Sil|Confirm|Onayla/i });
    await confirm.first().click().catch(() => {});
    await expect(this.roleRow(name)).toHaveCount(0, { timeout: 10000 });
  }
}
