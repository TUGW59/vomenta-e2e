# ADR-0022 — Birleşik rapor motoru ve matrislerin tek kanonik yüzey modelinden üretimi

- Durum: Kabul edildi (WP-SURFACE-UNIFIED / HANDOFF FAZ 5)
- Bağlam: ADR-0018 (kanonik `PRODUCT_SURFACES`) + ADR-0020 (rota envanteri migrasyonu) + ADR-0021 (yüzey envanteri) + ADR-0012 (kapsam derinliği) + ADR-0014 (L2 etkileşim işaretleri)
- Tarih: 2026-08-04

## Bağlam

FAZ 4'e kadar dört rapor AYRI anahtarlarla üretiliyordu:

- **Envanter** (`SURFACE-INVENTORY`) — `PRODUCT_SURFACES` (87 yüzey).
- **Kapsam derinliği** (`SURFACE-DEPTH`) — `REGISTERED_ROUTES` (yine 87, registry'den türer).
- **Stil matrisi** (`TEST_STYLE_MATRIX`) — YALNIZ `TESTED_PAGES` (kapsam sözleşmesi olan alt küme).
- **Proje durumu** — YOKTU.

Sorun: envanter ve derinlik 87 yüzeyi de kapsarken, **stil matrisi yalnız sözleşmeli
sayfaları listeliyordu** → `NO_COVERAGE_CONTRACT` bir yüzey stil matrisinde SESSİZCE yok
oluyordu. Ayrıca hiçbir mekanizma bu raporların AYNI kanonik yüzey kümesinin projeksiyonu
olduğunu KANITLAMIYORDU; biri diğerinden sapabilir, bir yüzey bir raporda görünüp öbüründe
kaybolabilirdi (tam da programın engellemeye çalıştığı "sessiz kaybolma"). "Bu yüzey ne
durumda?" sorusuna tek, dürüst bir cevap veren birleşik görünüm de yoktu.

## Karar

1. **Tek birleşim + uzlaştırma motoru: `tools/unified-report-lib.mjs` (saf).**
   FAZ 4'ün committed model JSON'larını (`SURFACE-INVENTORY.json` + `SURFACE-DEPTH.json` —
   İKİSİ DE kanonik `PRODUCT_SURFACES`'ten türer) **rota anahtarında birleştirir**. İki
   modelin yüzey/rota spine'ı BİREBİR uzlaşmazsa (asimetri) rapor fail-closed kırılır. Motor
   modelleri yeniden TÜRETMEZ, UZLAŞTIRIR → tek gerçeklik kaynağı korunur.

2. **Proje-durumu rollup'ı: fail-closed, worst-first, tek sınıf.** Her yüzey TAM BİR sınıfa
   düşer: `DEPRECATED · REDIRECT · BLOCKED · FAIL · NOT_RUN · NO_CONTRACT · L1_STYLE_GAP ·
   L2_STYLE · L2_DEEP`. Öncelik dürüsttür: **runtime koşmadıysa `NOT_RUN`** (sözleşme
   olsa bile kapsam iddia edilemez); **dedicated sözleşme yoksa `NO_CONTRACT`**; **stil
   karşılandı ama etkileşim derinliği kanıtsızsa `L2_STYLE` (unverified)**. Yalnız `L2_DEEP`
   "tam" demektir. `no-contract / not-run / unverified` her yüzey satırında ayrı sütunlarla
   (sözleşme? · L1 · L2 · etkileşim) da açıkça görünür — rollup bir "yeşil rozet" değildir.

3. **Yeni rapor: `docs/raporlar/PROJECT-STATUS.json` + `docs/PROJECT-STATUS.md`**
   (`tools/generate-project-status.mjs`). Committed envanter+derinlik JSON'larından
   deterministik üretilir (playwright/prod KOŞUM YOK); `generatedAt` null → bit-identical;
   runtime provenance `source`'ta SURFACE-DEPTH'ten devralınır. Her kanonik yüzey TAM BİR KEZ.

4. **Stil matrisine kanonik yüzey eki.** `tools/style-coverage.mjs` mevcut sert kapısını
   (yalnız sözleşmeli sayfalar) KORUR; ek olarak **87 kanonik yüzeyin tamamını** tam bir kez
   listeler: sözleşmeli yüzey stil hücrelerini devralır, sözleşmesiz yüzey dürüstçe
   `NO_COVERAGE_CONTRACT` görünür. Böylece stil matrisi de diğer üç raporla AYNI kanonik
   kümeyi kapsar.

5. **`report:all` + drift kapısı.** `report:all` dördü dependency sırasında üretir
   (envanter → derinlik → stil → proje-durumu) ve birleşik self-check'i koşar. PR drift
   kapısı `report:project-status:check` Architecture job'a eklendi (FAZ 4 deseni). Birleşik
   invariant self-check `tools/self-check-unified-report.mjs` (`quality:unified-report`)
   `quality:check` zincirindedir.

6. **Negatif invariant testleri.** Self-check tamamen sentetik bir envanter+derinlik çifti
   üzerinde: spine asimetrisi (yüzey düş/ekle), duplicate id, mislabeled rollup
   (`NOT_RUN → L2_DEEP`, sözleşmesiz → `NO_CONTRACT` ihlali), bilinmeyen enum, bozuk sıralama
   ve secret/PII/mutlak-yol sızıntısı → hepsi fail-closed reddedilir. Ayrıca GERÇEK ağaç
   yeşil: committed envanter+derinlik birebir uzlaşır, her yüzey tam bir kez.

## Bu fazın SINIRLARI (yapılmayanlar)

- Envanter/derinlik ÜRETECLERİ yeniden yazılmadı (ADR-0021/0012 modelleri korunur). Motor
  onları UZLAŞTIRIR; rollup ve proje-durumu onların BİRLEŞİMİDİR.
- Eksik dedicated feature/etkileşim testleri YAZILMADI; `NO_CONTRACT / L2_STYLE` sınıfları
  dürüstçe eksik kalır (FAZ 6 dalgaları). Yeşile boyama yok.
- `report:all` kapsamı bilinçli olarak dört kanonik yüzey raporudur; coverage/findings/
  executive raporları kendi mevcut kapılarıyla ayrı kalır.

## Sonuç

- Dört rapor da (envanter · derinlik · stil · proje-durumu) AYNI 87-yüzey kanonik spine'ının
  projeksiyonudur; birleşik self-check spine'ın birebir uzlaştığını kanıtlar.
- Her kanonik yüzey her raporda TAM BİR KEZ görünür; `no-contract / not-run / unverified`
  açıkça raporlanır.
- Proje durumu tek fail-closed görünümde: L2·deep 3 · L2·style (unverified) 43 · NO_CONTRACT 9
  · NOT_RUN 28 · BLOCKED 4 (türetilmiş; sabit sayı yok — kaynak değişince yeniden hesaplanır).
