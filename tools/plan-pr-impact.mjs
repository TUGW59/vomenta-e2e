// @ts-check
/**
 * PR-IMPACT PLAN CLI (WP-CI-E1 / Faz 1).
 *
 * Değişen dosyalardan `tools/pr-impact-lib.mjs` motoruyla deterministik seçim
 * planı üretir ve `test-results/pr-impact/selection.json`'a yazar.
 *
 * Çalışma biçimleri:
 *   1) Açık SHA:     node tools/plan-pr-impact.mjs --base <sha> --head <sha>
 *   2) CI otomatik:  GITHUB_BASE_REF + GITHUB_SHA ortamından türetir
 *   3) Sentetik:     --changed <path> [...] | --changed-status <Xs>:<path>
 *                    --from-json <dosya>
 *
 * Kurallar (ADR-0010 §girdi sözleşmesi):
 *   - base/head doğrulanmadan diff hesaplanmaz.
 *   - PR karşılaştırması merge-base semantiğini korur (üç-nokta `base...head`).
 *   - Gerekli commit yoksa (shallow) `sourceMissing=true` ve non-zero.
 *   - Rename/delete/binary ele alınır; absolute path çıktıya yazılmaz.
 *
 * Bu araç ağa çıkmaz ve testleri ÇALIŞTIRMAZ; yalnız plan üretir.
 * Faz 2 runner'ı (`tools/run-pr-impact.mjs`) planı tüketip Playwright'ı çağırır.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { planImpact, serializePlan, normalizePath } from './pr-impact-lib.mjs';

function parseArgs(argv) {
  const out = { changed: [], root: process.cwd(), out: null, print: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--base') out.base = next();
    else if (a === '--head') out.head = next();
    else if (a === '--changed') out.changed.push({ path: next(), status: 'M' });
    else if (a === '--changed-status') {
      const raw = next() || '';
      const idx = raw.indexOf(':');
      out.changed.push({
        status: idx > 0 ? raw.slice(0, idx) : 'M',
        path: idx > 0 ? raw.slice(idx + 1) : raw,
      });
    } else if (a === '--from-json') out.fromJson = next();
    else if (a === '--out') out.out = next();
    else if (a === '--root') out.root = path.resolve(next());
    else if (a === '--print') out.print = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** Bir revizyonun gerçekten var olduğunu (commit'e çözüldüğünü) doğrular. */
function revExists(root, rev) {
  if (!rev) return false;
  try {
    git(root, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Değişen dosyaları belirle. Öncelik: sentetik girdi > from-json > git diff.
 * @returns {{ changedFiles: any[], sourceMissing: boolean, base: string|null, head: string|null, mode: string }}
 */
function resolveChangedFiles(opts) {
  // 1) Sentetik / test girdisi (git'e dokunmadan).
  if (opts.changed.length > 0) {
    return { changedFiles: opts.changed, sourceMissing: false, base: null, head: null, mode: 'synthetic' };
  }
  if (opts.fromJson) {
    const parsed = JSON.parse(readFileSync(opts.fromJson, 'utf8'));
    const list = Array.isArray(parsed) ? parsed : parsed.changedFiles || [];
    const changedFiles = list.map((x) =>
      typeof x === 'string' ? { path: x, status: 'M' } : x
    );
    return { changedFiles, sourceMissing: false, base: null, head: null, mode: 'from-json' };
  }

  // 2) CI otomatik türetme.
  let base = opts.base;
  let head = opts.head;
  let mode = 'local';
  if (!base && process.env.GITHUB_BASE_REF) {
    base = process.env.GITHUB_BASE_REF;
    mode = 'ci';
  }
  if (!head && process.env.GITHUB_SHA) {
    head = process.env.GITHUB_SHA;
    mode = 'ci';
  }
  if (!head) head = 'HEAD';

  // 3) base/head doğrulaması → shallow/eksik commit fail-closed.
  const baseOk = revExists(opts.root, base);
  const headOk = revExists(opts.root, head);
  if (!base || !baseOk || !headOk) {
    return {
      changedFiles: [],
      sourceMissing: true,
      base: base || null,
      head: head || null,
      mode,
    };
  }

  // 4) Ortak ata (merge-base) yoksa (shallow) fail-closed.
  let mergeBase;
  try {
    mergeBase = git(opts.root, ['merge-base', base, head]).trim();
  } catch {
    return { changedFiles: [], sourceMissing: true, base, head, mode };
  }
  if (!mergeBase) {
    return { changedFiles: [], sourceMissing: true, base, head, mode };
  }

  const raw = git(opts.root, ['diff', '--name-status', '-z', `${mergeBase}`, `${head}`]);
  // -z NUL ayracı: rename güvenli. Basit sekme-ayrıştırıcıya uyum için düzelt.
  const changedFiles = parseNameStatusZ(raw);
  return { changedFiles, sourceMissing: false, base, head, mode };
}

/** `git diff --name-status -z` (NUL-ayraçlı) çıktısını güvenli ayrıştırır. */
function parseNameStatusZ(raw) {
  const tokens = raw.split('\0').filter((t) => t.length > 0);
  const files = [];
  for (let i = 0; i < tokens.length; i++) {
    const code = tokens[i];
    const letter = code[0].toUpperCase();
    if (letter === 'R' || letter === 'C') {
      const oldPath = tokens[++i];
      const newPath = tokens[++i];
      files.push({ path: newPath, status: letter, oldPath });
    } else {
      const p = tokens[++i];
      files.push({ path: p, status: letter });
    }
  }
  return files;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      'Kullanım: node tools/plan-pr-impact.mjs [--base <sha> --head <sha>] ' +
        '[--changed <path>]... [--changed-status <XS>:<path>]... [--from-json <f>] ' +
        '[--out <f>] [--root <dir>] [--print]'
    );
    process.exit(0);
  }

  const { changedFiles, sourceMissing, base, head, mode } = resolveChangedFiles(opts);

  const plan = planImpact({
    changedFiles,
    root: opts.root,
    sourceMissing,
    baseSha: base,
    headSha: head,
    mode,
  });

  const outPath = normalizePath(opts.out || 'test-results/pr-impact/selection.json');
  const absOut = path.join(opts.root, outPath);
  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, serializePlan(plan), 'utf8');

  // Kısa, secretsiz özet (yalnız kural kimliği ve sayı).
  const s = plan.selected;
  console.error(
    `[pr-impact] status=${plan.status} mode=${plan.mode} ` +
      `changed=${plan.changedFiles.length} ` +
      `public=${s.publicSpecs.length} authed=${s.authenticatedSpecs.length} ` +
      `discovery=${s.discoverySpecs.length} discoveryDeferred=${(plan.discoveryDeferredToNightly || []).length} ` +
      `fallback=${plan.fallbackSuites.length} ` +
      `mutationBlocked=${plan.stagingBlockedMutationSpecs.length} ` +
      `unmapped=${plan.unmappedRuntimeFiles.length} runnable=${plan.selectedRunnableSpecCount}`
  );
  console.error(`[pr-impact] plan → ${outPath}`);
  if (plan.print || opts.print) process.stdout.write(serializePlan(plan));

  process.exit(plan.exitCode);
}

main();
