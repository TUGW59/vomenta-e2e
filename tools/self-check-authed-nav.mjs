#!/usr/bin/env node
// @ts-check
/**
 * AUTHED-NAV SELF-CHECK — SERT KAPI.
 *
 * `tests/support/gateway-navigation.js` glue modülünün KAPSAMLANMIŞ kanıt
 * sözleşmesini TAMAMEN DETERMİNİSTİK, tarayıcı/production OLMADAN doğrular.
 * Modül Playwright import ETMEDİĞİ için sahte (duck-typed) `page` ile sürülür;
 * response'lar resourceType + url + frame ile modellenir → kapsam kuralları
 * (first-party doc/xhr kabul; third-party/image/font/alt-frame red) gerçekten
 * test edilir.
 *
 * First-party URL'ler `environment.baseURL`'den türetilir (hard-code yok) →
 * BASE_URL ne olursa olsun kontroller kaymaz.
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
import { environment } from '../config/environment.js';

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

// ── First-party / third-party örnek origin'ler (environment'tan türetilir) ──
const BASE = environment.baseURL; // ör. https://app.vomenta.com
const BASE_HOST = new URL(BASE).hostname;
const APEX = BASE_HOST.split('.').filter(Boolean).slice(-2).join('.');
const FP_APP = `${BASE}/dashboard`;            // first-party ana document / app
const FP_API = `https://api.${APEX}/v1/me`;    // first-party API (same-site subdomain)
const THIRD_PARTY = 'https://www.google-analytics.com/collect'; // third-party

// Ana/alt frame sentinelleri (referans eşitliğiyle karşılaştırılır).
const MAIN_FRAME = { id: 'main' };
const SUB_FRAME = { id: 'sub' };

/**
 * Sahte response üretici.
 * @param {number} status
 * @param {{url?:string, type?:string, mainFrame?:boolean, nav?:boolean}} [o]
 */
function resp(status, { url = FP_API, type = 'xhr', mainFrame = true, nav } = {}) {
  return {
    status: () => status,
    url: () => url,
    request: () => ({
      resourceType: () => type,
      isNavigationRequest: () => (nav === undefined ? type === 'document' : nav),
    }),
    frame: () => (mainFrame ? MAIN_FRAME : SUB_FRAME),
  };
}

/**
 * Sahte Playwright `page`. `attempts[i]` her denemeyi tanımlar:
 *   { nav?:number, navThrows?:bool, navThrowMsg?:string, observed?:resp[],
 *     readyThrows?:bool, body?:string }
 * `goto()` deneme sayacını ilerletir, o denemenin `observed` yanıtlarını
 * (ready'den ÖNCE) emit eder; nav yanıtını da (document) emit eder.
 */
function makeFakePage(attempts) {
  const handlers = [];
  let idx = -1;
  let gotoCount = 0;
  const page = {
    on: (ev, fn) => { if (ev === 'response') handlers.push(fn); },
    mainFrame: () => MAIN_FRAME,
    goto: async () => {
      idx += 1;
      gotoCount += 1;
      const a = attempts[idx] || {};
      for (const r of (a.observed || [])) handlers.forEach((h) => h(r));
      if (a.navThrows) throw new Error(a.navThrowMsg || 'goto timeout');
      const s = a.nav ?? 200;
      const navResp = resp(s, { url: `${BASE}/x`, type: 'document', mainFrame: true, nav: true });
      handlers.forEach((h) => h(navResp)); // gerçek goto gibi document yanıtını da yayınla
      return navResp;
    },
    waitForLoadState: async () => {},
    locator: () => ({ innerText: async () => (attempts[idx]?.body ?? '') }),
    __ready: async () => { if (attempts[idx]?.readyThrows) throw new Error('nav not visible'); },
    __handlerCount: () => handlers.length,
    __gotoCount: () => gotoCount,
    __attempt: () => idx,
  };
  return page;
}

/** navigateWithGatewayRetry'ı sahte page için standart glue ile sürer. */
function runNav(page, where = 'gotoApp: /x') {
  return navigateWithGatewayRetry(page, {
    doGoto: () => page.goto('/x', { waitUntil: 'commit' }),
    afterCommit: () => page.waitForLoadState('domcontentloaded').catch(() => {}),
    ready: () => page.__ready(),
    where,
  });
}

