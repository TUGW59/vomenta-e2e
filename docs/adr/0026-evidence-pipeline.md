# ADR-0026 — Kanıt hattı (evidence pipeline) mimari sözleşmesi

- Durum: Kabul edildi (WP-EVIDENCE / EVIDENCE-PIPELINE FAZ 0 — kilit/sözleşme)
- Bağlam: ADR-0006 (artifact secret sanitizer) + ADR-0007 (known-bug forensic mode, trace local-only) + ADR-0009 (güvenli CI artifact allowlist) + `docs/EVIDENCE-PIPELINE-PLAN.md`
- Tarih: 2026-08-04

## Bağlam

Bug/test raporlama hattında iki kol birbirine bağlı değil:

- Runtime kanıt (trace/screenshot/video + Playwright HTML raporu) üretiliyor ama
  **atılıyor** (`playwright.config.js` + `.gitignore /playwright-report/`).
- Registry (`tests/contracts/known-bugs.js`) elle ve **kanıtsız** yazılıyor; 61
  bulgunun 59'unda `evidence[]` boş, hiçbirinde run/trace/artifact **linki** yok.
- Rapor bu yüzden "Kanıt: yok" diyor.

Kritik içgörü: güvenli görsel yolu (`safe-final-state.png`) hatta **zaten mevcut ve
izinli** (`forensic-lib.mjs` `UPLOAD_ALLOWLIST`); sorun onun manuel + linksiz +
tek-seferlik olması. Hat sıfırdan icat edilmeyecek; bu güvenli yol
otomatikleştirilecek, zenginleştirilecek ve rapora bağlanacak.

`docs/EVIDENCE-PIPELINE-PLAN.md` bu işi kesinlikle **lineer** (0→1→2→3→4→5,
geri-kenar yok) fazlara böler. Her faz ayrı sohbet + ayrı PR. FAZ 0'ın tek amacı:
sonraki tüm fazların referans alacağı **tek sözleşmeyi kilitlemek** → yeniden-tartışma
ve loop olmaması. Bu ADR o sözleşmedir. **FAZ 0 yalnız dokümandır; kod davranışı
değişmez.**

## Karar

Aşağıdaki altı madde sonraki fazlar için **bağlayıcı ve sabit**tir. Alan adları bu
ADR ile `docs/EVIDENCE-PIPELINE-PLAN.md` arasında birebir eşleşir; bir faz bu
adları değiştiremez, yalnız uygular.

### 1. Güvenli kanıt tier'ının içeriği (sabit)

Her forensic koşumda üretilen güvenli (maskeli, PII-temiz) bundle, tam olarak şu
dosyalardan oluşur. CI'a **yalnız** allowlist'teki dosyalar gider (ADR-0009);
`trace.zip` üretilse bile **local-only** kalır.

