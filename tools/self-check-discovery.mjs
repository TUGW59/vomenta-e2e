import assert from 'node:assert/strict';
import {
  canonicalAriaStructure,
  structuralAria,
} from '../tests/discovery/probes.js';
import { redactUrl, safeInternalPath, classifyLanding } from '../tests/discovery/safety.js';
import {
  compareDiscoveryBaseline,
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

console.log('Discovery safety self-check geçti: origin/path kilidi, maskeleme ve fingerprint diff.');
