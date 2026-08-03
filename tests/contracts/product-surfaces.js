// @ts-check
/**
 * KANONİK ÜRÜN YÜZEYİ SÖZLEŞMESİ (PRODUCT_SURFACES) — WP-SURFACE-REGISTRY / ADR-0018.
 *
 * Bu dosya "test edildi mi?" sorusunu CEVAPLAMAZ. Yalnız ÜRÜNDE var olduğu
 * KANITLA doğrulanan yüzeyleri (rota + politika + kanıt) tanımlar. Kapsam etiketi,
 * spec dosyası, arketip ya da `✅` burada TUTULMAZ (bkz. HANDOFF §4.1).
 *
 * NEDEN AYRI KAYNAK: Bugün `registered-routes.js` rota kümesini `tested-pages.js`'ten
 * türetiyor; yani "üründe var olan yüzey" bilgisi "test kapsamı iddiası"na bağımlı.
 * Sonuç: kapsam sözleşmesi olmayan bir sayfa üç matristen (registered-routes / style /
 * surface-depth) aynı anda SESSİZCE kaybolur. Bu registry o döngüsel bağımlılığı kırar:
 * ürün yüzeyi burada kanonik ve BAĞIMSIZ tanımlanır; kapsam iddiaları ayrı kalır.
 *
 * ÖNEMLİ: Bu dosya STATİK bir literal'dir. `tested-pages.js`'i İÇE AKTARMAZ — aksi hâlde
 * kırdığı döngüsel bağımlılık geri gelirdi. Girişler Faz 0'da doğrulanan ürün-varlık
 * kanıt kaynaklarından (navigation / route-inventory / discovery / known-bug) üretilmiştir.
 *
 * Bu faz (Faz 1) mevcut `REGISTERED_ROUTES` kaynağını DEĞİŞTİRMEZ; registry bağımsız ve
 * testli bırakılır. Kaynak migrasyonu Faz 3'tedir.
 */

