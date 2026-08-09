// @ts-check
import dotenv from 'dotenv';
import path from 'path';
import {
  ENVIRONMENTS,
  environmentByHostname,
  PRODUCTION_API_HOSTNAME,
  PRODUCTION_HOSTNAME,
} from './environments.js';

// Ortam seçimi TEST_ENV ile yapılır (script/shell'den gelir; ör. `npm run test:dev`).
// Önce ortam-özel dosya (.env.<env>) yüklenir; sonra genel .env fallback olarak
// gelir. dotenv zaten tanımlı değişkenleri EZMEZ, bu yüzden ortam-özel dosya kazanır.
// Böylece dev'in test hesabı ile prod'un admin hesabı aynı .env'de karışmaz.
const requestedEnv = process.env.TEST_ENV;
// Shell/CI'den GELEN BASE_URL açık bir override'dır (dotenv'den önce yakalanır).
const shellBaseURL = process.env.BASE_URL;
let perEnvBaseURL;
if (requestedEnv) {
  const loaded = dotenv.config({
    path: path.resolve(`.env.${requestedEnv}`),
    quiet: true,
  });
  perEnvBaseURL = loaded.parsed?.BASE_URL;
}
dotenv.config({ path: path.resolve('.env'), quiet: true });

const DEFAULT_BASE_URL = ENVIRONMENTS.production.baseURL;
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

/**
 * Ortam adını ve baseURL'i çözer. Öncelik (yukarıdan aşağıya):
 *   1) AÇIK override — shell/CI veya .env.<env> içinde BASE_URL verilmişse onu
 *      kullan; adı TEST_ENV > host'tan çıkarım > 'staging' ile belirle.
 *   2) TEST_ENV bilinen bir kaydı (production/dev) adlandırıyorsa baseURL registry'den
 *      gelir. Böylece `npm run test:dev` çalışır ve base .env'deki eski/kalıntı
 *      BASE_URL ortamlar arası SIZMAZ.
 *   3) Aksi halde base .env'deki BASE_URL (eski tek-dosya kullanımı için geriye dönük).
 *   4) Hiçbiri yoksa production varsayılanı.
 */
function resolveTarget() {
  const explicitBaseURL = shellBaseURL || perEnvBaseURL;
  if (explicitBaseURL) {
    const matched = environmentByHostname(new URL(explicitBaseURL).hostname);
    // Açıkça override edilen URL'in adını, base .env'den sızabilecek TEST_ENV değil,
    // shell'den gelen TEST_ENV (requestedEnv) veya host çıkarımı belirler.
    return {
      name: requestedEnv || matched?.name || 'staging',
      baseURL: explicitBaseURL,
    };
  }

  const envName = process.env.TEST_ENV || 'production';
  const registryBaseURL = ENVIRONMENTS[envName]?.baseURL;
  if (registryBaseURL) {
    return { name: envName, baseURL: registryBaseURL };
  }

  const legacyBaseURL = process.env.BASE_URL;
  if (legacyBaseURL) {
    const matched = environmentByHostname(new URL(legacyBaseURL).hostname);
    return { name: process.env.TEST_ENV || matched?.name || 'staging', baseURL: legacyBaseURL };
  }

  return { name: envName, baseURL: DEFAULT_BASE_URL };
}

/**
 * FAIL-CLOSED ortam-tutarlılık guard'ı (F-007 / ADR-0032).
 *
 * Çözülen `name` SABİT hostname'li bilinen bir registry ortamıysa (production/dev),
 * çözülen `baseURL` host'u o ortamın kayıtlı hostname'iyle EŞLEŞMELİDİR. Aksi halde
 * açıkça durur — böylece base `.env`'den SIZAN bir `BASE_URL` (ör. `TEST_ENV=dev`
 * koşumunu app.vomenta.com'a düşürmesi) SESSİZ yanlış-ortam / yanlış-yeşil üretemez.
 *
 * Kök neden: `shellBaseURL`, environment.js import edilmeden ÖNCE başka bir modül
 * base `.env`'i dotenv'lerse kirlenebilir; o zaman prod URL "açık override" gibi
 * davranıp `name=dev` iken `baseURL=prod` verir. Sabit host'u olmayan ortamlar
 * (staging) — özel URL alabildiği için — muaftır.
 *
 * @param {string} name çözülen ortam adı
 * @param {string} baseURL çözülen baseURL
 */
