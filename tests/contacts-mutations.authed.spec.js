// @ts-check
import { test, expect } from './fixtures/test.js';
import { ContactsPage } from './pages/ContactsPage.js';
import {
  AUTOMATION_ENTITY_PREFIXES,
  buildPeopleContact,
} from './data/factories.js';
import { environment } from '../config/environment.js';

const I18N = ContactsPage.I18N;

/**
 * KİŞİLER — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * 3 katmanlı standardın L3 katmanı. Senaryo (kullanıcı akışı): yeni kişi oluştur →
 * aramada bul → satırı seç → TOPLU ETİKET (Etiket→VIP→Confirm) → VIP filtresiyle bul →
 * satırı seç → TOPLU SİL (Sil→Confirm). SADECE oluşturulan kişiye dokunulur; satır
 * "ada göre" seçilir (sıralamadan bağımsız), böylece başka kişi asla seçilmez.
 *
 * STAGING KİLİDİ (config/environment.js · mutationGuard):
 *   Kilit 1 — ALLOW_MUTATING_TESTS=true yoksa @mutation her yerde dışlanır.
 *   Kilit 2 — staging origin + beklenen `/auth/me` tenant kimliği eşleşir.
 *   Çalıştırma: yalnızca ayrılmış staging tenant'ında npm run test:mutation.
 *
 * GÜVENLİK: mutationGuard ile başlar; testEntity.create rollback'i create'ten
 *   ÖNCE kaydeder, oluşturulan kişiyi benzersiz adına göre siler ve `0→1→0`
 *   baseline'ını kanıtlar. Uçlar canlıda doğrulandı: POST /contacts→201, PATCH /contacts/bulk,
 *   DELETE /contacts/{id}→204.
 */
test.describe('Kişiler — L3 mutasyonları @regression @mutation', () => {
  // Retry yok: mutation retry'da yeniden kayıt oluşturup churn/orphan riski yaratır.
  test.describe.configure({ retries: 0 });

  test('L3 görev OK: kişi oluştur → ara → toplu Etiket (VIP) → toplu Sil', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    test.skip(!environment.testContactPhone, 'VOMENTA_TEST_CONTACT_PHONE eksik');

    await mutationGuard('Kişiler: oluştur + toplu etiketle + toplu sil');
    const c = app.contacts;
    const data = buildPeopleContact();

    await c.open();
    // 1) OLUŞTUR (etiketsiz) — GERÇEK POST /contacts
    const id = await testEntity.create({
      label: `contact:${data.key}`,
      key: data.key,
      baseline: () =>
        c.automationContactCount(AUTOMATION_ENTITY_PREFIXES),
      cleanup: () => c.deleteContactsByName(data.lastName),
      action: async () => {
        await c.openNewContactForm();
        await c.fillNewContact({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        });
        return c.saveNewContact();
      },
    });
    expect(id, 'oluşturma POST bir kişi id döndürmeli (data.contact.id)').toBeTruthy();

    // 2) ARAMA oluşturulan kişiyi buluyor (kalıcı kayıt gözlemlenebilir)
    await c.open();
    await c.searchFor(data.lastName);
    await expect(c.rows.filter({ hasText: data.lastName }).first()).toBeVisible({ timeout: 10000 });

    // 3) TOPLU ETİKET: doğru satırı seç → Etiket → VIP → Confirm (PATCH /contacts/bulk)
    await c.selectRowByText(data.lastName);
    await c.bulkAddTag(data.tag);
    // Etiketleme gözlemlenebilir: VIP filtresi oluşturulan kişiyi buluyor
    await c.open();
    await c.tagChip('VIP').click();
    await expect(c.rows.filter({ hasText: data.lastName }).first()).toBeVisible({ timeout: 10000 });

    // 4) TOPLU SİL: doğru satırı seç → Sil → Confirm (DELETE /contacts/{id})
    await c.open();
    await c.searchFor(data.lastName);
    await c.selectRowByText(data.lastName);
    await c.bulkDeleteConfirm();
    // Silme gözlemlenebilir: artık aramada yok (boş-durum)
    await c.open();
    await c.searchFor(data.lastName);
    await expect(c.page.getByText(I18N.en.emptyHeading)).toBeVisible({ timeout: 10000 });
  });
});
