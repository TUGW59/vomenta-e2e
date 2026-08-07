# Kanıt Hattı (Evidence Pipeline) — Fazlı Uygulama Planı

> **DURUM (2026-08-06): TAMAMLANDI (FAZ 0→5).** Tüm fazlar merge edildi —
> FAZ 0/1/2 + FAZ 3 (#116), FAZ 4 (#123), FAZ 5 (#125, provenance + governance +
> infra). Hat kapalı döngü olarak çalışıyor: koşum → maskeli kanıt → `evidence-index.json`
> → raporda tıklanabilir link → provenance + governance + infra sınıflandırma.
> Görünür CI kanıtı, evidence lane index'i (şu an `{}`) doldurdukça gelir (dürüst
> "Kanıt: yok" o zamana dek). Geri-kenar yok; bundan sonrası ayrı iş.

> Amaç: Bug/test raporlama hattındaki **kopukluğu** kalıcı, çalışan bir sisteme
> dönüştürmek. Bugün runtime kanıt (trace/screenshot/video + Playwright HTML raporu)
> üretilip **atılıyor**; registry (`known-bugs.js`) elle ve **kanıtsız** yazılıyor;
> rapor "Kanıt: _yok_" diyor. İki kol birbirine hiç bağlı değil.
>
> Bu plan iki kolu **kapalı bir döngüye** bağlar: koşum → güvenli (maskeli) kanıt →
> registry'ye otomatik link → raporda tıklanabilir/gömülü kanıt → provenance + governance.
>
> **Çalışma modeli:** Her faz AYRI bir sohbette, AYRI bir PR olarak yapılır. Fazlar
> kesinlikle **lineer** bağımlıdır (0→1→2→3→4→5), geri-kenar YOKTUR. Her fazın kesin
> bir "Definition of Done" (DoD) ve bir STOP koşulu vardır → döngüye girmez.

---

## 0. Kanıt tabanı (denetimden — özet)

| Gerçek | Kanıt |
|---|---|
| Playwright HTML raporu üretilip atılıyor | `playwright.config.js:58,64` + `.gitignore /playwright-report/` |
| Trace/video/screenshot CI'a bilinçli yüklenmiyor | `prepare-ci-artifact.mjs:92`, `forensic-lib.mjs:43-51` (LOCAL_ONLY) |
| CI'a yalnız sanitize edilmiş özet gidiyor | `artifact-policy.mjs:5-11`, tüm upload path'leri `test-results/secure-upload/` |
| İzinli TEK güvenli görsel zaten var | `forensic-lib.mjs:28-33` → `safe-final-state.png` (UPLOAD_ALLOWLIST) |
| 61 bulgunun 59'unda `evidence[]` boş | `docs/raporlar/findings.json` (evidence dolu = 2) |
| Bulguda run/trace/artifact LİNKİ yok | şemada url alanı yok; findings.json url-içeren = 0 |
| Guard testleri normal koşuda kanıt üretmez | `knownBugGuard` = expected-fail → `screenshot:'only-on-failure'` tetiklenmez |
| Kanıt yalnız manuel + 14 günde siliniyor | `playwright.yml` finding_id lane, `retention-days:14` |
| Provenance boş | `PROJECT-STATUS.md:7` → `commit —` |

**En kritik içgörü:** Güvenli görsel yolu (`safe-final-state.png`) hatta **zaten mevcut ve
izinli**; sorun onun manuel + linksiz + tek-seferlik olması. Plan sıfırdan icat etmez;
bu güvenli yolu **otomatikleştirir, zenginleştirir ve rapora bağlar.**

---

## 1. Hedef mimari — "Kanıt Hattı"

