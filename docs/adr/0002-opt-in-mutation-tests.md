# ADR-0002: Kullanıcı-onaylı mutation test kategorisi

- Durum: [ADR-0004](0004-staging-only-mutation-guard.md) tarafından geçersiz kılındı
- Tarih: 2026-07-28
- Geçersiz kılınma tarihi: 2026-07-29

## Tarihsel bağlam

L3 görev doğrulamalarının bir bölümü kalıcı kayıt oluşturmayı gerektirdiği için
`@mutation` kategorisi, açık opt-in ve seri/retry'sız lane bu kararla eklendi.
İlk sürüm production'da ikinci bir onay bayrağına dayanan kaçış yolu da
tanımlıyordu.

## Geçersiz kılınan bölüm

Production'a yazmayı açan bayrak ve komut güvenli kabul edilmemektedir ve
kaldırılmıştır. Bu ADR'deki geçerli kalan ilkeler yalnız şunlardır:

- mutasyonların normal test koşularından ayrılması;
- açık `ALLOW_MUTATING_TESTS=true` opt-in'i;
- `@mutation`, retry `0`, worker `1`;
- mutasyondan önce kaydedilmiş ve hatası görünür cleanup.

Güncel ve bağlayıcı ortam/tenant politikası ADR-0004'tür: mutation yalnızca
kimliği doğrulanan ayrılmış staging tenant'ında çalışır; production için kaçış
yolu yoktur.
