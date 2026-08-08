// @ts-check
/**
 * RBAC DRIFT DENETÇİSİ + (bilinçli) yeniden-baseline aracı — COV-01.
 *
 * DOKTRİN DEĞİŞİKLİĞİ: `tests/contracts/role-permissions.js` artık canlıdan sessizce
 * ÜRETİLMEZ; o dosya insan-sahipli *beklenen politika*dır. Bu araç iki modda çalışır:
 *
 *   node gen-role-permissions-contract.mjs            # --check (VARSAYILAN)
 *       Canlı-türevi matrisi (gen-roles-matrix.js) sahipli politikayla SEMANTİK
 *       karşılaştırır; fark varsa farkı yazdırır ve exit 1 ile DÜŞER (drift = insan
 *       kararı ister). Hiçbir dosya yazmaz.
 *
 *   node gen-role-permissions-contract.mjs --write    # bilinçli yeniden-baseline
 *       Sahipli politikayı canlı-türevi matristen YENİDEN yazar. Yalnız izin
 *       modelinin gerçekten değiştiği, insan onaylı bir güncellemede kullanılır;
 *       çıktı bir commit'te açıkça gözden geçirilmelidir.
 *
 * Neden: Eski davranış (her koşuda üzerine yaz) + spec'in canlıyı bu dosyayla
 * diff'lemesi bir totolojiydi — "canlı, canlının snapshot'ına eşit mi". Artık canlı,
 * bağımsız sahiplenilmiş politikaya karşı doğrulanır; canlı sapması testi kırar.
 *
 * İçsel invaryantlar (yanlış veri emit etmektense yüksek sesle düşer): katalog=113,
 * 14 kategori, sayımlar 109/106/74/60/29/12, her rol anahtarı katalogda var, tekrar yok.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const GEN = resolve(HERE, 'gen-roles-matrix.js');
const OUT = resolve(REPO, 'tests/contracts/role-permissions.js');
const WRITE = process.argv.includes('--write');

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

// --- hard invariants (canlı-türevi matrisin kendi içi tutarlılığı) ---
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

const j = (v) => JSON.stringify(v);

// --- emit frozen contract (yalnız --write modunda diske yazılır) ---
function renderContract() {
  const roleBlock = (name) =>
    `  ${name}: [\n` + ROLE_PERMISSIONS[name].map((k) => `    ${j(k)},`).join('\n') + `\n  ],`;
  return `// @ts-check
/**
 * RBAC BEKLENEN POLİTİKA (insan-sahipli doğruluk kaynağı) — RBAC test planı FAZ 1.
 *
 * ⚠️ DOKTRİN (COV-01): Bu dosya artık canlıdan OTOMATİK ÜRETİLMEZ. Bu, *istenen*
 * (intended) yetki politikasıdır ve EL İLE sahiplenilir/gözden geçirilir. Testler
 * canlıyı bu politikaya karşı doğrular — canlının kendi snapshot'ına karşı DEĞİL.
 * Böylece "canlı = canlının kopyası" totolojisi kırılır: canlı politikadan saparsa
 * (yeni izin, bir role sızan yetki) test KIRILIR ve insan kararı ister.
 *
 * Drift denetimi (canlı-türevi matris ↔ bu politika farkını raporlar; sessizce
 * absorbe ETMEZ):
 *   node docs/ayarlar-kesif/tools/gen-role-permissions-contract.mjs           # --check (varsayılan): farkı raporla, farklıysa fail
 *   node docs/ayarlar-kesif/tools/gen-role-permissions-contract.mjs --write   # yalnız BİLİNÇLİ yeniden-baseline (insan onayı)
 *
 * Politikanın kökeni (insan-okur gerekçe): docs/ayarlar-kesif/ROLLER-IZIN-MATRISI.md §2.
 * İlk taban 2026-08-05 canlı gözleminden ALINDI, ama artık canlıya değil bu dosyaya
 * bağlıdır; değişiklik açık bir commit + gözden geçirme gerektirir.
 *
 * Doğrulanan sayımlar: katalog=113, 14 kategori,
 * OWNER 109 / ADMIN 106 / MANAGER 74 / SUPERVISOR 60 / AGENT 29 / VIEWER 12.
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
}

if (WRITE) {
  writeFileSync(OUT, renderContract(), 'utf8');
  console.log('WROTE (bilinçli yeniden-baseline)', OUT.replace(REPO + '/', ''));
  console.log('catalog', PERMISSION_CATALOG.length, 'categories', CATEGORIES.length, 'counts', JSON.stringify(COUNTS));
  process.exit(0);
}

// --- --check (VARSAYILAN): canlı-türevi matris ↔ sahipli politika SEMANTİK diff ---
const policy = await import(pathToFileURL(OUT).href);
const drift = [];

const catOf = (arr) => arr.map((p) => `${p.cat}${p.key}${p.name}`);
const diffOrdered = (label, live, owned) => {
  const l = catOf(live);
  const o = catOf(owned);
  const missing = o.filter((x) => !l.includes(x)); // politikada var, canlıda yok
  const extra = l.filter((x) => !o.includes(x)); // canlıda var, politikada yok
  if (missing.length) drift.push(`${label}: politikada VAR, canlıda YOK →\n    ${missing.join('\n    ')}`);
  if (extra.length) drift.push(`${label}: canlıda VAR, politikada YOK (yeni/sızmış?) →\n    ${extra.join('\n    ')}`);
};

// Kategoriler (sıralı).
if (j(CATEGORIES) !== j([...policy.CATEGORIES])) {
  drift.push(`CATEGORIES farklı:\n  canlı:    ${j(CATEGORIES)}\n  politika: ${j([...policy.CATEGORIES])}`);
}
// Katalog (sıralı, cat+key+name).
diffOrdered('PERMISSION_CATALOG', PERMISSION_CATALOG, [...policy.PERMISSION_CATALOG]);
// Rol izin kümeleri (küme; sıra önemsiz).
for (const role of ORDER) {
  const live = new Set(ROLE_PERMISSIONS[role]);
  const owned = new Set(policy.ROLE_PERMISSIONS[role] || []);
  const missing = [...owned].filter((k) => !live.has(k)).sort();
  const extra = [...live].filter((k) => !owned.has(k)).sort();
  if (missing.length) drift.push(`${role}: politikada VAR, canlıda YOK → ${missing.join(', ')}`);
  if (extra.length) drift.push(`${role}: canlıda VAR, politikada YOK (sızmış yetki?) → ${extra.join(', ')}`);
}
// Sayımlar.
for (const role of ORDER) {
  if (COUNTS[role] !== policy.EXPECTED_COUNTS[role]) {
    drift.push(`${role} sayım: canlı ${COUNTS[role]} != politika ${policy.EXPECTED_COUNTS[role]}`);
  }
}

if (drift.length) {
  console.error(
    'RBAC DRIFT: canlı-türevi matris, sahipli politikadan (tests/contracts/role-permissions.js) SAPIYOR.\n' +
      'Bu KASITLI bir izin-modeli değişikliğiyse politikayı gözden geçirip `--write` ile yeniden-baseline al;\n' +
      'değilse canlı taraf beklenmedik biçimde değişmiş demektir (güvenlik incelemesi).\n\n' +
      drift.join('\n')
  );
  process.exit(1);
}
console.log('OK: canlı-türevi matris ile sahipli politika örtüşüyor (drift yok).');
console.log('catalog', PERMISSION_CATALOG.length, 'categories', CATEGORIES.length, 'counts', JSON.stringify(COUNTS));
