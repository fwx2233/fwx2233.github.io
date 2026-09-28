const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'browser.spec.cjs',
  timeout: 30000,
  use: { channel: 'chromium', baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory _site',
    cwd: require('node:path').resolve(__dirname, '..'),
    url: 'http://127.0.0.1:4173',
  },
});
