# Vomenta — Bulgu (Known-Bug) Raporu

> ⚙️ **Otomatik üretilir** — elle düzenlemeyin. Kaynak: `tests/contracts/known-bugs.js` (source of truth). Güncelle: `npm run report:findings`.
> HTML/PDF sürümü CI artifact'idir (repoda tutulmaz).

## Özet

- **Toplam bulgu:** 37
- **Durum:** open 36 · closed 1
- **Guard:** knownBugGuard 35 · fixme 1 · permanent 1
- **Ciddiyet:** critical 1 · high 7 · medium 26 · low 3

### Governance işaretleri
- **Sahipsiz (owner=null):** 34 — B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, ANALYTICS-A, ANALYTICS-B, REPORTS-INTL, REPORTS-AIKEY, REPORTS-SECTIONS-TZ, DASHBOARDS-SHARE-OVERFLOW, CAMPAIGNS-PAGER, CAMPAIGNS-ICON-A11Y, AGENTS-TZ, WALLBOARD-I18N, CONTACTS-F1, CONTACTS-F2, WALLBOARD-THEME, WALLBOARD-AUTOSCROLL, WALLBOARD-LIVE-TZ, WALLBOARD-RESUME-I18N, SETTINGS-BILLING-REDIRECT, SETTINGS-BILLING-CHANGEPLAN, SETTINGS-BILLING-HISTORY
- **Doğrulanmamış (lastVerified=null, açık):** 15 — B5, ANALYTICS-A, ANALYTICS-B, REPORTS-INTL, REPORTS-AIKEY, REPORTS-SECTIONS-TZ, DASHBOARDS-SHARE-OVERFLOW, CAMPAIGNS-PAGER, CAMPAIGNS-ICON-A11Y, AGENTS-TZ, WALLBOARD-I18N, WALLBOARD-THEME, WALLBOARD-AUTOSCROLL, WALLBOARD-LIVE-TZ, WALLBOARD-RESUME-I18N
> Not: `expiry` gözden geçirme tarihi tarih-bağımlıdır; süresi-geçmiş uyarıları `quality:findings` (self-check) tarafından koşum anında basılır — rapora gömülmez (determinizm).

## Bulgu dizini

| id | alan | rota | ciddiyet | durum | guard | owner |
|---|---|---|---|---|---|---|
| B13 | ai | /ai | low | open | knownBugGuard | — |
| ANALYTICS-A | analytics | /analytics | medium | open | knownBugGuard | — |
| ANALYTICS-B | analytics | /analytics | medium | open | knownBugGuard | — |
| B12 | analytics | /analytics | medium | open | knownBugGuard | — |
| B2 | campaigns | /campaigns | high | open | knownBugGuard | — |
| CAMPAIGNS-ICON-A11Y | campaigns | /campaigns/outbound | medium | open | knownBugGuard | — |
| CAMPAIGNS-PAGER | campaigns | /campaigns/outbound | medium | open | knownBugGuard | — |
| B5 | channels | /channels | medium | open | fixme | — |
| B9 | channels | /channels/email | medium | open | knownBugGuard | — |
| CONTACTS-F1 | contacts | /contacts | medium | open | knownBugGuard | — |
| CONTACTS-F2 | contacts | /contacts | medium | open | knownBugGuard | — |
| B3 | inbox | /inbox | high | open | knownBugGuard | — |
| B8 | inbox | /inbox | high | closed | permanent | — |
| B15 | navigation | /ai | medium | open | knownBugGuard | — |
| REPORTS-AIKEY | reports | /reports | medium | open | knownBugGuard | — |
| REPORTS-INTL | reports | /reports | medium | open | knownBugGuard | — |
| REPORTS-SECTIONS-TZ | reports | /reports/call | medium | open | knownBugGuard | — |
| DASHBOARDS-SHARE-OVERFLOW | reports | /reports/dashboards | medium | open | knownBugGuard | — |
| B4 | settings | /settings | high | open | knownBugGuard | — |
| SETTINGS-BILLING-CHANGEPLAN | settings | /settings | high | open | knownBugGuard | — |
| SETTINGS-BILLING-HISTORY | settings | /settings | high | open | knownBugGuard | — |
| B6 | settings | /settings | medium | open | knownBugGuard | — |
| B7 | settings | /settings | medium | open | knownBugGuard | — |
| SETTINGS-BILLING-REDIRECT | settings | /settings/billing | high | open | knownBugGuard | — |
| AGENTS-TZ | supervisor | /supervisor/agents | medium | open | knownBugGuard | — |
| WALLBOARD-AUTOSCROLL | supervisor | /supervisor/wallboard | medium | open | knownBugGuard | — |
| WALLBOARD-I18N | supervisor | /supervisor/wallboard | medium | open | knownBugGuard | — |
| WALLBOARD-LIVE-TZ | supervisor | /supervisor/wallboard | medium | open | knownBugGuard | — |
| WALLBOARD-THEME | supervisor | /supervisor/wallboard | medium | open | knownBugGuard | — |
| WALLBOARD-RESUME-I18N | supervisor | /supervisor/wallboard | low | open | knownBugGuard | — |
| B14 | voice | /voice/dids | medium | open | knownBugGuard | — |
| B1 | voice | /voice/regulatory | critical | open | knownBugGuard | — |
| B10 | voice | /voice/regulatory | medium | open | knownBugGuard | — |
| B11 | voice | /voice/voicemail | medium | open | knownBugGuard | — |
| WORKFORCE-ADHERENCE-I18N | workforce | /workforce | low | open | knownBugGuard | quality-guild |
| WORKFORCE-BADGES-NO-EDIT-DELETE | workforce | /workforce/badges | medium | open | knownBugGuard | quality-guild |
| WORKFORCE-SURVEYS-ICON-A11Y | workforce | /workforce/surveys | medium | open | knownBugGuard | quality-guild |

