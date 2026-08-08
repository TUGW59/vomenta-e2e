# Paket 2 — Channels + Voice (canlı Chrome derin doğrulama)

RUN dev-surface-20260807-140629 · Test User · tr-TR · salt-okunur.
PII NOTU: SMS/WhatsApp/Arama Geçmişi gerçek telefon numaraları ve mesaj/ses içeriği
gösteriyor → aşağıda maskelenmiştir; screenshot id'leri konuşma akışında.

## Channels

| Rota | Başlık | Durum / içerik | Kontroller | Kanıt | Bulgu |
|---|---|---|---|---|---|
| `/channels` | Kanallar (hub) | 🔴 **6sn sonra hâlâ loading skeleton — kartlar render olmuyor** | — | ss_7059wx0hr | **F-015 false-green / broken hub** |
| `/channels/email` | E-posta Kanalı | Bağlı hesap tablosu (SMTP), imza, oto-yanıt toggle | Hesabı Güncelle, sil = mutation | ss_3977p2exp | **F-001 ham i18n `channels.emailPage.defaultSignatureText`** |
| `/channels/webchat` | Canlı Sohbet Yapılandırması | sub-tab Yapılandırma/Entegrasyon; widget renk/konum/karşılama; Bot Akışı | config form = observed | ss_0425rgp4k | karşılama metni EN default |
| `/channels/sms` | SMS Yapılandırması | Mesaj Günlüğü tablosu (Kimden/Kime/Mesaj/Durum/Tarih); filtreler | SMS Gönder = mutation; filtreler safe | ss_4496oqngq | **SMPP bind failed** (geçmiş başarısızlıklar); PII telefon |
| `/channels/whatsapp` | WhatsApp Business | stat kartları (skeleton) + Şablonlar tablosu (5 template APPROVED) | Şablon Oluştur, kebab = mutation | ss_7794oitt3 | stat kartları yavaş; PII içerik |
| `/channels/social` | Sosyal Medya Kanalları | FB/IG/TikTok (Bağlı Değil) · Telegram/LINE/Twitter (Bağlı) · Bot Akışı | Bağlan/Bağlantıyı Kes = mutation | ss_1013qzpjw | **WhatsApp içeriği bu sayfaya sızmış** (yanlış yerleşim) |
| `/channels/video` | Görüntülü Arama Yapılandırması | Maks katılımcı(10), Kayıt/Sanal arka plan toggle, Kalite (LiveKit) | config form = observed | ss_5971ualzb | — |

## Voice — çoğu rota ALIAS/TAB (route konsolidasyonu)

| Rota | Gerçekte | Başlık | İçerik | Kanıt | Bulgu |
|---|---|---|---|---|---|
| `/voice` | ≡ `/voice/dids` | Telefon Numaraları | DID tablosu (2 numara, Taslak, Twilio, $1); sub-tab Numaralar/Sahipsiz akışlar(14) | ss_7050qh56r | **F-016 /voice==/voice/dids** |
| `/voice/dids` | kanonik | Telefon Numaraları | (aynı) | ss_1598u8cnw | Numara ekle = mutation; PII US numaraları |
| `/voice/queues` | **→ `/settings/teams` redirect** | Ekipler | teams sayfası (final URL /settings/teams) | ss_6310pvo6p | **F-017 queues=teams alias** |
| `/voice/history` | kanonik | Arama Geçmişi | sub-tab Çağrılar/Kayıtlar; filtreler (tarih/ajan/yön/durum); çağrı tablosu | ss_68922gjeq | PII telefon; play/Detaylar |
| `/voice/recordings` | ≈ `/voice/history` (Kayıtlar tab) | Arama Geçmişi | kayıt tablosu (Arama kimliği/Süre/Boyut/Retention 90d) play/download/delete | ss_1888rvqz0 | recordings = history alt-sekmesi |
| `/voice/voicemail` | kanonik | Sesli mesajlar | **empty state** "Sesli mesaj yok" | ss_6752l4env | — |
| `/voice/regulatory` | **crawler-MISSED** | (Düzenleyici KYC) | 🔴 **TAMAMEN BOZUK** | ss_0321n7wcc | **F-018 (aşağıda)** |

### F-018 🔴 `/voice/regulatory` tamamen bozuk (crawler-missed)
- Tüm metinler ham i18n anahtarı: `voiceRegulatory.title/subtitle/howItWorksTitle/howItWorksDesc/
  listTitle/listDesc/emptyTitle/emptyDesc/startKyc` (i18n namespace eksik).
- Console: **React #418 + #422** (hydration) + tekrarlı **FORMATTING_ERROR "queueName" sağlanmadı**.
- Crawler'ın 60 rotasında YOK (sidebar `/voice/regulatory` linki var). → keşfedilmemiş + bozuk.
- Paralel session'ın "VOICE-REGULATORY-BROKEN" işaretiyle uyumlu.

### F-019 intl FORMATTING_ERROR — "queueName" değişkeni sağlanmadı
- Console (regulatory sayfasında yakalandı, global/çağrı-transfer string'i):
  `"Belirli bir aramayı "{queueName}" ekibinden başka bir ekibe taşıyın."` interpolasyon değişkeni eksik.

## Route konsolidasyon özeti (test etkisi)
Crawler'ın 13 channels+voice "rotası"ndan gerçekte benzersiz yüzeyler: 7 channels + Voice{Telefon
Numaraları, Arama Geçmişi(2 tab), Sesli mesajlar, Regulatory}. `/voice/queues`(=teams),
`/voice/recordings`(=history-tab), `/voice`(=dids) aliaslar. Bunları ayrı deep-surface sayan
testler **redundant veya yanlış-yönlendirilmiş** olabilir. `/voice/regulatory` ise hiç kapsanmıyor.

## Mutation kontrolleri (çalıştırılmadı — not_exercised_mutation)
Hesabı Güncelle/sil (email) · SMS Gönder · Şablon Oluştur (wa) · Bağlan/Bağlantıyı Kes (social) ·
Numara ekle · kayıt download/delete · voiceRegulatory.startKyc.
