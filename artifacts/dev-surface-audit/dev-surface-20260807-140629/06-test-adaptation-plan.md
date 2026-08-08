# Test Uyarlama Planı — P0/P1/P2 (kanıta dayalı)

RUN `dev-surface-20260807-140629`. Yalnız canlı kanıt + test-suite envanteri + known-bugs(55) uzlaştırması.
**Kod değişikliği YAPILMADI** — bu plan öneridir. Her madde: kanıt → mevcut spec → önerilen aksiyon.

> Önemli: Mevcut test suite BEKLENENDEN geniş (settings/channels/voice/reports/workforce/ai için
> dedicated spec+POM). i18n/içerik bulgularının çoğu zaten `known-bugs.js`'te. Bu plan **gerçek
> delta'lara** odaklanır: route drift, yeni yüzeyler, false-green riskleri, test-infra.

## P0 — yanlış yeşil / broken / infra
- **P0-1 [F-007] Env-precedence guard.** Kanıt: base `.env` `BASE_URL=app.vomenta.com` yükleme sırası
  değişirse `TEST_ENV=dev` koşumunu PROD'a düşürür (`environment.js`; repro edildi). Aksiyon:
  ortamı `TEST_ENV` registry'sinden türet; `BASE_URL` override'ını yalnız gerçek shell/CI'dan al;
  `name=dev` iken host `app.vomenta.com` ise **erken hata fırlat**. Read-only. Kabul: dev koşumu
  app.dev'e, prod koşumu app.vomenta'ya gittiğini assert eden bir self-check.
- **P0-2 [F-029] Supervisor→Monitoring route drift.** Kanıt: `/supervisor/{agents,wallboard,interactions}`
  → `/monitoring/{agents,live}`'a redirect (ss_1935296ir, ss_6792n8nju, ss_14994818x). Mevcut:
  `supervisor-agents`, `supervisor-agent-live`, `supervisor-interactions`, `supervisor-wallboard`.
  Aksiyon: bu spec/POM'ları `/monitoring/*` kanonik rotalarına taşı; final URL'i assert et (redirect'i
  yakala, heading-only geçmeyi engelle). Known WALLBOARD-*/AGENTS-TZ bug'larını /monitoring altına taşı.
- **P0-3 [F-015] `/channels` hub skeleton doğrulaması.** Kanıt: 6sn kalıcı skeleton (ss_7059wx0hr).
  Mevcut `channels-hub.authed` @data. Aksiyon: hub'ın skeleton'ın ÇÖZÜLDÜĞÜNÜ (skeleton kaybolur +
  ≥1 kanal kartı görünür) assert ettiğini doğrula; etmiyorsa ekle (false-green kapat).

## P1 — yeni yüzey / drift / erişim
- **P1-1 [F-029] `/monitoring/*` + `/supervisor/ai-rate-suggestions` yeni spec.** Kanıt: canlı healthy,
  dedicated spec yok. Aksiyon: `monitoring-live`, `monitoring-agents`, `monitoring-ai-summary`,
  `supervisor-ai-rate-suggestions` spec+POM. `/monitoring/agents` için F-026 (`supervisor.voice.offline`
  raw key) negatif assertion. Read-only (Dinle/Fısılda/Araya Gir = mutation, exercise etme).
- **P1-2 [F-017] `/voice/queues` redirect.** Kanıt: `/voice/queues` → `/settings/teams` (ss_6310pvo6p).
  Mevcut `voice-queues(+mutations)`. Aksiyon: spec'i güncelle — ya redirect'i kabul et (canonical
  /settings/teams) ya da queue yüzeyi kaldırıldıysa `voice-queues` deprecate. Final URL assert.
- **P1-3 [F-002/F-004/F-012] Settings IA.** Kanıt: 6-sekme (ss_8307qtggs), `/settings/teams/:id`
  (ss_7525am4m5). Mevcut `settings.authed`/`settings-teams`. Aksiyon: `settings.authed`'e 6-sekme
  assertion; yeni `settings-teams-detail` spec (`/settings/teams/:id`, `?tab=` fixture id).
