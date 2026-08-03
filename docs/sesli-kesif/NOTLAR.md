# Sesli Arama (Voice) — Keşif Notları

Canlı gözlem: **2 Ağustos 2026**, app.vomenta.com (test hesabı, salt-okunur; oturum `auth.setup.js` ile üretildi). Rota `/voice` navigasyon sözleşmesinde kayıtlı (`tests/contracts/navigation.js` → heading "Live Calls").

## Mimari

`/voice` istemci tarafında **`/voice/live`**'a yönlenir ("Live Calls" hub'ı). Bölümün kendi **alt-navigasyonu 10 hedef** taşır (buton'lar; client-side yönlendirme). Eski testler yalnız 4'ünü biliyordu → **IVR Builder, SIP Trunks, SIP settings, Skills tamamen gözden kaçmıştı**. `/voice/regulatory` bölüm alt-nav'ında YOK (bkz. B10) ama erişilebilir rota.

| # | Alt-nav düğmesi | Rota | EN başlık |
|---|-----------------|------|-----------|
| 1 | Live Calls | `/voice/live` | Live Calls |
| 2 | Queues | `/voice/queues` | Queues |
| 3 | IVR Builder | `/voice/ivr` | IVR Builder |
| 4 | Phone Numbers | `/voice/dids` | Phone Numbers |
| 5 | Call History | `/voice/history` | Call History |
| 6 | Voicemails | `/voice/voicemail` | Voicemails |
| 7 | Recordings | `/voice/recordings` | Call Recordings |
| 8 | SIP Trunks | `/voice/sip-trunks` | SIP Trunks |
| 9 | SIP settings | `/voice/sip-settings` | SIP & phone settings |
| 10 | Skills | `/voice/skills` | Skills-Based Routing |
| — | (alt-nav'da yok) | `/voice/regulatory` | Regulatory / KYC (bozuk) |

## Per-sayfa kontrol + arketip envanteri

- **/voice (→/voice/live)** — KPI döşemeleri: Active Calls / Agents Available / Avg Wait Time / Answer Rate + mevcudiyet sayaçları (Available/On Call/Wrap-Up/Break/Offline); boş durum "No active calls right now". Salt-okunur (yazma yok). Konsol temiz.
- **/voice/queues** — **Create Queue**; her kuyruk kartında **Queue Settings** + **Delete queue X**; pagination (Page/Previous/Next çevrili). Yazma var. Konsol temiz.
- **/voice/ivr** — **YENİ.** subtitle "Design and manage interactive voice response flows"; **Create IVR**; tablo (Name/Type/Status/Last Modified/Assigned DID/Actions). Yazma var. Konsol temiz.
- **/voice/dids** — "Phone Numbers" + "Pending Requests"; **Register BYOC Number**, **Request Number**; tablo + satır **Assign/Unassign/Release**; filtreler (All Countries/Type/Status). `GET /api/v1/dids`. **Deep-link'te RSC yarışı: içerik ~5 sn sonra oturur → başlık beklenmeli** (ilk 3.5 sn'de boş görülebilir; bug değil, timing). Bilinen hata **B14** (red nedeni tooltip, veri-bağlı). Konsol temiz.
- **/voice/history** — filtreler (All Directions / All Status / From Date / To Date) + tablo; satır **Call back +…** (giden çağrı!), **Details**. `GET /api/v1/voice/calls`, `users`, `queues`. Konsol temiz.
- **/voice/voicemail** — **Mark All Read**; tablo + satır **Play Recording / Transcribe / Delete Voicemail / Mark as Read**. `GET /api/v1/voicemails`. Bilinen hata **B11** (işlem butonu a11y, veri-bağlı). **YENİ BULGU (VOICEMAIL-PAGER-I18N):** açılışta konsol `MISSING_MESSAGE: common.previousPage (en)` + `common.nextPage (en)`; pagination düğmeleri erişilebilir isim olarak **ham anahtar** gösteriyor.
- **/voice/recordings** — filtre (From/To Date) + tablo; satır **Play Recording / Download / Delete Recording** → **@export (Download)**. `GET /api/v1/voice/recordings`, `compliance/data-retention`. Konsol temiz.
- **/voice/sip-trunks** — **YENİ.** subtitle "Manage your SIP trunk connections…"; **Add SIP Trunk**; boş durum "No SIP Trunks / Add a SIP trunk to enable BYOC calling." Yazma var. Konsol temiz.
- **/voice/sip-settings** — **YENİ.** subtitle "Configure how this workstation registers for voice. Values are stored in **this browser**…"; alanlar: SIP extension, Display name, Endpoint mode (WebRTC/phys). **Config tarayıcıda (localStorage) saklanıyor**, sunucu profili yok → mutation semantiği farklı. Konsol temiz.
- **/voice/skills** — **YENİ.** subtitle "Assign skills and priorities to queue members…"; **Select Queue** açılırı. Kuyruk seçilince beceri/öncelik yönetimi. Konsol temiz.
- **/voice/regulatory** — **BOZUK.** Bölüm alt-nav'ı YOK (**B10**); tüm `voiceRegulatory` i18n namespace eksik → ham anahtarlar görünüyor (`voiceRegulatory.title/subtitle/startKyc/…`, **B1**) + konsol `MISSING_MESSAGE: voiceRegulatory (en)`. `GET /api/v1/regulatory/refs`.

## API uçları (L2/@data/@errorpath için)

Her Voice sayfası açılışta ortak: `GET /api/v1/dids`, `/api/v1/voice/calls/live` (polling), `/api/v1/auth/me`, `/api/v1/roles/me/permissions`, `/api/v1/settings/organization`, `/api/v1/modules/{active,catalog}`, `/api/v1/onboarding/progress`.

Sayfaya özel: hub → `voice/stats`, `queues`, `supervisor/dashboard`, `supervisor/agents`; queues → `queues`, `queues/callbacks/scheduled`; history → `voice/calls`, `users`, `queues`; voicemail → `voicemails`; recordings → `voice/recordings`, `compliance/data-retention`; regulatory → `regulatory/refs`.

## i18n (4 dil, hub canlı doğrulanmış)

Dil kenar çubuğu düğmesinden değişir; context içinde localStorage'da kalıcı → her test taze bağlamda İngilizce başlar, **tek switch** güvenilir. Arapça `dir=rtl`.

| Rota | en | tr | fr | ar |
|------|----|----|----|----|
| /voice | Live Calls | Canlı Aramalar | Appels en cours | المكالمات المباشرة |

Hub alt-başlık: en "Real-time view of all active calls across queues" · tr "Kuyruklar arasındaki tüm aktif çağrıların gerçek zamanlı görünümü" · fr "Vue en temps réel de tous les appels actifs dans les files d'attente" · ar "عرض مباشر لجميع المكالمات النشطة عبر قوائم الانتظار".

Hub alt-nav TR: Kuyruklar / IVR Oluşturucu / Telefon Numaraları / Arama Geçmişi / Sesli mesajlar / Kayıtlar / SIP Trunklar / SIP ayarları / Beceriler.

> Alt-rota başlık/alt-başlıklarının 4-dil literalleri, ilgili PR'da (PR-2..PR-11) o rotanın canlı keşfinde toplanıp page-object I18N tablosuna yazılır.

## Bulgular

**Zaten kayıtlı (regresyon):** B1 (`/voice/regulatory` ham i18n anahtarları), B10 (`/voice/regulatory` Voice sekme çubuğu yok), B11 (`/voice/voicemail` işlem butonu a11y, veri-bağlı), B14 (`/voice/dids` red nedeni tooltip, veri-bağlı).

**Bu keşifte açılan yeni bulgular:**
- **VOICEMAIL-PAGER-I18N** — `/voice/voicemail` açılışta konsol `MISSING_MESSAGE: common.previousPage (en)` + `common.nextPage (en)`; pagination düğmeleri erişilebilir isim/etiket olarak ham i18n anahtarını gösteriyor. B11'den ayrı (bu, veriden bağımsız, deterministik). PR-4'te registry'ye kaydedildi + `@clean @known-bug` guard testi.
- **VOICE-HISTORY-A11Y-LABEL** — `/voice/history` tarih filtre girdileri (From/To Date) erişilebilir etiket taşımıyor → axe `label` (critical). Kanallar B20–B25 ile aynı sistemik sınıf. PR-3'te registry'ye kaydedildi + `@a11y @known-bug` guard testi.
- **VOICE-SIP-TRUNKS-SUBTITLE-I18N** — `/voice/sip-trunks` başlık çevriliyor (SIP Hatları/Trunks SIP/خطوط SIP) ama alt-başlık 4 dilde de İngilizce ("Manage your SIP trunk connections…") kalıyor. PR-9'da registry + `@i18n @known-bug` guard.
- **VOICE-REGULATORY-BROKEN** — `/voice/regulatory` tüm `voiceRegulatory` i18n namespace eksik → `<main>` ham anahtar (voiceRegulatory.title…) veya BOŞ render ediyor (kararsız) + açılışta konsol `MISSING_MESSAGE: voiceRegulatory (en)` (deterministik). B1 (ham anahtar) + B10 (Voice alt-nav yok) ile aynı bozuk sayfanın kök nedeni. PR-7'de registry + `@i18n @clean @known-bug` guard; `@regression` B10 guard'ı.
- **VOICE-RECORDINGS-A11Y-LABEL** — `/voice/recordings` tarih filtre girdileri etiketsiz → axe `label` (critical, 2 düğüm). Aynı sistemik sınıf. PR-5'te registry + `@a11y @known-bug` guard. Ek gözlem: "Download" bir `<button>` (indirme-olayı üretmiyor; `GET .../recordings/<id>/stream` fetch'liyor) → @export ağ katmanında doğrulanır.

**Doğrulanmamış gözlem (tek örnek, veri-bağlı olabilir):** `/voice/recordings` ilk kaydın "Download" tıklamasında `GET /api/v1/voice/recordings/<id>/stream` **HTTP 500** döndü (3 Ağu 2026). Tek kayıtla gözlendiği için sistemik mi yoksa o dosyaya özgü mü belirsiz → registry bulgu OLARAK KAYDEDİLMEDİ; @export testi export eylemini statüden bağımsız doğrular. Staging'de çok-kayıtla teyit edilmeli.

## Test kapsamı (ilerleme)

- **PR-1 (bu):** `tests/pages/VoicePage.js` (hub, App.js'e kayıtlı) + `voice.authed.spec.js` (tam stil seti) + `voice-subnav.authed.spec.js` (10 hedef nav-L3) + `tested-pages.js` → `voice-hub`.
- **PR-2..PR-11:** alt-rotalar (queues/ivr/dids/history/voicemail/recordings/sip-trunks/sip-settings/skills/regulatory) — parametreli `VoiceSubPage.js` + per-rota spec.
