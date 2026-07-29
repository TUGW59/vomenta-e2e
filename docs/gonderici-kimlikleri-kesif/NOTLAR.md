# Gönderici Kimlikleri — Playwright keşif notları

Tarih: 29 Temmuz 2026

Rota: `/campaigns/sender-ids`

Hesap: kullanıcı tarafından ayrılmış test tenant'ı olarak doğrulandı.

## Gözlemlenen ürün sözleşmesi

Liste `GET /api/v1/sender-ids?page=1&limit=10` ile yükleniyor. Sayfada başlık,
açıklama, `Request Sender ID`, durum filtresi ve sekiz kolonlu tablo var:
`Sender ID`, `Type`, `Status`, `Purpose`, `Requested By`, `Review Note`,
`Created at`, `Actions`.

Durum filtresi seçenekleri canlıda:

- `All Status`
- `Pending`
- `Approved`
- `Rejected`
- `Docs Requested`

`Approved`, backend'e URL-encoded `filters={"status":"APPROVED"}` ile yeni GET
gönderiyor. L3 doğrulaması görünür sonuçların tamamının `APPROVED` olmasını
kontrol eder.

Talep formu:

- `Sender ID *` — yardım: `Alphanumeric (max 11 chars) or numeric`
- `Type` — `Alphanumeric`, `Numeric`, `Shortcode`
- `Purpose`
- `Supporting Documents (optional)` — PDF/JPG/PNG/DOC, dosya başına 5 MB,
  en fazla 5 dosya
- `Cancel`, `Submit Request`, ikon kapatma (`Close`)

## OpenAPI ve ağ sözleşmesi

Public OpenAPI (`https://api.vomenta.com/api/docs-json`) ile karşılaştırıldı:

- `GET /api/v1/sender-ids` — liste
- `POST /api/v1/sender-ids` — 201; DTO:
  `senderId`, `senderType`, `purpose`
- `GET /api/v1/sender-ids/{id}` — talep detayı
- `DELETE /api/v1/sender-ids/{id}` — yalnız `PENDING` talebi geri çekme, 204
- Tür enum'u: `ALPHANUMERIC | NUMERIC | SHORTCODE`
- Durum enum'u: `PENDING | APPROVED | REJECTED | DOCUMENTS_REQUESTED`

POST sözleşmesi normal regresyon testinde `page.route` ile sunucuya ulaşmadan
yakalanır. Gerçek create testi yalnız `@mutation`, çift kilit, `retries: 0`,
tek worker ve önceden kayıtlı API rollback ile çalışır.

## Dört dil matrisi

| Dil | Liste başlığı | Talep butonu | RTL | Sonuç |
|---|---|---|---|---|
| en | Sender IDs | Request Sender ID | hayır | Kapsandı |
| tr | Gönderici Kimlikleri | Gönderici Kimliği Talep Et | hayır | Kapsandı |
| fr | Identifiants d'expéditeur | Demander un identifiant d'expéditeur | hayır | Kapsandı |
| ar | معرفات المرسل | طلب معرف مرسل | evet | Kapsandı; `html[dir=rtl]` |

Başlık, açıklama, buton, filtre, sekiz kolon, form başlığı/açıklaması, alan
etiketleri, yardım metinleri, purpose placeholder'ı, dosya alanı ve submit/cancel
etiketleri dört dilde canlıdan gözlemlendi ve assert edildi.

## Bulgular

1. **Form label bağlantıları yok (a11y).** Sender ID, Purpose ve file input'un
   `labels` koleksiyonu boş. Görünür label var ama programatik ilişki yok.
2. **Boş submit sessiz.** Zorunlu Sender ID boşken buton etkin. Tıklamada POST
   gitmiyor fakat `required`, `aria-invalid`, hata/alert veya görünür açıklama da
   oluşmuyor.
