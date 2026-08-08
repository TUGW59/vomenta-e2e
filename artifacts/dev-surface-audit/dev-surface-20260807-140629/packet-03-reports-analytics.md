# Paket 3 — Reports + Analytics (canlı Chrome derin doğrulama)

RUN dev-surface-20260807-140629 · Test User · tr-TR · salt-okunur. 13/13 rota canlı doğrulandı.

## Analytics
| Rota | Başlık | İçerik | Kanıt |
|---|---|---|---|
| `/analytics` | Analitik | tarih presetleri; KPI (Aktif arama 0, Çevrimiçi temsilci 8, bugün 20, ort 12s); arama hacmi trend grafiği (gerçek veri) | ss_79002nnz1 |

## Reports hub
| Rota | Başlık | İçerik | Bulgu | Kanıt |
|---|---|---|---|---|
| `/reports` | Raporlar | rapor tipi/format/tarih; Preview/Tümünü Dışa Aktar/Özel Rapor; Standart↔AI mode; rapor kartları (Arama/Ajan/Kampanya/Kanal/AI/Kalite/CSAT) | **F-021: Queue kartı ham i18n** `reports.queueReports`/`.queueReportsDesc`/`.viewQueuePerformance` | ss_3783ebe2z |

## Report detail pages — ortak şablon (tarih aralığı, Gruplandır, filtreler, Bar/Line/Area, Standart toggle, Otomatik yenileme, AI İçgörüleri, Dışa Aktar, Zamanla, KPI kartları + grafikler)
| Rota | Başlık | KPI örneği | Durum | Kanıt |
|---|---|---|---|---|
| `/reports/agent` | Temsilci Raporları | Aktif 9, Aramalar 2 ↓93%, İşlem 6s | healthy | ss_9994da4fo |
| `/reports/queue` | Ekip Raporları | Aktif Ekip 9, Arama 1, SLA %11 | healthy (sayfa çevrili; hub kartı değil) | ss_16075shdp |
| `/reports/csat` | CSAT Raporları | 0.0/5.0, "CSAT trend verisi mevcut değil", %0 yanıt | **empty-data (düzgün)** | ss_6469ty2a1 |
| `/reports/dashboards` | **Panolar** (dashboards mgmt, farklı sayfa tipi!) | Varsayılan 0 ("pano yok"), Özel 1 (Call Center Overview) | healthy; **crawler err:4 = F-008 benign prefetch** | ss_1308xzo9b |
| `/reports/billing` | Faturalama raporları | kullanım $0, kredi $99,988.80, fatura 0 | healthy (boş grafik) | ss_624359skm |
| `/reports/ai` | Yapay Zeka Raporları | İstek 161, Token 203979, Gecikme 5541ms, Maliyet $0.08 | healthy | ss_5737ysncg |
| `/reports/call` | Arama Raporları | Arama 52, İşlem 11s, Terk %0 | healthy | ss_0739rnnt1 |
| `/reports/campaign` | Kampanya Raporları | İletişim %0, Kişi 2 | healthy | ss_64038cl3z |
| `/reports/channel` | Kanal Raporları | Görüşme 1, Çözüm %0, Aktif Kanal 1 | healthy | ss_1105sh5pu |
| `/reports/quality` | Kalite Raporları | Kalite %18, Değerlendirme 3, Temsilci 9 | healthy | ss_2635jcv3f |
| `/reports/sla` | SLA Raporları | Aktif Ekip 9, SLA %11 (queue ile aynı veri) | healthy | ss_73100la0s |

## Test etkisi / kör nokta notları
- **Ortak şablon:** 11 report detail sayfası aynı bileşen şablonunu paylaşıyor → generic Report Page Object
  uygun; ANCAK sadece başlık/URL assert eden test **false-green** olur (F-015 tarzı skeleton/empty
  ayrımını yapmaz). Öneri: KPI kart değerinin *render edildiğini* + en az 1 grafiğin/empty-state'in
  göründüğünü assert et; filtre (tarih/gruplama) uygulanınca veri/again-render doğrula.
- **F-021** hub'da queue kartı ham i18n (sayfa değil, kart). i18n anahtar-varlık kontrolü öner.
- `/reports/dashboards` aslında **Panolar** — diğer report'lardan farklı sayfa; ayrı Page Object gerek.
- CSAT/billing/campaign/channel boş-veri durumlarını düzgün gösteriyor (empty-state test edilebilir).
- Dışa Aktar / Özel Rapor / Zamanla / Gösterge Paneli Oluştur = `not_exercised_mutation` (download/kayıt).
