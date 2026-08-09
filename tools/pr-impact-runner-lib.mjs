// @ts-check
/**
 * PR-IMPACT RUNNER — SAF KARAR KÜTÜPHANESİ (WP-CI-E2 / Faz 2).
 *
 * Faz 1'in ürettiği `selection.json` planını GERÇEK Playwright koşusuna çeviren
 * kararların TAMAMI burada saf fonksiyonlarla tanımlıdır. Bu dosya:
 *   - ağa çıkmaz, Playwright'ı çağırmaz, `process.exit` çağırmaz;
 *   - CLI (`run-pr-impact.mjs`) ve sentetik self-check tarafından tüketilir.
 *
 * Neden ayrık: negatif kanıt (0-test, flaky, mutation sızması, bozuk plan…)
 * PRODUCTION'a karşı değil, bu saf mantığa ENJEKTE edilmiş sahte gözlemlerle
 * kanıtlanır (handoff §2.6). Böylece kırılma kanıtı deterministik ve offline'dır.
 *
 * Savunma sırası:
 *   1) Şema doğrulama — bozuk/tamper edilmiş plan reddedilir.
 *   2) Karar — sourceMissing / unmapped / plan.exitCode!=0 → REFUSE (non-zero).
 *   3) Mutation son-savunması — seçili herhangi bir dosya mutation spec ise REFUSE.
 *   4) Grup yürütme yorumu — 0-test / unexpected / flaky → grup kırmızı.
 */
import {
  FALLBACK_SUITES,
  PROJECTS,
  roleOfSpec,
} from './pr-impact-lib.mjs';
import {
  isGatewayStatus,
  pickGatewayStatus,
  gatewayStatusFromBodyText,
} from '../tests/support/gateway-retry.js';

export const RUNNER_SCHEMA_VERSION = 1;

/**
 * Seçim alanı → Playwright projesi + setup bağımlılığı (playwright.config.js ile
 * birebir). `setup` grubu hedef test sayısına KATILMAZ (runner sorumluluğu #6).
 */
export const RUN_GROUPS = Object.freeze([
  { field: 'publicSpecs', key: 'public', project: PROJECTS.public, setup: null },
  { field: 'authenticatedSpecs', key: 'authed', project: PROJECTS.authed, setup: 'setup' },
  { field: 'discoverySpecs', key: 'discovery', project: PROJECTS.discovery, setup: 'setup' },
]);

const isMutationSpecPath = (rel) =>
  /\.spec\.js$/.test(rel) &&
  /(?:\.mutation\.|-mutations?\.|(?:^|\/)mutation-orphans\.)/.test(rel);

const MUTATION_TAG = /@mutation/;

// ─────────────────────────────── Şema doğrulama ───────────────────────────────

