// @ts-check
/**
 * PR-IMPACT SEÇİCİ MOTORU — SAF KÜTÜPHANE (WP-CI-E1 / Faz 1).
 *
 * Bir PR'da değişen dosyalardan, hangi GERÇEK Playwright testlerinin
 * çalıştırılması gerektiğini deterministik, makine-okur ve FAIL-CLOSED biçimde
 * çıkarır. Bu dosya:
 *   - ağa çıkmaz, production'a dokunmaz, `process.exit` çağırmaz;
 *   - saf fonksiyonlar döndürür (CLI ve self-check tarafından tüketilir).
 *
 * Karar sırası (ADR-0010):
 *   1) Spec'leri KÖK kabul eden ters import bağımlılık grafiği.
 *   2) Açık yol-tabanlı sınıflandırma kuralları.
 *   3) Eşlenemeyen ama runtime'ı etkileyebilecek dosyada FAIL-CLOSED fallback.
 *
 * Mutation güvenliği ÇİFT katmanlıdır: (a) burada dosya-adı konvansiyonuyla
 * mutation-only spec'ler production seçiminden çıkarılıp `STAGING_BLOCKED`
 * raporlanır; (b) bundan bağımsız olarak `playwright.config.js` içindeki
 * `grepInvert: /@mutation/` gerçek `@mutation` etiketini prod'da her hâlükârda
 * eler. Sınıflandırma yalnız RAPORU etkiler; güvenliği değil.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/** Playwright proje adları (playwright.config.js ile birebir). */
export const PROJECTS = Object.freeze({
  public: 'chromium',
  authed: 'chromium-authed',
  discovery: 'chromium-discovery',
});

/**
 * Merkezi fallback suite tanımları (TEK gerçeklik kaynağı — Faz 2 runner'ı da
 * bunları tüketir; YAML içinde ikinci bir eşleme kaynağı OLUŞTURULMAZ).
 * `files` verilmişse tam spec listesiyle; yalnız `grep` verilmişse etiketle koşar.
 */
export const FALLBACK_SUITES = Object.freeze({
  'public-smoke': {
    project: PROJECTS.public,
    grep: '@smoke',
    files: ['tests/login.spec.js'],
  },
  'route-baseline': {
    project: PROJECTS.authed,
    files: ['tests/registered-routes-smoke.authed.spec.js'],
  },
  'route-quality': {
    project: PROJECTS.authed,
    files: ['tests/quality-baseline.authed.spec.js'],
  },
  'authed-critical': {
    project: PROJECTS.authed,
    grep: '@critical',
  },
});

/** Contract/config değişikliğinde kullanılan geniş-güvenli fallback kümesi. */
const BROAD_FALLBACK = Object.freeze([
  'route-baseline',
  'route-quality',
  'authed-critical',
]);

/** Grafik taramasına dahil edilen repo-içi kaynak kökleri (spec + modüller). */
export const GRAPH_ROOTS = Object.freeze(['tests', 'config']);

// ───────────────────────────── Yol yardımcıları ─────────────────────────────

/**
 * Yolu deterministik biçimde normalize eder: Windows ayıracını '/'’a çevirir,
 * baştaki './'’i ve gereksiz segmentleri sadeleştirir. ASLA absolute döndürmez.
 * @param {string} p
 * @returns {string}
 */
export function normalizePath(p) {
  if (typeof p !== 'string') return '';
  let s = p.replace(/\\/g, '/').trim();
  // Absolute'u reddet: çıktıya yerel makine yolu sızmamalı.
  s = s.replace(/^([a-zA-Z]:)?\//, ''); // '/x' veya 'C:/x' → 'x'
  const out = [];
  for (const seg of s.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop();
      else out.push('..');
    } else out.push(seg);
  }
  return out.join('/');
}

const isSpecPath = (rel) => /\.spec\.js$/.test(rel);
const isDiscoverySpec = (rel) =>
  /^tests\/discovery\/.*\.spec\.js$/.test(rel);
const isMutationSpec = (rel) =>
  isSpecPath(rel) &&
  /(?:\.mutation\.|-mutations?\.|(?:^|\/)mutation-orphans\.)/.test(rel);
const isAuthedSpec = (rel) => /\.authed\.spec\.js$/.test(rel);
const QUALITY_ONLY_ALLOWED_DOCS = Object.freeze([
  'docs/TEST_COVERAGE.md',
  'docs/raporlar/YAPILAN-TESTLER.md',
  'docs/raporlar/YAPILMAYAN-TESTLER.md',
]);
const DOCS_ONLY_ALLOWED_PATHS = Object.freeze([
  'README.md',
  'docs/TEST_COVERAGE.md',
  'docs/raporlar/YAPILAN-TESTLER.md',
  'docs/raporlar/YAPILMAYAN-TESTLER.md',
]);

