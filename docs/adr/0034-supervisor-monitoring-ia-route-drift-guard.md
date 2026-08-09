# ADR-0034 — Supervisor→Monitoring IA migrasyonu (F-029): route-drift guard + dev-only yüzey kaydı

- **Durum:** Kabul edildi — 2026-08-09
- **İlgili:** ADR-0018 (surface-registry), ADR-0019 (surface-completeness gate),
  ADR-0028 (authed navigation gateway), ADR-0032 (dev yüzey keşfi; F-026/F-029),
  `tests/pages/BasePage.js`, `tests/contracts/product-surfaces.js`,
  `tests/registered-routes-smoke.authed.spec.js`.

> **Kanıt notu:** Bu ADR bir karar kaydıdır; kod/test ile birlikte merge edilir. Değişiklik
> canlı prod'a hiçbir kalıcı yazma yapmaz; yalnız read-only navigasyon + offline self-check ile
> kanıtlanır.

---

## 1. Bağlam ve problem (F-029)

Dev keşfinde (app.dev.vomenta.com, girişli in-browser gözlem, ADR-0032) yeni bir **İzleme
(Monitoring)** bilgi-mimarisi (IA) görüldü: kenar çubuğunda `İzleme = /monitoring/{live,agents,
ai-summary}` ve `Süpervizör = /supervisor/{coaching,ai-rate-suggestions}`. Dev'de eski süpervizör
rotaları (`/supervisor/{agents,wallboard,interactions}`) istemci tarafında `/monitoring/*`'a
yönleniyor; içerik hedefle **birebir aynı** ("Agent Monitor / Ajan İzleme", "Canlı Aramalar").

İki bağımsız sorun:

1. **Sistemik false-green (asıl mimari kusur).** `BasePage.open()` yalnız `page.goto(path)` +
   `shell.expectReady()` yapıyor, **final URL'i ASSERT ETMİYORDU**. Bir POM `/supervisor/agents`'a
   gidip `/monitoring/agents`'a düşse bile içerik aynı olduğundan tüm assertion'lar GEÇER → sessiz
   yanlış-yeşil. Bu tek bir sayfaya özgü değil; **hiçbir POM** route drift/redirect'i yakalayamıyordu.

2. **Kapsam boşluğu.** `/monitoring/{live,agents,ai-summary}` ve `/supervisor/ai-rate-suggestions`
   için ne POM ne spec ne de yüzey kaydı vardı.

## 2. Önce doğrula: PROD vs DEV rota gerçeği (kanıt)

CI/spec'ler PROD'a (`app.vomenta.com`) koşar; bulgu DEV'de tespit edildi. POM path'lerini taşımadan
önce **hem prod'un gerçek davranışı** kesinleştirildi. PROD, girişli, sert `page.goto`, final-URL +
h1 + HTTP durumu (2026-08-09):

| Rota | PROD sonucu |
|------|-------------|
| `/supervisor` | 200 · h1 "Supervisor" · redirect yok |
| `/supervisor/agents` | 200 · h1 "Agent Monitor" · redirect yok |
| `/supervisor/calls` | 200 · h1 "Agent Live" · redirect yok |
| `/supervisor/interactions` | 200 · h1 "Live Interactions" · redirect yok |
| `/supervisor/wallboard` | 200 · h1 "Supervisor wallboard" · redirect yok |
| `/supervisor/coaching` | 200 · h1 "Quality Coaching" · redirect yok |
| `/supervisor/ai-rate-suggestions` | **404** · h1 "Page not found" |
| `/monitoring`, `/monitoring/live`, `/monitoring/agents`, `/monitoring/ai-summary` | **hepsi 404** · "Page not found" |

DEV `app.dev.vomenta.com` bu oturumda VPN nedeniyle erişilemedi (`curl` → 000); dev IA bulgusu
ADR-0032 gözleminden devralındı.

