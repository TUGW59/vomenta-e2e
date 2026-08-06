// @ts-check
/**
 * WP-R2 — Konsolide bulgu raporu üreticisi.
 * Kaynak: tests/contracts/known-bugs.js (source of truth).
 * Yazar (repo, commit'lenir): docs/raporlar/findings.json + docs/raporlar/BULGULAR.md
 * HTML/PDF bunlardan tools/render-report-pdf.mjs ile üretilir (commit EDİLMEZ).
 *
 * Determinizm: timestamp veya tarih-bağımlı (expiry<bugün) hesaplanmış alan
 * ÇIKTIYA GÖMÜLMEZ (drift kapısı stabil kalsın). Tarih-bağımlı uyarılar
 * tools/self-check-findings.mjs tarafından (advisory) basılır.
 *
 * Çalıştır: npm run report:findings
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { mdCell } from './report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/raporlar');
mkdirSync(outDir, { recursive: true });

// ── evidence-index.json (FAZ 4, ADR-0026 §4-§6) ──
// CI kanıt lane'i (FAZ 3) doldurur; commit'li. Yok/boş/geçersizse {} → dürüst "Kanıt: yok".
// Yalnız LINK KAYNAĞI: registry root-cause'a DOKUNMAZ. capturedAt/expiry buradan OKUNUR
// (render anında HESAPLANMAZ) → deterministik; index değişmedikçe çıktı değişmez.
let evidenceIndex = {};
{
  const idxPath = resolve(outDir, 'evidence-index.json');
  if (existsSync(idxPath)) {
    try {
      const parsed = JSON.parse(readFileSync(idxPath, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) evidenceIndex = parsed;
    } catch { /* geçersiz JSON → boş index (sessiz; dürüstlük korunur) */ }
  }
}

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const by = (k) => KNOWN_BUGS.reduce((a, b) => ((a[b[k]] = (a[b[k]] || 0) + 1), a), {});

// ── Governance işaretleri (yalnız DETERMİNİSTİK; tarih-bağımlı olan yok) ──
const ownerless = KNOWN_BUGS.filter((b) => b.owner === null).map((b) => b.id);
const unverified = KNOWN_BUGS.filter((b) => b.status !== 'closed' && b.lastVerified === null).map((b) => b.id);

// ── FAZ 5: Altyapı (infra) vs ürün buggı sınıflandırması (ADR-0026 §5) ──
// infra:true → 5xx/ağ geçidi/auth-cascade arızası; GERÇEK ürün buggı DEĞİL → ayrı sayılır.
const infraIds = KNOWN_BUGS.filter((b) => b.infra === true).map((b) => b.id);
const productCount = KNOWN_BUGS.length - infraIds.length;

// ── findings.json (makine-okur) ──
const json = {
  note: 'OTOMATİK ÜRETİLİR (npm run report:findings). Kaynak: tests/contracts/known-bugs.js. Elle düzenlemeyin.',
  total: KNOWN_BUGS.length,
  summary: { byStatus: by('status'), byGuard: by('guard'), bySeverity: by('severity'), byArea: by('area') },
  classification: { product: productCount, infra: infraIds.length, infraIds },
  governanceFlags: { ownerless, unverified },
  findings: KNOWN_BUGS,
};
writeFileSync(resolve(outDir, 'findings.json'), JSON.stringify(json, null, 2) + '\n');

