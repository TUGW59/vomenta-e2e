// @ts-check
import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/ApiClient.js';
import { App } from '../pages/App.js';
import { assertMutationsAllowed } from '../../config/environment.js';
import { collectDiagnostics } from './diagnostics.js';

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

  mutationGuard: async ({}, use) => {
    await use((reason) => assertMutationsAllowed(reason));
  },

  api: async ({ request, mutationGuard }, use) => {
    await use(new ApiClient(request, mutationGuard));
  },

  /**
   * Testin oluşturduğu kayıtları LIFO sırasıyla, test başarısız olsa da temizler.
   * Kullanım: cleanup(() => api.delete(`/api/tickets/${id}`))
   */
  cleanup: async ({}, use, testInfo) => {
    const actions = [];
    await use((action) => actions.push(action));

    const errors = [];
    for (const action of actions.reverse()) {
      try {
        await action();
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    if (errors.length > 0) {
      await testInfo.attach('cleanup-errors.json', {
        body: Buffer.from(JSON.stringify(errors, null, 2)),
        contentType: 'application/json',
      });
      if (testInfo.status === testInfo.expectedStatus) {
        // Cleanup başarısızlığı test başarısını GEÇERSİZ kılar: orphan kaldı demektir.
        throw new Error(
          `KRİTİK ALTYAPI HATASI — test verisi temizlenemedi (ORPHAN riski, canlı tenant): ` +
            errors.join('; ')
        );
      }
    }
  },

  /**
   * Orphan-sıfır test verisi fabrikası: bir kayıt OLUŞTURULDUĞU AN silmesini otomatik
   * kaydeder (create + cleanup aynı çağrı). Böylece "oluştur ama temizliği kaydetmeyi
   * unut" yapısal olarak imkânsızdır. cleanup fixture'ının kritik-hata garantisini miras alır.
   * Bkz. AGENTS.md → "Mutasyon güvenliği standardı (orphan-sıfır)".
   *
   * Kullanım:
   *   const contact = await testEntity.create({
   *     label: 'contact',
   *     create: () => contacts.createViaUI(data),      // {id,...} döndürür
   *     remove: (e) => contacts.deleteContactViaApi(e.id),
   *   });
   */
  testEntity: async ({ cleanup }, use) => {
    const created = [];
    const helper = {
      async create({ create, remove, label = 'test-entity' }) {
        if (typeof create !== 'function' || typeof remove !== 'function') {
          throw new Error('testEntity.create: `create` ve `remove` birer fonksiyon olmalı');
        }
        const entity = await create();
        created.push({ label, entity });
        // SİLME, oluşturma anında kaydedilir — LIFO cleanup teardown'da her hâlde çalışır.
        cleanup(async () => {
          await remove(entity);
        });
        return entity;
      },
      get created() {
        return created;
      },
    };
    await use(helper);
  },

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
          body: Buffer.from(JSON.stringify(collector.events, null, 2)),
          contentType: 'application/json',
        });
      }
    },
    { auto: true },
  ],
});

export { expect };
