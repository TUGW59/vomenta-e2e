// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { CampaignTemplatesPage } from './pages/CampaignTemplatesPage.js';
import {
  assertNoHorizontalOverflow,
  expectDialogKeyboard,
  expectNoOverflowAtViewports,
  expectNoSevereA11y,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * KAMPANYALAR → ŞABLONLAR (`/campaigns/templates`)
 * Keşif: docs/sablonlar-kesif/NOTLAR.md
 *
 * Mutation olmayan bu dosyada create/update/delete istekleri L2 için route ile
 * yakalanır; gerçek kalıcı sonuçlar yalnız mutation spec'inde, testEntity ile
 * orphan-sıfır olarak doğrulanır.
 */
const I18N = CampaignTemplatesPage.I18N;

test.describe('SMS Şablonları — yapı', () => {
  test('başlık, tablo sözleşmesi ve New Template görünür @smoke @critical', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    await expect(templates.heading).toHaveText(I18N.en.heading);
    await expect(templates.newTemplateButton()).toBeVisible();
    for (const header of I18N.en.headers) {
      await expect(
        templates.table.getByRole('columnheader', { name: header, exact: true })
      ).toBeVisible();
    }
  });

  test('tablo en az bir gerçek şablon adı ve mesaj gövdesi render ediyor @smoke', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    await expect(templates.rows.first()).toBeVisible();
    const cells = await templates.rows.first().getByRole('cell').allTextContents();
    expect(cells[0]?.trim(), 'şablon adı boş olmamalı').not.toBe('');
    expect(cells[1]?.trim(), 'mesaj gövdesi boş olmamalı').not.toBe('');
  });
});

test.describe('SMS Şablonları — dört dil @i18n', () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] liste ve create formu çevrili`, async ({ app }) => {
      const templates = app.campaignTemplates;
      await templates.open();
      if (t.endonym) await templates.switchLanguage(t.endonym);
      await expect(templates.heading).toHaveText(t.heading, { timeout: 15_000 });
      await expect(templates.page.locator('html')).toHaveAttribute('lang', code);
      await expect(templates.page.locator('html')).toHaveAttribute('dir', t.dir);
      for (const header of t.headers) {
        await expect(
          templates.table.getByRole('columnheader', { name: header, exact: true })
        ).toBeVisible();
      }
      const dialog = await templates.openCreate(t.newTemplate);
      await expect(dialog.getByRole('heading', { name: t.createTitle })).toBeVisible();
      await expect(dialog.getByText(t.subtitle, { exact: true })).toBeVisible();
      await expect(dialog.getByText(t.nameLabel, { exact: true })).toBeVisible();
      await expect(dialog.getByText(t.bodyLabel, { exact: true })).toBeVisible();
      await expect(dialog.getByPlaceholder(t.namePlaceholder, { exact: true }))
        .toHaveAttribute('placeholder', t.namePlaceholder);
      await expect(templates.bodyInput()).toBeVisible();
      await expect(dialog.getByRole('button', { name: t.cancel, exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: t.create, exact: true })).toBeDisabled();
    });

    test(`[${code}] mesaj placeholder'ı teknik i18n anahtarı sızdırmıyor @known-bug`, async ({ app }) => {
      test.fail();
      const templates = app.campaignTemplates;
      await templates.open();
      if (t.endonym) await templates.switchLanguage(t.endonym);
      await expect(templates.heading).toHaveText(t.heading, { timeout: 15_000 });
      await templates.openCreate(t.newTemplate);
      const placeholder = await templates.bodyInput().getAttribute('placeholder');
      expect(placeholder).not.toMatch(/^campaigns\./);
    });

    test(`[${code}] görünen etiketler form alanlarıyla programatik ilişkili @a11y @known-bug`, async ({ app }) => {
      test.fail();
      const templates = app.campaignTemplates;
      await templates.open();
      if (t.endonym) await templates.switchLanguage(t.endonym);
      await expect(templates.heading).toHaveText(t.heading, { timeout: 15_000 });
      await templates.openCreate(t.newTemplate);
      const associatedLabels = await Promise.all([
        templates.nameInput(t.namePlaceholder).evaluate((input) => input.labels?.length ?? 0),
        templates.bodyInput().evaluate((textarea) => textarea.labels?.length ?? 0),
      ]);
      expect(associatedLabels).toEqual([1, 1]);
    });
  }

  for (const [code, t] of Object.entries(I18N).filter(([key]) => key !== 'en')) {
    test(`[${code}] kapatma düğmesi İngilizce kalmıyor @known-bug`, async ({ app }) => {
      test.fail();
      const templates = app.campaignTemplates;
      await templates.open();
      await templates.switchLanguage(t.endonym);
      await expect(templates.heading).toHaveText(t.heading, { timeout: 15_000 });
      const dialog = await templates.openCreate(t.newTemplate);
      expect(
        await dialog.getByRole('button', { name: 'Close', exact: true }).count()
      ).toBe(0);
    });
  }
});

