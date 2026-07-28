# Süpervizör Duvar Panosu (`/supervisor/wallboard`) — Keşif Notları

> Tarih: 28 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla (Playwright `storageState`) 4 dilde inceleme + DOM/inspection ölçümü + tam sayfa ekran görüntüsü.
>
> Amaç: Sayfanın **olması gereken** halini kaydetmek, bulguları kanıtlamak ve buna göre regresyon testi yazmak. Uygulama güncellenince bu alanlar bozulursa testler kırmızıya döner ve nerede sorun olduğu anlaşılır.

Ekran görüntüleri: [`screenshots/`](screenshots/)

---

## 1. Sayfanın "olması gereken" hali (yapı)

Başlık: **Supervisor wallboard** (TR: *Süpervizör duvar panosu*) · Alt başlık: *Real-time contact center overview* (TR: *Gerçek zamanlı çağrı merkezi özeti*).

**Üst kontrol çubuğu:**
- Canlı bağlantı rozeti (`Live` / *Canlı* — bağlantı yoksa *Bağlantı kesildi*) + son güncelleme saati
- **Refresh All** düğmesi
- **Auto-scroll** düğmesi
- **Refresh** aralığı: sayı girişi (`30`) + `s`
- **Tema seçici** (Radix Select): `Light / Dark / Auto` — TR: *Açık / Karanlık / Otomatik*
- **Save layout** (TR: *Düzeni kaydet*)
- **TV mode** (TR: *TV modu*)

**Kuyruk kartları (4 adet):** AI Created Queue, General Support, Sales, Software. Her kartta: SLA rozeti (%), *Waiting* (Bekleyen) sayısı, *Longest wait* (En uzun bekleme), SLA çubuğu, `avail / busy / other` (müsait / meşgul / diğer) sayıları, kart menüsü (`⋮`, aria-label `Queue actions`).

**Durum döşemeleri (6 adet):** Available, On Call, Busy, Break, Offline, Active calls (Uygun, Aramada, Meşgul, Mola, Çevrimdışı, Aktif aramalar).

**Alt metrik kartları (4 adet):** ASA (*Avg speed of answer*), Queued (*Calls waiting in queue*), Volume (*Calls last hour*), SLA (*Overall SLA*).

Kart adları (AI Created Queue, General Support, Sales, Software) ve metrik kısaltmaları (SLA, ASA) **çevrilmez** — bunlar veri/isim, çeviri sızıntısı değil.

---

## 2. 4 Dil Yerelleştirme Durumu

Dil, sunucuda/localStorage'da kalıcı DEĞİL (session/bellek) → taze bağlam hep **İngilizce** açılır. Çalışan dil değiştirici: **kenar çubuğu altındaki** metinli düğme (🇬🇧 English / 🇹🇷 Türkçe / …). Bkz. hafıza notu `vomenta-workforce-i18n`.

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| `html[dir]` | ltr | ltr | ltr | **rtl** ✅ |
| `html[lang]` | en | tr | fr | ar |
| Başlık (h1) | Supervisor wallboard | Süpervizör duvar panosu | Mur du superviseur | لوحة المشرف |
| Alt başlık | Real-time contact center overview | Gerçek zamanlı çağrı merkezi özeti | — | نظرة عامة على مركز الاتصال في الوقت الفعلي |
| Tema seçici | Dark | Karanlık | Sombre | داكن |
| Save layout | Save layout | Düzeni kaydet | Enregistrer la disposition | حفظ التخطيط |
| TV mode | TV mode | TV modu | Mode TV | وضع التلفزيون |
| **Refresh All** | Refresh All | **Refresh All** ⚠ | **Refresh All** ⚠ | **Refresh All** ⚠ |
| **Auto-scroll** | Auto-scroll | **Auto-scroll** ⚠ | **Auto-scroll** ⚠ | **Auto-scroll** ⚠ |
| **Refresh** (aralık etiketi) | Refresh | **Refresh** ⚠ | **Refresh** ⚠ | **Refresh** ⚠ |

**Genel değerlendirme:** Yerelleştirme büyük ölçüde **sağlam**. Başlık, alt başlık, tema etiketi, Save layout, TV mode, kart içi etiketler (Bekleyen/En uzun bekleme/müsait/meşgul/diğer), durum döşemeleri ve alt metrikler dört dilde de çevriliyor. **Arapça RTL doğru** (`dir=rtl`, düzen aynalı — kenar çubuğu sağda, kartlar sağdan sola). Arapça başlık kararlı (`لوحة المشرف`, 1.5–6 sn boyunca değişmedi).

