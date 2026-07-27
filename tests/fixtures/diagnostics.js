// @ts-check

function safeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const key of url.searchParams.keys()) {
      url.searchParams.set(key, '<redacted>');
    }
    return url.toString();
  } catch {
    return '<invalid-url>';
  }
}

function safeText(text) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<redacted-email>')
    .replace(/bearer\s+[A-Z0-9._~+/=-]+/gi, 'Bearer <redacted>')
    .slice(0, 1_000);
}

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
