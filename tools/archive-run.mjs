// @ts-check
/**
 * KOŞU ARŞİVLEYİCİ — yerel test raporlarını tarih-saatli olarak saklar.
 *
 * Model (kullanıcı isteği):
 *   reports/
 *     güncel raporlar/      ← her zaman EN SON koşu (html + report.json + meta.json)
 *     arşiv/
 *       2026-08-07_14-30-12_dev/   ← yeni koşu gelince önceki "güncel" buraya taşınır
 *       ...
 *     index.html            ← tüm koşuların tıklanabilir listesi (sonuç + zaman)
 *
 * Bu, mevcut evidence/trend hattından (docs/raporlar/*) TAMAMEN AYRIDIR ve ona
 * dokunmaz. Yalnızca yerel kolaylık arşividir; `reports/` gitignore'ludur ve CI'da
 * üretilmez (CI'nın kendi güvenli artifact hattı vardır). En-iyi-çaba: hata olursa
 * koşum sonucunu ETKİLEMEZ.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { environment } from '../config/environment.js';

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const CURRENT_DIR = path.join(REPORTS_DIR, 'güncel raporlar');
const ARCHIVE_DIR = path.join(REPORTS_DIR, 'arşiv');
const HTML_SRC = path.join(ROOT, 'playwright-report');
const JSON_SRC = path.join(ROOT, 'test-results', 'report.json');
const KEEP = Number.parseInt(process.env.REPORT_ARCHIVE_KEEP ?? '', 10) || 20;

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Yerel zaman damgası: 2026-08-07_14-30-12 (klasör adı; kronolojik sıralanır). */
function stamp(date) {
  const d = date instanceof Date && !Number.isNaN(date.valueOf()) ? date : new Date();
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

/** report.json'dan özet çıkarır (yoksa null). */
function readSummary() {
  try {
    const j = JSON.parse(readFileSync(JSON_SRC, 'utf8'));
    const s = j.stats ?? {};
    return {
      startTime: s.startTime ?? null,
      durationMs: Math.round(s.duration ?? 0),
      passed: s.expected ?? 0,
      failed: s.unexpected ?? 0,
      flaky: s.flaky ?? 0,
      skipped: s.skipped ?? 0,
    };
  } catch {
    return null;
  }
}

/** Önceki "güncel" koşuyu arşive taşır (meta'sındaki zaman damgasıyla adlandırır). */
function rotateCurrentToArchive() {
  if (!existsSync(CURRENT_DIR)) return;
  let name;
  try {
    const meta = JSON.parse(readFileSync(path.join(CURRENT_DIR, 'meta.json'), 'utf8'));
    name = `${meta.stamp}_${meta.env || 'env'}`;
  } catch {
    name = `${stamp(statSync(CURRENT_DIR).mtime)}_arsiv`;
  }
  mkdirSync(ARCHIVE_DIR, { recursive: true });
  let dest = path.join(ARCHIVE_DIR, name);
  let i = 2;
  while (existsSync(dest)) dest = path.join(ARCHIVE_DIR, `${name}-${i++}`);
  renameSync(CURRENT_DIR, dest);
}

/** Arşivi en yeni KEEP klasörle sınırlar (adlar zaman damgalı → sıralanabilir). */
function pruneArchive() {
  if (!existsSync(ARCHIVE_DIR)) return;
  const dirs = readdirSync(ARCHIVE_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const excess = dirs.length - KEEP;
  for (let i = 0; i < excess; i++) {
    rmSync(path.join(ARCHIVE_DIR, dirs[i]), { recursive: true, force: true });
  }
}

function badge(sum) {
  if (!sum) return '—';
  const bits = [`✅ ${sum.passed}`];
  if (sum.failed) bits.push(`❌ ${sum.failed}`);
  if (sum.flaky) bits.push(`⚠️ ${sum.flaky}`);
  if (sum.skipped) bits.push(`⏭️ ${sum.skipped}`);
  return bits.join('  ');
}

function row(label, dirName, meta) {
  // HTML raporu varsa ona, yoksa ham report.json'a link ver (ölü link olmasın).
  const hasHtml = existsSync(path.join(REPORTS_DIR, dirName, 'html', 'index.html'));
  const href = encodeURI(`${dirName}/${hasHtml ? 'html/index.html' : 'report.json'}`);
  const env = meta?.env ? ` · ${meta.env}` : '';
  return (
    `<tr><td><a href="${href}">${label}</a></td>` +
    `<td>${meta?.stamp || ''}${env}</td>` +
    `<td>${badge(meta?.summary)}</td></tr>`
  );
}

/** reports/index.html — güncel + arşiv koşularının tıklanabilir listesi. */
function writeIndex() {
  const rows = [];
  if (existsSync(CURRENT_DIR)) {
    let meta = null;
    try {
      meta = JSON.parse(readFileSync(path.join(CURRENT_DIR, 'meta.json'), 'utf8'));
    } catch {}
    rows.push(row('🟢 Güncel rapor', 'güncel raporlar', meta));
  }
  if (existsSync(ARCHIVE_DIR)) {
    const dirs = readdirSync(ARCHIVE_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .reverse();
    for (const d of dirs) {
      let meta = null;
      try {
        meta = JSON.parse(readFileSync(path.join(ARCHIVE_DIR, d, 'meta.json'), 'utf8'));
      } catch {}
      rows.push(row(d, `arşiv/${d}`, meta));
    }
  }
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Raporları</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:2rem;color:#1a1a1a;background:#fafafa}
  h1{font-size:1.4rem}
  table{border-collapse:collapse;width:100%;max-width:820px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  th,td{text-align:left;padding:.6rem .9rem;border-bottom:1px solid #eee}
  th{background:#f3f4f6;font-size:.85rem;text-transform:uppercase;letter-spacing:.03em;color:#555}
  a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
  tr:first-child td{font-weight:600}
  @media(prefers-color-scheme:dark){body{background:#111;color:#eee}table{background:#1b1b1b}th{background:#222;color:#aaa}td{border-color:#333}a{color:#7ab7ff}}
</style></head><body>
<h1>Test Raporları</h1>
<p>En son koşu <b>güncel raporlar</b>'da; önceki koşular <b>arşiv</b>'de (en yeni ${KEEP} tutulur).</p>
<table><thead><tr><th>Koşu</th><th>Tarih / Ortam</th><th>Sonuç</th></tr></thead>
<tbody>${rows.join('\n') || '<tr><td colspan="3">Henüz koşu yok.</td></tr>'}</tbody></table>
</body></html>`;
  writeFileSync(path.join(REPORTS_DIR, 'index.html'), html, 'utf8');
}

/**
 * En-iyi-çaba arşivleme. Hata FIRLATMAZ (koşum sonucunu bozmamak için).
 * @returns {{ archived: boolean, reason?: string, dir?: string }}
 */
export function archiveRun() {
  try {
    const hasHtml = existsSync(HTML_SRC);
    const hasJson = existsSync(JSON_SRC);
    if (!hasHtml && !hasJson) {
      return { archived: false, reason: 'rapor bulunamadı (playwright-report/report.json yok)' };
    }

    const summary = readSummary();
    const runStamp = stamp(summary?.startTime ? new Date(summary.startTime) : new Date());

    rotateCurrentToArchive();
    mkdirSync(CURRENT_DIR, { recursive: true });

    if (hasHtml) cpSync(HTML_SRC, path.join(CURRENT_DIR, 'html'), { recursive: true });
    if (hasJson) cpSync(JSON_SRC, path.join(CURRENT_DIR, 'report.json'));

    writeFileSync(
      path.join(CURRENT_DIR, 'meta.json'),
      JSON.stringify({ stamp: runStamp, env: environment.name, summary }, null, 2),
      'utf8'
    );

    pruneArchive();
    writeIndex();
    return { archived: true, dir: CURRENT_DIR };
  } catch (error) {
    return { archived: false, reason: error?.message ?? String(error) };
  }
}

// Doğrudan çağrıldığında (npm run report:archive) çalıştır.
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = archiveRun();
  if (result.archived) {
    console.log(`Koşu arşivlendi → reports/güncel raporlar (index: reports/index.html)`);
  } else {
    console.log(`Arşivleme atlandı: ${result.reason}`);
  }
}
