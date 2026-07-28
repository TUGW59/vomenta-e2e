// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Raporlar › Panolar (`/reports/dashboards`) sayfa nesnesi.
 *
 * Keşif notları: docs/reports-panolar-kesif/NOTLAR.md
 * Sayfa taze bağlamda İngilizce açılır; dil değiştirici kenar çubuğu altındaki metinli
 * düğmedir ve seçim sunucuda kalıcı DEĞİLDİR (her test İngilizce başlar). Bkz. WallboardPage.
 *
 * NOT (a11y + seçici borcu): Kart eylem ikonları (Paylaş/Çoğalt/Sil) erişilebilir isimsiz
 * (metin/aria-label/title yok). `getByRole('button',{name})` ile seçilemiyorlar → son çare
 * olarak `svg` sınıfı kullanıldı ve frontend'den `data-testid` talep edildi.
 */
export class DashboardsPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', lang: 'en',
      heading: 'Dashboards',
      subtitle: 'Custom dashboards with widgets and real-time metrics.',
      tabs: ['All Dashboards', 'Default', 'Custom Dashboards'],
      sections: ['Default Dashboards', 'Custom Dashboards'],
      create: 'Create Dashboard', edit: 'Edit',
      shareTitle: 'Share Dashboard', close: 'Close',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', lang: 'tr',
      heading: 'Panolar',
      subtitle: "Özel panolar, widget'lar ve gerçek zamanlı metrikler.",
      tabs: ['Tüm Panolar', 'Varsayılan', 'Özel Panolar'],
      sections: ['Varsayılan Panolar', 'Özel Panolar'],
      create: 'Gösterge Paneli Oluştur', edit: 'Düzenle',
      shareTitle: 'Panoyu Paylaş', close: 'Kapat',
    },
    fr: {
      endonym: 'Français', dir: 'ltr', lang: 'fr',
      heading: 'Tableaux de bord',
      subtitle: 'Tableaux de bord personnalisés avec widgets et métriques en temps réel.',
      tabs: ['Tous les tableaux de bord', 'Par défaut', 'Tableaux de bord personnalisés'],
      sections: ['Tableaux de bord par défaut', 'Tableaux de bord personnalisés'],
      create: 'Créer un tableau de bord', edit: 'Modifier',
      shareTitle: 'Partager le tableau de bord', close: 'Fermer',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', lang: 'ar',
      heading: 'لوحات المعلومات',
      subtitle: 'لوحات مخصصة مع أدوات ومقاييس في الوقت الفعلي.',
      tabs: ['جميع لوحات المعلومات', 'افتراضي', 'اللوحات المخصصة'],
      sections: ['اللوحات الافتراضية', 'اللوحات المخصصة'],
      create: 'إنشاء لوحة تحكم', edit: 'تعديل',
      shareTitle: 'مشاركة اللوحة', close: 'إغلاق',
    },
  };

  /** Liste bu uçtan yüklenir (Network incelemesiyle doğrulandı). */
  static API = { list: '/api/v1/reports/dashboards' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/reports/dashboards');
    this.heading = page.getByRole('heading', { level: 1 });
    // Her özel pano kartında bir "paylaş" ikonu (lucide-share2) var → kart sayacı olarak kullanılır.
    this.customShareButtons = page.locator('button:has(svg.lucide-share2)');
    this.customDuplicateButtons = page.locator('button:has(svg.lucide-copy)');
    this.customDeleteButtons = page.locator('button:has(svg.lucide-trash2)');
  }

  /** İngilizce açılır ve başlığın (liste yüklenene kadar) göründüğünü doğrular. */
  async open() {
    await super.open();
    await expect(this.heading).toHaveText(DashboardsPage.I18N.en.heading, { timeout: 30000 });
    // Liste render olsun (Custom Dashboards bölümü gelsin).
    await this.page.getByText(DashboardsPage.I18N.en.sections[1], { exact: true }).first()
      .waitFor({ timeout: 30000 });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  createButton(name = DashboardsPage.I18N.en.create) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** İlk özel pano kartının "Düzenle" düğmesi (yerelleştirilmiş isimle). */
  editButton(name = DashboardsPage.I18N.en.edit) {
    return this.page.getByRole('button', { name, exact: true }).first();
  }

  /** İlk özel pano kartının paylaş ikonu. */
  get firstShareButton() {
    return this.customShareButtons.first();
  }

  async customCardCount() {
    return this.customShareButtons.count();
  }

  /** İlk kartta paylaş diyaloğunu açar ve dialog locator'ını döndürür. */
  async openShareDialog() {
    await this.firstShareButton.click();
    const dialog = this.page.getByRole('dialog');
    await dialog.waitFor({ timeout: 8000 });
    return dialog;
  }

  /** Açık diyaloğun YATAY taşması (px). Yöne duyarsız: `scrollWidth - clientWidth`. */
  async dialogHorizontalOverflowPx() {
    return this.page.getByRole('dialog').evaluate((n) => n.scrollWidth - n.clientWidth);
  }

  /** Diyalog içindeki kopyala-bağlantı düğmesi (zincir ikonu `lucide-link2`). */
  copyLinkButton() {
    return this.page.getByRole('dialog').locator('button:has(svg[class*="lucide-link"])').first();
  }

  // languageTrigger()/switchLanguage() BasePage'den miras alınır.
}
