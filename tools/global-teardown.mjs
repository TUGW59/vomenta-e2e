// @ts-check
/**
 * Playwright globalTeardown — koşum kilidini serbest bırakır (bkz.
 * tools/run-lock.mjs). En iyi çaba: kilit bırakılamazsa koşum sonucunu bozmaz.
 */
import { releaseRunLock } from './run-lock.mjs';

export default async function globalTeardown() {
  releaseRunLock();
}
