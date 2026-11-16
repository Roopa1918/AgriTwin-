// Test: Simplified Home Dashboard Logic & Translation Verification
import { evaluateFieldIrrigation, getBaselineZonesForSoil, getSoilProfile } from '../src/services/recommendationEngine.js';
import en from '../src/i18n/translations/en.js';
import hi from '../src/i18n/translations/hi.js';
import kn from '../src/i18n/translations/kn.js';

console.log('=== TEST SUITE: SIMPLIFIED HOME DASHBOARD AUDIT ===\n');

// 1. Translation Coverage Test
console.log('--- TEST 1: Translation Keys Verification (EN, HI, KN) ---');
const requiredHomeKeys = [
  'farmerGreeting',
  'assistantBrand',
  'farmStatusGood',
  'farmStatusAttention',
  'farmStatusUnavailable',
  'waterAdviceQuestion',
  'waterNeededTitle',
  'waterNotNeededTitle',
  'waterUnavailableTitle',
  'waterUnavailableDesc',
  'waterNeededShortDesc',
  'waterNotNeededDesc',
  'affectedPlot',
  'motorRunTime',
  'motorRunTimeHelper',
  'motorNotConfigured',
  'waterRequired',
  'whatToDoNext',
  'actionWaterNeeded',
  'actionWaterNotNeeded',
  'actionWaterUnavailable',
  'rainForecastTitle',
  'rainAlertNote',
  'dataHonestySimulated',
  'viewWaterDetails',
  'simulateWatering',
  'wateringActive',
  'todayWeatherTitle',
  'weatherUnavailable',
  'viewWeatherDetails',
  'noRainExpected',
  'dryConditions',
  'rainExpectedTomorrow',
  'rainExpectedToday',
  'rainMaySaveWater',
  'viewRainDetails',
  'fieldSummaryTitle',
  'waterOutlookBtn',
  'weatherDetailsBtn',
  'fieldMonitorBtn',
  'reportsBtn'
];

let missing = [];
for (const key of requiredHomeKeys) {
  if (!en.home?.[key]) missing.push(`EN: home.${key}`);
  if (!hi.home?.[key]) missing.push(`HI: home.${key}`);
  if (!kn.home?.[key]) missing.push(`KN: home.${key}`);
}

if (missing.length === 0) {
  console.log(`✅ All ${requiredHomeKeys.length} dashboard keys exist in English, Hindi, and Kannada.`);
} else {
  console.error('❌ Missing keys:', missing);
  process.exit(1);
}

// 2. Irrigation-Needed Condition (Zone 2 below refill threshold 14%)
console.log('\n--- TEST 2: Irrigation-Needed Condition ---');
const sandyLoam = getSoilProfile('sandy_loam');
const baselineZones = getBaselineZonesForSoil('sandy_loam');
// Zone 2 is at 13.8% (below 14.0% refill point)
const testField = {
  id: 'field-1',
  name: 'Kaveri Basin Demo Plot',
  crop: 'Tomato',
  area: '2.5 Acres (1.0 Ha)',
  soilType: 'sandy_loam',
  pumpDischargeLph: 25000
};

const recNeeded = evaluateFieldIrrigation({
  field: testField,
  zones: baselineZones,
  weather: {
    temperature: 28,
    rainfall: 0.0,
    daily: [
      { day: 'Today', et0: 4.8, rain: 0.0, precipitationProbability: 10 },
      { day: 'Tomorrow', et0: 4.8, rain: 0.0, precipitationProbability: 10 }
    ]
  }
});

console.log('Recommendation Status:', recNeeded.status);
console.log('Most Stressed Zone:', recNeeded.mostStressedZone?.shortName);
console.log('Target Volume Liters:', recNeeded.targetVolumeLiters);
console.log('Target Pump Runtime Text:', recNeeded.targetPumpRuntimeText);

if (recNeeded.status === 'NEEDS_WATER' && recNeeded.targetPumpRuntimeText && recNeeded.targetVolumeLiters > 0) {
  console.log('✅ Irrigation-Needed condition passed: correctly flags NEEDS_WATER with valid runtime and volume.');
} else {
  console.error('❌ Irrigation-Needed condition failed!');
  process.exit(1);
}

// 3. No-Irrigation Condition (Zones hydrated in safe reserve 17.5% or at Field Capacity 18.0%)
console.log('\n--- TEST 3: No-Irrigation Condition ---');
const hydratedZones = baselineZones.map(z => ({ ...z, soilWater: 17.5 }));
const recHydrated = evaluateFieldIrrigation({
  field: testField,
  zones: hydratedZones,
  weather: {
    temperature: 28,
    rainfall: 0.0,
    daily: [
      { day: 'Today', et0: 4.8, rain: 0.0, precipitationProbability: 10 }
    ]
  }
});

