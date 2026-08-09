// @ts-check
import { test, expect } from './fixtures/test.js';
import { hasRoleCredentials, configuredRoles } from '../config/environment.js';
import { apiOrigin, unauthenticatedApiContext } from './support/role-auth.js';
import {
  CATEGORIES,
  PERMISSION_CATALOG,
  ROLE_PERMISSIONS,
  EXPECTED_COUNTS,
} from './contracts/role-permissions.js';

/**
 * AYARLAR → ROLLER (`/settings/roles`) — RBAC MATRİS KONTRATI (RBAC planı FAZ 2).
 *
 * Canlı sistemin rol-izin gerçeğini, FAZ 1 donmuş sözleşmesiyle (role-permissions.js)
 * BİREBİR doğrular. Admin tüm rolleri okuyabildiğinden 6 rol de tek hesapla test edilir.
 *
 * GÜVENLİK (production salt-okunur): Yalnız GET okur ve dialogları AÇIP kapatır; hiçbir
 * checkbox/Save TIKLANMAZ. @mutation yok.
 *
 * KAPSAM (COV-01 ile genişletildi):
 *   1) İzin *tanımı* (katalog + rol kümeleri) canlı ↔ insan-sahipli politika (aşağıdaki
 *      @data blokları). Artık totoloji DEĞİL: kontrat canlıdan türetilmez (bkz.
 *      contracts/role-permissions.js doktrini + gen-role-permissions-contract.mjs --check).
 *   2) *Davranışsal* enforcement — auth'suz erişimin REDDİ (@security bloğu, aşağıda):
 *      korunan uçlar kimlik doğrulaması olmadan 401/403 döndürmeli. Salt-GET, prod-safe.
 *   3) Çapraz-rol (agent gerçekten 403 alır mı) enforcement'ı, düşük-yetkili rol
 *      credential'ı gerektirir → tests/agent-enforcement.agent.spec.js (credential
 *      gelince aktifleşir; yoksa görünür skip). Kapsam boşluğu aşağıda da işaretlenir.
 *
 * ŞEMA NOTU: catalog/roles uçlarının JSON şeması repoda kayıtlı değil; tolerant
 * normalizer'larla (string ya da {key|id|permission}) okunur, CI (authed) doğrular.
 */

