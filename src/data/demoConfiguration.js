// AgriTwin — Field, Sensor, and Demonstration Configuration

// Authentic FAO-56 Soil Texture Profiles
export const SOIL_PROFILES = {
  sandy_loam: {
    id: 'sandy_loam',
    name: 'Sandy Loam',
    fc: 18.0,            // % VWC Field Capacity (Assumed)
    pwp: 8.0,            // % VWC Permanent Wilting Point (Assumed)
    sat: 38.0,           // % VWC Saturation
    isProvisional: true, // Marked as demonstration assumption
    description: 'Moderate drainage, low-to-medium water holding capacity'
  },
  loam: {
    id: 'loam',
    name: 'Loam',
    fc: 25.0,
    pwp: 12.0,
    sat: 43.0,
    isProvisional: false,
    description: 'Well-balanced soil with high water holding capacity'
  },
  clay_loam: {
    id: 'clay_loam',
    name: 'Clay Loam',
    fc: 32.0,
    pwp: 18.0,
    sat: 47.0,
    isProvisional: false,
    description: 'Fine texture, slow infiltration, high water retention'
  },
  clay: {
    id: 'clay',
    name: 'Clay',
    fc: 38.0,
    pwp: 22.0,
    sat: 50.0,
    isProvisional: false,
    description: 'Heavy soil, slow infiltration, very high water retention'
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    fc: 12.0,
    pwp: 5.0,
    sat: 34.0,
    isProvisional: false,
    description: 'Coarse texture, rapid drainage, low water holding capacity'
  }
};

// Authoritative FAO-56 Table 12 Growth Stages for Demonstration Crop (Tomato)
// Allen, Pereira, Raes, & Smith (1998), FAO Irrigation and Drainage Paper No. 56, Table 12, p. 110.
// Fixed effective root depth Zr = 0.50m and allowable depletion fraction p = 0.40 are preserved from Phase 2.
export const TOMATO_GROWTH_STAGES = {
  initial: {
    id: 'initial',
    name: 'Initial (Transplant / Establishment)',
    kc: 0.60,
    rootDepthM: 0.50,
    depletionFraction: 0.40,
    durationDays: 30,
    description: 'Transplant to 10% ground cover. Soil evaporation dominates.',
    reference: 'FAO-56 Table 12 standard reference'
  },
  development: {
    id: 'development',
    name: 'Crop Development (Vegetative)',
    kc: 0.88,
    rootDepthM: 0.50,
    depletionFraction: 0.40,
    durationDays: 40,
    description: 'Linear midpoint approximation of 0.60 -> 1.15 transition. Rapid canopy expansion.',
    reference: 'FAO-56 midpoint approximation ((0.60 + 1.15) / 2 = 0.875 ~ 0.88)'
  },
  mid: {
    id: 'mid',
    name: 'Mid-Season (Flowering & Fruit Set)',
    kc: 1.15,
    rootDepthM: 0.50,
    depletionFraction: 0.40,
    durationDays: 45,
    description: 'Unadjusted FAO-56 Table 12 fresh-market reference value. Peak water demand.',
    reference: 'FAO-56 Table 12 standard reference (fresh market tomato)'
  },
  late: {
    id: 'late',
    name: 'Late-Season (Maturity & Ripening)',
    kc: 0.80,
    rootDepthM: 0.50,
    depletionFraction: 0.40,
    durationDays: 25,
    description: 'Ripening to harvest. Lower transpiration and leaf senescence.',
    reference: 'FAO-56 Table 12 standard midpoint (0.70 - 0.90)'
  }
};

