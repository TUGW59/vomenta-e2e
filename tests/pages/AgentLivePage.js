// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Süpervizör → Agent Live / Canlı Aracı (`/supervisor/calls`).
 *
 * Keşif + kanıt: docs/agent-live-kesif/NOTLAR.md
 * Sesli AI aracısının yönettiği CANLI çağrıların "cockpit" listesi. Kontrol yok
 * (filtre/arama/buton yok); canlı AI çağrısı yokken boş-durum gösterir.
 * Çağrı seçimi/cockpit yalnızca canlı AI çağrısı varken → staging/canlı veri (N/A).
 */
export class AgentLivePage extends BasePage {
  /** Dört dilde doğrulanmış çeviriler (29 Tem 2026 canlı gözlem). */
  static I18N = {
    en: { endonym: null, dir: 'ltr', heading: 'Agent Live', subtitle: 'Live calls currently handled by a voice AI agent. Select one to open its cockpit.', empty: 'No live AI calls' },
    tr: { endonym: 'Türkçe', dir: 'ltr', heading: 'Canlı Aracı', subtitle: 'Şu anda bir sesli yapay zeka aracısı tarafından yönetilen canlı çağrılar. Kokpitini açmak için birini seçin.', empty: 'Canlı yapay zeka çağrısı yok' },
    fr: { endonym: 'Français', dir: 'ltr', heading: 'Agent en direct', subtitle: 'Appels en direct actuellement gérés par un agent IA vocal. Sélectionnez-en un pour ouvrir son cockpit.', empty: 'Aucun appel IA en direct' },
    ar: { endonym: 'العربية', dir: 'rtl', heading: 'الوكيل المباشر', subtitle: 'المكالمات المباشرة التي يتولاها حاليًا وكيل ذكاء اصطناعي صوتي. اختر واحدة لفتح غرفة تحكمها.', empty: 'لا توجد مكالمات ذكاء اصطناعي مباشرة' },
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/supervisor/calls');
    this.heading = page.getByRole('heading', { level: 1 });
    this.emptyState = page.getByText(AgentLivePage.I18N.en.empty, { exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AgentLivePage.I18N.en.heading, { timeout: 30000 });
  }
}
