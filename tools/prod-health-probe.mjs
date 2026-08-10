// @ts-check
/**
 * PROD-HEALTH PREFLIGHT PROBE (WP-NIGHT-INFRA / dead-nightly dayanıklılık katmanı).
 *
 * NEDEN: Nightly authed lane'leri `tests/auth.setup.js` üzerinden prod'a login
 * olur. Prod gateway'i bir pencere boyunca SÜREKLİ 503 döndüğünde auth.setup
 * sınırlı gateway-retry'ını tüketir → storageState yazılamaz → TÜM authed testler
 * "unknown"a cascade eder ve job KIRMIZI olur. Böyle bir infra penceresi, gerçek
 * bir E2E regresyonundan ayırt edilemeyen kalıcı-kırmızı ("ölü sinyal") üretir.
 *
 * BU PROBE bir SINIFLANDIRICIDIR, bir test DEĞİLDİR: prod'un ayakta olup
 * olmadığını PUBLIC (credential'sız) bir GET ile ölçer ve `up=true|false`
 * çıktısı verir. Authed nightly lane'leri bu çıktıya koşullanır:
 *   - up=true  → lane'ler NORMAL koşar (gerçek test hataları KIRMIZI kalır).
 *   - up=false → lane'ler SKIP edilir (NEUTRAL; kırmızı DEĞİL, yeşil de DEĞİL).
 *
 * DÜRÜSTLÜK / FALSE-GREEN KORUMASI:
 *   - "DOWN" yalnız SÜREKLİ kanıtla ilan edilir: probe penceresindeki TÜM
 *     denemeler gateway 5xx (502/503/504) veya ağ hatası dönerse. Tek bir
 *     başarılı yanıt (2xx/3xx/401/403 — gateway/app servis ediyor) → ANINDA UP
 *     (kısa devre), çünkü prod ayaktaysa gerçek kapsamı gizlemek YASAK.
 *   - Skip ≠ pass: GitHub skip'i gri gösterir; job özetine yüksek sesle
 *     "PROD DOWN — authed lane'ler ATLANDI (geçti DEĞİL)" yazılır.
 *   - Probe her hâlde exit 0 verir (kendisi bir kapı; kendi kırmızısı kapının
 *     amacını bozardı). Kararı `up` çıktısı taşır, exit kodu değil.
 *   - Bu, #151'in cron-reschedule fix'iyle DEFENSE-IN-DEPTH'tir: cron pencereyi
 *     zamanla aşar; probe pencere kayarsa da lane'leri kırmızı yerine nötr tutar.
 *
 * Çalıştır:  node tools/prod-health-probe.mjs
 *   env: BASE_URL (varsayılan https://app.vomenta.com)
 *        HEALTH_PROBE_ATTEMPTS (varsayılan 6, [1..20])
 *        HEALTH_PROBE_SPACING_MS (varsayılan 20000, [0..120000])
 *        HEALTH_PROBE_TIMEOUT_MS (varsayılan 15000, [1000..60000])
 */
import { appendFileSync } from 'node:fs';

/** gateway-retry.js ile AYNI küme (tek gerçeklik). */
const GATEWAY_STATUS_CODES = new Set([502, 503, 504]);

const BASE_URL = process.env.BASE_URL || 'https://app.vomenta.com';
const ATTEMPTS = clampInt(process.env.HEALTH_PROBE_ATTEMPTS, 6, 1, 20);
const SPACING_MS = clampInt(process.env.HEALTH_PROBE_SPACING_MS, 20_000, 0, 120_000);
const TIMEOUT_MS = clampInt(process.env.HEALTH_PROBE_TIMEOUT_MS, 15_000, 1_000, 60_000);

function clampInt(raw, dflt, min, max) {
  const n = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tek deneme. { serving: boolean, detail: string } döner.
 * serving=true → gateway/app yanıt veriyor (gateway 5xx DEĞİL). Ağ hatası veya
 * gateway 5xx → serving=false (down kanıtı).
 */
async function probeOnce() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE_URL, {
      method: 'GET',
      redirect: 'manual', // 307 login redirect = ayakta; takip etme
      signal: ctrl.signal,
      headers: { 'user-agent': 'vomenta-e2e-health-probe' },
    });
    if (GATEWAY_STATUS_CODES.has(res.status)) {
      return { serving: false, detail: `gateway ${res.status}` };
    }
    return { serving: true, detail: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
    return { serving: false, detail: `network: ${msg.slice(0, 80)}` };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`[prod-health] hedef=${BASE_URL} denemeler=${ATTEMPTS} aralık=${SPACING_MS}ms timeout=${TIMEOUT_MS}ms`);
  let up = false;
  let servingDetail = '';
  const seen = [];
  for (let i = 1; i <= ATTEMPTS; i++) {
    const r = await probeOnce();
    seen.push(`#${i}:${r.detail}`);
    console.log(`[prod-health] deneme ${i}/${ATTEMPTS} → ${r.serving ? 'SERVING' : 'down-evidence'} (${r.detail})`);
    if (r.serving) {
      up = true;
      servingDetail = r.detail;
      break; // kısa devre: ayakta olduğu kanıtlandı, gerçek kapsamı gizleme
    }
    if (i < ATTEMPTS && SPACING_MS > 0) await sleep(SPACING_MS);
  }

  const verdict = up
    ? `UP (serving: ${servingDetail}) → authed nightly lane'leri NORMAL koşacak`
    : `DOWN (${ATTEMPTS} deneme, tümü gateway 5xx / ağ hatası) → authed lane'ler ATLANACAK (NEUTRAL; geçti DEĞİL)`;
  console.log(`[prod-health] KARAR: ${verdict}`);
  console.log(`[prod-health] iz: ${seen.join('  ')}`);

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `up=${up ? 'true' : 'false'}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const line = up
      ? `✅ **Prod health: UP** — authed nightly lane'leri normal koştu (${servingDetail}).`
      : `⚠️ **Prod health: DOWN** — prod ~gateway 5xx penceresinde; authed nightly lane'leri **ATLANDI (geçti DEĞİL, NEUTRAL)**. Bu bir E2E regresyonu değil, bir ortam penceresidir.`;
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Nightly prod-health preflight\n\n${line}\n\n\`\`\`\n${seen.join('\n')}\n\`\`\`\n`
    );
  }

  process.exit(0); // kapı her hâlde exit 0: kararı `up` çıktısı taşır
}

main();
