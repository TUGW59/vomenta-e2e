// @ts-check
/**
 * STİL KAPSAMA — SERT KAPI.
 *
 * tests/contracts/tested-pages.js'teki her sayfa için, arketipinden türeyen ZORUNLU test
 * stillerinin ya kapsandığını (etiket var) ya da açık N/A ile beyan edildiğini dayatır.
 * Bir EKSİK (❌) veya geçersiz etiket varsa exit 1 → CI/quality:check kırılır.
 *
 * Etiketler Playwright'ın makine-okur listesinden (`--list --reporter=json`, `sp.tags`) gelir —
 * JSDoc token'ları (@type/@param) ASLA karışmaz. Prod'da @mutation testleri grepInvert ile
 * listeden düşmesin diye çocuk sürece ALLOW_MUTATING_TESTS=true geçilir (yalnızca --list; koşum yok).
 *
 * Çalıştır:  node tools/style-coverage.mjs   (veya: npm run quality:styles)
 * Çıktı:     docs/TEST_STYLE_MATRIX.md
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { TESTED_PAGES } from '../tests/contracts/tested-pages.js';
import { MAIN_NAVIGATION } from '../tests/contracts/navigation.js';
import { PRODUCT_SURFACES } from '../tests/contracts/product-surfaces.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Baş '@' ve sondaki noktalama (ör. parantez içi başlıktan gelen "@mutation)") temizlenir;
// tag semantik olarak `@[\w-]+`'tir. Böylece "(staging @mutation)" → "mutation".
const norm = (t) => String(t).replace(/^@/, '').replace(/[^\w-]+$/, '');

// Kanonik etiket kaydı (AGENTS.md → "Test sınıfları" ile senkron). @'siz saklanır.
const ALLOWED_TAGS = new Set([
  // risk / yapı
  'smoke', 'critical', 'regression', 'mutation', 'known-bug', 'public', 'route-baseline', 'security',
  // rota baseline runtime-policy türleri (WP-SURFACE-MIGRATION / FAZ 3): koşulamayan
  // yüzeyler (fixture/blocked/staging) `@route-blocked` ile fixme, redirect yüzeyler
  // `@route-redirect` ile üretilir. Stil kapısını etkilemez; yalnız bilinen etiket kaydı.
  'route-blocked', 'route-redirect',
  // stiller
  'i18n', 'a11y', 'layout', 'visual', 'errorpath', 'clean', 'perf', 'keyboard', 'deeplink', 'data', 'export',
  // L2 etkileşim derinliği makine-okur işaretleri (WP-L2-WAVE-1 / ADR-0014). Stil kapısını
  // etkilemez (BASELINE/CONDITIONAL'da değil); yalnız bilinen etiket kaydına eklenir ki
  // etkileşim spec'leri "geçersiz etiket" (exit 1) tetiklemesin. Surface matrisi tüketir.
  'ix-tabs', 'ix-filter', 'ix-table', 'ix-pagination', 'ix-empty', 'ix-loading',
]);

// Her sayfada zorunlu (N/A OLAMAZ).
const BASELINE = ['smoke', 'i18n', 'a11y', 'layout', 'clean', 'deeplink', 'regression'];

// Arketipe bağlı zorunlu stiller.
const CONDITIONAL = [
  { tag: 'keyboard', when: (a) => a.hasDialogs || a.hasTabs },
  { tag: 'errorpath', when: (a) => a.hasData },
  { tag: 'visual', when: (a) => a.hasStableUI },
  { tag: 'perf', when: (a) => a.hasCharts },
  { tag: 'data', when: (a) => a.hasNumericKpis },
  { tag: 'export', when: (a) => a.hasExport },
  { tag: 'mutation', when: (a) => a.hasWrites },
];

// Matriste gösterilecek sütun sırası.
const STYLE_COLUMNS = [
  'smoke', 'i18n', 'a11y', 'layout', 'clean', 'deeplink', 'regression',
  'keyboard', 'errorpath', 'visual', 'perf', 'data', 'export', 'mutation',
];

// 1) Playwright'tan tüm testleri (mutation dahil) listele.
const raw = execSync('npx playwright test --list --reporter=json', {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  stdio: ['pipe', 'pipe', 'ignore'],
  env: { ...process.env, ALLOW_MUTATING_TESTS: 'true' }, // @mutation testleri de listelensin
});
const report = JSON.parse(raw);

// 2) Dosya (basename) → o dosyadaki tüm etiketlerin kümesi.
const tagsByFile = new Map();
const tagsByRoute = new Map();
const allTags = new Set();
const walk = (suite) => {
  for (const sp of suite.specs || []) {
    const file = basename(sp.file);
    const set = tagsByFile.get(file) || new Set();
    for (const t of sp.tags || []) {
      set.add(norm(t));
      allTags.add(norm(t));
    }
    tagsByFile.set(file, set);
    const routeMatch = `${suite.title || ''} ${sp.title || ''}`.match(/\[route:([^\]]+)\]/);
    if (routeMatch) {
      const routeSet = tagsByRoute.get(routeMatch[1]) || new Set();
      for (const t of sp.tags || []) routeSet.add(norm(t));
      tagsByRoute.set(routeMatch[1], routeSet);
    }
  }
  for (const child of suite.suites || []) walk(child);
};
for (const s of report.suites || []) walk(s);

const errors = [];

// Navigasyona giren hiçbir rota stil sözleşmesinin dışında kalamaz.
const registeredRoutes = new Set(TESTED_PAGES.flatMap(({ routes }) => routes));
for (const { path: route } of MAIN_NAVIGATION) {
  if (!registeredRoutes.has(route)) {
    errors.push(`[route:${route}] MAIN_NAVIGATION rotası tested-pages.js içinde kayıtlı değil.`);
  }
}

// 3) Etiket allowlist'i (JSON-liste tabanlı; JSDoc token'ı karışmaz).
for (const t of [...allTags].sort()) {
  if (!ALLOWED_TAGS.has(t)) {
    errors.push(`Bilinmeyen etiket "@${t}" — AGENTS.md kanonik kaydına ekleyin veya kaldırın.`);
  }
}

// 4) Her tescilli sayfa için stil matrisini hesapla.
const rows = [];
for (const page of [...TESTED_PAGES].sort((a, b) => a.id.localeCompare(b.id))) {
  const pageTags = new Set();
  for (const f of page.specFiles) {
    const set = tagsByFile.get(basename(f));
    if (!set) errors.push(`[${page.id}] specFile listede yok: ${f} (dosya adı/konum doğru mu?)`);
    else for (const t of set) pageTags.add(t);
  }
  const naStyles = Object.fromEntries(
    Object.entries(page.naStyles || {}).map(([k, v]) => [norm(k), v])
  );

  const required = new Set(BASELINE);
  for (const c of CONDITIONAL) if (c.when(page.archetype)) required.add(c.tag);

  // Baseline N/A olamaz.
  for (const b of BASELINE) {
    if (naStyles[b]) errors.push(`[${page.id}] baseline stil "@${b}" N/A beyan edilemez.`);
  }

  if (page.routeLevelBaseline) {
    for (const route of page.routes) {
      const routeTags = tagsByRoute.get(route) || new Set();
      for (const style of BASELINE) {
        if (!routeTags.has(style)) {
          errors.push(`[${page.id}][route:${route}] rota düzeyi baseline eksik: @${style}.`);
        }
      }
    }
  }

  const cells = {};
  for (const style of STYLE_COLUMNS) {
    if (required.has(style)) {
      if (pageTags.has(style)) cells[style] = '✅';
      else if (naStyles[style]) cells[style] = 'N/A';
      else {
        cells[style] = '❌';
        errors.push(`[${page.id}] ZORUNLU stil eksik: @${style} (test ekleyin ya da naStyles ile gerekçeli N/A yapın).`);
      }
    } else {
      cells[style] = pageTags.has(style) ? '✅' : '—';
    }
  }
  rows.push({ page, cells, na: naStyles });
}

// 5) Matris Markdown'ı üret (deterministik → drift kapısına uygun).
const L = [];
L.push('# Vomenta — Sayfa × Test-Stili Kapsama Matrisi');
L.push('');
L.push('Bu belge, **tescilli her sayfada hangi zorunlu test stilinin kapsandığını** gösterir.');
L.push('✅ kapsandı · N/A gerekçeli hariç · ❌ EKSİK (sert kapı kırılır) · — o sayfa için zorunlu değil.');
L.push('');
L.push('> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Güncelle: `npm run quality:styles`.');
L.push('> Kaynak: `tests/contracts/tested-pages.js` + testlerin etiketleri. Kurallar: AGENTS.md → "Zorunlu test stilleri".');
L.push('');
L.push('| Sayfa | ' + STYLE_COLUMNS.map((s) => `@${s}`).join(' | ') + ' |');
L.push('|---|' + STYLE_COLUMNS.map(() => '---').join('|') + '|');
for (const { page, cells } of rows) {
  L.push(`| \`${page.id}\` | ` + STYLE_COLUMNS.map((s) => cells[s]).join(' | ') + ' |');
}
L.push('');
L.push('## Rota düzeyi baseline kanıtı');
L.push('');
L.push('| Rota | @smoke | @i18n | @a11y | @layout | @clean | @deeplink | @regression |');
L.push('|---|---|---|---|---|---|---|---|');
for (const { page } of rows.filter(({ page }) => page.routeLevelBaseline)) {
  for (const route of page.routes) {
    const routeTags = tagsByRoute.get(route) || new Set();
    L.push(
      `| \`${route}\` | ` +
      BASELINE.map((style) => routeTags.has(style) ? '✅' : '❌').join(' | ') +
      ' |'
    );
  }
}
L.push('');
L.push('## Rotalar');
L.push('');
for (const { page } of rows) {
  L.push(`- **${page.id}**: ${page.routes.map((r) => `\`${r}\``).join(', ')}`);
}
L.push('');
L.push('## N/A beyanları (gerekçeli)');
L.push('');
let anyNa = false;
for (const { page, na } of rows) {
  for (const [style, reason] of Object.entries(na)) {
    L.push(`- \`${page.id}\` **@${style}**: ${reason}`);
    anyNa = true;
  }
}
if (!anyNa) L.push('_(yok)_');
L.push('');

// ── Kanonik yüzey kapsaması (WP-SURFACE-UNIFIED / FAZ 5 / ADR-0022) ──────────────
// Yukarıdaki matris YALNIZ kapsam sözleşmesi olan sayfaları listeler. Bu ek, kanonik
// `product-surfaces.js`'teki HER yüzeyi (dedicated sözleşmesi olsun olmasın) TAM BİR KEZ
// gösterir: sözleşmesi olan yüzey stil hücrelerini devralır, olmayan yüzey dürüstçe
// `NO_COVERAGE_CONTRACT` görünür (stil sütunları — ). Böylece stil matrisi de envanter /
// surface-depth / project-status ile AYNI kanonik yüzey kümesini kapsar (her raporda
// her yüzey tam bir kez). Dedicated eşleme = routeLevelBaseline OLMAYAN sözleşme (envanter
// ile senkron). Hücre birleşimi önceliği: ✅ > N/A > ❌ > —.
const CELL_RANK = { '✅': 3, 'N/A': 2, '❌': 1, '—': 0 };
const routeCells = new Map();
const routePageIds = new Map();
for (const { page, cells } of rows) {
  if (page.routeLevelBaseline) continue; // main-navigation dedicated SAYILMAZ (envanter ile senkron)
  for (const route of page.routes) {
    const prev = routeCells.get(route) || {};
    const merged = { ...prev };
    for (const style of STYLE_COLUMNS) {
      const a = prev[style] ?? '—';
      const b = cells[style] ?? '—';
      merged[style] = (CELL_RANK[b] ?? 0) >= (CELL_RANK[a] ?? 0) ? b : a;
    }
    routeCells.set(route, merged);
    const ids = routePageIds.get(route) || [];
    if (!ids.includes(page.id)) ids.push(page.id);
    routePageIds.set(route, ids);
  }
}

const canonicalRows = [...PRODUCT_SURFACES]
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((s) => {
    const hasContract = routeCells.has(s.route);
    return {
      id: s.id,
      route: s.route,
      area: s.area,
      hasContract,
      cells: hasContract ? routeCells.get(s.route) : null,
    };
  });

// Değişmez: kanonik ek TAM olarak PRODUCT_SURFACES kadar satır taşır (her yüzey tam bir kez).
if (canonicalRows.length !== PRODUCT_SURFACES.length) {
  errors.push(`Kanonik yüzey eki satır sayısı (${canonicalRows.length}) ≠ PRODUCT_SURFACES (${PRODUCT_SURFACES.length}).`);
}
const seenCanon = new Set();
for (const cr of canonicalRows) {
  if (seenCanon.has(cr.id)) errors.push(`Kanonik yüzey eki yinelenen id: ${cr.id}`);
  seenCanon.add(cr.id);
}

L.push('## Kanonik yüzey kapsaması (tüm ' + PRODUCT_SURFACES.length + ' yüzey — her yüzey tam bir kez)');
L.push('');
L.push('Kanonik `product-surfaces.js`\'teki HER yüzey burada listelenir. `NO_COVERAGE_CONTRACT` =');
L.push('dedicated stil kapsam sözleşmesi yok (baseline smoke alır; matris üstünde görünmez). Bu ek,');
L.push('stil matrisini envanter / surface-depth / project-status ile aynı kanonik küme üzerinde tutar.');
L.push('');
L.push('| id | route | area | ' + STYLE_COLUMNS.map((s) => `@${s}`).join(' | ') + ' | sözleşme |');
L.push('|---|---|---|' + STYLE_COLUMNS.map(() => '---').join('|') + '|---|');
for (const cr of canonicalRows) {
  const styleCells = STYLE_COLUMNS.map((s) => (cr.cells ? cr.cells[s] : '—')).join(' | ');
  const label = cr.hasContract ? '✔' : 'NO_COVERAGE_CONTRACT';
  L.push(`| \`${cr.id}\` | \`${cr.route}\` | ${cr.area} | ${styleCells} | ${label} |`);
}
L.push('');

const outPath = resolve(root, 'docs/TEST_STYLE_MATRIX.md');
writeFileSync(outPath, L.join('\n'));

// 6) Sonuç.
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} stil-kapsama ihlali. Matris: ${outPath}`);
  process.exit(1);
}
console.log(`Stil kapsama kapısı geçti: ${rows.length} sayfa, 0 eksik. Matris: ${outPath}`);
