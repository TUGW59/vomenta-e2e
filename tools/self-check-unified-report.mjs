// @ts-check
/**
 * UNIFIED-REPORT SELF-CHECK — SERT KAPI (WP-SURFACE-UNIFIED / FAZ 5 / ADR-0022).
 *
 * İKİ ŞEYİ kanıtlar:
 *   1) GERÇEK repo ağacı: committed SURFACE-INVENTORY.json + SURFACE-DEPTH.json rota
 *      anahtarında birleşir; iki model spine'ı BİREBİR uzlaşır (asimetri = 0), her
 *      kanonik yüzey TAM BİR KEZ, sızıntı yok, deterministik, rollup enum'u tutarlı.
 *   2) SENTETİK NEGATİFLER gerçekten non-zero: spine asimetrisi (yüzey düş/ekle), duplicate
 *      id, mislabeled rollup (NOT_RUN→L2_DEEP, sözleşmesiz→NO_CONTRACT ihlali), bilinmeyen
 *      enum, bozuk sıralama, secret/PII/mutlak-yol sızıntısı → validateUnifiedModel KIRILIR.
 *
 * Negatifler TAMAMEN SENTETİK küçük bir inventory+depth çifti üzerinde kurulur (committed
 * dosyaya bağlı değil) → motor mantığı prod'a/dosyaya bağlanmadan doğrulanır.
 *
 * SAF/SENTETİK — production'a trafik/mutation YOK.
 * Çalıştır:  node tools/self-check-unified-report.mjs   (npm run quality:unified-report)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  buildUnifiedModel,
  validateUnifiedModel,
  renderProjectStatusJson,
  renderProjectStatusMd,
  deriveRollup,
  PROJECT_STATUS,
} from './unified-report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);
const readJson = (rel) => { try { return JSON.parse(readFileSync(resolve(root, rel), 'utf8')); } catch { return null; } };

// ─────────────────── SENTETİK fixture fabrikaları ───────────────────
/** Minimal envanter yüzeyi (buildUnifiedModel'in okuduğu alanlar). */
function invSurface(id, route, over = {}) {
  return {
    id, route, area: id.split('-')[0], parentId: null, routeKind: 'static', lifecycle: 'active',
    navigation: 'sub', runtimePolicy: 'readonly-baseline', baseline: 'runnable',
    hasCoverageContract: true, coverageContractIds: [`${id}-contract`],
    evidenceTypes: ['spec'], status: 'COVERED_CONTRACT',
    ...over,
  };
}
/** Minimal derinlik sayfası (route eşleşmeli). */
function depthPage(route, over = {}) {
  const {
    l1 = 'PROVEN', runtimeStatus = 'PASS', l2 = 'COMPLETE',
    styleContractMet = true, ixVerified = true, ixApplicable = 1, ixCovered = 1,
    findings = [], highest = 'L2_DEEP',
  } = over;
  return {
    route, heading: null, contracts: ['c'], highestProvenLevel: highest,
    levels: {
      L1: { status: l1, runtimeStatus, reasonCode: l1 === 'NOT_RUN' ? 'NO_RUNTIME_RESULT' : null },
      L2: {
        status: l2,
        style: { contractMet: styleContractMet, coveredOrExempt: 5, requiredCount: 5 },
        interaction: { verified: ixVerified, applicableCount: ixApplicable, coveredCount: ixCovered },
      },
      L3: { status: 'NOT_APPLICABLE' }, L4: { status: 'BLOCKED' }, L5: { status: 'BLOCKED' },
    },
    findings,
  };
}
/** Küçük ama TEMSİLİ bir inventory+depth çifti (her rollup sınıfından örnek). */
function makeSyntheticPair() {
  const inventoryModel = {
    schemaVersion: 1,
    sections: {
      registeredSurfaces: [
        invSurface('a-deep', '/a'),                                                   // L2_DEEP
        invSurface('b-style', '/b'),                                                  // L2_STYLE (ix unverified)
        invSurface('c-nocontract', '/c', { hasCoverageContract: false, coverageContractIds: [], status: 'NO_COVERAGE_CONTRACT' }),
        invSurface('d-notrun', '/d'),                                                 // NOT_RUN
        invSurface('e-blocked', '/e', { status: 'BLOCKED', baseline: 'blocked', runtimePolicy: 'readonly-blocked' }),
      ],
    },
  };
  const depthModel = {
    schemaVersion: 1,
    source: { sourceCommit: 'deadbeef', environment: 'production-read-only', browser: 'chromium', runtimeGeneratedAt: null },
    pages: [
      depthPage('/a', { l2: 'COMPLETE', ixVerified: true, ixApplicable: 1, ixCovered: 1, highest: 'L2_DEEP' }),
      depthPage('/b', { l2: 'PARTIAL', ixVerified: false, ixApplicable: 2, ixCovered: 1, highest: 'L2_STYLE' }),
      depthPage('/c', { l2: 'NOT_COVERED', styleContractMet: false, ixVerified: false, ixApplicable: 0, ixCovered: 0, highest: 'L1' }),
      depthPage('/d', { l1: 'NOT_RUN', runtimeStatus: null, l2: 'NOT_COVERED', styleContractMet: false, ixApplicable: 0, ixCovered: 0, highest: 'L0' }),
      depthPage('/e', { l1: 'NOT_RUN', runtimeStatus: null, l2: 'NOT_COVERED', styleContractMet: false, ixApplicable: 0, ixCovered: 0, highest: 'L0' }),
    ],
  };
  return { inventoryModel, depthModel };
}

