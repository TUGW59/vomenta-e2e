# Veri Değiştiren (Mutation) Testler — Uygulama Planı

> **Bu dosya kendi kendine yeter.** Yeni bir sohbete yalnızca bu dosya verildiğinde
> çalışma kaldığı yerden devam edebilir. Tüm envanter, kararlar, faz sıraları ve
> başlangıç promptları buradadır. Fazlar repoyu **yeniden taramaz**; §5 ve §9'daki
> doğrulanmış envanteri girdi olarak kullanır.

- **Repo:** `TUGW59/vomenta-e2e` (Playwright E2E paketi)
- **Plan durumu:** ONAY BEKLİYOR — uygulamaya geçilmedi.
- **Hazırlayan:** Test otomasyonu analizi (dosyalardan doğrulanmış; varsayım yok)
- **Tarih bağlamı:** 2026-08-06

---

## 1. Amaç

Vomenta uygulamasındaki **verileri gerçekten değiştiren** E2E testlerini (kayıt
oluştur/güncelle/sil, form gönder, ayar/rol/yetki değiştir, kampanya/workflow başlat,
API üzerinden yazma) **bulunabilir, çalıştırılabilir, güvenli, dokümante ve
geliştirilebilir** tek bir test hattına dönüştürmek.

Bugünkü hedef; mevcut (zaten güçlü olan) güvenlik çekirdeğini **bozmadan**, şu
soruların cevabını net ve teknik olarak uygulanmış hâle getirmek:
- Bu testler **nerede**? Nasıl **isimlendirilir**?
- **Hangi komutla** yalnızca bunlar çalışır (list/ui/headed/debug/report)?
- **Hangi ortamda** çalışır ve production'a yazmaları teknik olarak neden imkânsız?
- **Yeni test** nasıl eklenir (şablon + rehber)?
- Sonuçlar **nerede** görülür (kaç bulundu/çalıştı/geçti/atlandı, cleanup durumu)?
- Read-only testlerden **nasıl ayrılır**?

## 2. Kapsam

- Veri değiştiren E2E testlerinin **envanteri ve sınıflandırması** (durable dosya).
- **Terminoloji ve isimlendirme standardının** netleştirilmesi (yeni etiket icat etmeden).
- Yalnızca mutation testlerini çalıştıran **komut yüzeyi** (`test:mutation:*`).
- **Yazım rehberi** + kopyala-çalıştır **şablon**.
- **README yönlendirmesi** ve "kod-mutasyon testi değildir" ayrımı.
- Güvenli, **manuel-tetiklenen CI hattı** iskeleti (`workflow_dispatch` + environment onayı).
- Sonuç **görünürlüğü** (mevcut reporter/artifact/orphan raporu ile).

## 3. Kapsam dışı

- **Klasik mutation testing** (Stryker vb. kod mutasyonu) — bu iş onunla ilgisizdir.
- `@mutation` etiketini yeni bir isme (`@mutating`/`@destructive` vb.) **yeniden
  adlandırmak** — gerekçesi §4'te; yapılmayacak.
- Read-only test mimarisini, discovery lane'ini veya rapor üreticilerini yeniden yazmak.
- Fixme testleri bugün production'a karşı yeşile çevirmek — **staging ortamı olmadan
  imkânsız** (§18, §23).
- İkinci bir raporlama sistemi kurmak — mevcut HTML/JSON/JUnit + `report:orphans` yeniden
  kullanılır (§16).

## 4. Terminoloji

**Karar: `@mutation` tek kanonik etiket olarak KALIR. Yeni etiket eklenmez.**

Doğrulanmış gerçekler (dosyalardan):
- `@mutation` bugün **tek** veri-değiştirme etiketi. `config/environment.js`,
  `playwright.config.js:59` (`grepInvert:/@mutation/`), self-check'ler, ADR-0004/0005,
  README, CONTRIBUTING, AGENTS.md, PR şablonu — hepsi bu etikete bağlı.
- Önerilen `@mutating`, `@destructive`, `@readonly`, `@staging-only`,
  `@requires-cleanup` etiketlerinin **hiçbiri** repoda mevcut değil (0 kullanım).
- `destructive` kelimesi yalnızca **düz metin / coverage-exclusion kategorisi** olarak
  var; etiket değil.

**Neden yeniden adlandırmıyoruz:** `@mutation`'ı değiştirmek ~50 spec + config +
self-check + ADR + doküman dokunuşu demektir; **sıfır işlevsel kazanç**, yüksek risk ve
"aynı işi yapan iki sistem" yasağının ihlali olur. Doğru çözüm etiket değil, **dosya
isimlendirme ve keşfedilebilirlik** düzeyindedir.

Standart sözlük (bu projede):

| Terim | Anlamı (bu repo) |
|---|---|
| **mutation / veri-değiştiren** | Kalıcı veri değiştiren E2E testi. **Kod-mutasyon testi DEĞİL.** |
| `@mutation` | Kanonik Playwright etiketi; tek veri-değiştirme işareti. |
| **read-only** | Yazma yapmayan test; production'a karşı güvenle koşar. |
| **staging-only** | Mutation testlerinin çalışabildiği tek ortam (guard zorlar). |
| **cleanup / rollback** | `testEntity.create`/`cleanup` ile mutasyon ÖNCESİ kaydedilen geri-alma. |
| **orphan-zero (0→1→0)** | Başlangıç 0 kayıt → create sonrası 1 → teardown sonrası 0. |
| **guard** | `mutationGuard` — ilk yazmadan önce ortam+tenant doğrulaması. |

Dosya isim standardı §10'da; **tek konvansiyon** `*-mutations.authed.spec.js`.

## 5. Mevcut durum (dosyalardan doğrulanmış)

**Güvenlik çekirdeği — üretim kalitesinde, dokunulmayacak:**
- `tests/fixtures/mutationGuard.js` → ilk yazmadan önce 6 kapı: `ALLOW_MUTATING_TESTS=true`,
  `TEST_ENV=staging`, production-dışı `BASE_URL`, `MUTATION_API_ORIGIN` eşleşmesi, geçerli
  `MUTATION_TENANT_ID` (UUID) + `MUTATION_TENANT_SLUG`, ve canlı `/api/v1/auth/me`
  yanıtıyla tenant kimlik eşleşmesi. Preflight sonucu test boyunca önbelleklenir.
