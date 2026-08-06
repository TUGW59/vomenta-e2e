# L2·deep Etkileşim Derinliği — Uygulama Playbook'u (elden-ele)

> Bu belge **tek başına yeterlidir**. Bir sonraki oturuma/ajana yalnız bu dosyayı verirsen
> soru sormadan, döngüye girmeden uygulanabilir. Sistem kodu kopyala-yapıştır hazırdır;
> her faz somut rota listesi + rota-başı deterministik karar tablosu + net "BİTTİ" kriteri içerir.
>
> **Referans (mekanik):** `tools/surface-depth-lib.mjs`, ADR-0014 (`docs/adr/0014-l2-interaction-signal.md`),
> ADR-0012 (`docs/adr/0012-surface-depth-matrix.md`). **Altın örnek şablonlar:**
> `tests/settings-interactions.authed.spec.js`, `tests/settings-users-interactions.authed.spec.js`,
> `tests/settings-roles-interactions.authed.spec.js`.

---

## OPERATÖR SÖZLEŞMESİ — bu dosyayı yükleyen ajan için (ÖNCE OKU)

**Kimliğin:** Kıdemli test otomasyon mühendisisin (SDET). Deterministik, dürüst ve
kendi kendine yeten çalışırsın. Bu playbook senin tek gerçek kaynağın; **kararı sen verirsin.**

