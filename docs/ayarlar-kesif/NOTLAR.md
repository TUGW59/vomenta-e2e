# Ayarlar (Settings) — Keşif Notları

- **Ortam:** app.vomenta.com (canlı = **production**), route `/settings` ve alt sayfaları.
- **Tarih:** 29 Tem 2026
- **Yöntem:** Kayıtlı oturumla Playwright (salt-okunur). 4 dilde ekran görüntüsü + aria-snapshot + network incelemesi. Keşif sırasında **tüm yazma istekleri (POST/PUT/PATCH/DELETE) `route.abort` ile bloklandı** — canlıya hiçbir kayıt/değişiklik bırakılmadı. Hiçbir form submit edilmedi; Save/Şifre/2FA/Revoke kontrolleri **tıklanmadı**.
- **Diller:** 🇬🇧 English · 🇹🇷 Türkçe · 🇫🇷 Français · 🇸🇦 العربية (RTL)
- **API host:** `https://api.vomenta.com`.

## Kapsam sırası (kullanıcı planı)

Ayarlar bölümü sekme sekme test edilecek. **İlk paket: Profil** (`/settings/profile`). Sonra sırasıyla `/settings` sekmeleri (Organization, Users, Billing & Usage, Security, API Keys, Modules) ve bunların açtığı alt sayfalar (`/settings/organization`, `/settings/users`, `/settings/security`, `/settings/api-keys`, `/settings/billing`, `/settings/notifications`, `/settings/billing/marketplace`).

Mutasyon kararı (kullanıcı onayı 29 Tem 2026): **salt-okunur + staging-kilitli düzenleme**. Prod'da hiçbir kaydet/değiştir tıklanmaz; geri-döndürülebilir "Telefon alanını değiştir → kaydet → doğrula → eski değere geri al" akışı yalnız staging tenant'ında (`mutationGuard`) koşan ayrı bir spec'e bırakılır. Şifre/2FA/Revoke gibi **geri-dönüşü zor / yan-etkili** kontroller test edilmez (yalnızca varlık + i18n guard'ı).

---

# 1) PROFİL sayfası (`/settings/profile`)

- **Erişim:** Header sağ üst **User menu** (avatar "TT") → **Profile**. Ayrıca doğrudan `/settings/profile` (deeplink). User menüsü öğeleri: `Profile · Settings · Log out`.
- **Başlık:** "Profile" (h1) + alt başlık "Manage your personal information".
- **4 alt sekme (Radix tablist):** Profile · Security · Sessions · Notifications.

## Sekme içerikleri (aria gözlemi)

### Profile sekmesi — "Personal Information"
Form alanları: **Avatar URL** (textbox) + **Upload image** butonu, **First name**, **Last name**, **Email** (disabled — "Email cannot be changed"), **Phone** (placeholder E.164), **Timezone** (combobox, 41 seçenek: UTC…Tokyo), **Language** (combobox, 34 seçenek), **Role** (salt-metin: "admin"). Buton: **Save changes**.
Ayrıca **Phone Configuration** bölümü: radiogroup **Browser (WebRTC)** (checked) / **External SIP Phone** + **Save phone settings** butonu.

> **NOT (veri ≠ çeviri):** Profildeki **Language** combobox'ı kullanıcının *kayıtlı tercihini* ("Turkish (Türkçe)") gösterir; bu, kenar çubuğundaki *çalışma-anı UI dili* seçicisinden bağımsızdır. UI İngilizceyken bu alanın "Turkish (Türkçe)" göstermesi **bug değil** — kayıtlı veri. Aynı şekilde First/Last name (Tuğçe/Topuz), Email, IP (10.1.99.81), Role (admin) = **veri**, çeviri guard'ına girmez.

### Security sekmesi — "Change Password"
Alanlar: **Current Password**, **New Password** (kural metni: "Must be at least 8 characters…"), **Confirm New Password**. Buton **Update Password** (boşken **disabled** — istemci-tarafı validasyon). Ayrıca "Password reset" → **Request reset email** butonu (⚠️ e-posta gönderir — TIKLANMAZ). "Two-Factor Authentication" → **Enable 2FA** butonu (⚠️ akış başlatır — TIKLANMAZ).

