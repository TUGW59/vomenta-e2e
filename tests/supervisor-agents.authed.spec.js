// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertLocalClock } from './helpers.js';
import { AgentMonitorPage } from './pages/AgentMonitorPage.js';

/**
 * SÜPERVİZÖR → TEMSİLCİ İZLEME / AGENT MONITOR (`/supervisor/agents`)
 *
 * Keşif + kanıt: docs/temsilci-izleme-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * Standartlar: 3 katmanlı kontrol testi (L1 tıklama / L2 arka plan / L3 görev) ve
 * 4 dil (en/tr/fr/ar) i18n doğrulaması — bkz. AGENTS.md.
 *
 * Bilinen hata: "Last refreshed at" saati UTC gösteriliyor (yerel değil) — Duvar
 * Panosu BULGU 4 ile aynı sınıf; burada da tekrar ediyor (`test.fail`).
 */

const I18N = AgentMonitorPage.I18N;

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Temsilci İzleme — yapı', () => {
  /** @type {AgentMonitorPage} */
  let am;
  test.beforeEach(async ({ app }) => {
    am = app.agentMonitor;
    await am.open();
  });

  test('başlık ve alt başlık görünüyor @smoke @critical', async () => {
    await expect(am.heading).toHaveText(I18N.en.heading);
    await expect(am.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
  });

  test('istatistik döşemeleri görünüyor (Total/Available/Offline/Calls Today/Avg AHT)', async () => {
    for (const label of ['Total', 'Available', 'On Call', 'Offline', 'Calls Today', 'Avg AHT']) {
      await expect(am.page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test('temsilci tablosu beklenen kolonları gösteriyor @critical', async () => {
    for (const col of ['Agent', 'Status', 'Current Interaction', 'AHT', 'Calls', 'CSAT', 'Actions']) {
      await expect(am.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
  });

  test('kontroller mevcut (durum filtresi / arama / Analyze)', async () => {
    await expect(am.statusFilter).toBeVisible();
    await expect(am.searchInput).toBeVisible();
    await expect(am.analyzeButton).toBeVisible();
  });
});

// ──────────────────────── 4 DİL i18n GUARD'LARI ────────────────────────
test.describe('Temsilci İzleme — 4 dil çeviri guard\'ları @regression', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + kontrol etiketleri çevrili`, async ({ app }) => {
      const am = app.agentMonitor;
      await am.open();
      if (t.endonym) await am.switchLanguage(t.endonym);

      await expect(am.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(am.heading).toHaveText(t.heading);
      await expect(am.statusFilter).toHaveText(t.statusAll);
      await expect(am.page.getByText(t.live, { exact: true }).first()).toBeVisible();
      await expect(am.page.getByRole('button', { name: t.analyze, exact: true })).toBeVisible();
      await expect(am.page.getByRole('button', { name: t.force, exact: true }).first()).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: DURUM FİLTRESİ (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Durum filtresi @regression', () => {
  test('L1 tıklama OK: menü açılıyor ve durum seçenekleri görünüyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await am.statusFilter.click();
    for (const opt of ['All Status', 'Available', 'On Call', 'Offline']) {
      await expect(am.page.getByRole('option', { name: opt, exact: true })).toBeVisible();
    }
    await am.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: durum seçince agents API\'sini status parametresiyle çağırıyor @critical', async ({ app, page }) => {
    const am = app.agentMonitor;
    await am.open();
    const request = page.waitForRequest(
      (r) => r.url().includes(AgentMonitorPage.API.agents) && /[?&]status=OFFLINE/i.test(r.url()) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await am.selectStatus('Offline');
    await request;
  });

  test('L3 görev OK: seçilen duruma göre tablo filreleniyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    // Başlangıçta (All Status) çevrimdışı ajan görünür.
    await expect(am.page.getByText('Account Agent', { exact: true })).toBeVisible();
    // "Available" seç → çevrimdışı ajan artık listede olmamalı (filtre uygulanır).
    await am.selectStatus('Available');
    await expect(am.page.getByText('Account Agent', { exact: true })).toBeHidden();
    // "All Status"a dön → tekrar görünür.
    await am.selectStatus('All Status');
    await expect(am.page.getByText('Account Agent', { exact: true })).toBeVisible();
  });
});

// ═══════════════ KONTROL: ARAMA (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Agent arama @regression', () => {
  test('L1 tıklama OK: arama kutusuna yazılabiliyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await am.searchInput.fill('Account');
    await expect(am.searchInput).toHaveValue('Account');
  });

  test('L2 arka plan OK: arama agents API\'sini search parametresiyle çağırıyor', async ({ app, page }) => {
    const am = app.agentMonitor;
    await am.open();
    const request = page.waitForRequest(
      (r) => r.url().includes(AgentMonitorPage.API.agents) && /[?&]search=Account/i.test(r.url()) && r.method() === 'GET',
      { timeout: 10000 }
    );
    await am.searchInput.fill('Account');
    await request;
  });

  test('L3 görev OK: arama tabloyu eşleşen ajana daraltıyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.page.getByText('Product Team', { exact: true })).toBeVisible();
    await am.searchInput.fill('Account');
    // Eşleşen görünür, eşleşmeyen gizlenir.
    await expect(am.page.getByText('Account Agent', { exact: true })).toBeVisible();
    await expect(am.page.getByText('Product Team', { exact: true })).toBeHidden();
  });
});

// ═══════════════ KONTROL: FORCE (satır eylemi) — L1 ═══════════════
// "Force" ajanın durumunu ZORLA değiştiren bir menü açar (Available/Break/Lunch/
// Training/Offline). Bu bir MUTATION'dır → prod'da tetiklenmez. L1 = menü açılır.
test.describe('Kontrol: Force (ajan durumu) @regression', () => {
  test('L1 tıklama OK: Force menüsü açılıyor ve zorla-durum seçenekleri görünüyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await am.openForceMenu();
    for (const s of AgentMonitorPage.FORCE_STATUSES) {
      await expect(am.page.getByRole('menuitem', { name: s, exact: true })).toBeVisible();
    }
    await am.page.keyboard.press('Escape'); // durumu DEĞİŞTİRMEDEN kapat
  });
});

// L2/L3: "Force → <durum>" ajanın durumunu gerçekten değiştirir (YIKICI/MUTATION) →
// prod'da tetiklenmez; yalnızca staging'de ayrı *.mutation spec + @mutation +
// mutationGuard + cleanup (durumu geri al) ile (bkz. AGENTS.md).
test.describe('Force — L2/L3 (staging planı) @regression', () => {
  test.fixme('L2/L3: "Force → Break" ajanın durumunu backend\'de Break yapar (staging @mutation)', async () => {});
  test.fixme('L2/L3: "Force → Available" ajanın durumunu backend\'de Available yapar (staging @mutation)', async () => {});
});

// ═══════════════ KONTROL: ANALYZE (anomali) — L1 ═══════════════
// "Analyze" butonu, transkript textarea'sı boşken DEVRE DIŞI; metin girilince etkinleşir.
test.describe('Kontrol: Analyze (anomali tespiti) @regression', () => {
  test('L1 tıklama OK: transkript girilince Analyze butonu etkinleşiyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.analyzeTextarea).toBeVisible();
    await expect(am.analyzeButton).toBeDisabled(); // boşken devre dışı
    await am.analyzeTextarea.fill('Müşteri iade talep etti; temsilci sakin yanıt verdi.');
    await expect(am.analyzeButton).toBeEnabled(); // metin girilince etkin
  });

  // L2/L3: Analyze'a basınca transkript analiz ucuna gönderilir ve sonuç gösterilir.
  // AI analizi olduğundan ayrıca ele alınacak (deterministik değil).
  test.fixme('L2/L3: "Analyze" transkripti analiz ucuna gönderir ve sonuç döndürür', async () => {});
});

// ═══════════════ KONTROL: SAYFALAMA — L1 ═══════════════
// Mevcut veri 1 sayfa (≤20 ajan) → "Next" devre dışı. L2/L3 (sayfa değişimi) için
// >20 ajanlı veri gerekir → şimdilik N/A; L1 = butonlar mevcut, Next devre dışı.
test.describe('Kontrol: Sayfalama @regression', () => {
  test('L1: Previous/Next butonları mevcut, tek sayfada Next devre dışı', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.prevButton).toBeVisible();
    await expect(am.nextButton).toBeVisible();
    await expect(am.nextButton).toBeDisabled();
  });
});

// ═══════════════ BİLİNEN HATA: "Last refreshed" saati UTC ═══════════════
test.describe('Temsilci İzleme — zaman damgası (timezone) @regression @known-bug', () => {
  test.use({ timezoneId: 'Europe/Istanbul', locale: 'en-US' });

  // "Last refreshed at HH:MM" yerel saati göstermeli; sunucunun UTC zamanını
  // çevirmeden bastığı için UTC+3'te ~180 dk sapıyor (Duvar Panosu BULGU 4 ile aynı).
  test('BULGU: "Last refreshed" saati yerel saat olmalı (UTC değil)', async ({ app, page }) => {
    test.fail();
    const am = app.agentMonitor;
    await am.open();
    await expect(am.lastRefreshed).toBeVisible({ timeout: 15000 });
    await assertLocalClock(page, (await am.lastRefreshed.innerText()).trim()); // ortak timezone guard'ı
  });
});
