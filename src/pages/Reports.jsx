// AgriTwin — Simple Farmer Field Report (PRD Section 4 & 37)
import React from 'react';
import { useFields } from '../context/FieldsContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Printer, MapPin, CheckCircle2, Droplets, Thermometer, Wind } from 'lucide-react';

export default function Reports() {
  const { t } = useLanguage();
  const { activeField } = useFields();
  const { liveWeather, zones, simpleRecommendation, scientificRecommendation, avgSoilWater, activeSoil } = useTelemetry();

  const fc = activeSoil?.fc ?? 18.0;
  const pwp = activeSoil?.pwp ?? 8.0;
  const refillThreshold = parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>📄 {t('reports.title')}</h1>
          <p>
            {t('reports.subtitle')}
          </p>
        </div>

        <button onClick={() => window.print()} className="btn btn-primary">
          <Printer size={16} />
          <span>{t('reports.exportSummary')}</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="glass-card" style={{ padding: 'clamp(14px, 4vw, 36px)', background: '#0a1a13' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '2px solid var(--border-medium)', paddingBottom: '18px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.8rem' }}>🌱</span>
              <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>
                {t('reports.fieldReportTitle') || 'AgriTwin Field Report'}
              </h2>
            </div>
            <div style={{ color: 'var(--emerald-400)', fontSize: '1rem', fontWeight: 600 }}>
              {activeField?.name} &bull; {activeField?.crop} ({activeField?.area})
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>{t('reports.date') || 'Date:'} {new Date().toLocaleDateString()}</div>
            <div>{t('reports.time') || 'Time:'} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>
              {t('reports.statusUpdated') || 'Status: Updated'}
            </div>
          </div>
        </div>

        {/* Live Weather Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '12px' }}>
            1. {t('weather.currentConditions')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.temperature')}</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{liveWeather.temperature}°C</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.humidity')}</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{liveWeather.humidity}%</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.precipitation')}</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-water)' }}>{liveWeather.rainfall} mm</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('weather.condition') || 'Condition'}
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{liveWeather.condition}</div>
            </div>
          </div>
        </div>

        {/* Soil Water Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>
              2. {t('fieldMonitor.zonesConditionTitle')}
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#bae6fd', fontWeight: 600 }}>
              {t('reports.fieldAverageAcrossZones') || 'Field Average Across Four Zones:'} <strong style={{ color: '#fff' }}>{avgSoilWater}% VWC</strong>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {zones.map(z => {
              const isLow = z.status === 'Needs Water' || z.soilWater <= refillThreshold;
              const isWatch = z.status === 'Watch' || (z.soilWater > refillThreshold && z.soilWater < fc);
              return (
                <div key={z.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <strong style={{ color: '#fff', display: 'block', fontSize: '0.9rem' }}>{z.name}</strong>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isLow ? '#f87171' : '#fff', margin: '4px 0' }}>
                    {z.soilWater?.toFixed(1)}%
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLow ? '#f87171' : isWatch ? '#fbbf24' : '#34d399' }}>
                    {isLow ? t('fieldMonitor.statusNeedsWater') : isWatch ? t('fieldMonitor.statusWatch') : t('fieldMonitor.statusGood')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendation Section */}
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--emerald-400)', marginBottom: '4px' }}>
            {scientificRecommendation?.title || simpleRecommendation?.title}
          </h4>
          <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>
            "{scientificRecommendation?.text || simpleRecommendation?.text}"
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            {scientificRecommendation?.reason || simpleRecommendation?.reason}
          </p>
          {scientificRecommendation?.hasStressedZone && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8rem', color: '#bae6fd', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <span>📍 <strong>{t('reports.targetArea') || 'Target Area:'}</strong> {scientificRecommendation.targetAreaText}</span>
              <span>💧 <strong>{t('reports.netDeficit') || 'Net Deficit:'}</strong> {scientificRecommendation.targetNetIrrigationMm} mm</span>
              <span>📦 <strong>{t('reports.netWaterReq') || 'Net Water Req:'}</strong> {scientificRecommendation.targetVolumeLiters?.toLocaleString()} L (Theoretical net)</span>
              {scientificRecommendation.targetPumpRuntimeText && (
                <span>⏱️ <strong>{t('reports.estimatedPumpRuntime') || 'Estimated Pump Runtime:'}</strong> ~{scientificRecommendation.targetPumpRuntimeText}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          {t('reports.tagline') || 'AgriTwin Platform • Simple Farming Decisions from Smart Field Data'}
        </div>
      </div>
    </div>
  );
}
