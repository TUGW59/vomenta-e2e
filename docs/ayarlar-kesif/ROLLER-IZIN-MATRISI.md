# Roller — İzin Matrisi (Rol × Permission)

- **Kaynak:** `app.vomenta.com/settings/roles` (canlı = **production**), her rol için **Düzenle (Edit role) → Permissions** akordeonları tek tek açılarak.
- **Tarih:** 5 Ağu 2026 · **Yöntem:** kayıtlı oturum (in-app browser), salt-okunur. Hiçbir checkbox değiştirilmedi, hiçbir **Save** tıklanmadı; yalnızca akordeonlar açılıp izin durumları okundu.
- **UI dili:** English (izin görünen adları İngilizce; anahtarlar `dot.notation`).
- **Amaç:** rol-bazlı yetki (RBAC) testlerinin referansı. Toplam **113 izin**, **14 kategori**, **6 sistem rolü**.

> Bu dosya, `NOTLAR.md`'deki "Rol Yönetimi detayı (`/settings/roles`)" bölümünün derinleştirilmiş halidir. Oradaki tablo/i18n/mutation notları geçerli; buradaki katkı **rol × izin matrisi**dir.

---

## 0) Rol listesi (tablo görünümü)

| Rol | İzin sayısı | System | Kullanıcı | "Modified" rozeti | Reset to defaults | Delete |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| OWNER | 109 | Yes | 0 | ✅ | ✅ (görünür) | ⛔ disabled |
| ADMIN | 106 | Yes | 2 | ✅ | ✅ | ⛔ disabled |
| MANAGER | 74 | Yes | 0 | ✅ | ✅ | ⛔ disabled |
| SUPERVISOR | 60 | Yes | 0 | ✅ | ✅ | ⛔ disabled |
| AGENT | 29 | Yes | 4 | — | — | ⛔ disabled |
| VIEWER | 12 | Yes | 0 | — | — | ⛔ disabled |

- **Hepsi sistem rolü** (`System = Yes`) → **Delete disabled**, isim düzenlenemez ("System role names are fixed. Only permissions and description are editable.").
- **"Modified" rozeti** yalnızca varsayılandan farklılaştırılmış rollerde (OWNER/ADMIN/MANAGER/SUPERVISOR). Rozet varsa satırda **"Reset to defaults"** aksiyonu da çıkıyor; AGENT/VIEWER'da yok.
- Edit dialogunda üstte uyarı: **"System role permissions cannot be modified."** — yani sistem rollerinde checkbox'lar salt-görüntü (test: değiştir-butonu etkisiz / Save yok-sayılır beklenir).

---

## 1) Kategori bazında özet (kaç / toplam)

| Kategori | Toplam | OWNER | ADMIN | MANAGER | SUPERVISOR | AGENT | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| General | 2 | 2 | 2 | 2 | 2 | 2 | 1 |
| Voice | 19 | 19 | 19 | 10 | 10 | 8 | 1 |
| Channels | 9 | 9 | 9 | 8 | 7 | 6 | 1 |
| AI | 9 | 9 | 9 | 4 | 3 | 3 | 0 |
| CRM & Contacts | 14 | 14 | 14 | 11 | 9 | 4 | 1 |
| Tickets | 6 | 6 | 6 | 3 | 3 | 2 | 1 |
| Campaigns | 7 | 7 | 7 | 7 | 2 | 1 | 1 |
| Reports & Analytics | 6 | 6 | 6 | 6 | 6 | 1 | 4 |
| Supervisor | 7 | 6 | 6 | 4 | 6 | 0 | 1 |
| Workforce Management | 5 | 5 | 5 | 5 | 5 | 0 | 0 |
| Compliance | 4 | 4 | 4 | 1 | 0 | 0 | 0 |
| Settings | 19 | 19 | 19 | 13 | 7 | 2 | 1 |
| Billing | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Reseller | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| **TOPLAM** | **113** | **109** | **106** | **74** | **60** | **29** | **12** |

---

## 2) Tam matris (izin bazında)

Sütun sırası izin sayısına göre azalan: OWNER ⊇ ADMIN ⊇ … · ✅ = izin var, `·` = yok.

