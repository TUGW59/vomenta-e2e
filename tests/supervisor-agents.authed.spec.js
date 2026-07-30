// @ts-check
import { test, expect } from './fixtures/test.js';
import { assertLocalClock, knownBugGuard } from './helpers.js';
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

  test('L1 tıklama OK: durum seçince onay diyaloğu zorunlu-sebep ile açılıyor (iptal edilir)', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await am.openForceMenu();
    await am.page.getByRole('menuitem', { name: 'Available', exact: true }).click();
    const dialog = am.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Reason \(required\)/i)).toBeVisible();
    const confirm = dialog.getByRole('button', { name: /Force Status Change/i });
    await expect(confirm).toBeDisabled(); // sebep boşken devre dışı
    await dialog.locator('textarea').first().fill('x');
    await expect(confirm).toBeEnabled(); // sebep girilince etkin
    // Durumu DEĞİŞTİRMEDEN İPTAL et (mutation yok).
    await dialog.getByRole('button', { name: /Cancel/i }).click();
    await expect(dialog).toBeHidden();
  });
});

/**
 * BULGU (Force durum değişikliği başarısız) — kullanıcı canlıda gözlemledi:
 * Force → Available → sebep → "Force Status Change" → "İşlem tamamlanamadı. Lütfen tekrar deneyin."
 *
 * KÖK NEDEN (kanıtlı, docs/temsilci-izleme-kesif/NOTLAR.md):
 *  - Frontend DOĞRU istek atıyor: PATCH /api/v1/supervisor/agents/{id}/force-status
 *    body {status:"AVAILABLE", reason} — OpenAPI ForceAgentStatusDto ile birebir uyumlu.
 *  - Yani doğrulama/sözleşme sorunu DEĞİL; geçerli istek sunucuda reddediliyor
 *    (muhtemelen çevrimdışı/oturumsuz ajan zorlanamıyor) ve UI jenerik "tekrar deneyin" gösteriyor.
 *  - Tam HTTP kodu: gerçek mutasyon güvenlik-bloklu → staging'de teyit edilecek.
 *
 * L2/L3 (gerçek durum değişikliği) YIKICI/MUTATION → prod'da tetiklenmez; staging'de
 * ayrı *.mutation spec + @mutation + mutationGuard + cleanup ile (bkz. AGENTS.md).
 */
