# Analitik (`/analytics`) — Keşif Notları

> Tarih: 28 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla (Playwright `storageState`) 4 dilde inceleme + DOM/inspection ölçümü + network yakalama + tam sayfa ekran görüntüsü.
>
> Amaç: Sayfanın **olması gereken** halini kaydetmek, bulguları kanıtlamak ve buna göre regresyon testi yazmak. Uygulama güncellenince bu alanlar bozulursa testler kırmızıya döner ve nerede sorun olduğu anlaşılır.
>
> Not: Bu, "Raporlar" ailesinin ilk incelenen bölümü. Diğer bölümler (Reports hub, Supervisor, vb.) sonra gelecek.

Ekran görüntüleri: [`screenshots/`](screenshots/)

---

## 1. Sayfanın "olması gereken" hali (yapı)

`/analytics`, Raporlar ailesinin **özet/hub** ekranıdır. Sekme yoktur; tek uzun kaydırılabilir sayfadır.

Başlık: **Analytics** (TR *Analitik* · FR *Analytique* · AR *التحليلات*) · Alt başlık: *Explore performance across calls, agents, queues, campaigns, and AI.*

**Üst kontrol çubuğu (tek interaktif kontrol grubu):**
- **Tarih aralığı butonları:** `Today · 7 Days · 30 Days · 90 Days · Custom`. Varsayılan seçili = **30 Days**. Seçili buton `bg-secondary` sınıfını alır (⚠ `aria-pressed` YOK — bkz. Gözlem C).
- **All reports** linki → `/reports`.

**Üst KPI döşemeleri (4):** Active calls · Agents online · Total calls today · Avg. handle time. (Bunlar **çevriliyor**.)

**Grafik kartları (üst blok, çevriliyor):**
- Call volume trend (*Arama hacmi eğilimi*)
- Channel distribution (*Kanal dağılımı*)
- Top queues by volume (*Hacme göre önde kuyruklar*) — veri yoksa *No usage data for this period* (çevrili)

**"AI usage" bölümü** (h2, **çevriliyor**: *Yapay zekâ kullanımı*): AI interactions · Resolution rate · Estimated AI cost.

**"Deep analytics" bölümü** (h2, ❌ **HİÇBİR DİLDE ÇEVRİLMİYOR** — bkz. BULGU A): Call abandonment · Abandonment rate over time **from ClickHouse** (bkz. BULGU B) · Calls by hour of day · Agent utilization · Campaign contact rate · Chat response time · Billing & usage.

**"How this hub works" + 6 navigasyon kartı** (linkler, çevriliyor):

| Kart (en) | Hedef |
|---|---|
| Call analytics | `/reports/call` |
| Agent analytics | `/reports/agent` |
| Queue analytics | `/reports/queue` |
| Campaign analytics | `/reports/campaign` |
| AI analytics | `/reports/ai` |
| Dashboards | `/reports/dashboards` |

---

## 2. 4 Dil Yerelleştirme Durumu

Dil, sunucuda/localStorage'da kalıcı DEĞİL → taze bağlam hep **İngilizce** açılır. Çalışan dil değiştirici: **kenar çubuğu altındaki** metinli düğme (English / Türkçe / Français / العربية). Bkz. hafıza notu `vomenta-workforce-i18n`.

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| `html[dir]` | ltr | ltr | ltr | **rtl** ✅ |
| Başlık (h1) | Analytics | Analitik | Analytique | التحليلات |
| Tarih butonları | Today/7 Days/30 Days/90 Days/Custom | Bugün/7 Gün/30 Gün/90 Gün/Özel | Aujourd'hui/7 jours/30 jours/90 jours/Personnalisé | اليوم/7 أيام/30 يومًا/90 يومًا/مخصص |
| "All reports" | All reports | Tüm raporlar | Tous les rapports | جميع التقارير |
| "AI usage" (h2) | AI usage | Yapay zekâ kullanımı | Utilisation IA | استخدام الذكاء الاصطناعي |
| 6 navigasyon kartı | ✅ | ✅ | ✅ | ✅ |
| **"Deep analytics" (h2)** | Deep analytics | **Deep analytics** ⚠ | **Deep analytics** ⚠ | **Deep analytics** ⚠ |
| **Deep analytics içerik başlıkları** | (en) | **İngilizce** ⚠ | **İngilizce** ⚠ | **İngilizce** ⚠ |
| **Custom** tarih seçici (popover) | Date Range/Start/End/Apply range | Tarih Aralığı/Başlangıç/Bitiş/Aralığı uygula ✅ | ✅ | ✅ |

**Genel değerlendirme:** Yerelleştirme **büyük ölçüde sağlam** — başlık, alt başlık, tarih butonları, KPI döşemeleri, üst grafik kartları, "AI usage" bölümü, "Custom" tarih seçici popover'ı ve 6 navigasyon kartı **dört dilde de** çevriliyor. **Arapça RTL doğru** (`dir=rtl`, düzen aynalı). **TEK sistematik istisna:** aşağıdaki "Deep analytics" bölümü (BULGU A).