/**
 * `selection.json` planını yapısal olarak doğrular. Metin araması değil; alan
 * tipleri denetlenir. Bozuk/tamper edilmiş plan burada yakalanır.
 * @param {any} plan
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateSelection(plan) {
  const errors = [];
  const isArr = (v) => Array.isArray(v);
  const isStrArr = (v) => isArr(v) && v.every((x) => typeof x === 'string');

  if (!plan || typeof plan !== 'object' || isArr(plan)) {
    return { ok: false, errors: ['plan bir nesne değil'] };
  }
  if (plan.schemaVersion !== 1) errors.push(`schemaVersion beklenen 1, gelen ${plan.schemaVersion}`);
  if (typeof plan.status !== 'string' || plan.status === '') errors.push('status eksik/boş');
  if (typeof plan.exitCode !== 'number') errors.push('exitCode sayı değil');
  if (typeof plan.sourceMissing !== 'boolean') errors.push('sourceMissing boolean değil');

  const sel = plan.selected;
  if (!sel || typeof sel !== 'object' || isArr(sel)) {
    errors.push('selected nesnesi eksik');
  } else {
    for (const g of RUN_GROUPS) {
      if (!isStrArr(sel[g.field])) errors.push(`selected.${g.field} string[] değil`);
    }
  }
  // roleSpecs opsiyoneldir (rol-scoped enforcement spec'leri); varsa string[] olmalı.
  if (sel && typeof sel === 'object' && !isArr(sel) && sel.roleSpecs !== undefined && !isStrArr(sel.roleSpecs)) {
    errors.push('selected.roleSpecs string[] değil');
  }
  if (!isStrArr(plan.fallbackSuites)) errors.push('fallbackSuites string[] değil');
  if (!isStrArr(plan.stagingBlockedMutationSpecs)) errors.push('stagingBlockedMutationSpecs string[] değil');
  if (!isStrArr(plan.unmappedRuntimeFiles)) errors.push('unmappedRuntimeFiles string[] değil');
  if (typeof plan.selectedRunnableSpecCount !== 'number') errors.push('selectedRunnableSpecCount sayı değil');

  // Bilinmeyen fallback kimliği (tamper) reddet.
  if (isStrArr(plan.fallbackSuites)) {
    for (const id of plan.fallbackSuites) {
      if (!FALLBACK_SUITES[id]) errors.push(`bilinmeyen fallback suite: ${id}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ─────────────────────────────── Grup üretimi ───────────────────────────────

/**
 * Plandan yürütülecek grupları üretir. Her grup güvenli argument array'iyle
 * (shell interpolation YOK) Playwright'a verilecek biçimdedir.
 * @param {any} plan doğrulanmış selection planı
 * @returns {Array<{ key: string, kind: 'exact'|'fallback'|'role', project: string,
 *   setup: string|null, files: string[], grep: string|null, expected: number }>}
 */
export function buildRunGroups(plan) {
  const groups = [];
  for (const g of RUN_GROUPS) {
    const files = plan.selected[g.field] || [];
    if (files.length === 0) continue;
    groups.push({
      key: g.key,
      kind: 'exact',
      project: g.project,
      setup: g.setup,
      files: [...files],
      grep: null,
      expected: files.length, // her exact spec ≥1 test bekler (0-test → kırmızı)
    });
  }
  // Rol-scoped enforcement spec'leri (*.admin/.supervisor/.agent.spec.js) — YALNIZ
  // ilgili `chromium-<role>` projesinde koşar (playwright.config.js optionalRoleProjects).
  // Bu proje ANCAK ilgili rol credential'ı tanımlıysa OLUŞUR; yoksa 0 test bulunması
  // MEŞRUDUR (kapsam boşluğu ayrıca settings-roles-rbac.authed.spec.js içindeki görünür
  // skip ile işaretli). Bu yüzden 'role' kind'ı ZERO_TEST_SELECTION saymaz (güvenlik ağı):
  // credential geldiğinde grup gerçekten koşar + unexpected/flaky/exit yine kırmızı yapar.
  const roleGroups = new Map(); // role -> files[]
  for (const spec of plan.selected.roleSpecs || []) {
    const role = roleOfSpec(spec);
    if (!role) continue; // savunma: rol türetilemezse atla (bucket zaten filtreler)
    if (!roleGroups.has(role)) roleGroups.set(role, []);
    roleGroups.get(role).push(spec);
  }
  for (const role of [...roleGroups.keys()].sort()) {
    const files = [...roleGroups.get(role)].sort();
    groups.push({
      key: `role:${role}`,
      kind: 'role',
      project: `chromium-${role}`,
      setup: `setup-${role}`,
      files,
      grep: null,
      expected: files.length,
    });
  }
  for (const id of plan.fallbackSuites || []) {
    const suite = FALLBACK_SUITES[id];
    if (!suite) continue; // validateSelection zaten reddeder; savunma
    groups.push({
      key: `fallback:${id}`,
      kind: 'fallback',
      project: suite.project,
      // fallback exact dosya listesi authed → setup; public grep → setup yok.
      setup: suite.project === PROJECTS.public ? null : 'setup',
      files: suite.files ? [...suite.files] : [],
      grep: suite.grep || null,
      // grep-only fallback için hedef bilinmez (güvenlik ağı) → 0-test uyarı, kırmızı değil.
      expected: suite.files ? suite.files.length : 0,
    });
  }
  return groups;
}

