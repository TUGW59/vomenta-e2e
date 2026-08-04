// @ts-check
/**
 * WP-SURFACE-UNIFIED (FAZ 5) — BİRLEŞİK RAPOR MOTORU (saf kütüphane / ADR-0022).
 *
 * AMAÇ: Envanter (SURFACE-INVENTORY), kapsam derinliği (SURFACE-DEPTH), stil matrisi
 * ve proje durumu (PROJECT-STATUS) raporlarının AYNI kanonik yüzey modelinden türediğini
 * garanti eden tek birleşim (join) + uzlaştırma (reconcile) motoru. FAZ 4 iki ayrı dürüst
 * model üretti (inventory = "üründe var + kayıtlı + sözleşme?"; depth = "L1 runtime + L2
 * stil/etkileşim"); bu motor ikisini rota anahtarında birleştirir, HER kanonik yüzeyin
 * HER raporda TAM BİR KEZ göründüğünü kanıtlar ve `no-contract / not-run / unverified`
 * durumlarını tek, dürüst PROJE DURUMU görünümüne indirger.
 *
 * SAFLIK: Bu dosya YALNIZ saf fonksiyon içerir (dosya sistemi / CLI / prod yan etkisi YOK).
 * Girdi = FAZ 4'ün committed model JSON'ları (inventory + depth). Bu iki model zaten
 * kanonik `PRODUCT_SURFACES`'ten türer → birleşim onları YENİDEN türetmez, UZLAŞTIRIR.
 * Böylece hem gerçek repo ağacını hem TAMAMEN SENTETİK fixture'ları prod'a bağlanmadan
 * doğrularız (self-check-unified-report.mjs).
 *
 * DÜRÜSTLÜK: rollup bir "yeşil rozet" DEĞİL, en düşük-güvenli (fail-closed) sınıftır:
 * runtime koşmadıysa NOT_RUN, dedicated sözleşme yoksa NO_CONTRACT, stil karşılandı ama
 * etkileşim derinliği kanıtsızsa L2_STYLE (unverified). Sahte COMPLETE üretilmez.
 */
import { scanOutputLeaks } from './runtime-report-lib.mjs';

export const SCHEMA_VERSION = 1;

/**
 * Kanonik proje-durumu sınıfları (fail-closed öncelik; worst/blocking-first). Her yüzey
 * TAM BİR sınıfa düşer. `no-contract / not-run / unverified` açıkça ayrı sınıflardır.
 */
export const PROJECT_STATUS = Object.freeze({
  DEPRECATED: 'DEPRECATED',       // üründen kaldırılma sürecinde
  REDIRECT: 'REDIRECT',           // routeKind=redirect (alias)
  BLOCKED: 'BLOCKED',             // fixture/readonly-blocked/staging → koşulamaz
  FAIL: 'FAIL',                   // L1 runtime FAIL (gerçek başarısızlık)
  NOT_RUN: 'NOT_RUN',             // kayıtlı + koşulabilir ama runtime sonucu yok
  NO_CONTRACT: 'NO_CONTRACT',     // L1 açıldı ama dedicated kapsam sözleşmesi YOK
  L1_STYLE_GAP: 'L1_STYLE_GAP',   // L1 açıldı, sözleşme var, zorunlu stil boşluğu var
  L2_STYLE: 'L2_STYLE',           // stil sözleşmesi karşılandı, etkileşim derinliği KANITSIZ (unverified)
  L2_DEEP: 'L2_DEEP',             // stil + tüm geçerli etkileşim boyutu kanıtlı
});
const PROJECT_STATUS_VALUES = new Set(Object.values(PROJECT_STATUS));

/** Envanter durum sözlüğü (surface-inventory-lib ile senkron; burada yalnız okunur). */
const INV = Object.freeze({
  COVERED_CONTRACT: 'COVERED_CONTRACT',
  NO_COVERAGE_CONTRACT: 'NO_COVERAGE_CONTRACT',
  BLOCKED: 'BLOCKED',
  REDIRECT: 'REDIRECT',
  DEPRECATED: 'DEPRECATED',
});

