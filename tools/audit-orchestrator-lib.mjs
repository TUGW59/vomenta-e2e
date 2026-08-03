// @ts-check
/**
 * WP-FULL-READONLY-AUDIT FAZ 2 — DOĞRULUK KAPILARI: orchestrator karar çekirdeği
 * (saf kütüphane, yan etkisiz).
 *
 * Runtime raporlamanın "false-green olmama" sözleşmesini tek yerde, deterministik
 * ve test edilebilir biçimde kodlar (HANDOFF §3.8 + §3.2 exit matrisi). Playwright'ı
 * çalıştırmak, dosya silmek/yazmak gibi yan etkiler CLI katmanındadır
 * (`run-audit.mjs`); bu dosya YALNIZ "hangi girdi kombinasyonu hangi final exit'i
 * verir" kararını içerir → `self-check-audit-orchestrator.mjs` tümünü sentetik
 * fixture'larla, production'a bağlanmadan doğrular.
 *
 * TEMEL İLKE (§3.8): "Basit `test && report` zinciri kabul edilmez." Test kırılınca
 * rapor YİNE üretilir (yönetici gerçeği görsün) ama final exit non-zero kalır.
 * Rapor üretilemezse test PASS olsa bile final exit non-zero. Runtime JSON yoksa
 * stale rapor ASLA kullanılmaz → hard failure.
 */

export const ORCHESTRATOR_SCHEMA_VERSION = 1;

/**
 * Kanonik final-exit gerekçeleri. Her biri tam olarak bir neden taşır; telemetri
 * ve kapanış raporu bunları birebir kullanır (serbest metin yok).
 */
export const FINAL_REASON = Object.freeze({
  OK: 'OK',
  RUNTIME_JSON_MISSING: 'RUNTIME_JSON_MISSING',
  STALE_RUNTIME_JSON: 'STALE_RUNTIME_JSON',
  REPORT_NOT_PRODUCED: 'REPORT_NOT_PRODUCED',
  REPORT_FAILED: 'REPORT_FAILED',
  TEST_FAILED: 'TEST_FAILED',
  TEST_FAILED_AND_REPORT_FAILED: 'TEST_FAILED_AND_REPORT_FAILED',
});

/**
 * Girdi kombinasyonundan final exit'i türetir. SIRALAMA ÖNEMLİ:
 *   1. Runtime JSON yoksa → hard fail (stale reuse yasak). Rapor hiç denenmez.
 *   2. Stale JSON tespit edildiyse → hard fail.
 *   3. Rapor üretilemediyse (generator çökmesi / dosya yok) → fail. Test PASS olsa bile.
 *   4. Rapor üretici non-zero döndüyse → fail (test durumundan bağımsız).
 *   5. Test non-zero döndüyse → fail (rapor üretilmiş OLSA BİLE). 3/4 ile birlikteyse
 *      birleşik gerekçe.
 *   6. Aksi halde → OK (0).
 *
 * @param {object} s
 * @param {boolean} s.runtimeJsonExists  Koşumdan sonra runtime JSON diskte var mı.
 * @param {boolean} [s.staleDetected]    Girdi eski koşuma mı ait (min-start-time ihlali).
 * @param {boolean} s.reportProduced     Generator zorunlu çıktı dosyalarını yazdı mı.
 * @param {number}  s.testExitCode       Playwright test süreç exit code'u.
 * @param {number}  s.reportExitCode     Rapor generator süreç exit code'u.
 * @returns {{ finalExit: number, reason: string, testFailed: boolean, reportFailed: boolean }}
 */
export function decideFinalExit(s) {
  const testExitCode = Number(s.testExitCode);
  const reportExitCode = Number(s.reportExitCode);
  const runtimeJsonExists = s.runtimeJsonExists === true;
  const staleDetected = s.staleDetected === true;
  const reportProduced = s.reportProduced === true;

  const testFailed = !Number.isFinite(testExitCode) || testExitCode !== 0;
  const reportFailed = !reportProduced || !Number.isFinite(reportExitCode) || reportExitCode !== 0;

  // 1) Stale reuse yasağı: runtime JSON hiç yoksa rapor katmanına GEÇME.
  if (!runtimeJsonExists) {
    return { finalExit: 1, reason: FINAL_REASON.RUNTIME_JSON_MISSING, testFailed, reportFailed: true };
  }
  // 2) Eski koşum: taze olmayan girdi asla PASS gibi raporlanmaz.
  if (staleDetected) {
    return { finalExit: 1, reason: FINAL_REASON.STALE_RUNTIME_JSON, testFailed, reportFailed: true };
  }

  // 3-5) Rapor ve test katmanları BAĞIMSIZ değerlendirilir; ikisi de kırıksa
  //      birleşik gerekçe verilir (§3.8 exit matrisi FAIL/FAIL satırı).
  if (testFailed && reportFailed) {
    const reason = !reportProduced ? FINAL_REASON.REPORT_NOT_PRODUCED : FINAL_REASON.TEST_FAILED_AND_REPORT_FAILED;
    return { finalExit: 1, reason, testFailed, reportFailed };
  }
  if (reportFailed) {
    return {
      finalExit: 1,
      reason: reportProduced ? FINAL_REASON.REPORT_FAILED : FINAL_REASON.REPORT_NOT_PRODUCED,
      testFailed,
      reportFailed,
    };
  }
  if (testFailed) {
    // Rapor başarıyla üretildi (yönetici gerçeği görür) ama final yine kırmızı.
    return { finalExit: 1, reason: FINAL_REASON.TEST_FAILED, testFailed, reportFailed };
  }
  return { finalExit: 0, reason: FINAL_REASON.OK, testFailed: false, reportFailed: false };
}