// ─────────────────────────── Sınıflandırma (yol) ───────────────────────────

/**
 * Değişen bir dosyayı tek bir etki sınıfına eşler (ilk eşleşen kazanır).
 * @param {string} rel repo-göreli, normalize edilmiş yol
 * @returns {string}
 */
export function classifyFile(rel) {
  // 1) Dokümantasyon — runtime gerektirmez.
  if (
    /\.md$/.test(rel) ||
    rel.startsWith('docs/') ||
    /^(LICENSE|\.gitignore|\.editorconfig)$/.test(rel)
  ) {
    return 'docs';
  }
  // 2) Görsel snapshot — PR lane'inde çalışmaz (nightly @visual).
  if (/(?:-snapshots\/|\.png$)/.test(rel)) return 'visual-snapshot';
  // 3) CI / araç — kendi self-check'leriyle korunur; prod spec gerektirmez.
  if (rel.startsWith('tools/') || rel.startsWith('.github/') || rel.startsWith('.husky/')) {
    return 'ci-tooling';
  }
  // 4) Yapılandırma — geniş güvenli fallback.
  if (
    rel === 'playwright.config.js' ||
    rel === 'package.json' ||
    rel === 'package-lock.json' ||
    rel.startsWith('config/')
  ) {
    return 'config';
  }
  // 5) Sözleşme — geniş güvenli fallback + grafik bağımlıları.
  if (rel.startsWith('tests/contracts/')) return 'contract';
  // 6) Auth kurulum bağımlılığı — tüm authed lane'i etkiler.
  if (rel === 'tests/auth.setup.js') return 'auth-setup';
  // 7) Keşif spec'i / destek modülleri.
  if (isDiscoverySpec(rel)) return 'discovery-spec';
  if (/^tests\/discovery\/.*\.js$/.test(rel)) return 'graph-module';
  // 8) Mutation spec (dosya-adı konvansiyonu) — STAGING_BLOCKED.
  if (isMutationSpec(rel)) return 'mutation-spec';
  // 9) Authed / public spec.
  if (isAuthedSpec(rel)) return 'authed-spec';
  if (isSpecPath(rel) && rel.startsWith('tests/')) return 'public-spec';
  // 10) tests/ altındaki spec-olmayan modüller (page object, fixture, helper…).
  if (/^tests\/.*\.js$/.test(rel)) return 'graph-module';
  // 11) tests/ altındaki diğer varlıklar (json vb.) — grafik eşleyemez → fallback.
  if (rel.startsWith('tests/')) return 'contract'; // güvenli tarafta: geniş fallback
  // 12) Bilinmeyen runtime kaynağı — FAIL CLOSED.
  return 'unknown-runtime';
}

/**
 * Değişen bir spec'i doğru kovaya yönlendirmek için ikincil sınıflandırma
 * (ters-grafik bir spec bulduğunda da kullanılır).
 * @param {string} rel
 * @returns {'discovery'|'mutation'|'authed'|'public'}
 */
export function specBucket(rel) {
  if (isDiscoverySpec(rel)) return 'discovery';
  if (isMutationSpec(rel)) return 'mutation';
  if (isAuthedSpec(rel)) return 'authed';
  return 'public';
}

// ───────────────────────────── Import grafiği ─────────────────────────────

const RELATIVE_IMPORT = /^\.{1,2}\//;

/** Yorumları temizler (yorum içindeki `from '...'` sahte kenar üretmesin). */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * Bir kaynak metninden repo-içi (göreli) statik import/exports'ları çıkarır.
 * Desteklenen sözdizimi (ADR-0010): `import ... from '...'`, side-effect
 * `import '...'`, `export ... from '...'`. Dinamik `import('...')` ÇÖZÜLMEZ:
 * warning olarak işaretlenir (sessizce yok sayılmaz).
 * @param {string} source
 * @returns {{ specifiers: string[], dynamic: string[] }}
 */