/**
 * Mutation son-savunması: hiçbir grupta mutation spec dosyası veya @mutation grep
 * olamaz (runner sorumluluğu #9). İhlal → yürütülMEmesi gereken hata.
 * @param {ReturnType<typeof buildRunGroups>} groups
 * @returns {string[]} ihlal mesajları (boşsa temiz)
 */
export function assertNoMutation(groups) {
  const violations = [];
  for (const grp of groups) {
    for (const f of grp.files) {
      if (isMutationSpecPath(f)) violations.push(`mutation spec grupta: ${grp.key} → ${f}`);
    }
    if (grp.grep && MUTATION_TAG.test(grp.grep)) {
      violations.push(`@mutation grep grupta: ${grp.key} → ${grp.grep}`);
    }
  }
  return violations;
}

// ─────────────────────────────── Üst-düzey karar ───────────────────────────────

/**
 * Plandan yürütme kararını üretir. Playwright'ı ÇAĞIRMAZ; yalnız ne yapılacağını
 * söyler. CLI bu kararı alır, gerçek koşuyu yapar.
 *
 * @param {any} rawPlan
 * @returns {{
 *   decision: 'REFUSE'|'NOOP'|'RUN',
 *   reason: string,
 *   exitCode: number,
 *   groups: ReturnType<typeof buildRunGroups>,
 *   expectedRunnableSpecCount: number,
 * }}
 */
export function planRun(rawPlan) {
  const { ok, errors } = validateSelection(rawPlan);
  if (!ok) {
    return {
      decision: 'REFUSE',
      reason: `INVALID_SELECTION: ${errors.join('; ')}`,
      exitCode: 1,
      groups: [],
      expectedRunnableSpecCount: 0,
    };
  }

  // Planner fail-closed durumları → runner da koşmayı reddeder (non-zero).
  if (rawPlan.sourceMissing === true) {
    return { decision: 'REFUSE', reason: 'SOURCE_MISSING', exitCode: 1, groups: [], expectedRunnableSpecCount: 0 };
  }
  if ((rawPlan.unmappedRuntimeFiles || []).length > 0) {
    return {
      decision: 'REFUSE',
      reason: `UNMAPPED_RUNTIME_CHANGE: ${rawPlan.unmappedRuntimeFiles.join(', ')}`,
      exitCode: 1,
      groups: [],
      expectedRunnableSpecCount: 0,
    };
  }
  if (rawPlan.exitCode !== 0) {
    return { decision: 'REFUSE', reason: `PLANNER_NONZERO:${rawPlan.status}`, exitCode: 1, groups: [], expectedRunnableSpecCount: 0 };
  }

  const groups = buildRunGroups(rawPlan);

  // Mutation son-savunması — sınıflandırma yanlışsa bile prod'a mutation girmez.
  const mut = assertNoMutation(groups);
  if (mut.length > 0) {
    return { decision: 'REFUSE', reason: `MUTATION_LEAK: ${mut.join('; ')}`, exitCode: 1, groups: [], expectedRunnableSpecCount: 0 };
  }

  const expectedRunnableSpecCount = groups
    .filter((g) => g.kind === 'exact')
    .reduce((n, g) => n + g.files.length, 0);

  // Çalıştırılacak hiçbir grup yoksa (yalnız docs/mutation/staging) → NOOP.
  if (groups.length === 0) {
    return {
      decision: 'NOOP',
      reason: `NO_RUNTIME:${rawPlan.status}`,
      exitCode: 0,
      groups: [],
      expectedRunnableSpecCount: 0,
    };
  }

  return {
    decision: 'RUN',
    reason: `RUN:${groups.length} grup`,
    exitCode: 0,
    groups,
    expectedRunnableSpecCount,
  };
}

