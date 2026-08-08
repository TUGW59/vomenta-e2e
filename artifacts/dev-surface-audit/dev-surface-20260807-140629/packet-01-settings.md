# Paket 1 — Settings (canlı Chrome derin doğrulama)

RUN dev-surface-20260807-140629 · Test User · tr-TR · salt-okunur.
Mutation kontrolleri **çalıştırılmadı** (`not_exercised_mutation`).

## Genel Settings IA
`/settings` = 6 sekmeli sayfa (Organizasyon · Kullanıcılar · Faturalandırma ve Kullanım ·
Güvenlik · API Anahtarları · Modüller). ANCAK doğrudan 20 `/settings/*` rotası var (crawler
hepsini gezdi). Sekme/sidebar bunların çoğunu göstermiyor → **F-004 nav gap**. Sekme durumu
URL'de değil → **F-003**. (Karşıt: `/settings/teams/:id?tab=settings` query ile URL'de tutuyor
→ tutarsızlık.)

## Live-verified sayfalar

| Rota | Başlık | Ana içerik | Kontroller (sınıf) | Kanıt | Bulgu |
|---|---|---|---|---|---|
| `/settings/audit` | Denetim Günlüğü | Audit tablo (7 kolon), filtreler (arama/eylem/kullanıcı/tarih×2), pagination | Dışa aktar, Full Export = `not_exercised_mutation`; satır "Görüntüle" ×8 = observed; filtreler safe (çalıştırılmadı) | ss_0444tdp5u | F-006 tekrar eden "Görüntüle" adı |
| `/settings` | Ayarlar | 6 sekme; Organizasyon default → "Organizasyon Ayarlarına Git" (/settings/organization) | tab×6 (safe), org linki | ss_8307qtggs | F-002, F-003, F-004 |
| `/settings` › Modüller | Modüller | Açıklama + "Yönet Modüller" | tab safe; "Yönet Modüller" observed | ss_8322i38it | F-005 tekrar paragraf + bozuk TR |
| `/settings/users` | Kullanıcılar | Tablo: Ad, E-posta(BOŞ), Rol, Ekipler, Durum, Son Giriş, İşlemler; 9+ kullanıcı; ekip çipleri → `/settings/teams/:id` | Kullanıcı Davet Et, kebab×n, bulk-select = mutation; arama safe | ss_9656pylxz | **E-posta kolonu tüm satırlarda boş** (data/render); dinamik `/settings/teams/:id` |
| `/settings/roles` | Rol Yönetimi | Tablo: 6 rol ADMIN(110)/AGENT(29,mod)/MANAGER(77)/OWNER(113)/SUPERVISOR(60,mod)/VIEWER(12); Sistem=Evet | Rol Oluştur, Rolü düzenle/sil/Varsayılana sıfırla = mutation | ss_1391qd5z6 | **Rol matrisi 6 rol** (repo yalnız admin/supervisor/agent biliyor → gap); "Değiştirildi" rozeti |
| `/settings/teams` | Ekipler | 9 ekip kartı (Social/Webchat/Main/Ai/Test/Billing/VIP/Support/Sales); dağıtım/SLA/ajan | Ekip Oluştur, kart kebab/ayar/sil = mutation | ss_7525am4m5 | dinamik `/settings/teams/:id` + `?tab=settings` (URL'de tab — F-003 ile tutarsız) |
| `/settings/api-keys` | API Anahtarları | **Empty state** "API anahtarı yok" | Anahtar Oluştur / API Anahtarı Oluştur (2 farklı etiket) = mutation | ss_5451meu2w | aynı aksiyon 2 farklı etiket (minor) |
| `/settings/webhooks` | Webhooks | **Empty state** "Yapılandırılmış webhook yok"; event örnekleri | Webhook Ekle ×2 = mutation | ss_2471b94fb | başlık EN "Webhooks" + TR alt-metin (mixed locale) |
| `/settings/integrations` | Entegrasyonlar | Uyumluluk: İYS (Bağlı Değil); CRM: Salesforce/HubSpot/Zoho (Kullanılabilir) | Bağlan, Erişim Talep Et = mutation | ss_6342b96c5 | — |
| `/settings/security` | Güvenlik | GDPR veri koruma; Şifre Politikaları (min 12, süre 90g, büyük harf/sayı/özel karakter) | mutating form (min/expiry/toggles) = observed_only; "Kişileri aç" | ss_2310o3rq9 | — |

## Live-verified sayfalar (2. dalga) — Settings artık 20/20 canlı doğrulandı

| Rota | Başlık | Ana içerik | Kontroller (sınıf) | Kanıt |
|---|---|---|---|---|
| `/settings/organization` | Kuruluş | Şirket bilgileri formu (ad*=Vomenta Test Corp, alan, saat dilimi Istanbul, Dil EN, USD, ülke US) | mutating form = observed; logo upload = not_exercised_mutation | ss_4230srhd5 |
| `/settings/profile` | Profil | **iç sekmeler: Profil/Güvenlik/Oturumlar/Bildirimler**; kişisel bilgi (Ad Test, Soyad User, e-posta <dev-test-account> "değiştirilemez", telefon) | avatar upload, form = observed | ss_87669bek1 |
| `/settings/notifications` | Bildirimler | Tarayıcı push (Aktif değil) + e-posta kategori toggle'ları (Hesap/Faturalama/Kampanya/YZ) | Tercihleri kaydet ×2, toggles = mutation | ss_22901c9fj |
| `/settings/automations` | Otomasyon Kuralları | sub-tab Kurallar/SLA Politikaları; 5 kural (156/5/0/9/112 çalıştırma); Yürütme Günlükleri | Yeni Kural, Aktif toggle, sil = mutation | ss_6082osxbg |
| `/settings/canned-responses` | Hazır Yanıtlar | **empty state** + arama + tablo (Başlık/Kısayol/Önizleme/Kategori) | Yeni hazır yanıt = mutation | ss_9143q7dhh |
| `/settings/compliance` | Uyumluluk ve Veri Gizliliği | veri saklama özeti + KVKK/GDPR + denetim günlükleri (**aggregate**) | Saklama Yönetimi→data-retention, Daha Fazla→audit | ss_27149si4d |
| `/settings/data-retention` | Veri Saklama | saklama süreleri formu (90/365/365/30/730 gün) | mutating form = observed | ss_59928nznl |
| `/settings/disposition-codes` | Sonuç Kodları | tablo: 10 kod (SALE/QUALIFIED_LEAD/APPOINTMENT_SET/CALLBACK/FOLLOW_UP/NOT_INTERESTED/NO_ANSWER/BUSY/VOICEMAIL/WRONG_NUMBER) | Kod Ekle, düzenle/sil = mutation | ss_0242eunmi |
| `/settings/hours` | Çalışma Saatleri | saat dilimi (Istanbul) + haftalık program (gün/açık/başlangıç/bitiş) | mutating form = observed | ss_3916drxk6 |
| `/settings/sla` | SLA Politikaları | **empty state**; tablo (Ad/İlk yanıt/Çözüm/Sonraki/Öncelik/Kanallar/Aktif) | Yeni Politika = mutation | ss_7382t60w1 |
| `/settings/templates` | Şablonlar | sub-tab Mesaj şablonları/Hazır yanıtlar + kanal alt-sekmeleri (Hazır Yanıtlar/E-posta/SMS/WhatsApp); **empty state** | Yeni Şablon = mutation | ss_10508ir2d |

## F-013 / F-014 — yüzey örtüşmesi (bkz. live-findings)
Aynı işlev için birden çok giriş: compliance↔data-retention+audit; profile-alt-sekme↔security+notifications;
automations "SLA" sekmesi↔/settings/sla; templates "Hazır yanıtlar" sekmesi↔/settings/canned-responses.
→ Test "kanonik yüzey" belirsizliği + potansiyel duplicate-surface bakımı.

## Settings paketi kapanış
- **20/20 `/settings/*` rota + landing sekmeleri canlı doğrulandı.** 0 broken sayfa.
- Empty state kanıtı: api-keys, webhooks, canned-responses, sla, templates.
- Zengin fonksiyonel veri: roles(6), teams(9), users(9+), automations(5), disposition-codes(10).
- Tüm yaz/oluştur/sil/toggle kontrolleri `not_exercised_mutation`.

## Dinamik rota (yeni, crawler'ın 60'ında yok)
`/settings/teams/:id` (ekip detay) + `?tab=<...>` → **new_uncovered_surface**.

## Mutation kontrol envanteri (hiçbiri çalıştırılmadı — `not_exercised_mutation`)
Kullanıcı Davet Et · Rol Oluştur/düzenle/sil/sıfırla · Ekip Oluştur/düzenle/sil · Anahtar Oluştur ·
Webhook Ekle · Bağlan/Erişim Talep Et · Şifre politikası formu · audit Export/Full Export.
