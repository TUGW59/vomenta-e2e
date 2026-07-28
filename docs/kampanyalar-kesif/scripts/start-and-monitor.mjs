// KAMPANYA BAŞLATMA + İZLEME (kullanıcı onaylı, prod mutation)
// "E2E kesif TEST (silinebilir)" kampanyasını başlatır ve ~75s davranışını izler.
// Ham veri: docs/kampanyalar-kesif/veri/start-observations.json + ekran görüntüleri.
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'https://app.vomenta.com';
const AUTH = 'playwright/.auth/default.json';
const SHOT = 'docs/kampanyalar-kesif/screenshots';
const VERI = 'docs/kampanyalar-kesif/veri';
const NAME = 'E2E kesif TEST (silinebilir)';
const ID = '56b8d243-da42-48a0-9e6e-be443501f808';

const log = { name: NAME, id: ID, timeline: [], network: [], startResponse: null };
const browser = await chromium.launch();
const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 1000 }, locale: 'en-US', timezoneId: 'Europe/Istanbul' });
const page = await ctx.newPage();

// İlgili tüm network'ü yakala
page.on('request', (r) => {
  const u = r.url();
  if (u.includes('/api/v1/') && (u.includes('campaign') || u.includes('call') || u.includes('dial') || u.includes('voice') || u.includes('queue'))) {
    log.network.push(`${r.method()} ${u.replace('https://api.vomenta.com', '')}`);
  }
});
page.on('response', async (resp) => {
  if (resp.url().includes(`/campaigns/${ID}/start`) && resp.request().method() === 'POST') {
    try { log.startResponse = { status: resp.status(), body: await resp.json() }; } catch { log.startResponse = { status: resp.status() }; }
  }
});

// detay durum + metrikleri oku (DOM)
async function detailSnapshot(tag) {
  const s = await page.evaluate(() => {
    const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const metric = (label) => {
      // "Total Contacts" gibi etiketi bul, komşu sayıyı al
      const nodes = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && txt(e) === label);
      for (const n of nodes) {
        const card = n.closest('div');
        const num = card ? txt(card).replace(label, '').trim() : '';
        if (num) return num;
      }
      return null;
    };
    // durum rozeti (h1 yanındaki)
    const h1 = document.querySelector('h1');
    const statusBadge = h1 ? txt(h1.parentElement).replace(txt(h1), '').trim().slice(0, 30) : '';
    return {
      url: location.href,
      h1: txt(h1),
      statusBadge,
      totalContacts: metric('Total Contacts'),
      dialingNow: metric('Dialing now'),
      contacted: metric('Contacted'),
      connected: metric('Connected'),
      startBtnVisible: !!([...document.querySelectorAll('button')].find((b) => /^Start$/.test(txt(b)))),
      pauseStopButtons: [...document.querySelectorAll('button')].map(txt).filter((t) => /pause|stop|resume|complete|end|duraklat|durdur/i.test(t)),
    };
  });
  s.tag = tag;
  s.t = log.timeline.length;
  log.timeline.push(s);
  return s;
}

// 1) Liste — başlatmadan önceki durum
await page.goto(`${BASE}/campaigns/outbound`, { waitUntil: 'commit' });
await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 30000 });
await page.waitForTimeout(3000);
const row = page.locator('tbody tr').filter({ hasText: NAME }).first();
log.beforeRowText = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
await page.screenshot({ path: `${SHOT}/start-01-before-list.png`, fullPage: false });

// 2) Play → onay dialogu
await row.locator('button:has(svg.lucide-play)').click();
await page.locator('[role=dialog],[role=alertdialog]').first().waitFor({ timeout: 8000 });
log.confirmDialogText = (await page.locator('[role=dialog],[role=alertdialog]').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
await page.screenshot({ path: `${SHOT}/start-02-confirm.png`, fullPage: false });

// 3) Onayla → başlat
await page.locator('[role=dialog],[role=alertdialog]').getByRole('button', { name: /^Start$/i }).click();
await page.waitForTimeout(3000);
log.afterStartUrl = page.url();
log.afterStartToast = (await page.evaluate(() => {
  const c = [...document.querySelectorAll('[data-sonner-toast],[role=status],[role=alert]')].map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  return c.slice(0, 4);
}));
await page.screenshot({ path: `${SHOT}/start-03-after.png`, fullPage: true });

// 4) Detaya git (yönlenmediyse) ve durumu ~70s izle
if (!/\/campaigns\/[0-9a-f-]{36}/.test(page.url())) {
  await page.goto(`${BASE}/campaigns/${ID}`, { waitUntil: 'commit' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
}
await detailSnapshot('t0-after-start');
for (let i = 1; i <= 7; i++) {
  await page.waitForTimeout(10000);
  // sayfayı tazele ki güncel metrik gelsin (SPA socket de olabilir; ikisini de kapsar)
  await page.reload({ waitUntil: 'commit' }).catch(() => {});
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await detailSnapshot(`t${i * 10}s`);
  if (i === 3) await page.screenshot({ path: `${SHOT}/start-04-monitor-30s.png`, fullPage: true });
}
await page.screenshot({ path: `${SHOT}/start-05-final.png`, fullPage: true });

// benzersiz network
log.networkUnique = [...new Set(log.network)];
fs.writeFileSync(`${VERI}/start-observations.json`, JSON.stringify(log, null, 2));
console.log(JSON.stringify({ startResponse: log.startResponse, confirmDialogText: log.confirmDialogText, afterStartToast: log.afterStartToast, timeline: log.timeline, networkUnique: log.networkUnique }, null, 2));
await browser.close();
