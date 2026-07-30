# Vomenta — Yapılan Testler Raporu

> ⚙️ **Otomatik üretilir** (`npm run report:test-report`). Kaynak: `playwright test --list` (statik collection).
> **UYARI:** Bu rapor testlerin **listelendiğini** gösterir, **çalıştığını değil.** Hiçbir kayıt `executed`/`verified`/`high` değildir (gerçek koşum kanıtı — JUnit/trace — bu kapsamda değil). `generic` = ortak baseline; **"kapsam tamamlandı" anlamına gelmez.**

Kolonlar: `coverageStatus` (verified|partial|generic|blocked) · `evidenceLevel` (L1|L2|L3) · `executionStatus` (executed|listed-only|skipped|fixme) · `confidence` (high|medium|low) · `provenance` (değerin kaynağı).

## Özet

- **Listelenen test:** 765 / 77 dosya
- **coverageStatus:** verified 0 · partial 727 · generic 9 · blocked 29
- **executionStatus:** executed 0 · listed-only 736 · skipped 0 · fixme 29
> `executed`/`verified` = 0: bu üreteç testleri çalıştırmaz; gerçek koşum WP-R2 dışıdır.

## Alan × kapsam özeti

| alan | toplam | partial | generic | blocked |
|---|---|---|---|---|
| analytics | 33 | 33 | 0 | 0 |
| auth | 11 | 11 | 0 | 0 |
| campaigns | 40 | 39 | 0 | 1 |
| contacts | 48 | 48 | 0 | 0 |
| cross-cutting | 34 | 33 | 0 | 1 |
| dashboard | 22 | 22 | 0 | 0 |
| discovery | 1 | 1 | 0 | 0 |
| inbox | 5 | 5 | 0 | 0 |
| other | 9 | 0 | 9 | 0 |
| reports | 80 | 80 | 0 | 0 |
| settings | 333 | 316 | 0 | 17 |
| shell | 21 | 21 | 0 | 0 |
| supervisor | 88 | 78 | 0 | 10 |
| tickets | 6 | 6 | 0 | 0 |
| voice | 9 | 9 | 0 | 0 |
| workforce | 25 | 25 | 0 | 0 |

## Ayrıntı (dosya bazlı)

