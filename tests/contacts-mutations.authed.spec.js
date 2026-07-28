// @ts-check
import { test, expect } from './fixtures/test.js';
import { ContactsPage } from './pages/ContactsPage.js';
import { buildPeopleContact } from './data/factories.js';

/**
 * KİŞİLER — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * 3 katmanlı standardın L3 katmanı: Add Contact kontrolünün amacı KALICI kayıtla gerçekleşiyor mu
 * (L1/L2 contacts.authed.spec.js'te). Senaryo: yeni kişi oluştur → aramada bulun → VIP etiket
 * filtresiyle bulun → SADECE oluşturulan kişiyi sil. Diğer kişilere DOKUNULMAZ.
 *
 * ÇİFT KİLİT (config/environment.js · playwright.config.js):
 *   Kilit 1 — ALLOW_MUTATING_TESTS=true yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — CANLI tenant'a yazmak için ayrıca ALLOW_PROD_MUTATIONS=true.
 *   Çalıştırma: npm run test:mutation (staging) / npm run test:mutation:prod (canlı, yalnızca test hesabı).
 *
 * GÜVENLİK: mutationGuard ile başlar; cleanup, oluşturulan kişiyi ADINA göre bulup API ile siler
 *   (yakalanan Bearer). Cleanup create'ten ÖNCE kaydedilir → test ortada patlasa da kayıt silinir.
 *   Silme ucu canlıda doğrulandı: DELETE /api/v1/contacts/{id} → 204.
 */
test.describe('Kişiler — L3 mutasyonları @regression @mutation', () => {
  // Retry yok: mutation testi retry'da yeniden kayıt oluşturup churn/orphan riski yaratır.
  test.describe.configure({ retries: 0 });


  test('L3 görev OK: Add Contact kalıcı kişi oluşturuyor; arama ve VIP etiket filtresi buluyor', async ({
    app,
    mutationGuard,
    cleanup,
  }) => {
    mutationGuard('Kişiler: yeni kişi oluşturma + etiketleme');
    const c = app.contacts;
    const data = buildPeopleContact(); // firstName PW, lastName Auto…, phone +90… (E.164), tag VIP

    await c.open();
    // Bulletproof cleanup: ne olursa olsun bu addaki kişileri sil (yalnızca oluşturulan)
    cleanup(async () => {
      await c.deleteContactsByName(data.lastName);
    });

    // OLUŞTUR (VIP etiketiyle) — GERÇEK POST
    await c.openNewContactForm();
    await c.fillNewContact(data);
    const id = await c.saveNewContact();
    expect(id, 'oluşturma POST bir kişi id döndürmeli (data.contact.id)').toBeTruthy();

    // L3-a: kalıcı kayıt gözlemlenebilir → ARAMA oluşturulan kişiyi buluyor
    await c.open();
    await c.searchFor(data.lastName);
    await expect(c.rows.filter({ hasText: data.lastName }).first()).toBeVisible({ timeout: 10000 });

    // L3-b: ETİKETLEME çalışıyor → VIP filtresi oluşturulan (VIP) kişiyi buluyor
    await c.open();
    await c.tagChip('VIP').click();
    await expect(c.rows.filter({ hasText: data.lastName }).first()).toBeVisible({ timeout: 10000 });
  });
});
