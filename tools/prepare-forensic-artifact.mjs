#!/usr/bin/env node
// @ts-check
/**
 * WP-R3 — Forensik artifact güvenlik kapısı (upload öncesi).
 *
 *   npm run report:artifact -- B4
 *
 * `test-results/findings/<id>/` içeriğini denetler ve YALNIZ güvenli, allowlist'teki
 * dosyaları `<id>/upload/` altına kopyalar:
 *  - allowlist dışı beklenmeyen dosya  → REDDET (non-zero exit)
 *  - sızıntı içeren JSON               → REDDET
 *  - geçersiz PNG imzası               → REDDET
 *  - trace (*.zip) / video (*.webm)    → lokal-only, upload'a ALINMAZ
 * Herhangi bir kontrol başarısızsa exit 1 → CI upload step'i çalışmaz.
 *
 * report:bug bunu zaten çağırır; bu CLI ayrıca/idempotent yeniden çalıştırma içindir.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { resolveFinding, findingDir, prepareUploadBundle } from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`report:artifact HATASI — ${message}`);
  process.exit(1);
}

const id = (process.argv[2] || '').trim();
if (!id) fail('bulgu id gerekli. Kullanım: npm run report:artifact -- B4');

try {
  resolveFinding(id);
} catch (error) {
  fail(error.message);
}

const dirAbs = resolve(root, findingDir(id));
if (!existsSync(dirAbs)) fail(`kanıt dizini yok: ${findingDir(id)}. Önce: npm run report:bug -- ${id}`);

const bundle = prepareUploadBundle(dirAbs);
if (bundle.rejected.length > 0) {
  console.error('Artifact güvenlik kapısı REDDETTİ:');
  for (const r of bundle.rejected) console.error(`  ✗ ${r.name}: ${r.reason}`);
  fail('güvenli olmayan/beklenmeyen dosya; upload bundle üretilmedi.');
}

console.log(`✔ upload bundle: ${findingDir(id)}/upload/ → ${bundle.copied.join(', ') || '(boş)'}`);
if (bundle.skippedLocal.length) console.log(`  (lokal-only, upload dışı: ${bundle.skippedLocal.join(', ')})`);
