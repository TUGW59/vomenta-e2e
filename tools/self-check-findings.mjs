#!/usr/bin/env node
// @ts-check
/**
 * WP-R1 — Bulgu registry strict validator + linkage gate (kaçışsız kapı).
 *
 * Doğruladıkları:
 *  A) ŞEKİL: benzersiz id; zorunlu alanlar + tipler; severity/status/guard enum;
 *     yalnız izinli alanlarda null; dizi alanları dizi; evidence şekli; status↔guard
 *     tutarlılığı.
 *  B) LINKAGE (çift yönlü, kaynak-tarama): `guard:'knownBugGuard'` kaydının spec'te
 *     `knownBugGuard(test, 'ID')` çağrısı VAR ve doğru dosyada; her spec çağrısının
 *     registry karşılığı VAR; `fixme`/`permanent` kayıtların knownBugGuard çağrısı YOK;
 *     `test.file` diskte mevcut.
 *  C) GOVERNANCE (FAZ 5, ADR-0026 §5): grandfather baseline'da OLMAYAN her bulgu
 *     `owner`!=null VE (status=closed VEYA `lastVerified`!=null) taşımalı → yoksa HATA
 *     (yeni/değişen bulgu sahipsiz/doğrulanmamış olamaz). Baseline'daki (donmuş) eski
 *     kayıtlar yalnız UYARI alır (backward-compat; zorunlu backfill yok). `expiry`
 *     geçmiş = her zaman uyarı (tarih-bağımlı, kapıyı kırmaz).
 *
 * Ayrıca NEGATİF SELF-CHECK (meta-test): validasyon mantığının bozuk registry'yi
 * (duplicate id, eksik/orphan call, geçersiz status/severity, yanlış guard-status,
 * governance ihlali) gerçekten yakaladığını her koşuda kanıtlar. Registry tek gerçeklik kaynağıdır.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import {
  KNOWN_BUGS,
  SEVERITIES,
  STATUSES,
  GUARDS,
} from '../tests/contracts/known-bugs.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(repoRoot, p).split('\\').join('/');
const today = new Date().toISOString().slice(0, 10);

// ── Governance grandfather baseline (FAZ 5, ADR-0026 §5) ─────────────────────
// Bu listedeki (donmuş) bulgular, governance zorunluluğundan ÖNCE var olan sahipsiz/
// doğrulanmamış kayıtlardır → yalnız UYARI. Listede OLMAYAN bulgu owner+lastVerified
// taşımalı (HATA). Yok/bozuksa boş küme (fail-closed: tüm bulgular "yeni" sayılır).
function loadGovernanceBaseline() {
  const p = join(repoRoot, 'tests/contracts/findings-governance-baseline.json');
  if (!existsSync(p)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    const list = parsed && Array.isArray(parsed.grandfatheredOwnerlessOrUnverified)
      ? parsed.grandfatheredOwnerlessOrUnverified
      : [];
    return new Set(list.filter((x) => typeof x === 'string' && x));
  } catch {
    return new Set();
  }
}
const GOVERNANCE_BASELINE = loadGovernanceBaseline();

// ── Spec taraması: knownBugGuard(test, 'ID') çağrı siteleri ──────────────────
const CALL_RE = /knownBugGuard\(\s*test\s*,\s*['"]([^'"]+)['"]\s*\)/g;

function walkSpecs(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkSpecs(full));
    else if (entry.endsWith('.spec.js')) out.push(full);
  }
  return out;
}

function scanCallSites(dir) {
  /** @type {Map<string, string[]>} id → [relFile] */
  const sites = new Map();
  for (const file of walkSpecs(dir)) {
    const src = readFileSync(file, 'utf8');
    let m;
    while ((m = CALL_RE.exec(src)) !== null) {
      const id = m[1];
      if (!sites.has(id)) sites.set(id, []);
      sites.get(id).push(rel(file));
    }
  }
  return sites;
}

// ── Saf validasyon (meta-test de bunu çağırır) ───────────────────────────────
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isStrOrNull = (v) => v === null || typeof v === 'string';
const isArr = (v) => Array.isArray(v);