---

## 🐞 BULGU 1 (Kullanıcının bulduğu) — Tema seçici (Açık/Karanlık/Otomatik) HİÇBİR ETKİ ETMİYOR

**Nerede:** Duvar panosu üst çubuğundaki tema `<Select>` (Radix `role="combobox"`), seçenekler `Light / Dark / Auto`.

**Beklenen:** Seçilen tema sayfaya uygulanmalı (koyu tema seçilince arka plan koyulaşmalı).

**Gerçekleşen:** Seçici **kendi görünen değerini** güncelliyor (Light→Dark→Auto) ama sayfaya **hiçbir tema uygulanmıyor**.

**Inspection (DOM) kanıtı** — her seçim sonrası ölçüldü:

| Seçim | Seçicinin gösterdiği | `html.class` | `html[data-theme]` | `color-scheme` | `body` arka plan | localStorage `theme` |
|---|---|---|---|---|---|---|
| (açılış) | Dark | `light` | (yok) | light | `rgb(244,244,245)` | yazılmıyor |
| → Light | Light | `light` | (yok) | light | `rgb(244,244,245)` | yazılmıyor |
| → Dark | Dark | `light` | (yok) | light | `rgb(244,244,245)` | yazılmıyor |
| → Auto | Auto | `light` | (yok) | light | `rgb(244,244,245)` | yazılmıyor |

- `html` class **hiç** `light`'tan çıkmıyor; `data-theme` hiç eklenmiyor; hesaplanan arka plan rengi hiç değişmiyor.
- `localStorage` anahtarları hep aynı (`nextauth.message`, `sidebar-store`, `softphone-store`) — tema seçimi hiçbir yere yazılmıyor.
- **Ek tutarsızlık:** Sayfa açılışında seçici **"Dark"** gösteriyor ama tema aslında **light** → seçicinin başlangıç değeri gerçek temaya bağlı değil.
- **Karşılaştırma:** Header'daki ayrı `aria-label="Toggle theme"` düğmesi bağımsız ve çalışan tema kontrolü. Yani sorun app genelinde tema değil, **wallboard'a özgü bu seçici bozuk/bağlanmamış**.

**Kanıt görselleri:** [`theme-01-light.png`](screenshots/theme-01-light.png), [`theme-02-dark.png`](screenshots/theme-02-dark.png) (seçici "Dark" seçili ama sayfa tamamen açık tema), [`theme-03-auto.png`](screenshots/theme-03-auto.png) — üçü de görsel olarak aynı (açık tema).

---

## 🐞 BULGU 2 (keşifte çıktı) — "Refresh All" / "Auto-scroll" / "Refresh" hiçbir dilde çevrilmiyor

**Nerede:** Üst kontrol çubuğu.

**Gerçekleşen:** Sayfanın geri kalanı Türkçe/Fransızca/Arapça'ya çevrilirken **"Refresh All"**, **"Auto-scroll"** düğmeleri ve **"Refresh"** aralık etiketi **İngilizce** kalıyor (üç dilde de). Kullanıcının 1. ekran görüntüsünde de bu görünür: yanında "Düzeni kaydet" ve "TV modu" Türkçe iken bu ikisi İngilizce.

**Kanıt görselleri:** [`lang-tr.png`](screenshots/lang-tr.png), [`lang-fr.png`](screenshots/lang-fr.png), [`lang-ar.png`](screenshots/lang-ar.png).

> Not: Bu i18n sızıntısı görsel/işlevsel bir "kırık" değil ama tutarlılık hatası. Regresyon testinde ayrı bir `test.fail` (bilinen hata) ile işaretlendi — çevrildiğinde testler bunu "beklenmedik geçiş" olarak gösterip guard'a çevrilecek.

---

## 🔬 Fonksiyonel / Network incelemesi — kontroller GERÇEKTEN iş yapıyor mu?

Her butona tıklanıp **Network istekleri + Console + DOM/state (aria/class/scroll/fullscreen)** ölçüldü (inspection düzeyi). Canlı veri `wss://api.vomenta.com/socket.io/` (socket.io) üzerinden gelir.

