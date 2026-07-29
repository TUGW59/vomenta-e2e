// Orphan tarayıcı — canlı tenant'ta TEST_ENTITY_PREFIX ("PW_") önekli temizlenmemiş test
// kaydı var mı diye liste sayfalarını tarar. SALT OKUNUR (silmez); bulursa exit 1.
//
// Kullanım: npm run report:orphans   (mutasyon koşusundan SONRA çalıştır)
// Kimlik: playwright/.auth/default.json (auth.setup ile üretilir). BASE_URL .env'den.
//
// Bkz. AGENTS.md → "Mutasyon güvenliği standardı (orphan-sıfır)".
import { chromium } from '@playwright/test';
import { environment, authStatePath } from '../config/environment.js';
import { TEST_ENTITY_PREFIX } from '../tests/data/factories.js';

// Test verisi barındırabilen liste rotaları (genişletilebilir).
const SCAN = [
  { path: '/contacts', label: 'Kişiler (People)' },
  // ileride: { path: '/contacts/companies', label: 'Şirketler' } vb.
];

const authFile = authStatePath('default');
const prefix = TEST_ENTITY_PREFIX;
let hadError = false;
let totalOrphans = 0;

const browser = await chromium.launch();
let context;
try {
  context = await browser.newContext({ storageState: authFile, viewport: { width: 1440, height: 900 } });
} catch (e) {
  console.error(`Oturum dosyası okunamadı (${authFile}). Önce 'npm run test:smoke:auth' ile giriş üretin.`);
  await browser.close();
  process.exit(2);
}
const page = await context.newPage();

for (const { path, label } of SCAN) {
  try {
    await page.goto(`${environment.baseURL}${path}`, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const search = page.getByPlaceholder(/search|ara|rechercher|بحث/i).first();
    await search.waitFor({ state: 'visible', timeout: 30000 });
    await search.fill(prefix);
    // aramanın oturması için satırların stabilize olmasını bekle (sabit bekleme yok)
    await page.waitForLoadState('networkidle').catch(() => {});
    const rows = page.getByRole('row').filter({ hasText: prefix });
    const count = await rows.count();
    totalOrphans += count;
    if (count > 0) {
      hadError = true;
      const names = (await rows.allInnerTexts()).map((s) => s.replace(/\s+/g, ' ').trim().slice(0, 50));
      console.error(`❌ ${label} (${path}): '${prefix}' önekli ${count} ORPHAN kayıt:\n   - ${names.join('\n   - ')}`);
    } else {
      console.log(`✅ ${label} (${path}): '${prefix}' önekli orphan yok.`);
    }
  } catch (e) {
    hadError = true;
    console.error(`⚠️  ${label} (${path}) taranamadı: ${String(e).slice(0, 160)}`);
  }
}

await browser.close();

if (hadError) {
  console.error(`\nToplam ${totalOrphans} orphan. Bunlar bir mutasyon koşusunun temizlenmemiş kalıntısıdır — elle veya cleanup düzeltilerek silinmelidir.`);
  process.exit(1);
}
console.log(`\nTüm taranan rotalar temiz ('${prefix}' önekli kayıt yok).`);
