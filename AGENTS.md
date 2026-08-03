# Vomenta test deposu — bağlayıcı çalışma kuralları

Bu kurallar bu depoda çalışan bütün insan ve otomasyon ajanları için geçerlidir.
Amaç testlerin değişikliklere dayanıklı, güvenli ve teşhis edilebilir kalmasıdır.

## Değiştirilemez temel ilkeler

1. Spec dosyaları `test` ve `expect` değerlerini yalnızca
   `tests/fixtures/test.js` üzerinden alır.
2. Spec dosyaları doğrudan şifre, `process.env`, ortam URL'si veya storage-state
   yolu kullanmaz. Bunlar `config/environment.js` tarafından yönetilir.
3. Production ortamında veri oluşturan, değiştiren veya silen test yazılmaz.
   Mutasyon testleri `@mutation`, `mutationGuard` ve `testEntity.create`
   yaşam döngüsü içermek zorundadır.
   Mutasyon testleri yalnızca özel/ayrılmış bir test hesabına (tenant) karşı
   çalıştırılır; otomasyon gerçek bir müşteri hesabına yöneltilmez. Otomasyon
   hesabı gerçek bir hesapla değiştirilecekse, önce ayrı bir test hesabı açılır.
4. Test hazırlığı mümkünse API ile, kullanıcı davranışı UI ile doğrulanır.
5. Bir test başka bir testin oluşturduğu veriye veya çalışma sırasına bağımlı olamaz.
6. Sabit bekleme (`page.waitForTimeout`) kullanılamaz.
7. `test.only` commit edilemez. `test.skip` kalıcı çözüm veya flaky gizleme aracı değildir.
8. Yerel ESM importlarında `.js` uzantısı yazılır.
9. `.env`, `playwright/.auth`, müşteri verisi, token, cookie ve şifre okunmaz,
   loglanmaz veya commit edilmez.
10. Var olan kullanıcı değişiklikleri korunur; görev dışı dosyalar geri alınmaz.

## Keşif tamlığı ve doğrulama-anı standardı

Bir sayfa/bölüm için "keşif tamamlandı" demeden önce yalnızca ilk açılış görünümü
değil, aşağıdaki durumların tamamı gözlemlenir ve keşif notunda
`Keşif kapanış matrisi` başlığı altında **Kapsandı** veya açık **N/A: gerekçe**
olarak kaydedilir:

