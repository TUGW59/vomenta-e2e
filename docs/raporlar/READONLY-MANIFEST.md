# Production Read-only Test Manifesti

> ÜRETİLMİŞ DOSYA — elle düzenlemeyin. Kaynak: `npm run report:readonly-manifest` (ADR-0015). Sayılar repo kaynaklarından deterministik türetilir.

## Özet sayılar

| Ölçüt | Değer |
|---|---:|
| Toplam spec | 135 |
| Production-safe (read-only) | 99 |
| Mutation (staging-only, dışlandı) | 36 |
| External-cost (dışlandı) | 0 |

`listed != selected != executed`: bu manifest yalnız spec DOSYASI seçer; 
çalıştırılan/geçen test sayısı runtime raporunun işidir (FAZ 2+).

## Profiller (production seçimi)

| Profil | Projeler | grep | Seçilen spec | Policy-gated |
|---|---|---|---:|:---:|
| `route-baseline-chromium` | chromium-authed | `@route-baseline` | 1 | hayır |
| `readonly-critical-chromium` | chromium-authed | `@critical` | 97 | hayır |
| `readonly-full-chromium` | chromium-authed | — | 97 | hayır |
| `known-bug-readonly-chromium` | chromium-authed | `@known-bug` | 97 | hayır |
| `readonly-cross-browser` | firefox-authed, webkit-authed | — | 97 | hayır |
| `a11y-readonly` | chromium-authed | `@a11y` | 97 | hayır |
| `visual-readonly` | chromium-authed | `@visual` | 97 | evet |

## Effect dağılımı

| effect | spec |
|---|---:|
| mutation | 36 |
| read-only | 99 |

## Staging-only dışlanan spec'ler

| spec | effect | gerekçe |
|---|---|---|
| `tests/campaigns-outbound.mutation.authed.spec.js` | mutation | N/A: SCHEDULED kampanya için staging DELETE/orphan sayacı kanıtlanmadı; spec fixme. |
| `tests/channels-email-mutations.authed.spec.js` | mutation | N/A: e-posta hesabı ekleme gerçek IMAP/SMTP + silme ucu staging'de kanıtlanmadı; spec fixme. |
| `tests/channels-sms-mutations.authed.spec.js` | mutation | N/A: gönderici kimliği POST /sender-ids + silme ucu staging'de kanıtlanmadı; spec fixme. |
| `tests/channels-social-mutations.authed.spec.js` | mutation | N/A: Connect harici OAuth akışı otomatikleşemez; bağlama/kaldırma ucu staging'de kanıtlanmadı; spec fixme. |
| `tests/channels-video-mutations.authed.spec.js` | mutation | N/A: video config Save kalıcılık/geri-alma (PUT /channels/video/config) staging'de kanıtlanmadı; spec fixme. |
| `tests/channels-webchat-mutations.authed.spec.js` | mutation | N/A: widget config Save kalıcılık/geri-alma (PUT /channels/webchat/config) staging'de kanıtlanmadı; spec fixme. |
| `tests/channels-whatsapp-mutations.authed.spec.js` | mutation | N/A: WABA "Not Configured"; şablon POST/DELETE templates/whatsapp bağlı tenant'ta kanıtlanmadı; spec fixme. |
| `tests/contacts-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/known-bugs-invite.mutation.authed.spec.js` | mutation | N/A: davet revoke endpointi ve prefix sayacı staging üzerinde kanıtlanmadı; spec fixme. |
| `tests/reports-dashboards-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/reports-schedule-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/settings-api-keys-mutations.authed.spec.js` | mutation | N/A: anahtar create+revoke (liste prod'da boş) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-automations-mutations.authed.spec.js` | mutation | N/A: kural create+delete (tablo prod'da boş) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-canned-responses-mutations.authed.spec.js` | mutation | N/A: hazır yanıt create+delete (tablo prod'da boş) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-compliance-mutations.authed.spec.js` | mutation | N/A: consent/GDPR kaydı UI'da hard-delete sunmuyor; purge ucu staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-data-retention-mutations.authed.spec.js` | mutation | N/A: reversible spinbutton düzenle+Save staging'de kanıtlanmadı (Run cleanup asla); spec fixme. |
| `tests/settings-disposition-codes-mutations.authed.spec.js` | mutation | N/A: kod satır silme (aksiyon ikonları aria-label'sız) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-hours-mutations.authed.spec.js` | mutation | N/A: haftalık program Save kalıcılık/switch geri-alma staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-integrations-mutations.authed.spec.js` | mutation | N/A: webhook create+delete (tablo prod'da boş) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-notifications-mutations.authed.spec.js` | mutation | N/A: kategori switch toggle+Save preferences staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-organization-mutations.authed.spec.js` | mutation | N/A: website PATCH/PUT kalıcılık/geri-alma staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-profile-mutations.authed.spec.js` | mutation | N/A: telefon PATCH kalıcılık/geri-alma staging tenant'ında kanıtlanmadı; spec fixme. |
| `tests/settings-roles-mutations.authed.spec.js` | mutation | N/A: custom rol create+delete ve orphan sayacı staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-security-mutations.authed.spec.js` | mutation | N/A: hassas policy switch toggle+Save staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-sla-mutations.authed.spec.js` | mutation | N/A: SLA politikası satır silme (aksiyon ikonları aria-label'sız) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-teams-mutations.authed.spec.js` | mutation | N/A: ekip silme yolu (Edit dialogunda Delete yok) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-templates-mutations.authed.spec.js` | mutation | N/A: şablon create+delete (tablo prod'da boş) staging'de kanıtlanmadı; spec fixme. |
| `tests/settings-webhooks-mutations.authed.spec.js` | mutation | N/A: webhook create+delete (liste prod'da boş) staging'de kanıtlanmadı; spec fixme. |
| `tests/voice-call.mutation.authed.spec.js` | mutation | N/A: çağrı/SMS dışa dönük ve kalıcı kullanıcı-adlı entity değil; güvenli sonuç/teardown yolu kanıtlanana kadar testler fixme. |
| `tests/voice-dids-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/voice-ivr-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/voice-queues-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/workforce-badges-mutations.authed.spec.js` | mutation | N/A: rozet UI'da yalnız oluşturulur; düzenle/sil yok (WORKFORCE-BADGES-NO-EDIT-DELETE) → güvenli 0→1→0 teardown UI'dan kapatılamaz; spec fixme. |
| `tests/workforce-evaluations-mutations.authed.spec.js` | mutation | N/A: manuel değerlendirme gerçek etkileşim ID + temsilci gerektirir; tablo prod'da boş, silme yolu gözlemlenemedi → güvenli teardown kanıtlanmadı; spec fixme. |
| `tests/workforce-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |
| `tests/workforce-surveys-mutations.authed.spec.js` | mutation | MUTATION_FILENAME_CONVENTION: veri değiştirir → production seçiminden çıkarıldı (staging-only + @mutation grepInvert). |