/**
 * §3.2 zorunlu exit matrisini makine-okur biçimde döndürür (dokümantasyon + self
 * -check tek kaynaktan doğrulasın diye). Her satır decideFinalExit ile bire bir
 * tutarlı olmalıdır; self-check bunu enforce eder.
 * @returns {{ label:string, input: Parameters<typeof decideFinalExit>[0], expectExit: number }[]}
 */
export function exitMatrix() {
  const base = { runtimeJsonExists: true, staleDetected: false, reportProduced: true, testExitCode: 0, reportExitCode: 0 };
  return [
    { label: 'PASS + report PASS → 0', input: { ...base }, expectExit: 0 },
    { label: 'FAIL + report PASS → non-zero', input: { ...base, testExitCode: 1 }, expectExit: 1 },
    { label: 'PASS + report FAIL → non-zero', input: { ...base, reportExitCode: 1 }, expectExit: 1 },
    { label: 'FAIL + report FAIL → non-zero', input: { ...base, testExitCode: 1, reportExitCode: 1 }, expectExit: 1 },
    { label: 'runtime JSON yok → non-zero', input: { ...base, runtimeJsonExists: false }, expectExit: 1 },
    { label: 'stale JSON → non-zero', input: { ...base, staleDetected: true }, expectExit: 1 },
    { label: 'rapor üretilmedi (PASS test) → non-zero', input: { ...base, reportProduced: false }, expectExit: 1 },
  ];
}

/**
 * Güvenli, deterministik hata parmak izi (§item13). Ham mesaj/stack ASLA taşınmaz;
 * yalnız normalize edilmiş sınıf + kısa stabil hash döner. Aynı normalize mesaj →
 * aynı fingerprint (koşumlar arası delta eşlemesi için), farklı mesaj → farklı.
 *
 * Normalizasyon: sayılar/uuid/hex/yol parçaları maskelenir ki "line 5" ile "line 9"
 * aynı parmak izini üretsin (gürültü delta'yı kirletmesin).
 *
 * @param {string} rawClassOrMessage  Güvenli hata sınıfı ya da zaten sanitize edilmiş başlık.
 * @param {(text:string)=>string} sha1Hex  Enjekte edilen hash (lib saf kalsın; CLI crypto verir).
 * @returns {string}  Örn. "timeout#a1b2c3d4"
 */
export function errorFingerprint(rawClassOrMessage, sha1Hex) {
  const norm = String(rawClassOrMessage || 'unknown')
    .toLowerCase()
    .replace(/[0-9a-f]{8,}/g, '#')       // hex/uuid/token benzeri
    .replace(/\d+/g, '#')                 // satır/sütun/sayı
    .replace(/[\/\\][^\s"']+/g, '#path')  // yol parçaları
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  const cls = norm.split(' ')[0] || 'unknown';
  const hash = String(sha1Hex(norm)).slice(0, 8);
  return `${cls}#${hash}`;
}

/**
 * İki üretilmiş çıktı metninin AYNI kanonik sayıları taşıdığını doğrular (§item14).
 * Sayı listesi çağıran tarafından verilir (model → [{label,value}]). Her sayının
 * her metinde birebir geçtiğini kontrol eder; eksikse ihlal döner.
 *
 * @param {{label:string, value:number|string}[]} numbers
 * @param {{name:string, text:string}[]} outputs
 * @returns {string[]}  ihlaller (boş = tutarlı)
 */
export function assertCrossOutputConsistency(numbers, outputs) {
  const problems = [];
  for (const { name, text } of outputs) {
    const s = String(text);
    for (const { label, value } of numbers) {
      // Sayıyı kelime-sınırıyla ara (kısmi eşleşme "1" in "18" engellensin).
      const v = String(value);
      const re = new RegExp(`(^|[^0-9])${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^0-9]|$)`);
      if (!re.test(s)) problems.push(`${name}: '${label}' değeri (${v}) çıktıda bulunamadı`);
    }
  }
  return problems;
}
