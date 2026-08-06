# Kanallar (Channels) — Keşif Notları

Canlı gözlem: **31 Temmuz 2026**, app.vomenta.com (test hesabı, salt-okunur; oturum `auth.setup.js` ile üretildi). Rota `/channels` navigasyon sözleşmesinde zaten kayıtlı (`tests/contracts/navigation.js`).

## Mimari

`/channels` bir **hub**: 7 kanal kartı ızgarası. Her kartta durum rozeti + "Configure" bağlantısı. Alt sayfalar ayrı rotalar; hub açılışında 7 kanalın da `GET /api/v1/channels/<kanal>/config` isteği atılır. Tüm sayfalarda `<main>` mevcut; başlıklar h2/h3 seviyesinde (h1 değil) → locator'lar `getByRole('heading',{name})`.

| Kart | Durum (canlı) | Configure hedefi |
|------|---------------|------------------|
| Voice | Not configured | `/voice` (diğerlerinden farklı!) |
| Web Chat | Connected | `/channels/webchat` |
| Email | Not configured | `/channels/email` |
| SMS | Not configured | `/channels/sms` |
| WhatsApp | Not configured | `/channels/whatsapp` |
| Social Media | Not configured | `/channels/social` |
| Video | Not configured | `/channels/video` |

## Per-sayfa kontrol envanteri

- **/channels** — kart ızgarası; kontrol yok (yalnız Configure bağlantıları). Konsol temiz.
- **/channels/webchat** — sekmeler: Configuration / Integration; renk+metin girdileri, 7 switch, 3 textarea; **Save Changes**, **Preview Widget**. Konsol temiz.
- **/channels/email** — **Add Account** (dialog), imza textarea, 2 switch, **Save Changes**; boş-durum "No email account connected".
- **/channels/sms** — **Send SMS**, filtreler (All Statuses/Directions), **Add Sender**, **Create Template**, Transceiver (SMPP host/port/şifre), **Save & Test**, **Save Changes**.
- **/channels/whatsapp** — boş-durum "API Not Configured" + "No templates yet"; **Create Template**, **Save Changes**.
- **/channels/social** — 6 platform kartı + **Connect**; **Save Changes**.
- **/channels/video** — kalite/fps seçicileri, **Save Changes**, **Start Video Call**. Konsol temiz.

## API uçları (L2/@data/@errorpath için)

Her sayfa `GET https://api.vomenta.com/api/v1/channels/<kanal>/config`. Ek: sms → `sender-ids`, `channels/templates/sms`, `channels/sms/messages`; whatsapp → `channels/templates/whatsapp`, `.../whatsapp/connection`; social → `.../social/connections`; video → `voice/video/livekit-status`.

## i18n (4 dil, canlı doğrulanmış başlık/alt-başlık)

Dil kenar çubuğu düğmesinden değişir; **localStorage'da kalıcı** (context içinde) → test taze başlar, tek switch. Arapça `dir=rtl`.

| Rota | en | tr | fr | ar |
|------|----|----|----|----|
| /channels | Channels | Kanallar | Canaux | القنوات |
| /channels/webchat | Web Chat Configuration | Canlı Sohbet Yapılandırması | Configuration du chat en direct | تكوين الدردشة المباشرة |
| /channels/email | Email Channel | E-posta Kanalı | Canal e-mail | قناة البريد الإلكتروني |
| /channels/sms | SMS Configuration | SMS Yapılandırması | Configuration SMS | إعدادات الرسائل القصيرة |
| /channels/whatsapp | WhatsApp Business | WhatsApp Business | WhatsApp Business | واتساب للأعمال |
| /channels/social | Social Media Channels | Sosyal Medya Kanalları | Canaux de réseaux sociaux | قنوات التواصل الاجتماعي |
| /channels/video | Video Call Configuration | Görüntülü Arama Yapılandırması | Configuration des appels vidéo | إعدادات مكالمات الفيديو |

## Bulgular (registry'ye kaydedildi)

