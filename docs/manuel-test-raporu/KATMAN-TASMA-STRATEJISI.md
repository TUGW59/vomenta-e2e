# Düzen/Taşma (Layout Overflow) Hatalarını Otomatik Yakalama Stratejisi

> Bağlam: Kullanıcı, Paylaş diyaloğundaki yatay taşmayı (Bulgu 01) manuel gözle
> yakaladı ve sordu: *"bunlara nasıl daha dikkatli olabiliriz, nasıl daha otomatik
> yakalarız?"* Bu belge, tek bir bug'ı guard'lamanın ötesinde, **bu sınıf hataları
> sistematik** yakalamak için katmanlı bir plan sunar.

Taşma hataları "elle her diyaloğa bakmak" yerine **ölçülebilir değişmezlerle** (invariant)
yakalanır. Dört katman öneriyoruz; ucuzdan pahalıya, hepsi birbirini tamamlar.

---

## Katman A — YönE DUYARSIZ tek-eleman taşma kontrolü (nokta atışı)

Belirli bir kritik bileşen (diyalog, kart, tablo) için: **içeriği kendi kutusunu aşıyor mu?**

```js
// Bir elemanın kendi içeriğinden taşıp taşmadığı (yatay). Yöne (LTR/RTL) duyarsız.
const overflowX = await el.evaluate((n) => n.scrollWidth - n.clientWidth);
expect(overflowX, 'yatay taşma piksel').toBeLessThanOrEqual(2); // ~2px yuvarlama toleransı
```

- **Neden `scrollWidth/clientWidth`?** Sağ-kenar taşmasına bakan bir test **RTL'de (Arapça)
  taşmayı kaçırır** — çünkü RTL'de içerik **sola** taşar (Bulgu 01'de birebir yaşandı:
  spillRight=0 ama spillLeft=266). `scrollWidth > clientWidth` her iki yönde de doğru sinyal.
- **Kullanım:** Bulgu 01 guard'ı tam olarak bunu yapıyor (Paylaş diyaloğunda
  `dialog.scrollWidth <= clientWidth + tolerans`). Bkz. `reports-dashboards.authed.spec.js`.

---

## Katman B — Genel "taşma tarayıcı" (bir kapsayıcıdaki TÜM taşan çocukları bul)

Tek bir bileşeni değil, açılan **her diyaloğu / her kartı** tek çağrıyla tarar: kapsayıcının
sınırlarını **aşan** ilk çocuğu döndürür. Böylece "hangi elemanın taşırdığını" da söyler.

```js
// tests/helpers.js içine önerilen ortak yardımcı
export async function findOverflowingChildren(scope, tolerance = 2) {
  return scope.evaluate((root, tol) => {
    const box = root.getBoundingClientRect();
    const hits = [];
    root.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const spill = Math.max(r.right - box.right, box.left - r.left); // yöne duyarsız (yatay)
      if (spill > tol) hits.push({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 60),
        text: (el.textContent || '').trim().slice(0, 40),
        spill: Math.round(spill),
      });
    });
    return hits;
  }, tolerance);
}
```

Assertion:

```js
const dialog = page.getByRole('dialog');
const spillers = await findOverflowingChildren(dialog);
expect(spillers, `Diyalog taşıran elemanlar: ${JSON.stringify(spillers)}`).toEqual([]);
```

- **Değer:** Hata mesajı doğrudan **hangi elemanın** taştığını verir → teşhis hızlı.
  (Bulgu 01'de tarayıcı `p.text-xs.font-mono.truncate` + `div.flex-1` kapsayıcısını işaret ederdi.)
- **Dikkat:** Kasıtlı kaydırılan kaplar (kod bloğu, geniş tablo `overflow-x:auto`) taşıyormuş
  gibi görünebilir → bu kapları **allowlist**'le (ör. `[data-scroll="x"]`) veya taramada
  `overflow-x` hesaplanan stili `auto/scroll` olanları atla.

---

## Katman C — Sayfa gövdesinde YATAY KAYDIRMA guard'ı (ucuz smoke)

En ucuz ve en yüksek getirili kontrol: **hiçbir sayfa yatayda kaymamalı.** Tek satır,
her sayfaya eklenebilir; "ekranın dışına bir şey taşmış" hatalarının çoğunu yakalar.

```js
export async function expectNoHorizontalPageScroll(page, tolerance = 2) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, 'sayfa yatay taşma').toBeLessThanOrEqual(tolerance);
}
```

- **Nerede:** `@smoke` veya yeni bir **`@layout`** etiketiyle, gezinme testlerinin sonunda
  her ana sayfa için (Dashboards, Reports alt sayfaları, Supervisor, Workforce…).

---

## Katman D — Viewport + dil matrisi (taşma çoğu zaman KOŞULA bağlı)

Taşma genelde belirli genişlik veya dilde ortaya çıkar. Aynı kontrolü bir **matris**te koştur:

- **Genişlikler:** mobil 375, tablet 768, masaüstü 1280/1440. (Dar viewport taşmayı tetikler;
  Duvar Panosu Auto-scroll bug'ında da dar viewport kullanılmıştı.)
- **Diller:** en/tr/fr + **ar (RTL)**. RTL, LTR'de görünmeyen aynalı taşmaları açığa çıkarır.
- Uzun metin/URL'ler en kötü durumdur → paylaşım linki gibi alanları uzun veriyle test et.

```js
for (const w of [375, 768, 1280]) {
  test(`[w=${w}] Panolar sayfası yatayda taşmıyor @layout`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await gotoApp(page, '/reports/dashboards');
    await expectNoHorizontalPageScroll(page);
  });
}
```

---

## Katman E — Görsel regresyon (tamamlayıcı, daha pahalı)

`toHaveScreenshot()` ile kritik diyalogların/pikselin snapshot'ı. Layout kaymalarını
yakalar ama:
- Baseline **OS'e bağlı** (repo'da login snapshot'ı CI/Linux'ta `test.skip`'li — aynı desen).
- Bakım maliyeti yüksek (her kasıtlı UI değişiminde baseline güncellenir).
→ Bu yüzden **birincil** değil; A–D'nin üstüne, yalnızca en kritik ekranlar için.

---

## Önerilen uygulama sırası

1. **Şimdi (bu PR):** Bulgu 01 için Katman A guard'ı (Paylaş diyaloğu `test.fail`). ✅ Yapıldı.
2. **Kısa vade:** `findOverflowingChildren` + `expectNoHorizontalPageScroll` yardımcılarını
   `tests/helpers.js`'e ekle; açılan her diyalog testinde (Create/Edit/Share) taşma taraması çağır.
3. **Orta vade:** `@layout` etiketi + viewport/dil matrisi ile ana sayfaların yatay-kaymama guard'ı.
4. **Uzun vade:** En kritik diyaloglar için görsel snapshot (OS baseline politikasına dikkat).

## Sınırlar / tuzaklar

- **Tolerans:** Alt-piksel yuvarlama için ~2px tolerans şart; 0 katı sonuç flaky yapar.
- **Kasıtlı kaydırma:** `overflow-x:auto` kapları allowlist gerektirir, yoksa yanlış pozitif.
- **Dinamik içerik:** Ölçümden önce içerik yüklensin (skeleton bitsin) — negatif/boş
  assertion'lar skeleton anında yanlış geçebilir (Duvar Panosu i18n dersinde yaşandı).
- **Kök neden ≠ semptom:** Tarayıcı "taşan eleman"ı verir; düzeltme (ör. `min-w-0`) yine
  insan kararı — ama teşhis süresi dramatik kısalır.
```
