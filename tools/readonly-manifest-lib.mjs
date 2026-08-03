// @ts-check
/**
 * PRODUCTION READ-ONLY MANİFESTİ + GÜVENLİ TEST SEÇİCİ — SAF KÜTÜPHANE
 * (WP-FULL-READONLY-AUDIT / FAZ 1, ADR-0015).
 *
 * "Production'da güvenle çalıştırılabilen bütün testler" ifadesini TAHMİNDEN
 * çıkarıp makine-okur, deterministik ve FAIL-CLOSED bir sözleşmeye dönüştürür.
 *
 * Bu dosya:
 *   - ağa çıkmaz, production'a dokunmaz, `process.exit` çağırmaz, Date/rastgele
 *     kullanmaz (çıktı yalnız repo kaynaklarına bağlı → deterministik/driftlenebilir);
 *   - saf fonksiyonlar döndürür (generator + selector CLI + self-check tüketir).
 *
 * TEK GERÇEKLİK KAYNAKLARI (yeniden türetilir, ikinci kaynak OLUŞTURULMAZ):
 *   - dosya-adı konvansiyonu (pr-impact-lib ile aynı mutation regex'i),
 *   - `tests/contracts/mutation-lifecycle.js` (açık read-only / fixme beyanları),
 *   - `tests/contracts/registered-routes.js` (kayıtlı rota envanteri),
 *   - `tests/contracts/tested-pages.js` (spec ↔ rota/yüzey ilişkisi),
 *   - `config/environment.js` + `playwright.config.js` (`grepInvert:/@mutation/`).
 *
 * Mutation güvenliği ÇOK katmanlıdır ve bu manifest onu YALNIZ RAPORLAR:
 *   (a) burada effect=mutation/external-cost production seçiminden fail-closed çıkarılır;
 *   (b) `playwright.config.js` `grepInvert:/@mutation/` prod'da @mutation'ı her hâlde eler;
 *   (c) `config/environment.js` assertMutationEnvironment/Tenant staging-only kilidi;
 *   (d) pr-impact-runner `assertNoMutation` her koşum grubuna --grep-invert ekler.
 */

export const MANIFEST_SCHEMA_VERSION = 1;

/** Kanonik test etki sınıfları. */
export const EFFECT = Object.freeze({
  READ_ONLY: 'read-only',
  MUTATION: 'mutation',
  EXTERNAL_COST: 'external-cost',
});

/** Kanonik ortam sınıfları (bir spec'in güvenle koşabileceği ortam). */
export const ENVIRONMENT = Object.freeze({
  PRODUCTION: 'production',
  STAGING: 'staging',
  BOTH: 'both',
});

/** Kanonik auth sınıfları. */
export const AUTH = Object.freeze({ PUBLIC: 'public', AUTHENTICATED: 'authenticated' });

/** Timeout sınıfı (kaba; runtime bütçesi değil, seçici sınıflandırması). */
export const TIMEOUT_CLASS = Object.freeze({ DEFAULT: 'default', EXTENDED: 'extended' });

/** Beklenen artifact sınıfı — hepsi merkezi sanitize bundle'dan geçer. */
export const ARTIFACT_CLASS = Object.freeze({ SANITIZED_BUNDLE: 'sanitized-bundle' });

/**
 * Giriş gerektirmeyen (public) spec ALLOWLIST'i. Yalnız burada olan bir spec
 * `AUTH.PUBLIC` sayılır; başka bir `.spec.js` public görünse bile UNCLASSIFIED
 * fail-closed olur (stray public spec sessizce güvenli sayılamaz).
 */
export const PUBLIC_SPEC_ALLOWLIST = Object.freeze(['tests/login.spec.js']);

/**
 * `external-cost` (gerçek SMS/çağrı/e-posta gibi ücret/dış-servis doğuran) spec
 * ALLOWLIST'i. Şu an dosya-adı konvansiyonuyla türetilebilir external-cost spec
 * YOKTUR (böyle spec'ler zaten @mutation + staging-only). Boş kalır; bir spec
 * buraya eklenirse effect=external-cost olur ve production seçiminde fail üretir.
 */
