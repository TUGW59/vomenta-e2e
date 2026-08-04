# ADR-0025: PR change-impact lane — shard + kontrollü altyapı-retry + aggregate gate

- Durum: Kabul edildi
- Tarih: 2026-08-04
- İlişki: ADR-0010 (PR-impact seçici motoru), ADR-0011 (runner + workflow
  enforcement), ADR-0017 (nightly shard stability), ADR-0023 (auth geçici gateway
  resilience), ADR-0024 (PR-impact broad-change cap). Bu ADR yeni bir seçim sistemi
  KURMAZ; ADR-0011 runner'ının **koşum kararlılığını** (stability) ele alır.

## Bağlam

`pr-impact` job'ı (ADR-0011) değişen dosyalardan seçilen testleri tek runner'da,
tek `ubuntu-latest` kutusunda, 45-dk timeout ile koşuyordu. Geniş-etkili PR'lar
(config/contract/auth-setup → ADR-0024 bounded fallback = route-baseline +
authed-critical) her rotayı authed açan yüzlerce testi tek kutuda koşuyor; canlı
production'daki aralıklı `502/503/504` gateway dalgaları (ADR-0023) bu uzun koşumu
düşürüp job'ı timeout/kırmızı yapıyordu. Bu, test doğruluğu değil, PR lane'inin
**kararlılık** sorunudur: (a) yük tek kutuya sığmıyor, (b) tek geçici gateway blip'i
tüm koşumu kaybettiriyor.

## Karar

1. **3 shard + shard başına 1 worker + max-parallel 3.** `pr-impact` job'ı bir
   `matrix.shard: [1, 2, 3]` matrisidir; `max-parallel: 3`, `timeout-minutes: 75`.
   Her shard `PLAYWRIGHT_WORKERS=1` ile koşar (canlı sunucu yükü + determinizm).
   Bölme `shardGroups()` **saf** fonksiyonuyla deterministiktir: tüm exact spec
   dosyalarının birleşimi = tüm shard'ların birleşimi (kayıp yok), hiçbir dosya iki
   shard'a birden gitmez (çakışma yok). grep-only fallback güvenlik ağı (bölünemez)
   yalnız shard 1'de koşar. Bir shard'a iş düşmezse meşru **SHARD_NOOP** (exit 0);
   kapsam diğer shard'lar + aggregate gate ile korunur.

2. **Genel retry 0 + EN FAZLA 1 kontrollü altyapı-retry.** `PLAYWRIGHT_RETRIES=0`
   (genel retry yok — retry flaky'yi başarıya çeviremez). Runner attempt-1'den sonra
   YALNIZ **yapılandırılmış** `502/503/504` (ADR-0023 `gateway-retry.js` tek gerçeklik
   kaynağı) veya **izin verilen network hatası** (allowlist: ECONNRESET/ECONNREFUSED/
   ETIMEDOUT/EAI_AGAIN/ENOTFOUND/EPIPE/socket hang up/net::ERR_*) sınıfındaki
   başarısızlıkları **kesin kimliğiyle** (`file:line`) tek kez yeniden koşar.
   **Assertion / selector / visibility** hataları asla retry edilmez (deny kazanır,
   metinde tesadüfen ağ ifadesi bulunsa bile). Sınıflandırma `classifyFailure()` saf
   fonksiyonundadır ve **fail-closed**: pozitif altyapı kanıtı yoksa 'test' → retry yok.

3. **Shard ve attempt bazında ayrı auth + artifact dizinleri.** Her attempt kendi
   `PW_AUTH_DIR`'ini (`test-results/pr-impact/shard-<n>/attempt-<a>/.auth`) ve
   Playwright `--output` dizinini kullanır. Böylece paylaşılan `playwright/.auth/
   default.json` üzerinde yarış (WP-RUNGUARD `ENOENT`) olmaz ve kontrollü retry TAZE,
   bağımsız bir login üretir (bozuk/expired oturumu miras almaz). Varsayılan (env
   yoksa) davranış değişmez.

4. **Sabit isimli aggregate gate (`pr-impact-gate`).** `needs: pr-impact`,
   `if: always() && pull_request`. Matris sonucu `success` değilse (failure/cancelled/
   skipped) gate KIRMIZI olur → merge engellenir. Sabit ad, shard sayısı değişse bile
   branch protection'ın tek bir zorunlu kapı tanımlamasını sağlar.

5. **Statik enforcement genişletildi.** `self-check-ci-workflow.mjs` yeni kurallar
   ekler: matris tam 3 shard, `max-parallel=3`, `timeout=75`, `PLAYWRIGHT_WORKERS=1`,
   `PLAYWRIGHT_RETRIES=0`, runner `--shard` ile çağrılır, gate job mevcut + pr-impact'e
   bağımlı + sonucu okuyup gate'ler + maskesiz + PR-koşullu. `self-check-pr-impact-runner.mjs`
   ise `shardGroups` (birleşim tam & disjoint, determinizm, grep-fallback shard-1,
   boş-shard meşru, geçersiz-param throw) ve `classifyFailure`/`planRetry` (gateway→infra,
   network→infra, assertion/selector→test, fail-closed, bütçe=1) için sentetik kanıt
   üretir — **production'a dokunmadan**.

## Sonuçlar

- Artı: Geniş-etkili PR'lar 3 kutuya yayılır; her hücre 75-dk kutuda güvenle biter.
  Tek geçici gateway/network blip'i tüm koşumu değil, yalnız ilgili testi tek kez
  yeniden koşar — sahte-yeşil YOK (assertion/selector/visibility hiç retry edilmez).
- Artı: Kapsam saf bölme + aggregate gate ile korunur; sharding hatası offline
  sentetik kanıtla yakalanır.
- Eksi: Paralel 3 runner + kontrollü retry, kısa süreli daha fazla canlı istek
  üretir; `max-parallel: 3` ve worker=1 ile sınırlandı.
- Sınır: Kontrollü retry allowlist'i bilinçli olarak dardır; yeni geçici hata
  imzaları ancak açık bir kararla eklenir (fail-closed).

## Kapsam dışı

Cross-browser PR koşumu, artifact upload lane'i (pr-impact hâlâ upload YAPMAZ),
nightly full-regression shard'ları (ADR-0017) bu ADR'de değişmez.
