# ADR 0002 — Kullanıcı-onaylı (opt-in) mutation test kategorisi

Durum: Kabul edildi (28 Tem 2026)

## Bağlam

AGENTS.md (kural 3) ve QUALITY_ROADMAP production'da otomasyon kaynaklı veri
mutasyonunu yasaklar; canlı testler salt-okunur kalır. Ancak bazı davranışlar
(İş Gücü'nde **vardiya oluşturma** ve **çizelge yayınlama**) yalnızca veri
değiştirerek doğrulanabilir. Ayrılmış bir staging tenant'ı henüz yok; tek
ortam canlı (app.vomenta.com).

Bu, kuralın istisnasıdır ve bu yüzden bu ADR ile gerekçelendirilir.

## Karar

Veri değiştiren testler **ayrı, açıkça istendiğinde çalışan** bir kategoride
toplanır ve **çift kilit** ile korunur:

- **Kilit 1 — kategori izolasyonu.** `@mutation` etiketli testler yalnızca
  `ALLOW_MUTATING_TESTS=true` iken çalışır (`playwright.config.js` → `grepInvert`).
  Normal koşular (`test:auth`, `test:regression`, `test:e2e`) ve CI bu bayrağı
  set etmez; dolayısıyla mutation testleri oralarda **hiç** çalışmaz. Bayrağı
  yalnızca özel komut set eder.
- **Kilit 2 — canlı onayı.** Hedef production (app.vomenta.com) ise ayrıca
  `ALLOW_PROD_MUTATIONS=true` gerekir (`config/environment.js` →
  `assertMutationsAllowed`, `mutationGuard` üzerinden). Aksi hâlde test veri
  oluşturmadan fail-fast olur.

Çalıştırma komutları (`package.json`):

- `npm run test:mutation` — staging için (`ALLOW_MUTATING_TESTS=true`, seri, `--workers=1`).
- `npm run test:mutation:prod` — canlı için (ek olarak `ALLOW_PROD_MUTATIONS=true`).

Her `@mutation` testi `mutationGuard(...)` çağırır ve `cleanup` ile oluşturduğu
veriyi geri alır (mimari kapı `mutationGuard` + `cleanup` varlığını zorlar).
Testler seri çalışır (`test.describe.configure({ mode: 'serial' })` + `--workers=1`),
çünkü aynı canlı kaynağı (çizelge) paylaşırlar.

## Sonuçlar

- Prod'da kazara mutasyon riski iki bağımsız bayrakla engellenir; CI güvenli kalır.
- **Publish geri alınamaz.** Vomenta UI'ında yayını geri alma (unpublish) yolu yok;
  temizlik oluşturulan vardiyayı silerek yapılır (bu, published vardiyayı da kaldırır),
  ama Publish anında gerçek ajanlara bildirim gidebilir. Bu yüzden canlı çalıştırma
  bilinçli ve seyrek olmalı; ideal ortam ayrılmış bir staging tenant'ıdır.
- Staging tenant'ı devreye girince bu testler oraya taşınmalı; canlı çalıştırma
  yalnızca zorunlu doğrulama için kullanılmalıdır.

## İlgili

- `config/environment.js`, `playwright.config.js`, `package.json`
- `tests/workforce-mutations.authed.spec.js`, `tests/known-bugs-invite.mutation.authed.spec.js`
- docs/TEST_ARCHITECTURE.md, AGENTS.md ("Test sınıfları")