export function extractImports(source) {
  const clean = stripComments(source);
  const specifiers = [];
  const dynamic = [];
  const fromRe = /(?:^|[\s;])(?:import|export)\b[^'"();]*?\bfrom\s*['"]([^'"]+)['"]/g;
  const sideRe = /(?:^|[\s;])import\s*['"]([^'"]+)['"]/g;
  const dynRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = fromRe.exec(clean))) specifiers.push(m[1]);
  while ((m = sideRe.exec(clean))) specifiers.push(m[1]);
  while ((m = dynRe.exec(clean))) dynamic.push(m[1]);
  return { specifiers, dynamic };
}

/**
 * Verilen kaynak haritasından ileri + ters import grafiğini kurar.
 * `sources`: { relPath -> içerik }. Yalnız repo-içi göreli import'lar kenar olur.
 * Çözülemeyen göreli import veya dinamik import → `warnings`.
 * @param {Record<string,string>} sources
 * @returns {{
 *   nodes: Set<string>,
 *   forward: Map<string,Set<string>>,
 *   reverse: Map<string,Set<string>>,
 *   warnings: Array<{ from: string, specifier: string, kind: string }>,
 * }}
 */
export function buildImportGraphFromSources(sources) {
  const nodes = new Set(Object.keys(sources).map(normalizePath));
  const forward = new Map();
  const reverse = new Map();
  const warnings = [];
  const ensure = (map, k) => {
    if (!map.has(k)) map.set(k, new Set());
    return map.get(k);
  };

  const resolve = (fromFile, spec) => {
    const base = path.posix.join(path.posix.dirname(fromFile), spec);
    const candidates = [];
    if (/\.[cm]?js$/.test(spec)) candidates.push(base);
    else candidates.push(`${base}.js`, `${base}.mjs`, `${base}/index.js`);
    for (const c of candidates.map(normalizePath)) {
      if (nodes.has(c)) return c;
    }
    return null;
  };

  for (const rawFrom of Object.keys(sources)) {
    const from = normalizePath(rawFrom);
    const { specifiers, dynamic } = extractImports(sources[rawFrom]);
    for (const spec of specifiers) {
      if (!RELATIVE_IMPORT.test(spec)) continue; // dış paket / node: → grafik dışı
      const target = resolve(from, spec);
      if (!target) {
        warnings.push({ from, specifier: spec, kind: 'unresolved-static' });
        continue;
      }
      ensure(forward, from).add(target);
      ensure(reverse, target).add(from);
    }
    for (const spec of dynamic) {
      if (!RELATIVE_IMPORT.test(spec)) continue;
      warnings.push({ from, specifier: spec, kind: 'dynamic-import' });
    }
  }
  return { nodes, forward, reverse, warnings };
}

/**
 * Diskten `roots` altındaki `.js`/`.mjs` dosyalarını okuyup grafik kurar.
 * @param {{ root: string, roots?: string[] }} opts
 */
export function buildImportGraph({ root, roots = GRAPH_ROOTS }) {
  const sources = {};
  const walk = (absDir) => {
    let entries;
    try {
      entries = readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(absDir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        walk(abs);
      } else if (/\.[cm]?js$/.test(e.name)) {
        const rel = normalizePath(path.relative(root, abs));
        try {
          sources[rel] = readFileSync(abs, 'utf8');
        } catch {
          /* okunamayan dosya grafiğe alınmaz */
        }
      }
    }
  };
  for (const r of roots) {
    const abs = path.join(root, r);
    try {
      if (statSync(abs).isDirectory()) walk(abs);
    } catch {
      /* kök yoksa atla */
    }
  }
  return buildImportGraphFromSources(sources);
}

/**
 * Değişen bir modülü transitif olarak import eden TÜM spec dosyalarını bulur
 * (döngü-güvenli BFS). Modülün kendisi spec ise onu da içerir.
 * @param {string} changed normalize yol
 * @param {{ reverse: Map<string,Set<string>> }} graph
 * @returns {string[]} sıralı, tekilleştirilmiş spec yolları
 */
export function dependentSpecs(changed, graph) {
  const start = normalizePath(changed);
  const seen = new Set([start]);
  const queue = [start];
  const specs = new Set();
  if (isSpecPath(start)) specs.add(start);
  while (queue.length) {
    const cur = queue.shift();
    const importers = graph.reverse.get(cur);
    if (!importers) continue;
    for (const imp of importers) {
      if (seen.has(imp)) continue;
      seen.add(imp);
      queue.push(imp);
      if (isSpecPath(imp)) specs.add(imp);
    }
  }
  return [...specs].sort();
}

// ─────────────────────────────── Planlama ───────────────────────────────

const uniqSort = (arr) => [...new Set(arr)].sort();

