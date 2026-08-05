// @ts-check
import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/ApiClient.js';
import { App } from '../pages/App.js';
import { collectDiagnostics } from './diagnostics.js';
import { createMutationGuard } from './mutationGuard.js';
import { createTestEntityRegistry } from './testEntity.js';
import { createArtifacts } from './artifacts.js';
import { redactDeep } from './sanitize.js';
import { AppShell } from '../pages/AppShell.js';
import {
  forensicBugId,
  createForensicRecorder,
  writeForensicEvidence,
  createProfileCapture,
  writeCapturedProfile,
  getForensicTarget,
  resetForensicTarget,
} from './forensic.js';

/**
 * "Sessiz hata yok" guard'ının varsayılan olarak GÖRMEZDEN geldiği, üründe zararsız
 * bilinen gürültü. Buraya eklenen her desen gerekçeli olmalı:
 * - `net::ERR_ABORTED`: uçuştaki istek iptali (React yeniden-render eski fetch'i iptal
 *   eder; Next.js `_rsc` prefetch'leri gezinince iptal olur). İptal = hata değil.
 *   Gerçek ağ hataları (ERR_CONNECTION/ERR_TIMED_OUT), console-error ve HTTP 5xx
 *   hâlâ yakalanır.
 */
const DEFAULT_DIAGNOSTICS_ALLOWLIST = [/net::ERR_ABORTED/, /[?&]_rsc=/];

/**
 * Şirket testlerinin tek giriş noktası.
 *
 * Yeni fixture'lar (API istemcisi, feature flag, rol vb.) buraya eklenir;
 * test dosyaları altyapı ayrıntılarını bilmez.
 */
export const test = base.extend({
  app: async ({ page }, use) => {
    await use(new App(page));
  },

  mutationGuard: async ({ page }, use) => {
    await use(createMutationGuard(page));
  },

  api: async ({ request, mutationGuard }, use) => {
    await use(new ApiClient(request, mutationGuard));
  },

  /**
   * Güvenli artifact ekleme (WP-01). Testler ham `testInfo.attach` yerine bunu
   * kullanır; body maskelenmeden trace'e girmez.
   *   await artifacts.safeAttach('export.csv', { body: csv, contentType: 'text/csv' })
   *   await artifacts.safeScreenshot('profile.png', { mask: [app.header.userMenu()] })
   */
  artifacts: async ({ page }, use, testInfo) => {
    await use(createArtifacts(page, testInfo));
  },

  /**
   * Mutasyon yaşam döngüsü: rollback/cleanup işlemlerini mutasyondan ÖNCE kaydeder,
   * test başarısız olsa da LIFO sırasıyla çalıştırır.
   *
   * Kalıcı create için başlangıç/create/bitiş sayaçlarını ve rollback sırasını
   * yapısal olarak garanti eden zorunlu kullanım:
   *   await testEntity.create({
   *     label: 'ticket',
   *     key,
   *     baseline: () => tickets.countAutomationRecords(),
   *     cleanup: () => api.delete(`/api/tickets/by-key/${key}`),
   *     action: () => api.post('/api/tickets', payload),
   *   })
   *
   * `testEntity.cleanup` yalnız kalıcı create olmayan, açık sözleşmeli N/A
   * akışlarında kullanılabilir; validator bunu zorlar.
   */
  testEntity: async ({}, use, testInfo) => {
    const registry = createTestEntityRegistry();
    await use({
      cleanup: registry.cleanup,
      create: registry.create,
      get created() {
        return registry.created;
      },
    });
    const errors = await registry.teardown();

    if (errors.length > 0) {
      await testInfo.attach('cleanup-errors.json', {
        body: Buffer.from(JSON.stringify(redactDeep(errors), null, 2)),
        contentType: 'application/json',
      });
      throw new Error(
        'KRİTİK ALTYAPI HATASI: test verisi temizlenemedi; tenant baseline dışı kalmış olabilir. ' +
        errors.map(({ label, detail }) => `${label}: ${detail}`).join('; ')
      );
    }
  },

  /**
   * WP-R3 forensik kanıt yakalama (auto). Yalnız `FORENSIC_BUG` set iken etkin;
   * normal koşuda TAMAMEN atıldır (dinleyici yok, dosya yazımı yok). Etkinken ağ
   * özetini toplar ve teardown'da `test-results/findings/<id>/` altına maskeli
   * `network-summary.json` + `safe-final-state.png` yazar. Registry'ye/ürüne dokunmaz.
   */
  forensic: [
    async ({ page }, use) => {
      const id = forensicBugId();
      if (!id) {
        await use(null);
        return;
      }
      resetForensicTarget(); // her forensik test kendi hedefini işaretler (markForensicTarget)
      const recorder = createForensicRecorder(page);
      const profileCapture = createProfileCapture(page, id); // WP-R4: yalnız VERIFY_PROFILE=1 iken aktif
      await use(recorder);
      await recorder.stop();
      await profileCapture.stop();
      const shell = new AppShell(page);
      // Header kimlik yüzeyleri (kullanıcı adı/menüsü) capture anında maskelenir;
      // location.png de AYNI maskelerle alınır. Hedef işaretlenmemişse SKIPPED.
      await writeForensicEvidence({
        page,
        id,
        records: recorder.records,
        masks: [shell.userMenu, shell.presenceMenu],
        target: getForensicTarget(),
      });
      if (profileCapture.active) writeCapturedProfile(id, profileCapture.keys);
    },
    { auto: true },
  ],

  diagnostics: [
    async ({ page }, use, testInfo) => {
      const collector = collectDiagnostics(page);

      /**
       * "Sessiz hata yok" guard'ı. Sayfada console-error / başarısız istek / HTTP 5xx
       * olmadığını doğrular. Beklenen gürültü (ör. Next.js RSC prefetch iptalleri)
       * allowlist ile elenir. Kritik akışlarda çağrılır (opt-in).
       * @param {(string|RegExp)[]} [allowlist] Ek izin verilen desenler (url/metin)
       */
      const assertClean = (allowlist = []) => {
        const rules = [...DEFAULT_DIAGNOSTICS_ALLOWLIST, ...allowlist];
        const allowed = (ev) => {
          const hay = `${ev.text || ''} ${ev.url || ''} ${ev.failure || ''}`;
          return rules.some((r) => (r instanceof RegExp ? r.test(hay) : hay.includes(r)));
        };
        const offenders = collector.events.filter((ev) => !allowed(ev));
        expect(
          offenders,
          `Sayfada sessiz hata var (console-error / failed-request / 5xx):\n${JSON.stringify(offenders.slice(0, 8), null, 2)}`
        ).toEqual([]);
      };

      await use({ get events() { return collector.events; }, assertClean });
      collector.stop();

      if (testInfo.status !== testInfo.expectedStatus && collector.events.length > 0) {
        await testInfo.attach('runtime-diagnostics.json', {
          body: Buffer.from(JSON.stringify(redactDeep(collector.events), null, 2)),
          contentType: 'application/json',
        });
      }
    },
    { auto: true },
  ],
});

export { expect };
// FAZ 2 — forensik konum kanıtı: spec'ler bulgunun hatalı elemanını buradan işaretler.
export { markForensicTarget } from './forensic.js';