## Ayrıntılar

## ai

### /ai

**[B13] AI sekme etiketinde boşluk eksik ("Yapay ZekaTemsilciler")** — `low` · `open` · guard `knownBugGuard`

- **Beklenen:** Sekme etiketinde boşluk doğru ("Yapay Zeka Temsilciler")
- **Gerçekleşen:** Bitişik yazım "ZekaTemsilciler" (yalnızca TR arayüzde)
- **Repro:** /ai aç (TR arayüz) → sekme etiketini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B13 · /ai · sekme etiketinde boşluk eksik olmamalı ("Yapay ZekaTemsilciler")

## analytics

### /analytics

**[ANALYTICS-A] "Deep analytics" bölümü hiçbir dilde çevrilmiyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Deep analytics başlıkları hedef dilde çevrili
- **Gerçekleşen:** Çevrilmemiş İngilizce metin sızıyor (tr/fr/ar). B12 yalnız TR; bu guard üç dili kapsar
- **Repro:** /analytics aç → dili tr/fr/ar yap → Deep analytics bölümü metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/analytics.authed.spec.js` → BULGU A [tr]: "Deep analytics" bölümü tr arayüzde çevrili olmalı

**[ANALYTICS-B] İç/teknik terim "ClickHouse" kullanıcıya görünüyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** İç/teknik terim kullanıcıya görünmez
- **Gerçekleşen:** Kullanıcıya dönük metinde "ClickHouse" görünüyor (İngilizce dahil)
- **Repro:** /analytics aç → main metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/analytics.authed.spec.js` → BULGU B: iç terim "ClickHouse" kullanıcıya görünmemeli

**[B12] TR arayüzde İngilizce/iç metin sızıyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** TR arayüzde İngilizce/iç metin yok
- **Gerçekleşen:** Deep analytics / Call abandonment / ClickHouse vb. sızıyor (yalnızca TR arayüzde)
- **Repro:** /analytics aç (TR arayüz) → main metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B12 · /analytics · TR arayüzde İngilizce/iç metin sızmamalı

## campaigns

### /campaigns

**[B2] Kampanya ilerleme yüzdesi 100ü aşıyor** — `high` · `open` · guard `knownBugGuard`

- **Beklenen:** Tüm ilerleme yüzdeleri ≤ 100
- **Gerçekleşen:** %200 gözlendi
- **Repro:** /campaigns aç → kampanya kartlarının yüzde metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B2 · /campaigns · ilerleme yüzdesi 100ü aşmamalı

### /campaigns/outbound

