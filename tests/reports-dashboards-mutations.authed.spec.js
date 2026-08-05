// @ts-check
import { test, expect } from './fixtures/test.js';
import {
  AUTOMATION_ENTITY_PREFIXES,
  testEntityName,
} from './data/factories.js';

/**
 * RAPORLAR › PANOLAR — VERİ-DEĞİŞTİREN AKIŞLAR (opt-in)
 *
 * Create / Duplicate / Delete için 3-katmanın L2 (backend) + L3 (kalıcı sonuç) katmanlarını
 * GERÇEKTEN doğrular. Canlı gözlemle doğrulanmış akış (29 Tem 2026):
 *   - Create: "Create Dashboard" → diyalog → submit "Create Dashboard" → `POST /api/v1/reports/dashboards` 201
 *   - Delete: kart çöp ikonu → onay diyaloğu ["Cancel","Delete"] → "Delete" → `DELETE …/dashboards/{id}` 204
 *
 * GÜVENLİK (AGENTS.md temel ilke 3):
 *   - `@mutation` + async `mutationGuard`: yalnızca kimliği doğrulanan ayrılmış
 *     staging tenant'ında koşar; production için kaçış bayrağı yoktur.
 *   - Her test YALNIZCA kendi oluşturduğu `VOMENTA_E2E_…` panosuna dokunur.
 *   - `testEntity.create` rollback'i create öncesi kaydeder ve `0→1→0`
 *     baseline'ını kanıtlar.
 *   - Otomasyon hesabı bir TEST hesabıdır (gerçek müşteri verisi değil).
 *
 * Tanı: `--trace on` ile koşulduğunda Trace Viewer'da tüm create/delete adımları + ağ + DOM görülür.
 */
test.describe('Panolar — mutasyonları @regression @mutation', () => {
  test.describe.configure({ mode: 'serial', retries: 0 }); // aynı canlı kaynağı (özel pano listesi) paylaşırlar

  test('Create Dashboard: pano oluşunca özel listeye ekleniyor (L2 POST 201 + L3 kart)', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Panolar: pano oluşturma');
    const dashboards = app.dashboards;
    await dashboards.open();
    const before = await dashboards.customCardCount();

    const name = testEntityName('DASHBOARD_CREATE');
    await testEntity.create({
      label: `dashboard:${name}`,
      key: name,
      baseline: () =>
        dashboards.automationDashboardCount(AUTOMATION_ENTITY_PREFIXES),
      cleanup: async () => {
        if (await dashboards.page.getByText(name, { exact: true }).count()) {
          await dashboards.deleteDashboardByName(name);
        }
      },
      action: () => dashboards.createDashboard(name),
    });

    // L3: yeni pano özel listede görünüyor (sayaç +1).
    await expect(dashboards.page.getByText(name, { exact: true })).toBeVisible({ timeout: 10000 });
    await expect.poll(() => dashboards.customCardCount(), { timeout: 10000 }).toBe(before + 1);
  });

  test('Duplicate: çoğaltma bir "(Copy)" ekliyor (L3)', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Panolar: pano çoğaltma');
    const dashboards = app.dashboards;
    await dashboards.open();

    // Kendi verimizi oluştur (mevcut kartlara dokunmadan onu çoğaltalım).
    const name = testEntityName('DASHBOARD_DUPLICATE');
    const copyName = `${name} (Copy)`;
    await testEntity.create({
      label: `dashboard-copy:${copyName}`,
      key: name,
      baseline: () =>
        dashboards.automationDashboardCount(AUTOMATION_ENTITY_PREFIXES),
      cleanup: async () => {
        await dashboards.open();
        for (const dashboardName of [copyName, name]) {
          if (
            await dashboards.page
              .getByText(dashboardName, { exact: true })
              .count()
          ) {
            await dashboards.deleteDashboardByName(dashboardName);
          }
        }
      },
      action: () => dashboards.createDashboard(name),
    });
    const afterCreate = await dashboards.customCardCount();

    // Bu panonun kartındaki çoğalt (lucide-copy) ikonuna bas.
    await dashboards.cardByName(name).locator('button:has(svg.lucide-copy)').first().click();

    // L3: "(Copy)" kartı beliriyor ve sayaç +1.
    await expect(dashboards.page.getByText(copyName, { exact: true })).toBeVisible({ timeout: 10000 });
    await expect.poll(() => dashboards.customCardCount(), { timeout: 10000 }).toBe(afterCreate + 1);
  });

  test('Delete: silme kartı listeden kaldırıyor (L2 DELETE 204 + L3)', async ({ app, mutationGuard, testEntity }) => {
    await mutationGuard('Panolar: pano silme');
    const dashboards = app.dashboards;
    await dashboards.open();

    // Ön koşul: silinecek geçici pano OLUŞTUR (başka verinin silinmemesi için).
    const name = testEntityName('DASHBOARD_DELETE');
    await testEntity.create({
      label: `dashboard-delete-restore:${name}`,
      key: name,
      baseline: () =>
        dashboards.automationDashboardCount(AUTOMATION_ENTITY_PREFIXES),
      cleanup: async () => {
        if (await dashboards.page.getByText(name, { exact: true }).count()) {
          await dashboards.deleteDashboardByName(name);
        }
      },
      action: () => dashboards.createDashboard(name),
    });
    const before = await dashboards.customCardCount();

    await dashboards.deleteDashboardByName(name); // L2: DELETE -> 204 (metot içinde beklenir)

    // L3: kart kayboldu (sayaç -1).
    await expect(dashboards.page.getByText(name, { exact: true })).toHaveCount(0, { timeout: 10000 });
    await expect.poll(() => dashboards.customCardCount(), { timeout: 10000 }).toBe(before - 1);
  });
});
