// @ts-check
/**
 * ORTAM KAYDI (single source of truth).
 *
 * Testlerin hangi ortama karşı koştuğunun tek tanım yeridir. Yeni bir ortam
 * eklemek = buraya tek satırlık bir kayıt eklemek. `config/environment.js` bu
 * tabloyu okuyup çalışma-zamanı `environment` nesnesini üretir; başka hiçbir
 * dosyada URL/host hardcode edilmez.
 *
 * Alanlar:
 *  - name        : TEST_ENV ile eşleşen kanonik ad.
 *  - baseURL      : Playwright `baseURL`'i (login dahil tüm relative goto'lar buna göre).
 *  - hostname     : baseURL host'u — BASE_URL verildiğinde ortamı host'tan çıkarmak için.
 *  - apiHostname  : Ortamın API host'u (mutation guard'ın production API'sini ayırt etmesi için).
 *  - vpnOnly      : Yalnızca şirket VPN'i ile erişilebilir mi (CI/erişim notu; dokümantasyon amaçlı).
 *  - mutable      : Bu ortamda @mutation testleri AÇILABİLİR mi. `true` tek başına yetmez;
 *                   mutation yine ALLOW_MUTATING_TESTS=true + üçlü tenant guard ister
 *                   (bkz. config/environment.js assertMutationEnvironment). Güvenli
 *                   varsayılan: production ve dev `false`; yalnız staging `true`.
 *  - description  : İnsan-okunur kısa açıklama (hata mesajları/doküman için).
 */

export const PRODUCTION_HOSTNAME = 'app.vomenta.com';
export const PRODUCTION_API_HOSTNAME = 'api.vomenta.com';

export const ENVIRONMENTS = Object.freeze({
  production: Object.freeze({
    name: 'production',
    baseURL: 'https://app.vomenta.com',
    hostname: 'app.vomenta.com',
    apiHostname: 'api.vomenta.com',
    vpnOnly: false,
    mutable: false,
    description: 'Canlı ortam — herkese açık. Yalnızca salt-okunur testler koşar.',
  }),
  dev: Object.freeze({
    name: 'dev',
    baseURL: 'https://app.dev.vomenta.com',
    hostname: 'app.dev.vomenta.com',
    apiHostname: 'api.dev.vomenta.com',
    vpnOnly: true,
    // Güvenli varsayılan: dev'de de yazma kapalı. Dev'de mutation açmak ileride
    // bilinçli bir adımdır (mutable:true + dev tenant guard); bkz. ENVIRONMENTS.md.
    mutable: false,
    description: 'Geliştirme ortamı — şirket VPN gerektirir. Ayrı test hesabı kullanılır.',
  }),
  staging: Object.freeze({
    name: 'staging',
    // Sabit bir staging URL'i yoktur; verilirse STAGING_BASE_URL'den okunur.
    // Mutation testleri origin/tenant'ı MUTATION_API_ORIGIN/MUTATION_TENANT_* ile ayrıca doğrular.
    baseURL: process.env.STAGING_BASE_URL || '',
    hostname: '',
    apiHostname: '',
    vpnOnly: false,
    mutable: true,
    description: 'Mutation (veri değiştiren) testleri için ayrılmış ortam.',
  }),
});

/** Kanonik ad → ortam kaydı (yoksa undefined). */
export function environmentByName(name) {
  return ENVIRONMENTS[name];
}

/**
 * baseURL host'undan ortamı çıkarır. Bilinen bir host'a (production/dev)
 * eşleşmezse undefined döner — çağıran taraf 'staging'e düşer (geriye dönük
 * uyum: eskiden production dışı her host 'staging' sayılırdı).
 */
export function environmentByHostname(hostname) {
  return Object.values(ENVIRONMENTS).find(
    (env) => env.hostname && env.hostname === hostname
  );
}
