# Canlı Chrome keşfi — bulgular (RUN dev-surface-20260807-140629)

Kaynak: girişli gerçek Chrome (Browser 2 / 7d7ab0c2…), Test User, tr-TR, viewport ~1512×794.
Salt-okunur. Mutation kontrolleri çalıştırılmadı.

## F-001 — `/channels/email`: ham i18n anahtarı render ediliyor
- **Kanıt:** inline screenshot ss_3977p2exp. "Varsayılan İmza (HTML)" alanında metin yerine
  literal **`channels.emailPage.defaultSignatureText`** görünüyor.
- **Tür:** content bug / broken i18n (product defect).
- **Test etkisi:** `content_drift`; ayrıca bir spec bu alanın çevrilmiş metnini beklerse
  `false_green` (anahtar string'i de "görünür metin" olarak assertion'a takılabilir).
- **Öneri:** i18n anahtar varlığını doğrulayan assertion; imza alanı için "ham anahtar
  render edilmemeli" negatif kontrolü (regex `/^[a-z]+(\.[a-zA-Z]+)+$/` gibi anahtar-benzeri
  metni reddet).

## F-002 — `/settings`: IA yeniden yapılandırıldı (6 sekmeli tek sayfa)
- **Kanıt:** ss_8307qtggs. Sekmeler: Organizasyon · Kullanıcılar · Faturalandırma ve
  Kullanım · Güvenlik · API Anahtarları · Modüller.
- **Tür:** `route_drift` / IA change. Eski `SURFACE-INVENTORY.md` ~22 düz `/settings/*`
  rotası sayıyordu; dev'de bunlar sekmelere konsolide olmuş.
- **Test etkisi:** eski `/settings/*` deep-link testleri `stale_test` olabilir.

## F-003 — `/settings` sekme durumu URL'de değil (deep-link yok)
- **Kanıt:** Modüller sekmesine tıklandı, URL `/settings` olarak kaldı (ss_8322i38it).
- **Tür:** testability / behavior. Sekmeye doğrudan rota ile gidilemiyor; test tıklamayla
  gezinmeli. `Organizasyon` ve `Modüller` sekmeleri içerikten ayrı yönetim sayfasına
  yönlendiriyor (`/settings/organization`, "Yönet Modüller" butonu).

## F-004 — `/settings/audit` sekme çubuğunda yok
- **Kanıt:** ss_8307qtggs sekme listesinde audit yok; ama `/settings/audit` doğrudan açılıyor
  (ss_0444tdp5u).
- **Tür:** navigation discoverability gap.

## F-005 — `/settings` Modüller sekmesi: içerik tekrarı + bozuk Türkçe
- **Kanıt:** ss_8322i38it. Açıklama paragrafı ("İletişim merkeziniz için eklenti
  modüllerini yönetin…") **iki kez** üst üste render ediliyor. Buton etiketi
  **"Yönet Modüller"** — hatalı sözcük sırası (doğrusu "Modülleri Yönet").
- **Tür:** content bug / i18n.

## F-006 — `/settings/audit`: satır aksiyonu tekrar eden erişilebilir ad
- **Kanıt:** ref_33..ref_40 hepsi "Görüntüle". Selector satır kapsamıyla yapılmazsa
  `.first()`/nth yanlış satıra bağlanır → `false_green` riski.
- **Tür:** a11y / selector stability.

## F-007 — Test-infra: base `.env` `BASE_URL` önceliği "dev" koşumunu PROD'a düşürebilir (LATENT)
- **Kanıt (repro):** `config/environment.js` modül tepesinde `shellBaseURL = process.env.BASE_URL`
  yakalanıyor. Eğer başka bir modül `environment.js`'ten ÖNCE `dotenv.config()` ile base
  `.env`'i yüklerse (base `.env`'de `TEST_ENV=production`, `BASE_URL=https://app.vomenta.com`),
  `shellBaseURL` prod URL olur ve `resolveTarget` bunu "açık override" sayar:
  ```
  TEST_ENV=dev node -e "import dotenv; dotenv.config('.env'); import environment.js"
  → baseURL: https://app.vomenta.com   name: dev     ← PROD'a bakıyor ama "dev" etiketli
  ```
- **BU KOŞUMDA TETİKLENMEDİ:** bare `TEST_ENV=dev` çözümü iki kez `app.dev.vomenta.com`
  verdi; crawler gerçekten dev'i gezdi. Ama yükleme sırası değişirse sessiz prod-koşumu riski var.