**[CAMPAIGNS-ICON-A11Y] Satır işlem ikonları (göz/sil) erişilebilir isimsiz** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** göz/sil ikonlarının erişilebilir ismi var
- **Gerçekleşen:** Satır işlem ikonları erişilebilir isimsiz (a11y button-name)
- **Repro:** /campaigns/outbound aç → satır işlem ikonlarının erişilebilir ismini kontrol et
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/campaigns-outbound.authed.spec.js` → BULGU 2: satır işlem ikonlarının (göz/sil) erişilebilir ismi olmalı

**[CAMPAIGNS-PAGER] 10+ kampanyada sayfalama/daha-fazla kontrolü yok** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Kalan kampanyalara erişim (pager veya 10+ satır)
- **Gerçekleşen:** Liste 10'da kapanıyor; API hasNextPage:true ama sayfalama/sonsuz-kaydırma yok (10+ kampanya varsa)
- **Repro:** /campaigns/outbound aç → liste yanıtında hasNextPage:true ise sayfalama/satır sayısını kontrol et
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/campaigns-outbound.authed.spec.js` → BULGU 1: 10+ kampanya varsa sayfalama/daha-fazla kontrolü olmalı

## channels

### /channels

**[B5] Ses kartı yanlışlıkla "Yapılandırılmadı" gösterebiliyor** — `medium` · `open` · guard `fixme`

- **Beklenen:** Ses kartı gerçek durumu gösterir
- **Gerçekleşen:** Güvenilir test yok; /channels <main> kullanmıyor ve kart için stabil role/testid yok (test.fixme)
- **Repro:** /channels aç → Voice/Ses kartının durum etiketini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Olası çözümler:** Frontend: kart için data-testid (ör. data-testid="channel-card-voice") ekle
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B5 · /channels · Ses kartı yanlışlıkla "Yapılandırılmadı" göstermemeli

### /channels/email

**[B9] Varsayılan e-posta imzasında ham i18n anahtarı** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Çevrilmiş varsayılan imza metni
- **Gerçekleşen:** Ham anahtar "channels.emailPage.defaultSignatureText" input değerinde görünüyor
- **Repro:** /channels/email aç → imza alanını (textarea/contenteditable) oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B9 · /channels/email · varsayılan imza ham i18n anahtarı göstermemeli

## contacts

### /contacts

**[CONTACTS-F1] Satır ara butonu erişilebilir ismi ham anahtar "callContact"** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** aria-label anlamlı (ham anahtar değil)
- **Gerçekleşen:** aria-label ham i18n anahtarı "callContact"
- **Repro:** /contacts aç → satır ara butonunun aria-label'ını oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/contacts.authed.spec.js` → BULGU F1: satır ara butonu erişilebilir ismi ham anahtar "callContact" olmamalı

**[CONTACTS-F2] Kişi detayı sil butonu ham anahtar "contacts.delete" gösteriyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Çevrilmiş "Delete/Sil" metni
- **Gerçekleşen:** Görünür metin ham anahtar "contacts.delete"
- **Repro:** /contacts aç → ilk kişiyi aç → Quick Actions render olsun → sil butonu metnini kontrol et
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/contacts.authed.spec.js` → BULGU F2: kişi detayı sil butonu ham anahtar "contacts.delete" göstermemeli

## inbox

### /inbox

**[B3] Ham i18n anahtarı inbox.noMessagesYet görünüyor** — `high` · `open` · guard `knownBugGuard`

- **Beklenen:** Çevrilmiş boş-durum metni
- **Gerçekleşen:** Ham anahtar "inbox.noMessagesYet" görünüyor
- **Repro:** /inbox aç → Soft Phone başlığı görünsün → içerik metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B3 · /inbox · ham i18n anahtarı inbox.noMessagesYet görünmemeli

**[B8] Softphone müsaitlik menüsü görsel açılmıyordu** — `high` · `closed` · guard `permanent`

- **Beklenen:** Menü görünür (opacity>0, boyut>0)
- **Gerçekleşen:** 28 Tem itibarıyla DÜZELMİŞ; kalıcı regresyon guard'ı olarak tutuluyor
- **Repro:** /inbox aç → Softphone müsaitlik tetikleyicisine tıkla → menü görünürlüğünü ölç
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B8 · Softphone · müsaitlik açılır menüsü GÖRSEL olarak açılmalı

## navigation

### /ai

**[B15] Sol menü bölüm üst-başlığı bölüm köküne gitmiyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Üst-başlık bölüm köküne (/ai) gider
- **Gerçekleşen:** URL değişmiyor (grup başlığı yalnız alt-menü açıyor) — UX beklentisi
- **Repro:** /ai/voice aç → sol menüde "AI/Yapay Zeka" üst-başlığına tıkla → URL yolunu kontrol et
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli

## reports

### /reports

**[REPORTS-AIKEY] AI Insights panelinde ham i18n anahtarı (reports.aiInsightsDesc)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Çevrilmiş açıklama
- **Gerçekleşen:** Ham anahtar "reports.aiInsightsDesc" görünüyor
- **Repro:** /reports aç → AI Insights sekmesine tıkla → panel metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/reports.authed.spec.js` → AI Insights panelinde ham i18n anahtarı sızmamalı (reports.aiInsightsDesc) @known-bug

