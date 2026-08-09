// @ts-check
/**
 * ROLE-AUTH — çapraz-rol enforcement testleri için Bearer token edinme (COV-01).
 *
 * MİMARİ KISIT: Vomenta API'si cross-origin'dir (app.vomenta.com → api.vomenta.com)
 * ve auth token'ı uygulama JS'i her isteğe `Authorization: Bearer …` olarak ENJEKTE
 * eder (httpOnly cookie DEĞİL). Bu yüzden ham `page.request.get(api)` auth TAŞIMAZ
 * (bkz. tests/pages/RolesPage.js:_captureOnOpen açıklaması).
 *
 * Enforcement testi "agent gerçekten 403 alıyor mu"yu doğrulamak için, app'in ASLA
 * kendiliğinden çağırmayacağı korunan uçlara agent kimliğiyle istek atmalıdır. Bunun
 * için token gerekir. Token'ı localStorage anahtarını TAHMİN ederek değil — app'in
 * kendi çıkış isteğindeki `authorization` başlığını GÖZLEMLEYEREK alırız. Bu, hangi
 * saklama biçimi kullanılırsa kullanılsın (localStorage/memory/store) doğru token'ı
 * verir ve repo'nun "app trafiğini gözlemle" idiomuyla tutarlıdır.
 *
 * Salt-okuma: yalnız gözlem + GET; hiçbir mutasyon yapılmaz.
 */
import { request as apiRequest } from '@playwright/test';
import { environment } from '../../config/environment.js';

/** Ortamın API origin'i (ör. https://api.vomenta.com). Bilinmiyorsa ''.
 * @returns {string} */
export function apiOrigin() {
  return environment.apiHostname ? `https://${environment.apiHostname}` : '';
}

/**
 * Verili (rol) oturumundaki `page`'i app'e sürüp, uygulamanın API'ye yaptığı ilk
 * kimlikli istekten `Authorization: Bearer …` başlığını yakalar.
 *
 * SABİT BEKLEME YOK: waiter goto'dan ÖNCE kurulur; app'in doğal API trafiği
 * denemeleri aralar. Token bulunamazsa null döner (çağıran görünür biçimde skip eder).
 *
 * @param {import('@playwright/test').Page} page - rol storageState'i yüklü page
 * @param {{ triggerPath?: string, timeout?: number }} [opts]
 * @returns {Promise<string|null>} 'Bearer …' başlığı ya da null
 */
export async function captureAuthorizationHeader(page, opts = {}) {
  const { triggerPath = '/', timeout = 20000 } = opts;
  const hasBearer = (req) => {
    const h = req.headers();
    const a = h.authorization || h.Authorization;
    return typeof a === 'string' && /^bearer\s+.+/i.test(a);
  };
  // Waiter'ı goto'dan ÖNCE kur (istekler navigasyon sırasında uçar).
  const reqP = page.waitForRequest(hasBearer, { timeout }).catch(() => null);
  await page.goto(triggerPath, { waitUntil: 'domcontentloaded' }).catch(() => {});
  const req = await reqP;
  if (!req) return null;
  const h = req.headers();
  return h.authorization || h.Authorization || null;
}

/**
 * API origin'ine bağlı, KİMLİK DOĞRULAMASIZ (storageState yok) bir APIRequestContext
 * üretir — auth'suz enforcement testleri için (korunan uç oturumsuz 401/403 döndürmeli).
 * Çağıran `dispose()` etmelidir.
 * @returns {Promise<import('@playwright/test').APIRequestContext>}
 */
export async function unauthenticatedApiContext() {
  const origin = apiOrigin();
  if (!origin) throw new Error('apiOrigin() boş — bu ortamda API origin bilinmiyor.');
  return apiRequest.newContext({ baseURL: origin });
}

/**
 * Yakalanan Bearer başlığıyla, API origin'ine bağlı kimlikli bir APIRequestContext
 * üretir. Enforcement testleri bununla korunan uçlara GET atıp 401/403 assert eder.
 * Çağıran `dispose()` etmelidir.
 *
 * @param {string} authorization - 'Bearer …' başlığı (captureAuthorizationHeader çıktısı)
 * @returns {Promise<import('@playwright/test').APIRequestContext>}
 */
export async function authedApiContext(authorization) {
  const origin = apiOrigin();
  if (!origin) throw new Error('apiOrigin() boş — bu ortamda API origin bilinmiyor.');
  return apiRequest.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Authorization: authorization },
  });
}

/**
 * Tolerant izin-anahtarı çıkarıcı: /roles/me/permissions yanıtı farklı şekillerde
 * gelebilir (dizi / {data:[…]} / {data:{permissions:[…]}} / {key:true} haritası).
 * Şema-bağımsız düz bir anahtar kümesine indirger.
 * @param {any} json
 * @returns {Set<string>}
 */
export function permissionKeySet(json) {
  const out = new Set();
  const pushKey = (x) => {
    if (typeof x === 'string') out.add(x);
    else if (x && typeof x === 'object') {
      const k = x.key ?? x.id ?? x.permission ?? x.slug ?? x.name;
      if (typeof k === 'string') out.add(k);
    }
  };
  const body = json?.data ?? json;
  if (Array.isArray(body)) {
    body.forEach(pushKey);
  } else if (body && typeof body === 'object') {
    const arr = body.permissions ?? body.permissionKeys ?? body.keys ?? body.items;
    if (Array.isArray(arr)) {
      arr.forEach(pushKey);
    } else {
      // {key: true/false} haritası — yalnız true olanları al.
      for (const [k, v] of Object.entries(body)) if (v === true) out.add(k);
    }
  }
  return out;
}