### Sessions sekmesi — "Active Sessions"
Uyarı: "Revoking a session will log you out immediately." Tablo kolonları: **Device · IP Address · Location · Last Active · Actions**. Her satırda **Revoke** butonu (⚠️ oturumu kapatır — TIKLANMAZ). Veri: çok sayıda "Desktop / Unknown / 10.1.99.81 / Unknown / Nm ago". "Last Active" göreli zaman ("9m ago", tr "9 dk önce").

### Notifications sekmesi
"Notification Preferences" + **Open notification settings** linki → `/settings/notifications` (ayrı sayfa, sonraki pakette).

## Backend uçları (Network ile doğrulandı, 29 Tem 2026)
```
GET  /api/v1/auth/me                 # profil verisi (ad/e-posta/telefon/dil/rol)
GET  /api/v1/auth/sessions           # Sessions sekmesi tablosu
GET  /api/v1/roles/me/permissions
# Mutasyon (INFERRED — yalnızca staging'de teyit edilecek, prod'da TIKLANMADI):
PATCH /api/v1/auth/me                # Save changes / Save phone settings
POST  /api/v1/auth/change-password   # Update Password
POST  /api/v1/auth/2fa/...           # Enable 2FA
POST  /api/v1/auth/password-reset    # Request reset email
DELETE/POST /api/v1/auth/sessions/{id}  # Revoke
```

## Kontrol envanteri + 3 katman haritası (AGENTS.md standardı)

