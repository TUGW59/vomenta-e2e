// @ts-check
/**
 * WP-R2 — Rapor üreteçleri için ortak yardımcılar.
 * MD (repo source-of-truth) üretimi + kontrollü MD→HTML render (HTML/PDF artifact).
 */
import { execSync } from 'node:child_process';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Markdown tablo hücresi güvenli kaçış. */
export function mdCell(v) {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/** Playwright makine-okur test listesi (tek doğru kaynak). Testleri ÇALIŞTIRMAZ. */
export function loadPlaywrightList(root) {
  const raw = execSync('npx playwright test --list --reporter=json', {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
    env: { ...process.env, ALLOW_MUTATING_TESTS: 'true' },
  });
  const report = JSON.parse(raw);
  /** @type {{file:string,title:string,tags:string[],expectedStatus:string,annotations:{type:string,description?:string}[]}[]} */
  const specs = [];
  const seen = new Set();
  const walk = (suite) => {
    for (const sp of suite.specs || []) {
      const t0 = (sp.tests || [])[0] || {};
      const key = `${sp.file}::${sp.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      specs.push({
        file: sp.file,
        title: sp.title,
        tags: sp.tags || [],
        expectedStatus: t0.expectedStatus || 'unknown',
        annotations: t0.annotations || [],
      });
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const s of report.suites || []) walk(s);
  return specs.filter((s) => s.file !== 'auth.setup.js');
}

/** Spec dosya adı → ürün alanı etiketi. */
export function areaOf(file) {
  const f = file.toLowerCase();
  const map = [
    ['known-bugs', 'cross-cutting'],
    ['reports-dashboards', 'reports'],
    ['reports-sections', 'reports'],
    ['reports', 'reports'],
    ['analytics', 'analytics'],
    ['supervisor', 'supervisor'],
    ['workforce', 'workforce'],
    ['campaigns', 'campaigns'],
    ['contacts', 'contacts'],
    ['tickets', 'tickets'],
    ['inbox', 'inbox'],
    ['voice', 'voice'],
    ['channels', 'channels'],
    ['dashboard', 'dashboard'],
    ['settings', 'settings'],
    ['discovery', 'discovery'],
    ['login', 'auth'],
    ['logout', 'auth'],
    ['header', 'shell'],
    ['navigation', 'shell'],
    ['search', 'shell'],
    ['forms', 'shell'],
    ['responsive', 'shell'],
    ['pages', 'shell'],
    ['a11y', 'cross-cutting'],
    ['mutation-orphans', 'cross-cutting'],
  ];
  for (const [needle, area] of map) if (f.includes(needle)) return area;
  return 'other';
}

/** Tüm *.spec.js dosyalarını gez (skip/fixme envanteri için). */
export function walkSpecFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkSpecFiles(full));
    else if (entry.endsWith('.spec.js')) out.push(full);
  }
  return out;
}

/** Spec kaynaklarından test.fixme / test.skip envanteri (satır + gerekçe). */
export function scanSkipsAndFixmes(testsDir, rel) {
  const RE = /\btest\.(fixme|skip)\(\s*(?:true\s*,\s*)?['"]([^'"]*)['"]|(?:^|\s)test\.(fixme|skip)\(\s*([^,'")]+),\s*['"]([^'"]*)['"]/g;
  const items = [];
  for (const file of walkSpecFiles(testsDir)) {
    const src = readFileSync(file, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      // Yorum/JSDoc satırlarını atla.
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
      const m1 = /\btest\.(fixme|skip)\(/.exec(line);
      if (!m1) return;
      const kind = m1[1];
      const reasonMatch = /['"]([^'"]{6,})['"]\s*\)?\s*;?\s*$/.exec(line) || /,\s*['"]([^'"]+)['"]/.exec(line);
      const reason = reasonMatch ? reasonMatch[1] : '';
      items.push({ file: rel(file), line: i + 1, kind, reason });
    });
  }
  return items;
}

// ── Kontrollü MD → HTML (yalnız üreteçlerin ürettiği alt küme) ────────────────
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function fmtInline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function inline(s) {
  // Markdown link desteği (FAZ 4): [metin](http(s)://url) → tıklanabilir <a>.
  // Yalnız http/https (javascript:/data: reddedilir). Link YOKSA çıktı fmtInline ile
  // birebir eskisi gibidir (drift-nötr). href esc'lenir; " ayrıca kaçırılır.
  const RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = RE.exec(s)) !== null) {
    out += fmtInline(s.slice(last, m.index));
    const href = esc(m[2]).replace(/"/g, '&quot;');
    out += `<a href="${href}">${fmtInline(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  out += fmtInline(s.slice(last));
  return out;
}

/** @param {string} md */
export function mdToHtml(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0;
  let inList = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  while (i < lines.length) {
    const line = lines[i];
    if (/^\|/.test(line)) {
      // tablo bloğu
      closeList();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const parse = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const header = parse(rows[0]);
      const body = rows.slice(2); // rows[1] = ayraç
      out.push('<table><thead><tr>' + header.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>');
      for (const r of body) out.push('<tr>' + parse(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
      out.push('</tbody></table>');
      continue;
    }
    if (/^### /.test(line)) { closeList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); i++; continue; }
    if (/^## /.test(line)) { closeList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); i++; continue; }
    if (/^# /.test(line)) { closeList(); out.push(`<h1>${inline(line.slice(2))}</h1>`); i++; continue; }
    if (/^---\s*$/.test(line)) { closeList(); out.push('<hr>'); i++; continue; }
    if (/^[-*] /.test(line)) { if (!inList) { out.push('<ul>'); inList = true; } out.push(`<li>${inline(line.slice(2))}</li>`); i++; continue; }
    if (/^\s*$/.test(line)) { closeList(); i++; continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  closeList();
  return out.join('\n');
}

/** Kendi kendine yeten, yazdırma-dostu, açık/koyu-nötr HTML sarmalayıcı. */
export function htmlDoc(title, bodyHtml) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root{ --ink:#1a2432; --muted:#55606e; --line:#d9dee4; --bg:#ffffff; --panel:#f6f8fa; --accent:#0b6e84; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  main{max-width:60rem;margin:0 auto;padding:2rem 1.5rem 3rem}
  h1{font-size:1.7rem;margin:.2rem 0 .6rem} h2{font-size:1.25rem;margin:1.6rem 0 .5rem;border-bottom:1px solid var(--line);padding-bottom:.25rem}
  h3{font-size:1.02rem;margin:1.1rem 0 .35rem;color:var(--accent)}
  p{margin:.4rem 0;color:var(--muted)} code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.86em;background:var(--panel);padding:.05rem .3rem;border-radius:4px;color:var(--ink)}
  strong{color:var(--ink)} hr{border:0;border-top:1px solid var(--line);margin:1.4rem 0}
  a{color:var(--accent);text-decoration:underline} a:hover{text-decoration:none}
  ul{margin:.4rem 0 .4rem 1.1rem;color:var(--muted)} li{margin:.15rem 0}
  table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.82rem}
  th,td{border:1px solid var(--line);padding:.35rem .5rem;text-align:left;vertical-align:top}
  th{background:var(--panel);font-weight:600}
  @page{margin:16mm}
</style></head><body><main>
${bodyHtml}
</main></body></html>`;
}
