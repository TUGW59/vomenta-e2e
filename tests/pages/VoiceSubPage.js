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
    history: {
      path: '/voice/history',
      api: '/api/v1/voice/calls',
      consoleClean: true,
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'Call History', subtitle: 'Browse and review past calls, recordings, and transcripts' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Arama Geçmişi', subtitle: 'Geçmiş aramaları, kayıtları ve transkriptleri inceleyin' },
        fr: { endonym: 'Français', dir: 'ltr', heading: 'Historique des appels', subtitle: 'Parcourez et consultez les appels passés, enregistrements et transcriptions' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'سجل المكالمات', subtitle: 'تصفح ومراجعة المكالمات السابقة والتسجيلات والنصوص' },
      },
    },
    voicemail: {
      path: '/voice/voicemail',
      api: '/api/v1/voicemails',
      // consoleClean=false: açılışta VOICEMAIL-PAGER-I18N (common.previousPage/nextPage MISSING_MESSAGE).
      consoleClean: false,
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'Voicemails', subtitle: 'Listen to and manage voicemail messages left by callers' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Sesli mesajlar', subtitle: 'Arayanların bıraktığı sesli mesajları dinleyin ve yönetin' },
        fr: { endonym: 'Français', dir: 'ltr', heading: 'Messages vocaux', subtitle: 'Écoutez et gérez les messages laissés par les appelants' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'البريد الصوتي', subtitle: 'استمع إلى رسائل البريد الصوتي وأدرها' },
      },
    },
    recordings: {
      path: '/voice/recordings',
      api: '/api/v1/voice/recordings',
      consoleClean: true,
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'Call Recordings', subtitle: 'Browse, play, and download recorded calls' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Arama kayıtları', subtitle: 'Kayıtlı aramaları inceleyin, oynatın ve indirin' },
        fr: { endonym: 'Français', dir: 'ltr', heading: "Enregistrements d'appels", subtitle: 'Parcourez, écoutez et téléchargez les appels enregistrés' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'تسجيلات المكالمات', subtitle: 'تصفح وتشغيل وتنزيل المكالمات المسجّلة' },
      },
    },
    dids: {
      path: '/voice/dids',
      api: '/api/v1/dids',
      consoleClean: true,
      // Deep-link'te RSC yarışı → open() başlığı 30 sn bekler.
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'Phone Numbers', subtitle: 'Manage your DIDs and number assignments' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Telefon Numaraları', subtitle: "DID'lerinizi ve numara atamalarınızı yönetin" },
        fr: { endonym: 'Français', dir: 'ltr', heading: 'Numéros de téléphone', subtitle: 'Gérez vos DIDs et les affectations de numéros' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'أرقام الهاتف', subtitle: 'إدارة أرقام الهاتف والتخصيصات' },
      },
    },
    ivr: {
      path: '/voice/ivr',
      api: '/api/v1/ivr',
      consoleClean: true,
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'IVR Builder', subtitle: 'Design and manage interactive voice response flows' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'IVR Tasarımcısı', subtitle: 'İnteraktif sesli yanıt akışları tasarlayın ve yönetin' },
        fr: { endonym: 'Français', dir: 'ltr', heading: 'Concepteur IVR', subtitle: 'Concevez et gérez les flux de réponse vocale interactive' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'مصمم IVR', subtitle: 'تصميم وإدارة تدفقات الاستجابة الصوتية التفاعلية' },
      },
    },
    'sip-trunks': {
      path: '/voice/sip-trunks',
      api: '/api/v1/voice/sip-trunks',
      consoleClean: true,
      // NOT: alt-başlık tr/fr/ar'da çevrilmiyor (EN kalıyor) → VOICE-SIP-TRUNKS-SUBTITLE-I18N.
      // subtitle alanları GERÇEK render'ı yansıtır (tr/fr/ar = EN metni).
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'SIP Trunks', subtitle: 'Manage your SIP trunk connections for inbound and outbound calling.' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'SIP Hatları', subtitle: 'Manage your SIP trunk connections for inbound and outbound calling.' },
        fr: { endonym: 'Français', dir: 'ltr', heading: 'Trunks SIP', subtitle: 'Manage your SIP trunk connections for inbound and outbound calling.' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'خطوط SIP', subtitle: 'Manage your SIP trunk connections for inbound and outbound calling.' },
      },
    },
    'sip-settings': {
      path: '/voice/sip-settings',
      // Sunucu API'si YOK: ayarlar tarayıcıda (localStorage) saklanır ("stored in this browser").
      api: null,
      consoleClean: true,
      // Alt-başlık iki paragraflı (açıklama + saklama notu) ve EN/yerel arası ilk-paragraf
      // değişiyor → i18n testi yalnız BAŞLIK + yön doğrular.
      i18n: {
        en: { endonym: null, dir: 'ltr', heading: 'SIP & phone settings', subtitle: 'Configure how this workstation registers for voice. Values are stored in this browser until a server profile is available.' },
        tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'SIP Ayarları', subtitle: 'SIP dahili numaranızı veya SIP telefonunuzu yapılandırın.' },
        fr: { endonym: 'Français', dir: 'ltr', heading: 'Paramètres SIP', subtitle: 'Configurez votre extension SIP ou téléphone SIP.' },
        ar: { endonym: 'العربية', dir: 'rtl', heading: 'إعدادات SIP', subtitle: 'قم بتكوين داخلي SIP أو هاتف SIP.' },
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
