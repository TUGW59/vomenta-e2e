# Mutation (Veri Değiştiren) Test Rehberi

> **Tek kanonik rehber.** Vomenta E2E paketinde uygulama verisini gerçekten değiştiren
> (create/update/delete/save, form gönderme, ayar/rol/yetki değişimi, kampanya başlatma,
> API üzerinden yazma) testlerin nasıl yazılacağı, çalıştırılacağı ve güvence altına
> alındığı burada anlatılır.
>
> ⚠️ **Bu, klasik "mutation testing" (Stryker gibi kod mutasyonu) DEĞİLDİR.** Burada
> "mutation" = *uygulama verisini değiştiren E2E testi* anlamındadır.
>
> İlgili kaynaklar: [Envanter](raporlar/MUTATION-INVENTORY.md) ·
> [Uygulama planı](MUTATING-TESTS-IMPLEMENTATION-PLAN.md) · bağlayıcı kurallar
> `AGENTS.md`, `CONTRIBUTING.md`, ADR-0004 / ADR-0005. Bu rehber onları **tekrar etmez**,
> operasyonel özet + referans verir.

---

## 1. Bir test ne zaman "mutation" sayılır?

Uygulamada **kalıcı** bir değişiklik yapıyorsa mutation'dır: kayıt oluştur/güncelle/sil,
form kaydet, ayar/switch değiştir+kaydet, rol/yetki değiştir, kampanya/workflow başlat,
davet gönder, veya API ile veri yazan (POST/PUT/PATCH/DELETE) her akış. **Gerçek** giden
çağrı/SMS de mutation'dır (dış maliyet + kalıcı etki).

Mutation **değildir**: yalnız okuma/görüntüleme, navigasyon, arama/filtre, CSV export
(veri değiştirmiyorsa), salt-okunur doğrulama. Bunlar read-only testtir, `@mutation`
**taşımaz** ve production'a karşı koşabilir.

Şüphedeyseniz: *"Bu test koştuktan sonra tenant'ta bir şey kalıcı olarak değişti mi?"*
Cevap evet ise mutation'dır.

## 2. Nerede bulunur? (konum & isim)