// FAO-56 Crop Agronomic Profiles (Tomato is primary demonstration crop)
export const CROP_AGRONOMIC_PROFILES = {
  Tomato: {
    crop: 'Tomato',
    rootDepthM: 0.50,        // Effective root depth Zr in meters (Assumed constant)
    depletionFraction: 0.40, // p (MAD) allowable depletion before water stress (Assumed constant)
    growthStage: 'Mid-Season (Flowering & Fruit Set)',
    growthStageId: 'mid',
    isProvisional: true,
    kc: 1.15,                // FAO-56 Table 12 unadjusted reference value
    stages: TOMATO_GROWTH_STAGES
  },
  Rice: {
    crop: 'Rice',
    rootDepthM: 0.35,
    depletionFraction: 0.20,
    growthStage: 'Vegetative',
    isProvisional: true,
    kc: 1.15
  },
  Wheat: {
    crop: 'Wheat',
    rootDepthM: 0.60,
    depletionFraction: 0.55,
    growthStage: 'Booting / Grain Fill',
    isProvisional: true,
    kc: 1.10
  },
  Cotton: {
    crop: 'Cotton',
    rootDepthM: 0.75,
    depletionFraction: 0.65,
    growthStage: 'Boll Formation',
    isProvisional: true,
    kc: 1.15
  },
  Maize: {
    crop: 'Maize',
    rootDepthM: 0.65,
    depletionFraction: 0.50,
    growthStage: 'Tasseling',
    isProvisional: true,
    kc: 1.15
  },
  Potato: {
    crop: 'Potato',
    rootDepthM: 0.40,
    depletionFraction: 0.35,
    growthStage: 'Tuber Bulking',
    isProvisional: true,
    kc: 1.10
  },
  Groundnut: {
    crop: 'Groundnut',
    rootDepthM: 0.50,
    depletionFraction: 0.50,
    growthStage: 'Pegging / Pod Formation',
    isProvisional: true,
    kc: 1.00
  },
  Sugarcane: {
    crop: 'Sugarcane',
    rootDepthM: 1.00,
    depletionFraction: 0.65,
    growthStage: 'Grand Growth',
    isProvisional: true,
    kc: 1.25
  },
  Pulses: {
    crop: 'Pulses',
    rootDepthM: 0.45,
    depletionFraction: 0.45,
    growthStage: 'Pod Development',
    isProvisional: true,
    kc: 1.05
  },
  Vegetables: {
    crop: 'Vegetables',
    rootDepthM: 0.35,
    depletionFraction: 0.35,
    growthStage: 'Vegetative',
    isProvisional: true,
    kc: 1.00
  },
  Other: {
    crop: 'Other',
    rootDepthM: 0.50,
    depletionFraction: 0.45,
    growthStage: 'General',
    isProvisional: true,
    kc: 1.00
  }
};

export const INITIAL_FIELD_CONFIG = {
  id: 'demoField',
  name: 'My Tomato Field',
  institution: 'Smart Agriculture Research',
  location: 'Precision Ag Plot — Sector 4',
  latitude: 13.0827,
  longitude: 80.2707,
  area: '2.5 Acres (1.0 Ha)',
  crop: 'Tomato',
  cropVariety: 'Hybrid Pusa Ruby',
  sowingDate: '2026-06-15',
  growthStage: 'Mid-Season / Flowering',
  soilType: 'sandy_loam',
  soilIsProvisional: true,
  pumpDischargeLph: null,
  irrigationType: 'Precision Micro-Sprinkler & Drip Array',
  numberOfZones: 4,
  boundaryPolygon: [
    [13.0835, 80.2698],
    [13.0835, 80.2718],
    [13.0818, 80.2718],
    [13.0818, 80.2698]
  ]
};

export const INITIAL_ZONES = [
  {
    id: 'zone1',
    name: 'Zone 1 — North-West',
    shortName: 'Zone 1',
    area: '0.6 ha',
    sensorId: 'SM-Z01',
    moisture: 17.8, // Near Field Capacity (18.0% FC)
    temperature: 28.6,
    humidity: 58.2,
    pH: 6.8,
    ec: 1.2,
    rainfall: 0,
    health: 92,
    waterStress: 'Low',
    irrigationNeeded: false,
    irrigationPriority: 'LOW',
    status: 'GOOD',
    coords: { x: -3.2, z: -3.2 },
    latLng: [13.0831, 80.2703]
  },
  {
    id: 'zone2',
    name: 'Zone 2 — North-East (Demo Target)',
    shortName: 'Zone 2',
    area: '0.6 ha',
    sensorId: 'SM-Z02',
    moisture: 12, // Starts below refill threshold (14.0%) to demonstrate water need
    temperature: 28.8,
    humidity: 57.5,
    pH: 6.7,
    ec: 1.3,
    rainfall: 0,
    health: 78,
    waterStress: 'High',
    irrigationNeeded: true,
    irrigationPriority: 'HIGH',
    status: 'LOW',
    coords: { x: 3.2, z: -3.2 },
    latLng: [13.0831, 80.2713]
  },
  {
    id: 'zone3',
    name: 'Zone 3 — South-West',
    shortName: 'Zone 3',
    area: '0.6 ha',
    sensorId: 'SM-Z03',
    moisture: 16.2, // Adequate (In RAW zone between 14.0% and 18.0%)
    temperature: 29.1,
    humidity: 56.4,
    pH: 6.6,
    ec: 1.1,
    rainfall: 0,
    health: 86,
    waterStress: 'Low',
    irrigationNeeded: false,
    irrigationPriority: 'LOW',
    status: 'GOOD',
    coords: { x: -3.2, z: 3.2 },
    latLng: [13.0822, 80.2703]
  },
  {
    id: 'zone4',
    name: 'Zone 4 — South-East',
    shortName: 'Zone 4',
    area: '0.7 ha',
    sensorId: 'SM-Z04',
    moisture: 18.0, // At Field Capacity (18.0% FC)
    temperature: 28.3,
    humidity: 60.1,
    pH: 6.9,
    ec: 1.2,
    rainfall: 0,
    health: 95,
    waterStress: 'Low',
    irrigationNeeded: false,
    irrigationPriority: 'LOW',
    status: 'GOOD',
    coords: { x: 3.2, z: 3.2 },
    latLng: [13.0822, 80.2713]
  }
];