3. **TR/FR/AR Sender ID placeholder'ı İngilizce kalıyor:** `e.g. MYCOMPANY`.
4. **TR/FR/AR ikon kapatma adı İngilizce kalıyor:** `Close`.
5. **PENDING talebi UI'dan geri çekme kontrolü yok.** OpenAPI DELETE destekliyor;
   sentetik `PENDING` satırda yalnız `Upload` göründü.
Her kalıcı ürün bulgusu ilgili testin içinde `test.fail()` ile `@known-bug`
olarak tutulur; ürün düzelince beklenmedik geçiş vererek guard'ın kaldırılmasını
zorlar.

## İnteraktif kontrol matrisi

| Kontrol | L1 — tıklama | L2 — backend | L3 — doğru görev |
|---|---|---|---|
| Durum filtresi | 5 seçenek açılır | doğru filtreli GET | yalnız seçilen durum görünür |
| Request Sender ID | form açılır | N/A: istemci | alanlar/form sözleşmesi görünür |
| Sender ID/Purpose | doldurulur | submit DTO içinde | mutation'da kalıcı değer eşleşir |
| Type | 3 seçenek ve seçim | submit DTO enum'u | mutation/route DTO eşleşmesi |
| Cancel/Close | kapanır | N/A: istemci | satır sayısı değişmez |
| Submit Request | mock 201 sonrası kapanır | doğru POST + gövde, prod bloklu | `@mutation`: PENDING + GET doğrulama |
| Choose Files | file chooser açılır | N/A: talep olmadan upload yok | N/A: sahte belge yazılmaz |
| PENDING Upload | kaynak Sender ID ile dialog | N/A: sahte belge yazılmaz | N/A: kalıcı dosya yazılmaz |
| PENDING Withdraw | BULGU: kontrol yok | OpenAPI DELETE kanıtlı | `test.fail`: UI görevi yapılamıyor |
| Retry | hata panelinde görünür/tıklanır | liste GET'i yeniden gönderir | hata kalkar, güncel sonuç görünür |

## Keşif kapanış matrisi

| Durum | Kapanış |
|---|---|
| Varsayılan/veri dolu | Kapsandı: 3 APPROVED satır ve gerçek hücre değerleri |
| Seçim sonrası kontroller | Kapsandı: status seçenekleri ve filtrelenmiş sonuç |
| Hover/focus kontrolleri | Kapsandı: satırlarda hover/focus ile yeni gizli kontrol gözlenmedi |
| `...`/kebab/context menüleri | N/A: liste/form/pending satırında böyle kontrol yok |
| Dialog/drawer/detail | Kapsandı: request ve PENDING upload dialogları |
| Boş durum | Kapsandı: `No sender IDs found` |
| Loading | N/A: kararlı erişilebilir loading göstergesi gözlenmedi; GET tamamlanması beklendi |
| Hata | Kapsandı: mock 500; açıklayıcı alert + Retry, başarılı yeniden deneme |
| Yetkisiz | N/A: kayıtlı test oturumunu bilerek bozmak auth paketinin kapsamı; bu sayfada güvenli rol yok |
| Masaüstü/tablet/mobil | Kapsandı: document yatay taşması yok |
| Dört dil | Kapsandı: en/tr/fr/ar |
| Arapça RTL | Kapsandı: `html[dir=rtl]`, mobil taşma yok |
| Form submit sonucu | Kapsandı: mock 201 + gerçek opt-in mutation; boş doğrulama sessizliği bulgu |
| Cleanup/orphan | Kapsandı: OpenAPI teardown kanıtı, `testEntity.create`, E2E prefix baseline ve final baseline |

## Trace kanıtları

- `sender-ids-discovery.zip` — yapı, dört dil ve responsive
- `sender-ids-form-probe.zip` — alan/label, tür seçenekleri ve sessiz boş submit
- `sender-ids-pending-filter-probe.zip` — filtre ağı, sentetik PENDING ve upload
- başarısız testlerde config otomatik `retain-on-failure` trace üretir
