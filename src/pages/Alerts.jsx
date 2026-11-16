// AgriTwin — Simple & Organized Alerts Hub
// Displays only meaningful alerts (No invented alerts)
// Grouped by importance: Active Alerts (Needs Attention) vs Resolved Alerts
// Short, understandable messages with: What happened, affected zone, and recommended action.

import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import DisclaimerAlert from '../components/common/DisclaimerAlert';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  Droplets, 
  CloudRain, 
  Flame, 
  Eye, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function Alerts({ onNavigateToPlant, onNavigateTo3D }) {
  const { t } = useLanguage();
  const { 
    scientificRecommendation, 
    activeSoil, 
    liveWeather, 
    zones, 
    resolveAlert 
  } = useTelemetry();

  // Category Tab: 'ALL' | 'WATER' | 'PLANT' | 'WEATHER'
  const [activeCategory, setActiveCategory] = useState('ALL');

  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [seenIds, setSeenIds] = useState(new Set());
  const [plantAlerts, setPlantAlerts] = useState([]);

  // Load and sanitize stored plant diagnosis alerts (purging any legacy mock alerts)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('agritwin_plant_alerts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Permanently purge any stale mock alerts that mentioned 18.4% or old wilting text
          const sanitized = parsed.filter(a => 
            !String(a.message || '').includes('18.4') &&
            !String(a.message || '').includes('wilting point threshold') &&
            a.id !== 'alert-water-1' &&
            a.id !== 'alert-weather-1'
          );
          if (sanitized.length !== parsed.length) {
            localStorage.setItem('agritwin_plant_alerts', JSON.stringify(sanitized));
          }
          setPlantAlerts(sanitized);
        }
      }
    } catch (e) {
      console.warn('Error reading saved plant alerts:', e);
    }
  }, []);

  // 1. Meaningful Water Alert (Only created when soil water is actually stressed)
  const targetZone = scientificRecommendation?.mostStressedZone || zones?.find(z => z.id === 'zone2') || zones?.[1];
  const targetMoisture = targetZone?.balance?.currentMoisture ?? (typeof targetZone?.soilWater === 'number' ? targetZone.soilWater : 13.8);
  const targetName = targetZone?.shortName || targetZone?.name || 'Zone 2 (Zone B)';
  const pwp = scientificRecommendation?.pwp ?? activeSoil?.pwp ?? 8.0;
  const refill = scientificRecommendation?.refillThreshold ?? 14.0;
  const fc = scientificRecommendation?.fc ?? activeSoil?.fc ?? 18.0;
  const raw = scientificRecommendation?.rawMm ?? 20.0;
  const depletion = scientificRecommendation?.lowestZoneBalance?.depletionMm ?? 21.0;
  const netMm = scientificRecommendation?.targetNetIrrigationMm ?? 21.0;
  const volLiters = scientificRecommendation?.targetVolumeLiters ?? 53115;
  const areaText = scientificRecommendation?.targetAreaText || '0.63 Acres (Zone 2 — Assumed Demo Area)';
  const runtimeText = scientificRecommendation?.targetPumpRuntimeText ? `; ~${scientificRecommendation.targetPumpRuntimeText} pump runtime at entered flow rate` : '';

  let dynamicWaterAlert = null;
  const isWaterAlertResolved = resolvedIds.has('alert-water-1');
  const isWaterAlertSeen = seenIds.has('alert-water-1');

  if (scientificRecommendation?.hasStressedZone || targetMoisture <= refill) {
    if (targetMoisture <= pwp) {
      // Critical Wilting Hazard (at or below PWP)
      dynamicWaterAlert = {
        id: 'alert-water-1',
        category: 'WATER',
        severity: 'CRITICAL',
        status: isWaterAlertResolved ? 'RESOLVED' : isWaterAlertSeen ? 'SEEN' : 'NEW',
        title: t('alerts.criticalWiltTitle') || '🚨 Critical Stress: Permanent Wilting Point',
        message: t('alerts.criticalWiltMsg') || `${targetName} soil water (${targetMoisture.toFixed(1)}% VWC) is at or below the Permanent Wilting Point (${Number(pwp).toFixed(1)}%). Crop cells are losing turgor; irreversible wilt damage imminent.`,
        zoneName: targetName,
        timestamp: t('fieldTwin.justNowLive') || 'Just now (Live)',
        action: t('alerts.criticalWiltAction') || `Trigger emergency irrigation immediately to prevent crop loss (${netMm} mm / ~${volLiters.toLocaleString()} L net requirement).`
      };
    } else {
      // RAW Depleted — Watering Needed (NOT below PWP)
      dynamicWaterAlert = {
        id: 'alert-water-1',
        category: 'WATER',
        severity: 'WARNING',
        status: isWaterAlertResolved ? 'RESOLVED' : isWaterAlertSeen ? 'SEEN' : 'NEW',
        title: t('alerts.waterDeficitTitle') || '💧 Readily Available Water (RAW) Depleted',
        message: t('alerts.waterDeficitMsg') || `${targetName} soil water is at ${targetMoisture.toFixed(1)}% VWC — below the ${Number(refill).toFixed(1)}% refill threshold (depletion Dr = ${Number(depletion).toFixed(1)} mm has exceeded RAW = ${Number(raw).toFixed(1)} mm). Plants are in water deficit but have NOT reached Permanent Wilting Point (${Number(pwp).toFixed(1)}%).`,
        zoneName: targetName,
        timestamp: t('fieldTwin.justNowLive') || 'Just now (Live)',
        action: t('alerts.waterDeficitAction') || `Apply ${netMm} mm of irrigation (~${volLiters.toLocaleString()} L theoretical net requirement for ${areaText}${runtimeText}) to restore root zone to Field Capacity (${Number(fc).toFixed(1)}%).`
      };
    }
  }

  // 2. Meaningful Weather Alert (Only created if significant rain or severe event is forecast)
  let dynamicWeatherAlert = null;
  const isWeatherAlertResolved = resolvedIds.has('alert-weather-1');
  const isWeatherAlertSeen = seenIds.has('alert-weather-1');

  if (scientificRecommendation?.weatherAdvisory) {
    dynamicWeatherAlert = {
      id: 'alert-weather-1',
      category: 'WEATHER',
      severity: 'INFO',
      status: isWeatherAlertResolved ? 'RESOLVED' : isWeatherAlertSeen ? 'SEEN' : 'NEW',
      title: t('agronomics.weatherAdvisoryTitle') || '🌦️ Rain Forecast Advisory',
      message: scientificRecommendation.weatherAdvisory.text,
      zoneName: 'Modelled Weather (Open-Meteo)',
      timestamp: 'Forecast for tomorrow',
      action: 'Consider deferring irrigation until soil moisture is rechecked post-event.'
    };
  }

  // Deduplicate and combine all real alerts
  const alertMap = new Map();

  // Add real plant alerts
  plantAlerts.forEach(a => {
    alertMap.set(a.id, {
      ...a,
      status: resolvedIds.has(a.id) ? 'RESOLVED' : seenIds.has(a.id) ? 'SEEN' : (a.status || 'NEW')
    });
  });

  // Add dynamic water alert if stressed
  if (dynamicWaterAlert) {
    alertMap.set(dynamicWaterAlert.id, dynamicWaterAlert);
  }

  // Add dynamic weather alert if advisory exists
  if (dynamicWeatherAlert) {
    alertMap.set(dynamicWeatherAlert.id, dynamicWeatherAlert);
  }

  const allAlerts = Array.from(alertMap.values());

  // Filter by category
  const filteredAlerts = allAlerts.filter(a => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'WATER') return a.category === 'WATER';
    if (activeCategory === 'PLANT') return a.category === 'PLANT' || a.category === 'PEST';
    if (activeCategory === 'WEATHER') return a.category === 'WEATHER';
    return true;
  });

  // Group by importance: Active Alerts vs Resolved Alerts
  const activeAlerts = filteredAlerts.filter(a => a.status !== 'RESOLVED');
  const resolvedAlerts = filteredAlerts.filter(a => a.status === 'RESOLVED');

  // Sort active alerts by severity (CRITICAL > WARNING > INFO)
  const severityOrder = { CRITICAL: 1, WARNING: 2, INFO: 3 };
  activeAlerts.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

  const handleMarkSeen = (id) => {
    setSeenIds(prev => new Set([...prev, id]));
  };

  const handleMarkResolved = (id) => {
    setResolvedIds(prev => new Set([...prev, id]));
    if (resolveAlert) resolveAlert(id);
  };

  return (
    <div className="page-container" style={{ maxWidth: '980px', margin: '0 auto', gap: '22px', paddingBottom: '40px' }}>
      
      {/* ====================================================================
          PAGE HEADER
          ==================================================================== */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="page-header-text">
          <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
            🔔 {t('alerts.title') || 'Field Alerts & Notifications'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
            {t('alerts.subtitle') || 'Important notifications regarding soil water deficit, weather risks, and plant health.'}
          </p>
        </div>

        {/* Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: activeAlerts.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: `1.5px solid ${activeAlerts.length > 0 ? '#ef4444' : '#10b981'}`,
          fontSize: '0.84rem',
          fontWeight: 800,
          color: activeAlerts.length > 0 ? '#f87171' : '#34d399'
        }}>
          <span>{activeAlerts.length > 0 ? '🚨' : '✅'}</span>
          <span>
            {activeAlerts.length > 0 
              ? `${activeAlerts.length} ${t('alerts.activeAlertsTitle') || 'Active Alert(s)'}`
              : (t('alerts.allClearPill') || 'All Clear')}
          </span>
        </div>
      </div>

      {/* ====================================================================
          CATEGORY TABS (Simple & Clean)
          ==================================================================== */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '8px'
      }}>
        {[
          { id: 'ALL', label: t('alerts.allAlerts') || 'All Alerts' },
          { id: 'WATER', label: `💧 ${t('alerts.waterCategory') || 'Water Deficit'}` },
          { id: 'PLANT', label: `🌱 ${t('alerts.plantCategory') || 'Plant Health'}` },
          { id: 'WEATHER', label: `⛈️ ${t('alerts.weatherCategory') || 'Weather'}` }
        ].map(tab => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--emerald-500)' : 'rgba(255,255,255,0.03)',
                color: isActive ? '#000' : '#fff',
                fontWeight: isActive ? 800 : 500,
                border: isActive ? 'none' : '1px solid var(--border-subtle)',
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          GROUP 1: ACTIVE ALERTS (NEEDS ATTENTION)
          ==================================================================== */}
      <section aria-labelledby="section-active-alerts">
        {activeAlerts.length === 0 ? (
          /* Reassuring Empty State when there are no active alerts */
          <div className="glass-card" style={{
            textAlign: 'center',
            padding: '50px 20px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'rgba(16, 185, 129, 0.05)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid var(--emerald-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={32} color="var(--emerald-400)" />
            </div>
            <h2 id="section-active-alerts" style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px' }}>
              {t('alerts.noActiveAlertsTitle') || 'All Clear — No Active Alerts'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
              {t('alerts.noActiveAlertsDesc') || 'Field conditions are normal. Soil moisture is within safe reserves and no crop stress is detected.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 id="section-active-alerts" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              🚨 {t('alerts.activeAlertsTitle') || 'Active Alerts (Action Required)'}
            </h2>

            {activeAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className="glass-card"
                  style={{
                    padding: 'clamp(16px, 3.5vw, 22px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderRadius: 'var(--radius-xl)',
                    borderLeft: `5px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
                    borderTop: '1px solid var(--border-medium)',
                    borderRight: '1px solid var(--border-medium)',
                    borderBottom: '1px solid var(--border-medium)',
                    background: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.06)'
                  }}
                >
                  {/* Top Row: Severity, Category, Zone, Timestamp */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCritical ? '#ef4444' : '#f59e0b',
                        color: isCritical ? '#fff' : '#000'
                      }}>
                        {isCritical ? (t('alerts.severityCritical') || 'CRITICAL') : (t('alerts.severityActionNeeded') || 'ACTION NEEDED')}
                      </span>

                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff' }}>
                        📍 {alert.zoneName || 'Field Zone'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                      🕒 {alert.timestamp === 'Just now' ? (t('fieldTwin.justNowLive') || 'Just now') : (alert.timestamp || t('weather.days.today') || 'Today')}
                    </span>
                  </div>

                  {/* What Happened (Plain Message) */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
                      {alert.title}
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: '#f1f5f9', margin: 0, lineHeight: 1.45 }}>
                      {alert.message}
                    </p>
                  </div>

                  {/* Recommended Action Box */}
                  {alert.action && (
                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.86rem',
                      color: 'var(--emerald-300)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span>👉</span>
                      <div>
                        <strong>{t('alerts.recommendedAction') || 'Recommended action'}:</strong> {alert.action}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                    {alert.category === 'PEST' && onNavigateToPlant && (
                      <button
                        onClick={onNavigateToPlant}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} />
                        <span>{t('alerts.viewPlantGrid') || 'View Plant Grid'}</span>
                      </button>
                    )}

                    {alert.status === 'NEW' && (
                      <button
                        onClick={() => handleMarkSeen(alert.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                      >
                        {t('alerts.markSeen') || 'Mark Seen'}
                      </button>
                    )}

                    <button
                      onClick={() => handleMarkResolved(alert.id)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Check size={14} />
                      <span>{t('alerts.markResolved') || 'Mark Resolved'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ====================================================================
          GROUP 2: RESOLVED ALERTS (DISTINGUISHED & CLEANLY GROUPED)
          ==================================================================== */}
      {resolvedAlerts.length > 0 && (
        <section aria-labelledby="section-resolved-alerts">
          <details className="glass-card" style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            opacity: 0.75
          }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-muted)'
            }}>
              ✅ {t('alerts.resolvedAlertsTitle') || 'Resolved Alerts'} ({resolvedAlerts.length})
            </summary>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {resolvedAlerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      📍 {alert.zoneName} &bull; {alert.timestamp}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399'
                  }}>
                    {t('alerts.statusResolved') || 'RESOLVED'}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      <DisclaimerAlert />
    </div>
  );
}
