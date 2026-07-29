# ADR-0004: Mutation testleri yalnız doğrulanmış staging tenant'ında

- Durum: Kabul edildi
- Tarih: 2026-07-29
- Geçersiz kıldığı karar: [ADR-0002](0002-opt-in-mutation-tests.md) içindeki
  production kaçış bayrağı

## Bağlam

Yalnızca `ALLOW_MUTATING_TESTS` ve `ALLOW_PROD_MUTATIONS` bayraklarına dayanan
koruma, yanlış ortam veya yanlış hesap seçimini teknik olarak kanıtlamıyordu.
İki bayrağın birlikte açılması production'a yazmayı mümkün kılıyor; test hesabı
olduğu varsayımı çalışan oturumdan doğrulanmıyordu.

## Karar

Production mutasyonu koşulsuz yasaktır. Tek mutation komutu
`npm run test:mutation` olup aşağıdaki kapıların tamamı geçmeden hiçbir yazma
işlemi başlayamaz:

1. `ALLOW_MUTATING_TESTS=true` ile açık opt-in;
2. `TEST_ENV=staging`;
3. `BASE_URL` production app origin'i (`https://app.vomenta.com`) değil;
4. response origin'i açık `MUTATION_API_ORIGIN` ile birebir eşleşiyor ve
   production API origin'i (`https://api.vomenta.com`) değil;
5. `MUTATION_TENANT_ID` geçerli UUID ve `MUTATION_TENANT_SLUG` dolu;
6. kimliği doğrulanmış `GET /api/v1/auth/me` yanıtında
   `data.tenantId`, `data.tenant.id` ve `data.tenant.slug` beklenen değerlerle
   birebir eşleşiyor.

`mutationGuard` bu preflight'ı asenkron yapar ve test boyunca önbelleğe alır.
Her `@mutation` testi ilk yazmadan önce `await mutationGuard(reason)` çağırır.
Korumalı API istemcisinin `post`, `patch` ve `delete` metotları da aynı guard'ı
await eder. Statik validator, await edilmeyen guard çağrılarını ve yeniden
eklenen production mutation komutunu reddeder.

## Sonuçlar

- Çevre değişkeni hatası production yazımını açamaz.
- Staging URL'sinde yanlış müşteri hesabıyla açılmış oturum fail-fast olur.
- Staging tenant secret/variable'ları sağlanana kadar mutation testleri bilinçli
  olarak çalışmaz; salt-okunur testler etkilenmez.
- Tenant preflight salt-okunurdur ve resmî `UserProfileResponse` sözleşmesindeki
  kimlik alanlarını kullanır.
