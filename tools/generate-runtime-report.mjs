#!/usr/bin/env node
// @ts-check
/**
 * WP-MORNING Faz 2 — Runtime rapor üreteci (CLI).
 *
 * Playwright'ın GERÇEK JSON koşum sonucundan yönetici + makine-okur teslim
 * dosyalarını üretir:
 *   docs/raporlar/TEST-SONUCLARI.json         (makine-okur, versioned)
 *   docs/raporlar/SAYFA-TEST-SONUCLARI.md     (yönetici sayfa tablosu)
 *   docs/raporlar/SABAH-KALITE-OZETI.html     (kendi kendine yeten HTML)
 *   docs/raporlar/SABAH-TESLIM-MANIFEST.json  (teslim dosyaları hash/size)
 *
 * Kullanım:
 *   node tools/generate-runtime-report.mjs [--input <path>] [--list-input <path>]
 *        [--environment <ad>] [--min-start-time <ISO>]
 *
 * EXIT SEMANTİĞİ (HANDOFF §3.3, §4.3, FAZ4 §item16):
 *   - Bu üreteç, koşumda FAIL OLSA BİLE raporu üretir ve exit 0 döner. Test
 *     koşumunun kırmızı exit'i AYRI katmandır (FAZ 4 orchestrator korur).
 *   - non-zero döndüğü DURUMLAR: kaynak yok / geçersiz JSON / 0 seçilen test /
 *     üretilen çıktıda sızıntı/mutlak-yol/stack / HTML güvenlik ihlali / invariant
 *     ihlali / stale girdi. Bu durumlarda ESKİ rapor kullanılmaz.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { REGISTERED_ROUTES } from '../tests/contracts/registered-routes.js';
import {
  buildResultModel,
  renderMarkdown,
  renderHtml,
  renderResultJson,
  buildManifest,
  renderManifestJson,
  scanOutputLeaks,
} from './runtime-report-lib.mjs';
import {
  isListedOnlyReport,
  verifyRuntimeProvenance,
  RUNTIME_SOURCE_TYPE,
} from './runtime-provenance.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT_DIR = 'docs/raporlar';
/** WP-SEC-B kanonik Playwright JSON reporter yolu (varsayılan girdi). */
const DEFAULT_INPUT = resolve(root, 'test-results/report.json');

/** Bu üreteç YAZAN teslim dosyaları (kanonik relativePath sabit kalır). */
const GENERATED = Object.freeze({
  json: 'TEST-SONUCLARI.json',
  md: 'SAYFA-TEST-SONUCLARI.md',
  html: 'SABAH-KALITE-OZETI.html',
  manifest: 'SABAH-TESLIM-MANIFEST.json',
});
/** Manifest'in AYRICA hash'lediği, başka üreteçlerin (report:findings/test-report) yazdığı dosyalar. */
const EXTERNAL_DELIVERY = Object.freeze(['BULGULAR.md', 'YAPILAN-TESTLER.md', 'YAPILMAYAN-TESTLER.md']);
/** Manifest'te kanonik gösterim (out-dir değişse bile teslim yolu sabit). */
const CANON_DIR = 'docs/raporlar';