| Dosya | İçerik | CI upload | Durum |
|---|---|---|---|
| `safe-final-state.png` | Tam sayfa, capture anında **maskeli** | ✅ allowlist | Var (izinli) |
| `location.png` | Hatalı locator'ın `boundingBox()` üstüne overlay **kutu**, PII **maskeli** | ✅ allowlist (FAZ 2'de eklenir) | FAZ 2 |
| `network-summary.json` | Yalnız `method` + normalize `path` + `status` + süre + tip + hata kodu; header/cookie/token/body **YOK** | ✅ allowlist | Var |
| `metadata.json` | `env`, `browser`, `role`, `locale`, `commit`, `runUrl` (+ mevcut `findingId`/`test`/`guard`/`result`/`registryFingerprint`) | ✅ allowlist | Var (FAZ'larda zenginleşir) |
| `candidate-update.json` | Yalnız **insan-inceleme önerisi**; registry'ye otomatik yazılmaz | ✅ allowlist | Var |
| `trace.zip` | Playwright trace — kök-neden ipucu | ❌ **LOCAL-ONLY** | Var |

- `location.png` FAZ 2'nin çekirdeğidir ("buga ulaşım/konum görseli"): hatalı
  locator'ın kutusu işaretlenir. `UPLOAD_ALLOWLIST`'e eklenmesi ADR-0009'un
  gerekçeli uzantısıdır (yeni ham upload türü değil; maskeli, sabit-adlı tek PNG).
- Video production forensikte **kapalı** (`FORENSIC_BUG` set iken `video:'off'`);
  bu ADR bunu gevşetmez.

### 2. Maskeleme kuralı (değişmez)

- Görseller `artifacts.safeScreenshot(name, { mask: [...] })` ile alınır; kimlik
  taşıyan yüzeylerde (header kullanıcı menüsü, Settings/Profile) PII locator'ları
  `mask`'e verilir. `location.png` overlay kutusu maskeyi **açmaz**, üstüne çizer.
- Metin/JSON kanıtı `tests/fixtures/sanitize.js` (`redactText`/`redactUrl`/
  `redactHeaders`/`redactDeep` + tarayıcı `findSecrets`) ile maskelenir. Yeni
  maskeleme mantığı **yalnız buraya** eklenir.
- **Ham `testInfo.attach(...)` yasak** (ADR-0006 / WP-01); `artifacts.safeAttach`
  kullanılır.
- **Sert kapı:** secret-scan / sanitize kapısı (ADR-0009 + `quality:artifact-safety`
  + `quality:forensic`) her fazda geçerli. **Maskeli olmayan hiçbir görsel/JSON
  hiçbir yere gömülmez veya upload edilmez.** Sızıntılı JSON / geçersiz PNG /
  allowlist-dışı dosya → non-zero exit → upload step çalışmaz.
- Sınır: serbest-form kişi adı otomatik maskelenmez (aşırı-maskeleme riski);
  isim PII'si ekran maskesi veya alan-bazlı redaksiyonla korunur (ADR-0006).

### 3. FAZ 1 şema imzası (additive, geriye uyumlu — sabit)

`tests/contracts/known-bugs.js` kayıtlarına **yalnızca opsiyonel** alanlar eklenir.
Mevcut 61 kayıt değişmeden geçerli kalır; hiçbir faz zorunlu backfill dayatmaz.
Bilinmeyen alan `null`/`[]` bırakılır, **ASLA uydurulmaz**.

Eklenen opsiyonel alanlar:

```
env            { browser, envName, role, locale, commit }   // hepsi opsiyonel
precondition   string | null
repro          Array<{ step, selector }>   // YAPISAL biçim; eski düz string[] de KABUL
firstFailingStep  number | string | null   // repro içindeki ilk kırılan adım
evidence[]     mevcut { path, source, piiReviewed }
               + opsiyonel { kind, runUrl, artifactPath }
```

- `evidence[]` mevcut şekli (`{ path, source, piiReviewed }`) korunur; üç yeni
  opsiyonel alt-alan eklenir: `kind` (ör. `location`/`final-state`/`network`),
  `runUrl`, `artifactPath`.
- `repro` hem yapısal `[{step,selector}]` hem eski `string[]` biçimini kabul eder
  (renderer/validator ikisini de tanır).
- FAZ 1 sorumluluğu: `tools/self-check-findings.mjs` yeni alanları **doğrular ama
  zorunlu kılmaz**; `tools/generate-findings.mjs` yeni alanlar **varsa** render eder
  (yoksa eskisi gibi). En az 1 örnek kayıt yeni alanlarla render olur.

### 4. `evidence-index.json` sözleşmesi (sabit)

FAZ 3'te üretilen ve **COMMIT'lenen** köprü dosyası. Registry ile kanıt bundle'ı
arasındaki tek link kaynağıdır.

- **Konum:** `docs/raporlar/evidence-index.json` (committed).
- **Kayıt (bulgu başına):**

  ```
  {
    "<findingId>": {
      "artifactPath": string,   // güvenli bundle'daki maskeli görsel/JSON yolu (relative)
      "runUrl":       string,   // CI koşum linki (provenance)
      "expiry":       string,   // ISO — artifact retention son kullanma
      "capturedAt":   string    // ISO — kanıtın yakalandığı an (CI env'den)
    }
  }
  ```

- **Değişmezler:**
  - **Registry root-cause'una DOKUNMAZ.** Yalnız link üretir; `rootCause` /
    `possibleCauses` / `rootCauseCandidate` bu dosyadan **etkilenmez**.
  - **Deterministik:** aynı girdi = aynı index. `capturedAt`/`runUrl` gibi zaman/koşum
    alanları CI ortamından **enjekte** edilir; generator `Date.now()`/rastgelelik
    kullanmaz (bkz. madde 5).
  - Additive: index'te olmayan bulgu, raporda "Kanıt: yok" olarak dürüstçe kalır.

### 5. Retention + provenance (sabit)

- **Retention:** kanıt artifact'i ≥30 gün tutulur (mevcut 14g lane'i FAZ 3'te
  hizalanır); `evidence-index.json` kaydı `expiry`'yi taşır. Artifact süresi dolsa
  bile **kalıcı iz** commit'li `evidence-index.json` + maskeli görsel özetiyle kalır.
