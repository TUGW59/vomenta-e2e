// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { CampaignSenderIdsPage } from './pages/CampaignSenderIdsPage.js';
import {
  assertNoHorizontalOverflow,
  expectDialogKeyboard,
  expectNoOverflowAtViewports,
  expectNoSevereA11y,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * KAMPANYALAR → GÖNDERİCİ KİMLİKLERİ (`/campaigns/sender-ids`)
 * Keşif: docs/gonderici-kimlikleri-kesif/NOTLAR.md
 *
 * Bu dosya prod'a yazmaz: POST/DELETE/upload L2 kontrolleri route ile bloklanır.
 * Kalıcı create + API rollback yalnız opt-in mutation spec'indedir.
 */
const I18N = CampaignSenderIdsPage.I18N;
const SYNTHETIC_ID = '00000000-0000-4000-8000-000000000099';

function senderList(items) {
  return JSON.stringify({
    success: true,
    data: { data: items, hasNextPage: false, totalCount: items.length },
  });
}

function syntheticPending(senderId = 'E2EPENDING') {
  return {
    id: SYNTHETIC_ID,
    tenantId: '00000000-0000-4000-8000-000000000010',
    senderId,
    senderType: 'ALPHANUMERIC',
    status: 'PENDING',
    purpose: 'Playwright route probe',
    requestedById: '00000000-0000-4000-8000-000000000020',
    requestedBy: {
      id: '00000000-0000-4000-8000-000000000020',
      firstName: 'Playwright',
      lastName: 'Probe',
      email: 'probe@example.test',
    },
    createdAt: '2026-07-29T10:00:00.000Z',
    updatedAt: '2026-07-29T10:00:00.000Z',
  };
}

async function mockPendingList(page) {
  await page.route(`**${CampaignSenderIdsPage.API.list}**`, async (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().method() === 'GET' &&
      url.pathname === CampaignSenderIdsPage.API.list
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: senderList([syntheticPending()]),
      });
    }
    return route.continue();
  });
}

test.describe('Gönderici Kimlikleri — yapı', () => {
  test('başlık, açıklama, durum filtresi ve tablo sözleşmesi görünür @smoke @critical', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(senderIds.heading).toHaveText(I18N.en.heading);
    await expect(senderIds.page.getByText(I18N.en.subtitle, { exact: true })).toBeVisible();
    await expect(senderIds.requestButton()).toBeVisible();
    await expect(senderIds.statusFilter).toHaveText(I18N.en.allStatus);
    for (const header of I18N.en.headers) {
      await expect(
        senderIds.table.getByRole('columnheader', { name: header, exact: true })
      ).toBeVisible();
    }
  });

  test('tablo gerçek iş değerlerini render ediyor @smoke', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(senderIds.rows.first()).toBeVisible();
    const cells = (await senderIds.rows.first().getByRole('cell').allTextContents())
      .map((value) => value.trim());
    expect(cells).toHaveLength(8);
    expect(cells[0], 'Sender ID boş olmamalı').not.toBe('');
    expect(cells[1], 'Tür boş olmamalı').toMatch(/ALPHANUMERIC|NUMERIC|SHORTCODE/);
    expect(cells[2], 'Durum boş olmamalı').toMatch(
      /PENDING|APPROVED|REJECTED|DOCUMENTS_REQUESTED/
    );
    expect(cells[4], 'Talep eden boş olmamalı').not.toBe('');
    expect(cells[6], 'Oluşturulma tarihi boş olmamalı').not.toBe('');
  });
});

