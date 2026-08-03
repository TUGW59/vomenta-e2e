// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * VOICE alt rotaları (`/voice/*`) — tek parametreli ortak kabuk.
 *
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com, salt-okunur;
 * oturum `auth.setup.js` ile üretildi). Voice bölümü alt-navigasyonu 10 hedef taşır; her
 * alt rota kendi <main> başlığı (h1/h2) + alt-başlığı ve genelde bir liste/tablo taşır.
 * Rota verisi ilgili `GET /api/v1/...` ucundan gelir (SECTIONS[key].api).
 *
 * PROD GÜVENLİĞİ (production salt-okunur): bu rotalardaki create/edit/delete/assign/release/
 * publish/gerçek-çağrı kontrolleri mutasyon üretir → canlıda TETİKLENMEZ. Buradaki page
 * object salt açılış + görünüm doğrulaması içindir; mutasyon L3'leri staging'e (ayrı
 * `*.mutation.authed.spec.js`) bırakılır.
 *
 * Her key i18n bloğu 4 dilde CANLI doğrulanmış başlık + alt-başlık taşır (i18n guard).
 */
export class VoiceSubPage extends BasePage {
  static SECTIONS = Object.freeze({
    queues: {
      path: '/voice/queues',
      api: '/api/v1/queues',
      consoleClean: true,
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'Queues', subtitle: 'Manage call queues, routing strategies, and agent assignments' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Kuyruklar', subtitle: 'Çağrı kuyruklarını, yönlendirme stratejilerini ve ajan atamalarını yönetin' },
        fr: { endonym: 'Français', dir: 'ltr', heading: "Files d'attente", subtitle: "Gérez les files d'attente, les stratégies de routage et les affectations d'agents" },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'قوائم الانتظار', subtitle: 'إدارة قوائم انتظار المكالمات واستراتيجيات التوجيه وتعيينات الوكلاء' },
      },
    },
  });

  /**
   * @param {import('@playwright/test').Page} page
   * @param {keyof typeof VoiceSubPage.SECTIONS} key
   */
  constructor(page, key) {
    const meta = VoiceSubPage.SECTIONS[key];
    if (!meta) throw new Error(`VoiceSubPage: bilinmeyen alt rota "${key}"`);
    super(page, meta.path);
    this.key = key;
    this.meta = meta;
    this.i18n = meta.i18n;
    this.heading = page.getByRole('heading', { name: meta.i18n.en.heading, exact: true }).first();
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Alt-başlık locator'ı (verilen dil için, yoksa EN). */
  subtitle(code = 'en') {
    const t = this.i18n[code] || this.i18n.en;
    return this.page.getByText(t.subtitle, { exact: false }).first();
  }
}
