# Vomenta — Yönetici Kalite Özeti (Tek Gerçeklik)

> ⚙️ **Otomatik üretilir** (`npm run report:executive`). Üç AYRI gerçekliği — **koşum sonucu**, **kapsam derinliği**, **açık bulgular** — tek görünümde ama **semantiklerini karıştırmadan** birleştirir.
> **Üretim:** `2026-08-06T11:16:12.542Z` · **Manşet provenance:** 🟠 STALE

> ⚠️ **DİKKAT:** Runtime sonuçları **STALE** — TAZE, doğrulanmış bir Playwright koşumunu kanıtlamaz. Sayılar son *kaydedilmiş* snapshot'tandır; güncel koşum için `npm run report:runtime`.

## Kaynak künyesi

| Kaynak | Var mı | Commit | Ortam | Tarayıcı | Run ID | Üretim | Provenance |
|---|---|---|---|---|---|---|---|
| Runtime | ✅ | 0707f82699d7cf6847719034d830e5c50d360f63 | production-read-only | chromium | 31096164216 | 2026-08-06T11:16:12.542Z | 🟠 STALE |
| Depth | ✅ | 0707f82699d7cf6847719034d830e5c50d360f63 | production-read-only | chromium | — | 2026-08-06T11:16:12.542Z | — |
| Findings | ✅ | — | — | — | — | — | — |

## Kaynaklar arası tutarlılık: ⚠️ DRIFT

| Kontrol | Değerler | Uyumlu | Not |
|---|---|---|---|
| Kayıtlı rota sayısı | runtime=87, depth=92 | ❌ | İki snapshot farklı registry durumundan üretilmiş olabilir; runtime bölümü kendi sayısını, depth bölümü kendi sayısını kullanır. |
| Bilinen bulgu toplamı | runtimeSnapshot=61, findingsRegistry=61 | ✅ |  |
| Açık bulgu | runtimeSnapshot=60, findingsRegistry=60 | ✅ |  |

- ⚠️ Kayıtlı rota sayısı: kaynaklar uyuşmuyor (runtime=87, depth=92). İki snapshot farklı registry durumundan üretilmiş olabilir; runtime bölümü kendi sayısını, depth bölümü kendi sayısını kullanır.
- ⚠️ Runtime snapshot provenance = STALE (sha-mismatch). Bu sonuçlar TAZE, doğrulanmış bir Playwright koşumunu KANITLAMAZ.

## 1) Son koşumda ne çalıştı ve ne geçti? (runtime)

- **Kayıtlı rota (runtime snapshot):** 87
- **Tanımlanan test:** — · **Güvenli/çalıştırılabilir test:** _ölçülmedi_ · **Bu koşumda seçilen:** 87 · **Bu koşumda çalışan:** 87
- **Rota durumu:** ✅ PASS 83 · ❌ FAIL 0 · 🟡 FLAKY 0 · ⛔ BLOCKED 0 · ⚪ NOT_RUN 4
- **Koşum lensi:** geçen 87 · başarısız 0 · flaky 0 · atlanan 0
- **Rotaya eşlenmeyen test:** 4 (sayfa durumuna sayılmaz — sahte PASS engeli).

> ℹ️ "Tanımlanan test" ile "bu koşumda çalışan test" **aynı sayı değildir**. Bir rotanın PASS olması yalnız read-only açılışını kanıtlar.

## 2) Her sayfanın otomasyon derinliği nedir? (kapsam)

- **Kayıtlı rota (depth):** 92
- **L1 (açılış) proven:** 83 · **L1 kanıtlanmamış:** 9
- **L2 complete:** 33 · **L2 partial:** 33 · **L2 not-covered:** 26 · _(stil sözleşmesi karşılanan: 66; etkileşim doğrulanmamış rota: 35)_
- **L3:** proven 0 · blocked 47 · N/A 45
- **L4:** proven 0 · blocked 92  ·  **L5:** proven 0 · blocked 92
- **En yüksek kanıt seviyesi dağılımı:** L0 9 · L1 17 · L2-stil 33 · L2-deep 33

> ⛔ **YANLIŞ ÖZET YASAK:** "83/92 L1 PASS" **≠** "L2 tamamlandı". L2 gerçekten tamamlanan rota: **33**. L3–L5 çoğunlukla staging/rol/provider bekliyor.

## 3) Hangi açık buglar hangi sayfaları etkiliyor? (bulgular)

- **Toplam bulgu:** 61 · **açık:** 60 · **kapalı:** 1 · **fixed-candidate:** 0
- **Açık (severity):** 🔴 critical 1 · 🟠 high 8 · 🟡 medium 44 · ⚪ low 7

### En fazla açık bulguya sahip sayfalar

