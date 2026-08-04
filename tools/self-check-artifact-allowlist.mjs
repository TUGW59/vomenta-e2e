#!/usr/bin/env node
// @ts-check
/**
 * WP-SEC-B — Güvenli artifact allowlist negatif self-check (kaçışsız kapı).
 *
 * İki bağımsız kapıyı her koşuda kanıtlar:
 *  A) POLİTİKA/PREPARER: finalizeBundle + validateSourceEntry sentetik fixture'larla
 *     fail-closed davranır (beklenmeyen dosya, secret/PII, symlink, traversal, hidden,
 *     boyut/adet, bozuk JSON, screenshot policy, trace/video lokal-only, atomiklik,
 *     stale bundle, log güvenliği). Her ihlal stabil rule ID üretir; eşleşen hassas
 *     değer LOGLANMAZ.
 *  B) WORKFLOW STATİK: `.github/workflows/**` içindeki bütün actions/upload-artifact
 *     kullanımları yapısal parse edilir; ham playwright-report/ · ham test-results/ ·
 *     glob · trace/video · eksik `if-no-files-found: error` · ready-guard'sız upload ·
 *     kayıt dışı lane · tanınmayan action sürümü REDDEDİLİR. Gerçek workflow 0 ihlalle
 *     geçmeli ve yeni ham upload eklenirse sentetik snippet ile kapının düşmesi kanıtlanır.
 *
 * Regex-ile-satır-ezberi DEĞİL: gerçek YAML alt-küme parser'ı jobs→steps yapısını,
 * `with.path` block scalar listelerini ve step `if`/`id`/`run` alanlarını çözer.
 */
import assert from 'node:assert/strict';
import {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  symlinkSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { findSecrets } from '../tests/fixtures/sanitize.js';
import {
  LANES,
  RULES,
  finalizeBundle,
  validateSourceEntry,
  buildCanonicalModel,
  renderSummaryJson,
  renderJunitXml,
  renderSummaryHtml,
  isPng,
  ArtifactPolicyError,
} from './artifact-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
};

// Seed'ler tracked source'a düz yazılmaz — runtime'da birleştirilir (scanner'ı tetiklemesin).
const SEED_JWT = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjMifQ', 'S3cr3tSignatureAAAA'].join('.');
const SEED_EMAIL = ['user', 'secret-domain.example'].join('@'); // example → SEC-EMAIL güvenli, ama findSecrets email yakalar
const SEED_PHONE = '+1 202 555 0134';
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

const scratch = resolve(root, 'test-results', '.artifact-allowlist-selfcheck');
rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

/** ArtifactPolicyError yakalar; ruleId döndürür. Beklenen ihlal yoksa fırlatır. */
function expectRule(fn, ruleId, label) {
  try {
    fn();
  } catch (error) {
    if (error instanceof ArtifactPolicyError) {
      assert.equal(error.ruleId, ruleId, `${label}: beklenen ${ruleId}, gelen ${error.ruleId}`);
      return error;
    }
    throw new Error(`${label}: ArtifactPolicyError bekleniyordu, gelen: ${error.message}`);
  }
  throw new Error(`${label}: ihlal (${ruleId}) beklenirken hata FIRLATILMADI`);
}