/** Rota tipi. static = sabit path, redirect = başka rotaya yönlendirir, dynamic = :param şablonu. */
export const ROUTE_KINDS = Object.freeze(['static', 'redirect', 'dynamic']);
/** Yaşam döngüsü. conditional = feature-flag/izin koşullu, deprecated = kaldırılma sürecinde. */
export const LIFECYCLES = Object.freeze(['active', 'conditional', 'deprecated']);
/** Navigasyon konumu. */
export const NAVIGATIONS = Object.freeze(['main', 'secondary', 'hidden', 'contextual']);
/** Runtime erişim politikası. */
export const RUNTIME_POLICIES = Object.freeze([
  'readonly-baseline', // salt-okunur açılış tabanı güvenli
  'fixture-required',  // dinamik: güvenli gerçek ID olmadan erişilemez
  'readonly-blocked',  // ön koşul/izin yok; reason code zorunlu
  'staging-only',      // yalnız staging'de güvenli
]);
/** Ürün-VARLIK kanıt tipleri (kapsam kanıtı DEĞİL). */
export const EVIDENCE_TYPES = Object.freeze([
  'navigation-contract',   // MAIN_NAVIGATION sözleşmesinde tanımlı
  'route-inventory',       // önceki kanonik rota envanterinde (tested-pages.routes) listeli
  'discovery-observation', // read-only discovery crawl'ında gözlendi
  'known-bug',             // bir bulgu bu rotayı referanslıyor (yüzey var demektir)
  'live-observation',      // canlı read-only gözlem
  'runtime-observation',   // runtime raporunda pages[].route
]);
/** İzinli blocked/fixture reason code'ları (bilinmeyen kod fail-closed reddedilir). */
export const BLOCKED_REASON_CODES = Object.freeze([
  'READONLY_FIXTURE_ID_REQUIRED', // dinamik: güvenli fixture ID yok
  'READONLY_403_FORBIDDEN',       // izin yetersiz (403 → redirect)
  'READONLY_FEATURE_FLAG_OFF',    // feature flag kapalı
  'READONLY_STAGING_ONLY',        // yalnız staging'de erişilebilir
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Bir yüzey rotasını doğrular (fail-closed). Query/fragment/origin/boşluk YASAK.
 * static: ':' veya '{' içeremez. dynamic: en az bir ':param' segmenti taşımalı.
 * @param {unknown} route
 * @param {{ dynamic?: boolean }} [opts]
 * @returns {string}
 */
export function assertValidSurfaceRoute(route, opts = {}) {
  if (typeof route !== 'string' || route.trim() === '') {
    throw new Error(`Geçersiz rota (boş/dizge değil): ${JSON.stringify(route)}`);
  }
  if (route.includes('://')) throw new Error(`Rota mutlak URL olamaz: ${route}`);
  if (!route.startsWith('/')) throw new Error(`Rota '/' ile başlamalı: ${route}`);
  if (/\s/.test(route)) throw new Error(`Rota boşluk içeremez: ${JSON.stringify(route)}`);
  if (route.includes('?')) throw new Error(`Rota query içeremez: ${route}`);
  if (route.includes('#')) throw new Error(`Rota fragment içeremez: ${route}`);
  if (route.includes('{') || route.includes('}')) {
    throw new Error(`Rota süslü-parantez şablonu içeremez (':param' kullanın): ${route}`);
  }
  const isDynamic = route.split('/').some((seg) => seg.startsWith(':') && seg.length > 1);
  if (opts.dynamic && !isDynamic) {
    throw new Error(`Dinamik rota ':param' segmenti taşımalı: ${route}`);
  }
  if (!opts.dynamic && route.includes(':')) {
    throw new Error(`Statik rota ':param' içeremez (routeKind='dynamic' olmalı): ${route}`);
  }
  return route;
}

/**
 * Tek bir yüzey sözleşmesini doğrular. SAF: fırlatmaz, hata dizesi listesi döndürür.
 * @param {any} s
 * @returns {string[]}
 */
export function validateSurface(s) {
  const errs = [];
  const tag = s && typeof s.id === 'string' ? s.id : JSON.stringify(s);
  if (!s || typeof s !== 'object') return [`Yüzey nesne değil: ${tag}`];

  if (typeof s.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id)) {
    errs.push(`Geçersiz id (kebab-case olmalı): ${tag}`);
  }
  if (typeof s.area !== 'string' || s.area.trim() === '') errs.push(`Eksik area: ${tag}`);

  if (!ROUTE_KINDS.includes(s.routeKind)) errs.push(`Bilinmeyen routeKind '${s.routeKind}': ${tag}`);
  if (!LIFECYCLES.includes(s.lifecycle)) errs.push(`Bilinmeyen lifecycle '${s.lifecycle}': ${tag}`);
  if (!NAVIGATIONS.includes(s.navigation)) errs.push(`Bilinmeyen navigation '${s.navigation}': ${tag}`);
  if (!RUNTIME_POLICIES.includes(s.runtimePolicy)) {
    errs.push(`Bilinmeyen runtimePolicy '${s.runtimePolicy}': ${tag}`);
  }

  try {
    assertValidSurfaceRoute(s.route, { dynamic: s.routeKind === 'dynamic' });
  } catch (e) {
    errs.push(`${e instanceof Error ? e.message : String(e)} (${tag})`);
  }

  if (s.parentId != null && (typeof s.parentId !== 'string' || s.parentId === s.id)) {
    errs.push(`Geçersiz parentId (kendisi olamaz / dizge değil): ${tag}`);
  }

  // routeKind'a bağlı zorunlu alanlar
  if (s.routeKind === 'dynamic') {
    if (s.runtimePolicy !== 'fixture-required') {
      errs.push(`Dinamik yüzey runtimePolicy='fixture-required' olmalı: ${tag}`);
    }
    if (!BLOCKED_REASON_CODES.includes(s.blockedReason)) {
      errs.push(`Dinamik yüzey için geçerli blockedReason zorunlu: ${tag}`);
    }
    if (!('fixtureRef' in s)) errs.push(`Dinamik yüzey 'fixtureRef' alanı taşımalı (null olabilir): ${tag}`);
  }
  if (s.routeKind === 'redirect') {
    if (typeof s.redirectTarget !== 'string' || s.redirectTarget.trim() === '') {
      errs.push(`Redirect yüzey için 'redirectTarget' hedefi zorunlu: ${tag}`);
    } else {
      try {
        assertValidSurfaceRoute(s.redirectTarget, {});
      } catch (e) {
        errs.push(`Geçersiz redirectTarget: ${e instanceof Error ? e.message : String(e)} (${tag})`);
      }
    }
  }

  // lifecycle'a bağlı zorunlu alanlar
  if (s.lifecycle === 'conditional' && (typeof s.condition !== 'string' || s.condition.trim() === '')) {
    errs.push(`Conditional yüzey için 'condition' açıklaması zorunlu: ${tag}`);
  }
  if (s.lifecycle === 'deprecated' && (typeof s.migrationRef !== 'string' || s.migrationRef.trim() === '')) {
    errs.push(`Deprecated yüzey için 'migrationRef' migration kaydı zorunlu: ${tag}`);
  }

  // blockedReason yalnız blocked/fixture bağlamında ve izinli kod olmalı
  if (s.blockedReason != null && !BLOCKED_REASON_CODES.includes(s.blockedReason)) {
    errs.push(`Bilinmeyen blockedReason '${s.blockedReason}': ${tag}`);
  }
  if (s.blockedReason != null && !['fixture-required', 'readonly-blocked'].includes(s.runtimePolicy)) {
    errs.push(`blockedReason yalnız fixture-required/readonly-blocked ile kullanılır: ${tag}`);
  }
  if (s.runtimePolicy === 'readonly-blocked' && !BLOCKED_REASON_CODES.includes(s.blockedReason)) {
    errs.push(`readonly-blocked yüzey için geçerli blockedReason zorunlu: ${tag}`);
  }

  // kanıt: en az 1, geçerli tip, observedAt formatı
  if (!Array.isArray(s.evidence) || s.evidence.length === 0) {
    errs.push(`En az bir kanıt (evidence) zorunlu: ${tag}`);
  } else {
    for (const ev of s.evidence) {
      if (!ev || !EVIDENCE_TYPES.includes(ev.type)) {
        errs.push(`Bilinmeyen evidence.type '${ev && ev.type}': ${tag}`);
      }
      if (ev && ev.observedAt != null && !DATE_RE.test(ev.observedAt)) {
        errs.push(`Geçersiz evidence.observedAt (YYYY-MM-DD): ${tag}`);
      }
    }
  }
  return errs;
}

/**
 * Tüm registry'yi doğrular. SAF: fırlatmaz, hata dizesi listesi döndürür.
 * Boş registry, duplicate id, çakışan rota, kırık parentId ve tekil-yüzey ihlallerini yakalar.
 * @param {any[]} surfaces
 * @returns {string[]}
 */
export function validateRegistry(surfaces) {
  const errs = [];
  if (!Array.isArray(surfaces) || surfaces.length === 0) {
    return ['Kanonik ürün yüzeyi envanteri boş olamaz.'];
  }
  const ids = new Set();
  const routes = new Set();
  for (const s of surfaces) {
    errs.push(...validateSurface(s));
    if (s && typeof s.id === 'string') {
      if (ids.has(s.id)) errs.push(`Yinelenen yüzey id: ${s.id}`);
      ids.add(s.id);
    }
    if (s && typeof s.route === 'string') {
      if (routes.has(s.route)) errs.push(`Yinelenen/çakışan rota: ${s.route}`);
      routes.add(s.route);
    }
  }
  // parentId referans bütünlüğü (kırık üst-yüzey referansı yok)
  for (const s of surfaces) {
    if (s && s.parentId != null && !ids.has(s.parentId)) {
      errs.push(`parentId mevcut bir yüzeyi göstermiyor: ${s.id} → ${s.parentId}`);
    }
  }
  return errs;
}

/** Registry geçersizse fırlatır (fail-closed, import anında). */
export function assertValidRegistry(surfaces) {
  const errs = validateRegistry(surfaces);
  if (errs.length) {
    throw new Error(`PRODUCT_SURFACES geçersiz:\n  - ${errs.join('\n  - ')}`);
  }
  return surfaces;
}

/**
 * KANONİK ÜRÜN YÜZEYLERİ. Statik literal (üretim: Faz 0 doğrulanmış kanıt kaynakları).
 * Ürün-varlık kanıtı olmayan (yalnız spec/page-object kodunda geçen) alt yüzeyler
 * (ör. /ai/voice, /supervisor/coaching, /voice/live, /contacts/* alt sayfaları,
 * PR#42'ye özel /campaigns/{sender-ids,dnc,templates}) BİLİNÇLİ olarak dışarıda
 * bırakıldı: canlı read-only doğrulama (Faz 4) öncesi kayda alınmaz. Faz 2 completeness
 * motoru bunları UNREGISTERED_OBSERVED olarak dürüstçe raporlar; kaybolmazlar.
 */
export const PRODUCT_SURFACES = Object.freeze([
  {
    id: 'dashboard', area: 'dashboard',
    route: '/', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'ai', area: 'ai',
    route: '/ai', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'ai-prompts', area: 'ai',
    route: '/ai/prompts', routeKind: 'static', lifecycle: 'active',
    parentId: 'ai', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' } ],
  },
  {
    id: 'analytics', area: 'analytics',
    route: '/analytics', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'bot-builder', area: 'bot-builder',
    route: '/bot-builder', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'bot-builder-detail', area: 'bot-builder',
    route: '/bot-builder/:id', routeKind: 'dynamic', lifecycle: 'active',
    parentId: 'bot-builder', navigation: 'secondary', runtimePolicy: 'fixture-required',
    fixtureRef: null,
    blockedReason: 'READONLY_FIXTURE_ID_REQUIRED',
    evidence: [ { type: 'known-bug' } ],
  },
  {
    id: 'campaigns', area: 'campaigns',
    route: '/campaigns', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'campaigns-outbound', area: 'campaigns',
    route: '/campaigns/outbound', routeKind: 'static', lifecycle: 'active',
    parentId: 'campaigns', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' } ],
  },
  {
    id: 'channels', area: 'channels',
    route: '/channels', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'channels-email', area: 'channels',
    route: '/channels/email', routeKind: 'static', lifecycle: 'active',
    parentId: 'channels', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'channels-sms', area: 'channels',
    route: '/channels/sms', routeKind: 'static', lifecycle: 'active',
    parentId: 'channels', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'channels-social', area: 'channels',
    route: '/channels/social', routeKind: 'static', lifecycle: 'active',
    parentId: 'channels', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'channels-video', area: 'channels',
    route: '/channels/video', routeKind: 'static', lifecycle: 'active',
    parentId: 'channels', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'channels-webchat', area: 'channels',
    route: '/channels/webchat', routeKind: 'static', lifecycle: 'active',
    parentId: 'channels', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'channels-whatsapp', area: 'channels',
    route: '/channels/whatsapp', routeKind: 'static', lifecycle: 'active',
    parentId: 'channels', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'contacts', area: 'contacts',
    route: '/contacts', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'inbox', area: 'inbox',
    route: '/inbox', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports', area: 'reports',
    route: '/reports', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-agent', area: 'reports',
    route: '/reports/agent', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-ai', area: 'reports',
    route: '/reports/ai', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-billing', area: 'reports',
    route: '/reports/billing', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-call', area: 'reports',
    route: '/reports/call', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-campaign', area: 'reports',
    route: '/reports/campaign', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-channel', area: 'reports',
    route: '/reports/channel', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-csat', area: 'reports',
    route: '/reports/csat', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-dashboards', area: 'reports',
    route: '/reports/dashboards', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-quality', area: 'reports',
    route: '/reports/quality', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-queue', area: 'reports',
    route: '/reports/queue', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'reports-sla', area: 'reports',
    route: '/reports/sla', routeKind: 'static', lifecycle: 'active',
    parentId: 'reports', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings', area: 'settings',
    route: '/settings', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-api-keys', area: 'settings',
    route: '/settings/api-keys', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-audit', area: 'settings',
    route: '/settings/audit', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-automations', area: 'settings',
    route: '/settings/automations', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-billing', area: 'settings',
    route: '/settings/billing', routeKind: 'static', lifecycle: 'conditional',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-blocked',
    condition: 'Requires billing-admin permission; standard roles receive 403 and are redirected to /',
    blockedReason: 'READONLY_403_FORBIDDEN',
    evidence: [ { type: 'known-bug' } ],
  },
  {
    id: 'settings-canned-responses', area: 'settings',
    route: '/settings/canned-responses', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-compliance', area: 'settings',
    route: '/settings/compliance', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-data-retention', area: 'settings',
    route: '/settings/data-retention', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-disposition-codes', area: 'settings',
    route: '/settings/disposition-codes', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-hours', area: 'settings',
    route: '/settings/hours', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-integrations', area: 'settings',
    route: '/settings/integrations', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-notifications', area: 'settings',
    route: '/settings/notifications', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-organization', area: 'settings',
    route: '/settings/organization', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-profile', area: 'settings',
    route: '/settings/profile', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-roles', area: 'settings',
    route: '/settings/roles', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-security', area: 'settings',
    route: '/settings/security', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-sla', area: 'settings',
    route: '/settings/sla', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-teams', area: 'settings',
    route: '/settings/teams', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-templates', area: 'settings',
    route: '/settings/templates', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-users', area: 'settings',
    route: '/settings/users', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'settings-webhooks', area: 'settings',
    route: '/settings/webhooks', routeKind: 'static', lifecycle: 'active',
    parentId: 'settings', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'route-inventory' } ],
  },
  {
    id: 'supervisor', area: 'supervisor',
    route: '/supervisor', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'supervisor-agents', area: 'supervisor',
    route: '/supervisor/agents', routeKind: 'static', lifecycle: 'active',
    parentId: 'supervisor', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' } ],
  },
  {
    id: 'supervisor-wallboard', area: 'supervisor',
    route: '/supervisor/wallboard', routeKind: 'static', lifecycle: 'active',
    parentId: 'supervisor', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' } ],
  },
  {
    id: 'tickets', area: 'tickets',
    route: '/tickets', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice', area: 'voice',
    route: '/voice', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice-dids', area: 'voice',
    route: '/voice/dids', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice-history', area: 'voice',
    route: '/voice/history', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice-ivr', area: 'voice',
    route: '/voice/ivr', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'route-inventory' } ],
  },
  {
    id: 'voice-queues', area: 'voice',
    route: '/voice/queues', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'route-inventory' } ],
  },
  {
    id: 'voice-recordings', area: 'voice',
    route: '/voice/recordings', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice-regulatory', area: 'voice',
    route: '/voice/regulatory', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice-sip-settings', area: 'voice',
    route: '/voice/sip-settings', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'route-inventory' } ],
  },
  {
    id: 'voice-sip-trunks', area: 'voice',
    route: '/voice/sip-trunks', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'voice-skills', area: 'voice',
    route: '/voice/skills', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'route-inventory' } ],
  },
  {
    id: 'voice-voicemail', area: 'voice',
    route: '/voice/voicemail', routeKind: 'static', lifecycle: 'active',
    parentId: 'voice', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'workforce', area: 'workforce',
    route: '/workforce', routeKind: 'static', lifecycle: 'active',
    parentId: null, navigation: 'main', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'discovery-observation', observedAt: '2026-07-30' }, { type: 'navigation-contract' }, { type: 'route-inventory' } ],
  },
  {
    id: 'workforce-badges', area: 'workforce',
    route: '/workforce/badges', routeKind: 'static', lifecycle: 'active',
    parentId: 'workforce', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'workforce-evaluations', area: 'workforce',
    route: '/workforce/evaluations', routeKind: 'static', lifecycle: 'active',
    parentId: 'workforce', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'route-inventory' } ],
  },
  {
    id: 'workforce-schedules', area: 'workforce',
    route: '/workforce/schedules', routeKind: 'static', lifecycle: 'active',
    parentId: 'workforce', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'workforce-surveys', area: 'workforce',
    route: '/workforce/surveys', routeKind: 'static', lifecycle: 'active',
    parentId: 'workforce', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'known-bug' }, { type: 'route-inventory' } ],
  },
  {
    id: 'workforce-time-off', area: 'workforce',
    route: '/workforce/time-off', routeKind: 'static', lifecycle: 'active',
    parentId: 'workforce', navigation: 'secondary', runtimePolicy: 'readonly-baseline',
    evidence: [ { type: 'route-inventory' } ],
  },]);

// Import anında fail-closed doğrulama: bozuk bir düzenleme hemen patlar.
assertValidRegistry(PRODUCT_SURFACES);

/** id → yüzey haritası. */
export const SURFACE_BY_ID = Object.freeze(
  new Map(PRODUCT_SURFACES.map((s) => [s.id, s]))
);
/** Tüm kanonik yüzey id'leri (kayıt sırasında). */
export const SURFACE_IDS = Object.freeze(PRODUCT_SURFACES.map((s) => s.id));
/** Yalnız STATİK yüzey rotaları (dynamic/redirect hariç) — araç/karşılaştırma kolaylığı. */
export const SURFACE_STATIC_ROUTES = Object.freeze(
  PRODUCT_SURFACES.filter((s) => s.routeKind === 'static').map((s) => s.route)
);
