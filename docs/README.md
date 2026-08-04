# Vomenta test dokümantasyonu — harita

Bu klasör, Vomenta E2E test platformunun tüm dokümantasyonunu barındırır. Projeye
ilk bakan biri buradan başlayabilir. Depo geneli için kök [README.md](../README.md),
bağlayıcı kurallar için [AGENTS.md](../AGENTS.md) ve [CONTRIBUTING.md](../CONTRIBUTING.md).

> **Otomatik üretilen vs. elle yazılan.** Aşağıda 🤖 ile işaretli dosyalar bir
> araçla üretilir ve **elle düzenlenmez** — dosyanın başındaki uyarı hangi komutun
> yenilediğini söyler. 📝 ile işaretliler elle bakımı yapılan belgelerdir.

## Başlangıç ve kurallar

| Belge | Ne anlatır |
|-------|------------|
| 📝 [../README.md](../README.md) | Kurulum, günlük komutlar, mimari özeti, ekip standardı |
| 📝 [../AGENTS.md](../AGENTS.md) | Depoda çalışan herkes için bağlayıcı test kuralları ve standartlar |
| 📝 [../CONTRIBUTING.md](../CONTRIBUTING.md) | Definition of Done, PR akışı, inceleme kontrol listesi |
| 📝 [TEST_ARCHITECTURE.md](TEST_ARCHITECTURE.md) | Katman sorumlulukları ve yeni test tasarım standardı |
| 📝 [TEST_STYLES.md](TEST_STYLES.md) | Zorunlu test stilleri el kitabı (arketip bazlı kapsam) |

## Plan ve durum

| Belge | Ne anlatır |
|-------|------------|
| 📝 [QUALITY_ROADMAP.md](QUALITY_ROADMAP.md) | Uzun vadeli kalite ve test yol haritası |
| 📝 [QUALITY_PLATFORM_PHASES.md](QUALITY_PLATFORM_PHASES.md) | Faz / iş-paketi durum kaydı |
| 🤖 [PROJECT-STATUS.md](PROJECT-STATUS.md) | Kanonik yüzeylerin birleşik durumu (`report:project-status`) |

## Kapsam ve envanter matrisleri (🤖 otomatik)

| Belge | Yenileyen komut |
|-------|-----------------|
| 🤖 [TEST_COVERAGE.md](TEST_COVERAGE.md) | `npm run report:coverage` |
| 🤖 [SURFACE-INVENTORY.md](SURFACE-INVENTORY.md) | `npm run report:surface-inventory` |
| 🤖 [SURFACE-DEPTH-MATRIX.md](SURFACE-DEPTH-MATRIX.md) | `npm run report:surface` |
| 🤖 [TEST_STYLE_MATRIX.md](TEST_STYLE_MATRIX.md) | `npm run quality:styles` |

## Mimari kararlar

| Belge | Ne anlatır |
|-------|------------|
| 📝 [adr/](adr/README.md) | Mimari Karar Kayıtları (ADR) dizini — kararların gerekçesi ve geçmişi |

## Bulgu ve rapor belgeleri

| Belge | Ne anlatır |
|-------|------------|
| 📝 [accessibility-findings.md](accessibility-findings.md) | axe-core (WCAG 2.1 A/AA) taramasının gerçek a11y bulguları |
| 📝 [manuel-test-raporu/](manuel-test-raporu/README.md) | Elle keşifte bulunan, otomatik teste bağlanmış bulgular |
| 📝 [data-audit/](data-audit/README.md) | Rapor sayfalarındaki sayıların doğruluk denetimi |
| 🤖 [raporlar/](raporlar/) | Koşum çıktısı raporlar (yapılan/yapılmayan testler, bulgular, yönetici özeti) |

## Keşif arşivleri (`*-kesif/`)

Her ürün bölümü için, testleştirmeden önceki **keşif kanıtları** kalıcı tutulur:
insan-okur `NOTLAR.md` raporu, `screenshots/` ekran görüntüleri ve (bazı bölümlerde)
scriptlerin ürettiği ham `veri/`. Uygulama değişip testler kırmızıya döndüğünde
"olması gereken" haline buradan bakılır.

| Klasör | Bölüm |
|--------|-------|
| [agent-live-kesif/](agent-live-kesif/README.md) | Agent — canlı |
| [analitik-kesif/](analitik-kesif/README.md) | Analitik |
| [ayarlar-kesif/](ayarlar-kesif/README.md) | Ayarlar |
| [bot-olusturucu-kesif/](bot-olusturucu-kesif/README.md) | Bot oluşturucu |
| [canli-etkilesimler-kesif/](canli-etkilesimler-kesif/README.md) | Canlı etkileşimler |
| [kampanyalar-kesif/](kampanyalar-kesif/README.md) | Kampanyalar → Giden |
| [kanallar-kesif/](kanallar-kesif/README.md) | Kanallar |
| [kisiler-kesif/](kisiler-kesif/README.md) | Kişiler |
| [kocluk-kesif/](kocluk-kesif/README.md) | Koçluk |
| [reports-panolar-kesif/](reports-panolar-kesif/README.md) | Raporlar → Panolar |
| [reports-diger-kesif/](reports-diger-kesif/README.md) | Raporlar → Diğer |
| [sesli-kesif/](sesli-kesif/README.md) | Sesli |
| [supervizor-panosu-kesif/](supervizor-panosu-kesif/README.md) | Süpervizör panosu |
| [temsilci-izleme-kesif/](temsilci-izleme-kesif/README.md) | Temsilci izleme |
| [workforce-kesif/](workforce-kesif/README.md) | İş gücü (workforce) |

Keşif kapanış matrisi şablonu: [DISCOVERY_COMPLETION_TEMPLATE.md](DISCOVERY_COMPLETION_TEMPLATE.md).
