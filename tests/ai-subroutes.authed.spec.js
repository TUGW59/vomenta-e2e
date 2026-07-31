// @ts-check
import { test, expect } from './fixtures/test.js';
import { AiSubPage } from './pages/AiSubPage.js';
import { assertDestinationLoaded, waitForUiToSettle } from './helpers.js';

/**
 * Bir KPI etiketinin YALNIZ etiket değil bir DEĞER de gösterdiğini doğrular.
 * /ai/usage tile yapısı değeri etiketin BÜYÜKEBEVEYNİNDE tutar (etiket→sarmalayıcı→
 * "etiket değer altyazı") → paylaşılan expectMetricHasValue (yalnız ebeveyn) yetmez;
 * burada birkaç ata yukarı tırmanarak değer aranır.
 * @param {import('@playwright/test').Page} page
 * @param {string} label
 */
async function expectTileHasValue(page, label) {
  await expect
    .poll(
      () =>
        page.evaluate((lbl) => {
          const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
          const main = document.querySelector('main') || document.body;
          const leaf = [...main.querySelectorAll('*')].find(
            (e) => e.children.length === 0 && norm(e.textContent) === lbl
          );
          if (!leaf) return '';
          let el = leaf;
          for (let k = 0; k < 4 && el; k++) {
            el = el.parentElement;
            if (el) {
              const t = norm(el.textContent).replace(lbl, '');
              if (/\d|%|\$|—|N\/A/.test(t)) return t;
            }
          }
          return '';
        }, label),
      { timeout: 10000, message: `"${label}" KPI kutucuğunda değer görünmeli` }
    )
    .toMatch(/\d|%|\$|—|N\/A/);
}

/**
 * YAPAY ZEKA ALT ROTALARI (`/ai/*`) — SALT-OKUNUR PRODUCTION-SAFE PAKET
 *
 * Canlı gözlem: 31 Tem 2026, app.vomenta.com (Claude-in-Chrome ile gezildi).
 * Standartlar: bkz. AGENTS.md (3 katman + prod mutasyon güvenliği).
 *
 * Sekiz alt rota (Voice AI / Chatbot / Copilot / Sentiment / Knowledge Base /
 * Prompts / Usage / Providers) yalnızca SALT-OKUNUR yüzeyleriyle test edilir:
 *   - L1 açılış: doğru rota + oturum korunur + h1 başlık + belirgin bölüm çapası.
 *   - Konsol temiz guard'ı (7 temiz rota). /ai/prompts hariç → bilinen konsol hatası
 *     (AI-PROMPTS-CONSOLE, known-bugs.js) ayrı guard testinde beklenen-başarısızlıkla
 *     doğrulanır; burada assertClean uygulanmaz.
 *   - Client-side kontroller: Usage KPI/tablolar, KB iç sekmeleri, Prompts filtresi,
 *     Sentiment tarih aralığı — hepsi mutasyonsuz.
 *
 * MUTASYON RİSKİ (canlıda TETİKLENMEZ): Add Config/Chatbot/Provider, Edit/Delete/
 * Clone, AI Call, Test (sağlayıcı anahtarı), Create Scenario, Customize/Reset,
 * New Article, Ask AI, Auto-Evaluation switch, skor/eşik girdileri → staging planı.
 * L2 (arka plan): rota verisi RSC ile gelir (per-etkileşim client XHR yok) → N/A.
 */

const S = AiSubPage.SECTIONS;
const KEYS = /** @type {(keyof typeof S)[]} */ (Object.keys(S));

// ───────────────── L1: TÜM ALT ROTALARIN AÇILIŞI ─────────────────
test.describe('AI alt rotaları — sayfa açılışı (L1) @regression', () => {
  for (const key of KEYS) {
    const meta = S[key];
    test(`[${key}] ${meta.path} açılıyor: başlık + bölüm görünür @smoke`, async ({ app, page }) => {
      const sub = app.aiSub(key);
      await sub.open();
      // Navigasyon L3 çapası: doğru rota + oturum korunmuş + başlık render oldu.
      await assertDestinationLoaded(page, { path: meta.path, heading: meta.heading, exact: false });
      // Sayfanın gerçekten yüklendiğinin ikinci kanıtı: belirgin bölüm çapası.
      await expect(sub.section()).toBeVisible();
    });
  }
});

