# Süpervizör → Koçluk / Quality Coaching (`/supervisor/coaching`) — Keşif Notları

> Tarih: 29 Temmuz 2026 · Ortam: canlı `app.vomenta.com` · Yöntem: kayıtlı oturumla 4 dilde inceleme + Network/DOM + OpenAPI sözleşme kontrolü + Tracing. Mutasyonsuz (değerlendirme oluşturma prod'a yazılmadı — `route` ile yakalandı).

Ekran görüntüleri: [`screenshots/`](screenshots/)

## 1. Yapı
Başlık **Quality Coaching** · Alt başlık *Evaluate interactions and provide coaching feedback*.
İstatistik döşemeleri: Total Evaluations, Avg Score, AI Evaluations, Manual Evaluations.
Sekmeler: **Evaluated** / **Pending Review**. Tablo kolonları: Agent, Type, Score, Evaluator, Date, Actions.
Kontroller: **arama** ("Search by agent...") + **New Evaluation** butonu + sayfalama. Boş durum: **"No evaluations found"**.
Backend: `GET /api/v1/supervisor/coaching/evaluations?page=&limit=` (+ agents, interactions).
NOT: Sayfa `<main>` kullanmıyor (içerik `body`'den okunur); saat/timestamp yok → timezone N/A.

## 2. 4 Dil — SAĞLAM ✅
| Öğe | en | tr | fr | ar |
|---|---|---|---|---|
| dir | ltr | ltr | ltr | **rtl** ✅ |
| Başlık | Quality Coaching | Kalite koçluğu | Coaching qualité | التدريب على الجودة |
| Alt başlık | Evaluate interactions… | Etkileşimleri değerlendirin… | Évaluez les interactions… | (—) |
| Sekmeler | Evaluated / Pending Review | Değerlendirilenler / Bekleyen inceleme | Évaluées / En attente | تم التقييم / قيد المراجعة |
| Kolonlar | Agent/Type/Score/Evaluator/Date/Actions | Temsilci/Tür/Puan/Değerlendiren/Tarih/İşlemler | Agent/Type/Score/Évaluateur/Date/Actions | الوكيل/النوع/الدرجة/المقيّم/التاريخ/إجراءات |
| İstatistikler | Total/Avg Score/AI/Manual Evaluations | Toplam/Ortalama puan/Yapay zeka/Manuel değerlendirmeler | Total/Score moyen/Évaluations IA/manuelles | (çevrili) |
| New Evaluation | New Evaluation | Yeni değerlendirme | Nouvelle évaluation | تقييم جديد |
| Boş durum | No evaluations found | (doğrulanmadı) | (doğrulanmadı) | لا توجد تقييمات |

Görünür metin (sekme/kolon/istatistik/New Evaluation) 4 dilde çevrili; **Arapça RTL doğru**. Çeviri sızıntısı yok.

## 3. Kontrollerin 3 Katmanlı Durumu
| Kontrol | L1 | L2 | L3 |
|---|---|---|---|
| **Sekmeler** (Evaluated/Pending) | ✅ aria-selected | ⚠ boş veride sunucu isteği yok (istemci süzme) → N/A | N/A (boş veri) |
| **Arama** | ✅ yazılabiliyor | ⚠ N/A (boş veri) | N/A |
| **New Evaluation** (diyalog) | ✅ form alanlarıyla açılıyor | — | — |
| **Kriter puanlama** | ✅ | — | ✅ yıldızlar Overall Score'u yükseltiyor (0% → 40%) |
| **Değerlendirme oluştur (POST)** | ✅ | ✅ dolu form doğru DTO ile `POST /coaching/evaluations` (route ile yakalandı, prod'a yazılmadı) | ⚠ kalıcı kayıt → staging mutasyon (fixme) |

**Create sözleşme doğrulaması (OpenAPI):** `CreateCoachingEvaluationDto` zorunlu alanlar = `interactionId, interactionType, agentId, scorePercent, formData`. Formu tam doldurunca gönderilen payload birebir uyuyor:
`{interactionId, interactionType:"CALL", agentId, scorePercent:40, formData:{criteria:[5 kriter/skor], coachingRecommendations, status:"COMPLETED"}, feedback}` → frontend create akışı **doğru kurulu**.

## 4. Gözlemler (kesin bug değil — kanıtlanamadı)
- **"Interaction" alanı serbest metin "Enter interaction ID"** (dropdown/arama yok) — süpervizör ham etkileşim ID'sini elle yazmalı; hataya açık UX.
- **"Submit Evaluation" boş/eksik formda AKTİF görünüyor**; eksik alanla tıklandığında istek gitmiyor. Net bir doğrulama-mesajı davranışı **kesin gözlemlenemedi** (dialogdaki "Select an agent" placeholder'ı tespit regex'ini kirletti) → bilinçli olarak `test.fail` yazılmadı; ileride net tekrar-üretimle ele alınabilir.
- Bunların dışında **kırık davranış / çeviri sızıntısı / timezone sorunu yok.**

## Test karşılığı
`tests/supervisor/supervisor-coaching.authed.spec.js` (+ `tests/pages/CoachingPage.js`, `app.coaching`).
Yapı @smoke/@critical + 4 dil guard'ları @regression + sekme/arama L1 + New Evaluation L1 + kriter-skorlama L3 + create-contract L2 (route ile, mutasyonsuz) + kalıcı-kayıt staging-fixme. **13/13 yeşil** (chromium-authed).