test.describe('Kontrol: New Template / form / iptal @regression', () => {
  test('L1 tıklama OK: create diyaloğu ve iki etiketli alan açılıyor', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const dialog = await templates.openCreate();
    await expect(dialog.getByRole('heading', { name: I18N.en.createTitle })).toBeVisible();
    await expect(templates.nameInput()).toBeVisible();
    await expect(templates.bodyInput()).toBeVisible();
  });

  // L2 N/A: New Template, alan doldurma, Cancel ve Close saf istemci davranışıdır.
  test('L3 görev OK: form doğrulaması dolu alanlarda Create düğmesini etkinleştiriyor', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const dialog = await templates.openCreate();
    await templates.nameInput().fill('e2e-form-validation');
    const message = 'Hello from Playwright';
    await templates.bodyInput().fill(message);
    await expect(dialog.getByText(new RegExp(`${message.length}/160`))).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create', exact: true })).toBeEnabled();
  });

  for (const control of ['Cancel', 'Close']) {
    test(`L3 görev OK: ${control} kayıt oluşturmadan diyaloğu kapatıyor`, async ({ app }) => {
      const templates = app.campaignTemplates;
      await templates.open();
      const before = await templates.rows.count();
      const dialog = await templates.openCreate();
      await dialog.getByRole('button', { name: control, exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(templates.rows).toHaveCount(before);
    });
  }
});

test.describe('Kontrol: Create @regression', () => {
  test('L1 tıklama OK: başarılı yanıt diyaloğu kapatıyor', async ({ app, page }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    await page.route(`**${CampaignTemplatesPage.API.list}`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'e2e-route-create',
            content: 'Route-captured message',
            category: 'general',
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });
    const dialog = await templates.openCreate();
    await templates.nameInput().fill('e2e-route-create');
    await templates.bodyInput().fill('Route-captured message');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test('L2 arka plan OK: doğru POST gövdesi gönderiliyor ve prod yazımı route ile bloklanıyor', async ({ app, page }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    let captured;
    await page.route(`**${CampaignTemplatesPage.API.list}`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      captured = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '00000000-0000-4000-8000-000000000002',
            ...captured,
            category: 'general',
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });
    const dialog = await templates.openCreate();
    await templates.nameInput().fill('e2e-contract-create');
    await templates.bodyInput().fill('Contract message');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect.poll(() => captured).toEqual({
      name: 'e2e-contract-create',
      content: 'Contract message',
    });
  });

  // L3 kalıcı sonuç: campaign-templates.mutations.authed.spec.js
});

