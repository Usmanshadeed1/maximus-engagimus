const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const outDir = path.resolve(__dirname, '..', 'visual-screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

(async () => {
  const browser = await chromium.launch();
  try {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

      // Ensure dev mock auth and dark theme are set before any page loads (incognito-like context)
      await context.addInitScript(() => {
        try {
          localStorage.setItem('dev:mockAuth', 'true');
          localStorage.setItem('theme', 'dark');
        } catch (e) {
          // ignore
        }
      });

      const page = await context.newPage();
      console.log(`Capturing ${vp.name}...`);

      // To ensure the app picks up the dev mock auth flag, go to /login first,
      // then set the flag (defensive) and navigate to the dashboard root.
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        try {
          localStorage.setItem('dev:mockAuth', 'true');
          localStorage.setItem('theme', 'dark');
        } catch (e) {
          // ignore
        }
      });

      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

      // Wait for a dashboard-specific element so we know it loaded
      try {
        await page.waitForSelector('text=Recent Activity', { timeout: 5000 });
      } catch (e) {
        // fallback to wait for header if text not found
        await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});
      }
      await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true });

      // Focus test: press Tab to focus first input and screenshot
      await page.keyboard.press('Tab');
      await page.screenshot({ path: path.join(outDir, `${vp.name}-focus.png`), fullPage: true });

      // Dark mode capture for this viewport
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, `${vp.name}-dark.png`), fullPage: true });
      await page.keyboard.press('Tab');
      await page.screenshot({ path: path.join(outDir, `${vp.name}-focus-dark.png`), fullPage: true });
      await page.evaluate(() => document.documentElement.classList.remove('dark'));

      await context.close();
    }

    // Reduced motion check at desktop
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page2 = await context2.newPage();
    console.log('Capturing reduced-motion desktop...');
    await page2.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await page2.screenshot({ path: path.join(outDir, `desktop-reduced-motion.png`), fullPage: true });
    await context2.close();

    console.log('Screenshots saved to', outDir);
  } catch (err) {
    console.error('Visual QA failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();