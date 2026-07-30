// @ts-check
import { redactText, redactUrl } from './sanitize.js';

// Geriye dönük uyumlu, ortak maskeleyiciye delege eden yerel sarmalayıcılar.
const safeUrl = (rawUrl) => redactUrl(rawUrl);
const safeText = (text) => redactText(text, { maxLen: 1_000 });

/**
 * Hata anında tanı koymayı hızlandıran, secret/PII değerlerini maskeleyen kayıtçı.
 * @param {import('@playwright/test').Page} page
 */
export function collectDiagnostics(page) {
  const events = [];

  const onConsole = (message) => {
    if (message.type() === 'error') {
      events.push({
        type: 'console-error',
        text: safeText(message.text()),
        location: message.location(),
      });
    }
  };

  const onRequestFailed = (request) => {
    events.push({
      type: 'request-failed',
      method: request.method(),
      url: safeUrl(request.url()),
      failure: request.failure()?.errorText,
    });
  };

  const onResponse = (response) => {
    if (response.status() >= 500) {
      events.push({
        type: 'server-error',
        status: response.status(),
        method: response.request().method(),
        url: safeUrl(response.url()),
      });
    }
  };

  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  return {
    events,
    stop() {
      page.off('console', onConsole);
      page.off('requestfailed', onRequestFailed);
      page.off('response', onResponse);
    },
  };
}