/**
 * @param {any[]} findings
 * @param {Map<string,string[]>} callSites
 * @param {{ checkFileExists?: boolean, governanceBaseline?: Set<string> }} [opts]
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateFindings(findings, callSites, opts = {}) {
  const checkFileExists = opts.checkFileExists !== false;
  const governanceBaseline = opts.governanceBaseline instanceof Set ? opts.governanceBaseline : new Set();
  const errors = [];
  const warnings = [];
  const seen = new Set();

  for (const b of findings) {
    const where = `bulgu ${b?.id ?? '(id yok)'}`;
    if (!isStr(b.id)) { errors.push(`${where}: id string olmalı`); continue; }
    if (seen.has(b.id)) errors.push(`${where}: yinelenen id`);
    seen.add(b.id);

    if (!isStr(b.title)) errors.push(`${where}: title zorunlu`);
    if (!isStr(b.area)) errors.push(`${where}: area zorunlu`);
    if (!isStr(b.route)) errors.push(`${where}: route zorunlu`);
    if (!SEVERITIES.includes(b.severity)) errors.push(`${where}: geçersiz severity "${b.severity}"`);
    if (!STATUSES.includes(b.status)) errors.push(`${where}: geçersiz status "${b.status}"`);
    if (!GUARDS.includes(b.guard)) errors.push(`${where}: geçersiz guard "${b.guard}"`);

    for (const f of ['opened', 'lastVerified', 'expiry']) {
      if (!isStrOrNull(b[f])) errors.push(`${where}: ${f} ISO tarih veya null olmalı`);
    }
    if (!isStrOrNull(b.expected)) errors.push(`${where}: expected string veya null olmalı`);
    if (!isStrOrNull(b.actual)) errors.push(`${where}: actual string veya null olmalı`);
    if (!(b.rootCause === null || isStr(b.rootCause))) errors.push(`${where}: rootCause string veya null olmalı`);
    if (!(b.rootCauseCandidate === null || isStr(b.rootCauseCandidate))) errors.push(`${where}: rootCauseCandidate string veya null olmalı`);
    if (!(b.owner === null || isStr(b.owner))) errors.push(`${where}: owner string veya null olmalı`);
    if (!(b.issueRef === null || isStr(b.issueRef))) errors.push(`${where}: issueRef string veya null olmalı`);

    for (const f of ['repro', 'technicalEvidence', 'possibleCauses', 'suggestedFixes', 'evidence']) {
      if (!isArr(b[f])) errors.push(`${where}: ${f} dizi olmalı`);
    }
    if (isArr(b.evidence)) {
      for (const e of b.evidence) {
        if (!e || !isStr(e.path) || !isStr(e.source) || typeof e.piiReviewed !== 'boolean') {
          errors.push(`${where}: evidence girdisi {path, source, piiReviewed:boolean} olmalı`);
          continue;
        }
        // FAZ 1 additive alt-alanlar (ADR-0026 §3): VARSA string olmalı, zorunlu değil.
        for (const k of ['kind', 'runUrl', 'artifactPath']) {
          if (e[k] !== undefined && !isStr(e[k])) errors.push(`${where}: evidence.${k} string olmalı`);
        }
      }
    }

    // ── FAZ 1 additive alanlar (ADR-0026 §3): VARSA doğrula, YOKSA zorunlu değil ──
    if (b.env !== undefined) {
      if (b.env === null || typeof b.env !== 'object' || Array.isArray(b.env)) {
        errors.push(`${where}: env bir nesne olmalı {browser,envName,role,locale,commit} (hepsi opsiyonel)`);
      } else {
        for (const k of ['browser', 'envName', 'role', 'locale', 'commit']) {
          if (b.env[k] !== undefined && !isStr(b.env[k])) errors.push(`${where}: env.${k} string olmalı`);
        }
      }
    }
    if (b.precondition !== undefined && !isStrOrNull(b.precondition)) {
      errors.push(`${where}: precondition string veya null olmalı`);
    }
    if (b.firstFailingStep !== undefined &&
        !(b.firstFailingStep === null || typeof b.firstFailingStep === 'number' || typeof b.firstFailingStep === 'string')) {
      errors.push(`${where}: firstFailingStep number | string | null olmalı`);
    }
    // FAZ 5 additive (ADR-0026 §5): infra VARSA boolean olmalı (altyapı arızası işareti).
    if (b.infra !== undefined && typeof b.infra !== 'boolean') {
      errors.push(`${where}: infra boolean olmalı (altyapı arızası işareti; yoksa ürün buggı)`);
    }
    // repro eleman-tipi: string (legacy) VEYA { step:string, selector?:string|null } (yapısal)
    if (isArr(b.repro)) {
      for (const r of b.repro) {
        const structural = r && typeof r === 'object' && !Array.isArray(r) &&
          isStr(r.step) && (r.selector === undefined || r.selector === null || typeof r.selector === 'string');
        if (typeof r !== 'string' && !structural) {
          errors.push(`${where}: repro adımı string veya { step, selector? } olmalı`);
        }
      }
    }
    if (!b.test || !isStr(b.test.file) || !isStr(b.test.title)) {
      errors.push(`${where}: test {file, title} zorunlu`);
    } else if (checkFileExists && !existsSync(join(repoRoot, b.test.file))) {
      errors.push(`${where}: test.file diskte yok: ${b.test.file}`);
    }

    // status ↔ guard tutarlılığı
    if (b.guard === 'permanent' && b.status !== 'closed') {
      errors.push(`${where}: guard 'permanent' ise status 'closed' olmalı (şu an "${b.status}")`);
    }
    if ((b.guard === 'knownBugGuard' || b.guard === 'fixme') && b.status === 'closed') {
      errors.push(`${where}: guard '${b.guard}' ise status 'closed' olamaz`);
    }

    // ── LINKAGE ──
    const sites = callSites.get(b.id) || [];
    if (b.guard === 'knownBugGuard') {
      if (sites.length === 0) {
        errors.push(`${where}: guard 'knownBugGuard' ama spec'te knownBugGuard(test,'${b.id}') çağrısı yok`);
      } else if (b.test && isStr(b.test.file) && !sites.includes(b.test.file)) {
        errors.push(`${where}: knownBugGuard çağrısı ${sites.join(', ')} içinde; test.file ise ${b.test.file}`);
      }
    } else if (sites.length > 0) {
      errors.push(`${where}: guard '${b.guard}' knownBugGuard çağrısı almamalı, ama ${sites.join(', ')} içinde var`);
    }

    // ── GOVERNANCE (FAZ 5) + UYARILAR ──
    // Baseline'da OLMAYAN (yeni/değişen) bulgu: owner + (açıksa) lastVerified ZORUNLU (HATA).
    // Baseline'daki (donmuş eski) kayıt: yalnız UYARI (backward-compat).
    const grandfathered = governanceBaseline.has(b.id);
    if (b.owner === null) {
      if (grandfathered) warnings.push(`${b.id}: sahip (owner) atanmamış (grandfather baseline)`);
      else errors.push(`${where}: owner zorunlu (FAZ 5 governance) — baseline'da olmayan bulgu sahipsiz olamaz`);
    }
    if (b.status !== 'closed' && b.lastVerified === null) {
      if (grandfathered) warnings.push(`${b.id}: lastVerified boş (grandfather baseline)`);
      else errors.push(`${where}: lastVerified zorunlu (FAZ 5 governance) — baseline'da olmayan açık bulgu doğrulanmalı`);
    }
    // expiry geçmiş: her zaman UYARI (tarih-bağımlı; determinizm için kapıyı kırmaz).
    if (typeof b.expiry === 'string' && b.expiry < today) warnings.push(`${b.id}: expiry geçmiş (${b.expiry})`);
  }

  // Ters yön: registry'de olmayan çağrı sitesi (typo / orphan)
  const ids = new Set(findings.map((b) => b.id));
  for (const [id, files] of callSites) {
    if (!ids.has(id)) {
      errors.push(`knownBugGuard(test,'${id}') çağrısı registry'de yok (${files.join(', ')})`);
    }
  }

  return { errors, warnings };
}

// ── NEGATİF SELF-CHECK (meta-test) ───────────────────────────────────────────
/** Geçerli iskelet bulgu; her negatif senaryo tek alanı bozar. */
function baseFinding(over = {}) {
  return {
    id: 'META', title: 't', area: 'a', route: '/r', severity: 'medium', status: 'open',
    guard: 'knownBugGuard', opened: null, lastVerified: null, expiry: null,
    repro: [], expected: null, actual: null, technicalEvidence: [], possibleCauses: [],
    rootCauseCandidate: null, rootCause: null, suggestedFixes: [], evidence: [],
    test: { file: 'tests/known-bugs.authed.spec.js', title: 'x' }, owner: null, issueRef: null,
    ...over,
  };
}
const M = (over) => baseFinding(over);
const siteFor = (id, file = 'tests/known-bugs.authed.spec.js') => new Map([[id, [file]]]);

