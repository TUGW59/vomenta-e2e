// @ts-check
/**
 * WP-R2 — Yapılan/Yapılmayan test raporları.
 * Kaynak: `playwright test --list` (statik collection — ÇALIŞTIRMAZ) + registry/envanterler.
 * Yazar (repo): docs/raporlar/YAPILAN-TESTLER.md + YAPILMAYAN-TESTLER.md
 *
 * DÜRÜSTLÜK KURALLARI (WP-R2):
 * - "Test var" ≠ "kapsam tamamlandı". Rapor listeden üretilir; testlerin çalıştığını GÖSTERMEZ.
 * - Hiçbir kayıt `executed`/`verified`/`high` değildir (gerçek koşum kanıtı bu kapsamda değil).
 * - Yalnız başlık/list'ten çıkarılan değerler `partial|generic` + `low|medium` confidence.
 * - Yapılmayanlar yalnız skip/fixme'den değil; navigation + tested-pages + spec + coverage-exclusions
 *   envanter KARŞILAŞTIRMASIYLA çıkarılır. Tam yüzey garantisi WP-03 Surface Manifest sonrası.
 *
 * Çalıştır: npm run report:test-report
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { loadPlaywrightList, areaOf, mdCell, scanSkipsAndFixmes } from './report-lib.mjs';
import { MAIN_NAVIGATION } from '../tests/contracts/navigation.js';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import { COVERAGE_EXCLUSIONS, COVERAGE_TODO } from '../tests/contracts/coverage-exclusions.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/raporlar');
mkdirSync(outDir, { recursive: true });
const rel = (p) => relative(root, p).split('\\').join('/');

// WP-00'da tespit edilen, kayıtlı olmayan keşif rotaları (kanıt: discovery-baseline).
const UNREGISTERED_DISCOVERED = ['/campaigns/outbound', '/channels/sms', '/settings/organization', '/settings/profile'];
const BASELINE_SPEC = 'quality-baseline.authed.spec.js';

// ── YAPILAN TESTLER ──────────────────────────────────────────────────────────
const specs = loadPlaywrightList(root);

function classify(s) {
  const skipped = s.expectedStatus === 'skipped';
  const isFixme = skipped && (s.annotations || []).some((a) => a.type === 'fixme');
  const executionStatus = isFixme ? 'fixme' : skipped ? 'skipped' : 'listed-only';
  const lvl = /\bL([123])\b/.exec(s.title);
  const evidenceLevel = lvl ? `L${lvl[1]}` : '—';
  let coverageStatus, confidence;
  if (skipped) { coverageStatus = 'blocked'; confidence = 'low'; }
  else if (s.file === BASELINE_SPEC) { coverageStatus = 'generic'; confidence = 'low'; }
  else { coverageStatus = 'partial'; confidence = 'medium'; }
  // provenance: değerlerin kaynağı — hiçbiri manuel-doğrulama değil.
  const provenance = evidenceLevel === '—' ? 'list-exec' : 'list-exec+title-inferred';
  return { executionStatus, evidenceLevel, coverageStatus, confidence, provenance };
}

const rows = specs.map((s) => ({ ...s, area: areaOf(s.file), ...classify(s) }));
const cleanTitle = (t) => t.replace(/\s*@[\w-]+/g, '').trim();

const A = [];
A.push('# Vomenta — Yapılan Testler Raporu');
A.push('');
A.push('> ⚙️ **Otomatik üretilir** (`npm run report:test-report`). Kaynak: `playwright test --list` (statik collection).');
A.push('> **UYARI:** Bu rapor testlerin **listelendiğini** gösterir, **çalıştığını değil.** Hiçbir kayıt `executed`/`verified`/`high` değildir (gerçek koşum kanıtı — JUnit/trace — bu kapsamda değil). `generic` = ortak baseline; **"kapsam tamamlandı" anlamına gelmez.**');
A.push('');
A.push('Kolonlar: `coverageStatus` (verified|partial|generic|blocked) · `evidenceLevel` (L1|L2|L3) · `executionStatus` (executed|listed-only|skipped|fixme) · `confidence` (high|medium|low) · `provenance` (değerin kaynağı).');
A.push('');
// Özet
const cs = (k) => rows.filter((r) => r.coverageStatus === k).length;
const es = (k) => rows.filter((r) => r.executionStatus === k).length;
A.push('## Özet');
A.push('');
A.push(`- **Listelenen test:** ${rows.length} / ${new Set(rows.map((r) => r.file)).size} dosya`);
A.push(`- **coverageStatus:** verified ${cs('verified')} · partial ${cs('partial')} · generic ${cs('generic')} · blocked ${cs('blocked')}`);
A.push(`- **executionStatus:** executed ${es('executed')} · listed-only ${es('listed-only')} · skipped ${es('skipped')} · fixme ${es('fixme')}`);
A.push('> `executed`/`verified` = 0: bu üreteç testleri çalıştırmaz; gerçek koşum WP-R2 dışıdır.');
A.push('');
// Alan × coverageStatus özet tablosu
const areas = [...new Set(rows.map((r) => r.area))].sort();
A.push('## Alan × kapsam özeti');
A.push('');
A.push('| alan | toplam | partial | generic | blocked |');
A.push('|---|---|---|---|---|');
for (const area of areas) {
  const ar = rows.filter((r) => r.area === area);
  A.push(`| ${area} | ${ar.length} | ${ar.filter((r) => r.coverageStatus === 'partial').length} | ${ar.filter((r) => r.coverageStatus === 'generic').length} | ${ar.filter((r) => r.coverageStatus === 'blocked').length} |`);
}
A.push('');
// Dosya bazlı ayrıntı
A.push('## Ayrıntı (dosya bazlı)');
A.push('');
const files = [...new Set(rows.map((r) => r.file))].sort((a, b) => areaOf(a).localeCompare(areaOf(b)) || a.localeCompare(b));
for (const file of files) {
  A.push(`### \`${file}\` — _${areaOf(file)}_`);
  A.push('');
  A.push('| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |');
  A.push('|---|---|---|---|---|---|---|');
  for (const r of rows.filter((x) => x.file === file)) {
    A.push(`| ${mdCell(cleanTitle(r.title))} | ${mdCell(r.tags.map((t) => '@' + t).join(' '))} | ${r.evidenceLevel} | ${r.executionStatus} | ${r.coverageStatus} | ${r.confidence} | ${r.provenance} |`);
  }
  A.push('');
}
writeFileSync(resolve(outDir, 'YAPILAN-TESTLER.md'), A.join('\n'));

// ── YAPILMAYAN TESTLER ───────────────────────────────────────────────────────
const skips = scanSkipsAndFixmes(resolve(root, 'tests'), rel);
const TIER_A_RE = /staging|mutation|prod|teardown|DELETE|gerçek çağrı|gerçek SMS|force|queue|davet|coaching|yıkıc|destructive|dış servis/i;
const tierA = skips.filter((s) => TIER_A_RE.test(s.reason));
const tierB = skips.filter((s) => !TIER_A_RE.test(s.reason));

// Envanter karşılaştırması
const registeredRoutes = new Set(TESTED_PAGES.flatMap((p) => p.routes || []));
const navOnlyGeneric = MAIN_NAVIGATION.filter((n) => !TESTED_PAGES.some((p) => (p.routes || []).includes(n.path) && p.id !== 'main-navigation'));

const B = [];
B.push('# Vomenta — Yapılmayan / Kısıtlı Testler Raporu');
B.push('');
B.push('> ⚙️ **Otomatik üretilir** (`npm run report:test-report`). Envanter KARŞILAŞTIRMASI: `navigation.js` + `tested-pages.js` + spec dosyaları + `coverage-exclusions.js` + `skip/fixme`.');
B.push('> **KAPSAM NOTU:** Bu rapor mevcut rota/sözleşme envanterine göredir; **tam ürün yüzeyi garantisi WP-03 (Surface Manifest) sonrasında** sağlanır. Şu an kayıtlı olmayan yüzeyler eksik görünebilir.');
B.push('');
B.push('## Katman A — Yapılabilir ama İZİN / özel istek gerektiren');
B.push('');
B.push('Güvenlik gereği prod\'da çalıştırılmaz (veri değiştirir / dış yan etki / staging gerekir). Ayrılmış staging tenant + açık istek ile açılır.');
B.push('');
B.push('### coverage-exclusions (bilinçli, güvenlik)');
B.push('');
B.push('| kontrol | sayfa | neden | kategori |');
B.push('|---|---|---|---|');
for (const e of COVERAGE_EXCLUSIONS) B.push(`| ${mdCell(e.control)} | ${mdCell(e.pages)} | ${mdCell(e.reason)} | \`${e.category}\` |`);
B.push('');
B.push('### staging/mutation bekleyen test.fixme/skip');
B.push('');
B.push('| dosya:satır | tür | gerekçe |');
B.push('|---|---|---|');
for (const s of tierA) B.push(`| ${mdCell(s.file)}:${s.line} | ${s.kind} | ${mdCell(s.reason)} |`);
B.push('');
B.push('## Katman B — Yapılmayan (diğer sebepler)');
B.push('');
B.push('### Veri-bağımlı / data-testid bekleyen / dil-koşullu skip & fixme');
B.push('');
B.push('| dosya:satır | tür | gerekçe |');
B.push('|---|---|---|');
for (const s of tierB) B.push(`| ${mdCell(s.file)}:${s.line} | ${s.kind} | ${mdCell(s.reason)} |`);
B.push('');
B.push('### İncelendi, standart test edilemedi (coverage-TODO)');
B.push('');
B.push('| kontrol | sayfa |');
B.push('|---|---|');
for (const e of COVERAGE_TODO) B.push(`| ${mdCell(e.control)} | ${mdCell(e.pages)} |`);
B.push('');
B.push('### Yüzey boşluğu (envanter karşılaştırması)');
B.push('');
B.push('- **Rota-bazlı arketip/derin kapsam yok** (yalnız generic baseline ile örtülü) — sıradaki nav yüzeyleri WP-04/WP-06 bekliyor:');
B.push(`  ${navOnlyGeneric.map((n) => `\`${n.path}\``).join(' · ')}`);
B.push('- **WP-00\'da keşfedilen kayıtsız rotalar** (tested-pages\'te tam sözleşme yok):');
B.push(`  ${UNREGISTERED_DISCOVERED.map((r) => `\`${r}\``).join(' · ')}`);
B.push(`- Kayıtlı arketip rotaları (tested-pages, main-navigation dışı): ${[...registeredRoutes].length} adet — çoğunlukla \`reports\` alt rotaları.`);
B.push('');
writeFileSync(resolve(outDir, 'YAPILMAYAN-TESTLER.md'), B.join('\n'));

console.log(
  `Test raporları yazıldı: docs/raporlar/YAPILAN-TESTLER.md (${rows.length} test) + YAPILMAYAN-TESTLER.md ` +
  `(katman A: ${COVERAGE_EXCLUSIONS.length} exclusion + ${tierA.length} staging-fixme; katman B: ${tierB.length} diğer + ${navOnlyGeneric.length} yüzey boşluğu).`
);
