// @ts-check
import { redactText, redactDeep } from './sanitize.js';

/**
 * WP-01 — Güvenli artifact ekleme yardımcıları.
 *
 * Testler `testInfo.attach(...)` yerine bunları kullanır; body maskelenmeden
 * hiçbir JSON/CSV/metin eki trace'e girmez. Ekran görüntüleri PII bölgeleri
 * `mask` ile kapatılarak alınır.
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
export function createArtifacts(page, testInfo) {
  return {
    /**
     * Maskelenmiş ek. `json` verilirse `redactDeep`; `body` (string/Buffer)
     * verilirse `redactText` uygulanır.
     * @param {string} name
     * @param {{ json?: unknown, body?: string | Buffer, contentType?: string }} payload
     */
    async safeAttach(name, { json, body, contentType } = {}) {
      let out;
      let type = contentType;
      if (json !== undefined) {
        out = Buffer.from(JSON.stringify(redactDeep(json), null, 2));
        type = type || 'application/json';
      } else if (Buffer.isBuffer(body)) {
        out = Buffer.from(redactText(body.toString('utf8')));
        type = type || 'text/plain';
      } else {
        out = Buffer.from(redactText(body ?? ''));
        type = type || 'text/plain';
      }
      await testInfo.attach(name, { body: out, contentType: type });
    },

    /**
     * PII bölgeleri maskelenmiş ekran görüntüsü eki. `mask` locator'ları
     * yakalama ANINDA (pikselleştirilerek) kapatılır — sonradan değil.
     * Kimlik içeren yüzeylerde (Settings/Profile, header kullanıcı menüsü) her
     * zaman ilgili PII locator'ları verilmelidir.
     * @param {string} name
     * @param {{ mask?: import('@playwright/test').Locator[], fullPage?: boolean }} [opts]
     */
    async safeScreenshot(name, { mask = [], fullPage = false } = {}) {
      const body = await page.screenshot({ mask, fullPage, animations: 'disabled' });
      await testInfo.attach(name, { body, contentType: 'image/png' });
    },
  };
}
