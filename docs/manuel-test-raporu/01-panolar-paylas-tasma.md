# Bulgu 01 — Paylaş diyaloğunda yatay taşma (Raporlar › Panolar)

- **Alan:** Raporlar › Panolar (`/reports/dashboards`) — Özel pano kartı › **Paylaş** (`lucide-share2`)
- **Ortam:** canlı `app.vomenta.com`, 28 Tem 2026, Chromium (Playwright), viewport 1440×900
- **Bulan:** kullanıcı (manuel) · **Doğrulayan:** otomasyon (inspection)
- **Ciddiyet:** Orta — görsel/UX bozukluğu; işlevi (kopyalama) engellemiyor ama kopyala/Close düğmeleri kartın dışına taşıyor
- **Durum:** Açık
- **Tekrarlanabilir:** ✅ %100 (4 dilde de)

## Özet

Bir özel panonun **Paylaş** ikonuna basınca açılan *Share Dashboard* diyaloğunda,
uzun paylaşım URL'si diyalog kartını **yatayda taşırıyor**. Kopyala düğmesi ve alt
**Close** düğmesi kartın **dışına** itiliyor.

## Yeniden üretme adımları

1. Giriş yap → **Raporlar › Panolar**.
2. **Özel Panolar** altındaki herhangi bir kartta **Paylaş** ikonuna (zincir/paylaş) bas.
3. Açılan *Share Dashboard* diyaloğuna bak.

**Beklenen:** URL kutuya sığar veya `…` ile kısaltılır; kopyala ve Close düğmeleri diyaloğun içinde.
**Gerçekleşen:** URL kartı aşar; kopyala + Close düğmeleri kartın dışına (LTR'de sağa, RTL/Arapça'da sola) taşar.

## Kanıt

Ekran görüntüleri: [`../reports-panolar-kesif/screenshots/`](../reports-panolar-kesif/screenshots/)
`en-02-share-dialog.png` (kopyala + Close sağda dışarıda), `en-03-share-dialog-crop.png`
(URL sağdan kesik), `ar-share-dialog.png` (RTL, sola aynalı taşma).

DOM ölçümü (inspection):

| Ölçüm | Değer |
|---|---|
| Diyalog kartı genişliği | 512 px (`max-w-lg`) |
| `dialog.scrollWidth` / `clientWidth` | **777 / 510** → ~266 px taşma |
| URL `<p class="… truncate">` stilleri | `overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0` ✅ |
| URL kutusu `scrollWidth`/`clientWidth` | 677 / 677 → **kısaltılmıyor** |
| Kapsayıcı `div.flex-1 … px-3 py-2` | `flex:1 1 0%`, **`min-width:auto`** ⚠ (`min-w-0` yok) |
| LTR taşma (en/tr/fr) | sağ 266 px / sol 0 |
| RTL taşma (ar) | sağ 0 / **sol 266 px** (aynalı) |

## Kök neden

Klasik **flexbox min-width** hatası. `truncate` elemanı doğru ayarlı, ama üstündeki
`flex-1` kapsayıcıda `min-width: auto` (varsayılan) olduğu için öğe içeriğinin doğal
genişliğinin altına küçülemiyor → kutu URL'nin tam genişliğine (677 px) uzuyor,
`truncate` hiç devreye girmiyor, satır 512 px'lik diyaloğu ~266 px aşıyor. Diyalog
içeriğinde `overflow` kısıtı da olmadığından düğmeler dışarı taşıyor.

## Önerilen düzeltme (frontend)

- `flex-1` kapsayıcısına **`min-w-0`** ekle: `class="flex-1 min-w-0 rounded-md border bg-muted/50 px-3 py-2"`.
- İsteğe bağlı savunma: diyalog içerik sarmalına `overflow-hidden` / `max-w-full`.
- Doğrulama: `min-w-0` sonrası `truncate` URL'yi `…` ile kısaltır ve
  `dialog.scrollWidth === clientWidth` olur (taşma sıfırlanır).

## İlişkili istek (ayrı, a11y)

Kart ikon düğmeleri (**Paylaş/Çoğalt/Sil**) erişilebilir isimsiz — düzeltmeyle birlikte
`data-testid` + `aria-label` eklenmesi test kararlılığı ve erişilebilirlik için talep edildi.

## Otomatik regresyon

- **Bilinen hata guard'ı:** `tests/reports-dashboards.authed.spec.js` → *Paylaş* `describe`'ında
  **L3 görev OK** testi `test.fail()` ile bırakıldı: diyalog taşmamalı
  (`dialog.scrollWidth <= clientWidth + tolerans`, **yöne duyarsız**). Bug açıkken
  "beklenen başarısızlık", düzelince "beklenmedik geçiş" → o zaman `test.fail` kaldırılıp
  kalıcı guard olur.
- **Genel tarama:** Bu tekil guard'ın ötesinde, benzer taşmaları toplu yakalamak için
  bkz. [KATMAN-TASMA-STRATEJISI.md](KATMAN-TASMA-STRATEJISI.md).
