// Gönderici Kimlikleri form sözleşmesini mutasyon göndermeden gözlemler.
import { chromium } from '@playwright/test';
import { authStatePath, environment } from '../../../config/environment.js';

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: authStatePath('default'),
  viewport: { width: 1440, height: 900 },
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();
const requests = [];
page.on('request', (request) => {
  if (request.url().includes('/api/v1/sender-ids')) {
    requests.push({
      method: request.method(),
      path: new URL(request.url()).pathname,
      body: request.postDataJSON?.() ?? null,
    });
  }
});

await page.goto(`${environment.baseURL}/campaigns/sender-ids`);
await page.getByRole('heading', { name: 'Sender IDs', exact: true }).waitFor();
await page.getByRole('button', { name: 'Request Sender ID', exact: true }).click();
const dialog = page.getByRole('dialog');
await dialog.waitFor();

const allFields = await dialog.locator('input, textarea, [role=combobox]').evaluateAll((fields) =>
  fields.map((field) => ({
    tag: field.tagName,
    type: field.getAttribute('type'),
    placeholder: field.getAttribute('placeholder'),
    role: field.getAttribute('role'),
    name: field.getAttribute('name'),
    required: field.hasAttribute('required'),
    ariaInvalid: field.getAttribute('aria-invalid'),
  }))
);
const inputs = dialog.locator('input, textarea');
const labelAssociations = [];
for (let index = 0; index < await inputs.count(); index += 1) {
  labelAssociations.push(await inputs.nth(index).evaluate((field) => ({
    tag: field.tagName,
    placeholder: field.getAttribute('placeholder'),
    labels: [...(field.labels ?? [])].map((label) => label.textContent?.trim()),
  })));
}

await dialog.getByRole('button', { name: 'Submit Request', exact: true }).click();
await page.evaluate(async () => {
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
});
const validationText = await dialog.locator('text=/required|zorunlu|requis|مطلوب/i')
  .allTextContents();
const afterSubmit = await dialog.locator('input, textarea').evaluateAll((fields) =>
  fields.map((field) => ({
    tag: field.tagName,
    type: field.getAttribute('type'),
    validationMessage: field.validationMessage,
    valid: field.validity?.valid,
    ariaInvalid: field.getAttribute('aria-invalid'),
  }))
);

const comboboxes = dialog.getByRole('combobox');
const comboboxCount = await comboboxes.count();
let senderTypeOptions = [];
if (comboboxCount > 0) {
  await comboboxes.first().click();
  senderTypeOptions = await page.getByRole('option').allTextContents();
  await page.getByRole('option', { name: 'Alphanumeric', exact: true }).click();
}

console.log(JSON.stringify({
  comboboxCount,
  senderTypeOptions,
  allFields,
  labelAssociations,
  validationText,
  afterSubmit,
  requests,
}, null, 2));

await context.tracing.stop({
  path: 'test-results/investigations/sender-ids-form-probe.zip',
});
await context.close();
await browser.close();
