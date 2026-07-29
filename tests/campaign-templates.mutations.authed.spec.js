// @ts-check
import { test, expect } from './fixtures/test.js';
import { buildSmsTemplate } from './data/factories.js';
import { CampaignTemplatesPage } from './pages/CampaignTemplatesPage.js';

test.describe('SMS Şablonları — create/edit/delete @regression @mutation', () => {
  test.describe.configure({ retries: 0 });

  test('L3 görev OK: Playwright şablonu oluşturur, doğrular, günceller ve orphan bırakmadan siler', async ({
    app,
    mutationGuard,
    page,
    testEntity,
  }) => {
    mutationGuard('SMS şablonu create/edit/delete — ayrılmış test tenantı');
    const data = buildSmsTemplate();
    const templates = app.campaignTemplates;

    let createdId = null;
    await templates.open();
    const prefixedRows = () => templates.rows.filter({ hasText: data.prefix });
    expect(
      await prefixedRows().count(),
      'mutation başlamadan önce e2e-sms-template orphan olmamalı'
    ).toBe(0);

    await testEntity.create({
      label: data.name,
      cleanup: async () => {
        await templates.open();
        if (await templates.row(data.name).count() === 0) return;
        const dialog = await templates.openDelete(data.name);
        const rollback = page.waitForResponse(
          (response) =>
            response.url().includes(CampaignTemplatesPage.API.list) &&
            response.request().method() === 'DELETE' &&
            response.status() === 204,
          { timeout: 15_000 }
        );
        await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
        await rollback;
        await expect(templates.row(data.name)).toHaveCount(0);
      },
      action: async () => {
        const created = page.waitForResponse(
          (response) =>
            response.url().includes(CampaignTemplatesPage.API.list) &&
            response.request().method() === 'POST' &&
            response.status() === 201,
          { timeout: 15_000 }
        );
        const dialog = await templates.openCreate();
        await templates.nameInput().fill(data.name);
        await templates.bodyInput().fill(data.content);
        await dialog.getByRole('button', { name: 'Create', exact: true }).click();
        const response = await created;
        const json = await response.json();
        createdId = json.data?.id;
        expect(createdId, 'POST 201 yanıtında template id bulunmalı').toMatch(
          /^[0-9a-f-]{36}$/i
        );
      },
    });

    const createdRow = templates.row(data.name);
    await expect(createdRow).toHaveCount(1);
    await expect(createdRow.getByText(data.content, { exact: true })).toBeVisible();

    const editDialog = await templates.openEdit(data.name);
    const updated = page.waitForResponse(
      (response) =>
        response.url().endsWith(CampaignTemplatesPage.API.item(createdId)) &&
        response.request().method() === 'PATCH' &&
        response.status() === 200,
      { timeout: 15_000 }
    );
    await templates.bodyInput().fill(data.updatedContent);
    await editDialog.getByRole('button', { name: 'Save', exact: true }).click();
    await updated;
    await expect(templates.row(data.name).getByText(data.updatedContent, { exact: true }))
      .toBeVisible();

    const deleteDialog = await templates.openDelete(data.name);
    const deleted = page.waitForResponse(
      (response) =>
        response.url().endsWith(CampaignTemplatesPage.API.item(createdId)) &&
        response.request().method() === 'DELETE' &&
        response.status() === 204,
      { timeout: 15_000 }
    );
    await deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await deleted;
    await expect(templates.row(data.name)).toHaveCount(0);
    createdId = null;

    expect(
      await prefixedRows().count(),
      'mutation sonunda e2e-sms-template orphan kalmamalı'
    ).toBe(0);
  });
});