**[REPORTS-INTL] AI Insights intl FORMATTING_ERROR (sessiz konsol hatası)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Sessiz intl hatası yok
- **Gerçekleşen:** intl FORMATTING_ERROR ("variable 'type' was not provided to the string 'Generate AI insights...'")
- **Repro:** /reports aç → AI Insights sekmesine tıkla → konsol/diagnostics temizliğini kontrol et
- **Olası nedenler:** Eksik intl değişkeni ("type") — çeviri string'ine sağlanmamış (konsol mesajında belirtilmiş)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/reports.authed.spec.js` → sayfa intl FORMATTING_ERROR sessiz hatası üretmemeli @known-bug

### /reports/call

**[REPORTS-SECTIONS-TZ] Date Range "Today" etiketi UTC (yerel değil)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Etiket yerel bugünü gösterir
- **Gerçekleşen:** Etiket UTC ile basılıyor → UTC+3'te başlangıç bir gün geride ("dün") görünüyor
- **Repro:** /reports/call aç (Europe/Istanbul) → "Today" preset seç → Date Range başlangıç etiketini oku
- **Olası nedenler:** Aralık API'de yerel-gece-yarısına göre doğru; etiket UTC ile formatlanıyor (manuel raporda belgelenmiş)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** docs/manuel-test-raporu/02-tarih-araligi-utc.md (manual-report)
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/reports-sections.authed.spec.js` → L3: "Today" preset tarih etiketi YEREL bugünü göstermeli (UTC değil) [BULGU]

### /reports/dashboards

**[DASHBOARDS-SHARE-OVERFLOW] Paylaş diyaloğu yatayda taşıyor (~266px)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Diyalog içeriği kart içinde kalır (taşma ≤ 2px)
- **Gerçekleşen:** Uzun URL diyaloğu ~266px taşırıyor
- **Repro:** /reports/dashboards aç → paylaş diyaloğunu aç (her dilde) → yatay taşmayı ölç
- **Olası nedenler:** flex-1 kapsayıcıda min-w-0 yok (kaynakta gözlenen)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Olası çözümler:** flex kapsayıcıya min-w-0 ekle
- **Kanıt:** docs/manuel-test-raporu/01-panolar-paylas-tasma.md (manual-report)
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/reports-dashboards.authed.spec.js` → L3 görev OK: [en] paylaş diyaloğu yatayda taşmamalı [BULGU 1] @layout @known-bug

## settings

### /settings

**[B4] "Manage Modules" kök sayfaya (/) düşüyor** — `high` · `open` · guard `knownBugGuard`

- **Beklenen:** İlgili modül yönetim sayfası açılır
- **Gerçekleşen:** /settings → (geçici) /settings/billing/marketplace → "/" (kök fallback). Doğrudan deep-link de aynı şekilde "/"ye yönleniyor.
- **Repro:** /settings aç → Modüller sekmesi → "Manage Modules" tıkla
- **Olası nedenler:** Yönlendirme/route fallback zinciri kök route ("/") ile sonuçlanıyor (kaynakta gözlenen akış).; Yetki eksikliği (settings.billing.*/modules yok) → korunan uç 403 → yetkisiz kullanıcıya açık "erişim yok" durumu yerine Dashboard'a fallback (canlı gözlem).
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B4 · /settings · "Manage Modules" kök sayfaya atmamalı

**[SETTINGS-BILLING-CHANGEPLAN] Ayarlar hub "Change plan" linki kök sayfaya (/) düşüyor** — `high` · `open` · guard `knownBugGuard`

