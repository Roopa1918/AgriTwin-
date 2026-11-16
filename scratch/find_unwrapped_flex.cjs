const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/HomeDashboard.jsx',
  'src/pages/MyFields.jsx',
  'src/pages/WaterPage.jsx',
  'src/pages/Alerts.jsx',
  'src/pages/WeatherPage.jsx',
  'src/pages/FieldMonitor.jsx',
  'src/pages/PlantHealthPage.jsx',
  'src/pages/Reports.jsx',
  'src/pages/WhatIf.jsx',
  'src/pages/Settings.jsx',
  'src/pages/RawSensorData.jsx'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes("display: 'flex'") && !line.includes("flexWrap") && !line.includes("flexDirection: 'column'") && !line.includes("justifyContent: 'space-between'")) {
      // Check if line or next 3 lines have long text
      const nextLines = lines.slice(idx, idx + 4).join(' ');
      if (nextLines.includes('targetAreaText') || nextLines.includes('targetZoneName') || nextLines.includes('weather') || nextLines.includes('subtitle')) {
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
