const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

async function scan(page, label, path, useAuth) {
  await page.goto('https://app.vomenta.com' + path, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(3000);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const byImpact = {};
  for (const v of results.violations) byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
  console.log(`\n===== ${label} (${path}) =====`);
  console.log('ihlal sayısı (kural bazında):', results.violations.length, '| impact dağılımı:', JSON.stringify(byImpact));
  const severe = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  console.log('critical/serious kurallar:', JSON.stringify(severe.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}`)));
}

(async () => {
  const browser = await chromium.launch();
  // Girişsiz: login sayfası
  const anon = await browser.newContext();
  await scan(await anon.newPage(), 'Login (girişsiz)', '/');
  await anon.close();
  // Girişli: panel & contacts
  const ctx = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
  const page = await ctx.newPage();
  await scan(page, 'Dashboard', '/');
  await scan(page, 'Contacts', '/contacts');
  await browser.close();
})().catch((e) => { console.error('HATA:', e.message); process.exit(1); });