export const INITIAL_SENSORS = [
  {
    sensorId: 'SM-Z01',
    name: 'Soil Moisture Probe Z1',
    type: 'Soil Moisture',
    category: 'soil',
    parameter: 'Volumetric Water Content',
    zoneId: 'zone1',
    zoneName: 'Zone 1',
    value: 17.8,
    unit: '%',
    status: 'Online',
    battery: 98,
    rssi: -62,
    model: 'Decagon 10HS Sim'
  },
  {
    sensorId: 'SM-Z02',
    name: 'Soil Moisture Probe Z2 (Demo Focus)',
    type: 'Soil Moisture',
    category: 'soil',
    parameter: 'Volumetric Water Content',
    zoneId: 'zone2',
    zoneName: 'Zone 2',
    value: 12,
    unit: '%',
    status: 'Online',
    battery: 95,
    rssi: -58,
    model: 'Decagon 10HS Sim'
  },
  {
    sensorId: 'SM-Z03',
    name: 'Soil Moisture Probe Z3',
    type: 'Soil Moisture',
    category: 'soil',
    parameter: 'Volumetric Water Content',
    zoneId: 'zone3',
    zoneName: 'Zone 3',
    value: 16.2,
    unit: '%',
    status: 'Online',
    battery: 92,
    rssi: -65,
    model: 'Decagon 10HS Sim'
  },
  {
    sensorId: 'SM-Z04',
    name: 'Soil Moisture Probe Z4',
    type: 'Soil Moisture',
    category: 'soil',
    parameter: 'Volumetric Water Content',
    zoneId: 'zone4',
    zoneName: 'Zone 4',
    value: 18.2,
    unit: '%',
    status: 'Online',
    battery: 96,
    rssi: -60,
    model: 'Decagon 10HS Sim'
  },
  {
    sensorId: 'TEMP-01',
    name: 'Ambient Air Temperature',
    type: 'Weather',
    category: 'weather',
    parameter: 'Temperature',
    zoneId: 'field',
    zoneName: 'Field Weather Mast',
    value: 28.8,
    unit: '°C',
    status: 'Online',
    battery: 100,
    rssi: -52,
    model: 'Sensirion SHT35 Sim'
  },
  {
    sensorId: 'HUM-01',
    name: 'Relative Humidity',
    type: 'Weather',
    category: 'weather',
    parameter: 'Humidity',
    zoneId: 'field',
    zoneName: 'Field Weather Mast',
    value: 57.8,
    unit: '%',
    status: 'Online',
    battery: 100,
    rssi: -52,
    model: 'Sensirion SHT35 Sim'
  },
  {
    sensorId: 'RAIN-01',
    name: 'Tipping Bucket Rain Gauge',
    type: 'Weather',
    category: 'weather',
    parameter: 'Rainfall',
    zoneId: 'field',
    zoneName: 'Field Weather Mast',
    value: 0.0,
    unit: 'mm',
    status: 'Online',
    battery: 99,
    rssi: -54,
    model: 'Davis AeroCone Sim'
  },
  {
    sensorId: 'WIND-01',
    name: 'Anemometer & Vane',
    type: 'Weather',
    category: 'weather',
    parameter: 'Wind Speed',
    zoneId: 'field',
    zoneName: 'Field Weather Mast',
    value: 8.4,
    unit: 'km/h',
    status: 'Online',
    battery: 97,
    rssi: -55,
    model: 'Gill WindSonic Sim'
  },
  {
    sensorId: 'SOLAR-01',
    name: 'Solar Pyranometer',
    type: 'Weather',
    category: 'weather',
    parameter: 'Solar Radiation',
    zoneId: 'field',
    zoneName: 'Field Weather Mast',
    value: 685,
    unit: 'W/m²',
    status: 'Online',
    battery: 100,
    rssi: -53,
    model: 'Apogee SP-110 Sim'
  },
  {
    sensorId: 'PH-01',
    name: 'Soil pH Probe',
    type: 'Soil',
    category: 'soil',
    parameter: 'Soil pH',
    zoneId: 'field',
    zoneName: 'Central Soil Station',
    value: 6.7,
    unit: 'pH',
    status: 'Online',
    battery: 91,
    rssi: -67,
    model: 'Vernier pH-BTA Sim'
  },
  {
    sensorId: 'EC-01',
    name: 'Soil EC Probe',
    type: 'Soil',
    category: 'soil',
    parameter: 'Electrical Conductivity',
    zoneId: 'field',
    zoneName: 'Central Soil Station',
    value: 1.25,
    unit: 'dS/m',
    status: 'Online',
    battery: 93,
    rssi: -66,
    model: 'Decagon GS3 Sim'
  }
];