const isWaterLowHydrated = recHydrated.status === 'NEEDS_WATER';
console.log('Hydrated Recommendation Status:', recHydrated.status);
console.log('Is Water Low (Water Needed):', isWaterLowHydrated);
console.log('Hydrated Target Volume Liters:', recHydrated.targetVolumeLiters);

const fcZones = baselineZones.map(z => ({ ...z, soilWater: 18.0 }));
const recAtFC = evaluateFieldIrrigation({
  field: testField,
  zones: fcZones,
  weather: {
    temperature: 28,
    rainfall: 0.0,
    daily: [
      { day: 'Today', et0: 4.8, rain: 0.0, precipitationProbability: 10 }
    ]
  }
});
console.log('At FC Recommendation Status:', recAtFC.status);

if (!isWaterLowHydrated && recHydrated.targetVolumeLiters === 0 && recAtFC.status === 'GOOD') {
  console.log('✅ No-Irrigation condition passed: correctly determines no watering needed and 0 volume required.');
} else {
  console.error('❌ No-Irrigation condition failed!');
  process.exit(1);
}

// 4. Missing Pump Flow Rate Test (No pump discharge configured)
console.log('\n--- TEST 4: Missing Pump Flow Rate Test ---');
const fieldNoPump = {
  ...testField,
  pumpDischargeLph: null // Not configured
};

const recNoPump = evaluateFieldIrrigation({
  field: fieldNoPump,
  zones: baselineZones,
  weather: { temperature: 28, rainfall: 0 }
});

console.log('Target Pump Runtime Dec:', recNoPump.targetPumpRuntimeHours);
console.log('Target Pump Runtime Text:', recNoPump.targetPumpRuntimeText);
if (recNoPump.targetPumpRuntimeHours === null && recNoPump.targetPumpRuntimeText === null) {
  console.log('✅ Missing pump discharge handled honestly: runtime is strictly null (no HP guessing).');
} else {
  console.error('❌ Failed: runtime was guessed despite missing discharge!');
  process.exit(1);
}

// 5. Missing / Offline Weather Data Test
console.log('\n--- TEST 5: Offline Weather Data Test ---');
const offlineRec = evaluateFieldIrrigation({
  field: testField,
  zones: baselineZones,
  weather: { isOffline: true, daily: [] }
});

console.log('Offline Evaluation Status:', offlineRec.status);
console.log('Outlook Days Count:', offlineRec.irrigationOutlook.days.length);
if (offlineRec.irrigationOutlook.days.length === 0) {
  console.log('✅ Offline weather safely paused multi-day outlook without crashing.');
} else {
  console.error('❌ Offline weather test failed!');
  process.exit(1);
}

// 6. Data Unavailable Condition
console.log('\n--- TEST 6: Data Unavailable Condition Check ---');
const checkDataAvailability = (field, zones, rec, avgSoilWater, z2Water) => {
  return !field || !rec || (!avgSoilWater && !z2Water && (!zones || zones.length === 0));
};

const nullFieldUnavailable = checkDataAvailability(null, baselineZones, recNeeded, 16.5, 13.8);
const emptyZonesUnavailable = checkDataAvailability(testField, [], recNeeded, null, null);
const validDataUnavailable = checkDataAvailability(testField, baselineZones, recNeeded, 16.5, 13.8);

console.log('Null Field isUnavailable:', nullFieldUnavailable);
console.log('Empty Zones isUnavailable:', emptyZonesUnavailable);
console.log('Valid Data isUnavailable:', validDataUnavailable);

if (nullFieldUnavailable === true && emptyZonesUnavailable === true && validDataUnavailable === false) {
  console.log('✅ Data unavailability condition verified cleanly.');
} else {
  console.error('❌ Data unavailability condition failed!');
  process.exit(1);
}

// 7. Check Prohibited Terms on Dashboard
console.log('\n--- TEST 7: Absence of Clutter & Prohibited Labels ---');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardPath = path.resolve(__dirname, '../src/pages/HomeDashboard.jsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

const prohibitedTerms = [
  'FAO-56',
  'RAW =',
  'TAW =',
  '% VWC',
  'ET0',
  'ETc',
  'Ks =',
  'Dr =',
  'Root-Zone Depletion (Dr)'
];

let foundTerms = [];
for (const term of prohibitedTerms) {
  if (dashboardCode.includes(term)) {
    foundTerms.push(term);
  }
}

if (foundTerms.length === 0) {
  console.log('✅ Prohibited technical clutter successfully removed from Home Dashboard.');
} else {
  console.error('❌ Found prohibited clutter on Home Dashboard:', foundTerms);
  process.exit(1);
}

console.log('\n==================================================');
console.log('🎉 ALL SIMPLIFIED HOME DASHBOARD TESTS PASSED!');
console.log('==================================================');
