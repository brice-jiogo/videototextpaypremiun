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
    // Pass args to run headless in chrome/msedge
    launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
  } else {
    console.log('No local Chrome/Edge found; attempting default Playwright browser (may require download)');
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1) Open login page
    await page.goto(`${TEST_APP_URL}/login`, { waitUntil: 'networkidle' });
    console.log('Opened /login');

    // Check for sign in header
    const header = await page.locator('text=Welcome Back').first();
    if (!(await header.count())) {
      console.log('Login header not found — checking alternative text');
    } else {
      console.log('Login header found');
    }

    // 2) Click Forgot password? and submit a test email
    const forgot = page.getByRole('button', { name: /Forgot password\?|Forgot\?/i }).first();
    if (await forgot.count()) {
      await forgot.click();
      await page.waitForURL('**/login', { timeout: 2000 }).catch(() => {});
      // If the UI shows a reset form in place, fill it
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count()) {
        await emailInput.fill('test+smoke@example.com');
        const submit = page.getByRole('button', { name: /Send Reset Email|Send Reset/i }).first();
        if (await submit.count()) {
          await submit.click();
          // wait for success text
          try {
            await page.waitForSelector('text=Check Your Email', { timeout: 7000 });
            console.log('Password reset flow: success screen found');
          } catch (e) {
            console.log('Password reset: success screen NOT found (might still have been sent)');
          }
        }
      }
    } else {
      console.log('Forgot password button not found on login page');
    }

    // 3) Open pricing and click Get Started (should redirect to login if not authenticated)
    await page.goto(`${TEST_APP_URL}/pricing`, { waitUntil: 'networkidle' });
    console.log('Opened /pricing');

    const getStarted = page.getByRole('button', { name: /Get Started/i }).first();
    if (await getStarted.count()) {
      await getStarted.click();
      // If redirected to login, we should observe /login in URL
      await page.waitForTimeout(1500);
      const url = page.url();
      if (url.includes('/login')) {
        console.log('Pricing -> Get Started: redirected to login as expected for unauthenticated user');
      } else {
        console.log(`Pricing -> Get Started: did not redirect to login (current url: ${url})`);
      }
    } else {
      console.log('Get Started button not found on pricing page');
    }

    // 4) Basic homepage health check
    await page.goto(TEST_APP_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    console.log(`Home page title: ${title}`);

    console.log('Smoke tests completed');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Smoke tests failed', err);
    await browser.close();
    process.exit(2);
  }
})();
