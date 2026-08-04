# ADR-0021 — Tüm bilinen yüzeylerin uzlaştırılması ve ilk dürüst yüzey envanteri

- Durum: Kabul edildi (WP-SURFACE-RECONCILE / HANDOFF FAZ 4)
- Bağlam: ADR-0018 (kanonik `PRODUCT_SURFACES` registry) + ADR-0019 (completeness kapısı) + ADR-0020 (rota envanteri migrasyonu)
- Tarih: 2026-08-04

## Bağlam

FAZ 1–3 kanonik registry'yi, fail-closed completeness kapısını ve rota-envanteri
migrasyonunu kurdu. Ancak registry FAZ 1'de BİLİNÇLİ olarak eksik bırakılmıştı: canlı
read-only doğrulama beklediği için bazı alt yüzeyler (AI alt sekmeleri, Supervisor
alt yüzeyleri, `/voice/live`, Contacts alt/detay sayfaları, Campaigns sihirbazı,
Settings Modules/marketplace) kayıt dışıydı. Bu yüzeyler üründe VAR; envanterde
görünmemeleri tam da bu programın engellemeye çalıştığı "sessiz kaybolma"dır.

Ayrıca "üründe hangi yüzeyler var + hangileri kayıtlı + hangilerinde dedicated kapsam
sözleşmesi var?" sorularını TEK, deterministik, dürüst bir raporda birleştiren bir
envanter çıktısı henüz yoktu.

## Karar

1. **Güncel `main` repo kaynaklarıyla çapraz-kanıtlanmış tüm bilinen yüzeyler
   registry'ye alındı** (kör ekleme YOK). Kanıt kaynakları: Page Object rota tabloları
   (`AiSubPage.SECTIONS`, `VoicePage.SUBNAV`), dedicated Page Object sınıfları
   (`AgentLivePage`, `InteractionsPage`, `CoachingPage`, `CampaignCreatePage`), dedicated
   spec navigasyon + başlık iddiaları (`contacts.authed.spec`, `voice.authed.spec`,
   `ai-subroutes.authed.spec`) ve known-bug'lar. Eklenen 16 yüzey:
   - AI: `/ai/{voice,chatbot,copilot,sentiment,knowledge-base,usage,providers}` (7)
   - Supervisor: `/supervisor/{calls,interactions,coaching}` (3)
   - Voice: `/voice/live` (1) — `/voice` istemci tarafında buraya yönlenir (alias).
   - Contacts: `/contacts/{import,segments}` + dinamik `/contacts/:id` (3)
   - Campaigns: `/campaigns/create` (Yeni Kampanya sihirbazı) (1)
   - Settings: `/settings/billing/marketplace` (Modules; rol-koşullu 403) (1)

2. **Yeni ürün-varlık kanıt tipi: `page-object`.** Bir Page Object rota tablosu ve/veya
   dedicated spec'in bir rotaya gidip beklenen başlığı görmesi ÜRÜN-VARLIK kanıtıdır
   (yüzey üründe VARDIR). Bu bir kapsam/`✅` iddiası DEĞİLDİR — o ayrım ayrı raporlarda
   yaşar (TEST_STYLE_MATRIX / SURFACE-DEPTH / SAYFA-TEST-SONUCLARI).

3. **Dinamik ve rol-koşullu yüzeyler sahte gerçek URL'ye çevrilmez.** `/contacts/:id`
   `fixture-required` + `READONLY_FIXTURE_ID_REQUIRED` (bot-builder-detail politikası).
   `/settings/billing/marketplace` `readonly-blocked` + `READONLY_403_FORBIDDEN`. Bunlar
   baseline smoke'ta `test.fixme` ile ÜRETİLİR; asla PASS olmaz ama envanterde görünür.

4. **Kanıtı yetersiz adaylar KÖR EKLENMEZ; "held" olarak görünür kalır.** PR #42'ye özgü
   `/campaigns/{sender-ids,dnc,templates}` güncel `main`'de HİÇBİR kaynakta (spec /
   page-object / discovery / known-bug) gözlenmiyor → registry'ye ALINMADI; envanter
   raporunun "held candidates" bölümünde "PR-only / unverified (FAZ 6A)" olarak listelenir.
   Kaybolmazlar; ama sahte `active` de yapılmazlar.

5. **İlk dürüst yüzey envanteri.** Saf `tools/surface-inventory-lib.mjs` + üretici
   `tools/generate-surface-inventory.mjs` kanonik registry + kapsam sözleşmesi durumu +
   completeness uzlaştırmasını TEK deterministik modele dönüştürür:
   `docs/raporlar/SURFACE-INVENTORY.json` + `docs/SURFACE-INVENTORY.md`. Bölümler:
   registered / observed-but-unregistered (0 hedef) / registered-no-coverage-contract /
   dynamic-blocked / deprecated-redirect / evidence-rollup / held-candidates.
   `generatedAt` yazılmaz (null) → statik kaynaklardan bit-identical üretim; drift kapısı
   güvenilir. Fail-closed self-check: `tools/self-check-surface-inventory.mjs`
   (`quality:surface-inventory`, `quality:check` zincirinde) + PR drift kapısı
   `report:surface-inventory:check` (Architecture job).

## Bu fazın SINIRLARI (yapılmayanlar)

- Eksik dedicated feature testleri YAZILMADI ve yüzeyler yeşile BOYANMADI. Yeni yüzeyler
  dürüstçe `NO_COVERAGE_CONTRACT` görünür (dedicated kapsam FAZ 6 dalgalarında yazılır).
- Birleşik rapor motoru (`report:all`) ve style/depth matrislerinin envanterle birebir
  uzlaşması FAZ 5'tir. Bu faz yalnız envanteri ÜRETİR.
- `/voice` redirect'i ayrı kanonik `redirect` yüzeyi olarak yeniden modellenmedi (mevcut
  `readonly-baseline` main-nav hub'ı korundu; `/voice/live` gerçek içerik yüzeyi eklendi).
  Redirect ilişkisi envanter raporunda belirtilir.

## Sonuç

- Kanonik yüzey sayısı: 71 → **87** (85 statik + 2 dinamik; 4 BLOCKED).
- Repo içi tüm rota kaynakları **0 UNREGISTERED_OBSERVED** ile uzlaşıyor.
- Campaigns / AI / Supervisor gibi feature'lar artık generic `/campaigns` · `/ai` ·
  `/supervisor` satırının altında kaybolmuyor; her biri ayrı envanter satırı.
- Kapsam eksikleri açıkça `NO_COVERAGE_CONTRACT`; dinamik/blocked reason-code'lu; PR-only
  adaylar held olarak görünür. Envanter çıktısı deterministik.
