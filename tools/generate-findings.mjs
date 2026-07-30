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
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { KNOWN_BUGS } from '../tests/contracts/known-bugs.js';
import { mdCell } from './report-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'docs/raporlar');
mkdirSync(outDir, { recursive: true });

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const by = (k) => KNOWN_BUGS.reduce((a, b) => ((a[b[k]] = (a[b[k]] || 0) + 1), a), {});

// ── Governance işaretleri (yalnız DETERMİNİSTİK; tarih-bağımlı olan yok) ──
const ownerless = KNOWN_BUGS.filter((b) => b.owner === null).map((b) => b.id);
const unverified = KNOWN_BUGS.filter((b) => b.status !== 'closed' && b.lastVerified === null).map((b) => b.id);

// ── findings.json (makine-okur) ──
const json = {
  note: 'OTOMATİK ÜRETİLİR (npm run report:findings). Kaynak: tests/contracts/known-bugs.js. Elle düzenlemeyin.',
  total: KNOWN_BUGS.length,
  summary: { byStatus: by('status'), byGuard: by('guard'), bySeverity: by('severity'), byArea: by('area') },
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
      L.push(`**[${b.id}] ${mdCell(b.title)}** — \`${b.severity}\` · \`${b.status}\` · guard \`${b.guard}\``);
      L.push('');
      if (b.expected) L.push(`- **Beklenen:** ${mdCell(b.expected)}`);
      if (b.actual) L.push(`- **Gerçekleşen:** ${mdCell(b.actual)}`);
      if (b.repro?.length) L.push(`- **Repro:** ${b.repro.map(mdCell).join(' → ')}`);
      if (b.possibleCauses?.length) L.push(`- **Olası nedenler:** ${b.possibleCauses.map(mdCell).join('; ')}`);
      L.push(`- **Kök neden (kanıtlanmış):** ${b.rootCause ? mdCell(b.rootCause) : '_araştırılmadı / kanıtlanmadı_'}`);
      if (b.rootCauseCandidate) L.push(`- **Kök-neden adayı (forensik):** ${mdCell(b.rootCauseCandidate)}`);
      if (b.suggestedFixes?.length) L.push(`- **Olası çözümler:** ${b.suggestedFixes.map(mdCell).join('; ')}`);
      // piiReviewed KAPISI: yalnız piiReviewed:true kanıt gömülebilir; diğerleri yol + uyarı.
      if (b.evidence?.length) {
        const parts = b.evidence.map((e) =>
          e.piiReviewed === true
            ? `${mdCell(e.path)} (${mdCell(e.source)})`
            : `${mdCell(e.path)} (${mdCell(e.source)} — ⚠ PII incelemesi bekliyor, gömülmez)`
        );
        L.push(`- **Kanıt:** ${parts.join(' · ')}`);
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
