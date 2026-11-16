// Verification Test: Motor Run Time & Water Volume Completely Removed from Home and Water Pages
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== TEST SUITE: MOTOR RUNTIME & WATER REQUIRED REMOVAL AUDIT ===\n');

const homeCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/HomeDashboard.jsx'), 'utf8');
const waterCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/WaterPage.jsx'), 'utf8');

// 1. Home Dashboard Check
console.log('--- TEST 1: Home Dashboard Code Inspection ---');
const prohibitedInHome = [
  'motorRunTime',
  'waterRequired',
  'targetVolumeLiters',
  'targetRuntimeText',
  'motorNotConfigured',
  'Liters'
];

let foundInHome = [];
for (const p of prohibitedInHome) {
  if (homeCode.includes(p)) {
    foundInHome.push(p);
  }
}

if (foundInHome.length === 0) {
  console.log('✅ Home Dashboard is completely free of motor runtime, water required, and liters display.');
} else {
  console.error('❌ Found prohibited terms in Home Dashboard:', foundInHome);
  process.exit(1);
}

// 2. Water Page Check (Excluding the scientific details drawer which may mention math for research)
console.log('\n--- TEST 2: Water Page Main Section Inspection ---');
const waterMainSection = waterCode.split('<details')[0];
const prohibitedInWaterMain = [
  'motorRunTime',
  'waterRequired',
  'targetVolumeLiters',
  'targetRuntimeText',
  'motorNotConfigured',
  'Liters'
];

let foundInWaterMain = [];
for (const p of prohibitedInWaterMain) {
  if (waterMainSection.includes(p)) {
    foundInWaterMain.push(p);
  }
}

if (foundInWaterMain.length === 0) {
  console.log('✅ Water page main section is completely free of motor runtime, water required, and liters display.');
} else {
  console.error('❌ Found prohibited terms in Water page main section:', foundInWaterMain);
  process.exit(1);
}

// 3. Water Page Content Check
console.log('\n--- TEST 3: Water Page Simple Guidance Elements ---');
const requiredWaterElements = [
  'doesMyFieldNeedWater',
  'whichZoneNeedsWater',
  'whatShouldIDo',
  'wateringNeededReason',
  'noWateringNeededReason',
  'wateringNeededAction',
  'noWateringNeededAction'
];

let missingInWater = [];
for (const r of requiredWaterElements) {
  if (!waterCode.includes(r)) {
    missingInWater.push(r);
  }
}

if (missingInWater.length === 0) {
  console.log('✅ Water page correctly includes all 4 simple farmer guidance elements: whether needed, which zone, why, and what action.');
} else {
  console.error('❌ Missing guidance elements in Water page:', missingInWater);
  process.exit(1);
}

console.log('\n==================================================');
console.log('🎉 ALL REMOVAL TESTS PASSED!');
console.log('==================================================');