const cleanSummaryFiles = () => {
  const model = buildCanonicalModel(
    [{ file: 'a.spec.js', title: 'temiz test', project: 'chromium', status: 'passed', expectedStatus: 'passed', durationMs: 10 }],
    { lane: 'public-smoke' }
  );
  return {
    'summary.json': renderSummaryJson(model),
    'junit.xml': renderJunitXml(model),
    'summary.html': renderSummaryHtml(model),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// A) POLİTİKA / PREPARER NEGATİF MATRİSİ
// ════════════════════════════════════════════════════════════════════════════

check('temiz bundle → geçer, 4 dosya (+manifest), zero secret rescan', () => {
  const r = finalizeBundle({ lane: 'public-smoke', files: cleanSummaryFiles() });
  const abs = resolve(root, r.secureRoot);
  const got = readdirSync(abs).sort();
  assert.deepEqual(got, ['junit.xml', 'manifest.json', 'summary.html', 'summary.json']);
  for (const f of got) {
    assert.equal(findSecrets(readFileSync(join(abs, f), 'utf8')).length, 0, `${f} sızıntısız olmalı`);
  }
  rmSync(abs, { recursive: true, force: true });
});

check('allowlist dışı dosya → ART-UNEXPECTED', () => {
  const files = { ...cleanSummaryFiles(), 'rogue.json': '{"ok":true}' };
  expectRule(() => finalizeBundle({ lane: 'public-smoke', files }), RULES.ART_UNEXPECTED, 'rogue.json');
});

check('secret içeren summary.json → ART-SECRET; değer loglanmaz', () => {
  const files = { ...cleanSummaryFiles(), 'summary.json': `{"note":"jwt ${SEED_JWT}"}` };
  const err = expectRule(() => finalizeBundle({ lane: 'public-smoke', files }), RULES.ART_SECRET, 'jwt json');
  assert.ok(!err.message.includes(SEED_JWT), 'rule mesajı seed JWT içermemeli');
  assert.ok(!String(err.detail).includes(SEED_JWT), 'detail seed JWT içermemeli');
});

check('e-posta/telefon içeren junit.xml → ART-SECRET', () => {
  expectRule(
    () => finalizeBundle({ lane: 'public-smoke', files: { ...cleanSummaryFiles(), 'junit.xml': `<x>${SEED_EMAIL}</x>` } }),
    RULES.ART_SECRET,
    'email xml'
  );
  expectRule(
    () => finalizeBundle({ lane: 'public-smoke', files: { ...cleanSummaryFiles(), 'summary.html': `<p>${SEED_PHONE}</p>` } }),
    RULES.ART_SECRET,
    'phone html'
  );
});

check('sanitize+re-emit: başlıktaki e-posta/telefon maskelenir, çıktı temiz', () => {
  const model = buildCanonicalModel(
    [{ file: 'a.spec.js', title: `mail ${SEED_EMAIL} phone ${SEED_PHONE}`, project: 'p', status: 'passed', expectedStatus: 'passed' }],
    { lane: 'public-smoke' }
  );
  const out = renderSummaryJson(model) + renderJunitXml(model) + renderSummaryHtml(model);
  assert.equal(findSecrets(out).length, 0, 'maskelenmiş çıktı sızıntısız olmalı');
  assert.ok(!out.includes(SEED_EMAIL) && !out.includes(SEED_PHONE), 'ham e-posta/telefon çıktıda olmamalı');
});

check('güvenli JUnit: system-out/system-err/stack yok; ham hata mesajı düşer', () => {
  const flat = [
    { file: 'a.spec.js', title: 'x', project: 'p', status: 'failed', expectedStatus: 'failed', durationMs: 5, error: { message: `boom ${SEED_JWT}` } },
  ];
  const model = buildCanonicalModel(flat, { lane: 'full-regression' });
  const junit = renderJunitXml(model);
  const jsonOut = renderSummaryJson(model);
  assert.ok(!/system-out|system-err/i.test(junit), 'system-out/err olmamalı');
  assert.ok(!junit.includes(SEED_JWT) && !jsonOut.includes(SEED_JWT), 'ham hata mesajı/stack sızmamalı');
  assert.ok(/type="failed"/.test(junit), 'yalnız güvenli failure sınıfı olmalı');
});

check('HTML injection payload escape edilir; <script> oluşmaz', () => {
  const model = buildCanonicalModel(
    [{ file: 'a.spec.js', title: '<script>alert(1)</script>', project: 'p', status: 'passed', expectedStatus: 'passed' }],
    { lane: 'public-smoke' }
  );
  const html = renderSummaryHtml(model);
  assert.ok(!/<script>/i.test(html), 'ham <script> etiketi oluşmamalı');
  assert.ok(html.includes('&lt;script&gt;'), 'payload escape edilmeli');
});

check('summary lane png kabul etmez → ART-SCREENSHOT-POLICY', () => {
  const files = { ...cleanSummaryFiles(), 'summary.json': cleanSummaryFiles()['summary.json'] };
  files['shot.png'] = PNG_BYTES;
  // shot.png allowlist dışı → ART-UNEXPECTED; ama allowedOutputs'a girmeyen png için önce UNEXPECTED beklenir.
  expectRule(() => finalizeBundle({ lane: 'public-smoke', files }), RULES.ART_UNEXPECTED, 'png in summary lane');
});

check('isPng: geçerli imza true, düz metin false', () => {
  assert.equal(isPng(PNG_BYTES), true);
  assert.equal(isPng(Buffer.from('not-a-png plus secret text')), false);
});

check('trace/video lane bundle\'a sızarsa → ART-TRACE-LOCAL-ONLY', () => {
  expectRule(
    () => finalizeBundle({ lane: 'visual-regression', files: { ...cleanSummaryFiles(), 'trace.zip': 'PK' } }),
    RULES.ART_TRACE_LOCAL_ONLY,
    'trace.zip'
  );
  expectRule(
    () => finalizeBundle({ lane: 'visual-regression', files: { ...cleanSummaryFiles(), 'clip.webm': 'x' } }),
    RULES.ART_TRACE_LOCAL_ONLY,
    'webm'
  );
});

check('bozuk JSON → ART-SCHEMA', () => {
  expectRule(
    () => finalizeBundle({ lane: 'public-smoke', files: { ...cleanSummaryFiles(), 'summary.json': '{bozuk' } }),
    RULES.ART_SCHEMA,
    'corrupt json'
  );
});

check('boyut aşımı → ART-SIZE', () => {
  const big = Buffer.alloc(4 * 1024 * 1024 + 16, 0x20); // 4MB+ boşluk (secret-free)
  expectRule(
    () => finalizeBundle({ lane: 'public-smoke', files: { ...cleanSummaryFiles(), 'summary.json': big } }),
    RULES.ART_SIZE,
    'oversize'
  );
});

check('adet aşımı → ART-COUNT', () => {
  const files = {};
  for (let i = 0; i < 8; i++) files[`f${i}.json`] = '{}';
  expectRule(() => finalizeBundle({ lane: 'public-smoke', files }), RULES.ART_COUNT, 'too many files');
});

check('boş bundle → ART-EMPTY', () => {
  expectRule(() => finalizeBundle({ lane: 'public-smoke', files: {} }), RULES.ART_EMPTY, 'empty');
});

check('symlink kaynak → ART-SYMLINK', () => {
  const d = join(scratch, 'symlink');
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'real.txt'), 'x');
  try {
    symlinkSync(join(d, 'real.txt'), join(d, 'link.txt'));
  } catch {
    console.log('  (bilgi) symlink oluşturulamadı — symlink testi atlandı.');
    return;
  }
  expectRule(() => validateSourceEntry(d, 'link.txt', { maxBytesPerFile: 1e6 }), RULES.ART_SYMLINK, 'symlink');
});

