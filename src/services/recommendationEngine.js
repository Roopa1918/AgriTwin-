// AgriTwin — Unified Scientific Agricultural Decision Support & Irrigation Recommendation Engine
// Grounded in FAO-56 Agronomic Principles:
// Calculates Total Available Water (TAW), Readily Available Water (RAW),
// Root-Zone Water Depletion (Dr), Refill Moisture Point, and Net Irrigation Depth (Inet).

import { SOIL_PROFILES, CROP_AGRONOMIC_PROFILES, TOMATO_GROWTH_STAGES, DEMO_THRESHOLDS } from '../data/demoConfiguration.js';

/**
 * Retrieve soil texture profile
 */
export function getSoilProfile(soilTypeId) {
  return SOIL_PROFILES[soilTypeId] || SOIL_PROFILES.sandy_loam;
}

/**
 * Retrieve crop agronomic profile
 */
export function getCropProfile(cropName) {
  return CROP_AGRONOMIC_PROFILES[cropName] || CROP_AGRONOMIC_PROFILES.Tomato;
}

/**
 * Generate baseline demonstration zones dynamically scaled to soil profile.
 * Ensures Zone 4 is at FC (not exceeding FC), Zone 2 is below refill point,
 * and no values violate soil physical boundaries (PWP <= theta <= FC).
 */
export function getBaselineZonesForSoil(soilTypeId = 'sandy_loam') {
  const soil = getSoilProfile(soilTypeId);
  const fc = soil.fc;
  const pwp = soil.pwp;
  const p = 0.40;
  const refill = parseFloat((fc - p * (fc - pwp)).toFixed(1));

  return [
    { 
      id: 'zone1', 
      name: 'Zone A (North-West)', 
      shortName: 'Zone A', 
      soilWater: parseFloat((fc - 0.2).toFixed(1)), 
      status: 'Good', 
      sensorId: 'SM-Z01' 
    },
    { 
      id: 'zone2', 
      name: 'Zone B (North-East - Target)', 
      shortName: 'Zone B', 
      soilWater: parseFloat((refill - 0.2).toFixed(1)), 
      status: 'Needs Water', 
      sensorId: 'SM-Z02' 
    },
    { 
      id: 'zone3', 
      name: 'Zone C (South-West)', 
      shortName: 'Zone C', 
      soilWater: parseFloat((fc - 0.45 * (fc - refill)).toFixed(1)), 
      status: 'Watch', 
      sensorId: 'SM-Z03' 
    },
    { 
      id: 'zone4', 
      name: 'Zone D (South-East)', 
      shortName: 'Zone D', 
      soilWater: parseFloat(fc.toFixed(1)), 
      status: 'Good', 
      sensorId: 'SM-Z04' 
    }
  ];
}

/**
 * Core FAO-56 Agronomic Water Balance Calculation
 * Preserves all Phase 2 baseline constants (FC=18%, PWP=8%, Zr=0.50m, p=0.40, TAW=50mm, RAW=20mm, Refill=14.0%).
 * Incorporates FAO-56 Ks water-stress limitation and tomato growth stages.
 */
