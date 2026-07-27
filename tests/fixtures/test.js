// @ts-check
import { test as base, expect } from '@playwright/test';
import { ApiClient } from '../api/ApiClient.js';
import { App } from '../pages/App.js';
import { assertMutationsAllowed } from '../../config/environment.js';
import { collectDiagnostics } from './diagnostics.js';

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
        throw new Error(`Test verisi temizlenemedi: ${errors.join('; ')}`);
      }
    }
  },

  diagnostics: [
    async ({ page }, use, testInfo) => {
      const collector = collectDiagnostics(page);
      await use();
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
