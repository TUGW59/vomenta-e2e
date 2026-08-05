// @ts-check
/**
 * L2·deep RATCHET (ADR-0029). Her DEDICATED rota şu üç terminal durumdan birinde olmalı:
 *   (a) L2·deep, (b) resolved-exempt (L2·style + applicableDimensions=[]),
 *   (c) depth-backlog.js'te gerekçeli.
 * İhlal → exit 1 (fail-closed). SALT docs/raporlar/SURFACE-DEPTH.json + depth-backlog.js
 * okur (prod'suz, deterministik). Çalıştırmadan ÖNCE `npm run report:surface` ile JSON
 * güncel olmalı (drift'i `report:surface:check` yakalar).
 */
import { readFileSync } from 'node:fs';
import { DEPTH_BACKLOG } from '../tests/contracts/depth-backlog.js';

const j = JSON.parse(readFileSync(new URL('../docs/raporlar/SURFACE-DEPTH.json', import.meta.url), 'utf8'));
const dedicated = j.pages.filter((p) => p.levels?.L2?.interaction?.surfaceArchetype === true);

const violations = [];
const staleBacklog = [];
for (const p of dedicated) {
  const deep = p.highestProvenLevel === 'L2_DEEP';
  const appl = (p.levels.L2.interaction.applicableDimensions || []).length;
  const exempt = !deep && appl === 0 && p.highestProvenLevel === 'L2_STYLE'; // saf-form: tüm boyut N/A
  const inBacklog = Object.prototype.hasOwnProperty.call(DEPTH_BACKLOG, p.route);

  if (deep || exempt) {
    if (inBacklog && !String(DEPTH_BACKLOG[p.route]).startsWith('defer')) staleBacklog.push(p.route);
    continue;
  }
  if (!inBacklog) {
    violations.push(
      `${p.route} — L2·deep değil (highest=${p.highestProvenLevel}, applicable=${appl}) ve backlog'da yok. Ya deepleştir ya backlog'a gerekçe ekle.`
    );
  }
}

// L0 defer girdileri: JSON'da highest=L0 olmalı; L2·style'a çıkmışsa defer'i kaldır.
for (const [route, reason] of Object.entries(DEPTH_BACKLOG)) {
  if (String(reason).startsWith('defer')) {
    const p = j.pages.find((x) => x.route === route);
    if (p && p.highestProvenLevel !== 'L0') staleBacklog.push(`${route} (defer ama artık ${p.highestProvenLevel})`);
  }
}

if (violations.length || staleBacklog.length) {
  if (violations.length) {
    console.error(`\n❌ depth-ratchet: ${violations.length} ihlal:`);
    violations.forEach((v) => console.error('  - ' + v));
  }
  if (staleBacklog.length) {
    console.error(`\n⚠️  bayat backlog girdisi (çözüldü → depth-backlog.js'ten SİL): ${staleBacklog.join(', ')}`);
  }
  process.exit(1);
}

const deepCount = dedicated.filter((p) => p.highestProvenLevel === 'L2_DEEP').length;
const pending = Object.entries(DEPTH_BACKLOG).filter(([, r]) => !String(r).startsWith('defer')).length;
console.log(
  `✅ depth-ratchet: ${dedicated.length} dedicated rota tutarlı · L2·deep=${deepCount} · bekleyen backlog=${pending}`
);
