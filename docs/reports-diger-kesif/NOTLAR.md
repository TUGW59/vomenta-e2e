# Raporlar › Diğer Rapor Bölümleri (10 alt sayfa) — Keşif Notları

> Tarih: 28 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla (Playwright `storageState`) 4 dilde inceleme + DOM/inspection + network + ekran görüntüsü.
>
> Amaç: Panolar'dan sonra Raporlar'ın diğer alt sayfalarının **olması gereken** halini kaydetmek ve regresyon testi yazmak.

İlgili testler: [`tests/reports/reports-sections.authed.spec.js`](../../tests/reports/reports-sections.authed.spec.js) · Page Object: [`tests/pages/ReportSectionPage.js`](../../tests/pages/ReportSectionPage.js) · Panolar keşfi: [`../reports-panolar-kesif/NOTLAR.md`](../reports-panolar-kesif/NOTLAR.md)

---

## 1. Rotalar ve ORTAK kabuk (shared shell)

Kenar menüsü **Raporlar** altındaki 12 rota (`nav a[href*="/reports"]`):

| Rota | Menü etiketi | Sayfa başlığı (h1) | Not |
|---|---|---|---|
| `/reports` | Reports | — | Rapor merkezi (ayrı) |
| `/reports/dashboards` | Dashboards | Dashboards | **Panolar** — ayrı keşif/test |
| `/reports/call` | Call Reports | Call Reports | |
| `/reports/agent` | Agent Reports | **Agent Performance** | menü≠başlık |
| `/reports/queue` | Queue Reports | Queue Reports | |
| `/reports/campaign` | Campaign Reports | Campaign Reports | veri yok (boş durum) |
| `/reports/channel` | Channel Reports | Channel Reports | veri yok (boş durum) |
| `/reports/ai` | AI Reports | AI Reports | |
| `/reports/quality` | Quality Reports | Quality Reports | |
| `/reports/csat` | CSAT Reports | CSAT Reports | |
| `/reports/billing` | Billing Reports | **Billing & Usage** | menü≠başlık; veri yok |
| `/reports/sla` | SLA Reports | SLA Reports | |
| `/reports/custom` | Custom Reports | **Dashboards** | Panolar sayfasının aynısını render ediyor (alias) |

**10 gerçek rapor bölümü** (`call, agent, queue, campaign, channel, ai, quality, csat, billing, sla`) **aynı kabuğu** paylaşır:

- **Başlık (h1) + alt başlık** *Detailed analytics and trends*.
- **Mod rozetleri/toggle:** `Standard` (mod) + `Auto-refresh` toggle.
- **Eylemler:** `AI Insights`, `Export` (dropdown ▾), `Schedule`.
- **Date Range kartı:** aralık metni (ör. *Jul 20, 2026 – Jul 28, 2026*) + preset düğmeleri **Today / 7 Days / 30 Days / 90 Days / More ▾ / Custom**.
- **Bölüme özgü filtreler** (değişir): ör. Call'da *Group By (By Day) · All Directions · All Agents · All Queues*.
- **Sekmeler:** **Charts / Table**.
- **Grafik türü:** **Bar / Line / Area** toggle.
- İçerik: Charts sekmesinde recharts grafikleri; Table sekmesinde tablo.