test.describe('Gönderici Kimlikleri — dört dil @i18n', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] liste ve talep formu gözlemlenen çevirilerle eşleşiyor`, async ({ app }) => {
      const senderIds = app.campaignSenderIds;
      await senderIds.open();
      if (t.endonym) await senderIds.switchLanguage(t.endonym);
      await expect(senderIds.heading).toHaveText(t.heading, { timeout: 15_000 });
      await expect(senderIds.page.locator('html')).toHaveAttribute('lang', code);
      await expect(senderIds.page.locator('html')).toHaveAttribute('dir', t.dir);
      await expect(senderIds.page.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(senderIds.statusFilter).toHaveText(t.allStatus);
      for (const header of t.headers) {
        await expect(
          senderIds.table.getByRole('columnheader', { name: header, exact: true })
        ).toBeVisible();
      }

      const dialog = await senderIds.openRequest(t.request);
      await expect(dialog.getByRole('heading', { name: t.request, exact: true })).toBeVisible();
      await expect(dialog.getByText(t.formSubtitle, { exact: true })).toBeVisible();
      await expect(dialog.getByText(t.senderLabel, { exact: true })).toBeVisible();
      await expect(dialog.getByText(t.senderHelp, { exact: true })).toBeVisible();
      await expect(dialog.getByText(t.typeLabel, { exact: true })).toBeVisible();
      await expect(senderIds.senderType()).toHaveText(t.defaultType);
      await expect(dialog.getByText(t.purposeLabel, { exact: true })).toBeVisible();
      await expect(senderIds.purposeInput(t.purposePlaceholder)).toBeVisible();
      await expect(dialog.getByText(t.documentsLabel, { exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: t.chooseFiles, exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: t.cancel, exact: true })).toBeVisible();
      await expect(senderIds.submitButton(t.submit)).toBeEnabled();
    });

    test(`[${code}] form etiketleri alanlarla programatik ilişkili @a11y @known-bug`, async ({ app }) => {
      test.fail();
      const senderIds = app.campaignSenderIds;
      await senderIds.open();
      if (t.endonym) await senderIds.switchLanguage(t.endonym);
      await expect(senderIds.heading).toHaveText(t.heading, { timeout: 15_000 });
      await senderIds.openRequest(t.request);
      const labels = await Promise.all([
        senderIds.senderIdInput().evaluate((input) => input.labels?.length ?? 0),
        senderIds.purposeInput(t.purposePlaceholder)
          .evaluate((textarea) => textarea.labels?.length ?? 0),
        senderIds.fileInput().evaluate((input) => input.labels?.length ?? 0),
      ]);
      expect(labels).toEqual([1, 1, 1]);
    });
  }

  for (const [code, t] of Object.entries(I18N).filter(([key]) => key !== 'en')) {
    test(`[${code}] Sender ID placeholder'ı İngilizce kalmıyor @known-bug`, async ({ app }) => {
      test.fail();
      const senderIds = app.campaignSenderIds;
      await senderIds.open();
      await senderIds.switchLanguage(t.endonym);
      await expect(senderIds.heading).toHaveText(t.heading, { timeout: 15_000 });
      await senderIds.openRequest(t.request);
      await expect(senderIds.senderIdInput()).not.toHaveAttribute(
        'placeholder',
        I18N.en.senderPlaceholder
      );
    });

    test(`[${code}] kapatma düğmesi İngilizce kalmıyor @known-bug`, async ({ app }) => {
      test.fail();
      const senderIds = app.campaignSenderIds;
      await senderIds.open();
      await senderIds.switchLanguage(t.endonym);
      await expect(senderIds.heading).toHaveText(t.heading, { timeout: 15_000 });
      const dialog = await senderIds.openRequest(t.request);
      await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
    });
  }
});

test.describe('Kontrol: durum filtresi @regression', () => {
  test('L1 tıklama OK: gözlemlenen beş durum seçeneği açılıyor', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await senderIds.statusFilter.click();
    await expect(senderIds.page.getByRole('option')).toHaveText([
      'All Status', 'Pending', 'Approved', 'Rejected', 'Docs Requested',
    ]);
  });

  test('L2 arka plan OK: Approved doğru filtreli GET isteğini gönderiyor', async ({ app, page }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const request = page.waitForRequest((candidate) => {
      const url = new URL(candidate.url());
      return candidate.method() === 'GET' &&
        url.pathname === CampaignSenderIdsPage.API.list &&
        url.searchParams.has('filters');
    });
    await senderIds.selectStatus('Approved');
    const url = new URL((await request).url());
    expect(JSON.parse(url.searchParams.get('filters') ?? '{}')).toEqual({
      status: 'APPROVED',
    });
  });

  test('L3 görev OK: Approved sonucu yalnız APPROVED kayıtları gösteriyor', async ({ app, page }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const loaded = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return response.request().method() === 'GET' &&
        url.pathname === CampaignSenderIdsPage.API.list &&
        url.searchParams.get('filters')?.includes('APPROVED') &&
        response.ok();
    });
    await senderIds.selectStatus('Approved');
    await loaded;
    const texts = await senderIds.rows.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.every((text) => text.includes('APPROVED'))).toBe(true);
  });
});

