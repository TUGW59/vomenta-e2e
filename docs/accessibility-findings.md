# Vomenta — Erişilebilirlik (a11y) Bulguları

Bu rapor, E2E test paketindeki [axe-core](https://github.com/dequelabs/axe-core) taramasının
(`WCAG 2.1 A/AA` kuralları) `https://app.vomenta.com` üzerinde bulduğu gerçek erişilebilirlik
sorunlarını özetler. Bulgular **uygulama tarafındaki iyileştirme fırsatlarıdır** (test kodu değil).

> Test paketi bu iki sorunu şimdilik "bilinen borç" olarak hariç tutar
> (`A11Y_KNOWN_DEBT = ['color-contrast', 'button-name']`), böylece paket yeşil kalırken
> **başka türde yeni** ciddi/kritik ihlaller yakalanmaya devam eder. Sorunlar giderildikçe
> ilgili kural bu listeden çıkarılıp kalıcı regresyon koruması sağlanmalıdır.

## Özet

| Kural | Etki | WCAG | Nerede |
|---|---|---|---|
| `color-contrast` | serious (ciddi) | 1.4.3 (AA) | Giriş sayfası + tüm ana panel sayfaları |
| `button-name` | critical (kritik) | 4.1.2 (A) | Contacts (tablo satırlarındaki ikon-butonlar) |

## 1) `color-contrast` — Yetersiz renk kontrastı (ciddi)

Metin ile arka planı arasındaki kontrast oranı WCAG AA eşiğinin (normal metin için 4.5:1) altında.
Ekran okuyucu kullanmayan ama düşük görme/parlak ekran koşullarındaki kullanıcıları etkiler.

**Sık görülen örnek elemanlar:**
- `.text-2xl.text-white.tracking-tight` ve `h2` — açık/gradient arka plan üzerinde beyaz başlık metni
- `.text-sidebar-foreground/50` — kenar menüsünde %50 opaklıklı (soluk) metin
- `.text-muted-foreground`, `.truncate.text-muted-foreground` — ikincil/soluk metinler

**Sayfa bazında gözlemlenen (yaklaşık) düğüm sayısı:**

| Sayfa | Düğüm |
|---|---|
| Giriş (`/`) | ~9 |
| Dashboard (`/`) | ~5 |
| Contacts (`/contacts`) | ~4 |
| Tickets (`/tickets`) | ~9 |
| Settings (`/settings`) | ~9 |
| Reports (`/reports`) | ~9 |

> Not: Sayılar sayfa durumuna (yüklenen veri, açık panel) göre değişebilir.

**Öneri:** Soluk metinlerin (`/50` opaklık, `muted-foreground`) kontrast oranını yükseltin;
beyaz başlıkların bulunduğu arka planların yeterince koyu olduğundan emin olun. Tasarım
token'larında (renk değişkenleri) AA'yı sağlayan tonlar seçmek en kalıcı çözümdür.

## 2) `button-name` — Erişilebilir isimsiz buton (kritik)

Yalnızca ikon içeren butonların metin/erişilebilir adı yok; ekran okuyucular bunları
"button" diye okur, ne işe yaradığı anlaşılmaz. Contacts sayfasında tablo satırlarındaki
işlem (ör. arama/çağrı) ikon-butonlarında gözlemlendi (bir durumda ~12 düğüm).

**Öneri:** İkon-butonlara `aria-label` ekleyin (ör. `aria-label="Kişiyi ara"`), ya da
görünür bir metin/tooltip ile ilişkilendirin. Bu, en yüksek öncelikli düzeltmedir (kritik + A seviyesi).

## Nasıl yeniden üretilir

```bash
# İlgili testler:
npx playwright test a11y.authed.spec.js --project=chromium-authed
npx playwright test login.spec.js -g "erişilebilirlik" --project=chromium
```

Kural bir sayfada giderildiğinde, `tests/helpers.js` içindeki `A11Y_KNOWN_DEBT` listesinden
çıkarılarak o kuralın regresyonu kalıcı olarak engellenir.