// ───────────────── KONSOL TEMİZ GUARD'I (7 temiz rota) ─────────────────
// /ai/prompts hariç → bilinen konsol hatası (AI-PROMPTS-CONSOLE) known-bugs.js'te
// kayıtlı ve tests/known-bugs.authed.spec.js'te knownBugGuard ile doğrulanır.
test.describe('AI alt rotaları — konsol temiz @regression', () => {
  for (const key of KEYS.filter((k) => S[k].consoleClean)) {
    const meta = S[key];
    test(`[${key}] ${meta.path} yüklemede sessiz hata yok (@clean)`, async ({ app, diagnostics }) => {
      const sub = app.aiSub(key);
      await sub.open();
      await waitForUiToSettle(sub.page);
      diagnostics.assertClean();
    });
  }
});

// ───────────────── /ai/usage — SALT-OKUNUR KPI + TABLOLAR ─────────────────
test.describe('AI Kullanım (/ai/usage) — salt-okunur @regression', () => {
  test('KPI tile\'ları bir DEĞER gösteriyor + kullanım tabloları görünüyor', async ({ app }) => {
    const usage = app.aiSub('usage');
    await usage.open();
    for (const label of ['Total Tokens', 'Total Cost', 'Total Requests', 'Avg Cost / Request']) {
      await expectTileHasValue(usage.page, label);
    }
    await expect(usage.page.getByText('Usage by Feature', { exact: true })).toBeVisible();
    await expect(usage.page.getByText('Usage by Model', { exact: true })).toBeVisible();
  });
});

// ═══════════════ KONTROL: KB İÇ SEKMELERİ (L1) ═══════════════
// Client-side sekmeler (Articles/Documents/Categories/Settings) → seçim durumu değişir.
test.describe('Kontrol: Knowledge Base iç sekmeleri @regression', () => {
  test('L1 tıklama OK: "Documents" sekmesi seçili duruma geçiyor', async ({ app }) => {
    const kb = app.aiSub('knowledge-base');
    await kb.open();
    const docs = kb.page.getByRole('tab', { name: 'Documents', exact: true });
    await expect(async () => {
      await docs.click();
      await expect(docs).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  });
});

// ═══════════════ KONTROL: SENTIMENT TARİH ARALIĞI (L1) ═══════════════
test.describe('Kontrol: Sentiment tarih aralığı @regression', () => {
  test('L1 tıklama OK: "30D" aralığı seçili duruma geçiyor', async ({ app }) => {
    const s = app.aiSub('sentiment');
    await s.open();
    const range = s.page.getByRole('tab', { name: '30D', exact: true });
    await expect(async () => {
      await range.click();
      await expect(range).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  });
});

// ═══════════════ KONTROL: PROMPTS KANAL FİLTRESİ (L1 fonksiyonel) ═══════════════
// "Voice" filtresi listeyi client-side süzer: Voice senaryoları kalır, Chat gizlenir.
// Konsol hatası bilinen (AI-PROMPTS-CONSOLE) → burada assertClean YAPILMAZ.
test.describe('Kontrol: Prompts kanal filtresi @regression', () => {
  test('L1 tıklama OK: "Voice" filtresi Chat senaryosunu gizliyor', async ({ app }) => {
    const p = app.aiSub('prompts');
    await p.open();
    const main = p.page.getByRole('main');
    const voiceOnly = p.page.getByText('AI Voice Agent — Inbound Call', { exact: true }).first();
    const chatOnly = p.page.getByText('WebChat AI Agent', { exact: true }).first();
    await expect(voiceOnly).toBeVisible();
    await expect(chatOnly).toBeVisible(); // "All" başlangıçta ikisi de görünür
    await main.getByRole('button', { name: 'Voice', exact: true }).click();
    await expect(voiceOnly).toBeVisible();
    await expect(chatOnly).toBeHidden(); // Chat senaryosu süzüldü
  });
});
