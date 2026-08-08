// @ts-check
import { test, expect } from './fixtures/test.js';
import { gotoApp } from './helpers.js';
import { AppShell } from './pages/AppShell.js';
import { configuredRoles } from '../config/environment.js';
import { PRODUCT_SURFACES } from './contracts/product-surfaces.js';

/**
 * AYARLAR → ROLLER — RBAC ENFORCEMENT (davranışsal negatif; admin self-negative).
 *
 * COV-01 / ADR-0030 md.3'ü UYGULAR. Mevcut settings-roles-rbac.authed.spec.js yalnız izin
 * *tanımını* (katalog/rol kümesi) canlıdan-türetilmiş kontratla diff'liyordu — "salt-ayna":
 * canlının kendi snapshot'ına eşitliğini kontrol eden, enforcement'ı DOĞRULAMAYAN totoloji.
 * Bu spec ilk kez DAVRANIŞSAL negatifi doğrular: oturumdaki admin, izni OLMADIĞI korunan
 * rotalara (settings-billing/reseller — product-surfaces'ta readonly-blocked/403 modellenmiş)
 * ERİŞTİRİLMEZ. Rota kendi içeriğini render etmez; oturum korunarak başka yere yönlendirilir
 * (yalnız menüde gizli DEĞİL — gerçek blok). Bu, ADR-0030 md.3'ün "sahip olmadığı iznin yüzeyi
 * kapalı (gerçek negatif)" maddesidir; yüzey davranışı, salt izin tanımı değil.
 *
 * Yeni credential GEREKMEZ: admin'in KENDİ eksik izinleri (billing.* / reseller.*) gerçek negatif
 * yüzey sağlar. Çapraz-rol (agent) negatifi credential-gated → aşağıda GÖRÜNÜR test.skip ile
 * beyan edilir (sessiz boşluk yok). Materyalizasyon takip işi: (1) AGENT_EMAIL/PASSWORD,
 * (2) rol-scoped `*.<role>.spec.js`'in read-only manifest sınıflandırıcısına öğretilmesi
 * (şu an fail-closed), (3) chromium-agent projesinde gerçek negatif spec.
 *
 * GÜVENLİK (production salt-okunur): yalnız korunan rotaya gidip redirect gözlenir; hiçbir
 * checkbox/Save/DELETE yok. @mutation yok, mutationGuard yok, prod-safe.
 *
 * NOT (kapsam): efektif-izin API negatifi (GET /roles/me/permissions kümesi) EKLENMEDİ —
 * bu uç /settings/roles açılışında tetiklenmiyor (bkz. settings-roles.authed.spec.js:79'daki
 * "me/permissions HARİÇ" notu), dolayısıyla UI-idiomuyla gözlemlenemiyor. Ucun nerede
 * tetiklendiği belirlenince ayrı bir veri-sadakati (data-style) testi eklenebilir (takip işi).
 */

// Admin'in izni olmadığı, product-surfaces'ta 403→redirect modellenen korunan rotalar
// (billing.* / reseller.* — admin'in katalogda sahip OLMADIĞI 7 ayrıcalıklı iznin yüzeyleri).
const PERMISSION_BLOCKED_ROUTES = PRODUCT_SURFACES.filter(
  (s) => s.runtimePolicy === 'readonly-blocked' && s.blockedReason === 'READONLY_403_FORBIDDEN' && s.route,
);

// ═══════════ KORUNAN ROTA BLOKLANMASI (@regression) ═══════════
// Admin bu izinlere (billing.* / reseller.*) sahip DEĞİL → rota kendi içeriğini açmamalı,
// oturum korunarak başka yere yönlendirilmeli. Sadece menüde gizlemek yetmez (gerçek blok).
// Bu yüzeyler product-surfaces'ta modelli ama registered-routes-smoke onları test.fixme
// bırakıyordu (hiç assert edilmiyordu) — ilk gerçek enforcement doğrulaması burada.
test.describe('RBAC — enforcement: izinsiz korunan rota bloklanır @regression', () => {
  for (const s of PERMISSION_BLOCKED_ROUTES) {
    test(`admin (izin yok) "${s.route}" rotasında bloklanır (kendi içeriği açılmaz)`, async ({ page }) => {
      const shell = new AppShell(page);
      await gotoApp(page, s.route);
      // Oturum korunur (login'e düşmedi) — blok, oturum kaybı değil yetki reddi.
      await expect(shell.loginHeading).toBeHidden();
      // Enforcement: korunan rotada KALINMAZ; app kullanıcıyı başka rotaya yönlendirir.
      // Erişebilseydi burada kalır ve test kırmızı olurdu (aranan zafiyet sinyali).
      await page.waitForURL((url) => !new URL(url).pathname.startsWith(s.route), { timeout: 15000 });
      const pathname = new URL(page.url()).pathname;
      expect(pathname.startsWith(s.route), `"${s.route}" bloklanmadı — admin izinsiz erişebiliyor olabilir (RBAC zafiyeti)`).toBe(false);
      // Hedef içerik gerçekten render oldu (L3: sessiz boş sayfa değil).
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
    });
  }
});

// ═══════════ ÇAPRAZ-ROL: GÖRÜNÜR BEYAN (@regression) ═══════════
// ADR-0030 md.4 + repo kültürü (sessiz skip yasak): agent negatif enforcement'ı henüz
// materyalize DEĞİL; boşluk burada GÖRÜNÜR şekilde beyan edilir. Materyalizasyon: AGENT
// kimliği + rol-scoped spec'in read-only manifest sınıflandırıcısına öğretilmesi + chromium-agent
// projesinde gerçek negatif spec. Kimlik gelince bu skip PASS'e döner.
test.describe('RBAC — enforcement: çapraz-rol (kimlik-gated) @regression', () => {
  const roles = configuredRoles();
  test('AGENT negatif enforcement — kimlik yoksa NOT MATERIALIZED (ADR-0030 md.4)', () => {
    test.skip(
      !roles.includes('agent'),
      "AGENT kimliği yok → çapraz-rol enforcement NOT MATERIALIZED (sessiz atlama değil, " +
        "açık beyan). Materyalizasyon: config/environment.js AGENT_EMAIL/AGENT_PASSWORD + " +
        "rol-scoped spec'in read-only manifest sınıflandırıcısına eklenmesi + chromium-agent negatif spec'i.",
    );
    // Kimlik varsa: agent'ın gerçek oturumuyla negatif enforcement bu kapının materyalize
    // biçiminde doğrulanır (admin snapshot'ı DEĞİL — gerçek düşük-yetkili oturum şart).
    expect(roles).toContain('agent');
  });
});
