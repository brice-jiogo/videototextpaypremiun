const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const TEST_APP_URL = process.env.TEST_APP_URL || process.env.APP_URL || 'https://videototextservices.vercel.app';
  console.log(`Running smoke tests against ${TEST_APP_URL}`);

  // Try to locate local Chrome/Edge to avoid downloading Playwright browsers
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  let execPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      execPath = p;
      break;
    }
  }

  const launchOptions = { headless: true };
  if (execPath) {
    console.log('Found local browser executable:', execPath);
    launchOptions.executablePath = execPath;
    launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
  } else {
    console.log('No local Chrome/Edge found; attempting default Playwright browser (may require download)');
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);

  try {
    // 1) Open login page via client-side navigation
    await page.goto(`${TEST_APP_URL}/`, { waitUntil: 'networkidle', timeout: 120000 });
    console.log('Opened / (root)');

    // Navigate client-side to login by clicking any link or using history API
    await page.evaluate(() => {
      if (window.location.pathname !== '/login') {
        history.pushState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }
    });
    await page.waitForTimeout(1000);
    console.log('Client-side navigated to /login, current URL:', await page.url());

    // Check for text on page
    const loginText = await page.locator('text=Welcome Back, Sign in, Create an Account').count().catch(() => 0);
    console.log('Login text presence count (approx):', loginText);

    // Test Forgot Password UI
    const forgot = await page.getByRole('button', { name: /Forgot password\?|Forgot\?/i }).first().count();
    if (forgot) {
      await page.getByRole('button', { name: /Forgot password\?|Forgot\?/i }).first().click();
      await page.waitForTimeout(800);
      console.log('Clicked Forgot password');
    } else {
      console.log('Forgot password button not found');
    }

    // Open pricing page client-side
    await page.evaluate(() => {
      if (window.location.pathname !== '/pricing') {
        history.pushState({}, '', '/pricing');
        window.dispatchEvent(new Event('popstate'));
      }
    });
    await page.waitForTimeout(1000);
    console.log('Client-side navigated to /pricing, current URL:', await page.url());

    // Click first Get Started if present
    const getStarted = await page.getByRole('button', { name: /Get Started/i }).first().count().catch(() => 0);
    if (getStarted) {
      await page.getByRole('button', { name: /Get Started/i }).first().click();
      await page.waitForTimeout(1000);
      console.log('Clicked Get Started');
    } else {
      console.log('Get Started button not found');
    }

    console.log('Smoke tests completed successfully');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Smoke tests failed', err);
    await browser.close();
    process.exit(2);
  }
})();