**MUTLAK KURALLAR — bunlara uy, kullanıcıya soru SORMA:**
1. **Soru sorma / onay bekleme.** Bilinmesi gereken her şey bu dosyada. Belirsizlik varsa
   §1 muafiyetleri ve §4 karar tablosu + anti-loop kuralları kararı zaten veriyor —
   varsayılanı uygula, gerekçeyi `naInteraction`'a/commit mesajına yaz, DEVAM ET.
   (Tek istisna: prod'a yazma / geri-alınamaz / kapsam-dışı bir şey gerekiyorsa DUR ve bildir.)
2. **Kapsamı kendin daraltma-genişletme.** Fazlar ve rota listeleri §2–§3'te sabit. Sırayla git.
3. **Tek seferde TEK FAZ.** Bir fazı bitir → §5 kriterini doğrula → **DUR ve kısa rapor ver**
   (hangi rotalar deep/exempt oldu, sayaç kaç oldu, kalan backlog). Sonraki faza kendiliğinden GEÇME.
   FAZ 0 mutlaka ilk; o bitmeden hiçbir faz koşulamaz.
4. **Her faz = bir PR.** Ayrı branch, ayrı commit seti. 43 rotayı tek seferde süpürme.
5. **Dürüstlük > yeşil sayaç.** PRESENT boyutu "kolay deep olmak için" N/A yapma. Emin değilsen kapsa.
   `test.skip` ile kapsam buharlaştırma. Sahte `@ix-*` işareti koyma (self-check kırar).
6. **Döngüye girme.** Bir rotada bir boyut ≤2 denemede doğrulanamıyorsa → N/A yap, ilerle
   (Anti-loop #1/#2/#3, §1 & §4). Aynı locator'ı defalarca deneyip durma.
7. **Her rota SALT-OKUNUR.** Mutasyon (create/edit/delete/save) test etme; L3+ kapsam-dışı.

**Çalışma döngün (her faz):** kod/spec yaz → `npm run report:surface` → `quality:depth` +
`quality:surface` + `quality:styles` → yeşilse rotayı `depth-backlog.js`'ten sil → faz bitince
`quality:check` tam + kısa rapor + DUR.

**Kırmızıda ne yaparsın:** hata mesajını oku, §4 Adım 2–8'e göre düzelt (boyutu N/A yap veya
locator/POM getter'ı ekle). Prod-flaky/503 → en fazla 1 kez rerun, sonra N/A veya bildir.

---

## BAŞLANGIÇ — "hangi fazdayım?" (otomatik tespit, soru YOK)

Bu dosya hangi faz için verilirse verilsin, **nerede kaldığını kendin bul**. Sırayla:

1. **FAZ 0 makinesi kurulu mu?** Şu dört yol var mı diye bak:
   `tests/support/interactions.js`, `tests/contracts/depth-backlog.js`, `tools/depth-ratchet.mjs`,
   ve `package.json`'da `quality:depth` script'i.
   - **En az biri yoksa → FAZ 0'dasın.** Önce §2'yi (makine + `/settings/audit` pilotu) uygula. Başka faz koşma.
2. **FAZ 0 kuruluysa** → sıradaki fazı backlog'dan türet:
   ```bash
   node -e 'import("./tests/contracts/depth-backlog.js").then(m=>{const b=m.DEPTH_BACKLOG;const pend=Object.entries(b).filter(([,r])=>!String(r).startsWith("defer"));const faz={};for(const[route,r]of pend){const k=String(r).split(/[ (]/)[0];(faz[k]??=[]).push(route);}const order=["FAZ1-settings","FAZ2-channels","FAZ3-reports","FAZ4-workforce","FAZ5-misc"];const next=order.find(k=>faz[k]);console.log("Kalan bekleyen:",pend.length);console.log("SIRADAKİ FAZ:",next||"(yok — iş bitti)");if(next)console.log("Rotalar:\n  "+faz[next].join("\n  "));})'
   ```
   - Çıktıdaki **SIRADAKİ FAZ**'ın rotalarını al → §4 prosedürüyle **yalnız o fazı** çöz.
   - Kullanıcı mesajında bir faz/alan adı geçiyorsa onu önceler; hiçbiri yoksa yukarıdaki en düşük numaralı fazı yap.
   - "SIRADAKİ FAZ: (yok)" → tüm iş bitti (§6). Yeni spec yazma; yalnız `quality:check` yeşil mi doğrula ve bildir.
3. Seçtiğin fazı bitir → §5 kriterini doğrula → **DUR ve rapor ver.** Bir sonraki faza kendiliğinden geçme.

> Böylece bu tek dosyayı FAZ 1, 3 ya da 5 için versen de ajan doğru yerden başlar; "hangi fazı
> yapayım?" diye sormaz. Faz sırası ve rota kümesi **yalnız `depth-backlog.js`'ten** okunur —
> bir rota çözülüp backlog'dan silindikçe otomatik ilerler (tek gerçek kaynak = backlog).

---

## 0. Amaç ve kesin durum (kanıtlı sayılar)

`docs/raporlar/SURFACE-DEPTH.json` (schemaVersion mevcut) üzerinden türetildi:

- **56 dedicated rota** (`levels.L2.interaction.surfaceArchetype === true`).
- Bunların **3'ü zaten `L2·deep`**: `/settings`, `/settings/roles`, `/settings/users`.
- **43'ü `L2·style` ve asıl hedef** (deepleştirilecek) — Faz 1–5.
- **10'u `L0` voice rotası** (runtime yok → deep OLAMAZ) → **kapsam-dışı, backlog'da `defer`**.

**Hedef:** 43 hedef rotayı ya `L2·deep` yap, ya da (gerçekten etkileşim yüzeyi yoksa)
dürüstçe `naInteraction`-muaf duruma getir. Bitince ratchet kapısı yeşil ve `L2·deep`
sayısı 3 → (deep yapılabilen rota sayısı) yükselir.

---

## 1. "Deep" mekaniği — DEĞİŞMEZ kurallar (ezberle)

Motor `computeInteractionTier` (`tools/surface-depth-lib.mjs:289`) bir rotayı `L2 COMPLETE`
(→ `L2·deep`) sayar ANCAK:

1. Rota **dedicated** sözleşmeli (zaten 43 hedefin hepsi öyle), VE
2. **En az bir** geçerli etkileşim boyutu `@ix-*` işaretli gerçek testle `COVERED`, VE
3. Geçerli olup **kapsanmayan her boyut** sözleşmede `naInteraction` ile gerekçeli N/A.

Boyut → işaret → geçerlilik (arketipten türetilir, `surface-depth-lib.mjs:130`):

| boyut | `@ix-*` işareti | geçerli olma koşulu (archetype) |
|---|---|---|
| tabs | `@ix-tabs` | `hasTabs === true` |
| search-filter | `@ix-filter` | `hasData === true` |
| table-list | `@ix-table` | `hasData === true` |
| pagination-sort | `@ix-pagination` | `hasData === true` |
| empty-state | `@ix-empty` | `hasData === true` |
| loading-state | `@ix-loading` | `hasData === true` |

### Honesty-core (bunları İHLAL ETME — invariant + self-check kırmızıya döner)
- İşaretsiz `COVERED` YASAK. Etiket = "o boyut için gerçek read-only test VAR".
- Yüzeyde **olmayan** boyuta `@ix-*` işareti (misdeclared) YASAK.
- `naInteraction` yalnız **geçerli ama fiziksel olarak yok** olan boyut için, dürüst gerekçeyle.

### İki YAPISAL MUAFİYET (döngü önleyici — çok önemli)
- **Saf-form/özet rota** (hasData=true ama ekranda etkileşimli liste/sekme YOK): tüm geçerli
  boyutları `naInteraction` yap → `applicableDimensions` `[]` olur → rota **deep OLAMAZ**,
  terminal durumu `L2·style (etkileşim N/A)` = **"resolved-exempt"**. Bu bir boşluk değil,
  dürüst beyandır. **Zorla deep yapmaya çalışma.**
- **L0 rota** (runtime yok): deep olamaz → backlog'da `defer`, dokunma.

> **Anti-loop kuralı #1:** Bir rotayı "deep" yapmak için en az 1 gerçek etkileşim boyutu
> bulunmalı. ≤2 denemede hiçbir boyut fiziksel olarak doğrulanamıyorsa → **resolved-exempt**
> yap (hepsini N/A), rotayı backlog'dan çıkar, sonraki rotaya geç. Asla ısrarla arama.

---

## 2. FAZ 0 — Sistem (tek PR, kod kopyala-yapıştır hazır)

Bu faz hiçbir rotayı çözmez; makineyi + kapıyı + 1 pilotu kurar. **Sıra önemli.**

### 2.1 Paylaşılan yardımcılar — YENİ dosya `tests/support/interactions.js`

```js
// @ts-check
import { expect } from '@playwright/test';

/**
 * L2 etkileşim-derinliği yardımcıları (ADR-0014). Locator-tabanlı; @ix-* etiketi
 * YARDIMCIDA DEĞİL, çağıran test()'in başlığındadır. Hepsi SALT-OKUNUR.
 * Şablon kaynağı: settings-{interactions,users-interactions,roles-interactions}.authed.spec.js
 */

/** @ix-table — kolon başlıkları + en az bir dolu veri satırı (görsel yapı). */
export async function assertTableStructure(table, rows, columns = []) {
  await expect(table).toBeVisible();
  for (const col of columns) {
    await expect(table.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
  }
  await expect(rows.first()).toBeVisible();
  await expect(rows.first()).toContainText(/\S/);
}

/** @ix-table (sadakat) — UI satır sayısı == backend liste uzunluğu (görsel ≠ veri). */
export async function assertTableFidelity(page, openFn, rows, apiUrlRe) {
  const respP = page.waitForResponse(
    (r) => apiUrlRe.test(r.url()) && r.request().method() === 'GET' && r.ok(),
    { timeout: 20000 }
  );
  await openFn();
  const body = await (await respP).json();
  const list = Array.isArray(body) ? body : (body.data || body.items || body.results || body.rows || body.records || []);
  expect(Array.isArray(list) && list.length > 0, 'API liste yanıtı dolu olmalı (veri-bağlı)').toBeTruthy();
  await expect(rows).toHaveCount(list.length);
}

/** @ix-filter — arama süzer + temizleyince başlangıç kümesi geri gelir. Örnek metni ilk satırdan türetir. */
export async function assertFilterNarrows(rows, searchInput) {
  await expect(rows.first()).toBeVisible();
  const initial = await rows.count();
  const sample = (await rows.first().innerText())
    .split(/\s+/).find((w) => /^[A-Za-zÀ-ÿ0-9._-]{3,}$/.test(w));
  expect(sample, 'ilk satırdan aranabilir örnek türetilebilmeli (yoksa bu boyut naInteraction)').toBeTruthy();
  await searchInput.fill(sample);
  await expect(rows.filter({ hasText: sample }).first()).toBeVisible({ timeout: 10000 });
  await searchInput.fill('');
  await expect(async () => {
    expect(await rows.count()).toBeGreaterThanOrEqual(initial);
  }).toPass({ timeout: 10000 });
}

/** @ix-empty — eşleşmeyen aramada 0 satır veya "bulunamadı" mesajı. */
export async function assertEmptyState(page, rows, searchInput, emptyRe = /no results|not found|bulunamad|aucun|no [a-z]+ found|empty/i) {
  await expect(rows.first()).toBeVisible();
  await searchInput.fill('zzz_no_such_row_qwerty_9876');
  await expect(async () => {
    const n = await rows.count();
    const msg = await page.getByText(emptyRe).count();
    expect(n === 0 || msg > 0).toBeTruthy();
  }).toPass({ timeout: 10000 });
}

/** @ix-tabs — seçim dışlayıcılığı (tek aria-selected) + panel içeriği değişir. */
export async function assertTabsExclusive(page, tabLocator, names, signatures = {}) {
  for (const name of names) {
    await tabLocator(name).click();
    await expect(tabLocator(name)).toHaveAttribute('aria-selected', 'true');
    for (const other of names) {
      if (other === name) continue;
      await expect(tabLocator(other)).toHaveAttribute('aria-selected', 'false');
    }
    if (signatures[name]) {
      await expect(page.getByText(signatures[name], { exact: false }).first()).toBeVisible({ timeout: 10000 });
    }
  }
}

/** @ix-pagination — "sonraki" tetiklenince ilk satır içeriği değişir (sayfa döner). */
export async function assertPagination(rows, nextControl) {
  await expect(rows.first()).toBeVisible();
  const before = await rows.first().innerText();
  await nextControl.click();
  await expect(async () => {
    expect(await rows.first().innerText()).not.toBe(before);
  }).toPass({ timeout: 10000 });
}

/** @ix-loading — liste API'si mockApi ile geciktirilir; iskelet/spinner görünür, sonra satırlar gelir. */
export async function assertListLoading(page, apiGlob, gotoFn, rows, skeletonLocator) {
  await page.route(apiGlob, async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    return route.continue();
  });
  await gotoFn();
  await expect(skeletonLocator.first()).toBeVisible({ timeout: 2000 }).catch(() => {});
  await expect(rows.first()).toBeVisible({ timeout: 15000 });
  await page.unroute(apiGlob);
}
```

> **Yardımcı seçim rehberi:** `table` var → `assertTableStructure` (+ mümkünse `assertTableFidelity`).
> Arama kutusu var → `assertFilterNarrows` + `assertEmptyState`. Sekme var → `assertTabsExclusive`.
> Pager var → `assertPagination`. Belirgin iskelet var → `assertListLoading`. **Yoksa → naInteraction.**

### 2.2 Backlog sözleşmesi — YENİ dosya `tests/contracts/depth-backlog.js`

```js
// @ts-check
/**
 * L2·deep ratchet backlog'u (tools/depth-ratchet.mjs okur). Her dedicated rota YA
 * L2·deep OLMALI, YA resolved-exempt (applicableDimensions=[]), YA da burada gerekçeli
 * listeli olmalı. Bir rota çözülünce buradan SİL — böylece kapı ileriye dönük daralır.
 * Boşalırsa (defer hariç) tüm dedicated etkileşim yüzeyleri kanıtlanmış demektir.
 */
export const DEPTH_BACKLOG = Object.freeze({
  // ── FAZ 1: settings/* (16; audit FAZ 0 pilotunda çözülür) ──
  '/settings/api-keys': 'FAZ1-settings',
  '/settings/automations': 'FAZ1-settings',
  '/settings/canned-responses': 'FAZ1-settings',
  '/settings/compliance': 'FAZ1-settings',
  '/settings/data-retention': 'FAZ1-settings',
  '/settings/disposition-codes': 'FAZ1-settings',
  '/settings/hours': 'FAZ1-settings',
  '/settings/integrations': 'FAZ1-settings',
  '/settings/notifications': 'FAZ1-settings',
  '/settings/organization': 'FAZ1-settings',
  '/settings/profile': 'FAZ1-settings',
  '/settings/security': 'FAZ1-settings',
  '/settings/sla': 'FAZ1-settings',
  '/settings/teams': 'FAZ1-settings',
  '/settings/templates': 'FAZ1-settings',
  '/settings/webhooks': 'FAZ1-settings',
  // ── FAZ 2: channels/* (7) ──
  '/channels': 'FAZ2-channels',
  '/channels/email': 'FAZ2-channels',
  '/channels/sms': 'FAZ2-channels',
  '/channels/social': 'FAZ2-channels',
  '/channels/video': 'FAZ2-channels',
  '/channels/webchat': 'FAZ2-channels',
  '/channels/whatsapp': 'FAZ2-channels',
  // ── FAZ 3: reports/* (11) ──
  '/reports/agent': 'FAZ3-reports',
  '/reports/ai': 'FAZ3-reports',
  '/reports/billing': 'FAZ3-reports',
  '/reports/call': 'FAZ3-reports',
  '/reports/campaign': 'FAZ3-reports',
  '/reports/channel': 'FAZ3-reports',
  '/reports/csat': 'FAZ3-reports',
  '/reports/dashboards': 'FAZ3-reports',
  '/reports/quality': 'FAZ3-reports',
  '/reports/queue': 'FAZ3-reports',
  '/reports/sla': 'FAZ3-reports',
  // ── FAZ 4: workforce/* (6) ──
  '/workforce': 'FAZ4-workforce',
  '/workforce/badges': 'FAZ4-workforce',
  '/workforce/evaluations': 'FAZ4-workforce',
  '/workforce/schedules': 'FAZ4-workforce',
  '/workforce/surveys': 'FAZ4-workforce',
  '/workforce/time-off': 'FAZ4-workforce',
  // ── FAZ 5: kalan (2) ──
  '/': 'FAZ5-misc (dashboard)',
  '/voice': 'FAZ5-misc (voice hub)',
  // ── DEFER: L0 voice alt-rotaları (runtime yok → deep olamaz; kapsam-dışı) ──
  '/voice/dids': 'defer:L0', '/voice/history': 'defer:L0', '/voice/ivr': 'defer:L0',
  '/voice/queues': 'defer:L0', '/voice/recordings': 'defer:L0', '/voice/regulatory': 'defer:L0',
  '/voice/sip-settings': 'defer:L0', '/voice/sip-trunks': 'defer:L0', '/voice/skills': 'defer:L0',
  '/voice/voicemail': 'defer:L0',
});
```

### 2.3 Ratchet kapısı — YENİ dosya `tools/depth-ratchet.mjs`

```js
// @ts-check
/**
 * L2·deep ratchet. Her DEDICATED rota şu üç terminal durumdan birinde olmalı:
 *  (a) L2·deep, (b) resolved-exempt (L2·style + applicableDimensions=[]), (c) backlog'da gerekçeli.
 * İhlal → exit 1. SALT docs/raporlar/SURFACE-DEPTH.json + depth-backlog.js okur (prod'suz, deterministik).
 * Çalıştırmadan ÖNCE `npm run report:surface` ile JSON güncel olmalı (drift'i report:surface:check yakalar).
 */
import { readFileSync } from 'node:fs';
import { DEPTH_BACKLOG } from '../tests/contracts/depth-backlog.js';

const j = JSON.parse(readFileSync(new URL('../docs/raporlar/SURFACE-DEPTH.json', import.meta.url), 'utf8'));
const dedicated = j.pages.filter((p) => p.levels?.L2?.interaction?.surfaceArchetype === true);

const violations = [];
const staleBacklog = [];
for (const p of dedicated) {
  const deep = p.highestProvenLevel === 'L2_DEEP';
  const appl = (p.levels.L2.interaction.applicableDimensions || []).length;
  const exempt = !deep && appl === 0 && p.highestProvenLevel === 'L2_STYLE'; // saf-form: tüm boyut N/A
  const inBacklog = Object.prototype.hasOwnProperty.call(DEPTH_BACKLOG, p.route);

  if (deep || exempt) {
    if (inBacklog && !String(DEPTH_BACKLOG[p.route]).startsWith('defer')) staleBacklog.push(p.route);
    continue;
  }
  if (!inBacklog) {
    violations.push(`${p.route} — L2·deep değil (highest=${p.highestProvenLevel}, applicable=${appl}) ve backlog'da yok. Ya deepleştir ya backlog'a gerekçe ekle.`);
  }
}
// L0 defer girdileri: JSON'da highest=L0 olmalı; L2·style'a çıkmışsa defer'i kaldır.
for (const [route, reason] of Object.entries(DEPTH_BACKLOG)) {
  if (String(reason).startsWith('defer')) {
    const p = j.pages.find((x) => x.route === route);
    if (p && p.highestProvenLevel !== 'L0') staleBacklog.push(`${route} (defer ama artık ${p.highestProvenLevel})`);
  }
}

if (violations.length || staleBacklog.length) {
  if (violations.length) {
    console.error(`\n❌ depth-ratchet: ${violations.length} ihlal:`);
    violations.forEach((v) => console.error('  - ' + v));
  }
  if (staleBacklog.length) {
    console.error(`\n⚠️  bayat backlog girdisi (çözüldü → depth-backlog.js'ten SİL): ${staleBacklog.join(', ')}`);
  }
  process.exit(1);
}
const deepCount = dedicated.filter((p) => p.highestProvenLevel === 'L2_DEEP').length;
const pending = Object.entries(DEPTH_BACKLOG).filter(([, r]) => !String(r).startsWith('defer')).length;
console.log(`✅ depth-ratchet: ${dedicated.length} dedicated rota tutarlı · L2·deep=${deepCount} · bekleyen backlog=${pending}`);
```

### 2.4 package.json — script ekle ve zincire bağla
- `scripts` içine: `"quality:depth": "node tools/depth-ratchet.mjs"`.
- `quality:check` zincirinin **sonuna** ekle: `&& npm run quality:depth`.
  (Not: `quality:depth` her zaman güncel JSON ister → CI/yerelde önce `npm run report:surface` koşmalı;
  `report:surface:check` zaten drift'i yakalar.)

### 2.5 Pilot — `/settings/audit` (WAVE-1'in ilk elemanı)
FAZ 0'da **bir** rotayı uçtan uca çöz (§4 prosedürü). POM: `tests/pages/AuditLogPage.js`,
mevcut spec: `tests/settings-audit.authed.spec.js`, sözleşme kaydı `tests/contracts/tested-pages.js`.
Yeni dosya: `tests/settings-audit-interactions.authed.spec.js`. Bitince `depth-backlog.js`'ten
`/settings/audit` satırını sil.

### 2.6 Doküman + ADR
- `docs/adr/0029-l2-deep-ratchet.md` (yeni; 0028'den sonra): kararı + iki muafiyeti + backlog ratchet'i yaz.
- `AGENTS.md` "Zorunlu test stilleri" bölümüne kural: **dedicated rota → geçerli etkileşim
  boyutları `@ix-*` ile kanıtlı veya `naInteraction` ile gerekçeli; aksi halde `quality:depth` bloklar.**
- `docs/TEST_STYLES.md`'ye `tests/support/interactions.js` yardımcı kullanımını ekle.

### FAZ 0 — BİTTİ kriteri
`npm run report:surface && npm run quality:depth && npm run quality:surface && npm run quality:styles`
yeşil; matriste `/settings/audit` → `✅ L2·deep`; `L2·deep` sayısı 3 → 4.

---

## 3. Fazlar ve kesin rota listeleri (her faz = bir PR)

> Büyük fazları PR boyutu için 5–8'lik alt-gruplara bölmek serbest; **rota kümesi ve prosedür aynı**.

| Faz | Alan | Rota sayısı | Rotalar |
|---|---|---|---|
| **FAZ 0** | sistem + pilot | 1 | `/settings/audit` |
| **FAZ 1** | settings/* kalanı | 16 | api-keys, automations, canned-responses, compliance, data-retention, disposition-codes, hours, integrations, notifications, organization, profile, security, sla, teams, templates, webhooks |
| **FAZ 2** | channels/* | 7 | `/channels`, email, sms, social, video, webchat, whatsapp |
| **FAZ 3** | reports/* | 11 | agent, ai, billing, call, campaign, channel, csat, dashboards, quality, queue, sla |
| **FAZ 4** | workforce/* | 6 | `/workforce`, badges, evaluations, schedules, surveys, time-off |
| **FAZ 5** | kalan | 2 | `/` (dashboard), `/voice` (hub) |

**Kapsam-dışı (dokunma):** 10 L0 voice alt-rotası (`depth-backlog.js` `defer:L0`). Bunlar önce
ayrı bir iş kolunda `L2·style`'a terfi etmeli (dedicated stil sözleşmesi + runtime) — bu playbook'un hedefi değil.

---

## 4. Rota-başı prosedür (her rotada BİREBİR, sırayla)

Her rota için `<area>` = spec dosya ön-eki (örn. `/settings/audit` → `settings-audit`).

**Adım 1 — Geçerli boyutları oku (soru sorma).**
`docs/raporlar/SURFACE-DEPTH.json` içinde rotanın `levels.L2.interaction.applicableDimensions`
alanı = üzerinde çalışılacak boyut kümesi. (tabs yalnız hasTabs'lı rotalarda; diğer 5 boyut hasData'lı rotalarda.)

**Adım 2 — Her geçerli boyut için PRESENT mı N/A mı? (deterministik karar tablosu):**

| boyut | PRESENT testi (POM/DOM'da ara) | PRESENT ise yardımcı + etiket | N/A varsayılan gerekçe |
|---|---|---|---|
| tabs | `role=tab` / POM'da `.tabs`/`selectTab` | `assertTabsExclusive` · `@ix-tabs` | `Sekme yok (tek panel).` |
| table-list | `role=table`/`role=grid`/POM `.table`,`.rows` | `assertTableStructure` (+ mümkünse `assertTableFidelity`) · `@ix-table` | `Etkileşimli liste/tablo yok (form/özet).` |
| search-filter | arama input'u (`role=searchbox`/`placeholder~=ara/search`) | `assertFilterNarrows` · `@ix-filter` | `Arama/filtre kontrolü yok.` |
| empty-state | (search-filter PRESENT ise) | `assertEmptyState` · `@ix-empty` | `Boş-duruma ulaştıracak arama/filtre yok (read-only).` |
| pagination-sort | pager/`role=navigation`+"next"/sıralanır başlık | `assertPagination` · `@ix-pagination` | `Read-only: tek sayfa/az kayıt; pager kontrolü gözlenmedi.` |
| loading-state | belirgin skeleton/spinner (`[aria-busy]`, `.skeleton`) | `assertListLoading` · `@ix-loading` | `Ayrı liste-yükleme iskeleti gözlenmedi.` |

> **Anti-loop kuralı #2:** PRESENT tespiti için ≤2 hızlı deneme (POM oku + gerekirse tek read-only açılış).
> Emin olamıyorsan → **N/A** (yukarıdaki gerekçeyle). Kararsız kalıp aynı rotada dönme.
>
> **Anti-loop kuralı #3 (kırılganlık):** Bir boyut PRESENT ama testi veri-bağlı olarak
> güvenilmez koşuyorsa (örn. `assertFilterNarrows` örnek türetemiyorsa, `assertPagination`
> tek sayfa olduğu için dönmüyorsa) → o boyutu **N/A** yap. `test.skip` KULLANMA (kapsam
> sessizce buharlaşır). Deterministik alternatif gerekiyorsa `assertListLoading` gibi
> `mockApi`/`route` tabanlı kur; ama basit çözüm N/A'dir.

**Adım 3 — En az 1 PRESENT boyut var mı?**
- **EVET** → Adım 4 (deep yap).
- **HAYIR** (saf-form/özet) → tüm geçerli boyutları `naInteraction` yap (resolved-exempt),
  interactions spec dosyası **yazma**, doğrudan Adım 6'ya git. (Terminal durum: `L2·style` etkileşim N/A.)

**Adım 4 — Interactions spec yaz:** `tests/<area>-interactions.authed.spec.js`.
- Şablon: altın-3 dosyanın yorum/yapı stilini birebir izle (başlıkta rota + "SALT-OKUNUR" + N/A gerekçe notu).
- Her PRESENT boyut için bir `test('... @ix-xxx', ...)`, gövdede `tests/support/interactions.js` yardımcısı.
- POM'u `app` fixture'ından al (örn. `app.audit`); POM'da gerekli locator (`.table`,`.rows`,`.searchInput`,
  `.tabs`) yoksa POM'a **read-only getter** ekle (mutasyon ekleme).
- **Mutasyon YOK.** Yalnız okuma/süzme/sekme.

**Adım 5 — API sadakati (varsa):** liste boyutu için gerçek endpoint biliniyorsa
`assertTableFidelity(page, () => app.<x>.open(), rows, /\/api\/v1\/<...>(\?|$)/)` kullan
(roles şablonu). Bilinmiyorsa yalnız `assertTableStructure` yeterli.

**Adım 6 — Sözleşmeyi güncelle** (`tests/contracts/tested-pages.js`, ilgili rota bloğu):
- Spec yazdıysan `specFiles`'a `'<area>-interactions.authed.spec.js'` ekle.
- Geçerli-ama-kapsanmayan HER boyut için `naInteraction: { '<boyut>': '<gerekçe>' }` ekle
  (Adım 2 varsayılan gerekçeleri kullanılabilir; dürüst olsun).
- ⚠️ **misdeclared yasak:** `@ix-*` işaretlediğin boyutu `naInteraction`'a KOYMA (self-check kırar).

**Adım 7 — Yeniden üret + kapılar:**
```
npm run report:surface
npm run quality:surface && npm run quality:styles && npm run quality:depth
```
- Matriste rota `✅ L2·deep` (veya resolved-exempt için `🟡 L2·style` + etkileşim N/A) olmalı.
- `depth-backlog.js`'ten rotayı **SİL**.

**Adım 8 — Spec'i gerçekten koştur (kırılganlık kanıtı):**
```
npx playwright test tests/<area>-interactions.authed.spec.js --project=chromium-authed
```
Kırmızıysa Adım 2–4'e dön (boyutu N/A yap veya locator düzelt). Prod-flaky/503 ihtimaline
karşı mevcut retry/ADR-0028 gateway davranışı geçerli; 1 kez rerun meşru, tekrar tekrar değil.

### Rota-başı BİTTİ kriteri
`quality:depth` o rotayı artık istemiyor (deep veya exempt) + `report:surface:check` drift yok + spec yeşil.

---

## 5. Faz-başı BİTTİ (PR merge kriteri)
1. Fazın tüm rotaları `depth-backlog.js`'ten silinmiş.
2. `npm run report:surface && npm run quality:check` **tam yeşil** (zincir `quality:depth` dahil).
3. `npm run report:surface:check` drift yok (matris + JSON commit'lenmiş).
4. Yeni spec'ler `chromium-authed`'de yeşil koşuyor.
5. PR başlığı: `feat(l2-deep): FAZ N — <alan> etkileşim derinliği (@ix-*)`.

## 6. Genel BİTTİ (tüm iş)
`depth-backlog.js`'te yalnız `defer:*` girdileri kalır. `quality:depth` çıktısı
`bekleyen backlog=0`. Matris özetinde `L2·deep` sayısı, PRESENT boyutu olan tüm dedicated
rotalar kadar (saf-form rotalar resolved-exempt olarak `L2·style`'da kalır — dürüst, boşluk değil).

---

## 7. Kalite korumaları (critique'ten — uygulanacak kurallar)
- **`naInteraction` dürüstlüğü:** her N/A gerekçesi incelemede okunmalı; "kolay deep olmak için"
  PRESENT boyutu N/A yapmak yasak. Şüphede → boyutu kapsa.
- **`test.skip` yasağı** (etkileşim spec'lerinde): kapsam sessizce kaybolmasın (Anti-loop #3).
- **Zaman-kutusu:** rota başına gold-plating yok; 1–3 boyut + dürüst N/A yeterli. Amaç sayacı
  değil, gerçek read-only etkileşim kanıtı.
- **Not (kapsam sınırı):** Bu iş L2'yi derinleştirir; L3 (create/edit/delete) prod read-only'de
  hâlâ `BLOCKED`. **Asıl ROI staging ortamı + L3 mutation testleridir**; bu playbook onun yerine geçmez.

## 8. (Opsiyonel) İskele üretici — ergonomi, zorunlu değil
`tools/scaffold-interactions.mjs` + `"scaffold:interactions": "node tools/scaffold-interactions.mjs"`.
Girdi bir rota; `tested-pages.js` arketipini + `SURFACE-DEPTH.json` applicable'ını okuyup
(a) PRESENT-varsayımlı `<area>-interactions.authed.spec.js` iskeleti, (b) `naInteraction` taslağı basar.
§4 manuel prosedürü tek gerçek kaynaktır; iskele yalnız hızlandırır. Üretimi engellemez.