/** console.warn'ı geçici olarak yakalar (retry log formatı doğrulaması). */
async function captureWarn(fn) {
  const original = console.warn;
  const lines = [];
  console.warn = (...args) => lines.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.warn = original;
  }
  return lines;
}

async function main() {
  // ══ BİRİM: observer idempotent + tek listener (N5) ════════════════════════
  {
    const p = makeFakePage([]);
    const obs = getGatewayObserver(p);
    const obs2 = getGatewayObserver(p);
    ok(obs === obs2, 'birim(N5): getGatewayObserver aynı page için aynı observer döndürmeli.');
    ok(p.__handlerCount() === 1, 'birim(N5): page başına tam TEK response listener kurulmalı.');
  }

  // ══ BİRİM: kanıt kapsamı — first-party doc/xhr/fetch kabul; third-party/
  //          image/font/alt-frame red (observer.evidence goto akışıyla incelenir).
  {
    // first-party xhr + fetch KABUL; third-party + image + font + alt-frame RED.
    const p = makeFakePage([
      {
        nav: 200,
        observed: [
          resp(503, { url: FP_API, type: 'xhr' }),                         // KABUL
          resp(503, { url: `https://api.${APEX}/v1/x`, type: 'fetch' }),    // KABUL
          resp(503, { url: THIRD_PARTY, type: 'xhr' }),                     // RED (third-party)
          resp(503, { url: `${BASE}/logo.png`, type: 'image' }),            // RED (image)
          resp(503, { url: `${BASE}/f.woff2`, type: 'font' }),              // RED (font)
          resp(503, { url: `${BASE}/frame`, type: 'document', mainFrame: false }), // RED (alt-frame)
        ],
        readyThrows: false,
      },
    ]);
    const obs = getGatewayObserver(p);
    obs.beginAttempt();
    await p.goto('/x'); // observed + nav(200 document) emit edilir
    const kinds = obs.evidence.map((e) => `${e.resourceType}:${new URL(e.url).hostname}`);
    // Beklenen kabul: first-party xhr, first-party fetch (+ nav 200 document GEÇMEZ; 200 gateway değil).
    ok(obs.evidence.length === 2,
      `birim(N6/N7): yalnız first-party xhr+fetch kanıt olmalı (bulunan=${JSON.stringify(kinds)}).`);
    ok(obs.evidence.every((e) => e.resourceType === 'xhr' || e.resourceType === 'fetch'),
      'birim(N7): image/font/third-party/alt-frame kanıt sayılmamalı.');
    const ev = await obs.detectEvidence();
    ok(ev && ev.status === 503 && (ev.source === 'first-party-xhr' || ev.source === 'first-party-fetch'),
      'birim(N6): detectEvidence son first-party kanıtı (status+source) döndürmeli.');
  }

  // U: first-party ana document 503 (nav) → main-document kanıt.
  {
    const p = makeFakePage([{ nav: 503 }]);
    const obs = getGatewayObserver(p);
    obs.beginAttempt();
    await p.goto('/x').catch(() => {});
    const ev = await obs.detectEvidence();
    ok(ev && ev.status === 503 && ev.source === 'main-document',
      'birim: first-party ana document 503 → main-document kanıt.');
  }

  // U: assertOrGateway iki dal.
  {
    // Kanıt VAR → GatewayUnavailableError.
    const p = makeFakePage([{ nav: 200, observed: [resp(503, { url: FP_API, type: 'xhr' })] }]);
    const obs = getGatewayObserver(p);
    obs.beginAttempt();
    await p.goto('/x');
    let threw = null;
    try { await assertOrGateway(obs, async () => { throw new Error('boom'); }, 'birim'); }
    catch (e) { threw = e; }
    ok(threw instanceof GatewayUnavailableError && threw.gatewayStatus === 503,
      'birim: kanıt varsa assertOrGateway GatewayUnavailableError fırlatmalı.');

    // Kanıt YOK → orijinal hata aynen.
    const p2 = makeFakePage([{ nav: 200 }]);
    const obs2 = getGatewayObserver(p2);
    obs2.beginAttempt();
    await p2.goto('/x');
    let threw2 = null;
    try { await assertOrGateway(obs2, async () => { throw new Error('plain'); }, 'birim'); }
    catch (e) { threw2 = e; }
    ok(threw2 instanceof Error && !(threw2 instanceof GatewayUnavailableError) && threw2.message === 'plain',
      'birim: kanıt yoksa assertOrGateway orijinal hatayı aynen fırlatmalı.');
  }

  // ══ NAVİGASYON SÖZLEŞMELERİ (uçtan uca) ═══════════════════════════════════

  // C1: nav 503 → retry → 2. denemede 200+ready OK → PASS (exact counts).
  {
    const p = makeFakePage([{ nav: 503 }, { nav: 200, readyThrows: false }]);
    await runNav(p);
    ok(p.__attempt() === 1 && p.__gotoCount() === 2,
      'C1: nav 503 → tam 1 retry, 2 goto, 2. denemede PASS.');
  }

  // C2 (KRİTİK): sayfa 200 ama first-party arka plan xhr 503 → ağ kanıtıyla retry.
  {
    const p = makeFakePage([
      { nav: 200, observed: [resp(503, { url: FP_API, type: 'xhr' })], readyThrows: true, body: '' },
      { nav: 200, observed: [], readyThrows: false, body: '' },
    ]);
    await runNav(p);
    ok(p.__attempt() === 1 && p.__gotoCount() === 2,
      'C2: sayfa-200-ama-first-party-API-503 → ağ kanıtıyla retry, 2. denemede PASS.');
  }

  // C3: ready patlar + kanıt YOK → retry YOK, orijinal hata (fail-closed).
  {
    const p = makeFakePage([{ nav: 200, observed: [], readyThrows: true, body: '' }]);
    let threw = null;
    try { await runNav(p); } catch (e) { threw = e; }
    ok(p.__attempt() === 0 && p.__gotoCount() === 1, 'C3: kanıt yoksa tek deneme (retry yok).');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError)
      && threw.message === 'nav not visible',
      'C3: orijinal hata aynen (GatewayUnavailableError DEĞİL).');
  }

  // C4: nav 401 → gateway sınıfı değil → retry YOK.
  {
    const p = makeFakePage([{ nav: 401, observed: [], readyThrows: true, body: '' }]);
    let threw = null;
    try { await runNav(p); } catch (e) { threw = e; }
    ok(p.__attempt() === 0 && p.__gotoCount() === 1, 'C4: 401 → tek deneme (retry yok).');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError),
      'C4: 401 orijinal hata (gateway sınıfına girmez).');
  }

  // C5: 3×503 → MAX_AUTH_ATTEMPTS sonra GatewayUnavailableError (false-green yok).
  {
    const p = makeFakePage([{ nav: 503 }, { nav: 503 }, { nav: 503 }]);
    let threw = null;
    try { await runNav(p); } catch (e) { threw = e; }
    ok(p.__gotoCount() === MAX_AUTH_ATTEMPTS, `C5: tam ${MAX_AUTH_ATTEMPTS} deneme.`);
    ok(threw instanceof GatewayUnavailableError && threw.gatewayStatus === 503,
      'C5: 3×503 sonrası GatewayUnavailableError.');
  }

  // C6: 502/504 nav → retry edilir.
  {
    for (const code of [502, 504]) {
      const p = makeFakePage([{ nav: code }, { nav: 200 }]);
      await runNav(p);
      ok(p.__attempt() === 1 && p.__gotoCount() === 2, `C6: nav ${code} de retry edilmeli.`);
    }
  }

  // C7: body-text nginx 503 (ağ gözlemi yok) → retry → PASS.
  {
    const p = makeFakePage([
      { nav: 200, observed: [], readyThrows: true, body: '<h1>503 Service Temporarily Unavailable</h1>\nnginx' },
      { nav: 200, observed: [], readyThrows: false, body: '' },
    ]);
    await runNav(p);
    ok(p.__attempt() === 1 && p.__gotoCount() === 2, 'C7: body-text 503 kanıtıyla retry → PASS.');
  }

  // C8 (N1): third-party 503 + ready failure → retry YOK, orijinal hata.
  {
    const p = makeFakePage([
      { nav: 200, observed: [resp(503, { url: THIRD_PARTY, type: 'xhr' })], readyThrows: true, body: '' },
    ]);
    let threw = null;
    try { await runNav(p); } catch (e) { threw = e; }
    ok(p.__attempt() === 0 && p.__gotoCount() === 1, 'C8(N1): third-party 503 → retry YOK.');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError)
      && threw.message === 'nav not visible',
      'C8(N1): third-party 503 gateway kanıtı sayılmamalı → orijinal hata.');
  }

  // C9 (N2): önceki attempt'in 503'ü sonraki assertion'da KULLANILAMAZ (stale).
  {
    const p = makeFakePage([
      { nav: 200, observed: [resp(503, { url: FP_API, type: 'xhr' })], readyThrows: true, body: '' }, // retry
      { nav: 200, observed: [], readyThrows: true, body: '' }, // kanıt YOK → orijinal hata
    ]);
    let threw = null;
    try { await runNav(p); } catch (e) { threw = e; }
    ok(p.__gotoCount() === 2, 'C9(N2): 1. deneme retry etti, 2. deneme çalıştı.');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError)
      && threw.message === 'nav not visible',
      'C9(N2): önceki denemenin 503\'ü stale — 2. assertion hatası gateway\'e ÇEVRİLMEZ.');
  }

  // C10 (N3): doGoto() exception + AYNI attempt'te scoped 503 → retry.
  {
    const p = makeFakePage([
      { navThrows: true, navThrowMsg: 'goto timeout', observed: [resp(503, { url: FP_API, type: 'xhr' })] },
      { nav: 200, readyThrows: false },
    ]);
    await runNav(p);
    ok(p.__attempt() === 1 && p.__gotoCount() === 2,
      'C10(N3): doGoto exception + scoped 503 → retry → PASS.');
  }

  // C11 (N4): doGoto() exception + kanıt YOK → orijinal error aynen.
  {
    const p = makeFakePage([{ navThrows: true, navThrowMsg: 'goto boom', observed: [] }]);
    let threw = null;
    try { await runNav(p); } catch (e) { threw = e; }
    ok(p.__attempt() === 0 && p.__gotoCount() === 1, 'C11(N4): doGoto exception + kanıt yok → tek deneme.');
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError)
      && threw.message === 'goto boom',
      'C11(N4): generic goto exception gateway\'e ÇEVRİLMEZ → orijinal error.');
  }

  // ══ BİRİM: retry logu secretsiz + doğru format ════════════════════════════
  {
    const p = makeFakePage([
      { nav: 200, observed: [resp(503, { url: FP_API, type: 'xhr' })], readyThrows: true },
      { nav: 200, readyThrows: false },
    ]);
    const lines = await captureWarn(() => runNav(p, 'gotoApp: /reports'));
    const line = lines.find((l) => l.includes('[authed-nav]'));
    ok(!!line, 'birim(log): retry sırasında [authed-nav] logu üretilmeli.');
    ok(!!line && /transient gateway 503; retrying 2\/3;/.test(line),
      'birim(log): status + retrying n/max formatı doğru olmalı.');
    ok(!!line && line.includes('where="gotoApp: /reports"') && line.includes('source="first-party-xhr"'),
      'birim(log): where + source etiketleri bulunmalı.');
    // Secret sızıntısı yok: url/token/email/cookie/body loglanmaz.
    ok(!!line && !line.includes(FP_API) && !/token|cookie|password|storagestate/i.test(line),
      'birim(log): url/token/cookie/password/body ASLA loglanmamalı.');
  }
}

await main();

// ── Sonuç ────────────────────────────────────────────────────────────────────
const CONTRACTS = 20; // 11 navigasyon (C1–C11) + 9 birim (kapsam/idempotent/iki-dal/log)
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} authed-nav self-check ihlali (${CONTRACTS} sözleşme).`);
  process.exit(1);
}
console.log(
  `Authed-nav self-check geçti: ${CONTRACTS} sözleşme — 11 navigasyon ` +
    '(nav-503→retry, sayfa-200-ama-first-party-API-503→retry, kanıt-yok→retry-yok, ' +
    '401→retry-yok, 3×503→FAIL, 502/504→retry, body-text→retry, third-party-503→retry-yok, ' +
    'stale-evidence-reddi, doGoto-exception+503→retry, doGoto-exception+kanıtsız→orijinal) + ' +
    '9 birim (first-party-doc/xhr/fetch kabul, third-party/image/font/alt-frame red, ' +
    'observer idempotent+tek-listener, assertOrGateway iki-dal, secretsiz retry-log formatı). ' +
    `Sınırlı retry (≤${MAX_AUTH_ATTEMPTS}); yalnız kapsamlı gerçek gateway kanıtında; fail-closed.`
);
