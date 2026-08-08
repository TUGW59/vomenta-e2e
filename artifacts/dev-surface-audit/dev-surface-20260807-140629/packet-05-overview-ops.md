# Paket 5 — Overview + Ops (Dashboard/Inbox/AI/Supervisor/Monitoring/Workforce)

RUN dev-surface-20260807-140629 · Test User · tr-TR · salt-okunur · hızlı sağlık+skeleton taraması.
PII: inbox/monitoring gerçek müşteri adı/telefon → maskeli.

| Rota | Başlık | Durum | Bulgu | Kanıt |
|---|---|---|---|---|
| `/` | Gösterge Paneli | healthy; Canlı toggle; KPI (Temsilci 0/Arama 20/Bekleme 0s/CSAT 0.0); SMS Gönder/Kampanya/Rapor | **F-024** ham i18n `dashboard.setupStepQueue` + "4/4 %100" kartı vs "skipped setup" banner çelişkisi | ss_1842d01qk |
| `/inbox` | Gelen Kutusu | healthy 3-pane (30 konuşma; Ses/Sohbet/E-posta/SMS); bot sohbeti; Müşteri/AI Asistan/Geçmiş | PII müşteri/telefon | ss_7156sayvs |
| `/ai` | Yapay Zeka Yönetimi | healthy; sekmeler; KPI (Bot 6/Sesli 0/Sohbet 6); bot listesi | **F-025** "Yapay ZekaTemsilciler" boşluk eksik; ~8 AI alt-rotası crawler-missed | ss_18751j6e9 |
| `/monitoring` → `/monitoring/live` | Canlı Aramalar | healthy; canlı KPI; ajan durumu donut; Dinle/Fısılda/Araya Gir | tüm `/monitoring/*` crawler-missed; 1 çağrı 99:12 (takılı?) | ss_7158kntad |
| `/monitoring/agents` | Ajan İzleme | healthy tablo | **F-026** ham i18n `supervisor.voice.offline` (Durum kolonu); süreler 1102:54:07 (takılı sayaç?) | ss_8413mggpt |
| `/monitoring/ai-summary` | AI Özeti | healthy; AI özet (EN, AI çıktısı); ClickHouse vs PostgreSQL KPI uyuşmazlığı raporu | AI içerik lokalize değil (beklenen) | ss_3153naypn |
| `/supervisor/coaching` | Kalite koçluğu | healthy; KPI (24 değerlendirme, %37); tablo + Puanı incele | — | ss_77839lwk9 |
| `/supervisor/ai-rate-suggestions` | AI Puanlama ve Öneriler | healthy; toggle'lar; AI koçları | crawler-missed | ss_4999h2h3c |
| `/workforce` → Programlar | İş Gücü Yönetimi | healthy; 7 sekme (Programlar/İzinler/Uyum/Tahmin/Rozetler/Anketler/Değerlendirmeler); haftalık grid | `/workforce`≡`/workforce/schedules` | ss_99380ggaq |
| `/workforce/schedules` | Programlar | healthy grid | — | ss_9539ziw02 |

## Crawler-missed rota ÖZETİ (canlı keşifle bulunan, crawler'ın 60'ında YOK)
- **Bozuk:** `/voice/regulatory` (F-018)
- **Contacts:** `/contacts/{groups,companies,segments,custom-fields,import,new}`
- **Campaigns:** `/campaigns/{outbound,templates,sender-ids,dnc}`
- **Monitoring (tüm alan):** `/monitoring/{live,agents,ai-summary}`
- **AI (~8):** `/ai` sidebar → Ajanlar/Sohbet Botu/Yardımcı Pilot/Duygu Analizi/Bilgi Bankası/İstem Şablonları/Kullanım/Sağlayıcı Ayarları
- **Supervisor:** `/supervisor/ai-rate-suggestions`
- **Workforce:** Uyum/Tahmin sekmeleri (5 kayıtlı dışında)
- **Dinamik:** `/settings/teams/:id`, `/contacts/:id`, `/tickets/:id`, `/bot-builder/:id`, `/campaigns/:id`
- **Diğer:** `/setup` (Complete Setup)
→ Kaba tahmin: **30+ erişilebilir yüzey crawler tarafından hiç görülmedi** (maxPages=60 + registry eksikliği).

## Sistemik i18n bulgu ailesi (raw key render)
F-001 (channels/email) · F-018 (voice/regulatory — TÜM sayfa) · F-021 (reports hub queue kartı) ·
F-022 (contacts/segments EN) · F-024 (dashboard.setupStepQueue) · F-026 (supervisor.voice.offline).
→ Uygulama genelinde **eksik/çevrilmemiş i18n anahtarları sistemik bir sorun**; testler için
"ham anahtar render edilmemeli" (regex `^[a-z][a-zA-Z]+(\.[a-zA-Z]+)+$` reddi) global bir guard olmalı.
