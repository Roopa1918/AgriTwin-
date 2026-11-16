// AgriTwin — Try Different Weather Simulator (PRD Section 19)
// "See what could happen if the weather changes."

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { CloudRain, Sun, Flame, Droplets, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function WhatIf() {
  const { t } = useLanguage();
  const { liveWeather } = useTelemetry();
  const [selectedScenario, setSelectedScenario] = useState('hotDry');

  const scenarios = {
    normal: {
      id: 'normal',
      title: t('whatIf.scenarioNormal'),
      icon: '⛅',
      tempDelta: '0°C',
      rainDelta: t('whatIf.waterNeedNormal') || 'Normal',
      soilWaterEffect: t('whatIf.effectStable') || 'Stable',
      waterNeedEffect: t('whatIf.waterNeedNormal') || 'Normal',
      cropEffect: t('whatIf.cropEffectHealthy') || 'Good / Healthy',
      finding: t('whatIf.scenarioNormalFinding'),
      alertType: 'good'
    },
    hotter: {
      id: 'hotter',
      title: t('whatIf.scenarioHotter'),
      icon: '☀️',
      tempDelta: '+2°C',
      rainDelta: t('whatIf.waterNeedNormal') || 'Normal',
      soilWaterEffect: t('whatIf.effectFasterDrying') || 'Faster Drying',
      waterNeedEffect: t('whatIf.waterNeedMediumHigh') || 'Medium-High',
      cropEffect: t('whatIf.cropEffectFrequentCheck') || 'May need more frequent checks',
      finding: t('whatIf.scenarioHotterFinding'),
      alertType: 'warning'
    },
    hotDry: {
      id: 'hotDry',
      title: t('whatIf.scenarioHotDry'),
      icon: '🔥',
      tempDelta: '+3°C',
      rainDelta: '-20%',
      soilWaterEffect: t('whatIf.effectDecreasesFaster') || 'Decreases Faster',
      waterNeedEffect: t('whatIf.waterNeedHigh') || 'High',
      cropEffect: t('whatIf.cropEffectStressIncrease') || 'Stress may increase',
      finding: t('whatIf.scenarioHotDryFinding'),
      alertType: 'danger'
    },
    heavyRain: {
      id: 'heavyRain',
      title: t('whatIf.scenarioHeavyRain'),
      icon: '⛈️',
      tempDelta: '-2°C',
      rainDelta: '+35 mm',
      soilWaterEffect: t('whatIf.effectRecharged') || 'Recharged / High',
      waterNeedEffect: t('whatIf.waterNeedNone') || 'None (No watering needed)',
      cropEffect: t('whatIf.cropEffectPlentyWater') || 'Plenty of water',
      finding: t('whatIf.scenarioHeavyRainFinding'),
      alertType: 'info'
    }
  };

  const current = scenarios[selectedScenario] || scenarios.hotDry;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>☁ {t('whatIf.title')}</h1>
          <p style={{ fontSize: '1.05rem', color: '#f1f5f9' }}>
            {t('whatIf.subtitle')}
          </p>
        </div>

        <span style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem',
          color: '#fbbf24',
          fontWeight: 700
        }}>
          {t('whatIf.demoScenarioNotice')}
        </span>
      </div>

      {/* Large Scenario Buttons (PRD Section 19) */}
      <div>
        <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '14px' }}>
          {t('whatIf.chooseConditionPrompt')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
          {Object.values(scenarios).map(sc => {
            const isSelected = selectedScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                style={{
                  background: isSelected ? 'rgba(16, 185, 129, 0.22)' : 'var(--bg-surface-card)',
                  border: `2px solid ${isSelected ? 'var(--emerald-400)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none',
                  minHeight: '44px'
                }}
              >
                <span style={{ fontSize: '2rem' }}>{sc.icon}</span>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                    {sc.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--emerald-400)' : 'var(--text-muted)' }}>
                    {sc.tempDelta} &bull; Rain {sc.rainDelta}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Result Box (PRD Section 19) */}
      <div className="glass-card" style={{ padding: 'clamp(16px, 4vw, 28px)', border: '2px solid var(--emerald-400)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <span style={{ fontSize: '2rem' }}>{current.icon}</span>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              {t('whatIf.whatCouldHappen') || 'WHAT COULD HAPPEN'}
            </span>
            <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>
              {t('whatIf.scenarioTitle', { title: current.title }) || `Scenario: ${current.title}`}
            </h2>
          </div>
        </div>

        {/* Changes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '22px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('whatIf.temperatureShift') || 'Temperature Shift'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {current.tempDelta}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('whatIf.rainAmount') || 'Rain Amount'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-water)', marginTop: '4px' }}>
              {current.rainDelta}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('whatIf.soilWaterEffect')}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {current.soilWaterEffect}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('whatIf.waterNeedEffect')}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (current?.waterNeedEffect ?? '').includes('High') ? '#ef4444' : '#34d399', marginTop: '4px' }}>
              {current.waterNeedEffect}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('whatIf.cropEffect')}</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {current.cropEffect}
            </div>
          </div>
        </div>

        {/* Farmer Advice */}
        <div style={{
          background: current.alertType === 'danger' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.16)',
          borderLeft: `4px solid ${current.alertType === 'danger' ? '#ef4444' : '#10b981'}`,
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: '1rem',
          color: '#f8fafc',
          lineHeight: 1.5
        }}>
          <strong>{t('whatIf.farmerAdvice') || 'Advice for Farmer: '}</strong>
          "{current.finding}"
        </div>
      </div>
    </div>
  );
}