const NEGATIVE_CASES = [
  {
    name: 'duplicate id',
    findings: [M({ id: 'DUP' }), M({ id: 'DUP' })],
    callSites: siteFor('DUP'),
    expect: /yinelenen id/,
  },
  {
    name: 'eksik registry kaydı (guard knownBugGuard ama çağrı yok)',
    findings: [M({ id: 'NOCALL' })],
    callSites: new Map(),
    expect: /çağrısı yok/,
  },
  {
    name: 'orphan çağrı sitesi (registry\'de yok)',
    findings: [M({ id: 'REAL' })],
    callSites: new Map([['REAL', ['tests/known-bugs.authed.spec.js']], ['GHOST', ['tests/x.spec.js']]]),
    expect: /GHOST.*registry'de yok/,
  },
  {
    name: 'geçersiz status',
    findings: [M({ id: 'BADST', status: 'bogus' })],
    callSites: siteFor('BADST'),
    expect: /geçersiz status/,
  },
  {
    name: 'geçersiz severity',
    findings: [M({ id: 'BADSEV', severity: 'huge' })],
    callSites: siteFor('BADSEV'),
    expect: /geçersiz severity/,
  },
  {
    name: 'yanlış guard-status (permanent + open)',
    findings: [M({ id: 'BADGS', guard: 'permanent', status: 'open' })],
    callSites: new Map(),
    expect: /guard 'permanent' ise status 'closed'/,
  },
  // ── FAZ 1 additive alanlar (ADR-0026 §3) ──
  {
    name: 'env nesne değil',
    findings: [M({ id: 'BADENV', env: 'x' })],
    callSites: siteFor('BADENV'),
    expect: /env bir nesne olmalı/,
  },
  {
    name: 'env alt-alan tipi',
    findings: [M({ id: 'BADENVK', env: { role: 5 } })],
    callSites: siteFor('BADENVK'),
    expect: /env\.role string olmalı/,
  },
  {
    name: 'yapısal repro adımı bozuk (step yok)',
    findings: [M({ id: 'BADREPRO', repro: [{ selector: '.x' }] })],
    callSites: siteFor('BADREPRO'),
    expect: /repro adımı string veya/,
  },
  {
    name: 'firstFailingStep geçersiz tip',
    findings: [M({ id: 'BADFFS', firstFailingStep: true })],
    callSites: siteFor('BADFFS'),
    expect: /firstFailingStep number \| string \| null/,
  },
  {
    name: 'evidence.kind string değil',
    findings: [M({ id: 'BADEK', evidence: [{ path: 'p', source: 's', piiReviewed: false, kind: 9 }] })],
    callSites: siteFor('BADEK'),
    expect: /evidence\.kind string olmalı/,
  },
  {
    name: 'infra boolean değil (FAZ 5 additive)',
    findings: [M({ id: 'BADINFRA', infra: 'yes' })],
    callSites: siteFor('BADINFRA'),
    expect: /infra boolean olmalı/,
  },
  // ── FAZ 5 governance (ADR-0026 §5) — baseline-dışı yeni/değişen bulgu ──
  {
    name: 'governance: baseline-dışı bulgu sahipsiz (owner zorunlu)',
    findings: [M({ id: 'NEWNOOWNER', owner: null })],
    callSites: siteFor('NEWNOOWNER'),
    expect: /owner zorunlu \(FAZ 5 governance\)/,
  },
  {
    name: 'governance: baseline-dışı açık bulgu doğrulanmamış (lastVerified zorunlu)',
    findings: [M({ id: 'NEWNOVERIFY', owner: 'qa', lastVerified: null, status: 'open' })],
    callSites: siteFor('NEWNOVERIFY'),
    expect: /lastVerified zorunlu \(FAZ 5 governance\)/,
  },
];

