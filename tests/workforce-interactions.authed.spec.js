// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertTableStructure } from './support/interactions.js';
import { WorkforcePage } from './pages/WorkforcePage.js';

/**
 * İŞ GÜCÜ HUB (`/workforce`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014 / ADR-0029, FAZ 4). SALT-OKUNUR.
 *
 * Keşif: docs/workforce-kesif/NOTLAR.md (28 Tem 2026). İki gerçek etkileşim boyutu var:
 *  1) ÜST SEKMELER (@ix-tabs): 7 sekme (Schedules/Time Off/Adherence/Forecast/Badges/
 *     Surveys/Evaluations) dışlayıcı seçilir (tek aria-selected). Veri-bağımsız.
 *  2) TABLO (@ix-table): varsayılan Schedules görünümü haftalık çizelge tablosudur;
 *     satırlar tenant baseline ajanlarıdır (güncel haftada dolu).
 *
 * Diğer 4 veri boyutu tested-pages.js'te naInteraction ile gerekçeli N/A: metin arama
 * kutusu yok (yalnız hafta ok'ları); pager/sıralama yok; boş-durum arama/filtre ile
 * üretilmiyor; kararlı liste-yükleme iskeleti yok. Mutasyon YAPILMAZ (Add Shift/Publish
 * asla tetiklenmez — ayrı workforce-mutations spec'inde staging-gated).
 */

const TABS = WorkforcePage.I18N.en.tabs;

test.describe('İş Gücü hub — sekme + çizelge tablosu etkileşim derinliği', () => {
  test('7 üst sekme dışlayıcı seçilir @ix-tabs', async ({ app }) => {
    const w = app.workforce;
    await w.open();
    // NOT: generic assertTabsExclusive yerine POM.selectTab (retry'lı) kullanılır —
    // bu yüzeyde "Badges"e girince ikinci tab bar mount ediyor (NOTLAR) → tek tık
    // düşebilir. selectTab seçili duruma geçişi garanti eder; sonra dışlayıcılık:
    for (const name of TABS) {
      await w.selectTab(name);
      for (const other of TABS) {
        if (other === name) continue;
        await expect(w.tab(other)).toHaveAttribute('aria-selected', 'false');
      }
    }
  });

  test('Haftalık çizelge tablosu ajan satırlarıyla render olur @ix-table', async ({ app }) => {
    const w = app.workforce;
    await w.open();
    await assertTableStructure(w.scheduleTable(), w.scheduleRows(), []);
  });
});
