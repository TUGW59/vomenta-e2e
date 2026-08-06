// @ts-check
/**
 * `tests/contracts/role-permissions.js`'i (donmuş RBAC veri modeli) TEK KAYNAK
 * `gen-roles-matrix.js`'ten deterministik üretir. El ile transkripsiyon YOK:
 * generator'ın literal dizileri sandbox'ta (vm) değerlendirilir, kontrat yazılır.
 *
 * Kullanım (kaynak değişince yeniden koş):
 *   node docs/ayarlar-kesif/tools/gen-role-permissions-contract.mjs
 *
 * İçsel invaryantlar (yanlış veri emit etmektense yüksek sesle düşer): katalog=113,
 * 14 kategori, sayımlar 109/106/74/60/29/12, her rol anahtarı katalogda var, tekrar yok.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const GEN = resolve(HERE, 'gen-roles-matrix.js');
const OUT = resolve(REPO, 'tests/contracts/role-permissions.js');

// Generator'ı sandbox'ta değerlendir; console çıktısını sustur, const'ları yakala.
const src = readFileSync(GEN, 'utf8');
const sandbox = { console: { log() {}, error() {} } };
createContext(sandbox);
runInContext(
  src +
    '\n;globalThis.__out = { catalog, ADMIN_MISSING, OWNER_MISSING, AGENT, MANAGER, SUPERVISOR, VIEWER, allKeys, ADMIN, OWNER };',
  sandbox
);
const D = sandbox.__out;

const ORDER = ['OWNER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'AGENT', 'VIEWER'];
const CATEGORIES = [...new Set(D.catalog.map((r) => r[0]))];
const PERMISSION_CATALOG = D.catalog.map(([cat, key, name]) => ({ cat, key, name }));
const ROLE_PERMISSIONS = {
  OWNER: D.OWNER,
  ADMIN: D.ADMIN,
  MANAGER: D.MANAGER,
  SUPERVISOR: D.SUPERVISOR,
  AGENT: D.AGENT,
  VIEWER: D.VIEWER,
};
const COUNTS = Object.fromEntries(ORDER.map((r) => [r, ROLE_PERMISSIONS[r].length]));

// --- hard invariants ---
const errs = [];
if (PERMISSION_CATALOG.length !== 113) errs.push(`catalog ${PERMISSION_CATALOG.length} != 113`);
if (CATEGORIES.length !== 14) errs.push(`categories ${CATEGORIES.length} != 14`);
const WANT = { OWNER: 109, ADMIN: 106, MANAGER: 74, SUPERVISOR: 60, AGENT: 29, VIEWER: 12 };
for (const [r, n] of Object.entries(WANT)) if (COUNTS[r] !== n) errs.push(`${r} ${COUNTS[r]} != ${n}`);
const keySet = new Set(D.allKeys);
if (keySet.size !== D.allKeys.length) errs.push('catalog has duplicate keys');
for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
  for (const k of keys) if (!keySet.has(k)) errs.push(`${role} unknown key ${k}`);
  if (new Set(keys).size !== keys.length) errs.push(`${role} duplicate keys`);
}
if (errs.length) {
  console.error('INVARIANT FAIL:\n' + errs.join('\n'));
  process.exit(1);
}

// --- emit frozen contract ---
const j = (v) => JSON.stringify(v);
const roleBlock = (name) =>
  `  ${name}: [\n` + ROLE_PERMISSIONS[name].map((k) => `    ${j(k)},`).join('\n') + `\n  ],`;

const out = `// @ts-check
/**
 * RBAC doğruluk kaynağı (donmuş veri modeli) — RBAC test planı FAZ 1.
 *
 * OTOMATİK ÜRETİLDİ — EL İLE DÜZENLEME. Tek kaynak:
 *   docs/ayarlar-kesif/tools/gen-roles-matrix.js  (canlıdan çıkarım, 2026-08-05)
 *   docs/ayarlar-kesif/ROLLER-IZIN-MATRISI.md §2  (insan-okur matris)
 * Yeniden üret: node docs/ayarlar-kesif/tools/gen-role-permissions-contract.mjs
 *
 * Doğrulanan sayımlar: katalog=113, 14 kategori,
 * OWNER 109 / ADMIN 106 / MANAGER 74 / SUPERVISOR 60 / AGENT 29 / VIEWER 12.
 * ADMIN/OWNER, katalogdan ADMIN_MISSING/OWNER_MISSING çıkarılarak türetilir.
 */

/** 14 izin kategorisi (katalog sırası). */
export const CATEGORIES = Object.freeze([
${CATEGORIES.map((c) => `  ${j(c)},`).join('\n')}
]);

/**
 * 113 izinlik katalog. Her kayıt \`{ cat, key, name }\`.
 * @type {ReadonlyArray<{ cat: string, key: string, name: string }>}
 */
export const PERMISSION_CATALOG = Object.freeze([
${PERMISSION_CATALOG.map((p) => `  Object.freeze({ cat: ${j(p.cat)}, key: ${j(p.key)}, name: ${j(p.name)} }),`).join('\n')}
]);

/**
 * Her rolün seçili izin anahtarları (OWNER→VIEWER).
 * @type {Readonly<Record<'OWNER'|'ADMIN'|'MANAGER'|'SUPERVISOR'|'AGENT'|'VIEWER', ReadonlyArray<string>>>}
 */
export const ROLE_PERMISSIONS = Object.freeze({
${ORDER.map(roleBlock).join('\n')}
});

/** Rol başına beklenen izin sayısı (assert edilecek). */
export const EXPECTED_COUNTS = Object.freeze({
${ORDER.map((r) => `  ${r}: ${COUNTS[r]},`).join('\n')}
});
`;

writeFileSync(OUT, out, 'utf8');
console.log('WROTE', OUT.replace(REPO + '/', ''));
console.log('catalog', PERMISSION_CATALOG.length, 'categories', CATEGORIES.length, 'counts', JSON.stringify(COUNTS));
