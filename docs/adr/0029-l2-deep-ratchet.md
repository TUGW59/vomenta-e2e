# ADR-0029: L2·deep etkileşim-derinliği ratchet'i (backlog + kapı + iki yapısal muafiyet)

- Durum: Kabul edildi (WP-L2-DEEP / FAZ 0 sistem işi)
- Tarih: 2026-08-05
- İlgili: [ADR-0014](0014-l2-interaction-signal.md) (`@ix-*` makine-okur etkileşim işareti — bu ADR onu operasyonelleştirir),
  [ADR-0012](0012-surface-depth-matrix.md) (rota kapsam-derinliği matrisi),
  [ADR-0016](0016-report-truth-gates.md) (doğruluk kapısı / false-green yasağı)

## Bağlam

ADR-0014 her etkileşim boyutuna (tabs/search-filter/table-list/pagination-sort/
empty-state/loading-state) bir `@ix-*` makine-okur işaret verdi: ilgili işareti taşıyan
dedicated etkileşim testi VARSA boyut `COVERED`, yoksa dürüstçe `UNVERIFIED`. Bir rota
tüm geçerli boyutları kanıtlar (veya `naInteraction` ile gerekçeli N/A yapar) ise
`L2·deep` olur.

Bu mekanizma vardı ama **ileriye dönük bir kapı yoktu**: 56 dedicated rotanın yalnız 3'ü
(`/settings`, `/settings/roles`, `/settings/users`) `L2·deep` idi; kalan 43'ü `L2·style`
(etkileşim derinliği kanıtsız), 10'u `L0` voice (runtime yok → deep olamaz). Hiçbir şey
yeni bir dedicated rotanın etkileşim derinliği kanıtı olmadan eklenmesini engellemiyordu;
"derinlik borcu" sessizce büyüyebilirdi.

## Karar

Deterministik, prod'suz bir **ratchet kapısı** eklenir (`tools/depth-ratchet.mjs`,
`npm run quality:depth`, `quality:check` zincirinin sonunda). Kapı YALNIZ
`docs/raporlar/SURFACE-DEPTH.json` + `tests/contracts/depth-backlog.js` okur.

Her DEDICATED rota şu üç **terminal durumdan** birinde olmalı; aksi halde kapı `exit 1`:

1. **L2·deep** — en az bir geçerli boyut `@ix-*` işaretli testle kanıtlı, kalan geçerli
   boyutlar `naInteraction` ile gerekçeli.
2. **resolved-exempt** — `L2·style` + `applicableDimensions=[]`: tüm geçerli boyutlar
   dürüstçe `naInteraction` yapılmış (aşağıdaki 1. muafiyet). Boşluk değil, dürüst beyan.
3. **backlog'da gerekçeli** — `depth-backlog.js`'te bir faz etiketiyle listeli. Rota
   çözülünce (deep/exempt) girdisi SİLİNİR → kapı ileriye dönük **daralır** (ratchet).
   `defer:*` girdileri hariç backlog boşalınca tüm dedicated etkileşim yüzeyleri kanıtlıdır.

### İki yapısal muafiyet (döngü önleyici)

- **Saf-form/özet rota** (hasData=true ama ekranda etkileşimli liste/sekme YOK): tüm geçerli
  boyutlar `naInteraction` → `applicableDimensions=[]` → rota deep OLAMAZ, terminal durumu
  `L2·style (etkileşim N/A)` = resolved-exempt. Zorla deep yapılmaz.
- **L0 rota** (runtime yok): deep olamaz → backlog'da `defer:L0`, dokunulmaz. Kapı bu
  girdilerin JSON'da hâlâ `highestProvenLevel==='L0'` olduğunu doğrular; `L2·style`'a
  terfi etmişse `defer` bayatlar (kaldırılmalı).

### Dürüstlük çekirdeği (ADR-0014'ten devralınan, kapıyla dayatılan)

- İşaretsiz `COVERED` yasak; `@ix-*` = "o boyut için gerçek read-only test VAR".
- Yüzeyde olmayan / `naInteraction` boyuta `@ix-*` işareti (misdeclared) yasak → invariant hatası.
- `naInteraction` yalnız geçerli-ama-fiziksel-olarak-yok **veya** salt-okuma testi veri-bağlı
  olarak güvenilmez (anti-loop) boyut için, dürüst gerekçeyle. "Kolay deep olmak için"
  PRESENT boyutu N/A yapmak yasak.

## Sonuç

- FAZ 0 pilotu `/settings/audit` → `L2·deep` (`@ix-table`); `L2·deep` sayısı 3 → 4.
- Yeni dedicated rota, etkileşim derinliği kanıtı (veya gerekçeli backlog/exempt) olmadan
  `quality:depth`'i geçemez → derinlik borcu ileriye dönük kilitlenir.
- Paylaşılan yardımcılar `tests/support/interactions.js` (locator-tabanlı, salt-okunur).
- **Kapsam sınırı:** bu iş L2'yi derinleştirir; L3 (create/edit/delete) prod read-only'de
  hâlâ `BLOCKED` (STAGING_REQUIRED). Asıl ROI staging + L3 mutasyon testleridir.
