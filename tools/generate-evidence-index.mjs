#!/usr/bin/env node
// @ts-check
/**
 * WP-EVIDENCE FAZ 3 (ADR-0026 §4) — `evidence-index.json` üreteci.
 *
 *   node tools/generate-evidence-index.mjs --bundles <dir> [--out docs/raporlar/evidence-index.json]
 *
 * Ne yapar:
 *  - `--bundles <dir>` altındaki HER alt-dizini bir güvenli kanıt bundle'ı sayar
 *    (CI'da `actions/download-artifact` ile inen `evidence-bundle-<id>-<sha>-<runid>/`
 *    dizinleri; lokal self-check'te sentetik dizinler). Alt-dizin adı = artifact adı.
 *  - Her bundle'ın `metadata.json`'undan `findingId`'yi okur; `pickEvidenceArtifact`
 *    ile TEK temsili maskeli kanıtı (location > final-state > network) seçer.
 *  - Bulgu başına kayıt üretir: `{ artifactPath, runUrl, expiry, capturedAt }` (ADR §4
 *    birebir). `artifactPath` = `<artifact adı>/<seçilen dosya>` (relative).
 *  - `runUrl` / `capturedAt` / `expiry` CI ORTAMINDAN enjekte edilir — üreteç
 *    duvar-saati/rastgelelik KULLANMAZ (determinizm; ADR §4-§5).
 *  - Sonucu `docs/raporlar/evidence-index.json`'a yazar (COMMIT'lenir).
 *
 * DEĞİŞMEZLER (ADR-0026):
 *  - Registry'ye DOKUNMAZ; `rootCause`/`possibleCauses` ÜRETMEZ (yalnız link).
 *  - Additive & dürüst: kanıtı olmayan bulgu index'e GİRMEZ ("Kanıt: yok" kalır).
 *  - Deterministik: aynı bundles dizini + aynı enjekte env → BAYT BAYT aynı çıktı.
 */
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { pickEvidenceArtifact } from './forensic-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Enjekte edilen ISO an + gün → ISO son-kullanma (deterministik; duvar-saati KULLANILMAZ). */
export function computeExpiry(capturedAtIso, retentionDays) {
  const base = Date.parse(capturedAtIso);
  const days = Number(retentionDays);
  if (!Number.isFinite(base) || !Number.isFinite(days)) return null;
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Path traversal / absolute / NUL taşıyan artifactPath güvensizdir. */
function isSafeRelPath(p) {
  if (typeof p !== 'string' || p === '') return false;
  if (p.includes('\0') || p.startsWith('/') || /^[A-Za-z]:/.test(p)) return false;
  return !p.split('/').some((seg) => seg === '..' || seg === '');
}

/**
 * SAF çekirdek: bundle dizinlerini tarar, deterministik `evidence-index.json` NESNESİ
 * üretir. IO burada okuma yapar ama zaman/koşum değerleri DIŞARIDAN gelir.
 *
 * @param {object} opts
 * @param {string} opts.bundlesDir           alt-dizinleri kanıt bundle'ı olan kök
 * @param {string|null} [opts.runUrl]        CI koşum linki (enjekte)
 * @param {string|null} [opts.capturedAt]    ISO — kanıtın yakalandığı an (enjekte)
 * @param {string|null} [opts.expiry]        ISO — artifact son-kullanma (enjekte/hesap)
 * @returns {{ index: Record<string, {artifactPath:string,runUrl:string,expiry:string,capturedAt:string}>, skipped: {dir:string, reason:string}[] }}
 */
export function buildEvidenceIndex(opts) {
  const { bundlesDir } = opts;
  const runUrl = opts.runUrl ?? null;
  const capturedAt = opts.capturedAt ?? null;
  const expiry = opts.expiry ?? null;

  /** @type {Record<string, any>} */
  const index = {};
  const skipped = [];

  if (!bundlesDir || !existsSync(bundlesDir) || !statSync(bundlesDir).isDirectory()) {
    return { index, skipped };
  }

  // Alt-dizinleri deterministik sırayla gez (isim sıralı).
  const dirs = readdirSync(bundlesDir)
    .filter((n) => {
      try {
        return statSync(join(bundlesDir, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();

  for (const dir of dirs) {
    const abs = join(bundlesDir, dir);
    const metaPath = join(abs, 'metadata.json');
    if (!existsSync(metaPath)) {
      skipped.push({ dir, reason: 'metadata.json yok' });
      continue;
    }
    let meta;
    try {
      meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    } catch {
      skipped.push({ dir, reason: 'metadata.json geçersiz JSON' });
      continue;
    }
    const findingId = meta && typeof meta.findingId === 'string' ? meta.findingId.trim() : '';
    if (!findingId) {
      skipped.push({ dir, reason: 'findingId yok' });
      continue;
    }
    const files = readdirSync(abs).filter((f) => {
      try {
        return statSync(join(abs, f)).isFile();
      } catch {
        return false;
      }
    });
    const picked = pickEvidenceArtifact(files);
    if (!picked) {
      // Dürüstlük: yakalanmış maskeli kanıt yok → index'e girmez.
      skipped.push({ dir, reason: 'temsili kanıt (location/final-state/network) yok' });
      continue;
    }
    const artifactPath = `${dir}/${picked}`;
    if (!isSafeRelPath(artifactPath)) {
      skipped.push({ dir, reason: 'güvensiz artifactPath' });
      continue;
    }
    // Aynı bulgu birden çok bundle'da görülürse ilk (isim-sıralı) alınır; deterministik.
    if (index[findingId]) {
      skipped.push({ dir, reason: `yinelenen bulgu (${findingId}); ilk bundle korundu` });
      continue;
    }
    index[findingId] = {
      artifactPath,
      runUrl: runUrl ?? '',
      expiry: expiry ?? '',
      capturedAt: capturedAt ?? '',
    };
  }

  return { index, skipped };
}

/** Deterministik serileştirme: bulgu id'leri sıralı, alanlar sabit sırada. */
export function serializeEvidenceIndex(index) {
  const ordered = {};
  for (const id of Object.keys(index).sort()) {
    const r = index[id];
    ordered[id] = {
      artifactPath: r.artifactPath,
      runUrl: r.runUrl,
      expiry: r.expiry,
      capturedAt: r.capturedAt,
    };
  }
  return JSON.stringify(ordered, null, 2) + '\n';
}

// ── CLI ───────────────────────────────────────────────────────────────────────
function isMain() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function parseArgs(argv) {
  const o = { bundles: 'test-results/evidence-download', out: 'docs/raporlar/evidence-index.json' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundles') o.bundles = argv[++i];
    else if (a.startsWith('--bundles=')) o.bundles = a.slice('--bundles='.length);
    else if (a === '--out') o.out = argv[++i];
    else if (a.startsWith('--out=')) o.out = a.slice('--out='.length);
  }
  return o;
}

function fail(msg) {
  console.error(`generate-evidence-index HATA — ${msg}`);
  process.exit(1);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const bundlesDir = resolve(root, opts.bundles);
  const outAbs = resolve(root, opts.out);

  // Enjekte edilen provenance (üreteç zaman ÜRETMEZ).
  const runUrl = process.env.EVIDENCE_RUN_URL || null;
  const capturedAt = process.env.EVIDENCE_CAPTURED_AT || null;
  let expiry = process.env.EVIDENCE_EXPIRY || null;
  if (!expiry && capturedAt && process.env.EVIDENCE_RETENTION_DAYS) {
    expiry = computeExpiry(capturedAt, process.env.EVIDENCE_RETENTION_DAYS);
  }

  // Önce bundle var mı bak: kanıt varsa provenance ZORUNLU (fail-closed); yoksa boş index.
  const hasBundles =
    existsSync(bundlesDir) &&
    statSync(bundlesDir).isDirectory() &&
    readdirSync(bundlesDir).some((n) => {
      try {
        return statSync(join(bundlesDir, n)).isDirectory();
      } catch {
        return false;
      }
    });

  if (hasBundles) {
    if (!runUrl) fail('EVIDENCE_RUN_URL zorunlu (provenance) — kanıt bundle\'ları mevcut.');
    if (!capturedAt) fail('EVIDENCE_CAPTURED_AT (ISO) zorunlu — kanıt bundle\'ları mevcut.');
    if (!expiry) fail('EVIDENCE_EXPIRY veya EVIDENCE_RETENTION_DAYS gerekli (expiry hesabı).');
  }

  const { index, skipped } = buildEvidenceIndex({ bundlesDir, runUrl, capturedAt, expiry });
  const text = serializeEvidenceIndex(index);

  mkdirSync(dirname(outAbs), { recursive: true });
  writeFileSync(outAbs, text);

  console.log(`✔ evidence-index.json yazıldı: ${opts.out}`);
  console.log(`✔ kayıt sayısı: ${Object.keys(index).length}${hasBundles ? '' : ' (bundle yok → boş index)'}`);
  if (skipped.length) {
    console.log(`  atlanan bundle: ${skipped.length}`);
    for (const s of skipped) console.log(`    - ${s.dir}: ${s.reason}`);
  }
}

if (isMain()) main();
