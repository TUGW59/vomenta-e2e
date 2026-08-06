// @ts-check
import { test, expect } from '../fixtures/test.js';

/**
 * AYARLAR › ÇALIŞMA SAATLERİ — L3 GÖREV OK (VERİ-DEĞİŞTİREN / opt-in mutation)
 *
 * Senaryo (geri-döndürülebilir): Cumartesi "Open" switch'inin durumunu oku → tersine çevir →
 * Save changes → yeniden yükle → yeni durum KALICI mı doğrula → eski duruma geri al → Save.
 * Yeni kayıt OLUŞTURMAZ (yalnız mevcut config toggle'ı) → zero-orphan.
 *
 * STAGING KİLİDİ: @mutation + mutationGuard → production'da çalışmaz.
 * GÜVENLİK: cleanup Cumartesi'yi ORİJİNAL durumuna geri getirir (test patlasa da).
 */
const SATURDAY_INDEX = 5; // 0=Pzt … 5=Cmt

test.describe('Çalışma Saatleri — L3 mutasyonu @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test.fixme(true, 'Staging teyidi bekliyor: haftalık program Save kalıcılık + switch geri-alma yolu ayrılmış staging tenant\'ında doğrulanmadı.');

  test('L3 görev OK: Cumartesi Open switch toggle → Save → kalıcı → geri al', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    await mutationGuard('Çalışma Saatleri: Cumartesi switch toggle + geri al');
    const h = app.businessHours;
    const sat = () => h.daySwitches.nth(SATURDAY_INDEX);
    const save = () => h.saveButton.click();

    // Save'i gerçek kaydetme isteğiyle bekle (sabit bekleme YOK).
    const saveAndWait = async () => {
      const res = h.page.waitForResponse(
        (r) => ['PATCH', 'PUT', 'POST'].includes(r.request().method()) && r.url().includes('/api/'),
        { timeout: 15000 }
      );
      await save();
      await res;
    };

    await h.open();
    const original = await sat().isChecked();

    testEntity.cleanup(async () => {
      await h.open();
      if ((await sat().isChecked()) !== original) {
        await sat().click();
        await saveAndWait();
      }
    }, `hours-saturday-restore:${original}`);

    // 1) TOGGLE + SAVE
    await sat().click();
    await expect(sat()).toBeChecked({ checked: !original });
    await saveAndWait();

    // 2) KALICILIK (L3): yeniden yükle, yeni durum sunucudan geri geliyor mu?
    await h.open();
    await expect(sat()).toBeChecked({ checked: !original });

    // 3) GERİ AL
    await sat().click();
    await expect(sat()).toBeChecked({ checked: original });
    await saveAndWait();
    await h.open();
    await expect(sat()).toBeChecked({ checked: original });
  });
});
