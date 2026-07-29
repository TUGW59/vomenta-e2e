// @ts-check
import { test, expect } from './fixtures/test.js';
import { buildCampaign } from './data/factories.js';

/**
 * KAMPANYALAR → GİDEN — VERİ-DEĞİŞTİREN AKIŞLAR (staging/ayrılmış hesap)
 *
 * Keşif + kanıt: docs/kampanyalar-kesif/NOTLAR.md §4 (6 adımlı sihirbaz;
 * oluşturma prod'da 1 kez kullanıcı onayıyla doğrulandı: POST /api/v1/campaigns → 201).
 *
 * Bu akışlar canlı panelde birer MUTATION'dır ve PROD'da çalıştırılmaz:
 *   - @mutation etiketi + mutationGuard → production'da engelli
 *     (playwright.config.js grepInvert @mutation ile prod'dan tamamen dışlanır).
 *   - cleanup: oluşturulan kampanya listedeki çöp ikonuyla (onaylı) geri silinir.
 *
 * Bu spec'in amacı, salt-okunur spec'te L3 = N/A bırakılan katmanları
 * (kampanya GERÇEKTEN oluşuyor mu / siliniyor mu) izole ortamda kapatmaktır.
 *
 * DURUM: test.fixme — GÜVENLİ TEARDOWN teyidi bekliyor. Sihirbazla oluşan kampanya
 *   "Schedule Once" ile SCHEDULED durumunda doğar; keşifte görüldü ki SCHEDULED
 *   kampanyanın listede/detayda/settings'te SİLME (çöp/Delete) düğmesi YOK
 *   (bkz. docs/kampanyalar-kesif/NOTLAR.md gözlem). Dolayısıyla aşağıdaki
 *   liste-çöp cleanup'ı SCHEDULED için çalışmaz. Staging'de teyit edilecek
 *   teardown yolu (yetkili API DELETE veya seed/teardown) hazır olunca açılacak.
 *   Oluşturma akışının kendisi keşifte prod'da 1 kez doğrulandı (POST → 201).
 */
test.describe('Giden Kampanyalar — mutasyonları @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Güvenli teardown bekliyor: SCHEDULED kampanya UI\'dan silinemiyor; staging API DELETE/teardown teyidi gerekli.');

  test('L3 görev OK: sihirbaz uçtan uca kampanya OLUŞTURUYOR (create → detay → cleanup)', async ({
    app,
    page,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Kampanya oluşturma (POST /api/v1/campaigns)');
    const data = buildCampaign();

    // TEMİZLİK (LIFO): oluşturulan kampanyayı listeden çöp ikonuyla sil.
    testEntity.cleanup(async () => {
      const oc = app.campaignsOutbound;
      await oc.open();
      await oc.searchInput.fill(data.name);
      const row = oc.row(data.name);
      if (await row.count()) {
        await oc.rowAction(row, 'delete').click();
        await expect(oc.confirmDialog).toBeVisible();
        await oc.confirmDialog.getByRole('button', { name: /^Delete$/i }).click();
        await expect(oc.confirmDialog).toBeHidden();
      }
    }, `campaign:${data.name}`);

    // Sihirbazı doldur (Voice: kanal adımında caller ID + queue zorunlu; Schedule Once + uzak tarih).
    const wiz = app.campaignCreate;
    await wiz.open();
    await wiz.fillType(data.name);
    await wiz.next(); // → Contacts
    await wiz.chooseContactGroup(/test group/i);
    await wiz.next(); // → Channel
    await wiz.fillVoiceChannel();
    await wiz.next(); // → Schedule
    await wiz.scheduleForFuture(data.scheduledStart);
    await wiz.next(); // → Retry & Pacing
    // Ardışık iki Next arası gözlemlenebilir işaret (sabit bekleme yerine).
    await expect(page.getByText('Max Attempts per Contact', { exact: true })).toBeVisible();
    await wiz.next(); // → Review
    await wiz.submit();

    // L3: kampanya gerçekten oluştu → detay sayfası kampanya adıyla açılır + başarı bildirimi.
    await expect(page).toHaveURL(/\/campaigns\/[0-9a-f-]{36}$/, { timeout: 20000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(data.name);
    await expect(page.getByText(/Campaign created/i)).toBeVisible({ timeout: 10000 });
  });
});