```
   [Playwright koşumu / guard testi]
              │
              ▼
   ┌─ GÜVENLİ KANIT TIER (maskeli, PII-temiz) ──────────────────┐
   │  safe-final-state.png     (tam sayfa, maskeli)             │
   │  location.png             (hatalı eleman KUTU içinde işaretli, maskeli) │
   │  network-summary.json     (status/body özeti, secret maskeli)          │
   │  metadata.json            (env, browser, role, locale, commit, runUrl) │
   │  trace.zip                (LOCAL-ONLY — politika değişmez, yalnız ipucu)│
   └──────────────┬─────────────────────────────────────────────┘
                  │  (otomatik lane — açık guard'lı bulguların hepsi)
                  ▼
   evidence-index.json  (COMMIT'lenir)  → her bulgu ↔ {artifactPath, runUrl, expiry}
                  │
                  ▼
   known-bugs.js.evidence[]  ←→  evidence-index.json  (link, root-cause UYDURMADAN)
                  │  npm run report:findings
                  ▼
   findings.json / BULGULAR.md / HTML  → GÖMÜLÜ maskeli görsel + TIKLANABİLİR run/trace linki
                  │
                  ▼
   Provenance (commit SHA + runUrl) + Governance (owner/lastVerified) + infra/product etiketi
```

---

## 2. Tasarım ilkeleri (değişmez kurallar)

1. **Güvenlik korunur, gevşetilmez.** WP-SEC-B/ADR-0009 sanitize kapısı ve secret-scan
   her fazda geçerli. Yeni görseller **maskeli** üretilir (`page.screenshot({mask:[...]})`
   + mevcut `tests/fixtures/sanitize.js`). Trace/video CI'a yüklenmez (ADR-0007 aynen kalır).
2. **Additive & geriye uyumlu.** Şema alanları opsiyonel eklenir; mevcut 61 kayıt
   değişmeden geçerli kalır. Hiçbir faz eski veriyi zorunlu backfill'e sokmaz.
3. **Production read-only.** Hiçbir faz production'a yazmaz; mutation guard'ı atlatılmaz.
4. **Kök-neden UYDURULMAZ.** Otomasyon yalnız `evidence` / `possibleCauses` üretir;
   `rootCause` yalnız insan incelemesiyle dolar (mevcut kural korunur).
5. **Döngüye girmeme:** her faz = 1 PR, kesin DoD, deterministik self-check, bounded CI
   (bulgu başına tek test, retry storm yok). Fazlar arası geri-kenar yok.
6. **Determinizm:** rapor çıktısı `Date.now()`/rastgelelik içermez; provenance dışarıdan
   (CI env) enjekte edilir.

---

## 3. Faz haritası (lineer bağımlılık)

| Faz | Başlık | Çözdüğü sorun | Tür | Risk |
|---|---|---|---|---|
| **0** | Mimari sözleşme + ADR | (kilit) döngü önleme | tasarım | yok |
| **1** | Şema zenginleştirme (additive) | P-03, P-07 | veri/şema | düşük |
| **2** | Güvenli görsel yakalama (maskeli + işaretli) | P-01, P-06 | capture | orta (PII) |
| **3** | Otomatik kanıt lane'i (manuel→her koşum) | P-05, P-06 | CI | orta (prod yük) |
| **4** | Raporda linkleme + gömme | P-03, P-04, P-08 | render | düşük |
| **5** | Provenance + governance + infra etiketi | P-09, P-10, P-11 | güven | düşük |

> **Zorunlu (rapor amacını karşılamak için):** Faz 1, 2, 3, 4.
> **İyileştirme (sonraya ertelenebilir):** Faz 5.
> **Faz 0** yalnızca kilit/sözleşme; kod davranışı değiştirmez ama loop'u engeller.

---

## 4. Fazlar (her biri ayrı sohbet + ayrı PR)

Her fazın sonunda **STOP**: DoD karşılandıysa PR aç, dur. Sonraki faz yeni sohbette.

---

