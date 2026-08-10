// @ts-check
/**
 * YUTULAN ASSERTION KAPISI — SERT KAPI (false-green önleme, ADR-0016 ruhu).
 *
 * `tests/` altındaki hiçbir Playwright assertion zincirinin `.catch(...)` ile
 * SESSİZCE YUTULMADIĞINI kanıtlar. Yani şu desen YASAK:
 *
 *     await expect(loc).toBeVisible().catch(() => {});   // ← assertion yutuldu
 *
 * Böyle bir zincir, matcher reddini (fail) yutar; test ilgili boyutu HİÇ
 * doğrulamadan PASS olur (vacuous / false-green). Kanıt deseni: assertion'ın
 * kendisi (`expect(...)` argümanları KAPANDIKTAN sonra) gelen matcher zincirine
 * takılı bir `.catch(`.
 *
 * MEŞRU sayılan (YAKALANMAYAN) desenler:
 *   - `expect(await p.catch(() => null)).toBe(x)`  → `.catch` expect(...) ARGÜMANI
 *     içinde (değere varsayılan atama); assertion yutulmaz.
 *   - `await loc.waitFor().catch(() => {})`         → `expect` yok; bu bilinçli bir
 *     "veri yoksa" toleransıdır ve ARDINDAN görünür bir `test.skip` gelir (bkz.
 *     tests/support ve data-gated spec desenleri).
 *
 * Bu ayrım deterministik bir mini-parser ile yapılır (metin araması değil):
 * `expect(` bulunur, dengeli parantezle argümanları tüketilir, ardından
 * `.ident(...)` matcher zinciri izlenir; zincirde bir `catch` çağrısı görülürse
 * YyUTMA olarak işaretlenir.
 *
 * Çalıştır:  node tools/self-check-no-swallowed-assertions.mjs
 *            (npm run quality:swallowed-assertions)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const TEST_DIR = path.join(root, 'tests');

/** @param {string} dir @returns {string[]} */
function listJsFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    // Snapshot dizinleri (*-snapshots) ve gizli/örnek dizinleri atla; .js dışını atla.
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
      out.push(...listJsFiles(full));
    } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Bir kaynak metninde yutulan assertion'ları bulur.
 * @param {string} src
 * @returns {number[]} 1-tabanlı satır numaraları
 */
export function findSwallowedAssertions(src) {
  /** @type {number[]} */
  const hits = [];
  const re = /\bexpect\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    // 1) expect( ... ) argümanlarını dengeli parantezle tüket.
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < src.length && depth > 0) {
      const ch = src[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      i++;
    }
    if (depth !== 0) continue; // dengesiz — güvenli tarafta kal, atla

    // 2) Matcher zincirini (.ident veya .ident(...)) izle; `catch` görülürse işaretle.
    for (;;) {
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] !== '.') break;
      let k = j + 1;
      while (k < src.length && /\s/.test(src[k])) k++;
      const idStart = k;
      while (k < src.length && /[A-Za-z0-9_$]/.test(src[k])) k++;
      const ident = src.slice(idStart, k);
      if (!ident) break;
      if (ident === 'catch') {
        hits.push(src.slice(0, j).split('\n').length);
        break;
      }
      // Whitespace atla; çağrı ise dengeli tüket, değilse property access olarak devam.
      while (k < src.length && /\s/.test(src[k])) k++;
      if (src[k] === '(') {
        let d = 1;
        k++;
        while (k < src.length && d > 0) {
          const ch = src[k];
          if (ch === '(') d++;
          else if (ch === ')') d--;
          k++;
        }
        if (d !== 0) break;
      }
      i = k;
    }
  }
  return hits;
}

// ── Negatif/pozitif meta-testler (kapı kendini kanıtlar; ADR-0016 §self-check) ──
function selfTest() {
  const bad = 'await expect(x.first()).toBeVisible({ timeout: 2000 }).catch(() => {});';
  const badChain = 'await expect(a).resolves.toBe(1).catch(() => {});';
  const good1 = 'expect(await p.catch(() => null)).toBe(1);';
  const good2 = 'await loc.waitFor().catch(() => {});';
  const good3 = 'await expect(x).toBeVisible();';
  const good4 = 'const v = await fn().catch(() => 0); expect(v).toBe(0);';
  const cases = [
    ['bad', bad, 1],
    ['badChain', badChain, 1],
    ['good1', good1, 0],
    ['good2', good2, 0],
    ['good3', good3, 0],
    ['good4', good4, 0],
  ];
  const errs = [];
  for (const [name, code, expected] of cases) {
    const got = findSwallowedAssertions(code).length;
    if (got !== expected) errs.push(`meta-test '${name}': beklenen ${expected}, bulunan ${got}`);
  }
  return errs;
}

function main() {
  const metaErrs = selfTest();
  if (metaErrs.length) {
    console.error('Yutulan-assertion kapısı META-TEST BAŞARISIZ:\n  ' + metaErrs.join('\n  '));
    process.exit(1);
  }

  const files = listJsFiles(TEST_DIR);
  /** @type {string[]} */
  const violations = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const line of findSwallowedAssertions(src)) {
      violations.push(`${path.relative(root, f)}:${line}`);
    }
  }

  if (violations.length) {
    console.error(
      `Yutulan-assertion kapısı BAŞARISIZ: ${violations.length} yutulmuş assertion zinciri ` +
        `(expect(...).<matcher>().catch(...) → sessiz PASS / false-green):\n  ` +
        violations.join('\n  ') +
        '\n\nDüzeltme: `.catch(...)`\'i kaldır (assertion gerçekten değerlendirilsin). ' +
        'Veri yokluğunu tolere etmen gerekiyorsa `expect` yerine `waitFor().catch()` + ' +
        'ardından görünür `test.skip(reason)` kullan.'
    );
    process.exit(1);
  }

  console.log(
    `Yutulan-assertion kapısı geçti: ${files.length} dosya tarandı, 0 yutulmuş assertion; ` +
      '6 meta-test (2 pozitif-tespit + 4 yanlış-pozitif reddi) de geçti.'
  );
}

main();
