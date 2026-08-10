// @ts-check
import { test, expect } from './fixtures/test.js';
import { AgentMonitorPage } from './pages/AgentMonitorPage.js';

/**
 * SÜPERVİZÖR → TEMSİLCİ İZLEME (`/supervisor/agents`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-2 / ADR-0014). SALT-OKUNUR.
 *
 * Ajan tablosu üzerinde read-only etkileşim boyutlarını makine-okur işaretlerle
 * doğrular: tablo/liste yapısı (@ix-table), ada göre arama-süzme + temizleme
 * (@ix-filter), eşleşmeyen aramada boş-durum (@ix-empty). Süzme/boş-durum
 * davranışı supervisor-agents.authed.spec.js'te L1/L2/L3 olarak zaten kanıtlı;
 * burada makine-okur `@ix-*` derinlik işaretiyle sabitlenir.
 *
 * Kapsam-dışı (sözleşmede naInteraction):
 *  - pagination-sort: veri tek sayfa (≤20 ajan) → "Next" devre dışı; sayfa
 *    döndürülemez (read-only, gerçek çok-sayfa verisi yok).
 *  - loading-state: liste "Live updates" ile sürekli auto-refresh eder; ayrı
 *    deterministik yükleme-iskeleti gözlenmedi (route-gecikmesi polling'e takılır).
 * Mutasyon (Force durum değişikliği) YAPILMAZ.
 */

test.describe('Temsilci İzleme — tablo etkileşim derinliği', () => {
  test('ajan tablosu kolonları + en az bir veri satırı gösteriyor @ix-table', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.table).toBeVisible();
    // Kolonlar mevcut yapı testiyle aynı küme (hardcode değil, gözlenen kolonlar).
    for (const col of ['Agent', 'Status']) {
      await expect(am.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(am.rows.first()).toBeVisible();
    await expect(am.rows.first()).toContainText(/\S/);
  });

  test('ada göre arama satırları süzüyor ve temizleyince geri getiriyor @ix-filter', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.rows.first()).toBeVisible();

    // Stabil prod verisi (supervisor-agents spec L3 arama testiyle aynı): "Account"
    // eşleşen ajanı bırakır, "Product Team" gizlenir → süzme gerçekten daraltıyor.
    await expect(am.page.getByText('Product Team', { exact: true })).toBeVisible();
    await am.searchInput.fill('Account');
    await expect(am.page.getByText('Account Agent', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(am.page.getByText('Product Team', { exact: true })).toBeHidden();

    // Temizle → daha önce gizlenen satır geri gelir (süzme geri alınabilir).
    // Not: canlı auto-refresh tablosunda satır-SAYISI yarışlı; bunun yerine gizlenen
    // satırın yeniden görünürlüğü deterministik geri-alınabilirlik kanıtıdır.
    await am.searchInput.fill('');
    await expect(am.page.getByText('Product Team', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('eşleşmeyen aramada boş-durum (0 satır veya "bulunamadı") @ix-empty', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.rows.first()).toBeVisible();

    await am.searchInput.fill('zzz_no_such_agent_qwerty_9876');
    await expect(async () => {
      const rowCount = await am.rows.count();
      const emptyMsg = await am.page
        .getByText(/no agents|ajan bulunamadı|aucun|no results|not found|empty/i)
        .count();
      expect(rowCount === 0 || emptyMsg > 0).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});
