// @ts-check
import { test, expect } from './fixtures/test.js';
import { OrganizationPage } from './pages/OrganizationPage.js';

/**
 * AYARLAR › KURULUŞ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * 3 katmanlı standardın L3 katmanı: "Save changes" kalıcı kaydı GERÇEKTEN yazıyor mu?
 * Senaryo (geri-döndürülebilir): mevcut Website değerini oku → yeni test değeri yaz →
 * Save changes (PATCH/PUT /settings/organization) → yeniden yükle → kalıcı mı doğrula →
 * cleanup ile ESKİ değere geri al. Yalnız Website alanına dokunulur; şirket adı/dil/para
 * birimi DEĞİŞMEZ (Website en az görünür, güvenli geri-döndürülebilir alan).
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — ALLOW_MUTATING_TESTS=true yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnızca ayrılmış staging tenant'ında `npm run test:mutation`.
 *
 * GÜVENLİK: mutationGuard ile başlar; testEntity.cleanup ORİJİNAL Website'i değişiklikten
 *   ÖNCE kaydeder ve test ortada patlasa bile eski değere döner.
 */
const TEST_WEBSITE = 'https://automation-e2e.example.org';

test.describe('Kuruluş — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: website PATCH/PUT /settings/organization kalıcılık + geri-alma yolu ayrılmış staging tenant\'ında doğrulanmadı.');

  test('L3 görev OK: Website değiştir → Save → kalıcı → eski değere geri al', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Kuruluş: Website güncelle + geri al');
    const o = app.organization;

    await o.open();
    const original = await o.websiteValue();

    testEntity.cleanup(async () => {
      await o.open();
      const current = await o.websiteValue();
      if (current !== original) await o.saveWebsite(original);
    }, `org-website-restore:${original || '(boş)'}`);

    // 1) DEĞİŞTİR + KAYDET — GERÇEK PATCH/PUT /settings/organization
    expect(TEST_WEBSITE, 'test değeri orijinalden farklı olmalı').not.toBe(original);
    await o.saveWebsite(TEST_WEBSITE);

    // 2) KALICILIK (L3): yeniden yükle, yeni değer sunucudan geri geliyor mu?
    await o.open();
    await expect(o.websiteInput).toHaveValue(TEST_WEBSITE, { timeout: 10000 });

    // 3) GERİ AL (test içinde de açıkça — cleanup yine garanti eder)
    await o.saveWebsite(original);
    await o.open();
    await expect(o.websiteInput).toHaveValue(original, { timeout: 10000 });
  });
});