### FAZ 0 — Mimari sözleşme + ADR (kilit)
- **Amaç:** Sonraki tüm fazların referans alacağı tek sözleşmeyi kilitlemek → yeniden-tartışma/loop yok.
- **Kapsam (yalnız doküman):**
  - `docs/adr/0026-evidence-pipeline.md`: güvenli kanıt tier'ının içeriği, maskeleme kuralı,
    şema eklentileri (Faz 1'in imzası), `evidence-index.json` sözleşmesi, retention/provenance,
    trace'in local-only kalması.
  - Bu plan dosyasındaki alan adlarını ADR ile birebir sabitle.
- **Dokunulan dosyalar:** yalnız `docs/adr/`, `docs/EVIDENCE-PIPELINE-PLAN.md`.
- **DoD:** ADR merge; `npm run quality:check` etkilenmedi (kod yok).
- **Self-check:** `npm run quality:check`
- **STOP:** ADR yazıldı, alan imzaları sabit.

---

### FAZ 1 — Şema zenginleştirme (additive, geriye uyumlu)
- **Amaç:** Registry'ye deterministik ulaşım + linkleme için gereken alanları eklemek; kırmadan.
- **Kapsam:**
  - `tests/contracts/known-bugs.js` şemasına OPSİYONEL alanlar:
    `env:{browser,envName,role,locale,commit}` · `precondition` · yapısal `repro:[{step,selector}]`
    (eski düz-string dizisi de kabul) · `firstFailingStep` · `evidence[].kind|runUrl|artifactPath`.
  - `tools/self-check-findings.mjs`: yeni alanları **doğrula ama zorunlu kılma** (mevcut 61 kayıt geçer).
  - `tools/generate-findings.mjs`: yeni alanlar VARSA render et (yoksa eskisi gibi).
- **Dokunulan dosyalar:** `tests/contracts/known-bugs.js`, `tools/self-check-findings.mjs`, `tools/generate-findings.mjs`, (gerekirse `docs/raporlar/findings.json` şeması).
- **DoD:** `npm run report:findings:check` yeşil; 0 mevcut kayıt değişmek zorunda değil; en az 1 örnek kayıt yeni alanlarla render oluyor.
- **Self-check:** `npm run report:findings:check && npm run quality:check`
- **STOP:** Şema + validator + renderer yeni alanları destekliyor; eski veri bozulmadı.

---

### FAZ 2 — Güvenli görsel yakalama (maskeli + işaretli konum)
- **Amaç:** P-01/P-06'nın çekirdeği — her forensic koşumda **maskeli** tam-sayfa + **işaretli konum** görseli üretmek. (Bu "buga ulaşım/konum görseli" isteğinin tam karşılığı.)
- **Kapsam:**
  - `tools/report-bug.mjs` / `tools/forensic-lib.mjs`: forensic modda daima
    `safe-final-state.png` (zaten izinli) + yeni `location.png` üret. `location.png`:
    hatalı locator'ın `boundingBox()`'ı üstüne overlay kutu + `mask:` ile PII maskeleme.
  - `tools/forensic-lib.mjs` `UPLOAD_ALLOWLIST`'e `location.png` ekle (ADR-0009 uzantısı, ADR'de gerekçeli).
  - Secret-scan/sanitize kapısı aynen çalışsın (görseller bu kapıdan geçer).
- **Dokunulan dosyalar:** `tools/report-bug.mjs`, `tools/forensic-lib.mjs`, `tools/artifact-policy.mjs` (allowlist tutarlılığı), ilgili guard testi.
- **DoD:** `npm run report:bug -- <ID>` → `test-results/findings/<ID>/upload/` içinde maskeli `safe-final-state.png` + `location.png`; secret-scan geçiyor; trace hâlâ local-only.
- **Self-check:** `npm run report:bug -- B4` (veya açık bir id) + `npm run quality:check`
- **STOP:** İki maskeli görsel güvenli bundle'da; politika testleri yeşil.

---

