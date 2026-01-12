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
      const page = await context.newPage();
      console.log(`Capturing ${vp.name}...`);
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true });

      // Focus test: press Tab to focus first input and screenshot
      await page.keyboard.press('Tab');
      await page.screenshot({ path: path.join(outDir, `${vp.name}-focus.png`), fullPage: true });

      await context.close();
    }

    // Reduced motion check at desktop
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page2 = await context2.newPage();
    console.log('Capturing reduced-motion desktop...');
    await page2.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
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
