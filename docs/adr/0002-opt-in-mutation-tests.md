# ADR-0002: Kullanıcı-onaylı (opt-in) mutation test kategorisi

- Durum: Kabul edildi
- Tarih: 2026-07-28
- İlgili: [ADR-0001](0001-playwright-test-platform.md) (production mutasyonları iki katmanla engellenir)

## Bağlam

3 katmanlı kontrol standardının **L3 (Görev OK)** katmanı bazı kontroller için
ancak **kalıcı kayıt** yazılarak doğrulanabilir (ör. İş Gücü'nde "Add Shift"
vardiya oluşturur, "Publish Schedule" çizelgeyi yayınlar). Bu, canlı panelde
gerçek bir mutasyondur; Publish ayrıca ajanlara bildirim gönderebilir.

AGENTS.md ilke 3 production'da sessiz mutasyonu yasaklar. Ayrılmış bir staging
tenant'ı henüz yoktur; kullanılan otomasyon hesabı bir **test hesabıdır**.
L3'ü tamamen atlamak yerine, mutasyonu **açıkça istendiğinde** ve **çift kilitle**
çalışan ayrı bir kategoriye alıyoruz.

## Karar

Mutasyon testleri `@mutation` etiketli ayrı bir kategoridir ve **çift kilitle**
korunur:

- **Kilit 1 — kategori izolasyonu:** `ALLOW_MUTATING_TESTS=true` yoksa `@mutation`
  testleri her ortamda ve CI'da tamamen dışlanır (`playwright.config.js`
  `grepInvert`). Normal koşular (`test`, `test:auth`, `test:regression`, `test:e2e`)
  ve CI bunları asla çalıştırmaz.
- **Kilit 2 — canlı onayı:** Production tenant'a yazmak için ayrıca
  `ALLOW_PROD_MUTATIONS=true` gerekir (`config/environment.js`
  `assertMutationsAllowed`, `mutationGuard` ile her testte). Aksi hâlde test
  fail-fast olur.

Çalıştırma komutları:

- `npm run test:mutation` — mutation kategorisini açar (staging için; production'da
  Kilit 2 nedeniyle fail-fast).
- `npm run test:mutation:prod` — canlı tenant'a bilinçli yazar (iki bayrak açık).

Ek zorunluluklar:

- Her `@mutation` testi `mutationGuard(reason)` ile başlar ve `cleanup` ile
  oluşturduğu kaydı geri alır (İş Gücü: `DELETE /api/v1/wfm/schedules/{id}`).
- Mutation testleri yalnızca **ayrılmış bir test hesabına/tenant'ına** karşı
  çalıştırılır (bkz. AGENTS.md ilke 3). Otomasyon gerçek bir müşteri hesabına
  yöneltilmez.
- Bir ayrılmış staging tenant'ı sağlanınca (`BASE_URL`), Kilit 2 gerekmez ve
  mutation'lar orada güvenle koşar; bu tercih edilen yoldur.

## Sonuçlar

- L3 görev katmanı gerçek kalıcı kayıtla doğrulanabilir; kanıt: İş Gücü Add Shift
  (POST → 201) ve Publish ("Draft" rozeti kalkar), koşu sonrası çizelge temiz.
- Kaza riski düşük: iki ayrı bayrak + fail-fast + otomatik temizlik.
- Referans testler: `tests/workforce-mutations.authed.spec.js`.
