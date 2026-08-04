#!/usr/bin/env node
// @ts-check
/**
 * AUTH-RETRY SELF-CHECK — SERT KAPI.
 *
 * `tests/support/gateway-retry.js` saf modülünün sözleşmesini TAMAMEN
 * DETERMİNİSTİK, tarayıcı/production OLMADAN doğrular:
 *
 *   1) 503 → retry (tek gateway blip'i sonrası yeniden denenir)
 *   2) 503 ardından success → PASS (ikinci deneme geçerse başarı döner)
 *   3) üç kez 503 → FAIL (deneme hakkı bitince gateway hatası fırlatılır)
 *   4) 401/403 → retry YOK (yetki hatası gerçek başarısızlıktır)
 *   5) locator/assertion hatası → retry YOK (gateway kanıtı yok)
 *   +  gateway body-text tespiti + status sınıflandırma birim kontrolleri
 *
 * Çalıştır:  node tools/self-check-auth-retry.mjs  (npm run quality:auth-retry)
 */
import {
  GATEWAY_STATUS_CODES,
  MAX_AUTH_ATTEMPTS,
  isGatewayStatus,
  shouldRetryAuth,
  pickGatewayStatus,
  gatewayStatusFromBodyText,
  GatewayUnavailableError,
  runAuthWithGatewayRetry,
} from '../tests/support/gateway-retry.js';

const errors = [];
const fail = (m) => errors.push(m);
const ok = (cond, m) => { if (!cond) fail(m); };

/** Gateway kanıtı taşıyan sentetik hata (LoginPage'in ürettiğiyle aynı şekil). */
const gwError = (status) => new GatewayUnavailableError(status, 'sentetik');
/** Gateway kanıtı OLMAYAN hata (401/403/locator/assertion). */
const plainError = (msg) => new Error(msg);

