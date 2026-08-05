// @ts-check

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const BLOCKED_PATH_PARTS = [
  '/logout',
  '/signout',
  '/delete',
  '/remove',
  '/destroy',
  '/unsubscribe',
  '/api/',
  '/auth/',
];

/**
 * URL'yi rapora güvenli biçimde yazar: query/hash değerleri ve kimlik benzeri
 * path parçaları saklanmaz.
 * @param {string} raw
 */
export function redactUrl(raw) {
  try {
    const url = new URL(raw);
    const path = url.pathname
      .split('/')
      .map((part) =>
        /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(part) || /^\d{4,}$/.test(part)
          ? '<id>'
          : part
      )
      .join('/');
    return `${url.origin}${path}${url.search ? '?<redacted>' : ''}`;
  } catch {
    return '<invalid-url>';
  }
}

/**
 * BFS kuyruğuna yalnızca aynı-origin, query'siz, salt-okunur uygulama rotası alır.
 * @param {string} rawHref
 * @param {string} baseURL
 */
export function safeInternalPath(rawHref, baseURL) {
  try {
    const url = new URL(rawHref, baseURL);
    const origin = new URL(baseURL).origin;
    if (url.origin !== origin) return null;
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (url.search || url.hash) return null;
    const lower = url.pathname.toLowerCase();
    if (BLOCKED_PATH_PARTS.some((part) => lower.includes(part))) return null;
    if (/\.(csv|xlsx?|pdf|zip|png|jpe?g|gif|svg|webp|mp4|webm)$/i.test(lower)) return null;
    return url.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return null;
  }
}

/**
 * Navigasyon SONRASI landing URL'ini oturum-kaybı tespiti için sınıflandırır.
 *
 * `safeInternalPath`'ten AYRIDIR: o fonksiyon BFS kuyruğuna yalnız tertemiz
 * (query/hash'siz) rota almak için tasarlandı ve query/hash içeren HER URL'de
 * `null` döner. Landing doğrulamasında o davranış YANLIŞTIR: uygulama bir rotaya
 * gidince meşru şekilde `?tab=..` / `#..` ekleyebilir; bu oturum kaybı DEĞİLDİR.
 * Burada yalnız origin (kayıp origin) ve pathname'i döndürürüz; query/hash yok
 * sayılır. Login/auth yönlendirmesi çağıran tarafça pathname üzerinden denetlenir.
 *
 * @param {string} rawUrl `page.url()`
 * @param {string} baseURL
 * @returns {{ path: string|null, originLost: boolean }}
 */
export function classifyLanding(rawUrl, baseURL) {
  try {
    const url = new URL(rawUrl, baseURL);
    if (url.origin !== new URL(baseURL).origin) {
      return { path: null, originLost: true };
    }
    return { path: url.pathname.replace(/\/+$/, '') || '/', originLost: false };
  } catch {
    return { path: null, originLost: true };
  }
}

/**
 * Genel keşif koşusunda GET/HEAD/OPTIONS dışındaki tüm istekleri sunucuya
 * ulaşmadan keser. Böylece bilinmeyen bir SPA davranışı production verisine yazamaz.
 * @param {import('@playwright/test').Page} page
 */
export async function installReadOnlyGuard(page) {
  const blocked = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (SAFE_METHODS.has(request.method())) {
      await route.continue();
      return;
    }
    blocked.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: redactUrl(request.url()),
    });
    await route.abort('blockedbyclient');
  });
  return {
    blocked,
    async stop() {
      if (!page.isClosed()) await page.unroute('**/*');
    },
  };
}
