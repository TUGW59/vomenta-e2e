# Faz 7 — Staging Ortamı Kurulum Runbook'u

> Mutation testlerinin **gerçekten koşabilmesi** için gereken staging altyapısını kurar.
> Repo tarafı hazırdır (workflow, preflight, guard, komutlar). Burada anlatılan adımlar
> **senin** yapman gereken, kod-dışı (infra + secret) adımlardır — Claude tenant
> provisionlayamaz ve secret giremez. Bittiğinde `npm run mutation:preflight` yeşil olur.
>
> İlgili: [Rehber](MUTATION-TESTS-GUIDE.md) · [Envanter](raporlar/MUTATION-INVENTORY.md) ·
> [Plan §18 Faz 7](MUTATING-TESTS-IMPLEMENTATION-PLAN.md)

## 0. Neden gerekli?

`config/environment.js` + `fixtures/mutationGuard.js` mutation'ı yalnız şu koşulda açar:
`ALLOW_MUTATING_TESTS=true` **ve** `TEST_ENV=staging` **ve** production-dışı `BASE_URL`
**ve** production-dışı `MUTATION_API_ORIGIN` **ve** geçerli `MUTATION_TENANT_ID`/`SLUG`
**ve** canlı `/api/v1/auth/me` yanıtının bu tenant'la eşleşmesi. Bu değerler bugün yok →
`@mutation` testleri (aktif olanlar dahil) fail-closed. Bu runbook o değerleri sağlar.

## 1. Ayrılmış staging tenant'ı provisionla

- **İzole, atılabilir** bir Vomenta staging tenant'ı (gerçek müşteri verisi İÇERMEZ).
- Bu tenant'ta **admin yetkili** bir otomasyon kullanıcısı (create/delete yapabilmeli).
- Not al (secret olarak kullanılacak):
  - Staging app host'u → `BASE_URL` (ör. `https://staging.vomenta.app`)
  - Staging API origin'i → `MUTATION_API_ORIGIN` (yalnız origin, path yok)
  - Tenant **UUID** → `MUTATION_TENANT_ID`
  - Tenant **slug** → `MUTATION_TENANT_SLUG`
  - Otomasyon hesabı e-posta/şifre → staging creds
  - (Ops.) ayrılmış test numaraları → contact/call/SMS testleri için
- **Doğrula:** UUID biçimi `xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx`; `/api/v1/auth/me`
  yanıtındaki `data.tenantId` + `data.tenant.id` + `data.tenant.slug` yukarıdakilerle birebir.

## 2. GitHub `staging` Environment'ı oluştur

Repo → **Settings → Environments → New environment → `staging`** (isim birebir; `mutation.yml`
`environment: staging` bekler). Şunları ekle:

**Required reviewers:** en az 1 kişi (manuel onay kapısı). İstersen wait timer / branch
kısıtı ekle.

**Environment variables (vars):**
| Ad | Değer |
|---|---|
| `E2E_STAGING_BASE_URL` | Staging app host'u (ör. `https://staging.vomenta.app`) |
| `MUTATION_API_ORIGIN` | Staging API origin'i (yalnız origin) |

**Environment secrets:**
| Ad | Değer |
|---|---|
| `MUTATION_TENANT_ID` | Staging tenant UUID |
| `MUTATION_TENANT_SLUG` | Staging tenant slug |
| `VOMENTA_STAGING_EMAIL` | Staging otomasyon hesabı e-postası |
| `VOMENTA_STAGING_PASSWORD` | Staging otomasyon hesabı şifresi |
| `VOMENTA_TEST_CONTACT_PHONE` | (ops.) ayrılmış E.164 numara |
| `VOMENTA_TEST_PHONE` | (ops.) ayrılmış E.164 numara |

> Adlar `.github/workflows/mutation.yml` ile birebir eşleşmeli. Değerler yalnız bu
> Environment'ta yaşar; başka workflow erişemez.

## 3. (Opsiyonel) Lokal staging `.env`

Lokal `npm run test:mutation` için `.env`'de (repoya GİRMEZ):

```bash
TEST_ENV=staging
BASE_URL=https://<staging-app-host>
ALLOW_MUTATING_TESTS=true
MUTATION_API_ORIGIN=https://<staging-api-host>
MUTATION_TENANT_ID=<uuid>
MUTATION_TENANT_SLUG=<slug>
VOMENTA_EMAIL=<staging-otomasyon-email>
VOMENTA_PASSWORD=<staging-otomasyon-sifre>
# Opsiyonel:
# VOMENTA_TEST_CONTACT_PHONE=+90...
# VOMENTA_TEST_PHONE=+90...
```

## 4. Doğrulama (kabul kriteri)

**Lokal:**
```bash
npm run mutation:preflight     # TÜM kapılar ✓ + "PREFLIGHT GEÇTİ" olmalı
npm run test:mutation:list     # @mutation testleri listeleniyor
npm run test:mutation          # ilk gerçek koşum (9A aktif dosyalar yeşil olmalı)
npm run report:orphans         # kalıntı = 0
```

**CI:**
- GitHub → Actions → **Mutation Tests (staging-only, manual)** → **Run workflow** (gerekçe gir).
- `staging` Environment onayı bekler → onayla → koşum başlar.
- Guard staging bağlamını doğrular; 9A testleri koşar; `report:orphans` adımı `always()` çalışır.

Faz 7 **tamam** sayılır: `mutation:preflight` yeşil **ve** `mutation.yml` manuel koşumu
staging'de guard'ı geçip en az 9A testlerini yürütüyor.

## 5. Güvenlik notları

- Tenant **ayrılmış ve atılabilir** olmalı; asla gerçek müşteri/production tenant'ı değil.
- Secret'lar **yalnız** `staging` Environment'ında; `.env` **asla** commit edilmez (gitignore'lu).
- Production origin'leri (`app.vomenta.com` / `api.vomenta.com`) guard tarafından reddedilir —
  yanlışlıkla girsen bile mutation koşmaz.
- Concurrency `mutation-lane`: aynı anda tek koşum; süren koşum iptal edilmez (orphan riski).
