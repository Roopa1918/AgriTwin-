// AgriTwin — Unified Farmer-Friendly Telemetry & Digital Twin Context
// Combines 🟢 LIVE WEATHER (Open-Meteo) with 🟡 SIMULATED SENSOR DATA for the active field.

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useFields } from './FieldsContext';
import { useLanguage } from './LanguageContext';
import { fetchLiveWeather } from '../services/weatherService';
import { firebaseBridge } from '../services/firebase';
import { 
  evaluateFieldIrrigation, 
  getSoilProfile, 
  getCropProfile,
  getBaselineZonesForSoil
} from '../services/recommendationEngine';

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const { activeField, updateActiveFieldZone } = useFields();
  const { t } = useLanguage();

  const activeSoil = getSoilProfile(activeField?.soilType || 'sandy_loam');
  const activeCrop = getCropProfile(activeField?.crop || 'Tomato');

  // 1. Live Weather State (Open-Meteo Real Data)
  const [liveWeather, setLiveWeather] = useState({
    temperature: 29,
    humidity: 68,
    rainfall: 0.0,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    conditionIcon: '⛅',
    hourly: [],
    daily: [],
    lastUpdated: 'Just now',
    isLive: true
  });
  const [weatherLoading, setWeatherLoading] = useState(false);

  // 2. Simulated Soil Sensors State for Active Field's 4 Zones
  const [zones, setZones] = useState(() => {
    const soil = getSoilProfile(activeField?.soilType || 'sandy_loam');
    if (activeField?.zones && activeField.zones.length > 0) {
      const isOutOfBounds = activeField.zones.some(z => (z.soilWater || 0) > soil.fc || (z.soilWater || 0) < soil.pwp);
      if (!isOutOfBounds) {
        return activeField.zones;
      }
    }
    return getBaselineZonesForSoil(soil.id);
  });
  const [isDecliningZone2, setIsDecliningZone2] = useState(false);
  const [isIrrigatingZone2, setIsIrrigatingZone2] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState('normal'); // 'slow' (6s), 'normal' (3s), 'fast' (1s)
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [activeScenario, setActiveScenario] = useState('normal'); // 'normal', 'hot', 'hotDry', 'rain'

  // History buffer for graphs (Today / 7 Days / 30 Days)
  const [historyBuffer, setHistoryBuffer] = useState({
    times: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
    zone1: [17, 17, 17, 17, 17, 17, 17],
    zone2: [17, 17, 16, 15, 14, 12, 12],
    zone3: [16, 16, 16, 16, 16, 16, 16],
    zone4: [18.0, 18.0, 18.0, 17.9, 18.0, 18.0, 18.0],
    temperatures: [24, 26, 28, 30, 31, 29, 27],
    rainfall: [0, 0, 0, 0, 0, 2.0, 0]
  });

  // Presentation Stepper
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Sync zones whenever activeField changes
  useEffect(() => {
    if (activeField) {
      const soil = getSoilProfile(activeField.soilType || 'sandy_loam');
      const isOutOfBounds = !activeField.zones || activeField.zones.length === 0 ||
        activeField.zones.some(z => (z.soilWater || 0) > soil.fc || (z.soilWater || 0) < soil.pwp);
      if (isOutOfBounds) {
        setZones(getBaselineZonesForSoil(soil.id));
      } else {
        setZones(activeField.zones);
      }
    }
  }, [activeField?.id, activeField?.soilType]);

  // Fetch real live weather whenever activeField coordinates change
  useEffect(() => {
    let isMounted = true;
    async function loadWeather() {
      if (!activeField) return;
      setWeatherLoading(true);
      const w = await fetchLiveWeather(activeField.latitude, activeField.longitude);
      if (isMounted) {
        setLiveWeather(w);
        setWeatherLoading(false);
      }
    }
    loadWeather();
    // Refresh weather every 10 minutes
    const timer = setInterval(loadWeather, 600000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeField?.latitude, activeField?.longitude]);

  // Simulation Heartbeat Timer (Aligned with active soil profile & crop)
  useEffect(() => {
    if (!isEngineRunning) return;

    const fc = activeSoil.fc;
    const p = activeCrop.depletionFraction || 0.40;
    const refillThreshold = parseFloat((fc - p * (fc - activeSoil.pwp)).toFixed(1)); // e.g. 14.0%
    const criticalFloor = parseFloat((activeSoil.pwp + 2.0).toFixed(1)); // e.g. 10.0%

    const ms = simulationSpeed === 'fast' ? 1000 : simulationSpeed === 'slow' ? 6000 : 3000;
    const interval = setInterval(() => {
      setZones(prevZones => {
        return prevZones.map(z => {
          let updatedWater = z.soilWater;

          if (z.id === 'zone2') {
            if (isDecliningZone2) {
              // Gradual drying down to critical demo floor (e.g. 11.5% VWC for Sandy Loam)
              const demoFloor = Math.max(criticalFloor + 1.0, refillThreshold - 2.5);
              if (updatedWater > demoFloor) {
                updatedWater = parseFloat((updatedWater - 0.25).toFixed(1));
              }
            } else if (isIrrigatingZone2) {
              // Virtual Irrigation: moisture rises up to Field Capacity (e.g. 17.8% VWC)
              if (updatedWater < (fc - 0.2)) {
                updatedWater = parseFloat((updatedWater + 0.5).toFixed(1));
              } else {
                updatedWater = parseFloat((fc - 0.2).toFixed(1));
                setIsIrrigatingZone2(false); // Finished watering
              }
            } else {
              // Gentle natural micro-drift
              updatedWater = parseFloat((updatedWater + (Math.random() - 0.5) * 0.06).toFixed(1));
            }
          } else {
            // Other zones hover smoothly in optimal / RAW range
            updatedWater = parseFloat((updatedWater + (Math.random() - 0.5) * 0.05).toFixed(1));
          }

          // Strict Physical Boundary Enforcement:
          // In steady state without rain, moisture cannot exceed Field Capacity or fall below PWP
          const maxAllowed = (activeScenario === 'rain' || (liveWeather?.rainfall || 0) > 0) ? activeSoil.sat : fc;
          updatedWater = Math.min(maxAllowed, Math.max(activeSoil.pwp, updatedWater));
          updatedWater = parseFloat(updatedWater.toFixed(1));

          // Determine farmer-friendly status strictly against scientific thresholds
          let status = 'Good';
          if (updatedWater <= refillThreshold) {
            status = 'Needs Water';
          } else if (Math.round(updatedWater) < Math.round(fc)) {
            status = 'Watch';
          }

          // Log to simulated telemetry bridge with explicit simulation tag
          firebaseBridge.addSensorReading({
            sensorId: z.sensorId || 'SM-Z02',
            zoneId: z.name,
            parameter: 'Soil Water',
            value: updatedWater,
            unit: '% VWC (Simulated)',
            status: 'OK'
          });

          return {
            ...z,
            soilWater: updatedWater,
            status
          };
        });
      });
    }, ms);

    return () => clearInterval(interval);
  }, [isEngineRunning, simulationSpeed, isDecliningZone2, isIrrigatingZone2, activeSoil.id, activeCrop.crop]);

  // Derived Aggregate Values for Home Dashboard & Reports (Deliberate half-up rounding: 16.45% -> 16.5%)
  const avgSoilWater = zones.length > 0
    ? String(Math.round(zones.reduce((sum, z) => sum + (z.soilWater || 0), 0) / zones.length))
    : '17';

  const z2 = zones.find(z => z.id === 'zone2') || zones[1] || zones[0];
  const z2Water = z2?.soilWater ?? 12;

  // Single Central Scientific Recommendation Engine (Requirement D: No conflicting advice)
  const scientificRecommendation = evaluateFieldIrrigation({
    field: activeField,
    zones,
    weather: liveWeather
  });

  // Simple Farmer Recommendation (mapped directly from scientific recommendation)
  const simpleRecommendation = {
    title: scientificRecommendation.title,
    text: scientificRecommendation.text,
    reason: scientificRecommendation.reason,
    action: scientificRecommendation.action,
    status: scientificRecommendation.status,
    priority: scientificRecommendation.priority,
    adviceStatus: scientificRecommendation.adviceStatus,
    adviceReason: scientificRecommendation.adviceReason,
    nextStep: scientificRecommendation.nextStep
  };

  // Field Status Badges & Text (Synchronized with scientific recommendation)
  let fieldStatusText = t('telemetry.statusGoodText');
  let fieldStatusMessage = t('telemetry.statusGoodMsg');
  let fieldStatusBadge = `🟢 ${t('telemetry.statusGoodText')}`;

  if (!liveWeather?.isOffline && typeof liveWeather?.rainfall === 'number' && liveWeather.rainfall > 5.0) {
    fieldStatusText = t('telemetry.statusRainText');
    fieldStatusMessage = t('telemetry.statusRainMsg');
    fieldStatusBadge = `🔵 ${t('telemetry.statusRainText')}`;
  } else if (scientificRecommendation.status === 'NEEDS_WATER') {
    fieldStatusText = t('telemetry.statusNeedsWaterText');
    fieldStatusMessage = scientificRecommendation.adviceReason;
    fieldStatusBadge = `🔴 ${t('telemetry.statusNeedsWaterText')}`;
  } else if (scientificRecommendation.status === 'WATCH') {
    fieldStatusText = t('telemetry.statusWatchText');
    fieldStatusMessage = scientificRecommendation.adviceReason;
    fieldStatusBadge = `🟡 ${t('telemetry.statusWatchText')}`;
  }

  // Water Need Assessment (Synchronized with scientific depletion)
  const waterNeed = scientificRecommendation.status === 'NEEDS_WATER' 
    ? t('telemetry.waterNeedHigh') 
    : scientificRecommendation.status === 'WATCH' 
    ? t('telemetry.waterNeedMedium') 
    : t('telemetry.waterNeedLow');

  // Crop Condition Assessment
  const cropCondition = scientificRecommendation.status === 'NEEDS_WATER'
    ? t('telemetry.cropConditionAttention')
    : scientificRecommendation.status === 'WATCH'
    ? t('telemetry.cropConditionModerate')
    : t('telemetry.cropConditionGood');

  // Farmer-Friendly Virtual Irrigation Action
  const waterZone2 = () => {
    setIsDecliningZone2(false);
    setIsIrrigatingZone2(true);
  };

  // Demo Triggers (Presentation Mode)
  const triggerLowMoisture = () => {
    setIsDecliningZone2(true);
    setIsIrrigatingZone2(false);
  };

  const resetDemo = () => {
    setIsDecliningZone2(false);
    setIsIrrigatingZone2(false);
    setActiveScenario('normal');
    setCurrentEventIndex(0);
    setZones(getBaselineZonesForSoil(activeSoil.id));
  };

  return (
    <TelemetryContext.Provider value={{
      liveWeather,
      weatherLoading,
      zones,
      avgSoilWater,
      z2Water,
      fieldStatusText,
      fieldStatusMessage,
      fieldStatusBadge,
      waterNeed,
      cropCondition,
      simpleRecommendation,
      scientificRecommendation,
      activeSoil,
      activeCrop,
      waterZone2,
      isIrrigatingZone2,
      // Demo Controls
      simulationSpeed,
      setSimulationSpeed,
      isEngineRunning,
      setIsEngineRunning,
      activeScenario,
      setActiveScenario,
      triggerLowMoisture,
      resetDemo,
      historyBuffer,
      // Presentation Stepper
      isPresentationMode,
      setIsPresentationMode,
      currentEventIndex,
      setCurrentEventIndex
    }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return context;
}