test.describe('Kontrol: talep formu / tür / iptal @regression', () => {
  test('L1 tıklama OK: Request Sender ID formu ve alanları açılıyor', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const dialog = await senderIds.openRequest();
    await expect(senderIds.senderIdInput()).toBeVisible();
    await expect(senderIds.senderType()).toBeVisible();
    await expect(senderIds.purposeInput()).toBeVisible();
    await expect(senderIds.fileInput()).toBeAttached();
    await expect(dialog.getByRole('button', { name: 'Submit Request' })).toBeEnabled();
  });

  test('L1 tıklama OK: tür seçicisi üç gözlemlenen seçeneği sunuyor ve değişiyor', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await senderIds.openRequest();
    await senderIds.senderType().click();
    await expect(senderIds.page.getByRole('option')).toHaveText([
      'Alphanumeric', 'Numeric', 'Shortcode',
    ]);
    await senderIds.page.getByRole('option', { name: 'Shortcode', exact: true }).click();
    await expect(senderIds.senderType()).toHaveText('Shortcode');
  });

  // L2 N/A: form açma, alan doldurma, tür seçme, Cancel ve Close istemci tarafıdır.
  for (const control of ['Cancel', 'Close']) {
    test(`L3 görev OK: ${control} istek oluşturmadan formu kapatıyor`, async ({ app }) => {
      const senderIds = app.campaignSenderIds;
      await senderIds.open();
      const before = await senderIds.rows.count();
      const dialog = await senderIds.openRequest();
      await dialog.getByRole('button', { name: control, exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(senderIds.rows).toHaveCount(before);
    });
  }

  test('L3 görev OK: boş zorunlu alan kullanıcıya doğrulama sonucu veriyor @known-bug', async ({ app }) => {
    test.fail();
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await senderIds.openRequest();
    await senderIds.submitButton().click();
    await expect(senderIds.senderIdInput()).toHaveAttribute('aria-invalid', 'true');
  });

  test('L1 tıklama OK: Choose Files sistem dosya seçicisini açıyor', async ({ app, page }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const dialog = await senderIds.openRequest();
    const chooser = page.waitForEvent('filechooser');
    await dialog.getByRole('button', { name: 'Choose Files', exact: true }).click();
    await chooser;
  });

  // Dosya L2/L3 N/A: upload yalnız önce kalıcı talep oluşturulunca güvenle doğrulanabilir;
  // bu bölümde prod'a dosya veya kayıt yazılmaz.
});

test.describe('Kontrol: Submit Request @regression', () => {
  test('L1 tıklama OK: route-mock 201 sonrası form kapanıyor', async ({ app, page }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await page.route(`**${CampaignSenderIdsPage.API.list}`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      const payload = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...syntheticPending(payload.senderId), ...payload },
        }),
      });
    });
    const dialog = await senderIds.openRequest();
    await senderIds.senderIdInput().fill('E2EROUTE');
    await senderIds.purposeInput().fill('Playwright route capture');
    await senderIds.submitButton().click();
    await expect(dialog).toBeHidden();
  });

  test('L2 arka plan OK: doğru POST DTO gönderiliyor; prod yazımı route ile bloklanıyor', async ({ app, page }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    let captured;
    await page.route(`**${CampaignSenderIdsPage.API.list}`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      captured = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...syntheticPending(captured.senderId), ...captured },
        }),
      });
    });
    await senderIds.openRequest();
    await senderIds.senderIdInput().fill('E2ECONTRACT');
    await senderIds.selectSenderType('Shortcode');
    await senderIds.purposeInput().fill('Contract probe');
    await senderIds.submitButton().click();
    await expect.poll(() => captured).toEqual({
      senderId: 'E2ECONTRACT',
      senderType: 'SHORTCODE',
      purpose: 'Contract probe',
    });
  });

  // L3 kalıcı PENDING sonuç + API rollback: campaign-sender-ids.mutations.authed.spec.js
});

test.describe('Kontrol: bekleyen talep eylemleri @regression', () => {
  test('L1 görev OK: PENDING kayıtta Upload diyaloğu kaynak Sender ID ile tutarlı', async ({ app, page }) => {
    await mockPendingList(page);
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const row = senderIds.row('E2EPENDING');
    await row.getByRole('button', { name: 'Upload', exact: true }).click();
    await expect(
      senderIds.page.getByRole('heading', {
        name: 'Upload Documents for "E2EPENDING"',
        exact: true,
      })
    ).toBeVisible();
  });

  test('L3 görev OK: PENDING talep UI üzerinden geri çekilebilir @known-bug', async ({ app, page }) => {
    test.fail();
    await mockPendingList(page);
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(
      senderIds.row('E2EPENDING').getByRole('button', { name: /withdraw|cancel request/i })
    ).toBeVisible();
  });

  // Upload L2/L3 N/A: dosya yükleme kalıcı kayıt gerektirir; gerçek tenant'a sahte belge yazılmaz.
  // Geri çekme backend L2'si OpenAPI DELETE /sender-ids/{id}; UI kontrolü olmadığı bulgudur.
});

