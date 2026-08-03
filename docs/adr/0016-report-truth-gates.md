# ADR-0016: Raporlama doğruluk kapıları ve audit orchestrator (WP-FULL-READONLY-AUDIT / FAZ 2)

- Durum: Kabul edildi
- Tarih: 2026-08-03
- İlişki: ADR-0012 (ev deseni: saf lib + CLI + sentetik self-check), ADR-0015
  (read-only manifest → bu ADR'nin "production-safe seçilebilir" sayısını besler),
  ADR-0013 (drift kapıları PR-only). runtime raporlama motoruna (WP-MORNING)
  "false-green olmama" sözleşmesini ekler; İKİNCİ bir rapor sistemi kurmaz.

## Bağlam

Runtime rapor üreteci (`generate-runtime-report.mjs`) tasarım gereği koşumda FAIL
olsa bile raporu üretir ve exit 0 döner — yönetici gerçeği görebilsin diye. Ama
"test kırıldı" gerçeğinin bir yerde final exit'i KIRMIZI yapması gerekir; yoksa
`test && report` zinciri test kırılınca raporu atlar (false-green ya da sessiz
başarı). HANDOFF §3.8 bu semantiği açıkça yasaklar. FAZ 1'e kadar bu birleştiren
katman ("orchestrator") YOKTU; generator'ın kendi yorumu bile bunu "FAZ 4
orchestrator korur" diye erteliyordu.

## Karar

1. **Saf karar çekirdeği** — `tools/audit-orchestrator-lib.mjs::decideFinalExit`
   girdi kombinasyonundan (testExitCode, reportExitCode, reportProduced,
   runtimeJsonExists, staleDetected) tek deterministik final exit + kanonik
   gerekçe (`FINAL_REASON`) türetir. §3.2 exit matrisi `exitMatrix()` ile makine
   -okur biçimde kodlanır; self-check bu tabloyu decideFinalExit ile birebir
   doğrular (tek gerçeklik kaynağı).

2. **CLI orchestrator** — `tools/run-audit.mjs` (`npm run ci:audit`):
   temizle → Playwright koş (kırılsa da devam) → runtime JSON GERÇEKTEN
   oluştuysa generator koş → zorunlu çıktı varlığı + report exit kontrol →
   decideFinalExit ile FINAL exit. test/rapor komutları enjekte edilebilir
   (`--test-cmd`/`--report-cmd`) → self-check production'a bağlanmadan tüm matrisi
   uçtan uca sürer.

3. **Exit matrisi (§3.2, zorunlu):**

   | Test | Rapor | Final | Gerekçe |
   |---|---|---|---|
   | PASS | PASS | 0 | OK |
   | FAIL | PASS | non-zero | TEST_FAILED (rapor YİNE üretilir) |
   | PASS | FAIL | non-zero | REPORT_FAILED |
   | FAIL | FAIL | non-zero | TEST_FAILED_AND_REPORT_FAILED |
   | — | rapor üretilmedi | non-zero | REPORT_NOT_PRODUCED |
   | runtime JSON yok | — | non-zero | RUNTIME_JSON_MISSING (stale reuse yasak) |
   | stale JSON | — | non-zero | STALE_RUNTIME_JSON |

4. **Güvenli hata parmak izi** — `errorFingerprint` ham mesaj/stack YERİNE
   normalize (sayı/hex/yol maskeli) + kısa hash döner; satır/sütun gürültüsü aynı
   parmak izine iner (koşumlar arası delta gürültülenmesin), ham içerik sızmaz.

5. **Cross-output tutarlılık** — `assertCrossOutputConsistency` aynı kanonik
   sayının HTML/MD/JSON çıktılarında birebir geçtiğini doğrular (§item14).

6. **Kapsam hunisi ayrımı (§3.2)** — runtime rapor inventory'sine FAZ 1
   manifestinden `productionSafeSelectable` + `stagingRequired` beslenir; MD raporu
   "tanımlı → production-safe seçilebilir → seçilen → çalışan" hunisini ve
   **`listed != selected != executed != passed`** ilkesini açıkça yazar. Manifest
   yoksa sayılar `null` + `not-provided` (UYDURMA YOK).

7. **Kanonik durum sözlüğü (§3.3)** — `TEST_STATUS` (7 durum) export edilir;
   runtime modeline `runtime.canonical` tek görünümü + inventory'ye
   `skippedByPolicy` (= tanımlı − production-safe, manifestten) eklenir.
   EXPECTED_KNOWN_BUG = knownBugGuard beklenen-başarısızlık (normal FAIL DEĞİL);
   SKIPPED_BY_POLICY = seçim politikasıyla dışlanan (mutation/external-cost; koşuma
   HİÇ girmez). Manifest yoksa `null` (uydurma yok). Rota invariantı korunur (ilk 5
   durum rota-düzeyi, son 2 ayrı semantik sayaç).

8. **Gerçek delta / trend geçmişi (§item12)** — executive `computeTrend` ZATEN
   `docs/raporlar/history/executive-*.json`'dan delta üretiyor ve <2 uygun snapshot
   varsa dürüstçe INSUFFICIENT_HISTORY diyordu; ama bilerek history YAZMIYORDU.
   Eksik yazıcı eklendi: `tools/report-history-lib.mjs` (saf) +
   `tools/append-runtime-history.mjs` (`report:history:append`) gerçek koşum SONUNDA
   sanitize + executive-uyumlu snapshot yazar. run-audit rapor başarılıysa best-effort
   çağırır (başarısızlığı yeşili kırmızıya çevirmez). **DÜRÜSTLÜK:** snapshot ancak
   commit SHA + run ID varsa yazılır → yerel (runId'siz) koşum sahte trend üretemez.
   History dizini gitignore'lu artifact'tir; koşumlar-arası CI kalıcılığı FAZ 3 işi.
   Sert kapı: `quality:report-history` (`quality:check` zincirinde) — iki sentetik
   snapshot → GERÇEK new/fixed delta; tek/uyumsuz → INSUFFICIENT_HISTORY.

## Neden runtime raporunun git-diff DRIFT kapısı YOK (bilinçli)

Diğer üreteçler (surface, executive, findings, readonly-manifest) DETERMİNİSTİK
kaynaklardan üretilir → `report:*:check` git-diff drift kapıları vardır. Runtime
raporu (`TEST-SONUCLARI.json` vb.) ise CANLI koşumun ürünüdür; her koşumda meşru
biçimde DEĞİŞİR. Ona git-diff drift kapısı koymak yanlış olur. Bunun yerine
dürüstlük şu üç kapıyla korunur: (a) `quality:runtime-provenance`
(bayat/SHA-uyuşmaz/listelenmiş-yalnız rapor güncel PASS gibi sunulamaz), (b)
`quality:runtime-report` (17 sentetik sözleşme), (c) `quality:audit-orchestrator`
(bu ADR'nin exit matrisi + false-green engeli).

## Sonuç

`quality:check` zincirine `quality:audit-orchestrator` eklendi. Test kırıldığında
rapor yine üretilir ama final exit kırmızı kalır; rapor üretilemezse test PASS
olsa bile kırmızı; runtime JSON yok/stale ise stale rapor asla kullanılmaz. Tümü
sentetik fixture'larla, production'a bağlanmadan doğrulanır.
