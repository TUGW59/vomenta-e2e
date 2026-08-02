// @ts-check
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env'), quiet: true });

const DEFAULT_BASE_URL = 'https://app.vomenta.com';
const PRODUCTION_HOSTNAME = 'app.vomenta.com';
const PRODUCTION_API_HOSTNAME = 'api.vomenta.com';
const SUPPORTED_ROLES = ['default', 'admin', 'supervisor', 'agent'];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function booleanValue(value, fallback = false) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function rolePrefix(role) {
  return role === 'default' ? 'VOMENTA' : `VOMENTA_${role.toUpperCase()}`;
}

function inferEnvironment(baseURL) {
  return new URL(baseURL).hostname === 'app.vomenta.com' ? 'production' : 'staging';
}

const baseURL = process.env.BASE_URL || DEFAULT_BASE_URL;
const parsedBaseURL = new URL(baseURL);
const name = process.env.TEST_ENV || inferEnvironment(baseURL);

if (!['http:', 'https:'].includes(parsedBaseURL.protocol)) {
  throw new Error(`BASE_URL http veya https olmalı: ${baseURL}`);
}

export const environment = Object.freeze({
  name,
  baseURL: parsedBaseURL.origin,
  isCI: booleanValue(process.env.CI),
  runVisualTests: booleanValue(process.env.RUN_VISUAL_TESTS, !process.env.CI),
  isProduction: name === 'production',
  allowMutations: booleanValue(process.env.ALLOW_MUTATING_TESTS),
  mutationApiOrigin: process.env.MUTATION_API_ORIGIN || '',
  mutationTenantId: process.env.MUTATION_TENANT_ID || '',
  mutationTenantSlug: process.env.MUTATION_TENANT_SLUG || '',
  retries: positiveInteger(process.env.PLAYWRIGHT_RETRIES, process.env.CI ? 2 : 1),
  workers: positiveInteger(process.env.PLAYWRIGHT_WORKERS, process.env.CI ? 2 : 4),
  actionTimeout: positiveInteger(process.env.PLAYWRIGHT_ACTION_TIMEOUT, 15_000),
  navigationTimeout: positiveInteger(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT, 30_000),
  expectTimeout: positiveInteger(process.env.PLAYWRIGHT_EXPECT_TIMEOUT, 15_000),
  discovery: Object.freeze({
    maxPages: positiveInteger(process.env.DISCOVERY_MAX_PAGES, 40),
    slowThresholdMs: positiveInteger(process.env.DISCOVERY_SLOW_THRESHOLD_MS, 2_000),
    updateBaseline: booleanValue(process.env.DISCOVERY_UPDATE_BASELINE),
  }),
  defaultUserDisplayName:
    process.env.VOMENTA_USER_DISPLAY_NAME || 'Tuğçe Topuz',
  // Yalnızca staging E2E (arama/SMS) için ayrılmış test numarası. Boşsa ilgili
  // mutation testleri atlanır. Gerçek numara .env'de tutulur, repoya GİRMEZ.
  testPhone: process.env.VOMENTA_TEST_PHONE || '',
  testContactPhone: process.env.VOMENTA_TEST_CONTACT_PHONE || '',
  testAgentEmail: process.env.VOMENTA_TEST_AGENT_EMAIL || '',
});

export function authStatePath(role = 'default') {
  return `playwright/.auth/${role}.json`;
}

export function hasRoleCredentials(role) {
  const prefix = rolePrefix(role);
  return Boolean(process.env[`${prefix}_EMAIL`] && process.env[`${prefix}_PASSWORD`]);
}

export function configuredRoles() {
  return SUPPORTED_ROLES.filter(hasRoleCredentials);
}

export function credentialsFor(role = 'default') {
  const prefix = rolePrefix(role);
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];

  if (!email || !password) {
    throw new Error(
      `${prefix}_EMAIL ve ${prefix}_PASSWORD tanımlı olmalı. ` +
        'Yerelde .env, CI ortamında secret kullanın.'
    );
  }

  return { email, password };
}

/**
 * Veri değiştiren bir test başlamadan önce ortam kilitlerini doğrular.
 * Production için kaçış bayrağı yoktur: mutation yalnızca açık opt-in, staging
 * ortamı, production dışı origin ve açıkça tanımlı test tenant kimliğiyle açılır.
 */
export function assertMutationEnvironment(reason, candidate = environment) {
  if (!candidate.allowMutations) {
    throw new Error(
      `"${reason}" veri değiştiriyor. Mutasyon testleri yalnızca ` +
        'ALLOW_MUTATING_TESTS=true ile (npm run test:mutation) çalışır.'
    );
  }

  if (candidate.name !== 'staging') {
    throw new Error(
      `"${reason}" reddedildi: mutation yalnızca TEST_ENV=staging ortamında çalışır. ` +
        'Production mutasyonu teknik olarak kapalıdır.'
    );
  }

  const hostname = new URL(candidate.baseURL).hostname;
  if (hostname === PRODUCTION_HOSTNAME) {
    throw new Error(
      `"${reason}" reddedildi: staging adı verilse bile production origin'i ` +
        `(${candidate.baseURL}) mutation için kullanılamaz.`
    );
  }

  let apiOrigin;
  try {
    apiOrigin = new URL(candidate.mutationApiOrigin).origin;
  } catch {
    throw new Error(
      `"${reason}" reddedildi: MUTATION_API_ORIGIN geçerli staging API origin'i olmalı.`
    );
  }
  if (
    apiOrigin !== candidate.mutationApiOrigin ||
    new URL(apiOrigin).hostname === PRODUCTION_API_HOSTNAME
  ) {
    throw new Error(
      `"${reason}" reddedildi: MUTATION_API_ORIGIN production API olamaz ve ` +
        'yalnız origin biçiminde yazılmalıdır.'
    );
  }

  if (!UUID_PATTERN.test(candidate.mutationTenantId || '')) {
    throw new Error(
      `"${reason}" reddedildi: MUTATION_TENANT_ID ayrılmış staging tenant UUID'si olmalı.`
    );
  }

  if (!candidate.mutationTenantSlug?.trim()) {
    throw new Error(
      `"${reason}" reddedildi: MUTATION_TENANT_SLUG ayrılmış staging tenant slug'ı olmalı.`
    );
  }

  return {
    apiOrigin,
    tenantId: candidate.mutationTenantId,
    tenantSlug: candidate.mutationTenantSlug,
  };
}

/**
 * `/api/v1/auth/me` sözleşmesinden gelen oturum tenant'ını beklenen staging
 * tenant'ıyla eşleştirir. Üçlü eşleşme yanlış hesap/tenant oturumunu fail-fast
 * durdurur: data.tenantId + data.tenant.id + data.tenant.slug.
 */
export function assertMutationTenant(reason, profile, candidate = environment) {
  const expected = assertMutationEnvironment(reason, candidate);
  const data = profile?.success === true ? profile.data : undefined;

  if (
    !data ||
    data.tenantId !== expected.tenantId ||
    data.tenant?.id !== expected.tenantId ||
    data.tenant?.slug !== expected.tenantSlug
  ) {
    throw new Error(
      `"${reason}" reddedildi: kimliği doğrulanmış oturum, yapılandırılmış ` +
        'ayrılmış staging tenant ile eşleşmiyor.'
    );
  }

  return expected;
}