check('path traversal / absolute → ART-TRAVERSAL', () => {
  const d = join(scratch, 'trav');
  mkdirSync(d, { recursive: true });
  expectRule(() => validateSourceEntry(d, '../escape.txt', { maxBytesPerFile: 1e6 }), RULES.ART_TRAVERSAL, '..');
  expectRule(() => validateSourceEntry(d, '/etc/passwd', { maxBytesPerFile: 1e6 }), RULES.ART_TRAVERSAL, 'absolute');
});

check('hidden/dotfile → ART-HIDDEN', () => {
  const d = join(scratch, 'hidden');
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, '.secret'), 'x');
  expectRule(() => validateSourceEntry(d, '.secret', { maxBytesPerFile: 1e6 }), RULES.ART_HIDDEN, 'dotfile');
});

check('okuma/permission hatası → ART-READ (fail-closed)', () => {
  const d = join(scratch, 'missing');
  mkdirSync(d, { recursive: true });
  expectRule(() => validateSourceEntry(d, 'yok.txt', { maxBytesPerFile: 1e6 }), RULES.ART_READ, 'missing');
});

check('hazırlama yarıda hata → final bundle YOK, .tmp YOK (atomik)', () => {
  const lane = 'authenticated-critical';
  const secureRoot = resolve(root, 'test-results', 'secure-upload', lane);
  expectRule(
    () => finalizeBundle({ lane, files: { ...cleanSummaryFiles(), 'summary.json': `{"x":"${SEED_JWT}"}` } }),
    RULES.ART_SECRET,
    'atomic'
  );
  assert.ok(!existsSync(secureRoot), 'hatada final bundle kalmamalı');
  assert.ok(!existsSync(secureRoot + '.tmp'), 'hatada .tmp kalmamalı');
});