export function calculateAgronomicWaterBalance({
  currentMoisture,
  cropName = 'Tomato',
  soilTypeId = 'sandy_loam',
  growthStageId = 'mid',
  areaAcres = 2.5,
  pumpDischargeLph = null,
  rainfallMm = 0.0,
  et0Mm = null,
  temperature = 28.5
}) {
  const soil = getSoilProfile(soilTypeId);
  const crop = getCropProfile(cropName);

  const fc = soil.fc;       // Field Capacity (% VWC)
  const pwp = soil.pwp;     // Permanent Wilting Point (% VWC)
  const sat = soil.sat;     // Saturation (% VWC)
  const zr = 0.50;          // Effective root depth (m) — Constant across all stages in Phase 3
  const p = 0.40;           // Allowable depletion fraction (MAD) — Constant across all stages

  // Stage-specific Kc configuration (FAO-56 Table 12 standard values)
  const stageMeta = (cropName === 'Tomato' && TOMATO_GROWTH_STAGES[growthStageId])
    ? TOMATO_GROWTH_STAGES[growthStageId]
    : TOMATO_GROWTH_STAGES.mid;
  const kc = stageMeta.kc || 1.15;

  // 1. Total Available Water: TAW = 1000 * ((FC - PWP) / 100) * Zr (mm)
  const tawMm = parseFloat((1000 * ((fc - pwp) / 100) * zr).toFixed(1)); // 50.0 mm

  // 2. Readily Available Water: RAW = p * TAW (mm)
  const rawMm = parseFloat((p * tawMm).toFixed(1)); // 20.0 mm

  // 3. Scientific Refill Moisture Threshold (% VWC)
  // theta_refill = FC - p * (FC - PWP)
  const refillThreshold = parseFloat((fc - p * (fc - pwp)).toFixed(1)); // 14.0%

  // 4. Critical Stress Floor (% VWC)
  const criticalThreshold = parseFloat((pwp + 2.0).toFixed(1));

  // 5. Root-Zone Water Depletion: Dr = 1000 * ((FC - theta) / 100) * Zr (mm)
  const moistureVal = typeof currentMoisture === 'number' ? currentMoisture : parseFloat(currentMoisture) || fc;
  const rawDr = 1000 * ((fc - moistureVal) / 100) * zr;
  const depletionMm = parseFloat(Math.max(0, Math.min(tawMm, rawDr)).toFixed(1));

  // 6. Depletion Percentage of TAW
  const depletionPercent = tawMm > 0 ? Math.round((depletionMm / tawMm) * 100) : 0;

  // 7. Water Stress Coefficient Ks & Evapotranspiration Partitioning
  // If Dr <= RAW: Ks = 1.0 (unrestricted transpiration)
  // If Dr > RAW: Ks = (TAW - Dr) / (TAW - RAW) (linear stress decline toward PWP)
  let ks = 1.0;
  if (depletionMm > rawMm) {
    ks = Math.max(0, (tawMm - depletionMm) / (tawMm - rawMm));
  }

  const effectiveEt0 = typeof et0Mm === 'number' ? et0Mm : (rainfallMm > 0 ? 3.5 : 4.8);
  const etcMm = Number(kc) * Number(effectiveEt0);
  const etaMm = ks * etcMm;
  const etUnmetMm = Math.max(0, etcMm - etaMm);

  // 8. Simplified Inflow Storage Absorption (Capped at available deficit)
  const inflowMm = Math.max(0, rainfallMm);
  const intermediateDr = Math.min(tawMm, depletionMm + etaMm);
  const storedMm = Math.min(inflowMm, intermediateDr);
  const deepPercolationMm = Math.max(0, inflowMm - intermediateDr);

  // 9. Net Irrigation Requirement (Inet in mm)
  // FAO-56 Standard: Trigger irrigation when Dr >= RAW (i.e. moistureVal <= refillThreshold)
  const isWaterNeeded = moistureVal <= refillThreshold || depletionMm >= rawMm;
  const isWaterWatch = !isWaterNeeded && moistureVal < fc;
  const isOptimal = moistureVal >= fc;

  const netIrrigationMm = isWaterNeeded ? parseFloat(Math.max(0, depletionMm - storedMm).toFixed(1)) : 0.0;

  // 10. Volumetric Requirement for Area (Liters)
  // 1 Acre = 4046.86 m2; 1 mm depth on 1 m2 = 1 Liter
  const areaM2 = (areaAcres || 2.5) * 4046.86;
  const volumeLiters = isWaterNeeded ? Math.round(netIrrigationMm * areaM2) : 0;
  const depletionVolumeLiters = Math.round(depletionMm * areaM2);

  // 11. Honest Pump Runtime Calculation (only when discharge is configured)
  let pumpRuntimeHours = null;
  let pumpRuntimeText = null;
  if (pumpDischargeLph && pumpDischargeLph > 0 && volumeLiters > 0) {
    const hoursDec = volumeLiters / pumpDischargeLph;
    const fullHours = Math.floor(hoursDec);
    const minutes = Math.round((hoursDec - fullHours) * 60);
    pumpRuntimeHours = parseFloat(hoursDec.toFixed(2));
    pumpRuntimeText = fullHours > 0 
      ? `${fullHours} hr ${minutes > 0 ? `${minutes} min` : ''}`.trim()
      : `${minutes} mins`;
  }

  return {
    currentMoisture: parseFloat((Math.round((moistureVal + Number.EPSILON) * 10) / 10).toFixed(1)),
    soil,
    crop,
    fc,
    pwp,
    sat,
    zr,
    p,
    kc,
    growthStageId: stageMeta.id,
    growthStageName: stageMeta.name,
    et0Mm: effectiveEt0,
    etcMm,
    ks,
    etaMm,
    etUnmetMm,
    tawMm,
    rawMm,
    refillThreshold,
    criticalThreshold,
    depletionMm,
    depletionPercent,
    storedRainMm: storedMm,
    deepPercolationMm,
    netIrrigationMm,
    volumeLiters,
    depletionVolumeLiters,
    pumpRuntimeHours,
    pumpRuntimeText,
    isWaterNeeded,
    isWaterWatch,
    isOptimal,
    isProvisional: soil.isProvisional !== false
  };
}

/**
 * Daily Time-Step FAO-56 Water Balance with Ks Water-Stress Limitation
 * Allen, Pereira, Raes, & Smith (1998), FAO-56 Chapter 8, Equations 84-86.
 */