- **Provenance:** `commit` (SHA) + `runUrl` rapor başlıklarına/kayıtlarına **CI
  ortamından enjekte** edilir (`PROJECT-STATUS.md` `commit —` FAZ 5'te dolar). Rapor
  çıktısı **`Date.now()`/rastgelelik içermez** (determinizm ilkesi); zaman/koşum
  bilgisi dışarıdan gelir.
- **Governance (FAZ 5):** yeni/değişen bulguda `owner` + `lastVerified` zorunlu;
  `expiry` uyarısı self-check'te. Bu ADR yalnız imzayı sabitler; zorunluluk FAZ 5'te.

### 6. Trace local-only kalır (değişmez — ADR-0007 aynen)

- `trace.zip` (ve `*.webm`/`*.mp4`) `LOCAL_ONLY_PATTERNS` altında kalır; `scanTraceZip`
  ile taranır ama **CI'a YÜKLENMEZ**. Binary/sıkıştırılmış kaynaklar text-sanitizer
  ile tam kanıtlanamaz → politika **gevşetilmez**.
- Rapor trace'i **gömmez**; yalnız local ipucu basar:
  `npx playwright show-trace <path>` (FAZ 4).

## Değişmez tasarım ilkeleri (her fazda geçerli)

1. **Güvenlik korunur, gevşetilmez.** WP-SEC-B / ADR-0009 sanitize kapısı + secret-scan
   her fazda geçerli; yeni görseller maskeli üretilir; trace CI'a yüklenmez (ADR-0007).
2. **Additive & geriye uyumlu.** Şema alanları opsiyonel; mevcut 61 kayıt değişmeden
   geçerli; zorunlu backfill yok.
3. **Production read-only.** Hiçbir faz production'a yazmaz; mutation guard atlatılmaz
   (AGENTS.md temel ilke 3 + ADR-0004).
4. **Kök-neden UYDURULMAZ.** Otomasyon yalnız `evidence` / `possibleCauses` /
   `technicalEvidence` / `rootCauseCandidate` üretebilir; `rootCause` yalnız insan
   incelemesiyle dolar (ADR-0007 kuralı korunur).
5. **Döngüye girmeme:** her faz = 1 PR, kesin DoD, deterministik self-check, bounded CI
   (bulgu başına tek test, retry storm yok). Fazlar arası geri-kenar yok.
6. **Determinizm:** rapor/index çıktısı `Date.now()`/rastgelelik içermez; provenance
   CI env'den enjekte edilir.

## Bu ADR'nin SINIRLARI (yapılmayanlar)

- **Kod yok.** FAZ 0 yalnız `docs/adr/` + `docs/EVIDENCE-PIPELINE-PLAN.md`
  dokümanlarına dokunur; `known-bugs.js`, `forensic-lib.mjs`, workflow'lar,
  generator'lar **değişmez** (onlar FAZ 1-5).
- `location.png` capture, otomatik lane, index üretimi, raporda gömme ve
  governance zorunluluğu bu ADR'de **tasarlanır ama uygulanmaz**.
- ADR mevcut allowlist'i (ADR-0009) veya trace politikasını (ADR-0007) **şu anda**
  değiştirmez; FAZ 2 `location.png`'yi gerekçeli olarak `UPLOAD_ALLOWLIST`'e ekler.

## Bağımlılık notu (risk)

FAZ 3 otomatik lane'i, tek prod hesabı / staging yokluğu nedeniyle auth yükü
yaratabilir → lane **nightly/manuel** (PR başına DEĞİL), serileştirilmiş / düşük
worker koşar. Gerekirse auth-stability çalışmasına (bkz. #103) bağımlılık burada
kayıtlıdır. Bu, `docs/EVIDENCE-PIPELINE-PLAN.md` §6 riskleriyle hizalıdır.

## Sonuç

- Güvenli kanıt tier içeriği, maskeleme kuralı, FAZ 1 şema imzası,
  `evidence-index.json` sözleşmesi, retention/provenance ve trace'in local-only
  kalması **tek sözleşmede** kilitlendi.
- Alan adları ADR ↔ plan arasında birebir sabit; sonraki fazlar tartışmadan uygular.
- Kod davranışı değişmedi; `npm run quality:check` etkilenmez (DoD).