/** L1 runtime durumları (surface-depth-lib STATUS alt kümesi; burada yalnız okunur). */
const L1 = Object.freeze({ PROVEN: 'PROVEN', FAIL: 'FAIL', FLAKY: 'FLAKY', BLOCKED: 'BLOCKED', NOT_RUN: 'NOT_RUN' });
/** L2 durumları. */
const L2 = Object.freeze({ COMPLETE: 'COMPLETE', PARTIAL: 'PARTIAL', NOT_COVERED: 'NOT_COVERED' });

/**
 * Tek yüzey için proje-durumu rollup'ını türetir (fail-closed). Girdi = birleştirilmiş
 * per-yüzey kaydı (aşağıdaki `buildUnifiedModel` üretimi).
 * @param {{ inventoryStatus:string, runtime:{l1:string}, depth:{l2:string} }} rec
 * @returns {string}
 */
export function deriveRollup(rec) {
  const inv = rec.inventoryStatus;
  const l1 = rec.runtime.l1;
  const l2 = rec.depth.l2;
  if (inv === INV.DEPRECATED) return PROJECT_STATUS.DEPRECATED;
  if (inv === INV.REDIRECT) return PROJECT_STATUS.REDIRECT;
  if (inv === INV.BLOCKED || l1 === L1.BLOCKED) return PROJECT_STATUS.BLOCKED;
  if (l1 === L1.FAIL) return PROJECT_STATUS.FAIL;
  if (l1 === L1.NOT_RUN) return PROJECT_STATUS.NOT_RUN;
  // Buradan sonra L1 PROVEN (PASS/FLAKY) — yüzey açıldı.
  if (inv === INV.NO_COVERAGE_CONTRACT) return PROJECT_STATUS.NO_CONTRACT;
  if (l2 === L2.NOT_COVERED) return PROJECT_STATUS.L1_STYLE_GAP;
  if (l2 === L2.PARTIAL) return PROJECT_STATUS.L2_STYLE;
  if (l2 === L2.COMPLETE) return PROJECT_STATUS.L2_DEEP;
  // Ulaşılmamalı: L1 PROVEN + sözleşme var ama L2 bilinmeyen. Fail-closed en düşük sınıf.
  return PROJECT_STATUS.L1_STYLE_GAP;
}