> **Yükleme:** Sayfalar **skeleton** ile açılır; grafikler geç gelir (Call'da 2 sn'de hâlâ skeleton'dı — bug değil). Testler grafik/tabloyu beklemeli.

Menü etiketi ile sayfa başlığının **uyuşmadığı** yerler (izlenebilir, işlevsel hata değil): Agent Reports→*Agent Performance*, Billing Reports→*Billing & Usage*, Custom Reports→*Dashboards*.

---

## 2. 4 Dil Yerelleştirme Durumu — SAĞLAM ✅

Tüm başlıklar, sekmeler ve tarih presetleri dört dilde çevrili; **Arapça RTL doğru** (`dir=rtl`). İç-terim sızıntısı (ClickHouse/SQL/undefined vb.) **yok** (tarandı).

**Başlıklar (h1):**

| key | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| call | Call Reports | Arama Raporları | Rapports d'appels | تقارير المكالمات |
| agent | Agent Performance | Ajan Performansı | Performance des agents | أداء الوكيل |
| queue | Queue Reports | Kuyruk Raporları | Rapports de files d'attente | تقارير قوائم الانتظار |
| campaign | Campaign Reports | Kampanya Raporları | Rapports de campagnes | تقارير الحملات |
| channel | Channel Reports | Kanal Raporları | Rapports par canal | تقارير القنوات |
| ai | AI Reports | Yapay Zeka Raporları | Rapports IA | تقارير الذكاء الاصطناعي |
| quality | Quality Reports | Kalite Raporları | Rapports qualité | تقارير الجودة |
| csat | CSAT Reports | CSAT Raporları | Rapports CSAT | تقارير CSAT |
| billing | Billing & Usage | Faturalama ve kullanım | Facturation et usage | الفوترة والاستخدام |
| sla | SLA Reports | SLA Raporları | Rapports SLA | تقارير SLA |

**Ortak kabuk etiketleri (tüm bölümlerde aynı):**

| Öğe | en | tr | fr | ar |
|---|---|---|---|---|
| Charts sekmesi | Charts | Grafikler | Graphiques | رسوم بيانية |
| Table sekmesi | Table | Tablo | Tableau | جدول |
| Preset: bugün | Today | Bugün | Aujourd'hui | اليوم |
| Preset: 30 gün | 30 Days | 30 Gün | 30 jours | 30 يوماً |
| Preset: özel | Custom | Özel | Personnalisé | مخصص |

---

## 3. Fonksiyonel / Network — kontroller GERÇEKTEN iş yapıyor mu?

Endpoint deseni: **`GET /api/v1/reports/{key}?startDate=…&endDate=…&groupBy=day`** (ör. `/api/v1/reports/agent`).

### Date Range presetleri (Today/7/30/90 Days) — 3 katman ✅
- **L1:** tıklanan preset seçili görünüme geçer (class `border-primary bg-pr…`); önceki preset bırakır (`border-border bg-mut…`). *Semantik sinyal YOK (aria-pressed yok) → CSS sınıfı son çare, `aria-pressed`/`data-testid` talep edildi.*
- **L2:** tıklamada `GET /api/v1/reports/{key}?startDate…&endDate…` (yeni tarih parametreleriyle 2xx). Doğrulandı (agent: 30 Days → iki GET, mevcut + karşılaştırma dönemi).
- **L3:** "Date Range" etiketi güncellenir (7 gün *Jul 20–Jul 28* → 30 gün *Jun 27–Jul 28*).

### Charts / Table sekmeleri — 3 katman (L2 N/A) ✅
- **L1:** `aria-selected=true`.
- **L2:** YOK (N/A) — görünüm istemci tarafında değişir (0 network).
- **L3:** Charts'ta recharts grafik(ler) görünür; Table'a geçince grafikler kaybolur (recharts=0) ve tablo görünür (`table` count 1).

### Chart türü (Bar/Line/Area) — L1 (L3 kısmi)
- **L1:** seçili tür vurgulanır. **L3:** grafik türü değişir (recharts iç DOM). *Güvenilir L3 için `data-testid` gerekebilir → şimdilik L1 + not.*

### Export / Schedule / AI Insights — ortak eylemler
- **Export:** dropdown açar (▾). **Schedule:** zamanlama diyaloğu (bkz. `/reports` "Schedule a Report"). **AI Insights:** içgörü paneli. *Bu keşifte varlık + L1 düzeyinde; export indirmesi ve schedule oluşturma ileride (indirme/mutation) ele alınacak.*

### Boş durum (campaign / channel / billing)
Bu bölümlerde seçili dönemde veri yok → **düzgün boş durum**: *"No data available for the selected period"* (bug değil; hata sınırı/patlama yok). Test bunu "graceful empty" olarak doğrular.

---

## 🧭 3 Katmanlı Kontrol Matrisi (ortak kabuk)

| Kontrol | L1 Tıklama | L2 Arka plan | L3 Görev |
|---|---|---|---|
| **Date preset** (Today/7/30/90) | ✅ seçili class `border-primary` | ✅ `GET /api/v1/reports/{key}?startDate…` | ✅ Date Range etiketi değişir |
| **Charts/Table sekmesi** | ✅ `aria-selected=true` | — N/A (istemci) | ✅ grafik↔tablo görünümü değişir |
| **Chart türü** (Bar/Line/Area) | ✅ seçili vurgu | — N/A (istemci) | ~ grafik türü (data-testid gerekebilir) |
| **Export ▾** | ✅ dropdown açılır | (indirme) → ileride | (dosya) → ileride |
| **Schedule** | ✅ diyalog açılır | POST (mutation) → gated | (zamanlama) → gated |

**Test karşılığı:** `tests/reports/reports-sections.authed.spec.js` — yapı (@smoke, 10 bölüm), 4 dil çeviri guard'ları (@regression), Charts/Table sekmesi ve Date preset için L1/L2/L3 (temsilci veri-dolu bölüm `agent`), boş-durum graceful testi. Bariz bug bulunmadı.

---

## Test yazımı için sağlam çapalar

- Başlık: `getByRole('heading',{level:1})`.
- Sekmeler: `getByRole('tab',{name})` (yerelleştirilmiş Charts/Table).
- Date preset: `getByRole('button',{name})` (Today/30 Days…); seçili sinyal CSS `border-primary` (data-testid talep edildi).
- Date Range etiketi: `getByText(/Date Range/i)` kapsayıcısı.
- Grafik sayacı: `.recharts-wrapper`.
- Endpoint (L2): `**/api/v1/reports/{key}` GET, startDate/endDate parametreli.
- Skeleton'a karşı: assertion öncesi grafik/tablo görünür olana kadar bekle.
- Her test taze bağlamda İngilizce başlar; dile tek switch.
