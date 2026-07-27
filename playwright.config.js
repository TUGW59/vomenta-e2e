// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('.env'), quiet: true });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Canlı sunucuya karşı çalıştığımız için geçici yavaşlıklarda tekrar dene. */
  retries: process.env.CI ? 2 : 2,
  /* Gerçek (canlı) sunucuyu yormamak için paralel worker sayısını sınırla. */
  workers: process.env.CI ? 2 : 4,
  /* Terminalde kısa sonuç, hatalarda kalıcı HTML raporu. */
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.BASE_URL || 'https://app.vomenta.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    /* Bir kez giriş yapıp oturumu playwright/.auth/user.json'a kaydeder */
    {
      name: 'setup',
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
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /.*\.authed\.spec\.js/,
      dependencies: ['setup'],
    },
    {
      name: 'firefox-authed',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /.*\.authed\.spec\.js/,
      dependencies: ['setup'],
    },
    {
      name: 'webkit-authed',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /.*\.authed\.spec\.js/,
      dependencies: ['setup'],
    },

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
