// AgriTwin — Farmer-Friendly Main Navigation
// Clean, simple navigation with exactly 6 main items:
// 1. 🏠 Home, 2. 🌾 My Fields, 3. 💧 Water, 4. 🌤️ Weather, 5. 🌱 Plants, 6. 🔔 Alerts
// Plus expandable "More" section for advanced features.

import React, { useState } from 'react';
import { 
  Home, 
  MapPin, 
  Layers, 
  CloudSun, 
  Droplets, 
  BarChart2, 
  CloudRain, 
  HelpCircle, 
  Settings as SettingsIcon, 
  LogOut, 
  Sparkles,
  Terminal,
  Sliders,
  Leaf,
  Bell,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFields } from '../../context/FieldsContext';
import { useLanguage } from '../../context/LanguageContext';

export default function SimpleNavbar({ currentTab, setTab, onOpenAddField }) {
  const { logout, user } = useAuth();
  const { activeField } = useFields();
  const { t } = useLanguage();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Requirement: 6 Main Navigation Items
  const mainNavItems = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'my-fields', label: t('nav.myFields'), icon: MapPin },
    { id: 'water', label: t('nav.water'), icon: Droplets },
    { id: 'weather', label: t('nav.weather'), icon: CloudSun },
    { id: 'plant-health', label: t('nav.plantHealth'), icon: Leaf },
    { id: 'alerts', label: t('nav.alerts'), icon: Bell }
  ];

  // Secondary & Advanced features under "More"
  const moreNavItems = [
    { id: 'field-monitor', label: t('nav.fieldTwin'), icon: Layers, desc: t('fieldTwin.title') },
    { id: 'field-history', label: t('nav.pastReadings'), icon: BarChart2, desc: t('pastReadings.subtitle') },
    { id: 'what-if', label: t('nav.whatIf'), icon: CloudRain, desc: t('whatIf.title') },
    { id: 'what-may-happen', label: t('nav.whatMayHappen'), icon: Sparkles, desc: t('whatMayHappen.title') },
    { id: 'reports', label: t('nav.reports'), icon: HelpCircle, desc: t('reports.title') },
    { id: 'raw-sensors', label: t('nav.sensorData'), icon: Terminal, desc: t('sensorData.title') },
    { id: 'demo-controls', label: t('common.demoMode'), icon: Sliders, desc: t('demoControls.title') },
    { id: 'settings', label: t('nav.settings'), icon: SettingsIcon, desc: t('settings.title') },
    { id: 'how-it-works', label: t('nav.help'), icon: HelpCircle, desc: t('help.title') }
  ];

  const isMoreActive = moreNavItems.some(item => item.id === currentTab);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <img src="/favicon.svg" alt="AgriTwin" className="sidebar-logo" />
        <div>
          <div className="sidebar-title">
            <span>AgriTwin</span>
          </div>
          <div className="sidebar-tagline">{t('nav.smartAgriculture') || 'Smart Agriculture'}</div>
        </div>
      </div>

      {/* Active Field Quick Indicator */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{activeField?.cropIcon || '🌱'}</span>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                {activeField?.name || t('home.myFarm') || 'My Farm'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--emerald-400)' }}>
                {(activeField?.crop ? (t('crops.' + activeField.crop.toLowerCase()) || activeField.crop) : (t('common.selectCrop') || 'Select Crop'))} &bull; {activeField?.area || '2.4 Acres'}
              </div>
            </div>
          </div>
          <button 
            onClick={onOpenAddField}
            title={t('header.addFieldOnMap') || 'Add field'}
            style={{
              background: 'var(--emerald-500)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '15px'
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* 6 Core Main Farmer Navigation Items */}
      <div className="sidebar-nav-group">
        <span className="sidebar-section-label">{t('nav.farmMenu') || 'FARM MENU'}</span>
        {mainNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
            >
              <Icon size={18} color={isActive ? 'var(--emerald-400)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* 7. Collapsible "More" Menu for Advanced Features */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`nav-link ${isMoreActive ? 'active' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            textAlign: 'left',
            width: '100%',
            cursor: 'pointer',
            marginTop: '4px',
            justifyContent: 'space-between',
            paddingRight: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.1rem' }}>☰</span>
            <span>{t('nav.more')}</span>
          </div>
          {isMoreOpen ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
        </button>

        {isMoreOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            paddingLeft: '14px',
            marginTop: '4px',
            borderLeft: '2px solid rgba(16, 185, 129, 0.2)',
            marginLeft: '12px'
          }}>
            {moreNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    padding: '8px 10px'
                  }}
                >
                  <Icon size={15} color={isActive ? 'var(--emerald-400)' : 'var(--text-dim)'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User / Logout */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
              {user?.displayName || 'Farmer'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--emerald-400)' }}>
              🟢 {t('common.online') || 'Online'}
            </span>
          </div>
          <button 
            onClick={logout}
            title={t('common.logout') || 'Log out'}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
