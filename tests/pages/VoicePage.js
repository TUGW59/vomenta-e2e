// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * VOICE › Canlı Aramalar hub'ı (`/voice` → `/voice/live`) sayfa nesnesi.
 *
 * Keşif + kanıt: docs/sesli-kesif/NOTLAR.md (2 Ağu 2026, app.vomenta.com, salt-okunur;
 * oturum `auth.setup.js` ile üretildi). `/voice` istemci tarafında `/voice/live`'a yönlenir.
 * Hub: gerçek-zamanlı aktif çağrı görünümü — KPI döşemeleri (Active Calls / Agents Available /
 * Avg Wait Time / Answer Rate) + temsilci mevcudiyet sayaçları + boş durum
 * "No active calls right now". Alt-navigasyon 10 hedef (aşağıdaki SUBNAV).
 * Açılış API'leri: GET /api/v1/voice/calls/live, /api/v1/voice/stats, /api/v1/queues,
 * /api/v1/supervisor/dashboard, /api/v1/supervisor/agents. Canlı açılış konsolu temiz.
 *
 * GÜVENLİK (production salt-okunur): softphone / gerçek çağrı ASLA tetiklenmez (mutation staging).
 */
export class VoicePage extends BasePage {
  static I18N = {
    en: {
      endonym: null,
      dir: 'ltr',
      heading: 'Live Calls',
      subtitle: 'Real-time view of all active calls across queues',
      empty: 'No active calls right now',
    },
    tr: {
      endonym: 'Türkçe',
      dir: 'ltr',
      heading: 'Canlı Aramalar',
      subtitle: 'Kuyruklar arasındaki tüm aktif çağrıların gerçek zamanlı görünümü',
      empty: 'Şu anda aktif arama yok',
    },
    fr: {
      endonym: 'Français',
      dir: 'ltr',
      heading: 'Appels en cours',
      subtitle: "Vue en temps réel de tous les appels actifs dans les files d'attente",
      empty: null, // boş-durum çevirisi keşifte doğrulanmadı; başlık+alt-başlık yeterli guard.
    },
    ar: {
      endonym: 'العربية',
      dir: 'rtl',
      heading: 'المكالمات المباشرة',
      subtitle: 'عرض مباشر لجميع المكالمات النشطة عبر قوائم الانتظار',
      empty: null,
    },
  };

  /** Voice bölümü alt-navigasyonu — buton adı → hedef rota + hedef başlık (nav-L3). */
  static SUBNAV = Object.freeze([
    { name: 'Live Calls', path: '/voice/live', heading: 'Live Calls' },
    { name: 'Queues', path: '/voice/queues', heading: 'Queues' },
    { name: 'IVR Builder', path: '/voice/ivr', heading: 'IVR Builder' },
    { name: 'Phone Numbers', path: '/voice/dids', heading: 'Phone Numbers' },
    { name: 'Call History', path: '/voice/history', heading: 'Call History' },
    { name: 'Voicemails', path: '/voice/voicemail', heading: 'Voicemails' },
    { name: 'Recordings', path: '/voice/recordings', heading: 'Call Recordings' },
    { name: 'SIP Trunks', path: '/voice/sip-trunks', heading: 'SIP Trunks' },
    { name: 'SIP settings', path: '/voice/sip-settings', heading: 'SIP & phone settings' },
    { name: 'Skills', path: '/voice/skills', heading: 'Skills-Based Routing' },
  ]);

  static API = {
    liveCalls: '/api/v1/voice/calls/live',
    stats: '/api/v1/voice/stats',
  };

  /** KPI döşeme etiketleri (@data guard için). */
  static KPIS = ['Active Calls', 'Agents Available', 'Avg Wait Time', 'Answer Rate'];

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/voice');
    this.heading = page.getByRole('heading', { name: VoicePage.I18N.en.heading, exact: true });
    this.emptyState = page.getByText(VoicePage.I18N.en.empty, { exact: false }).first();
    this.softphoneButton = page.getByRole('button', { name: 'Open softphone' });
  }

  async open() {
    await super.open();
    await expect(this.heading).toBeVisible({ timeout: 30000 });
  }

  /** Alt-nav düğmesi locator'ı. */
  subnav(name) {
    return this.page.getByRole('button', { name, exact: true });
  }
}
