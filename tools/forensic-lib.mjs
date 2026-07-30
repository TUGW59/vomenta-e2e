// @ts-check
/**
 * WP-R3 — Forensik araçların ortak (saf, birim-test edilebilir) çekirdeği.
 *
 * Buradaki hiçbir fonksiyon registry'yi YAZMAZ, mutation yapmaz, bug kapatmaz.
 * Güvenlik kapıları (`prepareUploadBundle`, `scanEntriesForSecrets`, `scanTraceZip`)
 * ve çözümleyiciler (`resolveFinding`, `classifyRunResult`, `reconcile`) burada; CLI
 * sarmalayıcılar (report-bug / prepare-forensic-artifact / reconcile-known-bugs) yalnız
 * argüman/çıktı yönetir.
 */
import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { findSecrets } from '../tests/fixtures/sanitize.js';

/** CI upload bundle'ına KOPYALANABİLECEK tek dosya kümesi (tam ad eşleşmesi). */
export const UPLOAD_ALLOWLIST = Object.freeze([
  'candidate-update.json',
  'network-summary.json',
  'metadata.json',
  'safe-final-state.png',
]);

/**
 * Yerelde üretilebilir ama CI upload allowlist'ine BİLİNÇLİ olarak ALINMAYAN dosyalar.
 * - `*.zip`  : Playwright trace — binary/sıkıştırılmış kaynaklar text-sanitizer ile
 *              tam kanıtlanamaz; lokal-only (bkz. ADR-0007 + scanTraceZip).
 * - `*.webm`/`*.mp4` : video — production forensikte kapalı; güvenilir temizlenemez.
 * - Playwright'ın otomatik (maskesiz) ekran görüntüleri.
 * - Sanitizer başarısız olduğunda bırakılan SKIPPED notları.
 */
export const LOCAL_ONLY_PATTERNS = Object.freeze([
  /\.zip$/i,
  /\.webm$/i,
  /\.mp4$/i,
  /-actual\.png$/i,
  /-diff\.png$/i,
  /^test-.*\.png$/i,
  /\.SKIPPED\.txt$/i,
]);

/** Registry'den bulgu çözer; yoksa açık hata (CLI non-zero exit için). */
export function resolveFinding(id) {
  const finding = KNOWN_BUGS.find((b) => b.id === id);
  if (!finding) {
    const known = KNOWN_BUGS.map((b) => b.id).join(', ');
    throw new Error(`Bilinmeyen bulgu id'si "${id}". Kayıtlı id'ler: ${known}`);
  }
  return finding;
}

/** Bulgu forensik çıktı dizini (repo köküne göreli). */
export function findingDir(id) {
  return join('test-results', 'findings', String(id));
}

/**
 * CLI id'si ile önceden set edilmiş FORENSIC_BUG env'i çelişiyorsa hard failure.
 * (Aynı anda tek bulgu forensik moda alınır.)
 */
export function assertForensicCliMatchesEnv(cliId, envId) {
  if (envId && String(envId).trim() && String(envId).trim() !== cliId) {
    throw new Error(
      `Forensik uyuşmazlık: CLI id "${cliId}" ile FORENSIC_BUG="${envId}" farklı. ` +
        'Aynı anda yalnız tek bulgu forensik moda alınabilir.'
    );
  }
}

/** RegExp özel karakterlerini kaçırır (Playwright --grep için). */
export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Registry dosyasının içerik parmak izi (değişmediğini kanıtlamak için). */
export function registryFingerprint(root) {
  const p = join(root, 'tests', 'contracts', 'known-bugs.js');
  return createHash('sha256').update(readFileSync(p)).digest('hex');
}

// ── Trace güvenlik taraması (binary-aware, ama upload'a alınmaz) ──────────────
/**
 * Metin girdileri ({name, content}) üzerinde sızıntı tarar. SAF — gerçek zip'e
 * ihtiyaç duymaz; negatif self-check bunu seed'li girdilerle doğrular.
 * @param {{name:string, content:string}[]} entries
 * @returns {{ entry:string, where?:string, types:string[] }[]}
 */
