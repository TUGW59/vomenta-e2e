# Yönetici Özeti — VOMENTA DEV Salt-Okunur Yüzey Keşfi

RUN `dev-surface-20260807-140629` · 2026-08-07 · repo `vomenta-e2e-fix-auth` @ `c125416` (origin/main ile eşit).

## A. Kesin hüküm
- **Dev erişildi mi?** Evet — `https://app.dev.vomenta.com`, girişli gerçek Chrome oturumu.
- **Rol/workspace:** "Test User", dev tenant, tr-TR, 1440–1512px viewport. (Yüksek yetkili görünüyor:
  tüm Settings/rol/audit erişimi var; kesin rol UI'da doğrulanmadı.)
- **Benzersiz route:** crawler 60 (0 sert ihlal) + canlı keşifle bulunan **30+ crawler-missed** ⇒ **~90+ erişilebilir yüzey**.
- **Tam incelenen (canlı):** ~70 yüzey (Settings 20 + Channels 7 + Voice 6 + Reports/Analytics 13 +
  Engagement 15 + Overview/Ops 11 + 4 dinamik detay). Kalan crawler-only sağlıklı.
- **Blocked/broken:** `/voice/regulatory` **tamamen bozuk** (F-018); `/channels` hub **kalıcı skeleton** (F-015).
- **Kontroller:** yüzlerce; tüm yaz/oluştur/sil/gönder/toggle/export **`not_exercised_mutation`** (salt-okunur).
- **Güvenle çalıştırılan:** tab/sekme geçişi, sidebar/breadcrumb navigasyon, salt-okunur tablo/kart
  görüntüleme, empty-state gözlemi, console/network okuma. (Filtre/pagination interaktif çalıştırma
  seçili sayfalarda; çoğunlukla observed.)
- **Screenshot kanıtı:** ~55 maskeli inline screenshot (id'ler paket dosyalarında). Playwright trace:
  discovery koşusunda üretilmedi (spec geçti → retain-on-failure). Chrome extension diske PNG yazmıyor (kısıt).
- **Kanıtlı bulgu:** 27 aktif (F-001…F-028; F-009 kanıtla çürütüldü).
- **Mevcut test eşleşmesi / yeni boşluk / false-green:** bkz. `05-coverage-gap.json` + `06-test-adaptation-plan.md`
  (test-suite envanteri ile tamamlanıyor).

## A2. Mevcut test sistemiyle uzlaştırma (DÜRÜSTLÜK)
- Repo test suite'i **beklenenden çok geniş**: settings/channels/voice/reports/workforce/ai için
  dedicated spec+POM; ayrıca **55 kayıtlık `known-bugs.js`** var.
- **Canlı i18n/içerik bulgularımın ÇOĞU zaten kayıtlı** (F-001=B9/B17, F-005=B4/B7, F-018=B1/
  VOICE-REGULATORY-BROKEN, F-021≈REPORTS-AIKEY, F-024≈DASH-*, F-025=B13, F-028=CONTACTS-F2,
  F-020≈B16/B18/B19). Bunları "yeni" saymıyorum → **doğrulama/tekrar-üretim**.
- **Gerçekten yeni katma değer (registry'de yok):** F-007 (env→prod, P0), **F-029 (supervisor→
  monitoring migrasyonu + /monitoring & ai-rate-suggestions coverage yok)**, F-017 (voice/queues→teams),
  F-023 (crawler false-removed), F-027 (discovery crawler 30+ missed), F-002/004/012 (settings IA),
  F-010 (users e-posta boş), coverage ❌ (teams/:id, tickets/:id, contacts sub, campaigns sub, /setup).

## B. Sayfa-sayfa envanter
Ayrıntı paket dosyalarında:
- `packet-01-settings.md` (20/20), `packet-02-channels-voice.md` (13), `packet-03-reports-analytics.md` (13),
  `packet-04-engagement.md` (15), `packet-05-overview-ops.md` (11) + `02-route-graph.md` (crawler 60) +
  `live-findings.md` (F-001…F-028) + `crawler-discovery-report.dev.{json,md}`.

## C. En kritik bulgular (öncelik sırası)
- **P0 — F-007:** base `.env`'in `BASE_URL=app.vomenta.com` değeri, yükleme sırası değişirse
  `TEST_ENV=dev` koşumunu sessizce PROD'a düşürebilir (repro edildi; bu koşumda tetiklenmedi).
- **P1 — F-018:** `/voice/regulatory` tamamen bozuk (tüm sayfa ham i18n + React #418/#422 + intl error);
  crawler-missed. Kullanıcıya kırık görünüyor.
- **P1 — F-015:** `/channels` hub kalıcı loading skeleton — kartlar hiç render olmuyor (false-green adayı).
- **P1 — F-027:** crawler 30+ erişilebilir yüzeyi hiç görmedi (maxPages=60 + registry eksik) → "tam keşif" iddiası geçersiz.
- **P1 — F-023:** crawler `removedRoutes` maxPages truncation'da false-positive (F-009'u tetikledi;
  `/campaigns/outbound` aslında canlı → spec'ler stale değil).
- **P1 — F-011:** ürün 6 rol (ADMIN/AGENT/MANAGER/OWNER/SUPERVISOR/VIEWER); repo 3 biliyor → rol matrisi boşluğu.
- **Sistemik i18n ailesi (P2):** F-001/F-018/F-021/F-022/F-024/F-026/F-028 — uygulama genelinde eksik
  i18n anahtarları ham render. → global "ham anahtar render edilmemeli" guard öner.
- **IA/route drift (P1–P2):** F-002 (settings 6-sekme), F-004 (settings/* nav gap), F-016/F-017
  (voice aliaslar), F-012/F-014 (tab-state/örtüşme).

## E. Blocker ve sınırlar
- **F-007** düzeltilmeden `TEST_ENV=dev` koşumları prod'a düşme riski taşır (guard gerek).
- **Rol hesapları:** yalnız "Test User" (yüksek yetki). MANAGER/OWNER/VIEWER/AGENT/SUPERVISOR için
  read-only hesap yok → rol-bazlı yüzey farkı çıkarılamadı (blocker).
- **Kanıt kısıtı:** Chrome extension diske PNG yazmıyor; discovery spec geçince trace tutulmuyor →
  sözleşmenin "her sayfa için diskte maskeli screenshot + trace" maddesi kısmen karşılanamadı
  (kanıt inline). Öneri: authed storage-state ile Playwright screenshot/trace lane'i.
- **Mutation/staging:** tüm mutation davranışları salt-okunur kapsamla "kapatıldı" sayılMADI.
- **PII:** SMS/WhatsApp/inbox/contacts/voice gerçek-benzeri telefon/e-posta/isim gösteriyor (dev demo);
  raporda maskelendi.

## F. Üretilen dosyalar
- `docs/DEV-VOMENTA-E2E-KESIF-NOTLARI.md` (ana defter)
- `artifacts/dev-surface-audit/dev-surface-20260807-140629/`:
  `00-run-metadata.json`, `01-route-inventory.json`, `02-route-graph.md`,
  `crawler-discovery-report.dev.{json,md}`, `live-findings.md`,
  `packet-0[1-5]-*.md`, `pages/01-settings-audit/page.json`, `pages/02-settings/page.json`,
  `05-coverage-gap.json`, `06-test-adaptation-plan.md`, `07-executive-summary.md` (bu dosya).

## Güvenlik uyumu
Uygulamada hiçbir kalıcı veri değiştirilmedi · `ALLOW_MUTATING_TESTS=false` korundu · tüm mutation
kontrolleri `not_exercised` · secret/şifre terminale/rapora yazılmadı (dev creds gitignored `.env.dev`'e
opak taşındı, commit'e girmedi) · PII (e-posta/telefon) rapor dosyalarında maskelendi.
Not: keşif sırasında commit/push YAPILMADI; PR yalnız kullanıcının açık `/create-pr` talebiyle bu
keşif dokümanları (docs + artifacts) için açıldı — üretim/uygulama kodu değiştirilmedi.
