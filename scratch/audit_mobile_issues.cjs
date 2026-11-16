const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/HomeDashboard.jsx',
  'src/pages/MyFields.jsx',
  'src/pages/WaterPage.jsx',
  'src/pages/Alerts.jsx',
  'src/pages/WeatherPage.jsx',
  'src/pages/FieldMonitor.jsx',
  'src/components/3d/DynamicDigitalTwin.jsx',
  'src/components/3d/ZoneDetailDrawer.jsx',
  'src/pages/PlantHealthPage.jsx',
  'src/pages/Reports.jsx',
  'src/pages/WhatIf.jsx',
  'src/pages/Settings.jsx',
  'src/pages/RawSensorData.jsx',
  'src/components/layout/SimpleNavbar.jsx',
  'src/components/layout/MobileBottomNav.jsx',
  'src/components/fields/AddFieldModal.jsx',
  'src/App.jsx'
];

console.log('Scanning for potential mobile responsiveness issues...\n');

files.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', file);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  console.log(`=== ${file} ===`);
  lines.forEach((line, idx) => {
    // Check for minmax(Xpx where X >= 250
    const minmaxMatch = line.match(/minmax\((\d+)px/);
    if (minmaxMatch && parseInt(minmaxMatch[1]) >= 250) {
      console.log(`  Line ${idx + 1}: minmax(${minmaxMatch[1]}px) may overflow on <= 360px screen: ${line.trim()}`);
    }

    // Check for fixed widths > 300px
    const widthMatch = line.match(/width:\s*['"]?(\d+)px/);
    if (widthMatch && parseInt(widthMatch[1]) >= 300) {
      console.log(`  Line ${idx + 1}: fixed width ${widthMatch[1]}px: ${line.trim()}`);
    }

    // Check for minWidth > 280px
    const minWidthMatch = line.match(/minWidth:\s*['"]?(\d+)px/);
    if (minWidthMatch && parseInt(minWidthMatch[1]) >= 280) {
      console.log(`  Line ${idx + 1}: minWidth ${minWidthMatch[1]}px: ${line.trim()}`);
    }

    // Check for whiteSpace: 'nowrap'
    if (line.includes("nowrap") && !line.includes("text-overflow") && !line.includes("ellipsis")) {
      console.log(`  Line ${idx + 1}: whiteSpace nowrap without ellipsis: ${line.trim()}`);
    }
  });
  console.log('');
});
