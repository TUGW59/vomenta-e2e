# ADR-0002: Zorunlu test stilleri ve sert-kapı enforcement

- Durum: Kabul edildi
- Tarih: 2026-07-28

## Bağlam

Test paketi başta yapı + i18n + 3-katman kontrol testlerine odaklıydı. Manuel keşifte, fonksiyonel
testlerin görmediği bir sınıf hata çıktı (Paylaş diyaloğunda yatay taşma). Erişilebilirlik, görsel
regresyon, responsive/taşma, hata-yolu, console/ağ temizliği, performans, klavye, deep-link ve veri
doğruluğu gibi "test tarzları" repoda ya hiç yoktu ya da dağınık/etiketsizdi (`@a11y`/`@visual` AGENTS.md'de
tanımlı ama **hiçbir teste** iliştirilmemişti). İhtiyaç: bu stilleri (1) yeniden kullanılabilir hale getirmek,
(2) **kurallara gömerek** her yeni sayfada otomatik uygulanmalarını sağlamak — böylece farklı oturumlarda,
hatta talep edilmeden, standart kendiliğinden dayatılır.

## Karar

1. **Kanonik etiket kaydı** tanımlandı (AGENTS.md → "Test sınıfları"): risk/yapı etiketleri + 11 stil
   etiketi (`@i18n @a11y @layout @visual @errorpath @clean @perf @keyboard @deeplink @data @export`).
   Kayıt dışı etiket reddedilir.
2. **Uygulanabilirlik matrisi** (AGENTS.md → "Zorunlu test stilleri"): baseline stiller her sayfada
   zorunlu; koşullu stiller sayfa arketipine göre zorunlu. Uygulanmayan koşullu stil **açık N/A gerekçesiyle**
   beyan edilir (3-katman N/A kuralının genellemesi).
3. **Sert kapı = varlık/beyan düzeyinde.** `tests/contracts/tested-pages.js` (sayfa kaydı) +
   `tools/style-coverage.mjs` her tescilli sayfanın zorunlu stillerini kontrol eder; eksik → `exit 1`.
   Bu kapı **deterministiktir** (canlı test koşmaz), asla flaky olmaz. Etiket→primitif tutarlılığı
   `tools/validate-architecture.mjs`'te dayatılır.
4. **Lane ayrımı.** Deterministik stiller her PR'da; oynak/canlı stiller (`@visual @perf @data`) ve
   cross-browser gece full-regression'da koşar. Sert kapı yalnızca varlığı dayattığı için PR pipeline'ı
   kırılgan olmaz.
5. **Görsel strateji:** yalnızca kararlı UI + canlı bölge maskeleme; darwin baseline, `environment.isCI`
   ile CI/Linux'ta atla (login testindeki desen).
6. **Veri doğruluğu = A + B.** A (testte, deterministik): yakalanan API yanıtı ↔ UI sadakati — aktif.
   B (kaynak↔API, test dışı): **şu an açık.** İnceleme, eldeki Sigma MCP veri sunucusunun
   (`bulut_report_extractor` finans + BigQuery telekom + Zoho) Vomenta iletişim-merkezi metriklerini
   İÇERMEDİĞİNİ gösterdi → B, Vomenta'nın KENDİ raporlama backend'ine erişim gerektirir; sağlanınca ayrı
   ADR ile otomatikleştirilecek. Prosedür/fizibilite: `docs/data-audit/`.
7. **Yeniden kullanılabilir toolkit:** `tests/helpers.js`'e stil yardımcıları eklendi
   (`expectNoSevereA11y`, `expectNoOverflowAtViewports`, `mockApi`,
   `expectContentWithin`, `expectDialogKeyboard`, `captureJson`). `diagnostics` fixture'ı collector'ı sunar.

## Sonuçlar

- Her yeni test edilen sayfa `tested-pages.js`'e tescil edilince, tüm zorunlu stilleri kapsaması ya da
  gerekçeli N/A vermesi CI'da **zorunlu** olur → gelişen, kendini dayatan bir test sistemi.
- Referans uygulama: Raporlar (Panolar + 10 bölüm). Matris: `docs/TEST_STYLE_MATRIX.md`.
- Maliyet: yeni sayfa testi daha fazla iş ister; ancak toolkit sayesinde her stil ~1 satır.
- Risk: oynak stiller yanlış-kırmızı üretebilir → gece lane + cömert bütçe + maskeleme ile sınırlandı.

## Değişiklik yönetimi

Bu karar sessizce delinemez. Bir stili kalıcı olarak zorunluluktan çıkarmak, sert kapıyı yumuşatmak veya
yeni bir stil/etiket eklemek yeni bir ADR (gerekçe, sahip, alternatifler) ve AGENTS.md + `tested-pages.js`
+ ilgili araç güncellemesi gerektirir. Kanonik etiket kaydı AGENTS.md ile `tools/style-coverage.mjs`
`ALLOWED_TAGS` arasında senkron tutulur.
