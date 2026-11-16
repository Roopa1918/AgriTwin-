// AgriTwin — Field, Thresholds & Firebase Configuration Page (PRD Section 9, 21, 59)
import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useFields } from '../context/FieldsContext';
import { useLanguage } from '../context/LanguageContext';
import { SOIL_PROFILES, TOMATO_GROWTH_STAGES } from '../data/demoConfiguration';
import LanguageSelector from '../components/common/LanguageSelector';
import DisclaimerAlert from '../components/common/DisclaimerAlert';
import { Settings as SettingsIcon, Sliders, MapPin, Database, Save, RotateCcw, CheckCircle2, ShieldCheck, Languages, Sprout } from 'lucide-react';

export default function Settings() {
  const { t } = useLanguage();
  const {
    thresholds,
    fieldConfig,
    firebaseConfig,
    updateThresholds,
    updateFieldConfig,
    updateFirebaseConfig,
    resetSettingsToDefault
  } = useSettings();
  const { activeField, updateField } = useFields();

  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [localField, setLocalField] = useState(() => ({
    ...fieldConfig,
    name: activeField?.name || fieldConfig?.name || 'My Tomato Field',
    crop: activeField?.crop || fieldConfig?.crop || 'Tomato',
    latitude: activeField?.latitude || fieldConfig?.latitude || 13.0827,
    longitude: activeField?.longitude || fieldConfig?.longitude || 80.2707,
    soilType: activeField?.soilType || fieldConfig?.soilType || 'sandy_loam',
    growthStage: activeField?.growthStage || fieldConfig?.growthStage || 'mid',
    pumpDischargeLph: activeField?.pumpDischargeLph || ''
  }));
  const [localFirebase, setLocalFirebase] = useState(firebaseConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeField) {
      setLocalField(prev => ({
        ...prev,
        name: activeField.name || prev.name,
        crop: activeField.crop || prev.crop,
        latitude: activeField.latitude || prev.latitude,
        longitude: activeField.longitude || prev.longitude,
        soilType: activeField.soilType || prev.soilType || 'sandy_loam',
        growthStage: activeField.growthStage || prev.growthStage || 'mid',
        pumpDischargeLph: activeField.pumpDischargeLph !== undefined ? activeField.pumpDischargeLph : prev.pumpDischargeLph
      }));
    }
  }, [activeField?.id, activeField?.soilType, activeField?.growthStage, activeField?.pumpDischargeLph]);

  const handleSave = (e) => {
    e.preventDefault();
    updateThresholds(localThresholds);
    updateFieldConfig(localField);
    if (activeField?.id) {
      updateField(activeField.id, {
        name: localField.name,
        crop: localField.crop,
        latitude: parseFloat(localField.latitude),
        longitude: parseFloat(localField.longitude),
        soilType: localField.soilType || 'sandy_loam',
        growthStage: localField.growthStage || 'mid',
        pumpDischargeLph: localField.pumpDischargeLph ? parseFloat(localField.pumpDischargeLph) : null
      });
    }
    updateFirebaseConfig(localFirebase);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    resetSettingsToDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>{t('settings.title')}</h1>
          <p>
            {t('settings.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleReset} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} /> {t('settings.resetDefaults') || 'Reset Defaults'}
          </button>
          <button onClick={handleSave} className="btn btn-primary btn-sm">
            <Save size={14} /> {t('settings.saveSettings')}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{t('settings.settingsSaved')}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 0: Multilingual Language Preference */}
        <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.35)', background: 'rgba(6, 30, 20, 0.65)' }}>
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Languages size={18} color="var(--emerald-400)" />
              <span>{t('settings.languageSectionTitle')}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald-300)' }}>
              {t('settings.languageSectionDesc')}
            </span>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <LanguageSelector variant="segmented" />
          </div>
        </div>
        {/* Section 1: Configurable Demo Thresholds (PRD Section 21) */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Sliders size={18} color="var(--emerald-400)" />
              <span>{t('settings.demoThresholdsTitle') || 'Configurable Demonstration Thresholds'}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t('settings.demoThresholdsDesc') || 'Controls GOOD, MODERATE and LOW status classification across all screens'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('settings.optimalThresholdLabel') || 'Optimal Soil Moisture Threshold (GOOD >)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.5"
                  value={localThresholds.moisture.good}
                  onChange={(e) => setLocalThresholds({
                    ...localThresholds,
                    moisture: { ...localThresholds.moisture, good: parseFloat(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    background: 'rgba(5, 13, 10, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('settings.moderateThresholdLabel') || 'Moderate Moisture Depletion (MODERATE >)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.5"
                  value={localThresholds.moisture.moderate}
                  onChange={(e) => setLocalThresholds({
                    ...localThresholds,
                    moisture: { ...localThresholds.moisture, moderate: parseFloat(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    background: 'rgba(5, 13, 10, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('settings.criticalThresholdLabel') || 'Critical Low Moisture Threshold (CRITICAL <)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.5"
                  value={localThresholds.moisture.critical}
                  onChange={(e) => setLocalThresholds({
                    ...localThresholds,
                    moisture: { ...localThresholds.moisture, critical: parseFloat(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    background: 'rgba(5, 13, 10, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('settings.heatwaveWarningLabel') || 'Thermal Heatwave Warning Threshold (>)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="0.5"
                  value={localThresholds.temperature.warning}
                  onChange={(e) => setLocalThresholds({
                    ...localThresholds,
                    temperature: { ...localThresholds.temperature, warning: parseFloat(e.target.value) }
                  })}
                  style={{
                    width: '100%',
                    background: 'rgba(5, 13, 10, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Active Field Geographic & Agronomic Configuration */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <MapPin size={18} color="var(--emerald-400)" />
              <span>{t('settings.fieldConfigTitle') || 'Active Field Geographic & Agronomic Configuration'}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t('settings.fieldConfigDesc') || 'Configure crop, soil matrix texture, and optional irrigation flow rate'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('settings.fieldNameLabel') || 'Field Name'}
              </label>
              <input
                type="text"
                value={localField.name}
                onChange={(e) => setLocalField({ ...localField, name: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('settings.cultivatedCropLabel') || 'Cultivated Crop'}
              </label>
              <input
                type="text"
                value={localField.crop}
                onChange={(e) => setLocalField({ ...localField, crop: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Soil Texture Type Selector (Requirement 4 & Responsive UI) */}
            <div style={{ minWidth: 0, width: '100%' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('agronomics.soilTypeLabel')}
              </label>
              <select
                value={localField.soilType || 'sandy_loam'}
                onChange={(e) => setLocalField({ ...localField, soilType: e.target.value })}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(5, 13, 10, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: localField.soilType === 'sandy_loam' ? '#fbbf24' : '#fff',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Object.values(SOIL_PROFILES).map(profile => (
                  <option key={profile.id} value={profile.id} style={{ background: '#050f0a', color: '#fff' }}>
                    {t(`agronomics.soilTypes.${profile.id}`) || profile.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                {t('agronomics.soilTypeDesc')}
              </span>
            </div>

            {/* Tomato Growth Stage Selector (Phase 3 FAO-56 Kc) */}
            <div style={{ minWidth: 0, width: '100%' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('agronomics.growthStageLabel')}
              </label>
              <select
                value={localField.growthStage || 'mid'}
                onChange={(e) => setLocalField({ ...localField, growthStage: e.target.value })}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(5, 13, 10, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#10b981',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Object.values(TOMATO_GROWTH_STAGES).map(stage => (
                  <option key={stage.id} value={stage.id} style={{ background: '#050f0a', color: '#fff' }}>
                    {t(`agronomics.stages.${stage.id}`) || stage.name} (Kc = {stage.kc.toFixed(2)})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                {t('agronomics.growthStageDesc')}
              </span>
            </div>

            {/* Optional Water Delivery Flow Rate (Requirement 10: No fake pump runtime) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t('agronomics.pumpDischargeLabel')}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  step="500"
                  placeholder={t('agronomics.pumpDischargePlaceholder')}
                  value={localField.pumpDischargeLph || ''}
                  onChange={(e) => setLocalField({ ...localField, pumpDischargeLph: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(5, 13, 10, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>L/hr</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
                {t('agronomics.pumpDischargeHelper')}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={localField.latitude}
                onChange={(e) => setLocalField({ ...localField, latitude: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={localField.longitude}
                onChange={(e) => setLocalField({ ...localField, longitude: parseFloat(e.target.value) })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Assumed Demonstration Agronomic Parameters Display (Requirement 4) */}
          <div style={{
            marginTop: '20px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📐</span>
                <strong style={{ color: '#fbbf24', fontSize: '0.95rem' }}>
                  {t('agronomics.assumedValuesTitle')}
                </strong>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)'
              }}>
                {t('agronomics.provisional')}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#fde68a', margin: '0 0 14px', lineHeight: 1.45 }}>
              ⚠️ {t('agronomics.assumedValuesDisclaimer')}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              fontSize: '0.82rem'
            }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>{t('common.cropProfile') || 'Crop Profile'}:</span>
                <strong style={{ color: '#fff' }}>{fieldConfig.crop || 'Tomato (Solanum lycopersicum)'}</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>{t('agronomics.fieldCapacity')}:</span>
                <strong style={{ color: '#fff' }}>18.0% VWC [{t('common.assumed') || 'Assumed'}]</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>{t('agronomics.wiltingPoint')}:</span>
                <strong style={{ color: '#fff' }}>8.0% VWC [{t('common.assumed') || 'Assumed'}]</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>{t('agronomics.rootDepth')}:</span>
                <strong style={{ color: '#fff' }}>0.50 m (50 cm) [{t('common.assumed') || 'Assumed'}]</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>{t('agronomics.allowableDepletion')}:</span>
                <strong style={{ color: '#fff' }}>0.40 (40% MAD) [{t('common.assumed') || 'Assumed'}]</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>{t('agronomics.refillPoint')}:</span>
                <strong style={{ color: '#fbbf24' }}>14.0% VWC (RAW = 20 mm)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Live Firebase Credentials Setup (PRD Section 59) */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div className="glass-card-title">
              <Database size={18} color="#38bdf8" />
              <span>{t('settings.firebaseTitle') || 'Firebase Cloud Backend Integration (Optional Live Service)'}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t('settings.firebaseDualEngineDesc') || 'Dual-Engine: Works 100% out of the box in Local Pub/Sub mode or connected to Firebase'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Firebase Project ID
              </label>
              <input
                type="text"
                value={localFirebase.projectId}
                onChange={(e) => setLocalFirebase({ ...localFirebase, projectId: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
                placeholder="agritwin-field-prod"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Firebase Web API Key
              </label>
              <input
                type="password"
                value={localFirebase.apiKey}
                onChange={(e) => setLocalFirebase({ ...localFirebase, apiKey: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
                placeholder="AIzaSy..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Auth Domain
              </label>
              <input
                type="text"
                value={localFirebase.authDomain}
                onChange={(e) => setLocalFirebase({ ...localFirebase, authDomain: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
                placeholder="agritwin.firebaseapp.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                App ID
              </label>
              <input
                type="text"
                value={localFirebase.appId}
                onChange={(e) => setLocalFirebase({ ...localFirebase, appId: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(5, 13, 10, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'inherit'
                }}
                placeholder="1:123456789:web:abcdef"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          <Save size={16} /> {t('settings.saveSettings') || 'Save and Apply All Settings'}
        </button>
      </form>

      <DisclaimerAlert />
    </div>
  );
}
