// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * BOT OLUŞTURUCU → Liste (`/bot-builder`).
 *
 * Keşif + kanıt: 3 Ağu 2026 canlı gözlem (app.vomenta.com) —
 * bkz. `docs/bot-olusturucu-kesif/NOTLAR.md`.
 *
 * Yapı: tek yüzey — H1 "Bot Builder" + alt başlık + "Create Bot" düğmesi + bot kartları.
 *   - Açılışta ağ: GET /api/v1/bots?limit=50 (liste) + GET /api/v1/bots/templates (şablonlar).
 *   - Kartlar anchor DEĞİL; tıklama client-side ile /bot-builder/{id} editörüne götürür (L3 nav).
 *   - "Create Bot" → "Create Bot Flow" diyaloğu (Bot Name / Description / Template + Cancel /
 *     Create & Open Editor). Gerçek create prod'a yazar → canlıda TETİKLENMEZ (staging mutasyonu).
 *
 * BULGU: diyalogdaki hazır şablonlar ham `botBuilder.*` çeviri anahtarı olarak render ediliyor
 * (MISSING_MESSAGE); şablonlar açılışta önden yüklendiği için liste açılışında bile konsol hatası
 * düşer → BOT-BUILDER-TEMPLATE-I18N (known-bugs.js).
 */
export class BotBuilderPage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (3 Ağu 2026 canlı gözlem). */
  static I18N = {
    en: {
      endonym: null,
      dir: 'ltr',
      heading: 'Bot Builder',
      subtitle: 'Design and manage conversational bot flows',
      createButton: 'Create Bot',
      dialog: {
        heading: 'Create Bot Flow',
        subtitle: 'Start from scratch or choose a pre-built template',
        labels: ['Bot Name', 'Description (optional)', 'Template (optional)'],
        cancel: 'Cancel',
        submit: 'Create & Open Editor',
        close: 'Close',
      },
    },
    tr: {
      endonym: 'Türkçe',
      dir: 'ltr',
      heading: 'Bot Oluşturucu',
      subtitle: 'Konuşma tabanlı bot akışlarını tasarlayın ve yönetin',
      createButton: 'Bot Oluştur',
      dialog: {
        heading: 'Bot Akışı Oluştur',
        subtitle: 'Sıfırdan başlayın veya hazır bir şablon seçin',
        labels: ['Bot Adı', 'Açıklama (isteğe bağlı)', 'Şablon (isteğe bağlı)'],
        cancel: 'İptal',
        submit: 'Oluştur ve Düzenleyiciyi Aç',
      },
    },
    fr: {
      endonym: 'Français',
      dir: 'ltr',
      heading: 'Créateur de bots',
      subtitle: 'Concevez et gérez les flux de conversation des bots',
      createButton: 'Créer un bot',
      dialog: {
        heading: 'Créer un flux de bot',
        subtitle: 'Partez de zéro ou choisissez un modèle prédéfini',
        labels: ['Nom du bot', 'Description (facultatif)', 'Modèle (facultatif)'],
        cancel: 'Annuler',
        submit: "Créer et ouvrir l'éditeur",
      },
    },
    ar: {
      endonym: 'العربية',
      dir: 'rtl',
      heading: 'منشئ الروبوتات',
      subtitle: 'تصميم وإدارة تدفقات محادثات الروبوت',
      createButton: 'إنشاء روبوت',
      dialog: {
        heading: 'إنشاء تدفق روبوت',
        subtitle: 'ابدأ من الصفر أو اختر قالباً جاهزاً',
        labels: ['اسم الروبوت', 'الوصف (اختياري)', 'القالب (اختياري)'],
        cancel: 'إلغاء',
        submit: 'إنشاء وفتح المحرر',
      },
    },
  };

  /** Açılışta gözlemlenen salt-okunur uçlar (L2 doğrulaması için). */
  static ENDPOINTS = {
    bots: '/api/v1/bots',
    templates: '/api/v1/bots/templates',
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/bot-builder');
    this.heading = page.getByRole('heading', { level: 1 });
    this.createButton = page.getByRole('button', { name: BotBuilderPage.I18N.en.createButton, exact: true });
    this.dialog = page.getByRole('dialog');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(BotBuilderPage.I18N.en.heading, { timeout: 30000 });
  }

  /**
   * "Create Bot" → diyaloğu açar ve görünür olmasını bekler.
   * @param {string} [heading] Beklenen diyalog başlığı (varsayılan İngilizce). Dil değiştirildiyse
   *   çevrilmiş başlık verilerek doğru dil doğrulanır; "Create Bot" düğmesi aktif dilde de görünür
   *   ilk birincil eylemdir → adı bağımsız hedeflenir.
   */
  async openCreateDialog(heading = BotBuilderPage.I18N.en.dialog.heading) {
    await this.anyCreateButton.click();
    await expect(this.dialog).toBeVisible({ timeout: 10000 });
    await expect(this.dialog.getByRole('heading', { name: heading })).toBeVisible();
  }

  /** Dört dilde birincil "Create Bot" düğmesi (dil-agnostik). */
  get anyCreateButton() {
    const names = Object.values(BotBuilderPage.I18N).map((v) => v.createButton);
    return this.page.getByRole('button', {
      name: new RegExp(`^(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`),
    });
  }

  /** Diyalog içindeki "Bot Name" metin girdisi. */
  get botNameInput() {
    return this.dialog.getByRole('textbox').first();
  }

  /** Diyalog gönder ("Create & Open Editor") düğmesi. */
  get submitButton() {
    return this.dialog.getByRole('button', { name: BotBuilderPage.I18N.en.dialog.submit });
  }

  /**
   * Listedeki bir bot kartını (ada göre) döndürür. Kart tıklaması client-side
   * navigasyonla `/bot-builder/{id}` editörüne götürür (kart anchor DEĞİL).
   * @param {string} name
   */
  botCard(name) {
    return this.page.getByText(name, { exact: true }).first();
  }

  /**
   * İlk bot kartının adını DOM'dan (deterministik) okur; hesapta bot yoksa null döner.
   * Kartlar semantik kimlik (role/heading/data-testid) taşımadığından son çare olarak
   * `.bg-card` kabı kullanılır (frontend'den kart için `data-testid` istenmeli). Ad, kartın
   * ilk satırıdır ("new chat bot\nPublished\nv5…").
   * @returns {Promise<string|null>}
   */
  async firstBotName() {
    const card = this.page.locator('#main-content div.bg-card, main div.bg-card').first();
    // Kartlar h1'den sonra /bots fetch'iyle gelir → görünmesini bekle; gerçekten yoksa null.
    await card.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    if (!(await card.count())) return null;
    const raw = (await card.innerText()).trim();
    return raw.split('\n')[0].trim() || null;
  }
}