export function scanEntriesForSecrets(entries) {
  const hits = [];
  for (const e of entries) {
    const inContent = findSecrets(e.content);
    if (inContent.length) hits.push({ entry: e.name, types: inContent });
    const inName = findSecrets(e.name);
    if (inName.length) hits.push({ entry: e.name, where: 'name', types: inName });
  }
  return hits;
}

/**
 * Gerçek trace.zip'i geçici dizine açar, metin-çözülebilir girdileri tarar.
 * `unzip` yoksa {tool:'none'} döner (trace güvenliği kanıtlanamaz → yine de
 * upload edilmez; lokal-only politikası zaten geçerli).
 * NOT: binary/sıkıştırılmış kaynak girdileri "undecodable" sayılır — bu yüzden
 * trace CI'a YÜKLENMEZ; bu fonksiyon yalnız görünürlük/erken-uyarı içindir.
 * @param {string} zipPath
 * @param {string} tmpDir
 */
export function scanTraceZip(zipPath, tmpDir) {
  if (!existsSync(zipPath)) return { tool: 'none', error: 'trace yok', hits: [], undecodable: 0, scanned: 0 };
  let hasUnzip = true;
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
  } catch {
    hasUnzip = false;
  }
  if (!hasUnzip) return { tool: 'none', error: 'unzip bulunamadı', hits: [], undecodable: 0, scanned: 0 };

  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  try {
    execFileSync('unzip', ['-o', '-qq', zipPath, '-d', tmpDir], { stdio: 'ignore' });
  } catch (error) {
    return { tool: 'unzip', error: `açılamadı: ${error.message}`, hits: [], undecodable: 0, scanned: 0 };
  }

  /** @type {{name:string, content:string}[]} */
  const entries = [];
  let undecodable = 0;
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const relName = prefix ? `${prefix}/${name}` : name;
      if (statSync(full).isDirectory()) {
        walk(full, relName);
        continue;
      }
      const buf = readFileSync(full);
      // NUL yoğunluğu → binary say (metin-sanitizer güvence veremez).
      let nul = 0;
      for (let i = 0; i < Math.min(buf.length, 4096); i++) if (buf[i] === 0) nul++;
      if (nul > 0) {
        undecodable++;
        entries.push({ name: relName, content: '' }); // isim yine taransın
      } else {
        entries.push({ name: relName, content: buf.toString('utf8') });
      }
    }
  };
  walk(tmpDir, '');
  const hits = scanEntriesForSecrets(entries);
  rmSync(tmpDir, { recursive: true, force: true });
  return { tool: 'unzip', hits, undecodable, scanned: entries.length };
}

// ── Upload bundle güvenlik kapısı ─────────────────────────────────────────────
/** PNG imza kontrolü (89 50 4E 47). */
function isPng(buf) {
  return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

/**
 * `<findingDir>/upload/` altına YALNIZ allowlist'teki, sanitizer/scanner'dan geçen
 * dosyaları kopyalar. Allowlist dışı beklenmeyen dosya, sızıntılı JSON veya geçersiz
 * PNG → `rejected` (CLI bunu non-zero exit'e çevirir). Lokal-only dosyalar atlanır.
 * @param {string} dir  bulgu dizini
 * @returns {{ uploadDir:string, copied:string[], skippedLocal:string[], rejected:{name:string,reason:string}[] }}
 */
export function prepareUploadBundle(dir) {
  if (!existsSync(dir)) throw new Error(`bulgu dizini yok: ${dir}`);
  const uploadDir = join(dir, 'upload');
  rmSync(uploadDir, { recursive: true, force: true });

  const copied = [];
  const skippedLocal = [];
  const rejected = [];

  for (const name of readdirSync(dir)) {
    if (name === 'upload') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      rejected.push({ name, reason: 'beklenmeyen alt-dizin (allowlist dışı)' });
      continue;
    }

    if (UPLOAD_ALLOWLIST.includes(name)) {
      if (name.endsWith('.json')) {
        const content = readFileSync(full, 'utf8');
        const leaks = findSecrets(content);
        if (leaks.length) {
          rejected.push({ name, reason: `sanitizer sızıntı yakaladı: ${leaks.join(', ')}` });
          continue;
        }
      } else if (name.endsWith('.png')) {
        if (!isPng(readFileSync(full))) {
          rejected.push({ name, reason: 'geçersiz PNG imzası' });
          continue;
        }
      }
      mkdirSync(uploadDir, { recursive: true });
      copyFileSync(full, join(uploadDir, name));
      copied.push(name);
    } else if (LOCAL_ONLY_PATTERNS.some((re) => re.test(name))) {
      skippedLocal.push(name);
    } else {
      rejected.push({ name, reason: 'allowlist dışı beklenmeyen dosya' });
    }
  }

  return { uploadDir, copied, skippedLocal, rejected };
}

