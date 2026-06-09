import https from 'https';
import http from 'http';
import { URL } from 'url';

const TARGET = process.env.TEST_APP_URL || process.env.APP_URL || 'https://videototextservices.vercel.app';
console.log(`HTTP smoke tests against ${TARGET}`);

function fetchText(path) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(path, TARGET);
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.get(url.toString(), { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy(new Error('timeout'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

(async () => {
  try {
    const home = await fetchText('/');
    console.log(`/ -> ${home.status}`);
    if (home.status !== 200) throw new Error('Home page not OK');
    if (!/PREMIUM|premium/i.test(home.body)) console.log('Home page did not contain expected branding text');

    const login = await fetchText('/login');
    console.log(`/login -> ${login.status}`);
    if (login.status !== 200) throw new Error('/login not accessible');
    if (!/Sign in|Welcome Back|Create an Account/i.test(login.body)) console.log('/login content seems unexpected');

    const pricing = await fetchText('/pricing');
    console.log(`/pricing -> ${pricing.status}`);
    if (pricing.status !== 200) throw new Error('/pricing not accessible');
    if (!/Choose your PREMIUM Plan|Get Started/i.test(pricing.body)) console.log('/pricing content seems unexpected');

    // Check backend health if available
    try {
      const apiHealth = await fetchText('/api/health');
      console.log(`/api/health -> ${apiHealth.status}`);
      if (apiHealth.status === 200) {
        try {
          const json = JSON.parse(apiHealth.body || '{}');
          if (json.status === 'ok') console.log('Backend health OK');
        } catch {}
      }
    } catch (e) {
      console.log('/api/health not reachable or failed');
    }

    console.log('HTTP smoke checks finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('HTTP smoke checks failed:', err.message || err);
    process.exit(2);
  }
})();
