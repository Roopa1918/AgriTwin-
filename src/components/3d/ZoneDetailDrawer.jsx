// AgriTwin — Zone Details Slide-Over Drawer
import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { useLanguage } from '../../context/LanguageContext';
import { X, Droplets, Thermometer, Wind, Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function ZoneDetailDrawer({ zoneId, onClose }) {
  const { zones, sensors, scientificRecommendation, activeSoil, activeCrop, waterZone2 } = useTelemetry();
  const { t } = useLanguage();

  const zone = zones.find(z => z.id === zoneId) || zones[0];
  const tempSensor = sensors.find(s => s.sensorId === 'TEMP-01');
  const humSensor = sensors.find(s => s.sensorId === 'HUM-01');

  if (!zone) return null;

  const moisture = typeof zone.soilWater === 'number' ? zone.soilWater : (zone.moisture ?? 16.0);
  const fc = activeSoil?.fc || 18.0;
  const pwp = activeSoil?.pwp || 8.0;
  const refillThreshold = activeSoil 
    ? parseFloat((fc - 0.40 * (fc - pwp)).toFixed(1)) 
    : 14.0;

  const isCritical = moisture <= refillThreshold;
  const isModerate = moisture > refillThreshold && moisture < fc;

  const zoneBalance = scientificRecommendation?.zoneBalances?.find(zb => zb.id === zoneId);

  return (
    <div className="zone-drawer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{t('zoneDrawer.inspectorTitle')}</span>
          <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{zone.name || zone.shortName}</h3>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Primary Moisture Status Highlight */}
      <div style={{
        background: isCritical ? 'rgba(239, 68, 68, 0.15)' : isModerate ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : isModerate ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('zoneDrawer.soilWater')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
            {moisture.toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>% VWC</span>
          </div>
        </div>
        <span className={`status-pill ${isCritical ? 'low' : isModerate ? 'moderate' : 'good'}`}>
          {isCritical ? t('telemetry.statusNeedsWaterText') : isModerate ? t('telemetry.statusWatchText') : t('telemetry.statusGoodText')}
        </span>
      </div>

      {/* Metrics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.86rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Thermometer size={15} color="var(--emerald-400)" /> {t('zoneDrawer.ambientTemp')}
          </span>
          <strong style={{ color: '#fff' }}>{tempSensor?.value?.toFixed(1) || 28.8} °C</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.86rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wind size={15} color="var(--color-water)" /> {t('zoneDrawer.relativeHumidity')}
          </span>
          <strong style={{ color: '#fff' }}>{humSensor?.value?.toFixed(1) || 57.8} %</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.86rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} color="var(--emerald-300)" /> {t('zoneDrawer.soilPhEc')}
          </span>
          <strong style={{ color: '#fff' }}>{zone.pH || 6.7} pH / {zone.ec || 1.2} dS/m</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.86rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} color="#34d399" /> {t('zoneDrawer.demonstrationCropHealth')}
          </span>
          <strong style={{ color: '#fff' }}>{zone.health || 88}%</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.86rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('zoneDrawer.waterStress')}</span>
          <span className={`status-pill ${zone.waterStress === 'High' ? 'critical' : zone.waterStress === 'Moderate' ? 'moderate' : 'good'}`}>
            {zone.waterStress === 'High' ? t('telemetry.waterNeedHigh') : zone.waterStress === 'Moderate' ? t('telemetry.waterNeedMedium') : t('telemetry.waterNeedLow')}
          </span>
        </div>
      </div>

      {/* Sensor Metadata */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>{t('zoneDrawer.primaryProbe')}</span>
          <strong style={{ color: '#fff' }}>{zone.sensorId}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>{t('zoneDrawer.sensorType')}</span>
          <span>{t('zoneDrawer.decagonSensor')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('fieldTwin.lastStreamed') || 'Last Streamed:'}</span>
          <span style={{ color: 'var(--emerald-400)' }}>{t('fieldTwin.justNowLive') || 'Just now (Live)'}</span>
        </div>
      </div>

      {/* Decision Support Recommendation */}
      <div style={{
        background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
        border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: isCritical ? '#f87171' : 'var(--emerald-400)', marginBottom: '4px' }}>
          <Zap size={14} /> {t('fieldTwin.irrigationAdvisory') || 'Irrigation Advisory:'} {isCritical ? (t('common.high') || 'HIGH') : isModerate ? (t('common.moderate') || 'MEDIUM') : (t('common.low') || 'LOW')}
        </div>
        <p style={{ color: '#fff', marginBottom: '6px' }}>
          {isCritical 
            ? t('zoneDrawer.moistureLowNotice', { moisture: moisture.toFixed(1), refillThreshold })
            : isModerate
            ? t('zoneDrawer.moistureWatchNotice', { moisture: moisture.toFixed(1) })
            : t('zoneDrawer.moistureOptimalNotice', { moisture: moisture.toFixed(1) })
          }
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.74rem', margin: 0 }}>
          {zoneBalance?.balance?.netIrrigationMm > 0 
            ? t('zoneDrawer.netDeficitDetail', {
                netMm: zoneBalance.balance.netIrrigationMm,
                volumeLiters: zoneBalance.balance.volumeLiters.toLocaleString()
              })
            : t('zoneDrawer.depletionDetail', {
                depletionMm: zoneBalance?.balance?.depletionMm ?? (moisture < fc ? ((fc - moisture) * 5).toFixed(1) : 0),
                depletionVolumeLiters: (zoneBalance?.balance?.depletionVolumeLiters ?? 0).toLocaleString()
              })
          }
        </p>
      </div>

      {/* Action Trigger */}
      <button 
        onClick={waterZone2}
        className="btn btn-water" 
        style={{ width: '100%', marginTop: 'auto', fontWeight: 700 }}
      >
        <Droplets size={16} /> {t('fieldMonitor.waterThisZone')}
      </button>
    </div>
  );
}