// ─────────────────── 1) GERÇEK ağaç YEŞİL ───────────────────
const invReal = readJson('docs/raporlar/SURFACE-INVENTORY.json');
const depReal = readJson('docs/raporlar/SURFACE-DEPTH.json');
if (!invReal || !depReal) {
  fail('GERÇEK model dosyaları okunamadı (SURFACE-INVENTORY.json / SURFACE-DEPTH.json). Önce: npm run report:all.');
} else {
  const real = buildUnifiedModel({ inventoryModel: invReal, depthModel: depReal, generatedAt: null });
  const realErrs = validateUnifiedModel(real);
  if (realErrs.length) { fail(`GERÇEK birleşik model geçersiz (${realErrs.length}):`); for (const e of realErrs) fail('  · ' + e); }
  const invCount = invReal.sections.registeredSurfaces.length;
  if (real.totals.surfaces !== invCount) fail(`Birleşik yüzey (${real.totals.surfaces}) ≠ envanter yüzey (${invCount}).`);
  if (real.reconciliation.onlyInInventory.length || real.reconciliation.onlyInDepth.length) {
    fail(`GERÇEK ağaçta spine asimetrisi: onlyInv=${real.reconciliation.onlyInInventory.length} onlyDep=${real.reconciliation.onlyInDepth.length}`);
  }
  // byRollup toplamı = yüzey (her yüzey tam bir sınıf).
  const sum = Object.values(real.totals.byRollup).reduce((a, b) => a + b, 0);
  if (sum !== real.totals.surfaces) fail(`byRollup toplamı (${sum}) ≠ yüzey (${real.totals.surfaces}).`);
  // determinizm: iki üretim bit-identical.
  const again = buildUnifiedModel({ inventoryModel: invReal, depthModel: depReal, generatedAt: null });
  if (renderProjectStatusJson(real) !== renderProjectStatusJson(again)) fail('Birleşik JSON determinist değil.');
  if (!renderProjectStatusMd(real).includes('PROJECT-STATUS')) fail('MD render başlığı eksik.');
}

// ─────────────────── 2) SENTETİK: pozitif taban + rollup örnekleri ───────────────────
{
  const { inventoryModel, depthModel } = makeSyntheticPair();
  const m = buildUnifiedModel({ inventoryModel, depthModel, generatedAt: null });
  if (validateUnifiedModel(m).length !== 0) fail('Sentetik geçerli çift reddedildi (yanlış-pozitif).');
  const by = Object.fromEntries(m.surfaces.map((s) => [s.id, s.rollup]));
  const expect = {
    'a-deep': PROJECT_STATUS.L2_DEEP,
    'b-style': PROJECT_STATUS.L2_STYLE,
    'c-nocontract': PROJECT_STATUS.NO_CONTRACT,
    'd-notrun': PROJECT_STATUS.NOT_RUN,
    'e-blocked': PROJECT_STATUS.BLOCKED,
  };
  for (const [id, r] of Object.entries(expect)) {
    if (by[id] !== r) fail(`Rollup beklenen ${r} değil: ${id} → ${by[id]}`);
  }
  // rollup precedence: NOT_RUN, NO_CONTRACT'tan ÖNCE gelir (koşmadıysak kapsam iddia edilemez).
  if (deriveRollup({ inventoryStatus: 'NO_COVERAGE_CONTRACT', runtime: { l1: 'NOT_RUN' }, depth: { l2: 'NOT_COVERED' } }) !== PROJECT_STATUS.NOT_RUN) {
    fail('Precedence hatası: sözleşmesiz + NOT_RUN → NOT_RUN olmalı.');
  }
  // FLAKY runtime PROVEN gibi sınıflanır (retry-pass yüzey yüklendi).
  if (deriveRollup({ inventoryStatus: 'COVERED_CONTRACT', runtime: { l1: 'FLAKY' }, depth: { l2: 'COMPLETE' } }) !== PROJECT_STATUS.L2_DEEP) {
    fail('FLAKY + COMPLETE → L2_DEEP olmalı (yüzey yüklendi).');
  }
}