export function calculateDailyWaterBalanceStep({
  previousDepletionMm,
  previousDrMm,
  et0Mm = 4.8,
  potentialEtcMm,
  rainfallMm,
  precipitationMm,
  irrigationMm,
  netIrrigationMm,
  kc = 1.15,
  tawMm = 50.0,
  rawMm = 20.0,
  fc = 18.0,
  fcVwc,
  zr = 0.50,
  rootDepthM
}) {
  const drPrevVal = previousDepletionMm !== undefined ? previousDepletionMm : (previousDrMm !== undefined ? previousDrMm : 0.0);
  const drPrev = Math.max(0, Math.min(tawMm, Number(drPrevVal) || 0.0));

  const etc = potentialEtcMm !== undefined 
    ? Number(potentialEtcMm)
    : (Number(kc) * (Number(et0Mm) || 0.0));

  const rain = Number((rainfallMm !== undefined ? rainfallMm : (precipitationMm !== undefined ? precipitationMm : 0.0)) || 0.0);
  const irrig = Number((irrigationMm !== undefined ? irrigationMm : (netIrrigationMm !== undefined ? netIrrigationMm : 0.0)) || 0.0);
  const fcVal = Number(fcVwc !== undefined ? fcVwc : fc);
  const zrVal = Number(rootDepthM !== undefined ? rootDepthM : zr);

  // 1. FAO-56 Water-Stress Coefficient (Ks)
  // If Dr <= RAW, transpiration is unrestricted (Ks = 1.0)
  // If Dr > RAW, transpiration declines linearly toward PWP: Ks = (TAW - Dr) / (TAW - RAW)
  let ks = 1.0;
  if (drPrev > rawMm) {
    ks = Math.max(0, (tawMm - drPrev) / (tawMm - rawMm));
  }

  // 2. Partition Evapotranspiration: Actual Extraction (ETa) vs Unmet Demand
  const eta = ks * etc;
  const etUnmet = Math.max(0, etc - eta);

  // 3. Intermediate Depletion after Actual Extraction
  // Depletion cannot exceed TAW (soil cannot dry below PWP)
  const drIntermediate = Math.min(tawMm, drPrev + eta);

  // 4. Inflow Water (Rainfall + Net Irrigation)
  const inflow = Math.max(0, rain) + Math.max(0, irrig);

  // 5. Root-Zone Storage Absorption (Capped at Available Deficit)
  const stored = Math.min(inflow, drIntermediate);

  // 6. Gravitational Deep Percolation (Excess above Field Capacity)
  const deepPercolation = Math.max(0, inflow - drIntermediate);

  // 7. Final Depletion (Bounded between 0.0 and TAW)
  const drFinal = Math.max(0, Math.min(tawMm, drIntermediate - stored));

  // 8. Volumetric Soil Moisture (% VWC)
  const thetaStart = fcVal - (drPrev / (1000 * zrVal)) * 100;
  const thetaFinal = fcVal - (drFinal / (1000 * zrVal)) * 100;

  return {
    previousDepletionMm: drPrev,
    startingDrMm: drPrev,
    startingMoisturePercent: thetaStart,
    etcMm: etc,
    ks,
    etaMm: eta,
    etUnmetMm: etUnmet,
    unmetDemandMm: etUnmet,
    intermediateDepletionMm: drIntermediate,
    inflowMm: inflow,
    storedMm: stored,
    deepPercolationMm: deepPercolation,
    finalDepletionMm: drFinal,
    finalDrMm: drFinal,
    endingDrMm: drFinal,
    finalMoisturePercent: thetaFinal,
    endingMoisturePercent: thetaFinal,
    finalSoilWaterVwc: thetaFinal,
    isWaterNeeded: drFinal >= rawMm
  };
}

/**
 * 3-5 Day Dual-Scenario Weather-Based Irrigation Outlook
 * Compares Forecast-Rain vs. No-Rain Outcomes Side-by-Side
 */