### `analytics.authed.spec.js` — _analytics_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| tarih aralığı butonları mevcut (Today / 7 Days / 30 Days / 90 Days / Custom) | @smoke | — | listed-only | partial | medium | list-exec |
| üst KPI döşemeleri görünüyor VE değer gösteriyor |  | — | listed-only | partial | medium | list-exec |
| "AI usage" ve "Deep analytics" bölümleri görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| 6 navigasyon kartı doğru hedeflerle görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| sayfada sessiz hata yok (console-error / failed-request / 5xx) | @smoke | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + tarih butonları + AI usage + kartlar çevrili | @regression | — | listed-only | partial | medium | list-exec |
| varsayılan olarak "30 Days" aktif, diğerleri değil | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Today" tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "7 Days" tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "90 Days" tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: "7 Days" tıklanınca analytics verisi API'den çekiliyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Today" seçilince dönem etiketleri "· Today"e dönüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "7 Days" seçilince dönem etiketleri "· 7 Days"e dönüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "90 Days" seçilince dönem etiketleri "· 90 Days"e dönüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: popover Start / End + "Apply range" ile açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: "Apply range" özel aralıkla analytics verisi çekiyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Call analytics" kartı /reports/call ("Call Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Agent analytics" kartı /reports/agent ("Agent Performance") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Queue analytics" kartı /reports/queue ("Queue Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Campaign analytics" kartı /reports/campaign ("Campaign Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "AI analytics" kartı /reports/ai ("AI Reports") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "Dashboards" kartı /reports/dashboards ("Dashboards") sayfasına götürüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [desktop] yatay taşma yok | @regression | — | listed-only | partial | medium | list-exec |
| [mobile] yatay taşma yok | @regression | — | listed-only | partial | medium | list-exec |
| [ar/rtl desktop] yatay taşma yok | @regression | — | listed-only | partial | medium | list-exec |
| BULGU A [tr]: "Deep analytics" bölümü tr arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU A [fr]: "Deep analytics" bölümü fr arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU A [ar]: "Deep analytics" bölümü ar arayüzde çevrili olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU B: iç terim "ClickHouse" kullanıcıya görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `login.spec.js` — _auth_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| doğru sayfa başlığı ile yükleniyor | @smoke @public | — | listed-only | partial | medium | list-exec |
| karşılama başlıkları görünüyor |  | — | listed-only | partial | medium | list-exec |
| giriş formu tüm temel alanları içeriyor | @smoke @public | — | listed-only | partial | medium | list-exec |
| SSO (Google ve Microsoft) butonları görünüyor |  | — | listed-only | partial | medium | list-exec |
| e-posta ve şifre alanlarına yazılabiliyor |  | — | listed-only | partial | medium | list-exec |
| e-posta alanı geçersiz adresi native doğrulama ile reddediyor |  | — | listed-only | partial | medium | list-exec |
| 'Forgot password?' linki şifre sıfırlama sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| 'Sign up' linki kayıt sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| erişilebilirlik: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| görsel: giriş sayfası anlık görüntüsü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `logout.authed.spec.js` — _auth_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| kullanıcı menüsünden çıkış yapılabiliyor |  | — | listed-only | partial | medium | list-exec |

### `campaigns-outbound.authed.spec.js` — _campaigns_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| dört özet kartı listeleniyor | @smoke | — | listed-only | partial | medium | list-exec |
| arama, tür filtresi ve durum sekmeleri mevcut | @smoke | — | listed-only | partial | medium | list-exec |
| tablo başlıkları doğru sırada | @smoke @critical | — | listed-only | partial | medium | list-exec |
| New Campaign düğmesi görünür ve etkin | @smoke | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + kart/filtre/sekme/başlık etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: metin yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: arama filtresiyle liste ucunu çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: eşleşmeyen arama boş-durumu gösteriyor (liste gerçekten filtreleniyor) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçilen değer trigger'da güncelleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: campaignType filtresiyle liste ucunu çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Voice" seçilince listede yalnız VOICE kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "SMS" seçilince listede yalnız SMS kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Email" seçilince listede yalnız EMAIL kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "WhatsApp" seçilince listede yalnız WhatsApp kampanyaları kalıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Running sekmesi seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: status filtresiyle liste ucunu çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "All" karışık durumları gösteriyor (en az bir Completed) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Running" sekmesi diğer durumları listeden çıkarıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Paused" sekmesi diğer durumları listeden çıkarıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: tıklanınca create rotasına gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: create sayfası kanal verisini çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Create Campaign" sihirbazı görünüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: göz ikonuna basınca detay rotasına gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: seçilen kampanyanın detayını API'den çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: doğru kampanyanın detay sayfası açılıyor (ad eşleşiyor) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: çöp ikonu kalıcı-silme onay dialogu açıyor (mutation göndermeden) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: onaylayınca DELETE /campaigns/{id} gidiyor (route ile yakalanır, prod'a yazılmaz) | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK — N/A: gerçek silme kalıcı mutation, prod'a yazmadan doğrulanamaz (bkz. mutasyon spec dosyasi) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: play ikonu başlatma onay dialogu açıyor (mutation göndermeden) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: onaylayınca POST /campaigns/{id}/start gidiyor (route ile yakalanır) | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 hata yolu OK: start 400 dönünce "Failed to start" hata toast'ı gösteriliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| 6 adımlı stepper + Adım 1 alanları görünüyor; Cancel geri döndürüyor | @regression | — | listed-only | partial | medium | list-exec |
| göz ile açılan detayda sekmeler ve metrik kartları var | @regression | — | listed-only | partial | medium | list-exec |
| BULGU 1: 10+ kampanya varsa sayfalama/daha-fazla kontrolü olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| BULGU 2: satır işlem ikonlarının (göz/sil) erişilebilir ismi olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `campaigns-outbound.mutation.authed.spec.js` — _campaigns_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: sihirbaz uçtan uca kampanya OLUŞTURUYOR (create → detay → cleanup) | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `contacts-mutations.authed.spec.js` — _contacts_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kişi oluştur → ara → toplu Etiket (VIP) → toplu Sil | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `contacts.authed.spec.js` — _contacts_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık, alt başlık ve 7 kolon görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| araç çubuğu butonları ve arama mevcut | @critical | — | listed-only | partial | medium | list-exec |
| en az bir kişi listeleniyor | @smoke | — | listed-only | partial | medium | list-exec |
| [en] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: terim girince liste süzülür ve "Clear" çıkar | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: arama filters={"search":…} ile API sorgusu atıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: eşleşen kişi görünür, eşleşmeyen sorgu boş-durum gösterir | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: 5 tag chip görünür ve tıklanabilir | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: chip tıklanınca filters={"tags":[…]} sorgusu atılıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: filtre listeyi süzüyor (VIP kişisi yoksa boş-durum) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: dropdown açılıyor (All Companies + en az bir şirket) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: bir şirket seçilince liste yeniden çekiliyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: seçilen şirket dropdown tetikleyicisinde yansıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: sort chip görünür ve tıklanabilir | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sort chip yeni sort=[…] ile sorgu atıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: satır sırası değişiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: ızgara butonu tıklanınca aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: ızgara görünümü tabloyu değiştiriyor, listeye dönünce tablo geri geliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: New Contact formunu açıyor (9 alan + Kaydet/İptal) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ) | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: /contacts/import sayfasını (dosya girişli) açıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Export tıklanınca indirme başlıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Export POST /contacts/export ucunu tetikliyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: indirilen CSV içeriği doğru (başlık + kodlama), bozulma yok | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: farklı dilde indirme dili değiştirmez / bozulmaz (en == ar başlık) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: /contacts/segments sayfasını açıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: satıra tıklayınca /contacts/{id} detayına gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: detay kişi + timeline uçlarından veri çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: detay sayfası kişi adını ve sekmeleri gösteriyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 OK: tek sayfada prev/next pasif ve sayaç "of N" gösteriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: bir satır seçilince "1 selected" + 5 toplu buton çıkıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "tümünü seç" tüm satırları seçiyor (sayaç = toplam) | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] toplu çubuk buton etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Assign Owner" diyaloğu açılıyor (Confirm/Cancel) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Add Tag" diyaloğu açılıyor (Confirm/Cancel) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Add to Campaign" diyaloğu açılıyor (Confirm/Cancel) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçili export indirme başlatıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: toplu export POST /contacts/export tetikliyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Sil onay alertdialog'u açıyor; İptal listeyi değiştirmiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| BULGU F1: satır ara butonu erişilebilir ismi ham anahtar "callContact" olmamalı | @regression | — | listed-only | partial | medium | list-exec |
| BULGU F2: kişi detayı sil butonu ham anahtar "contacts.delete" göstermemeli | @regression | — | listed-only | partial | medium | list-exec |

### `a11y.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Dashboard: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Contacts: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Tickets: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Settings: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Reports: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Analytics: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Workforce: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Supervisor Agents: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Voice: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Reports · Call: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| Reports · Dashboards: bilinen borç dışında ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |

### `known-bugs-invite.mutation.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| yeni davet listede e-posta + "Beklemede" ile ayırt edilebilir görünmeli | @regression @known-bug @mutation | — | fixme | blocked | low | list-exec |

### `known-bugs.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| B1 · /voice/regulatory · ham i18n anahtarları görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B2 · /campaigns · ilerleme yüzdesi 100ü aşmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B3 · /inbox · ham i18n anahtarı inbox.noMessagesYet görünmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B4 · /settings · "Manage Modules" kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B5 · /channels · Ses kartı yanlışlıkla "Yapılandırılmadı" göstermemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B6 · /settings · davet satırları ayırt edilebilir olmalı (placeholder "Invited User" değil) | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B7 · /settings · Modüller açıklaması iki kez render edilmemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B8 · Softphone · müsaitlik açılır menüsü GÖRSEL olarak açılmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B9 · /channels/email · varsayılan imza ham i18n anahtarı göstermemeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B10 · /voice/regulatory · Voice sekme çubuğu görünmeli (bölüm düzeni) | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B11 · /voice/voicemail · İşlemler butonlarının erişilebilir ismi olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B12 · /analytics · TR arayüzde İngilizce/iç metin sızmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B13 · /ai · sekme etiketinde boşluk eksik olmamalı ("Yapay ZekaTemsilciler") | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B14 · /voice/dids · reddedilen talebin nedeni tam okunabilir olmalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| B15 · Sol menü · bölüm üst-başlığı bölüm köküne gitmeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| SETTINGS-BILLING-REDIRECT · /settings/billing deep-link kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| SETTINGS-BILLING-CHANGEPLAN · Ayarlar "Change plan" kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |
| SETTINGS-BILLING-HISTORY · Ayarlar "Billing history" kök sayfaya atmamalı | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `mutation-orphans.authed.spec.js` — _cross-cutting_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| dashboard otomasyon kayıtları sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |
| schedule otomasyon kayıtları sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |
| contact otomasyon kayıtları sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |
| workforce vardiya baseline’ı sıfır | @mutation @regression | — | listed-only | partial | medium | list-exec |

### `dashboard-actions.authed.spec.js` — _dashboard_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "Send SMS" /channels/sms ("SMS Configuration") sayfasına götürüyor |  | — | listed-only | partial | medium | list-exec |
| "Create Campaign" /campaigns/outbound ("Outbound Campaigns") sayfasına götürüyor |  | — | listed-only | partial | medium | list-exec |
| "View Reports" /reports ("Reports") sayfasına götürüyor |  | — | listed-only | partial | medium | list-exec |

### `dashboard.authed.spec.js` — _dashboard_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| oturum geçerli — giriş formu görünmüyor | @smoke | — | listed-only | partial | medium | list-exec |
| panel ve kullanıcı menüsü görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| kenar menüsü tüm ana bölümleri içeriyor | @critical | — | listed-only | partial | medium | list-exec |
| menü linkleri doğru href değerlerine sahip |  | — | listed-only | partial | medium | list-exec |
| arama kutusu ve tarih filtreleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| panelde sessiz hata yok (console-error / failed-request / 5xx) | @smoke | — | listed-only | partial | medium | list-exec |
| /inbox doğrudan açılıyor ("Inbox") |  | — | listed-only | partial | medium | list-exec |
| /voice doğrudan açılıyor ("Live Calls") |  | — | listed-only | partial | medium | list-exec |
| /channels doğrudan açılıyor ("Channels") |  | — | listed-only | partial | medium | list-exec |
| /ai doğrudan açılıyor ("AI Management") |  | — | listed-only | partial | medium | list-exec |
| /campaigns doğrudan açılıyor ("Campaigns") |  | — | listed-only | partial | medium | list-exec |
| /bot-builder doğrudan açılıyor ("Bot Builder") |  | — | listed-only | partial | medium | list-exec |
| /contacts doğrudan açılıyor ("Contacts") |  | — | listed-only | partial | medium | list-exec |
| /tickets doğrudan açılıyor ("Tickets") |  | — | listed-only | partial | medium | list-exec |
| /analytics doğrudan açılıyor ("Analytics") |  | — | listed-only | partial | medium | list-exec |
| /reports doğrudan açılıyor ("Reports") |  | — | listed-only | partial | medium | list-exec |
| /supervisor doğrudan açılıyor ("Supervisor") |  | — | listed-only | partial | medium | list-exec |
| /workforce doğrudan açılıyor ("Workforce Management") |  | — | listed-only | partial | medium | list-exec |
| /settings doğrudan açılıyor ("Settings") |  | — | listed-only | partial | medium | list-exec |

### `discovery/discovery.spec.js` — _discovery_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| salt-okunur uygulama keşfi rapor ve kapsam radarı üretir |  | — | listed-only | partial | medium | list-exec |

### `inbox.authed.spec.js` — _inbox_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Inbox ve Soft Phone panelleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| konuşma arama kutusu görünüyor ve yazılabiliyor |  | — | listed-only | partial | medium | list-exec |
| eşleşmeyen aramada boş-durum mesajı gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| kanal / atama filtre çipleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| sağ panel sekmeleri görünüyor ve tıklanınca seçili oluyor |  | — | listed-only | partial | medium | list-exec |

### `quality-baseline.authed.spec.js` — _other_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| yapı ve doğrudan erişim çalışıyor | @smoke @deeplink | — | listed-only | generic | low | list-exec |
| bilinen borç dışında ciddi/kritik ihlal yok | @a11y | — | listed-only | generic | low | list-exec |
| LTR ve Arapça RTL görünüm mobil/tablet/masaüstünde taşmıyor | @layout | — | listed-only | generic | low | list-exec |
| yüklemede console, ağ veya HTTP 5xx hatası yok | @clean | — | listed-only | generic | low | list-exec |
| en dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| tr dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| fr dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| ar dil/yön kabuğu çalışıyor | @i18n | — | listed-only | generic | low | list-exec |
| interaktif kontrol envanteri erişilebilir isim taşıyor | @regression | — | listed-only | generic | low | list-exec |

### `reports-actions.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "New Dashboard" pano sayfasına ("Dashboards") götürüyor |  | — | listed-only | partial | medium | list-exec |
| "Custom Report" pano/rapor sayfasına ("Dashboards") götürüyor |  | — | listed-only | partial | medium | list-exec |
| "Schedule a Report" formu açılıyor ve iptal edilebiliyor |  | — | listed-only | partial | medium | list-exec |

### `reports-dashboards-mutations.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Create Dashboard: pano oluşunca özel listeye ekleniyor (L2 POST 201 + L3 kart) | @regression @mutation | L2 | listed-only | partial | medium | list-exec+title-inferred |
| Duplicate: çoğaltma bir "(Copy)" ekliyor (L3) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |
| Delete: silme kartı listeden kaldırıyor (L2 DELETE 204 + L3) | @regression @mutation | L2 | listed-only | partial | medium | list-exec+title-inferred |

### `reports-dashboards.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| üç sekme görünüyor (Tümü / Varsayılan / Özel) | @smoke | — | listed-only | partial | medium | list-exec |
| bölüm başlıkları görünüyor (Varsayılan / Özel Panolar) | @smoke | — | listed-only | partial | medium | list-exec |
| "Create Dashboard" eylem düğmesi görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| en az bir özel pano kartı listeleniyor | @critical | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekme/bölüm/eylem etiketleri çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: sekmeye tıklayınca seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: sekme kart listesini gerçekten filtreliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: paylaş diyaloğu açılıyor ve bağlantıyı gösteriyor | @regression @critical | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [en] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [tr] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [fr] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: [ar] paylaş diyaloğu yatayda taşmamalı [BULGU 1] | @regression @layout @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: kopyalayınca "Link copied" bildirimi çıkıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: panoya (clipboard) paylaşım URL'si yazılıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: oluştur diyaloğu açılıyor ve iptal edilebiliyor (kayıt YOK) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: Düzenle builder diyaloğunu açıyor (Add Widget) ve iptal edilebiliyor (kayıt YOK) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| sayfada ve paylaş diyaloğunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| liste ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, kart yok) | @errorpath | — | listed-only | partial | medium | list-exec |
| liste ucu boş [] dönerse özel pano listesi boş (patlamıyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| paylaş diyaloğu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| paylaşım bağlantısı doğrudan açılınca pano görünümü yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| paylaş diyaloğu görünümü değişmedi (URL maskeli) | @visual | — | listed-only | partial | medium | list-exec |

### `reports-route-sweep.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| kenar menüsündeki her /reports/* rotası baseline geçiyor | @regression @clean | — | listed-only | partial | medium | list-exec |

### `reports-schedule-mutations.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L2+L3: schedule oluşturuluyor, listeleniyor ve hemen siliniyor | @regression @mutation | L2 | listed-only | partial | medium | list-exec+title-inferred |
| güvenlik: tenantta geçici e2e schedule kalıntısı yok | @regression @mutation | — | listed-only | partial | medium | list-exec |

### `reports-sections.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| [call] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [agent] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [queue] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [campaign] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [channel] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [ai] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [quality] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [csat] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [billing] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [sla] başlık + Charts/Table sekmeleri + Date Range + Export/Schedule | @smoke | — | listed-only | partial | medium | list-exec |
| [en] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] kabuk (sekme/preset/yön) + tüm bölüm başlıkları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: sekmeler seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: Charts grafik gösteriyor, Table tabloya geçiyor | @regression @critical | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçilen preset vurgulanıyor (border-primary) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: preset yeni tarih aralığıyla veri çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: Date Range etiketi güncelleniyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| boş bölüm (campaign) düzgün içerik/boş-durum çözüyor (patlamıyor) | @regression | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok (Charts + Table) | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| rapor ucu 500 dönerse sayfa zarifçe çöküyor (kabuk sağlam, grafik yok) | @errorpath | — | listed-only | partial | medium | list-exec |
| sekmeler klavyeyle gezilebiliyor (Charts→Table, ok tuşu) | @keyboard | — | listed-only | partial | medium | list-exec |
| bölüm rotası doğrudan açılınca yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| grafikler bütçe içinde render oluyor | @perf | — | listed-only | partial | medium | list-exec |
| UI "Total Calls" KPI, API data.summary.totalCalls ile eşleşiyor | @data | — | listed-only | partial | medium | list-exec |
| boş-durum (campaign) görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |
| L1+L2: tıklayınca insights ucuna POST gidiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: menü CSV/Excel/PDF seçenekleriyle açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Schedule This Report" diyaloğu açılıyor ve iptal edilebiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: "line" seçilince grafik çizgi türüne geçiyor (recharts-line) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L2: "By Week" seçilince groupBy=week ile veri çekiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Standard ve Auto-refresh switch'leri durum değiştiriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| Tablo sekmesinde başlık + veri satırları + sayfa boyutu kontrolü var | @regression | — | listed-only | partial | medium | list-exec |
| L3: "Today" preset tarih etiketi YEREL bugünü göstermeli (UTC değil) [BULGU] | @regression @known-bug | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `reports.authed.spec.js` — _reports_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı ve tarih aralığı seçici görünüyor |  | — | listed-only | partial | medium | list-exec |
| sekmeler tıklanınca seçili oluyor VE paneli o içeriği gösteriyor |  | — | listed-only | partial | medium | list-exec |
| rapor eylem butonları görünüyor |  | — | listed-only | partial | medium | list-exec |
| Report Types sekmesi rapor kategorilerini gösteriyor |  | — | listed-only | partial | medium | list-exec |
| sayfa intl FORMATTING_ERROR sessiz hatası üretmemeli | @known-bug | — | listed-only | partial | medium | list-exec |
| AI Insights panelinde ham i18n anahtarı sızmamalı (reports.aiInsightsDesc) | @known-bug | — | listed-only | partial | medium | list-exec |

### `settings-api-keys-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: API anahtarı oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-api-keys.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Create Key + boş-durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Key name/Permissions + Create Key disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Create/Generate çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create Key dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| api-keys ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create Key dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/api-keys doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Create Key dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-audit.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Export + tablo ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları + en az bir log satırı görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "View" → "Change details" dialogu açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| Export tıklanınca audit-log CSV indiriliyor | @export | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Export çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| "Full Export" butonu Türkçede çevrili olmalı (şu an İngilizce) | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| View dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| audit-logs ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| View dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/audit doğrudan açılınca log yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-automations-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kural oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-automations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + 2 sekme + New Rule ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| Rules sekmesi boş-durum, SLA Policies sekmesi tabloyu gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| L1: sekmeler tıklanınca aria-selected=true | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: New Rule dialogu açılıyor (Rule Name + Save Rule disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + sekmeler + New Rule çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| New Rule dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve New Rule dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| otomasyon ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| New Rule dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/automations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Rules boş-durumu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-canned-responses-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: hazır yanıt oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-canned-responses.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + New canned response + tablo/boş-durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Title/Shortcode + Create disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + New çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| canned ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/canned-responses doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Create dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-compliance-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: onay kaydı oluştur → listede görün → temizle | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-compliance.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + tüm bölümler render ediliyor | @smoke | — | listed-only | partial | medium | list-exec |
| bölüm eylem butonları görünüyor (Log Consent / Create Request) | @critical | — | listed-only | partial | medium | list-exec |
| L3: "Manage Retention" → /settings/data-retention sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3: "View More" → /settings/audit sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Log Consent dialogu açılıyor (alanlar + Log Consent disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Create Request dialogu açılıyor (alanlar + Export Data disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 (kalıcı kayıt) N/A: prod salt-okunur — staging lane'ine bırakıldı | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + eylem butonları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Log Consent dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve Log Consent dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| onay listesi ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Log Consent dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/compliance doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-data-retention-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: saklama süresi değiştir → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-data-retention.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + saklama süreleri + Save changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| 5 saklama-süresi spinbutton'u değerleriyle görünüyor + Run cleanup mevcut | @critical | — | listed-only | partial | medium | list-exec |
| L1: Save changes + Run cleanup now + Automatic Cleanup switch mevcut (tıklanmıyor) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save changes çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| retention ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| /settings/data-retention doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| saklama-süresi formu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-disposition-codes-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kod oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-disposition-codes.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Add Code + tablo ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları + bilinen kodlar (SALE/NO_ANSWER) görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Code/Label alanları + Create) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Add Code dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kod ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add Code dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/disposition-codes doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Add Code dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-hours-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Cumartesi Open switch toggle → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-hours.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + haftalık program + Save changes ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| 7 günlük Open switch'i var; Pzt-Cum açık, Cmt/Paz kapalı | @critical | — | listed-only | partial | medium | list-exec |
| Holiday Calendar bölümü + Add (boşken disabled) | @regression | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save/Add çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| business-hours ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Timezone combobox açılıp Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/hours doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| haftalık program görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-integrations-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: webhook oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-integrations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + entegrasyon kartları + Webhook bölümü ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| Webhook tablosu kolonları + boş-durum | @critical | — | listed-only | partial | medium | list-exec |
| L3: "Manage API Keys" → /settings/api-keys yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Request Access "Request … Integration" dialogunu açıyor (Submit tıklanmaz) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Add Webhook dialogu açılıyor (URL/Secret/Events) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Request Access + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| webhooks ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/integrations doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Request Access dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-notifications-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: kategori switch toggle → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-notifications.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Email Category Preferences + Save ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| kategori switch'leri + Delivery Channels bölümü görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1: Save preferences + Enable push + kategori switch'leri mevcut (tıklanmıyor) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save + Enable push çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| tercihler ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| /settings/notifications doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-organization-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Website değiştir → Save → kalıcı → eski değere geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-organization.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Organization" başlığı + Company Information formu ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| form alanları render ediliyor (Company name/Website/Domain + Save) | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: Save changes formda değişiklik olunca aktifleşiyor (dirty) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: sayfa açılınca kuruluş ayarları çekiliyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Currency açılınca para birimi seçenekleri listeleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + bölüm + Save çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kuruluş ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Currency popover Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/organization doğrudan açılınca form yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Company Information formu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-profile-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Telefon değiştir → Save → kalıcı → eski değere geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-profile.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Profile" başlığı + 4 alt sekme ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| User menu → Profile navigasyonu sayfayı yüklüyor | @smoke | — | listed-only | partial | medium | list-exec |
| Profile sekmesi kişisel-bilgi formunu render ediyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: her sekme tıklanınca aria-selected=true | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: her sekme paneli KENDİ içerik imzasını gösteriyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Sessions sekmesi oturum listesini çekiyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Timezone açılınca seçenekler listeleniyor (UTC dahil) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Language açılınca çok-dilli seçenekler listeleniyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: link /settings/notifications sayfasını yüklüyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| Save/Password/2FA/Revoke kontrolleri MEVCUT ama tıklanmıyor (yan-etki) |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekmeler + panel imzaları çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ve her alt sekmede ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| profil ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| oturum ucu 500 dönerse Sessions sekmesi zarifçe çöküyor (tablo yok) | @errorpath | — | listed-only | partial | medium | list-exec |
| sekmeler ok tuşlarıyla gezilebiliyor (Radix roving tabindex) | @keyboard | — | listed-only | partial | medium | list-exec |
| Language popover Escape ile kapanıyor | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/profile doğrudan açılınca profil yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Profile sekmesi kişisel-bilgi kartı görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-roles-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: custom rol oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-roles.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Role Management" başlığı + rol tablosu ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo kolonları + sistem rolleri (ADMIN/AGENT/OWNER…) görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1: sistem rolünde Edit/Reset var, Delete DISABLED (silinemez) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: dialog açılıyor (Ad/Açıklama + izin kategorileri + Save) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| UI rol satırı sayısı, /roles yanıtındaki rol sayısıyla eşleşiyor | @data | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Create + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create Role dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve Create Role dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| roller ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create Role dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/roles doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `settings-security-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: password policy switch toggle → Save → kalıcı → geri al | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-security.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Password Policies + Save (disabled) ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| bölümler: Session Management / IP Whitelist / API Keys görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L3: "Open Contacts" → /contacts; "Manage API Keys" → /settings/api-keys | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Add IP dialogu açılıyor (IP/CIDR + Add to Whitelist disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Save Policy + Add IP çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Add IP dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali olmamalı (şu an: label/critical spinbutton) | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| security ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add IP dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/security doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Add IP dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-sla-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: SLA politikası oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-sla.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "SLA Policies" başlığı + New Policy + tablo ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo beklenen kolonları + en az bir politika satırı | @critical | — | listed-only | partial | medium | list-exec |
| /sla ucu çağrılıyor ve politika satır(lar)ı render ediliyor | @data | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Policy name + Create policy disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + New Policy çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| New Policy dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| New Policy dialogunda ciddi a11y ihlali olmamalı | @a11y @known-bug | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| sla ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| New Policy dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/sla doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| New Policy dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-teams-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: ekip oluştur → kartlarda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-teams.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Teams" başlığı + Create Team + ekip kartı ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| en az bir ekip kartı üye sayısıyla görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (Ad/Açıklama + Create disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Create butonu çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Create Team dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve Create Team dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| ekip listesi 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Create Team dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/teams doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Create Team dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-templates-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: şablon oluştur → tabloda görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-templates.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + üst sekmeler + New Template ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| şablon tablosu kolonları + boş-durum | @critical | — | listed-only | partial | medium | list-exec |
| L1: üst sekmeler tıklanınca aria-selected=true | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: New Template dialogu açılıyor (Name + Create disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + üst sekmeler + New Template çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| içerik alanı placeholder'ı ham anahtar "settings.templatesPage.contentPlaceholder" GÖSTERMEMELİ | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| New Template dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| şablon ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| New Template dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/templates doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| New Template dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-users.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Users & Roles" başlığı + üye tablosu ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tablo beklenen kolonları gösteriyor + en az bir üye satırı | @critical | — | listed-only | partial | medium | list-exec |
| L1+L3 görev OK: ada göre arama eşleşen üyeyi süzüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Invite User dialogu açılıyor (Email/Role/Team + Send disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 (kalıcı davet) N/A: prod salt-okunur — staging mutation lane'ine bırakıldı | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| davet dialogundaki kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ve davet dialogunda ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| kullanıcı listesi 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| davet dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/users doğrudan açılınca liste yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| davet dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings-webhooks-mutations.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: webhook oluştur → listede görün → sil | @regression @mutation | L3 | fixme | blocked | low | list-exec+title-inferred |

### `settings-webhooks.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa başlığı + Add Webhook + boş-durum ile açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: dialog açılıyor (URL + Events + Create webhook disabled) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + Add Webhook çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu kapat butonu Türkçede "Kapat" olmalı (şu an "Close") | @i18n @known-bug | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| webhooks ucu 500 dönerse kabuk sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu odak tuzağı ve Escape ile kapanma | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings/webhooks doğrudan açılınca sayfa yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |
| Add Webhook dialogu görünümü değişmedi | @visual | — | listed-only | partial | medium | list-exec |

### `settings.authed.spec.js` — _settings_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| sayfa "Settings" başlığıyla açılıyor | @smoke | — | listed-only | partial | medium | list-exec |
| tüm sekmeler görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| L1+L3: her sekme tıklanınca seçili oluyor VE paneli o içeriği gösteriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Organization" paneli → /settings/organization (başlık "Organization") | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Security" paneli → /settings/security (başlık "Security") | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "API Keys" paneli → /settings/api-keys (başlık "API Keys") | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| [en] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + 6 sekme etiketi çevrili | @i18n | — | listed-only | partial | medium | list-exec |
| sayfada ciddi/kritik a11y ihlali yok | @a11y | — | listed-only | partial | medium | list-exec |
| mobil/tablet/masaüstünde sayfa yatayda taşmıyor | @layout | — | listed-only | partial | medium | list-exec |
| sayfa yüklenirken console/ağ hatası yok (allowlist dışı) | @clean | — | listed-only | partial | medium | list-exec |
| billing/subscription 500 dönse de hub sağlam kalıyor (login'e düşmüyor) | @errorpath | — | listed-only | partial | medium | list-exec |
| sekmelerde ok tuşu odağı taşıyor ve seçimi değiştiriyor (aria-selected) | @keyboard | — | listed-only | partial | medium | list-exec |
| /settings doğrudan açılınca hub yükleniyor (login'e düşmüyor) | @deeplink | — | listed-only | partial | medium | list-exec |

### `forms.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Create Ticket formu beklenen alanlarla açılıyor |  | — | listed-only | partial | medium | list-exec |
| boş gönderim "Subject is required." uyarısı veriyor ve kaydetmiyor |  | — | listed-only | partial | medium | list-exec |

### `header.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| tema değiştirici temayı gerçekten değiştiriyor (Dark ↔ Light) |  | — | listed-only | partial | medium | list-exec |
| durum (presence) menüsü seçenekleriyle açılıyor |  | — | listed-only | partial | medium | list-exec |
| kullanıcı menüsü (avatar) Profile/Settings/Log out ile açılıyor |  | — | listed-only | partial | medium | list-exec |

### `navigation.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "Inbox" linkine tıklayınca /inbox ("Inbox") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| "Tickets" linkine tıklayınca /tickets ("Tickets") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| "Analytics" linkine tıklayınca /analytics ("Analytics") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |
| "Settings" linkine tıklayınca /settings ("Settings") sayfasına gidiyor |  | — | listed-only | partial | medium | list-exec |

### `pages.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| /inbox sayfası "Inbox" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /contacts sayfası "Contacts" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /tickets sayfası "Tickets" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /reports sayfası "Reports" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| /analytics sayfası "Analytics" başlığıyla açılıyor |  | — | listed-only | partial | medium | list-exec |
| Reports sayfası tüm rapor kategorilerini gösteriyor |  | — | listed-only | partial | medium | list-exec |
| Analytics sayfası alt bölümleri gösteriyor |  | — | listed-only | partial | medium | list-exec |

### `responsive.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| mobilde masaüstü kenar menüsü gizli | @layout | — | listed-only | partial | medium | list-exec |
| mobilde hamburger (Open menu) butonu görünür | @layout | — | listed-only | partial | medium | list-exec |

### `search.authed.spec.js` — _shell_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| Search butonu komut paletini açıyor |  | — | listed-only | partial | medium | list-exec |
| komut paleti klavye kısayolu (⌘K / Ctrl+K) ile açılıyor |  | — | listed-only | partial | medium | list-exec |
| arama kutusuna yazılabiliyor ve Escape ile kapanıyor |  | — | listed-only | partial | medium | list-exec |

### `supervisor-agent-live.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| canlı AI çağrısı yokken boş-durum gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + alt başlık + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1/L2/L3: canlı AI çağrısı seçilince cockpit açılır (staging/canlı veri) | @regression | L1 | fixme | blocked | low | list-exec+title-inferred |

### `supervisor-agents.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| istatistik döşemeleri görünüyor (Total/Available/Offline/Calls Today/Avg AHT) |  | — | listed-only | partial | medium | list-exec |
| temsilci tablosu beklenen kolonları gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| kontroller mevcut (durum filtresi / arama / Analyze) |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: menü açılıyor ve durum seçenekleri görünüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: durum seçince agents API'sini status parametresiyle çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: seçilen duruma göre tablo filreleniyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: arama kutusuna yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: arama agents API'sini search parametresiyle çağırıyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: arama tabloyu eşleşen ajana daraltıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Force menüsü açılıyor ve zorla-durum seçenekleri görünüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: durum seçince onay diyaloğu zorunlu-sebep ile açılıyor (iptal edilir) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2/L3: "Force → Break" ajanın durumunu backend'de Break yapar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: çevrimdışı ajanı zorlama hatasının tam HTTP kodu/mesajı doğrulanır (staging) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L1 tıklama OK: transkript girilince Analyze butonu etkinleşiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Analyze transkripti detect-anomaly ucuna POST ediyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: analiz sonucu (risk) arayüzde gösteriliyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1: Previous/Next butonları mevcut, tek sayfada Next devre dışı | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L3: ızgara/liste arasında geçiş tablo düzenini değiştiriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1+L2+L3: satıra tıklayınca panel açılıyor, status-history çekiliyor, veri tutarlı | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1: aksiyon ikonları mevcut ve çevrimdışı ajanda devre dışı | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 doğruluk: sunucu yanıtındaki her ajan seçilen durumla eşleşiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| BULGU: "Last refreshed" saati yerel saat olmalı (UTC değil) | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `supervisor-coaching.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| istatistik döşemeleri görünüyor |  | — | listed-only | partial | medium | list-exec |
| tablo kolonları + sekmeler görünüyor | @critical | — | listed-only | partial | medium | list-exec |
| kontroller mevcut (arama / New Evaluation) + boş-durum |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + sekmeler + New Evaluation çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: "Pending Review" sekmesi seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: arama kutusuna yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: diyalog form alanlarıyla açılıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: kriter puanları Overall Score'u yükseltiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: dolu form doğru DTO ile evaluations ucuna POST ediyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3: değerlendirme gönderimi kalıcı kayıt oluşturur (staging mutasyon) | @regression | L3 | fixme | blocked | low | list-exec+title-inferred |

### `supervisor-interactions.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| tablo beklenen kolonları gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| kontroller mevcut (kanal filtresi / arama) |  | — | listed-only | partial | medium | list-exec |
| aktif etkileşim yokken boş-durum gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + kanal filtresi + boş-durum çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: menü açılıyor ve kanal seçenekleri görünüyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: kanal seçince interactions API'sini channel parametresiyle çağırıyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: arama kutusuna yazılabiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1/L2/L3: aktif etkileşim satırındaki izleme/araya-girme aksiyonları (staging/canlı veri) | @regression | L1 | fixme | blocked | low | list-exec+title-inferred |

### `supervisor-wallboard.authed.spec.js` — _supervisor_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve alt başlık görünüyor | @smoke @critical | — | listed-only | partial | medium | list-exec |
| kontrol çubuğu düğmeleri mevcut (Refresh All / Auto-scroll / Save layout / TV mode / tema) |  | — | listed-only | partial | medium | list-exec |
| dört kuyruk kartı listeleniyor | @critical | — | listed-only | partial | medium | list-exec |
| alt metrik kartları mevcut (ASA / Queued / Volume / SLA) |  | — | listed-only | partial | medium | list-exec |
| [en] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yön + tema/kontrol etiketleri çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: tıklayınca "refreshed" bildirimi çıkıyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: dashboard verisini API'den çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: gösterilen son-güncelleme saati yerel saat olmalı (UTC değil) [BULGU 4] | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: tıklayınca toggle aktif duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: içerik taşınca otomatik kaydırmalı [BULGU 3] | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: buton görünür ve etkin | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: tıklayınca tam ekrana geçiyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: düzeni PUT ile config ucuna gönderiyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: seçenek seçince gösterilen değer değişiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: "Dark" seçilince koyu tema uygulanmalı [BULGU 1] | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: değer düzenlenebiliyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: ⋮ menüsü açılıyor ve 5 eylem görünüyor | @regression @critical | L1 | listed-only | partial | medium | list-exec+title-inferred |
| i18n: Türkçe'de menü eylemleri çevrili (Resume queue hariç) | @regression | — | listed-only | partial | medium | list-exec |
| BULGU 5: "Resume queue" Türkçe menüde çevrilmeli | @regression | — | listed-only | partial | medium | list-exec |
| L2/L3: "Pause queue" backend'e pause isteği atar ve kuyruk duraklar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Resume queue" backend'e resume isteği atar ve kuyruk devam eder (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Close queue" backend'e close isteği atar ve kuyruk kapanır (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Redirect all calls" onay sonrası yönlendirme isteği atar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| L2/L3: "Move call" hedef seçme diyaloğu açar ve taşıma isteği atar (staging mutation) | @regression | L2 | fixme | blocked | low | list-exec+title-inferred |
| BULGU 2: "Refresh All"/"Auto-scroll" Türkçe arayüzde çevrilmeli | @regression @known-bug | — | listed-only | partial | medium | list-exec |

### `tickets.authed.spec.js` — _tickets_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| tablo beklenen kolonları gösteriyor | @critical | — | listed-only | partial | medium | list-exec |
| sekmeler (All / My Tickets / Unassigned / Urgent) görünüyor |  | — | listed-only | partial | medium | list-exec |
| en az bir ticket listeleniyor | @smoke | — | listed-only | partial | medium | list-exec |
| arama: ticket numarasına göre tek sonuca filtreliyor | @critical | — | listed-only | partial | medium | list-exec |
| sekme filtresi: Unassigned sekmesi atanmamış ticketları gösteriyor |  | — | listed-only | partial | medium | list-exec |
| arama: eşleşmeyen sorgu "No tickets found" boş-durumu gösteriyor |  | — | listed-only | partial | medium | list-exec |

### `voice-call.mutation.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3: softphone ile test numarası aranıyor ve çağrı kuruluyor | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3: test numarasına SMS gönderiliyor (channels.sms.send) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `voice-subnav.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| "Queues" alt-navigasyonu /voice/queues ("Queues") panelini açıyor |  | — | listed-only | partial | medium | list-exec |
| "Call History" alt-navigasyonu /voice/history ("Call History") panelini açıyor |  | — | listed-only | partial | medium | list-exec |
| "Voicemails" alt-navigasyonu /voice/voicemail ("Voicemails") panelini açıyor |  | — | listed-only | partial | medium | list-exec |
| "Recordings" alt-navigasyonu /voice/recordings ("Call Recordings") panelini açıyor |  | — | listed-only | partial | medium | list-exec |

### `voice.authed.spec.js` — _voice_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| /voice, Live Calls sayfasına açılıyor |  | — | listed-only | partial | medium | list-exec |
| aktif çağrı yokken boş durum gösteriliyor |  | — | listed-only | partial | medium | list-exec |
| Voice alt-navigasyon öğeleri görünüyor |  | — | listed-only | partial | medium | list-exec |

### `workforce-mutations.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| L3 görev OK: Add Shift kalıcı vardiya oluşturuyor (POST /wfm/schedules) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: Publish Schedule taslağı yayınlıyor ("Draft" kalkıyor) | @regression @mutation | L3 | listed-only | partial | medium | list-exec+title-inferred |

### `workforce.authed.spec.js` — _workforce_

| test | etiket | evidenceLevel | executionStatus | coverageStatus | confidence | provenance |
|---|---|---|---|---|---|---|
| başlık ve 7 sekme görünüyor | @smoke | — | listed-only | partial | medium | list-exec |
| Schedules çizelgesi ve Publish butonu mevcut | @critical | — | listed-only | partial | medium | list-exec |
| [en] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [tr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [fr] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| [ar] başlık + yazı yönü + sekmeler + oluşturma formu çevrili | @regression | — | listed-only | partial | medium | list-exec |
| L1 tıklama OK: her sekme tıklanınca seçili duruma geçiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: veri sekmeleri ilgili API ucundan veri çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: her sekme kendi içeriğini gösteriyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: Previous Week tarih aralığını değiştiriyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Previous Week seçilen hafta için çizelge çekiyor | @regression @critical | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L3 görev OK: gösterilen hafta tam olarak bir hafta geri kayıyor | @regression | L3 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: 7d/14d/30d düğmeleri görünür ve tıklanabilir | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: 14d seçilince adherence verisi API'den çekiliyor | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: çizelge hücresi "Add Shift" formunu açıyor (Start/End/Break) | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ) | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: buton görünür ve etkin | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: form açılıyor (Start/End Date, Reason) ve tarih dolunca Submit etkinleşiyor | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L2 arka plan OK: Submit doğru uca POST gönderiyor (prod'a YAZILMAZ) | @regression | L2 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Create badge" formu açılıyor ("Create badge") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Award badge" formu açılıyor ("Award badge") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Create survey" formu açılıyor ("Create survey") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
| L1 tıklama OK: "Create Evaluation" formu açılıyor ("Create Quality Evaluation") | @regression | L1 | listed-only | partial | medium | list-exec+title-inferred |
