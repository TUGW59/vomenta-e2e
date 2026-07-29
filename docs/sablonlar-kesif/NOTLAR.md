# Şablonlar keşif notları

**Rota:** `/campaigns/templates`  
**Gözlem:** 29 Temmuz 2026, ayrılmış Vomenta test tenantı  
**Kanıt:** `screenshots/`, `veri/templates-exploration.json`, git dışı Playwright
trace: `test-results/investigations/templates-discovery.zip`

## Görünür sözleşme

- Başlık: **SMS Templates**
- Eylem: **New Template**
- Tablo: **Template Name · Message Body · Created at · Actions**
- Veri: `GET /api/v1/channels/templates/sms` → 200; tablo gerçek şablon adı ve
  mesaj gövdesi render ediyor.
- Create diyaloğu: **Create Template**, **Template Name**, **Message Body**,
  sayaç **GSM-7 … /160**, **Cancel**, **Create**, **Close**.
- Edit diyaloğu: **Edit Template**, aynı alanlar, **Cancel**, **Save**, **Close**.
- Delete onayı: **Delete Template**, geri alınamaz uyarısı, **Cancel**, **Delete**.

## Dört dil

| Alan | en | tr | fr | ar |
|---|---|---|---|---|
| Başlık | SMS Templates | SMS Şablonları | Modèles SMS | قوالب الرسائل القصيرة |
| Yeni | New Template | Yeni Şablon | Nouveau modèle | قالب جديد |
| Create başlığı | Create Template | Şablon Oluştur | Créer un modèle | إنشاء قالب |
| Yön | ltr | ltr | ltr | rtl |

Liste başlıkları, create başlığı/alt metni, alan etiketleri, ad placeholder'ı,
Cancel/Create dört dilde gözlemlendi ve guard'a alındı.

## Bulgular

1. **Teknik i18n anahtarı sızıntısı:** Message Body textarea placeholder'ı dört
   dilde de `campaigns.templateContentPlaceholder`.
2. **Close çeviri sızıntısı:** Türkçe, Fransızca ve Arapça create diyaloğunda
   kapatma düğmesinin erişilebilir adı İngilizce `Close`.
3. **İkon a11y borcu:** Satır Edit/Delete ikon-butonlarında `aria-label`, title
   ve `data-testid` yok. `button-name` ihlali; POM geçici olarak lucide ikon
   sınıfına dayanıyor. Frontend'den `aria-label` + kararlı `data-testid` istenir.
4. **Form label ilişkisi eksik:** Görünen Template Name/Message Body `label`
   öğeleri input/textarea ile programatik bağlı değil; semantik `getByLabel`
   alanları bulamıyor. `for`+`id` veya `aria-labelledby` istenir.
5. **Sessiz i18n runtime hatası:** Sayfa ilk yüklenirken iki
   `INVALID_MESSAGE: MALFORMED_ARGUMENT` console-error üretiyor. Trace stack'i
   doğrudan campaigns/templates page chunk'ındaki mesaj biçimlendirme çağrısını
   gösteriyor.

Beş bulgu da ilgili teste yerel `test.fail()` ile bağlıdır.

## OpenAPI ve teardown provası

Public OpenAPI (`https://api.vomenta.com/api/docs-json`) ile mutation sözleşmesi
salt-okunur doğrulandı:

| İş | Method + endpoint | Başarı |
|---|---|---|
| Liste | `GET /api/v1/channels/templates/sms` | 200 |
| Oluştur | `POST /api/v1/channels/templates/sms` | 201 |
| Güncelle | `PATCH /api/v1/channels/templates/sms/{id}` | 200 |
| Sil/rollback | `DELETE /api/v1/channels/templates/sms/{id}` | 204 |

Create DTO zorunlu alanları `name` ve `content`. Mutation testi yalnız
`e2e-sms-template-` önekli kendi kaydına dokunur; başlangıç/son baseline'ı sıfır
olarak doğrular, rollback'i mutation'dan önce `testEntity.create` ile kaydeder ve
retry/workers kapalı mutation lane'inde çalışır.

## Kontrol matrisi

| Kontrol | L1 — tıklama | L2 — backend | L3 — doğru görev |
|---|---|---|---|
| New Template | Create diyaloğu açılır | N/A: saf istemci açılışı | Alanlar/validasyon ve iptal kayıt bırakmaz |
| Template Name / Message Body | Değer yazılır, sayaç güncellenir | N/A: saf istemci girişi | İki alan dolunca Create etkin |
| Cancel / Close | Diyalog kapanır | N/A: saf istemci | Satır sayısı değişmez |
| Create | Mock 201 ile diyalog kapanır | POST + tam DTO route ile yakalanır | `@mutation`: satır ad+gövdeyle oluşur |
| Edit | Form kaynak satırın ad/gövdesini açar | PATCH item ucu route ile yakalanır | `@mutation`: kendi kayıt gövdesi güncellenir |
| Delete | Onay açılır; Cancel kaydı korur | DELETE item ucu route ile yakalanır | `@mutation`: kendi satırı silinir, baseline sıfır |

## Keşif kapanış matrisi

| Durum | Sonuç |
|---|---|
| Varsayılan / veri-dolu | **Kapsandı:** tablo değer render'ı + GET 200 |
| Seçim sonrası / bulk | **N/A:** satır checkbox'ı, seçim veya bulk bar yok |
| Hover/focus kontrolleri | **Kapsandı:** satır Edit/Delete ikonları envantere alındı; erişilebilir isim bulgusu |
| Kebab/context menüsü | **N/A:** sayfada kebab/context menüsü yok |
| Dialog/drawer/expanded/detail | **Kapsandı:** create/edit/delete dialog durumları |
| Boş | **Kapsandı:** “No templates yet” + açıklama içeren boş-durum satırı |
| Loading | **N/A:** kalıcı kullanıcı kontrolü yok; deterministik assertion sinyali gözlemlenmedi |
| Hata | **Kapsandı:** GET 500 mock; kabuk/başlık sağlam, eski satır yok |
| Yetkisiz | **N/A:** authed proje oturum sözleşmesi; ayrı rol/401 keşfi bu sayfanın mutation kapsamı dışında |
| Masaüstü/tablet/mobil | **Kapsandı:** 1280/768/375; document overflow yok |
| en/tr/fr/ar + RTL | **Kapsandı:** taze bağlam, tek switch; Arapça `dir=rtl` |
| Create form sonucu | **Kapsandı:** route L2 + ayrılmış tenant `@mutation` L3 |
| Edit/Delete kalıcı sonuç | **Kapsandı:** yalnız testin oluşturduğu kayıt, orphan-sıfır |