- `tests/fixtures/testEntity.js` → `create()` yaşam döngüsü: kirli-başlangıç reddi,
  action ÖNCESİ rollback kaydı, create-sonrası baseline=1 doğrulaması, LIFO teardown,
  görünür orphan muhasebesi. `tests/fixtures/test.js` cleanup hatasını
  `KRİTİK ALTYAPI HATASI` olarak fırlatır + `cleanup-errors.json` ekler.
- `tests/data/factories.js` → `TEST_ENTITY_PREFIX = 'VOMENTA_E2E_'`, benzersiz suffix
  (paralel-güvenli isim üretimi).
- Statik kapı: `tools/self-check-mutation-safety.mjs` (guard/fixture/retry/ham-cleanup
  eksiklerini spec metninden yakalar).
- Config: `playwright.config.js:59` `grepInvert: /@mutation/` (allowMutations yoksa hepsini eler).
- ADR-0004 (staging-only guard), ADR-0005 (orphan-zero); ADR-0002 (prod yazma) **iptal**.

**Çalıştırma:**
- `npm run test:mutation` → `ALLOW_MUTATING_TESTS=true playwright test --project=chromium-authed --grep @mutation --retries=0 --workers=1`
- `npm run report:orphans` → `mutation-orphans.authed.spec.js` (salt-okunur baseline denetimi).
- **Eksik:** `:list`, `:ui`, `:headed`, `:debug`, `:report`, tek-dosya çalıştırma yok.

**CI:**
- İki workflow: `playwright.yml`, `readonly-audit.yml`. **Hiçbir job mutation koşmaz.**
  Her yerde `ALLOW_MUTATING_TESTS: 'false'`; `self-check-ci-workflow.mjs` /
  `self-check-audit-workflow.mjs` herhangi bir workflow `true` derse **fail eder**.
- `workflow_dispatch` var (ama mutation girdisi yok). **GitHub Environment yok.**
  Concurrency kontrolü diğer lane'lerde var.

**Dokümantasyon:**
- README mutation'ı özetler (nasıl koşulur + env değişkenleri + kurallar).
- **Adım-adım "mutation testi nasıl yazılır" rehberi YOK.** Bilgi README + AGENTS.md +
  CONTRIBUTING.md + ADR'ler + otomatik matrislerde dağınık. Kanonik kod sözleşmesi:
  `tests/contracts/mutation-lifecycle.js`.

**Ortam:**
- `.env.example` → `TEST_ENV=production`; staging mutation değişkenleri yorumda.
  **Bağlı bir staging tenant'ı YOK.** Bu, fixme selinin ve "hiçbir şey yeşil koşmuyor"
  durumunun **kök nedenidir.**

## 6. Tespit edilen problemler

| # | Problem | Kanıt | Etki |
|---|---|---|---|
| P1 | Envanter/sınıflandırma durable değil | Yalnız `mutation-lifecycle.js` + dağınık | Hangi test gerçek/parked/aktif belirsiz |
| P2 | İki dosya isim konvansiyonu | 33 `*-mutations.*` + 3 `*.mutation.*` | "Nerede/hangisi" tek bakışta belirsiz |
| P3 | Komut yüzeyi eksik | Yalnız `test:mutation`,`report:orphans` | UI/headed/debug/list/report/tek-dosya yok |
| P4 | Yazım rehberi + şablon yok | docs taraması | Yeni geliştirici körlemesine ekler |
| P5 | CI mutation hattı yok | iki workflow `false` | Manuel/onaylı güvenli koşum yolu yok |
| P6 | Sonuç görünürlüğü mutation'a özel değil | reporter genel | "kaç/hangi veri/cleanup" derlenmemiş |
| P7 | Staging bağlı değil | `.env.example` prod | 31/36 fixme; hiçbir mutation yeşil koşamaz |
| P8 | `@mutation`=yorum karışıklığı | 10 read-only dosyada yorumda | "Gizli mutation var mı?" yanılgısı |

**Not (P8):** 10 read-only dosyadaki `@mutation` **yalnızca yorumdur** (gerçek etiket/
guard/write yok — §9C). Taşınacak gizli test **yoktur**; yalnız dokümantasyon netliği sorunu.

## 7. Hedef mimari

**Yeni paralel mimari GEREKMİYOR.** Güvenlik çekirdeği kalır. Üstüne ince bir
"mutation lane" oturur — iki katman, farklı işler:

- **Playwright katmanı (organizasyon):** tek `@mutation` etiketi + tek dosya konvansiyonu
  (`*-mutations.authed.spec.js`) + tag-tabanlı `--grep` scriptleri. **Ayrı Playwright
  project'i veya ayrı config dosyası EKLENMEZ** — gerekçe aşağıda.
- **GitHub katmanı (güvenli yürütme):** ayrı `mutation.yml`, yalnız `workflow_dispatch`,
  GitHub Environment `staging` (onay), concurrency (tek koşum), `ALLOW_MUTATING_TESTS=true`
  YALNIZCA burada + `TEST_ENV=staging`.

**Neden ayrı project/config yok:** Mevcut `chromium-authed` + `--grep @mutation` +
`--retries=0 --workers=1` + spec içi `describe.configure({retries:0})` zaten izolasyonu
sağlıyor. Ayrı project config yüzeyini ve `self-check-ci-workflow` bakımını artırır,
kazanç yok. Minimal cerrahi ilke gereği script + etiket yeterli.

## 8. Güvenlik modeli

