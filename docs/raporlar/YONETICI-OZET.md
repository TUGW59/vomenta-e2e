# Vomenta — Yönetici Kalite Özeti (Tek Gerçeklik)

> ⚙️ **Otomatik üretilir** (`npm run report:executive`). Üç AYRI gerçekliği — **koşum sonucu**, **kapsam derinliği**, **açık bulgular** — tek görünümde ama **semantiklerini karıştırmadan** birleştirir.
> **Üretim:** `2026-08-02T19:46:28.218Z` · **Manşet provenance:** ⛔ UNVERIFIED

> ⚠️ **DİKKAT:** Runtime sonuçları **UNVERIFIED** — TAZE, doğrulanmış bir Playwright koşumunu kanıtlamaz. Sayılar son *kaydedilmiş* snapshot'tandır; güncel koşum için `npm run report:runtime`.

## Kaynak künyesi

| Kaynak | Var mı | Commit | Ortam | Tarayıcı | Run ID | Üretim | Provenance |
|---|---|---|---|---|---|---|---|
| Runtime | ✅ | 88033f03ef638c926243e66ae525c66805bfd0a1 | production-read-only | chromium | — | 2026-08-02T19:46:28.218Z | ⛔ UNVERIFIED |
| Depth | ✅ | 88033f03ef638c926243e66ae525c66805bfd0a1 | production-read-only | chromium | — | 2026-08-02T19:46:28.218Z | — |
| Findings | ✅ | — | — | — | — | — | — |

## Kaynaklar arası tutarlılık: ⚠️ DRIFT

| Kontrol | Değerler | Uyumlu | Not |
|---|---|---|---|
| Kayıtlı rota sayısı | runtime=55, depth=65 | ❌ | İki snapshot farklı registry durumundan üretilmiş olabilir; runtime bölümü kendi sayısını, depth bölümü kendi sayısını kullanır. |
| Bilinen bulgu toplamı | runtimeSnapshot=50, findingsRegistry=61 | ❌ | Runtime snapshot bulgu sayısı ile canlı findings registry farklı → runtime snapshot bayat olabilir. Bulgu bölümü registry'yi kaynak alır. |
| Açık bulgu | runtimeSnapshot=49, findingsRegistry=60 | ❌ | Açık bulgu sayısı kaynaklar arası farklı. |

- ⚠️ Kayıtlı rota sayısı: kaynaklar uyuşmuyor (runtime=55, depth=65). İki snapshot farklı registry durumundan üretilmiş olabilir; runtime bölümü kendi sayısını, depth bölümü kendi sayısını kullanır.
- ⚠️ Bilinen bulgu toplamı: kaynaklar uyuşmuyor (runtimeSnapshot=50, findingsRegistry=61). Runtime snapshot bulgu sayısı ile canlı findings registry farklı → runtime snapshot bayat olabilir. Bulgu bölümü registry'yi kaynak alır.
- ⚠️ Açık bulgu: kaynaklar uyuşmuyor (runtimeSnapshot=49, findingsRegistry=60). Açık bulgu sayısı kaynaklar arası farklı.
- ⚠️ Runtime snapshot provenance = UNVERIFIED (sourcetype-missing-or-not-runtime, runid-missing, sha-mismatch). Bu sonuçlar TAZE, doğrulanmış bir Playwright koşumunu KANITLAMAZ.

## 1) Son koşumda ne çalıştı ve ne geçti? (runtime)

- **Kayıtlı rota (runtime snapshot):** 55
- **Tanımlanan test:** 1028 · **Güvenli/çalıştırılabilir test:** _ölçülmedi_ · **Bu koşumda seçilen:** 56 · **Bu koşumda çalışan:** 56
- **Rota durumu:** ✅ PASS 55 · ❌ FAIL 0 · 🟡 FLAKY 0 · ⛔ BLOCKED 0 · ⚪ NOT_RUN 0
- **Koşum lensi:** geçen 56 · başarısız 0 · flaky 0 · atlanan 0
- **Rotaya eşlenmeyen test:** 1 (sayfa durumuna sayılmaz — sahte PASS engeli).