// ─────────────────── 3) SENTETİK NEGATİFLER (fail-closed) ───────────────────
const expectInvalid = (label, mutate) => {
  const { inventoryModel, depthModel } = makeSyntheticPair();
  mutate(inventoryModel, depthModel);
  const m = buildUnifiedModel({ inventoryModel, depthModel, generatedAt: null });
  if (validateUnifiedModel(m).length === 0) fail(`Sentetik negatif GEÇTİ (beklenen: reddedilir): ${label}`);
};
// spine: envanterde var, derinlikte YOK
expectInvalid('spine: envanterde olup derinlikte olmayan', (inv, dep) => { dep.pages.pop(); });
// spine: derinlikte var, envanterde YOK
expectInvalid('spine: derinlikte olup envanterde olmayan', (inv, dep) => { dep.pages.push(depthPage('/zz')); });
// duplicate id + rota
expectInvalid('duplicate yüzey', (inv, dep) => { inv.sections.registeredSurfaces.push({ ...inv.sections.registeredSurfaces[0] }); dep.pages.push(depthPage('/a')); });

// mislabeled rollup → validateUnifiedModel model.surfaces[].rollup'ı doğrular. buildUnifiedModel
// rollup'ı deriveRollup ile üretir; onu ELLE bozmak için modeli kurup surfaces'i mutasyona uğratıp
// tekrar validate ediyoruz (rollup ↔ alt-durum tutarlılık kapısı).
const mutateBuilt = (label, mutate) => {
  const { inventoryModel, depthModel } = makeSyntheticPair();
  const m = buildUnifiedModel({ inventoryModel, depthModel, generatedAt: null });
  mutate(m);
  if (validateUnifiedModel(m).length === 0) fail(`Sentetik negatif GEÇTİ (beklenen: reddedilir): ${label}`);
};
mutateBuilt('NOT_RUN yüzey L2_DEEP etiketlendi', (m) => { const s = m.surfaces.find((x) => x.id === 'd-notrun'); s.rollup = PROJECT_STATUS.L2_DEEP; });
mutateBuilt('sözleşmeli yüzey NO_CONTRACT etiketlendi', (m) => { const s = m.surfaces.find((x) => x.id === 'a-deep'); s.rollup = PROJECT_STATUS.NO_CONTRACT; });
mutateBuilt('bilinmeyen rollup enum', (m) => { m.surfaces[0].rollup = 'BOGUS'; });
mutateBuilt('hasCoverageContract ↔ ids tutarsız', (m) => { const s = m.surfaces.find((x) => x.id === 'c-nocontract'); s.hasCoverageContract = true; });
mutateBuilt('byRollup toplamı bozuk', (m) => { const k = Object.keys(m.totals.byRollup)[0]; m.totals.byRollup[k] += 7; });
mutateBuilt('secret/PII/mutlak-yol sızıntısı', (m) => { m.surfaces[0].leak = '/Users/someone/secret/token Bearer abc.def'; });
mutateBuilt('boş surfaces', (m) => { m.surfaces = []; });
mutateBuilt('yanlış schemaVersion', (m) => { m.schemaVersion = 999; });
mutateBuilt('surfaces sırası deterministik değil', (m) => { m.surfaces.reverse(); });

// ─────────────────── Sonuç ───────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} unified-report self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Unified-report self-check geçti: GERÇEK envanter+derinlik rota spine\'ında birebir uzlaştı ' +
    '(her kanonik yüzey tam bir kez); sentetik rollup örnekleri (deep/style/no-contract/not-run/blocked) ' +
    'doğru; tüm sentetik negatifler (spine asimetrisi/duplicate/mislabel/enum/sıralama/sızıntı) fail-closed reddedildi.'
);
