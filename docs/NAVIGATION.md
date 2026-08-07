# Navigasyon & bilgi mimarisi (IA) değişimlerine adaptasyon

Dev'de sol panel yeniden düzenleniyor: çoğu sayfa yer değiştiriyor ve panel öğe
sayısı azaltılıyor (bazı sayfalar açılır grupların altına alınıyor). Bu doküman,
test paketinin bu değişime **neden büyük ölçüde dayanıklı** olduğunu ve değişince
**tam olarak nerelerin** güncelleneceğini anlatır. Hedef: **sayfa taşınsa, panel
sadeleşse ya da yeni sayfa eklense bile düzen bozulmasın.**

## Neden dayanıklı: rota kimliktir, konum değildir

En önemli tasarım kararı: testler sayfalara **rota (URL) ile** ulaşır, sidebar
tıklama-yolu ile değil. `BasePage.open()` → `page.goto(this.path)`. Bir sayfa üst
düzeyden bir grubun altına taşınsa da `/contacts` rotası aynı kalır → o sayfanın
tüm testleri **hiç değişmeden** çalışmaya devam eder.

Kırılgan olan tek şey, sidebar'ın **yapısını** bizzat doğrulayan testlerdir
(aşağıdaki 4 nokta). Onlar da tek kaynaktan beslenir.

## Tek kaynak: kanonik yüzey registry'si

Navigasyon gerçeği tek yerde: `tests/contracts/product-surfaces.js` (`PRODUCT_SURFACES`).
Her yüzeyde konum/hiyerarşi ayrı alanlardadır:

- `route` — kalıcı kimlik (değişmeden kaldıkça testler etkilenmez).
- `navigation` — `main` (üst düzey sidebar) · `secondary` (alt-menü/alt-rota) ·
  `contextual` (sayfa içi eylemle açılır) · `hidden`.
- `parentId` / `area` — hiyerarşi ve gruplama.

Bundan türetilenler (elle liste tutulmaz):
- `MAIN_NAVIGATION` (navigation.js) — üst düzey sidebar; **fail-closed** kapı registry
  `navigation:'main'` ile birebir eşleşmeyi import anında zorlar.
- `SIDEBAR_TREE` / `buildSidebarTree()` — üst öğeler + `secondary` çocukları; registry'den
  türetilir. `hasSubRoutes(route)` yapısal alt-rota var mı sorusunu yanıtlar (UI'da
  "alt-menü mü açar" DEĞİL — o gözleme bağlıdır).

## IA değişince güncellenecek TAM liste (yalnız bunlar)

1. **`tests/contracts/product-surfaces.js`** — taşınan sayfanın `navigation`/`parentId`
   alanlarını güncelle (ör. üst düzeyden bir grubun altına inen sayfa: `navigation:'main'`
   → `'secondary'` + `parentId: '<grup>'`). Rota değiştiyse `route`'u güncelle; eski rota
   hâlâ yönlendiriyorsa `routeKind:'redirect'` + `redirectTarget` ile ekle.
2. **`tests/contracts/navigation.js` → `MAIN_NAVIGATION`** — üst düzey sidebar listesini
   yeni panele göre güncelle (öğe azaldıysa çıkar). Fail-closed kapı, bunun registry ile
   tutarlı olmasını zorlar; tutarsızlık import anında patlar.
3. **`tests/navigation.authed.spec.js`** — hangi öğe tıklayınca doğrudan gezinir (yaprak),
   hangisi alt-menü açar (grup) — bu UI davranışını yeni panele göre güncelle. Grup içi
   sayfalar için grup-farkındalıklı `AppShell.openViaSidebar(name, { parent })` kullan.
4. **Discovery baseline** — yapısal ARIA + endpoint parmak izini bilinçli yenile:
   `npm run test:discovery:update-baseline` (dev'e karşı, VPN'de).

Bunlar dışındaki spec'ler ve Page Object'ler rota ile gezindiği için dokunulmaz.

## Grup-farkındalıklı sidebar gezinmesi

Yeni panel açılır gruplar içeriyorsa, bir grubun altındaki sayfaya tıklama-gezinmeyi
test etmek için:

```js
// Doğrudan (düz menü / yaprak):
await app.shell.openViaSidebar('Tickets');
// Grup altındaki sayfa: önce grubu açar, sonra çocuğa tıklar:
await app.shell.openViaSidebar('SMS', { parent: 'Channels' });
```

Kapalı grubu açar, sonra çocuğa tıklar. Sayfa bir grubun altına taşınsa bile bu
yardımcı ile tıklama-gezinme testi kırılmaz. (Rota-tabanlı `open()` zaten en dayanıklı
yoldur; bu yalnızca sidebar tıklama davranışını doğrulamak içindir.)

## Yeni sayfa eklendiğinde

1. `PRODUCT_SURFACES`'e yüzeyi ekle (route + navigation + parentId + kanıt).
2. Üst düzeyse `MAIN_NAVIGATION`'a ekle (fail-closed kapı zaten eksikse uyarır).
3. Page Object + spec ekle (rota ile `open()`). Kapsam registry'leri (`tested-pages.js`)
   fail-closed olduğu için eksik kapsam sessizce kaybolmaz; `quality:check` uyarır.

Kısaca: **navigasyon değişimi = registry'de birkaç alan + tek nav listesi güncellemesi;**
gerisi türetilir ve fail-closed kapılar tutarsızlığı anında yakalar.
