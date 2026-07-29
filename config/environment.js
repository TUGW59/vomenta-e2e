// @ts-check
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env'), quiet: true });

const DEFAULT_BASE_URL = 'https://app.vomenta.com';
const SUPPORTED_ROLES = ['default', 'admin', 'supervisor', 'agent'];

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
  allowProdMutations: booleanValue(process.env.ALLOW_PROD_MUTATIONS),
  retries: positiveInteger(process.env.PLAYWRIGHT_RETRIES, process.env.CI ? 2 : 1),
  workers: positiveInteger(process.env.PLAYWRIGHT_WORKERS, process.env.CI ? 2 : 4),
  actionTimeout: positiveInteger(process.env.PLAYWRIGHT_ACTION_TIMEOUT, 15_000),
  navigationTimeout: positiveInteger(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT, 30_000),
  expectTimeout: positiveInteger(process.env.PLAYWRIGHT_EXPECT_TIMEOUT, 15_000),
  defaultUserDisplayName:
    process.env.VOMENTA_USER_DISPLAY_NAME || 'Tuğçe Topuz',
  // Yalnızca staging E2E (arama/SMS) için ayrılmış test numarası. Boşsa ilgili
  // mutation testleri atlanır. Gerçek numara .env'de tutulur, repoya GİRMEZ.
  testPhone: process.env.VOMENTA_TEST_PHONE || '',
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
 * Veri değiştiren bir test başlamadan önce çağrılır — ÇİFT KİLİT opt-in.
 * Kilit 1: mutation testleri yalnızca açık bayrakla (her ortamda) çalışır.
 * Kilit 2: CANLI (production) tenant'a yazmak ayrıca ikinci bir onay bayrağı ister.
 */
export function assertMutationsAllowed(reason) {
  if (!environment.allowMutations) {
    throw new Error(
      `"${reason}" veri değiştiriyor. Mutasyon testleri yalnızca ` +
        'ALLOW_MUTATING_TESTS=true ile (npm run test:mutation) çalışır.'
    );
  }
  if (environment.isProduction && !environment.allowProdMutations) {
    throw new Error(
      `"${reason}" CANLI tenant'a (${environment.baseURL}) yazıyor. ` +
        'Bunun için ayrıca ALLOW_PROD_MUTATIONS=true gerekir (npm run test:mutation:prod). ' +
        'Tercihen ayrılmış bir test hesabı/staging kullanın.'
    );
  }
}