**Zaten kayıtlı:** B5 (`/channels` Voice kartı yanlış "Not configured" + Configure `/voice`'a gidiyor, fixme), B9 (`/channels/email` imza ham anahtarı).

**Bu keşifte açılan yeni bulgular:**
- **B16** — `/channels/social` konsol: `MISSING_MESSAGE: channels.socialPage.platformNames. (en)`.
- **B17** — `/channels/email` konsol: `FORMATTING_ERROR: intl "p"` (varsayılan imza `<p>...</p>`).
- **B18** — `/channels/sms` konsol: `INVALID_MESSAGE: MALFORMED_ARGUMENT`.
- **B19** — `/channels/whatsapp` konsol: `INVALID_MESSAGE: MALFORMED_ARGUMENT`.
- **B20–B25** — 6 config alt sayfasında sistemik a11y: form alanları erişilebilir etiket taşımıyor (axe `label`/critical). webchat(5), email(1), sms(4), whatsapp(2), social(2), video(2) düğüm.

## Test kapsamı

Page object'ler: `tests/pages/Channels{Hub,Webchat,Email,Sms,Whatsapp,Social,Video}Page.js` (App.js'e kayıtlı).
Okuma spec'leri: `tests/channels-*.authed.spec.js` (smoke/i18n 4-dil/a11y/layout/clean/keyboard/deeplink/@data/3-katman/@visual).
Mutation spec'leri: `tests/channels-*-mutations.authed.spec.js` (staging-gated fixme; `mutation-lifecycle.js`'de beyanlı).
Sözleşmeler: `tested-pages.js` (**7 giriş**: hub + 6 alt sayfa), `known-bugs.js` (B16–B25).

## Kapsam kararı — Voice HARİÇ (Seçenek B)

Kanallar bölümü test kapsamı = **hub + 6 `/channels/*` alt sayfa = 7 yüzey**. Voice, Kanallar'ın
8. yüzeyi DEĞİLDİR:
- `navigation.js`'de Voice, Channels'tan bağımsız kendi üst-nav öğesi (`{ name:'Voice', path:'/voice', heading:'Live Calls' }`).
- `/voice` başlığı "Live Calls"; kanal-config sayfası değil, çağrı merkezi canlı arama alanı.
- `/voice` zaten kendi paketiyle kapsanıyor: `tests/voice/voice.authed.spec.js`, `tests/voice/voice-subnav.authed.spec.js`, `tests/voice/voice-call.mutation.authed.spec.js` → tekrar kapsanmaz.
- Hub'daki Voice kartının başlığı `<a href="/voice">` (canlı doğrulandı, 31 Tem 2026). Bu yönlendirmenin **bilinçli ürün kararı mı yoksa bug mı** olduğu KANITLANMADI (ürün gereksinimi/issue/sözleşme bulunamadı) → "bug değil" diye nitelenemez; registry'ye bug olarak da eklenmez (kanıt yok).

### B5 (Voice kartı durum etiketi) — kanıt

- Voice kartının görünen durum metni canlıda **"Not configured"** (main satırları: `Voice / Not configured / Inbound and outbound phone calls with IVR, queues, and recording / Configure`).
- Kart `a[href="/voice"]` üzerinden yalnızlaştırılabiliyor (başlık+parent yaklaşımı) — "data-testid yok" tek başına yeniden-üretim kanıtı değil.
- **fixme gerekçesi:** durum etiketinin DOĞRU olup olmadığını kanıtlayacak yer-gerçeği (Voice tenant'ta gerçekten yapılandırılmış mı?) client'tan bilinemiyor + Voice kartının durum rozeti için stabil semantik role/testid yok → güvenilir "doğru durumu gösteriyor" assertion'ı yazılamıyor. B5 `open`/`fixme` ve **önceki kapsamı (durum etiketi) korunur**.

Not: B16–B25 testleri `knownBugGuard` ile "beklenen başarısızlık"; bug açıkken CI yeşil, düzelince beklenmedik-geçiş verir.
