import assert from 'node:assert/strict';
import {
  assertMutationEnvironment,
  assertMutationTenant,
} from '../config/environment.js';
import { createMutationGuard } from '../tests/fixtures/mutationGuard.js';
import { createTestEntityRegistry } from '../tests/fixtures/testEntity.js';
import {
  mutationLaneMessages,
  mutationSafetyMessages,
} from './architecture-rules.mjs';

// Action daha başlamadan rollback kayıtlı olmalı: action patlasa da cleanup çalışır.
{
  const events = [];
  let count = 0;
  const registry = createTestEntityRegistry();
  await assert.rejects(
    registry.create({
      label: 'action-failure',
      key: 'VOMENTA_E2E_ACTION_FAILURE',
      baseline: async () => count,
      cleanup: async () => {
        events.push('cleanup');
        count = 0;
      },
      action: async () => {
        events.push('action');
        count = 1;
        throw new Error('create failed after write');
      },
    }),
    /create failed after write/
  );
  assert.deepEqual(events, ['action']);
  assert.deepEqual(await registry.teardown(), []);
  assert.deepEqual(events, ['action', 'cleanup']);
}

// Cleanup hatası ve sıfırlanmayan baseline birlikte görünür kalmalı.
{
  let count = 0;
  const registry = createTestEntityRegistry();
  await registry.create({
    label: 'orphan-candidate',
    key: 'VOMENTA_E2E_ORPHAN',
    baseline: async () => count,
    cleanup: async () => {
      throw new Error('delete rejected');
    },
    action: async () => {
      count = 1;
      return { id: 'entity-1' };
    },
  });
  const errors = await registry.teardown();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].label, 'orphan-candidate');
  assert.match(errors[0].detail, /rollback: delete rejected/);
  assert.match(errors[0].detail, /orphan baseline: başlangıç=0, bitiş=1/);
}

// Kirli başlangıçta action hiç çağrılmamalı.
{
  let actionCalled = false;
  const registry = createTestEntityRegistry();
  await assert.rejects(
    registry.create({
      label: 'dirty-start',
      key: 'VOMENTA_E2E_DIRTY',
      baseline: async () => 2,
      cleanup: async () => {},
      action: async () => {
        actionCalled = true;
      },
    }),
    /başlangıç baseline=2/
  );
  assert.equal(actionCalled, false);
  assert.deepEqual(await registry.teardown(), []);
}

// Başarılı create 0→1→0 sayacını ve kayıt metadata'sını kanıtlamalı.
{
  let count = 0;
  const registry = createTestEntityRegistry();
  const entity = await registry.create({
    label: 'clean-lifecycle',
    key: 'VOMENTA_E2E_CLEAN',
    baseline: async () => count,
    cleanup: async () => {
      count = 0;
    },
    action: async () => {
      count = 1;
      return { id: 'entity-2' };
    },
  });
  assert.deepEqual(entity, { id: 'entity-2' });
  assert.deepEqual(registry.created, [
    {
      label: 'clean-lifecycle',
      key: 'VOMENTA_E2E_CLEAN',
      prefixNaReason: null,
    },
  ]);
  assert.deepEqual(await registry.teardown(), []);
  assert.equal(count, 0);
}