<!-- MATRIX_START (docs/ayarlar-kesif/tools ile üretildi; elle düzenleme drift yaratır) -->
| Kategori | İzin (görünen ad) | Anahtar | OWNER | ADMIN | MANAGER | SUPERVISOR | AGENT | VIEWER |
|---|---|---|:--:|:--:|:--:|:--:|:--:|:--:|
| **General** | View dashboard | `dashboard.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | View inbox | `inbox.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| **Voice** | View voice section | `voice.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | View calls | `voice.calls.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Place outbound calls | `voice.calls.outbound` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Control active calls | `voice.calls.control` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | View queues | `voice.queues.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage queues | `voice.queues.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | View IVR flows | `voice.ivr.view` | ✅ | ✅ | · | · | · | · |
|  | Manage IVR flows | `voice.ivr.manage` | ✅ | ✅ | · | · | · | · |
|  | View phone numbers | `voice.dids.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage phone numbers | `voice.dids.manage` | ✅ | ✅ | · | · | · | · |
|  | View call recordings | `voice.recordings.view` | ✅ | ✅ | · | · | · | · |
|  | List call recordings | `voice.recordings.list` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | Play call recordings (masked) | `voice.recordings.play.masked` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Play call recordings (unmasked) | `voice.recordings.play.unmasked` | ✅ | ✅ | · | · | · | · |
|  | Download call recordings | `voice.recordings.download` | ✅ | ✅ | · | · | · | · |
|  | Manage call recordings | `voice.recordings.manage` | ✅ | ✅ | · | · | · | · |
|  | View voicemails | `voice.voicemails.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage voicemails | `voice.voicemails.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage SIP trunks | `voice.sipTrunks.manage` | ✅ | ✅ | · | · | · | · |
| **Channels** | View channels | `channels.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage channel configuration | `channels.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | View message templates | `channels.templates.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | Send SMS | `channels.sms.send` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Send email | `channels.email.send` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Send WhatsApp | `channels.whatsapp.send` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage social channels | `channels.social.manage` | ✅ | ✅ | · | · | · | · |
|  | Use video | `channels.video.use` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage message templates | `channels.templates.manage` | ✅ | ✅ | ✅ | · | · | · |
| **AI** | View AI features | `ai.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Use AI copilot | `ai.copilot.use` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage AI chatbot | `ai.chatbot.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage Voice AI | `ai.voice.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage prompt templates | `ai.prompts.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage AI providers | `ai.providers.manage` | ✅ | ✅ | · | · | · | · |
|  | View knowledge base | `ai.knowledgeBase.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage knowledge base | `ai.knowledgeBase.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage bot builder | `ai.botBuilder.manage` | ✅ | ✅ | · | · | · | · |
| **CRM & Contacts** | View contacts | `contacts.view` | ✅ | ✅ | · | · | · | · |
|  | View own contacts | `contacts.view.own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | View team contacts | `contacts.view.team` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | View all contacts | `contacts.view.all` | ✅ | ✅ | · | · | · | · |
|  | Manage contacts | `contacts.manage` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Import contacts | `contacts.import` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Delete contacts | `contacts.delete` | ✅ | ✅ | · | · | · | · |
|  | Manage custom fields | `contacts.customFields.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage segments | `contacts.segments.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage contact groups | `contacts.groups.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | View customer-shared documents | `contacts.documents.view` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage customer-shared documents | `contacts.documents.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Delete customer-shared documents | `contacts.documents.delete` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage companies | `companies.manage` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| **Tickets** | View tickets | `tickets.view` | ✅ | ✅ | · | · | · | · |
|  | View own tickets | `tickets.view.own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | View team tickets | `tickets.view.team` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | View all tickets | `tickets.view.all` | ✅ | ✅ | · | · | · | · |
|  | Manage tickets | `tickets.manage` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Delete tickets | `tickets.delete` | ✅ | ✅ | · | · | · | · |
| **Campaigns** | View campaigns | `campaigns.view` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage campaigns | `campaigns.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Start / pause campaigns | `campaigns.start` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage Do-Not-Call list | `campaigns.dnc.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | View sender IDs | `campaigns.senderIds.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | Manage sender IDs | `campaigns.senderIds.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage disposition codes | `campaigns.dispositionCodes.manage` | ✅ | ✅ | ✅ | · | · | · |
| **Reports & Analytics** | View own reports | `reports.view.own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | View team reports | `reports.view.team` | ✅ | ✅ | ✅ | ✅ | · | ✅ |
|  | View all reports | `reports.view.all` | ✅ | ✅ | ✅ | ✅ | · | ✅ |
|  | Export reports | `reports.export` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage dashboards | `reports.dashboards.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | View advanced analytics | `analytics.view` | ✅ | ✅ | ✅ | ✅ | · | ✅ |
| **Supervisor** | View supervisor dashboard | `supervisor.view` | ✅ | ✅ | ✅ | ✅ | · | ✅ |
|  | Listen to live calls | `supervisor.monitor.listen` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Whisper to agent | `supervisor.monitor.whisper` | ✅ | ✅ | · | ✅ | · | · |
|  | Barge / take over call | `supervisor.monitor.barge` | ✅ | ✅ | · | ✅ | · | · |
|  | Manage coaching evaluations | `supervisor.coaching.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage wallboard | `supervisor.wallboard.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage agents (live) | `supervisor.agents.manage` | · | · | · | · | · | · |
| **Workforce Management** | View workforce | `wfm.view` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage schedules | `wfm.schedules.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage time-off | `wfm.timeOff.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage WFM evaluations | `wfm.evaluations.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage gamification | `wfm.gamification.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
| **Compliance** | View compliance | `compliance.view` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage compliance | `compliance.manage` | ✅ | ✅ | · | · | · | · |
|  | View audit logs | `compliance.audit.view` | ✅ | ✅ | · | · | · | · |
|  | Manage data retention | `compliance.dataRetention.manage` | ✅ | ✅ | · | · | · | · |
| **Settings** | Manage own profile | `settings.profile.manage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  | View organization | `settings.organization.view` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage organization | `settings.organization.manage` | ✅ | ✅ | · | · | · | · |
|  | View users | `settings.users.view` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage users | `settings.users.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage roles | `settings.roles.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage teams | `settings.teams.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | View security | `settings.security.view` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage security | `settings.security.manage` | ✅ | ✅ | · | · | · | · |
|  | View business hours | `settings.businessHours.view` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage business hours | `settings.businessHours.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage notifications | `settings.notifications.manage` | ✅ | ✅ | ✅ | ✅ | ✅ | · |
|  | Manage integrations | `settings.integrations.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage webhooks | `settings.webhooks.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage API keys | `settings.apiKeys.manage` | ✅ | ✅ | · | · | · | · |
|  | Manage response templates | `settings.templates.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage canned responses | `settings.cannedResponses.manage` | ✅ | ✅ | ✅ | ✅ | · | · |
|  | Manage SLA policies | `settings.sla.manage` | ✅ | ✅ | ✅ | · | · | · |
|  | Manage automations | `settings.automations.manage` | ✅ | ✅ | ✅ | · | · | · |
| **Billing** | View billing | `billing.view` | ✅ | · | · | · | · | · |
|  | Manage billing | `billing.manage` | ✅ | · | · | · | · | · |
|  | Manage modules | `billing.modules.manage` | ✅ | · | · | · | · | · |
| **Reseller** | Access reseller portal | `reseller.access` | · | · | · | · | · | · |
|  | Manage reseller tenants | `reseller.tenants.manage` | · | · | · | · | · | · |
|  | View reseller billing | `reseller.billing.view` | · | · | · | · | · | · |
<!-- MATRIX_END -->

