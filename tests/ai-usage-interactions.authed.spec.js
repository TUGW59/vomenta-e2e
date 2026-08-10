// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertTableStructure } from './support/interactions.js';

/**
 * YAPAY ZEKA → KULLANIM (`/ai/usage`) — L2 ETKİLEŞİM DERİNLİĞİ (C1 / ADR-0014). SALT-OKUNUR.
 *
 * Kullanım tablosu ("Usage by Feature") üzerinde read-only etkileşim boyutunu makine-okur
 * işaretle doğrular: tablo/liste yapısı + en az bir veri satırı (@ix-table). Tablo
 * GET /api/v1/ai/usage ile veri-bağlı (ai-subroutes.authed.spec.js gözlemiyle uyumlu).
 *
 * Kapsam-dışı (sözleşmede naInteraction, dürüst): sekme/serbest-metin arama YOK
 * (yalnız dönem seçici combobox); pagination/loading ayrı yüzey gözlenmedi.
 */

test.describe('AI Kullanım — tablo etkileşim derinliği', () => {
  test('kullanım tablosu + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const u = app.aiUsage;
    await u.open();
    await assertTableStructure(u.table, u.rows);
  });
});