> ℹ️ "Tanımlanan test" ile "bu koşumda çalışan test" **aynı sayı değildir**. Bir rotanın PASS olması yalnız read-only açılışını kanıtlar.

## 2) Her sayfanın otomasyon derinliği nedir? (kapsam)

- **Kayıtlı rota (depth):** 65
- **L1 (açılış) proven:** 55 · **L1 kanıtlanmamış:** 10
- **L2 complete:** 3 · **L2 partial:** 62 · **L2 not-covered:** 0 · _(stil sözleşmesi karşılanan: 65; etkileşim doğrulanmamış rota: 60)_
- **L3:** proven 0 · blocked 46 · N/A 19
- **L4:** proven 0 · blocked 65  ·  **L5:** proven 0 · blocked 65
- **En yüksek kanıt seviyesi dağılımı:** L0 10 · L1 0 · L2-stil 52 · L2-deep 3

> ⛔ **YANLIŞ ÖZET YASAK:** "55/65 L1 PASS" **≠** "L2 tamamlandı". L2 gerçekten tamamlanan rota: **3**. L3–L5 çoğunlukla staging/rol/provider bekliyor.

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
| 0 | L1_NOT_PROVEN | /voice/dids | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/history | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/ivr | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/queues | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/recordings | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/regulatory | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/sip-settings | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/sip-trunks | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/skills | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 0 | L1_NOT_PROVEN | /voice/voicemail | L0 | Sayfa açılışı (L1) kanıtlanmadı — read-only baseline bu rota için PASS değil. |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /bot-builder | L2_STYLE | Açık yüksek-önem bulgu: BOT-BUILDER-TEMPLATE-I18N(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /campaigns | L2_STYLE | Açık yüksek-önem bulgu: B2(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /inbox | L2_STYLE | Açık yüksek-önem bulgu: B3(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /settings | L2_DEEP | Açık yüksek-önem bulgu: B4(high), SETTINGS-BILLING-CHANGEPLAN(high), SETTINGS-BILLING-HISTORY(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /settings/billing | — | Açık yüksek-önem bulgu: SETTINGS-BILLING-REDIRECT(high). |
| 1 | OPEN_CRITICAL_HIGH_FINDING | /voice/regulatory | L0 | Açık yüksek-önem bulgu: B1(critical), VOICE-REGULATORY-BROKEN(high). |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | / | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /ai | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /analytics | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |
| 2 | FINDINGS_BEHAVIOR_UNVERIFIED | /bot-builder | L2_STYLE | Açık bulgu var ve en yüksek kanıt seviyesi L2_STYLE — davranış/etkileşim (L2-deep+) doğrulanmadı. |

_(+23 boşluk daha — tam liste JSON'da.)_

## Flaky testler

- Bu koşumda flaky rota yok.

## En yavaş rotalar (koşum süresi)

| rota | süre (ms) |
|---|---|
| /reports/quality | 8502 |
| /channels | 8210 |
| /ai | 8119 |
| /reports/sla | 8048 |
| /reports/dashboards | 7895 |
| /settings/hours | 7755 |
| /voice | 7707 |
| /workforce/surveys | 7619 |
| /workforce/schedules | 7188 |
| /campaigns | 7158 |

## Staging / rol / provider nedeniyle bloklu (ve dikkat gerektiren) testler

- Runtime tarafında FAIL/FLAKY/BLOCKED/NOT_RUN rota yok.

**Derinlik blok sebepleri (L3–L5):**
- L3: STAGING_REQUIRED×46
- L4: ROLE_ACCOUNTS_REQUIRED×65
- L5: PROVIDER_HARNESS_REQUIRED×65

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