export function generateIrrigationOutlook({
  field,
  zones = [],
  weather = {},
  daysCount = 5,
  targetZone: providedTargetZone = null
}) {
  const soil = getSoilProfile(field?.soilType || 'sandy_loam');
  const growthStageId = field?.growthStage || 'mid';
  const stageMeta = TOMATO_GROWTH_STAGES[growthStageId] || TOMATO_GROWTH_STAGES.mid;
  const kc = stageMeta.kc || 1.15;
  const fc = soil.fc || 18.0;
  const pwp = soil.pwp || 8.0;
  const zr = 0.50; // Constant across all stages
  const tawMm = parseFloat((1000 * ((fc - pwp) / 100) * zr).toFixed(1)); // 50.0
  const rawMm = parseFloat((0.40 * tawMm).toFixed(1)); // 20.0

  // Anchor Day 0 directly to in-situ telemetry of the target / lowest zone driving irrigation recommendations
  const targetZone = providedTargetZone || zones.find(z => z.id === 'zone2') || [...zones].sort((a, b) => (a.soilWater ?? 16) - (b.soilWater ?? 16))[0] || zones[0];
  const initialMoisture = targetZone?.balance?.currentMoisture ?? (typeof targetZone?.soilWater === 'number' ? targetZone.soilWater : (targetZone?.moisture ?? 13.8));
  const initialDepletion = targetZone?.balance?.depletionMm ?? parseFloat(Math.max(0, Math.min(tawMm, 1000 * ((fc - initialMoisture) / 100) * zr)).toFixed(1));
  const anchorZoneName = targetZone?.shortName || targetZone?.name || 'Zone B (Zone 2)';

  const isOffline = Boolean(weather?.isOffline || !weather?.daily || weather.daily.length === 0);
  const refillThresholdVal = parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1));

  // When weather is offline, pause multi-day projection to prevent synthetic/misleading advice
  if (isOffline) {
    return {
      isOffline: true,
      growthStageId: stageMeta.id,
      growthStageName: stageMeta.name,
      kc,
      tawMm,
      taw: tawMm,
      rawMm,
      raw: rawMm,
      fc,
      pwp,
      refillThreshold: refillThresholdVal,
      anchorZoneName,
      anchorMoisturePercent: initialMoisture,
      anchorDepletionMm: initialDepletion,
      days: [],
      forecastRainScenario: [],
      noRainScenario: [],
      summaryNotice: 'Weather forecast is offline. Outlook paused to prevent misleading projections; operating in Phase 2 soil-moisture mode.'
    };
  }

  const dailyForecast = weather?.daily || [];
  const outlook = [];

  let prevDepletionRain = initialDepletion;
  let prevDepletionNoRain = initialDepletion;

  for (let i = 0; i < Math.min(daysCount, Math.max(1, dailyForecast.length)); i++) {
    const dayData = dailyForecast[i] || {};
    const dayName = i === 0 ? 'Today' : (dayData.day || `Day +${i}`);
    const dateStr = dayData.date || '';
    const et0Mm = typeof dayData.et0 === 'number' ? dayData.et0 : (weather?.currentEt0 || 4.8);
    const forecastRain = typeof dayData.rain === 'number' ? dayData.rain : 0.0;
    const prob = dayData.precipitationProbability ?? 0;

    // Branch 1: Forecast-Rain Scenario
    const rainStep = calculateDailyWaterBalanceStep({
      previousDepletionMm: prevDepletionRain,
      et0Mm,
      rainfallMm: forecastRain,
      irrigationMm: 0.0,
      kc,
      tawMm,
      rawMm,
      fc,
      zr
    });

    // Branch 2: No-Rain Scenario (Rain fails / dry spell)
    const noRainStep = calculateDailyWaterBalanceStep({
      previousDepletionMm: prevDepletionNoRain,
      et0Mm,
      rainfallMm: 0.0,
      irrigationMm: 0.0,
      kc,
      tawMm,
      rawMm,
      fc,
      zr
    });

    outlook.push({
      dayIndex: i,
      dayName,
      dateStr,
      et0Mm,
      kc,
      etcMm: rainStep.etcMm,
      forecastRainMm: forecastRain,
      rainProbability: prob,
      forecastRainScenario: rainStep,
      noRainScenario: noRainStep
    });

    prevDepletionRain = rainStep.finalDepletionMm;
    prevDepletionNoRain = noRainStep.finalDepletionMm;
  }

  const forecastRainScenario = outlook.map(d => ({
    dayIndex: d.dayIndex,
    dayName: d.dayName,
    dateStr: d.dateStr,
    et0: d.et0Mm,
    kc: d.kc,
    etc: d.etcMm,
    rain: d.forecastRainMm,
    pop: d.rainProbability,
    isRefillTriggered: d.forecastRainScenario.finalDepletionMm >= rawMm,
    startingDr: d.forecastRainScenario.startingDrMm,
    startingMoisture: d.forecastRainScenario.startingMoisturePercent,
    endingDr: d.forecastRainScenario.finalDepletionMm,
    endingMoisture: d.forecastRainScenario.finalMoisturePercent,
    soilMoisture: d.forecastRainScenario.finalMoisturePercent,
    ks: d.forecastRainScenario.ks,
    eta: d.forecastRainScenario.etaMm,
    deepPercolation: d.forecastRainScenario.deepPercolationMm,
    unmetDemand: d.forecastRainScenario.unmetDemandMm,
    stepObject: d.forecastRainScenario
  }));

  const noRainScenario = outlook.map(d => ({
    dayIndex: d.dayIndex,
    dayName: d.dayName,
    dateStr: d.dateStr,
    et0: d.et0Mm,
    kc: d.kc,
    etc: d.etcMm,
    rain: 0.0,
    pop: 0,
    isRefillTriggered: d.noRainScenario.finalDepletionMm >= rawMm,
    startingDr: d.noRainScenario.startingDrMm,
    startingMoisture: d.noRainScenario.startingMoisturePercent,
    endingDr: d.noRainScenario.finalDepletionMm,
    endingMoisture: d.noRainScenario.finalMoisturePercent,
    soilMoisture: d.noRainScenario.finalMoisturePercent,
    ks: d.noRainScenario.ks,
    eta: d.noRainScenario.etaMm,
    deepPercolation: 0.0,
    unmetDemand: d.noRainScenario.unmetDemandMm,
    stepObject: d.noRainScenario
  }));

  return {
    growthStageId: stageMeta.id,
    growthStageName: stageMeta.name,
    kc,
    tawMm,
    taw: tawMm,
    rawMm,
    raw: rawMm,
    fc,
    pwp,
    refillThreshold: refillThresholdVal,
    anchorZoneName,
    anchorMoisturePercent: initialMoisture,
    anchorDepletionMm: initialDepletion,
    days: outlook,
    forecastRainScenario,
    noRainScenario,
    summaryNotice: 'FAO-56 daily water-balance scenario calculation comparing Forecast Rain vs Zero-Rain.'
  };
}

