// @ts-check
import { SURFACE_BY_ID } from './product-surfaces.js';
/**
 * TEST EDİLEN SAYFALARIN STİL-KAPSAMA KAYDI (KAPSAM SÖZLEŞMESİ).
 *
 * Bu dosya ÜRÜN ENVANTERİ DEĞİLDİR (o kanonik `product-surfaces.js`'tir). "Bu yüzey(ler)
 * için şu spec dosyaları ve şu arketip iddia ediliyor" sözleşmesidir. FAZ 3 /
 * WP-SURFACE-MIGRATION ile her sözleşme, kopyalanmış rota dizgeleri yerine kanonik
 * `surfaceIds` REFERANSLARI taşır; `routes` alanı bu ID'lerden registry üzerinden
 * TÜRETİLİR (fail-closed: bilinmeyen surfaceId import anında patlar). Böylece rota
 * dizgesi tek bir yerde (registry) yaşar; kapsam sözleşmesi ürün envanterine ROTA
 * KOPYALAMAZ, ona İŞARET EDER.
 *
 * `tools/style-coverage.mjs` her sayfa için arketipinden ZORUNLU stilleri türetir ve
 * etiket var mı / N/A beyanlı mı / EKSİK mi hesaplar. EKSİK → sert kapı (exit 1).
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

/**
 * Bir kapsam sözleşmesinin `surfaceIds`'ini kanonik registry üzerinden rota dizgelerine
 * çözer (fail-closed). Bilinmeyen surfaceId → import anında fırlatır.
 * @param {ReadonlyArray<string>} surfaceIds
 * @param {string} contractId
 * @returns {ReadonlyArray<string>}
 */
function resolveContractRoutes(surfaceIds, contractId) {
  if (!Array.isArray(surfaceIds) || surfaceIds.length === 0) {
    throw new Error(`Kapsam sözleşmesi '${contractId}' en az bir surfaceId taşımalı.`);
  }
  return Object.freeze(surfaceIds.map((id) => {
    const s = SURFACE_BY_ID.get(id);
    if (!s) throw new Error(`Kapsam sözleşmesi '${contractId}' bilinmeyen surfaceId referanslıyor: ${id}`);
    return s.route;
  }));
}

