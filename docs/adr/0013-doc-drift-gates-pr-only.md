# ADR-0013: Committed-doc drift kapıları yalnız PR'da (main-kararlılığı)

- Durum: Kabul edildi
- Tarih: 2026-08-03
- İlişki: ADR-0002 (zorunlu stil matrisi), ADR-0012 (kapsam derinliği matrisi),
  WP-R2 (findings/rapor doc'ları). Bu ADR o üretilen dokümanların **drift
  kapılarının nerede koşacağını** düzeltir; üretimin kendisini veya self-check'leri
  değiştirmez.

## Bağlam

Depoda dört otomatik-üretilen doküman seti versiyon kontrolünde tutuluyor:

| Doküman | Üretici | Drift kapısı (npm) |
|---|---|---|
| `docs/TEST_COVERAGE.md` | `tools/generate-coverage.mjs` | `report:coverage:check` |
| `docs/TEST_STYLE_MATRIX.md` | `tools/style-coverage.mjs` | `report:style-matrix:check` |
| `docs/raporlar/findings.json` + `BULGULAR.md` + `YAPILAN/YAPILMAYAN-TESTLER.md` | `tools/generate-findings.mjs` + `generate-test-report.mjs` | `report:findings:check` |
| `docs/SURFACE-DEPTH-MATRIX.md` + `docs/raporlar/SURFACE-DEPTH.json` | `tools/generate-surface-depth.mjs` | `report:surface:check` |

Her drift kapısı üreticiyi yeniden çalıştırıp committed sürümle
`git diff --exit-code` karşılaştırır. Kapılar `architecture` job'ında **her
tetikleyicide** (pull_request + push + schedule) koşuyordu.

**Kök sorun — eşzamanlı-merge yarışı.** Üretilen dokümanın içeriği deponun
**birleşik ağacının** deterministik bir fonksiyonudur. İki PR birbirinden bağımsız
olarak kendi tabanına karşı doc üretip yeşil geçer; ama her ikisi de merge edilince
oluşan **birleşik ağacı** ne biri ne öbürü görmüştür. GitHub (merge-queue yokken)
merge commit'i üzerinde üreticileri yeniden koşmaz → merge commit'inin committed
doc'ları kaçınılmaz olarak bayat kalır. Drift kapısı `push` (merge commit)
üzerinde koştuğu için main, **kimsenin hatası olmayan** bir yarıştan ötürü kronik
kırmızıya düşer. Bu oturumda main 1 saatte 6 kez ilerledi (voice-* PR akışı) ve
her eşzamanlı merge paylaşılan doc'ları bayatlattı; tek-seferlik regen dakikalar
içinde yeniden bayatladığından "hareket eden hedef" regen ile yeşile alınamadı.

## Karar

Dört committed-doc drift kapısını **yalnız `pull_request` olayına** sınırla
(`if: ${{ github.event_name == 'pull_request' }}`). Drift, ancak tabanın stabil
olduğu ve **yazarın aksiyon alabildiği** PR bağlamında anlamlı ve uygulanabilirdir.

`push`/`schedule` üzerinde bu kapılar koşmaz; dolayısıyla merge commit'inin
yarış-kaynaklı bayat doc'ları main'i kırmızıya düşürmez.

**Değişmeden kalan evrensel kapı:** `npm run quality:check` (generatör
MANTIĞININ self-check'leri, `git diff` YOK) her tetikleyicide koşmaya devam eder.
Yani generatörlerin doğruluğu push'ta da korunur; yalnız committed çıktının
byte-eşitliği push'ta zorlanmaz.

## Kendiliğinden iyileşme (self-healing)

Eşzamanlı merge sonrası main'in committed doc'ları geçici bayat kalabilir. Bir
sonraki PR tabanını bu main'den alır; PR'ın drift kapısı üreticiyi koşup bayatlığı
**yakalar** ve yazar `npm run report:coverage report:style-matrix report:findings
report:test-report report:surface` (veya ilgili alt küme) çalıştırıp taze doc'ları
commit'ler → main iyileşir. Bu kırmızı **yanlış-pozitif değildir**: doc'lar gerçekten
bayattır, sinyal deterministik ve mekanik olarak düzeltilebilir. Maliyet, ara sıra
bir PR'ın "doc'ları yenile" red'i yemesidir — main'in kronik kırmızısına kıyasla
kabul edilebilir ve öngörülebilir.

## Reddedilen alternatifler

1. **Merge queue (birleşik sonucu merge öncesi yeniden üret).** En temiz çözüm
   olurdu ama repo yönetim ayarı + branch protection gerektirir; kod içinden
   güvenilir biçimde kurulamaz. Branch protection açıldığında bu ADR merge-queue
   ile birlikte de geçerli kalır (kapılar PR'da anlamlı olmaya devam eder).
2. **Push'ta yeniden üret + geri commit'le (bot commit).** Doc'ları hep taze
   tutardı ama `contents: write` izni + bot push + `[skip ci]` döngü yönetimi
   gerektirir. Depo güvenlik duruşu (WP-SEC; workflow üst düzeyi `contents: read`)
   göz önüne alınınca yazma iznini genişletmek istenmez.
3. **Doc'ları git'ten çıkar (yalnız CI artifact).** Drift'i tümden yok ederdi ama
   önceki fazların versiyonlu, insan-okur teslimatlarını (BULGULAR.md, matrisler)
   kaybederdi.

## Sonuçlar

- Post-merge (`push`) main CI artık eşzamanlı-merge yarışından kırmızıya düşmez;
  `architecture` push'ta yalnız `quality:check` + (job zinciri) public-smoke +
  authenticated-critical koşar.
- PR drift zorlaması korunur: testi değiştirip doc'u yenilemeyi unutan yazar PR'da
  yakalanır.
- Bu PR ayrıca birikmiş mevcut drift'i (coverage + findings + surface) güncel main
  ağacına göre yeniden üreterek heal eder.
- Kapsam-dışı bırakılanlar: flaky authed route-quality (ayrı; FAZ 7 /
  WP-NIGHT-STABILITY) ve `quality:security` yerel %20 self-check bug'ı (CI'da koşar).
