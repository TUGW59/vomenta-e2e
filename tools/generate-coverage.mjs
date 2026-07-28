// @ts-check
/**
 * Tuş/kontrol KAPSAMA raporu üreticisi.
 *
 * "Test edilen" bölümü, Playwright'ın canlı test listesinden (tek doğru kaynak) üretilir;
 * testler değiştikçe rapor da güncellenir. "Bilerek test edilmeyen" ve "yapılacak" bölümleri
 * tests/contracts/coverage-exclusions.js dosyasından okunur.
 *
 * Çalıştır:  node tools/generate-coverage.mjs   (veya: npm run report:coverage)
 * Çıktı:     docs/TEST_KAPSAMI.md
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { COVERAGE_EXCLUSIONS, COVERAGE_TODO } from '../tests/contracts/coverage-exclusions.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// 1) Playwright'tan makine-okur test listesini al.
const raw = execSync('npx playwright test --list --reporter=json', {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  stdio: ['pipe', 'pipe', 'ignore'],
});
const report = JSON.parse(raw);

// 2) Spec'leri topla (projeler arası tekrarları dosya+başlık ile tekilleştir).
const specs = new Map();
const walk = (suite) => {
  for (const sp of suite.specs || []) {
    const key = `${sp.file}::${sp.title}`;
    if (!specs.has(key)) specs.set(key, { file: sp.file, title: sp.title, tags: sp.tags || [] });
  }
  for (const child of suite.suites || []) walk(child);
};
for (const s of report.suites || []) walk(s);

const all = [...specs.values()].filter((s) => s.file !== 'auth.setup.js');
const cleanTitle = (t) => t.replace(/\s*@[\w-]+/g, '').trim();

// 3) Dosyaya göre grupla + etiket sayıları.
const byFile = {};
for (const s of all) (byFile[s.file] ||= []).push(s);
const tagCounts = {};
for (const s of all) for (const t of s.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;

// 4) Markdown üret.
const L = [];
L.push('# Vomenta — Tuş / Kontrol Kapsama Matrisi');
L.push('');
L.push('Bu belge, Vomenta arayüzünde **hangi tuşların/özelliklerin otomatik testlerle kontrol edildiğini**, hangilerinin güvenlik gereği **bilerek test edilmediğini** ve nelerin **yapılacak** olduğunu gösterir. İlk kez bakan biri, projede neyin test kapsamında olduğunu buradan görebilir.');
L.push('');
L.push('> ⚙️ Bu dosya **otomatik üretilir** — elle düzenlemeyin.');
L.push('> Güncellemek için: `npm run report:coverage` (veya `node tools/generate-coverage.mjs`).');
L.push('> "Test edilen" bölümü testlerden, diğer bölümler `tests/contracts/coverage-exclusions.js`\'ten gelir.');
L.push('');
L.push('## Özet');
L.push('');
L.push(`- **Test edilen senaryo:** ${all.length}`);
L.push(`- **Test dosyası:** ${Object.keys(byFile).length}`);
const tagLine = Object.entries(tagCounts).sort().map(([t, n]) => `\`@${t}\` ${n}`).join(' · ');
if (tagLine) L.push(`- **Etiketler:** ${tagLine}`);
L.push(`- **Bilerek test edilmeyen (güvenlik):** ${COVERAGE_EXCLUSIONS.length}`);
L.push(`- **Yapılacak (güvenli, henüz kapsanmadı):** ${COVERAGE_TODO.length}`);
L.push('');

L.push('## ✅ Test edilen senaryolar');
L.push('');
for (const file of Object.keys(byFile).sort()) {
  L.push(`### \`${file}\``);
  L.push('');
  for (const s of byFile[file]) {
    const tags = s.tags.map((t) => `\`@${t}\``).join(' ');
    L.push(`- ${cleanTitle(s.title)}${tags ? '  ' + tags : ''}`);
  }
  L.push('');
}

L.push('## ⛔ Bilerek test edilmeyen tuşlar (güvenlik)');
L.push('');
L.push('| Kontrol | Sayfa | Neden | Tür |');
L.push('|---|---|---|---|');
for (const e of COVERAGE_EXCLUSIONS) L.push(`| ${e.control} | ${e.pages} | ${e.reason} | \`${e.category}\` |`);
L.push('');

L.push('## ◻️ Yapılacak (güvenli, henüz kapsanmadı)');
L.push('');
L.push('| Kontrol | Sayfa |');
L.push('|---|---|');
for (const e of COVERAGE_TODO) L.push(`| ${e.control} | ${e.pages} |`);
L.push('');

const outPath = resolve(root, 'docs/TEST_KAPSAMI.md');
writeFileSync(outPath, L.join('\n'));
console.log(`Kapsama raporu yazıldı: ${outPath} (${all.length} senaryo, ${Object.keys(byFile).length} dosya)`);
