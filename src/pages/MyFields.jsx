// AgriTwin — Simple & Farmer-Friendly My Fields Management
// Clean field cards with: Field Name, Crop, Area, Location
// Easy field selection, clear Add Field & Edit Field actions,
// and technical parameters kept in a clean expandable drawer.

import React, { useState } from 'react';
import { useFields, CROP_OPTIONS } from '../context/FieldsContext';
import { useTelemetry } from '../context/TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { SOIL_PROFILES } from '../data/demoConfiguration';
import { getBaselineZonesForSoil } from '../services/recommendationEngine';
import { 
  Plus, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  Edit3, 
  MapPin, 
  Droplets, 
  Sliders, 
  X, 
  Save 
} from 'lucide-react';

export default function MyFields({ setTab, onOpenAddField }) {
  const { t } = useLanguage();
  const { fields, activeFieldId, setActiveFieldId, deleteField, updateField } = useFields();
  const { zones: liveZones } = useTelemetry();

  // Edit Modal State
  const [editingField, setEditingField] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    crop: 'Tomato',
    area: '2.5 Acres (1.0 Ha)',
    village: '',
    pumpDischargeLph: '',
    soilType: 'sandy_loam'
  });

  const handleOpenField = (fieldId) => {
    setActiveFieldId(fieldId);
    setTab('home');
  };

  const handleStartEdit = (field) => {
    setEditingField(field);
    setEditForm({
      name: field.name || '',
      crop: field.crop || 'Tomato',
      area: field.area || '2.5 Acres (1.0 Ha)',
      village: field.village || '',
      pumpDischargeLph: field.pumpDischargeLph || '',
      soilType: field.soilType || 'sandy_loam'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingField) return;

    const cropMeta = CROP_OPTIONS.find(c => c.id.toLowerCase() === editForm.crop.toLowerCase());
    const discharge = editForm.pumpDischargeLph ? parseFloat(editForm.pumpDischargeLph) : null;

    updateField(editingField.id, {
      name: editForm.name.trim() || editingField.name,
      crop: editForm.crop,
      cropIcon: cropMeta?.icon || editingField.cropIcon || '🌾',
      area: editForm.area.trim() || editingField.area,
      village: editForm.village.trim() || editingField.village,
      pumpDischargeLph: discharge && discharge > 0 ? discharge : null,
      soilType: editForm.soilType
    });

    setEditingField(null);
  };

  return (
    <div className="page-container" style={{ maxWidth: '980px', margin: '0 auto', gap: '22px', paddingBottom: '40px' }}>
      
      {/* ====================================================================
          PAGE HEADER
          Simple title and prominent Add Field button
          ==================================================================== */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="page-header-text">
          <h1 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.75rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
            🌾 {t('myFields.title') || 'My Fields'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
            {t('myFields.subtitle') || 'Manage your farm plots and choose your active field.'}
          </p>
        </div>

        <button 
          onClick={onOpenAddField} 
          className="btn btn-primary" 
          style={{ fontWeight: 700, padding: '10px 20px', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          <span>{t('header.addFieldOnMap') || '+ Add Field on Map'}</span>
        </button>
      </div>

      {/* ====================================================================
          EMPTY STATE
          ==================================================================== */}
      {fields.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-surface-card)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🌾</span>
          <h2 style={{ fontSize: '1.35rem', color: '#fff', fontWeight: 800 }}>
            {t('myFields.noFieldsAdded') || 'No Fields Added Yet'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', margin: '8px auto 20px' }}>
            {t('myFields.noFieldsDesc') || 'Add your agricultural field boundary on the map to activate your digital twin and irrigation advice.'}
          </p>
          <button onClick={onOpenAddField} className="btn btn-primary" style={{ padding: '12px 26px', fontWeight: 700 }}>
            <Plus size={18} />
            <span>{t('myFields.selectFieldOnMap') || 'Select Your Field on Map'}</span>
          </button>
        </div>
      ) : (
        /* ====================================================================
            CLEAN FIELD CARDS GRID
            Displays only: Name, Crop, Area, Location, and clear actions
            ==================================================================== */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '18px' }}>
          {fields.map(field => {
            const isActive = field.id === activeFieldId;
            const soil = SOIL_PROFILES[field.soilType || 'sandy_loam'] || SOIL_PROFILES.sandy_loam;
            const candidateZones = isActive && liveZones && liveZones.length === 4
              ? liveZones
              : (field.zones && field.zones.length === 4 ? field.zones : getBaselineZonesForSoil(soil.id));

            return (
              <div
                key={field.id}
                className="glass-card"
                style={{
                  padding: 'clamp(18px, 3vw, 24px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  borderRadius: 'var(--radius-xl)',
                  border: isActive ? '2px solid var(--emerald-400)' : '1px solid var(--border-medium)',
                  background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-card)',
                  boxShadow: isActive ? '0 8px 24px rgba(16, 185, 129, 0.2)' : 'var(--shadow-md)',
                  position: 'relative'
                }}
              >
                {/* Header: Crop Icon & Field Name + Active Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      flexShrink: 0
                    }}>
                      {field.cropIcon || '🌾'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.18rem', color: '#fff', fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
                        {field.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '3px' }}>
                        <MapPin size={13} color="var(--emerald-400)" />
                        <span>{field.village || 'Rural Farm Plot'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Indicator Badge */}
                  {isActive && (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--emerald-300)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 size={12} /> {t('myFields.activeFieldBadge') || 'Active Field'}
                    </span>
                  )}
                </div>

                {/* Core Field Details (Clean 2-Column Summary) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('myFields.crop') || 'Crop'}
                    </span>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                      {field.crop || 'Tomato'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('myFields.area') || 'Field Area'}
                    </span>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                      {field.area || '2.5 Acres'}
                    </div>
                  </div>
                </div>

                {/* Primary Action Button (Select / Set Active) */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                  <button 
                    onClick={() => handleOpenField(field.id)}
                    className={isActive ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{ 
                      flex: 1, 
                      padding: '11px 16px', 
                      fontWeight: 700, 
                      minHeight: '44px',
                      justifyContent: 'center',
                      fontSize: '0.9rem'
                    }}
                  >
                    <span>{isActive ? (t('myFields.currentlyActive') || 'Open Dashboard →') : (t('myFields.selectThisField') || 'Select This Field')}</span>
                    <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(field)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0 12px', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={t('myFields.editField') || 'Edit Field'}
                  >
                    <Edit3 size={15} color="var(--emerald-400)" />
                    <span style={{ fontSize: '0.8rem' }}>{t('common.edit') || 'Edit'}</span>
                  </button>

                  {fields.length > 1 && (
                    <button 
                      onClick={() => deleteField(field.id)}
                      title={t('myFields.deleteField') || 'Delete field'}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0 12px', minHeight: '44px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Optional Expandable Technical Section (Kept separated) */}
                <details style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '0.78rem'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-muted)' }}>
                    ⚙️ {t('myFields.technicalDetails') || 'Technical & Soil Settings'}
                  </summary>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#bae6fd' }}>
                    <div>
                      • <strong>{t('myFields.soilType') || 'Soil Texture'}:</strong> {soil.name} (FC {soil.fc}%, PWP {soil.pwp}%)
                    </div>
                    <div>
                      • <strong>{t('myFields.pumpFlowRate') || 'Pump Flow Rate'}:</strong> {field.pumpDischargeLph ? `${field.pumpDischargeLph.toLocaleString()} L/hr` : (t('myFields.notConfigured') || 'Not Configured')}
                    </div>
                    <div>
                      • <strong>{t('myFields.gpsCoordinates') || 'GPS:'}</strong> {field.latitude?.toFixed(3)}°N, {field.longitude?.toFixed(3)}°E
                    </div>
                    <div>
                      • <strong>{t('myFields.zoneMoisture') || 'Zone Moisture:'}</strong> {candidateZones.map((z, idx) => `Z${idx + 1}: ${Math.round(z.soilWater || 16)}%`).join(' | ')}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
          EDIT FIELD MODAL
          Clean modal allowing farmers to update Name, Crop, Area, Pump Rate
          ==================================================================== */}
      {editingField && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'clamp(18px, 4vw, 26px)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-surface-elevated)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                ✏️ {t('myFields.editFieldModalTitle') || 'Edit Field Information'}
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingField(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                  {t('selectField.fieldNameLabel') || 'Field Name'}
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-medium)',
                    color: '#fff',
                    fontSize: '0.92rem'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                    {t('myFields.crop') || 'Crop'}
                  </label>
                  <select
                    value={editForm.crop}
                    onChange={(e) => setEditForm({ ...editForm, crop: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-medium)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    {CROP_OPTIONS.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#050f0a' }}>
                        {t('crops.' + c.id.toLowerCase()) ? `${t('crops.' + c.id.toLowerCase())} ${c.icon}` : c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                    {t('myFields.area') || 'Field Area'}
                  </label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-medium)',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                  {t('myFields.location') || 'Village / Location'}
                </label>
                <input
                  type="text"
                  value={editForm.village}
                  onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-medium)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                  placeholder={t('myFields.villagePlaceholder') || 'e.g., Thondamuthur Village'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                  {t('myFields.pumpFlowRate') || 'Pump Flow Rate (Liters/Hour)'}
                </label>
                <input
                  type="number"
                  value={editForm.pumpDischargeLph}
                  onChange={(e) => setEditForm({ ...editForm, pumpDischargeLph: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-medium)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                  placeholder={t('myFields.pumpFlowPlaceholder') || 'e.g., 25000 (Optional)'}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  {t('myFields.pumpDischargeHelp') || 'Used to estimate motor run time. Leave blank if unknown.'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                  {t('myFields.soilType') || 'Soil Texture'}
                </label>
                <select
                  value={editForm.soilType}
                  onChange={(e) => setEditForm({ ...editForm, soilType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-medium)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                >
                  {Object.values(SOIL_PROFILES).map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#050f0a' }}>
                      {t('agronomics.soilNames.' + p.id) || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', fontWeight: 700 }}
                >
                  {t('myFields.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} />
                  <span>{t('myFields.saveChanges') || 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
