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
    id: 'settings-profile',
    routes: ['/settings/profile'],
    specFiles: [
      'settings-profile.authed.spec.js',
      'settings-profile-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: true,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (statik profil formu + oturum tablosu).',
      '@data': 'Sayısal KPI göstermiyor (form alanları + oturum listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-organization',
    routes: ['/settings/organization'],
    specFiles: [
      'settings-organization.authed.spec.js',
      'settings-organization-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (statik şirket-bilgisi formu).',
      '@data': 'Sayısal KPI göstermiyor (form alanları).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-users',
    routes: ['/settings/users'],
    specFiles: [
      'settings-users.authed.spec.js',
      // Invite (davet) L3 mutasyonu = aynı davet akışı; staging revoke ucu teyidi bekliyor.
      'known-bugs-invite.mutation.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (üye tablosu + davet dialogu).',
      '@data': 'Sayısal KPI göstermiyor (üye listesi; sayaç yok).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-roles',
    routes: ['/settings/roles'],
    specFiles: [
      'settings-roles.authed.spec.js',
      'settings-roles-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: true,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (rol tablosu + create dialogu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Kararlı snapshot bölgesi yok: tablo canlı sayaç (permissions/users) içerir, Create dialogu 14 kategorili uzun/kaydırmalı liste → tam-dialog snapshot flaky.',
    },
  },
  {
    id: 'settings-compliance',
    routes: ['/settings/compliance'],
    specFiles: [
      'settings-compliance.authed.spec.js',
      'settings-compliance-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (özet kart + uyumluluk tabloları).',
      '@data': 'Sayısal KPI tile göstermiyor (retention gün değerleri config metni; tablolar).',
      '@export': 'Sayfada dosya export/indirme kontrolü yok (GDPR "Export Data" kalıcı işlem → staging).',
      '@visual': '3 canlı tablo (audit/consent/GDPR: göreli zaman + tarih + UUID) → kararlı snapshot bölgesi yok, flaky.',
    },
  },
  {
    id: 'settings-teams',
    routes: ['/settings/teams'],
    specFiles: [
      'settings-teams.authed.spec.js',
      'settings-teams-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (ekip kartları + create dialogu).',
      '@data': 'Sayısal KPI tile yok (kart "N members" veri metni).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-hours',
    routes: ['/settings/hours'],
    specFiles: [
      'settings-hours.authed.spec.js',
      'settings-hours-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (haftalık program formu).',
      '@data': 'Sayısal KPI yok (saat config değerleri).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-automations',
    routes: ['/settings/automations'],
    specFiles: [
      'settings-automations.authed.spec.js',
      'settings-automations-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (kural tablosu + SLA tablosu + dialog).',
      '@data': 'Sayısal KPI tile yok (SLA süreleri tablo verisi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-sla',
    routes: ['/settings/sla'],
    specFiles: [
      'settings-sla.authed.spec.js',
      'settings-sla-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: true,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (politika tablosu + dialog).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-templates',
    routes: ['/settings/templates'],
    specFiles: [
      'settings-templates.authed.spec.js',
      'settings-templates-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (şablon tablosu + dialog).',
      '@data': 'Sayısal KPI yok (şablon listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-disposition-codes',
    routes: ['/settings/disposition-codes'],
    specFiles: [
      'settings-disposition-codes.authed.spec.js',
      'settings-disposition-codes-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (kod tablosu + dialog).',
      '@data': 'Sayısal KPI yok (kod listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
]);
