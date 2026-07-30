// @ts-check
import { defineConfig, devices } from '@playwright/test';
import {
  authStatePath,
  configuredRoles,
  environment,
} from './config/environment.js';

const optionalRoleProjects = configuredRoles()
  .filter((role) => role !== 'default')
  .flatMap((role) => [
    {
      name: `setup-${role}`,
      metadata: { role, environment: environment.name },
      testMatch: /auth\.setup\.js/,
    },
    {
      name: `chromium-${role}`,
      metadata: { role, environment: environment.name },
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath(role),
      },
      testMatch: new RegExp(`.*\\.${role}\\.spec\\.js`),
      dependencies: [`setup-${role}`],
    },
  ]);

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  outputDir: `test-results/${environment.name}`,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry'da geçen test CI için başarı değildir; flaky test görünür kalır. */
  failOnFlakyTests: environment.isCI,
  /* Canlı sunucuya karşı çalıştığımız için geçici yavaşlıklarda tekrar dene. */
  retries: environment.retries,
  /* Gerçek (canlı) sunucuyu yormamak için paralel worker sayısını sınırla. */
  workers: environment.workers,
  timeout: 60_000,
  expect: {
    timeout: environment.expectTimeout,
  },
  /* Kilit 1: @mutation testleri yalnızca ALLOW_MUTATING_TESTS=true iken çalışır.
     Kilit 2: async mutationGuard staging origin + beklenen oturum tenant kimliğini
     doğrular. Production mutasyonu için kaçış bayrağı yoktur. */
  grepInvert: environment.allowMutations ? undefined : /@mutation/,
  /* Terminalde kısa sonuç, hatalarda kalıcı HTML raporu. */
  reporter: environment.isCI
    ? [
        ['github'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['html', { open: 'never' }],
      ]
    : [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: environment.baseURL,
    actionTimeout: environment.actionTimeout,
    navigationTimeout: environment.navigationTimeout,

    /* Teşhis otomasyonu (AGENTS.md → "Teşhis ve izleme (Tracing) standardı"):
       başarısızlıkta trace/video/screenshot OTOMATİK kaydedilir; kök-neden Trace
       Viewer ile incelenir (`npx playwright show-trace <trace.zip>`). ZAYIFLATMA. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    /* WP-R3: forensik modda (FORENSIC_BUG set) video KAPALI — video sonradan text
       sanitizer ile güvenilir temizlenemez (ekran PII'si). Trace lokal üretilir ve
       binary-aware taranır ama CI'a yüklenmez (bkz. ADR-0007). Normal koşuda video
       davranışı değişmez. */
    video: process.env.FORENSIC_BUG ? 'off' : 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Bir kez giriş yapıp oturumu playwright/.auth/user.json'a kaydeder */
    {
      name: 'setup',
      metadata: { role: 'default', environment: environment.name },
      testMatch: /auth\.setup\.js/,
    },

    /* Giriş GEREKTİRMEYEN testler (login.spec.js) — 3 tarayıcıda */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.spec\.js/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /login\.spec\.js/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /login\.spec\.js/,
    },

    /* Giriş GEREKTİREN testler (*.authed.spec.js) — kayıtlı oturumu kullanır */
    {
      name: 'chromium-authed',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('default'),
      },
      testMatch: /.*\.authed\.spec\.js/,
      dependencies: ['setup'],
    },
    /* Salt-okunur BFS keşfi normal smoke/regression lane'lerinden ayrıdır.
       Bilinmeyen kontrollere tıklamaz; non-GET istekleri browser'da keser. */
    {
      name: 'chromium-discovery',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('default'),
      },
      testMatch: /discovery\/.*\.spec\.js/,
      dependencies: ['setup'],
    },
    {
      name: 'firefox-authed',
      use: {
        ...devices['Desktop Firefox'],
        storageState: authStatePath('default'),
      },
      testMatch: /.*\.authed\.spec\.js/,
      dependencies: ['setup'],
    },
    {
      name: 'webkit-authed',
      use: {
        ...devices['Desktop Safari'],
        storageState: authStatePath('default'),
      },
      testMatch: /.*\.authed\.spec\.js/,
      dependencies: ['setup'],
    },

    /* Kimlik bilgisi tanımlanan admin/supervisor/agent rolleri otomatik eklenir. */
    ...optionalRoleProjects,

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
