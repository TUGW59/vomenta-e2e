// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 3 — FULL READ-ONLY AUDIT LANE CI YARDIMCILARI (ADR-0020).
 *
 * Kalıcı GitHub audit lane'inin (`.github/workflows/readonly-audit.yml`) üç ihtiyacı
 * için SAF, deterministik, fail-closed yardımcılar. Bu dosya production'a dokunmaz,
 * test koşmaz, ağa çıkmaz; yalnız FAZ 1 seçicisinin ürettiği seçim JSON'unu +
 * FAZ 2 güvenli bundle özetini tüketir.
 *
 *   assert-safe --selection <f>   Seçime mutation/external-cost sızmadığını, executed
 *                                 iddiası olmadığını BAĞIMSIZ yeniden türeterek kanıtlar
 *                                 (selectör kendi kapısına ek; §FAZ3 "mutation=0 doğrula").
 *   plan        --selection <f>   Seçimden güvenli `project` + `grep` GitHub Actions
 *                                 çıktısı üretir (orchestrator --test-cmd'i buradan kurulur).
 *   summary     --selection <f> --bundle <f> [--out <f>]
 *                                 Sanitize GitHub job summary markdown'ı üretir. Sayılar
 *                                 kaynaklardan gelir; "listed != selected != executed" korunur.
 *
 * TASARIM: audit lane YALNIZ Chromium read-only profillerini koşar (§FAZ3 "Chromium
 * production-safe selector"). Cross-browser + visual FAZ 6 kapsamıdır → audit enum'una
 * girmez; girerse assert-safe HARD FAIL verir.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  PROFILES,
  PROFILE_NAMES,
  normalizeSpecPath,
  assertNoExecutedClaim,
  EFFECT,
  ENVIRONMENT,
} from './readonly-manifest-lib.mjs';

/** Audit lane'inin koştuğu TEK güvenli Playwright projesi (Chromium authed). */
export const SAFE_AUDIT_PROJECT = 'chromium-authed';

/**
 * Audit lane'inin izinli profil ENUM'u — PROFILES'tan TÜRETİLİR (ikinci gerçeklik
 * kaynağı yok): tek projesi `chromium-authed` olan ve policy-gated OLMAYAN read-only
 * profiller. Böylece cross-browser (çok proje) ve visual (policy-gated) otomatik dışlanır.
 */
export const AUDIT_PROFILES = Object.freeze(
  PROFILE_NAMES.filter((name) => {
    const p = PROFILES[name];
    return (
      Array.isArray(p.projects) &&
      p.projects.length === 1 &&
      p.projects[0] === SAFE_AUDIT_PROJECT &&
      !p.policyGated &&
      p.environment === 'production'
    );
  })
);

/**
 * Bir seçim (select-readonly-tests.mjs JSON çıktısı) production-audit için güvenli mi?
 * Selectörün kendi fail-closed kapısına EK bağımsız katman: mutation/external-cost
 * dosya adı burada YENİDEN türetilir. İhlalde FIRLATIR (fail-closed).
 * @param {any} selection
 * @returns {true}
 */
export function assertSelectionSafe(selection) {
  if (!selection || typeof selection !== 'object') {
    throw new Error('AUDIT_SELECTION_INVALID: seçim nesnesi yok/bozuk.');
  }
  // 1) Statik seçim runtime sonucu iddia edemez (listed != executed).
  assertNoExecutedClaim(selection);

  // 2) Profil audit enum'unda olmalı (cross-browser/visual/staging DEĞİL).
  if (!AUDIT_PROFILES.includes(selection.profile)) {
    throw new Error(
      `AUDIT_PROFILE_NOT_ALLOWED: "${selection.profile}" audit lane enum'unda değil. ` +
        `İzinli: ${AUDIT_PROFILES.join(', ')}.`
    );
  }

  // 3) Ortam production; proje YALNIZ güvenli Chromium authed (tek proje).
  if (selection.environment !== 'production') {
    throw new Error(`AUDIT_ENV_NOT_PRODUCTION: environment=${selection.environment}.`);
  }
  const projects = Array.isArray(selection.projects) ? selection.projects : [];
  if (projects.length !== 1 || projects[0] !== SAFE_AUDIT_PROJECT) {
    throw new Error(
      `AUDIT_PROJECT_UNSAFE: audit lane yalnız [${SAFE_AUDIT_PROJECT}] koşar; gelen ${JSON.stringify(projects)}.`
    );
  }

  // 4) Seçilen spec listesi tutarlı, boş değil, her giriş geçerli bir .spec.js yolu.
  const files = Array.isArray(selection.selectedSpecFiles) ? selection.selectedSpecFiles : null;
  if (!files || files.length === 0) {
    throw new Error('AUDIT_ZERO_SELECTION: seçilen spec dosyası 0 (gerekçesiz başarı yasak).');
  }
  if (Number(selection.selectedSpecFileCount) !== files.length) {
    throw new Error(
      `AUDIT_COUNT_MISMATCH: selectedSpecFileCount=${selection.selectedSpecFileCount} != ${files.length}.`
    );
  }
  for (const raw of files) {
    const rel = normalizeSpecPath(raw);
    if (!rel || !/\.spec\.js$/.test(rel)) {
      throw new Error(`AUDIT_BAD_SPEC_PATH: "${raw}" geçerli bir tests/*.spec.js yolu değil.`);
    }
  }
  return true;
}

/**
 * Seçilen HER spec'in MANİFEST etkisinin `read-only` (ve staging-only olmadığı)
 * doğrular. Selectörün effect filtresine BAĞIMSIZ ikinci kapı: manifest diskten
 * yeniden kurulur; effect=mutation/external-cost bir spec seçime sızarsa HARD FAIL.
 * Mutation dosya-adı taşıyıp lifecycle ile read-only İŞARETLENMİŞ spec'ler (ör.
 * mutation-orphans → salt-okunur baseline doğrulaması) manifest effect'ine göre
 * DOĞRU biçimde geçer — dosya-adı sanısıyla yanlış reddedilmez (ADR-0015 tek kaynağı).
 * @param {any} selection
 * @param {{ entries: Array<{ id:string, pathPattern:string, effect:string, environment:string }> }} manifest
 * @returns {true}
 */
export function assertSelectedEffectsReadOnly(selection, manifest) {
  const entries = manifest && Array.isArray(manifest.entries) ? manifest.entries : null;
  if (!entries) throw new Error('AUDIT_MANIFEST_INVALID: manifest.entries yok.');
  const byPath = new Map(entries.map((e) => [normalizeSpecPath(e.pathPattern || e.id), e]));
  const files = Array.isArray(selection.selectedSpecFiles) ? selection.selectedSpecFiles : [];
  for (const raw of files) {
    const rel = normalizeSpecPath(raw);
    const e = byPath.get(rel);
    if (!e) throw new Error(`AUDIT_SPEC_NOT_IN_MANIFEST: "${rel}" manifestte yok (drift → fail-closed).`);
    if (e.effect !== EFFECT.READ_ONLY) {
      throw new Error(`AUDIT_NONREADONLY_LEAK: "${rel}" manifest effect=${e.effect} (read-only bekleniyor).`);
    }
    if (e.environment === ENVIRONMENT.STAGING) {
      throw new Error(`AUDIT_STAGING_ONLY_LEAK: "${rel}" staging-only; production audit seçimine giremez.`);
    }
  }
  return true;
}

/**
 * Güvenli seçimden orchestrator koşum planı üretir: { project, grep }.
 * grep null ise '' döner (profil tüm read-only dosyaları kapsar → runtime grep yok).
 * @param {any} selection
 * @returns {{ project: string, grep: string }}
 */
export function deriveRunPlan(selection) {
  assertSelectionSafe(selection);
  const grep = selection.grep == null ? '' : String(selection.grep);
  // Güvenli grep: yalnız @tag biçimi (harf/rakam/./-/@). Serbest shell argümanı reddet.
  if (grep && !/^@[\w.@-]+$/.test(grep)) {
    throw new Error(`AUDIT_GREP_UNSAFE: grep "${grep}" beklenen @tag biçiminde değil.`);
  }
  return { project: SAFE_AUDIT_PROJECT, grep };
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Sanitize GitHub job summary markdown'ı (SAF). Tüm değerler kaynaktan gelir;
 * elle sayı yazılmaz. bundle.sourceMissing → run blocker olarak dürüstçe raporlanır.
 * @param {{
 *   selection: any,
 *   bundle: any|null,
 *   manifestCounts: any,
 *   meta: { runId?:string|null, commit?:string|null, event?:string|null },
 *   findings: { total:number, open:number, bySeverity:Record<string,number> },
 *   artifactName: string,
 * }} input
 * @returns {string}
 */
export function renderJobSummary(input) {
  const { selection, bundle, manifestCounts: mc, meta, findings, artifactName } = input;
  const t = bundle && bundle.totals ? bundle.totals : null;
  const blocked = !bundle || bundle.sourceMissing === true || t == null;
  const selectedFiles = Array.isArray(selection.selectedSpecFiles) ? selection.selectedSpecFiles : [];
  const isRouteBaseline = selection.profile === 'route-baseline-chromium';
  const L = [];

  L.push('# Read-only Audit — GitHub job özeti');
  L.push('');
  L.push('| Alan | Değer |');
  L.push('|---|---|');
  L.push(`| Profil | \`${selection.profile}\` |`);
  L.push(`| Proje | \`${SAFE_AUDIT_PROJECT}\` |`);
  L.push(`| grep | ${selection.grep ? `\`${selection.grep}\`` : '— (tüm read-only)'} |`);
  L.push(`| Ortam | ${selection.environment} |`);
  L.push(`| Commit | \`${meta.commit || '—'}\` |`);
  L.push(`| Run ID | \`${meta.runId || '—'}\` |`);
  L.push(`| Event | ${meta.event || '—'} |`);
  L.push('');

  L.push('## Kapsam hunisi (listed != selected != executed)');
  L.push('');
  L.push('| Ölçüt | Değer |');
  L.push('|---|---:|');
  L.push(`| Tanımlı mantıksal spec (manifest) | ${num(mc && mc.totalSpecs)} |`);
  L.push(`| Production-safe read-only spec | ${num(mc && mc.productionSafeReadOnly)} |`);
  L.push(`| Bu koşumda seçilen spec dosyası | ${selectedFiles.length} |`);
  if (blocked) {
    L.push('| Çalışan test | — (runtime JSON üretilmedi) |');
  } else {
    L.push(`| Çalışan test (executed) | ${num(t.total)} |`);
    L.push(`| PASS | ${num(t.passed)} |`);
    L.push(`| FAIL | ${num(t.failed)} |`);
    L.push(`| FLAKY (retry-pass) | ${num(t.flaky)} |`);
    L.push(`| TIMED_OUT | ${num(t.timedOut)} |`);
    L.push(`| SKIPPED | ${num(t.skipped)} |`);
  }
  L.push('');
  L.push('> Seçilen sayı SPEC DOSYASIDIR; çalışan test sayısı runtime sonucudur. Bu iki');
  L.push('> sayı farklı birimlerdir ve kasıtlı ayrı gösterilir.');
  L.push('');

  if (isRouteBaseline) {
    L.push('## Kayıtlı rota baseline');
    L.push('');
    L.push('Bu profil her kayıtlı rota için tek read-only açılış tabanını (`@route-baseline`) koşar.');
    L.push('');
  }

  L.push('## Bilinen bulgular');
  L.push('');
  const sev = findings.bySeverity || {};
  L.push(`- Toplam kayıtlı bulgu: **${num(findings.total)}** (açık: ${num(findings.open)})`);
  L.push(
    `- Severity: critical ${num(sev.critical)} · high ${num(sev.high)} · medium ${num(sev.medium)} · low ${num(sev.low)}`
  );
  L.push('- Bu lane bulguları YENİDEN ÜRETMEZ ve registry\'yi DEĞİŞTİRMEZ (triage FAZ 5).');
  L.push('');

  L.push('## Ortam / run blocker');
  L.push('');
  if (blocked) {
    L.push('- ⚠️ **RUN BLOCKER**: runtime JSON üretilmedi (test adımı rapor yazmadan çöktü veya');
    L.push('  bozuk). Güvenli boş özet üretildi; job KIRMIZI. Bu 0 ürün bug\'ı anlamına gelmez.');
  } else {
    L.push('- Runtime JSON üretildi; sonuçlar yukarıda.');
  }
  L.push('');

  L.push('## Test edilmeyen kapsam (dürüst sınır)');
  L.push('');
  L.push(`- Mutation (staging-only, dışlandı): ${num(mc && mc.mutationExcluded)} spec`);
  L.push(`- External-cost (dışlandı): ${num(mc && mc.externalCostExcluded)} spec`);
  L.push(`- Staging gerektiren toplam: ${num(mc && mc.stagingRequired)} spec`);
  L.push('- Cross-browser (Firefox/WebKit), a11y-derin ve görsel katman: bu lane KAPSAMI DIŞI (FAZ 6).');
  L.push('- Create/update/delete, rol/tenant, gerçek SMS/çağrı/e-posta/WhatsApp: production\'da KOŞULMADI.');
  L.push('');

  L.push('## Bu rapor neyi kanıtlar / kanıtlamaz');
  L.push('');
  L.push('- KANITLAR: seçilen production-safe read-only Chromium testlerinin bu koşumdaki gerçek sonucu.');
  L.push('- KANITLAMAZ: "üründeki tüm buglar bulundu", "tüm E2E bitti", "mutation/RBAC/dış servis geçti".');
  L.push('');
  L.push(`Güvenli artifact: \`${artifactName}\` (sanitize summary.json/junit.xml/summary.html/manifest.json).`);
  L.push('');
  return L.join('\n');
}

// ───────────────────────────── CLI ─────────────────────────────

function readJson(file, label) {
  const abs = resolve(process.cwd(), file);
  if (!existsSync(abs)) throw new Error(`${label} bulunamadı: ${file}`);
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    throw new Error(`${label} geçersiz JSON: ${file}`);
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) out[a.slice(2, eq)] = a.slice(eq + 1);
      else out[a.slice(2)] = argv[++i];
    }
  }
  return out;
}