Zaten uygulanmış, korunacak katmanlar (defense-in-depth):
1. **Flag:** `ALLOW_MUTATING_TESTS=true` olmadan `grepInvert` tüm `@mutation`'ı eler.
2. **Ortam:** `assertMutationEnvironment` → `TEST_ENV=staging` + prod-dışı app/API origin.
3. **Tenant:** `assertMutationTenant` → `/auth/me` ile UUID+slug birebir eşleşme.
4. **Kimlik önceliği:** her spec ilk yazmadan önce `await mutationGuard(...)`.
5. **Yaşam döngüsü:** `testEntity.create` 0→1→0; rollback action'dan önce kayıtlı; LIFO.
6. **Görünür hata:** cleanup hatası testi `KRİTİK ALTYAPI HATASI` ile kırar.
7. **Statik kapı:** `self-check-mutation-safety.mjs` + `architecture-rules.mjs`.
8. **CI kilidi:** self-check'ler herhangi workflow'da `ALLOW_MUTATING_TESTS=true`'yu reddeder.
9. **Prefix:** yeni veri `VOMENTA_E2E_` + benzersiz suffix (paralel çakışma yok).

**Plan bu katmanları zayıflatmaz.** Faz 5 tek istisnayı ekler: `mutation.yml` içinde,
GitHub Environment `staging` onayı arkasında, `ALLOW_MUTATING_TESTS=true`. Kilit 2/3/4
hâlâ prod'a yazmayı imkânsız kılar (staging tenant secret'ı yoksa guard fail-closed).

## 9. Test sınıflandırması (doğrulanmış envanter)

**Toplam:** 36 mutation-isimli spec (33 `*-mutations.*` + 3 `*.mutation.*`) +
`mutation-orphans.authed.spec.js` (salt-okunur denetim). Ayrıca 10 read-only dosyada
yalnız yorum olarak "@mutation".

### 9A. AKTİF — gerçek 0→1→0 (`testEntity.create`), staging'e hazır (5 dosya / 9 test)

| Dosya | Test | Değiştirdiği veri | Cleanup | Durum |
|---|---|---|---|---|
| `contacts-mutations.authed.spec.js` | 1 | Kişi oluştur → VIP toplu etiket → toplu sil (POST/PATCH/DELETE) | `deleteContactsByName` | Aktif; `VOMENTA_TEST_CONTACT_PHONE` yoksa skip |
| `reports-dashboards-mutations.authed.spec.js` | 3 | Dashboard create/duplicate/delete (POST 201 / DELETE 204) | UI `deleteDashboardByName` | Aktif; serial |
| `reports-schedule-mutations.authed.spec.js` | 2 | Scheduled report create+delete + orphan denetimi | UI delete → DELETE 204 | Aktif; serial |
| `workforce-mutations.authed.spec.js` | 2 | Shift create (POST /wfm/schedules) + Publish | `deleteFirstShift` DELETE 204 | Aktif; `prefixNaReason` |
| `workforce-surveys-mutations.authed.spec.js` | 1 | CSAT anketi create+delete (UI) | `deleteAllContaining(key)` + finally | Aktif |

Hepsi: `@regression @mutation`, `retries:0`, `mutationGuard` çağırıyor. **Not:** staging
olmadan bunlar da koşamaz (guard `TEST_ENV=staging` ister) — "aktif" = fixme değil demek.

### 9B. PARKED-fixme, iskelet var (5 dosya) — staging kanıtı bekliyor

`voice-dids`, `voice-ivr`, `voice-queues` (action/cleanup TODO stub);
`workforce-evaluations`, `workforce-badges` (`cleanup` bilinçle `throw` — güvenli silme
yolu yok). Hepsi describe-level `test.fixme(true, ...)`. `mutation-lifecycle.js`'de
gerekçeli, `workforce-*` için `owner: quality-guild`, `expiry: 2026-09-30`.

### 9C. PARKED-fixme, yalnız `testEntity.cleanup` (26 dosya) — create yaşam döngüsü yok

- **17 settings:** api-keys, automations, canned-responses, compliance, data-retention,
  disposition-codes, hours, integrations, notifications, organization, profile, roles,
  security, sla, teams, templates, webhooks.
- **6 channels:** email, sms, social, video, webchat, whatsapp.
- **3 dot-named:** `campaigns-outbound.mutation` (kampanya oluştur),
  `known-bugs-invite.mutation` (davet oluştur+revoke), `voice-call.mutation`
  (**gerçek çağrı + gerçek SMS** — per-test fixme+skip).

Hepsi: describe-level fixme, `mutationGuard` var, `retries:0`, `@mutation`. `create`
yok — çünkü UI'da güvenli silme/geri-alma yolu staging'de kanıtlanmadı.

### 9D. YANLIŞ ETİKETLENMİŞ — aksiyon gerekmez (10 dosya)

`bot-builder`, `settings-audit`, `settings-organization`, `supervisor-agents`,
`settings-profile`, `supervisor-wallboard`, `settings-users`, `workforce-badges`,
`workforce-evaluations`, `workforce-surveys` (read-only isimli varyantlar). Bunlardaki
`@mutation` **yalnızca yorum/JSDoc**; gerçek etiket/guard/write **yok**. Gerçek yazmalar
zaten kardeş `*-mutations.*` dosyalarında. `supervisor-agents`/`supervisor-wallboard`
ayrıca boş `test.fixme` stub taşır (başlıkta "mutation" geçer ama etiket değil).
**→ Taşıma/rename GEREKMEZ.** Yalnız §Faz 1'de sınıflandırmaya "yorum-only" olarak yazılır.

### 9E. Salt-okunur denetim (1 dosya)

`mutation-orphans.authed.spec.js` — `MUTATION_LIFECYCLE_READ_ONLY=true`; create/delete
yapmaz, ayrılmış staging tenant baseline'ını doğrular. `report:orphans` bunu koşar.

## 10. Dosya ve klasör standardı

**Karar (tek konvansiyon):**
- Veri değiştiren spec → **`<alan>-mutations.authed.spec.js`** (baskın; 33 dosya zaten böyle).
- Etiket → describe başlığında `@regression @mutation` (+ gerekiyorsa `@known-bug`).
- Salt-okunur denetim → `mutation-orphans.authed.spec.js` (istisna; korunur).
- **`*.mutation.authed.spec.js` (3 dosya) DEPRECATED** → Faz 9'da (staging sonrası,
  düşük öncelik) `-mutations` biçimine rename. Bugün dokunulmaz (tooling her iki deseni
  de tanıyor; işlevsel sorun yok).

