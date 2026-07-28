# Veri Doğruluğu Denetimi (data-audit)

Rapor sayfalarındaki sayıların doğruluğunu iki katmanda ele alıyoruz:

- **A — UI ↔ API sadakati (otomatik, testte):** Tarayıcının `api.vomenta.com`'dan aldığı JSON'daki değer
  ile ekranda gösterilen değer birebir mi? `@data` etiketli testlerde (`tests/reports-sections.authed.spec.js`)
  `captureJson` + karşılaştırma ile yapılır. Deterministik, her gece koşar. **"UI, API'yi sadık yansıtıyor mu."**
- **B — Kaynak ↔ API doğruluğu (denetim, test dışı):** Sayının *gerçekten doğru* olup olmadığını, kaynak
  sistemle karşılaştırarak ölçmek. Aşağıdaki fizibilite notuna bakın.

## B'nin fizibilitesi (önemli bulgu, 28 Tem 2026)

Plan aşamasında B'yi "MCP (report_db/BigQuery) ile kapalı-pencere kaynak denetimi" olarak öngörmüştük.
**İnceleme sonucu bu varsayım geçersiz:** eldeki MCP veri sunucusu Vomenta'nın backend'i DEĞİL, **ayrı bir
sistem**:

- `report_db` = `bulut_report_extractor` → Sigma'nın **finansal** raporları (Bulut/Orion banka/çek ödemeleri).
- BigQuery araçları → Sigma'nın **telekom** trafiği/finansı (SMS/VOIP CDR, bakiye, ödeme).
- Zoho CRM/Desk/People → Sigma'nın CRM/destek/İK sistemleri.

Bunların hiçbiri Vomenta iletişim-merkezi uygulamasının çağrı/temsilci/kuyruk metriklerini (hele test
hesabının verisini) içermez. Dolayısıyla **B, mevcut araçlarla otomatikleştirilemez**; Vomenta'nın KENDİ
raporlama backend'ine (read-replica / API / MCP) erişim gerekir.

**Sonuç:** B şimdilik **açık** — Vomenta backend erişimi sağlanınca ayrı bir ADR ile otomatikleştirilecek.
A katmanı (UI↔API) tek başına "UI'nın API'yi bozmadan gösterdiğini" garanti eder ve şu an aktiftir.

## B için hazır prosedür (erişim gelince)

1. **Kapalı pencere seç:** artık değişmeyen geçmiş bir aralık (ör. tamamlanmış bir hafta) → deterministik.
2. Vomenta raporlama kaynağından o pencere için metriği sorgula (ör. `call` → toplam çağrı).
3. Aynı pencereyle UI'yi aç (Custom date range) ve `api.vomenta.com` yanıtını yakala.
4. Kaynak = API = UI mü? Sonucu `docs/data-audit/<bölüm>.md`'ye PASS/FAIL + tarih + `meta.requestId` ile yaz.
5. Ajan/cron ile periyodik koştur (CI-Playwright değil).

## Nokta doğrulama kaydı

| Tarih | Bölüm | Pencere | UI | API | Kaynak (B) | Sonuç |
|---|---|---|---|---|---|---|
| 2026-07-28 | call | Son 7 gün | Total Calls = 4 | `data.summary.totalCalls = 4` | — (erişim yok) | A ✅ · B N/A |

> A: UI, API yanıtını sadık gösteriyor (4 = 4). B: kaynak sistemi erişilemez (yukarı bkz.).
