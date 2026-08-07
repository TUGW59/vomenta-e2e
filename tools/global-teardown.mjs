// @ts-check
/**
 * Playwright globalTeardown — koşum kilidini serbest bırakır (bkz.
 * tools/run-lock.mjs). En iyi çaba: kilit bırakılamazsa koşum sonucunu bozmaz.
 *
 * Ek: CI DIŞINDA, koşu raporunu tarih-saatli olarak reports/ altına arşivler
 * (bkz. tools/archive-run.mjs). En-iyi-çaba; hata koşum sonucunu bozmaz. CI'da
 * çalışmaz (CI'nın kendi güvenli artifact hattı vardır).
 */
import { archiveRun } from './archive-run.mjs';
import { releaseRunLock } from './run-lock.mjs';

export default async function globalTeardown() {
  releaseRunLock();
  if (!process.env.CI) {
    archiveRun();
  }
}