// Zorunlu önek veya açık N/A gerekçesi olmadan create açılamamalı.
{
  const registry = createTestEntityRegistry();
  const common = {
    label: 'identity-policy',
    baseline: async () => 0,
    cleanup: async () => {},
    action: async () => {},
  };
  await assert.rejects(
    registry.create({ ...common, key: 'customer-record' }),
    /zorunlu otomasyon öneki/
  );
  await assert.rejects(
    registry.create({ ...common }),
    /prefixNaReason/
  );
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
    '@mutation spec’i kalıcı create için testEntity.create yaşam döngüsünü kullanmalı',
    '@mutation spec’i doğrudan çalıştırıldığında da retry yapmamalı: test.describe.configure({ retries: 0 })',
    '@mutation spec’inde ham cleanup yasak; testEntity.cleanup/create kullanın',
  ]);
  assert.ok(
    mutationSafetyMessages(
      "test.fixme('gelecek akış @mutation', async () => {});"
    ).includes('@mutation testi mutationGuard kullanmalı'),
    'test.fixme üzerindeki @mutation etiketi güvenlik kapısından kaçmamalı'
  );

  const safeSpec = `
    test.describe('örnek @mutation', () => {
      test.describe.configure({ retries: 0 });
      test('write', async ({ mutationGuard, testEntity }) => {
        await mutationGuard('write');
        await testEntity.create({
          label: 'entity',
          key: 'VOMENTA_E2E_ENTITY',
          baseline: async () => 0,
          cleanup: async () => {},
          action: async () => {},
        });
      });
    });
  `;
  assert.deepEqual(mutationSafetyMessages(safeSpec), []);
  assert.deepEqual(
    mutationSafetyMessages(safeSpec.replace('await mutationGuard', 'mutationGuard')),
    [
      '@mutation testi tenant preflight tamamlanmadan ilerleyemez: mutationGuard await edilmeli',
    ]
  );
  const excludedFixmeSpec = `
    test.describe('örnek @mutation', () => {
      test.describe.configure({ retries: 0 });
      test.fixme(true, 'staging teardown bekliyor');
      test('write', async ({ mutationGuard, testEntity }) => {
        await mutationGuard('write');
        testEntity.cleanup(async () => {}, 'transient');
      });
    });
  `;
  assert.deepEqual(
    mutationSafetyMessages(excludedFixmeSpec, {
      lifecycleExclusion: {
        mode: 'fixme',
        reason: 'N/A: teardown kanıtlanmadı',
      },
    }),
    []
  );
  assert.deepEqual(
    mutationSafetyMessages(
      excludedFixmeSpec.replace("test.fixme(true, 'staging teardown bekliyor');", ''),
      {
        lifecycleExclusion: {
          mode: 'fixme',
          reason: 'N/A: teardown kanıtlanmadı',
        },
      }
    ),
    [
      'mutation yaşam-döngüsü N/A istisnası yalnız test.fixme varken geçerlidir',
    ]
  );
  const readOnlyAuditSpec = `
    const MUTATION_LIFECYCLE_READ_ONLY = true;
    test.describe('orphan denetimi @mutation', () => {
      test.describe.configure({ retries: 0 });
      test('scan', async ({ mutationGuard }) => {
        await mutationGuard('read-only scan');
      });
    });
  `;
  const readOnlyExclusion = {
    mode: 'read-only',
    reason: 'N/A: yalnız baseline okur',
  };
  assert.deepEqual(
    mutationSafetyMessages(readOnlyAuditSpec, {
      lifecycleExclusion: readOnlyExclusion,
    }),
    []
  );
  assert.deepEqual(
    mutationSafetyMessages(
      readOnlyAuditSpec.replace(
        'const MUTATION_LIFECYCLE_READ_ONLY = true;',
        ''
      ),
      { lifecycleExclusion: readOnlyExclusion }
    ),
    [
      'salt-okunur mutation denetimi MUTATION_LIFECYCLE_READ_ONLY = true işareti taşımalı',
    ]
  );
  assert.deepEqual(
    mutationSafetyMessages(
      readOnlyAuditSpec.replace(
        "await mutationGuard('read-only scan');",
        "await mutationGuard('read-only scan'); await app.contacts.createContact();"
      ),
      { lifecycleExclusion: readOnlyExclusion }
    ),
    [
      'salt-okunur mutation denetimi write fixture’ı veya create/save/delete/publish çağrısı içeremez',
    ]
  );
  assert.equal(mutationLaneMessages({
    'test:mutation': 'playwright test --retries=0 --workers=1',
  }).length, 0);
  assert.equal(mutationLaneMessages({}).length, 2);
  assert.deepEqual(
    mutationLaneMessages({
      'test:mutation': 'ALLOW_PROD_MUTATIONS=true playwright test --retries=0 --workers=1',
      'test:mutation:prod': 'playwright test --retries=0 --workers=1',
    }),
    [
      'test:mutation:prod yasak: production mutasyonu için kaçış komutu bulunamaz',
      'test:mutation production izin bayrağı içeremez; yalnız staging desteklenir',
    ]
  );
}

