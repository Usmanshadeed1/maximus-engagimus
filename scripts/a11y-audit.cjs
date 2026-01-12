const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const outDir = path.resolve(__dirname, '..', 'visual-screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

    // Ensure the dev mock auth and dark theme are set before any page loads
    await context.addInitScript(() => {
      try {
        localStorage.setItem('dev:mockAuth', 'true');
        localStorage.setItem('theme', 'dark');
      } catch (e) {
        // ignore
      }
    });

    const page = await context.newPage();
    console.log('Navigating to dashboard...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

    // Inject axe-core from local package
    console.log('Injecting axe-core (local)...');
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });

    // Run color-contrast rule only
    console.log('Running color-contrast audit...');
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } });
    });

    const outPath = path.join(outDir, 'axe-color-contrast.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

    // Summarize violations
    const violations = results.violations || [];

    console.log(`Found ${violations.length} contrast violation(s).`);
    violations.forEach((v) => {
      console.log(`- ${v.help} (${v.id}) — ${v.nodes.length} node(s)`);
    });

    // Exit with failure when any violations are found so CI can catch regressions
    if (violations.length > 0) {
      console.error(`A11y audit failed: ${violations.length} contrast violation(s) found. See ${outPath} for details.`);
      process.exitCode = 2;
    }

    await context.close();
    console.log('Audit saved to', outPath);
  } catch (err) {
    console.error('A11y audit failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();