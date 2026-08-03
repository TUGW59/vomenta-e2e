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
    id: 'settings-hub',
    routes: ['/settings'],
    specFiles: ['settings.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: true,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (sekmeli özet hub + paneller).',
      '@data': 'Sayısal KPI tile yok (plan tutarı "$29" bir panel metni; tile/sayaç değil).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Paneller canlı veri içerir (Users: takım üyesi listesi; Billing: plan tutarı) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Hub salt özet + gezinme; create/edit/delete/save yok (dedicated sayfalarda test edilir).',
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
  {
    id: 'settings-canned-responses',
    routes: ['/settings/canned-responses'],
    specFiles: [
      'settings-canned-responses.authed.spec.js',
      'settings-canned-responses-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (hazır yanıt tablosu + dialog).',
      '@data': 'Sayısal KPI yok (hazır yanıt listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-integrations',
    routes: ['/settings/integrations'],
    specFiles: [
      'settings-integrations.authed.spec.js',
      'settings-integrations-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (entegrasyon kartları + webhook tablosu + dialoglar).',
      '@data': 'Sayısal KPI yok (kart/tablo listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-security',
    routes: ['/settings/security'],
    specFiles: [
      'settings-security.authed.spec.js',
      'settings-security-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (config formu + oturum/login tabloları + dialog).',
      '@data': 'Sayısal KPI tile yok (policy config değerleri).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-data-retention',
    routes: ['/settings/data-retention'],
    specFiles: [
      'settings-data-retention.authed.spec.js',
      'settings-data-retention-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@keyboard': 'Diyalog/menü/sekme yok (spinbutton + switch + buton formu).',
      '@perf': 'Grafik/ağır içerik yok (saklama-süresi formu).',
      '@data': 'Sayısal KPI tile yok (gün config değerleri).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-notifications',
    routes: ['/settings/notifications'],
    specFiles: [
      'settings-notifications.authed.spec.js',
      'settings-notifications-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@keyboard': 'Diyalog/menü/sekme yok (uzun switch tercih formu).',
      '@perf': 'Grafik/ağır içerik yok (tercih formu).',
      '@data': 'Sayısal KPI yok (switch tercihleri).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Çok uzun tercih formu (onlarca switch, kategoriler) → tek kararlı snapshot bölgesi pratik değil.',
    },
  },
  {
    id: 'settings-api-keys',
    routes: ['/settings/api-keys'],
    specFiles: [
      'settings-api-keys.authed.spec.js',
      'settings-api-keys-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (anahtar listesi + dialog).',
      '@data': 'Sayısal KPI yok (anahtar listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-webhooks',
    routes: ['/settings/webhooks'],
    specFiles: [
      'settings-webhooks.authed.spec.js',
      'settings-webhooks-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (webhook listesi + dialog).',
      '@data': 'Sayısal KPI yok (webhook listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'settings-audit',
    routes: ['/settings/audit'],
    specFiles: ['settings-audit.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: true,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (log tablosu + detay dialog).',
      '@data': 'Sayısal KPI tile yok (log listesi).',
      '@visual': 'Tablo canlı log verisi (timestamp/UUID/IP) içerir → kararlı snapshot bölgesi yok.',
    },
  },

  // ─────────────────────────── İŞ GÜCÜ (WORKFORCE) ───────────────────────────
  // Canlı mimari: /workforce = 7-sekmeli yüzey (Programlar/İzinler/Uyum/Tahmin/
  //   Rozetler/Anketler/Değerlendirmeler). Uyum + Tahmin'in AYRI rotası YOK →
  //   derin kapsamı /workforce sekmesinde sahiplenilir. Beş alt bölümün ayrıca
  //   ayrı rotası var (schedules/time-off/surveys/badges/evaluations); onlar kendi
  //   özelliklerini sahiplenir, /workforce ile gereksiz derin tekrar yapılmaz.
  {
    id: 'workforce',
    routes: ['/workforce'],
    specFiles: [
      'workforce.authed.spec.js',
      'workforce-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: true,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Ağır grafik kütüphanesi yok; Uyum boş-durum/basit görsel, Tahmin tablo.',
      '@data': 'Tahmin KPI kartları var ama ayrılmış tenant\'ta 0 gösteriyor ve sekme-tıklamada AYRI fetch yok (canlı ağ: istek yok) → yakalanacak deterministik JSON ucu yok; @data anlamlı değil.',
      '@export': 'Bu yüzeyde export/indirme kontrolü yok.',
      '@visual': 'İçerik tarih/haftaya bağlı (çizelge grid) → kararlı snapshot bölgesi yok.',
    },
  },
  {
    id: 'workforce-schedules',
    routes: ['/workforce/schedules'],
    specFiles: ['workforce-schedules.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      '@keyboard': 'Ayrı rota salt-okunur (dialog/sekme modellenmiyor); vardiya diyaloğu /workforce yüzeyinde @keyboard ile kapsanır.',
      '@perf': 'Grafik/ağır içerik yok (haftalık çizelge grid).',
      '@data': 'Sayısal KPI tile yok.',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'İçerik tarih/haftaya bağlı → kararlı snapshot yok.',
      '@mutation': 'Vardiya create/publish yaşam döngüsü /workforce yüzeyinde (workforce-mutations) sahiplenilir; ayrı rotada tekrar edilmez (uzlaştırma).',
    },
  },
  {
    id: 'workforce-time-off',
    routes: ['/workforce/time-off'],
    specFiles: ['workforce-time-off.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (izin tablosu + talep dialogu).',
      '@data': 'Sayısal KPI tile yok.',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'İzin tablosu canlı veri → kararlı snapshot yok.',
      '@mutation': 'İzin talebi UI\'dan SİLİNEMİYOR (terminal durumda yalnız durum değişir) → güvenli 0→1→0 teardown yok; L3 N/A (kanıt: dedicated + eski yüzey notları).',
    },
  },
  {
    id: 'workforce-surveys',
    routes: ['/workforce/surveys'],
    specFiles: [
      'workforce-surveys.authed.spec.js',
      'workforce-surveys-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (anket tablosu + dialoglar).',
      '@data': 'Sayısal KPI tile yok (anket listesi).',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'Anket tablosu canlı veri → kararlı snapshot yok.',
    },
  },
  {
    id: 'workforce-badges',
    routes: ['/workforce/badges'],
    specFiles: [
      'workforce-badges.authed.spec.js',
      'workforce-badges-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: true,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (rozet tablosu + Sıralama sekmesi + dialoglar).',
      '@data': 'Sayısal KPI tile yok (rozet/lider listesi).',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'Rozet/lider tablosu canlı veri → kararlı snapshot yok.',
    },
  },
  {
    id: 'workforce-evaluations',
    routes: ['/workforce/evaluations'],
    specFiles: [
      'workforce-evaluations.authed.spec.js',
      'workforce-evaluations-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (değerlendirme tablosu + oluştur dialogu).',
      '@data': 'Sayısal KPI tile yok (puan sütunu tablo verisi).',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'Değerlendirme tablosu canlı veri → kararlı snapshot yok.',
    },
  },

  // ─────────────────────────────── KANALLAR (CHANNELS) ───────────────────────────────
  // Canlı mimari (31 Tem 2026): /channels = 7 kanal kartlı hub; her kart /channels/<kanal>
  //   config sayfasına gider (Voice hariç → /voice). Alt sayfalar GET /channels/<kanal>/config
  //   ile yüklenir; çoğunda "Save Changes" (yazma) var. 4 alt sayfa açılışta i18n/format
  //   konsol hatası basıyor (B16 social, B17 email, B18 sms, B19 whatsapp) → @clean bu
  //   sayfalarda knownBugGuard altında.
  {
    id: 'channels-hub',
    routes: ['/channels'],
    specFiles: ['channels-hub.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: true,
    },
    naStyles: {
      '@keyboard': 'Diyalog/menü/sekme yok (kanal kartları ızgarası + Configure bağlantıları).',
      '@perf': 'Grafik/ağır içerik yok (statik kart ızgarası).',
      '@data': 'Sayısal KPI tile yok (kartlar durum rozeti gösterir).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@mutation': 'Hub salt gezinme; create/edit/delete/save yok (yazma alt sayfalarda).',
    },
  },
  {
    id: 'channels-webchat',
    routes: ['/channels/webchat'],
    specFiles: [
      'channels-webchat.authed.spec.js',
      'channels-webchat-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (yapılandırma formu + iki sekme).',
      '@data': 'Sayısal KPI tile yok (widget ayar alanları).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },
  {
    id: 'channels-email',
    routes: ['/channels/email'],
    specFiles: [
      'channels-email.authed.spec.js',
      'channels-email-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (hesap boş-durumu + imza/yönlendirme formu).',
      '@data': 'Sayısal KPI tile yok (form + hesap listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Açılışta B17 format hatası + imza içeriği canlı → kararlı snapshot bölgesi yok.',
    },
  },
  {
    id: 'channels-sms',
    routes: ['/channels/sms'],
    specFiles: [
      'channels-sms.authed.spec.js',
      'channels-sms-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (gönderici/şablon listeleri + SMPP formu + dialoglar).',
      '@data': 'Sayısal KPI tile yok (liste + config alanları).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Açılışta B18 konsol hatası + canlı listeler → kararlı snapshot bölgesi yok.',
    },
  },
  {
    id: 'channels-whatsapp',
    routes: ['/channels/whatsapp'],
    specFiles: [
      'channels-whatsapp.authed.spec.js',
      'channels-whatsapp-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@keyboard': 'API "Not Configured" boş-durumunda dialog/sekme yok (Create Template pasif); bağlantı sonrası dialog akışı staging mutation kapsamında.',
      '@perf': 'Grafik/ağır içerik yok (bağlantı boş-durumu + şablon listesi).',
      '@data': 'Sayısal KPI tile yok (config + şablon listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Açılışta B19 konsol hatası + bağlantı durumu canlı → kararlı snapshot yok.',
    },
  },
  {
    id: 'channels-social',
    routes: ['/channels/social'],
    specFiles: [
      'channels-social.authed.spec.js',
      'channels-social-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@keyboard': 'Diyalog/menü/sekme yok (platform kartları + Connect + ayar formu).',
      '@perf': 'Grafik/ağır içerik yok (platform kartları ızgarası).',
      '@data': 'Sayısal KPI tile yok (platform kartları).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Açılışta B16 eksik-çeviri konsol hatası → kararlı snapshot bölgesi yok.',
    },
  },
  {
    id: 'channels-video',
    routes: ['/channels/video'],
    specFiles: [
      'channels-video.authed.spec.js',
      'channels-video-mutations.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: true,
    },
    naStyles: {
      '@keyboard': 'Diyalog/menü/sekme yok (kalite/fps seçicileri + Save + Start Video Call).',
      '@perf': 'Grafik/ağır içerik yok (ayar seçicileri formu).',
      '@data': 'Sayısal KPI tile yok (kalite/fps config değerleri).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
    },
  },

  // ─────────────────────────────── SESLİ ARAMA (VOICE) ───────────────────────────────
  // Canlı mimari (2 Ağu 2026, docs/sesli-kesif/NOTLAR.md): /voice = "Live Calls" hub'ı
  //   (→ /voice/live yönlenir), bölüm alt-nav'ı 10 hedef taşır. Hub gerçek-zamanlı aktif
  //   çağrı görünümü (KPI döşemeleri + mevcudiyet sayaçları), salt-okunur → yazma yok.
  //   Softphone (gerçek çağrı) = staging mutation (voice-call.mutation.authed.spec.js).
  {
    id: 'voice-hub',
    routes: ['/voice'],
    specFiles: [
      'voice.authed.spec.js',
      'voice-subnav.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: true,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      '@keyboard': 'Hub <main>\'inde diyalog/menü/ARIA-sekme yok (alt-nav düğmeleri = bölüm gezinmesi, nav-L3 ile kapsanır).',
      '@perf': 'Ağır grafik kütüphanesi yok (KPI döşemeleri + mevcudiyet sayaçları + boş-durum).',
      '@export': 'Bu sayfada export/indirme kontrolü yok (Recordings\'te var).',
      '@visual': 'İçerik canlı (aktif çağrı sayıları, temsilci mevcudiyeti, ort. bekleme) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Hub salt gerçek-zamanlı görünüm; create/edit/delete/save yok. Gerçek çağrı softphone üzerinden staging mutation\'da (voice-call.mutation.authed.spec.js).',
    },
  },
  {
    id: 'voice-queues',
    routes: ['/voice/queues'],
    specFiles: [
      'voice-queues.authed.spec.js',
      'voice-queues-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (kuyruk kartları listesi + Create Queue dialogu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Kuyruk kartları canlı veri (Waiting/Agents/Max Wait) → kararlı snapshot bölgesi yok.',
    },
  },
  {
    id: 'voice-history',
    routes: ['/voice/history'],
    specFiles: ['voice-history.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (filtreler + geçmiş çağrı tablosu + Details dialogu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok (Recordings\'te var).',
      '@visual': 'Tablo canlı veri (tarih/numara/süre) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Sayfa veri yazmıyor (salt geçmiş görünümü + Details); satır "Call back" gerçek giden çağrı → softphone/staging alanı (voice-call.mutation.authed.spec.js), bu sayfada tetiklenmez.',
    },
  },
  {
    id: 'voice-voicemail',
    routes: ['/voice/voicemail'],
    specFiles: ['voice-voicemail.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@keyboard': 'Salt-okunur açılışta diyalog/menü/sekme açılmıyor (satır aksiyonları destructive → staging).',
      '@perf': 'Grafik/ağır içerik yok (durum filtresi + sesli mesaj tablosu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Tablo canlı veri (arayan/tarih/durum) + açılış konsol hatası (VOICEMAIL-PAGER-I18N) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Satır aksiyonları (Delete Voicemail / Mark as Read) destructive ve UI\'dan geri-alınamıyor (güvenli 0→1→0 recreate yok) → L3 staging; prod salt-okunur (workforce-time-off deseni).',
    },
  },
  {
    id: 'voice-recordings',
    routes: ['/voice/recordings'],
    specFiles: ['voice-recordings.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      hasDialogs: true,
      hasTabs: false,
      hasExport: true,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@perf': 'Grafik/ağır içerik yok (tarih filtreleri + kayıt tablosu + Delete onay dialogu).',
      '@visual': 'Tablo canlı veri (Call ID/tarih/süre/boyut/retention) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Delete Recording destructive ve UI\'dan geri-alınamıyor (güvenli 0→1→0 recreate yok) → L3 staging; prod salt-okunur. Onay alertdialog\'u @keyboard/@regression\'da açılıp Escape ile kapatılır (ONAYLANMAZ).',
    },
  },
  {
    id: 'voice-dids',
    routes: ['/voice/dids'],
    specFiles: [
      'voice-dids.authed.spec.js',
      'voice-dids-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (numara tablosu + Pending Requests + Request Number dialogu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Numara tablosu + Pending Requests canlı veri (numara/ülke/atama/statü) → kararlı snapshot bölgesi yok.',
    },
  },
  {
    // BOZUK SAYFA: voiceRegulatory i18n namespace eksik → içerik ham anahtar/boş render
    // (VOICE-REGULATORY-BROKEN) + Voice alt-nav yok (B10). Rota MAIN_NAVIGATION'da ve Voice
    // alt-nav'ında YOK; baseline stiller çalışan yerlerde normal, i18n/console + bölüm düzeni
    // known-bug guard'ları ile sabitlenir. Koşullu stiller uygulanamaz (içerik güvenilir render
    // etmiyor) → arketip minimal.
    id: 'voice-regulatory',
    routes: ['/voice/regulatory'],
    specFiles: ['voice-regulatory.authed.spec.js'],
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
    naStyles: {
      '@keyboard': 'Diyalog/menü/sekme güvenilir render etmiyor (sayfa bozuk); KYC akışı staging.',
      '@errorpath': 'Sayfa zaten kırık render ediyor (voiceRegulatory namespace eksik) → veri-hata yolu ayırt edilemez; kök neden VOICE-REGULATORY-BROKEN altında.',
      '@perf': 'Ağır içerik yok (KYC/regulatory içeriği render bile etmiyor).',
      '@data': 'Sayısal KPI yok; içerik güvenilir render etmiyor.',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'İçerik kararsız (ham anahtar/boş) → kararlı snapshot bölgesi yok.',
      '@mutation': 'KYC başlatma (Start KYC) dışa-dönük/staging; sayfa bozuk olduğundan prod salt-okunur.',
    },
  },
  {
    id: 'voice-ivr',
    routes: ['/voice/ivr'],
    specFiles: [
      'voice-ivr.authed.spec.js',
      'voice-ivr-mutations.authed.spec.js',
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
      '@perf': 'Grafik/ağır içerik yok (IVR tablosu + Create IVR dialogu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'IVR tablosu canlı veri (ad/tip/durum/tarih) → kararlı snapshot bölgesi yok.',
    },
  },
]);