export const DEMO_THRESHOLDS = {
  moisture: {
    good: 40.0,      // Above 40% = GOOD
    moderate: 25.0,  // 25% - 40% = MODERATE
    critical: 24.5   // Below 25% = LOW / CRITICAL
  },
  temperature: {
    normal: 30.0,
    warning: 34.0,
    critical: 38.0
  },
  humidity: {
    low: 30.0,
    high: 85.0
  }
};

export const PRESENTATION_EVENTS = [
  {
    id: 1,
    title: 'Normal Field Baseline',
    shortDesc: 'All 4 zones optimal, SM-Z02 at 42%, temperature 28°C.',
    action: 'reset',
    hint: 'Showcase synchronized 3D twin, live incoming telemetry, healthy green crop rows.'
  },
  {
    id: 2,
    title: 'Moisture Starts Declining',
    shortDesc: 'Zone 2 moisture begins gradual decrease (41% → 35%).',
    action: 'start_decline',
    hint: 'Highlight real-time listener receiving gradual decaying readings from simulator.'
  },
  {
    id: 3,
    title: 'Zone 2 Enters Low Moisture (<25%)',
    shortDesc: 'Zone 2 reaches 24.2% moisture; turns Red on 3D Twin.',
    action: 'critical_moisture',
    hint: 'Audience sees 3D Zone 2 pulsate red and automated Alert triggered.'
  },
  {
    id: 4,
    title: 'Automated Irrigation Recommendation',
    shortDesc: 'System fires HIGH priority advisory: Irrigation May Be Required.',
    action: 'recommend_irrigation',
    hint: 'Explain rule-based decision support logic integrating trend, weather, and soil type.'
  },
  {
    id: 5,
    title: 'Hot & Dry Climate Scenario',
    shortDesc: 'Simulate +3°C temp rise, -20% rain; water stress accelerates.',
    action: 'hot_dry_scenario',
    hint: 'Demonstrate climate resilience modeling capability for future drought projections.'
  },
  {
    id: 6,
    title: 'Elevated Water Stress Risk',
    shortDesc: 'Water stress reaches HIGH across vulnerable zone.',
    action: 'high_water_stress',
    hint: 'Show analytics chart illustrating projected moisture deficit trajectory.'
  },
  {
    id: 7,
    title: 'Simulate Virtual Irrigation',
    shortDesc: 'Sprinklers activate in 3D twin; animated water mist sprays.',
    action: 'simulate_irrigation',
    hint: 'Watch particle mist in Three.js and real-time moisture recharge begin.'
  },
  {
    id: 8,
    title: 'Moisture Recovery (24% → 38%)',
    shortDesc: 'Zone 2 rehydrates; color shifts from Crimson to Amber to Green.',
    action: 'complete_recovery',
    hint: 'Active alert auto-resolves and recommendation clears.'
  },
  {
    id: 9,
    title: 'Digital Twin Synchronized',
    shortDesc: 'Full closed-loop workflow demonstrated: IoT → Cloud → Twin → Decision.',
    action: 'sync_complete',
    hint: 'Summarize how physical ESP32 sensors will connect in future production.'
  }
];
