#!/usr/bin/env node
// @ts-check
/**
 * WP-REPORT-TRUTH-2 (FAZ 6) — Yönetici tek-gerçeklik raporu üreteci (CLI).
 *
 * ÜÇ mevcut, üretilmiş gerçeklik kaynağını OKUR (yeniden koşum YOK — offline):
 *   docs/raporlar/TEST-SONUCLARI.json   (runtime)
 *   docs/raporlar/SURFACE-DEPTH.json    (kapsam derinliği)
 *   docs/raporlar/findings.json         (bulgu registry)
 * ve yönetici görünümünü yazar:
 *   docs/raporlar/YONETICI-OZET.json    (makine-okur, versioned, COMMIT edilir)
 *   docs/raporlar/YONETICI-OZET.md      (yönetici markdown, COMMIT edilir)
 *   docs/raporlar/YONETICI-OZET.html    (kendi kendine yeten HTML, .gitignore'lu ARTIFACT)
 *
 * TREND: docs/raporlar/history/executive-*.json (varsa) okunur; ≥2 uygun snapshot
 *   yoksa INSUFFICIENT_HISTORY. Bu üreteç history'ye YAZMAZ (sahte trend engeli).
 *
 * EXIT SEMANTİĞİ (HANDOFF §6.6): Kaynak verisi FAIL/BLOCKED içerse BİLE rapor
 *   üretilir ve exit 0 döner. non-zero DURUMLAR: kaynak yok / geçersiz JSON /
 *   üretilen çıktıda sızıntı / HTML güvenlik ihlali / invariant ihlali.
 *
 * Kullanım:
 *   node tools/generate-executive-report.mjs [--in-dir <dir>] [--out-dir <dir>]
 *        [--history-dir <dir>] [--allow-missing]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import {
  buildExecutiveModel,
  renderExecutiveJson,
  renderExecutiveMarkdown,
  renderExecutiveHtml,
} from './executive-report-lib.mjs';
import { scanOutputLeaks } from './runtime-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_DIR = 'docs/raporlar';

const IN = Object.freeze({ runtime: 'TEST-SONUCLARI.json', depth: 'SURFACE-DEPTH.json', findings: 'findings.json' });
const OUT = Object.freeze({ json: 'YONETICI-OZET.json', md: 'YONETICI-OZET.md', html: 'YONETICI-OZET.html' });

function fail(msg) {
  console.error(`generate-executive-report HATA: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const o = { inDir: null, outDir: null, historyDir: null, allowMissing: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '--in-dir') o.inDir = val();
    else if (a.startsWith('--in-dir=')) o.inDir = a.slice('--in-dir='.length);
    else if (a === '--out-dir') o.outDir = val();
    else if (a.startsWith('--out-dir=')) o.outDir = a.slice('--out-dir='.length);
    else if (a === '--history-dir') o.historyDir = val();
    else if (a.startsWith('--history-dir=')) o.historyDir = a.slice('--history-dir='.length);
    else if (a === '--allow-missing') o.allowMissing = true;
  }
  return o;
}

/** Zorunlu/opsiyonel JSON kaynağını güvenli oku. Bozuk JSON → non-zero (stale kullanılmaz). */
function readJson(absPath, label, { required }) {
  if (!existsSync(absPath)) {
    if (required) fail(`${label} kaynağı yok: ${relative(root, absPath)}. Stale rapor kullanılmaz. Önce ilgili report:* koşulmalı.`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(absPath, 'utf8'));
  } catch {
    fail(`${label} geçersiz JSON (bozuk/boş): ${relative(root, absPath)}`);
  }
}

/** Trend geçmişini oku (opsiyonel). Bozuk dosyalar atlanır (trend içinde warning olur). */
function readHistory(historyDirAbs) {
  if (!historyDirAbs || !existsSync(historyDirAbs)) return [];
  let names;
  try {
    names = readdirSync(historyDirAbs).filter((n) => /^executive-.*\.json$/i.test(n)).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const n of names) {
    try {
      out.push(JSON.parse(readFileSync(join(historyDirAbs, n), 'utf8')));
    } catch {
      // Bozuk snapshot: computeTrend zaten kimlik/şema kapısıyla eler; sessiz atla.
    }
  }
  return out;
}

