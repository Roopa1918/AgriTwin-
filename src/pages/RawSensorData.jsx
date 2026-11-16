// AgriTwin — Raw Sensor Data Table (PRD Section 23)
// Technical presentation view showing simulated IoT telemetry feed.

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { Terminal, Download, Radio, Filter } from 'lucide-react';

export default function RawSensorData() {
  const { t } = useLanguage();
  const { zones, liveWeather, activeSoil } = useTelemetry();

  const fc = activeSoil?.fc ?? 18.0;
  const pwp = activeSoil?.pwp ?? 8.0;
  const refillThreshold = parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1));

  const isAlertRow = (row) => {
    if (row.sensor.startsWith('SM-')) {
      const val = parseFloat(row.value);
      return !isNaN(val) && val <= refillThreshold;
    }
    return false;
  };

  // Create live simulated rows
  const z2Val = zones[1]?.soilWater ?? 13.5;
  const streamRows = [
    { time: '14:32:01', sensor: 'SM-Z02', zone: 'Zone 2', reading: t('fieldMonitor.soilWaterContent'), value: `${(z2Val + 0.3).toFixed(1)}%` },
    { time: '14:32:04', sensor: 'SM-Z02', zone: 'Zone 2', reading: t('fieldMonitor.soilWaterContent'), value: `${z2Val.toFixed(1)}%` },
    { time: '14:32:07', sensor: 'TEMP-01', zone: 'Field', reading: t('weather.temperature'), value: `${liveWeather.temperature}°C` },
    { time: '14:32:10', sensor: 'HUM-01', zone: 'Field', reading: t('weather.humidity'), value: `${liveWeather.humidity}%` },
    { time: '14:32:13', sensor: 'SM-Z01', zone: 'Zone 1', reading: t('fieldMonitor.soilWaterContent'), value: `${zones[0]?.soilWater?.toFixed(1) || '17.8'}%` },
    { time: '14:32:16', sensor: 'SM-Z03', zone: 'Zone 3', reading: t('fieldMonitor.soilWaterContent'), value: `${zones[2]?.soilWater?.toFixed(1) || '16.2'}%` },
    { time: '14:32:19', sensor: 'SM-Z04', zone: 'Zone 4', reading: t('fieldMonitor.soilWaterContent'), value: `${zones[3]?.soilWater?.toFixed(1) || '18.0'}%` }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>🔧 {t('sensorData.title')}</h1>
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
              ● {t('sensorData.liveStreamBadge') || 'LIVE STREAM'}
            </span>
          </div>
          <p>
            {t('sensorData.subtitle')}
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
          {t('sensorData.simulatedNotice') || 'SIMULATED SENSOR DATA — DEMONSTRATION MODE'}
        </span>
      </div>

      {/* Terminal View */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--emerald-400)', fontFamily: 'var(--font-mono)' }}>
            /api/v1/sensors/raw &bull; Simulated ESP32 Packet Buffer
          </span>
        </div>

        <div className="terminal-body" style={{ padding: 'clamp(10px, 3vw, 18px)' }}>
          {/* Desktop Table View (>= 768px) */}
          <div className="table-desktop-view">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--emerald-400)', borderBottom: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '12px' }}>{t('sensorData.colTime') || 'Time'}</th>
                  <th style={{ padding: '12px' }}>{t('sensorData.colSensor') || 'Sensor'}</th>
                  <th style={{ padding: '12px' }}>{t('sensorData.colZone') || 'Zone'}</th>
                  <th style={{ padding: '12px' }}>{t('sensorData.colReading') || 'Reading'}</th>
                  <th style={{ padding: '12px' }}>{t('sensorData.colValue') || 'Value'}</th>
                </tr>
              </thead>
              <tbody>
                {streamRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px', color: '#94a3b8' }}>{row.time}</td>
                    <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 700 }}>{row.sensor}</td>
                    <td style={{ padding: '12px', color: '#fff' }}>{row.zone}</td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{row.reading}</td>
                    <td style={{ padding: '12px', color: isAlertRow(row) ? '#f87171' : 'var(--emerald-400)', fontWeight: 800 }}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px) — PRD Section 11 */}
          <div className="table-mobile-card-view">
            {streamRows.map((row, idx) => {
              const isAlert = isAlertRow(row);
              return (
                <div
                  key={idx}
                  style={{
                    background: isAlert ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.2)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.94rem' }}>
                      {row.sensor}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                      {row.time}
                    </span>
                  </div>

                  <div style={{ color: '#fff', fontSize: '0.82rem' }}>
                    {row.zone}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                      {row.reading}:
                    </span>
                    <span style={{
                      color: isAlert ? '#f87171' : 'var(--emerald-400)',
                      fontWeight: 800,
                      fontSize: '1rem'
                    }}>
                      {row.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
