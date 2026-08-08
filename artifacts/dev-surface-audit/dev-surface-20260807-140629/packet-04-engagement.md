# Paket 4 — Engagement (Campaigns / Bot Builder / Contacts / Tickets)

RUN dev-surface-20260807-140629 · Test User · tr-TR · salt-okunur.
PII NOTU: Contacts/Tickets gerçek-benzeri e-posta/telefon/müşteri adı (demo @mediahouse.com) → maskeli.

## Hub'lar
| Rota | Başlık | İçerik | Kanıt |
|---|---|---|---|
| `/campaigns` | Kampanyalar | KPI (Toplam 35/Çalışan 0/Duraklatılmış 1/Tamamlanmış 26); kart grid (Sesli/SMS); Yeni Kampanya | ss_9117gy0oj |
| `/campaigns/outbound` | Giden Kampanyalar | **CANLI** — tablo (Ad/Durum/Arama Modu PREVIEW-PROGRESSIVE/Kişiler/Bağlanan%); sub-nav Giden/Şablonlar/Gönderici Kimlikleri/DNC | ss_2524a0han |
| `/bot-builder` | Bot Oluşturucu | 6 bot kartı (Demo Working Flow/Widget Coverage Test/Support Customers/Widget Lab/Demo Bot/AI chatbot; Yayında, v1-v17); Bot Oluştur | ss_8282z2xkj |
| `/contacts` | Kişiler | liste/grid; filtre Enterprise/VIP/Şirket; tablo Ad/E-posta/Telefon/Şirket/Etiket/Sorumlu/Son İletişim; İçe/Dışa Aktar/Kişi Ekle | ss_89881nga6 |
| `/tickets` | Destek Talepleri | KPI (Açık 11/Devam 9); filtre Tümü/Taleplerim/Atanmamış/Acil + öncelik/durum; tablo Talep#/Konu/Müşteri/Öncelik/Durum/Atanan | ss_43904dfo5 |

## Contacts alt-rotaları (5 — hepsi crawler-MISSED)
| Rota | Başlık | Durum | Kanıt |
|---|---|---|---|
| `/contacts/companies` | Şirketler | tablo (Acme/FinanceHub/MediaHouse…); Şirket ekle; sektör filtresi | ss_8797q9zcl |
| `/contacts/segments` | **Segments (çevrilmemiş EN!)** | empty; "Saved segments"/"Save filter rules…" EN, breadcrumb TR → **F-022 i18n** | ss_3230cdpj6 |
| `/contacts/custom-fields` | Özel Alanlar | empty ("Henüz özel alan tanımlanmadı"); Alan Ekle | ss_7251pp09s |
| `/contacts/groups` | Kişi Grupları | tablo (vomenta-dialer-test/Customers); Yeni Grup; row members/edit/delete | ss_1569sq75p |

## Campaigns alt-rotaları (4 — crawler-MISSED, DOM href'ten)
`/campaigns/outbound` (doğrulandı), `/campaigns/templates`, `/campaigns/sender-ids`, `/campaigns/dnc`.

## Dinamik rotalar (satır linklerinden çıkarım — crawler'ın 60'ında yok)
`/contacts/:id` · `/tickets/:id` · `/bot-builder/:id` (editor) · `/campaigns/:id` · `/contacts/new` · `/contacts/import`.

## 🔴 F-009 DÜZELTME — `/campaigns/outbound` KALDIRILMAMIŞ
- Önceki F-009 (crawler baseline `removedRoutes`) YANLIŞTI. Rota canlı ve işlevsel (ss_2524a0han).
- **Kök-neden (F-023):** crawler maxPages=60 kuyruğu kestiği için `/campaigns/outbound` bu koşumda
  ziyaret edilmedi; baseline-diff bunu "removed" saydı. **False-positive removed-route sinyali.**
- **Sonuç:** `campaigns-outbound.authed.spec.js` / `.mutation` spec'leri STALE DEĞİL. Kapsam korunmalı.

## Mutation kontrolleri (not_exercised_mutation)
Yeni Kampanya · Bot Oluştur/sil/kopyala · Kişi Ekle/İçe-Dışa Aktar · Segment/Grup/Alan Ekle ·
Şirket ekle · Talep Oluştur/Dışa Aktar · kampanya sil/başlat.
