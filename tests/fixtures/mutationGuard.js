// @ts-check
import {
  assertMutationEnvironment,
  assertMutationTenant,
} from '../../config/environment.js';

/**
 * Mutasyon başlamadan önce ortamı ve kimliği doğrulanmış tenant'ı denetleyen guard.
 * Başarılı `/auth/me` preflight sonucu test boyunca önbelleğe alınır.
 *
 * @param {import('@playwright/test').Page} page
 * @param {typeof import('../../config/environment.js').environment} [policy]
 */
export function createMutationGuard(page, policy) {
  /** @type {Promise<void> | undefined} */
  let verifiedTenant;

  return async (reason) => {
    const expected = assertMutationEnvironment(reason, policy);

    verifiedTenant ??= verifyAuthenticatedTenant(page, reason, expected, policy);
    await verifiedTenant;
  };
}

async function verifyAuthenticatedTenant(page, reason, expected, policy) {
  // Uygulamanın kendi API istemcisi Bearer başlığını ekler. Token'ı fixture'a
  // taşımadan veya okumadan gerçek oturum response'unu yakalamak için taze yükle.
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => {
      if (candidate.request().method() !== 'GET') return false;
      const url = new URL(candidate.url());
      return (
        url.origin === expected.apiOrigin &&
        url.pathname === '/api/v1/auth/me'
      );
    }),
    page.goto('/', { waitUntil: 'domcontentloaded' }),
  ]);

  if (!response.ok()) {
    throw new Error(
      `"${reason}" reddedildi: staging tenant preflight isteği başarısız ` +
        `(${response.status()}).`
    );
  }

  let profile;
  try {
    profile = await response.json();
  } catch {
    throw new Error(
      `"${reason}" reddedildi: staging tenant preflight yanıtı geçerli JSON değil.`
    );
  }

  assertMutationTenant(reason, profile, policy);
}
