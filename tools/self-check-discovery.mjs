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
  ariaChanged: [],
  networkChanged: [],
});

// ── evaluateDriftPolicy: drift farkını PASS/FAIL kararına indirger ──
// baseline yok → OK (bootstrap), hiçbir failure üretmez.
{
  const r = evaluateDriftPolicy({ baselinePresent: false, addedRoutes: ['/x'], removedRoutes: [], ariaChanged: [], networkChanged: [] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.failures, []);
}
// kaldırılan rota → FAIL.
{
  const r = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: ['/reports'], ariaChanged: [], networkChanged: [] });
  assert.equal(r.ok, false);
  assert.equal(r.failures.length, 1);
  assert.match(r.failures[0], /removed-route: \/reports/);
}
// ARIA yapısı değişimi → FAIL.
{
  const r = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: [], ariaChanged: [{ route: '/voice', before: 'a', after: 'b' }], networkChanged: [] });
  assert.equal(r.ok, false);
  assert.match(r.failures[0], /aria-changed: \/voice/);
}
// kaldırılan endpoint → FAIL; eklenen endpoint → yalnız BİLGİ (kapı yeşil kalır).
{
  const removed = evaluateDriftPolicy({ baselinePresent: true, addedRoutes: [], removedRoutes: [], ariaChanged: [], networkChanged: [{ route: '/contacts', added: [], removed: ['GET /api/contacts'] }] });
  assert.equal(removed.ok, false);
  assert.match(removed.failures[0], /endpoint-removed: \/contacts/);
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

console.log('Discovery safety self-check geçti: origin/path kilidi, maskeleme, fingerprint diff ve drift politikası (removed/aria/endpoint → FAIL; added → info).');
