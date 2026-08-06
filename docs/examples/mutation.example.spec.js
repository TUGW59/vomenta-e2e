// @ts-check
// -----------------------------------------------------------------------------
// MUTATION TEST ŞABLONU (kopyala-çalıştır)
//
// Bu dosya `tests/` DIŞINDADIR; Playwright onu TOPLAMAZ ve ASLA koşmaz. Yeni bir
// veri-değiştiren (mutation) test yazarken bu dosyayı:
//   tests/<alan>-mutations.authed.spec.js
// olarak KOPYALAYIN, importları `../` yerine gerçek göreli yola göre düzeltin
// (tests/ altından import: '../fixtures/test.js', '../data/factories.js').
//
// Ayrıntılı rehber: docs/MUTATION-TESTS-GUIDE.md
// Bu bir kod-mutasyon (Stryker) testi DEĞİLDİR; uygulama verisini değiştiren E2E testidir.
// -----------------------------------------------------------------------------

import { test, expect } from '../../tests/fixtures/test.js';
import { testEntityName } from '../../tests/data/factories.js';

// KURAL: mutation spec'i doğrudan çalıştırılsa bile retry YAPMAZ (yan etki tekrarı yasak).
test.describe.configure({ retries: 0 });

// KURAL: describe başlığı @mutation taşımalı (grep/CI seçimi buna bağlı). @regression standart.
test.describe('Örnek Alan — L3 mutasyonu @regression @mutation', () => {
  test('L3 görev OK: kayıt oluştur → doğrula → sil (0→1→0)', async ({
    page,
    app,          // sayfa nesneleri (Page Object) — kendi alanınızın app.<alan> API'si
    api,          // ApiClient (guard'a bağlı; write öncesi guard'ı zorunlu kılar)
    mutationGuard,
    testEntity,
  }) => {
    // 1) ÖN KOŞUL: gereken env yoksa güvenle atla (örnek).
    //    test.skip(!process.env.VOMENTA_TEST_CONTACT_PHONE, 'VOMENTA_TEST_CONTACT_PHONE eksik');

    // 2) GÜVENLİ ORTAM: ilk yazmadan ÖNCE. 6 kapı (staging + tenant + /auth/me) burada doğrulanır.
    await mutationGuard('Örnek Alan: kayıt oluştur + sil');

    // 3) TEST VERİSİ: değiştirilemez otomasyon öneki + benzersiz suffix (paralel-güvenli).
    const key = testEntityName('EXAMPLE'); // -> VOMENTA_E2E_EXAMPLE_<benzersiz>

    // 4) İŞLEM + 5) DOĞRULAMA + 6/7) CLEANUP: hepsi testEntity.create ile.
    //    - baseline: mutasyon ÖNCESİ kayıt sayısı (0 olmalı; değilse test etkinleşmez).
    //    - cleanup:  rollback; action'dan ÖNCE kaydedilir, teardown'da LIFO çalışır.
    //    - action:   asıl yazma; dönüş değeri istenirse sonraki adımlarda kullanılır.
    //    Fixture create-sonrası baseline=1 ve teardown-sonrası baseline=0'ı ZORLAR (orphan-zero).
    await testEntity.create({
      label: 'example-record',
      key,
      baseline: async () => app.example.countAutomationRecords(key),
      cleanup: async () => api.delete(`/api/v1/example/by-key/${key}`),
      action: async () => {
        const res = await api.post('/api/v1/example', { name: key });
        expect(res.status()).toBe(201);
        await expect(app.example.rowByName(key)).toBeVisible(); // L3 UI doğrulaması
        return res;
      },
    });

    // İsimsiz kalıcı varlıklarda `key` yerine açık gerekçe verin:
    //   prefixNaReason: 'N/A: <neden isim yok>'
  });

  // ---------------------------------------------------------------------------
  // GÜVENLİ SİLME YOLU YOKSA: testi fixme yapın ve tests/contracts/mutation-lifecycle.js'e
  // gerekçe ekleyin. "Yeşil ama kirli bırakan" test YASAKTIR.
  //
  // test.fixme(true, 'Staging teyidi bekliyor: <alan> delete ucu kanıtlanmadı.');
  // ---------------------------------------------------------------------------
});