/**
 * Değişen dosya listesinden deterministik seçim planı üretir.
 *
 * @param {{
 *   changedFiles?: Array<{ path: string, status?: string, oldPath?: string }>,
 *   graph?: ReturnType<typeof buildImportGraphFromSources>,
 *   root?: string,
 *   sourceMissing?: boolean,
 *   baseSha?: string|null,
 *   headSha?: string|null,
 *   mode?: string,
 * }} input
 * @returns {object} selection planı (JSON'a hazır, deterministik)
 */
export function planImpact(input = {}) {
  const {
    changedFiles = [],
    root,
    sourceMissing = false,
    baseSha = null,
    headSha = null,
    mode = 'local',
    explanation = '',
  } = input;

  const graph =
    input.graph || (root ? buildImportGraph({ root }) : buildImportGraphFromSources({}));

  const details = changedFiles
    .map((f) => ({
      path: normalizePath(f.path),
      status: (f.status || 'M').toUpperCase().slice(0, 1),
      ...(f.oldPath ? { oldPath: normalizePath(f.oldPath) } : {}),
    }))
    .filter((f) => f.path)
    .sort((a, b) => a.path.localeCompare(b.path));

  const publicSpecs = new Set();
  const authenticatedSpecs = new Set();
  const discoverySpecs = new Set();
  const stagingBlocked = new Set();
  const fallback = new Set();
  const visualPolicyFiles = new Set();
  const docsOnlyFiles = new Set();
  const ciToolingFiles = new Set();
  const unmapped = new Set();
  const reasons = new Set();
  const graphWarnings = new Set();

  const explicitExplanation = typeof explanation === 'string' ? explanation.trim() : '';
  const hasOnlyEnvDeletion = details.length > 0 && details.every((f) => f.path === '.env' && f.status === 'D');
  const hasEnvPolicyChange = details.some((f) => f.path === '.env' && f.status !== 'D');
  const hasOnlyGeneratedDocs =
    details.length > 0 && details.every((f) => QUALITY_ONLY_ALLOWED_DOCS.includes(f.path));
  const hasOnlyDocsAllowedPaths =
    details.length > 0 && details.every((f) => DOCS_ONLY_ALLOWED_PATHS.includes(f.path));
  const hasRuntimeChange = details.some((f) => f.path !== '.env' && !f.path.startsWith('docs/'));
  const hasDocsOnlyChange = details.length > 0 && details.every((f) => f.path.startsWith('docs/') || f.path === 'README.md');
  const hasGeneratedDocs = details.some((f) => QUALITY_ONLY_ALLOWED_DOCS.includes(f.path));
  const hasUnexpectedQualityOnlyFiles = details.some((f) => {
    if (f.path === '.env' || f.path === 'README.md') return false;
    if (QUALITY_ONLY_ALLOWED_DOCS.includes(f.path)) return false;
    if (f.path.startsWith('docs/')) return true;
    return classifyFile(f.path) === 'unknown-runtime';
  });

  const bucketSpec = (spec) => {
    switch (specBucket(spec)) {
      case 'discovery':
        discoverySpecs.add(spec);
        break;
      case 'mutation':
        stagingBlocked.add(spec);
        reasons.add(`STAGING_BLOCKED:${spec}`);
        break;
      case 'authed':
        authenticatedSpecs.add(spec);
        break;
      default:
        publicSpecs.add(spec);
    }
  };

  const addFallback = (ids, why) => {
    for (const id of ids) {
      if (!FALLBACK_SUITES[id]) continue;
      fallback.add(id);
    }
    if (why) reasons.add(why);
  };

  // Grafik uyarılarını (çözülemeyen/dinamik import) görünür kıl → fail-closed.
  for (const w of graph.warnings || []) {
    graphWarnings.add(`${w.kind}:${w.from}→${w.specifier}`);
  }

  if (sourceMissing) {
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'SOURCE_MISSING',
      exitCode: 1,
      changedFiles: [],
      changedFileDetails: [],
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: [],
      ciToolingFiles: [],
      policyOnlyFiles: [],
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: ['SOURCE_MISSING'],
      selectedRunnableSpecCount: 0,
    };
  }

  if (details.length === 0 && !explicitExplanation) {
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'PLAN_EXPLAIN_REQUIRED',
      exitCode: 1,
      changedFiles: [],
      changedFileDetails: [],
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: [],
      ciToolingFiles: [],
      policyOnlyFiles: [],
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: ['PLAN_EXPLAIN_REQUIRED'],
      selectedRunnableSpecCount: 0,
    };
  }

  if (details.length > 0 && hasOnlyEnvDeletion) {
    reasons.add('SECURITY_REMEDIATION:.env deleted');
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'SECURITY_REMEDIATION',
      exitCode: 0,
      changedFiles: details.map((d) => d.path),
      changedFileDetails: details,
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: [],
      ciToolingFiles: [],
      policyOnlyFiles: [],
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: uniqSort([...reasons]),
      selectedRunnableSpecCount: 0,
    };
  }

  if (details.length > 0 && hasEnvPolicyChange) {
    reasons.add('ENV_POLICY_VIOLATION:.env');
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'ENV_POLICY_VIOLATION',
      exitCode: 1,
      changedFiles: details.map((d) => d.path),
      changedFileDetails: details,
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: [],
      ciToolingFiles: [],
      policyOnlyFiles: [],
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: uniqSort([...reasons]),
      selectedRunnableSpecCount: 0,
    };
  }

  if (details.length > 0 && hasGeneratedDocs && !hasUnexpectedQualityOnlyFiles && !hasRuntimeChange) {
    reasons.add('QUALITY_ONLY:generated-docs');
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'QUALITY_ONLY',
      exitCode: 0,
      changedFiles: details.map((d) => d.path),
      changedFileDetails: details,
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: details.map((d) => d.path),
      ciToolingFiles: [],
      policyOnlyFiles: details.map((d) => d.path),
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: uniqSort([...reasons]),
      selectedRunnableSpecCount: 0,
    };
  }

  if (details.length > 0 && hasGeneratedDocs && hasUnexpectedQualityOnlyFiles) {
    reasons.add('QUALITY_ONLY_POLICY_VIOLATION:docs');
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'QUALITY_ONLY_POLICY_VIOLATION',
      exitCode: 1,
      changedFiles: details.map((d) => d.path),
      changedFileDetails: details,
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: details.map((d) => d.path),
      ciToolingFiles: [],
      policyOnlyFiles: details.map((d) => d.path),
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: uniqSort([...reasons]),
      selectedRunnableSpecCount: 0,
    };
  }

  if (details.length > 0 && !hasRuntimeChange && hasDocsOnlyChange && !hasOnlyDocsAllowedPaths) {
    reasons.add('QUALITY_ONLY_POLICY_VIOLATION:docs');
    return {
      schemaVersion: 1,
      mode,
      baseSha,
      headSha,
      sourceMissing,
      status: 'QUALITY_ONLY_POLICY_VIOLATION',
      exitCode: 1,
      changedFiles: details.map((d) => d.path),
      changedFileDetails: details,
      selected: { publicSpecs: [], authenticatedSpecs: [], discoverySpecs: [] },
      fallbackSuites: [],
      stagingBlockedMutationSpecs: [],
      visualPolicyFiles: [],
      docsOnlyFiles: details.map((d) => d.path),
      ciToolingFiles: [],
      policyOnlyFiles: details.map((d) => d.path),
      unmappedRuntimeFiles: [],
      graphWarnings: [],
      reasons: uniqSort([...reasons]),
      selectedRunnableSpecCount: 0,
    };
  }

  for (const f of details) {
    const rel = f.path;
    const cls = classifyFile(rel);

    // Silinen dosya çalıştırılamaz; yönteme göre ele al.
    if (f.status === 'D') {
      if (isSpecPath(rel)) {
        reasons.add(`SPEC_DELETED:${rel}`);
        continue; // silinen spec seçilmez
      }
      if (cls === 'graph-module' || cls === 'contract' || cls === 'config' || cls === 'auth-setup') {
        addFallback(BROAD_FALLBACK, `DELETED_MODULE_FALLBACK:${rel}`);
        continue;
      }
      // docs/ci/visual/unknown silme → aşağıdaki normal sınıf akışıyla ilerlesin.
    }

    switch (cls) {
      case 'docs':
        docsOnlyFiles.add(rel);
        break;
      case 'visual-snapshot':
        visualPolicyFiles.add(rel);
        reasons.add(`VISUAL_SNAPSHOT_PR_SKIP:${rel}`);
        break;
      case 'ci-tooling':
        ciToolingFiles.add(rel);
        reasons.add(`CI_TOOLING_SELFCHECK:${rel}`);
        break;
      case 'config':
        addFallback(BROAD_FALLBACK, `CONFIG_BROAD_FALLBACK:${rel}`);
        for (const s of dependentSpecs(rel, graph)) bucketSpec(s);
        break;
      case 'contract':
        addFallback(BROAD_FALLBACK, `CONTRACT_BROAD_FALLBACK:${rel}`);
        for (const s of dependentSpecs(rel, graph)) bucketSpec(s);
        break;
      case 'auth-setup':
        addFallback(BROAD_FALLBACK, `AUTH_SETUP_BROADEN:${rel}`);
        break;
      case 'discovery-spec':
        discoverySpecs.add(rel);
        break;
      case 'mutation-spec':
        stagingBlocked.add(rel);
        reasons.add(`STAGING_BLOCKED:${rel}`);
        break;
      case 'authed-spec':
        authenticatedSpecs.add(rel);
        break;
      case 'public-spec':
        publicSpecs.add(rel);
        break;
      case 'graph-module': {
        const deps = dependentSpecs(rel, graph);
        for (const s of deps) bucketSpec(s);
        // Fixture/helper: grafik + kritik fallback (dar eşleme yetersiz kalırsa).
        if (/^tests\/fixtures\//.test(rel) || rel === 'tests/helpers.js') {
          addFallback(['authed-critical'], `SHARED_HELPER_FALLBACK:${rel}`);
        }
        // Grafik bu modül için hiçbir spec üretmediyse fail-closed davran.
        if (deps.length === 0) {
          unmapped.add(rel);
          reasons.add(`UNMAPPED_ORPHAN_MODULE:${rel}`);
        }
        break;
      }
      case 'unknown-runtime':
      default:
        unmapped.add(rel);
        reasons.add(`UNMAPPED_RUNTIME:${rel}`);
    }
  }

  // Çözülemeyen statik import varsa geniş fallback ekle (fail-closed, 1.6).
  if ((graph.warnings || []).some((w) => w.kind === 'unresolved-static')) {
    addFallback(BROAD_FALLBACK, 'UNRESOLVED_IMPORT_FALLBACK');
  }

  const selPublic = uniqSort([...publicSpecs]);
  const selAuthed = uniqSort([...authenticatedSpecs]);
  const selDiscovery = uniqSort([...discoverySpecs]);
  const fallbackSuites = uniqSort([...fallback]);
  const selectedRunnableSpecCount =
    selPublic.length + selAuthed.length + selDiscovery.length;
  const runtimeSelectionCount = selectedRunnableSpecCount + fallbackSuites.length;
  const unmappedRuntimeFiles = uniqSort([...unmapped]);

  // ── Durum + exit kodu (ADR-0010 §sıfır-test politikası) ──
  let status;
  let exitCode;
  if (sourceMissing) {
    status = 'SOURCE_MISSING';
    exitCode = 1;
  } else if (unmappedRuntimeFiles.length > 0) {
    status = 'UNMAPPED_RUNTIME_CHANGE';
    exitCode = 1;
  } else if (runtimeSelectionCount > 0) {
    status = fallbackSuites.length > 0 && selectedRunnableSpecCount === 0
      ? 'FALLBACK_SELECTED'
      : 'RUNTIME_SELECTED';
    exitCode = 0;
  } else if (stagingBlocked.size > 0) {
    status = 'STAGING_BLOCKED';
    exitCode = 0;
  } else {
    status = 'NO_RUNTIME_REQUIRED';
    exitCode = 0;
  }

  return {
    schemaVersion: 1,
    mode,
    baseSha,
    headSha,
    sourceMissing,
    status,
    exitCode,
    changedFiles: details.map((d) => d.path),
    changedFileDetails: details,
    selected: {
      publicSpecs: selPublic,
      authenticatedSpecs: selAuthed,
      discoverySpecs: selDiscovery,
    },
    fallbackSuites,
    stagingBlockedMutationSpecs: uniqSort([...stagingBlocked]),
    visualPolicyFiles: uniqSort([...visualPolicyFiles]),
    docsOnlyFiles: uniqSort([...docsOnlyFiles]),
    ciToolingFiles: uniqSort([...ciToolingFiles]),
    policyOnlyFiles: uniqSort([
      ...docsOnlyFiles,
      ...ciToolingFiles,
      ...visualPolicyFiles,
    ]),
    unmappedRuntimeFiles,
    graphWarnings: uniqSort([...graphWarnings]),
    reasons: uniqSort([...reasons]),
    selectedRunnableSpecCount,
  };
}

/**
 * Planı stabil, deterministik JSON metnine çevirir (sondaki newline dahil).
 * @param {object} plan
 * @returns {string}
 */
export function serializePlan(plan) {
  return `${JSON.stringify(plan, null, 2)}\n`;
}