// ── BULGULAR.md (global → alan → rota → bug kartı) ──
const L = [];
L.push('# Vomenta — Bulgu (Known-Bug) Raporu');
L.push('');
L.push('> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Kaynak: `tests/contracts/known-bugs.js` (source of truth). Güncelle: `npm run report:findings`.');
L.push('> HTML/PDF sürümü CI artifact\'idir (repoda tutulmaz).');
L.push('');
L.push('## Özet');
L.push('');
L.push(`- **Toplam bulgu:** ${KNOWN_BUGS.length}`);
L.push(`- **Durum:** ${Object.entries(by('status')).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
L.push(`- **Guard:** ${Object.entries(by('guard')).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
L.push(`- **Ciddiyet:** ${Object.entries(by('severity')).sort((a, b) => SEV_ORDER[a[0]] - SEV_ORDER[b[0]]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
L.push(`- **Sınıf:** ürün ${productCount} · altyapı ${infraIds.length}${infraIds.length ? ` — ${infraIds.join(', ')}` : ''}`);
L.push('> Not: `infra` bulgular 5xx/ağ geçidi/auth-cascade arızalarıdır (gerçek ürün buggı ile karışmaz).');
L.push('');
L.push('### Governance işaretleri');
L.push(`- **Sahipsiz (owner=null):** ${ownerless.length}${ownerless.length ? ` — ${ownerless.join(', ')}` : ''}`);
L.push(`- **Doğrulanmamış (lastVerified=null, açık):** ${unverified.length}${unverified.length ? ` — ${unverified.join(', ')}` : ''}`);
L.push('> Not: `expiry` gözden geçirme tarihi tarih-bağımlıdır; süresi-geçmiş uyarıları `quality:findings` (self-check) tarafından koşum anında basılır — rapora gömülmez (determinizm).');
L.push('');

// Özet tablo (id/alan/rota/ciddiyet/durum/guard/owner)
L.push('## Bulgu dizini');
L.push('');
L.push('| id | alan | rota | ciddiyet | durum | guard | owner |');
L.push('|---|---|---|---|---|---|---|');
const sorted = [...KNOWN_BUGS].sort((a, b) =>
  a.area.localeCompare(b.area) || a.route.localeCompare(b.route) || SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.id.localeCompare(b.id)
);
for (const b of sorted) {
  L.push(`| ${mdCell(b.id)} | ${mdCell(b.area)} | ${mdCell(b.route)} | ${mdCell(b.severity)} | ${mdCell(b.status)} | ${mdCell(b.guard)} | ${mdCell(b.owner ?? '—')} |`);
}
L.push('');

// Detay: alan → rota → bug kartı
L.push('## Ayrıntılar');
L.push('');
const areas = [...new Set(sorted.map((b) => b.area))];
for (const area of areas) {
  L.push(`## ${area}`);
  L.push('');
  const inArea = sorted.filter((b) => b.area === area);
  const routes = [...new Set(inArea.map((b) => b.route))];
  for (const route of routes) {
    L.push(`### ${mdCell(route)}`);
    L.push('');
    for (const b of inArea.filter((x) => x.route === route)) {
      L.push(`**[${b.id}] ${mdCell(b.title)}** — \`${b.severity}\` · \`${b.status}\` · guard \`${b.guard}\`${b.infra === true ? ' · `altyapı`' : ''}`);
      L.push('');
      if (b.expected) L.push(`- **Beklenen:** ${mdCell(b.expected)}`);
      if (b.actual) L.push(`- **Gerçekleşen:** ${mdCell(b.actual)}`);
      // FAZ 1 additive alanlar (ADR-0026 §3) — yalnız VARSA basılır.
      if (b.precondition) L.push(`- **Ön koşul:** ${mdCell(b.precondition)}`);
      if (b.env && Object.keys(b.env).length) {
        const envParts = ['browser', 'envName', 'role', 'locale', 'commit']
          .filter((k) => b.env[k]).map((k) => `${k}=${mdCell(b.env[k])}`);
        if (envParts.length) L.push(`- **Ortam:** ${envParts.join(' · ')}`);
      }
      if (b.repro?.length) {
        // repro: string[] (legacy) VEYA [{ step, selector }] (yapısal) — her ikisini de işle.
        const steps = b.repro.map((r) =>
          typeof r === 'string' ? mdCell(r)
            : (r.selector ? `${mdCell(r.step)} (\`${mdCell(r.selector)}\`)` : mdCell(r.step)));
        L.push(`- **Repro:** ${steps.join(' → ')}`);
      }
      if (b.firstFailingStep !== undefined && b.firstFailingStep !== null) {
        L.push(`- **İlk kırılan adım:** ${mdCell(String(b.firstFailingStep))}`);
      }
      if (b.possibleCauses?.length) L.push(`- **Olası nedenler:** ${b.possibleCauses.map(mdCell).join('; ')}`);
      L.push(`- **Kök neden (kanıtlanmış):** ${b.rootCause ? mdCell(b.rootCause) : '_araştırılmadı / kanıtlanmadı_'}`);
      if (b.rootCauseCandidate) L.push(`- **Kök-neden adayı (forensik):** ${mdCell(b.rootCauseCandidate)}`);
      if (b.suggestedFixes?.length) L.push(`- **Olası çözümler:** ${b.suggestedFixes.map(mdCell).join('; ')}`);
      // Kanıt (FAZ 1 registry evidence[] + FAZ 4 evidence-index.json join).
      // Dürüstlük: registry VE index'te kanıt YOKSA "Kanıt: yok" (uydurma yok).
      // piiReviewed KAPISI korunur; ADR §6: trace GÖMÜLMEZ (yalnız local ipucu).
      const evParts = [];
      if (b.evidence?.length) {
        for (const e of b.evidence) {
          const label = e.kind ? `${mdCell(e.kind)}: ${mdCell(e.path)}` : mdCell(e.path);
          // FAZ 4: runUrl VARSA tıklanabilir link olarak göster.
          const src = e.runUrl ? `${mdCell(e.source)}, [koşum](${mdCell(e.runUrl)})` : mdCell(e.source);
          let part = e.piiReviewed === true
            ? `${label} (${src})`
            : `${label} (${src} — ⚠ PII incelemesi bekliyor, gömülmez)`;
          if (e.kind === 'trace' && e.artifactPath) {
            part += ` — local: \`npx playwright show-trace ${mdCell(e.artifactPath)}\``;
          }
          evParts.push(part);
        }
      }
      // FAZ 4: evidence-index.json[findingId] → tıklanabilir CI koşum linki + provenance.
      // artifactPath CI artifact yolu (repoda DEĞİL) → GÖMÜLMEZ; ad + link gösterilir (Option A).
      const idxRec = evidenceIndex[b.id];
      if (idxRec && idxRec.artifactPath) {
        const link = idxRec.runUrl ? `[CI koşumu](${mdCell(idxRec.runUrl)})` : '_koşum linki yok_';
        const meta = [];
        if (idxRec.capturedAt) meta.push(`yakalandı ${mdCell(idxRec.capturedAt)}`);
        if (idxRec.expiry) meta.push(`geçerlilik ${mdCell(idxRec.expiry)}`);
        const metaStr = meta.length ? ` · ${meta.join(' · ')}` : '';
        evParts.push(`maskeli kanıt \`${mdCell(idxRec.artifactPath)}\` (${link}${metaStr})`);
      }
      if (evParts.length) {
        L.push(`- **Kanıt:** ${evParts.join(' · ')}`);
      } else {
        L.push('- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_');
      }
      L.push(`- **Owner:** ${b.owner ?? '_atanmadı_'} · **issueRef:** ${b.issueRef ?? '_yok_'} · **opened:** ${b.opened ?? '—'} · **lastVerified:** ${b.lastVerified ?? '—'} · **expiry:** ${b.expiry ?? '—'}`);
      L.push(`- **Guard testi:** \`${mdCell(b.test.file)}\` → ${mdCell(b.test.title)}`);
      L.push('');
    }
  }
}

writeFileSync(resolve(outDir, 'BULGULAR.md'), L.join('\n'));
console.log(
  `Bulgu raporu yazıldı: docs/raporlar/findings.json + BULGULAR.md ` +
  `(${KNOWN_BUGS.length} bulgu; sahipsiz ${ownerless.length}, doğrulanmamış ${unverified.length}).`
);