export function assertEnvironmentConsistency(name, baseURL) {
  const registeredHostname = ENVIRONMENTS[name]?.hostname;
  if (!registeredHostname) return; // staging/bilinmeyen: sabit host yok → muaf
  const host = new URL(baseURL).hostname;
  if (host !== registeredHostname) {
    throw new Error(
      `Ortam tutarsızlığı (F-007): name='${name}' ${registeredHostname} bekler ama ` +
        `baseURL host='${host}' (${baseURL}). Muhtemelen base .env'den sızan BASE_URL, ` +
        `TEST_ENV='${process.env.TEST_ENV || ''}' koşumunu YANLIŞ ortama düşürüyor. ` +
        'Açık BASE_URL yalnız gerçek shell/CI değişkeninden gelmeli ve TEST_ENV ile tutarlı olmalı.'
    );
  }
}

const target = resolveTarget();
const baseURL = target.baseURL;
const parsedBaseURL = new URL(baseURL);
const name = target.name;

if (!['http:', 'https:'].includes(parsedBaseURL.protocol)) {
  throw new Error(`BASE_URL http veya https olmalı: ${baseURL}`);
}

// FAIL-CLOSED: dev/prod koşumu yanlışlıkla diğer ortamın host'una düşerse ERKEN dur.
assertEnvironmentConsistency(name, parsedBaseURL.origin);

export const environment = Object.freeze({
  name,
  baseURL: parsedBaseURL.origin,
  // Registry'den türeyen bilgiler (bilinmeyen host için güvenli varsayılanlar).
  // vpnOnly yalnızca dokümantasyon/erişim notu; mutable ise ortamın @mutation'a
  // uygun olup olmadığını belgeler (asıl kilit yine assertMutationEnvironment'ta).
  apiHostname: ENVIRONMENTS[name]?.apiHostname || '',
  vpnOnly: ENVIRONMENTS[name]?.vpnOnly ?? false,
  mutable: ENVIRONMENTS[name]?.mutable ?? false,
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
  // Giriş yapan kullanıcının başlıkta görünen adı ORTAM-ÖZELDİR (prod ve dev'de
  // farklıdır) ve VOMENTA_USER_DISPLAY_NAME ile her ortamın .env'inden gelir.
  // Kaynakta kişi adı SABİTLENMEZ; tanımsızsa AppShell stabil bir düğmeye düşer.
  defaultUserDisplayName: process.env.VOMENTA_USER_DISPLAY_NAME || '',
  // Yalnızca staging E2E (arama/SMS) için ayrılmış test numarası. Boşsa ilgili
  // mutation testleri atlanır. Gerçek numara .env'de tutulur, repoya GİRMEZ.
  testPhone: process.env.VOMENTA_TEST_PHONE || '',
  testContactPhone: process.env.VOMENTA_TEST_CONTACT_PHONE || '',
  testAgentEmail: process.env.VOMENTA_TEST_AGENT_EMAIL || '',
  // COV-01 çapraz-rol enforcement: agent'ın erişememesi gereken korunan API ucu
  // (opt-in doğrudan-uç probu; boşsa ilgili test görünür biçimde atlanır).
  agentForbiddenEndpoint: process.env.VOMENTA_AGENT_FORBIDDEN_ENDPOINT || '',
});

export function authStatePath(role = 'default') {
  // WP-CI-SHARD: paralel shard + kontrollü retry (attempt) izolasyonu için auth
  // dizini env ile geçersiz kılınabilir. Böylece aynı makinede eşzamanlı shard'lar
  // ve bir shard'ın attempt-1/attempt-2 koşumları AYRI storageState kullanır →
  // paylaşılan `playwright/.auth/default.json` üzerinde yarış (ENOENT) olmaz ve
  // kontrollü retry TAZE bağımsız login üretir. Boşsa varsayılan davranış korunur.
  const base = (process.env.PW_AUTH_DIR || 'playwright/.auth').replace(/\/+$/, '');
  return `${base}/${role}.json`;
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
    // Ön-koşul (preflight) hatası: kimlik bilgisi yokken login DENENMEZ.
    // Böylece kök .env eksikliği, login sonrası anlamsız bir "sayfa gelmedi"
    // hatası yerine burada açık ve uygulanabilir bir mesajla erken durur.
    throw new Error(
      `Kimlik doğrulama ön-koşulu eksik: ${prefix}_EMAIL ve ${prefix}_PASSWORD tanımlı değil ` +
        `(rol: ${role}). Girişli testler başlayamaz. Yerelde kök .env dosyası oluşturup ` +
        'bu değişkenleri tanımlayın (bkz. .env.example); CI ortamında repo secret olarak sağlayın.'
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
