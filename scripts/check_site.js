const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    else if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => errors.push('NAVFAIL: ' + e.message));
  await page.waitForTimeout(3000);
  const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 500) || 'EMPTY').catch(() => '');
  console.log('ERRORS:', JSON.stringify(errors, null, 2));
  console.log('WARNINGS:', JSON.stringify(warnings.slice(0, 5), null, 2));
  console.log('ROOT_HTML:', rootHTML);
  console.log('BODY_TEXT_LEN:', bodyText.length);
  await page.screenshot({ path: 'C:/Users/Owner/autopilot/screenshot.png' });
  await browser.close();
})();
