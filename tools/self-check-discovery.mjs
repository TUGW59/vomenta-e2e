import assert from 'node:assert/strict';
import {
  canonicalAriaStructure,
  structuralAria,
} from '../tests/discovery/probes.js';
import { redactUrl, safeInternalPath, classifyLanding } from '../tests/discovery/safety.js';
import {
  compareDiscoveryBaseline,
  evaluateDriftPolicy,
  makeDiscoveryBaseline,
} from '../tests/discovery/baseline.js';

assert.equal(
  redactUrl('https://app.vomenta.com/contacts/123456?token=secret'),
  'https://app.vomenta.com/contacts/<id>?<redacted>'
);
assert.equal(
  redactUrl('https://app.vomenta.com/users/550e8400-e29b-41d4-a716-446655440000'),
  'https://app.vomenta.com/users/<id>'
);
assert.equal(
  safeInternalPath('/reports', 'https://app.vomenta.com'),
  '/reports'
);
assert.equal(
  safeInternalPath('/logout', 'https://app.vomenta.com'),
  null
);
assert.equal(
  safeInternalPath('https://example.com/contacts', 'https://app.vomenta.com'),
  null
);
assert.equal(
  safeInternalPath('/contacts?customer=secret', 'https://app.vomenta.com'),
  null
);

// classifyLanding: landing doğrulaması query/hash'i oturum kaybı SAYMAZ (false-red
// düzeltmesi). safeInternalPath BFS kuyruğu için query'de null döner; landing farklı.
assert.deepEqual(
  classifyLanding('https://app.vomenta.com/dashboard?tab=team', 'https://app.vomenta.com'),
  { path: '/dashboard', originLost: false }
);
assert.deepEqual(
  classifyLanding('https://app.vomenta.com/reports#section', 'https://app.vomenta.com'),
  { path: '/reports', originLost: false }
);
assert.deepEqual(
  classifyLanding('https://app.vomenta.com/voice/', 'https://app.vomenta.com'),
  { path: '/voice', originLost: false }
);
assert.deepEqual(
  classifyLanding('https://accounts.example.com/login', 'https://app.vomenta.com'),
  { path: null, originLost: true }
);
// Login/auth pathname'i origin AYNI iken korunur; oturum-kaybı kararını çağıran
// (crawler) pathname regex'iyle verir — classifyLanding path'i olduğu gibi döndürür.
assert.deepEqual(
  classifyLanding('https://app.vomenta.com/login', 'https://app.vomenta.com'),
  { path: '/login', originLost: false }
);

const aria = structuralAria(`
- heading "Jane Customer":
  - text: Jane Customer
  - /url: /contacts/550e8400-e29b-41d4-a716-446655440000
- button "Call +90 555 555 55 55"
`);
assert(!aria.includes('Jane Customer'));
assert(!aria.includes('550e8400'));
assert(!aria.includes('+90'));
assert(aria.includes('heading "<name>"'));
assert(aria.includes('text: <content>'));
assert.equal(
  canonicalAriaStructure('- row:\n  - cell\n- row:\n  - cell'),
  canonicalAriaStructure('- row:\n  - cell')
);

const report = {
  generatedAt: '2026-07-29T00:00:00.000Z',
  pages: [
    {
      route: '/contacts',
      ariaStructure: '- heading "<name>"',
      network: { endpoints: ['GET https://app.vomenta.com/api/contacts?<redacted>'] },
    },
  ],
};
const baseline = makeDiscoveryBaseline(report);
assert.equal(Object.keys(baseline.routes).length, 1);
assert.deepEqual(compareDiscoveryBaseline(report, baseline), {
  baselinePresent: true,
  baselineGeneratedAt: report.generatedAt,
  addedRoutes: [],
  removedRoutes: [],
  unvisitedBaselineRoutes: [],
  ariaChanged: [],
  networkChanged: [],
});

