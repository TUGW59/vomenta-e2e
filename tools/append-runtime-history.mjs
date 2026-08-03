#!/usr/bin/env node
// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 2 — trend geçmişi ekleyici (CLI, §item12).
 *
 * Gerçek bir koşumun ürettiği TEST-SONUCLARI.json'dan sanitize edilmiş, executive
 * -uyumlu bir snapshot türetip `docs/raporlar/history/executive-<runId>.json`
 * olarak yazar ve eskileri döndürür (max N). Böylece bir sonraki executive rapor
 * GERÇEK delta hesaplar; o zamana kadar dürüstçe INSUFFICIENT_HISTORY kalır.
 *
 * DÜRÜSTLÜK: run ID olmayan (yerel) koşum snapshot'ı YAZILMAZ (exit 0 + not).
 * Sahte içerik/sızıntı bulunursa yazılmaz (fail-closed). Bozuk girdi → non-zero.
 * history dizini gitignore'lu artifact'tir (canlı koşum ürünü; commit edilmez).
 *
 * Kullanım:
 *   node tools/append-runtime-history.mjs [--input docs/raporlar/TEST-SONUCLARI.json]
 *        [--history-dir docs/raporlar/history] [--max 20]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import { SCHEMA_VERSION as EXEC_SCHEMA_VERSION } from './executive-report-lib.mjs';
import { scanOutputLeaks } from './runtime-report-lib.mjs';
import { buildHistorySnapshot, isEligibleForTrend, historyFilename, rotateHistory, serializeSnapshot } from './report-history-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(msg) {
  console.error(`append-runtime-history HATA: ${msg}`);
  process.exit(1);
}
function parseArgs(argv) {
  const o = { input: 'docs/raporlar/TEST-SONUCLARI.json', historyDir: 'docs/raporlar/history', max: 20 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '--input') o.input = val();
    else if (a.startsWith('--input=')) o.input = a.slice(8);
    else if (a === '--history-dir') o.historyDir = val();
    else if (a.startsWith('--history-dir=')) o.historyDir = a.slice(14);
    else if (a === '--max') o.max = Number(val());
    else if (a.startsWith('--max=')) o.max = Number(a.slice(6));
  }
  return o;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const inputAbs = resolve(root, o.input);
  if (!existsSync(inputAbs)) fail(`girdi yok: ${relative(root, inputAbs)} (önce report:runtime koş).`);
  let model;
  try {
    model = JSON.parse(readFileSync(inputAbs, 'utf8'));
  } catch {
    fail(`girdi parse edilemedi (bozuk JSON): ${relative(root, inputAbs)}`);
  }

  const snapshot = buildHistorySnapshot(model, EXEC_SCHEMA_VERSION);
  if (!isEligibleForTrend(snapshot, EXEC_SCHEMA_VERSION)) {
    console.log(
      '[append-runtime-history] snapshot trend\'e UYGUN DEĞİL (commit SHA + run ID gerekir; ' +
        'yerel koşumda runId yok). Sahte trend engeli: YAZILMADI. Bu normaldir.'
    );
    process.exit(0);
  }

  const text = serializeSnapshot(snapshot);
  const leaks = scanOutputLeaks(text);
  if (leaks.length) fail(`snapshot güvenlik taramasında sızıntı: ${leaks.join(', ')} → yazılmadı.`);

  const histAbs = resolve(root, o.historyDir);
  mkdirSync(histAbs, { recursive: true });
  const fname = historyFilename(snapshot);
  writeFileSync(join(histAbs, fname), text);

  // Döndürme: en yeni N kalsın.
  const existing = readdirSync(histAbs).filter((n) => /^executive-.+\.json$/i.test(n));
  const { remove } = rotateHistory(existing, o.max);
  for (const n of remove) rmSync(join(histAbs, n), { force: true });

  console.log(
    `[append-runtime-history] snapshot yazıldı → ${relative(root, join(histAbs, fname))} ` +
      `(FAIL rota anahtarı ${snapshot.failingTestKeys.length}) · döndürme: ${remove.length} eski silindi · max ${o.max}`
  );
}

main();
