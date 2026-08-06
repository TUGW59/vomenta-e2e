# ADR-0031: L2·style ratchet + iki ratchet'in quality:check'e bağlanması

- Durum: Kabul edildi
- Tarih: 2026-08-06
- İlişki: ADR-0029 (L2·deep ratchet) desenini L2·style katmanına genişletir; ADR-0012 (derinlik matrisi) türetimini kaynak alır.

## Bağlam

L2·deep track'i bitti (backlog=0) ve L0 runtime-yakalaması (PR #122) L0'ı 32→4'e düşürdü.
Geriye **stil-kapsamsız (L0/L1) rotalar** kaldı: bunların tam stil sözleşmesine (L2·style)
çıkarılması gerekiyor, ama greenfield stil authoring'i **koşabilir authed ortam** ister
(yerel `.env` test hesabı veya staging) — henüz yok. Kör-CI grind istenmiyor.

İhtiyaç: "hiçbir rota eksik kalmasın"ın **makine-garantisi** — ortam gelene kadar işi
GÖRÜNÜR tutan, yeni stil-kapsamsız rota eklenince fail-closed olan bir kapı.

Ayrıca fark edildi: ADR-0029'un `depth-ratchet`'i script olarak vardı ama `quality:check`
ZİNCİRİNE bağlı DEĞİLDİ → L2·deep regresyonları CI'da yakalanmıyordu.

## Karar

1. **`tools/style-ratchet.mjs` + `tests/contracts/style-backlog.js`** (ADR-0029 depth-ratchet
   deseninin birebir aynası). Her kayıtlı rota şu üç terminal durumdan birinde OLMALI:
   - L2·style / L2·deep (stil sözleşmesi karşılandı),
   - `style-backlog` `PENDING` (koşulabilir; stil sözleşmesi henüz yazılmadı),
   - `style-backlog` `defer:*` (yapısal olarak çıkamaz: dinamik `:id` / blocked / redirect-gated).
   Stil-kapsamsız + backlog'da yok → **exit 1**. Çözülmüş ama PENDING'de kalmış → bayat → exit 1.
   SALT `SURFACE-DEPTH.json` + `style-backlog.js` okur (prod'suz, deterministik).

2. **İki ratchet de `quality:check` zincirine eklendi**: `quality:depth` (ADR-0029; eksikti)
   + `quality:style-ratchet`. Böylece hem L2·deep hem L2·style regresyonu/eksikliği CI kapısı.

3. **depth-backlog uzlaştırması (post-#122):** voice/* alt-rotaları L0→L2·style çıktığı için
   `defer:L0` girdileri geçersizdi. 8'i `PENDING` (L2·deep adayı, koşum-döngüsü bekliyor);
   `/voice/regulatory` + `/voice/sip-settings` applicable=0 (etkileşim yüzeyi yok) →
   resolved-exempt → backlog'dan çıkarıldı.

## Başlangıç durumu (türetilmiş)

- style-backlog: **PENDING 18** (ai/* 8, campaigns/* 2, contacts/* 2, supervisor/* 5, /voice/live)
  + **defer 4** (bot-builder/:id, contacts/:id, settings/billing[+marketplace]).
- depth-backlog: PENDING 8 (voice/* alt-rotaları).

## Sonuçlar

- "Eksik kalmasın" artık kapı-garantili: yeni stil-kapsamsız rota backlog'a eklenmeden CI kırmızı.
- Greenfield authoring KOŞABİLİR ORTAM gelince yapılır (yerel test hesabı `.env` veya staging);
  o zamana kadar liste işi görünür tutar, kör grind yapılmaz.
- L3 mutation (staging) hâlâ asıl ROI ve BLOCKED — bu ADR onu çözmez, görünür bırakır.
