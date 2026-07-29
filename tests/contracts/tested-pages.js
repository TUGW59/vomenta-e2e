// @ts-check
import { MAIN_NAVIGATION } from './navigation.js';
/**
 * TEST EDİLEN SAYFALARIN STİL-KAPSAMA KAYDI (sözleşme).
 *
 * Bir sayfa "tam stil muamelesi" alınca buraya eklenir. `tools/style-coverage.mjs` her sayfa için
 * arketipinden ZORUNLU stilleri türetir ve etiket var mı / N/A beyanlı mı / EKSİK mi hesaplar.
 * EKSİK → sert kapı (exit 1). Böylece gelecekteki her yeni sayfa aynı standardı otomatik dayatır.
 *
 * Kurallar: AGENTS.md → "Zorunlu test stilleri". Stil el kitabı: docs/TEST_STYLES.md.
 *
 * archetype bayrakları (zorunlu stilleri belirler):
 *   hasData        → @errorpath (API'den veri çekiyor)
 *   hasCharts      → @perf (grafik/ağır içerik yüklüyor)
 *   hasNumericKpis → @data (sayısal değer gösteriyor)
 *   hasDialogs     → @keyboard (diyalog/menü var)
 *   hasTabs        → @keyboard (sekme var)
 *   hasExport      → @export (export/indirme kontrolü var)
 *   hasWrites      → @mutation (create/edit/delete/save var)
 *   hasStableUI    → @visual (snapshot'lanabilir kararlı bölüm var)
 *
 * Baseline stiller (HER sayfa, N/A OLAMAZ): @smoke @i18n @a11y @layout @clean @deeplink @regression
 *
 * naStyles: koşullu bir stil uygulanmıyorsa AÇIK gerekçeyle beyan edilir (sessiz atlama yasak).
 */
export const TESTED_PAGES = Object.freeze([
  {
    id: 'main-navigation',
    routes: MAIN_NAVIGATION.map(({ path }) => path),
    specFiles: ['quality-baseline.authed.spec.js'],
    routeLevelBaseline: true,
    archetype: {
      hasData: false,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {},
  },
  {
    id: 'reports-dashboards',
    routes: ['/reports/dashboards'],
    specFiles: [
      'reports-dashboards.authed.spec.js',
      'reports-dashboards-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: true,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yüklemiyor (özel pano kartlarını listeler).',
      '@data': 'Sayısal KPI göstermiyor (pano kartları listeler).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'reports-sections',
    routes: [
      '/reports/call', '/reports/agent', '/reports/queue', '/reports/campaign',
      '/reports/channel', '/reports/ai', '/reports/quality', '/reports/csat',
      '/reports/billing', '/reports/sla',
    ],
    specFiles: [
      'reports-sections.authed.spec.js',
      'reports-schedule-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: true,
      hasNumericKpis: true,
      hasDialogs: true,
      hasTabs: true,
      hasExport: true,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@export': 'Export indirme yan-etkisi; içerik doğrulaması gated/ileride (bkz. coverage-exclusions.js).',
    },
  },
  {
    id: 'campaigns-sender-ids',
    routes: ['/campaigns/sender-ids'],
    specFiles: [
      'campaigns-sender-ids.authed.spec.js',
      'campaigns-sender-ids.mutation.authed.spec.js',
    ],
    archetype: {
      hasData: true,        // GET /api/v1/sender-ids → @errorpath
      hasCharts: false,
      hasNumericKpis: false, // KPI kartı yok, salt tablo → @data N/A
      hasDialogs: true,     // Request Sender ID dialogu → @keyboard
      hasTabs: false,
      hasExport: false,
      hasWrites: true,      // POST /sender-ids (talep) → @mutation
      // Ana içerik canlı, tenant'a özgü tablo + canlı Type combobox → marka-nötr,
      // kararlı bir snapshot hedefi değil; ayrıca tam-sayfa görsel PII taşır (sidebar).
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yüklemiyor (tek liste tablosu).',
      '@data': 'Sayısal KPI göstermiyor (durum bazlı liste tablosu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'campaigns-dnc',
    routes: ['/campaigns/dnc'],
    specFiles: [
      'campaigns-dnc.authed.spec.js',
      'campaigns-dnc.mutation.authed.spec.js',
    ],
    archetype: {
      hasData: true,        // GET /api/v1/dnc → @errorpath
      hasCharts: false,
      hasNumericKpis: true, // Total/Showing/Page KPI kartları → @data
      hasDialogs: true,     // Add Number + Bulk Import dialogları → @keyboard
      hasTabs: false,
      hasExport: true,      // Export (GET /dnc/export) + Bulk Import → @export
      hasWrites: true,      // POST /dnc (ekle) → @mutation
      // Ana içerik canlı, tenant'a özgü liste; tam-sayfa görsel PII taşır (sidebar).
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yüklemiyor (tek liste tablosu).',
    },
  },
]);
