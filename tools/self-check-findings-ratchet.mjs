#!/usr/bin/env node
// @ts-check
/**
 * REP-01 — AÇIK BULGU SAYISI RATCHET + GÖRÜNÜRLÜK.
 *
 * Sorun: knownBugGuard 60 açık ürün bug'ını Playwright `test.fail()` ile "beklenen hata"ya
 * çeviriyor → authed suite yeşil koşuyor ve açık bug sayısı hiçbir kapı tarafından
 * korunmuyor; sessizce büyüyebilir (REP-01).
 *
 * Bu self-check iki şey yapar (her `quality:check` koşumunda = required Architecture kapısı):
 *  1) GÖRÜNÜRLÜK: birinci-sınıf "Açık bulgu envanteri" satırını STDOUT'a basar — her koşumda
 *     kaç açık bug (severity kırılımı + kaç knownBugGuard expected-fail) görünür.
 *  2) RATCHET: açık bulgu TOPLAMI ve her severity, findings-ratchet-baseline.json tavanını
 *     AŞARSA fail (exit 1). Böylece yeni bug eklenirken baseline AYNI PR'da bilinçle
 *     yükseltilmeli (görünür/reviewed); sessiz büyüme imkânsız. Sayı düşerse advisory:
 *     baseline'ı düşürüp kazanımı kilitle (only-shrinks; grandfather baseline felsefesiyle uyumlu).
 *
 * Registry'ye YAZMAZ; yalnız okur. Deterministik (tarih/zamana bağlı alan yok).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEVERITIES = /** @type {const} */ (['critical', 'high', 'medium', 'low']);

/** Açık bulgu sayımını (toplam + severity + guard) hesaplar. Saf fonksiyon → test edilebilir. */
export function computeOpenCounts(registry) {
  const open = registry.filter((b) => b.status === 'open');
  const bySeverity = /** @type {Record<string, number>} */ ({});
  for (const s of SEVERITIES) bySeverity[s] = open.filter((b) => b.severity === s).length;
  const guarded = open.filter((b) => b.guard === 'knownBugGuard').length;
  return { total: open.length, bySeverity, guarded };
}

/**
 * Ratchet değerlendirmesi (saf). Büyüme → error; küçülme → advisory warning.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function evaluateRatchet(counts, baseline) {
  const errors = [];
  const warnings = [];
  if (counts.total > baseline.maxOpen) {
    errors.push(
      `Açık bulgu TOPLAMI (${counts.total}) baseline tavanını (${baseline.maxOpen}) AŞTI — ` +
        `sessiz büyüme yasak (REP-01). Gerçek yeni bulguysa findings-ratchet-baseline.json'ı AYNI PR'da yükselt (görünür/reviewed).`,
    );
  } else if (counts.total < baseline.maxOpen) {
    warnings.push(
      `Açık bulgu toplamı (${counts.total}) baseline'ın (${baseline.maxOpen}) altında — ` +
        `bir bug kapandıysa baseline'ı ${counts.total}'e düşür (kazanımı kilitle, regresyonu engelle).`,
    );
  }
  for (const s of SEVERITIES) {
    const max = baseline.maxBySeverity?.[s] ?? 0;
    const actual = counts.bySeverity[s] ?? 0;
    if (actual > max) {
      errors.push(`Açık '${s}' bulgu sayısı (${actual}) baseline tavanını (${max}) AŞTI — sessiz büyüme yasak.`);
    } else if (actual < max) {
      warnings.push(`Açık '${s}' bulgu sayısı (${actual}) baseline'ın (${max}) altında — baseline'ı düşürmeyi değerlendir.`);
    }
  }
  return { errors, warnings };
}

/** Görünürlük satırı (REP-01 fix #1) — her koşumda basılır. */
export function visibilityLine(counts) {
  const c = counts.bySeverity;
  return (
    `Açık bulgu envanteri: ${counts.total} açık ` +
    `(${c.critical} kritik / ${c.high} yüksek / ${c.medium} orta / ${c.low} düşük) · ` +
    `beklenen-hata guard (knownBugGuard/test.fail): ${counts.guarded}`
  );
}

// ── Meta self-test'ler (validator bozuk/geçerliyi ayırt edebiliyor mu) ────────
function runSelfChecks() {
  const failures = [];
  const B = { maxOpen: 2, maxBySeverity: { critical: 1, high: 1, medium: 0, low: 0 } };
  // (a) Tavanda: hata olmamalı.
  const ok = evaluateRatchet({ total: 2, bySeverity: { critical: 1, high: 1, medium: 0, low: 0 }, guarded: 2 }, B);
  if (ok.errors.length) failures.push('ratchet: tam-tavan girdisi hatalı işaretlendi.');
  // (b) Toplam aşımı: hata olmalı.
  const overTotal = evaluateRatchet({ total: 3, bySeverity: { critical: 1, high: 1, medium: 1, low: 0 }, guarded: 3 }, B);
  if (!overTotal.errors.some((e) => /TOPLAMI/.test(e))) failures.push('ratchet: toplam aşımı yakalanmadı.');
  // (c) Severity aşımı (critical 1→2): hata olmalı.
  const overSev = evaluateRatchet({ total: 2, bySeverity: { critical: 2, high: 0, medium: 0, low: 0 }, guarded: 2 }, B);
  if (!overSev.errors.some((e) => /critical/.test(e))) failures.push('ratchet: severity aşımı yakalanmadı.');
  // (d) Küçülme: hata değil, advisory olmalı.
  const shrink = evaluateRatchet({ total: 1, bySeverity: { critical: 0, high: 1, medium: 0, low: 0 }, guarded: 1 }, B);
  if (shrink.errors.length || !shrink.warnings.length) failures.push('ratchet: küçülme advisory yerine hata verdi.');
  return failures;
}

// ── Çalıştır ─────────────────────────────────────────────────────────────────
const metaFailures = runSelfChecks();
if (metaFailures.length) {
  console.error(`Ratchet self-check BAŞARISIZ (${metaFailures.length}) — mantık bozuk:`);
  for (const f of metaFailures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(join(repoRoot, 'tests/contracts/findings-ratchet-baseline.json'), 'utf8'));
const counts = computeOpenCounts(KNOWN_BUGS);

// (1) GÖRÜNÜRLÜK — her koşumda birinci-sınıf satır.
console.log(visibilityLine(counts));

// (2) RATCHET.
const { errors, warnings } = evaluateRatchet(counts, baseline);
if (warnings.length) {
  console.log(`Bulgu ratchet advisory (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.error(`\nAçık bulgu ratchet BAŞARISIZ (${errors.length}) — REP-01 sessiz büyüme kapısı:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `\nAçık bulgu ratchet geçti: toplam ${counts.total} ≤ ${baseline.maxOpen}; severity tavanları korunuyor; ` +
  `4 negatif meta-test de geçti.`,
);
