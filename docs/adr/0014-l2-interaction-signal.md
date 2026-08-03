# ADR-0014: L2 etkileşim derinliği makine-okur işareti (WP-L2-WAVE-1)

- Durum: Kabul edildi
- Tarih: 2026-08-03
- İlişki: ADR-0012 (Rota Kapsam Derinliği Matrisi) bu işareti bilinçli olarak
  ERTELEDİ: FAZ 4'te etkileşim boyutları için rota düzeyi makine-okur işaret
  YOKTU → hiçbir boyut `COVERED` olamıyordu (fail-closed). Bu ADR o işareti ekler.

## Bağlam

ADR-0012 L2'yi iki kanıt katmanına ayırdı: (a) **stil sözleşmesi** (statik `@tag`
kanıtı; `COVERED` = test var) ve (b) **etkileşim derinliği** (sekme/filtre/tablo/
pagination/boş/loading). FAZ 4'te (b) için makine-okur işaret olmadığından motor her
etkileşim boyutunu `UNVERIFIED` (NO_MACHINE_SIGNAL) üretiyor ve bir invariant, herhangi
bir boyut `COVERED` olursa "sahte kanıt" diye FIRLATIYORDU. Sonuç: hiçbir rota `L2·deep`
olamıyordu (bkz. `computeInteractionTier`, eski hâli). Matris özeti bu rotaları açıkça
"FAZ 5 / WP-L2-WAVE-1 adayı" olarak etiketliyordu.

## Karar

Her etkileşim boyutuna bir **`@ix-*` makine-okur işareti** tanımla (INTERACTION_TAG):

| boyut | işaret |
|---|---|
| tabs | `@ix-tabs` |
| search-filter | `@ix-filter` |
| table-list | `@ix-table` |
| pagination-sort | `@ix-pagination` |
| empty-state | `@ix-empty` |
| loading-state | `@ix-loading` |

`computeInteractionTier` artık rotanın mevcut etiket kümesini de alır. Bir boyut için:

- **dedicated** (yüzey-özgü arketip beyanlı `tested-pages` sözleşmesi) rota ilgili
  `@ix-*` işaretini taşıyorsa → `COVERED` (reasonCode **`IX_SIGNAL_PRESENT`**).
- işaret yoksa → dürüstçe `UNVERIFIED` (NO_MACHINE_SIGNAL).
- yüzeyde bulunmayan boyut `naInteraction` ile açık gerekçeyle `NOT_APPLICABLE`
  (DECLARED_NA) — `naStyles` desenini birebir yansıtır (§5.4 "arketip bulunmayan
  madde açık N/A gerekçesiyle").

Kanıt standardı stil ile **AYNIDIR**: etiket = "o boyut için gerçek bir read-only
etkileşim testi VAR" (bu koşumda geçti demek DEĞİL — runtime kanıtı L1'dir).

### Honesty-core (sahte kanıt korumaları — invariant + self-check)

1. `COVERED` YALNIZ `IX_SIGNAL_PRESENT` reasonCode ile mümkündür; işaretsiz `COVERED`
   → invariant hatası (self-check negatif vakası).
2. **misdeclared işaret**: uygulanamaz / `naInteraction`-N/A bir boyut için `@ix-*`
   işareti = yüzeyde olmayan bileşen iddiası → invariant hatası (self-check negatif).
3. İşaret YALNIZ `dedicated` rotada kredilenir (genel `routeLevelBaseline` yüzey
   bileşeni beyan etmez → uygulanabilirlik bilinemez → UNVERIFIED kalır).
4. `L2 COMPLETE` (→ `L2·deep`) hâlâ TÜM geçerli etkileşim boyutunun `COVERED`
   olmasını ister (ADR-0012 §4.9-4 korunur).

`@ix-*` etiketleri `style-coverage.mjs` ALLOWED_TAGS'a eklendi (yalnız "geçersiz
etiket" reddini önlemek için; BASELINE/CONDITIONAL stil kapısını ETKİLEMEZ).

## İlk dalga (WP-L2-WAVE-1)

Seçim `dedicated` sözleşmesi olan (kredilenebilir) + en yüksek risk (açık bulgu) +
gerçek etkileşim yüzeyi kesişiminden yapıldı. Blind-spot rotalar (/inbox, /campaigns
hub, /analytics, /supervisor, /contacts) `tested-pages`'te DEĞİL → tam "dedicated
sayfa promosyonu" (tüm stil sözleşmesi) gerektirir → sonraki dalgalara bırakıldı.

| yüzey | işaret(ler) | kapsanan / geçerli | N/A boyutlar |
|---|---|---|---|
| `/settings` (hub) | `@ix-tabs` | 1/1 | liste/filtre/pager/boş/loading (dedicated alt-rotalarda) |
| `/settings/users` | `@ix-table` `@ix-filter` `@ix-empty` | 3/3 | pagination, loading |
| `/settings/roles` | `@ix-table` (satır==API sadakati) | 1/1 | filtre, pagination, boş, loading |

Sonuç: `L2 COMPLETE` 0 → 3; üç rota `L2·style` → `L2·deep`.

## Sonuçlar

- Matris artık gerçek etkileşim derinliğini makine-okur biçimde kredileyebilir; sahte
  COVERED yolları invariant+self-check ile kapalı.
- Yeni testler production read-only; mutation/RBAC/provider yok (§5.6). Bulgu statüsü
  otomatik değişmez.
- Sonraki dalgalar: blind-spot yüzeylerin dedicated-promosyonu + kalan etkileşim
  boyutlarının kapsanması.
