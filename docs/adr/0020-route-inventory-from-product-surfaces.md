# ADR-0020 — Rota envanterini kanonik ürün yüzeyinden türet (kaynak migrasyonu)

- Durum: Kabul edildi (WP-SURFACE-MIGRATION / HANDOFF FAZ 3)
- Bağlam: ADR-0018 (kanonik `PRODUCT_SURFACES` registry) + ADR-0019 (surface completeness kapısı)
- Tarih: 2026-08-04

## Bağlam

FAZ 1 kanonik ürün yüzeyi registry'sini (`tests/contracts/product-surfaces.js`), FAZ 2
ise onu tüm gözlem kaynaklarıyla uzlaştıran fail-closed completeness kapısını ekledi.
Ancak `tests/contracts/registered-routes.js` hâlâ rota evrenini `tested-pages.js`
(TEST KAPSAMI İDDİASI) içinden türetiyordu. Bu döngüsel bağımlılık, kapsam sözleşmesi
olmayan bir ürün yüzeyinin üç matristen (registered-routes / style / surface-depth)
aynı anda **sessizce kaybolmasına** yol açıyordu.

## Karar

1. **`REGISTERED_ROUTES` artık `PRODUCT_SURFACES`'ten türetilir**, `TESTED_PAGES`'ten
   değil. `registered-routes.js` artık `tested-pages.js`'i İÇE AKTARMAZ (döngü kırıldı).
2. **Kapsam sözleşmeleri (`TESTED_PAGES`) kopyalanmış rota dizgeleri yerine kanonik
   `surfaceIds` referansları taşır**; `routes` alanı registry üzerinden fail-closed
   TÜRETİLİR (bilinmeyen surfaceId import anında patlar). Rota dizgesi tek bir yerde
   (registry) yaşar.
3. **`MAIN_NAVIGATION` kanonik registry'nin doğrulanan alt kümesidir**: import anında
   fail-closed kapı, nav path'lerinin registry'deki `navigation: 'main'` yüzeyleriyle
   birebir (ne fazla ne eksik) olmasını zorlar.
4. **Runtime baseline politikası** her yüzeye runtime-policy'sinden türetilir ve
   `registered-routes-smoke` testleri buradan beslenir (sahte PASS üretmeden):
   - `readonly-baseline` → RUNNABLE: gerçek read-only açılış tabanı testi (`@route-baseline`).
   - `fixture-required` / `readonly-blocked` / `staging-only` → BLOCKED: `test.fixme` +
     `@route-blocked` + reason code; **asla koşmaz, asla PASS olmaz**, ama envanterde görünür.
   - `routeKind: redirect` → REDIRECT: kaynak→hedef doğrulanır (`@route-redirect`); sessiz
     kök '/' PASS değil.
5. **Kritik koruma:** kanonik registry'de yer alan fakat kapsam sözleşmesi bulunmayan
   yüzey baseline envanterine girer ve raporda kırmızı/eksik (`NOT_COVERED` +
   boş sözleşme) olarak görünür — test kaydı olmadığı için **kaybolmaz**.

## Sonuçlar

- Ürün envanteri sayısı kapsam sözleşmesi sayısından bağımsızdır (71 yüzey vs 48 sözleşme).
- Kapsam sözleşmesi silinirse yüzey kaybolmaz; kırmızı eksik olur.
- Route baseline test sayısı runtime-policy ile açıklanabilir (runnable = readonly-baseline sayısı).
- Dynamic/blocked yüzey sahte PASS üretmez (`test.fixme`).
- Sabit rota sayıları (55/65) koddan/yorumlardan temizlendi; tüm sayılar türetilir.
- Faz 5 birleşik rapor motoru bu kanonik modeli tek girdi olarak kullanacaktır; bazı
  ikincil raporlar (executive / runtime / readonly-manifest) o fazda aynı modele bağlanır.
