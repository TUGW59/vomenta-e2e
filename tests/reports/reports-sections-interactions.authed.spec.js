// @ts-check
import { test } from '../fixtures/test.js';
import { assertTabsExclusive } from '../support/interactions.js';
import { ReportSectionPage } from '../pages/ReportSectionPage.js';

/**
 * RAPORLAR → 10 ORTAK-KABUK BÖLÜMÜ (`/reports/{key}`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014 / ADR-0029, FAZ 3). SALT-OKUNUR.
 *
 * Keşif: docs/reports-diger-kesif/NOTLAR.md (28 Tem 2026). 10 bölüm (call/agent/queue/
 * campaign/channel/ai/quality/csat/billing/sla) AYNI kabuğu paylaşır; tek gerçek, veri-
 * bağımsız etkileşim boyutu ÜST SEKME'dir (@ix-tabs): Charts ↔ Table seçimi dışlayıcıdır
 * (tek aria-selected). Boş bölümler (campaign/channel/billing) dahil tüm bölümlerde sekme
 * kabuğu render edilir (mevcut @smoke testi 10 bölümde de tableTab görünürlüğünü doğrular).
 *
 * Diğer 5 veri boyutu tested-pages.js'te naInteraction ile gerekçeli N/A: metin arama
 * kutusu yok (yalnız Date Range presetleri + açılır seçiciler); Table içeriği + boş-durum
 * dönem-veri-bağlı (anti-loop #3); pager yok; skeleton'ın kararlı locator'ı yok. Mutasyon
 * YAPILMAZ (Export/Schedule/AI Insights asla tetiklenmez).
 */

const SECTION_KEYS = Object.keys(ReportSectionPage.SECTIONS);
const TAB_NAMES = [ReportSectionPage.LANG.en.charts, ReportSectionPage.LANG.en.table];

test.describe('Rapor bölümleri — Charts/Table sekme etkileşim derinliği', () => {
  for (const key of SECTION_KEYS) {
    test(`[${key}] Charts ↔ Table üst sekmeleri dışlayıcı seçilir @ix-tabs`, async ({ app }) => {
      const rp = app.reportSection(key);
      await rp.open();
      await assertTabsExclusive(rp.page, (name) => rp.tab(name), TAB_NAMES);
    });
  }
});
