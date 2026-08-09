// @ts-check
/**
 * HAM `test.fail(true, …)` ↔ ENVANTER UZLAŞTIRMA KAPISI (yönetişim; drift önleme).
 *
 * `tests/` altındaki her ham `test.fail(true, 'Bulgu: …')` sitesinin
 * `tests/contracts/raw-expected-fails.js` envanterinde TEK yerde kayıtlı olduğunu ve
 * hiçbir envanter girdisinin STALE (spec'te karşılığı yok) olmadığını kanıtlar.
 * Ayrıca `registryFinding` non-null ise `known-bugs.js`'te var olmalı (dedup bağı).
 *
 * Kapsam: yalnız `test.fail(true, …)` (KOŞULSUZ beklenen-başarısızlık). `knownBugGuard`
 * içindeki `test.fail()` (argümansız) ve koşullu `test.fail(cond, …)` kapsam DIŞI.
 *
 * Çalıştır:  node tools/self-check-raw-expected-fails.mjs  (npm run quality:raw-test-fail)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { RAW_EXPECTED_FAILS } from '../tests/contracts/raw-expected-fails.js';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';

const root = process.cwd();
const TEST_DIR = path.join(root, 'tests');

/** @param {string} dir @returns {string[]} */
function listSpecFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (entry.endsWith('-snapshots') || entry === 'node_modules') continue;
      out.push(...listSpecFiles(full));
    } else if (entry.endsWith('.spec.js')) {
      // `test.fail` yalnız spec kapsamında anlamlıdır; contracts/support/fixtures taranmaz.
      out.push(full);
    }
  }
  return out;
}

/**
 * Bir kaynakta koşulsuz `test.fail(true, '<msg>')` sitelerini çıkarır.
 * Tek/çift tırnak + iç kaçışları (\\', \\") doğru işler.
 * @param {string} src
 * @returns {{ line: number, msg: string }[]}
 */