/** Known-bug registry'den güvenli özet sayılar (import ederek; hassas alan yok). */
async function loadFindingsSummary() {
  const { KNOWN_BUGS, SEVERITIES } = await import('../tests/contracts/known-bugs.js');
  const bySeverity = {};
  for (const s of SEVERITIES) bySeverity[s] = 0;
  let open = 0;
  for (const b of KNOWN_BUGS) {
    if (bySeverity[b.severity] != null) bySeverity[b.severity]++;
    if (b.status === 'open') open++;
  }
  return { total: KNOWN_BUGS.length, open, bySeverity };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (cmd === 'assert-safe') {
    const selection = readJson(args.selection, 'seçim');
    assertSelectionSafe(selection);
    const { buildFromDisk } = await import('./generate-readonly-manifest.mjs');
    assertSelectedEffectsReadOnly(selection, buildFromDisk());
    console.log(
      `[audit-ci] güvenli: profil=${selection.profile} proje=${SAFE_AUDIT_PROJECT} ` +
        `seçilen spec=${selection.selectedSpecFileCount} (her spec manifest effect=read-only; mutation/external-cost=0).`
    );
    return;
  }

  if (cmd === 'plan') {
    const selection = readJson(args.selection, 'seçim');
    const plan = deriveRunPlan(selection);
    // GitHub Actions çıktısı: $GITHUB_OUTPUT'a append edilir.
    process.stdout.write(`project=${plan.project}\ngrep=${plan.grep}\n`);
    return;
  }

  if (cmd === 'summary') {
    const selection = readJson(args.selection, 'seçim');
    const bundle = args.bundle && existsSync(resolve(process.cwd(), args.bundle))
      ? readJson(args.bundle, 'bundle')
      : null;
    const { buildFromDisk } = await import('./generate-readonly-manifest.mjs');
    const manifest = buildFromDisk();
    const findings = await loadFindingsSummary();
    const md = renderJobSummary({
      selection,
      bundle,
      manifestCounts: manifest.counts,
      meta: {
        runId: process.env.GITHUB_RUN_ID || null,
        commit: process.env.GITHUB_SHA ? String(process.env.GITHUB_SHA).slice(0, 40) : null,
        event: process.env.GITHUB_EVENT_NAME || null,
      },
      findings,
      artifactName: 'readonly-audit-secure',
    });
    if (args.out) writeFileSync(resolve(process.cwd(), args.out), md);
    else process.stdout.write(md);
    return;
  }

  console.error(
    'Kullanım: node tools/audit-ci.mjs <assert-safe|plan|summary> --selection <f> [--bundle <f>] [--out <f>]'
  );
  process.exit(2);
}

// Yalnız DOĞRUDAN çalıştırıldığında CLI koşar; import edildiğinde (self-check) SAF kalır.
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isMain) {
  main().catch((err) => {
    console.error(`[audit-ci] HATA (fail-closed): ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
