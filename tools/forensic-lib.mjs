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
import { isValidScope } from '../tests/fixtures/scope-extract.js';

/**
 * CI upload bundle'ına KOPYALANABİLECEK tek dosya kümesi (tam ad eşleşmesi).
 *
 * `location.png` (FAZ 2 / ADR-0026 §1): bulgunun hatalı locator'ının boundingBox'ı
 * kutuyla işaretlenmiş, geri kalanı `safe-final-state.png` ile AYNI PII maskeleriyle
 * alınmış maskeli görsel. Kontrollü eklenir; sanitize/PNG-imza kapısı (prepareUploadBundle)
 * bu dosyaya da uygulanır. Hedef yoksa/maskeleme başarısızsa `location.png` üretilmez
 * (`location.SKIPPED.txt` bırakılır → LOCAL_ONLY_PATTERNS, upload dışı).
 */
export const UPLOAD_ALLOWLIST = Object.freeze([
  'candidate-update.json',
  'network-summary.json',
  'metadata.json',
  'safe-final-state.png',
  'location.png',
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

/**
 * (FAZ 3 / ADR-0026 §4) Kanıt indexi için bir bulgu bundle'ından TEK temsili güvenli
 * artifact seçer. Tercih sırası: işaretli konum > tam-sayfa durum > ağ özeti. Yalnız
 * GERÇEK yakalanmış maskeli kanıt sayılır; `metadata.json`/`candidate-update.json` tek
 * başına kanıt DEĞİLDİR (dürüstlük: kanıtı olmayan bulgu index'e girmez → raporda
 * "Kanıt: yok" kalır). Deterministik: aynı dosya kümesi → aynı seçim.
 * @param {readonly string[]} fileNames  bundle içindeki (düz) dosya adları
 * @returns {string|null}  seçilen dosya adı ya da (kanıt yoksa) null
 */
export const EVIDENCE_ARTIFACT_PREFERENCE = Object.freeze([
  'location.png',
  'safe-final-state.png',
  'network-summary.json',
]);
export function pickEvidenceArtifact(fileNames) {
  const set = new Set((Array.isArray(fileNames) ? fileNames : []).map(String));
  for (const name of EVIDENCE_ARTIFACT_PREFERENCE) {
    if (set.has(name)) return name;
  }
  return null;
}

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
          // (WP-DRAFT additive) Playwright TEST-seviyesi sonucu: expected|unexpected|flaky|skipped.
          // triage sınıflandırması bunu kullanır; eski raporlarda yoksa status/retry'a düşülür.
          outcome: t.status || 'unknown',
          annotations: (t.annotations || []).map((a) => a && a.type).filter(Boolean),
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
  // Playwright JSON `spec.file` bazen `tests/` öneksiz gelir; registry hep önekli.
  // Anahtarı normalize et (yoksa lookup hep ıskalar → 0 aday yanlış-negatifi).
  const normFile = (f) => String(f || '').replace(/^tests\//, '');
  const byKey = new Map(flat.map((t) => [`${normFile(t.file)}::${t.title}`, t]));
  const candidates = [];
  for (const b of registry) {
    if (b.guard !== 'knownBugGuard') continue; // yalnız beklenen-başarısızlık kontratı
    const t = byKey.get(`${normFile(b.test.file)}::${b.test.title}`);
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

/**
 * Attestation uyumluluk kimlikleri (WP-R4 takip #2). Eski/sürümsüz veya farklı sürümlü
 * kayıtlar başarılı kanıt sayılmaz; raporda `ignoredAttestations` altında gösterilir.
 * Şema veya ağ-politikası değişince bu sürümler artırılır → eski artifact'ler otomatik elenir.
 */
export const VERIFICATION_SCHEMA_VERSION = 2;
export const NETWORK_POLICY_VERSION = 1;

/** Doğrulama artifact upload allowlist'i (üst düzey tam-ad + attestations/*.json). */
export const VERIFICATION_UPLOAD_ALLOWLIST = Object.freeze([
  'verification-report.json',
  'profile.json',
  'network-summary.json', // WP-R4 takip: read-only ağ kanıtı (WP-R3 collector'ı üretir; sanitize edilmiş)
]);

/** Salt-okunur ihlali sayılan HTTP method'ları. */
export const MUTATING_METHODS = Object.freeze(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Sanitize edilmiş network-summary'den mutation method isteklerini çıkarır (salt-okunur
 * kanıtı). Auth-setup trafiği DEĞİL — özet yalnız hedef testin page context'ini kapsar
 * (WP-R3 forensik recorder testin page'ine bağlıdır).
 * @param {{ requests?: {method?:string, path?:string}[] }|null|undefined} summary
 * @returns {{ readOnly: boolean, mutating: string[] }}
 */
export function assessReadOnly(summary) {
  const reqs = (summary && Array.isArray(summary.requests)) ? summary.requests : [];
  const mutating = reqs
    .filter((r) => MUTATING_METHODS.includes(String(r.method || '').toUpperCase()))
    .map((r) => `${String(r.method).toUpperCase()} ${r.path || ''}`.trim());
  return { readOnly: mutating.length === 0, mutating: [...new Set(mutating)] };
}

/**
 * İzin anahtarlarını deterministik normalize profile indirger: yalnız YAPISAL geçerli
 * scope'lar (isValidScope — timestamp/UUID/URL/e-posta/sayısal yapısal dışlanır),
 * secret/PII taramalı, benzersiz + sıralı. Fingerprint = sha256(contractId@version +
 * sıralı scope listesi). run-id / timestamp / yanıt sırası fingerprint'e GİRMEZ →
 * aynı hesap + aynı kontrat → aynı fingerprint (WP-R4 takip düzeltmesi #1).
 * @param {string[]} keys
 * @param {{ contractId?: string, version?: number }} [ctx]
 * @returns {{ fingerprint: string, permissions: string[] }}
 */
export function normalizeProfile(keys, ctx = {}) {
  const safe = [...new Set((keys || []).map((k) => String(k).trim()).filter(Boolean))]
    .filter((k) => isValidScope(k)) // yapısal geçerli scope
    .filter((k) => findSecrets(k).length === 0) // secret/PII eleme
    .sort();
  const basis = `${ctx.contractId ?? ''}@${ctx.version ?? 0}\n${safe.join('\n')}`;
  const fingerprint = 'sha256:' + createHash('sha256').update(basis).digest('hex');
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
      a.readOnlyVerified === true && // salt-okunur ağ kanıtı (WP-R4 takip #2)
      a.policyViolation !== true && // mutation method görülmedi
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
  const expectedContractId = opts?.expectedProfileContractId ?? findingId;
  const expectedContractVersion = opts?.expectedProfileContractVersion ?? 0;
  const expectedNetworkPolicy = opts?.expectedNetworkPolicyVersion ?? NETWORK_POLICY_VERSION;

  // ── Uyumluluk kapısı: uyumsuz kayıtlar seri/eşiğe GİRMEZ, nedeniyle raporlanır ──
  const ignored = [];
  const compatibleList = [];
  for (const a of attestations || []) {
    if (!a || typeof a !== 'object') { ignored.push({ key: '(bozuk)', reason: 'invalid-record' }); continue; }
    const key = `${a.findingId ?? '?'}::${a.workflowRunId ?? '?'}`;
    if (a.findingId !== findingId) { ignored.push({ key, reason: 'finding-mismatch' }); continue; }
    if (a.schemaVersion !== VERIFICATION_SCHEMA_VERSION) { ignored.push({ key, reason: 'legacy-or-unversioned-schema' }); continue; }
    if (a.profileContractId !== expectedContractId) { ignored.push({ key, reason: 'profile-contract-id-mismatch' }); continue; }
    if (a.profileContractVersion !== expectedContractVersion) { ignored.push({ key, reason: 'profile-contract-version-mismatch' }); continue; }
    if (a.networkPolicyVersion !== expectedNetworkPolicy) { ignored.push({ key, reason: 'network-policy-version-mismatch' }); continue; }
    compatibleList.push(a);
  }

  // ── Dedupe: findingId + workflowRunId (yalnız dosya adına güvenme); en yeni timestamp kalır ──
  const byRun = new Map();
  for (const a of compatibleList) {
    const k = `${a.findingId}::${a.workflowRunId}`;
    const prev = byRun.get(k);
    if (!prev || String(a.timestamp) > String(prev.timestamp)) byRun.set(k, a);
  }
  const dedupDropped = compatibleList.length - byRun.size;
  const sorted = [...byRun.values()].sort((x, y) => String(x.timestamp).localeCompare(String(y.timestamp)));

  // Sondan başlayarak kesintisiz nitelikli başarılı seri (arada disqualifier seriyi sıfırlar).
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
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    result,
    policyViolation: Boolean(latest && latest.policyViolation), // son koşuda mutation method görüldü mü
    threshold: { minRuns: VERIFY_MIN_RUNS, minDays: VERIFY_MIN_DAYS },
    streak: { runs: distinctRuns, days: distinctDays, attestations: streak.length },
    expectedProfileContract: { id: expectedContractId, version: expectedContractVersion },
    consideredAttestations: sorted.length,
    ignoredAttestations: { count: ignored.length + dedupDropped, dedupDropped, reasons: ignored },
    expectedRegistryFingerprint: expectedFp,
    registryChanged: false,
    note:
      'ÖNERİDİR. verified-fixed-proposal dahi yalnız öneridir; registry DEĞİŞMEZ, ' +
      'guard kaldırılmaz, bug kapanmaz. Uyumsuz/eski kayıtlar ignoredAttestations\'ta ' +
      'gösterilir ve seriye/eşiğe KATILMAZ. Kapanış yalnız insan onaylı ayrı PR ile.',
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

// ════════════════════════════════════════════════════════════════════════════
// WP-DRAFT — Kırmızı testten TASLAK bulgu önerisi (proposal-only).
//
// Doktrin (known-bugs.js §): otomasyon registry'yi YAZMAZ, kök-neden UYDURMAZ.
// Buradaki fonksiyonlar SAF ve DETERMİNİSTİK: wall-clock ve rastgelelik KULLANMAZ;
// provenance (runUrl/commit/capturedAt) yalnız dışarıdan (env) enjekte edilir.
// Yalnız GÖZLEMLENEBİLİR alanları doldurur.
// ════════════════════════════════════════════════════════════════════════════

/** Triage sınıfları. */
export const TRIAGE = Object.freeze({
  REAL_RED: 'REAL-RED', // guard'sız gerçek kırmızı → taslak üretilir
  FIXED_CANDIDATE: 'FIXED-CANDIDATE', // knownBugGuard beklenmedik geçti → reconcile
  FLAKY: 'FLAKY', // retry-pass / attempt-1 timeout
  KNOWN_BUG_GREEN: 'KNOWN-BUG-GREEN', // beklenen-başarısızlık = yeşil, aksiyon yok
  GREEN: 'GREEN', // normal geçen / skip
});

/**
 * Bir flattenPlaywrightReport() kaydını triage sınıfına indirger. TEST-seviyesi
 * `outcome` (expected|unexpected|flaky|skipped) birincil; yoksa result-status +
 * retry sezgisine düşülür. `expectedStatus==='failed'` ⇔ test.fail/knownBugGuard guard.
 * @param {any} flat
 * @returns {string} TRIAGE değeri
 */
export function classifyTriage(flat) {
  if (!flat) return TRIAGE.GREEN;
  const guarded = flat.expectedStatus === 'failed';
  switch (flat.outcome) {
    case 'skipped':
      return TRIAGE.GREEN;
    case 'flaky':
      return TRIAGE.FLAKY;
    case 'unexpected':
      return guarded ? TRIAGE.FIXED_CANDIDATE : TRIAGE.REAL_RED;
    case 'expected':
      return guarded ? TRIAGE.KNOWN_BUG_GREEN : TRIAGE.GREEN;
    default: {
      // Eski/eksik rapor: result-status + retry'dan türet.
      const retryPass =
        (flat.attempts || 0) > 1 &&
        ['failed', 'timedOut'].includes(flat.firstStatus) &&
        flat.status === 'passed';
      if (retryPass) return TRIAGE.FLAKY;
      if (flat.status === 'skipped') return TRIAGE.GREEN;
      if (['failed', 'timedOut'].includes(flat.status)) return guarded ? TRIAGE.KNOWN_BUG_GREEN : TRIAGE.REAL_RED;
      if (flat.status === 'passed') return guarded ? TRIAGE.FIXED_CANDIDATE : TRIAGE.GREEN;
      return TRIAGE.GREEN;
    }
  }
}

const ANSI_RE = /\x1b\[[0-9;]*m/g;
function truncEvidence(s, n = 300) {
  const t = String(s).replace(ANSI_RE, '').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

/**
 * Playwright assertion mesajından {expected, actual, firstLine, matcher} çıkarır.
 * EŞLEŞMEZSE expected/actual = null (ASLA uydurmaz — doktrin). firstLine her zaman güvenli.
 * @param {string|undefined|null} msg
 */
export function parseAssertion(msg) {
  const out = { expected: null, actual: null, firstLine: null, matcher: null };
  if (!msg || typeof msg !== 'string') return out;
  const clean = msg.replace(ANSI_RE, '');
  const lines = clean.split('\n').map((l) => l.trimEnd());
  out.firstLine = truncEvidence(lines.find((l) => l.trim().length) || '');
  const mMatcher = clean.match(
    /\.(toHaveCount|toContainText|toHaveText|toBeVisible|toBeHidden|toHaveURL|toHaveAccessibleName|toHaveClass|toBeGreaterThan|toBe|toEqual)\b/
  );
  if (mMatcher) out.matcher = mMatcher[1];
  const mTimeout =
    clean.match(/Test timeout of (\d+)ms exceeded/) ||
    clean.match(/Timed out (\d+)ms/) ||
    clean.match(/Timeout (\d+)ms exceeded/);
  if (mTimeout) {
    out.matcher = out.matcher || 'timeout';
    out.expected = `koşul ${mTimeout[1]}ms içinde sağlanmalı`;
    out.actual = 'zaman aşımı';
    return out;
  }
  const exp = clean.match(/Expected(?: string| pattern)?:\s*(.+)/);
  const rec = clean.match(/Received(?: string)?:\s*(.+)/);
  if (exp) out.expected = truncEvidence(exp[1]);
  if (rec) out.actual = truncEvidence(rec[1]);
  return out;
}

/** area enum tahmini (spec dosya adı önekinden); bilinmezse null. */
const AREA_PREFIXES = Object.freeze([
  ['analytics', 'analytics'],
  ['bot-builder', 'ai'],
  ['ai', 'ai'],
  ['campaigns', 'campaigns'],
  ['channels', 'channels'],
  ['contacts', 'contacts'],
  ['dashboard', 'dashboard'],
  ['inbox', 'inbox'],
  ['reports', 'reports'],
  ['settings', 'settings'],
  ['supervisor', 'supervisor'],
  ['voice', 'voice'],
  ['workforce', 'workforce'],
]);
export function areaFromSpecFile(file) {
  const base = String(file || '').split('/').pop() || '';
  for (const [prefix, area] of AREA_PREFIXES) if (base.startsWith(prefix)) return area;
  return null;
}

/** Deterministik, dosya-sistemi güvenli slug: kebab(base) + sha1(8). Rastgelelik YOK. */
export function draftSlug(file, title) {
  const raw = `${file}::${title}`;
  const base = raw
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);
  const h = createHash('sha1').update(raw).digest('hex').slice(0, 8);
  return `${base}-${h}`;
}

/** '/rota' benzeri bir yol tahmini (title → error); yoksa null. Spec adından TÜRETİLMEZ. */
function routeGuess(t) {
  const rx = /(\/[a-zA-Z0-9][a-zA-Z0-9/_-]{1,60})/;
  for (const src of [t.title, t.error]) {
    const m = src && String(src).replace(ANSI_RE, '').match(rx);
    if (m) return m[1];
  }
  return null;
}

/** Gözlemlenen attachment'ları evidence[] linklerine çevirir (piiReviewed HER ZAMAN false). */
function evidenceFromAttachments(attachments) {
  const out = [];
  for (const a of attachments || []) {
    if (!a || !a.path) continue;
    let kind = 'other';
    let source = a.name || 'attachment';
    if (a.name === 'trace' || /\.zip$/i.test(a.path)) { kind = 'trace'; source = 'playwright-trace'; }
    else if (a.name === 'video' || /\.(webm|mp4)$/i.test(a.path)) { kind = 'video'; source = 'playwright-video'; }
    else if (a.name === 'screenshot' || (a.contentType || '').startsWith('image/')) { kind = 'screenshot'; source = 'playwright-screenshot'; }
    else if (/runtime-diagnostics/.test(a.name || '') || /runtime-diagnostics/.test(a.path)) { kind = 'network'; source = 'runtime-diagnostics'; }
    out.push({ path: a.path, source, piiReviewed: false, kind });
  }
  return out.sort((x, y) => (x.kind + x.path).localeCompare(y.kind + y.path));
}

/** Tek REAL-RED kaydından known-bugs.js şemasını yansıtan TASLAK üretir (AUTO alanlar + TODO). */
function buildDraftRecord(t, slug) {
  const a = parseAssertion(t.error);
  const env = {};
  const proj = String(t.project || '');
  if (proj) {
    const browser = proj.split('-')[0];
    if (browser) env.browser = browser;
    if (/authed/.test(proj)) env.role = 'authed';
  }
  const evidence = evidenceFromAttachments(t.attachments);
  const technicalEvidence = [];
  if (a.firstLine) technicalEvidence.push(a.firstLine);
  if ((t.attachments || []).some((x) => /runtime-diagnostics/.test((x && x.name) || ''))) {
    technicalEvidence.push('runtime-diagnostics.json ekli (console-error/failed-request/5xx — evidence linkine bak)');
  }
  return {
    id: `DRAFT-${slug}`, // TODO: insan gerçek id atar (ör. B26)
    title: null, // TODO
    area: areaFromSpecFile(t.file), // AUTO (best-effort)
    route: routeGuess(t), // AUTO (best-effort); yoksa null
    severity: null, // TODO (enum) — insan
    status: 'open', // AUTO (asla 'closed')
    guard: 'knownBugGuard', // AUTO (açık bug kontratı)
    opened: null, // TODO
    lastVerified: null, // TODO
    expiry: null, // TODO
    env, // AUTO (yalnız gözlenen anahtarlar)
    precondition: null, // TODO
    firstFailingStep: null, // TODO
    repro: [], // TODO: [{step, selector}] — insan
    expected: a.expected, // AUTO (parse); yoksa null
    actual: a.actual, // AUTO (parse); yoksa null
    technicalEvidence, // AUTO (assertion ilk satırı + diagnostics notu)
    possibleCauses: [], // SABİT [] — doktrin
    rootCauseCandidate: null, // SABİT null
    rootCause: null, // SABİT null
    suggestedFixes: [], // SABİT []
    evidence, // AUTO (yerel yollar; piiReviewed:false)
    test: { file: t.file, title: t.title }, // AUTO (gözlenen)
    owner: null, // TODO
    issueRef: null, // TODO
    _todo: [
      'title',
      'severity',
      'route (AUTO tahmin — DOĞRULA)',
      'repro[{step,selector}]',
      'markForensicTarget kancası (görsel/layout/a11y bulguları için)',
      'owner',
      'opened/lastVerified',
      'issueRef',
    ],
  };
}

/**
 * Playwright raporunu + registry'yi + (env-injected) provenance'ı alıp triage özeti +
 * REAL-RED taslakları + reconcile'a yönlendirilecek fixed-candidate listesi üretir.
 * SAF & DETERMİNİSTİK. Registry'yi DEĞİŞTİRMEZ. Provenance opts yalnız summary'ye yansır.
 * @param {any} report  Playwright JSON raporu
 * @param {readonly any[]} registry  KNOWN_BUGS
 * @param {{ runUrl?:string|null, commit?:string|null, capturedAt?:string|null }} [opts]
 */
export function buildDrafts(report, registry, opts = {}) {
  const { runUrl = null, commit = null, capturedAt = null } = opts;
  // Playwright JSON `spec.file` bazen `tests/` öneksiz gelir; registry hep önekli.
  // Dedup öneki normalize ederek yapılır (yanlış-negatif olmasın).
  const normFile = (f) => String(f || '').replace(/^tests\//, '');
  const knownKeys = new Set((registry || []).map((b) => `${normFile(b.test && b.test.file)}::${b.test && b.test.title}`));
  const flat = flattenPlaywrightReport(report);
  const counts = { 'REAL-RED': 0, 'FIXED-CANDIDATE': 0, FLAKY: 0, 'KNOWN-BUG-GREEN': 0, GREEN: 0 };
  const drafts = [];
  const fixedCandidates = [];
  const skippedAlreadyKnown = [];
  for (const t of flat) {
    const cls = classifyTriage(t);
    counts[cls] = (counts[cls] || 0) + 1;
    if (cls === TRIAGE.FIXED_CANDIDATE) fixedCandidates.push({ file: t.file, title: t.title });
    if (cls !== TRIAGE.REAL_RED) continue;
    const key = `${normFile(t.file)}::${t.title}`;
    if (knownKeys.has(key)) { skippedAlreadyKnown.push({ file: t.file, title: t.title }); continue; }
    const slug = draftSlug(t.file, t.title);
    drafts.push({ slug, record: buildDraftRecord(t, slug) });
  }
  const byKey = (x) => `${x.file}::${x.title}`;
  drafts.sort((a, b) => a.slug.localeCompare(b.slug));
  fixedCandidates.sort((a, b) => byKey(a).localeCompare(byKey(b)));
  skippedAlreadyKnown.sort((a, b) => byKey(a).localeCompare(byKey(b)));
  return {
    summary: {
      counts,
      total: flat.length,
      provenance: { runUrl, commit, capturedAt },
      note: 'ÖNERİDİR. Registry DEĞİŞMEDİ. Taslaklar insan-incelemesi içindir; _todo tamamlanmadan known-bugs.js\'e EKLENMEZ. Kök-neden UYDURULMAZ.',
    },
    drafts,
    fixedCandidates,
    skippedAlreadyKnown,
  };
}

/** Taslak bundle upload allowlist'i (yalnız güvenli JSON; görsel/trace local-only). */
export const DRAFT_UPLOAD_ALLOWLIST = Object.freeze(['draft-summary.json']);

/**
 * Taslak dizininden güvenli upload bundle'ı hazırlar. `prepareUploadBundle` aynası:
 * yalnız `draft-summary.json` + `drafts/*.json` kopyalanır, her JSON `findSecrets`
 * taramasından geçer; beklenmeyen dosya REDDEDİLİR; `.png/.zip` local-only kalır.
 * @param {string} dir  test-results/findings/_drafts
 */
export function prepareDraftBundle(dir) {
  if (!existsSync(dir)) throw new Error(`taslak dizini yok: ${dir}`);
  const uploadDir = join(dir, 'upload');
  rmSync(uploadDir, { recursive: true, force: true });
  const copied = [];
  const skippedLocal = [];
  const rejected = [];
  const scanJsonCopy = (full, rel) => {
    const leaks = findSecrets(readFileSync(full, 'utf8'));
    if (leaks.length) {
      rejected.push({ name: rel, reason: `sanitizer sızıntı yakaladı: ${leaks.join(', ')}` });
      return;
    }
    mkdirSync(dirname(join(uploadDir, rel)), { recursive: true });
    copyFileSync(full, join(uploadDir, rel));
    copied.push(rel);
  };
  for (const name of readdirSync(dir)) {
    if (name === 'upload') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'drafts') {
        for (const f of readdirSync(full)) {
          const af = join(full, f);
          if (statSync(af).isDirectory()) { rejected.push({ name: `drafts/${f}`, reason: 'beklenmeyen alt-dizin' }); continue; }
          if (f.endsWith('.json')) scanJsonCopy(af, `drafts/${f}`);
          else if (LOCAL_ONLY_PATTERNS.some((re) => re.test(f))) skippedLocal.push(`drafts/${f}`);
          else rejected.push({ name: `drafts/${f}`, reason: 'allowlist dışı beklenmeyen dosya' });
        }
      } else {
        rejected.push({ name, reason: 'beklenmeyen alt-dizin (allowlist dışı)' });
      }
      continue;
    }
    if (DRAFT_UPLOAD_ALLOWLIST.includes(name)) scanJsonCopy(full, name);
    else if (LOCAL_ONLY_PATTERNS.some((re) => re.test(name))) skippedLocal.push(name);
    else rejected.push({ name, reason: 'allowlist dışı beklenmeyen dosya' });
  }
  return { uploadDir, copied, skippedLocal, rejected };
}