/**
 * Unified Field-Wide Irrigation Recommendation Engine
 * Used consistently across Home Dashboard, Water Page, 3D Twin, and Alerts.
 * Prevents conflicting recommendations between Zone 2 and Field Average.
 */
export function evaluateFieldIrrigation({
  field,
  zones = [],
  weather = {}
}) {
  const soilType = field?.soilType || 'sandy_loam';
  const cropName = field?.crop || 'Tomato';
  const growthStageId = field?.growthStage || 'mid';
  const areaAcres = parseFloat(field?.area) || 2.5;
  const pumpDischargeLph = field?.pumpDischargeLph || null;
  const isWeatherOffline = Boolean(weather?.isOffline || !weather?.daily || weather.daily.length === 0);
  const rainfall = (!isWeatherOffline && typeof weather?.rainfall === 'number') ? weather.rainfall : 0.0;
  const temperature = (typeof weather?.temperature === 'number') ? weather.temperature : 28.5;
  const et0Mm = (typeof weather?.daily?.[0]?.et0 === 'number')
    ? weather.daily[0].et0
    : (typeof weather?.currentEt0 === 'number' ? weather.currentEt0 : 4.5);

  // 1. Calculate water balance for each zone
  // Each zone represents areaAcres / numberOfZones (e.g. 2.5 / 4 = 0.625 acres)
  // When a specific zone is irrigated, the full pump flow rate is directed to that zone.
  const zoneBalances = zones.map((z, idx) => {
    const zoneAreaAcres = areaAcres / (zones.length || 4);
    const balance = calculateAgronomicWaterBalance({
      currentMoisture: z.soilWater ?? z.moisture ?? 16.0,
      cropName,
      soilTypeId: soilType,
      growthStageId,
      areaAcres: zoneAreaAcres,
      pumpDischargeLph, // Directed to this zone during irrigation
      rainfallMm: rainfall,
      et0Mm,
      temperature
    });
    return {
      ...z,
      balance
    };
  });

  // 2. Field Average Moisture
  const avgMoisture = zones.length > 0
    ? zones.reduce((sum, z) => sum + (z.soilWater ?? z.moisture ?? 0), 0) / zones.length
    : 16.5;

  // 3. Whole-field aggregate balance
  const fieldBalance = calculateAgronomicWaterBalance({
    currentMoisture: avgMoisture,
    cropName,
    soilTypeId: soilType,
    growthStageId,
    areaAcres,
    pumpDischargeLph,
    rainfallMm: rainfall,
    et0Mm,
    temperature
  });

  // 4. Find most water-stressed zone
  const sortedByMoisture = [...zoneBalances].sort((a, b) => (a.balance.currentMoisture - b.balance.currentMoisture));
  const mostStressedZone = sortedByMoisture[0] || null;

  // Conflict Prevention: If ANY zone drops below refill threshold, field signals Water Needed
  const stressedZones = zoneBalances.filter(z => z.balance.isWaterNeeded);
  const hasStressedZone = mostStressedZone && mostStressedZone.balance.isWaterNeeded;
  const isWholeFieldStressed = stressedZones.length === zones.length && zones.length > 0;

  // Determine recommendation scope (Zone-Specific vs Whole-Field)
  const targetScope = isWholeFieldStressed ? 'WHOLE_FIELD' : 'ZONE_SPECIFIC';
  const targetZone = mostStressedZone;
  const targetZoneName = targetZone?.name || targetZone?.shortName || 'Zone 2';
  const targetZoneAreaAcres = parseFloat((areaAcres / (zones.length || 4)).toFixed(2));
  
  const targetAreaText = isWholeFieldStressed 
    ? `${areaAcres.toFixed(2)} Acres (Whole Field — Assumed Demo Area)` 
    : `${targetZoneAreaAcres} Acres (${targetZoneName} — Assumed Demo Area)`;

  const targetVolumeLiters = isWholeFieldStressed 
    ? fieldBalance.volumeLiters 
    : (targetZone?.balance?.volumeLiters || 0);

  const targetNetIrrigationMm = isWholeFieldStressed 
    ? fieldBalance.netIrrigationMm 
    : (targetZone?.balance?.netIrrigationMm || 0);

  // Pump runtime calculated for the EXACT target volume being irrigated
  let targetPumpRuntimeHours = null;
  let targetPumpRuntimeText = null;
  if (pumpDischargeLph && pumpDischargeLph > 0 && targetVolumeLiters > 0) {
    const hoursDec = targetVolumeLiters / pumpDischargeLph;
    const fullHours = Math.floor(hoursDec);
    const minutes = Math.round((hoursDec - fullHours) * 60);
    targetPumpRuntimeHours = parseFloat(hoursDec.toFixed(2));
    targetPumpRuntimeText = fullHours > 0 
      ? `${fullHours} hr ${minutes > 0 ? `${minutes} min` : ''}`.trim()
      : `${minutes} mins`;
  }

  // 5. Weather Forecast Uncertainty Analysis
  const tomorrowForecast = (!isWeatherOffline && weather?.daily?.[1]) ? weather.daily[1] : null;
  const isRainForecastTomorrow = Boolean(
    !isWeatherOffline &&
    tomorrowForecast &&
    (typeof tomorrowForecast.rain === 'number' && tomorrowForecast.rain >= 8.0) &&
    ((tomorrowForecast.precipitationProbability || 0) >= 60)
  );

  const weatherAdvisory = isRainForecastTomorrow ? {
    condition: 'FORECAST_RAIN_DEFERRAL',
    forecastRainTomorrow: tomorrowForecast.rain,
    precipitationProbability: tomorrowForecast.precipitationProbability || 0,
    text: `Significant rain (~${tomorrowForecast.rain} mm, ${tomorrowForecast.precipitationProbability || 0}% probability) is forecast tomorrow. Consider deferring irrigation until soil moisture is rechecked post-event.`
  } : null;

  let status = 'GOOD';
  let priority = 'LOW';
  let title = '';
  let text = '';
  let reason = '';
  let action = '';
  let adviceStatus = '';
  let adviceReason = '';
  let nextStep = '';

  const depthText = `${targetNetIrrigationMm} mm`;
  const volText = `${targetVolumeLiters.toLocaleString()} L`;
  const runtimeText = targetPumpRuntimeText ? ` (~${targetPumpRuntimeText})` : '';

  if (rainfall > 5.0) {
    status = 'GOOD';
    priority = 'LOW';
    title = 'Rain Occurring — Irrigation Deferred';
    text = `Precipitation (${rainfall.toFixed(1)} mm) is recharging soil water.`;
    reason = 'Natural rainfall is fulfilling crop water demand. Irrigation is paused.';
    action = 'Keep pumps off and allow rain to infiltrate the root zone.';
    adviceStatus = 'Rain Occurring';
    adviceReason = 'Natural rain is recharging the root zone today.';
    nextStep = 'Keep irrigation paused until rain soaks in.';
  } else if (hasStressedZone && isRainForecastTomorrow) {
    // Uncertainty-Aware Rain Forecast Advisory (Conditional scheduling)
    status = 'NEEDS_WATER';
    priority = 'HIGH';
    title = isWholeFieldStressed
      ? 'Water Needed: Whole Field (Rain Forecast Tomorrow)'
      : `Water Needed: ${targetZoneName} (Rain Forecast Tomorrow)`;
    text = `Soil moisture in ${targetZoneName} is ${targetZone.balance.currentMoisture}%. Weather models project a ${tomorrowForecast.precipitationProbability}% chance of ~${tomorrowForecast.rain} mm rain tomorrow.`;
    reason = `Root-zone depletion is ${targetZone.balance.depletionMm} mm (${volText} net requirement). If incoming rain confirms, irrigation may be postponed 12–24h to conserve water; if rain fails by tomorrow morning, irrigate immediately.`;
    action = `Apply ${depthText} (${volText} for ${targetAreaText})${runtimeText} if clear skies persist; postpone 12–24h if incoming rain is confirmed.`;
    adviceStatus = 'Water Needed • Rain Forecast Tomorrow';
    adviceReason = `Zone 2 is below refill threshold (${targetZone.balance.currentMoisture}%). Weather models project ${tomorrowForecast.rain} mm rain (${tomorrowForecast.precipitationProbability}% prob) tomorrow.`;
    nextStep = `If local sky confirms rain, postpone 12-24h to conserve water; if rain fails by tomorrow morning, irrigate with ${depthText} (${volText}).`;
  } else if (hasStressedZone) {
    status = 'NEEDS_WATER';
    priority = 'HIGH';
    title = isWholeFieldStressed
      ? 'Water Needed: Whole Field Below Refill Point'
      : `Water Needed: ${targetZoneName} Below Refill Point`;
    text = isWholeFieldStressed
      ? `All zones are below refill threshold (${fieldBalance.refillThreshold}%). Field average moisture is ${fieldBalance.currentMoisture}%.`
      : `Soil moisture in ${targetZoneName} is ${targetZone.balance.currentMoisture}% (Refill point: ${targetZone.balance.refillThreshold}%).`;
    reason = isWholeFieldStressed
      ? `Whole-field root-zone depletion (${fieldBalance.depletionMm} mm) has exceeded Readily Available Water (${fieldBalance.rawMm} mm).`
      : `Root-zone depletion in ${targetZoneName} (${targetZone.balance.depletionMm} mm) has exceeded Readily Available Water (${targetZone.balance.rawMm} mm).`;
    
    action = `Apply ${depthText} (${volText} theoretical net requirement for ${targetAreaText})${runtimeText} to restore root zone to Field Capacity.`;
    
    adviceStatus = 'Water Needed';
    adviceReason = `Soil moisture in ${targetZoneName} (${targetZone.balance.currentMoisture}%) has dropped below the ${targetZone.balance.refillThreshold}% refill point.`;
    nextStep = `Irrigate ${targetAreaText} with ${depthText} (${volText} net requirement) to avoid crop stress.`;
  } else if (fieldBalance.isWaterWatch || (mostStressedZone && mostStressedZone.balance.isWaterWatch)) {
    status = 'WATCH';
    priority = 'MEDIUM';
    title = 'Monitor Soil Water: Within Readily Available Range';
    text = `Soil moisture (${fieldBalance.currentMoisture}%) is between Refill Point (${fieldBalance.refillThreshold}%) and Field Capacity (${fieldBalance.fc}%).`;
    reason = 'Crop is transpiring readily without moisture stress. No urgent watering needed today.';
    action = 'Check soil moisture tomorrow morning before scheduling irrigation.';
    adviceStatus = 'Water Okay Today';
    adviceReason = `Soil moisture (${fieldBalance.currentMoisture}%) is adequate for crop growth.`;
    nextStep = 'Monitor readings tomorrow morning.';
  } else {
    status = 'GOOD';
    priority = 'LOW';
    title = 'Field Well Hydrated';
    text = `Soil water is optimal near Field Capacity (${fieldBalance.fc}%).`;
    reason = 'Root-zone moisture is sufficient for healthy crop growth.';
    action = 'Maintain normal monitoring. No watering needed.';
    adviceStatus = 'Soil Water Good';
    adviceReason = 'Soil moisture is at optimal Field Capacity.';
    nextStep = 'No watering required.';
  }

  // 6. Multi-Day Dual-Scenario Irrigation Outlook (Synchronized with evaluated target zone)
  const irrigationOutlook = generateIrrigationOutlook({
    field,
    zones,
    weather,
    daysCount: 5,
    targetZone: targetZone // Synchronized with evaluated target zone
  });

  return {
    status,
    priority,
    title,
    text,
    reason,
    action,
    adviceStatus,
    adviceReason,
    nextStep,
    targetScope,
    targetAreaText,
    targetVolumeLiters,
    targetNetIrrigationMm,
    targetPumpRuntimeHours,
    targetPumpRuntimeText,
    lowestZoneBalance: mostStressedZone?.balance || null,
    targetZoneAreaAcres,
    rawMm: fieldBalance.rawMm,
    tawMm: fieldBalance.tawMm,
    fc: fieldBalance.fc,
    pwp: fieldBalance.pwp,
    refillThreshold: fieldBalance.refillThreshold,
    fieldBalance,
    zoneBalances,
    mostStressedZone,
    hasStressedZone,
    isWholeFieldStressed,
    isRainForecastTomorrow,
    weatherAdvisory,
    tomorrowRainMm: tomorrowForecast?.rain || 0,
    tomorrowRainProb: tomorrowForecast?.precipitationProbability || 0,
    irrigationOutlook,
    growthStageId,
    growthStageName: TOMATO_GROWTH_STAGES[growthStageId]?.name || 'Mid-Season (Flowering & Fruit Set)',
    kc: TOMATO_GROWTH_STAGES[growthStageId]?.kc || 1.15,
    isWeatherOffline: Boolean(weather?.isOffline),
    disclaimer: fieldBalance.isProvisional
      ? 'Provisional demonstration assumptions (Sandy Loam: FC 18%, PWP 8%, Zr 0.50m, p 0.40). Subject to physical soil lab test.'
      : 'Based on FAO-56 agronomic calculations for configured soil profile.',
    badges: [
      { id: 'sim', label: 'Simulated Telemetry', type: 'simulated' },
      { 
        id: 'soil', 
        label: fieldBalance.isProvisional 
          ? `Assumed: ${fieldBalance.soil.name} (FC ${fieldBalance.fc}%, PWP ${fieldBalance.pwp}%)` 
          : `${fieldBalance.soil.name} (FC ${fieldBalance.fc}%)`,
        type: fieldBalance.isProvisional ? 'provisional' : 'verified'
      },
      {
        id: 'stage',
        label: `Stage: ${TOMATO_GROWTH_STAGES[growthStageId]?.name ? TOMATO_GROWTH_STAGES[growthStageId].name.split(' ')[0] : 'Mid'} (Kc ${TOMATO_GROWTH_STAGES[growthStageId]?.kc || 1.15})`,
        type: 'stage'
      }
    ]
  };
}

