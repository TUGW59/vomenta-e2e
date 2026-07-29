// @ts-check
import { redactUrl } from './safety.js';

function safeText(value) {
  return String(value ?? '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '<redacted-email>')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '<redacted-phone>')
    .replace(/bearer\s+[A-Z0-9._~+/=-]+/gi, 'Bearer <redacted>')
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '<id>')
    .slice(0, 500);
}

/**
 * Keşif koşusuna özgü genişletilmiş olay kayıtçısı. Gövde/header/cookie toplamaz.
 * @param {import('@playwright/test').Page} page
 */
export function observeDiscovery(page) {
  const context = page.context();
  const events = [];
  const requestPaths = new WeakMap();
  const push = (event) => events.push({ at: new Date().toISOString(), ...event });

  const onConsole = (message) => {
    const text = message.text();
    if (message.type() === 'error' || /hydration/i.test(text)) {
      push({
        type: /hydration/i.test(text) ? 'hydration-error' : 'console-error',
        text: safeText(text),
      });
    }
  };
  const onPageError = (error) => push({ type: 'page-error', text: safeText(error.message) });
  const onWebError = (webError) =>
    push({ type: 'web-error', text: safeText(webError.error()?.message) });
  const onRequestFailed = (request) =>
    push({
      type: 'request-failed',
      method: request.method(),
      url: redactUrl(request.url()),
      text: safeText(request.failure()?.errorText),
    });
  const onRequest = (request) => {
    try {
      requestPaths.set(request, new URL(page.url()).pathname);
    } catch {
      requestPaths.set(request, '<unknown>');
    }
  };
  const onResponse = (response) => {
    if (response.status() >= 400) {
      push({
        type: 'http-error',
        status: response.status(),
        method: response.request().method(),
        url: redactUrl(response.url()),
      });
    }
  };
  const onRequestFinished = (request) => {
    const timing = request.timing();
    const durationMs =
      timing.responseEnd >= 0 && timing.startTime >= 0
        ? Math.round(timing.responseEnd)
        : null;
    push({
      type: 'request-timing',
      method: request.method(),
      resourceType: request.resourceType(),
      url: redactUrl(request.url()),
      durationMs,
      initiatorPath: requestPaths.get(request) || '<unknown>',
    });
  };
  const sockets = new Map();
  const onWebSocket = (socket) => {
    const onSocketError = (error) =>
      push({ type: 'websocket-error', url: redactUrl(socket.url()), text: safeText(error) });
    sockets.set(socket, onSocketError);
    socket.on('socketerror', onSocketError);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('request', onRequest);
  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);
  page.on('requestfinished', onRequestFinished);
  page.on('websocket', onWebSocket);
  context.on('weberror', onWebError);

  return {
    events,
    checkpoint() {
      return events.length;
    },
    since(index) {
      return events.slice(index);
    },
    stop() {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('request', onRequest);
      page.off('requestfailed', onRequestFailed);
      page.off('response', onResponse);
      page.off('requestfinished', onRequestFinished);
      page.off('websocket', onWebSocket);
      context.off('weberror', onWebError);
      for (const [socket, listener] of sockets) socket.off('socketerror', listener);
    },
  };
}