const ROLE_ORDER = /** @type {const} */ (['OWNER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'AGENT', 'VIEWER']);
const CONTRACT_KEYS = new Set(PERMISSION_CATALOG.map((p) => p.key));

/** Kategori → o kategorideki toplam izin sayısı (contract'tan). */
const CAT_TOTAL = PERMISSION_CATALOG.reduce((m, p) => ((m[p.cat] = (m[p.cat] || 0) + 1), m), /** @type {Record<string,number>} */ ({}));

/** Bir izin öğesinden anahtar çıkarır (string ya da nesne — şema-toleranslı). */
function permKey(x) {
  if (typeof x === 'string') return x;
  if (x && typeof x === 'object') return x.key ?? x.id ?? x.permission ?? x.slug ?? x.name ?? null;
  return null;
}
function keySet(arr) {
  return new Set((Array.isArray(arr) ? arr : []).map(permKey).filter(Boolean));
}
/** Katalog yanıtını düz anahtar kümesine indirger (dizi / {data|permissions|items} / kategoriye-gruplu). */
function catalogKeys(json) {
  if (Array.isArray(json)) return keySet(json);
  if (json && typeof json === 'object') {
    const arr = json.data ?? json.permissions ?? json.items ?? json.catalog;
    if (Array.isArray(arr)) return keySet(arr);
    const flat = [];
    for (const v of Object.values(json)) if (Array.isArray(v)) flat.push(...v);
    if (flat.length) return keySet(flat);
  }
  return new Set();
}
/** /roles yanıtını { ROL_ADI: Set(anahtar) } biçimine indirger. */
function rolesByName(json) {
  const list = Array.isArray(json) ? json : (json?.data ?? json?.roles ?? json?.items ?? []);
  const out = /** @type {Record<string, Set<string>>} */ ({});
  for (const r of Array.isArray(list) ? list : []) {
    const name = String(r?.name ?? r?.role ?? r?.key ?? '').toUpperCase();
    if (!name) continue;
    out[name] = keySet(r?.permissions ?? r?.permissionKeys ?? r?.perms ?? r?.permission_keys ?? []);
  }
  return out;
}
/** a içinde olup b'de olmayanlar (sıralı, mesaj için). */
function only(a, b) {
  return [...a].filter((x) => !b.has(x)).sort();
}

// ═══════════════ KATALOG KONTRATI (@data @regression) ═══════════════
test.describe('RBAC — katalog kontratı @data @regression', () => {
  test('izin kataloğu 113 anahtar + 14 kategori; contract ile birebir (eksik/fazla yok)', async ({ app }) => {
    const raw = await app.roles.permissionsCatalog();
    const live = catalogKeys(raw);
    const missing = only(CONTRACT_KEYS, live); // contract'ta var, canlıda yok
    const extra = only(live, CONTRACT_KEYS); // canlıda var, contract dışı (yeni izin?)
    expect(missing, `Canlı katalogda EKSİK izinler: ${missing.join(', ') || '—'}`).toEqual([]);
    expect(extra, `Contract'ta OLMAYAN izinler (katalog büyümüş olabilir): ${extra.join(', ') || '—'}`).toEqual([]);
    expect(live.size, `Katalog boyu (parse=${live.size}) 113 olmalı`).toBe(113);
    expect(CATEGORIES.length).toBe(14);
  });
});

// ═══════════════ ROL İZİN KÜMELERİ (@data @regression) ═══════════════
test.describe('RBAC — rol izin kümeleri @data @regression', () => {
  test('her rolün /roles izin kümesi contract ile birebir + sayım eşit', async ({ app, page }) => {
    const respP = page
      .waitForResponse((r) => /\/api\/v1\/roles(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(), { timeout: 20000 })
      .then((r) => r.json())
      .catch(() => null);
    await app.roles.open();
    const json = await respP;
    expect(json, '/api/v1/roles yanıtı alınamadı').toBeTruthy();

    const live = rolesByName(json);
    for (const role of ROLE_ORDER) {
      const liveSet = live[role];
      expect(liveSet, `Canlı /roles içinde ${role} rolü bulunamadı (roller: ${Object.keys(live).join(', ')})`).toBeTruthy();
      const contractSet = new Set(ROLE_PERMISSIONS[role]);
      const missing = only(contractSet, liveSet);
      const extra = only(liveSet, contractSet);
      expect(missing, `${role}: canlıda EKSİK ${missing.join(', ') || '—'}`).toEqual([]);
      expect(extra, `${role}: contract DIŞI ${extra.join(', ') || '—'}`).toEqual([]);
      expect(liveSet.size, `${role} izin sayısı`).toBe(EXPECTED_COUNTS[role]);
    }
  });
});

// ═══════════════ UI ↔ CONTRACT: KATEGORİ YAPISI (@data @regression) ═══════════════
// Create Role dialogu 14 kategoriyi "0/y" sayaçlarıyla gösterir; y (payda) = o kategorinin
// toplam izin sayısı. Şema-bağımsız (DOM) doğrulama; rol OLUŞTURULMAZ (Escape ile kapanır).
test.describe('RBAC — UI ↔ contract: kategori yapısı @data @regression', () => {
  test('Create Role dialogu 14 kategori + her kategori toplamı contract ile eşleşiyor', async ({ app }) => {
    const r = app.roles;
    await r.open();
    const dialog = await r.openCreateDialog();
    for (const cat of CATEGORIES) {
      const { checked, total } = await r.categoryCounter(dialog, cat);
      expect(checked, `Yeni rolde "${cat}" seçili 0 olmalı`).toBe(0);
      expect(total, `"${cat}" toplam izin sayısı`).toBe(CAT_TOTAL[cat]);
    }
    await r.page.keyboard.press('Escape');
  });
});

// ═══════════════ UI ↔ CONTRACT: ROL SEÇİMLERİ (@data @regression) ═══════════════
// Değiştirilmemiş sistem rolleri (AGENT 29, VIEWER 12) için Edit dialogu kategori "x/y"
// sayaçları contract'tan hesaplananla eşleşmeli; seçili toplam = EXPECTED_COUNTS.
// ("N selected" metni gözlenmediğinden toplam, kategori x'lerinin toplamıyla doğrulanır.)
test.describe('RBAC — UI ↔ contract: rol seçimleri @data @regression', () => {
  for (const role of /** @type {const} */ (['AGENT', 'VIEWER'])) {
    test(`${role} Edit dialogu kategori sayaçları contract ile eşleşiyor`, async ({ app }) => {
      const r = app.roles;
      await r.open();
      const dialog = await r.openEditDialog(role);
      const contractSet = new Set(ROLE_PERMISSIONS[role]);
      let sum = 0;
      for (const cat of CATEGORIES) {
        const want = PERMISSION_CATALOG.filter((p) => p.cat === cat && contractSet.has(p.key)).length;
        const { checked, total } = await r.categoryCounter(dialog, cat);
        expect(total, `${role} / "${cat}" toplam`).toBe(CAT_TOTAL[cat]);
        expect(checked, `${role} / "${cat}" seçili`).toBe(want);
        sum += checked;
      }
      expect(sum, `${role} toplam seçili izin`).toBe(EXPECTED_COUNTS[role]);
      await r.page.keyboard.press('Escape');
    });
  }
});

// ═══════════════ ENFORCEMENT: KİMLİK DOĞRULAMASIZ ERİŞİM REDDİ (@security @regression) ═══════════════
// COV-01 — DAVRANIŞSAL güvenlik. Yukarıdaki @data blokları izin *tanımını* doğrular; bu
// blok backend'in gerçekte ne YAPTIĞINI doğrular: korunan RBAC uçları kimlik doğrulaması
// OLMADAN veri SIZDIRMAMALI, açıkça reddetmeli. İki listeyi karşılaştırmaz → totoloji değil.
// Salt-GET, oturumsuz, hiçbir mutasyon yok → production-safe.
// Kanıt (2026-08-07 canlı api.vomenta.com): üç uç da 401 + {success:false, error.code:"UNAUTHORIZED"}.
const PROTECTED_ENDPOINTS = /** @type {const} */ ([
  '/api/v1/roles',
  '/api/v1/roles/permissions/catalog',
  '/api/v1/roles/me/permissions',
]);

test.describe('RBAC — enforcement: kimlik doğrulamasız erişim reddi @security @regression', () => {
  // Staging'in sabit apiHostname'i yoktur (config/environments.js); origin bilinmiyorsa
  // testi SESSİZCE geçmek yerine GÖRÜNÜR biçimde atla (false-green değil).
  test.skip(
    !apiOrigin(),
    'API origin bilinmiyor (environment.apiHostname boş) — kimlik doğrulamasız enforcement bu ortamda koşulamaz'
  );

  for (const path of PROTECTED_ENDPOINTS) {
    test(`GET ${path} kimlik doğrulaması olmadan reddedilir (401/403, veri sızmaz)`, async () => {
      // TAZE context: storageState YOK → garantili oturumsuz (cookie/token taşımaz). Zaten
      // token app JS ile enjekte edilir; page.request de auth taşımaz (bkz. RolesPage.js).
      const ctx = await unauthenticatedApiContext();
      try {
        const res = await ctx.get(path, { maxRedirects: 0 });
        const status = res.status();
        const bodyText = await res.text().catch(() => '');
        let body = null;
        try {
          body = JSON.parse(bodyText);
        } catch {
          /* JSON değilse body null kalır; status yine de asıl iddiadır. */
        }
        const where = `GET ${apiOrigin()}${path} → ${status} ${bodyText.slice(0, 200)}`;

        // Asıl güvenlik iddiası: oturumsuz erişim REDDEDİLMELİ (401/403), 2xx ASLA.
        expect([401, 403], `Korunan uç oturumsuz REDDETMELİ. ${where}`).toContain(status);

        // Ret gövdesi hata sözleşmesine uymalı; başarı verisi sızmamalı.
        if (body) {
          expect(body.success, `Ret gövdesi success:false olmalı. ${where}`).toBe(false);
          expect(
            String(body?.error?.code || '').toUpperCase(),
            `Ret kodu UNAUTHORIZED/FORBIDDEN olmalı. ${where}`
          ).toMatch(/UNAUTHORIZED|FORBIDDEN/);
          expect(body.data, `Oturumsuz yanıtta data SIZMAMALI. ${where}`).toBeFalsy();
        }
      } finally {
        await ctx.dispose();
      }
    });
  }
});

// ═══════════════ KAPSAM DURUMU: ÇAPRAZ-ROL ENFORCEMENT (@security) ═══════════════
// COV-01 — "6 rol tek admin hesabıyla test ediliyor" boşluğunu GÖRÜNÜR kılar. Gerçek
// agent oturumu gerektiren enforcement (agent gerçekten 403 alıyor mu) ayrı dosyadadır:
// tests/agent-enforcement.agent.spec.js — o dosya YALNIZ chromium-agent projesinde
// (VOMENTA_AGENT_EMAIL/PASSWORD varsa) koşar. Credential yoksa o spec HİÇ toplanmaz →
// boşluk sessizce yeşil kalırdı. Her koşuda toplanan bu test, boşluğu gerekçeli bir
// SKIP olarak raporlar; credential gelince PASS'e döner ve gerçek enforcement aktifleşir.
test.describe('RBAC — enforcement kapsam durumu: çapraz-rol @security', () => {
  test('AGENT enforcement kapsamı aktif (credential yoksa görünür skip)', () => {
    test.skip(
      !hasRoleCredentials('agent'),
      'AGENT credential yok (VOMENTA_AGENT_EMAIL/PASSWORD). Çapraz-rol enforcement HENÜZ ' +
        'doğrulanMIYOR; tests/agent-enforcement.agent.spec.js credential gelince aktifleşir.'
    );
    expect(configuredRoles(), 'agent rolü yapılandırılmış olmalı').toContain('agent');
  });
});