/**
 * Backward-compatible single zone evaluator
 */
export function evaluateZoneIrrigation({
  zoneId,
  zoneName,
  soilMoisture,
  moistureTrend = 'stable',
  temperature = 28.5,
  humidity = 55.0,
  rainfall = 0.0,
  climateScenario = 'normal',
  cropName = 'Tomato',
  soilTypeId = 'sandy_loam',
  areaAcres = 0.6,
  pumpDischargeLph = null
}) {
  const balance = calculateAgronomicWaterBalance({
    currentMoisture: soilMoisture,
    cropName,
    soilTypeId,
    areaAcres,
    pumpDischargeLph,
    rainfallMm: rainfall,
    temperature
  });

  let priority = 'LOW';
  let recommendation = 'No immediate irrigation required.';
  let reason = 'Soil water levels are within the optimal target range for the current crop growth stage.';
  let actionableAdvice = 'Maintain standard monitoring schedule. Soil water is adequate.';
  let waterStress = 'Low';

  if (rainfall > 3.0) {
    priority = 'LOW';
    waterStress = 'Low';
    recommendation = `Rainfall detected (${rainfall.toFixed(1)} mm). No watering needed.`;
    reason = 'Natural rain is recharging soil water.';
    actionableAdvice = 'Keep irrigation off and let rain soak into the soil.';
  } else if (balance.isWaterNeeded) {
    priority = 'HIGH';
    waterStress = balance.currentMoisture <= balance.criticalThreshold ? 'Critical' : 'High';
    recommendation = `Soil water in ${zoneName || zoneId} is low (${balance.currentMoisture}%). Refill point is ${balance.refillThreshold}%.`;
    reason = `Root-zone depletion (${balance.depletionMm} mm) exceeds allowable depletion (${balance.rawMm} mm).`;
    actionableAdvice = `Apply ${balance.netIrrigationMm} mm (${balance.volumeLiters.toLocaleString()} L) to restore to Field Capacity.`;
  } else if (balance.isWaterWatch || moistureTrend === 'decreasing' || climateScenario === 'hotDry') {
    if (temperature >= 34.0 || climateScenario === 'hotDry') {
      priority = 'HIGH';
      waterStress = 'Moderate-High';
      recommendation = `High heat (${temperature.toFixed(1)}°C) and water decline in ${zoneName || zoneId}. Monitor closely.`;
      reason = 'High evaporative demand is drying soil faster.';
      actionableAdvice = 'Water in early morning or evening if irrigation is required.';
    } else {
      priority = 'MEDIUM';
      waterStress = 'Moderate';
      recommendation = `Soil water in ${zoneName || zoneId} is in readily available range (${balance.currentMoisture}%).`;
      reason = `Adequate moisture for crop transpiration (${balance.refillThreshold}% - ${balance.fc}%).`;
      actionableAdvice = 'Check soil water tomorrow before deciding to irrigate.';
    }
  }

  return {
    zoneId,
    zoneName: zoneName || zoneId,
    priority,
    recommendation,
    reason,
    waterStress,
    actionableAdvice,
    balance,
    timestamp: new Date().toLocaleTimeString(),
    disclaimer: balance.isProvisional
      ? 'Provisional demonstration assumption: Tomato on Sandy Loam (FC 18%, PWP 8%).'
      : 'FAO-56 calculated recommendation.'
  };
}
