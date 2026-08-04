// @ts-check
/**
 * WP-SEC-B — Merkezi CI artifact allowlist politikası (tek kaynak).
 *
 * Buradaki hiçbir fonksiyon production'a yazmaz, registry'yi değiştirmez, secret
 * loglamaz. Amaç: hiçbir CI job'ı ham `playwright-report/`, ham `test-results/`,
 * trace (`*.zip`), video (`*.webm`/`*.mp4`) veya doğrulanmamış screenshot yükleyemesin.
 *
 * Model (bkz. docs/adr/0009-artifact-allowlist.md):
 *   ham çıktı -> lane adapter/parse -> alan allowlist + sanitize -> güvenli kanonik
 *   model -> güvenli JSON/JUnit/HTML yeniden üretimi -> secret/PII + şema + FS denetimi
 *   -> atomik güvenli bundle -> actions/upload-artifact YALNIZ bu bundle.
 *
 * Forensic/verification lane'leri KENDİ hazırlanmış `upload/` dizinlerini korur;
 * bu politika forensic-lib allowlist'lerini import ederek (çelişkisiz tek kaynak)
 * onları da "tanınan hazırlanmış bundle" olarak doğrular.
 */
import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  rmSync,
  lstatSync,
  realpathSync,
} from 'node:fs';
import { join, dirname, basename, sep, isAbsolute, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { findSecrets, redactText } from '../tests/fixtures/sanitize.js';
import {
  UPLOAD_ALLOWLIST as FORENSIC_UPLOAD_ALLOWLIST,
  VERIFICATION_UPLOAD_ALLOWLIST,
  LOCAL_ONLY_PATTERNS,
} from './forensic-lib.mjs';

export const POLICY_VERSION = 1;

/** Güvenli bundle kökü (repo köküne göreli). test-results/ zaten gitignore + upload dışı. */
export const SECURE_UPLOAD_ROOT = join('test-results', 'secure-upload');

/**
 * Kanonik lane enum. Lane adları kullanıcı girdisiyle SERBESTÇE oluşturulamaz;
 * yalnız bu kümeden seçilir (exact enum).
 */
export const LANES = Object.freeze([
  'public-smoke',
  'authenticated-quality',
  'authenticated-critical',
  'full-regression',
  'visual-regression',
  'read-only-discovery',
  'readonly-audit',
  'nightly-known-bug-reconcile',
  'known-bug-forensic',
  'known-bug-verification',
]);

/** Stabil rule ID kaydı — ihlaller bu id'lerle raporlanır (hassas değer ASLA loglanmaz). */
export const RULES = Object.freeze({
  ART_PATH: 'ART-PATH', // ham playwright-report/ veya genel test-results/ upload yolu
  ART_UNEXPECTED: 'ART-UNEXPECTED', // lane allowlist'i dışı beklenmeyen dosya
  ART_SECRET: 'ART-SECRET', // üretilen/geçiş dosyasında secret/PII
  ART_SCHEMA: 'ART-SCHEMA', // JSON/şema parse veya doğrulama hatası
  ART_BINARY: 'ART-BINARY', // desteklenmeyen binary / geçersiz imza
  ART_SYMLINK: 'ART-SYMLINK', // symlink veya regular-file dışı giriş
  ART_HIDDEN: 'ART-HIDDEN', // gizli/dotfile
  ART_TRAVERSAL: 'ART-TRAVERSAL', // .. / absolute / NUL / path traversal
  ART_SIZE: 'ART-SIZE', // dosya/bundle boyut aşımı
  ART_COUNT: 'ART-COUNT', // dosya adedi aşımı
  ART_EMPTY: 'ART-EMPTY', // zorunlu output eksik/boş bundle
  ART_SCREENSHOT_POLICY: 'ART-SCREENSHOT-POLICY', // kontratsız screenshot
  ART_TRACE_LOCAL_ONLY: 'ART-TRACE-LOCAL-ONLY', // trace/video upload denemesi
  ART_READ: 'ART-READ', // okuma/permission/sınıflandırma hatası (fail-closed)
  ART_WORKFLOW_RAW_UPLOAD: 'ART-WORKFLOW-RAW-UPLOAD', // workflow: ham upload path
  ART_WORKFLOW_NO_GATE: 'ART-WORKFLOW-NO-GATE', // workflow: ready-guard / if-no-files-found eksik
  ART_WORKFLOW_UNKNOWN_LANE: 'ART-WORKFLOW-UNKNOWN-LANE', // workflow: kayıt dışı upload lane
  ART_WORKFLOW_ACTION_VERSION: 'ART-WORKFLOW-ACTION-VERSION', // workflow: tanınmayan action sürümü
});

/** Politika ihlali — her zaman güvenli-yol + rule ID taşır, ham değer taşımaz. */
export class ArtifactPolicyError extends Error {
  /** @param {string} ruleId @param {string} safePath @param {string} detail */
  constructor(ruleId, safePath, detail) {
    super(`${ruleId} @ ${safePath}: ${detail}`);
    this.name = 'ArtifactPolicyError';
    this.ruleId = ruleId;
    this.safePath = safePath;
    this.detail = detail;
  }
}

const MB = 1024 * 1024;

const SUMMARY_OUTPUTS = Object.freeze(['summary.json', 'junit.xml', 'summary.html', 'manifest.json']);

/** Özet üreten lane'lerin ortak politikası (public/auth/critical/full/visual/discovery). */
function summaryLane(lane) {
  return Object.freeze({
    lane,
    // NEDEN: PR/regresyon teşhisi için pass/fail/skip özeti gerekir.
    // PRODUCER: tools/prepare-ci-artifact.mjs (JSON raporundan yeniden üretir).
    // VALIDATOR: safe-summary@1 (bu modül; secret/PII + şema + FS).
    sourceKinds: Object.freeze(['playwright-json']),
    allowedOutputs: SUMMARY_OUTPUTS,
    screenshotPolicy: 'deny', // ham failure/actual/diff screenshot upload DENY
    localOnlyPatterns: LOCAL_ONLY_PATTERNS, // trace/video/raw png lokal-only
    maxFiles: 8,
    maxBytesPerFile: 4 * MB,
    maxBundleBytes: 12 * MB,
    validatorId: 'safe-summary@1',
    mode: 'prepared', // secure-upload/<lane> altında bu modülce hazırlanır
    secureRoot: join(SECURE_UPLOAD_ROOT, lane),
  });
}

/** Her lane için sözleşme. */
export const LANE_POLICY = Object.freeze({
  'public-smoke': summaryLane('public-smoke'),
  'authenticated-quality': summaryLane('authenticated-quality'),
  'authenticated-critical': summaryLane('authenticated-critical'),
  'full-regression': summaryLane('full-regression'),
  'visual-regression': summaryLane('visual-regression'),
  'read-only-discovery': summaryLane('read-only-discovery'),
  // WP-FULL-READONLY-AUDIT FAZ 3 — kalıcı GitHub full read-only audit lane'i
  // (workflow_dispatch + schedule). Diğer özet lane'leriyle aynı safe-summary@1
  // sözleşmesi: Playwright JSON -> sanitize kanonik model -> summary.json/junit.xml/
  // summary.html/manifest.json. Ham upload YOK; secret/PII + şema + FS denetimi.
  'readonly-audit': summaryLane('readonly-audit'),
  'nightly-known-bug-reconcile': Object.freeze({
    lane: 'nightly-known-bug-reconcile',
    // NEDEN: nightly reconcile YALNIZ fixed-candidate önerisi üretir (registry değişmez).
    // PRODUCER: npm run report:reconcile -> fixed-candidates.json; prepare-ci-artifact ingest eder.
    // VALIDATOR: fixed-candidates@1 (şema + secret-scan + FS).
    sourceKinds: Object.freeze(['fixed-candidates-json']),
    allowedOutputs: Object.freeze(['fixed-candidates.json', 'manifest.json']),
    screenshotPolicy: 'deny',
    localOnlyPatterns: LOCAL_ONLY_PATTERNS,
    maxFiles: 4,
    maxBytesPerFile: 2 * MB,
    maxBundleBytes: 4 * MB,
    validatorId: 'fixed-candidates@1',
    mode: 'prepared',
    secureRoot: join(SECURE_UPLOAD_ROOT, 'nightly-known-bug-reconcile'),
  }),
  'known-bug-forensic': Object.freeze({
    lane: 'known-bug-forensic',
    // NEDEN: açık bulgunun salt-okunur kök-neden kanıt paketi (WP-R3).
    // PRODUCER: tools/prepare-forensic-artifact.mjs (forensic-lib.prepareUploadBundle).
    // VALIDATOR: forensic-lib UPLOAD_ALLOWLIST (JSON secret-scan + PNG imza).
    sourceKinds: Object.freeze(['forensic-evidence']),
    allowedOutputs: FORENSIC_UPLOAD_ALLOWLIST, // candidate-update/network-summary/metadata/safe-final-state
    screenshotPolicy: 'contract:forensic-safe-final-state', // maskeli-capture kontratı (ADR-0007)
    localOnlyPatterns: LOCAL_ONLY_PATTERNS,
    maxFiles: 8,
    maxBytesPerFile: 8 * MB,
    maxBundleBytes: 16 * MB,
    validatorId: 'forensic-lib@upload',
    mode: 'legacy-prepared', // findings/<id>/upload/ (kendi gated preparer'ı)
    preparedPathPattern: /^test-results\/findings\/[^/]+\/upload\/?$/,
  }),
  'known-bug-verification': Object.freeze({
    lane: 'known-bug-verification',
    // NEDEN: fixed-candidate doğrulama attestation'ları (WP-R4); registry KAPANMAZ.
    // PRODUCER: tools/verify-fixed-candidate.mjs (forensic-lib.prepareVerificationBundle).
    // VALIDATOR: forensic-lib VERIFICATION_UPLOAD_ALLOWLIST + attestations/*.json secret-scan.
    sourceKinds: Object.freeze(['verification-attestations']),
    allowedOutputs: VERIFICATION_UPLOAD_ALLOWLIST,
    screenshotPolicy: 'deny',
    localOnlyPatterns: LOCAL_ONLY_PATTERNS,
    maxFiles: 64, // attestation serisi birden çok koşuya yayılabilir
    maxBytesPerFile: 4 * MB,
    maxBundleBytes: 24 * MB,
    validatorId: 'forensic-lib@verification',
    mode: 'legacy-prepared', // findings/<id>/verification/upload/
    preparedPathPattern: /^test-results\/findings\/[^/]+\/verification\/upload\/?$/,
  }),
});

/** Lane politikası döndürür; bilinmeyen lane → hard failure. */
export function lanePolicy(lane) {
  const p = LANE_POLICY[lane];
  if (!p) {
    throw new ArtifactPolicyError(
      RULES.ART_WORKFLOW_UNKNOWN_LANE,
      String(lane),
      `kayıt dışı lane; geçerli: ${LANES.join(', ')}`
    );
  }
  return p;
}

// ── Güvenli yeniden-üretim yardımcıları ──────────────────────────────────────
export function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
export function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Status'tan güvenli hata sınıfı. Ham hata mesajı/stack ASLA okunmaz/emit edilmez;
 * yalnız deterministik durum etiketine indirgenir.
 * @param {string} status
 */
export function safeErrorClass(status) {
  switch (String(status)) {
    case 'passed':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'timedOut':
      return 'timeout';
    case 'interrupted':
      return 'interrupted';
    case 'skipped':
      return 'skipped';
    default:
      return 'unknown';
  }
}

/**
 * Playwright JSON raporundan (flattenPlaywrightReport çıktısı) güvenli kanonik
 * model üretir. YALNIZ düşük-riskli, teşhis için zorunlu alanlar kalır; stdout/
 * stderr, hata mesajı/stack, attachment, annotation, absolute path, environment,
 * console/network body, screenshot/trace/video referansı ÇIKARILIR.
 *
 * @param {{file:string,title:string,expectedStatus:string,status:string,firstStatus?:string,attempts?:number,durationMs?:number,project?:string}[]} flat
 * @param {{ lane:string, commit?:string|null, runId?:string|null }} ctx
 */
export function buildCanonicalModel(flat, ctx) {
  const lane = ctx.lane;
  const totals = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0, timedOut: 0 };
  const tests = [];
  for (const t of Array.isArray(flat) ? flat : []) {
    totals.total++;
    const status = String(t.status || 'unknown');
    if (status === 'passed') totals.passed++;
    else if (status === 'failed') totals.failed++;
    else if (status === 'skipped') totals.skipped++;
    else if (status === 'timedOut') totals.timedOut++;
    const attempts = Number(t.attempts || 1);
    const firstStatus = String(t.firstStatus || status);
    // flaky = ilk deneme pass değil ama sonuç pass (retry-pass).
    if (status === 'passed' && attempts > 1 && firstStatus !== 'passed') totals.flaky++;
    tests.push({
      // file: repo-göreli statik yol (absolute değil) — güvenli; yine de basename'e indir.
      file: basename(String(t.file || '')),
      // title: statik test başlığı — SANITIZE edilerek re-emit edilir (raw copy değil);
      // teoride başlıkta e-posta/telefon/token geçse bile maskelenir (6.3).
      title: redactText(String(t.title || '')).slice(0, 300),
      project: redactText(String(t.project || '')).slice(0, 60),
      status,
      expectedStatus: String(t.expectedStatus || 'unknown'),
      errorClass: safeErrorClass(status),
      durationMs: Number.isFinite(t.durationMs) ? Math.round(Number(t.durationMs)) : null,
      retries: Math.max(0, attempts - 1),
    });
  }
  return {
    schemaVersion: 1,
    policyVersion: POLICY_VERSION,
    lane,
    // Sınırlı, güvenli metadata — query/token/URL yok.
    commit: ctx.commit ? String(ctx.commit).slice(0, 40).replace(/[^a-f0-9]/gi, '') || null : null,
    runId: ctx.runId ? String(ctx.runId).slice(0, 32).replace(/[^0-9]/g, '') || null : null,
    totals,
    tests,
  };
}

