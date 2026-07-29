// @ts-check
import { test, expect } from './fixtures/test.js';

/**
 * RAPORLAR — "Schedule This Report" GERÇEK YAŞAM DÖNGÜSÜ (opt-in)
 *
 * UI create → backend POST 201 → /reports listesinde görünür sonuç →
 * UI Actions/Delete → backend DELETE 204 → listeden kaybolma.
 *
 * GÜVENLİK:
 * - Yalnızca `npm run test:mutation:prod` çift kilidiyle çalışır.
 * - Ayrılmış otomasyon/test tenant'ına yöneliktir.
 * - Benzersiz `e2e-sched-…` ada ve teslim edilemeyen rezerv example.com alıcısına yazar.
 * - Çalışma saati 23:55 seçilir; schedule saniyeler içinde doğrulanıp silinir.
 * - `testEntity` cleanup, test herhangi bir noktada kırılırsa benzersiz adı API'den
 *   bulup siler; gerçek kullanıcı schedule'larına dokunmaz.
 * - Retry kapalıdır: aynı mutation otomatik tekrarlanmaz.
 *
 * Resmi OpenAPI (29 Tem 2026):
 * POST /api/v1/reports/scheduled → 201
 * DELETE /api/v1/reports/scheduled/{id} → 204
 */
test.describe('Rapor Schedule yaşam döngüsü @regression @mutation', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test('L2+L3: schedule oluşturuluyor, listeleniyor ve hemen siliniyor', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    mutationGuard('Rapor Schedule: oluştur + listele + sil');

    const name = `e2e-sched-${Date.now()}`;
    const recipient = 'e2e-schedule@example.com';

    // Cleanup MUTASYONDAN ÖNCE kaydedilir. Yalnızca bu testin benzersiz adına dokunur.
    testEntity.cleanup(async () => {
      await app.reports.open();
      if (!(await app.reports.scheduledReportName(name).count())) return;
      const removed = await app.reports.deleteScheduledReportByName(name);
      expect(removed.status(), 'cleanup DELETE 204').toBe(204);
    }, `scheduled report rollback: ${name}`);

    const report = app.reportSection('agent');
    await report.open();
    const created = await report.createScheduledReport({ name, recipient });

    // L2 — doğru endpoint, method, durum ve DTO.
    expect(created.status(), 'schedule POST 201').toBe(201);
    const requestBody = created.request().postDataJSON();
    expect(requestBody).toMatchObject({
      name,
      recipientEmails: [recipient],
      schedule: '55 23 * * *',
    });
    const responseBody = await created.json();
    expect(responseBody).toMatchObject({
      success: true,
      data: {
        name,
        recipientEmails: [recipient],
        schedule: requestBody.schedule,
        isActive: true,
      },
    });
    expect(responseBody.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // L3 create/list — kayıt yönetim yüzeyinde doğru cron + alıcı sayısıyla görünüyor.
    await app.reports.open();
    const card = app.reports.scheduledReportCard(name);
    await expect(app.reports.scheduledReportName(name)).toBeVisible({ timeout: 20000 });
    await expect(card).toContainText(requestBody.schedule);
    await expect(card).toContainText('1 recipients');

    // L2 + L3 delete — kullanıcı yönetim yolundan silinir ve kart kaybolur.
    const deleted = await app.reports.deleteScheduledReportByName(name);
    expect(deleted.status(), 'schedule DELETE 204').toBe(204);
    await expect(app.reports.scheduledReportName(name)).toHaveCount(0);
  });

  test('güvenlik: tenantta geçici e2e schedule kalıntısı yok', async ({
    app,
    mutationGuard,
    testEntity,
  }) => {
    mutationGuard('Rapor Schedule: mutation koşumu sonrası orphan kontrolü');
    void testEntity;
    await app.reports.open();
    await expect(
      app.reports.page.getByText(/^e2e-sched-/)
    ).toHaveCount(0, { timeout: 20000 });
  });
});