// ── F-023: removed vs unvisited-due-to-limit ayrımı (compareDiscoveryBaseline) ──
// Baseline iki rota içeriyor; bu koşum yalnız birini fingerprint'liyor. Denenmeyen
// (attemptedRoutes'ta OLMAYAN) baseline rotası "removed" DEĞİL "unvisited"tır →
// maxPages truncation false-positive'i engellenir (ör. keşfedilen /campaigns/outbound).
{
  const twoRouteReport = {
    generatedAt: '2026-07-29T00:00:00.000Z',
    pages: [
      {
        route: '/contacts',
        ariaStructure: '- heading "<name>"',
        network: { endpoints: ['GET https://app.vomenta.com/api/contacts?<redacted>'] },
      },
      {
        route: '/campaigns/outbound',
        ariaStructure: '- heading "<name>"',
        network: { endpoints: [] },
      },
    ],
  };
  const twoRouteBaseline = makeDiscoveryBaseline(twoRouteReport);

  // Koşum: sadece /contacts fingerprint'lendi; /campaigns/outbound LİMİT yüzünden
  // ziyaret edilmedi (attemptedRoutes'ta yok) → unvisited, removed DEĞİL.
  const truncatedRun = {
    generatedAt: '2026-08-08T00:00:00.000Z',
    attemptedRoutes: ['/contacts'],
    pages: [twoRouteReport.pages[0]],
  };
  const truncatedDiff = compareDiscoveryBaseline(truncatedRun, twoRouteBaseline);
  assert.deepEqual(truncatedDiff.removedRoutes, []);
  assert.deepEqual(truncatedDiff.unvisitedBaselineRoutes, ['/campaigns/outbound']);
  const truncatedPolicy = evaluateDriftPolicy(truncatedDiff);
  assert.equal(truncatedPolicy.ok, true);
  assert.deepEqual(truncatedPolicy.failures, []);
  assert.equal(
    truncatedPolicy.info.some((m) => /unvisited-baseline-route: \/campaigns\/outbound/.test(m)),
    true
  );

  // Koşum: /campaigns/outbound DENENDİ (attemptedRoutes'ta var) ama fingerprint
  // üretmedi (ör. redirect/404-away) → GERÇEK removed → FAIL (regresyon sinyali).
  const goneRun = {
    generatedAt: '2026-08-08T00:00:00.000Z',
    attemptedRoutes: ['/contacts', '/campaigns/outbound'],
    pages: [twoRouteReport.pages[0]],
  };
  const goneDiff = compareDiscoveryBaseline(goneRun, twoRouteBaseline);
  assert.deepEqual(goneDiff.removedRoutes, ['/campaigns/outbound']);
  assert.deepEqual(goneDiff.unvisitedBaselineRoutes, []);
  const gonePolicy = evaluateDriftPolicy(goneDiff);
  assert.equal(gonePolicy.ok, false);
  assert.match(gonePolicy.failures[0], /removed-route: \/campaigns\/outbound/);

  // Geriye dönük uyum: attemptedRoutes yoksa sayfası olan rotalar denenmiş sayılır.
  const legacyRun = {
    generatedAt: '2026-08-08T00:00:00.000Z',
    pages: [twoRouteReport.pages[0]],
  };
  const legacyDiff = compareDiscoveryBaseline(legacyRun, twoRouteBaseline);
  assert.deepEqual(legacyDiff.removedRoutes, ['/campaigns/outbound']);
  assert.deepEqual(legacyDiff.unvisitedBaselineRoutes, []);
}

// ── evaluateDriftPolicy: drift farkını PASS/FAIL kararına indirger ──
// baseline yok → OK (bootstrap), hiçbir failure üretmez.
{
  const r = evaluateDriftPolicy({ baselinePresent: false, addedRoutes: ['/x'], removedRoutes: [], ariaChanged: [], networkChanged: [] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.failures, []);
}
// kaldırılan rota (gerçekten denenip bulunamayan) → FAIL (kararlı regresyon sinyali).
{
  const r = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: ['/reports'], ariaChanged: [], networkChanged: [] });
  assert.equal(r.ok, false);
  assert.equal(r.failures.length, 1);
  assert.match(r.failures[0], /removed-route: \/reports/);
}
// ADR-0033: ARIA yapısı değişimi → yalnız BİLGİ (canlı-prod-beklenen drift; kapı yeşil).
{
  const r = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: [], ariaChanged: [{ route: '/voice', before: 'a', after: 'b' }], networkChanged: [] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.failures, []);
  assert.equal(r.info.some((m) => /aria-changed: \/voice/.test(m)), true);
}
// ADR-0033: endpoint eklendi/kaldırıldı → yalnız BİLGİ (canlı-prod-beklenen API drift'i).
{
  const removed = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: [], ariaChanged: [], networkChanged: [{ route: '/contacts', added: [], removed: ['GET /api/contacts'] }] });
  assert.equal(removed.ok, true);
  assert.deepEqual(removed.failures, []);
  assert.equal(removed.info.some((m) => /endpoint-removed: \/contacts/.test(m)), true);
  const added = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: [], ariaChanged: [], networkChanged: [{ route: '/contacts', added: ['GET /api/new'], removed: [] }] });
  assert.equal(added.ok, true);
  assert.deepEqual(added.failures, []);
  assert.equal(added.info.some((m) => /endpoint-added/.test(m)), true);
}
// eklenen rota → yalnız BİLGİ (yeni sayfa tek başına bug değildir).
{
  const r = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: ['/new-page'], removedRoutes: [], ariaChanged: [], networkChanged: [] });
  assert.equal(r.ok, true);
  assert.equal(r.info.some((m) => /added-route: \/new-page/.test(m)), true);
}
// temiz diff → OK.
{
  const r = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: [], ariaChanged: [], networkChanged: [] });
  assert.deepEqual(r, { ok: true, failures: [], info: [] });
}

console.log('Discovery safety self-check geçti: origin/path kilidi, maskeleme, fingerprint diff ve ADR-0033 drift politikası (gerçek-removed → FAIL; aria/endpoint/added/unvisited → info; F-023 truncation ayrımı).');