/** Güvenli summary.json (secret taraması finalize'da). */
export function renderSummaryJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}

/**
 * Güvenli JUnit XML — RAW kopya DEĞİL; kanonik modelden yeniden üretilir.
 * system-out/system-err, stack/failure body ve environment property İÇERMEZ.
 */
export function renderJunitXml(model) {
  const t = model.totals;
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<testsuites name="${xmlEscape(model.lane)}" tests="${t.total}" failures="${t.failed}" skipped="${t.skipped}">`
  );
  lines.push(`  <testsuite name="${xmlEscape(model.lane)}" tests="${t.total}" failures="${t.failed}" skipped="${t.skipped}">`);
  for (const c of model.tests) {
    const name = xmlEscape(c.title);
    const cls = xmlEscape(`${c.project}/${c.file}`);
    const time = c.durationMs == null ? '0' : (c.durationMs / 1000).toFixed(3);
    if (c.status === 'skipped') {
      lines.push(`    <testcase name="${name}" classname="${cls}" time="${time}"><skipped/></testcase>`);
    } else if (c.status === 'failed' || c.status === 'timedOut' || c.status === 'interrupted') {
      // Yalnız güvenli sınıf; mesaj/stack gövdesi YOK.
      lines.push(
        `    <testcase name="${name}" classname="${cls}" time="${time}"><failure type="${xmlEscape(c.errorClass)}"/></testcase>`
      );
    } else {
      lines.push(`    <testcase name="${name}" classname="${cls}" time="${time}"/>`);
    }
  }
  lines.push('  </testsuite>');
  lines.push('</testsuites>');
  return lines.join('\n') + '\n';
}

/**
 * Güvenli summary.html — RAW Playwright HTML'in temizlenmiş kopyası DEĞİL. Kanonik
 * modelden üretilir; tüm değerler HTML-escape; inline/external script veya embedded
 * asset YOK.
 */
export function renderSummaryHtml(model) {
  const t = model.totals;
  const rows = model.tests
    .map(
      (c) =>
        `<tr><td>${htmlEscape(c.title)}</td><td>${htmlEscape(c.project)}</td>` +
        `<td>${htmlEscape(c.file)}</td><td>${htmlEscape(c.status)}</td>` +
        `<td>${htmlEscape(c.errorClass)}</td><td>${c.durationMs == null ? '' : htmlEscape(String(c.durationMs))}</td></tr>`
    )
    .join('\n');
  return (
    '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">' +
    '<title>Güvenli test özeti</title>' +
    '<style>body{font-family:sans-serif;margin:1rem}table{border-collapse:collapse;width:100%}' +
    'td,th{border:1px solid #ccc;padding:4px;font-size:13px;text-align:left}</style></head><body>' +
    `<h1>Güvenli özet — ${htmlEscape(model.lane)}</h1>` +
    `<p>toplam ${t.total} · geçti ${t.passed} · başarısız ${t.failed} · atlandı ${t.skipped} · flaky ${t.flaky}</p>` +
    '<table><thead><tr><th>Test</th><th>Proje</th><th>Dosya</th><th>Durum</th><th>Sınıf</th><th>ms</th></tr></thead>' +
    `<tbody>\n${rows}\n</tbody></table></body></html>\n`
  );
}

// ── Fail-closed dosya sistemi denetimi ───────────────────────────────────────
/** Gizli/dotfile mı? (`.` ile başlayan herhangi bir path segmenti) */
function hasHiddenSegment(rel) {
  return rel.split(/[\\/]/).some((seg) => seg.startsWith('.') && seg !== '' && seg !== '..');
}
/** Güvensiz path bileşeni mi? (.. / absolute / NUL) */
function hasTraversal(rel) {
  if (rel.includes('\0')) return true;
  if (isAbsolute(rel)) return true;
  return rel.split(/[\\/]/).some((seg) => seg === '..');
}

/** PNG imza kontrolü (89 50 4E 47). */
export function isPng(buf) {
  return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

/** Metin dosyası uzantısı mı (secret taranmalı)? */
function isTextExt(name) {
  return /\.(json|xml|html|txt|md|csv)$/i.test(name);
}

/**
 * Bir kaynak dosya girişini güvenlik açısından doğrular. `baseDir` sınırı dışına
 * çıkan symlink, traversal, gizli dosya, regular-file dışı giriş veya boyut aşımı
 * → ArtifactPolicyError (rule ID ile). Ham içerik loglanmaz.
 *
 * @param {string} baseDir  izin verilen kök (mutlak)
 * @param {string} rel      baseDir'e göreli yol
 * @param {{ maxBytesPerFile:number }} limits
 */
export function validateSourceEntry(baseDir, rel, limits) {
  const safe = rel.replace(/[\0]/g, '<nul>');
  if (hasTraversal(rel)) {
    throw new ArtifactPolicyError(RULES.ART_TRAVERSAL, safe, 'path traversal / absolute / NUL');
  }
  if (hasHiddenSegment(rel)) {
    throw new ArtifactPolicyError(RULES.ART_HIDDEN, safe, 'gizli/dotfile');
  }
  const abs = join(baseDir, rel);
  let st;
  try {
    st = lstatSync(abs); // symlink'i TAKİP ETMEZ
  } catch (error) {
    throw new ArtifactPolicyError(RULES.ART_READ, safe, `lstat hatası: ${error.code || 'bilinmiyor'}`);
  }
  if (st.isSymbolicLink()) {
    throw new ArtifactPolicyError(RULES.ART_SYMLINK, safe, 'symlink reddedildi');
  }
  if (!st.isFile()) {
    throw new ArtifactPolicyError(RULES.ART_SYMLINK, safe, 'regular-file değil (dir/socket/device)');
  }
  // realpath sınır dışına çıkıyor mu (case-fold/link-through savunması)
  try {
    const rp = realpathSync(abs);
    const rbase = realpathSync(baseDir);
    if (rp !== rbase && !rp.startsWith(rbase + sep)) {
      throw new ArtifactPolicyError(RULES.ART_TRAVERSAL, safe, 'realpath baz dizin dışında');
    }
  } catch (error) {
    if (error instanceof ArtifactPolicyError) throw error;
    throw new ArtifactPolicyError(RULES.ART_READ, safe, `realpath hatası: ${error.code || 'bilinmiyor'}`);
  }
  if (st.size > limits.maxBytesPerFile) {
    throw new ArtifactPolicyError(RULES.ART_SIZE, safe, `dosya boyutu > ${limits.maxBytesPerFile}`);
  }
  return abs;
}

/** SHA-256 hex. */
function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

const MEDIA_TYPE = {
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.png': 'image/png',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
};
function mediaTypeFor(name) {
  const dot = name.lastIndexOf('.');
  return (dot >= 0 && MEDIA_TYPE[name.slice(dot).toLowerCase()]) || 'application/octet-stream';
}

/**
 * Güvenli bundle'ı ATOMİK olarak üretir. Girdi: üretilmiş dosya içerikleri
 * (produce edilmiş, güvenilir). Süreç:
 *   1. secureRoot güvenle temizlenir.
 *   2. Aynı FS'te .tmp dizine yazılır.
 *   3. Bütün dosyalar allowlist + secret + imza + boyut/adet açısından RE-taranır.
 *   4. manifest.json en son üretilir.
 *   5. Tüm kontroller geçerse atomik rename ile final bundle olur.
 *   6. Hata olursa .tmp ve final bundle KALMAZ (ready sayılmaz).
 *
 * @param {object} opts
 * @param {string} opts.lane
 * @param {Record<string, string|Buffer>} opts.files  ad -> içerik (yalnız düz ad; alt-dizin yok)
 * @param {string[]} [opts.excludedLocalOnly]  yalnız güvenli ad/kategori
 * @returns {{ secureRoot:string, files:string[], bytes:number, manifest:object }}
 */
export function finalizeBundle(opts) {
  const policy = lanePolicy(opts.lane);
  const root = resolve(process.cwd());
  const secureRoot = policy.secureRoot;
  const absSecure = resolve(root, secureRoot);
  const absTmp = absSecure + '.tmp';

  // 1 + 2: temiz başlangıç, temp dizin (aynı FS — kardeş dizin).
  rmSync(absSecure, { recursive: true, force: true });
  rmSync(absTmp, { recursive: true, force: true });
  mkdirSync(absTmp, { recursive: true });

  try {
    const entries = Object.entries(opts.files || {});
    if (entries.length === 0) {
      throw new ArtifactPolicyError(RULES.ART_EMPTY, secureRoot, 'üretilecek dosya yok');
    }
    if (entries.length + 1 > policy.maxFiles) {
      throw new ArtifactPolicyError(RULES.ART_COUNT, secureRoot, `dosya adedi > ${policy.maxFiles}`);
    }

    // Dosyaları yaz (yalnız düz, güvenli ad).
    for (const [name] of entries) {
      if (name !== basename(name) || hasTraversal(name) || hasHiddenSegment(name)) {
        throw new ArtifactPolicyError(RULES.ART_TRAVERSAL, name, 'güvensiz dosya adı');
      }
    }
    for (const [name, content] of entries) {
      const buf = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
      writeFileSync(join(absTmp, name), buf);
    }

    // 3: üretilen dosyaları RE-tara (allowlist + secret + imza + boyut).
    let totalBytes = 0;
    const manifestFiles = [];
    for (const name of readdirSync(absTmp)) {
      const abs = join(absTmp, name);
      const st = lstatSync(abs);
      if (st.isSymbolicLink() || !st.isFile()) {
        throw new ArtifactPolicyError(RULES.ART_SYMLINK, name, 'regular-file değil');
      }
      if (name === 'manifest.json') continue; // en son üretilecek
      if (!policy.allowedOutputs.includes(name)) {
        // Lokal-only bir şey buraya sızdıysa da reddet.
        if (policy.localOnlyPatterns.some((re) => re.test(name))) {
          throw new ArtifactPolicyError(RULES.ART_TRACE_LOCAL_ONLY, name, 'lokal-only dosya upload bundle\'ında');
        }
        throw new ArtifactPolicyError(RULES.ART_UNEXPECTED, name, 'lane allowlist dışı');
      }
      const buf = readFileSync(abs);
      if (st.size > policy.maxBytesPerFile) {
        throw new ArtifactPolicyError(RULES.ART_SIZE, name, `> ${policy.maxBytesPerFile}`);
      }
      totalBytes += st.size;
      if (name.endsWith('.png')) {
        if (policy.screenshotPolicy === 'deny') {
          throw new ArtifactPolicyError(RULES.ART_SCREENSHOT_POLICY, name, 'bu lane screenshot kabul etmez');
        }
        if (!isPng(buf)) throw new ArtifactPolicyError(RULES.ART_BINARY, name, 'geçersiz PNG imzası');
      } else if (isTextExt(name)) {
        const text = buf.toString('utf8');
        // Şema doğrulaması: JSON parse edilebilmeli.
        if (name.endsWith('.json')) {
          try {
            JSON.parse(text);
          } catch {
            throw new ArtifactPolicyError(RULES.ART_SCHEMA, name, 'geçersiz JSON');
          }
        }
        const leaks = findSecrets(text);
        if (leaks.length) {
          // Yalnız rule ID + sayı; eşleşen değer ASLA loglanmaz.
          throw new ArtifactPolicyError(RULES.ART_SECRET, name, `${leaks.length} sızıntı sınıfı`);
        }
      } else {
        throw new ArtifactPolicyError(RULES.ART_BINARY, name, 'desteklenmeyen dosya türü');
      }
      manifestFiles.push({
        relativePath: name,
        sha256: sha256(buf),
        size: st.size,
        mediaType: mediaTypeFor(name),
        validatorId: policy.validatorId,
      });
    }
    if (totalBytes > policy.maxBundleBytes) {
      throw new ArtifactPolicyError(RULES.ART_SIZE, secureRoot, `bundle > ${policy.maxBundleBytes}`);
    }

    // 4: manifest en son (kendini dosya listesinde döngüsel hash'lemez — deterministik + belgeli).
    const manifest = {
      policyVersion: POLICY_VERSION,
      lane: policy.lane,
      createdByToolVersion: policy.validatorId,
      files: manifestFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
      excludedLocalOnly: (opts.excludedLocalOnly || []).slice().sort(),
    };
    const manifestText = JSON.stringify(manifest, null, 2) + '\n';
    if (findSecrets(manifestText).length) {
      throw new ArtifactPolicyError(RULES.ART_SECRET, 'manifest.json', 'manifest sızıntısı');
    }
    writeFileSync(join(absTmp, 'manifest.json'), manifestText);

    // 5: atomik rename.
    renameSync(absTmp, absSecure);
    return { secureRoot, files: readdirSync(absSecure).sort(), bytes: totalBytes, manifest };
  } catch (error) {
    // 6: hata → yarım bundle KALMAZ.
    rmSync(absTmp, { recursive: true, force: true });
    rmSync(absSecure, { recursive: true, force: true });
    throw error;
  }
}
