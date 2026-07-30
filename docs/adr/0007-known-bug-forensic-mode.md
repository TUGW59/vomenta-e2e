# ADR-0007: Bilinen-bulgu forensik modu + güvenli artifact hattı + nightly fixed-candidate (WP-R3)

- Durum: Kabul edildi
- Tarih: 2026-07-30

## Bağlam

WP-R1 bulgu registry'sini (`tests/contracts/known-bugs.js`) ve `knownBugGuard`
beklenen-başarısızlık kontratını, WP-R2 ise deterministik raporları getirdi. Açık
bir bulgu normal koşuda "beklenen başarısızlık" olarak yeşil kalır — bu iyidir ama
**kök-neden incelemesini engeller**: Playwright, test `test.fail()` ile işaretliyken
gerçek assertion failure/trace/screenshot ÜRETMEZ. Ayrıca bulguların çoğu düzeldiğinde
bunu yakalayacak bir mekanizma yoktu.

İhtiyaç: (a) tek bir bulgu için gerçek başarısızlığı güvenli biçimde yakalayan bir
forensik koşu, (b) bu kanıtları production'dan sızıntı olmadan CI artifact'ine taşıyan
kapı, (c) "artık geçiyor" durumlarını registry'ye dokunmadan öneri olarak raporlayan
nightly akış. Hepsi **production read-only** ve **registry değişmez** kısıtları altında.

## Karar

### 1. Forensik mod (`FORENSIC_BUG`)

`knownBugGuard(test, id)` yalnızca `FORENSIC_BUG === id` iken `test.fail()`'i ATLAR
(bkz. `tests/helpers.js` + saf `forensicModeActive`, `tests/fixtures/forensic.js`). Env
YALNIZ helper/tool/fixture katmanında okunur; spec'lere `process.env` dağıtılmaz. Aynı
anda tek bulgu; CLI id ile `FORENSIC_BUG` çelişirse hard failure. Bilinmeyen id her
zaman (forensik modda dahi) hata verir.

### 2. Tek-bug komutu — `npm run report:bug -- <ID>`

`tools/report-bug.mjs`: registry'den testi çözer, YALNIZ o testi `--grep` ile,
`chromium-authed` projesinde, `FORENSIC_BUG=<ID>` ile koşar. Çıktı yalnız
`test-results/findings/<ID>/`. Mutation spec'ini ve `ALLOW_MUTATING_TESTS=true`'yu
reddeder. Registry parmak izini (sha256) koşu öncesi/sonrası doğrular.

`candidate-update.json` (yalnız **inceleme önerisi**): `result`
(`reproduced|unexpected-pass|inconclusive|infra-error`), yalnız deterministik
`technicalEvidence` (status/duration/project/redakte assertion mesajı/üretilen kanıt).
`possibleCauses` varsayılan `[]`, `rootCauseCandidate` varsayılan `null` —
**otomasyon kök-neden UYDURMAZ**; registry'ye yazmaz, status değiştirmez, bug kapatmaz.

### 3. Güvenli kanıt yakalama (minimal fixture entegrasyonu)

`tests/fixtures/test.js` içine, YALNIZ `FORENSIC_BUG` set iken etkin olan auto-fixture
eklendi (normal koşuda tamamen atıl — dinleyici/dosya yazımı yok). Etkinken:

- **`network-summary.json`**: yalnız method + normalize path (query düşürülür,
  sayısal/uuid/hex segment → `:id`) + status + süre + tip + hata kodu. Header/cookie/
  token/body **asla** yazılmaz; JSON yazımdan önce `findSecrets` ile taranır, sızıntı
  varsa dosya YAZILMAZ (SKIPPED notu bırakılır).
- **`safe-final-state.png`**: header kimlik yüzeyleri (`userMenu`, presence/kullanıcı adı)
  capture anında maskeli. Maske/görüntü hatası → güvensiz görüntü YAZILMAZ.

### 4. Upload güvenlik kapısı — `npm run report:artifact -- <ID>`

