# ADR-0008: Bug Fix Verification & Regression Protection — mekanizma (WP-R4)

- Durum: Kabul edildi
- Tarih: 2026-07-30

## Bağlam

WP-R3 nightly reconcile'ı ve forensik `report:bug`, bir known-bug testinin
"beklenmedik geçiş" (unexpected-pass) verdiğini `fixed-candidate` olarak işaret eder —
ama bu YALNIZ sinyaldir. Tek bir geçiş "bug düzeldi" anlamına gelmez: geçiş
flaky olabilir, ortam/sürüm anlık durumuna bağlı olabilir veya (B4 örneğinde olduğu
gibi) **hesap izin/oturum profiline** bağlı olabilir. Nitekim B4 için aynı gün
(30 Tem 2026) hem forensik `unexpected-pass` hem de registry'de reproduce eden
teknik kanıt mevcut — çelişki, B4'ün izin-bağımlı olduğunu gösterir.

Bir bulgunun gerçekten düzeldiğini KANITA DAYALI, çok-koşulu ve insan-onaylı bir
süreçle doğrulayacak; yalnız o zaman `knownBugGuard` beklenen-başarısızlığından
kalıcı regresyon guard'ına (B8 modeli) taşıyacak bir mekanizma gerekiyor.

## Karar

Bu WP-R4 PR'ı YALNIZ **mekanizmayı** kurar. Hiçbir finding'i kapatmaz, registry'yi
değiştirmez, `knownBugGuard` kaldırmaz, şema genişletmez.

### 1. Bağımsız doğrulama koşusu + attestation

`tools/verify-fixed-candidate.mjs` (`npm run report:verify -- <ID>`) tek bir
BAĞIMSIZ doğrulama koşusu yapar: bulgunun testini forensik modda (WP-R3 `FORENSIC_BUG`;
`test.fail` atlanır → gerçek pass/fail görünür), `--retries=0`, read-only koşar ve bir
**attestation** üretir (`test-results/findings/<ID>/verification/attestations/`).

