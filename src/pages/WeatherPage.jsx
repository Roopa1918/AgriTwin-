// AgriTwin — Weather Page (PRD Section 7, 8, 17)
// Displays Real Live Weather from Open-Meteo for the selected field's GPS location.

import React from 'react';
import { useFields } from '../context/FieldsContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { Thermometer, Wind, CloudRain, Sun, RefreshCw, MapPin, Calendar, Clock } from 'lucide-react';

export default function WeatherPage() {
  const { t } = useLanguage();
  const { activeField } = useFields();
  const { liveWeather, weatherLoading, scientificRecommendation } = useTelemetry();

  const cropKc = scientificRecommendation?.growthStage?.kc || 1.15;
  const cropName = activeField?.crop ? (t('crops.' + activeField.crop.toLowerCase()) || activeField.crop) : (t('crops.tomato') || 'Tomato');

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

  const getTranslatedDay = (day) => {
    if (day === 'Today') return t('weather.days.today') || 'Today';
    if (day === 'Tomorrow') return t('weather.days.tomorrow') || 'Tomorrow';
    const dayKey = day?.toLowerCase()?.slice(0, 3);
    return (dayKey && t(`weather.days.${dayKey}`)) ? t(`weather.days.${dayKey}`) : day;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>🌤 {t('weather.title')}</h1>
            <span style={{
              background: liveWeather?.isLive ? 'rgba(16, 185, 129, 0.2)' : liveWeather?.isStale ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: liveWeather?.isLive ? '#34d399' : liveWeather?.isStale ? '#38bdf8' : '#fbbf24',
              border: `1px solid ${liveWeather?.isLive ? 'rgba(16, 185, 129, 0.4)' : liveWeather?.isStale ? 'rgba(56, 189, 248, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              {liveWeather?.isLive 
                ? ('🟢 ' + (t('weather.liveForecastBadge') || 'LIVE NWP FORECAST'))
                : liveWeather?.isStale 
                ? ('🕒 ' + (t('weather.cachedForecastBadge', { hours: liveWeather.ageHours || 1 }) || `CACHED FORECAST (${liveWeather.ageHours || 1}h)`))
                : ('⚠️ ' + (t('weather.offlineBadge') || 'WEATHER SERVICE OFFLINE'))}
            </span>
          </div>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <MapPin size={15} color="var(--emerald-400)" />
            <span>
              Weather for <strong>{activeField?.name || 'My Field'}</strong>
              {typeof activeField?.latitude === 'number' && typeof activeField?.longitude === 'number' ? (
                ` (${activeField.latitude.toFixed(3)}°N, ${activeField.longitude.toFixed(3)}°E) — Modelled NWP Forecast (Open-Meteo)`
              ) : (
                ' — GPS Coordinates Not Configured (Offline Demo Mode)'
              )}
            </span>
          </p>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {liveWeather?.isLive ? `Updated ${liveWeather.lastUpdated}` : liveWeather?.isStale ? `Cached (${liveWeather.ageHours || 1}h ago)` : 'Current weather data unavailable'}
        </div>
      </div>

      {liveWeather?.isOffline && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          color: '#fbbf24',
          fontSize: '0.88rem'
        }}>
          ⚠️ Live weather forecast service is currently unreachable. Multi-day weather projections and synthetic forecasts are paused to preserve scientific integrity. Operating in Phase 2 in-situ soil moisture monitoring mode.
        </div>
      )}

      {/* "Now" Current Weather Big Cards (PRD Section 17) */}
      <div className="weather-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
        {/* Current Condition Card */}
        <div className="glass-card" style={{ padding: 'clamp(14px, 3.5vw, 22px)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: 'clamp(2.2rem, 6vw, 3rem)' }}>{liveWeather.conditionIcon}</span>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              {t('weather.condition') || 'Condition'}
            </span>
            <div style={{ fontSize: 'clamp(1.15rem, 4vw, 1.4rem)', fontWeight: 800, color: '#fff' }}>
              {getTranslatedCondition(liveWeather.condition)}
            </div>
            <span style={{ fontSize: '0.7rem', color: liveWeather?.isLive ? 'var(--emerald-400)' : '#fbbf24' }}>
              {liveWeather?.isLive ? ('🟢 ' + (t('weather.liveWeather') || 'LIVE WEATHER')) : ('⚠️ ' + (t('common.offline') || 'OFFLINE'))}
            </span>
          </div>
        </div>

        {/* Temperature */}
        <div className="metric-card" style={{ padding: 'clamp(14px, 3.5vw, 22px)' }}>
          <span className="metric-card-label">{t('weather.temperature')}</span>
          <div className="metric-card-value-row">
            <span className="metric-card-value" style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)' }}>
              {liveWeather.temperature !== null && liveWeather.temperature !== undefined ? `${liveWeather.temperature}°` : '--'}
            </span>
            <span className="metric-card-unit">{liveWeather.temperature !== null ? 'C' : ''}</span>
          </div>
          <div className="metric-card-footer">
            <span style={{ color: liveWeather?.isLive ? '#34d399' : liveWeather?.isStale ? '#38bdf8' : '#fbbf24', fontWeight: 700, fontSize: '0.7rem' }}>
              {liveWeather?.isLive ? '🟢 LIVE' : liveWeather?.isStale ? `🕒 CACHED (${liveWeather.ageHours}h)` : '⚠️ UNAVAILABLE'}
            </span>
          </div>
        </div>

        {/* Air Humidity */}
        <div className="metric-card" style={{ padding: 'clamp(14px, 3.5vw, 22px)' }}>
          <span className="metric-card-label">{t('weather.humidity')}</span>
          <div className="metric-card-value-row">
            <span className="metric-card-value" style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)' }}>
              {liveWeather.humidity !== null && liveWeather.humidity !== undefined ? liveWeather.humidity : '--'}
            </span>
            <span className="metric-card-unit">{liveWeather.humidity !== null ? '%' : ''}</span>
          </div>
          <div className="metric-card-footer">
            <span style={{ color: liveWeather?.isLive ? '#34d399' : liveWeather?.isStale ? '#38bdf8' : '#fbbf24', fontWeight: 700, fontSize: '0.7rem' }}>
              {liveWeather?.isLive ? '🟢 LIVE' : liveWeather?.isStale ? `🕒 CACHED (${liveWeather.ageHours}h)` : '⚠️ UNAVAILABLE'}
            </span>
          </div>
        </div>

        {/* Rainfall */}
        <div className="metric-card" style={{ padding: 'clamp(14px, 3.5vw, 22px)' }}>
          <span className="metric-card-label">{t('weather.precipitation')}</span>
          <div className="metric-card-value-row">
            <span className="metric-card-value" style={{ color: 'var(--color-water)', fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)' }}>
              {liveWeather.rainfall !== null && liveWeather.rainfall !== undefined ? liveWeather.rainfall : '--'}
            </span>
            <span className="metric-card-unit">{liveWeather.rainfall !== null ? 'mm' : ''}</span>
          </div>
          <div className="metric-card-footer">
            <span style={{ color: liveWeather?.isLive ? '#34d399' : liveWeather?.isStale ? '#38bdf8' : '#fbbf24', fontWeight: 700, fontSize: '0.7rem' }}>
              {liveWeather?.isLive ? '🟢 LIVE' : liveWeather?.isStale ? `🕒 CACHED (${liveWeather.ageHours}h)` : '⚠️ UNAVAILABLE'}
            </span>
          </div>
        </div>

        {/* Wind */}
        <div className="metric-card" style={{ padding: 'clamp(14px, 3.5vw, 22px)' }}>
          <span className="metric-card-label">{t('weather.wind')}</span>
          <div className="metric-card-value-row">
            <span className="metric-card-value" style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)' }}>
              {liveWeather.windSpeed !== null && liveWeather.windSpeed !== undefined ? liveWeather.windSpeed : '--'}
            </span>
            <span className="metric-card-unit">{liveWeather.windSpeed !== null ? 'km/h' : ''}</span>
          </div>
          <div className="metric-card-footer">
            <span style={{ color: liveWeather?.isLive ? '#34d399' : liveWeather?.isStale ? '#38bdf8' : '#fbbf24', fontWeight: 700, fontSize: '0.7rem' }}>
              {liveWeather?.isLive ? '🟢 LIVE' : liveWeather?.isStale ? `🕒 CACHED (${liveWeather.ageHours}h)` : '⚠️ UNAVAILABLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Hourly Forecast (PRD Section 17) */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="glass-card-header">
          <div className="glass-card-title">
            <Clock size={18} color="var(--emerald-400)" />
            <span>{t('weather.hourlyForecast')}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {t('weather.next8Hours') || 'Next 8 Hours'}
          </span>
        </div>

        <div style={{
          display: 'flex',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          gap: '12px',
          paddingBottom: '8px'
        }}>
          {liveWeather.hourly && liveWeather.hourly.length > 0 ? (
            liveWeather.hourly.map((h, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 10px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '94px',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>{h.time}</span>
                <span style={{ fontSize: '1.7rem' }}>{h.icon}</span>
                <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{h.temp}°C</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>💧 {h.humidity}%</span>
                {h.rain > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--color-water)' }}>🌧 {h.rain}mm</span>}
              </div>
            ))
          ) : (
            <div style={{ padding: '20px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ℹ️ Hourly meteorological forecasts are unavailable in offline mode.
            </div>
          )}
        </div>
      </div>

      {/* Next 5 Days Forecast Cards (PRD Section 17) */}
      <div className="glass-card">
        <div className="glass-card-header">
          <div className="glass-card-title">
            <Calendar size={18} color="var(--emerald-400)" />
            <span>{t('weather.dailyForecast')}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {t('weather.dailyPrediction') || 'Daily Weather Prediction'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px' }}>
          {liveWeather.daily && liveWeather.daily.length > 0 ? (
            liveWeather.daily.map((d, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1rem', color: '#fff' }}>{getTranslatedDay(d.day)}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{d.date}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                  <span style={{ fontSize: '2rem' }}>{d.icon}</span>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                      {d.maxTemp}° / <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{d.minTemp}°</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {getTranslatedCondition(d.label)}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: d.rain > 0 ? 'var(--color-water)' : 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  {d.rain > 0 ? `🌧 ${d.rain} mm (${d.precipitationProbability || 0}%)` : `☀️ 0.0 mm (${d.precipitationProbability || 0}%)`}
                </div>

                {d.et0 !== undefined && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('weather.faoEt0') || 'FAO-56 ET₀:'}</span>
                      <strong style={{ color: '#fff' }}>{d.et0.toFixed(1)} mm/d</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{cropName} {t('weather.cropEtc') || 'ETc:'}</span>
                      <strong style={{ color: 'var(--emerald-400)' }}>{(d.et0 * cropKc).toFixed(1)} mm/d</strong>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ℹ️ Multi-day meteorological forecasts are unavailable in offline mode. Real-time in-situ root zone monitoring remains fully operational.
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          <span>🌐 Source: {liveWeather?.source || 'Modelled Weather (Open-Meteo NWP)'}</span>
          <span>📐 Crop Coefficient Kc: {cropKc.toFixed(2)} ({scientificRecommendation?.growthStage?.name || 'Mid-Season'})</span>
        </div>
      </div>
    </div>
  );
}
