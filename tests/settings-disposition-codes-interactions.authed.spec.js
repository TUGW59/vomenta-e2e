// @ts-check
import { test } from './fixtures/test.js';
import { assertTableStructure } from './support/interactions.js';
import { DispositionCodesPage } from './pages/DispositionCodesPage.js';

/**
 * AYARLAR → SONUÇ KODLARI (`/settings/disposition-codes`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Gerçek etkileşim boyutu LİSTE'dir (@ix-table): kolon başlıkları + varsayılan sistem
 * kodlarından en az bir dolu satır. Arama/pager/boş-durum/iskelet bu yüzeyde yok → açık N/A.
 * Mutasyon YAPILMAZ.
 */

const I18N = DispositionCodesPage.I18N;

test.describe('Sonuç Kodları — tablo etkileşim derinliği', () => {
  test('kod tablosu kolonları + en az bir dolu satır @ix-table', async ({ app }) => {
    const a = app.dispositionCodes;
    await a.open();
    // 'Actions' kolonu ikon-buton başlığıdır (metinsiz olabilir) → veri kolonları doğrulanır.
    await assertTableStructure(a.table, a.rows, ['Code', 'Label', 'Category', 'Description']);
  });
});
