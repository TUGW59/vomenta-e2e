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

Referans uygulama: `tests/supervisor-wallboard.authed.spec.js`
(+ `docs/supervizor-panosu-kesif/NOTLAR.md` — 3 katmanlı kontrol matrisi).

## Test sınıfları

- `@smoke`: Temel kullanılabilirlik, kısa PR paketi.
- `@critical`: Release'i durduracak müşteri/operasyon davranışı.
- `@mutation`: Veri değiştirir; production'da yasaktır.
- `@a11y`: Erişilebilirlik kontrolü.
- `@visual`: Görsel regresyon.

Retry'da geçen test flaky'dir. CI'da başarı sayılmaz ve gizlenemez.

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