**Sonuç:** PROD'da `/supervisor/*` HÂLÂ kanonik; Monitoring IA migrasyonu **YALNIZ dev'de**.
Dolayısıyla POM path'leri `/monitoring/*`'a **TAŞINMADI** (taşınsa prod CI 404'te kırılırdı).

## 3. Karar

### 3.1 Mimari route-drift guard (BasePage — en yüksek değer, sistemik)

`BasePage`'e geriye dönük uyumlu `expectedLandingPath` (varsayılan = `path`) + `assertLanded()`
eklendi ve `open()` sonuna bağlandı. Kabuk hazır olduktan sonra gerçek `location.pathname`,
beklenen kanonik yol ile doğrulanır: **tam eşleşme YA DA alt-yol** (`startsWith(expected + '/')`).

- `startsWith` bilinçli: belgelenmiş hub→alt-yol alias'larını (ör. `/voice` → `/voice/live`) tolere
  ederken **alanlar-arası drift'i** (ör. `/supervisor/agents` → `/monitoring/agents`) GÜRÜLTÜLÜ
  patlatır. Kök `/` muaftır (her yol `startsWith('/')`).
- **Default-ON, tüm POM'lara yayılır.** Beş süpervizör POM'u dâhil her POM artık kanonik rotaya
  inişini kanıtlar; dev'deki gibi bir migrasyon prod'a geldiğinde ilgili POM sessizce yanlış-yeşil
  olmak yerine loud fail verir. Bu, tek sayfa yaması değil **sistemik** drift-guard'dır.
- POM path'leri değiştirilmedi; süpervizör POM'ları prod'da kendi path'lerine indiği için guard
  yeşil kalır (2026-08-09 prod koşumuyla doğrulandı).

### 3.2 Dev-only yüzeylerin dürüst kaydı (prod CI'yı kırmadan)

`/monitoring`, `/monitoring/{live,agents,ai-summary}` ve `/supervisor/ai-rate-suggestions`
`PRODUCT_SURFACES`'e eklendi: `lifecycle: 'conditional'` + `runtimePolicy: 'readonly-blocked'` +
`blockedReason: 'READONLY_FEATURE_FLAG_OFF'` (prod'da 404 = özellik prod'a çıkmamış). Böylece
`registered-routes-smoke` bunları **BLOCKED baseline** (`test.fixme`) üretir: envanterde ve
matriste GÖRÜNÜR ama asla PASS olmaz ve **prod CI'yı kırmaz**. Kanıt tipi `live-observation`
(uydurma known-bug bağı EKLENMEDİ). Prod'a çıktıklarında `active` + `readonly-baseline`'e terfi.

### 3.3 Neden yeni runnable `/monitoring` spec'i EKLENMEDİ

Prod'da 404, dev'de bu oturumda erişim yok → bir `/monitoring/*` spec'i hiçbir ortamda
doğrulanamazdı ("her iddiayı kanıtla" ihlali) ve prod change-impact lane'inde 404 riski taşırdı.
ADR-0032'nin item-3 fallback'i uyarınca **blocked yüzey kaydı** kabul edilen dürüst karşılıktır.
`/monitoring/agents`'taki **F-026** (`supervisor.voice.offline` ham i18n anahtarı) negatif
assertion'ı, rota prod'a çıkıp erişilebilir olduğunda yazılacak (bkz. §4).

## 4. Sonuçlar ve kalan işler

- POM'ların hiçbiri artık redirect'i sessizce yutamaz; `assertLanded()` kanıt üretir.
- Dev IA prod'a çıkınca: (a) monitoring yüzeylerini `active`/`readonly-baseline`'e terfi ettir,
  (b) `/monitoring/{live,agents,ai-summary}` + `/supervisor/ai-rate-suggestions` için POM + read-only
  spec yaz (F-026 negatif assertion dâhil), (c) migre edilmiş süpervizör POM path'lerini gözden geçir.
- `BasePage` bir graph-module olduğundan bu PR, ADR-0024 broad-impact cap'ini tetikler: PR lane
  bounded fallback (route-baseline + authed-critical) koşar, tam authed suite nightly'ye ertelenir.
  route-baseline `/supervisor/*` erişilebilirliğini prod'da doğrulamaya devam eder.