export const EXTERNAL_COST_SPECS = Object.freeze([]);

/**
 * Kanonik güvenli seçim profilleri (HANDOFF §"Zorunlu profiller").
 * Her profil DETERMİNİSTİK bir spec-dosya seçimi + runtime `grep` üretir.
 * `grep` verildiğinde seçim aday DOSYALARI kapsar; testleri runtime filtreler.
 * (listed != selected != executed: bu katman yalnız spec DOSYASI seçer.)
 */
export const PROFILES = Object.freeze({
  'route-baseline-chromium': Object.freeze({
    description: 'Kayıtlı her rota için tek read-only açılış tabanı (Chromium).',
    projects: Object.freeze(['chromium-authed']),
    environment: 'production',
    files: Object.freeze(['tests/registered-routes-smoke.authed.spec.js']),
    grep: '@route-baseline',
    policyGated: false,
  }),
  'readonly-critical-chromium': Object.freeze({
    description: 'Kritik production-safe read-only authed davranışlar (Chromium).',
    projects: Object.freeze(['chromium-authed']),
    environment: 'production',
    files: null,
    grep: '@critical',
    policyGated: false,
  }),
  'readonly-full-chromium': Object.freeze({
    description: 'Tüm production-safe read-only authed spec dosyaları (Chromium).',
    projects: Object.freeze(['chromium-authed']),
    environment: 'production',
    files: null,
    grep: null,
    policyGated: false,
  }),
  'known-bug-readonly-chromium': Object.freeze({
    description: 'Bilinen bulgu read-only guard testleri (Chromium).',
    projects: Object.freeze(['chromium-authed']),
    environment: 'production',
    files: null,
    grep: '@known-bug',
    policyGated: false,
  }),
  'readonly-cross-browser': Object.freeze({
    description: 'Production-safe read-only authed spec dosyaları (Firefox + WebKit).',
    projects: Object.freeze(['firefox-authed', 'webkit-authed']),
    environment: 'production',
    files: null,
    grep: null,
    policyGated: false,
  }),
  'a11y-readonly': Object.freeze({
    description: 'Erişilebilirlik read-only kontrolleri (Chromium).',
    projects: Object.freeze(['chromium-authed']),
    environment: 'production',
    files: null,
    grep: '@a11y',
    policyGated: false,
  }),
  'visual-readonly': Object.freeze({
    description:
      'Görsel read-only snapshot kontrolleri — YALNIZ artifact/policy uygunsa yürütülür.',
    projects: Object.freeze(['chromium-authed']),
    environment: 'production',
    files: null,
    grep: '@visual',
    policyGated: true,
  }),
});

export const PROFILE_NAMES = Object.freeze(Object.keys(PROFILES));

// ───────────────────────────── Yol / sınıf yardımcıları ─────────────────────────────