- **Konum:** `tests/` kökü (read-only spec'lerle aynı dizin; ayrım isim + etiketle).
- **İsim standardı (tek konvansiyon):** `tests/<alan>-mutations.authed.spec.js`
  Örn: `contacts-mutations.authed.spec.js`, `settings-roles-mutations.authed.spec.js`.
- **Eski/deprecated:** `*.mutation.authed.spec.js` (yalnız 3 dosya; yeni test bu biçimde
  **açılmaz**).
- **İstisna:** `mutation-orphans.authed.spec.js` — salt-okunur orphan denetimi.
- **Şablon:** [`docs/examples/mutation.example.spec.js`](examples/mutation.example.spec.js)
  (bu dosya `tests/` dışıdır, Playwright toplamaz — kopyalayıp `tests/`'e taşıyın).

## 3. Hangi etiket? (tag)

Describe başlığında **`@mutation`** (zorunlu) + **`@regression`** (standart). Gerekirse
`@known-bug`. Yeni etiket icat etmeyin — `@mutation` tek kanonik veri-değiştirme etiketidir
ve tüm grep/CI/guard seçimi buna bağlıdır.

```js
test.describe('Kişiler — L3 mutasyonu @regression @mutation', () => { /* ... */ });
```

## 4. Hangi fixture kullanılır?

`tests/fixtures/test.js`'ten gelen fixture'lar (test dosyası altyapıyı bilmez):

| Fixture | Görev |
|---|---|
| `mutationGuard` | İlk yazmadan ÖNCE `await mutationGuard('<sebep>')` — 6 güvenlik kapısı |
| `testEntity` | `create({...})` 0→1→0 yaşam döngüsü; `cleanup(fn, label)` yalnız N/A akışlar |
| `api` | `ApiClient` — guard'a bağlı; write öncesi guard'ı zorunlu kılar |
| `app` | Page Object kökü (`app.<alan>...`) |
| `artifacts` | Güvenli (maskeli) ekleme/screenshot |

## 5. Test verisi nasıl üretilir?

`tests/data/factories.js`:
- `testEntityName('KIND')` → `VOMENTA_E2E_KIND_<benzersiz>` (değiştirilemez önek + benzersiz suffix).
- `buildContact` / `buildPeopleContact` / `buildTicket` / `buildUserInvite` / `buildCampaign`.

**Sabit isim/e-posta KULLANMAYIN** — paralel koşumda çakışır. Her zaman benzersiz üretin.
Önek (`VOMENTA_E2E_`) sayesinde orphan taramaları test verisini bulabilir.

## 6. Hangi environment değişkenleri gerekir?

| Değişken | Zorunlu | Anlamı |
|---|---|---|
| `ALLOW_MUTATING_TESTS=true` | Evet | Olmadan `@mutation` grepInvert ile elenir |
| `TEST_ENV=staging` | Evet | Mutation yalnız staging'de |
| `BASE_URL` | Evet | Production (`app.vomenta.com`) **olamaz** |
| `MUTATION_API_ORIGIN` | Evet | Yalnız origin biçiminde staging API |
| `MUTATION_TENANT_ID` | Evet | Ayrılmış staging tenant UUID |
| `MUTATION_TENANT_SLUG` | Evet | Ayrılmış staging tenant slug |
| `VOMENTA_TEST_CONTACT_PHONE` | Koşullu | kişi/profil testleri; yoksa skip |
| `VOMENTA_TEST_PHONE` | Koşullu | gerçek arama/SMS; yoksa skip |

Örnekler `.env.example`'da. **Gerçek değerler repoya girmez.**

## 7. Production koruması nasıl çalışır? (güvenlik)

9 katman — hiçbiri atlanamaz (`config/environment.js`, `fixtures/mutationGuard.js`,
`fixtures/testEntity.js`, `playwright.config.js`, self-check'ler):

1. `ALLOW_MUTATING_TESTS` yoksa `grepInvert:/@mutation/` hepsini eler.
2. `TEST_ENV=staging` değilse guard reddeder.
3. `BASE_URL` production origin ise guard reddeder.
4. `MUTATION_API_ORIGIN` eşleşmezse reddeder.
5. `MUTATION_TENANT_ID`/`SLUG` geçersizse reddeder.
6. Canlı `/api/v1/auth/me` tenant kimliği eşleşmezse reddeder.
7. `testEntity.create` 0→1→0; rollback action'dan önce kayıtlı; LIFO teardown.
8. Cleanup hatası → `KRİTİK ALTYAPI HATASI` (test kırılır).
9. CI self-check'leri herhangi workflow `ALLOW_MUTATING_TESTS=true` derse fail eder
   (istisna: onaylı `mutation.yml` + `environment: staging`).

**Production'da veri değiştirmek için kaçış bayrağı YOKTUR.**

## 8. Cleanup nasıl yazılır?

- Rollback'i **mutasyondan önce** `testEntity.create`'in `cleanup` alanına verin.
- Ham `testEntity.cleanup(fn, label)` yalnız kalıcı-create olmayan, açık N/A akışlarda.
- Boş `.catch(() => {})` **yasak**. Silme yolu yoksa `test.fixme` + `mutation-lifecycle.js`
  gerekçesi ekleyin ("yeşil ama kirli bırakan" test yasak).

## 9. Nasıl çalıştırılır?

> Gerçek koşum **staging env** gerektirir (§6). Staging yoksa guard fail-closed olur —
> bu beklenen güvenli davranıştır, hata değildir.

```bash
npm run test:mutation          # tüm @mutation testleri (staging, retries=0, workers=1)
npm run test:mutation:list     # yalnız listele (çalıştırmaz; env gerektirmez)
npm run test:mutation:ui       # Playwright UI modu (seçerek koştur/incele)
npm run test:mutation:headed   # tarayıcı görünür koşum
npm run test:mutation:debug    # PWDEBUG=1 adım-adım debug
npm run test:mutation:report   # son HTML raporu aç

# Tek dosya (staging env ile):
ALLOW_MUTATING_TESTS=true npx playwright test \
  tests/contacts-mutations.authed.spec.js \
  --project=chromium-authed --retries=0 --workers=1
```

## 10. CI'da nasıl çalışır?

- Mutation testleri **asla** `pull_request`/`push`'ta koşmaz (PR lane'i read-only kalır).
- Ayrı `.github/workflows/mutation.yml`: yalnız **manuel** `workflow_dispatch`.
- **GitHub Environment `staging`** → onay (required reviewer) + staging secret'ları burada.
- **Concurrency:** aynı anda tek mutation koşumu (`cancel-in-progress: false`).
- `ALLOW_MUTATING_TESTS=true` + `TEST_ENV=staging` YALNIZCA bu workflow'da.

## 11. Sonuçlar nerede görülür? (görünürlük)

| Soru | Nerede |
|---|---|
| Kaç test var / hangileri fixme? | `npm run test:mutation:list` |
| Kaç geçti / başarısız / atlandı? | HTML rapor (`npm run test:mutation:report`) + `test-results/` JSON/JUnit |
| Hangi veri değişti? | Test başlıkları + trace (`retain-on-failure`) |
| Cleanup başarılı mı? | `cleanup-errors.json` (testInfo attach; hata varsa) |
| Tenant'ta kalıntı (orphan) var mı? | `npm run report:orphans` (0 olmalı) |
| Neden koşmadı (staging-blocked)? | `tests/contracts/mutation-lifecycle.js` gerekçeleri |
| Hangi test güvenlik guard'ına takıldı? | Test hatası mesajı: `"<sebep>" reddedildi: ...` (guard ortam/tenant reddi) |
| CI (staging bağlanınca) | `mutation.yml` çıktısı + `report:orphans` adımı (kalıntı=0) |

İkinci bir raporlama sistemi yoktur; mevcut Playwright reporter + orphan raporu kullanılır.

## 12. Test başarısız olursa ne kontrol edilir?

1. **Guard reddi mi?** Mesaj `"<sebep>" reddedildi: ...` → env (§6) eksik/yanlış.
2. **`KRİTİK ALTYAPI HATASI`** → cleanup başarısız; `cleanup-errors.json` + orphan raporu.
3. **create baseline≠0** → önceki koşumdan orphan kalmış; önce `report:orphans` ile temizle.
4. **UI/L2 assert** → trace'i aç: `npx playwright show-trace <trace.zip>`.

## 13. Retry / paralel / güvenlik SSS

- **Retry?** Hayır. Mutation her zaman `retries=0` (yan etki tekrarı yasak; `describe.configure`
  + lane bayrağı ikisi birden zorlar).
- **Paralel?** Lane `--workers=1` çalışır. Veri çakışmasını benzersiz `VOMENTA_E2E_` isimleri
  önler; yine de aynı kaydı iki test değiştirmemelidir.
- **Güvenliği hız için atlama** — guard/cleanup asla devre dışı bırakılmaz.

## 14. Yeni mutation testi ekleme kontrol listesi

- [ ] Dosya `tests/<alan>-mutations.authed.spec.js` olarak adlandırıldı.
- [ ] Describe başlığı `@regression @mutation` taşıyor.
- [ ] `test.describe.configure({ retries: 0 })` var.
- [ ] İlk yazmadan önce `await mutationGuard('<sebep>')`.
- [ ] Veri `testEntityName`/`build*` ile benzersiz üretildi (`VOMENTA_E2E_` öneki).
- [ ] Kalıcı kayıt için `testEntity.create` (baseline+cleanup+action) 0→1→0.
- [ ] Silme yolu yoksa `test.fixme` + `mutation-lifecycle.js` gerekçesi.
- [ ] `npm run test:mutation:list` yeni testi gösteriyor.
- [ ] `npm run quality:check` yeşil.
- [ ] PR şablonundaki `@mutation` maddesi işaretlendi.

## 15. Sorun giderme

| Belirti | Neden | Çözüm |
|---|---|---|
| `No tests found` (list) | `ALLOW_MUTATING_TESTS` yok → grepInvert eledi | `test:mutation:list` scriptini kullan (flag'lı) |
| `... reddedildi: yalnızca TEST_ENV=staging` | Ortam production | `.env`: staging + tenant değişkenleri |
| `KRİTİK ALTYAPI HATASI` | Cleanup başarısız, olası orphan | `report:orphans` + cleanup uçlarını kontrol et |
| `başlangıç baseline=N` | Önceki orphan | Tenant'ı temizle, tekrar koş |
| quality gate: `test:mutation ... içermeli` | Lane bayrağı bozuldu | `test:mutation` `--retries=0 --workers=1` içermeli |
