// Gönderici Kimlikleri (`/campaigns/sender-ids`) Playwright keşfi.
// Formu/filtreleri açar; submit etmez ve mutation göndermez.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { authStatePath, environment } from '../../../config/environment.js';

const ROOT = 'docs/gonderici-kimlikleri-kesif';
const PATH = '/campaigns/sender-ids';
const API = '/api/v1/sender-ids';

await Promise.all([
  mkdir(`${ROOT}/screenshots`, { recursive: true }),
  mkdir(`${ROOT}/veri`, { recursive: true }),
  mkdir('test-results/investigations', { recursive: true }),
]);

const browser = await chromium.launch();

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  });
}

async function openPage(context) {
  const page = await context.newPage();
  const loaded = page.waitForResponse(
    (response) =>
      response.url().includes(API) &&
      response.request().method() === 'GET' &&
      !response.url().includes('/approved'),
    { timeout: 30_000 }
  );
  await page.goto(`${environment.baseURL}${PATH}`, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await loaded;
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
  await settle(page);
  return page;
}

async function dumpUi(page) {
  return page.evaluate(() => {
    const norm = (value) =>
      (value?.textContent ?? value ?? '').replace(/\s+/g, ' ').trim();
    const visible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    };
    const main = document.querySelector('main') || document.body;
    const describeButton = (button) => ({
      text: norm(button),
      ariaLabel: button.getAttribute('aria-label'),
      title: button.getAttribute('title'),
      disabled: button.disabled,
      iconClasses: [...button.querySelectorAll('svg')].map((svg) =>
        svg.getAttribute('class')
      ),
    });
    const describeDialog = (dialog) => ({
      text: norm(dialog),
      headings: [...dialog.querySelectorAll('h1,h2,h3')].filter(visible).map(norm),
      labels: [...dialog.querySelectorAll('label')].filter(visible).map(norm),
      inputs: [...dialog.querySelectorAll('input')].filter(visible).map((input) => ({
        type: input.type,
        placeholder: input.placeholder,
        ariaLabel: input.getAttribute('aria-label'),
        checked: input.checked,
      })),
      textareas: [...dialog.querySelectorAll('textarea')]
        .filter(visible)
        .map((textarea) => ({
          placeholder: textarea.placeholder,
          ariaLabel: textarea.getAttribute('aria-label'),
        })),
      comboboxes: [...dialog.querySelectorAll('[role=combobox]')]
        .filter(visible)
        .map(norm),
      buttons: [...dialog.querySelectorAll('button')].filter(visible).map(describeButton),
    });
    return {
      url: location.href,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      headings: [...main.querySelectorAll('h1,h2,h3')].filter(visible).map(norm),
      paragraphs: [...main.querySelectorAll('p')].filter(visible).map(norm),
      buttons: [...main.querySelectorAll('button')].filter(visible).map(describeButton),
      comboboxes: [...main.querySelectorAll('[role=combobox]')]
        .filter(visible)
        .map(norm),
      tableHeaders: [...main.querySelectorAll('th')].filter(visible).map(norm),
      rowCount: main.querySelectorAll('tbody tr').length,
      rowStatuses: [...main.querySelectorAll('tbody tr')]
        .map((row) => norm(row))
        .flatMap((text) =>
          text.match(/\b(PENDING|APPROVED|REJECTED|DOCUMENTS_REQUESTED)\b/g) || []
        ),
      dialogs: [...document.querySelectorAll('[role=dialog],[role=alertdialog]')]
        .filter(visible)
        .map(describeDialog),
      documentOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  });
}

const context = await browser.newContext({
  storageState: authStatePath('default'),
  viewport: { width: 1440, height: 900 },
  locale: 'en-US',
});
const network = [];
context.on('response', (response) => {
  if (response.url().includes('/api/v1/')) {
    const url = new URL(response.url());
    network.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
    });
  }
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

const page = await openPage(context);
const structure = await dumpUi(page);
await page.screenshot({ path: `${ROOT}/screenshots/en-default.png`, fullPage: true });

const statusFilter = page.getByRole('combobox');
let statusOptions = [];
if (await statusFilter.count() === 1) {
  await statusFilter.click();
  statusOptions = await page.getByRole('option').allTextContents();
  await page.keyboard.press('Escape');
}

const requestCandidate = structure.buttons.find(({ text, iconClasses }) =>
  text && iconClasses.some((classes) => classes?.includes('lucide-plus'))
);
let requestForm = null;
let senderTypeOptions = [];
if (requestCandidate?.text) {
  const button = page.getByRole('button', {
    name: requestCandidate.text,
    exact: true,
  });
  const requestButtonCount = await button.count();
  if (requestButtonCount > 0) {
    await button.first().click();
    await settle(page);
    requestForm = await dumpUi(page);
    await page.screenshot({ path: `${ROOT}/screenshots/en-request-open.png`, fullPage: true });
    const dialog = page.getByRole('dialog');
    const senderType = dialog.getByRole('combobox');
    if (await senderType.count() === 1) {
      await senderType.click();
      senderTypeOptions = await page.getByRole('option').allTextContents();
      await page.keyboard.press('Escape');
    }
  }
}

await context.tracing.stop({
  path: 'test-results/investigations/sender-ids-discovery.zip',
});
await context.close();

const languages = {};
for (const language of [
  { code: 'en', endonym: null },
  { code: 'tr', endonym: 'Türkçe' },
  { code: 'fr', endonym: 'Français' },
  { code: 'ar', endonym: 'العربية' },
]) {
  const languageContext = await browser.newContext({
    storageState: authStatePath('default'),
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const languagePage = await openPage(languageContext);
  if (language.endonym) {
    const reloaded = languagePage.waitForResponse(
      (response) =>
        response.url().includes(API) &&
        response.request().method() === 'GET' &&
        !response.url().includes('/approved'),
      { timeout: 30_000 }
    );
    const trigger = languagePage
      .locator('button', { hasText: /English|Türkçe|Français|العربية/ })
      .last();
    await trigger.click();
    await languagePage.getByText(language.endonym, { exact: true }).first().click();
    await languagePage.waitForURL((url) => url.searchParams.get('lang') === language.code, {
      timeout: 15_000,
      waitUntil: 'commit',
    });
    await reloaded;
    await languagePage.getByRole('heading', { level: 1 }).waitFor({ timeout: 30_000 });
    await settle(languagePage);
  }
  const list = await dumpUi(languagePage);
  const plus = list.buttons.find(({ text, iconClasses }) =>
    text && iconClasses.some((classes) => classes?.includes('lucide-plus'))
  );
  let form = null;
  if (plus?.text) {
    await languagePage.getByRole('button', { name: plus.text, exact: true }).click();
    await settle(languagePage);
    form = await dumpUi(languagePage);
  }
  languages[language.code] = { list, form };
  await languagePage.screenshot({
    path: `${ROOT}/screenshots/${language.code}.png`,
    fullPage: true,
  });
  await languageContext.close();
}

const responsive = {};
for (const [name, viewport] of Object.entries({
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
})) {
  const responsiveContext = await browser.newContext({
    storageState: authStatePath('default'),
    viewport,
    locale: 'en-US',
  });
  const responsivePage = await openPage(responsiveContext);
  responsive[name] = await dumpUi(responsivePage);
  await responsivePage.screenshot({
    path: `${ROOT}/screenshots/${name}.png`,
    fullPage: true,
  });
  await responsiveContext.close();
}

const output = {
  capturedAt: new Date().toISOString(),
  structure,
  statusOptions,
  requestForm,
  senderTypeOptions,
  languages,
  responsive,
  network: [...new Map(network.map((entry) => [
    `${entry.method} ${entry.path} ${entry.status}`,
    entry,
  ])).values()],
};
await writeFile(
  `${ROOT}/veri/sender-ids-exploration.json`,
  `${JSON.stringify(output, null, 2)}\n`
);
console.log(JSON.stringify(output, null, 2));
await browser.close();
