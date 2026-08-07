#!/usr/bin/env node
// @ts-check
/**
 * WP-EVIDENCE FAZ 3 — Otomatik kanıt lane'i için AÇIK `knownBugGuard` bulgu listesi.
 *
 *   node tools/list-open-findings.mjs [--max N] [--json]
 *
 * Açık (`status==='open'`) ve `guard==='knownBugGuard'` bulguların id'lerini
 * DETERMİNİSTİK sırayla (registry sırası) döndürür. Lane BOUNDED olmalı (tek prod
 * hesabı yükü, ADR-0026 §risk) → varsayılan üst sınır uygulanır; `--max`/`EVIDENCE_MAX_FINDINGS`
 * ile ayarlanır. `--json` GitHub Actions matrix'i için JSON dizi basar.
 *
 * Registry'ye YAZMAZ; yalnız okur.
 */
import { fileURLToPath } from 'node:url';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';

const DEFAULT_MAX = 12; // bounded: tek prod hesabı yükü nightly makul kalsın

function parseArgs(argv) {
  const o = { max: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--max') o.max = argv[++i];
    else if (a.startsWith('--max=')) o.max = a.slice('--max='.length);
    else if (a === '--json') o.json = true;
  }
  return o;
}

export function listOpenGuardFindings(registry, max) {
  const ids = registry
    .filter((b) => b.guard === 'knownBugGuard' && b.status === 'open')
    .filter((b) => b.test && typeof b.test.file === 'string' && !/\.mutation\./.test(b.test.file))
    .map((b) => b.id);
  const cap = Number.isFinite(Number(max)) && Number(max) > 0 ? Math.floor(Number(max)) : ids.length;
  return ids.slice(0, cap);
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMain()) {
  const opts = parseArgs(process.argv.slice(2));
  const envMax = process.env.EVIDENCE_MAX_FINDINGS;
  // Boş string (schedule'da tanımsız input) = ayarlanmamış → varsayılan sınır uygulanır.
  const max = opts.max ?? (envMax && String(envMax).trim() ? envMax : DEFAULT_MAX);
  const ids = listOpenGuardFindings(KNOWN_BUGS, max);
  if (opts.json) process.stdout.write(JSON.stringify(ids));
  else process.stdout.write(ids.join('\n') + (ids.length ? '\n' : ''));
}