---

## 🐞 BULGU A (keşifte çıktı) — "Deep analytics" bölümü hiçbir dilde çevrilmiyor

**Nerede:** Sayfanın ortasındaki **"Deep analytics"** (h2) bölümü ve içindeki tüm grafik kartı başlıkları.

**Beklenen:** Sayfanın geri kalanı gibi, seçilen arayüz diline çevrilmeli.

**Gerçekleşen:** Bölüm başlığı ve **9 metin parçası** TR/FR/AR **üçünde de** İngilizce kalıyor — bölüm sanki hiç i18n'e bağlanmamış (sabit-İngilizce blok):

1. `Deep analytics` (h2 başlık)
2. `Call abandonment`
3. `Abandonment rate over time` (+ `from ClickHouse`)
4. `Calls by hour of day`
5. `Agent utilization`
6. `ClickHouse`
7. `Campaign contact rate`
8. `Chat response time`
9. `Billing & usage`

**Kanıt:** DOM metin taraması — TR, FR ve AR için **aynı 9 string** sızıyor (dökme aynı üç dilde birebir). Görseller: [`lang-tr.png`](screenshots/lang-tr.png), [`lang-fr.png`](screenshots/lang-fr.png), [`lang-ar.png`](screenshots/lang-ar.png).

> Kapsam notu: Mevcut `known-bugs.authed.spec.js › B12` bu sızıntıyı **yalnızca TR** için işaretliyor. Yeni analytics spec'i sızıntıyı **her üç dilde** (tr/fr/ar) guard'lıyor → daha geniş.

---

## 🐞 BULGU B (keşifte çıktı) — İç/teknik terim "ClickHouse" son kullanıcıya görünüyor

**Nerede:** "Deep analytics" › "Call abandonment" kartı alt başlığı: *"Abandonment rate over time **from ClickHouse** · 30 Days"*.

**Beklenen:** Kullanıcıya dönük metin, kullanılan veri deposunun (ClickHouse — bir OLAP veritabanı) adını göstermemeli. Bu bir **iç implementasyon detayı sızıntısı**dır; İngilizce arayüzde bile uygunsuz.

**Gerçekleşen:** Ham "ClickHouse" ismi kart açıklamasında görünüyor (dört dilde de). Ayrıca BULGU A gereği bu satır hiç çevrilmiyor.

---

## 🔎 Gözlem C (a11y / test edilebilirlik) — Tarih filtre butonları seçili durumu semantik sunmuyor

**Nerede:** `Today/7 Days/30 Days/90 Days/Custom` grubu.

**Gerçekleşen:** Seçili buton yalnızca **CSS sınıfıyla** (`bg-secondary text-secondary-foreground`) işaretleniyor; `aria-pressed` / `role="tab"[aria-selected]` / `data-state` **yok**. Ekran okuyucu/klavye kullanıcısı hangi aralığın etkin olduğunu algılayamaz; testler de sağlam semantik çapadan yoksun kalır.

**İstek:** Frontend'den bu butonlar için `aria-pressed` (veya bir toggle-group semantiği) ya da `data-testid` istenmeli. Test şimdilik son çare olarak `bg-secondary` sınıfını kullanıyor ve bu talebi not ediyor.

---

## 🔬 Fonksiyonel / Network incelemesi — kontroller GERÇEKTEN iş yapıyor mu?

Her tarih butonuna tıklanıp **Network (`/api/v1/analytics/*`) + DOM (aktif sınıf + dönem etiketleri)** ölçüldü (inspection düzeyi, salt-okunur). Sayfa açılışta bu analytics uçlarını GET'liyor:

`/analytics/overview` · `/analytics/calls?groupBy=day` · `/analytics/queues` · `/analytics/agents/utilization` · `/analytics/calls/abandonment?groupBy=day` · `/analytics/calls/distribution` · `/analytics/ai` · `/analytics/ai/resolution` · `/analytics/chat/response` · `/analytics/campaigns` · `/analytics/billing` — hepsi `startDate`/`endDate` parametreli, **hepsi GET** (mutasyon yok).

Bir tarih butonuna basıldığında **~10-11 analytics GET'i** yeni `startDate` ile tekrar atılır ve **11 dönem etiketi** (`· 30 Days` → `· 7 Days`/`· Today`/`· 90 Days`) güncellenir. `Today` seçiminde `calls` ucu `groupBy=hour`'a döner.

### 3 katmanlı kontrol matrisi (testlerin dayandığı model)

