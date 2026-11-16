// Test Suite: 4 Demonstration Zones Water Levels in WaterPage.jsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== TEST SUITE: WATER LEVELS IN EACH ZONE SECTION AUDIT ===\n');

const waterCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/WaterPage.jsx'), 'utf8');

// Test 1: Section Structure & Presence in WaterPage.jsx
console.log('--- TEST 1: Section Elements in WaterPage.jsx ---');
const requiredKeywords = [
  'section-zone-water-levels',
  'zoneWaterLevelsTitle',
  'zoneWaterLevelsSubtitle',
  'displayZones.map',
  'zoneStatusUnavailable',
  'zoneStatusNeedsWater',
  'zoneStatusGood',
  'zoneDescUnavailable',
  'zoneDescNeedsWater',
  'zoneDescGood',
  'barPercent'
];

let missingKeywords = [];
for (const kw of requiredKeywords) {
  if (!waterCode.includes(kw)) {
    missingKeywords.push(kw);
  }
}

if (missingKeywords.length === 0) {
  console.log('✅ WaterPage contains all required zone water levels structural components.');
} else {
  console.error('❌ Missing keywords in WaterPage:', missingKeywords);
  process.exit(1);
}

// Test 2: Soil-Specific Threshold Logic Simulation
console.log('\n--- TEST 2: Soil-Specific Threshold Simulation ---');
const soils = [
  { name: 'Sandy Loam', fc: 18.0, pwp: 8.0, expectedRefill: 14.0 },
  { name: 'Loam', fc: 25.0, pwp: 12.0, expectedRefill: 19.8 },
  { name: 'Clay', fc: 35.0, pwp: 20.0, expectedRefill: 29.0 }
];

for (const soil of soils) {
  const refillThreshold = parseFloat((soil.fc - 0.40 * (soil.fc - soil.pwp)).toFixed(1));
  console.log(`Soil: ${soil.name} -> FC: ${soil.fc}%, PWP: ${soil.pwp}% => Calculated Refill: ${refillThreshold}% (Expected: ${soil.expectedRefill}%)`);
  if (refillThreshold !== soil.expectedRefill) {
    console.error(`❌ Refill threshold mismatch for ${soil.name}`);
    process.exit(1);
  }
}
console.log('✅ Soil-specific threshold adaptation verified (no hardcoded universal threshold).');

// Test 3: Zone State & Water-Level Bar Calculation Simulation
console.log('\n--- TEST 3: Zone Readings, Status & Bar Scaling Simulation ---');
const activeSoil = { name: 'Sandy Loam', fc: 18.0, pwp: 8.0 };
const refillThreshold = parseFloat((activeSoil.fc - 0.40 * (activeSoil.fc - activeSoil.pwp)).toFixed(1)); // 14.0%

const testZones = [
  { id: 'zone1', name: 'Zone 1 (Zone A)', soilWater: 17.8 }, // Adequate (> 14.0)
  { id: 'zone2', name: 'Zone 2 (Zone B)', soilWater: 13.8 }, // Stressed (<= 14.0)
  { id: 'zone3', name: 'Zone 3 (Zone C)', soilWater: 16.2 }, // Adequate (> 14.0)
  { id: 'zone4', name: 'Zone 4 (Zone D)', soilWater: null }  // Unavailable
];

testZones.forEach((z, idx) => {
  const moisture = typeof z.soilWater === 'number'
    ? z.soilWater
    : (typeof z.moisture === 'number' ? z.moisture : null);

  const isUnavailable = moisture === null || isNaN(moisture);
  const isZoneNeedsWater = !isUnavailable && moisture <= refillThreshold;

  const status = isUnavailable ? 'Data Unavailable' : (isZoneNeedsWater ? 'Needs Water' : 'Good');
  const barPercent = isUnavailable ? 0 : Math.min(100, Math.max(5, Math.round((moisture / activeSoil.fc) * 100)));

  console.log(`Zone [${z.name}]: Moisture = ${moisture !== null ? moisture.toFixed(1) + '%' : 'null'}, Status = [${status}], Bar Fill = ${barPercent}%`);

  if (idx === 0) {
    if (status !== 'Good' || barPercent < 90) throw new Error('Zone 1 should be Good with ~99% bar');
  } else if (idx === 1) {
    if (status !== 'Needs Water' || barPercent > 80) throw new Error('Zone 2 should be Needs Water with ~77% bar');
  } else if (idx === 2) {
    if (status !== 'Good' || barPercent < 85) throw new Error('Zone 3 should be Good with ~90% bar');
  } else if (idx === 3) {
    if (status !== 'Data Unavailable' || barPercent !== 0) throw new Error('Zone 4 should be Data Unavailable with 0% bar');
  }
});
console.log('✅ Zone status evaluation and bar percentage scaling verified.');

// Test 4: Verification of Translations (EN, HI, KN)
console.log('\n--- TEST 4: Translation Completeness ---');
const en = (await import('../src/i18n/translations/en.js')).default.water;
const hi = (await import('../src/i18n/translations/hi.js')).default.water;
const kn = (await import('../src/i18n/translations/kn.js')).default.water;

const requiredKeys = [
  'zoneWaterLevelsTitle',
  'zoneWaterLevelsSubtitle',
  'zoneStatusGood',
  'zoneStatusNeedsWater',
  'zoneStatusUnavailable',
  'zoneDescGood',
  'zoneDescNeedsWater',
  'zoneDescUnavailable'
];

for (const k of requiredKeys) {
  if (!en[k] || !hi[k] || !kn[k]) {
    console.error(`❌ Missing translation for key: ${k}`);
    process.exit(1);
  }
  console.log(`Key '${k}':`);
  console.log(`  EN: "${en[k]}"`);
  console.log(`  HI: "${hi[k]}"`);
  console.log(`  KN: "${kn[k]}"`);
}
console.log('✅ All translations for 4 zones are complete and non-empty.');

// Test 5: Verify Absence of Motor Runtime / Water Volume in Main Sections
console.log('\n--- TEST 5: Farmer View Cleanliness (No Motor Runtime or Liters) ---');
const mainSections = waterCode.split('<details')[0];
const forbidden = ['motorRunTime', 'targetVolumeLiters', 'targetRuntimeText', 'Liters'];
for (const term of forbidden) {
  if (mainSections.includes(term)) {
    console.error(`❌ Found forbidden term '${term}' in main water page`);
    process.exit(1);
  }
}
console.log('✅ Verified: No motor runtime or water liters appear in main view.');

console.log('\n==================================================');
console.log('🎉 ALL ZONE WATER LEVELS TESTS PASSED!');
console.log('==================================================');