function runNegativeSelfChecks() {
  const failures = [];
  for (const c of NEGATIVE_CASES) {
    const { errors } = validateFindings(c.findings, c.callSites, { checkFileExists: false });
    if (!errors.some((e) => c.expect.test(e))) {
      failures.push(`negatif senaryo YAKALANMADI: "${c.name}" (beklenen ~ ${c.expect})`);
    }
  }
  return failures;
}

/**
 * POZİTİF meta-test (FAZ 1): tüm additive opsiyonel alanlar geçerli değerlerle DOLUYken
 * hiçbir hata üretmemeli → "doğrula ama ZORUNLU KILMA" sözleşmesini ispatlar.
 */
function runPositiveSelfChecks() {
  const good = M({
    id: 'POSNEW',
    // FAZ 5 governance: baseline'da olmayan yeni bulgu → owner + lastVerified ZORUNLU.
    owner: 'qa-team', lastVerified: '2026-08-06',
    env: { browser: 'chromium', envName: 'production', role: 'authed', locale: 'tr', commit: 'abc123' },
    precondition: 'oturum açık',
    firstFailingStep: 2,
    repro: [{ step: 'sayfayı aç', selector: '#root' }, 'düz string adım (legacy)'],
    evidence: [{ path: 'p.png', source: 'forensic', piiReviewed: true, kind: 'final-state', runUrl: 'https://ci/run/1', artifactPath: 'a/b.png' }],
  });
  const { errors } = validateFindings([good], siteFor('POSNEW'), { checkFileExists: false });
  return errors.length
    ? [`pozitif senaryo BAŞARISIZ: geçerli additive alanlar hata üretti: ${errors.join('; ')}`]
    : [];
}

