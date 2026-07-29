// Şablonlar (`/campaigns/templates`) için Playwright keşfi.
// Listeyi ve create UI'ını gözlemler; submit etmez, hiçbir mutation göndermez.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { authStatePath, environment } from '../../../config/environment.js';

const BASE = environment.baseURL;
const AUTH = authStatePath('default');
const ROOT = 'docs/sablonlar-kesif';

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

async function openTemplates(context) {
  const page = await context.newPage();
  const templatesResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/channels/templates/sms') &&
      response.request().method() === 'GET',
    { timeout: 30_000 }
  );
  await page.goto(`${BASE}/campaigns/templates`, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await templatesResponse;
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
    return {
      url: location.href,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      headings: [...main.querySelectorAll('h1,h2,h3')]
        .filter(visible)
        .map(norm),
      buttons: [...main.querySelectorAll('button')]
        .filter(visible)
        .map((button) => ({
          text: norm(button.textContent),
          ariaLabel: button.getAttribute('aria-label'),
          title: button.getAttribute('title'),
          disabled: button.disabled,
          iconClasses: [...button.querySelectorAll('svg')].map((svg) =>
            svg.getAttribute('class')
          ),
        })),
      links: [...main.querySelectorAll('a')]
        .filter(visible)
        .map((link) => ({
          text: norm(link.textContent),
          href: link.getAttribute('href'),
        })),
      inputs: [...main.querySelectorAll('input')]
        .filter(visible)
        .map((input) => ({
          type: input.type,
          placeholder: input.placeholder,
          ariaLabel: input.getAttribute('aria-label'),
        })),
      textareas: [...main.querySelectorAll('textarea')]
        .filter(visible)
        .map((textarea) => ({
          placeholder: textarea.placeholder,
          ariaLabel: textarea.getAttribute('aria-label'),
        })),
      labels: [...main.querySelectorAll('label')].filter(visible).map(norm),
      comboboxes: [...main.querySelectorAll('[role=combobox]')]
        .filter(visible)
        .map(norm),
      tabs: [...main.querySelectorAll('[role=tab]')]
        .filter(visible)
        .map((tab) => ({
          text: norm(tab.textContent),
          selected: tab.getAttribute('aria-selected'),
        })),
      dialogs: [...document.querySelectorAll('[role=dialog],[role=alertdialog]')]
        .filter(visible)
        .map(norm),
      tableHeaders: [...main.querySelectorAll('th')].filter(visible).map(norm),
      hasRows: main.querySelectorAll('tbody tr').length > 0,
      documentOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      dialogDetails: [...document.querySelectorAll('[role=dialog],[role=alertdialog]')]
        .filter(visible)
        .map((dialog) => ({
          text: norm(dialog.textContent),
          labels: [...dialog.querySelectorAll('label')].filter(visible).map(norm),
          inputs: [...dialog.querySelectorAll('input')].filter(visible).map((input) => ({
            type: input.type,
            placeholder: input.placeholder,
            ariaLabel: input.getAttribute('aria-label'),
          })),
          textareas: [...dialog.querySelectorAll('textarea')]
            .filter(visible)
            .map((textarea) => ({
              placeholder: textarea.placeholder,
              ariaLabel: textarea.getAttribute('aria-label'),
            })),
          buttons: [...dialog.querySelectorAll('button')].filter(visible).map((button) => ({
            text: norm(button.textContent),
            ariaLabel: button.getAttribute('aria-label'),
            disabled: button.disabled,
            iconClasses: [...button.querySelectorAll('svg')].map((svg) =>
              svg.getAttribute('class')
            ),
          })),
        })),
    };
  });
}

const context = await browser.newContext({
  storageState: AUTH,
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
await context.tracing.start({
  screenshots: true,
  snapshots: true,
  sources: true,
});

const page = await openTemplates(context);
const structure = await dumpUi(page);
await page.screenshot({
  path: `${ROOT}/screenshots/en-default.png`,
  fullPage: true,
});

const createCandidate = structure.buttons.find(({ text }) =>
  /\b(new|create|add)\b.*\btemplate\b/i.test(text)
);
let createFlow = null;
const actionStates = {};
if (createCandidate?.text) {
  const createButton = page.getByRole('button', {
    name: createCandidate.text,
    exact: true,
  });
  if (await createButton.count() === 1) {
    await createButton.click();
    await settle(page);
    createFlow = await dumpUi(page);
    await page.screenshot({
      path: `${ROOT}/screenshots/en-create-open.png`,
      fullPage: true,
    });
    const close = page.getByRole('button', { name: 'Close', exact: true });
    if (await close.count() === 1) await close.click();
  }
}

const editButton = page.locator('tbody button:has(svg.lucide-pencil)');
if (await editButton.count() > 0) {
  await editButton.first().click();
  await settle(page);
  actionStates.editOpen = await dumpUi(page);
  const close = page.getByRole('button', { name: 'Close', exact: true });
  if (await close.count() === 1) await close.click();
}

const deleteButton = page.locator('tbody button:has(svg.lucide-trash2)');
if (await deleteButton.count() > 0) {
  await deleteButton.first().click();
  await settle(page);
  actionStates.deleteConfirm = await dumpUi(page);
  const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
  if (await cancel.count() === 1) await cancel.click();
}

await context.tracing.stop({
  path: 'test-results/investigations/templates-discovery.zip',
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
    storageState: AUTH,
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
  });
  const languagePage = await openTemplates(languageContext);
  if (language.endonym) {
    const trigger = languagePage
      .locator('button', { hasText: /English|Türkçe|Français|العربية/ })
      .last();
    await trigger.click();
    const option = languagePage.getByText(language.endonym, { exact: true }).first();
    await option.click();
    await languagePage.waitForURL((url) => url.searchParams.get('lang') === language.code, {
      timeout: 15_000,
      waitUntil: 'commit',
    });
    await languagePage.waitForLoadState('domcontentloaded').catch(() => {});
    await languagePage.getByRole('heading', { level: 1 }).waitFor({
      timeout: 30_000,
    });
    await settle(languagePage);
  }
  const list = await dumpUi(languagePage);
  const languageCreateCandidate = list.buttons.find(({ text, iconClasses }) =>
    text && iconClasses.some((classes) => classes?.includes('lucide-plus'))
  );
  let create = null;
  if (languageCreateCandidate?.text) {
    const createButton = languagePage.getByRole('button', {
      name: languageCreateCandidate.text,
      exact: true,
    });
    if (await createButton.count() === 1) {
      await createButton.click();
      await settle(languagePage);
      create = await dumpUi(languagePage);
    }
  }
  languages[language.code] = { list, create };
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
    storageState: AUTH,
    viewport,
    locale: 'en-US',
  });
  const responsivePage = await openTemplates(responsiveContext);
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
  createFlow,
  actionStates,
  languages,
  responsive,
  network: [...new Map(network.map((entry) => [
    `${entry.method} ${entry.path} ${entry.status}`,
    entry,
  ])).values()],
};
await writeFile(
  `${ROOT}/veri/templates-exploration.json`,
  `${JSON.stringify(output, null, 2)}\n`
);
console.log(JSON.stringify(output, null, 2));
await browser.close();
