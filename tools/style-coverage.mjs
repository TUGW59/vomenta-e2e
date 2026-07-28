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

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Baş '@' ve sondaki noktalama (ör. parantez içi başlıktan gelen "@mutation)") temizlenir;
// tag semantik olarak `@[\w-]+`'tir. Böylece "(staging @mutation)" → "mutation".
const norm = (t) => String(t).replace(/^@/, '').replace(/[^\w-]+$/, '');

// Kanonik etiket kaydı (AGENTS.md → "Test sınıfları" ile senkron). @'siz saklanır.
const ALLOWED_TAGS = new Set([
  // risk / yapı
  'smoke', 'critical', 'regression', 'mutation', 'known-bug', 'public',
  // stiller
  'i18n', 'a11y', 'layout', 'visual', 'errorpath', 'clean', 'perf', 'keyboard', 'deeplink', 'data', 'export',
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
  }
  for (const child of suite.suites || []) walk(child);
};
for (const s of report.suites || []) walk(s);

const errors = [];

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

const outPath = resolve(root, 'docs/TEST_STYLE_MATRIX.md');
writeFileSync(outPath, L.join('\n'));

// 6) Sonuç.
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} stil-kapsama ihlali. Matris: ${outPath}`);
  process.exit(1);
}
console.log(`Stil kapsama kapısı geçti: ${rows.length} sayfa, 0 eksik. Matris: ${outPath}`);
