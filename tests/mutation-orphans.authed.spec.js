// @ts-check
import { test, expect } from './fixtures/test.js';
import { AUTOMATION_ENTITY_PREFIXES } from './data/factories.js';

// Bu dosya @mutation kilidiyle normal/prod lane'lerinden ayrılır; hiçbir write
// çağrısı yapmaz. Validator bu işaret + sözleşme kaydı olmadan istisnayı reddeder.
const MUTATION_LIFECYCLE_READ_ONLY = true;

test.describe('Mutation orphan-sıfır denetimi @mutation @regression', () => {
  test.describe.configure({ mode: 'serial', retries: 0 });

  test.beforeEach(async ({ mutationGuard }) => {
    await mutationGuard('Mutation orphan-sıfır salt-okunur taraması');
  });

  test('dashboard otomasyon kayıtları sıfır', async ({ app }) => {
    await expect
      .poll(
        () =>
          app.dashboards.automationDashboardCount(AUTOMATION_ENTITY_PREFIXES),
        { timeout: 15_000 }
      )
      .toBe(0);
  });

  test('schedule otomasyon kayıtları sıfır', async ({ app }) => {
    await expect
      .poll(
        () =>
          app.reports.automationScheduledReportCount(
            AUTOMATION_ENTITY_PREFIXES
          ),
        { timeout: 15_000 }
      )
      .toBe(0);
  });

  test('contact otomasyon kayıtları sıfır', async ({ app }) => {
    await expect
      .poll(
        () => app.contacts.automationContactCount(AUTOMATION_ENTITY_PREFIXES),
        { timeout: 20_000 }
      )
      .toBe(0);
  });

  test('workforce vardiya baseline’ı sıfır', async ({ app }) => {
    await expect
      .poll(() => app.workforce.automationShiftCount(), {
        timeout: 15_000,
      })
      .toBe(0);
  });
});
