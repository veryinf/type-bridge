const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  page.on('pageerror', () => {});
  page.on('console', () => {});

  await page.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 5000 });
  await page.waitForTimeout(500);

  // Check sidebar styling
  const sidebar = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return 'NOT FOUND';
    const s = getComputedStyle(aside);
    return `display=${s.display}, width=${s.width}, bgColor=${s.backgroundColor}`;
  });
  console.log('Sidebar:', sidebar);

  // Check flex layout
  const rootFlex = await page.evaluate(() => {
    const root = document.querySelector('#root > div');
    if (!root) return 'NOT FOUND';
    const s = getComputedStyle(root);
    return `display=${s.display}, height=${s.height}`;
  });
  console.log('Root layout:', rootFlex);

  // Check if .flex class produces display:flex
  const flexTest = await page.evaluate(() => {
    const el = document.querySelector('.flex');
    return el ? getComputedStyle(el).display : 'no .flex element';
  });
  console.log('.flex class => display:', flexTest);

  // Check CSS classes in stylesheet
  const cssInfo = await page.evaluate(() => {
    const sheets = document.styleSheets;
    let totalRules = 0;
    let hasFlex = false;
    let hasW48 = false;
    for (const sheet of sheets) {
      try {
        totalRules += sheet.cssRules.length;
        for (const rule of sheet.cssRules) {
          const txt = rule.selectorText || '';
          if (txt.includes('.flex')) hasFlex = true;
          if (txt.includes('.w-48')) hasW48 = true;
        }
      } catch {}
    }
    return `totalRules=${totalRules}, hasFlex=${hasFlex}, hasW48=${hasW48}`;
  });
  console.log('CSS:', cssInfo);

  // Check log page navigation
  await page.click('a[href="#/logs"]');
  await page.waitForTimeout(500);
  const logContent = await page.evaluate(() => document.body.innerText);
  console.log('Log page has "操作日志":', logContent.includes('操作日志'));
  console.log('Log page has "实时日志":', logContent.includes('实时日志'));

  // Screenshot dark mode
  await page.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 5000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshot-home-dark.png' });

  // Switch to light and screenshot
  const themeBtn = page.locator('button', { hasText: /模式/ });
  await themeBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-home-light.png' });

  // Navigate to logs in light mode
  await page.click('a[href="#/logs"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-logs-light.png' });

  await browser.close();
  console.log('Done!');
})();