// ── Playwright JSON sonuç çözümleme ──────────────────────────────────────────
/** JSON raporundaki tüm test kayıtlarını (spec+result) düzleştirir. */
export function flattenPlaywrightReport(report) {
  /** @type {{file:string, title:string, expectedStatus:string, status:string, error?:string, durationMs?:number, project?:string, attachments:{name:string,path?:string,contentType?:string}[]}[]} */
  const out = [];
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const r = results[results.length - 1] || {};
        out.push({
          file: spec.file,
          title: spec.title,
          expectedStatus: t.expectedStatus || 'unknown',
          status: r.status || 'unknown',
          firstStatus: results[0]?.status || 'unknown', // WP-R4: retry-pass tespiti
          attempts: results.length, // WP-R4: retry sayısı = attempts-1
          error: r.error?.message || (r.errors && r.errors[0]?.message) || undefined,
          durationMs: r.duration,
          project: t.projectName || t.projectId,
          attachments: r.attachments || [],
        });
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of report.suites || []) walk(s);
  return out;
}

/**
 * Forensik koşuda (test.fail atlanmış → expectedStatus='passed') tek test sonucunu
 * sınıflar. Deterministik ve gözlemlenebilir.
 * @param {{status:string, expectedStatus?:string}|undefined} t
 */
export function classifyRunResult(t) {
  if (!t) return 'infra-error'; // grep hiçbir teste uymadı / rapor boş
  switch (t.status) {
    case 'failed':
      return 'reproduced'; // bug hâlâ mevcut (assertion gerçekten kırıldı)
    case 'passed':
      return 'unexpected-pass'; // bug artık reproduce olmuyor → WP-R4 adayı
    case 'skipped':
      return 'inconclusive'; // veri/koşul yok (test.skip)
    case 'timedOut':
    case 'interrupted':
      return 'infra-error';
    default:
      return 'inconclusive';
  }
}

// ── Nightly reconcile (fixed-candidate önerisi) ───────────────────────────────
/**
 * Normal koşu sonuçlarından "beklenmedik geçiş" gösteren knownBugGuard bulgularını
 * bulur. YALNIZ öneri üretir — registry değişmez, status güncellenmez, bug kapanmaz.
 *
 * Beklenmedik geçiş: guard='knownBugGuard' (expectedStatus='failed') VE gerçek status
 * 'passed'. `permanent`/`fixme` bulgular ve normal beklenen-başarısızlıklar aday DEĞİL.
 *
 * @param {any} report  Playwright JSON raporu
 * @param {readonly any[]} registry  KNOWN_BUGS
 * @param {{ generatedAt?:string|null, commitSha?:string|null }} [meta]
 */
