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
 *  C) UYARI (kapıyı kırmaz): sahipsiz / süresi geçmiş / lastVerified boş — WP-R2
 *     raporunda işaretlenecek; burada yalnız bilgi amaçlı listelenir.
 *
 * Registry tek gerçeklik kaynağıdır; bu araç onu spec gerçekliğiyle senkron tutar.
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
const errors = [];
const warnings = [];
const rel = (p) => relative(repoRoot, p).split('\\').join('/');

// ── Spec taraması: knownBugGuard(test, 'ID') çağrı siteleri ──────────────────
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

const CALL_RE = /knownBugGuard\(\s*test\s*,\s*['"]([^'"]+)['"]\s*\)/g;
/** @type {Map<string, string[]>} id → [relFile] */
const callSites = new Map();
for (const file of walkSpecs(join(repoRoot, 'tests'))) {
  const src = readFileSync(file, 'utf8');
  let m;
  while ((m = CALL_RE.exec(src)) !== null) {
    const id = m[1];
    if (!callSites.has(id)) callSites.set(id, []);
    callSites.get(id).push(rel(file));
  }
}

// ── A) ŞEKİL ─────────────────────────────────────────────────────────────────
const seen = new Set();
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isStrOrNull = (v) => v === null || typeof v === 'string';
const isArr = (v) => Array.isArray(v);
const today = new Date().toISOString().slice(0, 10);

for (const b of KNOWN_BUGS) {
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
      }
    }
  }
  if (!b.test || !isStr(b.test.file) || !isStr(b.test.title)) {
    errors.push(`${where}: test {file, title} zorunlu`);
  } else if (!existsSync(join(repoRoot, b.test.file))) {
    errors.push(`${where}: test.file diskte yok: ${b.test.file}`);
  }

  // status ↔ guard tutarlılığı
  if (b.guard === 'permanent' && b.status !== 'closed') {
    errors.push(`${where}: guard 'permanent' ise status 'closed' olmalı (şu an "${b.status}")`);
  }
  if ((b.guard === 'knownBugGuard' || b.guard === 'fixme') && b.status === 'closed') {
    errors.push(`${where}: guard '${b.guard}' ise status 'closed' olamaz`);
  }

  // ── B) LINKAGE ──
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

  // ── C) UYARILAR ──
  if (b.owner === null) warnings.push(`${b.id}: sahip (owner) atanmamış`);
  if (typeof b.expiry === 'string' && b.expiry < today) warnings.push(`${b.id}: expiry geçmiş (${b.expiry})`);
  if (b.status !== 'closed' && b.lastVerified === null) warnings.push(`${b.id}: lastVerified boş (uzun süredir doğrulanmamış olabilir)`);
}

// Ters yön: registry'de olmayan çağrı sitesi (typo / orphan)
const ids = new Set(KNOWN_BUGS.map((b) => b.id));
for (const [id, files] of callSites) {
  if (!ids.has(id)) {
    errors.push(`knownBugGuard(test,'${id}') çağrısı registry'de yok (${files.join(', ')})`);
  }
}

// ── Sonuç ─────────────────────────────────────────────────────────────────
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
  `\nBulgu registry self-check geçti: ${KNOWN_BUGS.length} bulgu, ${callSites.size} knownBugGuard bağı; şekil + çift yönlü linkage + status/guard tutarlılığı tamam.`
);
