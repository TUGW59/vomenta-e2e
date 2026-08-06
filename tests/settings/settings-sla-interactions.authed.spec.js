// @ts-check
import { test } from '../fixtures/test.js';
import { assertTableStructure } from '../support/interactions.js';
import { SlaPage } from '../pages/SlaPage.js';

/**
 * AYARLAR → SLA POLİTİKALARI (`/settings/sla`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Gerçek etkileşim boyutu LİSTE'dir (@ix-table): kolon başlıkları + varsayılan
 * politikalardan en az bir dolu satır. Arama/pager/boş-durum/iskelet bu yüzeyde yok → N/A.
 * Mutasyon YAPILMAZ.
 */

test.describe('SLA Politikaları — tablo etkileşim derinliği', () => {
  test('politika tablosu kolonları + en az bir dolu satır @ix-table', async ({ app }) => {
    const a = app.sla;
    await a.open();
    // Kararlı çekirdek kolonlar (uzun "Next response (min, optional)" hariç → dar viewport toleransı).
    await assertTableStructure(a.table, a.rows, ['Name', 'First Response', 'Resolution', 'Priority', 'Channels', 'Active']);
  });
});