- **P1-4 [F-010] `/settings/users` E-posta kolonu boş.** Kanıt: ss_9656pylxz (registry'de yok).
  Aksiyon: bug mu PII-gizleme mi netleştir; `settings-users-interactions`'a e-posta hücresi kontrolü
  (boşsa beklenen mi?) — false-green'i önle.
- **P1-5 Yeni yüzey spec'leri:** `/tickets/:id` (talep detay: durum/atama panel + yorum), `/contacts/
  {groups,companies,custom-fields}`. Kanıt: canlı healthy, spec yok. Read-only + fixture id.
- **P1-6 [F-011] Rol matrisi.** Kanıt: 6 rol (ss_1391qd5z6); repo 3 rol. Aksiyon: read-only rol
  hesapları (MANAGER/OWNER/VIEWER) sağlanana kadar `blocker` olarak kaydet; sağlanınca rol-bazlı
  rota-görünürlük matrisi spec'i. (Şu an hesap yok → blocked.)
- **P1-7 [F-023/F-027] Discovery crawler iyileştirme.** Kanıt: false `removedRoutes` (F-009) + 30+
  missed rota. Aksiyon: `removedRoutes` yalnız kuyruk boşalınca üret (maxPages truncation'ı ayır);
  maxPages artır; sidebar grup genişletme + dinamik :id + /monitoring,/ai,/contacts,/campaigns
  alt-rotaları registry'ye ekle. Silmeden önce canlı 404/redirect doğrula.

## P2 — içerik/i18n/a11y (çoğu zaten known-bugs; guard'a bağla)
- **P2-1 Global i18n guard.** Sistemik ham-anahtar render (F-001/018/021/022/024/026/028 =
  B1/B7/B9/B13/REPORTS-AIKEY/CONTACTS-F2/DASH-*). Aksiyon: tüm baseline rotalarda "görünür metin
  i18n-anahtar-benzeri OLMAMALI" global assertion (regex `^[a-z][a-zA-Z]+(\.[a-zA-Z]+)+$` reddi).
  Yeni bulunan varyantları (reports.queueReports, dashboard.setupStepQueue, supervisor.voice.offline,
  contacts.delete) known-bugs'a ekle veya guard'a bağla.
- **P2-2 [F-014/F-013] Yüzey örtüşmesi.** compliance↔data-retention+audit; profile-alt-sekme↔
  security+notifications; automations-SLA↔/settings/sla; templates-Hazır Yanıtlar↔canned-responses.
  Aksiyon: kanonik yüzey seç, duplicate testleri konsolide et.
- **P2-3 [F-022] `/contacts/segments` EN.** Aksiyon: i18n guard kapsamına al.
- **P2-4 [F-005/B4/B7] Settings Modüller.** "Yönet Modüller" TR + "Manage Modules"→/ (B4) + dup desc (B7).
- **P2-5 [F-020/B16/B18/B19] Channels console errors** — mevcut @known-bug guard'lar korunsun.
- **P2-6 excluded doğrulaması:** `/campaigns/{templates,sender-ids,dnc}` registry'de PR-only diyor ama
  canlı MEVCUT → registry'yi güncelle (product-surfaces.js:238 notu artık yanlış).

## Sıralama
1. P0-1 (env guard) → P0-2 (supervisor→monitoring) → P0-3 (channels hub).
2. P1-1..P1-7 (yeni monitoring/supervisor spec'leri, voice/queues, settings IA, users, tickets/:id, roller, crawler).
3. P2 (i18n guard + örtüşme + registry temizliği).

## Kabul kriterleri (genel)
- Her yeni/uyarlanan spec **final URL** assert eder (redirect'i yakalar; heading-only false-green yok).
- Read-only; mutation kontrolleri `@mutation` lane'de ve `ALLOW_MUTATING_TESTS` guard'lı kalır.
- i18n guard ham anahtar render'ı fail eder.
- Selector'lar satır-kapsamlı (F-006 "Görüntüle" ×8 gibi tekrar adlarda `.first()` yok).
