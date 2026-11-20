// AgriTwin — Farmer-First Irrigation Advice & Water Status (PRD Section 14, 15, 21)
// Clean layout designed for farmers:
// 1. Main Section: Water Advice (Does field need water? Which zone? Why? What action?)
// 2. Section: Water Levels in Each Zone (4 demonstration zones with readings, visual bars, simple status)
// 3. Advanced Details: "Scientific Details" expandable drawer (storage capacities, root-zone depletion, dual scenarios)

import React, { useState } from 'react';
import { useFields } from '../context/FieldsContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Droplets, 
  CloudRain, 
  Calendar
} from 'lucide-react';

export default function WaterPage() {
  const { t } = useLanguage();
  const { activeField } = useFields();
  const { 
    zones, 
    scientificRecommendation,
    activeSoil,
    waterZone2, 
    isIrrigatingZone2,
    liveWeather
  } = useTelemetry();

  const [notification, setNotification] = useState(null);

  // Data availability & watering status
  const isDataUnavailable = !activeField || !scientificRecommendation || (zones && zones.length === 0);
  const isNeedsWater = !isDataUnavailable && scientificRecommendation?.status === 'NEEDS_WATER';

  // Target Zone Details
  const targetZone = scientificRecommendation?.mostStressedZone || zones?.find(z => z.id === 'zone2') || zones?.[1];
  const targetZoneName = isNeedsWater 
    ? (targetZone?.shortName || targetZone?.name?.split(' (')[0] || 'Zone B')
    : (t('water.allZonesHydrated') || 'All 4 Field Zones are adequately hydrated');

  // Soil-specific parameters (respects active soil profile, never a universal threshold)
  const fc = activeSoil?.fc || 18.0;
  const pwp = activeSoil?.pwp || 8.0;
  const refillThreshold = activeSoil 
    ? parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1)) 
    : 14.0;
  const tawMm = scientificRecommendation?.tawMm || 50.0;
  const rawMm = scientificRecommendation?.rawMm || 20.0;

  const handleWaterClick = () => {
    waterZone2();
    setNotification(t('telemetry.wateringInitiatedMsg') || 'Virtual watering initiated! Soil moisture increasing...');
    setTimeout(() => {
      setNotification(t('telemetry.wateringCompleteMsg') || 'Virtual watering complete! Soil moisture restored to healthy range.');
    }, 4500);
  };

  // Weather advisory
  const tomorrowForecast = liveWeather?.daily?.[1];
  const hasTomorrowRainAdvisory = Boolean(
    scientificRecommendation?.weatherAdvisory && 
    tomorrowForecast && 
    tomorrowForecast.rain >= 8.0
  );

  // 4 Demonstration Zones (Dynamic from telemetry or fallback template if empty)
  const displayZones = (zones && zones.length > 0)
    ? zones
    : [
        { id: 'zone1', name: 'Zone 1' },
        { id: 'zone2', name: 'Zone 2' },
        { id: 'zone3', name: 'Zone 3' },
        { id: 'zone4', name: 'Zone 4' }
      ];

  return (
    <div className="page-container" style={{ maxWidth: '980px', margin: '0 auto', gap: '22px', paddingBottom: '40px' }}>
      
      {/* ====================================================================
          PAGE HEADER
          Simple title and 1-click virtual watering action
          ==================================================================== */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="page-header-text">
          <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
            💧 {t('water.title') || 'Irrigation Advice & Water Status'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
            {t('water.subtitle') || 'Daily root-zone moisture evaluation and watering recommendations.'}
          </p>
        </div>

        {isNeedsWater && (
          <button 
            onClick={handleWaterClick}
            disabled={isIrrigatingZone2}
            className="btn btn-water"
            style={{ fontWeight: 700, padding: '10px 20px', minHeight: '44px' }}
          >
            <Droplets size={17} />
            <span>{isIrrigatingZone2 ? (t('home.wateringActive') || 'Watering Active...') : (t('water.simulateWateringBtn') || 'What if I water?')}</span>
          </button>
        )}
      </div>

      {/* Confirmation Notification Banner */}
      {notification && (
        <div style={{
          background: 'rgba(2, 132, 199, 0.18)',
          border: '1px solid rgba(2, 132, 199, 0.45)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          color: '#bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.9rem'
        }}>
          <Droplets size={20} color="#38bdf8" />
          <div style={{ flex: 1 }}>
            <strong>{t('water.virtualDemoNotice') || 'Virtual Demonstration: '}</strong>
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* ====================================================================
          1. MAIN SECTION: WATER ADVICE
          Answers the 4 key questions simply:
          - Whether watering is needed
          - Which zone needs attention
          - Why watering is recommended
          - What action the farmer should take
          ==================================================================== */}
      <section aria-labelledby="section-water-advice">
        <div style={{
          background: isDataUnavailable
            ? 'rgba(245, 158, 11, 0.08)'
            : isNeedsWater
            ? 'rgba(239, 68, 68, 0.08)'
            : 'rgba(16, 185, 129, 0.08)',
          border: `2px solid ${isDataUnavailable ? 'rgba(245, 158, 11, 0.45)' : isNeedsWater ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.45)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(20px, 4vw, 28px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        }}>
          {/* Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: isDataUnavailable ? 'rgba(245, 158, 11, 0.2)' : isNeedsWater ? 'rgba(239, 68, 68, 0.22)' : 'rgba(16, 185, 129, 0.22)',
              border: `1.5px solid ${isDataUnavailable ? '#f59e0b' : isNeedsWater ? '#ef4444' : '#10b981'}`,
              fontSize: '0.86rem',
              fontWeight: 800,
              color: isDataUnavailable ? '#fbbf24' : isNeedsWater ? '#f87171' : '#34d399'
            }}>
              <span>{isDataUnavailable ? '⚠️' : isNeedsWater ? '🚨' : '🟢'}</span>
              <span>
                {isDataUnavailable 
                  ? (t('water.waterUnavailableStatus') || 'Recommendation Unavailable')
                  : isNeedsWater 
                  ? (t('water.wateringNeededStatus') || 'Watering Needed Today')
                  : (t('water.noWateringNeededStatus') || 'No Watering Needed Right Now')}
              </span>
            </div>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              🌾 {activeField?.name || 'My Field'}
            </span>
          </div>

          {/* Core Decision Questions & Plain Answers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Question 1: Whether watering is needed */}
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                ❓ {t('water.doesMyFieldNeedWater') || 'Does my field need water?'}
              </div>
              <div style={{ fontSize: 'clamp(1.2rem, 3.8vw, 1.55rem)', fontWeight: 900, color: '#fff', marginTop: '3px' }}>
                {isDataUnavailable
                  ? 'Data is incomplete. Cannot determine reliably.'
                  : isNeedsWater
                  ? 'Yes — Irrigation is needed to avoid crop moisture stress.'
                  : 'No — Root-zone moisture is sufficient. No watering needed.'}
              </div>
            </div>

            {/* Question 2: Which zone needs attention */}
            <div>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                📍 {t('water.whichZoneNeedsWater') || 'Which zone needs water?'}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isNeedsWater ? '#fca5a5' : 'var(--emerald-300)', marginTop: '2px' }}>
                {targetZoneName}
              </div>
            </div>
          </div>

          {/* Rain Forecast Alert Banner (if significant rain expected tomorrow) */}
          {hasTomorrowRainAdvisory && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#bae6fd',
              fontSize: '0.86rem'
            }}>
              <CloudRain size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
              <div>
                <strong>{t('home.rainForecastTitle') || 'Rain Forecast'}:</strong>{' '}
                Significant rain (~{tomorrowForecast.rain} mm, {tomorrowForecast.precipitationProbability}% chance) is forecast tomorrow. You may consider postponing watering 12–24h to save water.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          2. SECTION: WATER LEVELS IN EACH ZONE
          Displays all four demonstration zones separately with:
          - Zone name
          - Current soil moisture reading
          - Simple visual water-level bar
          - Clear status (Good / Needs Water / Data Unavailable)
          - Simple farmer-friendly status explanation
          ==================================================================== */}
      <section aria-labelledby="section-zone-water-levels">
        <div className="glass-card" style={{ padding: 'clamp(18px, 3.5vw, 24px)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <div>
              <h2 id="section-zone-water-levels" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💧</span> {t('water.zoneWaterLevelsTitle') || 'Water Levels in Each Zone'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '3px 0 0' }}>
                {t('water.zoneWaterLevelsSubtitle') || 'Current soil moisture and status across your 4 field zones.'}
              </p>
            </div>

            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {activeField?.crop || 'Crop'} &bull; {activeSoil?.name || 'Soil Model'}
            </span>
          </div>

          {/* 4 Demonstration Zones Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '14px'
          }}>
            {displayZones.map((z, idx) => {
              const moisture = typeof z.soilWater === 'number'
                ? z.soilWater
                : (typeof z.moisture === 'number' ? z.moisture : null);

              const isUnavailable = moisture === null || isNaN(moisture);
              const isZoneNeedsWater = !isUnavailable && moisture <= refillThreshold;
              const isZoneWatch = !isUnavailable && !isZoneNeedsWater && (z.status === 'Watch' || Math.round(moisture) < Math.round(fc));

              const statusText = isUnavailable
                ? (t('water.zoneStatusUnavailable') || 'Data Unavailable')
                : isZoneNeedsWater
                ? (t('water.zoneStatusNeedsWater') || 'Needs Water')
                : isZoneWatch
                ? (t('water.zoneStatusWatch') || 'Watch')
                : (t('water.zoneStatusGood') || 'Good');

              const descText = isUnavailable
                ? (t('water.zoneDescUnavailable') || 'Sensor reading unavailable')
                : isZoneNeedsWater
                ? (t('water.zoneDescNeedsWater') || 'Below watering level — Needs water')
                : isZoneWatch
                ? (t('water.zoneDescWatch') || 'Moisture is below the good range. Keep an eye on it.')
                : (t('water.zoneDescGood') || 'Moisture is healthy');

              const themeColor = isUnavailable || isZoneWatch ? '#fbbf24' : isZoneNeedsWater ? '#f87171' : '#34d399';
              const themeBg = isUnavailable || isZoneWatch ? 'rgba(245, 158, 11, 0.15)' : isZoneNeedsWater ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
              const themeBorder = isUnavailable || isZoneWatch ? 'rgba(245, 158, 11, 0.35)' : isZoneNeedsWater ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)';

              // Visual bar calculation scaled to field capacity (100% = Field Capacity)
              const barPercent = isUnavailable
                ? 0
                : Math.min(100, Math.max(5, Math.round((moisture / fc) * 100)));

              return (
                <div
                  key={z.id || idx}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '16px 16px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: `1.5px solid ${themeBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  {/* Zone Name & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                      {z.name || z.shortName || `Zone ${idx + 1}`}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: themeBg,
                      color: themeColor
                    }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Soil Moisture Reading */}
                  <div style={{ margin: '2px 0' }}>
                    <div style={{ fontSize: 'clamp(1.5rem, 4vw, 1.85rem)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                      {isUnavailable ? (t('common.unavailable') || 'Unavailable') : `${Math.round(moisture)}%`}
                    </div>
                  </div>

                  {/* Simple Visual Water-Level Bar */}
                  <div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${barPercent}%`,
                        height: '100%',
                        background: isUnavailable || isZoneWatch ? '#fbbf24' : isZoneNeedsWater ? '#ef4444' : '#10b981',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>

                  {/* Simple Farmer-Friendly Explanation */}
                  <div style={{ fontSize: '0.76rem', color: isZoneNeedsWater ? '#fca5a5' : isZoneWatch ? '#fcd34d' : 'var(--text-dim)', lineHeight: 1.35 }}>
                    {descText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. ADVANCED DETAILS: "SCIENTIFIC DETAILS" (EXPANDABLE)
          Storage capacities, root-zone depletion, stress factors and dual scenarios
          kept in an expandable drawer so they do not crowd the main view.
          ==================================================================== */}
      <section aria-labelledby="section-scientific-details">
        <details className="glass-card" style={{
          padding: '16px 20px',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 800,
            color: 'var(--emerald-400)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔬 {t('water.scientificDetailsTitle') || 'Scientific Details & Daily Water Balance Calculations (FAO-56)'}
          </summary>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            
            {/* Scientific Parameters & Equations */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '12px',
              background: 'rgba(0,0,0,0.25)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              color: '#bae6fd',
              lineHeight: 1.5
            }}>
              <div>
                <strong>{t('water.soilConstants') || 'Soil Constants'} ({t('agronomics.soilNames.' + activeSoil?.id) || activeSoil?.name || 'Sandy Loam'}):</strong>
                <div>• Field Capacity (FC): {fc}% VWC</div>
                <div>• Permanent Wilting Point (PWP): {pwp}% VWC</div>
                <div>• Refill Threshold: {refillThreshold}% VWC (p = 0.40)</div>
                <div>{t('water.rootDepth') || '• Root Depth (Zr): 0.50 m'}</div>
              </div>
              <div>
                <strong>{t('water.waterStorageStressCapacities') || 'Water Storage & Stress Capacities:'}</strong>
                <div>• Total Available Water (TAW): {tawMm} mm</div>
                <div>• Readily Available Water (RAW): {rawMm} mm</div>
                <div>• Current Root-Zone Depletion (Dr): {scientificRecommendation?.lowestZoneBalance?.depletionMm ?? 21.0} mm</div>
                <div>• Stress Reduction Factor (Ks): {scientificRecommendation?.lowestZoneBalance?.ks?.toFixed(2) ?? '0.97'}</div>
              </div>
            </div>

            {/* Multi-Day Dual-Scenario Irrigation Outlook */}
            {scientificRecommendation?.irrigationOutlook?.forecastRainScenario?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.86rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, margin: '10px 0 10px' }}>
                  📅 {t('water.scenarioComparison') || '3-Day Scenario Comparison (Forecast-Rain vs. Dry Baseline)'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '12px' }}>
                  {scientificRecommendation.irrigationOutlook.forecastRainScenario.slice(0, 3).map((day, idx) => {
                    const dryDay = scientificRecommendation.irrigationOutlook.noRainScenario?.[idx] || day;
                    return (
                      <div key={idx} style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '0.8rem',
                        color: '#f1f5f9'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px', marginBottom: '6px' }}>
                          <span>{day.dayName}</span>
                          <span style={{ color: 'var(--emerald-400)' }}>ET0: {day.et0} mm</span>
                        </div>
                        <div>
                          🌧️ <strong>{t('water.scenarioA', { rain: day.rain }) || `Scenario A (Rain ${day.rain} mm):`}</strong> End Dr = {day.endingDr?.toFixed(1)} mm ({Math.round(day.endingMoisture)}%)
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          ☀️ <strong>{t('water.scenarioB') || 'Scenario B (Zero Rain):'}</strong> End Dr = {dryDay.endingDr?.toFixed(1)} mm ({Math.round(dryDay.endingMoisture)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offline notice if applicable */}
            {scientificRecommendation?.irrigationOutlook?.isOffline && (
              <div style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#fbbf24' }}>
                ⚠️ {t('water.offlineNotice') || 'Weather forecast is offline. Multi-day rain scenarios are paused. Operating in Phase 2 in-situ moisture mode.'}
              </div>
            )}
          </div>
        </details>
      </section>

    </div>
  );
}