/** '\' → '/', baştaki './' temizler; absolute reddeder (yerel yol sızmasın). */
export function normalizeSpecPath(p) {
  if (typeof p !== 'string') return '';
  let s = p.replace(/\\/g, '/').trim();
  s = s.replace(/^([a-zA-Z]:)?\//, '');
  return s.replace(/^\.\//, '');
}

const isSpecPath = (rel) => /\.spec\.js$/.test(rel);
const isDiscoverySpec = (rel) => /^tests\/discovery\/.*\.spec\.js$/.test(rel);
// pr-impact-lib ile BİREBİR aynı mutation dosya-adı deseni (tek kaynak sözleşmesi).
const isMutationSpecName = (rel) =>
  isSpecPath(rel) && /(?:\.mutation\.|-mutations?\.|(?:^|\/)mutation-orphans\.)/.test(rel);
const isAuthedSpec = (rel) => /\.authed\.spec\.js$/.test(rel);
const roleFromName = (rel) => {
  const m = /\.(admin|supervisor|agent)\.spec\.js$/.exec(rel);
  return m ? m[1] : null;
};

/**
 * Bir spec'i dosya-adı konvansiyonuna göre kaba sınıfa eşler.
 * @returns {'public'|'authed'|'discovery'|'mutation'|'unknown'}
 */
export function specKind(rel) {
  const p = normalizeSpecPath(rel);
  if (!isSpecPath(p)) return 'unknown';
  if (isDiscoverySpec(p)) return 'discovery';
  if (PUBLIC_SPEC_ALLOWLIST.includes(p)) return 'public';
  if (isMutationSpecName(p)) return 'mutation';
  if (isAuthedSpec(p)) return 'authed';
  return 'unknown';
}

/** Yüzey/alan adı (report-lib.areaOf ile aynı eşleme; bağımsızlık için gömülü). */
export function areaOfSpec(rel) {
  const f = normalizeSpecPath(rel).toLowerCase();
  const map = [
    ['known-bugs', 'cross-cutting'],
    ['reports-dashboards', 'reports'],
    ['reports-sections', 'reports'],
    ['reports', 'reports'],
    ['analytics', 'analytics'],
    ['supervisor', 'supervisor'],
    ['workforce', 'workforce'],
    ['campaigns', 'campaigns'],
    ['contacts', 'contacts'],
    ['tickets', 'tickets'],
    ['inbox', 'inbox'],
    ['voice', 'voice'],
    ['channels', 'channels'],
    ['bot-builder', 'bot-builder'],
    ['ai', 'ai'],
    ['dashboard', 'dashboard'],
    ['settings', 'settings'],
    ['discovery', 'discovery'],
    ['registered-routes', 'route-baseline'],
    ['quality-baseline', 'route-baseline'],
    ['login', 'auth'],
    ['logout', 'auth'],
    ['header', 'shell'],
    ['navigation', 'shell'],
    ['search', 'shell'],
    ['forms', 'shell'],
    ['responsive', 'shell'],
    ['pages', 'shell'],
    ['a11y', 'cross-cutting'],
    ['mutation-orphans', 'cross-cutting'],
  ];
  for (const [needle, area] of map) if (f.includes(needle)) return area;
  return 'other';
}

/**
 * `tested-pages.js` sözleşmelerinden spec-dosyası → kayıtlı rota indeksini kurar.
 * specFiles basename'dir → `tests/<basename>` anahtarına normalize edilir.
 * @param {ReadonlyArray<{ specFiles?: ReadonlyArray<string>, routes?: ReadonlyArray<string> }>} pages
 * @returns {Map<string, string[]>}
 */
export function buildSpecRouteIndex(pages) {
  const idx = new Map();
  for (const page of pages || []) {
    for (const sf of page.specFiles || []) {
      const rel = normalizeSpecPath(`tests/${sf}`);
      const set = idx.get(rel) || new Set();
      for (const r of page.routes || []) set.add(r);
      idx.set(rel, set);
    }
  }
  const out = new Map();
  for (const [k, v] of idx) out.set(k, [...v].sort());
  return out;
}

// ───────────────────────────── Sınıflandırma ─────────────────────────────

/**
 * Tek bir spec dosyasını manifest kaydına eşler. Bilinen konvansiyona uymayan
 * spec için FIRLATIR (fail-closed) — sessiz "güvenli" varsayımı yasak.
 *
 * @param {string} relRaw repo-göreli spec yolu (örn. 'tests/dashboard.authed.spec.js')
 * @param {{
 *   lifecycle?: Record<string, { mode?: string, reason?: string, owner?: string, expiry?: string }>,
 *   routeIndex?: Map<string, string[]>,
 * }} [ctx]
 * @returns {object} manifest kaydı
 */
export function classifySpec(relRaw, ctx = {}) {
  const rel = normalizeSpecPath(relRaw);
  const { lifecycle = {}, routeIndex = new Map() } = ctx;
  const kind = specKind(rel);
  if (kind === 'unknown') {
    throw new Error(
      `UNCLASSIFIED_SPEC: "${rel}" bilinen konvansiyona uymuyor ` +
        '(public allowlist / *.authed.spec.js / discovery / mutation). Fail-closed.'
    );
  }

  const lc = lifecycle[rel] || null;

  // ── effect (açık read-only beyanı > external-cost allowlist > mutation adı > read-only) ──
  let effect;
  if (lc && lc.mode === 'read-only') effect = EFFECT.READ_ONLY;
  else if (EXTERNAL_COST_SPECS.includes(rel)) effect = EFFECT.EXTERNAL_COST;
  else if (kind === 'mutation') effect = EFFECT.MUTATION;
  else effect = EFFECT.READ_ONLY;

  // ── auth ──
  const auth = kind === 'public' ? AUTH.PUBLIC : AUTH.AUTHENTICATED;

  // ── environment (read-only prod+staging; write/external yalnız staging) ──
  const environment =
    effect === EFFECT.READ_ONLY ? ENVIRONMENT.BOTH : ENVIRONMENT.STAGING;

  // ── projects (playwright.config.js ile birebir) ──
  let projects;
  if (kind === 'discovery') projects = ['chromium-discovery'];
  else if (auth === AUTH.PUBLIC) projects = ['chromium', 'firefox', 'webkit'];
  else if (effect === EFFECT.READ_ONLY)
    projects = ['chromium-authed', 'firefox-authed', 'webkit-authed'];
  else projects = ['chromium-authed']; // staging-only write; cross-browser gereksiz

  // ── auth rolü / capabilities ──
  const authRole = auth === AUTH.PUBLIC ? 'none' : roleFromName(rel) || 'default';

  // ── timeout sınıfı ──
  const timeoutClass = kind === 'discovery' ? TIMEOUT_CLASS.EXTENDED : TIMEOUT_CLASS.DEFAULT;

  // ── rota / yüzey ──
  const routes = (routeIndex.get(rel) || []).slice().sort();
  const surface = areaOfSpec(rel);

  // ── dışlama gerekçesi (yalnız production-unsafe için doldurulur) ──
  let exclusionReason = null;
  if (effect === EFFECT.MUTATION) {
    exclusionReason =
      (lc && lc.reason) ||
      'MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert).';
  } else if (effect === EFFECT.EXTERNAL_COST) {
    exclusionReason =
      'EXTERNAL_COST: gerçek dış servis/ücret doğurur → production seçiminde yasak (staging-only).';
  }

  return {
    id: rel, // stable, unique, deterministik
    pathPattern: rel,
    kind,
    effect,
    auth,
    authRole,
    environment,
    projects: projects.slice().sort(),
    surface,
    routes,
    capabilities: authRole === 'none' ? [] : [`auth:${authRole}`],
    timeoutClass,
    artifactClass: ARTIFACT_CLASS.SANITIZED_BUNDLE,
    lifecycleMode: lc ? lc.mode || null : null,
    owningPackage: 'vomenta-e2e',
    exclusionReason,
  };
}

// ───────────────────────────── Manifest kurulumu ─────────────────────────────

const uniqSort = (arr) => [...new Set(arr)].sort();

/**
 * Disk'teki spec dosyalarından tüm manifesti kurar (deterministik, sıralı).
 * @param {{
 *   specFiles: string[],
 *   lifecycle?: object,
 *   routeIndex?: Map<string,string[]>,
 * }} input
 * @returns {object}
 */
export function buildManifest(input) {
  const { specFiles = [], lifecycle = {}, routeIndex = new Map() } = input || {};
  const rels = uniqSort(specFiles.map(normalizeSpecPath).filter(Boolean));
  const entries = rels
    .map((rel) => classifySpec(rel, { lifecycle, routeIndex }))
    .sort((a, b) => a.pathPattern.localeCompare(b.pathPattern));

  const countBy = (key) =>
    entries.reduce((acc, e) => {
      acc[e[key]] = (acc[e[key]] || 0) + 1;
      return acc;
    }, {});

  const productionSafe = entries.filter((e) => e.effect === EFFECT.READ_ONLY);
  const stagingRequired = entries.filter(
    (e) => e.effect === EFFECT.MUTATION || e.effect === EFFECT.EXTERNAL_COST
  );

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    sources: Object.freeze([
      'tests/**/*.spec.js (dosya-adı konvansiyonu)',
      'tests/contracts/mutation-lifecycle.js',
      'tests/contracts/registered-routes.js',
      'tests/contracts/tested-pages.js',
      'config/environment.js',
      'playwright.config.js (grepInvert:/@mutation/)',
    ]),
    counts: {
      totalSpecs: entries.length,
      productionSafeReadOnly: productionSafe.length,
      mutationExcluded: entries.filter((e) => e.effect === EFFECT.MUTATION).length,
      externalCostExcluded: entries.filter((e) => e.effect === EFFECT.EXTERNAL_COST)
        .length,
      stagingRequired: stagingRequired.length,
      byEffect: countBy('effect'),
      byAuth: countBy('auth'),
      byEnvironment: countBy('environment'),
    },
    entries,
  };
}

/**
 * Manifest değişmezlerini doğrular; ihlalde FIRLATIR (fail-closed).
 * @param {object} manifest
 * @param {{ diskSpecFiles: string[], knownRoutes: string[] }} ctx
 */
export function validateManifest(manifest, ctx) {
  const { diskSpecFiles, knownRoutes } = ctx || {};
  if (!manifest || !Array.isArray(manifest.entries)) {
    throw new Error('MANIFEST_INVALID: entries dizisi yok.');
  }
  const effects = new Set(Object.values(EFFECT));
  const auths = new Set(Object.values(AUTH));
  const envs = new Set(Object.values(ENVIRONMENT));
  const ids = new Set();
  const manifestPaths = new Set();

  for (const e of manifest.entries) {
    if (ids.has(e.id)) throw new Error(`DUPLICATE_STABLE_ID: ${e.id}`);
    ids.add(e.id);
    manifestPaths.add(e.pathPattern);
    if (!effects.has(e.effect)) throw new Error(`UNKNOWN_EFFECT: ${e.id} → ${e.effect}`);
    if (!auths.has(e.auth)) throw new Error(`UNKNOWN_AUTH: ${e.id} → ${e.auth}`);
    if (!envs.has(e.environment))
      throw new Error(`UNKNOWN_ENVIRONMENT: ${e.id} → ${e.environment}`);
    if (!Array.isArray(e.projects) || e.projects.length === 0)
      throw new Error(`NO_PROJECTS: ${e.id}`);
    // read-only spec staging-only olamaz (kategori hatası).
    if (e.effect === EFFECT.READ_ONLY && e.environment === ENVIRONMENT.STAGING)
      throw new Error(`READONLY_STAGING_ONLY_CONTRADICTION: ${e.id}`);
    // production-unsafe spec gerekçesiz olamaz.
    if (e.effect !== EFFECT.READ_ONLY && !e.exclusionReason)
      throw new Error(`MISSING_EXCLUSION_REASON: ${e.id}`);
    if (knownRoutes) {
      const known = new Set(knownRoutes);
      for (const r of e.routes || []) {
        if (!known.has(r)) throw new Error(`UNKNOWN_ROUTE: ${e.id} → ${r}`);
      }
    }
  }

  // İki yönlü drift: manifest ↔ disk.
  if (diskSpecFiles) {
    const disk = new Set(diskSpecFiles.map(normalizeSpecPath));
    for (const p of manifestPaths)
      if (!disk.has(p)) throw new Error(`MANIFEST_SPEC_NOT_ON_DISK: ${p}`);
    for (const p of disk)
      if (!manifestPaths.has(p)) throw new Error(`DISK_SPEC_NOT_IN_MANIFEST: ${p}`);
  }

  // Güvenli seçim 0 ise gerekçesiz başarı yasak.
  const productionSafe = manifest.entries.filter((e) => e.effect === EFFECT.READ_ONLY);
  if (productionSafe.length === 0)
    throw new Error('ZERO_PRODUCTION_SAFE: production-safe read-only spec yok.');

  return true;
}

// ───────────────────────────── Güvenli seçim ─────────────────────────────

/**
 * Bir profil için deterministik, fail-closed spec-dosyası seçimi üretir.
 * Kurallar (ADR-0015):
 *   - yalnız effect=read-only kayıtlar seçilir;
 *   - seçime mutation/external-cost girerse HARD FAIL;
 *   - production profili staging-only kayıt gerektiriyorsa HARD FAIL;
 *   - güvenli seçim 0 ise (gerekçesiz) HARD FAIL.
 *
 * @param {object} manifest
 * @param {string} profileName
 * @param {{ isProduction?: boolean }} [env]
 * @returns {object} seçim (JSON'a hazır; ASLA executed/passed alanı içermez)
 */
export function selectProfile(manifest, profileName, env = {}) {
  const profile = PROFILES[profileName];
  if (!profile) {
    throw new Error(
      `INVALID_PROFILE: "${profileName}". İzinli: ${PROFILE_NAMES.join(', ')}`
    );
  }
  const isProduction = env.isProduction !== false; // varsayılan: production seçimi

  const projectSet = new Set(profile.projects);
  const fileScope = profile.files ? new Set(profile.files.map(normalizeSpecPath)) : null;

  // Kapsam: proje-eşleşen + (dosya-kapsamı verildiyse) o dosyalar.
  const inScope = manifest.entries.filter((e) => {
    if (!e.projects.some((p) => projectSet.has(p))) return false;
    if (fileScope && !fileScope.has(e.pathPattern)) return false;
    return true;
  });

  // Fail-closed #1: bir profil bir spec'i AÇIKÇA `files` ile hedefliyorsa (route-baseline
  // gibi), o spec read-only olmak ZORUNDA. Açık kapsamda mutation/external-cost = hard fail.
  if (fileScope) {
    for (const e of inScope) {
      if (e.effect !== EFFECT.READ_ONLY) {
        throw new Error(
          `PROFILE_SELECTS_UNSAFE: "${profileName}" açıkça ${e.effect} spec hedefliyor (${e.id}). ` +
            'Production profili yalnız read-only içerebilir.'
        );
      }
    }
    // Eksik açık-kapsam dosyası = drift → fail-closed.
    const got = new Set(inScope.map((e) => e.pathPattern));
    for (const f of fileScope)
      if (!got.has(f)) throw new Error(`PROFILE_FILE_MISSING: "${profileName}" → ${f}`);
  }

  // Grep-tabanlı (geniş) profil: mutation/external-cost effect ile SESSİZCE değil,
  // sınıflandırmayla dışarıda kalır (yalnız read-only seçilir). Güvenli küme:
  const safe = inScope.filter((e) => e.effect === EFFECT.READ_ONLY);

  // Fail-closed #10: production seçimi staging-only kayıt içeremez (çelişki).
  for (const e of safe) {
    if (isProduction && e.environment === ENVIRONMENT.STAGING) {
      throw new Error(
        `PROFILE_REQUIRES_STAGING: "${profileName}" production seçimi staging-only spec içeriyor (${e.id}).`
      );
    }
  }

  const files = uniqSort(safe.map((e) => e.pathPattern));
  if (files.length === 0) {
    throw new Error(
      `PROFILE_ZERO_SELECTION: "${profileName}" 0 güvenli spec seçti (gerekçesiz başarı yasak).`
    );
  }

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    profile: profileName,
    description: profile.description,
    projects: profile.projects.slice(),
    grep: profile.grep,
    environment: profile.environment,
    policyGated: profile.policyGated,
    // NOT: bunlar SEÇİLEN SPEC DOSYALARIDIR; çalıştırılan/geçen test SAYISI DEĞİL.
    selectedSpecFileCount: files.length,
    selectedSpecFiles: files,
  };
}

