# Bot Oluşturucu (Bot Builder) — Keşif Notları

Canlı gözlem: **3 Ağu 2026, app.vomenta.com** (Playwright + kopyalanan auth state).
Standartlar: 3 katman (L1/L2/L3) + 4 dil i18n + zorunlu stiller — bkz. `AGENTS.md`.

## Yüzeyler

| Sayfa | Rota | Açıklama |
| --- | --- | --- |
| Liste | `/bot-builder` | Bot akışlarını listeler + "Create Bot" (oluşturma diyaloğu). |
| Editör | `/bot-builder/{id}` | Akış editörü (React Flow tuval); mobil/tablette "Desktop Screen Required" kapısı. |

## Liste sayfası (`/bot-builder`)

- **H1:** "Bot Builder" · **Alt başlık:** "Design and manage conversational bot flows"
- **Kontrol:** "Create Bot" düğmesi (tek birincil eylem; liste boşsa da görünür).
- **Kart içeriği:** bot adı · durum rozeti (Published/Draft) · versiyon (v5/v11…) · açıklama
  ("No description") · yayın/güncelleme tarihleri. Kartlar **anchor değil** — tıklama
  client-side navigasyonla `/bot-builder/{id}` editörüne götürür.
- **Ağ (L2):** açılışta `GET /api/v1/bots?limit=50` (liste) + `GET /api/v1/bots/templates`
  (şablonlar; diyalog için önden yüklenir).

### 4 dil (doğrulandı)

| dil | H1 | alt başlık | Create düğmesi | dir |
| --- | --- | --- | --- | --- |
| en | Bot Builder | Design and manage conversational bot flows | Create Bot | ltr |
| tr | Bot Oluşturucu | Konuşma tabanlı bot akışlarını tasarlayın ve yönetin | Bot Oluştur | ltr |
| fr | Créateur de bots | Concevez et gérez les flux de conversation des bots | Créer un bot | ltr |
| ar | منشئ الروبوتات | تصميم وإدارة تدفقات محادثات الروبوت | إنشاء روبوت | **rtl** |

### "Create Bot" diyaloğu (4 dil)

| dil | başlık | alt başlık | alanlar | eylemler |
| --- | --- | --- | --- | --- |
| en | Create Bot Flow | Start from scratch or choose a pre-built template | Bot Name / Description (optional) / Template (optional) | Cancel · Create & Open Editor |
| tr | Bot Akışı Oluştur | Sıfırdan başlayın veya hazır bir şablon seçin | Bot Adı / Açıklama (isteğe bağlı) / Şablon (isteğe bağlı) | İptal · Oluştur ve Düzenleyiciyi Aç |
| fr | Créer un flux de bot | Partez de zéro ou choisissez un modèle prédéfini | Nom du bot / Description (facultatif) / Modèle (facultatif) | Annuler · Créer et ouvrir l'éditeur |
| ar | إنشاء تدفق روبوت | ابدأ من الصفر أو اختر قالباً جاهزاً | اسم الروبوت / الوصف (اختياري) / القالب (اختياري) | إلغاء · إنشاء وفتح المحرر |

## Bulgular

- **BOT-BUILDER-TEMPLATE-I18N (high, open).** "Create Bot" diyaloğundaki hazır şablonların
  **adı ve açıklaması ham çeviri anahtarı olarak** render ediliyor: `botBuilder.FAQ Bot`,
  `botBuilder.Appointment Scheduler`, `botBuilder.Order Status`, `botBuilder.Lead Qualification`,
  `botBuilder.AI Voice Inbound/Outbound`, `botBuilder.Welcome & Greeting`,
  `botBuilder.Business Hours Check`, `botBuilder.Queue Routing`, `botBuilder.CSAT Survey`,
  `botBuilder.Voicemail`, `botBuilder.Call Transfer` (+ açıklamaları). Şablonlar açılışta
  önden yüklendiğinden **liste açılışında bile** konsola tekrarlı
  `MISSING_MESSAGE: botBuilder.<...> (en)` hatası düşüyor → hem `@clean` (sessiz hata) hem
  `@i18n` (kullanıcıya ham anahtar sızıntısı) bulgusu. İngilizce dahil tüm dillerde.
- **BOT-BUILDER-CLOSE-I18N (low, open).** Diyaloğun kapat (X) düğmesinin erişilebilir adı
  tr/fr/ar'da İngilizce "Close" olarak kalıyor (çevrilmiyor).

## Editör (`/bot-builder/{id}`)

- **Başlık:** bot adı (ör. "Support Bot"). Üst eylemler: **Back to Bots · Versions · Test ·
  Save Draft · Publish**. Kanal önizleme düğmeleri: **Webchat · Telegram / Social · WhatsApp**.
- **Sekmeler:** Editor / Analytics. React Flow tuvali: zoom in/out · fit view · toggle interactivity.
- **Responsive kapısı:** dar ekranda (mobil/tablet) tuval yerine **"Desktop Screen Required"**
  bilgilendirmesi gösteriliyor → editör masaüstü-öncelikli; `@layout` mobil/tablette taşma yok
  (kapı ekranı) olarak doğrulanır.

## Keşif kapanış matrisi

- varsayılan/veri-dolu durum — **Kapsandı** (liste: 4 bot; editör: Support Bot).
- seçim/hover ile beliren kontroller — **N/A**: liste tek eylemli (Create Bot); kart hover'ı
  görsel, ek kontrol yok.
- kebab/context menüsü — **N/A**: liste kartlarında ⋮ menü gözlenmedi.
- dialog/drawer — **Kapsandı**: "Create Bot Flow" diyaloğu.
- boş/loading/hata/yetkisiz — **Kısmen**: veri-dolu + `@errorpath` mock (500/boş) kapsandı;
  gerçek boş-liste durumu prod'da üretilemez (mutasyon yok) → `@errorpath` mock ile temsil edildi.
- masaüstü/tablet/mobil + 4 dil + RTL — **Kapsandı**.

## Prod güvenliği / N/A

- **Mutasyon (Create / Save Draft / Publish / Delete):** prod'a yazma → canlıda TETİKLENMEZ
  (`AGENTS.md`). Liste `@mutation` = **N/A** (staging tenant'ına bırakıldı). Create diyaloğu
  yalnız L1 (açılış/kapanış) + form validasyonu (isim boşken submit) düzeyinde doğrulanır;
  gerçek create staging mutasyonudur.
- **Editör Save/Publish** aynı gerekçeyle read-only + navigasyon + i18n ile sınırlı.