/**
 * GOVERNANCE meta-test (FAZ 5): grandfather baseline muafiyeti + kapalı-bulgu muafiyeti
 * gerçekten uygulanıyor mu? (Aksi halde ratchet ya eski veriyi kırar ya da hiç zorlamaz.)
 */
function runGovernanceSelfChecks() {
  const failures = [];
  // (a) Baseline'daki (grandfather) sahipsiz+doğrulanmamış kayıt → HATA DEĞİL, yalnız UYARI.
  const gf = M({ id: 'OLDGF', owner: null, lastVerified: null, status: 'open' });
  const r1 = validateFindings([gf], siteFor('OLDGF'), {
    checkFileExists: false, governanceBaseline: new Set(['OLDGF']),
  });
  if (r1.errors.some((e) => /governance/.test(e))) {
    failures.push('governance: baseline (grandfather) kaydı governance HATASI üretmemeli.');
  }
  if (!r1.warnings.some((w) => /grandfather baseline/.test(w))) {
    failures.push('governance: baseline kaydı için grandfather uyarısı beklenirdi.');
  }
  // (b) Kapalı bulgu (owner var, lastVerified null) → lastVerified HATASI DEĞİL (muaf).
  const closed = M({ id: 'CLOSEDOK', owner: 'x', status: 'closed', guard: 'permanent', lastVerified: null });
  const r2 = validateFindings([closed], new Map(), { checkFileExists: false });
  if (r2.errors.some((e) => /lastVerified zorunlu/.test(e))) {
    failures.push('governance: kapalı bulgu lastVerified zorunluluğundan muaf olmalı.');
  }
  return failures;
}

// ── Çalıştır ─────────────────────────────────────────────────────────────────
const metaFailures = [...runNegativeSelfChecks(), ...runPositiveSelfChecks(), ...runGovernanceSelfChecks()];
if (metaFailures.length) {
  console.error(`Validator self-check BAŞARISIZ (${metaFailures.length}) — doğrulayıcı bozuk/geçerli girdiyi ayırt edemiyor:`);
  for (const f of metaFailures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

const callSites = scanCallSites(join(repoRoot, 'tests'));
const { errors, warnings } = validateFindings(KNOWN_BUGS, callSites, { governanceBaseline: GOVERNANCE_BASELINE });

// Baseline hijyeni (advisory): baseline'da olup artık uyumlu (owner+lastVerified) olan
// kayıtlar buradan ÇIKARILMALI (ratchet yalnız küçülür); baseline'daki hayalet id uyar.
{
  const byId = new Map(KNOWN_BUGS.map((b) => [b.id, b]));
  for (const id of GOVERNANCE_BASELINE) {
    const b = byId.get(id);
    if (!b) { warnings.push(`governance-baseline: '${id}' registry'de yok — baseline'dan çıkar (hayalet).`); continue; }
    const compliant = b.owner != null && (b.status === 'closed' || b.lastVerified != null);
    if (compliant) warnings.push(`governance-baseline: '${id}' artık uyumlu (owner+lastVerified) — baseline'dan çıkarılabilir.`);
  }
}

if (warnings.length) {
  console.log(`Bulgu governance uyarıları (${warnings.length}) — WP-R2 raporunda işaretlenecek:`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.error(`\nBulgu registry self-check BAŞARISIZ (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `\nBulgu registry self-check geçti: ${KNOWN_BUGS.length} bulgu, ${callSites.size} knownBugGuard bağı; ` +
  `şekil + çift yönlü linkage + status/guard tutarlılığı; ${NEGATIVE_CASES.length} negatif meta-test de geçti.`
);