// ─────────────────────────── Grup sonucu yorumu ───────────────────────────

/**
 * Bir grubun gözlenen sonucunu (Playwright'tan) yorumlar.
 *
 * `observed`:
 *   - listedCount: koşu raporunda hedef projede GÖRÜLEN test sayısı
 *                  (setup/dependency HARİÇ). 0 → seçim test üretmedi.
 *   - exitCode:    Playwright'ın grup için döndürdüğü çıkış kodu.
 *   - stats:       { expected, unexpected, flaky, skipped } (setup HARİÇ hedef).
 *
 * Kurallar (fail-closed):
 *   - exact grup listedCount==0 → ZERO_TEST (kırmızı). Planner runnable beklerken
 *     runner 0 test bulursa sahte-yeşil engellenir (handoff §2.6.2).
 *   - stats.unexpected>0 → kırmızı.
 *   - stats.flaky>0 → kırmızı (retry flaky'yi başarıya çevirmez, sorumluluk #8).
 *   - exitCode!=0 → kırmızı.
 *
 * @param {{ key: string, kind: string, expected: number, files: string[], grep: string|null }} group
 * @param {{ listedCount: number, exitCode: number, stats?: { expected?: number, unexpected?: number, flaky?: number, skipped?: number } }} observed
 * @returns {{ key: string, passed: boolean, reason: string, listedCount: number,
 *   ran: number, unexpected: number, flaky: number }}
 */
export function interpretGroup(group, observed) {
  const listedCount = Number(observed.listedCount || 0);
  const stats = observed.stats || {};
  const unexpected = Number(stats.unexpected || 0);
  const flaky = Number(stats.flaky || 0);
  const ran = Number(stats.expected || 0) + unexpected + flaky;

  const fail = (reason) => ({ key: group.key, passed: false, reason, listedCount, ran, unexpected, flaky });

  // 0-test kapısı: exact grup (ya da dosyalı fallback) test bulamazsa kırmızı.
  // 'role' grubu HARİÇ: chromium-<role> projesi credential'a bağlı koşullu oluşur;
  // 0 test = MEŞRU (kapsam boşluğu görünür skip'le işaretli), sahte-kırmızı üretme.
  const expectsTests =
    group.kind === 'exact' || (group.kind === 'fallback' && group.files.length > 0);
  if (expectsTests && listedCount === 0) return fail('ZERO_TEST_SELECTION');
  if (unexpected > 0) return fail(`UNEXPECTED_FAILURES:${unexpected}`);
  if (flaky > 0) return fail(`FLAKY_NOT_PASS:${flaky}`);
  if (observed.exitCode !== 0) return fail(`NONZERO_EXIT:${observed.exitCode}`);

  return { key: group.key, passed: true, reason: 'OK', listedCount, ran, unexpected, flaky };
}

/**
 * Grup yorumlarını toplar. Herhangi biri kırmızıysa genel çıkış non-zero
 * (runner sorumluluğu #7). Ayrıca güvenli (secretsiz) özet satırları üretir.
 * @param {Array<ReturnType<typeof interpretGroup>>} interpreted
 * @returns {{ overallExitCode: number, allGreen: boolean, lines: string[] }}
 */
export function aggregate(interpreted) {
  const lines = [];
  let allGreen = true;
  for (const r of interpreted) {
    if (!r.passed) allGreen = false;
    lines.push(
      `${r.passed ? 'PASS' : 'FAIL'} ${r.key} — listed=${r.listedCount} ran=${r.ran} ` +
        `unexpected=${r.unexpected} flaky=${r.flaky} (${r.reason})`
    );
  }
  return { overallExitCode: allGreen ? 0 : 1, allGreen, lines };
}

// ─────────────────────────────── Sharding (saf) ───────────────────────────────

