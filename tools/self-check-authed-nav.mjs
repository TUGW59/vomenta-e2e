#!/usr/bin/env node
// @ts-check
/**
 * AUTHED-NAV SELF-CHECK — SERT KAPI.
 *
 * `tests/support/gateway-navigation.js` glue modülünün sözleşmesini TAMAMEN
 * DETERMİNİSTİK, tarayıcı/production OLMADAN doğrular. Modül Playwright import
 * ETMEDİĞİ için sahte (duck-typed) `page` ile sürülür; deneme-indeksine göre
 * navigasyon yanıtı / gözlemlenen ağ 5xx / ready-throws / body metni ayrı ayrı
 * kontrol edilebilir.
 *
 * Kapsanan 7 sözleşme:
 *   1) nav 503 → retry → 2. denemede 200+ready OK → PASS
 *   2) sayfa 200 ama arka plan API 503 (KRİTİK: kanıt yalnız ağda) → retry → PASS
 *   3) ready patlar + kanıt YOK → retry YOK, orijinal hata aynen (fail-closed)
 *   4) nav 401 → gateway sınıfı DEĞİL → retry YOK
 *   5) 3×503 → MAX_AUTH_ATTEMPTS sonra GatewayUnavailableError (false-green yok)
 *   6) 502/504 nav → retry edilir
 *   7) body-text yolu (nginx 5xx metni) → retry → PASS
 *   + assertOrGateway birim (kanıt var/yok iki dal)
 *
 * Çalıştır:  node tools/self-check-authed-nav.mjs  (npm run quality:authed-nav)
 */
import {
  MAX_AUTH_ATTEMPTS,
  GatewayUnavailableError,
} from '../tests/support/gateway-retry.js';
import {
  getGatewayObserver,
  assertOrGateway,
  navigateWithGatewayRetry,
} from '../tests/support/gateway-navigation.js';

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

/**
 * Sahte Playwright `page`: deneme indeksine göre nav yanıtı, gözlemlenen ağ 5xx,
 * ready-throws ve body metni sürülebilir. `goto()` her çağrıda deneme sayacını
 * ilerletir ve o denemenin gözlemlenen 5xx yanıtlarını (ready'den ÖNCE) emit eder.
 */
function makeFakePage({
  navStatusPerAttempt = [],
  bodyPerAttempt = [],
  observedPerAttempt = [],
  readyThrowsPerAttempt = [],
}) {
  const handlers = [];
  let attempt = -1;
  const page = {
    on: (ev, fn) => { if (ev === 'response') handlers.push(fn); },
    goto: async () => {
      attempt += 1;
      // Bu denemede gözlemlenen arka-plan 5xx yanıtlarını emit et (ready'den ÖNCE).
      for (const s of (observedPerAttempt[attempt] || [])) {
        handlers.forEach((h) => h({ status: () => s }));
      }
      const nav = navStatusPerAttempt[attempt] ?? 200;
      return { status: () => nav };
    },
    waitForLoadState: async () => {},
    locator: () => ({ innerText: async () => bodyPerAttempt[attempt] ?? '' }),
    // Ready adımı: bu denemede fırlatması işaretliyse orijinal (gateway-DIŞI) hata.
    __ready: async () => { if (readyThrowsPerAttempt[attempt]) throw new Error('nav not visible'); },
    __attempt: () => attempt,
  };
  return page;
}

/** navigateWithGatewayRetry'ı sahte page için standart glue ile sürer. */
function runNav(page, where = 'sentetik') {
  return navigateWithGatewayRetry(page, {
    doGoto: () => page.goto('/x', { waitUntil: 'commit' }),
    afterCommit: () => page.waitForLoadState('domcontentloaded').catch(() => {}),
    ready: () => page.__ready(),
    where,
  });
}

