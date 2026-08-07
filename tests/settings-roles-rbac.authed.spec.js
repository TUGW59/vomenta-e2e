// @ts-check
import { test, expect } from './fixtures/test.js';
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
 * checkbox/Save TIKLANMAZ. @mutation yok. İzin *tanımını* doğrular (davranışsal etkiyi
 * değil — o çapraz-rol/L3 işi, bkz. ADR-0030).
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