**Klasör:** Bugün **fiziksel klasör taşıması YAPILMAZ.** Gerekçe: `mutation-lifecycle.js`,
coverage/report üreticileri ve seçici araçlar tam `tests/<dosya>` yollarına bağlı; taşıma
yüksek riskli, kazanç düşük. Etiket + isim konvansiyonu mantıksal ayrımı zaten sağlıyor.
`tests/mutation/` klasörü Faz 9'da opsiyonel değerlendirilir.

**Şablon konumu:** `docs/examples/mutation.example.spec.js` (Playwright'ın **toplamadığı**
yer — `tests/` dışı; yanlışlıkla koşulmaz).

## 11. Komut standardı

Mevcut `test:mutation` KORUNUR; adı `@mutation` etiketiyle tutarlı olduğu için
`test:mutating`e **çevrilmez** (çift sözlük yaratmamak için). Eklenecekler:

```jsonc
"test:mutation":        // MEVCUT — değişmez
  "ALLOW_MUTATING_TESTS=true playwright test --project=chromium-authed --grep @mutation --retries=0 --workers=1",
"test:mutation:list":   // güvenli — guard koşmaz (--list globalSetup'ı atlar)
  "playwright test --project=chromium-authed --grep @mutation --list",
"test:mutation:ui":
  "ALLOW_MUTATING_TESTS=true playwright test --project=chromium-authed --grep @mutation --ui",
"test:mutation:headed":
  "ALLOW_MUTATING_TESTS=true playwright test --project=chromium-authed --grep @mutation --headed --retries=0 --workers=1",
"test:mutation:debug":
  "ALLOW_MUTATING_TESTS=true PWDEBUG=1 playwright test --project=chromium-authed --grep @mutation --retries=0 --workers=1",
"test:mutation:report":
  "playwright show-report"
```

Tek dosya: `npx playwright test tests/<alan>-mutations.authed.spec.js --project=chromium-authed --retries=0 --workers=1` (ALLOW_MUTATING_TESTS=true + staging env ile).
`pretest:mutation:*` → `quality:architecture` (mevcut `pretest:mutation` deseni).

**Önemli:** `:ui/:headed/:debug/:report` gerçek koşum için **staging env** gerektirir
(guard). Staging yoksa guard fail-closed olur — bu beklenen güvenli davranıştır.

## 12. Environment değişkenleri

`config/environment.js` + `.env.example`'dan doğrulanmış (yeni değişken eklenmez):

| Değişken | Zorunlu | Anlamı |
|---|---|---|
| `ALLOW_MUTATING_TESTS` | Evet (mutation için) | `true` olmadan `@mutation` elenir |
| `TEST_ENV` | Evet | Mutation için **`staging`** olmalı |
| `BASE_URL` | Evet | Production (`app.vomenta.com`) **olamaz** |
| `MUTATION_API_ORIGIN` | Evet | Yalnız origin; staging API |
| `MUTATION_TENANT_ID` | Evet | Ayrılmış staging tenant UUID |
| `MUTATION_TENANT_SLUG` | Evet | Ayrılmış staging tenant slug |
| `VOMENTA_TEST_CONTACT_PHONE` | Koşullu | contacts/profile; yoksa ilgili test skip |
| `VOMENTA_TEST_PHONE` | Koşullu | voice-call gerçek arama/SMS; yoksa skip |

Faz 3'te bu tablo `docs/MUTATION-TESTS-GUIDE.md`'ye taşınır; `.env.example` zaten örnekleri
içeriyor (repoya gerçek değer girmez).

## 13. Mutation test yaşam döngüsü

Her mutation testi bu döngüyü izler (fixture'larla zaten destekli):
1. **Ön koşul:** gerekli env (`test.skip(!env.x, ...)`).
2. **Güvenli ortam:** `await mutationGuard('<sebep>')` (6 kapı).
3. **Test verisi:** `testEntityName('KIND')` / `build*` (prefix + benzersiz).
4. **İşlem:** `testEntity.create({ label, key, baseline, cleanup, action })`.
5. **Doğrulama:** create-sonrası baseline=1 (fixture zorlar) + UI/L2 assert.
6. **Cleanup:** action'dan ÖNCE kaydedilen rollback, LIFO teardown.
7. **Cleanup doğrulama:** bitiş baseline=0 (orphan-zero; fixture zorlar).
8. **Raporlama:** HTML/JSON/JUnit + hata varsa `cleanup-errors.json`.
9. **Kanıt:** başarısızlıkta trace/screenshot (`retain-on-failure`).

## 14. Cleanup ve rollback standardı

- Rollback **mutasyondan önce** `testEntity.create`'in `cleanup` alanına verilir.
- Ham `testEntity.cleanup` yalnız kalıcı-create olmayan, açık N/A sözleşmeli akışta
  (validator zorlar). Boş `.catch(()=>{})` **yasak**.
- Silme yolu yoksa test **`test.fixme`** + `mutation-lifecycle.js`'de gerekçe (mode/reason,
  gerekiyorsa owner/expiry/removalCondition). "Yeşil ama kirli bırakan" test **yasak**.
- Cleanup hatası → `KRİTİK ALTYAPI HATASI` (test kırılır, sessiz geçmez).

## 15. CI/CD çalışma modeli