test.describe('Gönderici Kimlikleri — a11y @a11y', () => {
  test('liste görünümünde yeni ciddi/kritik axe ihlali yok', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expectNoSevereA11y(senderIds.page);
  });

  test('talep formunda yeni ciddi/kritik axe ihlali yok', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await senderIds.openRequest();
    await expectNoSevereA11y(senderIds.page);
  });
});

test.describe('Gönderici Kimlikleri — layout @layout', () => {
  test('masaüstü/tablet/mobil genişliklerinde yatay taşma yok', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/campaigns/sender-ids');
  });

  test('Arapça RTL mobilde yatay taşma yok', async ({ app, page }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await senderIds.switchLanguage(I18N.ar.endonym);
    await expect(senderIds.heading).toHaveText(I18N.ar.heading, { timeout: 15_000 });
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForUiToSettle(page);
    await assertNoHorizontalOverflow(page);
  });
});

test.describe('Gönderici Kimlikleri — clean @clean', () => {
  test('liste yüklenirken console/ağ hatası yok', async ({ app, diagnostics }) => {
    await app.campaignSenderIds.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('Gönderici Kimlikleri — error path @errorpath', () => {
  test('L1 tıklama OK: liste 500 dönerse açıklayıcı hata ve Retry görünür', async ({ app, page }) => {
    await mockApi(page, `**${CampaignSenderIdsPage.API.list}**`, {
      status: 500,
      body: '{"success":false}',
    });
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(senderIds.heading).toHaveText(I18N.en.heading);
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    await expect(
      page.getByText('An unexpected error occurred. Please try again.', { exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    await expect(page.getByText('No sender IDs found', { exact: true })).toBeVisible();
  });

  test('L2 arka plan OK: Retry liste GET isteğini yeniden gönderiyor', async ({ app, page }) => {
    await mockApi(page, `**${CampaignSenderIdsPage.API.list}**`, {
      status: 500,
      body: '{"success":false}',
    });
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const retried = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return request.method() === 'GET' &&
        url.pathname === CampaignSenderIdsPage.API.list;
    });
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await retried;
  });

  test('L3 görev OK: Retry başarılı yanıtta hatayı kaldırıp güncel boş sonucu gösteriyor', async ({ app, page }) => {
    let callCount = 0;
    let recover = false;
    await page.route(`**${CampaignSenderIdsPage.API.list}**`, async (route) => {
      const url = new URL(route.request().url());
      if (
        route.request().method() !== 'GET' ||
        url.pathname !== CampaignSenderIdsPage.API.list
      ) {
        return route.continue();
      }
      callCount += 1;
      return route.fulfill({
        status: recover ? 200 : 500,
        contentType: 'application/json',
        body: recover ? senderList([]) : '{"success":false}',
      });
    });
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    const beforeRetry = callCount;
    recover = true;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeHidden();
    await expect(page.getByText('No sender IDs found', { exact: true })).toBeVisible();
    expect(callCount).toBeGreaterThan(beforeRetry);
  });

  test('liste boş dönerse gözlemlenen boş-durum render ediyor', async ({ app, page }) => {
    await mockApi(page, `**${CampaignSenderIdsPage.API.list}**`, {
      status: 200,
      body: senderList([]),
    });
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(senderIds.page.getByText('No sender IDs found', { exact: true })).toBeVisible();
  });
});

test.describe('Gönderici Kimlikleri — keyboard @keyboard', () => {
  test('talep diyaloğu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const dialog = await senderIds.openRequest();
    await expectDialogKeyboard(senderIds.page, dialog);
  });
});

test.describe('Gönderici Kimlikleri — deeplink @deeplink', () => {
  test('rota doğrudan açılınca başlık ve tablo yükleniyor', async ({ app }) => {
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    await expect(senderIds.shell.loginHeading).toBeHidden();
    await expect(senderIds.heading).toHaveText(I18N.en.heading);
    await expect(senderIds.table).toBeVisible();
  });
});

test.describe('Gönderici Kimlikleri — visual @visual', () => {
  test('talep diyaloğu görsel sözleşmesi', async ({ app }) => {
    test.skip(environment.isCI, 'Görsel baseline darwin-yerel üretilir.');
    const senderIds = app.campaignSenderIds;
    await senderIds.open();
    const dialog = await senderIds.openRequest();
    await waitForUiToSettle(senderIds.page);
    await expect(dialog).toHaveScreenshot('request-sender-id-dialog.png', {
      maxDiffPixels: 120,
    });
  });
});
