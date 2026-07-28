// KONSOLİDE KEŞİF — /campaigns/outbound
// (1) yapı (İngilizce) + network uçları, (2) 4 dil snapshot, (3) TÜM filtre
// seçeneklerinin doğruluğu (tür + durum). Ham çıktı: docs/kampanyalar-kesif/veri/.
// Salt-okunur: hiçbir yazma isteği yapmaz (yalnız GET/gezinme).
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'https://app.vomenta.com';
const AUTH = 'playwright/.auth/default.json';
const VERI = 'docs/kampanyalar-kesif/veri';

const browser = await chromium.launch();

// ── (1) YAPI + NETWORK (en) ──
async function structure() {
  const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  const page = await ctx.newPage();
  const net = [];
  page.on('request', (r) => { const u = r.url(); if (u.includes('/api/v1/')) net.push(`${r.method()} ${u.replace('https://api.vomenta.com', '')}`); });
  await page.goto(`${BASE}/campaigns/outbound`, { waitUntil: 'commit' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(3000);
  const dump = await page.evaluate(() => {
    const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      url: location.href,
      h1: [...document.querySelectorAll('h1')].map(txt),
      tableHeaders: [...document.querySelectorAll('th')].map(txt),
      tabs: [...document.querySelectorAll('[role=tab]')].map((t) => ({ name: txt(t), selected: t.getAttribute('aria-selected') })),
      combobox: [...document.querySelectorAll('[role=combobox]')].map(txt),
      searchPlaceholder: [...document.querySelectorAll('main input')].map((i) => i.placeholder).filter(Boolean),
      rowCount: document.querySelectorAll('tbody tr').length,
    };
  });
  await ctx.close();
  return { dump, networkUnique: [...new Set(net)] };
}

// ── (2) 4 DİL SNAPSHOT ──
async function langs() {
  const LANGS = [{ code: 'en', endonym: null }, { code: 'tr', endonym: 'Türkçe' }, { code: 'fr', endonym: 'Français' }, { code: 'ar', endonym: 'العربية' }];
  const out = {};
  for (const { code, endonym } of LANGS) {
    const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 }, locale: 'en-US' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/campaigns/outbound`, { waitUntil: 'commit' });
    await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(2500);
    if (endonym) {
      const trigger = page.locator('button', { hasText: /English|Türkçe|Français|العربية/ }).last();
      for (let i = 0; i < 5; i++) { try { await trigger.click(); await page.getByText(endonym, { exact: true }).first().click({ timeout: 2000 }); break; } catch { await page.waitForTimeout(500); } }
      await page.waitForTimeout(2500);
    }
    out[code] = await page.evaluate(() => {
      const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        dir: document.documentElement.dir, lang: document.documentElement.lang,
        h1: txt(document.querySelector('h1')),
        subtitle: txt(document.querySelector('h1')?.parentElement?.querySelector('p')),
        combobox: [...document.querySelectorAll('[role=combobox]')].map(txt),
        tabs: [...document.querySelectorAll('[role=tab]')].map(txt),
        tableHeaders: [...document.querySelectorAll('th')].map(txt),
      };
    });
    await ctx.close();
  }
  return out;
}

// ── (3) FİLTRE DOĞRULUĞU (tür + durum) ──
async function filters() {
  const ctx = await browser.newContext({ storageState: AUTH, viewport: { width: 1440, height: 900 }, locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/campaigns/outbound`, { waitUntil: 'commit' });
  await page.getByRole('heading', { level: 1 }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(3000);

  const readRows = () => page.evaluate(() => {
    const trs = [...document.querySelectorAll('tbody tr')];
    const empty = trs.length === 1 && /No campaigns match|No outbound campaigns/i.test(trs[0].innerText);
    return {
      empty,
      count: empty ? 0 : trs.length,
      types: [...new Set(trs.flatMap((tr) => (tr.innerText.match(/\b(VOICE|SMS|EMAIL|WhatsApp)\b/g) || [])))],
      statuses: [...new Set(trs.map((tr) => (tr.querySelectorAll('td')[1]?.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean))],
    };
  });

  const result = { types: {}, statuses: {} };

  // TÜR filtresi
  for (const opt of ['Voice', 'SMS', 'Email', 'WhatsApp', 'All types']) {
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: opt, exact: true }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    result.types[opt] = await readRows();
  }

  // DURUM sekmeleri
  for (const tab of ['All', 'Running', 'Paused']) {
    await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click().catch(() => {});
    await page.waitForTimeout(2000);
    result.statuses[tab] = await readRows();
  }

  await ctx.close();
  return result;
}

const data = { capturedAt: '2026-07-28', structure: await structure(), langs: await langs(), filters: await filters() };
fs.writeFileSync(`${VERI}/exploration.json`, JSON.stringify(data, null, 2));
console.log(JSON.stringify(data, null, 2));
await browser.close();