async function main() {
  // ── Birim: assertOrGateway iki dal ────────────────────────────────────────
  {
    // Kanıt VAR (ağ 503) → GatewayUnavailableError'a çevrilmeli.
    const p1 = makeFakePage({ observedPerAttempt: [[503]] });
    const obs1 = getGatewayObserver(p1);
    obs1.beginAttempt();
    await p1.goto('/x'); // 503 emit → observer'a düşer
    let threw = null;
    try {
      await assertOrGateway(obs1, async () => { throw new Error('boom'); }, 'birim');
    } catch (e) { threw = e; }
    ok(threw instanceof GatewayUnavailableError && threw.gatewayStatus === 503,
      'birim: kanıt varsa assertOrGateway GatewayUnavailableError fırlatmalı.');

    // Kanıt YOK → orijinal hata aynen.
    const p2 = makeFakePage({});
    const obs2 = getGatewayObserver(p2);
    obs2.beginAttempt();
    await p2.goto('/x');
    let threw2 = null;
    try {
      await assertOrGateway(obs2, async () => { throw new Error('plain'); }, 'birim');
    } catch (e) { threw2 = e; }
    ok(threw2 instanceof Error && !(threw2 instanceof GatewayUnavailableError) && threw2.message === 'plain',
      'birim: kanıt yoksa assertOrGateway orijinal hatayı aynen fırlatmalı.');
  }

  // ── 1) nav 503 → retry → 2. denemede 200 + ready OK → PASS ────────────────
  {
    const page = makeFakePage({
      navStatusPerAttempt: [503, 200],
      readyThrowsPerAttempt: [false, false],
    });
    await runNav(page);
    ok(page.__attempt() === 1, '1: nav 503 sonrası tam 1 retry (2. denemede PASS).');
  }

  // ── 2) sayfa 200 ama arka plan API 503 (KRİTİK — kanıt yalnız ağda) ───────
  {
    const page = makeFakePage({
      navStatusPerAttempt: [200, 200],
      observedPerAttempt: [[503], []],       // 1. deneme: arka plan 503, 2.: temiz
      readyThrowsPerAttempt: [true, false],  // 1. deneme ready patlar
      bodyPerAttempt: ['', ''],              // body'de 5xx METNİ yok → kanıt yalnız ağda
    });
    await runNav(page);
    ok(page.__attempt() === 1,
      '2: sayfa-200-ama-API-503 → ağ kanıtıyla retry edilip 2. denemede PASS.');
  }

  // ── 3) ready patlar + kanıt YOK → retry YOK (fail-closed) ─────────────────
  {
    const page = makeFakePage({
      navStatusPerAttempt: [200],
      observedPerAttempt: [[]],
      readyThrowsPerAttempt: [true],
      bodyPerAttempt: [''],
    });
    let threw = null;
    try { await runNav(page); } catch (e) { threw = e; }
    ok(page.__attempt() === 0, '3: kanıt yoksa retry YOK, tek deneme.');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError)
      && threw.message === 'nav not visible',
      '3: orijinal hata aynen yükselmeli (GatewayUnavailableError DEĞİL).');
  }

  // ── 4) nav 401 → gateway sınıfı DEĞİL → retry YOK ─────────────────────────
  {
    // 401 nav status'u kendisi throw ETMEZ (gateway değil) → ready patlar,
    // kanıt yoktur → orijinal hata; retry sınıfına girmez.
    const page = makeFakePage({
      navStatusPerAttempt: [401],
      observedPerAttempt: [[]],
      readyThrowsPerAttempt: [true],
      bodyPerAttempt: [''],
    });
    let threw = null;
    try { await runNav(page); } catch (e) { threw = e; }
    ok(page.__attempt() === 0, '4: 401 → retry YOK, tek deneme.');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError),
      '4: 401 orijinal hata olarak yükselmeli (gateway sınıfına girmez).');
  }

  // ── 5) 3×503 → MAX_AUTH_ATTEMPTS sonra GatewayUnavailableError ────────────
  {
    const page = makeFakePage({ navStatusPerAttempt: [503, 503, 503] });
    let threw = null;
    try { await runNav(page); } catch (e) { threw = e; }
    ok(page.__attempt() === MAX_AUTH_ATTEMPTS - 1,
      `5: tam ${MAX_AUTH_ATTEMPTS} deneme yapılmalı.`);
    ok(threw instanceof GatewayUnavailableError && threw.gatewayStatus === 503,
      '5: 3×503 sonrası GatewayUnavailableError (false-green yok).');
  }

  // ── 6) 502/504 nav → retry edilir ─────────────────────────────────────────
  {
    for (const code of [502, 504]) {
      const page = makeFakePage({ navStatusPerAttempt: [code, 200] });
      await runNav(page);
      ok(page.__attempt() === 1, `6: nav ${code} de retry edilmeli.`);
    }
  }

  // ── 7) body-text yolu (nginx 5xx metni, ağ gözlemi yok) → retry → PASS ────
  {
    const page = makeFakePage({
      navStatusPerAttempt: [200, 200],
      observedPerAttempt: [[], []],  // ağda 5xx YOK
      readyThrowsPerAttempt: [true, false],
      bodyPerAttempt: ['<h1>503 Service Temporarily Unavailable</h1>\nnginx', ''],
    });
    await runNav(page);
    ok(page.__attempt() === 1,
      '7: body-text 503 kanıtıyla retry edilip 2. denemede PASS.');
  }
}

await main();

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} authed-nav self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Authed-nav self-check geçti: 7 sözleşme (nav-503→retry, sayfa-200-ama-API-503→' +
    'ağ-kanıtıyla-retry, kanıt-yok→retry-yok, 401→retry-yok, 3×503→FAIL, 502/504→retry, ' +
    `body-text→retry) + assertOrGateway iki-dal birim. Sınırlı retry (≤${MAX_AUTH_ATTEMPTS}); ` +
    'yalnız gerçek gateway kanıtında; fail-closed korunur.'
);