- varsayılan/veri-dolu durum;
- seçim sonrası beliren kontroller (satır checkbox'ı, çoklu seçim, toplu-eylem çubuğu);
- hover/focus ile beliren kontroller;
- her `...`/kebab/context menüsü ve açılan alt eylemler;
- dialog/drawer/expanded/detail durumları;
- boş, loading, hata ve yetkisiz durumlar (güvenle üretilebildiği ölçüde);
- masaüstü/tablet/mobil ve desteklenen dört dil; Arapça RTL.

Bir durum gerçekten yoksa sessizce atlanmaz; `N/A: <gözlemlenmiş gerekçe>` yazılır.
Kontrol envanteri, görünen erişilebilir `role + name` ile not edilir. Yeni bir
kontrol sonradan bulunursa önce keşif matrisi ve kontrol matrisi güncellenir; paket
"tamamlandı" diye kapatılmaz.

Negatif sonuç ancak çevre UI'ın ve veri isteğinin tamamlandığı kanıtlandıktan sonra
geçerlidir. Boş liste, görünmeyen öğe veya eski metin; hedef başlık/ana konteyner
render olmadan ve ilgili response/kararlı UI sinyali beklenmeden assertion yapılamaz.
Baş harf/avatar gibi kısmi eşleşme, tam iş kimliği yerine kullanılamaz.

## Mutasyon ve orphan-sıfır standardı

- Her `@mutation` spec'i `test.describe.configure({ retries: 0 })` içerir. Resmî
  mutation lane'leri ayrıca `--retries=0 --workers=1` ile çalışır; validator ikisini
  de zorlar.
- Ham `cleanup` fixture'ı kullanılmaz. `testEntity.cleanup` rollback'i mutasyondan
  **önce** kaydeder; create + rollback sırasını yapısal garantiye almak için
  `testEntity.create({ label, key|prefixNaReason, baseline, cleanup, action })`
  zorunludur.
- Cleanup hatası test zaten kırmızı olsa bile yutulmaz; `KRİTİK ALTYAPI HATASI`
  olarak koşuyu başarısız bırakır ve `cleanup-errors.json` üretir. Cleanup içinde
  boş `.catch(() => {})` yasaktır.
- Üretilen veri benzersiz ve ayrılmış otomasyon öneki taşır. Test başlangıcı ve
  sonunda ilgili önek/sayaç baseline'ı doğrulanır; doğrulanamıyorsa mutasyon
  etkinleştirilmez.
- `npm run report:orphans`, kimliği doğrulanan ayrılmış staging tenant'ında
  dashboard, scheduled report, contact ve WFM vardiya baseline'larını salt-okunur
  tarar. Tarama hiçbir create/edit/delete çağrısı yapmaz; normal/prod lane'lerinden
  `@mutation` kilidiyle ayrılır.
- Production mutasyonu teknik olarak yasaktır; izin bayrağıyla açılamaz. Mutasyon
  yalnız `TEST_ENV=staging`, production dışı app/API origin'leri ve gerçek
  `/api/v1/auth/me` response'u ile doğrulanan `MUTATION_TENANT_ID` +
  `MUTATION_TENANT_SLUG` eşleşmesinde çalışır.
  Her spec ilk yazma işleminden önce `await mutationGuard(...)` çağırır. Teardown
  önce salt-okunur prova ile kanıtlanmadan create/modify/delete akışı açılmaz.

## Katman sınırları

- `*.spec.js`: Yalnızca iş davranışı, adımlar ve iş sonucu assertion'ları.
- `tests/pages`: UI seçicileri ve ekran etkileşimleri.
- `tests/pages/AppShell.js`: Header, sidebar ve global uygulama kontrolleri.
- `tests/contracts`: Görünür ürün/navigasyon sözleşmeleri.
- `tests/fixtures`: App, API, cleanup, rol ve diagnostics bağımlılıkları.
- `tests/api`: API endpoint davranışları ve test verisi işlemleri.
- `tests/data`: Paralel çalışmaya uygun benzersiz veri fabrikaları.
- `config`: Ortam, rol ve güvenlik politikası.

Spec içinde tekrar eden bir seçici görüldüğünde yeni kopya eklenmez; ilgili Page
Object veya ortak component güncellenir. Bir iş kuralı Page Object'a taşınmaz.

## Seçici politikası

Öncelik sırası:

1. `getByRole` ve erişilebilir isim
2. `getByLabel`
3. Ürün ekibiyle sözleşmeli `data-testid`
4. Stabil iş anahtarı

CSS sınıfı, DOM sırası ve görsel implementasyon ayrıntısı son çare değildir;
kullanılmamalıdır. Kritik kontroller için frontend ekibinden `data-testid`
istenir.

## İnteraktif kontrol testi standardı (3 katman)

Her buton, toggle, seçici veya benzeri interaktif kontrol **en az 3 katmanda**
doğrulanır. Her katman, başlığında katmanı belirten **ayrı** bir test'tir:

- **L1 — Tıklama OK:** Kontrol görünür/etkin, etkileşim çalışıyor ve UI
  **gözlemlenebilir tepki** veriyor (toggle durum değişir, menü açılır, değer
  güncellenir, bilgilendirme/toast çıkar).
- **L2 — Arka plan OK:** Etkileşim **doğru backend ucunu** tetikliyor
  (method + endpoint + 2xx). Veri değiştiren istek `page.route` ile yakalanır
  (prod'a yazılmaz); salt-okunur işlem `waitForRequest` ile beklenir.
- **L3 — Görev OK:** Kontrol **amacını gerçekten** yerine getiriyor
  (gözlemlenebilir son durum: tema uygulanır, tam ekran, veri/saat güncellenir,
  kaydırma olur, kayıt kalıcı olur).

Kurallar:

- Bir katman kontrol için **gerçekten yoksa** (saf istemci-tarafı davranış → L2 yok)
  veya **prod'a yazmadan güvenli doğrulanamıyorsa** (kalıcı kayıt → L3 mutation),
  test uydurulmaz; spec içinde ve keşif raporunda **açık "N/A" gerekçesiyle** belgelenir.
  Sessizce atlanmaz.
- Kontrolün amacı **çalışmıyorsa** ilgili katman `test.fail` (bilinen hata) ile bırakılır;
  düzelince "beklenmedik geçiş" verir → `test.fail` kaldırılıp kalıcı guard olur.
- `test.fail()` **ilgili test'in içine** yazılır; `describe` gövdesinde çıplak çağrı o
  gruptaki **tüm** testleri "başarısız olmalı" işaretler.
- Durum sinyali **semantikse** (`aria-pressed`, `aria-expanded`, `role`, erişilebilir isim)
  o kullanılır. Semantik sinyal yoksa frontend'den `data-testid`/semantik durum istenir;
  CSS sınıfı yalnızca son çaredir ve bir `data-testid` talebiyle birlikte not edilir.
- **Navigasyon/gezinme kontrolleri** (link, kart, menü öğesi, ayrı sayfaya götüren
  sekme) için **L3 yalnızca URL/rota değişimini değil, hedef sayfanın gerçekten
  yüklendiğini** de doğrular: hedefin beklenen başlığı/kimlik öğesi **görünür**
  olmalı. URL doğru olsa bile sayfa boş, 404 veya hatalı olabilir → L3 gözlemlenebilir
  son durumu (içerik render'ı) kanıtlar, salt URL eşleşmesi "baştan savma" sayılır.
  Bu, **ileride eklenecek sayfalar dahil** tüm gezinme kontrolleri için geçerlidir.
  Ortak yardımcı: `helpers.js` → `assertDestinationLoaded(page, { path, heading })`
  (rota + oturum + başlık). `tools/validate-architecture.mjs` bu kuralı statik
  zorlar: `waitForURL`/`page.url()` kullanan bir spec, başlık/`assertDestinationLoaded`
  doğrulaması da içermelidir. Beklenen başlıklar canlıdan gözlemlenir (uydurulmaz).
- **L3 = "çalışıyor" DEĞİL "DOĞRU çalışıyor":** L3 yalnızca bir şeyin *olduğunu* değil,
  sonucun **doğru** olduğunu da doğrular. Filtre → yalnızca "istek gitti" değil, dönen/gösterilen
  kayıtların hepsi seçilen ölçüte **uyuyor** mu (mümkünse sunucu yanıtı okunarak). Arama →
  yalnızca eşleşen görünüp eşleşmeyen gizleniyor mu. Analiz/hesaplama → sonuç **anlamlı/beklenen**
  mi. "Bir tepki oldu" yeterli değildir; **doğruluğu** kanıtlanır.
- **Görünüm tutarlılığı (view-consistency):** Bir detay panelinin / drawer'ın / genişletilmiş
  görünümün / satır→detay geçişinin verisi, **kaynak satır/kartın** gösterdiğiyle **tutarlı**
  olmalı (ad, durum, sayaç, kuyruk vb. eşleşir). Aynı veriyi iki yerde farklı göstermek bulgudur.

Referans uygulama: `tests/supervisor-wallboard.authed.spec.js`
(+ `docs/supervizor-panosu-kesif/NOTLAR.md` — 3 katmanlı kontrol matrisi),
`tests/supervisor-agents.authed.spec.js` (satır→detay tutarlılığı + filtre doğruluğu).

## İçerik ve değer derinliği standardı

Bir kontrolün "göründüğünü" doğrulamak yeterli değildir; **gerçek içeriği/değeri**
render ettiği de doğrulanır. Aksi halde bozuk bir panel/metrik "etiketi durduğu
için" yeşil kalır.

- **Sekme (tab) testi:** `aria-selected='true'` + o sekmeye **özgü panel içerik
  imzası** (bir başlık/etiket/buton) görünür olmalı. Yalnız "sekme görünüyor" veya
  yalnız `aria-selected` yeterli değildir. Referans: `tests/workforce.authed.spec.js`
  (sekme içerik imzaları), `tests/settings.authed.spec.js`, `tests/reports.authed.spec.js`.
- **KPI / metrik / grafik:** etiketin yanında **bir değer** (sayı, %, tutar, saat
  veya açık boş-durum işareti) doğrulanır. Ortak yardımcı: `helpers.js` →
  `expectMetricHasValue(page, label)`. Mümkünse **boş-durum ile veri-durumu**
  ayrımı yapılır (referans: `contacts`/`tickets` arama sayıları, liste boş-durumları).
- Değer canlı/oynak olduğunda tam sayı assert edilmez; **bir değerin varlığı**
  (desen eşleşmesi) doğrulanır. Gerçekten gözlemlenemeyen durum açık **N/A** ile belgelenir.

## Çok dilli (i18n) doğrulama standardı

Bir sayfa veya bölüm test edilirken görünür metin **desteklenen dört dilde**
doğrulanır: 🇬🇧 `en` · 🇹🇷 `tr` · 🇫🇷 `fr` · 🇸🇦 `ar`. Amaç, bir güncelleme çeviriyi
bozduğunda testin kırmızıya dönmesi ve **hangi dilde** koptuğunun görünmesidir.

- **Kapsam:** Başlık/alt başlık, buton ve sekme etiketleri, bölüm başlıkları,
  boş-durum metinleri ve oluşturma formu/dialog başlıkları her dilde beklenen
  çeviriyle eşleşmeli.
- **Yön (RTL):** Arapça'da `html[dir]` (veya `body` direction) `rtl` olmalı ve
  düzenin aynalandığı doğrulanır.
- **Sızıntı = bulgu:** Bir arayüz metni bir dilde kaynak dilde (İngilizce) kalıyorsa
  **veya** bir **iç/teknik terim** (altyapı, veritabanı, servis adı vb.) son
  kullanıcıya görünüyorsa, bu bir **çeviri/sızıntı bulgusudur**; keşif raporunda
  belgelenir ve düzelene kadar `test.fail` (bilinen hata) guard'ı ile işaretlenir.
  Düzelince "beklenmedik geçiş" verir → `test.fail` kaldırılıp kalıcı guard olur.
- **Veri ≠ çeviri:** Kart adları, kişi/kuyruk isimleri, metrik kısaltmaları (SLA,
  ASA) gibi **veri/isim** alanları çeviri sızıntısı sayılmaz.
- **Mekanik:** Dil taze bağlamda İngilizce açılır ve kenar çubuğu dil düğmesinden
  **tek switch** ile değiştirilir (ardışık switch güvenilmez). Yalnızca gerçekten
  gözlemlenen çeviriler assert edilir — doğrulanmamış çeviri uydurulmaz.

Referans uygulama: `tests/workforce.authed.spec.js`,
`tests/analytics.authed.spec.js` (+ `docs/analitik-kesif/NOTLAR.md` — 4 dil i18n
tablosu ve çeviri bulguları).

## Responsive / taşma ve erişilebilirlik standardı

- **Yatay taşma:** Test edilen bir bölüm, en az masaüstü/tablet/mobil genişliklerde
  (ve dizin RTL ise Arapça'da) **document düzeyinde yatay kaymamalı**. Ortak yardımcı:
  `helpers.js` → `assertNoHorizontalOverflow(page)` (ve teşhis için `scanOverflow`).
  Gerçek bir yatay taşma bir **bulgu**dur; düzelene kadar `test.fail` ile işaretlenir.
- **Erişilebilirlik (axe):** Test edilen her bölüm `severeA11yViolations(page)` ile
  taranır (WCAG2A/AA, ciddi/kritik; bilinen borç `A11Y_KNOWN_DEBT` hariç). Yeni bir
  ciddi ihlal **hard failure**dır. Bir sayfada halihazırda bilinen (borç dışı) ciddi
  ihlal varsa, o sayfanın a11y testi düzelene kadar `test.fail` (bilinen hata) ile
  işaretlenir — sessizce kapsam dışı bırakılmaz. Referans: `tests/a11y.authed.spec.js`.
- **İkon-only butonlar:** Yalnızca ikon içeren interaktif kontroller (görünüm toggle,
  satır aksiyon ikonları, ⋮ menü vb.) **erişilebilir isim** taşımalı (`aria-label`;
  yalnızca `title` yetersizdir — `button-name` ihlali). Test bunları tercihen role+isimle
  hedefler; isim yoksa bu bir a11y **bulgu**sudur (mevcut `button-name` borcuyla ilişkili)
  ve frontend'den `aria-label`/`data-testid` istenir. CSS/ikon seçici yalnızca son çaredir.

## Sessiz hata / zaman / form-gönderim standartları

- **Sessiz hata yok:** Kritik `@smoke` akışlarında sayfa **console-error / başarısız
  istek / HTTP 5xx** üretmemeli. Altyapı hazır: `diagnostics` fixture'ı bunları toplar;
  test `diagnostics.assertClean(allowlist)` ile doğrular. Bilinen zararsız gürültü
  (ör. Next.js `_rsc` prefetch iptalleri) varsayılan allowlist'te; her yeni allowlist
  girdisi gerekçeli olmalı. Gerçek bir sessiz hata **bulgu**dur (`test.fail`).
- **Zaman/saat (timezone):** Kullanıcıya görünen tüm saat/tarih **yerel saat diliminde**
  gösterilmeli (sunucu UTC'sini çevirmeden basmak = bulgu). Ortak yardımcı: `helpers.js`
  → `assertLocalClock(page, clockText)`; test UTC olmayan bir timezone'da koşturulur
  (`test.use({ timezoneId })`). Referans: wallboard BULGU 4, agents "Last refreshed".
- **Form gönderim sonucu:** Bir oluşturma/düzenleme formu test edilirken ya submit
  **sonucu** (başarı/validasyon/hata/toast) doğrulanır ya da prod-mutation güvenliği
  nedeniyle açık **N/A** gerekçesiyle belgelenip mutation testine (staging) bırakılır.
  "Form yalnızca açılıyor" tek başına yeterli bir L3 değildir.

## Teşhis ve izleme (Tracing) standardı

Bir **bug bulunduğunda veya davranış şüpheli** olduğunda, kök nedeni netleştirmek için
**Playwright Tracing (Trace Viewer)** kullanılır — giden/gelen tüm ağ paketleri (istek+yanıt
gövdeleri), DOM anlık görüntüleri, konsol ve adım adım zaman çizelgesi. Amaç yüzeysel
"çalışmıyor" demek değil, **paket düzeyinde kök nedeni bulmaktır**.

- **Otomatik (zorunlu):** Trace **başarısızlıkta otomatik** üretilir — `playwright.config.js`
  → `trace: 'retain-on-failure'` (ayrıca `video`/`screenshot: retain/only-on-failure`). Yani
  bir test kırmızıya döndüğünde (regresyon/bulgu) trace kendiliğinden `test-results/`'a düşer
  ve HTML raporundan açılır. Bu ayar **kapatılmaz/zayıflatılmaz**. Açmak:
  `npx playwright show-trace <trace.zip>` (ya da trace.playwright.dev).
- **Şüpheli ama test henüz kırmızı değilse (aktif teşhis):** İncelemeyi tracing AÇIK yaparız —
  `helpers.js` → `traceInvestigation(context, name, async () => { ... })` sarmalayıcısı trace'i
  `test-results/investigations/<name>.zip`'e kaydeder. Ek olarak istek/yanıt gövdeleri
  `page.on('request'|'response')` ile loglanır.
- **Kök-nedeni katmanlara ayır:** (1) frontend'in gönderdiği istek doğru mu — gerekirse
  `route` ile **sunucuya ulaşmadan** yakala (mutasyonsuz); (2) sözleşmeye uyuyor mu — Vomenta
  **public OpenAPI spec'i** `api.vomenta.com/api/docs-json` ile karşılaştır; (3) sunucu yanıtı
  ne diyor (salt-okunur uçlarda tam yanıt; mutasyonlarda staging). Böylece "frontend mi backend mi"
  ayrımı kanıtlanır.
- **Güvenlik:** Teşhis prod'da **mutasyon tetiklemez**; veri değiştiren istekler `route` ile
  bloklanır/yakalanır, gerçek yürütme staging'e bırakılır.

Referans: agents "Force" kök-neden incelemesi (frontend isteği = OpenAPI DTO ile birebir →
sunucu reddi) ve `analyze-trace.zip` (detect-anomaly paket doğrulaması).

## Artifact secret/PII güvenliği standardı (WP-01)

Testler production'a karşı koşar; hiçbir artifact'te (trace, video, screenshot,
`attach` çıktısı, console) token, Authorization, cookie, e-posta, telefon, provider
key veya müşteri verisi açık kalamaz.

- **Ham `testInfo.attach(...)` yasak.** Bunun yerine `artifacts.safeAttach(name, { json | body, contentType })`
  kullan — body maskelenmeden (`redactDeep`/`redactText`) eklenmez. Sert kapı:
  `quality:artifact-safety` her `*.spec.js`'i statik tarar (istisna: kendi pipeline'ında
  maskeleyen `tests/discovery/discovery.spec.js`).
- **Ekran görüntüsü:** `artifacts.safeScreenshot(name, { mask: [...] })` ile al; kimlik içeren
  yüzeylerde (Settings/Profile, header kullanıcı menüsü) PII locator'larını `mask`'e ver.
- **Ortak maskeleyici:** `tests/fixtures/sanitize.js` (`redactText/redactUrl/redactHeaders/redactDeep`
  + tarayıcı `findSecrets`). `diagnostics` de buna delege eder. Yeni maskeleme mantığı buraya eklenir.
- **Sınır:** serbest-form kişi adı otomatik maskelenmez (aşırı-maskeleme riski); isim PII'si
  ekran maskesi veya alan-bazlı redaksiyonla korunur. Detay: `docs/adr/0006-artifact-secret-sanitizer.md`.
- **Kendi kodun token loglamaz.** Voice WS gibi kimlik taşıyan akışlarda `console.log`/ham attach
  ile secret'a dokunma; diagnostics zaten yakalar ve maskeler.

## Bilinen-bulgu forensik modu (WP-R3)

Açık bir bulgunun kök-neden incelemesi için, beklenen-başarısızlık kontratını GEÇİCİ
olarak kaldırıp gerçek başarısızlığı (trace/screenshot/ağ özeti) yakalayan salt-okunur akış.

- **Komut:** `npm run report:bug -- <ID>` (ör. `B4`). Registry'den testi çözer, YALNIZ o
  testi `FORENSIC_BUG=<ID>` ile koşar → `knownBugGuard` `test.fail()` uygulamaz → bulgu gerçek
  sonucuyla çalışır. Çıktı yalnız `test-results/findings/<ID>/` altına yazılır.
- **Env yalnız helper/tool katmanında okunur** (`FORENSIC_BUG`); spec'lere `process.env` dağıtılmaz.
  Aynı anda tek bulgu; CLI id ≠ `FORENSIC_BUG` → hard failure.
- **Registry ASLA değişmez.** Otomasyon kök-neden UYDURMAZ: `possibleCauses=[]`,
  `rootCauseCandidate=null`; yalnız deterministik/gözlemlenebilir `technicalEvidence` doldurulur.
  `candidate-update.json` yalnız insan-inceleme önerisidir.
- **Güvenli kanıt paketi:** `network-summary.json` (yalnız method + normalize path + status +
  süre + tip + hata kodu; header/cookie/token/body YOK), `safe-final-state.png` (header kimlik
  yüzeyleri capture anında maskeli), `metadata.json`, `candidate-update.json`.
- **Trace lokal-only:** trace binary/sıkıştırılmış kaynakları text-sanitizer ile tam
  kanıtlanamaz → `scanTraceZip` ile taranır ama **CI'a YÜKLENMEZ**. Video production forensikte
  **kapalı** (`FORENSIC_BUG` set iken `video:'off'`).
- **Upload güvenlik kapısı:** `npm run report:artifact -- <ID>` yalnız allowlist'teki
  (JSON+PNG) dosyaları `<ID>/upload/` altına kopyalar; sızıntılı JSON / geçersiz PNG /
  allowlist-dışı dosya → non-zero exit → CI upload step'i çalışmaz. Ham `test-results/` yüklenmez.
- **Nightly reconcile:** `npm run report:reconcile -- <results.json>` beklenmedik geçişleri
  bulur ve YALNIZ `fixed-candidate` önerisi (`fixed-candidates.json`) üretir — registry değişmez,
  bug kapanmaz. Tek geçiş "verified fixed" değildir; kapanış WP-R4 kapsamıdır.
- **Sert kapı:** `quality:forensic` (`quality:check` zincirinde) tüm bu kontratları negatif
  self-check'lerle kanıtlar. Detay: `docs/adr/0007-known-bug-forensic-mode.md`.

## Bug fix verification & regresyon koruması (WP-R4)

Bir `fixed-candidate`'in (WP-R3 reconcile/forensik `unexpected-pass` sinyali) gerçekten
düzeldiğini KANITA DAYALI, çok-koşulu, insan-onaylı biçimde doğrulayan salt-okunur mekanizma.
**Tek geçiş "verified-fixed" DEĞİLDİR.** Bu mekanizma hiçbir finding'i kapatmaz.

- **Komut:** `npm run report:verify -- <ID>` — tek bağımsız doğrulama koşusu (forensik mod,
  `retries=0`, read-only) + attestation üretir; tüm attestation'ları eşiğe göre birleştirip
  `test-results/findings/<ID>/verification/verification-report.json` yazar.
- **Bağımsız başarılı koşu** = `result=pass` + ilk-denemede-pass + `retries=0` + `profileVerified`
  + `freshLogin` + `production-readonly` + ayrı `workflowRunId` + registry fingerprint sabit.
- **Eşik:** ≥3 farklı run + ≥2 ayrı takvim günü. Arada reproduce/infra-error/profil-uyuşmazlığı/
  retry-pass → seri sıfırlanır. Sonuç durumları: `candidate` · `insufficient-evidence` ·
  `verified-fixed-proposal` · `reproduced` · `inconclusive` · `infra-error`.
- **`verified-fixed-proposal` YALNIZ öneridir** — registry değişmez, guard kaldırılmaz, bug
  kapanmaz. Kapanış (`open→closed`, `knownBugGuard→permanent`, `test.fail` kaldırma) yalnız
  **insan onaylı ayrı PR** ile (B8 modeli).
- **Profil kısıtı (ör. B4):** `tests/contracts/verification-profiles.js` (registry ŞEMASI DEĞİL)
  bulgunun orijinal rol/izin bağlamını tanımlar; koşu izin ucunu YALNIZ okur, scope-anahtarlarını
  çıkarır (gövde yazılmaz), eşleşmezse `inconclusive`. Şema (`verifiedAt`/`closedAt`) EKLENMEDİ.
- **Güvenlik:** `report:verify` yalnız `verification-report.json`+`profile.json`+`attestations/*.json`
  (secret-taramalı) yükler; registry fingerprint değişirse hard failure; ham `test-results/` yok.
- **Sert kapı:** `quality:verify` (`quality:check`'te) tüm kuralları negatif self-check'lerle kanıtlar.
  Detay: `docs/adr/0008-bug-fix-verification.md`.

## Güvenli CI artifact allowlist (WP-SEC-B)

Hiçbir CI job'ı ham çıktı yükleyemez. Bütün `actions/upload-artifact` adımları
YALNIZ önceden hazırlanmış, doğrulanmış bir bundle'a bakar.

- **Tek politika:** `tools/artifact-policy.mjs` (9-lane enum + exact output allowlist
  + limitler + fail-closed FS + atomik `finalizeBundle` + manifest + stabil rule ID).
  forensic/verification allowlist'leri `forensic-lib.mjs`'den import edilir (tek kaynak).
- **Preparer:** `npm run report:artifact:prepare -- --lane <lane>` özet lane'leri için
  Playwright JSON raporundan güvenli `summary.json` + yeniden üretilmiş `junit.xml`
  (system-out/err/stack/env YOK) + `summary.html` (HTML-escape, script/asset YOK) +
  `manifest.json` üretir → `test-results/secure-upload/<lane>/`. Ham `playwright-report/`
  veya ham/genel `test-results/` **hiçbir** upload path'inde olamaz.
- **Trace/video/screenshot:** `*.zip`/`*.webm`/`*.mp4` ve ham baseline/actual/diff PNG
  CI upload = DENY (lokal-only). Runtime trace/video üretimi (yukarıdaki tracing
  standardı) ZAYIFLATILMAZ; üretilse bile bundle'a girmez.
- **Workflow kuralı:** her secure upload `prepare` step'inin `ready=true` çıktısına ve
  `if-no-files-found: error`'a bağlıdır; `continue-on-error` ile yumuşatılamaz. Yeni bir
  ham upload eklenirse `quality:artifact-allowlist` (yapısal YAML parser) CI'ı düşürür.
- **Sert kapı:** `quality:artifact-allowlist` (`quality:check` zincirinde) politika
  negatif matrisini + workflow statik enforcement'ını kanıtlar. Detay:
  `docs/adr/0009-artifact-allowlist.md`.

## PR değişiklik-etkisi seçici (WP-CI-E1)

Bir PR'da değişen dosyalardan hangi gerçek testlerin koşması gerektiğini
deterministik ve **fail-closed** çıkaran motor `tools/pr-impact-lib.mjs`'tir;
CLI `tools/plan-pr-impact.mjs` (`npm run ci:impact:plan`) planı
`test-results/pr-impact/selection.json`'a yazar. Karar sırası: (1) spec-köklü
ters import grafiği, (2) yol-tabanlı sınıflandırma, (3) eşlenemeyen runtime
dosyasında geniş güvenli fallback ya da non-zero. Detay:
`docs/adr/0010-pr-impact-selection.md`.

Bağlayıcı kurallar:

- Değişen bir spec doğrudan; onu import eden page object/fixture/helper transitif
  olarak seçilir. `tests/pages/App.js` barrel'ı + ortak fixture yüzünden herhangi
  bir page object değişikliği neredeyse tüm authed suite'e yayılır (fail-safe:
  fazla seçer, kaçırmaz).
- Mutation spec'leri (`*.mutation.*` / `*-mutations.*` / `mutation-orphans`)
  production seçimine GİRMEZ; `STAGING_BLOCKED` raporlanır. Güvenlik ayrıca
  `grepInvert: /@mutation/` ile bağımsız garantidir.
- `selectedRunnableSpecCount=0` durumları ayrılır: docs/ci/visual →
  `NO_RUNTIME_REQUIRED`; yalnız mutation → `STAGING_BLOCKED`; eşlenemeyen runtime
  → `UNMAPPED_RUNTIME_CHANGE` (non-zero); eksik/shallow kaynak → `SOURCE_MISSING`
  (non-zero). Sessiz boş liste yasak.
- **Sert kapı:** `quality:ci-impact` (`quality:check` zincirinde) 21 sentetik
  vakayı production çağrısı yapmadan doğrular. Motor değişikliği bu self-check'i
  düşürmeden yeşil olamaz.

### Runner + workflow enforcement (WP-CI-E2)

Seçici planı gerçek koşuya `tools/run-pr-impact.mjs` (`npm run ci:impact:run`)
bağlar; kararlar saf `tools/pr-impact-runner-lib.mjs`'tedir. `.github/workflows/
playwright.yml` içindeki `pr-impact` job'ı planner + runner'ı çağırır ve runner
exit-code'uyla gate edilir. Detay: `docs/adr/0011-pr-impact-runner-enforcement.md`.

Bağlayıcı kurallar:

- Runner EXACT spec/fallback gruplarını güvenli argument array'iyle (shell
  interpolation YOK) Chromium'da koşar; setup/dependency testleri hedef sayıdan
  ayrı sayılır. `sourceMissing`/unmapped/bozuk-plan → REFUSE (non-zero).
- 0-test (exact grup koşu raporunda hedef projede 0 test), eksik spec dosyası,
  `unexpected>0`, `flaky>0` veya herhangi bir grubun non-zero'su → genel exit
  non-zero. Koşu `--reporter=json` ile (config'i override; `--list` JSON yazmaz).
  `--retries=0`; flaky başarıya çevrilmez. grep-only fallback 0-test'i uyarıdır.
- Mutation son savunması: her gruba `--grep-invert=@mutation` + seçili dosya
  mutation spec ise REFUSE. Üç katman (dosya-adı + config `grepInvert` + runner).
- **Sert kapılar:** `quality:ci-runner` (8 negatif kanıt §2.6 non-zero) +
  `quality:ci-workflow` (12 yapısal YAML kuralı) `quality:check` zincirindedir.
  Runner/workflow değişikliği bunları düşürmeden yeşil olamaz.
- Negatif kanıt PRODUCTION'a karşı kasıtlı hata ÜRETMEZ: saf mantığa sentetik
  gözlem enjekte edilir. YAML enforcement metin araması değil, yapısal parse'tır.

## Test sınıfları (kanonik etiket kaydı)

Etiketler **yalnızca** bu kayıttan seçilir. Kayıt dışı etiket `tools/style-coverage.mjs` ile reddedilir.

**Risk / yapı:**
- `@smoke`: Temel kullanılabilirlik, kısa PR paketi.
- `@critical`: Release'i durduracak müşteri/operasyon davranışı.
- `@regression`: Genel regresyon; interaktif kontrol 3-katman testleri burada.
- `@mutation`: Veri değiştirir; production'da yasaktır (guard + yaşam döngüsü zorunlu).
- `@known-bug`: Açık bulgunun `test.fail` guard'ı.
- `@public`: Giriş gerektirmeyen (login) testi.
- `@route-baseline`: Kayıtlı HER rota için tek read-only açılış tabanı (WP-MORNING Faz 1,
  `registered-routes-smoke.authed.spec.js`). Feature/derin testin yerine geçmez; `[route:/x]`
  işaretiyle envanter ↔ test birebirliği `tools/self-check-routes-baseline.mjs` ile zorlanır.

**Runtime rapor motoru** (WP-MORNING Faz 2): `npm run report:runtime` (=`tools/generate-runtime-report.mjs`)
Playwright'ın GERÇEK JSON koşum sonucundan (statik `--list` DEĞİL) yönetici + makine-okur teslim
dosyalarını üretir: `docs/raporlar/{TEST-SONUCLARI.json, SAYFA-TEST-SONUCLARI.md, SABAH-KALITE-OZETI.html,
SABAH-TESLIM-MANIFEST.json}`. Her kayıtlı rota tek nihai durum alır (PASS/FAIL/FLAKY/BLOCKED/NOT_RUN;
toplam = kayıtlı rota). Sonuç bir rotaya YALNIZ exact `[route:/x]` işaretiyle bağlanır (işaretsiz test
sahte PASS üretemez → `unmappedTests`). FAIL olsa bile rapor üretilir + exit 0; kaynak yok / geçersiz
JSON / 0 seçilen test / sızıntı / stale girdi → non-zero. Sert kapı: `npm run quality:runtime-report`
(=`tools/self-check-runtime-report.mjs`, tamamen sentetik) `quality:check` zincirindedir. Not: HTML
`docs/raporlar/*.html` gitignore'lu artifact; MD/JSON teslim snapshot'ı Faz 3 gerçek koşumunda commit edilir.

**Test stilleri** (bkz. "Zorunlu test stilleri"): `@i18n` `@a11y` `@layout` `@visual`
`@errorpath` `@clean` `@perf` `@keyboard` `@deeplink` `@data` `@export`.

Retry'da geçen test flaky'dir. CI'da başarı sayılmaz ve gizlenemez.

## Zorunlu test stilleri

Test edilen **her sayfa/bölüm**, aşağıdaki stilleri arketipine göre **ya kapsar ya da açık
"N/A: gerekçe" ile beyan eder**. Sayfa `tests/contracts/tested-pages.js`'e tescil edilir;
`tools/style-coverage.mjs` eksik stili **sert kapıyla** reddeder (deterministik; canlı koşum yok).
Böylece gelecekteki her yeni sayfa aynı standardı otomatik dayatır. El kitabı: `docs/TEST_STYLES.md`.

**Baseline (HER sayfa; N/A olamaz):**
- `@smoke` yapı · `@i18n` 4-dil (en/tr/fr/ar) + RTL + çeviri/iç-terim sızıntısı · `@a11y` axe ciddi/kritik
  ihlal yok (bilinen borç hariç) · `@layout` mobil/tablet/masaüstü + RTL yatay-taşma yok · `@clean`
  console/ağ hatası yok (allowlist dışı) · `@deeplink` rota doğrudan açılır · `@regression` her
  interaktif kontrol 3-katman (L1/L2/L3).

**Koşullu (arketip varsa ZORUNLU, yoksa N/A-beyan):**
- `@keyboard` — diyalog/menü/sekme varsa (odak tuzağı, Escape, klavye gezinme).
- `@errorpath` — API'den veri çekiyorsa (`mockApi` ile 500/boş/abort → zarif hata/boş durum).
- `@visual` — kararlı UI varsa (diyalog/boş-durum/düzen; canlı bölge `mask`; darwin, CI'da atla).
- `@perf` — grafik/ağır içerik yüklüyorsa (yükleme süresi bütçe altında).
- `@data` — sayısal KPI gösteriyorsa (yakalanan API yanıtı ↔ UI sadakati). Kaynak↔API doğruluğu (B)
  test dışıdır ve şu an açık — Vomenta backend erişimi gerekir (`docs/data-audit/`).
- `@export` — export/indirme varsa (dosya içeriği doğrula ya da coverage-exclusions ile N/A).
- `@mutation` — create/edit/delete/save varsa (ayrılmış tenant; guard + `testEntity.create`).

**Lane:** Deterministik stiller (`@i18n @a11y @layout @clean @deeplink @errorpath @keyboard` + 3-katman)
**her PR**'da koşar. Oynak/canlı stiller (`@visual @perf @data`) **gece** full-regression'da koşar;
sert kapı yalnızca **varlık/beyan**ı dayatır, koşumu değil → PR pipeline'ı kırılgan olmaz.

**Kurallar:**
- `tests/contracts/navigation.js` içindeki her ana rota `tested-pages.js` kapsamına
  otomatik olarak girmek zorundadır. `quality-baseline.authed.spec.js` testleri
  `[route:<path>]` kanıtı üretir; başka bir rota veya dosyadaki etiket bu rotayı
  yeşile çeviremez. Kayıtsız navigasyon rotası `quality:styles` kapısını kırar.
- Salt-okunur discovery crawler'ın ulaştığı kayıtsız bir rota da hard failure'dır.
  Böylece menü sözleşmesinde bulunmayan dinamik/alt sayfalar sessizce kapsam dışında
  kalamaz. Yeni rota önce `tested-pages.js` sözleşmesine ve zorunlu stillere alınır.
- Uygulanmayan koşullu stil `tested-pages.js`'te `naStyles` ile **açık gerekçeyle** beyan edilir
  (sessiz atlama yasak — 3-katman N/A kuralının aynısı).
- Bir stil bozuksa `test.fail` (`@known-bug`); düzelince kalıcı guard.
- Stil etiketi, ilgili primitifi kullanmalı (`validate-architecture.mjs`: `@a11y`→axe, `@visual`→
  `toHaveScreenshot`, `@clean`→`diagnostics.assertClean`, `@data`→`captureJson/waitForResponse`,
  `@errorpath`→`mockApi/route`, `@perf`→`expectContentWithin`).
- Ortak yardımcılar `tests/helpers.js`'te (a11y/layout/clean/errorpath/perf/keyboard/data) — her stil ~1 satır.
- **Cross-browser** yeni etiket değil: gece full-regression `firefox/webkit-authed` projelerinde koşar.
- PR lane'i ana rotaların salt-okunur baseline paketini Chromium'da `retries=0,
  workers=1` ile gerçekten çalıştırır; yalnız etiket varlığını kontrol etmek yeterli
  değildir. Görsel testler macOS nightly lane'inde `RUN_VISUAL_TESTS=true` ile
  gerçekten koşar; CI olduğu için sessizce skip edilemez.

Referans uygulama: `tests/reports-dashboards.authed.spec.js`, `tests/reports-sections.authed.spec.js`
(+ matris: `docs/TEST_STYLE_MATRIX.md`). Karar: `docs/adr/0002-mandatory-test-styles.md`.

## Yeni feature ekleme sırası

1. Gerekirse `tests/contracts` altında görünür sözleşmeyi ekle.
2. Page Object veya ortak component oluştur/güncelle.
3. `tests/pages/App.js` üzerinden fixture erişimi sağla.
4. Gerekirse feature API client ve veri fabrikası ekle.
5. Spec'i ortak fixture ile yaz.
6. Uygun risk etiketini ekle.
7. `npm run quality:check`, ilgili smoke ve critical paketi çalıştır.

## Zorunlu doğrulama

Her değişiklikte:

```bash
npm run quality:check
npm test
```

Girişli veya kritik davranış değiştiğinde ayrıca:

```bash
npm run test:smoke:auth
npm run test:critical
```

Mimari istisna gerekiyorsa kural sessizce delinmez. `docs/adr/` altında gerekçeli
yeni bir ADR eklenir ve `docs/TEST_ARCHITECTURE.md` güncellenir.