/**
 * PR-impact koşumunu deterministik olarak N parçaya (shard) böler.
 *
 * SÖZLEŞME (kapsam koruması):
 *   - Tüm exact spec dosyalarının BİRLEŞİMİ = tüm shard'ların birleşimi (kayıp yok).
 *   - Hiçbir exact dosya iki shard'a birden gitmez (çakışma yok → gereksiz yük yok).
 *   - Atama girdi sırasından bağımsız, tamamen deterministiktir (dosya adına göre
 *     kararlı sıralama → pozisyon % total). Aynı plan hep aynı bölünmeyi verir.
 *   - grep-only fallback (dosyasız güvenlik ağı) YALNIZ shard 1'de koşar (bölünemez;
 *     tekrarı gereksiz canlı yüktür). Bir shard'a hiç iş düşmezse boş grup listesi
 *     döner → çağıran bunu meşru SHARD_NOOP (exit 0) olarak ele alır; kapsam
 *     birleşimde ve aggregate gate'te korunur.
 *
 * @param {ReturnType<typeof buildRunGroups>} groups
 * @param {number} shardIndex 1-tabanlı (1..shardTotal)
 * @param {number} shardTotal ≥1
 * @returns {ReturnType<typeof buildRunGroups>}
 */
export function shardGroups(groups, shardIndex, shardTotal) {
  const idx = Number(shardIndex);
  const total = Number(shardTotal);
  if (
    !Number.isInteger(idx) ||
    !Number.isInteger(total) ||
    total < 1 ||
    idx < 1 ||
    idx > total
  ) {
    throw new Error(`Geçersiz shard parametresi: ${shardIndex}/${shardTotal}`);
  }

  // Global, deterministik (groupKey, file) sıralaması → pozisyon % total ile atama.
  const pairs = [];
  for (const g of groups) {
    for (const f of g.files || []) pairs.push({ key: g.key, file: f });
  }
  pairs.sort((a, b) =>
    a.file === b.file ? a.key.localeCompare(b.key) : a.file.localeCompare(b.file)
  );

  const assigned = new Map(); // groupKey -> Set(files)
  pairs.forEach((p, i) => {
    if ((i % total) + 1 !== idx) return;
    if (!assigned.has(p.key)) assigned.set(p.key, new Set());
    assigned.get(p.key).add(p.file);
  });

  const out = [];
  for (const g of groups) {
    const isGrepOnly = (g.files || []).length === 0 && g.grep;
    if (isGrepOnly) {
      if (idx === 1) out.push({ ...g });
      continue;
    }
    const files = assigned.get(g.key);
    if (files && files.size > 0) {
      const list = [...files].sort();
      out.push({ ...g, files: list, expected: list.length });
    }
  }
  return out;
}

// ────────────────────── Kontrollü altyapı-retry sınıflandırması (saf) ──────────────────────

/**
 * Bir test başarısızlığında EN FAZLA kaç deneme yapılır (1 kontrollü retry).
 * Genel Playwright `--retries` 0'da kalır; bu, yalnız yapılandırılmış altyapı
 * (gateway/network) hatalarında runner'ın kendi tek kontrollü yeniden koşumudur.
 */
export const MAX_ATTEMPTS_PER_TEST = 2;

/**
 * Retry edilebilir sayılan ağ (network) hata imzaları — yapılandırılmış allowlist.
 * Yalnız açıkça geçici bağlantı/DNS hataları. Genişletmek bilinçli bir karardır.
 */
export const RETRYABLE_NETWORK_PATTERNS = Object.freeze([
  /ECONNRESET/,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /EAI_AGAIN/,
  /ENOTFOUND/,
  /EPIPE/,
  /socket hang up/i,
  /net::ERR_(?:CONNECTION_(?:RESET|REFUSED|CLOSED|TIMED_OUT|ABORTED)|NETWORK_CHANGED|TIMED_OUT|EMPTY_RESPONSE|ADDRESS_UNREACHABLE|NAME_NOT_RESOLVED)/,
]);