Bir attestation "bağımsız başarılı koşu" (nitelikli) sayılır ancak tüm koşullar
sağlanırsa (WP-R4 kararı #4):
`result=pass` + `firstAttemptPass` + `retries=0` + `profileVerified` + `freshLogin`
(taze login/storage state) + `environment=production-readonly` + ayrı `workflowRunId` +
`registryFingerprint` beklenenle aynı.

### 2. Eşik + seri (aggregate)

`aggregateVerification` (forensic-lib) attestation kümesini birleştirir. Sondan
başlayarak kesintisiz nitelikli seri hesaplanır; **arada tek bir reproduce /
infra-error / profil-uyuşmazlığı / retry-pass seriyi sıfırlar** (WP-R4 #5). Eşik:
**≥3 farklı `workflowRunId` + ≥2 ayrı takvim günü**. Sonuç durumları:

- `candidate` — henüz koşu yok (reconcile'dan gelen aday).
- `insufficient-evidence` — nitelikli koşu var ama eşik altında (1–2 koşu, aynı run/gün, veya retry ile sıfırlanmış).
- `verified-fixed-proposal` — eşik sağlandı → **YALNIZ ÖNERİ** (registry değişmez).
- `reproduced` — son koşuda bug reproduce oldu.
- `inconclusive` — profil doğrulanamadı / belirsiz koşu.
- `infra-error` — koşu altyapı hatası (pass sayılmaz).

**Tek unexpected-pass hiçbir zaman `verified-fixed-proposal` üretmez.**

### 3. Profil/izin doğrulaması (B4 özel — WP-R4 #7)

`tests/contracts/verification-profiles.js` (registry'den AYRI config; known-bugs.js
ŞEMASI DEĞİŞMEZ) bir bulgunun beklenen normalize izin profilini (allowlisted scope
ANAHTARLARI — değer/secret/PII YOK) tanımlar. B4: orijinal hata bağlamı yetkisizdir →
`settings.billing.*`/`modules.manage` izinleri BULUNMAMALI. Doğrulama koşusu izin
ucunu (`/api/v1/roles/me/permissions`) YALNIZ okur ve scope anahtarlarını çıkarır
(yanıt gövdesi diske yazılmaz; `VERIFY_PROFILE=1` iken, WP-R3 `report:bug`'ı ETKİLEMEZ).
Profil okunamaz veya beklenenle eşleşmezse koşu `inconclusive` olur — pass sayılmaz.

### 4. Güvenlik kapısı + registry değişmezliği

`prepareVerificationBundle` yalnız `verification-report.json` + `profile.json` +
`attestations/*.json` dosyalarını (her biri `findSecrets` taramasından geçerek)
`upload/` altına kopyalar; allowlist-dışı dosya / sızıntılı JSON → non-zero exit,
ham `test-results/` yüklenmez. CLI koşu öncesi/sonrası registry sha256 fingerprint'ini
doğrular; değişirse hard failure. `quality:verify` (`quality:check` zincirinde) tüm
kuralları negatif self-check'lerle her koşuda kanıtlar.

### 5. İnsan onayı (WP-R4 #7)

`verified-fixed-proposal` yalnız öneridir. `open → closed` / `knownBugGuard → permanent`
geçişi ve `test.fail` kaldırma YALNIZ insan onaylı ayrı bir PR ile yapılır (B8 modeli:
`status:closed`, `guard:permanent`, spec'te `knownBugGuard(test,'ID')` satırı kaldırılır,
test kalıcı regresyon guard'ı olarak kalır). Bu PR o geçişi YAPMAZ.

### CI

`workflow_dispatch` opsiyonel `verify_finding_id` girdisi → `known-bug-verify` job
YALNIZ dolu olduğunda çalışır: (best-effort) önceki attestation'ları geri yükler
(seri günlere yayılsın), `report:verify` çalıştırır (CI'da `freshLogin=true`), registry
değişmedi kapısı, YALNIZ `verification/upload/` allowlist bundle'ını yükler.

## Sonuçlar

- Bir bulgunun "düzeldiği" ancak çok-koşulu, günlere yayılmış, profil-doğrulanmış ve
  insan-onaylı biçimde ilan edilebilir; tek geçiş asla yeterli değildir.
- Registry tek gerçeklik kaynağı olarak korunur; otomasyon yalnız öneri üretir.
- Şema değişmedi; doğrulama geçmişi commit edilmeyen artifact'te tutulur.

### Bilinçli sınırlar

- Şema alanları (`verifiedAt`/`closedAt`/`verificationRuns`) EKLENMEDİ; gerçek kapanış
  PR'ında ayrıca değerlendirilecek (WP-R4 kararı #3).
- Canlı authenticated doğrulama koşusu bu oturumda üretim kimlik bilgisi olmadan uçtan
  uca doğrulanmadı; araç yolu kimliksiz (`inconclusive`) + negatif self-check'lerle
  kanıtlandı. Profil yakalama (izin ucu) canlıda doğrulanmadı — CI'da çalışır.
- Cross-run attestation birikimi CI'da best-effort artifact geri-yüklemeyle yapılır;
  canlı davranışı bu oturumda doğrulanmadı.
- Repo/deploy SHA bağımsız-koşu kriteri DEĞİLDİR; yalnız metadata (WP-R4 #8).

## Takip düzeltmeleri (post-merge doğrulama sonrası)

30 Tem 2026 post-merge iki `workflow_dispatch verify_finding_id=B4` koşusu (run
30549912614 + 30550776103) gerçek CI'da iki defekt ortaya çıkardı; ikisi de düzeltildi:

- **Düzeltme 1 — deterministik profil çıkarımı.** Gevşek tarama izin yanıtındaki bir
  ISO timestamp'ı `permissions`'a alıyor, fingerprint'i NON-DETERMINISTIC yapıyordu
  (iki koşuda farklı fingerprint). Yeni `tests/fixtures/scope-extract.js`
  (`isValidScope` + `extractPermissionScopes`) timestamp/UUID/URL/e-posta/sayısal/
  metadata'yı YAPISAL olarak dışlar ve yalnız izin taşıyan bağlamlardan (scope-string
  dizileri, boolean-map anahtarları, bilinen izin alanları) toplar. `normalizeProfile`
  fingerprint'i artık `contractId@version` + sıralı scope listesinden üretir;
  run-id/timestamp/sıra GİRMEZ → aynı hesap + aynı kontrat → aynı fingerprint.
- **Düzeltme 2 — read-only ağ kanıtı.** Doğrulama bundle'ı artık sanitize edilmiş
  `network-summary.json` (WP-R3 collector; method+path+status+süre+tip; body/header/
  secret YOK) içerir ve YALNIZ hedef testin page context'ini kapsar (auth-setup ayrı
  context → dahil değil). Hedef koşuda mutation method (POST/PUT/PATCH/DELETE) görülürse:
  koşu başarılı sayılmaz, `verified-fixed-proposal` üretilemez, raporda `policyViolation`
  işaretlenir ve CI job hard failure verir (güvenli bundle yine de yüklenir).

- **Düzeltme 3 — attestation uyumluluk kapısı + v2 namespace.** Attestation'a
  `schemaVersion` / `profileContractId` / `profileContractVersion` / `networkPolicyVersion`
  eklendi. `aggregateVerification` uyumsuz kayıtları (eski/sürümsüz şema, farklı profil
  kontrat sürümü, farklı finding, farklı ağ-politikası) SERİYE/EŞİĞE KATMAZ; `findingId +
  workflowRunId` üzerinden dedupe eder (yalnız dosya adına güvenmez); yok sayılanları
  `ignoredAttestations` (adet + neden) altında raporlar. CI artifact namespace'i
  `known-bug-verification-v2-<id>-…`'e taşındı → WP-R4-öncesi non-deterministik artifact'ler
  (`known-bug-verify-*`, run 30549912614/30550776103) restore aramasına HİÇ girmez
  (defense-in-depth: namespace + şema kapısı).

`qualifiesAsSuccess` artık `readOnlyVerified===true` ve `policyViolation!==true` de arar.
Bu düzeltmeler yalnız mekanizmayı sağlamlaştırır; B4 hâlâ AÇIK (iki kez reproduce),
registry DEĞİŞMEDİ, hiçbir finding kapatılmadı.

> Kanıt kaynağı notu: yukarıdaki biçim analizinde ham `/roles/me/permissions` response'u
> SAKLANMADI. İki canlı run artifact'inde SANITIZE EDİLEREK çıkarılmış 106 permission
> anahtarı incelendi; geçerli anahtar biçimleri ve tek timestamp kirliliği bu kümeden
> doğrulandı.