---

## 3) Test için önemli gözlemler (dikkat çeken davranışlar)

1. **`supervisor.agents.manage` HİÇBİR rolde açık değil** (OWNER/ADMIN dahil, "Manage agents (live)"). Supervisor kategorisi bu yüzden en fazla 6/7 gösteriyor. → Ya rezerve/gelecek izin, ya da ölü tanım. **Test:** hiçbir sistem rolünün bu izne sahip olmadığını doğrula (regression guard).
2. **Reseller kategorisinin tamamı (3 izin) hiçbir rolde yok.** Reseller portalı bu tenant'ta hiçbir sistem rolüne verilmemiş. **Test:** `reseller.*` → tüm roller `·`.
3. **Billing yalnızca OWNER'da.** ADMIN dahil kimsede Billing yok — bu, `NOTLAR.md`'deki "hesap izinleri `settings.billing.*` içermiyor" bulgusuyla tutarlı. **Test:** `billing.*` → sadece OWNER ✅.
4. **OWNER = ADMIN + Billing(3).** İkisi de `supervisor.agents.manage` ve tüm Reseller hariç her şeye sahip; tek fark OWNER'ın 3 Billing izni. (109 = 106 + 3.)
5. **Roller katı bir merdiven DEĞİL** — MANAGER ⊉ SUPERVISOR:
   - SUPERVISOR'da olup MANAGER'da olmayan: `supervisor.monitor.whisper`, `supervisor.monitor.barge` (canlı çağrı fısıltı/araya girme).
   - MANAGER'da olup SUPERVISOR'da olmayan: `campaigns.manage/start/dnc/senderIds.manage/dispositionCodes.manage`, `contacts.view/all/delete/customFields`, `settings.users.manage/teams/templates/sla/automations/businessHours.manage`, `compliance.view`, `channels.templates.manage`, `ai.knowledgeBase.manage` vb.
   - → MANAGER "yönetim/yapılandırma" ağırlıklı, SUPERVISOR "canlı izleme/koçluk" ağırlıklı. Ayrı test senaryoları gerekir.