| rota | açık bulgu | en ağır | dağılım |
|---|---|---|---|
| /settings | 5 | high | high:3, medium:2 |
| /supervisor/wallboard | 5 | medium | medium:4, low:1 |
| /voice/regulatory | 3 | critical | critical:1, high:1, medium:1 |
| /analytics | 3 | medium | medium:3 |
| /channels/email | 3 | medium | medium:3 |
| /bot-builder | 2 | high | high:1, low:1 |
| / | 2 | medium | medium:1, low:1 |
| /ai | 2 | medium | medium:1, low:1 |
| /bot-builder/{id} | 2 | medium | medium:2 |
| /campaigns/outbound | 2 | medium | medium:2 |
| /channels/sms | 2 | medium | medium:2 |
| /channels/social | 2 | medium | medium:2 |


## En yüksek riskli kapsam boşlukları

| öncelik | tür | rota | en yüksek kanıt | açıklama |
|---|---|---|---|---|
| 0 | L1_NOT_PROVEN | /bot-builder/:id | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /contacts/:id | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /monitoring | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /monitoring/agents | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /monitoring/ai-summary | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /monitoring/live | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /settings/billing | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /settings/billing/marketplace | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /supervisor/ai-rate-suggestions | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /bot-builder | L2_STYLE | Açık yüksek-önem bulgu: BOT-BUILDER-TEMPLATE-I18N(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /campaigns | L2_STYLE | Açık yüksek-önem bulgu: B2(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /inbox | L2_STYLE | Açık yüksek-önem bulgu: B3(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /settings | L2_DEEP | Açık yüksek-önem bulgu: B4(high), SETTINGS-BILLING-CHANGEPLAN(high), SETTINGS-BILLING-HISTORY(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /settings/billing | L0 | Açık yüksek-önem bulgu: SETTINGS-BILLING-REDIRECT(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /voice/regulatory | L2_STYLE | Açık yüksek-önem bulgu: B1(critical), VOICE-REGULATORY-BROKEN(high). |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | / | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /ai | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /ai/prompts | L1 | Açık bulgu var ve en yüksek kanıt seviyesi L1 — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /analytics | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /bot-builder | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |

_(+16 boşluk daha — tam liste JSON'da.)_

## Flaky testler

- Bu koşumda flaky rota yok.

## En yavaş rotalar (koşum süresi)

| rota | süre (ms) |
|---|---|
| /voice/regulatory | 16995 |
| /settings/profile | 14765 |
| /supervisor/agents | 14543 |
| /ai/sentiment | 13989 |
| /voice/recordings | 13977 |
| /contacts/import | 13799 |
| /campaigns/outbound | 13703 |
| /reports/campaign | 13700 |
| /analytics | 13663 |
| /reports/agent | 13623 |

## Staging / rol / provider nedeniyle bloklu (ve dikkat gerektiren) testler

| rota | durum | neden |
|---|---|---|
| /bot-builder/:id | NOT_RUN | inventory-only |
| /contacts/:id | NOT_RUN | inventory-only |
| /settings/billing | NOT_RUN | inventory-only |
| /settings/billing/marketplace | NOT_RUN | inventory-only |

**Derinlik blok sebepleri (L3–L5):**
- L3: STAGING_REQUIRED×47
- L4: ROLE_ACCOUNTS_REQUIRED×92
- L5: PROVIDER_HARNESS_REQUIRED×92

## Trend / geçmiş karşılaştırma

- ⚠️ **INSUFFICIENT_HISTORY** — Trend için ≥2 uygun snapshot gerekir; 0 bulundu. Sahte yüzde/eğilim üretilmez.
- Sahte yüzde/eğilim üretilmez. Trend için ≥2 güvenilir, aynı schemaVersion + commit/run kimlikli snapshot gerekir.

## Bu rapor neyi kanıtlar / ne kanıtlamaz

**Kanıtlar:**
- Kayıtlı rotaların son *kaydedilmiş* read-only koşum sonucu (PASS/FAIL/FLAKY/BLOCKED/NOT_RUN gizlenmeden).
- Her sayfanın kanıtlanmış otomasyon derinliği (L1–L5) ve etkileşim doğrulanmamış rotalar.
- Açık bulguların severity dağılımı ve hangi sayfaları etkilediği.
- Kaynaklar arası tutarsızlıklar (DRIFT) açıkça.

**Kanıtlamaz:**
- Üründeki tüm fonksiyonların uçtan uca test edildiğini.
- Derin fonksiyon/mutation/RBAC/dış-servis kapsamını (staging + rol + provider bekler → L3–L5 çoğu blocked).
- Cross-browser / visual kararlılığı (FAZ 7 alanı).
- Manşet provenance VERIFIED değilse, bu koşumun **taze** olduğunu.
- Bir sayfanın L1 PASS olması, L2+ derinliğinin tamamlandığını.
