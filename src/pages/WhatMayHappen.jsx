// AgriTwin — "What May Happen" Simple Forecast Page (PRD Section 20)
// Transparent trend forecasting in simple words without technical AI buzzwords.

import React from 'react';
import { useFields } from '../context/FieldsContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, TrendingDown, Droplets, ArrowRight, ShieldCheck } from 'lucide-react';

export default function WhatMayHappen({ setTab }) {
  const { t } = useLanguage();
  const { activeField } = useFields();
  const { zones, z2Water, waterZone2, isIrrigatingZone2, activeSoil } = useTelemetry();

  const fc = activeSoil?.fc ?? 18.0;
  const pwp = activeSoil?.pwp ?? 8.0;
  const refillThreshold = parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1));
  const isZ2Low = z2Water <= refillThreshold;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>🔮 {t('whatMayHappen.title')}</h1>
          <p>
            {t('whatMayHappen.subtitle')}
          </p>
        </div>

        <div style={{
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem',
          color: '#7dd3fc',
          fontWeight: 600
        }}>
          {t('whatMayHappen.demonstrationOutlookNotice')}
        </div>
      </div>

      {/* Main Focus: Zone 2 Trend Analysis in Simple Language (PRD Section 20) */}
      <div className="glass-card" style={{ padding: '28px', border: '2px solid rgba(239, 68, 68, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <TrendingDown size={24} color="#ef4444" />
          <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>{t('whatMayHappen.zone2Outlook')}</h2>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
            {t('whatMayHappen.goingDown')}
          </div>
          <p style={{ fontSize: '1.05rem', color: '#f1f5f9', lineHeight: 1.5 }}>
            {t('whatMayHappen.goingDownDesc')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('fieldMonitor.soilWaterContent')}</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isZ2Low ? '#f87171' : '#fff' }}>
              {Math.round(z2Water)}%
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('telemetry.waterNeedHigh')}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>
              {isZ2Low ? t('telemetry.statusNeedsWaterText') : t('telemetry.statusGoodText')}
            </div>
          </div>

          <button onClick={waterZone2} className="btn btn-water" style={{ marginLeft: 'auto' }}>
            <Droplets size={16} />
            <span>{isIrrigatingZone2 ? t('fieldMonitor.sprinklersActive') : t('whatMayHappen.waterZone2Now')}</span>
          </button>
        </div>
      </div>

      {/* Other Zones Summary */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '16px' }}>
          {t('whatMayHappen.outlookOtherZones') || 'Outlook for Other Zones'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {zones.filter(z => z.id !== 'zone2' && z.id !== 'z2').map(z => {
            const isLow = z.soilWater <= refillThreshold;
            const isWatch = z.soilWater > refillThreshold && z.soilWater < fc;
            const statusText = isLow 
              ? (t('whatMayHappen.statusLow') || 'low')
              : isWatch 
              ? (t('whatMayHappen.statusModerate') || 'moderate')
              : (t('whatMayHappen.statusOptimal') || 'optimal');

            const actionText = isLow
              ? (t('whatMayHappen.actionIrrigationReq') || 'Irrigation required.')
              : isWatch
              ? (t('whatMayHappen.actionAdequateMonitor') || 'Adequate for now, monitor tomorrow.')
              : (t('whatMayHappen.actionNoWateringToday') || 'No watering needed today.');

            return (
              <div key={z.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>{z.name}</strong>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  {t('whatMayHappen.soilWaterIs', {
                    status: statusText,
                    moisture: Math.round(z.soilWater ?? 16),
                    action: actionText
                  }) || `Soil water is ${statusText} at ${Math.round(z.soilWater ?? 16)}% VWC. ${actionText}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
