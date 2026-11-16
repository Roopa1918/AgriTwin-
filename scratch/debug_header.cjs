const { execSync } = require('child_process');
const fs = require('fs');

// Create a minimal test file that logs computed styles to console
const html = `
<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="../dist/assets/index-B50v-KXJ.css">
</head>
<body>
  <div class="header-mobile app-header">
    <div class="mobile-header-brand">
      <span class="mobile-header-logo">🌱</span>
      <span class="mobile-header-title">AgriTwin</span>
      <button class="mobile-header-field-chip"><span>🌾</span><span>Field</span></button>
    </div>
  </div>
  <div id="result"></div>
  <script>
    window.onload = () => {
      const chip = document.querySelector('.mobile-header-field-chip');
      const style = window.getComputedStyle(chip);
      document.getElementById('result').innerText = 'DISPLAY:' + style.display + ' WIDTH:' + window.innerWidth;
    };
  </script>
</body>
</html>
`;

fs.writeFileSync('scratch/test_debug.html', html);
const flags = [
  '--use-mobile-user-agent',
  '--user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"',
  '--touch-events=enabled',
  '--force-device-scale-factor=1'
];
const cmd = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files ${flags.join(' ')} --virtual-time-budget=2000 --dump-dom --window-size=320,568 "file:///C:/Users/LENOVO/Desktop/agri/scratch/test_debug.html"`;
const out = execSync(cmd).toString();
console.log('OUTPUT:', out.substring(out.indexOf('DISPLAY:'), out.indexOf('DISPLAY:') + 60));