6. **VIEWER > AGENT (rapor görünürlüğünde):** VIEWER'da `reports.view.team`, `reports.view.all`, `analytics.view`, `supervisor.view` var; AGENT'ta **yok**. Ama AGENT operasyonel (arama yap, mesaj gönder, ticket/contact yönet). → "az izin = alt küme" varsayma; VIEWER salt-okur-raporcu, AGENT operasyonel.
7. **Herkeste ortak 6 izin (en düşük ortak payda, VIEWER'ın çekirdeği):** `dashboard.view`, `voice.recordings.list`, `channels.templates.view`, `contacts.view.own`, `tickets.view.own`, `campaigns.senderIds.view`, `reports.view.own`, `settings.profile.manage`. (VIEWER'ın 12'sinin çoğu = tüm rollerde ortak.)
8. **`.view/.own/.team/.all` kırılımı** kişiler, ticket, rapor kategorilerinde tutarlı: rol yükseldikçe `own → team → all` genişliyor. RBAC testinde bu kademe önemli (örn. AGENT sadece `own`, MANAGER `team`, ADMIN/OWNER `all`).

---

## 4) Backend uçları (RBAC testinde kullanılacak — `NOTLAR.md` ile aynı)

```
GET  /api/v1/roles                         # rol listesi (satır sayısı, izin sayısı)
GET  /api/v1/roles/permissions/catalog     # 113 izinlik katalog (kategori+anahtar+ad)
GET  /api/v1/roles/me/permissions          # oturumdaki kullanıcının efektif izinleri
# Mutasyon (custom rol — yalnız STAGING; prod'da salt-okunur):
POST   /api/v1/roles                        # Create Role
DELETE /api/v1/roles/{id}                   # custom rol sil (sistem rolleri Delete disabled)
```

## 5) Test kancaları (öneri — rol-bazlı RBAC paketleri)

- **@data / katalog bütünlüğü:** `GET /roles/permissions/catalog` → 113 izin & 14 kategori; UI akordeon sayaçları ile eşleşmeli (bu dosyadaki §1 tablosu beklenen değer).
- **@data / rol sayaçları:** `GET /roles` yanıtındaki her rolün `permissions.length` → OWNER 109 · ADMIN 106 · MANAGER 74 · SUPERVISOR 60 · AGENT 29 · VIEWER 12 (§0).
- **UI ↔ API tutarlılığı:** Edit dialogda seçili checkbox sayısı = API rol izin sayısı; her kategori "x/y" rozeti = §1'deki değerler.
- **Sistem rolü guard'ı:** sistem rollerinde Save etkisiz + Delete disabled + isim salt-okunur; "System role permissions cannot be modified." uyarısı görünür.
- **Negatif erişim (efektif izin):** düşük yetkili rolde (AGENT/VIEWER) yalnız izinli sol-menü/aksiyonların render edilmesi — örn. AGENT'ta Supervisor/Workforce/Compliance/Billing menüleri **görünmemeli** (§2 tabloya göre 0 izin). NOT: bunun için ayrı düşük-yetkili test hesapları gerekir (`.env.example` → `VOMENTA_AGENT_EMAIL` vb. yer tutucular; henüz tanımlı değil).
- **Regression guard'ları:** `supervisor.agents.manage` tüm rollerde kapalı; tüm `reseller.*` kapalı; `billing.*` yalnız OWNER (§3).

> **Üretim:** §1 ve §2 tabloları `docs/ayarlar-kesif/tools/` altındaki üreticiden çıkar (elle düzenleme drift yaratır). Kaynak veri canlıdan checkbox-durumu okunarak toplandı; sayımlar UI ile birebir doğrulandı (109/106/74/60/29/12).