- **Beklenen:** Plan değiştirme sayfası açılır
- **Gerçekleşen:** "Change plan" → /settings/billing → "/" (kök fallback). Ayrıca "Change plan" ve "Billing history" aynı /settings/billing URL'ine işaret ediyor.
- **Repro:** /settings aç → Billing & Usage sekmesi → "Change plan" linkine tıkla
- **Olası nedenler:** /settings/billing rota fallback'i + billing yetkisi eksik (bkz. SETTINGS-BILLING-REDIRECT).
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → SETTINGS-BILLING-CHANGEPLAN · Ayarlar "Change plan" kök sayfaya atmamalı

**[SETTINGS-BILLING-HISTORY] Ayarlar hub "Billing history" linki kök sayfaya (/) düşüyor** — `high` · `open` · guard `knownBugGuard`

- **Beklenen:** Fatura geçmişi sayfası açılır
- **Gerçekleşen:** "Billing history" → /settings/billing → "/" (kök fallback)
- **Repro:** /settings aç → Billing & Usage sekmesi → "Billing history" linkine tıkla
- **Olası nedenler:** /settings/billing rota fallback'i + billing yetkisi eksik (bkz. SETTINGS-BILLING-REDIRECT).
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → SETTINGS-BILLING-HISTORY · Ayarlar "Billing history" kök sayfaya atmamalı

**[B6] Davet satırları ayırt edilemiyor (placeholder "Invited User")** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Davet satırları ayırt edilebilir (gerçek e-posta/isim)
- **Gerçekleşen:** Placeholder "Invited User" satırları ayırt edilemiyor (yalnızca bekleyen davet varsa reproduce olur)
- **Repro:** /settings aç → Kullanıcılar sekmesi → davet satırlarını incele (veri gerektirir)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B6 · /settings · davet satırları ayırt edilebilir olmalı (placeholder "Invited User" değil)

**[B7] Modüller açıklaması iki kez render ediliyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Açıklama tek kez görünür
- **Gerçekleşen:** 30 Tem 2026 canlı: açıklama İKİ görünür öğede tekrar ediyor — bir <div class="text-sm text-muted-foreground"> ve bir <p class="text-sm text-muted-foreground mb-4">. Eski guard yalnız <p> paragraflarını karşılaştırdığı için div+p tekrarını KAÇIRIYORDU (false-green). Bulgu yeniden açıldı.
- **Repro:** /settings aç → Modüller sekmesi → açıklama metnini içeren görünür öğeleri say
- **Olası nedenler:** Açıklama hem panel başlığı/alt-metni (<div>) hem de gövde paragrafı (<p>) olarak iki ayrı öğede basılıyor (canlı gözlem).
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B7 · /settings · Modüller açıklaması iki kez render edilmemeli

### /settings/billing

**[SETTINGS-BILLING-REDIRECT] /settings/billing deep-link kök sayfaya (/) yönleniyor** — `high` · `open` · guard `knownBugGuard`

- **Beklenen:** Billing & Usage sayfası açılır (yetki yoksa açık "erişim yok" durumu gösterilir)
- **Gerçekleşen:** /settings/billing ~1.5sn görünüp korunan uçlardan 403 aldıktan sonra "/" (Dashboard) sayfasına yönleniyor
- **Repro:** /settings/billing doğrudan aç (deep-link) → URL oturana kadar bekle
- **Olası nedenler:** Korunan billing uçları 403 dönünce sayfa kök route ("/") fallback'ine yönleniyor; yetkisiz kullanıcıya açık "erişim yok" durumu yerine Dashboard'a atıyor (canlı gözlem).
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → SETTINGS-BILLING-REDIRECT · /settings/billing deep-link kök sayfaya atmamalı

## supervisor

### /supervisor/agents