test.describe('Force — L2/L3 (staging planı) @regression', () => {
  test.fixme('L2/L3: "Force → Break" ajanın durumunu backend\'de Break yapar (staging mutation)', async () => {});
  test.fixme('L2/L3: çevrimdışı ajanı zorlama hatasının tam HTTP kodu/mesajı doğrulanır (staging)', async () => {});
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

  test('L2 arka plan OK: Analyze transkripti detect-anomaly ucuna POST ediyor', async ({ app, page }) => {
    const am = app.agentMonitor;
    await am.open();
    await am.analyzeTextarea.fill('Customer: third time calling! Agent: I will fix this right now.');
    const request = page.waitForRequest(
      (r) => r.url().includes(AgentMonitorPage.ANALYZE_API) && r.method() === 'POST',
      { timeout: 10000 }
    );
    await am.analyzeButton.click();
    const req = await request;
    // İstek gövdesi transkripti içermeli (salt-okunur işlem, veri değiştirmez).
    expect(req.postData() || '').toContain('transcript');
  });

  test('L3 görev OK: analiz sonucu (risk) arayüzde gösteriliyor', async ({ app, page }) => {
    const am = app.agentMonitor;
    await am.open();
    // Yanıtı SABİTLE (deterministik + AI maliyeti yok): overallRisk=high.
    await page.route(`**${AgentMonitorPage.ANALYZE_API}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { anomalies: [{ type: 'compliance_issues', severity: 'high', description: 'x', evidence: 'y', recommendation: 'z' }], overallRisk: 'high', requiresReview: true },
          meta: {},
        }),
      })
    );
    await am.analyzeTextarea.fill('Customer escalation transcript for deterministic test.');
    await am.analyzeButton.click();
    // Sonuç render edilmeli (sabit yanıttaki risk seviyesi).
    await expect(am.page.getByText(/Risk:\s*high/i)).toBeVisible({ timeout: 10000 });
  });
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

// ═══════════════ KONTROL: GÖRÜNÜM TOGGLE (liste / ızgara) — L1 ═══════════════
// Saf istemci-tarafı görünüm değişimi → L2 N/A. NOT: ikon-only butonlar aria-label'sız (a11y).
test.describe('Kontrol: Görünüm toggle (liste/ızgara) @regression', () => {
  test('L1+L3: ızgara/liste arasında geçiş tablo düzenini değiştiriyor', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    // Başlangıç: liste (tablo) — kolon başlığı görünür.
    await expect(am.page.getByRole('columnheader', { name: 'Agent', exact: true })).toBeVisible();
    // Izgaraya geç → tablo kolon başlığı kaybolur (kart düzeni).
    await am.viewGridButton.click();
    await expect(am.page.getByRole('columnheader', { name: 'Agent', exact: true })).toBeHidden();
    // Listeye dön → tablo geri gelir.
    await am.viewListButton.click();
    await expect(am.page.getByRole('columnheader', { name: 'Agent', exact: true })).toBeVisible();
  });
});

// ═══════════════ KONTROL: SATIR → DETAY PANELİ — L1 + L2 + L3 (+ tutarlılık) ═══════════════
test.describe('Kontrol: Ajan detay paneli @regression', () => {
  test('L1+L2+L3: satıra tıklayınca panel açılıyor, status-history çekiliyor, veri tutarlı', async ({ app, page }) => {
    const am = app.agentMonitor;
    await am.open();
    // L2: panel açılışında status-history isteği.
    const historyReq = page.waitForRequest(
      (r) => r.url().includes('/status-history') && r.method() === 'GET',
      { timeout: 10000 }
    );
    const dialog = await am.openDetailDrawer('Account Agent'); // L1: panel açılır
    await historyReq;
    // L3 + TUTARLILIK: panel, satırdaki ajanı ve durumunu göstermeli.
    await expect(dialog.getByText('Account Agent', { exact: true })).toBeVisible();
    await expect(dialog.getByText('testagent@sigmatelecom.com', { exact: true })).toBeVisible();
    await expect(dialog.getByText(/Offline/i).first()).toBeVisible(); // satırdaki durumla tutarlı
    await expect(dialog.getByText(/Software/i).first()).toBeVisible(); // satırdaki kuyrukla tutarlı
    await page.keyboard.press('Escape');
  });
});

// ═══════════════ KONTROL: SATIR AKSİYONLARI (Listen/Whisper/Barge In) — L1 ═══════════════
// Canlı arama denetim aksiyonları. Çevrimdışı ajanda DOĞRU şekilde disabled.
// L2/L3 (gerçek dinleme/fısıltı/araya girme) için canlı aramadaki ajan gerekir → N/A.
test.describe('Kontrol: Satır aksiyonları (Listen/Whisper/Barge In) @regression', () => {
  test('L1: aksiyon ikonları mevcut ve çevrimdışı ajanda devre dışı', async ({ app }) => {
    const am = app.agentMonitor;
    await am.open();
    await expect(am.listenButton).toBeVisible();
    await expect(am.whisperButton).toBeVisible();
    await expect(am.bargeButton).toBeVisible();
    // Çevrimdışı ajan → canlı denetim yapılamaz → disabled (doğru davranış).
    await expect(am.listenButton).toBeDisabled();
    await expect(am.whisperButton).toBeDisabled();
    await expect(am.bargeButton).toBeDisabled();
  });
});

// ═══════════════ KONTROL: DURUM FİLTRESİ — DOĞRULUK (sunucu yanıtı) ═══════════════
test.describe('Kontrol: Durum filtresi doğruluğu @regression', () => {
  test('L3 doğruluk: sunucu yanıtındaki her ajan seçilen durumla eşleşiyor', async ({ app, page }) => {
    const am = app.agentMonitor;
    await am.open();
    // "Offline" seç → yanıttaki tüm ajanların agentStatus'u OFFLINE olmalı.
    const respP = page.waitForResponse(
      (r) => /supervisor\/agents\?.*status=OFFLINE/i.test(r.url()) && r.request().method() === 'GET',
      { timeout: 10000 }
    );
    await am.selectStatus('Offline');
    const resp = await respP;
    const json = await resp.json().catch(() => null);
    const agents = json?.data ?? [];
    expect(Array.isArray(agents)).toBeTruthy();
    for (const a of agents) {
      expect(a.agentStatus, `ajan ${a.firstName} beklenen OFFLINE`).toBe('OFFLINE');
    }
  });
});

// ═══════════════ BİLİNEN HATA: "Last refreshed" saati UTC ═══════════════
test.describe('Temsilci İzleme — zaman damgası (timezone) @regression @known-bug', () => {
  test.use({ timezoneId: 'Europe/Istanbul', locale: 'en-US' });

  // "Last refreshed at HH:MM" yerel saati göstermeli; sunucunun UTC zamanını
  // çevirmeden bastığı için UTC+3'te ~180 dk sapıyor (Duvar Panosu BULGU 4 ile aynı).
  test('BULGU: "Last refreshed" saati yerel saat olmalı (UTC değil)', async ({ app, page }) => {
    knownBugGuard(test, 'AGENTS-TZ');
    const am = app.agentMonitor;
    await am.open();
    await expect(am.lastRefreshed).toBeVisible({ timeout: 15000 });
    await assertLocalClock(page, (await am.lastRefreshed.innerText()).trim()); // ortak timezone guard'ı
  });
});