export function extractRawTestFails(src) {
  /** @type {{ line: number, msg: string }[]} */
  const hits = [];
  // test.fail ( true , '...'|"..." )  — string literalinde kaçışlı tırnaklara izin ver.
  const re = /\btest\.fail\(\s*true\s*,\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    // Yorum satırlarını atla (kaynakta örnek/kapalı test.fail): satır `//` içeriyorsa
    // veya JSDoc `*` ile başlıyorsa gerçek çağrı sayılmaz.
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const before = src.slice(lineStart, m.index);
    const trimmed = before.trimStart();
    if (before.includes('//') || trimmed.startsWith('*')) continue;
    const raw = m[1] !== undefined ? m[1] : m[2];
    // JS string kaçışlarını çöz (\\' → ', \\" → ", \\\\ → \\).
    const msg = raw.replace(/\\(['"\\])/g, '$1');
    hits.push({ line: src.slice(0, m.index).split('\n').length, msg });
  }
  return hits;
}

/**
 * Envanteri spec siteleriyle uzlaştırır. Saf fonksiyon → meta-test edilebilir.
 * @param {{file:string,msg:string}[]} sites
 * @param {readonly {file:string,includes:string,registryFinding:(string|null)}[]} inventory
 * @param {Set<string>} knownIds
 * @returns {string[]} ihlal mesajları (boş = OK)
 */
export function reconcile(sites, inventory, knownIds) {
  const errs = [];
  const match = (site, e) => site.file === e.file && site.msg.includes(e.includes);

  // 1) Her site en az bir envanter girdisiyle örtülmeli (aksi = kayıtsız ham test.fail).
  for (const s of sites) {
    if (!inventory.some((e) => match(s, e))) {
      errs.push(`Kayıtsız ham test.fail: ${s.file} — "${s.msg.slice(0, 60)}…" (raw-expected-fails.js'e ekle)`);
    }
  }
  // 2) Her envanter girdisi en az bir siteyi örtmeli (aksi = stale girdi).
  for (const e of inventory) {
    if (!sites.some((s) => match(s, e))) {
      errs.push(`Stale envanter girdisi: ${e.file} includes="${e.includes}" (spec'te karşılığı yok → sil)`);
    }
  }
  // 3) Sayı eşitliği: geniş bir `includes` bir siteyi maskeleyemesin.
  if (sites.length !== inventory.length) {
    errs.push(`Sayı uyuşmazlığı: ${sites.length} ham test.fail sitesi ≠ ${inventory.length} envanter girdisi`);
  }
  // 4) registryFinding non-null ise registry'de var olmalı.
  for (const e of inventory) {
    if (e.registryFinding != null && !knownIds.has(e.registryFinding)) {
      errs.push(`Bilinmeyen registryFinding: ${e.file} → "${e.registryFinding}" known-bugs.js'te yok`);
    }
  }
  return errs;
}

function selfTest() {
  const errs = [];
  // extraction: iç çift tırnak + kaçışlı tek tırnak
  const ex = extractRawTestFails(
    `test.fail(true, 'a "x" b');\n test.fail(true, 'placeholder\\'ı c');\n test.fail(cond, 'skip');\n test.fail();`
  );
  if (ex.length !== 2) errs.push(`extract: beklenen 2, bulunan ${ex.length}`);
  if (ex[0] && ex[0].msg !== 'a "x" b') errs.push(`extract msg0: "${ex[0] && ex[0].msg}"`);
  if (ex[1] && ex[1].msg !== "placeholder'ı c") errs.push(`extract msg1: "${ex[1] && ex[1].msg}"`);

  const inv = [{ file: 'f.js', includes: 'kapat', registryFinding: null }];
  const ok = reconcile([{ file: 'f.js', msg: 'kapat butonu' }], inv, new Set());
  if (ok.length !== 0) errs.push(`reconcile-ok: ${ok.join('|')}`);
  const orphan = reconcile(
    [{ file: 'f.js', msg: 'kapat butonu' }, { file: 'f.js', msg: 'başka bulgu' }],
    inv,
    new Set()
  );
  if (!orphan.some((e) => e.includes('Kayıtsız'))) errs.push('reconcile-orphan tespit edilmedi');
  const stale = reconcile([], inv, new Set());
  if (!stale.some((e) => e.includes('Stale'))) errs.push('reconcile-stale tespit edilmedi');
  const badRef = reconcile(
    [{ file: 'f.js', msg: 'kapat butonu' }],
    [{ file: 'f.js', includes: 'kapat', registryFinding: 'NOPE' }],
    new Set()
  );
  if (!badRef.some((e) => e.includes('Bilinmeyen registryFinding'))) errs.push('reconcile-badref tespit edilmedi');
  return errs;
}

function main() {
  const metaErrs = selfTest();
  if (metaErrs.length) {
    console.error('Ham test.fail uzlaştırma META-TEST BAŞARISIZ:\n  ' + metaErrs.join('\n  '));
    process.exit(1);
  }

  /** @type {{file:string,msg:string}[]} */
  const sites = [];
  for (const f of listSpecFiles(TEST_DIR)) {
    const src = readFileSync(f, 'utf8');
    for (const h of extractRawTestFails(src)) {
      sites.push({ file: path.relative(root, f), msg: h.msg });
    }
  }
  const knownIds = new Set(KNOWN_BUGS.map((b) => b.id));
  const errs = reconcile(sites, RAW_EXPECTED_FAILS, knownIds);

  if (errs.length) {
    console.error(
      `Ham test.fail uzlaştırma kapısı BAŞARISIZ (${errs.length}):\n  ` + errs.join('\n  ')
    );
    process.exit(1);
  }

  const linked = RAW_EXPECTED_FAILS.filter((e) => e.registryFinding != null).length;
  console.log(
    `Ham test.fail uzlaştırma kapısı geçti: ${sites.length} ham test.fail(true,…) sitesi ↔ ` +
      `${RAW_EXPECTED_FAILS.length} envanter girdisi (registry-bağlı ${linked}); ` +
      '5 meta-test (extract + orphan/stale/badref/ok) geçti.'
  );
}

main();