async function main() {
  // ── Birim: status sınıflandırma ──────────────────────────────────────────
  {
    ok(GATEWAY_STATUS_CODES.length === 3, 'birim: tam 3 gateway kodu (502/503/504).');
    ok([502, 503, 504].every(isGatewayStatus), 'birim: 502/503/504 gateway sayılmalı.');
    ok(![200, 301, 400, 401, 403, 404, 500, 501].some(isGatewayStatus),
      'birim: gateway olmayan kodlar (401/403/500 dahil) retry sınıfına girmemeli.');
    ok(shouldRetryAuth({ gatewayStatus: 503 }) === true, 'birim: 503 kanıtı → retry.');
    ok(shouldRetryAuth({ gatewayStatus: 401 }) === false, 'birim: 401 kanıtı → retry değil.');
    ok(shouldRetryAuth({ gatewayStatus: null }) === false, 'birim: kanıt yok → retry değil.');
    ok(shouldRetryAuth(null) === false, 'birim: evidence null → retry değil.');
  }

  // ── Birim: ağ üzerinde gözlemlenen 5xx yanıt tespiti (pickGatewayStatus) ──
  // Sayfa 200 dönüp içerik render edemediğinde (arka plan API 503) gateway kanıtı
  // YALNIZ gözlemlenen yanıt kodlarında görünür; body metni 5xx içermez.
  {
    ok(pickGatewayStatus([200, 204, 503]) === 503, 'birim: gözlemlenen 503 yanıtı seçilmeli.');
    ok(pickGatewayStatus([200, 502, 200, 504]) === 504, 'birim: en SON gateway yanıtı seçilmeli.');
    ok(pickGatewayStatus([200, 301, 401, 403, 404, 500]) === null,
      'birim: 5xx-gateway olmayan yanıtlar (401/403/500 dahil) seçilmemeli.');
    ok(pickGatewayStatus([]) === null && pickGatewayStatus(null) === null,
      'birim: boş/null gözlem → null.');
  }

  // ── Birim: nginx 5xx body-text tespiti (login formu yanlış-pozitif vermez) ─
  {
    ok(gatewayStatusFromBodyText('503 Service Temporarily Unavailable\nnginx') === 503,
      'birim: nginx 503 sayfası tespit edilmeli.');
    ok(gatewayStatusFromBodyText('502 Bad Gateway') === 502, 'birim: 502 Bad Gateway tespiti.');
    ok(gatewayStatusFromBodyText('504 Gateway Time-out') === 504, 'birim: 504 Gateway Timeout tespiti.');
    ok(gatewayStatusFromBodyText('Welcome back — Log in to Vomenta') === null,
      'birim: normal login sayfası gateway sayılmamalı (yanlış-pozitif yok).');
    ok(gatewayStatusFromBodyText('') === null && gatewayStatusFromBodyText(undefined) === null,
      'birim: boş/undefined metin → null.');
    ok(gatewayStatusFromBodyText('error code 503 was seen') === null,
      'birim: gateway ifadesi olmadan çıplak sayı gateway sayılmamalı.');
  }

  // ── 1) 503 → retry (tek blip sonrası yeniden denenir) ─────────────────────
  {
    let calls = 0;
    const result = await runAuthWithGatewayRetry(async () => {
      calls++;
      if (calls === 1) throw gwError(503); // ilk deneme gateway blip'i
      return 'ok';
    }, { sleep: async () => {} });
    ok(calls === 2, `1: 503 sonrası tam 1 retry beklenir (denemeler=${calls}).`);
    ok(result === 'ok', '1: retry sonrası başarı değeri dönmeli.');
  }

  // ── 2) 503 ardından success → PASS ────────────────────────────────────────
  {
    const seq = [503, null]; // deneme1: 503, deneme2: başarı
    let i = 0;
    let passed = false;
    await runAuthWithGatewayRetry(async () => {
      const s = seq[i++];
      if (s) throw gwError(s);
      passed = true;
    }, { sleep: async () => {} });
    ok(passed, '2: 503→success dizisinde nihai sonuç PASS olmalı.');
  }

  // ── 3) üç kez 503 → FAIL (deneme hakkı biter, gateway hatası fırlar) ───────
  {
    let calls = 0;
    let threw = null;
    try {
      await runAuthWithGatewayRetry(async () => {
        calls++;
        throw gwError(503); // her deneme gateway blip'i
      }, { sleep: async () => {} });
    } catch (e) {
      threw = e;
    }
    ok(calls === MAX_AUTH_ATTEMPTS, `3: tam ${MAX_AUTH_ATTEMPTS} deneme yapılmalı (yapıldı=${calls}).`);
    ok(threw instanceof GatewayUnavailableError && threw.gatewayStatus === 503,
      '3: üç 503 sonrası GatewayUnavailableError fırlatılmalı (false-green yok).');
  }

  // ── 4) 401/403 → retry YOK (yetki hatası gerçek başarısızlıktır) ──────────
  {
    for (const code of [401, 403]) {
      let calls = 0;
      let threw = null;
      // 401/403: LoginPage bunu GatewayUnavailableError'a ÇEVİRMEZ (gateway kanıtı
      // yok) → düz Error yükselir; retry runner düz Error'ı retry etmez.
      try {
        await runAuthWithGatewayRetry(async () => {
          calls++;
          throw plainError(`auth ${code} forbidden`);
        }, { sleep: async () => {} });
      } catch (e) {
        threw = e;
      }
      ok(calls === 1, `4: ${code} → retry YOK, tek deneme (yapıldı=${calls}).`);
      ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError),
        `4: ${code} orijinal hata olarak yükselmeli (gateway'e çevrilmemeli).`);
    }
  }

  // ── 5) locator/assertion hatası → retry YOK (gateway kanıtı yok) ──────────
  {
    let calls = 0;
    let threw = null;
    try {
      await runAuthWithGatewayRetry(async () => {
        calls++;
        throw plainError("locator('nav') not found"); // gateway kanıtı taşımaz
      }, { sleep: async () => {} });
    } catch (e) {
      threw = e;
    }
    ok(calls === 1, `5: locator hatası → retry YOK, tek deneme (yapıldı=${calls}).`);
    ok(threw instanceof Error && !(threw instanceof GatewayUnavailableError),
      '5: locator hatası orijinal haliyle yükselmeli.');
  }

  // ── 6) 502/504 de retry edilir (yalnız 503 değil) ─────────────────────────
  {
    for (const code of [502, 504]) {
      let calls = 0;
      const r = await runAuthWithGatewayRetry(async () => {
        calls++;
        if (calls === 1) throw gwError(code);
        return 'ok';
      }, { sleep: async () => {} });
      ok(calls === 2 && r === 'ok', `6: ${code} de retry edilmeli.`);
    }
  }

  // ── 7) CI'da gözlenen mod: sayfa 200 döner ama arka plan API 503'ü içeriği
  //      bloke eder → gateway kanıtı YALNIZ gözlemlenen ağ yanıtında görünür
  //      (body 5xx metni yok). LoginPage'in `pickGatewayStatus(observed)` yolu
  //      bunu yakalayıp retry etmeli; aksi halde ilk-run'daki gibi erken FAIL.
  {
    const observedPerAttempt = [[503], [200, 503], [200]]; // 1: net 503, 2: 200+API503, 3: temiz
    let i = 0;
    let passed = false;
    await runAuthWithGatewayRetry(async () => {
      const gw = pickGatewayStatus(observedPerAttempt[i++]);
      if (isGatewayStatus(gw)) throw new GatewayUnavailableError(gw, 'sentetik-ağ');
      passed = true;
    }, { sleep: async () => {} });
    ok(passed && i === 3,
      '7: sayfa-200-ama-API-503 denemesi ağ kanıtıyla retry edilip 3. denemede PASS olmalı.');
  }
}

await main();

// ── Sonuç ────────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\n${errors.length} auth-retry self-check ihlali.`);
  process.exit(1);
}
console.log(
  'Auth-retry self-check geçti: 7 sözleşme (503→retry, 503→success→PASS, ' +
    `3×503→FAIL, 401/403→retry-yok, locator→retry-yok, 502/504→retry, ` +
    `sayfa-200-ama-API-503→ağ-kanıtıyla-retry) + status/pickGatewayStatus/body-text ` +
    `birim kontrolleri. Sınırlı retry (≤${MAX_AUTH_ATTEMPTS}); yalnız gerçek gateway kanıtında.`
);