function fail(msg) {
  console.error(`generate-runtime-report HATA: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { input: null, flatInput: null, listInput: null, environment: 'production-read-only', minStartTime: null, outDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '--input') opts.input = val();
    else if (a.startsWith('--input=')) opts.input = a.slice('--input='.length);
    else if (a === '--flat-input') opts.flatInput = val();
    else if (a.startsWith('--flat-input=')) opts.flatInput = a.slice('--flat-input='.length);
    else if (a === '--list-input') opts.listInput = val();
    else if (a.startsWith('--list-input=')) opts.listInput = a.slice('--list-input='.length);
    else if (a === '--environment') opts.environment = val();
    else if (a.startsWith('--environment=')) opts.environment = a.slice('--environment='.length);
    else if (a === '--min-start-time') opts.minStartTime = val();
    else if (a.startsWith('--min-start-time=')) opts.minStartTime = a.slice('--min-start-time='.length);
    else if (a === '--out-dir') opts.outDir = val();
    else if (a.startsWith('--out-dir=')) opts.outDir = a.slice('--out-dir='.length);
  }
  return opts;
}

/** Güvenli commit SHA (git yoksa env fallback; PII/URL taşımaz). */
function resolveCommitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return process.env.GITHUB_SHA || null;
  }
}

/** Opsiyonel statik `--list` JSON'undan envanter sayıları (yoksa null). */
function loadListInventory(listInputPath) {
  if (!listInputPath) return null;
  const abs = resolve(root, listInputPath);
  if (!existsSync(abs)) fail(`--list-input verildi ama dosya yok: ${listInputPath}`);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    fail(`--list-input geçersiz JSON: ${listInputPath}`);
  }
  // Playwright --list JSON: benzersiz (file+title) mantıksal test; proje-genişlemesi ayrı.
  const logical = new Set();
  let projectExpanded = 0;
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      logical.add(`${sp.file}::${sp.title}`);
      projectExpanded += (sp.tests || []).length || 1;
    }
    for (const c of suite.suites || []) walk(c);
  };
  for (const s of (parsed && parsed.suites) || []) walk(s);
  return {
    definedLogical: logical.size,
    projectExpandedListed: projectExpanded,
    // runnableInventory: mutation/fixme ayrımı bu kaynakta yok → null (uydurma yok).
    runnableInventory: null,
  };
}

/**
 * FAZ 1 read-only manifest sayılarını (varsa) okur → §3.2 "production-safe
 * seçilebilir" / "staging gerektiren" sütunları. Manifest yoksa null (uydurma yok);
 * bozuksa da sessizce null (runtime raporu manifest'e bağımlı DEĞİL, yalnız zenginleşir).
 */
function loadManifestCounts() {
  const abs = resolve(root, 'docs/raporlar/READONLY-MANIFEST.json');
  if (!existsSync(abs)) return null;
  try {
    const m = JSON.parse(readFileSync(abs, 'utf8'));
    const c = m && m.counts;
    if (!c) return null;
    return {
      totalSpecs: Number(c.totalSpecs),
      productionSafeReadOnly: Number(c.productionSafeReadOnly),
      stagingRequired: Number(c.stagingRequired),
      externalCostExcluded: Number(c.externalCostExcluded),
    };
  } catch {
    return null;
  }
}

/** Run JSON'undan ilk projeyi güvenli türet (yoksa null). */
function detectProject(report) {
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      for (const t of sp.tests || []) {
        const p = t.projectName || t.projectId;
        if (p) return String(p).slice(0, 60);
      }
    }
    for (const c of suite.suites || []) {
      const found = walk(c);
      if (found) return found;
    }
    return null;
  };
  for (const s of (report && report.suites) || []) {
    const found = walk(s);
    if (found) return found;
  }
  return null;
}

/**
 * Sharded audit merge yolu: önceden düzleştirilmiş, ZATEN sanitize edilmiş kayıt
 * payload'ını yükler. Şema: { schemaVersion, tests:[...flattenRuntimeTests], source? }.
 * `report` yerine geçer; tek koşum JSON'undaki suites/stats gerektirmez.
 */
function loadFlatPayload(flatInputPath) {
  const abs = resolve(root, flatInputPath);
  if (!existsSync(abs)) {
    fail(`flat-input kaynağı yok: ${relative(root, abs)} (merge girdisi üretilmedi mi?). Stale rapor kullanılmaz.`);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    fail(`flat-input parse edilemedi (bozuk/boş): ${relative(root, abs)}`);
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tests)) {
    fail('flat-input beklenen şemada değil (tests dizisi yok).');
  }
  // Gözlemlenen yürütme kanıtı: en az bir kaydın denemesi olmalı (aksi hâlde
  // yalnız-listelenmiş gibi davranır → runtime raporu üretilmez).
  const observed = parsed.tests.reduce((s, t) => s + (Number(t && t.attempts) || 0), 0);
  if (parsed.tests.length > 0 && observed === 0) {
    fail('flat-input yalnız-listelenmiş görünüyor: hiç yürütme denemesi (attempts) yok. Runtime raporu üretilmez.');
  }
  return { tests: parsed.tests, source: parsed.source && typeof parsed.source === 'object' ? parsed.source : {}, abs };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const useFlat = Boolean(opts.flatInput);
  const inputPath = useFlat
    ? resolve(root, opts.flatInput)
    : opts.input
    ? resolve(root, opts.input)
    : DEFAULT_INPUT;

  /** @type {any} */
  let report = null;
  /** @type {any[]|null} */
  let flatTests = null;
  let runStartedAt = null;
  let runProject = null;
  let flatSource = {};

  if (useFlat) {
    const payload = loadFlatPayload(opts.flatInput);
    flatTests = payload.tests;
    flatSource = payload.source;
    runStartedAt = flatSource.runStartedAt ? String(flatSource.runStartedAt) : null;
    runProject = flatSource.project ? String(flatSource.project) : null;
  } else {
    // 1) Kaynak zorunlu — yoksa ESKİ rapor kullanılmaz.
    if (!existsSync(inputPath)) {
      fail(`runtime JSON kaynağı yok: ${relative(root, inputPath)} (koşum rapor üretmedi mi?). Stale rapor kullanılmaz.`);
    }
    try {
      report = JSON.parse(readFileSync(inputPath, 'utf8'));
    } catch {
      fail(`runtime JSON parse edilemedi (bozuk/boş): ${relative(root, inputPath)}`);
    }
    if (!report || typeof report !== 'object' || !Array.isArray(report.suites)) {
      fail('runtime JSON beklenen Playwright şemasında değil (suites dizisi yok).');
    }
    // 1b) `playwright test --list` çıktısı runtime sonucu DEĞİLDİR (gözlemlenen
    //     yürütme yok). Fail-closed: listelenmiş-yalnız veri PASS gibi sunulamaz.
    if (isListedOnlyReport(report)) {
      fail('girdi yalnız-listelenmiş (`--list`) görünüyor: hiç yürütme sonucu (results) yok. Runtime raporu üretilmez.');
    }
    runStartedAt = report.stats && report.stats.startTime ? String(report.stats.startTime) : null;
    runProject = detectProject(report);
  }

  // 2) Stale girdi koruması (opsiyonel): startTime < min-start-time → reddet.
  //    Hem tek koşum (stats.startTime) hem merge (source.runStartedAt) için geçerli.
  if (opts.minStartTime) {
    const min = Date.parse(opts.minStartTime);
    const started = runStartedAt ? Date.parse(runStartedAt) : NaN;
    if (!Number.isFinite(started)) {
      fail(`stale koruması: girdide başlangıç zamanı yok, --min-start-time ile doğrulanamıyor.`);
    }
    if (started < min) {
      fail(`stale girdi: koşum ${runStartedAt} < min ${opts.minStartTime}. Önceki koşumdan kalmış olabilir.`);
    }
  }

  const listInventory = loadListInventory(opts.listInput);
  const manifestCounts = loadManifestCounts();
  const generatedAt = new Date().toISOString();

  // 3) Modeli kur (invariant içeride doğrulanır). flatTests verilirse merge yolu.
  let model;
  try {
    model = buildResultModel({
      registeredRoutes: REGISTERED_ROUTES,
      testedPages: TESTED_PAGES,
      knownBugs: KNOWN_BUGS,
      report,
      flatTests,
      source: {
        sourceType: RUNTIME_SOURCE_TYPE,
        commitSha: (useFlat && flatSource.commitSha) ? String(flatSource.commitSha) : resolveCommitSha(),
        environment: opts.environment,
        browser: 'chromium',
        project: runProject,
        runId: process.env.GITHUB_RUN_ID || (useFlat && flatSource.runId ? String(flatSource.runId) : null),
        inputPath,
        runStartedAt,
      },
      generatedAt,
      listInventory,
      manifestCounts,
    });
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  }

  // 3b) Provenance verdict'i modele göm (üretim anında SHA kendisiyle eşleşir,
  //     taze ve gözlemlenen yürütmeli → VERIFIED). runId yerelde null olabilir;
  //     doğrulanabilirlik SHA + execution + tazelik üzerinden. Bu blok raporun
  //     kendini VERIFIED/STALE/UNVERIFIED olarak DÜRÜSTÇE ilan etmesini sağlar.
  const prov = verifyRuntimeProvenance(model, {
    expectedSha: model.source.commitSha,
    nowIso: generatedAt,
    requireRunId: false,
  });
  model.provenance = {
    verdict: prov.verdict,
    reasons: prov.reasons,
    checkedAgainstSha: model.source.commitSha,
    observedExecution: prov.observedExecution,
    note: 'Üretim anında kaynak koşuma göre doğrulandı; kommitlenmiş raporu HEAD ile yeniden doğrulamak için quality:runtime-provenance.',
  };

  // 4) Zero-test koruması — 0 seçilen test → başarısız.
  if (model.runtime.selectedThisRun === 0) {
    fail('0 seçilen test: runtime kaynağında hiç test sonucu yok. Koşum başarısız sayılır.');
  }

  // 5) Çıktıları üret + yazmadan ÖNCE sızıntı/HTML güvenlik denetimi (fail-closed).
  const jsonText = renderResultJson(model);
  const mdText = renderMarkdown(model);
  const htmlText = renderHtml(model); // assertHtmlSafe içeride

  for (const [name, text] of [
    ['TEST-SONUCLARI.json', jsonText],
    ['SAYFA-TEST-SONUCLARI.md', mdText],
    ['SABAH-KALITE-OZETI.html', htmlText],
  ]) {
    const leaks = scanOutputLeaks(text);
    if (leaks.length) fail(`üretilen ${name} güvenlik taramasında sızıntı: ${leaks.join(', ')}`);
  }

  const outDir = opts.outDir ? resolve(root, opts.outDir) : resolve(root, DEFAULT_OUT_DIR);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, GENERATED.json), jsonText);
  writeFileSync(resolve(outDir, GENERATED.md), mdText);
  writeFileSync(resolve(outDir, GENERATED.html), htmlText);

  // 6) Manifest — bu koşumun ürettiği 3 dosya (in-memory içerikten) + başka
  //    üreteçlerin yazdığı 3 teslim dosyası (diskten). Kanonik relativePath sabit;
  //    manifest KENDİNİ hash'lemez.
  const entries = [
    { relativePath: `${CANON_DIR}/${GENERATED.html}`, content: htmlText },
    { relativePath: `${CANON_DIR}/${GENERATED.md}`, content: mdText },
    { relativePath: `${CANON_DIR}/${GENERATED.json}`, content: jsonText },
  ];
  const missing = [];
  for (const name of EXTERNAL_DELIVERY) {
    const abs = resolve(root, CANON_DIR, name);
    if (existsSync(abs)) entries.push({ relativePath: `${CANON_DIR}/${name}`, content: readFileSync(abs) });
    else missing.push(`${CANON_DIR}/${name}`);
  }
  const manifest = buildManifest(entries, generatedAt);
  manifest.missing = missing; // henüz üretilmemiş teslim dosyaları (ör. report:findings koşulmadıysa)
  const manifestText = renderManifestJson(manifest);
  const mLeaks = scanOutputLeaks(manifestText);
  if (mLeaks.length) fail(`üretilen manifest güvenlik taramasında sızıntı: ${mLeaks.join(', ')}`);
  writeFileSync(resolve(outDir, GENERATED.manifest), manifestText);

  // 7) Güvenli özet (içerik yok; yalnız sayı/isim).
  const t = model.runtime.routeStatusTotals;
  console.log(
    `runtime raporu yazıldı → ${relative(root, outDir) || '.'}/{TEST-SONUCLARI.json, SAYFA-TEST-SONUCLARI.md, SABAH-KALITE-OZETI.html, SABAH-TESLIM-MANIFEST.json}\n` +
      `  kayıtlı rota ${model.inventory.registeredRoutes} · PASS ${t.PASS} · FAIL ${t.FAIL} · FLAKY ${t.FLAKY} · BLOCKED ${t.BLOCKED} · NOT_RUN ${t.NOT_RUN}\n` +
      `  koşum: seçilen ${model.runtime.selectedThisRun} · çalışan ${model.runtime.executedThisRun} · geçen ${model.runtime.passedThisRun} · başarısız ${model.runtime.failedThisRun} · flaky ${model.runtime.flakyThisRun}\n` +
      `  manifest: ${manifest.files.length} dosya hash'lendi${missing.length ? ` · ${missing.length} teslim dosyası henüz yok` : ''} · uyarı ${model.warnings.length}`
  );
}

main();