| # | Kontrol | L1 (tıklama/tepki) | L2 (arka plan) | L3 (görev) |
|---|---|---|---|---|
| 1 | **Alt sekmeler** (Profile/Security/Sessions/Notifications) | tıkla → `aria-selected=true` | Sessions sekmesi `GET /auth/sessions` | panel o sekmenin içerik imzasını render eder (istemci-tarafı sekme → çoğu L2 N/A) |
| 2 | **Timezone combobox** | aç → 41 `option` listelenir | **N/A** (seçenekler istemcide) | seçim + Save = **mutation** (staging) |
| 3 | **Language combobox** | aç → 34 `option` listelenir | **N/A** | seçim + Save = **mutation** (staging) |
| 4 | **Save changes** | — | `PATCH /auth/me` | kalıcı → **@mutation** (staging: Telefon değiştir→kaydet→geri al) |
| 5 | **Phone Config radio** | tıkla → `checked` değişir | **N/A** (Save'e kadar istemci) | Save phone settings = **mutation** (staging) |
| 6 | **Upload image** | dosya seçici | — | **N/A** (yükleme = veri değiştirir; belgeli) |
| 7 | **Update Password** | boşken **disabled**; doldurunca aktif | `POST change-password` | ⚠️ **N/A prod** (şifre değiştirir; staging dışı test edilmez) |
| 8 | **Request reset email** | — | `POST password-reset` | ⚠️ **N/A** (e-posta yan-etkisi) |
| 9 | **Enable 2FA** | — | `POST 2fa` | ⚠️ **N/A** (hesap güvenlik akışı) |
| 10 | **Revoke** (Sessions) | — | `DELETE sessions/{id}` | ⚠️ **N/A** (oturumu kapatır) |
| 11 | **Notifications linki** | tıkla → `/settings/notifications` | (sayfa yüklemesi) | hedef sayfa yüklenir (`assertDestinationLoaded`) |
| 12 | **User menu → Profile** | menü aç → tıkla | — | `/settings/profile` yüklenir (heading "Profile") |

## 4 dilde durum (i18n) — Profil

| Öğe | 🇬🇧 en | 🇹🇷 tr | 🇫🇷 fr | 🇸🇦 ar |
|---|---|---|---|---|
| Yön | ltr | ltr | ltr | **rtl** ✓ |
| Başlık | Profile | Profil | Profil | الملف الشخصي |
| Alt başlık | Manage your personal information | Kişisel bilgilerinizi yönetin¹ | — | — |
| Sekmeler | Profile/Security/Sessions/Notifications | Profil/Güvenlik/Oturumlar/Bildirimler | Profil/Sécurité/Sessions/Notifications | الملف الشخصي/الأمان/الجلسات/الإشعارات |
| Personal Information | Personal Information | Kişisel bilgiler | Informations personnelles | المعلومات الشخصية |
| First/Last name | First name / Last name | Ad / Soyad | Prénom / Nom | الاسم الأول / اسم العائلة |
| Save changes | Save changes | Değişiklikleri kaydet | Enregistrer les modifications | حفظ التغييرات |
| Phone Config | Phone Configuration | Telefon Yapılandırması | Configuration téléphonique | إعدادات الهاتف |
| Change Password | Change Password | Şifre değiştir | Changer le mot de passe | تغيير كلمة المرور |
| Enable 2FA | Enable 2FA | 2FA'yı aç | Activer la 2FA | (المصادقة الثنائية) |
| Active Sessions | Active Sessions | Aktif oturumlar | Sessions actives | (الجلسات) |
| Sessions kolonları | Device/IP Address/Location/Last Active/Actions | Cihaz/IP adresi/Konum/Son etkinlik/İşlemler | Appareil/Adresse IP/Lieu/Dernière activité/Actions | (RTL) |
| Revoke | Revoke | Sonlandır | Révoquer | إلغاء |
| Notifications linki | Open notification settings | Bildirim ayarlarını aç | Ouvrir les paramètres de notification | فتح إعدادات الإشعارات |

¹ tr alt başlık: "Kişisel bilgilerinizi yönetin" (gözlem — ilk keşifte tam metin yakalandı).

**Çeviri sızıntısı: YOK.** Profil sayfası 4 dilde tam yerelleşiyor (ham i18n anahtarı / iç-terim sızıntısı gözlenmedi). RTL doğru aynalanıyor.

## Keşif kapanış matrisi (Profil)

- **Varsayılan/veri-dolu durum:** Kapsandı (form dolu, Sessions tablosu dolu).
- **Seçim sonrası kontroller:** N/A: Profil'de satır-seçimi/toplu-eylem yok (form + tablo salt-görüntü + satır Revoke).
- **Hover/focus kontrolleri:** N/A: gözlenmedi (statik form).
- **`...`/kebab/context menü:** N/A: Profil'de yok. (User menu = header, ayrı kapsandı.)
- **Dialog/drawer/expanded:** N/A: Profil sekmeleri inline panel; modal yok. Language/Timezone = combobox popover (kapsandı).
- **Boş/loading/hata/yetkisiz:** Loading kapsandı; hata **@errorpath** ile mock'lanacak (`GET /auth/me` 500). Yetkisiz N/A: admin oturumu (rol düşürme güvenle üretilemez).
- **Masaüstü/tablet/mobil + RTL:** Kapsandı — 768/1024/1280 **taşma yok**; Arapça RTL 1440 **taşma yok**.

**Kontrol envanteri erişilebilir isimlerle** yukarıda not edildi (role + name).

---

# 2) `/settings` (ana sekmeler) — özet (sonraki paketlerde detay)

Doğrudan `/settings` açıldığında başlık **"Settings"** + 6 Radix sekme. Her sekme paneli çoğunlukla **ilgili adanmış sayfaya götüren bir link** içerir (URL `/settings` kalır, `aria-selected` değişir):

| Sekme | Panel imzası | Link → hedef |
|---|---|---|
| Organization | "Manage your organization settings…" | Go to Organization Settings → `/settings/organization` |
| Users | "Team Members" | Invite user → `/settings/users?invite=1` (+ üye listesi) |
| Billing & Usage | "Current Plan" (Starter · $29/month) | Change plan / Billing history → `/settings/billing` |
| Security | "Security Settings" (2FA Disabled · Session 60 min · IP allowlist Disabled) | Go to Security Settings → `/settings/security` |
| API Keys | "API Keys" | Create key → `/settings/api-keys` |
| Modules | "Manage add-on modules…" | Manage Modules → `/settings/billing/marketplace` |

Bu ana sekme paketleri Profil bittikten sonra sırayla ele alınacak.

---

# 3) Ayarlar SOL ALT-MENÜSÜ (tam yol haritası)

`/settings/*` sayfalarında **soldaki ayarlar alt-menüsü** `/settings` ana sayfasındaki 6 sekmeden çok daha fazlasını içeriyor. Tam liste (href'ler canlıdan doğrulandı, 29 Tem 2026):

| # | Etiket | Rota | Durum |
|---|---|---|---|
| 1 | Profile | `/settings/profile` | ✅ **TAMAM** (settings-profile) |
| 2 | Organization | `/settings/organization` | ✅ **TAMAM** (settings-organization) |
| 3 | Users & Roles | `/settings/users` | ✅ **TAMAM** (settings-users) |
| 4 | Roles | `/settings/roles` | ✅ **TAMAM** (settings-roles) |
| 5 | Compliance | `/settings/compliance` | ✅ **TAMAM** (settings-compliance) |
| 6 | Teams | `/settings/teams` | ✅ **TAMAM** (settings-teams) |
| 7 | Business Hours | `/settings/hours` | ✅ **TAMAM** (settings-hours) |
| 8 | Automations | `/settings/automations` | ✅ **TAMAM** (settings-automations) |
| 9 | SLA Policies | `/settings/sla` | ✅ **TAMAM** (settings-sla) |
| 10 | Templates | `/settings/templates` | ✅ **TAMAM** (settings-templates) |
| 11 | Disposition Codes | `/settings/disposition-codes` | ✅ **TAMAM** (settings-disposition-codes) |
| 12 | Canned Responses | `/settings/canned-responses` | ✅ **TAMAM** (settings-canned-responses) |
| 13 | Integrations | `/settings/integrations` | ✅ **TAMAM** (settings-integrations) |
| 14 | Security | `/settings/security` | ⬜ |
| 15 | Data Retention | `/settings/data-retention` | ⬜ |
| 16 | Notifications | `/settings/notifications` | ⬜ |
| 17 | API Keys | `/settings/api-keys` | ⬜ |
| 18 | Webhooks | `/settings/webhooks` | ⬜ |
| 19 | Audit Log | `/settings/audit` | ⬜ |

Her sayfa Profil/Kuruluş ile aynı süreçten geçer: salt-okunur keşif (4 dil + taşma + çeviri) → kontrol envanteri → 3-katman + tüm stiller → güvenli/staging-kilitli mutation.

## Kuruluş sayfası detayı (`/settings/organization`)

- **Başlık:** "Organization" + alt başlık "Manage your company details and preferences". **Sekme YOK** (tek form).
- **Company Information formu:** Company name* (dolu: "Arda Company"), Domain, Website, Logo URL (+ logo önizleme), Timezone (UTC), Language (English), Currency (USD $), Default country (United States).
- **Save changes** butonu: formda değişiklik olana kadar **disabled** (istemci-tarafı dirty kontrolü) → dirty olunca aktif.
- **Backend:** `GET /api/v1/settings/organization` (yükleme) + Save = `PATCH/PUT /api/v1/settings/organization` (mutation).
- **4 dil:** başlık Organization/Kuruluş/Organisation/المؤسسة; tüm etiketler + Save tam çevrili; **sızıntı YOK**; ar RTL doğru; 768/1024/1280 taşma yok.
- **Veri ≠ çeviri:** "Arda Company", Language alanı "English" (kayıtlı tercih) = veri.
- **Mutasyon:** yalnız staging'de Website değiştir→kaydet→geri al (şirket adı/dil dokunulmaz).

## Kullanıcılar ve Roller detayı (`/settings/users`)

- **Başlık:** "Users & Roles" + alt başlık "Manage who has access to your workspace". **Sekme YOK**.
- **Araç çubuğu:** arama kutusu ("Search users…") + **Invite User** butonu.
- **Tablo (7 sütun):** seçim checkbox · Name · Email · Role · Status · Last Login · Actions. Satır başı **kebab** menüsü: **Edit / Deactivate** (⚠️ UI'da hard-delete YOK). Roller veri: Agent / Administrator / Owner.
- **Invite User dialogu:** Email address · Role (combobox: Agent) · Team (combobox: None) · **Cancel** · **Send Invitation** (boşken **disabled**) · **Close** (X).
- **Backend:** `GET /api/v1/users?page&limit` (liste) + `GET /api/v1/roles` (dialog rolleri). Davet = `POST` (staging).
- **4 dil:** başlık/alt başlık/kolonlar/Invite/dialog tam çevrili; ar RTL doğru; taşma yok.
- **🐞 BULGU (i18n/a11y sızıntısı):** Invite dialogundaki **"Close" (X) butonu** en/tr/fr/ar **hepsinde** erişilebilir isim olarak İngilizce **"Close"** kalıyor (Kapat/إغلاق/Fermer değil). `settings-users.authed.spec.js` içinde `@i18n @known-bug` `test.fail` guard'ı ile izleniyor — çeviri eklenince guard kalıcılaşır.
- **Mutasyon (davet):** UI'da satır silme yok; davet e-posta yan-etkili + kalıcı. L3 davet staging'e bırakıldı (`known-bugs-invite.mutation.authed.spec.js`, revoke ucu teyidi bekliyor). Read-only spec yalnızca dialogu AÇAR + boş-submit disabled doğrular; davet GÖNDERMEZ.

## Rol Yönetimi detayı (`/settings/roles`)

- **Başlık:** "Role Management" + alt başlık "Create and manage user roles with granular permissions". Sekme YOK.
- **Araç çubuğu:** **Create Role** butonu.
- **Tablo (6 sütun):** Name · Description · Permissions · System · Users · Actions. Roller: ADMIN (106 izin, 2 kullanıcı), AGENT (29, 4), MANAGER (74, 0), OWNER (109, 0), SUPERVISOR (60, 0), VIEWER (12, 0). "Modified" rozeti bazılarında. **System: Yes** (hepsi sistem rolü).
- **Satır aksiyonları:** **Edit role** · **Reset to defaults** (yalnız Modified) · **Delete role** (⚠️ sistem rollerinde **DISABLED** — yanlış silmeye karşı guard).
- **Create Role dialogu:** Role Name · Description · **14 izin kategorisi** (General/Voice/Channels/AI/CRM & Contacts/Tickets/Campaigns/Reports & Analytics/Supervisor/Workforce Management/Compliance/Settings/Billing/Reseller — her biri sayaçlı) · Cancel · Save · **Close**.
- **Backend:** `GET /api/v1/roles` (liste) + `GET /api/v1/roles/permissions/catalog` + create = `POST /api/v1/roles`, sil = `DELETE /api/v1/roles/{id}`.
- **@data:** UI rol satırı sayısı ↔ `GET /api/v1/roles` yanıtındaki rol sayısıyla eşleşiyor (doğrulandı). (Not: `/roles` eşleşmesi `/roles/permissions/catalog` ile karışmasın diye kesin regex `\/api\/v1\/roles(\?|$)` kullanıldı.)
- **4 dil:** başlık/alt başlık/kolonlar/Create/dialog tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU (Kullanıcılar ile AYNI sistemik sızıntı):** Create Role dialogundaki **"Close" (X) butonu** 4 dilde de İngilizce "Close" kalıyor → `@i18n @known-bug` `test.fail` guard.
- **Mutasyon (create+delete, zero-orphan):** staging'de benzersiz adlı custom rol oluştur → listede gör → sil (custom roller silinebilir; sistem rolleri Delete disabled). `settings-roles-mutations.authed.spec.js`.
- **Görsel:** N/A (tablo canlı sayaç + Create dialogu uzun/kaydırmalı → flaky; naStyles beyanı).

## Uyumluluk detayı (`/settings/compliance`)

- **Başlık:** "Compliance & Data Privacy" + alt başlık "Manage data retention, GDPR requests, and consent records". Sekme YOK; çok bölümlü pano.
- **Bölümler:** (1) **Data Retention** özet kartı (Recordings 90g · CDR 365g · Chat 365g · Auto-Cleanup No) + **Manage Retention** linki → `/settings/data-retention`; (2) **GDPR Compliance** bilgi kartı (eylem yok; contacts detay sayfasına yönlendirir); (3) **Audit Logs** tablo (Action/Entity/User/Time) + **View More** → `/settings/audit`; (4) **Consent Records** — **Log Consent** butonu + tablo (Channel/Type/Source/Date/[Revoke]); (5) **GDPR Requests** — **Create Request** butonu + tablo (Request Type/Status/Contact/Created/Actions).
- **Log Consent dialogu:** Contact ID · Channel (Email) · Type (Opt-in) · Source · Cancel · Log Consent (disabled) · Close.
- **Create GDPR Request dialogu:** Contact ID/email · Request Type (Access Article 15) · Execute Now radiogroup (Execute immediately / Submit for admin review) · Notes · Cancel · Export Data (disabled) · Close.
- **Backend:** `GET /api/v1/compliance/{consent,gdpr/requests,data-retention,audit-logs}`.
- **4 dil:** başlık/alt başlık/eylem butonları tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU (sistemik):** Her iki dialogda **"Close" (X) butonu** 4 dilde de İngilizce "Close" kalıyor (Users/Roles ile aynı) → `@i18n @known-bug`.
- **Mutasyon:** Log Consent / Create Request kalıcı uyumluluk/yasal kayıt üretir; UI'da **hard-delete YOK** (yalnız Revoke durum değiştirir) → zero-orphan temizliği yapılamadığından `settings-compliance-mutations` **test.fixme** (staging purge ucu teyidi bekliyor). Read-only spec dialogları yalnızca AÇAR + disabled doğrular.
- **Görsel:** N/A (3 canlı tablo: göreli zaman/tarih/UUID → flaky).

## Ekipler detayı (`/settings/teams`)

- **Başlık:** "Teams" + alt başlık "Organize your agents into teams for routing and management". Sekme YOK.
- **Create Team** butonu → dialog: Team name · Description · Cancel · Create (disabled) · Close.
- **Ekip kartları:** ad + "N members" (ör. Sales Team, 2 members). Kart **hover'da isimsiz ikon buton** belirir → **"Edit Team name"** dialogu açar (Team name/Description/Save; **Delete YOK**).
- **Backend:** `GET /api/v1/teams` + create `POST /api/v1/teams`.
- **4 dil:** başlık/alt başlık/Create tam çevrili (Teams/Ekipler/Équipes/الفرق; Create Team/Ekip Oluştur/Créer une équipe/إنشاء فريق); ar RTL; taşma yok.
- **🐞 BULGU (sistemik):** Create Team dialogu **"Close" (X)** 4 dilde İngilizce → `@i18n @known-bug`.
- **🐞 İÇERİK BULGUSU:** Kart ikon butonunun açtığı dialog başlığı "**Edit Team name**" ama açıklaması yanlışlıkla **create metnini** ("Add a new team to organize your agents.") gösteriyor (edit modunda create açıklaması). Düşük önem; NOTLAR'da izlenir. Ayrıca kart ikon butonu **aria-label taşımıyor** (button-name borcu).
- **Mutasyon:** Edit dialogunda **Delete YOK** → UI'da zero-orphan silme yolu bulunamadı → `settings-teams-mutations` **test.fixme** (staging silme ucu teyidi bekliyor). Read-only spec create dialogu yalnız AÇAR + disabled doğrular.

## Çalışma Saatleri detayı (`/settings/hours`)

- **Başlık:** "Business Hours" + alt başlık "Configure working hours and holidays". Sekme YOK; tek config form.
- **Bölümler:** (1) **Schedule Timezone** combobox (UTC); (2) **Weekly Schedule** — 7 gün satırı (Day/Open switch/Start/End); Pzt-Cum **checked** (09:00-17:00), Cmt/Paz kapalı (input disabled); (3) **Holiday Calendar** — Date + Holiday name + **Add** (boşken disabled) + "No holidays configured"; (4) **After Hours Mode** switch; (5) **Save changes**.
- **4 dil:** başlık/alt başlık/Save/Add tam çevrili (Business Hours/Çalışma Saatleri/Heures de travail/ساعات العمل); ar RTL; taşma yok. (Bölüm başlıkları EN'de doğrulandı; i18n testi başlık+alt başlık+Save+Add üzerinden.)
- **Mutasyon (geri-döndürülebilir, zero-orphan):** staging'de Cumartesi Open switch toggle → Save → kalıcılık doğrula → geri al. Yeni kayıt üretmez. `settings-hours-mutations.authed.spec.js`.
- **Görsel:** haftalık program tablosu kararlı (sabit 09:00-17:00) → snapshot alındı.

## Otomasyon detayı (`/settings/automations`)

- **Başlık:** "Automation Rules" + alt başlık "Automate workflows based on triggers and conditions".
- **2 sekme:** **Rules** (boş-durum "No automation rules configured" + **New Rule** butonu) · **SLA Policies** (veri dolu tablo: Policy Name/Priority/First Response/Resolution/Next Response/Channels/Active/actions — ör. "test sla, High, 15m, 240m, 5m, VOICE EMAIL").
- **New Rule dialogu:** Rule Name · Description · Trigger (combobox: On New Conversation) · Conditions (AND + Add) · Actions (Add + Add Tag combobox) · Cancel · Save Rule (disabled) · Close.
- **4 dil:** başlık/alt başlık/sekmeler/New Rule tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU (sistemik):** New Rule dialogu **"Close"** 4 dilde İngilizce → `@i18n @known-bug`.
- **Not:** SLA Policies sekmesi ayrı `/settings/sla` sayfasıyla aynı veriyi gösteriyor (görünüm-tutarlılığı ileride kontrol edilebilir).
- **Mutasyon:** kural create + satır silme; tablo prod'da boş olduğundan silme yolu doğrulanamadı → `settings-automations-mutations` **test.fixme** (staging).
- **Görsel:** Rules boş-durumu kararlı → snapshot alındı.

## SLA Politikaları detayı (`/settings/sla`)

- **Başlık:** "SLA Policies" + alt başlık "Define response and resolution time targets".
- **KPI:** Total Policies / Active Policies (sayı).
- **New Policy** butonu → dialog "New SLA Policy": Policy name · First/Resolution/Next response (spinbutton dk) · Priority (combobox) · Channel types (9 kanal toggle) · Active switch · Cancel · Create policy (disabled) · Close.
- **Tablo:** Name/First Response/Resolution/Next response (min, optional)/Priority/Channels/Active/(2 satır aksiyon ikonu — **aria-label yok**). Örnek: "test sla, 15m, 4h, 5m, HIGH, VOICE EMAIL, Inactive".
- **Backend:** `GET /api/v1/automations/sla-policies` (SLA verisi automations altında; /settings/automations SLA sekmesiyle aynı).
- **4 dil:** başlık/alt başlık/kolonlar/New Policy tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU 1 (a11y, critical):** New Policy dialogu form alanları erişilebilir **etiket taşımıyor** (axe `label`) → `@a11y @known-bug` test.fail.
- **🐞 BULGU 2 (sistemik):** dialog "Close" 4 dilde İngilizce → `@i18n @known-bug`.
- **@data:** GET /automations/sla-policies tetiklenir + politika satırı render (KPI/veri).
- **Mutasyon:** create + sil; satır aksiyon ikonları aria-label'sız → silme yolu prod'da doğrulanamadı → `settings-sla-mutations` **test.fixme** (staging).

## Şablonlar detayı (`/settings/templates`)

- **Başlık:** "Templates" + alt başlık "Manage message templates".
- **İç içe sekmeler:** ÜST tablist (Message templates / Canned Responses) · İÇ kanal tablist (Canned Responses/Email/SMS/WhatsApp) + **New Template** + tablo (Name/Preview/Language/Variables/actions; boş-durum "No templates in this category").
- **New Template dialogu:** Name · Category (combobox: Canned Responses) · Language · Content + değişken ekleme butonları (customerName/ticketNumber/agentName/companyName) · Cancel · Create (disabled) · Close.
- **ÜST "Canned Responses" sekmesi:** ayrı "Canned Responses" paneli (Title/Shortcode/Preview/Category + New canned response + boş-durum) — `/settings/canned-responses` ile örtüşür.
- **4 dil:** başlık/alt başlık/sekmeler/New Template tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU 1 (çeviri sızıntısı):** New Template içerik textarea **placeholder'ı ham i18n anahtarı** `settings.templatesPage.contentPlaceholder` gösteriyor → `@i18n @known-bug` test.fail.
- **🐞 BULGU 2 (sistemik):** dialog "Close" 4 dilde İngilizce → `@i18n @known-bug`.
- **Mutasyon:** create + sil; tablo prod'da boş → silme yolu doğrulanamadı → `settings-templates-mutations` **test.fixme**.

## Sonuç Kodları detayı (`/settings/disposition-codes`)

- **Başlık:** "Disposition Codes" + alt başlık (agent sonuç kodları). **Add Code** butonu.
- **Tablo:** Code/Label/Category/Description/Actions. 15 hazır kod (SALE, QUALIFIED_LEAD, NO_ANSWER, DO_NOT_CALL…). Satır başı 2 aksiyon ikonu (**aria-label yok** — edit/delete).
- **Add Disposition Code dialogu:** Code · Label · Category (combobox) · Description · Sort Order (spinbutton) · Positive Outcome (switch) · Default (switch) · Cancel · Create · Close.
- **Backend:** `GET /api/v1/disposition-codes?limit=50`.
- **4 dil:** başlık/alt başlık/kolonlar/Add Code tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU (sistemik):** dialog "Close" 4 dilde İngilizce → `@i18n @known-bug`.
- **Mutasyon:** create + sil; satır aksiyon ikonları aria-label'sız → silme yolu doğrulanamadı → `settings-disposition-codes-mutations` **test.fixme**.

## Hazır Yanıtlar detayı (`/settings/canned-responses`)

- **Başlık:** "Canned Responses" + alt başlık (inbox hızlı yanıt). Arama kutusu + **New canned response** butonu.
- **Tablo:** Title/Shortcode/Preview/Category/actions. Boş-durum "No canned responses yet. Create one to get started."
- **Create canned response dialogu:** Title · Shortcode · Content · Category (optional) · Cancel · Create (disabled) · Close.
- **Backend:** `GET /api/v1/chat/canned-responses`.
- **4 dil:** başlık/alt başlık/kolonlar/New tam çevrili; ar RTL; taşma yok.
- **🐞 BULGU (sistemik):** dialog "Close" 4 dilde İngilizce → `@i18n @known-bug`.
- **Not:** /settings/templates üst sekmesi de "Canned Responses" paneli gösteriyor (örtüşme).
- **Mutasyon:** create + sil; tablo prod'da boş → `settings-canned-responses-mutations` **test.fixme**.

## Entegrasyonlar detayı (`/settings/integrations`)

- **Başlık:** "Integrations" + alt başlık. Bölümler: CRM (Salesforce/HubSpot/Zoho), Helpdesk (Zendesk/Freshdesk/Jira), Communication (Slack/Teams/Zapier/Make) — her kart "Available" + **Request Access**. API Keys özeti (+**Manage API Keys** linki → /settings/api-keys). Webhook Subscriptions (**Add Webhook** + tablo URL/Events/Status/Last Delivered/Actions; boş-durum "No webhooks configured yet").
- **Request Access dialogu:** "Request <Servis> Integration" + Additional details + Cancel + Submit Request + Close.
- **Add Webhook dialogu:** URL · Secret (min 16 chars) · Events (çok sayıda checkbox: call.started…) · (+ Cancel/Add/Close).
- **Backend:** `GET /api/v1/webhooks`, `GET /api/v1/settings/api-keys`.
- **4 dil:** başlık/alt başlık/Request Access/Add Webhook tam çevrili; ar RTL; taşma yok.
- **🐞 GEÇİCİ GÖZLEM:** Keşifte API Keys özetinde ham i18n anahtarı `settings.integrationsPage.activeKeysCount` görüldü; sayı yüklenince kayboluyor (yükleme-anı flaş) → kararlı guard yazılamadı, belge olarak burada.
- **Mutasyon:** Add Webhook (create) + Request Access (Submit — talep gönderir); webhook tablosu prod'da boş → `settings-integrations-mutations` **test.fixme**.

## Ham çıktılar
`raw-en.txt` (ana sekmeler + user menu), `raw-profile.txt` (EN alt sekmeler + combobox seçenekleri + taşma), `raw-langs.txt` (tr/fr paneller), `raw-ar.txt` (Arapça RTL), `raw-tabs.txt` (4 dil sekme adları), `raw-org-en.txt` (Kuruluş EN + taşma), `raw-org-langs.txt` (Kuruluş 4 dil), `raw-subnav.txt` (ayarlar sol alt-menüsü href'leri). Ekran görüntüleri: `screenshots/`.
