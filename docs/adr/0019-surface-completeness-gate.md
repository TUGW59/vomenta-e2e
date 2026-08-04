# ADR-0019 — Surface Completeness Motoru ve Fail-Closed Kapı (Cross-source completeness enforcement)

- **Durum:** Kabul edildi (WP-SURFACE-GATE / Faz 2)
- **Tarih:** 2026-08-04
- **Bağlam kaynağı:** VOMENTA-SURFACE-ENVANTERI handoff §2, §4.3, FAZ 2; Faz 1 (ADR-0018) kapanışı
- **İlgili:** ADR-0018 (canonical product surface registry), ADR-0012 (surface-depth), ADR-0013 (doc-drift gates PR-only), ADR-0016 (report-truth-gates)

## Bağlam

Faz 1 (ADR-0018) `PRODUCT_SURFACES`'i "üründe var olan yüzey" için kanonik ve bağımsız
kaynak yaptı; ama bu kaydı repodaki DİĞER rota kaynaklarıyla hiçbir şey ZORUNLU biçimde
uzlaştırmıyordu. Navigasyon, kapsam sözleşmeleri, spec `[route:]` marker'ları, known bug'lar,
runtime raporu, discovery raporu ve PR-impact yüzey eşlemesi kendi rota string'lerini
üretmeye devam ediyor. Bir kaynağa registry dışı bir rota girerse (veya bir kaynak canlı
üründe var olan ama registry'ye alınmamış bir yüzeyi gözlerse) bu, bir raporda sessiz bir
satır ya da hiç görünmeyen bir kayıp olarak kalabilir. Handoff'un kök-neden tezi tam da budur:
**kayıtsız yüzey matrislerden sessizce kaybolmamalı; açık eksik olmalı ve CI'ı fail-closed
durdurmalı.**

## Karar

`tools/surface-completeness-lib.mjs` adında **saf** bir completeness motoru ve
`tools/self-check-surface-completeness.mjs` adında **sert/fail-closed** bir kapı eklendi
(`quality:surface-completeness`, `quality:check` zincirine bağlı).

Motor en az **8 gözlem kaynağını** (handoff'un "≥6" eşiğinin üstünde) registry ile uzlaştırır:

| kaynak (`SOURCE_KINDS`) | rota evreni |
|---|---|
| `navigation` | `MAIN_NAVIGATION[].path` |
| `coverage-contract` | `TESTED_PAGES` **dedicated** (routeLevelBaseline OLMAYAN) rotaları |
| `coverage-baseline` | `TESTED_PAGES` routeLevelBaseline (`main-navigation`) rotaları |
| `route-marker` | spec `[route:/...]` marker evreni (`REGISTERED_ROUTE_PATHS`) |
| `known-bug` | `KNOWN_BUGS[].route` |
| `runtime` | runtime raporu `pages[].route` + `unmappedTests[].routeMarker` |
| `discovery` | discovery raporu gözlenen normalize rotalar |
| `pr-impact` | PR-impact yüzey eşlemesi (`specFile → routes`) union'ı |

Her gözlem rotası registry ile eşlenir ve sonuç dört makine-okur reason'a ayrılır:

- **`UNREGISTERED_OBSERVED`** — hiçbir yüzeye eşleşmiyor → **exit 1**.
- **`DYNAMIC_TEMPLATE_MISMATCH`** — dinamik-instance kokusu var ama hiçbir `:param`
  şablonuna uymuyor → **exit 1**.
- **`AMBIGUOUS_SURFACE_MATCH`** — birden çok yüzeye belirsiz eşleşiyor → **exit 1**.
- **`UNREFERENCED_REGISTERED`** — registry'de var, hiçbir kaynak referanslamıyor →
  `runtimePolicy`'ye göre karar (aşağı).

Hata mesajı her zaman **rota + kaynak + düzeltme yolu** taşır.

## Eşleme ve normalizasyon kuralları

- **Normalizasyon yalnız güvenli/kayıpsız:** kök dışı tek sondaki `/` kaldırılır. Query/
  fragment/origin **soyulmaz** — kaldıkları için eşleşmez ve fail-closed olarak
  `UNREGISTERED_OBSERVED` olurlar (registry rotaları bunları hiç içermez).
- **Eşleme sırası:** (1) birebir statik/redirect/dynamic-literal; (2) dinamik template.
  Template `/a/:id`, gözlem `/a/{id}` ya da `/a/123` ile eşleşir (param segmenti herhangi
  bir boş-olmayan somut/placeholder değeri kabul eder). Uydurma dönüşüm yok.
- **Belirsizlik otomatik kabul edilmez:** >1 template aday = `AMBIGUOUS_SURFACE_MATCH`.
- **`main-navigation` dedicated kapsam SAYILMAZ:** kapsam sözleşmeleri dedicated/baseline
  olarak ayrılır (`classifyCoverageContracts`); yalnız routeLevelBaseline ile "dedicated"
  iddiası `isDedicatedlyCovered` ile reddedilir.
- **`UNREFERENCED_REGISTERED` toleransı runtimePolicy'ye bağlıdır:** `readonly-baseline`
  yüzeyi hiçbir kaynakta yoksa **hata** (bir gözlem kaynağıyla bağlanmalı);
  `fixture-required` / `readonly-blocked` / `staging-only` referanssız kalabilir (kabul edilir,
  raporlanır) — bunlar zaten ön-koşul/izin nedeniyle rutin gözlemde görünmeyebilir.

## Sahte-yeşil savunması

Motor sıfır-gözlem veya sıfır-envanterle "geçti" DEMEZ:

- boş registry → reddedilir;
- hiç kaynak / sıfır gözlenen rota → reddedilir;
- 6'dan az kaynak → reddedilir (handoff §Kabul: "en az altı farklı kaynak").

## Saflık ve güvenlik

- `surface-completeness-lib.mjs` **yalnız saf fonksiyon** içerir (FS/CLI/prod yan etkisi yok).
  Böylece self-check hem GERÇEK repo ağacını hem TAMAMEN SENTETİK negatif fixture'ları
  production'a bağlanmadan doğrular.
- Negatif kanıtlar **production'a kasıtlı hata GÖNDERMEZ**; yalnız saf modele veri enjekte eder.
- Yeni artifact upload lane'i yok; secret/PII/absolute-path çıktı yok; mevcut güvenlik ve
  artifact-allowlist politikaları değişmez.

## Kapsam sınırı (bu ADR / Faz 2)

- Motor + kapı + `quality:surface-completeness` scripti + `quality:check` bağlaması + bu ADR.
- **`REGISTERED_ROUTES` kaynağı DEĞİŞMEZ** (migrasyon Faz 3). Registry içeriği DEĞİŞMEZ.
- Rapor/matris üreticileri (style / surface-depth / envanter) bu fazda motora bağlanmaz (Faz 5).
- Spec `[route:]` marker'ları için gözlem evreni `REGISTERED_ROUTE_PATHS`'tir (smoke spec her
  kayıtlı rota için `[route:${path}]` üretir); Faz 3 sonrası bu evren registry'den beslenir.

## Sonuç

Repo içindeki hiçbir rota kaynağı artık kanonik registry dışında sessizce kalamaz. Kayıtsız,
yanlış-template'e bağlı veya belirsiz her rota CI'ı fail-closed durdurur ve rota + kaynak +
düzeltme yolunu gösterir. Gerçek repo ağacında kapı yeşil (71 yüzey × 8 kaynak, 0 kayıtsız).