const stagingPolicy = {
  allowMutations: true,
  name: 'staging',
  baseURL: 'https://staging.vomenta.example',
  mutationApiOrigin: 'https://api.staging.example',
  mutationTenantId: '11111111-1111-4111-8111-111111111111',
  mutationTenantSlug: 'vomenta-e2e',
};

// Ortam kilitleri production için hiçbir kaçış yolu bırakmamalı.
{
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        allowMutations: false,
      }),
    /ALLOW_MUTATING_TESTS=true/
  );
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        name: 'production',
      }),
    /yalnızca TEST_ENV=staging/
  );
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        baseURL: 'https://app.vomenta.com',
      }),
    /production origin/
  );
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        mutationApiOrigin: 'https://api.vomenta.com',
      }),
    /production API/
  );
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        mutationApiOrigin: 'https://api.staging.example/v1',
      }),
    /yalnız origin biçiminde/
  );
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        mutationTenantId: '',
      }),
    /MUTATION_TENANT_ID/
  );
  assert.throws(
    () =>
      assertMutationEnvironment('write', {
        ...stagingPolicy,
        mutationTenantSlug: '',
      }),
    /MUTATION_TENANT_SLUG/
  );
  assert.deepEqual(assertMutationEnvironment('write', stagingPolicy), {
    apiOrigin: stagingPolicy.mutationApiOrigin,
    tenantId: stagingPolicy.mutationTenantId,
    tenantSlug: stagingPolicy.mutationTenantSlug,
  });
}

// Oturum profili, tenant kimliğinin üç alanında da birebir eşleşmeli.
{
  const matchingProfile = {
    success: true,
    data: {
      tenantId: stagingPolicy.mutationTenantId,
      tenant: {
        id: stagingPolicy.mutationTenantId,
        slug: stagingPolicy.mutationTenantSlug,
      },
    },
  };
  assert.deepEqual(
    assertMutationTenant('write', matchingProfile, stagingPolicy),
    {
      apiOrigin: stagingPolicy.mutationApiOrigin,
      tenantId: stagingPolicy.mutationTenantId,
      tenantSlug: stagingPolicy.mutationTenantSlug,
    }
  );
  assert.throws(
    () =>
      assertMutationTenant(
        'write',
        {
          ...matchingProfile,
          data: { ...matchingProfile.data, tenantId: 'wrong-tenant' },
        },
        stagingPolicy
      ),
    /oturum.*eşleşmiyor/
  );
  assert.throws(
    () =>
      assertMutationTenant(
        'write',
        {
          ...matchingProfile,
          data: {
            ...matchingProfile.data,
            tenant: { ...matchingProfile.data.tenant, slug: 'customer-tenant' },
          },
        },
        stagingPolicy
      ),
    /oturum.*eşleşmiyor/
  );
}

// Async guard salt-okunur preflight'ı bir kez yapmalı ve sonucu önbelleğe almalı.
{
  let navigations = 0;
  const response = {
    request: () => ({ method: () => 'GET' }),
    url: () => 'https://api.staging.example/api/v1/auth/me',
    ok: () => true,
    status: () => 200,
    json: async () => ({
      success: true,
      data: {
        tenantId: stagingPolicy.mutationTenantId,
        tenant: {
          id: stagingPolicy.mutationTenantId,
          slug: stagingPolicy.mutationTenantSlug,
        },
      },
    }),
  };
  const page = {
    async waitForResponse(predicate) {
      assert.equal(predicate(response), true);
      return response;
    },
    async goto(path, options) {
      navigations += 1;
      assert.equal(path, '/');
      assert.deepEqual(options, { waitUntil: 'domcontentloaded' });
    },
  };
  const guard = createMutationGuard(page, stagingPolicy);
  await guard('first write');
  await guard('second write');
  assert.equal(navigations, 1);
}

console.log(
  'Mutation safety self-check geçti: staging-only tenant, 0→1→0 orphan baseline, pre-registration, görünür cleanup hatası, LIFO ve negatif statik kapılar.'
);
