const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testCDP() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9222;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--allow-file-access-from-files',
    `--remote-debugging-port=${port}`,
    'about:blank'
  ]);

  // Wait 1s for port to open
  await new Promise(r => setTimeout(r, 1000));

  const json = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = json.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (evt) => {
      const resp = JSON.parse(evt.data);
      if (resp.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(resp.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: 'file:///C:/Users/LENOVO/Desktop/agri/scratch/test_home_en.html' });
  await new Promise(r => setTimeout(r, 2500));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshots/home_en_320x568.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved true 320x568 mobile screenshot via CDP!');

  ws.close();
  chromeProc.kill();
}

testCDP().catch(err => {
  console.error(err);
  process.exit(1);
});