/** Ham kapsam sözleşmeleri (surfaceIds referanslı). `routes` bunlardan TÜRETİLİR. */
const COVERAGE_CONTRACTS = Object.freeze([
  {
    id: 'main-navigation',
    surfaceIds: ['dashboard', 'inbox', 'voice', 'channels', 'ai', 'campaigns', 'bot-builder', 'contacts', 'tickets', 'analytics', 'reports', 'supervisor', 'workforce', 'settings'],
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
    id: 'dashboard',
    surfaceIds: ['dashboard'],
    specFiles: [
      'dashboard.authed.spec.js',
      'dashboard-actions.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: true,
      hasNumericKpis: true,
      hasDialogs: false,
      hasTabs: false,
      hasExport: false,
      hasWrites: false,
      hasStableUI: false,
    },
    naStyles: {
      // @keyboard: sayfaya ait diyalog/sekme yok (tarih butonları düz buton; Start Call
      //   softphone paneli AppShell'e ait — arketip bayrağı false).
      // @visual: içerik tamamen canlı/değişken (KPI 0'lar, canlı temsilci kartları,
      //   "Updated" damgası, oto-yenilenen aktivite akışı, kapatılabilir onboarding %) →
      //   kararlı snapshot bölgesi yok. hasStableUI=false → @visual zorunlu değil.
      // @export/@mutation: sayfa salt-okunur, export kontrolü yok → arketip false.
    },
    // L2 etkileşim derinliği (FAZ 5 / ADR-0029): gösterge paneli KPI+grafik+kart özeti;
    // kapsanabilir sekme/tablo/filtre/pager etkileşimi YOK → tüm geçerli boyut açık N/A
    // (resolved-exempt). Tarih ön-ayar butonları ve "Live" toggle 6 boyuttan hiçbirine denk gelmez.
    naInteraction: {
      'search-filter': 'Metin arama/filtre kontrolü yok (yalnız Today/7/30 gün ön-ayar butonları).',
      'table-list': 'Etkileşimli veri tablosu/listesi yok (KPI döşemeleri + grafikler + temsilci kartları + aktivite akışı).',
      'pagination-sort': 'Liste/pager yok → sayfalama/sıralama kontrolü yok.',
      'empty-state': 'Boş-durumlar statik ("No recent activity" / boş analiz alt-kartları); süzülerek ulaşılan etkileşimli boş-durum yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (KPI/grafikler canlı veriyle yerinde dolar).',
    },
  },
  {
    id: 'reports-dashboards',
    surfaceIds: ['reports-dashboards'],
    specFiles: [
      'reports-dashboards.authed.spec.js',
      'reports-dashboards-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): SEKMELER (@ix-tabs: All/Default/Custom
    // salt-istemci filtresi). Diğer 5 veri boyutu fiziksel olarak yok (kart ızgarası):
    naInteraction: {
      'search-filter': 'Pano kartları yüzeyinde arama/filtre kutusu yok (sekme istemci filtresidir → @ix-tabs).',
      'table-list': 'Etkileşimli tablo yok; panolar kart ızgarası olarak listelenir (role=table değil).',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü yok (kart listesi).',
      'empty-state': 'Default bölümü boş (sayaç 0) olsa da arama/filtre ile üretilen read-only boş durum yok; boşluk sekme filtresiyle (@ix-tabs) kapsanır.',
      'loading-state': 'Ayrı liste-yükleme iskeleti için kararlı semantik locator gözlenmedi.',
    },
  },
  {
    id: 'reports-sections',
    surfaceIds: [
      'reports-call', 'reports-agent', 'reports-queue', 'reports-campaign', 'reports-channel', 'reports-ai', 'reports-quality', 'reports-csat', 'reports-billing', 'reports-sla',
    ],
    specFiles: [
      'reports-sections.authed.spec.js',
      'reports-sections-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): 10 bölümün ortak kabuğunda tek veri-
    // bağımsız etkileşim SEKMELER'dir (@ix-tabs: Charts ↔ Table). Diğer 5 veri boyutu N/A:
    naInteraction: {
      'search-filter': 'Metin arama kutusu yok; yalnız Date Range presetleri + bölüme-özgü açılır seçiciler (Group By/All Directions…). Serbest-metin narrowing yüzeyi yok.',
      'table-list': 'Table sekmesi içeriği seçili-dönem-veri-bağlı; 3 bölüm (campaign/channel/billing) yapısal boş ("No data available") → dolu read-only satır garanti değil (anti-loop #3).',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü gözlenmedi (grafik/tablo dönem verisiyle sınırlı).',
      'empty-state': 'Boş-durum ("No data available for the selected period") dönem-veri-bağlı; arama/filtre ile deterministik üretilemez (anti-loop #3).',
      'loading-state': 'Açılış skeleton\'ı var ancak kararlı semantik locator/testid yok (keşifte data-testid talep edildi) → deterministik iskelet assertion\'ı yazılamıyor.',
    },
  },
  {
    id: 'settings-hub',
    surfaceIds: ['settings'],
    specFiles: ['settings.authed.spec.js', 'settings-interactions.authed.spec.js'],
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
    // L2 etkileşim derinliği (WP-L2-WAVE-1 / ADR-0014): hub'ın tek gerçek etkileşim
    // boyutu SEKMELER'dir (@ix-tabs, settings-interactions.authed.spec.js). Liste/filtre/
    // tablo/pagination/boş-durum hub'da YOK — dedicated alt-rotalarda (users/audit/roles…).
    naInteraction: {
      'search-filter': 'Hub sekmeli özet; arama/filtre yok (alt-rotalarda: users/audit).',
      'table-list': 'Hub panelleri özet + gezinme bağlantısı; etkileşimli liste alt-rotalarda.',
      'pagination-sort': 'Hub liste içermez → pager/sıralama yok.',
      'empty-state': 'Hub liste içermez → "boş liste" durumu yok.',
      'loading-state': 'Panel yüklemesi sekme değişimiyle birlikte; ayrı liste-yükleme iskeleti yok.',
    },
  },
  {
    id: 'settings-profile',
    surfaceIds: ['settings-profile'],
    specFiles: [
      'settings-profile.authed.spec.js',
      'settings-profile-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): SEKME (@ix-tabs) kanıtlanır. Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (sekmeli profil/oturum yüzeyi).',
      'table-list': 'Oturum tablosu Sessions sekmesinde read-only özet; ayrı interaktif liste sözleşmesi yok → sekme derinliği (@ix-tabs) kanıtlanır.',
      'pagination-sort': 'Kısa oturum listesi → pager/sıralama yok.',
      'empty-state': 'En az bir aktif oturum (mevcut) daima var → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-organization',
    surfaceIds: ['settings-organization'],
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
    // L2 etkileşim (ADR-0029): saf form → tüm boyut N/A (resolved-exempt).
    naInteraction: {
      'search-filter': 'Saf şirket-bilgisi formu; arama/filtre kontrolü yok.',
      'table-list': 'Etkileşimli liste/tablo yok (tek form).',
      'pagination-sort': 'Liste yok → pager/sıralama yok.',
      'empty-state': 'Liste yok → boş-durum kavramı geçersiz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti yok (form doğrudan render).',
    },
  },
  {
    id: 'settings-users',
    surfaceIds: ['settings-users'],
    specFiles: [
      'settings-users.authed.spec.js',
      'settings-users-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (WP-L2-WAVE-1 / ADR-0014): tablo + arama-süzme + boş-durum
    // kapsanır (settings-users-interactions.authed.spec.js). Pager/sıralama ve ayrı
    // liste-yükleme iskeleti bu yüzeyde gözlenmedi → açık N/A.
    naInteraction: {
      'pagination-sort': 'Üye listesinde pager/sütun-sıralama kontrolü gözlenmedi.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (tablo doğrudan render).',
    },
  },
  {
    id: 'settings-roles',
    surfaceIds: ['settings-roles'],
    specFiles: [
      'settings-roles.authed.spec.js',
      'settings-roles-interactions.authed.spec.js',
      'settings-roles-mutations.authed.spec.js',
      // RBAC matris kontratı (FAZ 2): salt-okunur @data @regression; katalog=113,
      // 6 rol izin kümeleri + UI kategori sayaçları contract ile birebir. i18n/a11y/
      // layout vb. zaten settings-roles.authed.spec.js'te kapsanır (union kapsama).
      'settings-roles-rbac.authed.spec.js',
      // RBAC ENFORCEMENT (COV-01 / ADR-0030 md.3): davranışsal negatif — admin efektif
      // izinleri (/roles/me/permissions) + izinsiz korunan rota bloklanması. Salt-ayna'yı
      // gerçek enforcement'la tamamlar. Çapraz-rol (agent) boşluğu bu spec'te görünür
      // test.skip ile beyan edilir (materyalizasyon: takip işi). Salt-okunur @data @regression.
      'settings-roles-rbac-enforcement.authed.spec.js',
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
    // L2 etkileşim derinliği (WP-L2-WAVE-1 / ADR-0014): tek gerçek boyut LİSTE (@ix-table,
    // satır==API sadakati). Diğer boyutlar yüzeyde yok → açık N/A.
    naInteraction: {
      'search-filter': 'Rol tablosunda arama/filtre kontrolü yok.',
      'pagination-sort': 'Sabit küçük sistem+özel rol rosteri → pager/sıralama yok.',
      'empty-state': 'Sistem rolleri (ADMIN/AGENT/OWNER…) daima mevcut → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (tablo doğrudan render).',
    },
  },
  {
    id: 'settings-compliance',
    surfaceIds: ['settings-compliance'],
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
    // L2 etkileşim (ADR-0029): çok bölümlü özet pano → resolved-exempt (interaktif liste ayrı /settings/audit'te).
    naInteraction: {
      'search-filter': 'Çok bölümlü özet panoda arama/filtre kontrolü yok.',
      'table-list': 'Audit/Consent/GDPR tabloları read-only özet ("View More" ayrı sayfaya götürür); interaktif liste derinliği ayrı /settings/audit rotasında sahiplenilir.',
      'pagination-sort': 'Özet tablolarda rota-içi pager/sıralama yok.',
      'empty-state': 'Canlı uyumluluk verisi (audit/consent) daima mevcut → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-teams',
    surfaceIds: ['settings-teams'],
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
    // L2 etkileşim (ADR-0029): kart ızgarası (kolonlu tablo değil) → resolved-exempt.
    naInteraction: {
      'search-filter': 'Ekip kart ızgarasında arama/filtre kontrolü yok.',
      'table-list': 'Ekipler kart ızgarası (ad + üye sayısı) — kolon başlıklı tablo değil → @ix-table yapısı yok.',
      'pagination-sort': 'Kısa ekip kart listesi → pager/sıralama yok.',
      'empty-state': 'En az bir ekip daima mevcut → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-hours',
    surfaceIds: ['settings-hours'],
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
    // L2 etkileşim (ADR-0029): saf haftalık program formu → resolved-exempt.
    naInteraction: {
      'search-filter': 'Saf haftalık program formu; arama/filtre kontrolü yok.',
      'table-list': 'Etkileşimli liste/tablo yok (gün-switch + saat formu).',
      'pagination-sort': 'Liste yok → pager/sıralama yok.',
      'empty-state': 'Liste yok → boş-durum kavramı geçersiz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti yok (form doğrudan render).',
    },
  },
  {
    id: 'settings-automations',
    surfaceIds: ['settings-automations'],
    specFiles: [
      'settings-automations.authed.spec.js',
      'settings-automations-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): SEKME (@ix-tabs, Rules/SLA Policies). Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (sekmeli kural/SLA yüzeyi).',
      'table-list': 'SLA tablosu SLA Policies sekmesinde; tablo derinliği ayrı /settings/sla rotasında sahiplenilir → burada sekme derinliği (@ix-tabs) kanıtlanır.',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü gözlenmedi.',
      'empty-state': 'Rules sekmesi boş-durumu ("No automation rules configured") @ix-tabs panel imzasında görülür; ayrı arama-tabanlı boş-durum yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-sla',
    surfaceIds: ['settings-sla'],
    specFiles: [
      'settings-sla.authed.spec.js',
      'settings-sla-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): LİSTE (@ix-table). Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Politika tablosunda arama/filtre kontrolü yok.',
      'pagination-sort': 'Küçük politika rosteri → pager/sıralama yok.',
      'empty-state': 'Varsayılan SLA politikaları mevcut → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (tablo doğrudan render).',
    },
  },
  {
    id: 'settings-templates',
    surfaceIds: ['settings-templates'],
    specFiles: [
      'settings-templates.authed.spec.js',
      'settings-templates-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): ÜST SEKME (@ix-tabs). Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (iç içe sekmeli şablon yüzeyi).',
      'table-list': 'Şablon tablosu kategori başına boş-durumlu ("No templates in this category") → dolu read-only satır garanti değil; sekme derinliği (@ix-tabs) kanıtlanır.',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü gözlenmedi.',
      'empty-state': 'Kategori tablosu boş-durumu tenant-veri-bağlı → deterministik değil (anti-loop #3).',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-disposition-codes',
    surfaceIds: ['settings-disposition-codes'],
    specFiles: [
      'settings-disposition-codes.authed.spec.js',
      'settings-disposition-codes-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): LİSTE (@ix-table). Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Kod tablosunda arama/filtre kontrolü yok.',
      'pagination-sort': 'Sabit küçük kod rosteri → pager/sıralama yok.',
      'empty-state': 'Varsayılan sistem kodları daima mevcut → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (tablo doğrudan render).',
    },
  },
  {
    id: 'settings-canned-responses',
    surfaceIds: ['settings-canned-responses'],
    specFiles: [
      'settings-canned-responses.authed.spec.js',
      'settings-canned-responses-interactions.authed.spec.js',
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
    // L2 etkileşim (ADR-0014/ADR-0029): BOŞ-DURUM kapsanır (@ix-empty, "No canned responses yet"). Diğerleri N/A:
    naInteraction: {
      'search-filter': "Arama kutusu var ancak liste read-only tenant'ta boş → daraltacak satır yok (veri-bağlı, anti-loop #3).",
      'table-list': 'Hazır yanıt listesi boş ("No canned responses yet"); dolu read-only satır yok → tablo yapısı kanıtlanamaz (boş-durum @ix-empty ile kanıtlı).',
      'pagination-sort': 'Boş/kısa liste → pager/sıralama yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-integrations',
    surfaceIds: ['settings-integrations'],
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
    // L2 etkileşim (ADR-0029): sağlayıcı kartları + boş webhook alt-tablosu → resolved-exempt.
    naInteraction: {
      'search-filter': 'Sağlayıcı kart ızgarasında arama/filtre kontrolü yok.',
      'table-list': 'Entegrasyonlar kart ızgarası (kolon başlıklı tablo değil); Webhook alt-tablosu boş → @ix-table yapısı yok.',
      'pagination-sort': 'Sabit sağlayıcı kataloğu → pager/sıralama yok.',
      'empty-state': 'Webhook alt-listesi boş-durumu tenant-veri-bağlı → deterministik değil.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-security',
    surfaceIds: ['settings-security'],
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
    // L2 etkileşim (ADR-0029): config yüzeyi; oturum/geçmiş gömülü özet → resolved-exempt.
    naInteraction: {
      'search-filter': 'Config yüzeyinde arama/filtre kontrolü yok.',
      'table-list': 'Active Sessions / Login History read-only gömülü özetler; ayrı interaktif liste sözleşmesi yok (config sayfası).',
      'pagination-sort': 'Kısa oturum/geçmiş özetleri → pager/sıralama yok.',
      'empty-state': 'En az bir aktif oturum/giriş geçmişi daima var → read-only boş duruma ulaşılamaz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-data-retention',
    surfaceIds: ['settings-data-retention'],
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
    // L2 etkileşim (ADR-0029): saf config formu (spinbutton/switch) → resolved-exempt.
    naInteraction: {
      'search-filter': 'Saf config formu (spinbutton/switch); arama/filtre yok.',
      'table-list': 'Etkileşimli liste/tablo yok (saklama-süresi formu).',
      'pagination-sort': 'Liste yok → pager/sıralama yok.',
      'empty-state': 'Liste yok → boş-durum kavramı geçersiz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti yok (form doğrudan render).',
    },
  },
  {
    id: 'settings-notifications',
    surfaceIds: ['settings-notifications'],
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
    // L2 etkileşim (ADR-0029): uzun switch tercih formu → resolved-exempt.
    naInteraction: {
      'search-filter': 'Uzun switch tercih formu; arama/filtre yok.',
      'table-list': "Etkileşimli liste/tablo yok (tercih switch'leri).",
      'pagination-sort': 'Liste yok → pager/sıralama yok.',
      'empty-state': 'Liste yok → boş-durum kavramı geçersiz.',
      'loading-state': 'Ayrı liste-yükleme iskeleti yok (form doğrudan render).',
    },
  },
  {
    id: 'settings-api-keys',
    surfaceIds: ['settings-api-keys'],
    specFiles: [
      'settings-api-keys.authed.spec.js',
      'settings-api-keys-interactions.authed.spec.js',
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
    // L2 etkileşim (ADR-0014/ADR-0029): BOŞ-DURUM kapsanır (@ix-empty, "No API keys"). Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Anahtar yüzeyinde arama/filtre kontrolü yok.',
      'table-list': 'Anahtar listesi read-only tenant\'ta boş ("No API keys"); dolu satır yok → tablo yapısı kanıtlanamaz (boş-durum @ix-empty ile kanıtlı).',
      'pagination-sort': 'Boş/kısa liste → pager/sıralama yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-webhooks',
    surfaceIds: ['settings-webhooks'],
    specFiles: [
      'settings-webhooks.authed.spec.js',
      'settings-webhooks-interactions.authed.spec.js',
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
    // L2 etkileşim (ADR-0014/ADR-0029): BOŞ-DURUM kapsanır (@ix-empty, "No webhooks configured"). Diğerleri N/A:
    naInteraction: {
      'search-filter': 'Webhook yüzeyinde arama/filtre kontrolü yok.',
      'table-list': 'Webhook listesi read-only tenant\'ta boş ("No webhooks configured"); dolu satır yok → tablo yapısı kanıtlanamaz (boş-durum @ix-empty ile kanıtlı).',
      'pagination-sort': 'Boş/kısa liste → pager/sıralama yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'settings-audit',
    surfaceIds: ['settings-audit'],
    specFiles: [
      'settings-audit.authed.spec.js',
      'settings-audit-interactions.authed.spec.js',
    ],
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
    // L2 etkileşim derinliği (WP-L2-WAVE-1 / ADR-0014, FAZ 0 pilotu): deterministik boyut
    // LİSTE (@ix-table — settings-audit-interactions.authed.spec.js). Diğerleri açık N/A:
    naInteraction: {
      'search-filter':
        'Arama kutusu VAR ancak canlı log satırlarından (UUID/zaman damgası/IP) deterministik salt-okuma daraltma örneği türetmek güvenilir değil → anti-loop #3 gereği N/A (kapsam @ix-table ile kanıtlı).',
      'pagination-sort': 'Read-only: pager/sıralama kontrolü POM/DOM gözleminde doğrulanmadı; sayfa boyutu veri-bağlı.',
      'empty-state':
        'Deterministik boş-duruma yalnız (veri-bağlı, güvenilmez) arama daraltmasıyla ulaşılır → anti-loop #3 gereği N/A.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (tablo doğrudan render).',
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
    surfaceIds: ['workforce'],
    specFiles: [
      'workforce.authed.spec.js',
      'workforce-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): SEKMELER (@ix-tabs: 7 sekme) + TABLO
    // (@ix-table: haftalık çizelge, ajan satırları). Diğer 4 veri boyutu N/A:
    naInteraction: {
      'search-filter': 'Metin arama kutusu yok (yalnız hafta ok\'ları Previous/Next Week + Adherence aralık düğmeleri).',
      'pagination-sort': 'Pager/sütun-sıralama yok; hafta navigasyonu tarih-aralığı ok\'udur, liste sayfalama değil.',
      'empty-state': 'Boş-durum (geçmiş hafta/boş sekmeler) arama/filtre ile deterministik üretilmez.',
      'loading-state': 'Kararlı liste-yükleme iskeleti için semantik locator gözlenmedi.',
    },
  },
  {
    id: 'workforce-schedules',
    surfaceIds: ['workforce-schedules'],
    specFiles: [
      'workforce-schedules.authed.spec.js',
      'workforce-schedules-interactions.authed.spec.js',
    ],
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): TABLO (@ix-table: haftalık çizelge,
    // ajan satırları). Diğer 4 veri boyutu N/A (sekmesiz standalone çizelge):
    naInteraction: {
      'search-filter': 'Metin arama kutusu yok (yalnız hafta ok\'ları Previous/Next Week).',
      'pagination-sort': 'Pager/sütun-sıralama yok; hafta ok\'u tarih-aralığı navigasyonudur.',
      'empty-state': 'Boş-durum (geçmiş hafta) arama/filtre ile deterministik üretilmez.',
      'loading-state': 'Kararlı liste-yükleme iskeleti için semantik locator gözlenmedi.',
    },
  },
  {
    id: 'workforce-time-off',
    surfaceIds: ['workforce-time-off'],
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): resolved-exempt. İzin tablosu test
    // tenant'ında BOŞ ("No time off requests") + arama/pager/sekme yok → hiçbir veri
    // boyutu fiziksel olarak yok. Salt "Request Time Off" formu (mutation, kapsam-dışı).
    naInteraction: {
      'table-list': 'İzin tablosu test tenant\'ında boş ("No time off requests") → dolu read-only satır yok (anti-loop #3).',
      'search-filter': 'Arama/filtre kutusu yok.',
      'pagination-sort': 'Pager/sütun-sıralama yok (liste boş).',
      'empty-state': 'Doğal boş-durum var ancak arama/filtre ile üretilen read-only boş durum yüzeyi yok.',
      'loading-state': 'Kararlı liste-yükleme iskeleti için semantik locator gözlenmedi.',
    },
  },
  {
    id: 'workforce-surveys',
    surfaceIds: ['workforce-surveys'],
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): resolved-exempt. Anket listesi test
    // tenant'ında BOŞ ("No CSAT surveys") + arama/pager/sekme yok → hiçbir veri boyutu
    // fiziksel olarak yok. Salt "Create survey" formu (mutation, kapsam-dışı).
    naInteraction: {
      'table-list': 'Anket tablosu test tenant\'ında boş ("No CSAT surveys") → dolu read-only satır yok (anti-loop #3).',
      'search-filter': 'Arama/filtre kutusu yok.',
      'pagination-sort': 'Pager/sütun-sıralama yok (liste boş).',
      'empty-state': 'Doğal boş-durum var ancak arama/filtre ile üretilen read-only boş durum yüzeyi yok.',
      'loading-state': 'Kararlı liste-yükleme iskeleti için semantik locator gözlenmedi.',
    },
  },
  {
    id: 'workforce-badges',
    surfaceIds: ['workforce-badges'],
    specFiles: [
      'workforce-badges.authed.spec.js',
      'workforce-badges-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): SEKMELER (@ix-tabs: Badges ↔ Leaderboard).
    // Diğer 5 veri boyutu N/A (rozet listesi test tenant'ında boş):
    naInteraction: {
      'table-list': 'Rozet listesi test tenant\'ında boş ("No badges yet") → dolu read-only tablo satırı garanti değil (anti-loop #3).',
      'search-filter': 'Arama/filtre kutusu yok.',
      'pagination-sort': 'Pager/sütun-sıralama yok (liste boş).',
      'empty-state': 'Doğal boş-durum var ancak arama/filtre ile üretilen read-only boş durum yüzeyi yok.',
      'loading-state': 'Kararlı liste-yükleme iskeleti için semantik locator gözlenmedi.',
    },
  },
  {
    id: 'workforce-evaluations',
    surfaceIds: ['workforce-evaluations'],
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): resolved-exempt. Değerlendirme listesi
    // test tenant'ında BOŞ ("No evaluations yet") + arama/pager/sekme yok → hiçbir veri
    // boyutu fiziksel olarak yok. Salt "Create Evaluation" formu (mutation, kapsam-dışı).
    naInteraction: {
      'table-list': 'Değerlendirme tablosu test tenant\'ında boş ("No evaluations yet") → dolu read-only satır yok (anti-loop #3).',
      'search-filter': 'Arama/filtre kutusu yok.',
      'pagination-sort': 'Pager/sütun-sıralama yok (liste boş).',
      'empty-state': 'Doğal boş-durum var ancak arama/filtre ile üretilen read-only boş durum yüzeyi yok.',
      'loading-state': 'Kararlı liste-yükleme iskeleti için semantik locator gözlenmedi.',
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
    surfaceIds: ['channels'],
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
    // L2 etkileşim (ADR-0029): 7 kanal kartlı statik hub → resolved-exempt (etkileşim yüzeyi yok).
    naInteraction: {
      'search-filter': 'Kart ızgarasında arama/filtre kontrolü yok (yalnız Configure bağlantıları).',
      'table-list': 'Etkileşimli liste/tablo yok (7 kanal kartlı statik ızgara; her kart durum rozeti + Configure).',
      'pagination-sort': 'Sabit 7 kart; pager/sütun-sıralama kontrolü yok.',
      'empty-state': 'Kartlar daima render edilir; read-only boş duruma ulaştıracak arama/filtre yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (kartlar config isteğinden bağımsız statik).',
    },
  },
  {
    id: 'channels-webchat',
    surfaceIds: ['channels-webchat'],
    specFiles: [
      'channels-webchat.authed.spec.js',
      'channels-webchat-interactions.authed.spec.js',
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
    // L2 etkileşim derinliği (ADR-0014/ADR-0029): ÜST SEKME (@ix-tabs: Configuration ↔ Integration).
    // Diğer 5 veri boyutu fiziksel olarak yok (form yüzeyi):
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (renk/metin girdileri + switch/textarea formu).',
      'table-list': 'Etkileşimli liste/tablo yok (iki sekmeli yapılandırma formu).',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü yok.',
      'empty-state': 'Boş-duruma ulaştıracak arama/filtre yok (read-only form).',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'channels-email',
    surfaceIds: ['channels-email'],
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
    // L2 etkileşim (ADR-0029): imza/yönlendirme formu + hesap boş-durumu → resolved-exempt.
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (imza/yönlendirme formu + Add Account dialogu).',
      'table-list': 'Etkileşimli liste/tablo yok; hesap alanı boş-durumda ("No email account connected").',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü yok.',
      'empty-state': 'Hesap boş-durumu statik metindir; arama/filtre ile ulaşılan read-only boş durum yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'channels-sms',
    surfaceIds: ['channels-sms'],
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
    // L2 etkileşim (ADR-0029): durum/yön açılır filtreleri boş mesaj günlüğü üzerinde,
    // metin arama kutusu yok → veri-bağlı/güvenilmez (anti-loop #3) → resolved-exempt.
    naInteraction: {
      'search-filter': 'Metin arama kutusu yok; yalnız durum/yön açılır seçicileri (All Statuses/Directions) mesaj günlüğü üzerinde. Canlı durum "Not configured" → günlük boş, filtre narrowing veri-bağlı/güvenilmez (anti-loop #3).',
      'table-list': 'Mesaj günlüğü ("Not configured" tenant) boş → dolu read-only satır garanti değil.',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü gözlenmedi (boş günlük).',
      'empty-state': 'Boş-durum tenant-veri-bağlı ("Not configured") → deterministik read-only kanıtlanamaz (anti-loop #3).',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'channels-whatsapp',
    surfaceIds: ['channels-whatsapp'],
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
    // L2 etkileşim (ADR-0029): "API Not Configured" + "No templates yet" boş-durumu → resolved-exempt.
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (bağlantı boş-durumu + şablon formu).',
      'table-list': 'Şablon listesi boş-durumda ("No templates yet"; API Not Configured) → dolu read-only satır yok.',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü yok (boş şablon listesi).',
      'empty-state': 'Boş-durum ("API Not Configured") statik/tenant-bağlı; arama/filtre ile üretilen read-only boş durum yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'channels-social',
    surfaceIds: ['channels-social'],
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
    // L2 etkileşim (ADR-0029): sabit platform kartları ızgarası + Connect → resolved-exempt.
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (6 platform kartı + Connect + ayar formu).',
      'table-list': 'Etkileşimli liste/tablo yok (sabit platform kartları ızgarası).',
      'pagination-sort': 'Sabit platform seti; pager/sütun-sıralama yok.',
      'empty-state': 'Kartlar daima render edilir; read-only boş duruma ulaştıracak arama/filtre yok.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'channels-video',
    surfaceIds: ['channels-video'],
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
    // L2 etkileşim (ADR-0029): kalite/fps seçicileri formu → resolved-exempt.
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (kalite/fps seçicileri formu).',
      'table-list': 'Etkileşimli liste/tablo yok (ayar seçicileri formu).',
      'pagination-sort': 'Pager/sütun-sıralama kontrolü yok.',
      'empty-state': 'Boş-duruma ulaştıracak arama/filtre yok (read-only form).',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi.',
    },
  },

  // ─────────────────────────────── SESLİ ARAMA (VOICE) ───────────────────────────────
  // Canlı mimari (2 Ağu 2026, docs/sesli-kesif/NOTLAR.md): /voice = "Live Calls" hub'ı
  //   (→ /voice/live yönlenir), bölüm alt-nav'ı 10 hedef taşır. Hub gerçek-zamanlı aktif
  //   çağrı görünümü (KPI döşemeleri + mevcudiyet sayaçları), salt-okunur → yazma yok.
  //   Softphone (gerçek çağrı) = staging mutation (voice-call.mutation.authed.spec.js).
  {
    id: 'voice-hub',
    surfaceIds: ['voice'],
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
    // L2 etkileşim derinliği (FAZ 5 / ADR-0029): canlı-çağrı hub'ı KPI + mevcudiyet
    // sayaçları + boş-durum; alt-nav düğmeleri ARIA-sekme değil bölüm gezinmesi (@ix-tabs
    // uygulanmaz). Canlı çağrı görünümü test tenant'ında daima boş → kapsanabilir tablo yok.
    // Tüm geçerli boyut açık N/A (resolved-exempt; FAZ 4 boş-tenant presedansı ile tutarlı).
    naInteraction: {
      'search-filter': 'Canlı çağrı hub\'ında arama/filtre kontrolü yok.',
      'table-list': 'Canlı çağrı görünümü test tenant\'ında daima boş → yapısal tablo/satır doğrulanamaz (aktif çağrı yok).',
      'pagination-sort': 'Liste/pager yok → sayfalama/sıralama yok.',
      'empty-state': 'Boş-durum ("No active calls right now") statik/daima mevcut; süzülerek ulaşılan etkileşimli boş-durum değil.',
      'loading-state': 'Ayrı liste-yükleme iskeleti gözlenmedi (canlı veri yerinde dolar).',
    },
  },
  {
    id: 'voice-queues',
    surfaceIds: ['voice-queues'],
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
    // WAVE-L2-DEEP-2: resolved-exempt. Probe'da role=table YOK (kuyruklar KART ızgarası
    // olarak render; kart-başı Settings/Delete + Create Queue dialogu). Satır-içi arama/
    // filtre/pager yüzeyi yok → geçerli etkileşim boyutu yok.
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (kart ızgarası; yalnız Create Queue + kart-başı aksiyonlar).',
      'table-list': 'role=table yok; kuyruklar kolon-başlıklı tablo değil kart ızgarası → @ix-table yapısı yok.',
      'pagination-sort': 'Kart ızgarası tek görünüm; pager/sıralama kontrolü gözlenmedi.',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'voice-history',
    surfaceIds: ['voice-history'],
    specFiles: ['voice-history.authed.spec.js', 'voice-history-interactions.authed.spec.js'],
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
    // WAVE-L2-DEEP-2: çağrı geçmişi tablosu @ix-table ile kanıtlı (voice-history-interactions).
    naInteraction: {
      'search-filter': 'Serbest-metin satır-arama kutusu yok (yalnız yön + tarih ön-filtreleri; yön filtresi veri-bağlı, tek-yön veride daralma garanti değil → anti-loop #3).',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'pagination-sort': 'Read-only tek-sayfa görünüm; ayrı pager/sıralama kontrolü gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'voice-voicemail',
    surfaceIds: ['voice-voicemail'],
    specFiles: ['voice-voicemail.authed.spec.js', 'voice-voicemail-interactions.authed.spec.js'],
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
    // WAVE-L2-DEEP-2: sesli mesaj tablosu @ix-table ile kanıtlı (voice-voicemail-interactions).
    naInteraction: {
      'search-filter': 'Serbest-metin satır-arama kutusu yok (yalnız durum ön-filtresi; veri-bağlı daralma garanti değil → anti-loop #3).',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'pagination-sort': 'Pager i18n bozuk (VOICEMAIL-PAGER-I18N); read-only tek-sayfa, güvenilir sayfa-döndürme gözlenmedi → anti-loop #3.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'voice-recordings',
    surfaceIds: ['voice-recordings'],
    specFiles: ['voice-recordings.authed.spec.js', 'voice-recordings-interactions.authed.spec.js'],
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
    // WAVE-L2-DEEP-2: kayıt tablosu @ix-table ile kanıtlı (voice-recordings-interactions).
    naInteraction: {
      'search-filter': 'Serbest-metin satır-arama kutusu yok (yalnız tarih ön-filtreleri; veri-bağlı daralma garanti değil → anti-loop #3).',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'pagination-sort': 'Read-only tek-sayfa görünüm; ayrı pager/sıralama kontrolü gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'voice-dids',
    surfaceIds: ['voice-dids'],
    specFiles: [
      'voice-dids.authed.spec.js',
      'voice-dids-mutations.authed.spec.js',
      'voice-dids-interactions.authed.spec.js',
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
    // WAVE-L2-DEEP-2: numara tablosu @ix-table ile kanıtlı (voice-dids-interactions).
    naInteraction: {
      'search-filter': 'Serbest-metin satır-arama kutusu yok (numara/ülke ön-filtreleri; veri-bağlı daralma garanti değil → anti-loop #3).',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'pagination-sort': 'Read-only tek-sayfa görünüm; ayrı pager/sıralama kontrolü gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    // BOZUK SAYFA: voiceRegulatory i18n namespace eksik → içerik ham anahtar/boş render
    // (VOICE-REGULATORY-BROKEN) + Voice alt-nav yok (B10). Rota MAIN_NAVIGATION'da ve Voice
    // alt-nav'ında YOK; baseline stiller çalışan yerlerde normal, i18n/console + bölüm düzeni
    // known-bug guard'ları ile sabitlenir. Koşullu stiller uygulanamaz (içerik güvenilir render
    // etmiyor) → arketip minimal.
    id: 'voice-regulatory',
    surfaceIds: ['voice-regulatory'],
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
    surfaceIds: ['voice-ivr'],
    specFiles: [
      'voice-ivr.authed.spec.js',
      'voice-ivr-mutations.authed.spec.js',
      'voice-ivr-interactions.authed.spec.js',
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
    // WAVE-L2-DEEP-2: IVR akış tablosu @ix-table ile kanıtlı (voice-ivr-interactions).
    naInteraction: {
      'search-filter': 'Serbest-metin satır-arama kutusu gözlenmedi.',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'pagination-sort': 'Read-only tek-sayfa görünüm; ayrı pager/sıralama kontrolü gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'voice-sip-trunks',
    surfaceIds: ['voice-sip-trunks'],
    specFiles: ['voice-sip-trunks.authed.spec.js'],
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
      '@perf': 'Grafik/ağır içerik yok (SIP trunk listesi/boş-durum + Add SIP Trunk dialogu).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Boş-durum/liste canlı içerik + Add dialogu → kararlı snapshot bölgesi yok.',
      '@mutation': 'Add SIP Trunk dışa-dönük SIP/BYOC bağlantı yapılandırması (provider tarafı); güvenli 0→1→0 teardown staging + ayrılmış tenant gerektirir → L3 staging, prod salt-okunur.',
    },
    // WAVE-L2-DEEP-2: resolved-exempt. Probe'da role=table YOK + liste test tenant'ında
    // BOŞ ("No SIP Trunks") → etkileşimli tablo/arama/pager yüzeyi fiziksel olarak yok.
    naInteraction: {
      'search-filter': 'Arama/filtre kontrolü yok (liste boş: "No SIP Trunks" + Add dialogu).',
      'table-list': 'role=table yok; liste boş-durumda (test tenant\'ında trunk yok) → etkileşimli satır yüzeyi yok.',
      'pagination-sort': 'Boş liste → sayfalama/sıralama yüzeyi yok.',
      'empty-state': 'Boş-durum doğal (native "No SIP Trunks"); aramayla-tetiklenen boş-durum yüzeyi yok.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    id: 'voice-sip-settings',
    surfaceIds: ['voice-sip-settings'],
    specFiles: ['voice-sip-settings.authed.spec.js'],
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
      '@keyboard': 'Diyalog/menü/sekme yok (SIP extension/Display name girdileri + Endpoint mode radio).',
      '@errorpath': 'Sunucu API\'si yok; ayarlar tarayıcıda (localStorage) saklanır → yakalanacak veri-hata yolu yok.',
      '@perf': 'Grafik/ağır içerik yok (küçük yapılandırma formu).',
      '@data': 'Sunucudan veri çekmiyor; sayısal KPI yok (yerel config).',
      '@export': 'Export/indirme kontrolü yok.',
      '@visual': 'Yerel-config formu; kararlı bölge dar ama snapshot lane bu pakette açılmadı.',
      '@mutation': 'Değişiklikler yalnız tarayıcı localStorage\'ına yazılır ("stored in this browser"); sunucu/tenant verisi DEĞİŞMEZ → tenant mutation yok. Girdi L1 @regression\'da yerel doldurma ile kapsanır.',
    },
  },
  {
    id: 'voice-skills',
    surfaceIds: ['voice-skills'],
    specFiles: ['voice-skills.authed.spec.js'],
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
      '@keyboard': 'Diyalog/menü/ARIA-sekme yok (Select Queue combobox\'ı + üye/beceri paneli).',
      '@perf': 'Grafik/ağır içerik yok (kuyruk seçici + üye listesi).',
      '@export': 'Bu sayfada export/indirme kontrolü yok.',
      '@visual': 'Seçilen kuyruğa bağlı üye/beceri listesi canlı → kararlı snapshot bölgesi yok.',
      '@mutation': 'Beceri/öncelik ATAMA kuyruk üyelerini kalıcı değiştirir; kuyruk seçimine bağlı + güvenli 0→1→0 teardown ayrılmış staging tenant gerektirir → L3 staging, prod salt-okunur (kuyruk SEÇME salt-okuma @regression\'da kapsanır).',
    },
    // WAVE-L2-DEEP-2: resolved-exempt. Tek etkileşim kontrolü "Select Queue" combobox'ı =
    // kuyruk-KAPSAM seçici (satır-içi arama/filtre değil); üyeler probe'da role=table YOK.
    // ARIA-tab da değil (hasTabs=false) → geçerli @ix-* boyutu yok.
    naInteraction: {
      'search-filter': 'Serbest-metin satır-arama/filtre yok; tek kontrol kuyruk-kapsam seçici combobox (liste daraltma değil, veri-kaynağı seçimi).',
      'table-list': 'role=table yok; seçilen kuyruğun üye/beceri paneli kolon-başlıklı tablo değil → @ix-table yapısı yok.',
      'pagination-sort': 'Üye paneli tek görünüm; pager/sıralama kontrolü gözlenmedi.',
      'empty-state': 'Boş-duruma ulaştıracak serbest-metin arama yok (read-only).',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    // WAVE-STYLE-1 (ADR-0031 style-backlog): supervisor/agents L1 → L2·style.
    // Mevcut spec (yapı + 4-dil i18n + filtre/arama/force/analyze L1/L2/L3) tam stil
    // sözleşmesine çıkarıldı: +@a11y/@layout/@clean/@errorpath/@data/@keyboard (+@i18n tag).
    id: 'supervisor-agents',
    surfaceIds: ['supervisor-agents'],
    specFiles: [
      'supervisor-agents.authed.spec.js',
      'supervisor-agents-interactions.authed.spec.js',
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
      '@visual': 'İçerik canlı (durum/AHT/CSAT/"Last refreshed" damgası) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Force durum değişikliği staging mutation; prod read-only\'de L1 (menü + onay-dialog iptali) test edilir (@regression), gerçek mutasyon staging fixme\'de.',
    },
    // WAVE-L2-DEEP-2: tablo/arama/boş-durum @ix-* ile kanıtlandı
    // (supervisor-agents-interactions.authed.spec.js). Kalan 2 boyut dürüst N/A:
    naInteraction: {
      'pagination-sort': 'Veri tek sayfa (≤20 ajan) → "Next" devre dışı; read-only\'de sayfa döndürülemez (çok-sayfa verisi yok).',
      'loading-state': 'Liste "Live updates" ile sürekli auto-refresh eder; ayrı deterministik yükleme-iskeleti gözlenmedi (route-gecikmesi polling\'e takılır → anti-loop #3).',
    },
  },
  {
    // TIER-1: /contacts nav-blanket → dedicated L2·deep. Zengin mevcut spec (yapı + 4-dil
    // i18n + arama/tag/şirket/sort/görünüm/add/import/export/segments/detay L1/L2/L3) dedicated
    // stil sözleşmesine çıkarıldı (+@a11y/@layout/@clean/@deeplink/@keyboard/@errorpath; @i18n/@export tag).
    // Etkileşim: @ix-table + @ix-filter + @ix-empty (contacts-interactions), prod'da yeşil.
    id: 'contacts',
    surfaceIds: ['contacts'],
    specFiles: ['contacts.authed.spec.js', 'contacts-interactions.authed.spec.js'],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: false,
      // Liste görünümünde MODAL dialog yok: "New Contact" ayrı SAYFA (/contacts/new),
      // filtreler dropdown/listbox → hasDialogs=false (@keyboard bu yüzeyde geçerli değil).
      hasDialogs: false,
      hasTabs: false,
      hasExport: true,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@visual': 'Kişi tablosu canlı veri (ad/e-posta/şirket/etiket) → kararlı snapshot bölgesi yok.',
      '@mutation': 'New Contact/Delete/Import kalıcı yazar → L3 staging (contacts-mutations.authed.spec.js); prod read-only\'de L1 (form aç + POST yakala, gönderilmez).',
    },
    naInteraction: {
      'pagination-sort': 'Sıralama chip-tabanlı (@regression\'da L1/L2/L3 kanıtlı); read-only tek-sayfa pager gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    // TIER-1: /tickets nav-blanket → dedicated L2·deep. 4-dil i18n canlı gözlenip POM.I18N'e
    // kodlandı (fr başlığı çevrilmiyor — gözlenen gerçek). Stil: @i18n/@a11y/@layout/@clean/
    // @deeplink/@keyboard/@errorpath. Etkileşim: @ix-tabs + @ix-table + @ix-filter + @ix-empty
    // (tickets-interactions), prod'da yeşil. Create Ticket MODAL (hasDialogs → @keyboard geçerli).
    id: 'tickets',
    surfaceIds: ['tickets'],
    specFiles: ['tickets.authed.spec.js', 'tickets-interactions.authed.spec.js'],
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
      '@visual': 'Ticket tablosu canlı veri (numara/konu/durum/tarih) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Create Ticket kalıcı yazar → L3 staging; prod read-only\'de L1 (dialog aç + Escape, gönderilmez).',
    },
    naInteraction: {
      'pagination-sort': 'Read-only tek-sayfa görünüm; ayrı pager/sıralama kontrolü gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    // C1: /campaigns/outbound L1 → dedicated L2·deep (tek hamlede stil + etkileşim).
    // POM zaten zengin (I18N 4-dil + table/rows/search + hardened selectTab). Etkileşim:
    // @ix-tabs + @ix-table + @ix-filter + @ix-empty (campaigns-outbound-interactions), prod'da yeşil.
    // Stil: @i18n/@layout/@clean/@deeplink/@keyboard/@errorpath; @a11y → CAMPAIGNS-ICON-A11Y known-bug.
    id: 'campaigns-outbound',
    surfaceIds: ['campaigns-outbound'],
    specFiles: [
      'campaigns-outbound.authed.spec.js',
      'campaigns-outbound-interactions.authed.spec.js',
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
      '@visual': 'Kampanya tablosu + özet kartları canlı veri (durum/tarih/sayı) → kararlı snapshot bölgesi yok.',
      '@mutation': 'Create/Start/Delete kalıcı yazar → L3 staging (campaigns-outbound.mutation.authed.spec.js); prod read-only\'de L1 (dialog aç + Escape/route-yakala, gönderilmez).',
    },
    naInteraction: {
      'pagination-sort': 'CAMPAIGNS-PAGER: liste 10\'da kapanıyor, hasNextPage:true AMA pager/sonsuz-kaydırma UI\'si YOK → read-only\'de sayfa döndürülemez.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    // C1: /supervisor/coaching L1 → dedicated L2·deep. Etkileşim çapası @ix-tabs (Evaluated/
    // Pending Review sekme dışlayıcılığı; supervisor-coaching-interactions). Değerlendirme
    // tablosu test tenant'ında BOŞ ("No evaluations found") → diğer veri boyutları dürüst N/A.
    // Stil: @i18n/@a11y/@layout/@clean/@deeplink/@keyboard (New Evaluation dialog)/@errorpath/@data.
    id: 'supervisor-coaching',
    surfaceIds: ['supervisor-coaching'],
    specFiles: [
      'supervisor-coaching.authed.spec.js',
      'supervisor-coaching-interactions.authed.spec.js',
    ],
    archetype: {
      hasData: true,
      hasCharts: false,
      hasNumericKpis: true,
      hasDialogs: true,
      hasTabs: true,
      hasExport: false,
      hasWrites: true,
      hasStableUI: false,
    },
    naStyles: {
      '@visual': 'İstatistik döşemeleri + tablo canlı/tenant-bağlı → kararlı snapshot bölgesi yok.',
      '@mutation': 'New Evaluation kalıcı kayıt oluşturur → L3 staging; prod read-only\'de L1 (dialog aç + Cancel/route-yakala, gönderilmez).',
    },
    naInteraction: {
      'table-list': 'Değerlendirme tablosu test tenant\'ında boş ("No evaluations found") → dolu-satır garanti değil (anti-loop #3).',
      'search-filter': 'Boş listede aranacak satır yok; "Search by agent" daraltması gözlemlenemiyor (read-only, veri yok).',
      'empty-state': 'Boş-durum doğal (native "No evaluations found"); aramayla-tetiklenen boş-durum yüzeyi yok.',
      'pagination-sort': 'Boş liste → pager/sıralama yüzeyi gözlenmedi.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
  {
    // Option A (STYLE): /supervisor/interactions L1 → dedicated L2·style (resolved-exempt).
    // Canlı-izleme sayfası test tenant'ında BOŞ ("No active interactions") → etkileşim
    // derinliği yüzeyi fiziksel olarak yok → TÜM @ix-* boyutları naInteraction (applicable=0).
    // Dedicated STİL sözleşmesi: @i18n/@a11y/@layout/@clean/@deeplink/@errorpath. Derin DEĞİL,
    // dürüst exempt (canlı etkileşim/staging'de deep yeniden değerlendirilir).
    id: 'supervisor-interactions',
    surfaceIds: ['supervisor-interactions'],
    specFiles: ['supervisor-interactions.authed.spec.js'],
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
      '@visual': 'Canlı-izleme/boş-durum içeriği → kararlı snapshot bölgesi yok.',
    },
    naInteraction: {
      'search-filter': 'Boş canlı-izleme (aktif etkileşim yok); aranacak satır yok → daraltma gözlemlenemiyor.',
      'table-list': 'Aktif etkileşim yokken tablo boş-durumda ("No active interactions") → dolu-satır yok.',
      'empty-state': 'Boş-durum doğal (native); aramayla-tetiklenen boş-durum yüzeyi yok.',
      'pagination-sort': 'Boş liste → pager/sıralama yüzeyi yok.',
      'loading-state': 'Ayrı deterministik liste-yükleme iskeleti gözlenmedi.',
    },
  },
]);

/**
 * TEST_EDİLEN SAYFALAR. Her sözleşmeye kanonik `surfaceIds`'ten TÜRETİLMİŞ `routes` alanı
 * (geriye-dönük uyum + tüketici kolaylığı) eklenir. `routes` artık elle KOPYALANMAZ; kaynak
 * registry'dir. `main-navigation` sözleşmesi hâlâ MAIN_NAVIGATION ile aynı 14 yüzeyi kapsar
 * (nav = registry'nin doğrulanan alt kümesi; bkz. navigation.js).
 */
export const TESTED_PAGES = Object.freeze(
  COVERAGE_CONTRACTS.map((c) => Object.freeze({
    ...c,
    routes: resolveContractRoutes(c.surfaceIds, c.id),
  }))
);
