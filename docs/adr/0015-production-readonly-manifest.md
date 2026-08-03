# ADR-0015: Production read-only test manifesti ve güvenli test seçici (WP-FULL-READONLY-AUDIT / FAZ 1)

- Durum: Kabul edildi
- Tarih: 2026-08-03
- İlişki: ADR-0002 (opt-in mutation), ADR-0004 (staging-only mutation guard),
  ADR-0010 (pr-impact seçimi) ve ADR-0011 (pr-impact runner enforcement) ile
  aynı fail-closed felsefeyi paylaşır. Bu ADR, "production'da güvenle çalışan
  bütün testler" kümesini makine-okur bir sözleşmeye bağlar.

## Bağlam

WP-FULL-READONLY-AUDIT, production'da güvenle çalıştırılabilen bütün read-only
testleri gerçek koşumda çalıştırmayı hedefliyor. Bunun için "hangi testler
production-safe?" sorusunun TAHMİNE değil, tek gerçeklik kaynaklarından türeyen
DETERMİNİSTİK ve FAIL-CLOSED bir cevaba bağlanması gerekir. Sadece dosya adındaki
`authed`/`mutation` kelimesine güvenmek yetmez (HANDOFF FAZ 1 tasarım ilkesi):
manifest + konvansiyon + config + validator birlikte çalışmalıdır.

Repo zaten gerekli kaynakları içeriyor; bu faz İKİNCİ bir sınıflandırma kaynağı
OLUŞTURMAZ, mevcutları yeniden türetir:

- dosya-adı konvansiyonu (pr-impact-lib ile birebir mutation regex'i),
- `tests/contracts/mutation-lifecycle.js` (açık `read-only`/`fixme` beyanları),
- `tests/contracts/registered-routes.js` (kayıtlı rota envanteri),
- `tests/contracts/tested-pages.js` (spec ↔ rota/yüzey ilişkisi),
- `config/environment.js` + `playwright.config.js` (`grepInvert:/@mutation/`).

## Karar

`tools/readonly-manifest-lib.mjs` saf kütüphanesi her `*.spec.js` dosyasını tek
bir manifest kaydına eşler. Zorunlu alanlar (HANDOFF §"Manifestte zorunlu alanlar"):
`id`, `pathPattern`, `kind`, `effect`, `auth`, `authRole`, `environment`,
`projects`, `surface`, `routes`, `capabilities`, `timeoutClass`, `artifactClass`,
`lifecycleMode`, `owningPackage`, `exclusionReason`.

### Sınıflandırma (deterministik, öncelik sırası)

- **effect**: açık `read-only` lifecycle beyanı > external-cost allowlist >
  mutation dosya-adı > (varsayılan) read-only.
- **environment**: read-only → `both` (prod+staging); mutation/external-cost →
  `staging` (production seçiminde YASAK).
- **auth**: yalnız `PUBLIC_SPEC_ALLOWLIST` (`tests/login.spec.js`) public; geri
  kalan authenticated.
- **projects**: `playwright.config.js` ile birebir (public → chromium/firefox/
  webkit; read-only authed → *-authed üçlüsü; mutation → chromium-authed;
  discovery → chromium-discovery).

Bilinen konvansiyona uymayan bir `*.spec.js` → `UNCLASSIFIED_SPEC` FIRLATIR
(fail-closed). Yeni etiketsiz/yanlış-adlı spec sessizce "güvenli" sayılamaz.

### Güvenli seçim profilleri

Yedi kanonik profil (`PROFILES`): `route-baseline-chromium`,
`readonly-critical-chromium`, `readonly-full-chromium`,
`known-bug-readonly-chromium`, `readonly-cross-browser`, `a11y-readonly`,
`visual-readonly` (policy-gated). Her profil DETERMİNİSTİK bir spec-DOSYA seçimi
+ runtime `grep` üretir. Seçim kuralları:

1. Yalnız `effect=read-only` kayıtlar seçilir; mutation/external-cost effect ile
   dışarıda kalır.
2. Bir profil bir spec'i AÇIKÇA `files` ile hedefliyorsa (örn. route-baseline),
   o dosya read-only olmak ZORUNDA; değilse `PROFILE_SELECTS_UNSAFE` hard fail.
3. Production seçimi staging-only kayıt içeremez → `PROFILE_REQUIRES_STAGING`.
4. Güvenli seçim 0 ise gerekçesiz başarı yasak → `PROFILE_ZERO_SELECTION`.

`public` (login) profili bu kümede DEĞİLDİR: mevcut `public-smoke` fallback
suite'i (ADR-0010) kapsar. `discovery` de ayrı read-only lane'dir (ADR-0003) ve
bu profillere katlanmaz.

### listed != selected != executed

Bu katman yalnız spec DOSYASI seçer; çalıştırılan/geçen test SAYISI runtime
raporunun (FAZ 2+) işidir. `assertNoExecutedClaim`, seçim/manifest objesinin
`executed`/`passed`/`failed`/`flaky`/`runId` gibi bir alan taşımasını FIRLATARAK
engeller — statik `--list` sonucu "executed" gibi sunulamaz.

### Çıktılar ve kapılar

- `tools/generate-readonly-manifest.mjs` → committed sanitize snapshot:
  `docs/raporlar/READONLY-MANIFEST.json` + `.md` (Date/SHA/rastgele YOK →
  deterministik, driftlenebilir).
- `tools/select-readonly-tests.mjs` (`ci:readonly:select`) → CI job summary'sine
  yazılabilecek güvenli JSON/MD seçim çıktısı; ihlalde non-zero.
- `tools/self-check-readonly-manifest.mjs` (`quality:readonly-manifest`) →
  `quality:check` zincirinde SERT KAPI: gerçek manifest + değişmezler,
  determinizm, committed snapshot drift'i ve 10-madde negatif matris.
- `report:readonly-manifest:check` → git-diff drift kapısı.

## Sonuçlar

- Production seçimi artık makine tarafından doğrulanan bir sözleşme; mutation/
  external-cost testleri production profillerine giremiyor (çok-katmanlı savunma:
  bu manifest + `grepInvert` + `assertMutationEnvironment` + runner
  `assertNoMutation`).
- Manifest yalnız RAPORLAR; güvenliği değiştirmez. Mevcut mutation kilitleri
  zayıflatılmadı.
- FAZ 2 runtime raporlaması bu seçici çıktısını girdi olarak kullanacak.

## Kapsam dışı (bilinçli)

- Runtime rapor generator ve GitHub workflow bu fazda GENİŞLETİLMEDİ (FAZ 2/3).
- Per-test (title düzeyi) seçim yapılmadı; seçim spec-dosya + `grep`
  granülaritesindedir (deterministik ve `--list`-bağımsız).