**[AGENTS-TZ] "Last refreshed" saati UTC (yerel değil)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Yerel saat gösterilir
- **Gerçekleşen:** Sunucu UTC saatini çevirmeden basıyor → UTC+3'te ~180 dk sapma (Wallboard BULGU 4 ile aynı)
- **Repro:** /supervisor/agents aç (Europe/Istanbul) → "Last refreshed at HH:MM" saatini oku
- **Olası nedenler:** Sunucu UTC zamanı yerel zamana çevrilmeden bastırılıyor (kaynakta gözlenen)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/supervisor-agents.authed.spec.js` → BULGU: "Last refreshed" saati yerel saat olmalı (UTC değil)

### /supervisor/wallboard

**[WALLBOARD-AUTOSCROLL] Auto-scroll toggle açılıyor ama içerik kaydırmıyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** İçerik taşınca otomatik kaydırır (maxScrollTop > 0)
- **Gerçekleşen:** Toggle aktif duruma geçiyor ama (TV modu dahil) hiç kaydırmıyor
- **Repro:** /supervisor/wallboard aç → içerik taşacak viewport ayarla → Auto-scroll toggle aç → scrollTop değişimini gözle
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/supervisor-wallboard.authed.spec.js` → L3 görev OK: içerik taşınca otomatik kaydırmalı [BULGU 3]

**[WALLBOARD-I18N] "Refresh All"/"Auto-scroll" hiçbir dilde çevrilmiyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Butonlar TR arayüzde çevrili
- **Gerçekleşen:** "Refresh All"/"Auto-scroll" çevrilmiyor (İngilizce kalıyor)
- **Repro:** /supervisor/wallboard aç → dili TR yap → "Refresh All"/"Auto-scroll" butonlarını ara
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/supervisor-wallboard.authed.spec.js` → BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli

**[WALLBOARD-LIVE-TZ] Live son-güncelleme saati UTC (yerel değil)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Yerel saat gösterilir
- **Gerçekleşen:** Saat UTC basılıyor → UTC+3'te ~180 dk sapma (AGENTS-TZ ile aynı sınıf)
- **Repro:** /supervisor/wallboard aç (Europe/Istanbul) → Live son-güncelleme saatini oku
- **Olası nedenler:** Sunucu UTC zamanı yerel zamana çevrilmeden bastırılıyor (kaynakta gözlenen)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/supervisor-wallboard.authed.spec.js` → L3 görev OK: gösterilen son-güncelleme saati yerel saat olmalı (UTC değil) [BULGU 4]