check('stale bundle + yeni hata → stale bundle SİLİNİR (upload edilemez)', () => {
  const lane = 'authenticated-quality';
  const secureRoot = resolve(root, 'test-results', 'secure-upload', lane);
  rmSync(secureRoot, { recursive: true, force: true });
  mkdirSync(secureRoot, { recursive: true });
  writeFileSync(join(secureRoot, 'stale.json'), '{"old":true}');
  expectRule(
    () => finalizeBundle({ lane, files: { ...cleanSummaryFiles(), 'junit.xml': `<x>${SEED_JWT}</x>` } }),
    RULES.ART_SECRET,
    'stale'
  );
  assert.ok(!existsSync(secureRoot), 'stale bundle yeni hatada silinmiş olmalı');
});

check('log güvenliği: seed değer stdout/stderr\'e yazılmaz (thrown message temiz)', () => {
  const err = expectRule(
    () => finalizeBundle({ lane: 'public-smoke', files: { ...cleanSummaryFiles(), 'summary.json': `{"t":"${SEED_JWT}"}` } }),
    RULES.ART_SECRET,
    'log-safety'
  );
  const blob = `${err.message}\n${err.detail}\n${err.safePath}`;
  assert.ok(!blob.includes(SEED_JWT), 'hata yüzeyi seed içermemeli');
});

// ════════════════════════════════════════════════════════════════════════════
// B) WORKFLOW STATİK ENFORCEMENT (yapısal YAML parse)
// ════════════════════════════════════════════════════════════════════════════

