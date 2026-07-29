// @ts-check
import { test, expect } from './fixtures/test.js';
import { buildSenderIdRequest } from './data/factories.js';
import { CampaignSenderIdsPage } from './pages/CampaignSenderIdsPage.js';

test.describe('Gönderici Kimlikleri — talep + rollback @regression @mutation', () => {
  test.describe.configure({ retries: 0 });

  test('L3 görev OK: Playwright talep oluşturur, PENDING doğrular ve orphan bırakmadan geri çeker', async ({
    app,
    mutationGuard,
    page,
    senderIdsApi,
    testEntity,
  }) => {
    mutationGuard('Sender ID talebi oluşturma + resmî DELETE rollback — ayrılmış test tenantı');
    const data = buildSenderIdRequest();
    const senderIds = app.campaignSenderIds;
    let createdId = null;

    const prefixedRequests = async () => {
      const response = await senderIdsApi.list();
      const json = await response.json();
      const items = json.data?.data ?? [];
      return items.filter((item) => item.senderId?.startsWith(data.prefix));
    };

    await senderIds.open();
    expect(
      await prefixedRequests(),
      'mutation başlamadan önce E2E Sender ID orphan olmamalı'
    ).toEqual([]);
    await testEntity.create({
      label: data.senderId,
      cleanup: async () => {
        if (!createdId) return;
        await senderIdsApi.delete(createdId);
        createdId = null;
      },
      action: async () => {
        const created = page.waitForResponse((response) => {
          const url = new URL(response.url());
          return url.pathname === CampaignSenderIdsPage.API.list &&
            response.request().method() === 'POST' &&
            response.status() === 201;
        });
        const dialog = await senderIds.openRequest();
        await senderIds.senderIdInput().fill(data.senderId);
        await senderIds.purposeInput().fill(data.purpose);
        await dialog.getByRole('button', { name: 'Submit Request', exact: true }).click();
        const response = await created;
        const json = await response.json();
        createdId = json.data?.id;
        expect(createdId, 'POST 201 yanıtında Sender ID request id bulunmalı').toMatch(
          /^[0-9a-f-]{36}$/i
        );
        expect(json.data).toMatchObject({
          senderId: data.senderId,
          senderType: data.senderType,
          status: 'PENDING',
          purpose: data.purpose,
        });
      },
    });

    const persisted = await senderIdsApi.get(createdId);
    expect((await persisted.json()).data).toMatchObject({
      senderId: data.senderId,
      senderType: data.senderType,
      status: 'PENDING',
      purpose: data.purpose,
    });

    await senderIds.open();
    const row = senderIds.row(data.senderId);
    await expect(row).toHaveCount(1);
    await expect(row.getByText('PENDING', { exact: true })).toBeVisible();
    await expect(row.getByText(data.purpose, { exact: true })).toBeVisible();

    await senderIdsApi.delete(createdId);
    createdId = null;
    await senderIds.open();
    await expect(senderIds.row(data.senderId)).toHaveCount(0);
    expect(
      await prefixedRequests(),
      'mutation sonunda E2E Sender ID orphan kalmamalı'
    ).toEqual([]);
  });
});