| Kontrol | Sonuç | Kanıt (tıklamada olan) |
|---|---|---|
| **Refresh All** | ✅ Çalışıyor (ama bkz. BULGU 4) | `GET /api/v1/supervisor/dashboard` + `GET /api/v1/supervisor/wallboard/config` + `GET /api/v1/voice/calls/live` + "Dashboard refreshed" toast. Veriyi çekiyor; fakat yanındaki son-güncelleme saati yanlış timezone'da gösteriliyor (BULGU 4). |
| **TV modu** | ✅ Çalışıyor | `document.fullscreenElement: false → true` (gerçek tam ekran). |
| **Düzeni kaydet** | ✅ Çalışıyor | `PUT /api/v1/supervisor/wallboard/config` (ardından config GET ile yeniden okuma). |
| **Refresh aralığı (30 s)** | ~ Kısmen | Sayı girişi düzenlenebiliyor (30→5); değişimde config PUT yok, yalnızca yerel poll zamanlayıcısını besliyor. Bariz kırık değil. |
| **Auto-scroll** | ❌ **BOZUK (BULGU 3)** | Aşağıya bakın. |
| Tema seçici | ❌ Bozuk (BULGU 1) | Yukarıda. |

> Yan gözlem (bug değil, izlenebilir): açılışta socket.io bazı bağlantıları `agentId=undefined&tenantId=undefined` ile açıyor (kimlik gelmeden önce) — sonra doğru ID'lerle tekrar bağlanıyor.

### 3 katmanlı kontrol matrisi (testlerin dayandığı model)

Her buton **3 katmanda** test edilir: **L1** butona basılıyor ve UI tepki veriyor mu · **L2** doğru uca network isteği gidiyor mu · **L3** amacını gerçekleştiriyor mu. Bir katman gerçekten yoksa (saf istemci) veya prod'a yazmadan güvenli doğrulanamıyorsa **N/A** olarak belirtilir.