- **Otomatik değil, manuel.** Mutation asla `pull_request`/`push`'ta koşmaz.
- Ayrı `mutation.yml`: yalnız `workflow_dispatch`.
- **GitHub Environment `staging`** → required reviewer onayı + staging secret'ları burada.
- **Concurrency:** `group: mutation`, `cancel-in-progress: false` (aynı anda tek koşum).
- `ALLOW_MUTATING_TESTS=true` YALNIZCA bu workflow'da; `TEST_ENV=staging` zorunlu.
- `readonly-audit.yml` ve `playwright.yml` **aynen kalır** (read-only, hızlı, PR lane'i temiz).
- **Self-check değişikliği GEREKMEDİ (uygulama sırasında doğrulandı):** `ALLOW_MUTATING_TESTS=true`
  yasağı global değil, yalnız `playwright.yml` (`self-check-ci-workflow.mjs`) ve
  `readonly-audit.yml` (`self-check-audit-workflow.mjs`) dosyalarına özeldir. Yeni `mutation.yml`
  bu iki denetimin kapsamı dışındadır; `true` koymak hiçbir self-check'i kırmaz.
- **Artifact upload v1'de YOK.** `self-check-artifact-allowlist.mjs` tüm workflow'ları tarar ve
  toplam upload adımını **11'e sabitler** + güvenli-bundle (kayıtlı lane + ready-guard + preparer)
  kurallarını uygular. Bu yüzden ilk sürüm upload etmez; sanitize artifact staging bağlanınca
  (Faz 8) kayıtlı `mutation` lane'i ile eklenir. HTML rapor runner'da yine üretilir; orphan
  denetimi `report:orphans` adımı ile `always()` koşar.
- **Gerçek koşum staging secret/vars'a bağlı** (Faz 7). O zamana kadar workflow YAML + tüm
  self-check'ler yeşil doğrulanır, ama mutation fiilen koşmaz (guard fail-closed).

## 16. Raporlama modeli

**İkinci sistem kurulmaz; mevcutlar yeniden kullanılır:**
- HTML rapor (`playwright-report/`) → `npm run test:mutation:report`.
- JSON/JUnit (`test-results/`) → kaç bulundu/geçti/başarısız/atlandı.
- `npm run report:orphans` → tenant orphan/kalıntı denetimi (0 olmalı).
- `cleanup-errors.json` (testInfo attach) → başarısız cleanup görünür.
- `test:mutation:list` → "kaç test var / hangileri fixme" envanteri.
- Fixme sebepleri → `tests/contracts/mutation-lifecycle.js` (staging-blocked gerekçeleri).

Faz 6, bu çıktıların **nerede görüleceğini** rehberde tek yere yazar; yeni üretici
yalnız gerçekten boşluk varsa (opsiyonel `report:mutation-inventory`) değerlendirilir.

## 17. Bugün tamamlanacak fazlar

- **Faz 1 — Envanter & sınıflandırma (durable).** `docs/raporlar/MUTATION-INVENTORY.md`.
- **Faz 2 — Komut yüzeyi.** `package.json` `test:mutation:*` scriptleri.
- **Faz 3 — Yazım rehberi + şablon.** `docs/MUTATION-TESTS-GUIDE.md` + `docs/examples/mutation.example.spec.js`.
- **Faz 4 — README yönlendirme + disambiguation.**
- **Faz 5 — CI manuel workflow iskeleti.** `mutation.yml` + self-check daraltma (dry-run yeşil).
- **Faz 6 — Sonuç görünürlüğü.** Mevcut reporter/orphan/list'i rehbere bağla.

Sıra ve bağımlılık §19'da. Faz 1 diğerlerinin girdisidir (tekrar tarama yok).

## 18. Sonraki günlere bırakılacak işler (Faz 7/8/9 — tam tasarım)

> Repo tarafı hazır: `mutation.yml`, `mutation:preflight`, guard, komutlar, `.env.example`
> staging bloğu ve [staging runbook](MUTATION-STAGING-SETUP.md) commit'lendi. Aşağıdaki
> üç faz bu altyapının üstünde çalışır.

### FAZ 7 — Staging ortamı provizyonu

- **Amaç:** Mutation testlerinin fiilen koşabileceği ayrılmış staging tenant'ı + GitHub
  `staging` Environment secret/vars'ını hazırlamak.
- **Neden gerekli:** Guard, staging bağlamı olmadan fail-closed'dur; 9A dahil hiçbir test
  koşamaz. Bu, "gerçek mutation hattı"nın ön koşuludur.
- **Girdi dosyaları:** [docs/MUTATION-STAGING-SETUP.md](MUTATION-STAGING-SETUP.md) (adım-adım),
  `.github/workflows/mutation.yml` (beklenen secret/var adları), `tools/mutation-preflight.mjs`.
- **Değiştirilecek dosyalar:** KOD YOK. Yalnız infra: staging tenant + GitHub Environment.
  (Opsiyonel lokal `.env` — commit edilmez.)
- **Yapılacak işler:** Runbook §1–§3 (tenant provizyon, `staging` Environment + reviewer,
  secret/vars girişi). Adlar `mutation.yml` ile birebir.
- **Yapılmayacak işler:** Kod değişikliği, self-check dokunuşu, `.env` commit'i, production
  tenant kullanımı.
- **Teknik karar:** Secret'lar yalnız `staging` Environment'ında; guard prod origin'lerini
  reddeder (defense-in-depth).
- **Uygulama sırası:** tenant → Environment → reviewer → vars → secrets → doğrulama.
- **Çalıştırılacak komutlar:** `npm run mutation:preflight` (lokal), sonra Actions →
  *Mutation Tests* → Run workflow.
- **Beklenen çıktılar:** `mutation:preflight` TÜM kapılar ✓; manuel workflow onaydan geçip
  guard'ı aşıyor.
- **Kabul kriterleri:** preflight yeşil **ve** `mutation.yml` staging'de en az 9A testlerini
  yürütüyor **ve** `report:orphans` = 0.
- **Hata durumunda:** preflight hangi kapının ✗ olduğunu gösterir → ilgili secret/var'ı düzelt.
  Guard reddi = staging bağlamı hâlâ eksik (asla production'a geçme).
- **Commit kapsamı:** Yok (infra). İstenirse runbook'a "provisioned" notu düşülebilir.
- **Sonraki faza geçiş şartı:** preflight + ilk gerçek koşum yeşil → Faz 8 açılır.

### FAZ 8 — Fixme → yeşil dönüşümü (dosya başına 1 PR)

- **Amaç:** Parked (`test.fixme`) mutation testlerini gerçek `testEntity.create` 0→1→0
  yaşam döngüsüne çevirmek; her birinin orphan=0 kanıtını üretmek.
- **Neden gerekli:** Envanterdeki 31 fixme, staging kanıtı gelene kadar sinyal üretmiyor.
- **Girdi dosyaları:** [docs/raporlar/MUTATION-INVENTORY.md](raporlar/MUTATION-INVENTORY.md)
  (9A/9B/9C sınıfları + dönüşüm önceliği), `tests/contracts/mutation-lifecycle.js` (fixme
  gerekçeleri), `docs/examples/mutation.example.spec.js` (şablon), `docs/MUTATION-TESTS-GUIDE.md`.
- **Değiştirilecek dosyalar:** PR başına **tek** `tests/<alan>-mutations.authed.spec.js` +
  `tests/contracts/mutation-lifecycle.js` (o dosyanın istisnasını kaldır) + gerekiyorsa ilgili
  Page Object (`tests/pages/...`). Başka dosyaya dokunma.
- **Yapılacak işler (sıra):**
  1. **Adım 0 — 9A doğrulaması (ayrı, ilk PR değil):** 5 aktif dosyayı staging'de koştur;
     yeşilse DOKUNMA, yalnız kanıtı raporla.
  2. Öncelik sırasıyla (envanter §"Dönüşüm önceliği") bir fixme dosya seç.
  3. `test.fixme` kaldır; `action`/`baseline`/`cleanup`'ı gerçek staging uçlarıyla doldur
     (şablonu izle); silme yolu gerçekten var mı doğrula.
  4. `mutation-lifecycle.js`'den o dosyanın istisnasını kaldır.
  5. Staging'de koştur: 0→1→0 + orphan=0 kanıtla.
- **Yapılmayacak işler:** Birden çok dosyayı tek PR'da; güvenli silme yolu YOKKEN fixme
  kaldırmak; guard/cleanup zayıflatmak; `retries` açmak.
- **Teknik karar:** Silme/geri-alma yolu staging'de kanıtlanamıyorsa dosya fixme kalır ve
  `mutation-lifecycle.js` gerekçesi güncellenir (dönüştürme). "Yeşil ama kirli" yasak.
- **Çalıştırılacak komutlar:**
  `ALLOW_MUTATING_TESTS=true npx playwright test tests/<dosya> --project=chromium-authed --retries=0 --workers=1`
  → `npm run report:orphans` → `npm run quality:check`.
- **Beklenen çıktılar:** Seçilen dosya yeşil, orphan=0, `quality:check` yeşil.
- **Kabul kriterleri:** 0→1→0 kanıtlandı; `mutation-lifecycle.js` istisnası kalktı;
  `quality:mutation-safety` + `quality:check` yeşil.
- **Hata durumunda:** create baseline≠0 → önce orphan temizle; silme yolu yok → dönüştürme
  (fixme + gerekçe), PR'ı "blocked" olarak kapat.
- **Commit kapsamı:** Tek dosya + kontrat satırı (+ ops. tek Page Object). Bir PR = bir alan.
- **Sonraki faza geçiş şartı:** Yok — Faz 8 uzun kuyruktur; öncelik bittikçe ilerler,
  Faz 9'a paralel yürüyebilir.

### FAZ 9 — İsim standardizasyonu (OPSİYONEL, düşük öncelik)

- **Amaç:** Kalan 3 `*.mutation.authed.spec.js`'i tek konvansiyona (`*-mutations.*`) taşımak.
- **Neden gerekli (zayıf):** Tamamen kozmetik — tooling her iki deseni de tanıyor; işlevsel
  kazanç yok. Yalnız keşif netliği.
- **Girdi dosyaları:** 3 dosya (`campaigns-outbound.mutation`, `known-bugs-invite.mutation`,
  `voice-call.mutation`), `tests/contracts/mutation-lifecycle.js`, `tests/contracts/tested-pages.js`,
  `tools/self-check-pr-impact.mjs`.
- **Değiştirilecek dosyalar (blast radius geniş — dikkat):** 3 spec (git mv) + `mutation-lifecycle.js`
  anahtarları + `tested-pages.js` + `self-check-pr-impact.mjs` + ~13 otomatik rapor
  (READONLY-MANIFEST, SURFACE-DEPTH, TEST-SONUCLARI, YAPILAN/YAPILMAYAN-TESTLER,
  TEST_STYLE_MATRIX) → **generatörlerle yeniden üretilmeli**, elle düzenlenmez.
- **Yapılacak işler (sıra):** `git mv` 3 dosya → tüm referansları güncelle → `npm run report:all`
  + ilgili generatörler → `git diff --exit-code` ile drift kontrol → `quality:check`.
- **Yapılmayacak işler:** Otomatik raporları elle düzenlemek; Faz 8 ile aynı PR'a karıştırmak.
- **Teknik karar:** Değeri düşük + riski (path-coupling) yüksek olduğundan **Faz 7/8 bittikten
  sonra** ve yalnız açık istekle yapılır. Klasör (`tests/mutation/`) + `chromium-mutation`
  project'i de burada opsiyonel değerlendirilir (önerilmez).
- **Çalıştırılacak komutlar:** `npm run report:all` (+ `report:surface`, `report:style-matrix`),
  sonra `npm run quality:check` ve drift `:check` scriptleri.
- **Kabul kriterleri:** `*.mutation.*` deseni kalmadı; tüm generatör drift'leri temiz;
  `quality:check` yeşil; `test:mutation:list` sayısı değişmedi.
- **Hata durumunda:** Referans kaçağı → grep ile bul; rapor drift → generatörü yeniden koş.
- **Commit kapsamı:** Rename + referans + regenerate, tek PR (Faz 8'den ayrı).
- **Sonraki faza geçiş şartı:** Son faz; yok.

## 19. Faz bağımlılıkları

```
Faz 1 (envanter)
  ├─> Faz 2 (komutlar)      ─┐
  ├─> Faz 3 (rehber+şablon) ─┤
  ├─> Faz 4 (README)  ← Faz 3│
  ├─> Faz 5 (CI iskelet)     ├─> Faz 6 (görünürlük; 2+3+5 çıktısını bağlar)
  └───────────────────────────┘
Faz 7 (staging)  ─> Faz 8 (fixme→yeşil)  ─> Faz 9 (rename/klasör, ops.)
```
- Faz 2–5 birbirinden bağımsız (paralel yazılabilir; ayrı commit).
- Faz 4, Faz 3'ün rehber dosya adına referans verir → Faz 3 önce.
- Faz 6 en son (2,3,5 çıktısını dokümana bağlar).
- Faz 8/9 **Faz 7'ye kilitli** — staging olmadan başlanmaz.
- **Döngü yok:** her faz farklı dosyalara yazar; envanter yalnız Faz 1'de üretilir.

## 20. Her faz için başlangıç promptu

> Aşağıdaki promptlar yeni/temiz bir sohbette tek başına kullanılabilir. Her biri bu plan
> dosyasını ve Faz 1 çıktısını (envanter) girdi kabul eder; **repoyu yeniden taramaz.**

**Faz 1:**
```
docs/MUTATING-TESTS-IMPLEMENTATION-PLAN.md §9'daki doğrulanmış sınıflandırmayı
docs/raporlar/MUTATION-INVENTORY.md dosyasına durable biçimde yaz (9A aktif, 9B iskelet-fixme,
9C cleanup-only-fixme, 9D yorum-only, 9E salt-okunur). Tabloları koru. Kod değiştirme.
Kabul: dosya var, 36 spec + 10 yorum-only doğru sınıfta, `npm run quality:architecture` yeşil.
```
**Faz 2:**
```
package.json'a §11'deki test:mutation:list/ui/headed/debug/report scriptlerini ekle
(mevcut test:mutation'ı DEĞİŞTİRME). pretest:mutation:* → quality:architecture.
Doğrula: `npm run test:mutation:list` @mutation testlerini listeler; JSON geçerli.
Kabul: `npm run quality:check` yeşil; list beklenen dosyaları gösteriyor.
```
**Faz 3:**
```
docs/MUTATION-TESTS-GUIDE.md rehberini (§6 yeni-test soruları) ve
docs/examples/mutation.example.spec.js kopyala-çalıştır şablonunu oluştur
(mutationGuard + testEntity.create 0→1→0 + factory + fixme fallback). Şablon tests/ DIŞINDA
kalsın (Playwright toplamasın). Kod/spec değiştirme.
Kabul: rehber §6'daki 17 soruyu yanıtlıyor; şablon lint/list'e girmiyor.
```
**Faz 4:**
```
README.md'ye kısa "Veri değiştiren testler" bölümü + docs/MUTATION-TESTS-GUIDE.md linki
ekle ve "kod-mutasyon testi (Stryker) DEĞİLDİR" ayrımını yaz. Mevcut bilgiyle çelişme yaratma.
Kabul: README guide'a yönlendiriyor; `npm run quality:architecture` yeşil.
```
**Faz 5:** *(uygulandı — self-check daraltması GEREKMEDİ)*
```
.github/workflows/mutation.yml oluştur: yalnız workflow_dispatch, environment: staging,
concurrency group=mutation-lane (cancel-in-progress:false), ALLOW_MUTATING_TESTS=true +
TEST_ENV=staging YALNIZCA burada, staging config'i Environment secret/vars'tan, adım
`npm run test:mutation` + always() `npm run report:orphans`. Artifact UPLOAD ETME
(self-check-artifact-allowlist 11-upload sabitini korur; sanitize upload Faz 8'e bırakılır).
Self-check DEĞİŞTİRME: ALLOW_MUTATING_TESTS=true yasağı yalnız playwright.yml + readonly-audit.yml'e
özeldir; mutation.yml kapsam dışıdır. Kabul: `npm run quality:check` yeşil; YAML tüm parser'lardan geçer.
```
**Faz 6:**
```
docs/MUTATION-TESTS-GUIDE.md'ye "Sonuçlar nerede görülür" bölümü ekle: HTML (test:mutation:report),
JSON/JUnit, report:orphans, cleanup-errors.json, test:mutation:list, mutation-lifecycle.js.
Yeni raporlama sistemi kurma. Kabul: rehber §9'daki görünürlük sorularını yanıtlıyor.
```
**Faz 7:**
```
docs/MUTATION-STAGING-SETUP.md runbook'unu uygula/doğrula. Ben (kullanıcı) staging tenant'ı
provisionladım ve GitHub `staging` Environment secret/vars'ını girdim (ya da girmek üzereyim).
Sen: `npm run mutation:preflight` çıktısını yorumla, eksik/yanlış kapıları söyle, düzeltme
adımını ver. KOD DEĞİŞTİRME. Kabul: preflight TÜM kapılar ✓; `mutation.yml` manuel koşumu
staging'de guard'ı geçiyor ve 9A testlerini yürütüyor; `report:orphans` = 0.
```
**Faz 8 (dosya başına bir PR, staging gerekir):**
```
Girdi: docs/raporlar/MUTATION-INVENTORY.md + docs/MUTATION-TESTS-GUIDE.md +
docs/examples/mutation.example.spec.js. Staging bağlı (Faz 7 bitti).
1) Önce 9A'daki 5 aktif dosyayı staging'de koştur; yeşilse DOKUNMA, kanıtı raporla.
2) Envanterdeki "Dönüşüm önceliği"nden TEK fixme dosya seç: <dosya>.
3) test.fixme kaldır; action/baseline/cleanup'ı gerçek staging uçlarıyla doldur (şablonu izle);
   güvenli silme yolu yoksa fixme+gerekçe olarak BIRAK (dönüştürme).
4) tests/contracts/mutation-lifecycle.js'den o dosyanın istisnasını kaldır.
5) Koştur: ALLOW_MUTATING_TESTS=true npx playwright test tests/<dosya> --project=chromium-authed
   --retries=0 --workers=1 → npm run report:orphans → npm run quality:check.
Kabul: 0→1→0 + orphan=0 kanıtlandı; quality:check yeşil. Commit: tek dosya + kontrat satırı.
Birden fazla dosyayı tek PR'a KOYMA.
```
**Faz 9 (opsiyonel, Faz 7/8 sonrası, açık istekle):**
```
3 dosyayı git mv ile yeniden adlandır: campaigns-outbound.mutation / known-bugs-invite.mutation /
voice-call.mutation → *-mutations.authed.spec.js. Sonra TÜM referansları güncelle
(tests/contracts/mutation-lifecycle.js anahtarları, tests/contracts/tested-pages.js,
tools/self-check-pr-impact.mjs) ve otomatik raporları generatörlerle YENİDEN ÜRET
(npm run report:all + report:surface + report:style-matrix — elle düzenleme YOK).
Kabul: `*.mutation.*` deseni kalmadı; drift :check'leri temiz; quality:check yeşil;
test:mutation:list sayısı değişmedi. Faz 8'den AYRI PR.
```

## 21. Kabul kriterleri

**Bugün (Faz 1–6):**
- `docs/raporlar/MUTATION-INVENTORY.md` var ve §9 ile birebir.
- `npm run test:mutation:list` `@mutation` testlerini **gerçekten listeler** (çıktı doğrulanır).
- `docs/MUTATION-TESTS-GUIDE.md` §6'daki 17 sorunun **hepsini** yanıtlar; şablon mevcut.
- README guide'a yönlendirir + kod-mutasyon ayrımı net.
- `mutation.yml` geçerli; `npm run quality:check` **yeşil**; başka workflow'da `true` **fail** eder.
- Read-only mimarisi bozulmadı: `npm run quality:architecture` yeşil.
- **Sahte başarı yok:** staging olmadan mutation'ın fiilen koşmadığı açıkça belirtilir.

**Sonraki (Faz 7–9):** staging bağlı; 9A yeşil koşar; her fixme→yeşil PR'ında orphan=0.

## 22. Test ve doğrulama komutları

```bash
npm run quality:architecture     # mimari kapı (her faz sonrası)
npm run quality:check            # tüm self-check zinciri (Faz 2/5 sonrası)
npm run test:mutation:list       # mutation testleri gerçekten listeleniyor mu (Faz 2)
npx playwright test --grep @mutation --list   # ham doğrulama
node -e "require('./package.json')"           # package.json geçerli JSON mu (Faz 2)
# Faz 5: YAML doğrulama + self-check-ci-workflow/self-check-audit-workflow yeşil
# Faz 7 sonrası (staging): npm run test:mutation && npm run report:orphans
```
Her komut çıktısı **gizlenmeden** raporlanır; başarısızsa "başarılı" denmez.

## 23. Riskler ve önlemler

| Risk | Önlem |
|---|---|
| Staging yok → hiçbir mutation yeşil koşamaz | Bugünkü kapsam koşum değil **hazırlık**; §21 sahte başarı yasağı |
| Faz 5 self-check'i gevşetirken prod kapısı açılır | `true`'yu yalnız `mutation.yml`+`environment:staging`'e daralt; Kilit 2/3/4 korunur; negatif test ekle |
| Rename (Faz 9) tooling yollarını kırar | Faz 9 opsiyonel + staging sonrası; `mutation-lifecycle.js` anahtarları senkron |
| Şablon yanlışlıkla CI'da koşar | `docs/examples/` altında (tests/ dışı; Playwright toplamaz) |
| Doküman çoğaltma/çelişki | Tek kaynak `MUTATION-TESTS-GUIDE.md`; README yalnız link |
| Yeni `test:mutation:ui` prod'a yazma sanılır | Guard fail-closed; rehberde staging şartı vurgulanır |

## 24. Değiştirilecek dosyalar

- `package.json` (Faz 2 — `test:mutation:*` scriptleri; Faz 7 — `mutation:preflight`; **`test:mutation` değişmez**)
- `README.md` (Faz 4 — kısa bölüm + link)
- `.env.example` (Faz 7 hazırlık — staging mutation bloğu netleştirildi)
- (Faz 5 — self-check DEĞİŞTİRİLMEDİ; uygulama sırasında gereksiz olduğu doğrulandı)
- (Faz 9, ops.) `tests/*.mutation.authed.spec.js` → rename + `tests/contracts/mutation-lifecycle.js` anahtarları

## 25. Oluşturulacak dosyalar

- `docs/raporlar/MUTATION-INVENTORY.md` (Faz 1)
- `docs/MUTATION-TESTS-GUIDE.md` (Faz 3, Faz 6'da genişler)
- `docs/examples/mutation.example.spec.js` (Faz 3 — şablon; tests/ dışı)
- `.github/workflows/mutation.yml` (Faz 5)
- `tools/mutation-preflight.mjs` (Faz 7 hazırlık — staging kapı doğrulayıcı)
- `docs/MUTATION-STAGING-SETUP.md` (Faz 7 runbook)

## 26. Dokümantasyon güncellemeleri

- **README:** kısa "Veri değiştiren testler" başlangıç + guide linki + Stryker ayrımı.
- **MUTATION-TESTS-GUIDE.md:** tek kanonik rehber (yer, isim, etiket, fixture, env, guard,
  cleanup, çalıştırma, UI/debug, CI, rapor, sorun giderme, yeni-test kontrol listesi).
- **MUTATION-INVENTORY.md:** durable sınıflandırma (fazların girdisi).
- AGENTS.md / CONTRIBUTING.md: değişmez; guide onlara **referans** verir (çoğaltma yok).

## 27. Son teslim kontrol listesi

- [ ] Faz 1: `MUTATION-INVENTORY.md` §9 ile birebir; `quality:architecture` yeşil.
- [ ] Faz 2: `test:mutation:*` eklendi; `test:mutation:list` doğru listeliyor; `quality:check` yeşil.
- [ ] Faz 3: `MUTATION-TESTS-GUIDE.md` + `mutation.example.spec.js`; 17 soru yanıtlı; şablon toplanmıyor.
- [ ] Faz 4: README bölümü + link + Stryker ayrımı; çelişki yok.
- [ ] Faz 5: `mutation.yml` geçerli; scoped self-check; başka `true` fail; `quality:check` yeşil.
- [ ] Faz 6: görünürlük bölümü; ikinci raporlama sistemi kurulmadı.
- [ ] Read-only mimarisi bozulmadı; her komut çıktısı gerçek (sahte başarı yok).
- [ ] Faz 7–9 staging'e bağlı olarak işaretli; bugün kapsanmadığı açık.
```
```
