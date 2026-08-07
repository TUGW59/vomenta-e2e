# Dev navigasyonu — canlı gözlem (2026-08-07)

Kaynak: `https://app.dev.vomenta.com`, İngilizce, "Test User" hesabı, salt-okunur
gözlem (Claude in-app browser, erişilebilirlik ağacı). Dev bilgi mimarisi (IA)
yeniden düzenleniyor; bu, o çalışmanın gözlemlenen anlık görüntüsüdür. Registry
migrasyonu için KANIT kaynağıdır (bkz. docs/NAVIGATION.md → adaptasyon).

> UYARI: Redesign DEVAM EDİYOR. Bu snapshot dondurulmuş IA değildir; migrasyon
> öncesi yeniden doğrulanmalı.

## Sol panel — bölümler ve rotalar

Sidebar artık 5 etiketli bölüme ayrılmış (eski: düz 14 öğe). Gruplar aktif rotaya
göre açılır/kapanır (accordion).

| Bölüm | Öğe | Rota | Grup? (alt-menü) |
|---|---|---|---|
| **Overview** | Dashboard | `/` | hayır |
| | Inbox | `/inbox` | hayır |
| **Channels** | Voice | `/voice` | evet |
| | Channels | `/channels` | evet |
| | AI | `/ai` | evet |
| **Engagement** | Campaigns | `/campaigns` | evet |
| | Bot Builder | `/bot-builder` | hayır |
| | Contacts | `/contacts` | evet |
| | Tickets | `/tickets` | hayır |
| **Operations** | Analytics | `/analytics` | hayır |
| | Reports | `/reports` | evet |
| | Supervisor | `/supervisor/coaching` | evet |
| | Monitoring | `/monitoring` | evet |
| | Workforce | `/workforce` | evet |
| **Admin** | Users & Teams | `/settings/users` | — |
| | Settings | `/settings` | evet |

## Gözlenen alt-rotalar (grup çocukları)

Yalnız Monitoring grubu tam genişletilerek doğrulandı:

- **Monitoring** `/monitoring` → Live `/monitoring/live` · Agent Monitor
  `/monitoring/agents` · AI Summary `/monitoring/ai-summary`

Diğer grupların (Voice/Channels/AI/Campaigns/Contacts/Reports/Supervisor/Workforce)
çocukları bu turda tek tek genişletilmedi; registry'deki mevcut secondary rotalarla
karşılaştırılıp dev'de doğrulanmalı.

## Mevcut registry'ye göre KİLİT değişiklikler (delta)

1. **YENİ alan: `/monitoring`** (+ `/monitoring/live`, `/monitoring/agents`,
   `/monitoring/ai-summary`). Registry'de hiç yok. Muhtemelen eski Supervisor
   canlı-izleme yüzeylerini (wallboard/live/interactions) devralıyor.
2. **Supervisor nav hedefi** `/supervisor` → **`/supervisor/coaching`** (üst-düzey
   link artık coaching alt-sayfasına gidiyor).
3. **YENİ "Admin" bölümü**: `/settings/users` ("Users & Teams") üst-düzeye çıkmış;
   `/settings` de bu bölümde. (Eski registry'de settings-users `navigation:'secondary'`.)
4. **Nav "bölümleri" (Overview/Channels/Engagement/Operations/Admin)** yeni bir
   gruplama katmanı — registry'de `area` var ama nav-bölümü kavramı yok.

## Değişmeyen (dayanıklılık kanıtı)

Şu üst-düzey rotalar aynı kaldı → bu sayfaların rota-tabanlı testleri (BasePage.open)
DEĞİŞMEDEN çalışır: `/`, `/inbox`, `/voice`, `/channels`, `/ai`, `/campaigns`,
`/bot-builder`, `/contacts`, `/tickets`, `/analytics`, `/reports`, `/workforce`,
`/settings`, `/settings/users`. Yalnız nav KONUMU/gruplaması değişti; rota kimliği değil.