export function reconcile(report, registry, meta = {}) {
  const flat = flattenPlaywrightReport(report);
  const byKey = new Map(flat.map((t) => [`${t.file}::${t.title}`, t]));
  const candidates = [];
  for (const b of registry) {
    if (b.guard !== 'knownBugGuard') continue; // yalnız beklenen-başarısızlık kontratı
    const t = byKey.get(`${b.test.file}::${b.test.title}`);
    if (!t) continue;
    const unexpectedPass = t.expectedStatus === 'failed' && t.status === 'passed';
    if (unexpectedPass) {
      candidates.push({
        findingId: b.id,
        reason: 'unexpected-pass',
        recommendedStatus: 'fixed-candidate',
        registryChanged: false,
      });
    }
  }
  return {
    generatedAt: meta.generatedAt ?? null,
    commitSha: meta.commitSha ?? null,
    note: 'ÖNERİDİR. Tek beklenmedik geçiş "verified fixed" DEĞİLDİR. Registry değişmedi. Doğrulama WP-R4.',
    candidates,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// WP-R4 — Fixed-candidate verification (mekanizma; hiçbir finding KAPATILMAZ).
// ════════════════════════════════════════════════════════════════════════════

/** Doğrulama eşiği (WP-R4 tasarım kararı #5). */
export const VERIFY_MIN_RUNS = 3; // en az 3 bağımsız başarılı run
export const VERIFY_MIN_DAYS = 2; // en az 2 ayrı takvim gününe yayılmış

/** Doğrulama artifact upload allowlist'i (üst düzey tam-ad + attestations/*.json). */
export const VERIFICATION_UPLOAD_ALLOWLIST = Object.freeze([
  'verification-report.json',
  'profile.json',
]);

/**
 * İzin anahtarlarını güvenli/normalize profile indirger: yalnız scope-anahtarı
 * biçimindeki (değer/secret/PII olmayan) anahtarlar; benzersiz + sıralı + fingerprint.
 * @param {string[]} keys
 * @returns {{ fingerprint: string, permissions: string[] }}
 */
export function normalizeProfile(keys) {
  const safe = [...new Set((keys || []).map((k) => String(k).trim()).filter(Boolean))]
    .filter((k) => /^[a-z0-9][a-z0-9._:*-]{0,80}$/i.test(k)) // scope-anahtarı şekli
    .filter((k) => findSecrets(k).length === 0) // secret/PII eleme
    .sort();
  const fingerprint = 'sha256:' + createHash('sha256').update(safe.join('\n')).digest('hex');
  return { fingerprint, permissions: safe };
}

/**
 * Normalize izin listesi beklenen profil kısıtını sağlıyor mu?
 * @param {string[]} permissions
 * @param {{ require?: string[], forbid?: string[] }} expected
 */
export function profileMatches(permissions, expected) {
  const set = new Set(permissions || []);
  const requireOk = (expected?.require || []).every((k) => set.has(k));
  const forbidOk = (expected?.forbid || []).every((k) => !set.has(k));
  return requireOk && forbidOk;
}

/** YYYY-MM-DD biçimi mi? */
function isDay(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Bir attestation "bağımsız başarılı run" niteliğini taşıyor mu (WP-R4 kararı #4)?
 * @param {any} a
 * @param {string} expectedRegistryFingerprint
 */
export function qualifiesAsSuccess(a, expectedRegistryFingerprint) {
  return Boolean(
    a &&
      a.result === 'pass' && // bulgu reproduce OLMADI
      a.firstAttemptPass === true && // ilk denemede pass
      a.retries === 0 && // retry-pass sayılmaz
      a.profileVerified === true && // beklenen rol/izin profili
      a.freshLogin === true && // taze login/storage state (alan adı sanitizer'a takılmasın diye 'session' değil)
      a.environment === 'production-readonly' &&
      typeof a.workflowRunId === 'string' &&
      a.workflowRunId.trim().length > 0 && // ayrı tetikleme kimliği
      isDay(a.day) &&
      a.registryFingerprint === expectedRegistryFingerprint // registry değişmemiş
  );
}

/**
 * Attestation kümesini WP-R4 eşiğine göre birleştirir ve sonuç durumu üretir.
 * YALNIZ öneri; registry DEĞİŞMEZ. `verified-fixed-proposal` bile öneridir.
 *
 * Sonuç durumları: candidate | insufficient-evidence | verified-fixed-proposal |
 *                  reproduced | inconclusive | infra-error
 *
 * @param {string} findingId
 * @param {any[]} attestations
 * @param {{ now?: string|null, expectedRegistryFingerprint: string }} opts
 */
export function aggregateVerification(findingId, attestations, opts) {
  const expectedFp = opts?.expectedRegistryFingerprint;
  const sorted = [...(attestations || [])]
    .filter((a) => a && a.findingId === findingId)
    .sort((x, y) => String(x.timestamp).localeCompare(String(y.timestamp)));

  // Sondan başlayarak kesintisiz nitelikli başarılı seri (arada disqualifier serirseti sıfırlar).
  const streak = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (qualifiesAsSuccess(sorted[i], expectedFp)) streak.unshift(sorted[i]);
    else break;
  }
  const distinctRuns = new Set(streak.map((a) => a.workflowRunId)).size;
  const distinctDays = new Set(streak.map((a) => a.day)).size;
  const latest = sorted[sorted.length - 1];

  let result;
  if (!latest) result = 'candidate';
  else if (latest.result === 'reproduced') result = 'reproduced';
  else if (latest.result === 'infra-error') result = 'infra-error';
  else if (latest.result === 'inconclusive' || latest.profileVerified === false) result = 'inconclusive';
  else if (distinctRuns >= VERIFY_MIN_RUNS && distinctDays >= VERIFY_MIN_DAYS)
    result = 'verified-fixed-proposal';
  else result = 'insufficient-evidence';

  return {
    findingId,
    generatedAt: opts?.now ?? null,
    result,
    threshold: { minRuns: VERIFY_MIN_RUNS, minDays: VERIFY_MIN_DAYS },
    streak: { runs: distinctRuns, days: distinctDays, attestations: streak.length },
    totalAttestations: sorted.length,
    expectedRegistryFingerprint: expectedFp,
    registryChanged: false,
    note:
      'ÖNERİDİR. verified-fixed-proposal dahi yalnız öneridir; registry DEĞİŞMEZ, ' +
      'guard kaldırılmaz, bug kapanmaz. Kapanış yalnız insan onaylı ayrı PR ile.',
  };
}

/**
 * Doğrulama upload bundle güvenlik kapısı: `<dir>/upload/` altına YALNIZ
 * `verification-report.json` + `profile.json` (varsa) + `attestations/*.json`
 * (her biri secret-taramasından geçer) kopyalar. Beklenmeyen dosya/dizin → rejected.
 * @param {string} dir
 */
export function prepareVerificationBundle(dir) {
  if (!existsSync(dir)) throw new Error(`doğrulama dizini yok: ${dir}`);
  const uploadDir = join(dir, 'upload');
  rmSync(uploadDir, { recursive: true, force: true });

  const copied = [];
  const skippedLocal = [];
  const rejected = [];

  const scanCopy = (absFile, relName) => {
    if (relName.endsWith('.json')) {
      const leaks = findSecrets(readFileSync(absFile, 'utf8'));
      if (leaks.length) {
        rejected.push({ name: relName, reason: `sanitizer sızıntı yakaladı: ${leaks.join(', ')}` });
        return;
      }
    } else {
      rejected.push({ name: relName, reason: 'yalnız .json doğrulama artifact\'i yüklenir' });
      return;
    }
    const dest = join(uploadDir, relName);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(absFile, dest);
    copied.push(relName);
  };

  for (const name of readdirSync(dir)) {
    if (name === 'upload') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'attestations') {
        for (const f of readdirSync(full)) {
          const af = join(full, f);
          if (statSync(af).isDirectory()) { rejected.push({ name: `attestations/${f}`, reason: 'beklenmeyen alt-dizin' }); continue; }
          scanCopy(af, `attestations/${f}`);
        }
      } else {
        rejected.push({ name, reason: 'beklenmeyen alt-dizin (allowlist dışı)' });
      }
      continue;
    }
    if (VERIFICATION_UPLOAD_ALLOWLIST.includes(name)) scanCopy(full, name);
    else if (LOCAL_ONLY_PATTERNS.some((re) => re.test(name))) skippedLocal.push(name);
    else rejected.push({ name, reason: 'allowlist dışı beklenmeyen dosya' });
  }

  return { uploadDir, copied, skippedLocal, rejected };
}
