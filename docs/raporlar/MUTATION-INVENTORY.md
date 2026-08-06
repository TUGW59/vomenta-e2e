# Mutation (Veri Değiştiren) Test Envanteri

> **Durable envanter — fazların tek girdisi.** Bu dosya
> [MUTATING-TESTS-IMPLEMENTATION-PLAN.md](../MUTATING-TESTS-IMPLEMENTATION-PLAN.md) §9'un
> doğrulanmış çıktısıdır. Sonraki fazlar repoyu yeniden taramaz; bu tabloları kullanır.
> Kaynak: dosyalardan doğrulanmış (2026-08-06). "Veri değiştiren E2E testi" kastedilir;
> klasik kod-mutasyon (Stryker) testi **değildir**.

## Özet sayılar

| Sınıf | Dosya | Not |
|---|---|---|
| 9A — Aktif (gerçek 0→1→0) | 5 | `testEntity.create`; staging'e hazır |
| 9B — Parked-fixme, iskelet var | 5 | staging kanıtı bekliyor |
| 9C — Parked-fixme, yalnız cleanup | 26 | `create` yaşam döngüsü yok |
| 9E — Salt-okunur denetim | 1 | `mutation-orphans` |
| **Mutation-isimli toplam** | **37** | 33 `*-mutations.*` + 3 `*.mutation.*` + 1 `mutation-orphans` |
| 9D — Yorum-only (yanlış alarm) | 10 | gerçek etiket/guard/write yok; **taşıma gerekmez** |

**Fixme oranı:** 31 / 36 aktif-adayı fixme. **Ortak:** hepsi `@mutation` etiketi,
`retries:0`, `await mutationGuard(...)`. **Kök blokaj:** bağlı staging tenant yok →
guard `TEST_ENV=staging` istediğinden hiçbir mutation bugün production'a karşı koşamaz.

---

## 9A — AKTİF: gerçek 0→1→0 (`testEntity.create`), staging'e hazır

| Dosya | #Test | Değiştirdiği veri | Cleanup / rollback | Güvenlik | Tekrar çalışır? | Durum | Risk / eksik |
|---|---|---|---|---|---|---|---|
| `tests/contacts-mutations.authed.spec.js` | 1 | Kişi oluştur (POST 201) → VIP toplu etiket (PATCH) → toplu sil (DELETE 204) | `deleteContactsByName(lastName)` | guard + create | Evet (benzersiz key) | Aktif; `VOMENTA_TEST_CONTACT_PHONE` yoksa skip | Env telefonuna bağlı |
| `tests/reports-dashboards-mutations.authed.spec.js` | 3 | Dashboard create / duplicate / delete (POST 201, DELETE 204) | UI `deleteDashboardByName` (her testte) | guard + create; serial | Evet | Aktif | — |
| `tests/reports-schedule-mutations.authed.spec.js` | 2 | Scheduled report create+delete + orphan denetimi | UI delete → DELETE 204 | guard + create; serial | Evet | Aktif | 2. test salt orphan sayar |
| `tests/workforce-mutations.authed.spec.js` | 2 | Shift create (POST /wfm/schedules 201) + Publish schedule | `deleteFirstShift()` DELETE 204 | guard + create; `prefixNaReason` | Evet | Aktif | İsimsiz varlık (prefixNaReason) |
| `tests/workforce-surveys-mutations.authed.spec.js` | 1 | CSAT anketi create+delete (UI) | `deleteAllContaining(key)` + finally | guard + create | Evet | Aktif | UI silme; finally yedeği var |

Toplam: **5 dosya / 9 test.** Hepsi `@regression @mutation`, `retries:0`.

---

## 9B — PARKED-fixme, iskelet mevcut (staging kanıtı bekliyor)

| Dosya | Fixme sebebi (mutation-lifecycle.js / spec) | testEntity | Cleanup durumu |
|---|---|---|---|
| `tests/voice-dids-mutations.authed.spec.js` | DID Assign/Unassign uçları + dialog seçicileri staging'de doğrulanmadı | `create` (TODO stub) | Unassign stub |
| `tests/voice-ivr-mutations.authed.spec.js` | IVR create POST + delete DELETE uçları doğrulanmadı | `create` (TODO stub) | boş TODO |
| `tests/voice-queues-mutations.authed.spec.js` | Queue create POST + delete DELETE + alan seçicileri doğrulanmadı | `create` (TODO stub) | Delete stub |
| `tests/workforce-evaluations-mutations.authed.spec.js` | Manuel değerlendirme gerçek etkileşim ID+temsilci ister; silme yolu yok. `owner: quality-guild`, `expiry: 2026-09-30` | `create` (action stub) | `cleanup` bilinçle `throw` |
| `tests/workforce-badges-mutations.authed.spec.js` | Rozet UI silme sunmuyor (WORKFORCE-BADGES-NO-EDIT-DELETE). `owner: quality-guild`, `expiry: 2026-09-30` | `create` (action gerçek) | `cleanup` bilinçle `throw` |

Toplam: **5 dosya.** Hepsi describe-level `test.fixme(true, ...)`, guard var, `retries:0`.

---

## 9C — PARKED-fixme, yalnız `testEntity.cleanup` (create yaşam döngüsü yok)

Ortak: describe-level fixme, `mutationGuard` var, `retries:0`, `@mutation`. `create` yok —
UI'da güvenli silme/geri-alma staging'de kanıtlanmadığından.

### Settings (17)