/** Kaynakların en yeni ISO generatedAt'i (deterministik); yoksa wall-clock. */
function deriveGeneratedAt(sources) {
  let best = null;
  for (const s of sources) {
    const iso = s && typeof s.generatedAt === 'string' ? s.generatedAt : null;
    const t = iso ? Date.parse(iso) : NaN;
    if (Number.isFinite(t) && (best === null || t > best.t)) best = { t, iso };
  }
  return best ? best.iso : new Date().toISOString();
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inDir = opts.inDir ? resolve(root, opts.inDir) : resolve(root, DEFAULT_DIR);
  const outDir = opts.outDir ? resolve(root, opts.outDir) : resolve(root, DEFAULT_DIR);
  const historyDir = opts.historyDir ? resolve(root, opts.historyDir) : resolve(inDir, 'history');

  // Kaynaklar: normalde üçü de zorunlu. --allow-missing ile eksik kaynak "yok"
  // olarak işlenir (bölüm üretilmez) → düşük-kaynak ortamda yine dürüst rapor.
  const required = !opts.allowMissing;
  const runtime = readJson(resolve(inDir, IN.runtime), 'runtime (TEST-SONUCLARI.json)', { required });
  const depth = readJson(resolve(inDir, IN.depth), 'depth (SURFACE-DEPTH.json)', { required });
  const findings = readJson(resolve(inDir, IN.findings), 'findings (findings.json)', { required });

  if (!runtime && !depth && !findings) {
    fail('Hiç kaynak bulunamadı (runtime/depth/findings). Rapor üretilemez.');
  }

  const history = readHistory(historyDir);
  // generatedAt KAYNAK-TÜREVLİDİR (deterministik → committed rapor tekrar üretilebilir,
  // drift :check kararlı çalışır). Kaynakların en yeni generatedAt'i alınır; hiç
  // kaynak zaman damgası yoksa (ör. yalnız findings) wall-clock'a düşer.
  const generatedAt = deriveGeneratedAt([runtime, depth]);

  let model;
  try {
    model = buildExecutiveModel({ runtime, depth, findings, history, generatedAt });
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  }

  // Çıktıları üret + yazmadan ÖNCE sızıntı/HTML güvenlik denetimi (fail-closed).
  const jsonText = renderExecutiveJson(model);
  const mdText = renderExecutiveMarkdown(model);
  const htmlText = renderExecutiveHtml(model); // assertHtmlSafe + leak taraması içeride

  for (const [name, text] of [[OUT.json, jsonText], [OUT.md, mdText], [OUT.html, htmlText]]) {
    const leaks = scanOutputLeaks(text);
    if (leaks.length) fail(`üretilen ${name} güvenlik taramasında sızıntı: ${leaks.join(', ')}`);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, OUT.json), jsonText);
  writeFileSync(resolve(outDir, OUT.md), mdText);
  writeFileSync(resolve(outDir, OUT.html), htmlText); // .gitignore: docs/raporlar/*.html

  // Güvenli özet (içerik yok; yalnız sayı/isim).
  const rt = model.runtimeSummary;
  const dp = model.depthSummary;
  const fn = model.findingsSummary;
  console.log(
    `yönetici raporu yazıldı → ${relative(root, outDir) || '.'}/{${OUT.json}, ${OUT.md}, ${OUT.html} (artifact)}\n` +
      `  kaynaklar: runtime=${model.sourcesPresent.runtime} depth=${model.sourcesPresent.depth} findings=${model.sourcesPresent.findings} · manşet provenance ${model.headlineProvenance}\n` +
      `  tutarlılık: ${model.consistency.verdict}${model.consistency.warnings.length ? ` (${model.consistency.warnings.length} uyarı)` : ''}\n` +
      (rt ? `  runtime: rota ${rt.registeredRoutes} · PASS ${rt.routeStatusTotals.PASS} · FAIL ${rt.routeStatusTotals.FAIL} · FLAKY ${rt.routeStatusTotals.FLAKY} · BLOCKED ${rt.routeStatusTotals.BLOCKED} · NOT_RUN ${rt.routeStatusTotals.NOT_RUN}\n` : '  runtime: (kaynak yok)\n') +
      (dp ? `  depth: L1 proven ${dp.l1Proven}/${dp.registeredRoutes} · L2 complete ${dp.l2Complete} · L2 partial ${dp.l2Partial} · etkileşim doğrulanmamış ${dp.interactionUnverifiedRoutes}\n` : '  depth: (kaynak yok)\n') +
      (fn ? `  findings: toplam ${fn.total} · açık ${fn.byStatus.open} (crit ${fn.openBySeverity.critical}/high ${fn.openBySeverity.high}/med ${fn.openBySeverity.medium}/low ${fn.openBySeverity.low})\n` : '  findings: (kaynak yok)\n') +
      `  risk boşluğu ${model.riskGaps.length} · trend ${model.trend.status}`
  );
}

main();