`tools/prepare-forensic-artifact.mjs` + `prepareUploadBundle`: `<ID>/upload/` altına
YALNIZ tam-ad allowlist'indeki dosyalar (`candidate-update.json`, `network-summary.json`,
`metadata.json`, `safe-final-state.png`) kopyalanır. JSON `findSecrets`'ten, PNG imza
kontrolünden geçer. Allowlist-dışı beklenmeyen dosya / sızıntılı JSON / geçersiz PNG →
non-zero exit → CI upload step'i çalışmaz. Ham `test-results/` **asla** yüklenmez.

### 5. Trace ve video politikası (bilinçli, konservatif)

- **Trace lokal-only:** `scanTraceZip` trace.zip'i açıp metin-çözülebilir girdileri
  `findSecrets` ile tarar (negatif self-check seed'li secret'ı yakaladığını kanıtlar).
  Ancak trace'in binary/sıkıştırılmış kaynak girdileri text-sanitizer ile TAM
  kanıtlanamaz → trace **CI upload allowlist'ine ALINMAZ**; yalnız lokal üretilir/taranır.
- **Video kapalı:** `FORENSIC_BUG` set iken `playwright.config` `video:'off'`. Video
  sonradan güvenilir temizlenemez.

### 6. Nightly fixed-candidate — `npm run report:reconcile -- <results.json>`

`tools/reconcile-known-bugs.mjs` + saf `reconcile`: `guard:'knownBugGuard'` (beklenen-
başarısızlık) bulgularından gerçek status'ü `passed` olanları (unexpected-pass) bulur ve
YALNIZ `fixed-candidate` önerisi (`test-results/findings/fixed-candidates.json`) üretir.
`permanent`/`fixme` ve normal beklenen-başarısızlıklar aday değildir. **Registry değişmez,
status güncellenmez, bug kapanmaz, guard kaldırılmaz.** Tek geçiş "verified fixed"
DEĞİLDİR — bu yalnız WP-R4 (Bug Fix Verification) girdisidir; WP-R4 bu pakette uygulanmaz.

### 7. Sert kapı — `quality:forensic`

`tools/self-check-forensic.mjs` (`quality:check` zincirinde) tüm kontratları negatif
self-check'lerle her koşuda kanıtlar: bilinmeyen id, CLI/env uyuşmazlığı, forensik
`test.fail` atlama, upload allowlist + JSON/PNG sanitizer, trace secret taraması,
trace/video lokal-only, unexpected-pass→fixed-candidate, normal/permanent→üretmez,
registry değişmezliği (fingerprint + statik kaynak taraması).

### CI

`workflow_dispatch` opsiyonel `finding_id` girdisi → `known-bug-forensic` job'ı YALNIZ
`finding_id` doluyken çalışır: forensik koşu → registry-değişmedi kapısı → YALNIZ
`<ID>/upload/` allowlist bundle'ı yüklenir. `schedule` → `nightly-known-bug-reconcile`:
authed suite JSON raporundan reconcile → yalnız `fixed-candidates.json` yüklenir.

## Sonuçlar

- Açık bulgular normal koşuda yeşil (beklenen-başarısızlık) kalır; forensik koşuda gerçek
  kanıt üretilir — kontrat gevşetilmeden.
- Production'dan sızıntı riski: JSON sanitizer + allowlist + trace/video upload dışı ile
  katmanlı olarak kapatıldı; kanıt yakalanamazsa güvensiz dosya üretilmez.
- Registry tek gerçeklik kaynağı olarak korunur; forensik/nightly yalnız öneri üretir.

### Bilinçli sınırlar

- Ekran görüntüsü yalnız **header kimlik yüzeyleri** maskelenir; sayfa-içi serbest PII
  otomatik maskelenmez (safeScreenshot maske listesi kadar günceldir). Piksel taraması
  yapılamaz — PNG güvenliği capture-anı maskesine dayanır.
- Trace binary kaynaklarının güvenliği tam kanıtlanamadığı için trace CI'a yüklenmez
  (lokal-only). Tam trace-upload güvenliği ayrı bir çalışma paketi gerektirir.
- `report:bug` canlı authed koşusu bu oturumda üretim kimlik bilgisi olmadan uçtan uca
  doğrulanmadı; araç yolu (parse/sınıflandırma/kanıt üretimi/güvenlik kapısı) kimliksiz
  ortamda (`inconclusive`) ve negatif self-check'lerle doğrulandı.
