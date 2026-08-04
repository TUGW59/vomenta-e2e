# Mimari Karar Kayıtları (ADR) — Dizin

Bu klasör, test platformunun **mimari kararlarını** kalıcı olarak belgeler. Her ADR
tek bir kararı; bağlamını, seçeneklerini ve sonucunu anlatır. Karar bir kez
kabul edildikten sonra **değiştirilmez**; yerini yeni bir karar alırsa eski ADR
"geçersiz kılındı" olarak işaretlenir ve yerine geçen ADR'a bağlanır.

Yeni bir mimari kural, kalıcı skip/quarantine, production mutasyonu veya katman
sınırı ihlali gibi kararlar bu klasöre bir ADR gerektirir (bkz. [CONTRIBUTING.md](../../CONTRIBUTING.md) → "İstisnalar").

## Dizin

| No | Karar | Durum |
|----|-------|-------|
| [0001](0001-playwright-test-platform.md) | Playwright test platformu mimarisi | Kabul edildi |
| [0002](0002-mandatory-test-styles.md) | Zorunlu test stilleri ve sert-kapı enforcement | Kabul edildi |
| [0002](0002-opt-in-mutation-tests.md) | Kullanıcı-onaylı mutation test kategorisi | ADR-0004 tarafından geçersiz kılındı |
| [0003](0003-read-only-discovery-crawler.md) | Salt-okunur otomatik keşif crawler'ı | Kabul edildi |
| [0004](0004-staging-only-mutation-guard.md) | Mutation testleri yalnız doğrulanmış staging tenant'ında | Kabul edildi |
| [0005](0005-orphan-zero-mutation-lifecycle.md) | Orphan-sıfır mutation yaşam döngüsü | Kabul edildi |
| [0006](0006-artifact-secret-sanitizer.md) | Artifact secret/PII sanitizer (WP-01) | Kabul edildi |
| [0007](0007-known-bug-forensic-mode.md) | Bilinen-bulgu forensik modu + nightly fixed-candidate (WP-R3) | Kabul edildi |
| [0008](0008-bug-fix-verification.md) | Bug fix verification & regresyon koruması (WP-R4) | Kabul edildi |
| [0009](0009-artifact-allowlist.md) | Güvenli CI artifact allowlist (WP-SEC-B) | Kabul edildi |
| [0010](0010-pr-impact-selection.md) | PR değişiklik-etkisi seçici motoru (WP-CI-E1) | Kabul edildi |
| [0011](0011-pr-impact-runner-enforcement.md) | PR-impact runner ve workflow statik enforcement (WP-CI-E2) | Kabul edildi |
| [0012](0012-surface-depth-matrix.md) | Rota kapsam derinliği matrisi (WP-SURFACE / FAZ 4) | Kabul edildi |
| [0013](0013-doc-drift-gates-pr-only.md) | Committed-doc drift kapıları yalnız PR'da | Kabul edildi |
| [0014](0014-l2-interaction-signal.md) | L2 etkileşim derinliği makine-okur işareti (WP-L2-WAVE-1) | Kabul edildi |
| [0015](0015-production-readonly-manifest.md) | Production read-only test manifesti ve güvenli seçici (FAZ 1) | Kabul edildi |
| [0016](0016-report-truth-gates.md) | Raporlama doğruluk kapıları ve audit orchestrator (FAZ 2) | Kabul edildi |
| [0017](0017-nightly-shard-stability.md) | Nightly cross-browser kararlılığı — tarayıcı × shard matrisi | Kabul edildi |
| [0018](0018-canonical-product-surface-registry.md) | Kanonik Ürün Yüzeyi Registry'si | Kabul edildi |
| [0019](0019-surface-completeness-gate.md) | Surface Completeness motoru ve fail-closed kapı | Kabul edildi |
| [0020](0020-readonly-audit-lane.md) | Kalıcı GitHub full read-only audit lane'i (FAZ 3) | Kabul edildi |
| [0020](0020-route-inventory-from-product-surfaces.md) | Rota envanterini kanonik ürün yüzeyinden türet (FAZ 3) | Kabul edildi |
| [0021](0021-canonical-surface-reconciliation.md) | Tüm bilinen yüzeylerin uzlaştırılması ve ilk dürüst yüzey envanteri | Kabul edildi |
| [0022](0022-unified-report-engine.md) | Birleşik rapor motoru ve matrislerin tek kanonik yüzey modelinden üretimi | Kabul edildi |

## Sonraki numara

Kullanılan en yüksek numara **0022**'dir. Aktif çalışmada **0023** (kanıt hattı /
evidence-pipeline, bkz. açık PR) ayrılmıştır. Yeni ADR bir sonraki boş numarayı alır.
