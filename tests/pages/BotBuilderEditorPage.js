// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { BotBuilderPage } from './BotBuilderPage.js';

/**
 * BOT OLUŞTURUCU → Akış Editörü (`/bot-builder/{id}`).
 *
 * Keşif + kanıt: 3 Ağu 2026 canlı gözlem (app.vomenta.com) —
 * bkz. `docs/bot-olusturucu-kesif/NOTLAR.md`.
 *
 * Yapı: React Flow tuvali + üst eylem çubuğu + iki sekme (Editor / Analytics).
 *   - Üst eylemler: Back to Bots · BOT NODES · Scenario · Versions · Test · Save Draft · Publish.
 *   - Kanal önizleme: Webchat · Telegram / Social · WhatsApp (özel ad; çevrilmez).
 *   - Tuval kontrolleri: zoom in/out · fit view · toggle interactivity (React Flow; aria-label
 *     tüm dillerde İngilizce kalır — kütüphane varsayılanı, gözlem).
 *   - Dar ekranda (mobil/tablet) tuval yerine "Desktop Screen Required" kapısı gösterilir.
 *   - "Back to Bots" kontrolü erişilebilir AD taşımıyor (ikon-only; button-name borcu) →
 *     `/bot-builder` linkiyle hedeflenir.
 *
 * Prod güvenliği: Save Draft / Publish / Test / Versions mutasyon/yan-etkilidir → canlıda
 * TETİKLENMEZ (staging). Testler salt-okunur yapı + i18n + navigasyon (L1/L3) ile sınırlıdır.
 *
 * BULGULAR: dar-ekran kapısı "Desktop Screen Required" fr/ar'da çevrilmiyor
 * (BOT-BUILDER-EDITOR-GATE-I18N); editörde ciddi axe ihlalleri var — geri-dön linki erişilebilir
 * ad taşımıyor (link-name) + tuval klavye ile odaklanamıyor (BOT-BUILDER-EDITOR-A11Y).
 * NOT: üst-bardaki görünür geri-dön kontrolü tamamen adsız/metinsizdir (ikon-only); "Back to Bots"
 * metni yalnızca GİZLİ mobil-gate içinde geçer → görünür bir i18n metin sızıntısı DEĞİLDİR.
 */
export class BotBuilderEditorPage extends BasePage {
  /** Dört dilde doğrulanmış editör chrome çevirileri (3 Ağu 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null, dir: 'ltr',
      tabEditor: 'Editor', tabAnalytics: 'Analytics',
      gate: 'Desktop Screen Required',
      save: 'Save Draft', publish: 'Publish', test: 'Test', versions: 'Versions',
      nodes: 'BOT NODES', scenario: 'Scenario',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr',
      tabEditor: 'Düzenleyici', tabAnalytics: 'Analitik',
      gate: 'Masaüstü ekranı gerekli',
      save: 'Taslağı Kaydet', publish: 'Yayınla', test: 'Test Et', versions: 'Sürümler',
      nodes: 'BOT DÜĞÜMLERİ', scenario: 'Senaryo',
    },
    fr: {
      endonym: 'Français', dir: 'ltr',
      tabEditor: 'Éditeur', tabAnalytics: 'Analytique',
      // BULGU: dar-ekran kapısı (gate) fr'de çevrilmiyor (İngilizce kalıyor).
      gate: 'Desktop Screen Required',
      save: 'Enregistrer le brouillon', publish: 'Publier', test: 'Tester', versions: 'Versions',
      nodes: 'NŒUDS DU BOT', scenario: 'Scénario',
    },
    ar: {
      endonym: 'العربية', dir: 'rtl',
      tabEditor: 'المحرر', tabAnalytics: 'التحليلات',
      // BULGU: dar-ekran kapısı (gate) ar'da çevrilmiyor (İngilizce kalıyor).
      gate: 'Desktop Screen Required',
      save: 'حفظ المسودة', publish: 'نشر', test: 'اختبار', versions: 'Versions',
      nodes: 'عُقد البوت', scenario: 'سيناريو',
    },
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/bot-builder');
    this.list = new BotBuilderPage(page);
  }

  /** Editöre özgü sekme (Editor/Analytics). */
  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /** "Editor" sekmesi — editör yüklendi kimlik öğesi. */
  get editorTab() {
    return this.tab(BotBuilderEditorPage.I18N.en.tabEditor);
  }

  /**
   * "Back to Bots" kontrolü ikon-only (erişilebilir adsız → link-name a11y bulgusu) →
   * `/bot-builder` linkiyle hedeflenir. Main içinde İKİ tane var (üst-bar GÖRÜNÜR + mobil-gate
   * GİZLİ) → görünür olan filtrelenir (aksi halde `.first()` gizli gate linkini seçebilir).
   */
  get backLink() {
    return this.page
      .locator('#main-content a[href="/bot-builder"], main a[href="/bot-builder"]')
      .filter({ visible: true })
      .first();
  }

  /** "Save Draft" düğmesi (İngilizce). */
  get saveDraftButton() {
    return this.page.getByRole('button', { name: BotBuilderEditorPage.I18N.en.save, exact: true });
  }

  /** "Publish" düğmesi (İngilizce). */
  get publishButton() {
    return this.page.getByRole('button', { name: BotBuilderEditorPage.I18N.en.publish, exact: true });
  }

  /** Dar-ekran kapısı başlığı ("Desktop Screen Required", İngilizce). */
  get gateHeading() {
    return this.page.getByRole('heading', { name: BotBuilderEditorPage.I18N.en.gate });
  }

  /**
   * Listeden ilk botu açıp editöre gider; editör yüklenene kadar bekler.
   * Veri-bağlı: hesapta bot yoksa null döner (spec test.skip uygular).
   * @returns {Promise<string|null>} açılan botun adı
   */
  async openFirstFromList() {
    // Kart render'ı bazen sayfa başlığından geç gelir (yavaş/oynak ağ) → birkaç kez dene;
    // gerçekten boş liste ise null döner (spec test.skip uygular). Yanlış "boş" skip'ini önler.
    let name = null;
    for (let attempt = 1; attempt <= 3 && !name; attempt++) {
      if (attempt > 1) await this.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await this.list.open();
      name = await this.list.firstBotName();
    }
    if (!name) return null;
    await this.list.botCard(name).click();
    await this.page.waitForURL((url) => /\/bot-builder\/.+/.test(url.pathname), { timeout: 20000 });
    await expect(this.editorTab).toBeVisible({ timeout: 20000 });
    return name;
  }
}