/**
 * Bir seçim/objede `--list`-türü statik sayının "executed/passed" gibi sunulmasını
 * engeller (HANDOFF §2.4 / negatif matris #9). Böyle bir alan varsa FIRLATIR.
 * @param {object} obj
 */
export function assertNoExecutedClaim(obj) {
  const forbidden = ['executed', 'passed', 'failed', 'flaky', 'runId', 'executedTests'];
  for (const k of forbidden) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
      throw new Error(
        `EXECUTED_CLAIM_FORBIDDEN: seçim/manifest stat--tir; "${k}" alanı runtime sonucu ima eder.`
      );
    }
  }
  return true;
}

// ───────────────────────────── Serileştirme ─────────────────────────────

/**
 * Profil kataloğunu (production seçimiyle) çözer — committed snapshot için.
 * @param {object} manifest
 * @returns {object[]}
 */
export function resolveProfileCatalog(manifest) {
  return PROFILE_NAMES.map((name) => {
    const sel = selectProfile(manifest, name, { isProduction: true });
    assertNoExecutedClaim(sel);
    return sel;
  });
}

/** Manifesti stabil, deterministik JSON metnine çevirir (sondaki newline dahil). */
export function serializeManifest(manifest) {
  const doc = {
    schemaVersion: manifest.schemaVersion,
    sources: manifest.sources,
    counts: manifest.counts,
    profiles: resolveProfileCatalog(manifest),
    entries: manifest.entries,
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}

const mdCell = (s) => String(s ?? '').replace(/\|/g, '\\|');

/** İnsan-okur, sanitize edilmiş Markdown özeti üretir (deterministik). */
export function renderManifestMarkdown(manifest) {
  const c = manifest.counts;
  const catalog = resolveProfileCatalog(manifest);
  const lines = [];
  lines.push('# Production Read-only Test Manifesti');
  lines.push('');
  lines.push(
    '> ÜRETİLMİŞ DOSYA — elle düzenlemeyin. Kaynak: `npm run report:readonly-manifest` ' +
      '(ADR-0015). Sayılar repo kaynaklarından deterministik türetilir.'
  );
  lines.push('');
  lines.push('## Özet sayılar');
  lines.push('');
  lines.push('| Ölçüt | Değer |');
  lines.push('|---|---:|');
  lines.push(`| Toplam spec | ${c.totalSpecs} |`);
  lines.push(`| Production-safe (read-only) | ${c.productionSafeReadOnly} |`);
  lines.push(`| Mutation (staging-only, dışlandı) | ${c.mutationExcluded} |`);
  lines.push(`| External-cost (dışlandı) | ${c.externalCostExcluded} |`);
  lines.push('');
  lines.push('`listed != selected != executed`: bu manifest yalnız spec DOSYASI seçer; ');
  lines.push('çalıştırılan/geçen test sayısı runtime raporunun işidir (FAZ 2+).');
  lines.push('');
  lines.push('## Profiller (production seçimi)');
  lines.push('');
  lines.push('| Profil | Projeler | grep | Seçilen spec | Policy-gated |');
  lines.push('|---|---|---|---:|:---:|');
  for (const p of catalog) {
    lines.push(
      `| \`${mdCell(p.profile)}\` | ${mdCell(p.projects.join(', '))} | ${
        p.grep ? `\`${mdCell(p.grep)}\`` : '—'
      } | ${p.selectedSpecFileCount} | ${p.policyGated ? 'evet' : 'hayır'} |`
    );
  }
  lines.push('');
  lines.push('## Effect dağılımı');
  lines.push('');
  lines.push('| effect | spec |');
  lines.push('|---|---:|');
  for (const [k, v] of Object.entries(c.byEffect).sort())
    lines.push(`| ${mdCell(k)} | ${v} |`);
  lines.push('');
  lines.push('## Staging-only dışlanan spec\'ler');
  lines.push('');
  lines.push('| spec | effect | gerekçe |');
  lines.push('|---|---|---|');
  for (const e of manifest.entries.filter((x) => x.effect !== EFFECT.READ_ONLY)) {
    lines.push(
      `| \`${mdCell(e.pathPattern)}\` | ${mdCell(e.effect)} | ${mdCell(e.exclusionReason)} |`
    );
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}
