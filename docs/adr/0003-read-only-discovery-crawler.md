# ADR-0003 — Salt-okunur otomatik keşif crawler'ı

## Durum

Kabul edildi — 29 Temmuz 2026.

## Bağlam

Sayfaya özgü E2E paketleri bilinen davranışları derinlemesine doğrular; ancak yeni
eklenen veya henüz `tests/contracts/tested-pages.js` kaydına alınmamış rotaları
kendiliğinden bulmaz. Canlı SaaS'a karşı çalışan genel bir crawler'ın bilinmeyen
kontrollere tıklaması ise veri mutasyonu ve müşteri verisi sızıntısı riski taşır.

Ham HAR ve ham ARIA snapshot; authorization header, request/response gövdesi veya
tenant verisi içerebilir. Bu nedenle güvenli varsayılan olamaz.

## Karar

`tests/discovery/` altında ayrı `chromium-discovery` projesinde çalışan bir BFS
ön-taraması bulunur:

- başlangıç rotaları ana navigasyon sözleşmesinden gelir;
- yalnızca aynı-origin, query/hash içermeyen güvenli `<a href>` rotaları kuyruğa alınır;
- UI kontrollerine tıklanmaz;
- GET/HEAD/OPTIONS dışındaki her istek `page.route` ile sunucuya ulaşmadan kesilir;
- console, page error, context web error, hydration, HTTP 4xx/5xx, request failure,
  WebSocket socket error ve maskelenmiş request timing envanteri toplanır;
- yatay taşma, ciddi/kritik axe bulguları, iframe/shadow-root, görünür kontrol
  envanteri ve yapısal ARIA imzası raporlanır;
- bulunan rotalar `tested-pages.js` ile karşılaştırılır;
- normalize edilmiş ARIA yapı hash'i ve maskelenmiş fetch/XHR endpoint kümesi
  commit edilen baseline ile karşılaştırılır;
- JSON ve Markdown raporlar yalnız `test-results/` altında üretilir.

Crawler **“keşif tamamlandı” iddiasında bulunmaz**. AGENTS.md'deki seçim, hover,
menü, dialog, boş/loading/error/yetkisiz, dört dil ve viewport kapanışı sayfaya
özgü keşif ve testlerle yapılır. Ön-tarama matrisi bu açıkları sessizce atlamak
yerine gerekçesiyle gösterir.

## Sert hata politikası

Genel ürün bulguları raporlanır. Aşağıdakiler koşuyu kırar:

- oturumun veya aynı-origin sınırının kaybedilmesi;
- ana document yanıtında HTTP 5xx;
- navigation'ın tamamlanamaması;
- non-GET isteğin denenmesi (istek kesilmiş olsa da güvenlik sinyalidir).

Doğrulanmış ürün kusurları daha sonra ilgili sayfaya özgü `test.fail @known-bug`
guard'ına dönüştürülür.

## Güvenlik ve mahremiyet

Ham header, cookie, request/response body, HAR ve ham ARIA snapshot kaydedilmez.
Query değerleri, e-posta, telefon, bearer token ve kimlik benzeri path parçaları
maskelenir. Kontrol adları yalnız küçük bir sabit UI eylem allowlist'inde açık
tutulur; diğerleri `<redacted-name>` olur.

Baseline yalnız fingerprint taşır. Canlı satır sayısı gürültü üretmesin diye ARIA
yapısı benzersiz, normalize edilmiş rol/hiyerarşi satırlarına indirgenir. Ağ
fingerprint'i yalnız isteğin başladığı rotaya ait fetch/XHR method + maskelenmiş
URL kümesini içerir.

## Sonuçlar

- CI dışında tekrarlanabilir bir kapsanmayan-sayfa radarı elde edilir.
- Crawler'ın yaratıcılığı sınırlıdır; duruma bağlı kontroller sayfaya özgü keşif
  gerektirir.
- Non-GET tabanlı salt-okunur API'ler de güvenlik gereği bloklanabilir; böyle bir
  uç gözlenirse allowlist eklemek yerine önce sözleşme ve mutasyon riski incelenir.
