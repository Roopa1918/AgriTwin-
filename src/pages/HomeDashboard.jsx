// AgriTwin — Simplified Farmer-First Home Dashboard
// Designed for real farmers:
// 1. Simple Welcome Header (Farm, Crop, Greeting)
// 2. One Main Water Advice Card (Does crop need water? Which zone? Why? What action to take?)
// 3. Two Simple Information Cards (Today's Weather & Rain Forecast)
// 4. Optional Field Information (Crop & Field size summary, subtle data honesty notice)

import React from 'react';
import { useFields } from '../context/FieldsContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Droplets, 
  Sun, 
  CloudRain, 
  ArrowRight
} from 'lucide-react';

export default function HomeDashboard({ setTab }) {
  const { activeField } = useFields();
  const { t } = useLanguage();
  const { 
    liveWeather, 
    avgSoilWater, 
    z2Water, 
    zones, 
    waterZone2, 
    isIrrigatingZone2, 
    scientificRecommendation 
  } = useTelemetry();

  // Field Data
  const fieldName = activeField?.name || t('home.myField') || 'My Field';
  const cropName = activeField?.crop || 'Tomato';
  const areaText = activeField?.area || '2.5 Acres (1.0 Ha)';
  const cropIcon = activeField?.cropIcon || '🍅';

  // Data Availability Check — Never invent a recommendation when data is missing
  const isDataUnavailable = !activeField || !scientificRecommendation || (!avgSoilWater && !z2Water && (!zones || zones.length === 0));

  // Irrigation Status from Unified Recommendation Engine
  const isWaterLow = !isDataUnavailable && scientificRecommendation?.status === 'NEEDS_WATER';

  // Target Zone Details (e.g. Zone 2 / Zone B)
  const targetZoneName = isWaterLow 
    ? (scientificRecommendation?.mostStressedZone?.shortName || scientificRecommendation?.mostStressedZone?.name || 'Zone 2 (Zone B)')
    : (t('myFields.allZonesAdequate') || 'All 4 Field Zones');

  const targetAreaText = isWaterLow 
    ? (scientificRecommendation?.targetAreaText || '0.63 Acre Plot') 
    : areaText;

  // Condition translation helper
  const getTranslatedCondition = (condition) => {
    if (!condition) return t('weather.weatherConditions.unavailable') || 'Weather Unavailable';
    const normalized = condition.toLowerCase().replace(/[^a-z]/g, '');
    const map = {
      clearsky: 'clearSky',
      mainlyclear: 'mainlyClear',
      partlycloudy: 'partlyCloudy',
      overcast: 'overcast',
      foggy: 'foggy',
      lightdrizzle: 'lightDrizzle',
      slightrain: 'slightRain',
      moderaterain: 'moderateRain',
      heavyrain: 'heavyRain',
      rainshowers: 'rainShowers',
      thunderstorm: 'thunderstorm',
      weatherunavailable: 'unavailable'
    };
    const key = map[normalized];
    return key ? (t(`weather.weatherConditions.${key}`) || condition) : condition;
  };

  // Weather availability check
  const hasWeatherTemp = typeof liveWeather?.temperature === 'number';
  const isLive = Boolean(liveWeather?.isLive && !liveWeather?.isStale);
  const isCached = Boolean(liveWeather?.isStale);
  const isOffline = Boolean(liveWeather?.isOffline);

  const weatherBadgeText = isLive 
    ? `🟢 ${t('common.live') || 'Live'} (Open-Meteo)`
    : isCached 
    ? `🕒 ${t('common.cached') || 'Cached'} (${liveWeather?.ageHours || 1}h)` 
    : `⚠️ ${t('home.weatherUnavailable') || 'Offline'}`;

  const tempDisplay = hasWeatherTemp 
    ? `${liveWeather.temperature}°C` 
    : (t('home.weatherUnavailable') || 'Unavailable');

  const conditionDisplay = getTranslatedCondition(liveWeather?.condition || 'Partly Cloudy');
  const conditionIcon = liveWeather?.conditionIcon || '⛅';

  // Tomorrow rain details
  const tomorrowForecast = liveWeather?.daily?.[1];
  const tomorrowRain = (typeof tomorrowForecast?.rain === 'number') ? tomorrowForecast.rain : 0.0;
  const tomorrowProb = tomorrowForecast?.precipitationProbability || 0;
  const todayRain = (typeof liveWeather?.rainfall === 'number') ? liveWeather.rainfall : 0.0;
  const hasTomorrowRain = Boolean(!isOffline && tomorrowForecast && tomorrowRain > 0);

  // Dynamic Theme Styling for Main Advice Card
  const adviceTheme = isDataUnavailable
    ? {
        border: 'rgba(245, 158, 11, 0.45)',
        bg: 'rgba(245, 158, 11, 0.08)',
        pillBg: 'rgba(245, 158, 11, 0.2)',
        pillBorder: '#f59e0b',
        color: '#fbbf24',
        badge: t('home.farmStatusUnavailable') || 'Farm Status: Data Unavailable'
      }
    : isWaterLow
    ? {
        border: 'rgba(239, 68, 68, 0.45)',
        bg: 'rgba(239, 68, 68, 0.08)',
        pillBg: 'rgba(239, 68, 68, 0.22)',
        pillBorder: '#ef4444',
        color: '#f87171',
        badge: t('home.farmStatusAttention') || 'Attention: Low Moisture in Zone B'
      }
    : {
        border: 'rgba(16, 185, 129, 0.45)',
        bg: 'rgba(16, 185, 129, 0.08)',
        pillBg: 'rgba(16, 185, 129, 0.22)',
        pillBorder: '#10b981',
        color: '#34d399',
        badge: t('home.farmStatusGood') || 'Farm Status: Normal & Healthy'
      };

  return (
    <div className="page-container" style={{ gap: '22px', maxWidth: '980px', margin: '0 auto', paddingBottom: '30px' }}>
      
      {/* ====================================================================
          1. SIMPLE WELCOME HEADER
          AgriTwin branding, selected farm, selected crop, simple greeting.
          ==================================================================== */}
      <header 
        className="glass-card" 
        style={{
          padding: 'clamp(16px, 3vw, 22px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          {/* Brand & Farm Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.35))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.65rem',
              flexShrink: 0
            }}>
              🌱
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('home.farmerGreeting') || 'Hello, Farmer'}
              </div>
              <h1 style={{ fontSize: 'clamp(1.3rem, 4.2vw, 1.65rem)', fontWeight: 800, color: '#fff', margin: '2px 0 0', lineHeight: 1.2 }}>
                {fieldName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>{cropIcon} {cropName}</span>
                <span>&bull;</span>
                <span>{areaText}</span>
              </div>
            </div>
          </div>

          {/* Simple Change Field Action */}
          <button 
            onClick={() => setTab('my-fields')}
            className="btn btn-secondary btn-sm"
            style={{ 
              padding: '10px 18px', 
              fontWeight: 700, 
              minHeight: '42px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <span>{t('common.changeField') || 'Change Field'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* ====================================================================
          2. ONE MAIN WATER ADVICE CARD (MOST PROMINENT SECTION)
          Answers:
          - Does my crop need water?
          - Which zone needs attention?
          - Why is watering recommended?
          - What action should the farmer take?
          ==================================================================== */}
      <section aria-labelledby="section-main-water-advice">
        <div style={{
          background: adviceTheme.bg,
          border: `2px solid ${adviceTheme.border}`,
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(20px, 4.5vw, 28px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
        }}>
          {/* Top Status Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: adviceTheme.pillBg,
              border: `1.5px solid ${adviceTheme.pillBorder}`,
              fontSize: '0.86rem',
              fontWeight: 800,
              color: adviceTheme.color
            }}>
              <span>{isDataUnavailable ? '⚠️' : isWaterLow ? '🚨' : '✅'}</span>
              <span>{adviceTheme.badge}</span>
            </div>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {t('home.assistantBrand') || 'AgriTwin Smart Farming Assistant'}
            </span>
          </div>

          {/* Core Decision: Headline */}
          <div>
            <div style={{ fontSize: '0.84rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              {t('home.waterAdviceQuestion') || 'Does my crop need water?'}
            </div>
            <h2 id="section-main-water-advice" style={{ 
              fontSize: 'clamp(1.45rem, 5vw, 2.0rem)', 
              fontWeight: 900, 
              color: '#fff', 
              margin: '6px 0 0',
              lineHeight: 1.2
            }}>
              {isDataUnavailable
                ? (t('home.waterUnavailableTitle') || 'Watering Recommendation Unavailable')
                : isWaterLow
                ? (t('home.waterNeededTitle') || 'Water May Be Needed')
                : (t('home.waterNotNeededTitle') || 'No Watering Needed Right Now')}
            </h2>
          </div>

          {/* Plain-Language Explanation & Affected Zone */}
          {isDataUnavailable ? (
            <p style={{ fontSize: '0.96rem', color: '#fde68a', margin: 0, lineHeight: 1.5 }}>
              {t('home.waterUnavailableDesc') || 'Soil moisture or field data is missing. A reliable watering recommendation cannot be calculated safely.'}
            </p>
          ) : isWaterLow ? (
            <p style={{ fontSize: '0.98rem', color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
              {t('home.waterNeededShortDesc', { zone: targetZoneName }) || `Soil moisture in ${targetZoneName} is below the watering level. Watering is recommended today to protect crop health.`}
            </p>
          ) : (
            <p style={{ fontSize: '0.98rem', color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
              {t('home.waterNotNeededDesc') || 'Soil moisture across your field is adequate. Your crops have sufficient water in the root zone.'}
            </p>
          )}

          {/* Tomorrow Rain Advisory (If rain is forecast tomorrow) */}
          {isWaterLow && scientificRecommendation?.weatherAdvisory && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.86rem',
              color: '#bae6fd',
              lineHeight: 1.45
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🌦️</span>
              <div>
                <strong>{t('home.rainForecastTitle') || 'Rain Forecast'}:</strong>{' '}
                {t('home.rainAlertNote', { 
                  rain: scientificRecommendation.weatherAdvisory.forecastRainTomorrow, 
                  prob: scientificRecommendation.weatherAdvisory.precipitationProbability 
                }) || `Rain (~${scientificRecommendation.weatherAdvisory.forecastRainTomorrow} mm, ${scientificRecommendation.weatherAdvisory.precipitationProbability}%) is forecast tomorrow. If rain appears certain, you can postpone watering to save water.`}
              </div>
            </div>
          )}

          {/* Action Box: What action should the farmer take? */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '16px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              👉 {t('home.whatToDoNext') || 'What should I do next?'}
            </div>
            <div style={{ fontSize: '1.02rem', fontWeight: 700, color: adviceTheme.color, lineHeight: 1.4 }}>
              {isDataUnavailable
                ? (t('home.actionWaterUnavailable') || 'Check your field setup or sensor connection to see recommendations.')
                : isWaterLow
                ? (t('home.actionWaterNeeded', { zone: targetZoneName }) || `Turn on irrigation for ${targetZoneName} today to restore healthy soil moisture.`)
                : (t('home.actionWaterNotNeeded') || 'Keep irrigation motor OFF today. Check back tomorrow morning.')}
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '12px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Optional Demo Watering Simulator Button */}
              {isWaterLow && (
                <button
                  type="button"
                  onClick={waterZone2}
                  className="btn btn-water btn-sm"
                  style={{ minHeight: '42px', fontWeight: 700, padding: '8px 16px' }}
                >
                  <Droplets size={16} />
                  <span>{isIrrigatingZone2 ? (t('home.wateringActive') || 'Watering Active...') : (t('home.simulateWatering') || 'What if I water?')}</span>
                </button>
              )}

              {/* Link to Water Page */}
              <button
                type="button"
                onClick={() => setTab('water')}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '42px', fontWeight: 700, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{t('home.viewWaterDetails') || 'View Water Details'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. TWO SIMPLE INFORMATION CARDS
          Card 1: Today's Weather (temperature & simple description)
          Card 2: Rain Forecast (expected rainfall & rain chance)
          ==================================================================== */}
      <section aria-labelledby="section-simple-weather-info">
        <h3 id="section-simple-weather-info" className="sr-only">
          Weather and Rain Information
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Today's Weather */}
          <div 
            className="glass-card" 
            style={{ 
              padding: 'clamp(18px, 3.5vw, 24px)', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sun size={20} color="#fbbf24" />
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                    {t('home.todayWeatherTitle') || "Today's Weather"}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isLive ? '#34d399' : isCached ? '#38bdf8' : '#fbbf24',
                  background: isLive ? 'rgba(16, 185, 129, 0.15)' : isCached ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.3)' : isCached ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {weatherBadgeText}
                </span>
              </div>

              <div style={{ margin: '10px 0 6px' }}>
                <div style={{ fontSize: 'clamp(2.2rem, 5.5vw, 2.8rem)', fontWeight: 900, color: hasWeatherTemp ? '#fff' : '#fbbf24', lineHeight: 1 }}>
                  {tempDisplay}
                </div>
                <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{conditionIcon}</span>
                  <span>{conditionDisplay}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTab('weather')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', minHeight: '40px', fontWeight: 700, fontSize: '0.86rem' }}
            >
              <span>{t('home.viewWeatherDetails') || 'Full Weather Forecast →'}</span>
            </button>
          </div>

          {/* Card 2: Rain Forecast */}
          <div 
            className="glass-card" 
            style={{ 
              padding: 'clamp(18px, 3.5vw, 24px)', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloudRain size={20} color="#38bdf8" />
                  <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                    {t('home.rainForecastTitle') || 'Rain Forecast'}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: hasTomorrowRain ? '#38bdf8' : 'var(--text-muted)',
                  background: hasTomorrowRain ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${hasTomorrowRain ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {hasTomorrowRain ? ('🌧️ ' + (t('weather.rainAlert') || 'Rain Alert')) : ('☀️ ' + (t('weather.drySkies') || 'Dry Skies'))}
                </span>
              </div>

              <div style={{ margin: '10px 0 6px' }}>
                <div style={{ fontSize: 'clamp(2.2rem, 5.5vw, 2.8rem)', fontWeight: 900, color: hasTomorrowRain ? '#38bdf8' : '#fff', lineHeight: 1 }}>
                  {hasTomorrowRain ? `${tomorrowRain} mm` : `${todayRain > 0 ? todayRain : 0} mm`}
                </div>
                <div style={{ fontSize: '0.92rem', color: '#f1f5f9', fontWeight: 600, marginTop: '8px' }}>
                  {hasTomorrowRain
                    ? (t('home.rainExpectedTomorrow', { rain: tomorrowRain, prob: tomorrowProb }) || `${tomorrowRain} mm rain expected tomorrow (${tomorrowProb}% chance)`)
                    : todayRain > 0
                    ? (t('home.rainExpectedToday', { rain: todayRain }) || `${todayRain} mm rain received today`)
                    : (t('home.noRainExpected') || 'No rain expected (0 mm)')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {hasTomorrowRain
                    ? (t('home.rainMaySaveWater') || 'Incoming rain may reduce your watering need tomorrow.')
                    : (t('home.dryConditions') || 'Dry skies expected today.')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTab('weather')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', minHeight: '40px', fontWeight: 700, fontSize: '0.86rem' }}
            >
              <span>{t('home.viewRainDetails') || 'Rain & Weather Details →'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
          4. OPTIONAL FIELD INFORMATION
          Crop & Field size in a small, simple section.
          ==================================================================== */}
      <footer 
        className="glass-card" 
        style={{
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '1.2rem' }}>🌾</span>
          <span>
            <strong>{t('home.fieldSummaryTitle') || 'Field Summary'}:</strong> {cropName} ({cropIcon}) &bull; {areaText}
          </span>
        </div>

        {/* Quick Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTab('water')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem', padding: '8px 14px', minHeight: '40px' }}
          >
            💧 {t('home.waterOutlookBtn') || 'Water Outlook'}
          </button>
          <button
            type="button"
            onClick={() => setTab('weather')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem', padding: '8px 14px', minHeight: '40px' }}
          >
            🌤️ {t('home.weatherDetailsBtn') || 'Weather'}
          </button>
          <button
            type="button"
            onClick={() => setTab('field-monitor')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem', padding: '8px 14px', minHeight: '40px' }}
          >
            📊 {t('home.fieldMonitorBtn') || 'Field Monitor'}
          </button>
          <button
            type="button"
            onClick={() => setTab('reports')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem', padding: '8px 14px', minHeight: '40px' }}
          >
            📋 {t('home.reportsBtn') || 'Reports'}
          </button>
        </div>
      </footer>

    </div>
  );
}
