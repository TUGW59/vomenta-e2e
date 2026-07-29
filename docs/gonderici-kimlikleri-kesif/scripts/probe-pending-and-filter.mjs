// Status filtresi ve bekleyen talep geri çekme UI'ını sunucuya yazmadan gözlemler.
import { chromium } from '@playwright/test';
import { authStatePath, environment } from '../../../config/environment.js';

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: authStatePath('default'),
  viewport: { width: 1440, height: 900 },
});
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

const filterPage = await context.newPage();
const filterRequests = [];
filterPage.on('request', (request) => {
  if (
    request.url().includes('/api/v1/sender-ids') &&
    request.method() === 'GET'
  ) {
    filterRequests.push(request.url());
  }
});
await filterPage.goto(`${environment.baseURL}/campaigns/sender-ids`);
await filterPage.getByRole('heading', { name: 'Sender IDs', exact: true }).waitFor();
const statusFilter = filterPage.getByRole('combobox');
await statusFilter.click();
await filterPage.getByRole('option', { name: 'Approved', exact: true }).click();
await filterPage.evaluate(async () => {
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
});

const pendingPage = await context.newPage();
const syntheticId = '00000000-0000-4000-8000-000000000099';
let deleteRequest = null;
await pendingPage.route('**/api/v1/sender-ids**', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (request.method() === 'GET' && url.pathname === '/api/v1/sender-ids') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          data: [{
            id: syntheticId,
            tenantId: '00000000-0000-4000-8000-000000000010',
            senderId: 'E2EPENDING',
            senderType: 'ALPHANUMERIC',
            status: 'PENDING',
            purpose: 'Playwright rollback probe',
            requestedById: '00000000-0000-4000-8000-000000000020',
            requestedBy: {
              id: '00000000-0000-4000-8000-000000000020',
              firstName: 'Playwright',
              lastName: 'Probe',
              email: 'probe@example.test',
            },
            createdAt: '2026-07-29T10:00:00.000Z',
            updatedAt: '2026-07-29T10:00:00.000Z',
          }],
          hasNextPage: false,
          totalCount: 1,
        },
      }),
    });
  }
  if (
    request.method() === 'DELETE' &&
    url.pathname === `/api/v1/sender-ids/${syntheticId}`
  ) {
    deleteRequest = { method: request.method(), path: url.pathname };
    return route.fulfill({ status: 204 });
  }
  return route.continue();
});
await pendingPage.goto(`${environment.baseURL}/campaigns/sender-ids`);
await pendingPage.getByRole('heading', { name: 'Sender IDs', exact: true }).waitFor();
const row = pendingPage.locator('tbody tr').filter({ hasText: 'E2EPENDING' });
await row.waitFor();
const rowButtons = await row.getByRole('button').evaluateAll((buttons) =>
  buttons.map((button) => ({
    text: button.textContent?.replace(/\s+/g, ' ').trim(),
    ariaLabel: button.getAttribute('aria-label'),
    title: button.getAttribute('title'),
    html: button.outerHTML.slice(0, 500),
  }))
);
if (rowButtons.length > 0) {
  await row.getByRole('button').first().click();
  const dialogs = await pendingPage
    .locator('[role=dialog],[role=alertdialog]')
    .evaluateAll((elements) => elements.map((element) =>
      element.textContent?.replace(/\s+/g, ' ').trim()
    ));
  console.log(JSON.stringify({ filterRequests, rowButtons, dialogs, deleteRequest }, null, 2));
} else {
  console.log(JSON.stringify({ filterRequests, rowButtons, deleteRequest }, null, 2));
}

const emptyPage = await context.newPage();
await emptyPage.route('**/api/v1/sender-ids**', async (route) => {
  const url = new URL(route.request().url());
  if (route.request().method() === 'GET' && url.pathname === '/api/v1/sender-ids') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { data: [], hasNextPage: false, totalCount: 0 },
      }),
    });
  }
  return route.continue();
});
await emptyPage.goto(`${environment.baseURL}/campaigns/sender-ids`);
await emptyPage.getByRole('heading', { name: 'Sender IDs', exact: true }).waitFor();
const emptyMainText = await emptyPage.locator('main').innerText();
console.log(JSON.stringify({ emptyMainText }, null, 2));

await context.tracing.stop({
  path: 'test-results/investigations/sender-ids-pending-filter-probe.zip',
});
await context.close();
await browser.close();