/**
 * Assertion / selector / visibility (yani GERÇEK test) başarısızlık imzaları.
 * Bu imzalardan biri görülürse hata KESİNLİKLE test hatasıdır → retry YOK; metinde
 * tesadüfen bir ağ ifadesi bulunsa bile bu deny kazanır (fail-closed, plan gereği).
 */
export const TEST_FAILURE_SIGNATURES = Object.freeze([
  /expect\(/,
  /toBe(?:Visible|Hidden|Checked|Enabled|Disabled|Focused|InViewport|Attached|Empty|Truthy|Falsy)\b/,
  /toHave(?:Text|Value|Count|Class|Attribute|Title|URL|CSS|Id|Screenshot|JSProperty)\b/,
  /toContainText\b/,
  /toMatch(?:Snapshot|AriaSnapshot)?\b/,
  /strict mode violation/i,
  /waiting for (?:locator|element|selector|expect)/i,
  /locator\.[a-zA-Z]+:/,
  /getBy(?:Role|Text|Label|TestId|Placeholder|Title|AltText)\(/,
]);

/**
 * Bir başarısızlığı 'infra' (kontrollü retry uygundur) veya 'test' (retry YOK)
 * olarak sınıflandırır. FAIL-CLOSED: pozitif altyapı kanıtı yoksa 'test' döner.
 *
 * Kanıt sırası:
 *   0) Assertion/selector/visibility imzası → 'test' (deny kazanır).
 *   1) Render edilmiş nginx 5xx sayfası (gatewayStatusFromBodyText) → 'infra'.
 *   2) Gözlemlenen ağ yanıtında 502/503/504 (pickGatewayStatus) → 'infra'.
 *   3) Yapılandırılmış network hata imzası → 'infra'.
 *   4) Aksi halde → 'test'.
 *
 * @param {string} errorText test hata mesajı + stack (güvenli metin)
 * @param {ReadonlyArray<unknown>} [observedStatuses] gözlemlenen HTTP kodları
 * @returns {{ class: 'infra'|'test', reason: string }}
 */
export function classifyFailure(errorText, observedStatuses = []) {
  const text = String(errorText || '');

  if (TEST_FAILURE_SIGNATURES.some((re) => re.test(text))) {
    return { class: 'test', reason: 'ASSERTION_SELECTOR_VISIBILITY' };
  }

  const bodyGw = gatewayStatusFromBodyText(text);
  if (isGatewayStatus(bodyGw)) return { class: 'infra', reason: `GATEWAY_BODY_${bodyGw}` };

  const obsGw = pickGatewayStatus(observedStatuses);
  if (isGatewayStatus(obsGw)) return { class: 'infra', reason: `GATEWAY_OBSERVED_${obsGw}` };

  if (RETRYABLE_NETWORK_PATTERNS.some((re) => re.test(text))) {
    return { class: 'infra', reason: 'NETWORK' };
  }

  return { class: 'test', reason: 'NO_INFRA_EVIDENCE' };
}

/**
 * Başarısızlık listesini kontrollü-retry planına böler. Yalnız 'infra' sınıfı
 * yeniden koşulur (kesin kimliğiyle); 'test' sınıfı doğrudan kırmızı kalır.
 *
 * @param {Array<{ id?: string, file?: string, line?: number, title?: string,
 *   errorText?: string, observedStatuses?: ReadonlyArray<unknown> }>} failures
 * @returns {{ retry: Array<object>, keepRed: Array<object> }}
 */
export function planRetry(failures) {
  const retry = [];
  const keepRed = [];
  for (const f of failures || []) {
    const c = classifyFailure(f.errorText, f.observedStatuses);
    const tagged = { ...f, classification: c };
    if (c.class === 'infra') retry.push(tagged);
    else keepRed.push(tagged);
  }
  return { retry, keepRed };
}
