# Bug Raporlama Standardı (BULGU doktrini)

Bu belge, bir kırmızı testin **iyi yapılandırılmış, yeniden-üretilebilir bir bulguya** nasıl
dönüştüğünü ve bu sürecin nasıl **otomatikleştirildiğini** tanımlar. Tek gerçeklik kaynağı
registry `tests/contracts/known-bugs.js`'tir; **otomasyon registry'yi ASLA yazmaz, kök-neden
UYDURMAZ, bug kapatmaz** — yalnız gözlemler ve öneri üretir.

## 1. İyi bir bug raporunun anatomisi

Her bulgu üç soruya net cevap vermeli:

| Soru | Nasıl karşılanır | Şema alanı / mekanizma |
|---|---|---|
| **NEREDE gözükür?** | Maskeli ekran görüntüsü + hatalı locator'ın kutulanmış hâli | `evidence[]` (screenshot) + `location.png` (`markForensicTarget`) |
| **NASIL ulaşılır?** | Rota + yapısal adımlar + ön koşul + koşum bağlamı | `route`, `repro:[{step,selector}]`, `firstFailingStep`, `precondition`, `env` |
| **NE bozuk?** | Kırılan locator + beklenen/gözlenen + teknik kanıt | `expected`, `actual`, `technicalEvidence`; `rootCause` YALNIZ kanıtlıysa |

Doktrin: bilinmeyen alan `null`/`[]` kalır — **asla uydurulmaz**. `rootCause` yalnız kaynak-kod
/ geliştirici incelemesiyle KANITLANMIŞSA dolar. Otomatik/forensik çıktı yalnız
`possibleCauses` / `technicalEvidence` / `rootCauseCandidate` üretebilir.

### "NEREDE" için zorunluluk: `markForensicTarget`
Görsel/layout/a11y bulgularında, guard testi hatalı locator'ı `markForensicTarget(locator, {label})`
ile işaretlemeli. Aksi hâlde forensik koşu `location.png` üretemez (`location.SKIPPED.txt` bırakır)
ve "NEREDE" kanıtı eksik kalır. Bu, kod-review'da aranır.

## 2. Bulgu yaşam döngüsü

```
open ──(report:bug)──▶ evidence ──(report:reconcile)──▶ fixed-candidate
  │  knownBugGuard(test,id) → test.fail() (beklenen-başarısızlık; CI yeşil)
  │                                              │
  │                                   (report:verify: ≥3 koşu / ≥2 gün)
  ▼                                              ▼
KNOWN-BUG-GREEN (dokümante, davranıyor)   verified-fixed-proposal
                                                 │
                                          closed ─┘  ← YALNIZ insan-onaylı ayrı PR (B8 modeli)
```

- **open**: registry kaydı + `knownBugGuard(test,id)`. `test.fail()` ile açık bug beklenen-başarısızlık → CI yeşil kalır.
- **evidence**: `npm run report:bug -- <id>` → `test-results/findings/<id>/` maskeli kanıt paketi.
- **fixed-candidate**: `npm run report:reconcile` → beklenmedik geçen guard'lar (öneri; registry değişmez).
- **verified-fixed-proposal**: `npm run report:verify -- <id>` → ≥3 bağımsız koşu / ≥2 gün attestation.
- **closed**: yalnız insan onaylı PR. Hiçbir otomasyon kapatmaz.

## 3. Otomatik triyaj + taslak üretimi — `report:draft`

Kırmızı testi elle sınıflamak hataya açıktır (bir `test.fail()` guard'ının **beklenen-başarısızlığı**
yeni bir fail sanılabilir, ya da **beklenmedik geçişi** düzelme yerine fail sanılabilir).
`npm run report:draft` bunu deterministik yapar:

```bash
npm run report:draft            # test-results/report.json
npm run report:draft -- path/to/report.json
```

Playwright JSON raporunu okur, her non-green testi sınıflar ve **yalnız gerçek yeni kırmızılar**
için taslak bulgu iskeleti yazar:

| Sınıf | Anlam | Aksiyon |
|---|---|---|
| **REAL-RED** | guard'sız gerçek kırmızı (`unexpected` + guard yok) | `test-results/findings/_drafts/drafts/<slug>.json` taslağı üretilir |
| **FIXED-CANDIDATE** | `knownBugGuard` beklenmedik geçti | `report:reconcile`'a yönlendirilir |
| **FLAKY** | retry-pass / attempt-1 timeout | taslaklanmaz (ortamsal) |
| **KNOWN-BUG-GREEN** | beklenen-başarısızlık = yeşil | aksiyon yok |