| Buton / Kontrol | L1 Tıklama | L2 Arka plan | L3 Görev |
|---|---|---|---|
| **Today** | ✅ aktif (`bg-secondary`) | ✅ `GET /analytics/*` `startDate`=bugün 00:00 (yerel), `calls groupBy=hour` | ✅ 11 dönem etiketi → `· Today` |
| **7 Days** | ✅ aktif | ✅ `startDate`=7 gün önce | ✅ etiketler → `· 7 Days` |
| **30 Days** (varsayılan) | ✅ açılışta aktif | ✅ `startDate`=30 gün önce | ✅ etiketler `· 30 Days` |
| **90 Days** | ✅ aktif | ✅ `startDate`=90 gün önce | ✅ etiketler → `· 90 Days` |
| **Custom** | ✅ tarih seçici popover açılır (Start/End + "Apply range") | ✅ "Apply range" → `GET /analytics/*` özel aralıkla | ~ dönem etiketi `· N Days` kalıbını kullanmıyor (özel aralık) |
| **All reports** linki | ✅ gezinme | — N/A (istemci-taraflı gezinme) | ✅ `/reports`'a gider |
| **6 navigasyon kartı** | ✅ gezinme | — N/A | ✅ `/reports/{call,agent,queue,campaign,ai,dashboards}` |

**Sonuç:** Tarih aralığı kontrolleri (Today/7/30/90/Custom) **üç katmanda da çalışıyor** → yeşil guard testleri (bozuk değil). Navigasyon kartları da doğru hedeflere gidiyor.

---

## 🧭 Taşma (responsive) incelemesi

Yatay taşma `1280` (masaüstü), `768` (tablet), `390` (mobil) genişliklerinde en ve ar (RTL) için ölçüldü.

- **Document yatay kayması: hiçbir viewport'ta YOK** (`scrollingElement.scrollWidth == clientWidth`). Mobilde de sayfa yatay kaymıyor.
- **Mobil başlık:** ilk ölçümde h1 "gizli" göründü ama bu **yükleme anına** özgüydü; içerik oturunca (analytics yanıtı + render) h1 **görünür**. Gerçek bir "mobilde başlık kaybı" bug'ı **yok**.
- **Marjinal:** `768px`'de başlık+buton satırı kabı ~18px (`scrollWidth 482 > clientWidth 464`) taşıyor ama `overflow-x: visible` ve document kaymadığı için görünür bir yatay kaydırma çubuğu oluşturmuyor. Kozmetik; test.fail'e değmez, izlemede tutuluyor.
- Görseller: [`overflow-en-mobile.png`](screenshots/overflow-en-mobile.png), [`overflow-ar-mobile.png`](screenshots/overflow-ar-mobile.png).

---

## Test yazımı için sağlam çapalar (seçiciler)

- Başlık: `page.getByRole('heading', { level: 1 })` — tek h1 (dile göre metin).
- Bölüm başlıkları: `getByRole('heading', { name: 'AI usage'/'Deep analytics' })`.
- Tarih butonları: `getByRole('button', { name: 'Today'|'7 Days'|... , exact: true })`; aktif durum (son çare) `bg-secondary` sınıfı — `data-testid`/`aria-pressed` istendi (Gözlem C).
- Custom popover: butona bas → `getByRole('dialog')` içinde `Start`/`End` label + `Apply range` butonu + 2 `input[type=date]`.
- Navigasyon kartları: `main a[href="/reports/call"]` … (metin dile göre değişir, `href` stabildir).
- Network L2: `page.waitForRequest(r => r.url().includes('/api/v1/analytics/') && r.method() === 'GET')`.
- Dönem etiketi L3: `main` innerText içinde `· 7 Days` / `· 30 Days` / `· Today` / `· 90 Days` sayımı.
- Dil değiştirici: kenar çubuğu altındaki `button` (hasText `English|Türkçe|Français|العربية`) → menüde endonim etiket. Her test **taze bağlamda İngilizce** başlar; **tek switch**.

---

## Bundan sonra yazılacak testler

`tests/analytics.authed.spec.js` (salt-okunur, hiçbir şey oluşturulmaz):
1. **Yapı (@smoke):** h1 + alt başlık + 5 tarih butonu + KPI döşemeleri + "AI usage"/"Deep analytics" bölümleri + 6 navigasyon kartı görünür.
2. **4 dil i18n guard (@regression):** başlık, yön (ar=rtl), tarih butonları, "AI usage", "All reports" ve 6 kart çevrili.
3. **Tarih butonları L1/L2/L3 (@regression, yeşil):** aktiflik + analytics GET + dönem etiketi değişimi.
4. **Custom tarih seçici L1 (+L2):** popover Start/End/Apply range açılır; Apply analytics GET tetikler (kayıt yok).
5. **Navigasyon kartları L1/L3:** karta tıklayınca `/reports/*` hedefine gider.
6. **BULGU A (@known-bug, `test.fail`):** "Deep analytics" bölümü tr/fr/ar'da çevrili olmalı — açıkken beklenen başarısızlık; düzelince guard'a çevrilir.
7. **BULGU B (@known-bug, `test.fail`):** "ClickHouse" kullanıcıya görünmemeli.