| Dosya | Değiştireceği veri (etkin olsa) |
|---|---|
| `tests/settings-api-keys-mutations.authed.spec.js` | API anahtarı create+revoke |
| `tests/settings-automations-mutations.authed.spec.js` | Otomasyon kuralı create+delete |
| `tests/settings-canned-responses-mutations.authed.spec.js` | Hazır yanıt create+delete |
| `tests/settings-compliance-mutations.authed.spec.js` | Consent/GDPR kaydı create+purge |
| `tests/settings-data-retention-mutations.authed.spec.js` | Saklama süresi edit+save+revert |
| `tests/settings-disposition-codes-mutations.authed.spec.js` | Disposition kodu create+delete |
| `tests/settings-hours-mutations.authed.spec.js` | Çalışma saatleri switch toggle+save+revert |
| `tests/settings-integrations-mutations.authed.spec.js` | Entegrasyon webhook create+delete |
| `tests/settings-notifications-mutations.authed.spec.js` | Bildirim tercihi toggle+save+revert |
| `tests/settings-organization-mutations.authed.spec.js` | Kuruluş Website update+revert |
| `tests/settings-profile-mutations.authed.spec.js` | Profil telefon (PATCH /auth/me)+revert |
| `tests/settings-roles-mutations.authed.spec.js` | Custom rol create+delete |
| `tests/settings-security-mutations.authed.spec.js` | Password policy switch+save+revert |
| `tests/settings-sla-mutations.authed.spec.js` | SLA politikası create+delete |
| `tests/settings-teams-mutations.authed.spec.js` | Ekip create+delete |
| `tests/settings-templates-mutations.authed.spec.js` | Şablon create+delete |
| `tests/settings-webhooks-mutations.authed.spec.js` | Webhook create+delete |

### Channels (6)

| Dosya | Değiştireceği veri (etkin olsa) |
|---|---|
| `tests/channels-email-mutations.authed.spec.js` | E-posta (IMAP/SMTP) hesabı ekle+sil |
| `tests/channels-sms-mutations.authed.spec.js` | SMS gönderici kimliği ekle+sil |
| `tests/channels-social-mutations.authed.spec.js` | Sosyal platform bağla+kaldır (OAuth) |
| `tests/channels-video-mutations.authed.spec.js` | Video kanal config değiştir+save+revert |
| `tests/channels-webchat-mutations.authed.spec.js` | Webchat widget config değiştir+save+revert |
| `tests/channels-whatsapp-mutations.authed.spec.js` | WhatsApp şablonu create+delete |

### Dot-named (3, DEPRECATED isim — bkz. plan §10)

| Dosya | Değiştireceği veri | Not |
|---|---|---|
| `tests/campaigns-outbound.mutation.authed.spec.js` | Giden kampanya create (POST /api/v1/campaigns) | SCHEDULED kampanya UI'dan silinemiyor |
| `tests/known-bugs-invite.mutation.authed.spec.js` | Kullanıcı daveti create+revoke | `@known-bug` de taşır |
| `tests/voice-call.mutation.authed.spec.js` | **Gerçek** giden çağrı + **gerçek** SMS | 2 test; per-test fixme+skip; `VOMENTA_TEST_PHONE` gerektirir |

Toplam: **26 dosya** (17 + 6 + 3).

---

## 9D — YORUM-ONLY (yanlış alarm; aksiyon gerekmez)

Bu 10 dosyada `@mutation` **yalnızca yorum/JSDoc metni**; gerçek etiket, `mutationGuard`,
`testEntity` veya write **yok**. Gerçek yazmalar zaten kardeş `*-mutations.*` dosyalarında.
`supervisor-agents` ve `supervisor-wallboard` ayrıca boş `test.fixme` stub taşır (başlıkta
"mutation" prose; etiket değil). **→ Taşıma / rename GEREKMEZ.**

`tests/bot-builder.authed.spec.js`, `tests/settings-audit.authed.spec.js`,
`tests/settings-organization.authed.spec.js`, `tests/supervisor-agents.authed.spec.js`,
`tests/settings-profile.authed.spec.js`, `tests/supervisor-wallboard.authed.spec.js`,
`tests/settings-users.authed.spec.js`, `tests/workforce-badges.authed.spec.js`,
`tests/workforce-evaluations.authed.spec.js`, `tests/workforce-surveys.authed.spec.js`.

---

## 9E — Salt-okunur denetim

| Dosya | Rol |
|---|---|
| `tests/mutation-orphans.authed.spec.js` | `MUTATION_LIFECYCLE_READ_ONLY=true`; create/delete yapmaz, ayrılmış staging tenant baseline'ını doğrular. `npm run report:orphans` koşar. |

---

## Dönüşüm önceliği (Faz 8, staging sonrası)

1. **Doğrula:** 9A'daki 5 dosya staging'de yeşil mi (dokunma, yalnız kanıtla).
2. **Süreli olanlar:** 9B'deki `workforce-evaluations`, `workforce-badges` (`expiry: 2026-09-30`).
3. **Kolay CRUD:** 9C settings/channels'tan create+delete uçları net olanlar (roles, teams,
   templates, sla, disposition-codes, webhooks, api-keys, whatsapp-templates).
4. **Toggle+revert:** hours, notifications, security, data-retention, organization, profile,
   video/webchat config.
5. **Karmaşık/dış bağımlı:** email (SMTP), social (OAuth), campaigns, invite, voice-call
   (gerçek çağrı/SMS) — en sona.

Her dönüşüm **tek PR**, `testEntity.create` 0→1→0, orphan=0 kanıtı ile.
