// @ts-check
/**
 * MUTATION STAGING PREFLIGHT — Faz 7 kabul aracı.
 *
 * Mutation testlerini FİİLEN ÇALIŞTIRMADAN, staging bağlamının doğru kurulup
 * kurulmadığını doğrular. Secret DEĞERLERİNİ yazdırmaz; yalnız SET/EKSİK + biçim
 * geçerliliği + `assertMutationEnvironment` composite verdiktini raporlar.
 *
 * Kullanım:
 *   npm run mutation:preflight            # .env staging olarak ayarlıysa
 *   ALLOW_MUTATING_TESTS=true TEST_ENV=staging BASE_URL=... npm run mutation:preflight
 *
 * Çıkış kodu: tüm ortam kapıları geçerse 0, aksi halde 1. Tenant KİMLİK eşleşmesi
 * (/auth/me) yalnız gerçek koşumda doğrulanır; bu araç onu "runtime'da doğrulanır"
 * olarak işaretler.
 */
import { environment, assertMutationEnvironment } from '../config/environment.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const line = (label, ok, note) =>
  `  ${ok ? '✓' : '✗'} ${label}${note ? ` — ${note}` : ''}`;

const rows = [];
let hardFail = false;

// Değer sızdırmadan durum: yalnız SET/EKSİK + biçim.
const present = (v) => typeof v === 'string' && v.trim() !== '';

// 1) Opt-in bayrağı
rows.push(line('ALLOW_MUTATING_TESTS=true', environment.allowMutations,
  environment.allowMutations ? 'açık' : 'kapalı (grepInvert @mutation testleri eler)'));

// 2) Ortam adı staging
rows.push(line('TEST_ENV=staging', environment.name === 'staging',
  `mevcut: ${environment.name}`));

// 3) BASE_URL production değil
const baseIsProd = /(^|\.)app\.vomenta\.com$/i.test(new URL(environment.baseURL).hostname);
rows.push(line('BASE_URL production değil', !baseIsProd, environment.baseURL));

// 4) MUTATION_API_ORIGIN set + production değil + yalnız origin
let apiOriginOk = present(environment.mutationApiOrigin);
let apiNote = apiOriginOk ? 'SET' : 'EKSİK';
if (apiOriginOk) {
  try {
    const u = new URL(environment.mutationApiOrigin);
    const isProdApi = /(^|\.)api\.vomenta\.com$/i.test(u.hostname);
    const isOriginOnly = environment.mutationApiOrigin === u.origin;
    apiOriginOk = !isProdApi && isOriginOnly;
    apiNote = isProdApi ? 'production API — REDDEDİLİR' : !isOriginOnly ? 'yalnız origin olmalı (path yok)' : 'SET, geçerli origin';
  } catch { apiOriginOk = false; apiNote = 'geçersiz URL'; }
}
rows.push(line('MUTATION_API_ORIGIN', apiOriginOk, apiNote));

// 5) MUTATION_TENANT_ID UUID
const tenantIdOk = UUID_PATTERN.test(environment.mutationTenantId || '');
rows.push(line('MUTATION_TENANT_ID (UUID)', tenantIdOk,
  present(environment.mutationTenantId) ? (tenantIdOk ? 'SET, geçerli UUID' : 'SET ama UUID değil') : 'EKSİK'));

// 6) MUTATION_TENANT_SLUG set
const slugOk = present(environment.mutationTenantSlug);
rows.push(line('MUTATION_TENANT_SLUG', slugOk, slugOk ? 'SET' : 'EKSİK'));

// 7) Staging test hesabı (guard'dan bağımsız ama koşum için gerekli)
rows.push(line('VOMENTA_EMAIL / VOMENTA_PASSWORD',
  present(process.env.VOMENTA_EMAIL) && present(process.env.VOMENTA_PASSWORD),
  present(process.env.VOMENTA_EMAIL) && present(process.env.VOMENTA_PASSWORD) ? 'SET' : 'EKSİK (auth.setup başarısız olur)'));

// 8) Koşullu numaralar (yalnız bilgilendirme; eksikse ilgili testler skip)
rows.push(line('VOMENTA_TEST_CONTACT_PHONE (opsiyonel)', true,
  present(environment.testContactPhone) ? 'SET' : 'EKSİK → contacts/profile testleri skip'));
rows.push(line('VOMENTA_TEST_PHONE (opsiyonel)', true,
  present(environment.testPhone) ? 'SET' : 'EKSİK → gerçek çağrı/SMS testleri skip'));

// Composite authoritative verdikt (guard'ın gerçekte kullandığı fonksiyon).
let composite;
try {
  const expected = assertMutationEnvironment('preflight', environment);
  composite = `✓ assertMutationEnvironment GEÇTİ (apiOrigin=${expected.apiOrigin})`;
} catch (error) {
  hardFail = true;
  composite = `✗ assertMutationEnvironment REDDETTİ — ${error instanceof Error ? error.message : String(error)}`;
}

console.log('Mutation staging preflight:\n');
console.log(rows.join('\n'));
console.log('\n' + composite);
console.log('\nNot: Tenant KİMLİK eşleşmesi (/api/v1/auth/me) yalnız gerçek koşumda doğrulanır.');

if (hardFail) {
  console.error('\nPREFLIGHT BAŞARISIZ: staging bağlamı eksik/yanlış. Mutation koşumu güvenle DURUR.');
  process.exit(1);
}
console.log('\nPREFLIGHT GEÇTİ: ortam kapıları hazır. Sırada: npm run test:mutation:list → npm run test:mutation');
