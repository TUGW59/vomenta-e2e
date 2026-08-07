// @ts-check
/**
 * L2·style RATCHET (ADR-0031). Her KAYITLI rota şu üç terminal durumdan birinde olmalı:
 *   (a) L2·style/L2·deep (stil sözleşmesi karşılandı),
 *   (b) style-backlog.js'te `PENDING` (yapılacak iş),
 *   (c) style-backlog.js'te `defer:*` (yapısal olarak çıkamaz: dinamik/blocked).
 * İhlal → exit 1 (fail-closed). SALT docs/raporlar/SURFACE-DEPTH.json + style-backlog.js
 * okur (prod'suz, deterministik). Çalıştırmadan ÖNCE `npm run report:surface` ile JSON güncel olmalı.
 *
 * "Hiçbir şey eksik kalmasın" garantisi: stil-kapsamsız (L0/L1) yeni bir rota backlog'a
 * eklenmeden kapı KIRMIZI olur; çözülen rota PENDING'de kalırsa (bayat) yine KIRMIZI olur.
 */
import { readFileSync } from 'node:fs';
import { STYLE_BACKLOG } from '../tests/contracts/style-backlog.js';

const j = JSON.parse(readFileSync(new URL('../docs/raporlar/SURFACE-DEPTH.json', import.meta.url), 'utf8'));
const STYLE_OK = new Set(['L2_STYLE', 'L2_DEEP']);

const violations = [];
const staleBacklog = [];
for (const p of j.pages) {
  const styled = STYLE_OK.has(p.highestProvenLevel); // stil sözleşmesi karşılandı
  const entry = Object.prototype.hasOwnProperty.call(STYLE_BACKLOG, p.route)
    ? String(STYLE_BACKLOG[p.route])
    : null;

  if (styled) {
    // Çözüldü → PENDING'de kalmamalı (defer girdisi de olmamalı: çıkabilmiş demek ki blocked değil).
    if (entry) staleBacklog.push(`${p.route} (artık ${p.highestProvenLevel} → style-backlog'dan SİL)`);
    continue;
  }
  // Stil-kapsamsız (L0/L1): backlog'da gerekçeli OLMALI.
  if (!entry) {
    violations.push(
      `${p.route} — stil sözleşmesi yok (highest=${p.highestProvenLevel}) ve style-backlog'da yok. Ya L2·style'a çıkar ya backlog'a gerekçe ekle.`
    );
  }
}

// style-backlog'da olup surface modelinde OLMAYAN girdi = yazım hatası / silinmiş rota.
for (const route of Object.keys(STYLE_BACKLOG)) {
  if (!j.pages.some((p) => p.route === route)) {
    staleBacklog.push(`${route} (surface modelinde yok — kayıtlı rota mı?)`);
  }
}

if (violations.length || staleBacklog.length) {
  if (violations.length) {
    console.error(`\n❌ style-ratchet: ${violations.length} ihlal:`);
    violations.forEach((v) => console.error('  - ' + v));
  }
  if (staleBacklog.length) {
    console.error(`\n⚠️  bayat style-backlog girdisi: ${staleBacklog.join(', ')}`);
  }
  process.exit(1);
}

const total = j.pages.length;
const styledCount = j.pages.filter((p) => STYLE_OK.has(p.highestProvenLevel)).length;
const pending = Object.values(STYLE_BACKLOG).filter((r) => String(r).startsWith('PENDING')).length;
const defer = Object.values(STYLE_BACKLOG).filter((r) => String(r).startsWith('defer')).length;
console.log(
  `✅ style-ratchet: ${total} rota tutarlı · L2·style+ ${styledCount} · bekleyen (PENDING) ${pending} · defer ${defer}`
);
