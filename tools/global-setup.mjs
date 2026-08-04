// @ts-check
/**
 * Playwright globalSetup — koşum başında paralel-koşum kilidini alır
 * (bkz. tools/run-lock.mjs). Canlı bir eşzaman koşum varsa fail-fast durur.
 * `playwright test --list` bu hook'u ÇALIŞTIRMAZ; rapor üretimi etkilenmez.
 */
import { acquireRunLock } from './run-lock.mjs';

export default async function globalSetup() {
  acquireRunLock();
}
