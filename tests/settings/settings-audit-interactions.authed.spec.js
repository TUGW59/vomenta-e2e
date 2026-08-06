// @ts-check
import { test, expect } from '../fixtures/test.js';
import { assertTableStructure } from '../support/interactions.js';
import { AuditLogPage } from '../pages/AuditLogPage.js';

/**
 * AYARLAR → DENETİM GÜNLÜĞÜ (`/settings/audit`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 0 pilotu). SALT-OKUNUR.
 *
 * Denetim günlüğünün deterministik olarak kanıtlanabilir gerçek etkileşim boyutu
 * LİSTE'dir (@ix-table): kolon başlıkları + en az bir dolu log satırı görsel yapıyla
 * doğrulanır. Satır↔API sadakati burada UYGULANMAZ: audit-logs ucu veri-bağlı sayfalanır
 * (canlı UUID/zaman damgası/IP), UI satır sayısı = yanıt uzunluğu garantisi yok.
 *
 * Diğer geçerli boyutlar sözleşmede açık N/A (naInteraction, tested-pages.js):
 *  - search-filter/empty-state: arama kutusu VAR ancak canlı log satırlarından (UUID/
 *    zaman damgası) deterministik salt-okuma daraltma/boş-durum örneği türetmek güvenilir
 *    değil → anti-loop #3 gereği N/A (kapsam @ix-table ile kanıtlanır).
 *  - pagination-sort/loading-state: pager ve ayrı liste-yükleme iskeleti gözlenmedi.
 *
 * Mutasyon YAPILMAZ (create/edit/delete yok; L3 kapsam-dışı).
 */

const I18N = AuditLogPage.I18N;

test.describe('Denetim Günlüğü — tablo etkileşim derinliği', () => {
  test('log tablosu kolonları + en az bir dolu satır görünüyor @ix-table', async ({ app }) => {
    const a = app.auditLog;
    await a.open();
    await assertTableStructure(a.table, a.rows, I18N.en.columns);
  });
});
