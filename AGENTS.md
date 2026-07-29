# Vomenta test deposu — bağlayıcı çalışma kuralları

Bu kurallar bu depoda çalışan bütün insan ve otomasyon ajanları için geçerlidir.
Amaç testlerin değişikliklere dayanıklı, güvenli ve teşhis edilebilir kalmasıdır.

## Değiştirilemez temel ilkeler

1. Spec dosyaları `test` ve `expect` değerlerini yalnızca
   `tests/fixtures/test.js` üzerinden alır.
2. Spec dosyaları doğrudan şifre, `process.env`, ortam URL'si veya storage-state
   yolu kullanmaz. Bunlar `config/environment.js` tarafından yönetilir.
3. Production ortamında veri oluşturan, değiştiren veya silen test yazılmaz.
   Mutasyon testleri `@mutation`, `mutationGuard` ve `cleanup` içermek zorundadır.
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
  `testEntity.create({ label, cleanup, action })` tercih edilir.
- Cleanup hatası test zaten kırmızı olsa bile yutulmaz; `KRİTİK ALTYAPI HATASI`
  olarak koşuyu başarısız bırakır ve `cleanup-errors.json` üretir. Cleanup içinde
  boş `.catch(() => {})` yasaktır.
- Üretilen veri benzersiz ve ayrılmış otomasyon öneki taşır. Test başlangıcı ve
  sonunda ilgili önek/sayaç baseline'ı doğrulanır; doğrulanamıyorsa mutasyon
  etkinleştirilmez.
- Production mutasyonu yalnız özel test tenant'ında, çift kilitle ve kanıtlanmış
  teardown yoluyla çalışabilir. Teardown önce salt-okunur prova ile kanıtlanmadan
  create/modify/delete akışı açılmaz.

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

## Test sınıfları (kanonik etiket kaydı)

Etiketler **yalnızca** bu kayıttan seçilir. Kayıt dışı etiket `tools/style-coverage.mjs` ile reddedilir.

**Risk / yapı:**
- `@smoke`: Temel kullanılabilirlik, kısa PR paketi.
- `@critical`: Release'i durduracak müşteri/operasyon davranışı.
- `@regression`: Genel regresyon; interaktif kontrol 3-katman testleri burada.
- `@mutation`: Veri değiştirir; production'da yasaktır (guard + cleanup zorunlu).
- `@known-bug`: Açık bulgunun `test.fail` guard'ı.
- `@public`: Giriş gerektirmeyen (login) testi.

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
- `@mutation` — create/edit/delete/save varsa (ayrılmış tenant; guard + cleanup).

**Lane:** Deterministik stiller (`@i18n @a11y @layout @clean @deeplink @errorpath @keyboard` + 3-katman)
**her PR**'da koşar. Oynak/canlı stiller (`@visual @perf @data`) **gece** full-regression'da koşar;
sert kapı yalnızca **varlık/beyan**ı dayatır, koşumu değil → PR pipeline'ı kırılgan olmaz.

**Kurallar:**
- Uygulanmayan koşullu stil `tested-pages.js`'te `naStyles` ile **açık gerekçeyle** beyan edilir
  (sessiz atlama yasak — 3-katman N/A kuralının aynısı).
- Bir stil bozuksa `test.fail` (`@known-bug`); düzelince kalıcı guard.
- Stil etiketi, ilgili primitifi kullanmalı (`validate-architecture.mjs`: `@a11y`→axe, `@visual`→
  `toHaveScreenshot`, `@clean`→`diagnostics.assertClean`, `@data`→`captureJson/waitForResponse`,
  `@errorpath`→`mockApi/route`, `@perf`→`expectContentWithin`).
- Ortak yardımcılar `tests/helpers.js`'te (a11y/layout/clean/errorpath/perf/keyboard/data) — her stil ~1 satır.
- **Cross-browser** yeni etiket değil: gece full-regression `firefox/webkit-authed` projelerinde koşar.
- Görsel testler macOS nightly lane'inde `RUN_VISUAL_TESTS=true` ile gerçekten
  koşar; CI olduğu için sessizce skip edilemez.

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