- **Tür:** `false_green` / wrong-environment (P0 latent). **Öneri:** ortamı `TEST_ENV`
  registry'sinden türet; `BASE_URL` override'ını yalnızca gerçek shell/CI değişkeninden al
  (base `.env`'den gelen `BASE_URL`'i explicit override sayma). `name=dev` iken host
  `app.vomenta.com` ise erken hata fırlat (tutarsızlık guard'ı).

## F-008 — Dev app statik asset + RSC prefetch origin'i = `app.vomenta.com` (prod)
- **Kanıt:** crawler dev'i gezdi ama 522/522 asset/prefetch isteği `app.vomenta.com` origin'ine
  gitti (`_next/static/...`, prefetch `GET /channels|/ai|/inbox|/voice` → `ERR_ABORTED`).
  Canlı Chrome'da API çağrıları ise doğru şekilde `api.dev.vomenta.com`'a gidiyor.
- **Yorum:** dev deployment `assetPrefix`/prefetch origin'i olarak prod app host'unu kullanıyor.
  API prod'a GİTMİYOR (veri güvenliği sorunu yok), ama cross-origin prefetch abort'ları oluşuyor.
- **Test etkisi:** origin-tabanlı network assertion'ları (yalnız `app.dev.vomenta.com` bekleyen)
  yanlış-fail üretebilir; crawler'ın "hata olayı" saydığı `ERR_ABORTED` prefetch'leri GERÇEK
  hata DEĞİL. `/reports/dashboards` (4) ve `/settings/disposition-codes` (2) "err" sayıları bu
  benign prefetch abort'larıdır → gürültü.
- **Tür:** dev-config observation + test-signal noise (P2).

## F-009 — [DÜZELTİLDİ / ÇÜRÜTÜLDÜ] `/campaigns/outbound` KALDIRILMAMIŞ
- İlk hipotez (crawler `removedRoutes: ["/campaigns/outbound"]` → stale_test) canlı doğrulamayla
  **ÇÜRÜTÜLDÜ**: rota CANLI ve işlevsel — "Giden Kampanyalar" (ss_2524a0han). Sub-nav: Giden/
  Şablonlar/Gönderici Kimlikleri/DNC.
- **Test etkisi düzeltmesi:** `campaigns-outbound.authed.spec.js` + `.mutation` **STALE DEĞİL**;
  kapsam korunmalı. Kök-neden crawler'da → **F-023**.

## F-022 — `/contacts/segments` çevrilmemiş İngilizce
- **Kanıt:** ss_3230cdpj6. Başlık "Segments", "Saved segments", "Save filter rules and target
  groups of contacts." EN; breadcrumb TR "Segmentler"; empty-state TR "Segment yok". Kısmi i18n.
- **Tür:** content/i18n (P2). F-001/F-018/F-021 ile aynı sistemik i18n boşluğu ailesi.

## F-023 🔴 Crawler `removedRoutes` — maxPages truncation'da FALSE-POSITIVE
- **Kanıt:** `/campaigns/outbound` canlı ama crawler "removed" dedi. Neden: maxPages=60 kuyruğu
  kesti (queuedRemaining=6), rota bu koşumda ziyaret edilmedi; baseline-diff "visited'da yok →
  removed" mantığı yanlış pozitif üretti.
- **Tür:** test-infra / reporting güvenilirliği (P1). "removedRoutes" test-bakım kararlarını
  (spec silme) yanlış yönlendirebilir.
- **Öneri:** removed sinyalini yalnız kuyruk BOŞALDIĞINDA üret; maxPages ile kesildiyse
  "unvisited-due-to-limit" ayrı sınıf. Ayrıca removed adaylarını silmeden önce canlı 404/redirect doğrula.

## F-010 — `/settings/users`: E-posta kolonu tüm satırlarda boş
- **Kanıt:** ss_9656pylxz. "E-posta" kolonu başlığı var ama hiçbir satırda değer yok.
- **Tür:** data/render bug ya da bilinçli PII gizleme (belirsiz). Doğrulanmalı.
- **Test etkisi:** bir spec e-posta hücresini doğruluyorsa `false_green`/boş-veri kırılganlığı.

## F-011 — Rol matrisi: ürün 6 rol tanımlıyor, repo 3 biliyor
- **Kanıt:** ss_1391qd5z6. `/settings/roles`: ADMIN, AGENT, MANAGER, OWNER, SUPERVISOR, VIEWER.
  `config/environment.js` `SUPPORTED_ROLES=['default','admin','supervisor','agent']`.
- **Tür:** `access_drift` / rol kapsamı boşluğu. MANAGER/OWNER/VIEWER için read-only rol hesabı yok
  → rol-bazlı yüzey farkı çıkarılamıyor (blocker). AGENT & SUPERVISOR "Değiştirildi" (varsayılandan sapma).

## F-012 — `/settings/teams/:id` dinamik rota + tutarsız tab-state
- **Kanıt:** ss_7525am4m5. Ekip detay `?tab=settings` query ile (URL'de tab), ama `/settings`
  ana sekmeleri URL'de değil (F-003). Uygulama genelinde tab-state tutarsız.
- **Tür:** `new_uncovered_surface` + testability tutarsızlığı.

## F-013 — `/settings/profile` iç sekmeleri top-level rotaları dupluyor
- **Kanıt:** ss_87669bek1. Profile sekmeleri: Profil/Güvenlik/Oturumlar/Bildirimler. "Güvenlik"
  ve "Bildirimler" ayrıca `/settings/security` ve `/settings/notifications` olarak da var.
- **Tür:** yüzey duplikasyonu (kişisel vs org bağlamı belirsiz). Test hangi yüzeyi doğrulamalı?

## F-014 — Settings genelinde yüzey örtüşmesi (çoklu giriş noktası)
- **Kanıt:** `/settings/compliance` (ss_27149si4d) veri-saklama+audit'i topluyor;
  `/settings/automations` (ss_6082osxbg) "SLA Politikaları" sekmesi ↔ `/settings/sla` (ss_7382t60w1);
  `/settings/templates` (ss_10508ir2d) "Hazır yanıtlar" sekmesi ↔ `/settings/canned-responses` (ss_9143q7dhh).
- **Tür:** IA/kanonik-yüzey belirsizliği. Test etkisi: aynı işlev için birden çok yol → hangi
  rotanın "kanonik" test edileceği belirsiz; duplicate-surface drift riski.

## F-015 🔴 `/channels` hub kalıcı loading skeleton (false-green adayı)
- **Kanıt:** ss_7059wx0hr — 6sn sonra bile kartlar render olmuyor; console error yok; network'te
  yalnız 2 OPTIONS preflight, veri GET görünmüyor. Bireysel kanal sayfaları çalışıyor.
- **Tür:** broken hub + `false_green_candidate` (crawler 0 sert ihlal dedi çünkü document yüklendi).
- **Öneri:** kart/skeleton'ın ÇÖZÜLDÜĞÜNÜ assert et (skeleton kaybolmalı, en az 1 kanal kartı görünmeli).

## F-016 `/voice` ≡ `/voice/dids` (aynı Telefon Numaraları sayfası)
- **Kanıt:** ss_7050qh56r == ss_1598u8cnw. `/voice` ayrı hub değil.

## F-017 `/voice/queues` → `/settings/teams` redirect (queues = teams alias)
- **Kanıt:** ss_6310pvo6p; final URL `/settings/teams`, breadcrumb Ayarlar>Ekipler.
- **Test etkisi:** `/voice/queues`'ü ayrı yüzey sayan test aslında teams'i test ediyor (`route_drift`).

## F-018 🔴 `/voice/regulatory` (Düzenleyici KYC) TAMAMEN BOZUK — crawler-missed
- **Kanıt:** ss_0321n7wcc + console. Tüm metinler ham i18n anahtarı (`voiceRegulatory.*`);
  React #418/#422 hydration; FORMATTING_ERROR "queueName".
- **Tür:** broken page + missing i18n + `new_uncovered_surface` (crawler'ın 60'ında yok).
- **Öncelik:** P1 (belki P0 — kullanıcıya tamamen bozuk görünüyor). Paralel "VOICE-REGULATORY-BROKEN" ile uyumlu.

## F-019 intl FORMATTING_ERROR: "queueName" değişkeni sağlanmadı
- **Kanıt:** console (regulatory'de yakalandı). `"...{queueName} ekibinden başka bir ekibe taşıyın."`
  interpolasyon değişkeni eksik → çağrı-transfer/queue-move bileşeninde i18n bug.

## F-020 `/channels/social` — WhatsApp içeriği sızması + `/channels/sms` SMPP başarısızlıkları
- **Kanıt:** ss_1013qzpjw (social sayfasında "WhatsApp Business" bloğu), ss_4496oqngq (Başarısız
  "SMPP bind failed" satırları — geçmiş test verisi).
- **Tür:** layout/content bleed (P2) + gözlemlenen teslimat başarısızlıkları (veri, ürün bug değil).

## F-021 `/reports` hub — Queue Reports kartı ham i18n anahtarı
- **Kanıt:** ss_3783ebe2z. Kart: `reports.queueReports`, `reports.queueReportsDesc`,
  `reports.viewQueuePerformance` (çevrilmemiş). Sayfanın kendisi (`/reports/queue` = "Ekip Raporları")
  çevrili — bug yalnız hub kartında.
- **Tür:** content/i18n (P2). F-001/F-018 ile aynı aile (eksik i18n anahtarları).

## F-024 `/` Dashboard — ham i18n `dashboard.setupStepQueue` + setup çelişkisi
- **Kanıt:** ss_1842d01qk. Kurulum adımında ham anahtar `dashboard.setupStepQueue`. Kart "4/4 %100
  tamamlandı" derken üst banner "You skipped some setup steps" (çelişkili durum).
- **Tür:** content/i18n + state inconsistency (P2).

## F-025 `/ai` — "Yapay ZekaTemsilciler" (boşluk eksik)
- **Kanıt:** ss_18751j6e9. Sekme etiketi birleşik. Minor content (P3).

## F-026 `/monitoring/agents` — ham i18n `supervisor.voice.offline` (Durum kolonu)
- **Kanıt:** ss_8413mggpt. Tüm ajan satırlarında Durum = ham anahtar. Ayrıca süreler 1102:54:07 gibi
  (takılı sayaç gözlemi). **Tür:** content/i18n (P2). Bir tablo-durum testi bu anahtarı "değer" sanabilir → false_green.

## F-027 🔴 Crawler kapsam kör-noktası — 30+ erişilebilir yüzey keşfedilmedi
- **Kanıt:** canlı keşif crawler'ın 60'ında OLMAYAN 30+ rota buldu: /voice/regulatory (bozuk),
  /contacts/*(6), /campaigns/*(4), /monitoring/*(3), /ai/*(~8), /supervisor/ai-rate-suggestions,
  dinamik :id rotaları, /setup.
- **Kök-neden:** crawler queue'su MAIN_NAVIGATION + registered(TESTED_PAGES) + DOM href ile seed'leniyor;
  maxPages=60 kesiyor VE registry eksik olduğu için grup-alt-rotaları/sidebar-expand gerektiren linkler atlanıyor.
- **Tür:** discovery completeness (P1). "tam keşif" iddiası için maxPages artırılmalı + sidebar grup
  genişletme + registry güncellenmeli; aksi halde broken sayfalar (F-018) görülmeden kalır.

## F-028 `/contacts/:id` — ham i18n `contacts.delete` + "Activity" sekmesi EN
- **Kanıt:** ss_66294m63s. Hızlı İşlemler'de buton `contacts.delete` (ham anahtar). Sekmeler
  Aktivite Zaman Çizelgesi/Detaylar/Notlar/Talepler TR ama son sekme "Activity" EN (mixed/duplicate).
- **Tür:** content/i18n (P2). Sistemik i18n ailesine eklenir.

## Dinamik detay rotaları — DOĞRULANDI (canonical pattern)
- `/contacts/:id` (örn `/contacts/06e65276-…`) — kişi detay, healthy (F-028 hariç).
- `/tickets/:id` (örn `/tickets/a9a078cf-…`) — talep detay (Durum/Öncelik/Atanan/SLA panel + yorum/yanıt), healthy.
- `/bot-builder/:id` (örn `/bot-builder/0e10ff28-…`) — görsel akış editörü (node paleti, drag-drop canvas,
  Test Et/Sürümler/Yayınla), healthy.
- `/settings/teams/:id` (+`?tab=`) — ekip detay (F-012).
→ Hepsi crawler'ın 60'ında YOK (F-027 kapsamına dahil). Test için canonical pattern + fixture (geçerli :id) gerekir.

## F-029 🔴 Supervisor → Monitoring IA migrasyonu (route_drift + false-green + coverage gap)
- **Kanıt:** ss_1935296ir (`/supervisor/agents` → breadcrumb "İzleme › Temsilci İzleme" = /monitoring/agents),
  ss_6792n8nju (`/supervisor/wallboard` → "İzleme › Canlı" = /monitoring/live),
  ss_14994818x (`/supervisor/interactions` → "İzleme › Canlı", final URL /monitoring/live).
- **Durum:** dev'de canlı-izleme yüzeyleri `/supervisor/{agents,calls,interactions,wallboard}` →
  yeni `/monitoring/{agents,live,ai-summary}` alanına taşınmış/redirect. Dev sidebar Süpervizör =
  {coaching, ai-rate-suggestions}; İzleme = {live, agents, ai-summary}.
- **Test etkisi:** `supervisor-agents`, `supervisor-agent-live`(/supervisor/calls), `supervisor-interactions`,
  `supervisor-wallboard` spec'leri `/supervisor/*`'a gidiyor → `/monitoring/*`'a düşüyor. İçerik benzer
  olduğundan heading-only assertion **false_green** verir; URL assertion ederse `route_drift` fail.
  `/supervisor/wallboard` known-bug'ları (WALLBOARD-*, 5 adet) + AGENTS-TZ artık `/monitoring` sayfalarında.
- **Coverage gap:** `/monitoring/{live,agents,ai-summary}` ve `/supervisor/ai-rate-suggestions` için
  DEDICATED spec YOK (Explore envanteri §5). → `new_uncovered_surface` + `route_drift`.
- **Öncelik:** P1 (kritik nav/coverage). Adaptasyon: supervisor live-monitoring POM/spec'lerini
  `/monitoring/*` kanonik rotalarına taşı; `/supervisor/ai-rate-suggestions` için yeni spec.

## RECONCILIATION — mevcut known-bugs registry ile örtüşme (DÜRÜSTLÜK NOTU)
Repoda `tests/contracts/known-bugs.js` (**55 kayıt**) zaten var. Canlı i18n/içerik bulgularımın
ÇOĞU zaten kayıtlı — bunları "yeni keşif" saymıyorum, **doğrulama/tekrar-üretim** sayıyorum:
- F-001 = **B9** + **B17** (email signature raw key/FORMATTING_ERROR)
- F-005 = **B4** ("Manage Modules"→/) + **B7** (Modules desc iki kez)
- F-018 = **B1** + **B10** + **VOICE-REGULATORY-BROKEN** (regulatory kırık)
- F-021 ≈ **REPORTS-AIKEY** + **REPORTS-INTL** (reports raw key/intl error; benimki queueReports varyantı)
- F-024 ≈ **DASH-CLICKHOUSE** + **DASH-AI-I18N** (dashboard i18n/ClickHouse)
- F-025 = **B13** (AI "ZekaTemsilciler" boşluk)
- F-026 ≈ **AGENTS-TZ** ailesi ama supervisor.voice.offline raw key ⇒ /monitoring/agents'ta (yeni konum)
- F-028 = **CONTACTS-F2** (contacts.delete raw key) + F-006 ilişkili CONTACTS-F1 (callContact)
- F-020 ≈ **B16/B18/B19** (channels social/sms/whatsapp console errors)
- F-019 ≈ **REPORTS-INTL** (intl FORMATTING_ERROR ailesi)

**Gerçekten YENİ / registry'de olmayan (asıl katma değer):**
- **F-007** (env→prod latent, P0 infra) · **F-023** (crawler false-removed) · **F-027** (discovery crawler 30+ missed)
- **F-029** (supervisor→monitoring migrasyonu + /monitoring & ai-rate-suggestions coverage yok)
- **F-017** (/voice/queues → /settings/teams redirect ⇒ voice-queues spec false-green riski)
- **F-002/F-004/F-012** (settings 6-tab IA + teams/:id) · **F-010** (users e-posta kolonu boş — registry'de yok)
- Coverage ❌: /settings/teams/:id, /tickets/:id, /contacts/{groups,companies,custom-fields},
  /campaigns/{templates,sender-ids,dnc} (registry PR-only), /monitoring/*, /supervisor/ai-rate-suggestions.

## Not — kanıt kısıtı
Chrome extension screenshot'ları diske yazmıyor; yukarıdaki ss_* id'leri konuşma
akışındaki inline görüntülerdir. Diske trace+png için Playwright crawler koşusu kullanılıyor.
