# Test Stilleri El Kitabı

Test edilen her sayfa/bölüm, aşağıdaki stilleri **arketipine göre** kapsar ya da açık `N/A: gerekçe`
ile beyan eder. Kural metni: `AGENTS.md → "Zorunlu test stilleri"`. Sert kapı: `tools/style-coverage.mjs`
(+ `tests/contracts/tested-pages.js`). Karar: `docs/adr/0002-mandatory-test-styles.md`.

Her stil `tests/helpers.js`'teki bir yardımcı ile ~1 satırda uygulanır. Yeni bir sayfa test ederken:
1. Sayfayı 4 dilde keşfet (NOTLAR.md), 3-katman kontrolleri + baseline stilleri yaz.
2. Arketipe bağlı koşullu stilleri ekle (veya gerekçeli N/A).
3. Sayfayı `tested-pages.js`'e tescil et; `npm run quality:styles` yeşil olsun.

Örnek referans: `tests/reports-dashboards.authed.spec.js`, `tests/reports-sections.authed.spec.js`.

---

## Baseline stiller (her sayfa — N/A olamaz)

### `@smoke` — Yapı
Başlık/sekme/temel kontroller görünür. → `getByRole` çapaları.

### `@i18n` — 4 dil + RTL + sızıntı
en/tr/fr/ar'de başlık/etiketler çevrili, Arapça `dir=rtl`, iç-terim (ClickHouse/SQL) sızıntısı yok.
Yardımcı: Page Object `switchLanguage(endonym)` (BasePage). Her test taze bağlamda İngilizce başlar;
çok-sayfa taramada full `goto` yerine **sidebar client-nav** kullan (canlı-prod 503 dersi).

### `@a11y` — Erişilebilirlik
```js
import { expectNoSevereA11y } from './helpers.js';
await expectNoSevereA11y(page); // bilinen borç (button-name/contrast) hariç ciddi/kritik ihlal yok
```
Diyalog açıkken de çağır. Bilinen borç: `A11Y_KNOWN_DEBT` (helpers.js).

### `@layout` — Responsive + taşma
```js
import { expectNoOverflowAtViewports } from './helpers.js';
await expectNoOverflowAtViewports(page, '/reports/agent'); // mobil/tablet/masaüstü, yatay-taşma yok
```
Açılan diyalog için: `findOverflowingChildren(dialog)` / `dialog.scrollWidth ≤ clientWidth` (yöne
duyarsız — RTL'de sağ-kenar kontrolü taşmayı kaçırır). Strateji: `docs/manuel-test-raporu/KATMAN-TASMA-STRATEJISI.md`.

### `@clean` — Console/ağ temizliği
```js
test('… @clean', async ({ app, diagnostics }) => {
  await app.dashboards.open();
  diagnostics.assertClean(); // allowlist dışı console-error/request-failed/5xx yok
});
```
`diagnostics` fixture'ı `assertClean(allowlist?)` sunar (varsayılan allowlist'te Next.js `?_rsc=` prefetch
iptalleri gibi zararsız gürültü var). Her yeni allowlist girdisi gerekçeli olmalı.

### `@deeplink` — Doğrudan URL
Rota `page.goto(path)` ile doğrudan açılınca login'e düşmeden yükleniyor; paylaşım/parametreli URL
(`?id=…&shared=true`) çalışıyor; yenilemede oturum korunuyor.

### `@regression` — 3 katman (L1/L2/L3)
Her interaktif kontrol için `AGENTS.md → "İnteraktif kontrol testi standardı"`. Olmayan katman N/A.

---

## Koşullu stiller (arketip varsa zorunlu)

### `@keyboard` — Klavye/odak (diyalog/menü/sekme varsa)
```js
import { expectDialogKeyboard } from './helpers.js';
const dialog = await page.getByRole('dialog'); // aç
await expectDialogKeyboard(page, dialog);       // Tab→odak içeride, Escape kapatır
```
Sekme listesi için: `tab.focus()` → `ArrowRight` → `expect(nextTab).toBeFocused()` (roving tabindex).

### `@errorpath` — Hata-yolu (API'den veri çekiyorsa)
```js
import { mockApi } from './helpers.js';
await mockApi(page, '**/api/v1/reports/agent**', { status: 500 }); // veya { body:'[]' } / { abort:true } / { delayMs }
await page.goto(...); // sayfa zarifçe çökmeli: kabuk sağlam, bozuk/eski veri render EDİLMEMELİ
```
Prod'a YAZMAZ, deterministik.

### `@visual` — Görsel regresyon (kararlı UI varsa) — GECE
```js
test('… @visual', async ({ app }) => {
  test.skip(environment.isCI, 'baseline OS\'e bağlı; CI/Linux\'ta atlanır (darwin-yerel)');
  const dialog = await app.dashboards.openShareDialog();
  await waitForUiToSettle(app.page);
  await expect(dialog).toHaveScreenshot('share-dialog.png', {
    mask: [dialog.getByText(/…canlı bölge…/)], maxDiffPixels: 150,
  });
});
```
Yalnızca **kararlı** UI (diyalog/boş-durum/düzen); canlı grafik/sayı/tarih `mask` ile kapatılır.
Baseline üret: `--update-snapshots`. `import { environment } from '../config/environment.js'` (spec'te
`process.env` yasak).

### `@perf` — Yükleme süresi (grafik/ağır içerik varsa) — GECE
```js
import { expectContentWithin } from './helpers.js';
await expectContentWithin(page, '/reports/agent', rp.charts, 15_000); // ilk grafik 15sn bütçe içinde
```
Canlı-prod varyansı için cömert bütçe.

### `@data` — Veri doğruluğu A (sayısal KPI varsa) — GECE
```js
import { captureJson } from './helpers.js';
const p = captureJson(page, '/api/v1/reports/call'); // navigasyondan ÖNCE dinle
await rp.open();
const json = await p;
await expect(kpiCard).toContainText(String(json.data.summary.totalCalls)); // UI ↔ API sadakati
```
**B (kaynak↔API doğruluğu) test DIŞIDIR ve şu an AÇIK:** Vomenta'nın kendi raporlama backend'ine
erişim gerekir; eldeki Sigma MCP (finans/telekom/CRM) farklı bir sistemdir. Prosedür + fizibilite: `docs/data-audit/`.

### `@export` — Export içeriği (indirme varsa)
İnen dosyayı (`page.waitForEvent('download')`) yakala + CSV/XLSX kolon/satır doğrula (gated), **ya da**
`tests/contracts/coverage-exclusions.js`'e 'download' N/A beyanı + `tested-pages.js naStyles`.

### `@mutation` — Yaşam döngüsü (create/edit/delete/save varsa)
`@mutation` + `mutationGuard` + `cleanup`; yalnızca ayrılmış test tenant'ında. Bkz. `*-mutations.authed.spec.js`.

---

## Lane ve enforcement özeti

| | PR | Gece |
|---|---|---|
| Koşan stiller | @smoke @i18n @a11y @layout @clean @deeplink @errorpath @keyboard + 3-katman | + @visual @perf @data (+ cross-browser) |
| Sert kapı | `quality:styles` (varlık/beyan; deterministik) + `validate-architecture` (etiket→primitif) | full-regression |

Sert kapı **varlığı** dayatır, canlı koşumu değil → oynak stiller PR'ı kırmaz.