| Buton / Kontrol | L1 Tıklama | L2 Arka plan | L3 Görev |
|---|---|---|---|
| **Refresh All** | ✅ "refreshed" toast | ✅ `GET /supervisor/dashboard` | ❌ son-güncelleme saati UTC (**BULGU 4**) |
| **Auto-scroll** | ✅ toggle `bg-primary` | — N/A (istemci) | ❌ içerik taşsa da kaydırmıyor (**BULGU 3**) |
| **TV modu** | ✅ etkin | — N/A | ✅ `fullscreenElement=true` |
| **Düzeni kaydet** | ✅ etkin | ✅ `PUT /wallboard/config` | ~ N/A (kalıcı kayıt = mutation, prod'a yazmadan doğrulanmaz) |
| **Tema seçici** | ✅ gösterilen değer değişiyor | — N/A (istemci) | ❌ seçilen tema uygulanmıyor (**BULGU 1**) |
| **Refresh aralığı** | ✅ değer düzenlenebiliyor | — N/A | — N/A (poll sıklığı deterministik gözlemlenemez) |
| **Kuyruk eylemleri (⋮)** | ✅ menü açılır + 5 eylem | ⚠ YIKICI → yalnızca staging @mutation | ⚠ YIKICI → yalnızca staging @mutation |

> ⚠ Kuyruk eylemleri (Pause/Resume/Close/Redirect/Move) canlı veriyi değiştirir/yıkıcıdır ve socket.io üzerinden gidebilir → **prod'da tetiklenmez**. L2/L3 yalnızca staging'de `@mutation` ile doğrulanır (`test.fixme` placeholder'ları mevcut).

Test karşılığı: `tests/supervisor-wallboard.authed.spec.js` — her buton kendi `describe`'ında `L1/L2/L3` başlıklı test'lerle. Bozuk L3'ler `test.fail` (bilinen hata); düzeltilince "beklenmedik geçiş" verir.

---

## 🐞 BULGU 3 (keşifte çıktı) — "Auto-scroll" hiç kaydırmıyor

**Nerede:** Üst kontrol çubuğu, "Auto-scroll" toggle düğmesi.

**Beklenen:** Açıkken içerik ekrana sığmıyorsa panoyu otomatik kaydırmalı (TV/duvar ekranı için tipik özellik).

**Gerçekleşen:** Düğme **kendi durumunu değiştiriyor** (tıklayınca `outline` → `bg-primary` = aktif/vurgulu; tekrar tıklayınca kapanıyor) **ama hiç kaydırma yapmıyor.**

**Inspection kanıtı** (kısa viewport ile içerik kasıtlı taşırıldı):
- İçerik **taşıyor**: `MAIN` kabı `scrollHeight=698 > clientHeight=404` (kaydırılacak ~294px var).
- Auto-scroll ON (buton `bg-primary` doğrulandı) → **~9 sn boyunca** tüm scroll pozisyonları (`window`, `document`, `MAIN`, `NAV`) **0'da kaldı**.
- **TV modunda da aynı**: `fullscreenElement=true`, buton aktif, içerik taşıyor → yine **~10 sn boyunca scroll 0** → hareket yok.
- Konsol hatası / page error yok (sessizce hiçbir şey yapmıyor).

**Sonuç:** Toggle görsel olarak açılıp kapanıyor ama otomatik kaydırma mantığı çalışmıyor — kullanıcının "basıyorum ama etki yok" gözlemiyle birebir uyuşuyor (dil İngilizce iken bile). Normal görünüm ve TV modu, iki durumda da kaydırma yok.

**Kanıt görseli:** [`bug3-autoscroll.png`](screenshots/bug3-autoscroll.png) — buton **"Auto-scroll on"** (aktif/vurgulu) ama içerik taştığı halde sayfa tepede kalıyor.

---

## 🐞 BULGU 4 (kullanıcının bulduğu) — "Live/Canlı" son-güncelleme saati UTC gösteriliyor

**Nerede:** Üst çubukta "Live/Canlı" rozetinin yanındaki yenileme ikonlu saat (son-güncelleme zamanı).

**Beklenen:** Kullanıcının yerel saatinde gösterilmeli (header duvar saatiyle tutarlı).

**Gerçekleşen:** Sunucunun **UTC** zamanı yerele **çevrilmeden** gösteriliyor → Türkiye'de (UTC+3) **~3 saat geride** görünüyor. Header duvar saati ise doğru yerel saati gösteriyor; ikisi yan yana ve 3 saat çelişiyor.

**Inspection / Network kanıtı** (tarayıcı timezone = Europe/Istanbul):
- Tarayıcı: yerel **12:26 PM** = UTC **09:26 AM**.
- Header duvar saati: **12:26 PM** ✅ (yerel, doğru).
- "Live" badge saati: **09:26 AM** ❌ (UTC — yerel değil). Badge span'i: `<span class="… text-muted-foreground">` + `svg.lucide-refresh-cw` + saat.
- API zaten UTC ISO dönüyor: `GET /api/v1/supervisor/dashboard` → `data.timestamp = 2026-07-28T09:26…Z`; `/wallboard/config` → `data.updatedAt = …Z`. Yani hata sunucuda değil, **frontend'in yerel saate çevirmemesinde**.

**Kanıt görseli:** [`bug4-timezone.png`](screenshots/bug4-timezone.png) — aynı karede header **12:26 PM** vs badge **09:26 AM**.

---

## 🐞 BULGU 5 (kullanıcının bulduğu) — Kuyruk "⋮" menüsünde "Resume queue" çevrilmiyor

**Nerede:** Kuyruk kartı → "⋮" (Queue actions) menüsü.

**Gerçekleşen:** Türkçe arayüzde menünün 4 öğesi çevriliyken **"Resume queue" İngilizce kalıyor**:
- Aramayı taşı ✅ · Kuyruğu duraklat ✅ · **Resume queue** ❌ (çevrilmemiş) · Kuyruğu kapat ✅ · Tüm aramaları yönlendir ✅

İngilizce menü: `Move call / Pause queue / Resume queue / Close queue / Redirect all calls`.
BULGU 2 ile aynı desen (menü içi çeviri sızıntısı).

**Kanıt görseli:** [`bug5-resume-queue-leak.png`](screenshots/bug5-resume-queue-leak.png).

---

## Test yazımı için sağlam çapalar (seçiciler)

- Başlık: `page.getByRole('heading', { level: 1 })` — tek h1.
- Tema seçici: `page.getByRole('combobox')` (sayfada tek combobox); seçenekler `role="option"` (`Light/Dark/Auto`).
- Tema uygulanıyor mu ölçümü: `html` class `/dark/` içeriyor mu + `getComputedStyle(body).backgroundColor` değişiyor mu.
- Dil değiştirici: kenar çubuğu altındaki `button` (hasText `English|Türkçe|Français|العربية`) → menüde endonim etiket.
- Save layout / TV mode / Refresh All / Auto-scroll: `getByRole('button', { name })`.
- Her test **taze bağlamda İngilizce** başlar; dile **tek switch** yapılır (ardışık switch güvenilmez).