### FAZ 3 — Otomatik kanıt lane'i (manuel → her koşum)
- **Amaç:** P-05/P-06 — kanıtı tek-tek manuel dispatch olmaktan çıkarıp açık guard'lı bulgular için otomatik + linkli üretmek.
- **Kapsam:**
  - `.github/workflows/`: yeni lane — açık `knownBugGuard` bulgularını forensic modda
    **bounded** (bulgu başına tek test, retry storm yok) koşar; bundle'ları upload eder.
  - `evidence-index.json` (COMMIT'lenir): her bulgu → `{artifactPath, runUrl, expiry, capturedAt}`.
    Registry root-cause'una DOKUNMAZ; yalnız link üretir.
  - Tetik: **nightly / manuel** (PR başına DEĞİL) → tek-hesap/prod yükü artmaz.
- **Dokunulan dosyalar:** `.github/workflows/*.yml`, yeni `tools/generate-evidence-index.mjs`, `tools/forensic-lib.mjs`.
- **DoD:** Lane N açık bulgu için bundle + `evidence-index.json` üretiyor; retention hizalı (≥30g) ve `expiry` kayıtlı; deterministik (aynı girdi = aynı index).
- **Self-check:** lane'i bir kez dispatch et; `evidence-index.json` linkleri geçerli.
- **Guardrail:** Auth kırılganlığı (tek prod hesabı) burada yük yaratabilir → lane serileştirilmeli / düşük worker; gerekirse auth-stability PR'larına (bkz. #103) bağımlılık NOT'u ADR'ye.
- **STOP:** Otomatik lane açık bulgular için kanıt + index üretiyor.

---

### FAZ 4 — Raporda linkleme + gömme
- **Amaç:** P-03/P-04/P-08 — "Kanıt: yok" yerine gömülü maskeli görsel + tıklanabilir link.
- **Kapsam:**
  - `tools/generate-findings.mjs` + `tools/unified-report-lib.mjs` + `tools/render-report-pdf.mjs`:
    `evidence-index.json`'dan maskeli görseli göm (data-uri/relative) + "CI koşumu" (runUrl) +
    "trace: `npx playwright show-trace <path>`" ipucu bas.
  - "Kanıt: yok" yalnız gerçekten kanıt yoksa çıksın.
- **Dokunulan dosyalar:** `tools/generate-findings.mjs`, `tools/unified-report-lib.mjs`, `tools/render-report-pdf.mjs`.
- **DoD:** BULGULAR.md/HTML, kanıtı olan her açık bulguda görsel + link gösteriyor; PII kapısı aşılmadan (görsel Faz 2'de maskeli).
- **Self-check:** `npm run report:findings && npm run report:all` çıktısını gözle doğrula; `npm run quality:check`.
- **STOP:** Rapor tıklanabilir/gömülü kanıt gösteriyor.

---

### FAZ 5 — Provenance + governance + infra sınıflandırma (iyileştirme)
- **Amaç:** P-09/P-10/P-11 — rapora güven.
- **Kapsam:**
  - Provenance: commit SHA + runUrl'i rapor başlıklarına enjekte et (`PROJECT-STATUS.md:7` `commit —` dolsun).
  - Governance: yeni/değişen bulguda `owner` + `lastVerified` zorunlu; `expiry` uyarısı self-check'te.
  - Infra sınıflandırıcı: 5xx (502/503/504) + auth-cascade fail'lerini "infra" etiketle
    (gerçek product bug ile karışmasın). Kanıt deseni: 503 sayfası → görsel `~1264x77`, `auth.setup` çöküşü.
- **Dokunulan dosyalar:** `tools/generate-project-status.mjs`, `tools/self-check-findings.mjs`, `tools/runtime-report-lib.mjs` / classifier.
- **DoD:** Rapor commit SHA + runUrl gösteriyor; ownerless/unverified YENİ kayıt self-check'i kırıyor; infra fail'ler ayrı etiketli.
- **Self-check:** `npm run quality:check && npm run report:all`.
- **STOP:** Provenance + governance + infra etiketi aktif.

---

## 5. Genel guardrail'ler (her fazda geçerli)
- Başlarken oku: bu plan + `docs/adr/0026-evidence-pipeline.md` + `AGENTS.md`'nin ilgili
  bölümü (artifact/PII/mutation politikaları) + dokunacağın dosyalar.
- Production'a yazma; mutation guard'ını atlatma; `rootCause` uydurma.
- Görseller **maskeli** olmadan hiçbir yere gömülmez/upload edilmez.
- Bitişte: `npm run quality:check` + fazın kendi self-check komutu yeşil olmadan PR açma.
- Her faz TEK PR; kapsam dışına taşma; bir sonraki fazın işini yapma (loop önleme).

## 6. Riskler
- **Tek prod hesabı / staging yok:** Faz 3 lane'i yük yaratabilir → nightly/manuel + serileştir.
- **PII:** Görsel maskeleme yanlışsa sızıntı → secret-scan kapısı + `mask:` zorunlu; Faz 2 DoD'si bunu doğrular.
- **Retention:** Artifact 14–30g; kalıcı iz için `evidence-index.json` linkli kalır, görsel özet commit edilebilir.
