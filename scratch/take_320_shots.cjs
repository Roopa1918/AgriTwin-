const { execSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pages = ['home_en', 'home_kn', 'home_hi', 'water_en', 'water_kn', 'water_hi'];
for (const p of pages) {
  const html = 'C:/Users/LENOVO/Desktop/agri/scratch/test_' + p + '.html';
  const out = 'C:/Users/LENOVO/Desktop/agri/scratch/screenshots/' + p + '_320x568.png';
  const cmd = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --allow-file-access-from-files --virtual-time-budget=4000 --screenshot="${out}" --window-size=320,568 "file:///${html}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Successfully saved:', out);
}
