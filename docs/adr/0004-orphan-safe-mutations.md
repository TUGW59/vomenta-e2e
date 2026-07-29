# ADR-0004: Orphan-sıfır mutasyon + keşif tamlığı + doğrulama-anı

- Durum: Kabul edildi
- Tarih: 2026-07-29

## Bağlam

Kişiler bölümü test edilirken, tek bir testin düzeltmesiyle çözülmeyen, **test mimarisini geneli
ilgilendiren** bir hata sınıfı ortaya çıktı. Somut olaylar:

1. **Keşif eksikliği:** Liste sayfası "bitti" sayılıp merge edildi; ama bir satır **checkbox ile
   seçilince beliren toplu-eylem çubuğu** (Ata/Etiket/Kampanyaya Ekle/Dışa Aktar/Sil) hiç görülmedi —
   çünkü keşifte hiç satır seçilmemişti. Kullanıcı ekran görüntüsüyle işaret etti.
2. **Canlıda orphan:** Mutasyon akışı geliştirilirken canlı tenant'a birden çok kez temizlenmemiş
   test-kişisi kaldı. Kök neden: cleanup'ı **kanıtlanmamış** ad-hoc probe script'leri (yanlış URL/
   yanıt-şekli varsayımı; üstüne retry'ın kaydı yeniden oluşturması).
3. **Yanlış-geçiş:** Bir `test.fail` sızıntı guard'ı "expected to fail but passed" verdi — assertion,
   ilgili UI (detay Quick Actions) render olmadan yapıldığı için "yok" sandı. Ayrıca satır adı
   avatar baş harfleriyle ("AU") eşleştirilmeye çalışıldı.

## Karar

Dersleri hem **yazılı kurala** hem **araçla zorlamaya** bağladık.

1. **Keşif tamlığı standardı** (AGENTS.md): etkileşimle beliren kontroller (satır seçimi → toplu
   çubuk, hover, menü, boş/hata durumları, dar viewport) kapsamdadır; bir bölüm sabit tamlık kontrol
   listesi geçmeden "bitti" denmez.
2. **Doğrulama-anı standardı** (AGENTS.md): negatif/`test.fail` doğrulamaları yalnızca çevre UI
   yüklendikten sonra kabul edilir; ad eşleşmesi ek metne (baş harf/rozet) takılmaz.
3. **Mutasyon güvenliği standardı — orphan-sıfır** (AGENTS.md): önce yıkımı kanıtla; `testEntity`
   fixture'ıyla **oluşturma anında otomatik cleanup**; `PW_` aranabilir önek; `@mutation` lane
   `--retries=0`; başta+sonda `assertNoTestOrphans` + `report:orphans`; cleanup başarısızlığı =
   **kritik altyapı hatası** (test başarılı sayılmaz).

## Enforcement (hangi hata → hangi kilit)

| Hata (olay) | Yazılı kural | Araçla zorlama |
|---|---|---|
| Toplu-eylem çubuğunu atlama | Keşif tamlığı standardı + DoD/reviewer maddesi | — (yargı; kontrol listesi) |
| Canlıda orphan (probe/test) | Mutasyon güvenliği standardı | `testEntity` fixture (auto-cleanup) · `TEST_ENTITY_PREFIX` · lane `--retries=0` (`validate-architecture` statik doğrular) · `--workers=1` · `report:orphans` · cleanup=kritik |
| Retry ile kayıt çoğalması | " | `validate-architecture`: mutation script'i `--retries=0` içermeli |
| `test.fail` yanlış-geçişi / erken assert | Doğrulama-anı standardı | — (yargı; kardeş-öğe bekleme deseni) |
| "bitti" prematüre | Keşif tamlığı ("bitti denmez") | — |

Grep ile "cleanup create'ten önce mi" denetimi **bilinçli reddedildi**; yerine `testEntity`
create+cleanup'ı tek çağrıda birleştirerek sorunu **yapısal** çözer.

## Sonuç

- Yeni mutasyon testleri kaydı `testEntity` + `PW_` önekle üretir; lane retry'sizdir; orphan tarayıcı
  koşu sonunda temizliği doğrular.
- Mevcut senaryolar bu PR'da **değiştirilmedi** (yalnızca yönetişim/araç); göç ayrı ele alınır.