/** Sıralı sayaç (deterministik anahtar sırası). */
function tally(items, keyFn) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const it of items) {
    const k = keyFn(it);
    out[k] = (out[k] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * Envanter modeli + kapsam-derinliği modelini rota anahtarında BİRLEŞTİRİR (SAF).
 * Fırlatmaz; denetlenebilir deterministik birleşik model döndürür. Uzlaştırma hataları
 * `reconciliation` alanında raporlanır (invariant kapısı `validateUnifiedModel` ele alır).
 *
 * @param {object} opts
 * @param {any} opts.inventoryModel  SURFACE-INVENTORY.json parse'ı (kanonik yüzey spine)
 * @param {any} opts.depthModel      SURFACE-DEPTH.json parse'ı (L1 runtime + L2)
 * @param {string|null} [opts.generatedAt]
 */
export function buildUnifiedModel(opts) {
  const inventoryModel = opts.inventoryModel || {};
  const depthModel = opts.depthModel || {};
  const invSurfaces = (inventoryModel.sections && inventoryModel.sections.registeredSurfaces) || [];
  const depthPages = depthModel.pages || [];

  const depthByRoute = new Map();
  for (const p of depthPages) depthByRoute.set(p.route, p);
  const invRoutes = new Set(invSurfaces.map((s) => s.route));

  // Uzlaştırma: iki modelin yüzey/rota spine'ı BİREBİR aynı olmalı (her yüzey her raporda
  // tam bir kez). Asimetri = drift; fail-closed listelenir.
  const reconciliation = {
    inventorySurfaces: invSurfaces.length,
    depthPages: depthPages.length,
    onlyInInventory: invSurfaces.filter((s) => !depthByRoute.has(s.route)).map((s) => s.route).sort(),
    onlyInDepth: depthPages.filter((p) => !invRoutes.has(p.route)).map((p) => p.route).sort(),
  };

  const surfaces = [...invSurfaces]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((s) => {
      const dp = depthByRoute.get(s.route);
      const dL1 = (dp && dp.levels && dp.levels.L1) || { status: L1.NOT_RUN, runtimeStatus: null, reasonCode: 'NO_RUNTIME_RESULT' };
      const dL2 = (dp && dp.levels && dp.levels.L2) || { status: L2.NOT_COVERED, style: {}, interaction: {} };
      const style = dL2.style || {};
      const interaction = dL2.interaction || {};
      const findings = (dp && dp.findings) || [];
      const openFindings = findings.filter((f) => f.status === 'open');

      const rec = {
        id: s.id,
        route: s.route,
        area: s.area,
        parentId: s.parentId ?? null,
        routeKind: s.routeKind,
        lifecycle: s.lifecycle,
        navigation: s.navigation,
        runtimePolicy: s.runtimePolicy,
        baseline: s.baseline,
        inventoryStatus: s.status,
        hasCoverageContract: Boolean(s.hasCoverageContract),
        coverageContractIds: (s.coverageContractIds || []).slice().sort(),
        depthMatched: Boolean(dp),
        runtime: {
          l1: dL1.status,
          runtimeStatus: dL1.runtimeStatus ?? null,
          reasonCode: dL1.reasonCode ?? null,
        },
        depth: {
          l2: dL2.status,
          highest: (dp && dp.highestProvenLevel) || 'L0',
          styleContractMet: Boolean(style.contractMet),
          styleCoveredOrExempt: style.coveredOrExempt ?? 0,
          styleRequiredCount: style.requiredCount ?? 0,
          interactionVerified: Boolean(interaction.verified),
          interactionApplicableCount: interaction.applicableCount ?? 0,
          interactionCoveredCount: interaction.coveredCount ?? 0,
        },
        findings: {
          total: findings.length,
          open: openFindings.length,
          ids: openFindings.map((f) => String(f.id)).sort(),
        },
      };
      rec.rollup = deriveRollup(rec);
      return rec;
    });

  const byRollup = tally(surfaces, (r) => r.rollup);
  const named = {
    deprecated: byRollup[PROJECT_STATUS.DEPRECATED] || 0,
    redirect: byRollup[PROJECT_STATUS.REDIRECT] || 0,
    blocked: byRollup[PROJECT_STATUS.BLOCKED] || 0,
    fail: byRollup[PROJECT_STATUS.FAIL] || 0,
    notRun: byRollup[PROJECT_STATUS.NOT_RUN] || 0,
    noContract: byRollup[PROJECT_STATUS.NO_CONTRACT] || 0,
    l1StyleGap: byRollup[PROJECT_STATUS.L1_STYLE_GAP] || 0,
    l2Style: byRollup[PROJECT_STATUS.L2_STYLE] || 0,
    l2Deep: byRollup[PROJECT_STATUS.L2_DEEP] || 0,
  };
  // "unverified" = stil karşılandı ama en az bir geçerli etkileşim boyutu kanıtsız.
  const interactionUnverified = surfaces.filter(
    (r) => r.depth.interactionApplicableCount > 0 && !r.depth.interactionVerified
  ).length;
  const surfacesWithOpenFindings = surfaces.filter((r) => r.findings.open > 0).length;
  const openFindingsTotal = surfaces.reduce((a, r) => a + r.findings.open, 0);

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: opts.generatedAt ?? null,
    source: {
      sourceCommit: (depthModel.source && depthModel.source.sourceCommit) || null,
      environment: (depthModel.source && depthModel.source.environment) || null,
      browser: (depthModel.source && depthModel.source.browser) || null,
      runtimeGeneratedAt: (depthModel.source && depthModel.source.runtimeGeneratedAt) || null,
      inventorySchemaVersion: inventoryModel.schemaVersion ?? null,
      depthSchemaVersion: depthModel.schemaVersion ?? null,
    },
    reconciliation,
    totals: {
      surfaces: surfaces.length,
      byRollup,
      ...named,
      interactionUnverified,
      surfacesWithOpenFindings,
      openFindingsTotal,
      byArea: tally(surfaces, (r) => r.area),
    },
    surfaces,
  };
}

/**
 * Birleşik model değişmezlerini doğrular (SAF). Boş dizi = geçti. Bu, kullanıcının
 * FAZ 5 sözleşmesidir: "her kanonik surface her raporda TAM BİR KEZ; no-contract/
 * not-run/unverified AÇIK".
 * @param {ReturnType<typeof buildUnifiedModel>} model
 * @returns {string[]}
 */
export function validateUnifiedModel(model) {
  const errs = [];
  if (!model || typeof model !== 'object') return ['Birleşik model nesne değil.'];
  if (model.schemaVersion !== SCHEMA_VERSION) errs.push(`schemaVersion beklenen ${SCHEMA_VERSION} değil: ${model.schemaVersion}`);
  const S = model.surfaces;
  if (!Array.isArray(S) || S.length === 0) {
    errs.push('surfaces boş — sahte-yeşil reddedilir.');
    return errs;
  }

  // Uzlaştırma: iki kaynak modelin spine'ı BİREBİR aynı olmalı (asimetri = drift).
  const r = model.reconciliation || {};
  if ((r.onlyInInventory || []).length) errs.push(`Envanterde olup derinlikte OLMAYAN yüzey(ler): ${r.onlyInInventory.join(', ')}`);
  if ((r.onlyInDepth || []).length) errs.push(`Derinlikte olup envanterde OLMAYAN rota(lar): ${r.onlyInDepth.join(', ')}`);
  if (r.inventorySurfaces !== r.depthPages) errs.push(`Envanter yüzey (${r.inventorySurfaces}) ≠ derinlik rota (${r.depthPages}).`);
  if (S.length !== r.inventorySurfaces) errs.push(`Birleşik surfaces (${S.length}) ≠ envanter yüzey (${r.inventorySurfaces}).`);

  // Her yüzey TAM BİR KEZ (tekil id + tekil rota) + deterministik id sırası.
  const ids = new Set(), routes = new Set();
  for (const rec of S) {
    if (ids.has(rec.id)) errs.push(`Yinelenen yüzey id: ${rec.id}`);
    ids.add(rec.id);
    if (routes.has(rec.route)) errs.push(`Yinelenen yüzey rota: ${rec.route}`);
    routes.add(rec.route);
    if (!PROJECT_STATUS_VALUES.has(rec.rollup)) errs.push(`Bilinmeyen rollup '${rec.rollup}': ${rec.id}`);
    if (!rec.depthMatched) errs.push(`Yüzey derinlik modeliyle eşleşmedi (rota join başarısız): ${rec.id} (${rec.route})`);

    // Rollup ↔ alt-durum tutarlılığı (sahte sınıflama engeli).
    const l1 = rec.runtime.l1, l2 = rec.depth.l2, inv = rec.inventoryStatus;
    if (rec.rollup === PROJECT_STATUS.L2_DEEP && !(l1 === L1.PROVEN && l2 === L2.COMPLETE)) {
      errs.push(`[${rec.id}] L2_DEEP ama L1 PROVEN + L2 COMPLETE değil (l1=${l1}, l2=${l2}).`);
    }
    if (rec.rollup === PROJECT_STATUS.L2_STYLE && !(l1 === L1.PROVEN && l2 === L2.PARTIAL)) {
      errs.push(`[${rec.id}] L2_STYLE ama L1 PROVEN + L2 PARTIAL değil (l1=${l1}, l2=${l2}).`);
    }
    if (rec.rollup === PROJECT_STATUS.NOT_RUN && l1 !== L1.NOT_RUN) {
      errs.push(`[${rec.id}] NOT_RUN ama L1 ${l1}.`);
    }
    if (rec.rollup === PROJECT_STATUS.FAIL && l1 !== L1.FAIL) {
      errs.push(`[${rec.id}] FAIL ama L1 ${l1}.`);
    }
    if (rec.rollup === PROJECT_STATUS.NO_CONTRACT && !(inv === INV.NO_COVERAGE_CONTRACT && rec.hasCoverageContract === false)) {
      errs.push(`[${rec.id}] NO_CONTRACT ama envanter NO_COVERAGE_CONTRACT + sözleşmesiz değil (inv=${inv}, hasContract=${rec.hasCoverageContract}).`);
    }
    if (rec.rollup === PROJECT_STATUS.BLOCKED && !(inv === INV.BLOCKED || l1 === L1.BLOCKED)) {
      errs.push(`[${rec.id}] BLOCKED ama ne envanter BLOCKED ne L1 BLOCKED (inv=${inv}, l1=${l1}).`);
    }
    // hasCoverageContract ↔ coverageContractIds tutarlılığı.
    if (rec.hasCoverageContract !== (rec.coverageContractIds.length > 0)) {
      errs.push(`[${rec.id}] hasCoverageContract (${rec.hasCoverageContract}) ↔ coverageContractIds (${rec.coverageContractIds.length}) tutarsız.`);
    }
  }

  // byRollup toplamı = surfaces (hiçbir yüzey sınıfsız/çift-sınıflı değil).
  const sum = Object.values(model.totals.byRollup || {}).reduce((a, b) => a + b, 0);
  if (sum !== S.length) errs.push(`byRollup toplamı (${sum}) ≠ surfaces (${S.length}).`);

  // Determinizm: id'ye göre sıralı.
  const sorted = [...S].map((x) => x.id).sort();
  if (JSON.stringify(S.map((x) => x.id)) !== JSON.stringify(sorted)) errs.push('surfaces id sırası deterministik değil.');

  // Güvenlik/gizlilik: secret/PII/mutlak-yol sızıntısı YOK.
  errs.push(...scanOutputLeaks(JSON.stringify(model)));
  return errs;
}

/** Deterministik JSON render. */
export function renderProjectStatusJson(model) {
  return JSON.stringify(model, null, 2) + '\n';
}

/** Markdown hücresini kaçır. */
const cell = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();

const ROLLUP_BADGE = {
  [PROJECT_STATUS.DEPRECATED]: '🗑 DEPRECATED',
  [PROJECT_STATUS.REDIRECT]: '↪ REDIRECT',
  [PROJECT_STATUS.BLOCKED]: '⛔ BLOCKED',
  [PROJECT_STATUS.FAIL]: '❌ FAIL',
  [PROJECT_STATUS.NOT_RUN]: '⚪ NOT_RUN',
  [PROJECT_STATUS.NO_CONTRACT]: '🟠 NO_CONTRACT',
  [PROJECT_STATUS.L1_STYLE_GAP]: '🟡 L1·style-gap',
  [PROJECT_STATUS.L2_STYLE]: '🟡 L2·style (unverified)',
  [PROJECT_STATUS.L2_DEEP]: '✅ L2·deep',
};
const L1_BADGE = {
  [L1.PROVEN]: '✅', [L1.FAIL]: '❌', [L1.FLAKY]: '🟡', [L1.BLOCKED]: '⛔', [L1.NOT_RUN]: '⚪',
};

/** İnsan-okur Markdown (deterministik; drift kapısına uygun). */
export function renderProjectStatusMd(model) {
  const t = model.totals;
  const s = model.source;
  const L = [];
  L.push('# Vomenta — Proje Durumu (PROJECT-STATUS)');
  L.push('');
  L.push('> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run report:project-status` (veya `npm run report:all`).');
  L.push('> Kaynak: `docs/raporlar/SURFACE-INVENTORY.json` + `docs/raporlar/SURFACE-DEPTH.json` — İKİSİ DE kanonik');
  L.push('> `tests/contracts/product-surfaces.js`\'ten türer. Bu rapor onları rota anahtarında BİRLEŞTİRİR');
  L.push('> (WP-SURFACE-UNIFIED / FAZ 5 / ADR-0022). Her kanonik yüzey burada TAM BİR KEZ görünür.');
  L.push(`> **Kanıt:** commit \`${s.sourceCommit || '—'}\` · ortam \`${s.environment || '—'}\` · tarayıcı \`${s.browser || '—'}\` · runtime \`${s.runtimeGeneratedAt || '—'}\``);
  L.push('');
  L.push('## Bu rapor neyi kanıtlar / ne kanıtlamaz');
  L.push('');
  L.push('- Her yüzey TEK, fail-closed bir proje-durumu sınıfına düşer. Sınıf bir "yeşil rozet" değildir:');
  L.push('  `NO_CONTRACT` = üründe var + açılıyor ama dedicated kapsam sözleşmesi YOK; `NOT_RUN` = koşulabilir');
  L.push('  ama bu koşumda runtime sonucu yok; `L2·style (unverified)` = stil kanıtlı ama etkileşim derinliği kanıtsız.');
  L.push('- `L2·deep` dışındaki hiçbir sınıf "tam kapsandı" DEĞİLDİR. Rollup, envanter (sözleşme) + derinlik');
  L.push('  (L1 runtime + L2) modellerinin BİRLEŞİMİDİR; iki model rota spine\'ında birebir uzlaşmazsa rapor');
  L.push('  fail-closed kırılır (drift kapısı). L3/L4/L5 (mutation/rol/provider) tasarım gereği bu görünümde yoktur.');
  L.push('');
  L.push('## Özet (türetilmiş — sabit sayı yok)');
  L.push('');
  L.push(`- **Kanonik yüzey:** ${t.surfaces}`);
  L.push(`- **L2·deep:** ${t.l2Deep} · **L2·style (unverified):** ${t.l2Style} · **L1·style-gap:** ${t.l1StyleGap}`);
  L.push(`- **NO_CONTRACT:** ${t.noContract} · **NOT_RUN:** ${t.notRun} · **FAIL:** ${t.fail} · **BLOCKED:** ${t.blocked} · **REDIRECT:** ${t.redirect} · **DEPRECATED:** ${t.deprecated}`);
  L.push(`- **Etkileşim derinliği doğrulanmayan (unverified) yüzey:** ${t.interactionUnverified}`);
  L.push(`- **Açık bulgu:** ${t.openFindingsTotal} (${t.surfacesWithOpenFindings} yüzeyde)`);
  L.push('');
  L.push('### Rollup dağılımı');
  L.push('');
  L.push('| durum | yüzey |');
  L.push('|---|--:|');
  for (const [k, n] of Object.entries(t.byRollup)) L.push(`| ${cell(ROLLUP_BADGE[k] || k)} | ${n} |`);
  L.push('');
  L.push('### Alan (area) dağılımı');
  L.push('');
  L.push('| alan | yüzey |');
  L.push('|---|--:|');
  for (const [area, n] of Object.entries(t.byArea)) L.push(`| ${cell(area)} | ${n} |`);
  L.push('');

  L.push('## Tüm kanonik yüzeyler (her yüzey tam bir kez)');
  L.push('');
  L.push('| id | route | area | sözleşme | L1 | L2 | etkileşim (kanıtlı/geçerli) | en yüksek | açık bulgu | PROJE DURUMU |');
  L.push('|---|---|---|:--:|:--:|---|:--:|---|--:|---|');
  for (const r of model.surfaces) {
    const l1 = L1_BADGE[r.runtime.l1] || cell(r.runtime.l1);
    const ix = `${r.depth.interactionCoveredCount}/${r.depth.interactionApplicableCount}`;
    L.push(
      `| ${cell(r.id)} | ${cell(r.route)} | ${cell(r.area)} | ${r.hasCoverageContract ? '✔' : '—'} | ${l1} | ${cell(r.depth.l2)} | ${ix} | ${cell(r.depth.highest)} | ${r.findings.open || '—'} | ${cell(ROLLUP_BADGE[r.rollup] || r.rollup)} |`
    );
  }
  L.push('');
  return L.join('\n') + '\n';
}
