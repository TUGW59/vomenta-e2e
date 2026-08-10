// @ts-check
import { test, expect } from './fixtures/test.js';
import { CoachingPage } from './pages/CoachingPage.js';

/**
 * SÜPERVİZÖR → KOÇLUK (`/supervisor/coaching`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (C1 / ADR-0014). SALT-OKUNUR.
 *
 * Sekme dışlayıcılığını makine-okur işaretle doğrular: Evaluated / Pending Review
 * sekmeleri tek-seçim (aria-selected) + panel değişimi (@ix-tabs). Sekme davranışı
 * supervisor-coaching.authed.spec.js'te de kanıtlı; burada @ix-* ile sabitlenir.
 *
 * Kapsam-dışı (sözleşmede naInteraction, dürüst): değerlendirme tablosu test tenant'ında
 * BOŞ ("No evaluations found") → table-list/search-filter/empty-state/pagination/loading
 * için dolu-satır garanti yok (anti-loop #3). Mutasyon (New Evaluation) YAPILMAZ.
 */
const I18N = CoachingPage.I18N;

test.describe('Koçluk — sekme etkileşim derinliği', () => {
  test('sekmeler tek-seçim dışlayıcı (aria-selected) @ix-tabs', async ({ app }) => {
    const co = app.coaching;
    await co.open();
    const names = I18N.en.tabs; // ['Evaluated', 'Pending Review']
    for (const name of names) {
      await co.selectTab(name); // hardened (hidrasyon yarışı)
      await expect(co.tab(name)).toHaveAttribute('aria-selected', 'true');
      for (const other of names) {
        if (other === name) continue;
        await expect(co.tab(other)).toHaveAttribute('aria-selected', 'false');
      }
    }
  });
});
