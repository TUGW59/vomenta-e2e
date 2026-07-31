# İş Gücü — CSAT Anketleri · Rozetler · Kalite Değerlendirmeleri (L2/L3 keşif + bulgular)

Tarih: 2026-07-30 · Ortam: canlı (app.vomenta.com), test hesabı (Tuğçe Topuz tenant'ı).
Yöntem: canlı UI'da salt-okunur keşif + kontrollü tek create→görüntüle→düzenle→sil
döngüsü (yalnız anketlerde tam döngü; rozet/değerlendirmede sınırlı, aşağıya bkz.).

## 0) YAPI: İKİ PARALEL YÜZEY (düzeltilmiş — Faz 1 canlı doğrulama, 30 Tem 2026)

⚠️ **ÖNCEKİ VARSAYIM DÜZELTİLDİ.** "Eski sekme yapısı kırık" iddiası YANLIŞ çıktı
(kimlik olmadan çalıştırılmadan varsayılmıştı). Canlı gözlem: İş Gücü'nün **İKİ paralel
yüzeyi** bir arada çalışıyor:

- **Eski yüzey — `/workforce`:** başlık "İş Gücü Yönetimi"; üstte **7 sekme** (Programlar,
  İzinler, Uyum, Tahmin, Rozetler, Anketler, Değerlendirmeler). Sekmeye tıklayınca URL
  `/workforce` KALIR, içerik **inline** render edilir. `tests/pages/WorkforcePage.js` +
  `workforce.authed.spec.js` bu yüzeyi test ediyor ve **kırık DEĞİL** (sekmeler yerinde).
- **Yeni yüzey — ayrı rotalar:** `/workforce/schedules`, `/workforce/surveys`,
  `/workforce/badges`, `/workforce/evaluations`. Aynı içeriği **tek başına** render eder
  (farklı başlık, sol menü alt-nav). Yeni page nesneleri: `WorkforceSurveysPage` ·
  `WorkforceBadgesPage` · `WorkforceEvaluationsPage`.

İkisi aynı bileşenleri paylaşan iki giriş noktası gibi görünüyor. **Sonuç:** eski yüzey
silinmemeli; test stratejisi iki giriş noktasını da kapsamalı ama derin doğrulamayı
tekrarlamamalı. (Bu, execution planının Faz 3'ünü "sil" yerine "uzlaştır"a çevirir.)

### Faz 1 — Kesin rota envanteri (canlı, sol menü href'leri + 404 testi)

| Bölüm | `/workforce` sekmesi | Ayrı rota (sidebar sub-nav) |
|---|:---:|---|
| Programlar (Schedules) | ✓ | `/workforce/schedules` |
| İzinler (Time Off) | ✓ | `/workforce/time-off` |
| **Uyum (Adherence)** | ✓ | ❌ **YOK** — `/workforce/adherence` → **404 "Sayfa Bulunamadı"** |
| **Tahmin (Forecast)** | ✓ | ❌ **YOK** (yalnız sekme) |
| Rozetler (Badges) | ✓ | `/workforce/badges` |
| Anketler (Surveys) | ✓ | `/workforce/surveys` |
| Değerlendirmeler (Evaluations) | ✓ | `/workforce/evaluations` |

**Kanıtlar:** (a) `/workforce` sekmesine tıklama URL'yi değiştirmiyor, içerik inline (heading "İş
Gücü Yönetimi" sabit). (b) `/workforce/schedules` standalone "Programlar" (aynı grid, sekme yok).
(c) Sidebar İş Gücü alt-nav'ı tam 5 öğe: Programlar/İzinler/Değerlendirmeler/CSAT anketleri/Rozetler.
(d) `/workforce/adherence` **404**. (e) Aynı API uçları paylaşılıyor (ör. `…/wfm/gamification/surveys`).

**Kritik çıkarım:** Eski tabbed `/workforce` sayfası **Uyum + Tahmin'in TEK erişim noktası**.
Silinirse bu iki bölümün tüm kapsamı kaybolur → **WorkforcePage/workforce.authed.spec.js SİLİNMEZ.**
Deprecation sinyali (banner/legacy işareti) görülmedi; iki yüzey birlikte, canlı ve kullanıcıya açık.
"Eski yüzey kaldırılacak mı" bir ÜRÜN kararıdır (kaynak bu repoda değil) — teyit olmadan silme yapılmaz.

## 1) CSAT Anketleri (`/workforce/surveys`) — TAM CRUD ✅ (canlıda doğrulandı)

| Adım | Sonuç | Uç |
|------|-------|----|
| Oluştur | ✅ "Anket oluştur" → Ad/açıklama/Kanallar(WEBCHAT)/Tetikleyici(CONVERSATION_RESOLVED)/Sorular(JSON) → Gönder | `POST /api/v1/wfm/gamification/surveys` |
| Görüntüle | ✅ "Sonuçlar" → Yanıtlar/Ortalama puan/tablo ("henüz yanıt yok") | `GET …/surveys/{id}/responses?limit&page` |
| Düzenle | ✅ kalem → "Anketi düzenle" (Ad/açıklama/Kanallar/Tetikleyici/**Aktif** toggle; JSON YOK) → Kaydet → toast "Anket kaydedildi" | `PATCH …/surveys/{id}` |
| Sil | ✅ çöp → "Anketi sil" onayı ("geri alınamaz") → Sil → toast "Anket silindi" | `DELETE …/surveys/{id}` |

Test: `workforce-surveys-mutations.authed.spec.js` (L3 gerçek, `testEntity.create`
ile 0→1→0). Salt-okunur L1/L2: `workforce-surveys.authed.spec.js`.

- **BULGU A (a11y):** satır düzenle (kalem) ve sil (çöp) ikon-butonlarının
  **erişilebilir adı yok** (WCAG 4.1.2). Ekran okuyucu "button" der; testler konumdan
  seçmek zorunda. → frontend `aria-label` eklemeli.

## 2) Rozetler ve oyunlaştırma (`/workforce/badges`)

- Başlık "Rozetler ve oyunlaştırma"; iki sekme: **Rozetler** / **Sıralama** (liderlik).
- **Oluştur:** ✅ "Rozet oluştur" → Ad/Kategori(quality)/Puan(10) → Kaydet →
  toast "Rozet oluşturuldu". `GET/POST /api/v1/wfm/gamification/badges`.
- **Rozet ver:** "Rozet ver" → Rozet(seçim)/Temsilci(seçim)/Neden(metin) → Ver.
  **GÖNDERİLMEDİ** — gerçek temsilciye rozet atar + bildirim gönderir.
- **BULGU B (fonksiyonel, kritik):** rozet satırında **düzenle/sil kontrolü YOK**.
  Rozet UI'dan yalnız oluşturulabiliyor; **kaldırılamıyor** → oluşturulan test
  rozeti **orphan** kalır. Bu yüzden L3 yaşam döngüsü (0→1→0) UI'dan kapatılamaz →
  `workforce-badges-mutations.authed.spec.js` = `test.fixme` + mutation-lifecycle istisnası.
- **TEMİZLİK BORCU:** keşif sırasında bir test rozeti oluşturuldu —
  **`E2E-TEST-SILINECEK-badge`** (Kategori: quality, Puan: 10). UI'da sil olmadığı
  ve API token'a fixture'dan erişilemediği için kaldırılamadı. Backend'den silinmeli.

## 3) Kalite değerlendirmeleri (`/workforce/evaluations`)

- Başlık "Kalite değerlendirmeleri"; boş-durum "Henüz değerlendirme yok."
- Butonlar: **Değerlendirme Oluştur** (manuel) + **YZ Değerlendirmesi Başlat**.
- Tablo: Puan · Temsilci · Değerlendirici · Tür · Tarih · YZ · **İşlemler**.
- **Oluştur formu:** Interaction ID (gerçek çağrı/konuşma) · Interaction Type(seçim) ·
  Agent(seçim) · Puan %(0–100) · Form Verileri(JSON) · Geri Bildirim → Değerlendirme Oluştur.
  `GET/POST /api/v1/wfm/evaluations`.
- **NEDEN L3 FIXME:** oluşturma **gerçek bir etkileşim ID'si + gerçek temsilci**
  gerektirir (dışa dönük, gerçek veriye bağlı) ve tablo prod'da boş olduğundan satır
  "İşlemler" (düzenle/sil) yolu gözlemlenemedi →
  `workforce-evaluations-mutations.authed.spec.js` = `test.fixme` + istisna.
  Salt-okunur L1/L2: `workforce-evaluations.authed.spec.js`.

## Faz 0 — Baseline (2026-07-30, bu worktree dalı)

**Kalite kapıları (mevcut durum):** 7/7 YEŞİL — `architecture`, `mutation-safety`,
`discovery-safety`, `artifact-safety`, `findings`, `forensic`, `styles`. Yeni regresyon yok;
sonraki fazlar bu baseline'a göre ölçülür.

**Eski-yapı referansları (Faz 3'te temizlenecek):**
- `tests/pages/WorkforcePage.js` (sekme-tabanlı sınıf) — silinecek.
- `tests/workforce.authed.spec.js` + `tests/workforce-mutations.authed.spec.js` — yeni rota specleriyle değiştirilecek.
- `tests/pages/App.js:32,77` — `WorkforcePage` import + `this.workforce` instance.
- `AGENTS.md:164,195` — i18n/3-katman "referans uygulama" örneği olarak `workforce.authed.spec.js`'e işaret ediyor → yeni referans spec'e yönlendirilecek.
- Üretilen raporlar (`docs/TEST_COVERAGE.md`, `docs/raporlar/YAPILAN-TESTLER.md`) — kaldırma sonrası yeniden üretilecek.
- (Bilgi) `tests/pages/WorkforceSurveysPage.js` ve bu doküman yalnızca *yorumda* eski sınıftan bahseder — kod bağı değil.

## Kalan işler

1. **Rozet sil/düzenle** yolu (UI ya da staging `DELETE …/badges/{id}`) kanıtlanınca
   badges mutation spec'inin fixme'sini kaldır → `testEntity.create`'e geçir; orphan
   `E2E-TEST-SILINECEK-badge`'i temizle.
2. Staging'de sabit bir **etkileşim ID'si** + `POST/DELETE …/evaluations` kanıtla →
   evaluations mutation spec'ini gerçek yaşam döngüsüne çevir.
3. Eski sekme-tabanlı `WorkforcePage`'i yeni rota yapısına göre gözden geçir/emekliye ayır.
4. Bulgu A (ikon aria-label) ve Bulgu B (rozet düzenle/sil yok) resmi bulgu kaydına eklensin.
