// AgriTwin — Automated Alert System & Anomaly Detection Engine

import { SOIL_PROFILES, DEMO_THRESHOLDS } from '../data/demoConfiguration';

export function checkAlertConditions({
  zones = [],
  sensors = [],
  previousMoistureState = {},
  soilType = 'sandy_loam',
  thresholds = DEMO_THRESHOLDS
}) {
  const generatedAlerts = [];
  const soil = SOIL_PROFILES[soilType] || SOIL_PROFILES.sandy_loam;
  const fc = soil.fc;
  const pwp = soil.pwp;
  const refillThreshold = parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1)); // e.g. 14.0%
  const criticalWiltThreshold = parseFloat((pwp + 2.0).toFixed(1));        // e.g. 10.0%
  const tempWarning = thresholds?.temperature?.warning ?? 34.0;

  // 1. Zone-specific checks
  zones.forEach(zone => {
    const moisture = typeof zone.soilWater === 'number' ? zone.soilWater : (zone.moisture ?? fc);
    const prevMoisture = previousMoistureState[zone.id] ?? moisture;
    const dropRate = prevMoisture - moisture;

    // Critical wilt hazard (approaching PWP)
    if (moisture <= criticalWiltThreshold) {
      generatedAlerts.push({
        zoneId: zone.id,
        zoneName: zone.shortName || zone.name,
        type: 'CRITICAL_WILT',
        severity: 'CRITICAL',
        message: `${zone.shortName || zone.name} soil water (${Math.round(moisture)}%) is dangerously close to Permanent Wilting Point (${Math.round(pwp)}%).`,
        recommendedAction: 'Trigger irrigation cycle immediately to avoid permanent plant wilt.'
      });
    }
    // Depletion beyond Readily Available Water (Refill point)
    else if (moisture <= refillThreshold) {
      generatedAlerts.push({
        zoneId: zone.id,
        zoneName: zone.shortName || zone.name,
        type: 'LOW_MOISTURE',
        severity: 'WARNING',
        message: `${zone.shortName || zone.name} soil water (${Math.round(moisture)}%) is at or below the ${Math.round(refillThreshold)}% refill point (RAW depleted).`,
        recommendedAction: 'Schedule irrigation cycle today to restore root zone to Field Capacity.'
      });
    }

    // Rapid decline (> 1.5% drop in simulation window)
    if (dropRate > 1.2 && moisture > criticalWiltThreshold) {
      generatedAlerts.push({
        zoneId: zone.id,
        zoneName: zone.shortName || zone.name,
        type: 'RAPID_DECLINE',
        severity: 'WARNING',
        message: `${zone.shortName || zone.name} soil water is decreasing rapidly (-${Math.round(dropRate)}%).`,
        recommendedAction: 'Inspect root-zone infiltration and verify soil matrix drainage.'
      });
    }
  });

  // 2. Weather & Sensor network checks
  sensors.forEach(sensor => {
    // Sensor offline
    if (sensor.status === 'Offline') {
      generatedAlerts.push({
        zoneId: sensor.zoneId || 'field',
        zoneName: sensor.zoneName || 'Sensor Network',
        type: 'SENSOR_OFFLINE',
        severity: 'WARNING',
        message: `No recent reading received from sensor ${sensor.sensorId} (${sensor.name}).`,
        recommendedAction: 'Verify ESP32 gateway heartbeat and wireless RSSI transmission.'
      });
    }

    // High temperature
    if (sensor.sensorId === 'TEMP-01' && sensor.value >= tempWarning) {
      generatedAlerts.push({
        zoneId: 'field',
        zoneName: 'Field Weather Station',
        type: 'HIGH_TEMPERATURE',
        severity: 'WARNING',
        message: `Ambient temperature (${sensor.value.toFixed(1)}°C) exceeds the thermal comfort threshold.`,
        recommendedAction: 'Assess crop heat stress index and check evapotranspiration spikes.'
      });
    }

    // Rainfall detection
    if (sensor.sensorId === 'RAIN-01' && sensor.value > 2.0) {
      generatedAlerts.push({
        zoneId: 'field',
        zoneName: 'Field Weather Station',
        type: 'RAINFALL_DETECTED',
        severity: 'INFO',
        message: `Precipitation event detected (${sensor.value.toFixed(1)} mm). Irrigation requirements updated.`,
        recommendedAction: 'Irrigation scheduled for all zones has been automatically postponed.'
      });
    }
  });

  return generatedAlerts;
}
