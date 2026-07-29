import assert from 'node:assert/strict';
import { createTestEntityRegistry } from '../tests/fixtures/testEntity.js';
import {
  mutationLaneMessages,
  mutationSafetyMessages,
} from './architecture-rules.mjs';

// Action daha başlamadan rollback kayıtlı olmalı: action patlasa da cleanup çalışır.
{
  const events = [];
  const registry = createTestEntityRegistry();
  await assert.rejects(
    registry.create({
      label: 'action-failure',
      cleanup: async () => events.push('cleanup'),
      action: async () => {
        events.push('action');
        throw new Error('create failed after write');
      },
    }),
    /create failed after write/
  );
  assert.deepEqual(events, ['action']);
  assert.deepEqual(await registry.teardown(), []);
  assert.deepEqual(events, ['action', 'cleanup']);
}

// Cleanup hatası kaybolmamalı; kayıt kimliğiyle raporlanmalı.
{
  const registry = createTestEntityRegistry();
  registry.cleanup(async () => {
    throw new Error('delete rejected');
  }, 'orphan-candidate');
  assert.deepEqual(await registry.teardown(), [
    { label: 'orphan-candidate', detail: 'delete rejected' },
  ]);
}

// Cleanup'lar bağımlılık sırasını korumak için LIFO çalışmalı.
{
  const events = [];
  const registry = createTestEntityRegistry();
  registry.cleanup(async () => events.push('parent'), 'parent');
  registry.cleanup(async () => events.push('child'), 'child');
  assert.deepEqual(await registry.teardown(), []);
  assert.deepEqual(events, ['child', 'parent']);
}

// Statik kapı, retry/fixture/guard eksiklerini ve güvensiz lane'i reddetmeli.
{
  const unsafeSpec = `
    test.describe('örnek @mutation', () => {
      test('write', async ({ cleanup }) => cleanup(() => {}));
    });
  `;
  assert.deepEqual(mutationSafetyMessages(unsafeSpec), [
    '@mutation testi mutationGuard kullanmalı',
    '@mutation testi testEntity yaşam-döngüsü fixture’ını kullanmalı',
    '@mutation spec’i doğrudan çalıştırıldığında da retry yapmamalı: test.describe.configure({ retries: 0 })',
    '@mutation spec’inde ham cleanup yasak; testEntity.cleanup/create kullanın',
  ]);

  const safeSpec = `
    test.describe('örnek @mutation', () => {
      test.describe.configure({ retries: 0 });
      test('write', async ({ mutationGuard, testEntity }) => {
        mutationGuard('write');
        testEntity.cleanup(async () => {}, 'entity');
      });
    });
  `;
  assert.deepEqual(mutationSafetyMessages(safeSpec), []);
  assert.equal(mutationLaneMessages({
    'test:mutation': 'playwright test --retries=0 --workers=1',
    'test:mutation:prod': 'playwright test --retries=0 --workers=1',
  }).length, 0);
  assert.equal(mutationLaneMessages({}).length, 4);
}

console.log(
  'Mutation safety self-check geçti: pre-registration, görünür hata, LIFO ve negatif statik kapılar.'
);
