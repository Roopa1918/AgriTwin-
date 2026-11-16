import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targetPages = [
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
  'src/pages/WhatMayHappen.jsx',
  'src/pages/Settings.jsx',
  'src/pages/RawSensorData.jsx',
  'src/components/layout/SimpleNavbar.jsx',
  'src/components/layout/Header.jsx',
  'src/components/layout/MobileBottomNav.jsx',
  'src/components/fields/AddFieldModal.jsx',
  'src/App.jsx'
];

for (const target of targetPages) {
  const filePath = path.resolve(__dirname, '..', target);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${target}`);
    continue;
  }
  const code = fs.readFileSync(filePath, 'utf8');
  console.log(`\n======================================================`);
  console.log(`Checking ${target}`);
  console.log(`======================================================`);

  // Look for text between > and < that contains letters, isn't just curly braces or whitespace
  // e.g., >Some Text Here<
  const textMatches = [...code.matchAll(/>([^<>{}\n\r\t]+)</g)]
    .map(m => m[1].trim())
    .filter(t => t.length > 2 && /[a-zA-Z]{3,}/.test(t));

  const filtered = textMatches.filter(t => {
    // Ignore css, units, or common non-i18n items
    if (/^(px|rem|em|deg|auto|none|solid|transparent|relative|absolute|hidden|center|flex|grid)$/i.test(t)) return false;
    if (t.startsWith('var(--')) return false;
    if (/^[0-9.]+\s*(mm|%|°C|m\/s|hPa|kPa|hrs|min|days)$/i.test(t)) return false;
    return true;
  });

  if (filtered.length > 0) {
    console.log(`  Potential hardcoded strings in JSX (${filtered.length}):`);
    filtered.slice(0, 15).forEach(s => console.log(`    - "${s}"`));
    if (filtered.length > 15) console.log(`    ... and ${filtered.length - 15} more`);
  } else {
    console.log(`  ✅ No obvious hardcoded strings in JSX text nodes.`);
  }
}
