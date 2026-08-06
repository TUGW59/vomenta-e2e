#!/usr/bin/env node
// @ts-check
/**
 * WP-EVIDENCE FAZ 4 (ADR-0026 §4-§6) — Rapor↔index DÜRÜSTLÜK kapısı.
 *
 * Kanıt: raporda (`docs/raporlar/BULGULAR.md`) index-kaynaklı görünür kanıt satırı
 * ("maskeli kanıt `…`"), YALNIZ commit'li `evidence-index.json` içinde artifactPath'i
 * olan bulgular için çıkar — ne eksik ne fazla:
 *
 *   A) İki-yönlü eşitlik: BULGULAR.md'deki index-kanıt işaretli bulgu kümesi ===
 *      evidence-index.json'daki (artifactPath'li) bulgu kümesi. Böylece:
 *        - index `{}` iken raporda HİÇBİR görünür (index) kanıt çıkmaz (dürüstlük),
 *        - index'te olmayan bulgu için UYDURMA kanıt basılamaz,
 *        - index'te olan bulgunun kanıtı raporda kaybolmaz.
 *   B) Determinizm: capturedAt/expiry commit'li index'ten OKUNUR; render bunları
 *      HESAPLAMAZ. Bu kapı yalnız commit'li iki artefaktı karşılaştırır (drift-hizalı).
 *
 * NEGATİF meta-test: hem "index'te var ama raporda yok" hem "raporda var ama index'te
 * yok" durumlarını sentetik örnekle yakaladığını kanıtlar.
 *
 * Çalıştır: npm run quality:findings-evidence   (quality:check içinde)
 * Not: BULGULAR.md güncel olmalı (drift kapısı `report:findings:check` bunu sağlar).
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/raporlar');

// Raporun index-kaynaklı kanıt satırının değişmez işareti (generate-findings.mjs ile eş).
const INDEX_EVIDENCE_MARKER = 'maskeli kanıt `';
// Bulgu kartı başlığı: **[ID] başlık** — …
const CARD_RE = /^\*\*\[([A-Za-z0-9._-]+)\]/;
const KANIT_RE = /^-\s+\*\*Kanıt:\*\*/;

/**
 * BULGULAR.md içeriğinden, index-kaynaklı görünür kanıtı OLAN bulgu id kümesini çıkar.
 * @param {string} md
 * @returns {Set<string>}
 */
export function findingsWithIndexEvidence(md) {
  const set = new Set();
  let current = null;
  for (const line of md.split('\n')) {
    const card = CARD_RE.exec(line);
    if (card) { current = card[1]; continue; }
    if (current && KANIT_RE.test(line) && line.includes(INDEX_EVIDENCE_MARKER)) {
      set.add(current);
    }
  }
  return set;
}

/**
 * evidence-index.json nesnesinden, artifactPath'i olan bulgu id kümesi.
 * @param {Record<string, any>} index
 * @returns {Set<string>}
 */
export function findingsInIndex(index) {
  const set = new Set();
  for (const [id, rec] of Object.entries(index || {})) {
    if (rec && typeof rec === 'object' && typeof rec.artifactPath === 'string' && rec.artifactPath) {
      set.add(id);
    }
  }
  return set;
}

/** Saf karşılaştırma: iki kümeyi kıyasla; ihlalleri döndür. */
export function diffSets(reportSet, indexSet) {
  const inReportNotIndex = [...reportSet].filter((id) => !indexSet.has(id)).sort();
  const inIndexNotReport = [...indexSet].filter((id) => !reportSet.has(id)).sort();
  return { inReportNotIndex, inIndexNotReport };
}

function loadIndex() {
  const p = resolve(outDir, 'evidence-index.json');
  if (!existsSync(p)) return {};
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function runNegativeMetaTest() {
  // "raporda var, index'te yok" yakalanmalı.
  const mdFab = '**[X1] uydurma**\n- **Kanıt:** maskeli kanıt `a/b.png` ([CI koşumu](https://x))\n';
  const d1 = diffSets(findingsWithIndexEvidence(mdFab), findingsInIndex({}));
  if (d1.inReportNotIndex.length !== 1 || d1.inReportNotIndex[0] !== 'X1') {
    throw new Error('meta-test BAŞARISIZ: uydurma (raporda-var/index-yok) yakalanmadı.');
  }
  // "index'te var, raporda yok" yakalanmalı.
  const mdNone = '**[X2] kanıtsız**\n- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_\n';
  const idx = { X2: { artifactPath: 'a/b.png', runUrl: '', expiry: '', capturedAt: '' } };
  const d2 = diffSets(findingsWithIndexEvidence(mdNone), findingsInIndex(idx));
  if (d2.inIndexNotReport.length !== 1 || d2.inIndexNotReport[0] !== 'X2') {
    throw new Error('meta-test BAŞARISIZ: kayıp kanıt (index-var/raporda-yok) yakalanmadı.');
  }
}

function main() {
  runNegativeMetaTest();

  const mdPath = resolve(outDir, 'BULGULAR.md');
  if (!existsSync(mdPath)) {
    console.error('self-check-findings-evidence HATA — docs/raporlar/BULGULAR.md yok (önce: npm run report:build).');
    process.exit(1);
  }
  const md = readFileSync(mdPath, 'utf8');
  const index = loadIndex();

  const reportSet = findingsWithIndexEvidence(md);
  const indexSet = findingsInIndex(index);
  const { inReportNotIndex, inIndexNotReport } = diffSets(reportSet, indexSet);

  if (inReportNotIndex.length || inIndexNotReport.length) {
    console.error('✗ Rapor↔evidence-index DÜRÜSTLÜK ihlali:');
    if (inReportNotIndex.length) {
      console.error(`  - Raporda index-kanıtı VAR ama index'te YOK (uydurma?): ${inReportNotIndex.join(', ')}`);
    }
    if (inIndexNotReport.length) {
      console.error(`  - Index'te kanıt VAR ama raporda YOK (kayıp; BULGULAR.md güncelle: npm run report:build): ${inIndexNotReport.join(', ')}`);
    }
    process.exit(1);
  }

  const n = indexSet.size;
  console.log(
    `✔ Rapor↔evidence-index dürüstlük OK — ${n} bulgu index-kanıtlı` +
    `${n === 0 ? ' (index boş → raporda görünür index kanıtı yok; dürüst "Kanıt: yok")' : ''}.`
  );
}

function isMain() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
if (isMain()) main();
