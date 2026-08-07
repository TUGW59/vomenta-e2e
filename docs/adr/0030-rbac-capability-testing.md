# ADR-0030: Rol-izin (RBAC) yetenek testi — kontrat-güdümlü, tek-hesap kapsamı, çapraz-rol ertelenmiş

- Durum: Kabul edildi (WP-RBAC / FAZ 0 sistem işi)
- Tarih: 2026-08-06
- İlgili: [ADR-0015](0015-production-readonly-manifest.md) (production read-only manifest — RBAC spec'leri de salt-okunur lane'de),
  [ADR-0002](0002-mandatory-test-styles.md) (zorunlu test stilleri / sert-kapı — RBAC spec'i `tested-pages.js`'e tescil + stil beyanı),
  [ADR-0004](0004-staging-only-mutation-guard.md) (mutasyon yalnız staging — RBAC spec'leri hiç mutasyon YAPMAZ)

## Bağlam

"Bir rol yalnızca izinli olduğu yüzeyleri görebiliyor mu; izinsiz yüzey ona kapalı mı?"
sorusu güvenlik açısından kritik ama otomatik doğrulanmıyordu. Vomenta 6 sistem rolü
(OWNER/ADMIN/MANAGER/SUPERVISOR/AGENT/VIEWER) ve 14 kategoride 113 izinlik bir katalog
sunuyor; her rol bu kataloğun bir alt kümesine sahip.

İki yapısal kısıt var:

1. **Tek hesap.** Elimizde yalnız **admin** seviyesinde tek oturum var. AGENT/VIEWER vb.
   için credential yok → "başka rolle giriş yap, negatifi gör" testleri şu an
   **koşulamaz**. Repo kültürü sessiz atlamayı yasaklar; bu boşluk açıkça beyan edilmeli.
2. **Salt-okunur / prod-safe.** RBAC yüzeyi `/settings/roles` production'da yaşıyor.
   Rol/izin **değiştirmek** (checkbox/Save) yasak; testler yalnızca GÖZLEMLER.

Buna karşılık admin hesabı, tüm rollerin izin kümesini ve tam kataloğu salt-okunur
uçlardan **okuyabiliyor**:

- `GET /api/v1/roles` — rol listesi + her rolün izinleri
- `GET /api/v1/roles/permissions/catalog` — 113 izinlik katalog
- `GET /api/v1/roles/me/permissions` — oturumun (admin) efektif izinleri

## Karar

RBAC doğrulaması **kontrat-güdümlü** yapılır: canlı sistemin rol-izin gerçeği, repo'ya
donmuş (`Object.freeze`) tek bir **doğruluk kaynağı** ile karşılaştırılır.

1. **Doğruluk kaynağı (veri modeli).** `tests/contracts/role-permissions.js`:
   `PERMISSION_CATALOG` (113 kayıt), `ROLE_PERMISSIONS` (rol→izin anahtarları),
   `EXPECTED_COUNTS` (OWNER 109 · ADMIN 106 · MANAGER 74 · SUPERVISOR 60 · AGENT 29 ·
   VIEWER 12), `CATEGORIES` (14 kategori). Kaynak: canlı API'nin tek seferlik çıkarımı
   (`docs/ayarlar-kesif/tools/gen-roles-matrix.js` + `ROLLER-IZIN-MATRISI.md`). El bakımı
   değil, çıkarımdan türetilir.

2. **Matris kontratı (tek hesapla TAM test).** Admin tüm rolleri okuyabildiği için 6 rolün
   izin kümesi de `chromium-authed`'de doğrulanır: katalog=113/14-kategori, her rolün kümesi
   `ROLE_PERMISSIONS[rol]` ile birebir, sayımlar `EXPECTED_COUNTS` ile eşit, UI sayaçları
   (Edit dialog "x/y" / "N selected") kontrattan hesaplananla eşleşir. Salt-okunur; Cancel
   ile kapanır.

3. **Efektif-izin gating (pozitif + gerçek negatif).** Oturumdaki admin'in kendi ekranı:
   sahip olduğu iznin yüzeyi görünür (pozitif); sahip **olmadığı** 7 iznin
   (`billing.*`, `reseller.*`, `supervisor.agents.manage`) yüzeyi **kapalı** (gerçek negatif).

4. **Çapraz-rol ertelenir (kimlik-gated).** Farklı rolle gerçek oturum açıp negatif
   doğrulamak, credential gelene kadar `test.skip('… eksik')` + read-only manifestte
   "NOT MATERIALIZED (kimlik yok)" durumuyla **açıkça** beyan edilir. Kimlik `.env`'e
   eklenince `playwright.config.js` `chromium-<role>` projesini otomatik ekler ve lane açılır.

### Dürüstlük çekirdeği

- Test edilemeyen her şey `test.skip`/`fixme` + **gerekçe** ile işaretlenir; sessizce geçme yok.
- Tüm RBAC spec'leri salt-okunur → `@mutation` yok, `mutationGuard` yok, prod-safe.
- Etiket icat edilmez; RBAC için `@data @regression` (kritikse `@critical`).

## Sonuç

- Tek hesapla bile 6 rolün TAM izin matrisi + admin'in gerçek negatifleri otomatik doğrulanır.
- Çapraz-rol boşluğu görünür ve credential gelince sıfır kod değişikliğiyle materyalize olur.
- **Kapsam sınırı:** kontrat, canlı sistemin izin *tanımını* doğrular; her iznin runtime
  davranışsal etkisini (ör. AGENT gerçekten silemiyor mu) değil — o, çapraz-rol lane'i +
  L3 mutasyon işidir (STAGING_REQUIRED).