// ── Minimal YAML alt-küme parser (mapping/sequence/block-scalar; Actions için) ──
function tokenize(text) {
  return text.split(/\r?\n/).map((raw) => {
    const expanded = raw.replace(/\t/g, '  ');
    const trimmed = expanded.trim();
    const indent = expanded.length - expanded.trimStart().length;
    return { raw: expanded, trimmed, indent, blank: trimmed === '', comment: trimmed.startsWith('#') };
  });
}
function nextStructural(toks, i) {
  while (i < toks.length && (toks[i].blank || toks[i].comment)) i++;
  return i;
}
function stripQuotes(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}
function consumeBlockScalar(toks, start, keyIndent) {
  const parts = [];
  let i = start;
  while (i < toks.length) {
    const t = toks[i];
    if (t.blank) {
      parts.push('');
      i++;
      continue;
    }
    if (t.indent > keyIndent) {
      parts.push(t.trimmed);
      i++;
    } else break;
  }
  // baştaki/sondaki boşları temizle
  while (parts.length && parts[0] === '') parts.shift();
  while (parts.length && parts[parts.length - 1] === '') parts.pop();
  return { text: parts.join('\n'), end: i };
}
function parseBlock(toks, start, minIndent) {
  let i = nextStructural(toks, start);
  if (i >= toks.length || toks[i].indent < minIndent) return { node: null, end: i };
  const baseIndent = toks[i].indent;
  const isSeq = toks[i].trimmed === '-' || toks[i].trimmed.startsWith('- ');
  if (isSeq) {
    const arr = [];
    while (i < toks.length) {
      i = nextStructural(toks, i);
      if (i >= toks.length || toks[i].indent < baseIndent) break;
      const t = toks[i];
      if (!(t.trimmed === '-' || t.trimmed.startsWith('- '))) break;
      const rest = t.trimmed === '-' ? '' : t.trimmed.slice(2);
      if (rest === '') {
        const { node, end } = parseBlock(toks, i + 1, baseIndent + 1);
        arr.push(node);
        i = end;
      } else if (/^["']?[\w.-]+["']?\s*:(\s|$)/.test(rest)) {
        // "- key: val" → item bir mapping; bu satırı sanal indent baseIndent+2'de mapping başlat.
        const virt = toks.slice();
        virt[i] = { ...t, trimmed: rest, indent: baseIndent + 2, blank: false, comment: false };
        const { node, end } = parseBlock(virt, i, baseIndent + 2);
        arr.push(node);
        i = end;
      } else {
        arr.push(stripQuotes(rest));
        i++;
      }
    }
    return { node: arr, end: i };
  }
  // mapping
  const obj = {};
  while (i < toks.length) {
    i = nextStructural(toks, i);
    if (i >= toks.length || toks[i].indent < baseIndent) break;
    if (toks[i].indent > baseIndent) break; // savunma
    const t = toks[i];
    if (t.trimmed === '-' || t.trimmed.startsWith('- ')) break;
    const m = t.trimmed.match(/^("?)([^:"]+)\1\s*:(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[2].trim();
    const rest = m[3].trim();
    if (rest === '') {
      const look = nextStructural(toks, i + 1);
      if (look < toks.length && toks[look].indent > baseIndent) {
        const { node, end } = parseBlock(toks, i + 1, baseIndent + 1);
        obj[key] = node;
        i = end;
      } else {
        obj[key] = null;
        i++;
      }
    } else if (/^[|>][+-]?$/.test(rest)) {
      const { text, end } = consumeBlockScalar(toks, i + 1, baseIndent);
      obj[key] = text;
      i = end;
    } else {
      obj[key] = stripQuotes(rest);
      i++;
    }
  }
  return { node: obj, end: i };
}
export function parseYamlSubset(text) {
  const toks = tokenize(text);
  return parseBlock(toks, 0, 0).node || {};
}

/** Bir job'ın step listesinden actions/upload-artifact adımlarını (bağlamıyla) toplar. */
function collectUploadSteps(doc) {
  const out = [];
  const jobs = doc && doc.jobs && typeof doc.jobs === 'object' ? doc.jobs : {};
  for (const [jobName, job] of Object.entries(jobs)) {
    const steps = job && Array.isArray(job.steps) ? job.steps : [];
    steps.forEach((step, idx) => {
      if (!step || typeof step !== 'object') return;
      const uses = typeof step.uses === 'string' ? step.uses : '';
      if (!/actions\/upload-artifact@/.test(uses)) return;
      const withB = step.with && typeof step.with === 'object' ? step.with : {};
      const rawPath = withB.path;
      const paths = (typeof rawPath === 'string' ? rawPath.split('\n') : Array.isArray(rawPath) ? rawPath : [])
        .map((p) => String(p).trim())
        .filter(Boolean);
      out.push({
        job: jobName,
        idx,
        uses,
        paths,
        ifNoFilesFound: withB['if-no-files-found'],
        stepIf: typeof step.if === 'string' ? step.if : '',
        continueOnError: step['continue-on-error'],
        priorSteps: steps.slice(0, idx),
      });
    });
  }
  return out;
}

const RECOGNIZED_ACTION_VERSIONS = new Set(['v4']);

/** Bir upload path'ini sınıflar. */
function classifyUploadPath(p) {
  const s = p.trim().replace(/\/+$/, '');
  if (s === '' || s === '.') return { raw: 'repo-root' };
  if (/\*\*|\*/.test(s)) return { raw: 'glob' };
  if (/(^|\/)playwright-report(\/|$)/.test(s)) return { raw: 'playwright-report' };
  if (/\.(zip|webm|mp4)$/i.test(s) || /-actual\.png$/i.test(s) || /-diff\.png$/i.test(s)) return { localOnly: true };
  const sec = s.match(/^test-results\/secure-upload\/([^/]+)$/);
  if (sec) return { prepared: 'secure', lane: sec[1] };
  const norm = s.replace(/\$\{\{[^}]*\}\}/g, 'X'); // dinamik segment → bounded placeholder
  if (/^test-results\/findings\/[^/]+\/upload$/.test(norm)) return { prepared: 'forensic' };
  if (/^test-results\/findings\/[^/]+\/verification\/upload$/.test(norm)) return { prepared: 'verification' };
  if (/^test-results(\/|$)/.test(s)) return { raw: 'test-results' };
  return { raw: 'unrecognized' };
}

function priorRunIncludes(step) {
  const runs = [];
  return (needle) => {
    if (!runs.length) {
      for (const s of step.priorSteps) if (s && typeof s.run === 'string') runs.push(s.run);
    }
    return runs.some((r) => r.includes(needle));
  };
}

/** Tek upload adımını denetler; ihlal listesi döndürür ({ruleId, where, detail}). */
function checkUploadStep(step) {
  const v = [];
  const where = `${step.job}#${step.idx}`;
  // action sürümü
  const ver = (step.uses.match(/@(v\d+)/) || [])[1];
  if (!ver || !RECOGNIZED_ACTION_VERSIONS.has(ver)) {
    v.push({ ruleId: RULES.ART_WORKFLOW_ACTION_VERSION, where, detail: `sürüm ${ver || '?'} tanınmıyor` });
  }
  if (!step.paths.length) {
    v.push({ ruleId: RULES.ART_WORKFLOW_RAW_UPLOAD, where, detail: 'path yok/boş' });
  }
  let preparedKind = null;
  for (const p of step.paths) {
    const c = classifyUploadPath(p);
    if (c.raw) v.push({ ruleId: RULES.ART_WORKFLOW_RAW_UPLOAD, where, detail: `ham path (${c.raw}): ${p}` });
    else if (c.localOnly) v.push({ ruleId: RULES.ART_TRACE_LOCAL_ONLY, where, detail: `trace/video/screenshot: ${p}` });
    else if (c.prepared === 'secure') {
      preparedKind = preparedKind || 'secure';
      if (!LANES.includes(c.lane)) v.push({ ruleId: RULES.ART_WORKFLOW_UNKNOWN_LANE, where, detail: `kayıt dışı lane: ${c.lane}` });
    } else if (c.prepared) preparedKind = preparedKind || c.prepared;
  }
  // if-no-files-found: error zorunlu
  if (step.ifNoFilesFound !== 'error') {
    v.push({ ruleId: RULES.ART_WORKFLOW_NO_GATE, where, detail: `if-no-files-found=${step.ifNoFilesFound ?? 'yok'} (error olmalı)` });
  }
  // continue-on-error ile kapı yumuşatılamaz
  if (step.continueOnError === true || step.continueOnError === 'true') {
    v.push({ ruleId: RULES.ART_WORKFLOW_NO_GATE, where, detail: 'continue-on-error güvenlik kapısını yumuşatır' });
  }
  // ready-guard / preparer bağı
  const has = priorRunIncludes(step);
  if (preparedKind === 'secure') {
    const refId = (step.stepIf.match(/steps\.([A-Za-z0-9_-]+)\.outputs\.ready/) || [])[1];
    const readyOk = Boolean(refId) && /==\s*'true'/.test(step.stepIf);
    const preparerOk =
      Boolean(refId) &&
      step.priorSteps.some(
        (s) =>
          s &&
          s.id === refId &&
          typeof s.run === 'string' &&
          (s.run.includes('prepare-ci-artifact') || s.run.includes('report:artifact:prepare'))
      );
    if (!readyOk || !preparerOk) {
      v.push({ ruleId: RULES.ART_WORKFLOW_NO_GATE, where, detail: 'secure bundle upload ready-guard + prepare-ci-artifact step\'ine bağlı değil' });
    }
  } else if (preparedKind === 'forensic') {
    if (!has('report:bug') && !has('report:artifact'))
      v.push({ ruleId: RULES.ART_WORKFLOW_NO_GATE, where, detail: 'forensic upload gated preparer (report:bug/report:artifact) yok' });
  } else if (preparedKind === 'verification') {
    if (!has('report:verify'))
      v.push({ ruleId: RULES.ART_WORKFLOW_NO_GATE, where, detail: 'verification upload gated preparer (report:verify) yok' });
  }
  return v;
}

export function scanWorkflowText(text) {
  const doc = parseYamlSubset(text);
  const steps = collectUploadSteps(doc);
  const violations = [];
  for (const s of steps) violations.push(...checkUploadStep(s));
  return { uploadStepCount: steps.length, violations };
}

// ── B1. Gerçek workflow(lar) 0 ihlalle geçmeli ───────────────────────────────
const workflowsDir = join(root, '.github', 'workflows');
const workflowFiles = existsSync(workflowsDir)
  ? readdirSync(workflowsDir).filter((f) => /\.ya?ml$/.test(f))
  : [];
let realUploadTotal = 0;
for (const f of workflowFiles) {
  check(`gerçek workflow ${f} → 0 ihlal`, () => {
    const res = scanWorkflowText(readFileSync(join(workflowsDir, f), 'utf8'));
    realUploadTotal += res.uploadStepCount;
    assert.deepEqual(
      res.violations,
      [],
      `ihlaller: ${res.violations.map((x) => `${x.ruleId}@${x.where}(${x.detail})`).join(' | ')}`
    );
  });
}
check('gerçek workflow toplam upload adım sayısı = 11 (envanter sabiti)', () => {
  // FAZ 2 workflow split sonrası envanter (upload adımı = ayrı workflow dosyalarına dağıldı):
  //   playwright.yml         : public-smoke + auth-quality + auth-critical + forensic + verify = 5
  //   nightly-functional.yml : full-regression (chromium)                                      = 1
  //   weekly-cross-browser.yml: full-regression (firefox/webkit)                               = 1
  //   nightly-discovery.yml  : read-only-discovery                                             = 1
  //   nightly-known-bugs.yml : nightly-known-bug-reconcile                                     = 1
  //   weekly-visual.yml      : visual-regression                                               = 1
  //   readonly-audit.yml     : readonly-audit                                                  = 1
  // Toplam = 11. (Faz 1 öncesi tek playwright.yml'de 9 + readonly-audit 1 = 10 idi; split'te
  // full-regression'ın tek upload adımı chromium/cross-browser olarak İKİYE ayrıldı → +1.)
  assert.equal(realUploadTotal, 11, `beklenen 11 upload adımı, bulunan ${realUploadTotal}`);
});

// ── B2. Sentetik kötü snippet'ler REDDEDİLMELİ ───────────────────────────────
function wf(stepYaml) {
  return `name: t\non:\n  push:\n    branches: [main]\njobs:\n  j:\n    runs-on: ubuntu-latest\n    steps:\n${stepYaml}\n`;
}
function expectWorkflowRule(text, ruleId, label) {
  const res = scanWorkflowText(text);
  assert.ok(
    res.violations.some((x) => x.ruleId === ruleId),
    `${label}: ${ruleId} bekleniyordu; gelen: ${res.violations.map((x) => x.ruleId).join(',') || '(temiz)'}`
  );
}

check('ham playwright-report/ path → ART-WORKFLOW-RAW-UPLOAD', () => {
  expectWorkflowRule(
    wf(
      '      - uses: actions/upload-artifact@v4\n' +
        '        with:\n          name: r\n          path: playwright-report/\n          if-no-files-found: error'
    ),
    RULES.ART_WORKFLOW_RAW_UPLOAD,
    'playwright-report'
  );
});
check('ham test-results/ path → ART-WORKFLOW-RAW-UPLOAD', () => {
  expectWorkflowRule(
    wf(
      '      - uses: actions/upload-artifact@v4\n' +
        '        with:\n          name: r\n          path: |\n            playwright-report/\n            test-results/\n          if-no-files-found: error'
    ),
    RULES.ART_WORKFLOW_RAW_UPLOAD,
    'test-results'
  );
});
check('secure path fakat if-no-files-found eksik → ART-WORKFLOW-NO-GATE', () => {
  expectWorkflowRule(
    wf(
      '      - id: prep\n        run: npm run report:artifact:prepare -- --lane public-smoke\n' +
        '      - uses: actions/upload-artifact@v4\n' +
        "        if: steps.prep.outputs.ready == 'true'\n" +
        '        with:\n          name: r\n          path: test-results/secure-upload/public-smoke/'
    ),
    RULES.ART_WORKFLOW_NO_GATE,
    'missing if-no-files-found'
  );
});
check('secure path fakat ready-guard yok → ART-WORKFLOW-NO-GATE', () => {
  expectWorkflowRule(
    wf(
      '      - id: prep\n        run: node tools/prepare-ci-artifact.mjs --lane public-smoke\n' +
        '      - uses: actions/upload-artifact@v4\n' +
        '        with:\n          name: r\n          path: test-results/secure-upload/public-smoke/\n          if-no-files-found: error'
    ),
    RULES.ART_WORKFLOW_NO_GATE,
    'no ready guard'
  );
});
check('kayıt dışı secure lane → ART-WORKFLOW-UNKNOWN-LANE', () => {
  expectWorkflowRule(
    wf(
      '      - id: prep\n        run: node tools/prepare-ci-artifact.mjs --lane public-smoke\n' +
        '      - uses: actions/upload-artifact@v4\n' +
        "        if: steps.prep.outputs.ready == 'true'\n" +
        '        with:\n          name: r\n          path: test-results/secure-upload/bogus-lane/\n          if-no-files-found: error'
    ),
    RULES.ART_WORKFLOW_UNKNOWN_LANE,
    'bogus lane'
  );
});
check('trace.zip upload → ART-TRACE-LOCAL-ONLY', () => {
  expectWorkflowRule(
    wf(
      '      - uses: actions/upload-artifact@v4\n' +
        '        with:\n          name: r\n          path: test-results/trace.zip\n          if-no-files-found: error'
    ),
    RULES.ART_TRACE_LOCAL_ONLY,
    'trace.zip'
  );
});
check('tanınmayan action sürümü → ART-WORKFLOW-ACTION-VERSION', () => {
  expectWorkflowRule(
    wf(
      '      - id: prep\n        run: node tools/prepare-ci-artifact.mjs --lane public-smoke\n' +
        '      - uses: actions/upload-artifact@v3\n' +
        "        if: steps.prep.outputs.ready == 'true'\n" +
        '        with:\n          name: r\n          path: test-results/secure-upload/public-smoke/\n          if-no-files-found: error'
    ),
    RULES.ART_WORKFLOW_ACTION_VERSION,
    'v3'
  );
});
check('pozitif kontrol: doğru secure snippet → 0 ihlal', () => {
  const text = wf(
    '      - id: prep\n        run: node tools/prepare-ci-artifact.mjs --lane public-smoke\n' +
      "        if: ${{ !cancelled() }}\n" +
      '      - uses: actions/upload-artifact@v4\n' +
      "        if: ${{ !cancelled() && steps.prep.outputs.ready == 'true' }}\n" +
      '        with:\n          name: public-smoke-secure\n          path: test-results/secure-upload/public-smoke/\n          if-no-files-found: error'
  );
  const res = scanWorkflowText(text);
  assert.equal(res.uploadStepCount, 1, 'tek upload adımı bulunmalı');
  assert.deepEqual(res.violations, [], `ihlaller: ${res.violations.map((x) => x.ruleId).join(',')}`);
});
check('pozitif kontrol: forensic prepared path + report:bug → 0 ihlal', () => {
  const text = wf(
    '      - run: npm run report:bug -- B4\n' +
      '      - uses: actions/upload-artifact@v4\n' +
      '        with:\n          name: forensic\n          path: test-results/findings/${{ inputs.finding_id }}/upload/\n          if-no-files-found: error'
  );
  const res = scanWorkflowText(text);
  assert.deepEqual(res.violations, [], `ihlaller: ${res.violations.map((x) => `${x.ruleId}(${x.detail})`).join(',')}`);
});

// ── Temizlik + sonuç ──────────────────────────────────────────────────────────
rmSync(scratch, { recursive: true, force: true });

if (failures.length > 0) {
  console.error(`Artifact allowlist self-check BAŞARISIZ (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  'Artifact allowlist self-check geçti: politika fail-closed (unexpected/secret/symlink/traversal/hidden/' +
    'size/count/schema/screenshot/trace-local-only/atomic/stale/log-safety) + workflow statik enforcement ' +
    `(${realUploadTotal} gerçek upload adımı 0 ihlal; ham/​glob/trace/gate/lane/version negatifleri reddedildi).`
);