test.describe('Kontrol: Edit @regression', () => {
  test('L1 ve L3 view-consistency: edit formu kaynak satırın ad/gövdesini gösteriyor', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const cells = await templates.rows.first().getByRole('cell').allTextContents();
    const [name, content] = cells.map((value) => value.trim());
    await templates.openEdit(name);
    await expect(templates.nameInput()).toHaveValue(name);
    await expect(templates.bodyInput()).toHaveValue(content);
  });

  test('L2 arka plan OK: Save doğru PATCH ucunu tetikliyor; route prod yazımını blokluyor', async ({ app, page }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const cells = await templates.rows.first().getByRole('cell').allTextContents();
    const name = cells[0].trim();
    const dialog = await templates.openEdit(name);
    let method;
    let path;
    await page.route(`**${CampaignTemplatesPage.API.list}/*`, async (route) => {
      method = route.request().method();
      path = new URL(route.request().url()).pathname;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await templates.bodyInput().fill('Route-captured edit');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect.poll(() => method).toBe('PATCH');
    expect(path).toMatch(/\/api\/v1\/channels\/templates\/sms\/[0-9a-f-]+$/);
  });

  // L3 kalıcı update: mutation spec'i yalnız kendi oluşturduğu kayıtta doğrular.
});

test.describe('Kontrol: Delete @regression', () => {
  test('L1 tıklama OK: onay diyaloğu açılıyor; Cancel kaydı koruyor', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const cells = await templates.rows.first().getByRole('cell').allTextContents();
    const name = cells[0].trim();
    const dialog = await templates.openDelete(name);
    await expect(dialog.getByRole('heading', { name: 'Delete Template' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(templates.row(name)).toHaveCount(1);
  });

  test('L2 arka plan OK: Delete doğru DELETE ucunu tetikliyor; route prod yazımını blokluyor', async ({ app, page }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const cells = await templates.rows.first().getByRole('cell').allTextContents();
    const name = cells[0].trim();
    const dialog = await templates.openDelete(name);
    let method;
    let path;
    await page.route(`**${CampaignTemplatesPage.API.list}/*`, async (route) => {
      method = route.request().method();
      path = new URL(route.request().url()).pathname;
      await route.fulfill({ status: 204 });
    });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect.poll(() => method).toBe('DELETE');
    expect(path).toMatch(/\/api\/v1\/channels\/templates\/sms\/[0-9a-f-]+$/);
  });

  // L3 kalıcı delete: mutation spec'i yalnız kendi oluşturduğu kayıtta doğrular.
});

test.describe('SMS Şablonları — bilinen ikon a11y borcu @a11y @known-bug', () => {
  for (const kind of ['edit', 'delete']) {
    test(`${kind} ikon-butonunun erişilebilir adı var`, async ({ app }) => {
      test.fail();
      const templates = app.campaignTemplates;
      await templates.open();
      const button = templates.rowAction(templates.rows.first(), kind);
      expect(await button.getAttribute('aria-label')).toMatch(/\S+/);
    });
  }
});

test.describe('SMS Şablonları — a11y @a11y', () => {
  test('liste ve create diyaloğunda yeni ciddi/kritik axe ihlali yok', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    await expectNoSevereA11y(templates.page);
    await templates.openCreate();
    await expectNoSevereA11y(templates.page);
  });
});

test.describe('SMS Şablonları — layout @layout', () => {
  test('masaüstü/tablet/mobil genişliklerinde yatay taşma yok', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/campaigns/templates');
  });

  test('Arapça RTL mobilde yatay taşma yok', async ({ app, page }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    await templates.switchLanguage(I18N.ar.endonym);
    await expect(templates.heading).toHaveText(I18N.ar.heading, { timeout: 15_000 });
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForUiToSettle(page);
    await assertNoHorizontalOverflow(page);
  });
});

test.describe('SMS Şablonları — clean @clean', () => {
  test('liste yüklenirken console/ağ hatası yok @known-bug', async ({ app, diagnostics }) => {
    test.fail();
    await app.campaignTemplates.open();
    await waitForUiToSettle(app.page);
    diagnostics.assertClean();
  });
});

test.describe('SMS Şablonları — error path @errorpath', () => {
  test('liste 500 dönerse kabuk/başlık sağlam ve eski satır yok', async ({ app, page }) => {
    await mockApi(page, `**${CampaignTemplatesPage.API.list}**`, {
      status: 500,
      body: '{"success":false}',
    });
    const templates = app.campaignTemplates;
    await templates.open();
    await expect(templates.heading).toHaveText(I18N.en.heading);
    await expect(templates.rows).toHaveCount(0);
  });

  test('liste boş dönerse açıklayıcı boş-durum render ediyor', async ({ app, page }) => {
    await mockApi(page, `**${CampaignTemplatesPage.API.list}**`, {
      status: 200,
      body: '{"success":true,"data":{"items":[],"total":0}}',
    });
    const templates = app.campaignTemplates;
    await templates.open();
    await expect(templates.heading).toHaveText(I18N.en.heading);
    await expect(templates.rows).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'No templates yet' })).toBeVisible();
    await expect(
      page.getByText('Create a template to reuse in your SMS campaigns.', { exact: true })
    ).toBeVisible();
  });
});

test.describe('SMS Şablonları — keyboard @keyboard', () => {
  test('create diyaloğu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    const dialog = await templates.openCreate();
    await expectDialogKeyboard(templates.page, dialog);
  });
});

test.describe('SMS Şablonları — deeplink @deeplink', () => {
  test('rota doğrudan açılınca başlık ve tablo yükleniyor', async ({ app }) => {
    const templates = app.campaignTemplates;
    await templates.open();
    await expect(templates.shell.loginHeading).toBeHidden();
    await expect(templates.heading).toHaveText(I18N.en.heading);
    await expect(templates.table).toBeVisible();
  });
});

test.describe('SMS Şablonları — visual @visual', () => {
  test('create diyaloğu görsel sözleşmesi', async ({ app }) => {
    test.skip(environment.isCI, 'Görsel baseline darwin-yerel üretilir.');
    const templates = app.campaignTemplates;
    await templates.open();
    const dialog = await templates.openCreate();
    await waitForUiToSettle(templates.page);
    await expect(dialog).toHaveScreenshot('create-template-dialog.png', {
      maxDiffPixels: 120,
    });
  });
});
