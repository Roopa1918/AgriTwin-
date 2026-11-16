const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const viewports = [
  { name: '320x568', width: 320, height: 568, device: 'iPhone SE (1st gen)' },
  { name: '360x800', width: 360, height: 800, device: 'Standard Android' },
  { name: '375x812', width: 375, height: 812, device: 'iPhone X / 12 mini' },
  { name: '390x844', width: 390, height: 844, device: 'iPhone 12 / 13 / 14' },
  { name: '430x932', width: 430, height: 932, device: 'iPhone 14 / 15 Pro Max' },
  { name: '768x1024', width: 768, height: 1024, device: 'iPad Tablet' },
  { name: '1366x768', width: 1366, height: 768, device: 'Desktop' }
];

const testCases = [
  { tab: 'home', lang: 'en' },
  { tab: 'home', lang: 'kn' },
  { tab: 'home', lang: 'hi' },
  { tab: 'water', lang: 'en' },
  { tab: 'water', lang: 'kn' },
  { tab: 'water', lang: 'hi' },
  { tab: 'alerts', lang: 'en' },
  { tab: 'alerts', lang: 'kn' },
  { tab: 'weather', lang: 'en' },
  { tab: 'field-monitor', lang: 'en' },
  { tab: 'plant-health', lang: 'en' },
  { tab: 'reports', lang: 'en' },
  { tab: 'what-if', lang: 'en' },
  { tab: 'settings', lang: 'en' },
  { tab: 'raw-sensors', lang: 'en' },
  { tab: 'my-fields', lang: 'en' }
];

console.log('Starting Visual Responsiveness Test Matrix...\n');

const results = [];

// Ensure output dir exists
const outDir = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Test key viewports across pages
for (const vp of viewports) {
  console.log(`\n======================================================`);
  console.log(`TESTING VIEWPORT: ${vp.width}x${vp.height} (${vp.device})`);
  console.log(`======================================================`);

  for (const tc of testCases) {
    const htmlFile = path.resolve(__dirname, `test_${tc.tab}_${tc.lang}.html`);
    if (!fs.existsSync(htmlFile)) continue;

    const screenshotName = `${tc.tab}_${tc.lang}_${vp.width}x${vp.height}.png`;
    const screenshotPath = path.join(outDir, screenshotName);

    const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

    try {
      const cmd = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --virtual-time-budget=4000 --screenshot="${screenshotPath}" --window-size=${vp.width},${vp.height} "${fileUrl}"`;
      execSync(cmd, { stdio: 'pipe', timeout: 15000 });

      const exists = fs.existsSync(screenshotPath);
      const size = exists ? fs.statSync(screenshotPath).size : 0;
      const passed = exists && size > 15000;

      console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${tc.tab} (${tc.lang}) @ ${vp.width}x${vp.height} -> ${size} bytes`);
      results.push({
        viewport: `${vp.width}x${vp.height}`,
        device: vp.device,
        page: tc.tab,
        lang: tc.lang,
        passed,
        file: screenshotName,
        size
      });
    } catch (err) {
      console.log(`  [ERR] ${tc.tab} (${tc.lang}) @ ${vp.width}x${vp.height}: ${err.message.split('\n')[0]}`);
      results.push({
        viewport: `${vp.width}x${vp.height}`,
        device: vp.device,
        page: tc.tab,
        lang: tc.lang,
        passed: false,
        error: err.message
      });
    }
  }
}

const summaryFile = path.resolve(__dirname, 'test_matrix_results.json');
fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));

const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
console.log(`\nSUMMARY: ${passedTests}/${totalTests} tests captured visual render passes.`);