**[WALLBOARD-THEME] Tema seçici "Dark" seçilince koyu tema uygulanmıyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** <html> koyu temaya geçer (dark class)
- **Gerçekleşen:** Seçici değeri "Dark" olsa da <html> class "light" kalıyor (tema uygulanmıyor)
- **Repro:** /supervisor/wallboard aç → Tema seçici → "Dark" → <html> class'ını kontrol et
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/supervisor-wallboard.authed.spec.js` → L3 görev OK: "Dark" seçilince koyu tema uygulanmalı [BULGU 1]

**[WALLBOARD-RESUME-I18N] "Resume queue" menü öğesi hiçbir dilde çevrilmiyor** — `low` · `open` · guard `knownBugGuard`

- **Beklenen:** TR menüde çevrili (diğer 4 öğe gibi)
- **Gerçekleşen:** İngilizce "Resume queue" kalıyor (menü içi çeviri sızıntısı)
- **Repro:** /supervisor/wallboard aç → dili TR yap → ⋮ kuyruk menüsünü aç → "Resume queue" öğesini kontrol et
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** — · **expiry:** —
- **Guard testi:** `tests/supervisor-wallboard.authed.spec.js` → BULGU 5: "Resume queue" Türkçe menüde çevrilmeli

## voice

### /voice/dids

**[B14] Reddedilen DID talebinin nedeni tam okunamıyor** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Red nedeni tam okunabilir (tooltip/title ile)
- **Gerçekleşen:** Red nedeni kırpık; tooltip/title yok (yalnızca reddedilmiş talep varsa reproduce olur)
- **Repro:** /voice/dids aç → Bekleyen Talepler → reddedilmiş talebin nedenini incele (veri gerektirir)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı

### /voice/regulatory

**[B1] Ham i18n anahtarları görünüyor (regülasyon sayfası)** — `critical` · `open` · guard `knownBugGuard`

- **Beklenen:** Çevrilmiş etiketler görünür (ör. "Start KYC")
- **Gerçekleşen:** 9 ham i18n anahtarı görünüyor (voiceRegulatory.title, .startKyc, …)
- **Repro:** /voice/regulatory aç → KYC içeriği yüklensin → sayfa metnini oku
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B1 · /voice/regulatory · ham i18n anahtarları görünmemeli

**[B10] Voice üst sekme çubuğu yok (bölüm düzeni kayıp)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Voice bölüm sekme çubuğu içerik alanında görünür
- **Gerçekleşen:** Sekme çubuğu yok → bölüm düzeni kayıp
- **Repro:** /voice/regulatory aç → içerik alanında Voice sekme çubuğunu (Live Calls) ara
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B10 · /voice/regulatory · Voice sekme çubuğu görünmeli (bölüm düzeni)

### /voice/voicemail

**[B11] Sesli mesaj işlem butonlarının erişilebilir ismi yok** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** Tüm işlem butonlarının erişilebilir ismi var
- **Gerçekleşen:** İsimsiz işlem butonları (yalnızca sesli mesaj/işlem verisi varsa reproduce olur)
- **Repro:** /voice/voicemail aç → tablo/işlem butonlarının erişilebilir ismini kontrol et (veri gerektirir)
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** _atanmadı_ · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-28 · **expiry:** —
- **Guard testi:** `tests/known-bugs.authed.spec.js` → B11 · /voice/voicemail · İşlemler butonlarının erişilebilir ismi olmalı

## workforce

### /workforce

**[WORKFORCE-ADHERENCE-I18N] Uyum (Adherence) paneli Türkçe seçiliyken İngilizce fallback gösteriyor** — `low` · `open` · guard `knownBugGuard`

- **Beklenen:** Uyum paneli başlık/metni seçili dile (Türkçe) çevrilir
- **Gerçekleşen:** Panel İngilizce fallback gösteriyor: "Adherence Trend", "Average adherence percentage over time", "No historical adherence data available" (Türkçe UI'da çevrilmemiş).
- **Repro:** /workforce aç ve dili Türkçe yap → Uyum sekmesine geç → Panel başlığı/metnini kontrol et
- **Olası nedenler:** Adherence panel bileşeni i18n anahtarları yerine sabit İngilizce metin kullanıyor
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** quality-guild · **issueRef:** _yok_ · **opened:** 2026-07-31 · **lastVerified:** 2026-07-31 · **expiry:** —
- **Guard testi:** `tests/workforce.authed.spec.js` → Türkçe seçiliyken Uyum paneli İngilizce fallback göstermemeli

### /workforce/badges

**[WORKFORCE-BADGES-NO-EDIT-DELETE] Rozet satırında düzenle/sil kontrolü yok (UI'dan kaldırılamıyor)** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** rozet satırı en az bir aksiyon (düzenle veya sil) sunar
- **Gerçekleşen:** Rozet oluşturulabiliyor ama satırda düzenle/sil kontrolü yok → rozet UI'dan kaldırılamıyor (orphan riski)
- **Repro:** /workforce/badges aç → Tüm rozetler tablosunda bir satırın düzenle/sil kontrolü olup olmadığını kontrol et
- **Olası nedenler:** rozet yönetimi salt-create tasarlanmış; düzenle/sil UI eklenmemiş
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** quality-guild · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/workforce-badges.authed.spec.js` → bir rozet satırı en az bir aksiyon (düzenle/sil) kontrolü sunmalı

### /workforce/surveys

**[WORKFORCE-SURVEYS-ICON-A11Y] Anket satırı işlem ikonları (düzenle/sil) erişilebilir isimsiz** — `medium` · `open` · guard `knownBugGuard`

- **Beklenen:** düzenle/sil ikonlarının erişilebilir ismi (aria-label) var
- **Gerçekleşen:** Satır düzenle/sil ikon-butonları erişilebilir isimsiz (a11y button-name / WCAG 4.1.2)
- **Repro:** /workforce/surveys aç → Anketler tablosunda satır düzenle (kalem) ve sil (çöp) ikonlarının erişilebilir ismini kontrol et
- **Olası nedenler:** ikon-buton yalnız SVG ikon içeriyor; aria-label/görünmez metin yok
- **Kök neden (kanıtlanmış):** _araştırılmadı / kanıtlanmadı_
- **Kanıt:** _yok (WP-R3 forensik yakalama dolduracak)_
- **Owner:** quality-guild · **issueRef:** _yok_ · **opened:** — · **lastVerified:** 2026-07-30 · **expiry:** —
- **Guard testi:** `tests/workforce-surveys.authed.spec.js` → satır aksiyon ikonları erişilebilir ad taşımalı