Taslak, `known-bugs.js` şemasını birebir yansıtır. **AUTO** (gözlemlenen): `test{file,title}`,
`area`, `route` (best-effort — DOĞRULA), `expected`/`actual` (assertion'dan parse; eşleşmezse `null`),
`env`, `technicalEvidence` (assertion ilk satırı + diagnostics notu), `evidence[]` (screenshot/trace/
diagnostics yolları, `piiReviewed:false`). **SABİT doktrin**: `possibleCauses:[]`,
`rootCauseCandidate:null`, `rootCause:null`. **TODO (insan)**: `_todo` listesindeki alanlar
(title, severity, route doğrulama, `repro[{step,selector}]`, `markForensicTarget` kancası, owner…).

Taslak = **öneri**. `_todo` tamamlanıp incelenmeden `known-bugs.js`'e EKLENMEZ. Registry değişmez;
`report:draft` yalnız `test-results/findings/_drafts/` altına yazar (gitignored).

### Kırmızı → kayıtlı bug iş akışı
1. `npm run report:draft` → taslak üret.
2. Taslağı incele; `_todo`'yu tamamla (severity, repro, markForensicTarget, owner). `_todo` alanını sil.
3. `tests/contracts/known-bugs.js`'e kaydı ekle + guard testine `knownBugGuard(test, '<id>')` koy (+ görsel bulguda `markForensicTarget`).
4. `npm run report:findings` (raporları üret) → `npm run quality:findings` (şema + linkage).
5. `npm run report:bug -- <id>` → forensik kanıt paketi.

### Güvenceler (`quality:draft`)
`tools/self-check-draft-finding.mjs` her koşuda kanıtlar: sınıflandırma tablosu, yalnız REAL-RED
taslaklanır, önek-toleranslı dedup, doktrin alanları sabit, `parseAssertion` honest-fallback,
determinizm (bayt-aynı çıktı + stabil slug), **registry'ye YAZMAZ** (statik tarama),
`Date.now()`/`Math.random()`/argümansız `new Date()` YOK, `prepareDraftBundle` allowlist/secret/
local-only kapısı. `quality:check` zincirine bağlıdır.

## 4. CI nightly (uygulanmaya-hazır reçete — review ile land edilecek)

On-demand akış canlıdır. Nightly CI otomasyonu, güvenli artifact hattına (`prepare-ci-artifact.mjs`
+ `artifact-policy.mjs`) bir lane eklemeyi gerektirdiğinden — ve bu required-check gate'lerine
(`quality:ci-workflow`, `quality:artifact-allowlist`, `quality:audit-*`) dokunduğundan — ayrı,
gözden-geçirilmiş bir PR'da land edilmelidir. Reçete:

1. **Lane kaydı** (`tools/artifact-policy.mjs`): `LANES`'e `known-bug-draft` ekle; `LANE_POLICY`'ye
   `mode:'prepared'`, `secureRoot: secure-upload/known-bug-draft`, `validatorId:'safe-summary@1'`,
   `allowedOutputs:['draft-summary.json','manifest.json']`, `screenshotPolicy:'deny'` girdisi ekle
   (reconcile/`evidence` lane'lerini örnek al).
2. **Ingester** (`tools/prepare-ci-artifact.mjs`): `known-bug-draft` için source-kind ekle —
   `test-results/findings/_drafts/draft-summary.json`'u şema + secret-scan ile kanonik yeniden-emit et
   (ham kopya değil). Taslak `drafts/*.json` gövdeleri sayfa metni içerebileceğinden yalnız özet
   yüklenir; detay local/forensik kalır.
3. **Job** (`.github/workflows/playwright.yml`) — `nightly-known-bug-reconcile` aynası:
   ```yaml
   nightly-draft-findings:
     name: Nightly draft findings (REAL-RED önerisi)
     needs: architecture
     if: github.event_name == 'schedule' || (github.event_name == 'workflow_dispatch' && inputs.suite == 'full')
     runs-on: ubuntu-latest
     timeout-minutes: 45
     env: { VOMENTA_EMAIL: ${{ secrets.VOMENTA_EMAIL }}, VOMENTA_PASSWORD: ${{ secrets.VOMENTA_PASSWORD }}, ALLOW_MUTATING_TESTS: 'false' }
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with: { node-version: 24, cache: npm }
       - run: npm ci
       - run: npx playwright install --with-deps chromium
       - name: Authed suite (JSON)
         run: mkdir -p test-results && (npx playwright test --project=chromium-authed --reporter=json > test-results/report.json || true)
       - name: Draft findings (REAL-RED; registry DEĞİŞMEZ)
         env: { DRAFT_RUN_URL: "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}" }
         run: npm run report:draft -- test-results/report.json
       - name: Registry unchanged guard
         run: git diff --exit-code -- tests/contracts/known-bugs.js
       - name: Prepare secure bundle
         id: prep_draft
         run: npm run report:artifact:prepare -- --lane known-bug-draft && echo "ready=true" >> "$GITHUB_OUTPUT"
       - name: Upload (yalnız hazırlanmış bundle)
         if: steps.prep_draft.outputs.ready == 'true'
         uses: actions/upload-artifact@v4
         with:
           name: draft-findings-${{ github.run_id }}
           path: test-results/secure-upload/known-bug-draft/
           if-no-files-found: error
           retention-days: 14
   ```
4. `npm run quality:check` yeşil olmalı (özellikle registry diff-guard + workflow allowlist).

## 5. İlgili komutlar

| Komut | Ne yapar |
|---|---|
| `npm run report:draft` | Kırmızı testleri triyaj eder, REAL-RED taslakları üretir (öneri) |
| `npm run report:reconcile` | Beklenmedik geçen guard'ları fixed-candidate olarak önerir |
| `npm run report:bug -- <id>` | Kayıtlı bulguyu forensik modda yeniden üretir + kanıt paketi |
| `npm run report:verify -- <id>` | Fixed-candidate doğrulama attestation'ı (≥3 koşu/≥2 gün) |
| `npm run report:findings` | Registry'den `findings.json` + `BULGULAR.md` üretir |
| `npm run quality:draft` / `quality:findings` | Taslak üreteci / registry şema + linkage guard'ları |
