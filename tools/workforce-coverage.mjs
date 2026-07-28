// İş Gücü (Workforce) test kapsam raporu üreticisi.
// Spec dosyalarındaki testleri okur, aşağıdaki envanterle eşleştirir ve
// docs/workforce-kesif/KAPSAM.md tablosunu OTOMATİK üretir.
// Çalıştırma: node tools/workforce-coverage.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const SPECS = ['tests/workforce.authed.spec.js', 'tests/workforce-mutations.authed.spec.js'];

// Spec'lerden test kayıtlarını çıkar
const tests = [];
for (const path of SPECS) {
  const src = readFileSync(path, 'utf8');
  const fileFixme = /test\.fixme\s*\(/.test(src);
  const fileMutation = /@mutation/.test(src) || path.includes('mutation');
  for (const m of src.matchAll(/(?:^|\s)test\(\s*[`'"]([^`'"]+)[`'"]/g)) {
    // Template-literal başlıklardaki ${...} interpolasyonlarını okunur bir simgeye indir.
    const title = m[1].replace(/\$\{[^}]+\}/g, '<dil>');
    tests.push({ title, file: path, fixme: fileFixme, mutation: fileMutation });
  }
}

// Keşiften çıkan İş Gücü envanteri (docs/workforce-kesif/NOTLAR.md)
const INVENTORY = [
  { area: 'Genel', item: 'Sayfa başlığı yükleniyor', type: 'read', any: ['sayfa başlığı ve 7 sekme'] },
  { area: 'Genel', item: '7 sekme yükleniyor + imza kontrolü', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Yerelleştirme', item: '4 dil çeviri (en/tr/fr/ar)', type: 'read', any: ['çevriliyor'] },
  { area: 'Yerelleştirme', item: 'Arapça RTL (dir=rtl)', type: 'read', any: ['çevriliyor'] },
  { area: 'Yerelleştirme', item: 'Ham i18n anahtarı yok', type: 'read', any: ['çevriliyor'] },
  { area: 'Schedules', item: 'Çizelge tablosu + Publish butonu görünür', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Schedules', item: 'Tarih navigasyonu (önceki/sonraki hafta)', type: 'read', any: ['tarih navigasyonu'] },
  { area: 'Schedules', item: 'Add Shift formu açılıyor (Start/End/Break)', type: 'read', any: ['add shift', 'formu açıl'] },
  { area: 'Schedules', item: 'Vardiya oluşturma (Add Shift → Save)', type: 'mutation', any: ['vardiya oluştur'] },
  { area: 'Schedules', item: 'Publish Schedule (yayınlama + sonrası)', type: 'mutation', any: ['yayınlan'] },
  { area: 'Time Off', item: 'Sekme + "Request Time Off" + boş durum', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Time Off', item: 'İzin talebi oluşturma', type: 'mutation', any: ['izin talebi'] },
  { area: 'Adherence', item: 'Sekme + 7d/14d/30d filtreleri', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Forecast', item: 'Sekme + tahmin tablosu (veri)', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Badges', item: 'Sekme + Award/Create badge + boş durum', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Badges', item: 'Rozet oluşturma / verme', type: 'mutation', any: ['rozet'] },
  { area: 'Surveys', item: 'Sekme + Create survey + boş durum', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Surveys', item: 'Anket oluşturma', type: 'mutation', any: ['anket'] },
  { area: 'Evaluations', item: 'Sekme + Create/Trigger Evaluation', type: 'read', any: ['7 sekme de yükleniyor'] },
  { area: 'Evaluations', item: 'Değerlendirme oluşturma / AI tetikleme', type: 'mutation', any: ['değerlendirme'] },
];

function match(item) {
  const found = tests.filter((t) => item.any.some((k) => t.title.toLowerCase().includes(k.toLowerCase())));
  if (found.length === 0) return { status: '❌ Test yok', tests: [] };
  const fixme = found.every((t) => t.fixme);
  const status = fixme ? '🟡 Staging (fixme)' : '✅ Kapsanıyor';
  return { status, tests: found.map((t) => t.title) };
}

const rows = INVENTORY.map((it) => ({ ...it, ...match(it) }));
const c = { ok: 0, staging: 0, none: 0 };
for (const r of rows) {
  if (r.status.startsWith('✅')) c.ok++;
  else if (r.status.startsWith('🟡')) c.staging++;
  else c.none++;
}

let md = `# İş Gücü (Workforce) — Test Kapsam Raporu\n\n`;
md += `> Bu dosya OTOMATİK üretilir: \`node tools/workforce-coverage.mjs\`. Elle düzenlemeyin.\n\n`;
md += `Kaynak spec'ler: ${SPECS.map((s) => '`' + s + '`').join(', ')} · Toplam test: **${tests.length}**\n\n`;
md += `## Özet\n\n`;
md += `- ✅ Prod'da kapsanan (salt-okunur): **${c.ok}**\n`;
md += `- 🟡 Yalnızca staging (mutation, fixme): **${c.staging}**\n`;
md += `- ❌ Henüz test yok: **${c.none}**\n\n`;
md += `## Kapsam matrisi\n\n`;
md += `| Alan | Öğe | Tip | Durum | Test(ler) |\n|---|---|---|---|---|\n`;
for (const r of rows) {
  const t = r.tests.length ? r.tests.map((x) => x.replace(/\|/g, '\\|')).join('<br>') : '—';
  md += `| ${r.area} | ${r.item} | ${r.type === 'mutation' ? 'mutation' : 'salt-okunur'} | ${r.status} | ${t} |\n`;
}
md += `\n## Notlar\n\n`;
md += `- **Mutation akışları prod'da çalıştırılmaz** (\`@mutation\` + \`grepInvert\`). "Publish Schedule" ajanlara bildirim gönderebildiğinden yalnızca izole test ortamında koşmalıdır.\n`;
md += `- ❌ işaretli mutation'lar (izin talebi, rozet, anket, değerlendirme oluşturma) henüz yazılmadı — staging ortamı netleşince eklenebilir.\n`;
md += `- Keşif detayı ve ekran görüntüleri: \`docs/workforce-kesif/NOTLAR.md\`.\n`;

writeFileSync('docs/workforce-kesif/KAPSAM.md', md);
console.log(`KAPSAM.md üretildi → ✅ ${c.ok} kapsanan · 🟡 ${c.staging} staging · ❌ ${c.none} test yok (toplam ${tests.length} test)`);
