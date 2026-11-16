// AgriTwin — Mobile Bottom Navigation Bar & Slide-Up More Menu
// Adheres strictly to PRD Section 2:
// - Fixed Bottom Navigation: 🏠 Home, 🌾 Fields, 💧 Water, 🌤 Weather, ☰ More
// - Slide-up "More" Drawer with quick access to all secondary/technical pages
// - Touch-friendly: Minimum 44px touch targets
// - Visible only on mobile/tablet viewports (< 1024px)

import React, { useState } from 'react';
import {
  Home,
  MapPin,
  Droplets,
  CloudSun,
  Menu,
  X,
  Layers,
  Leaf,
  Bell,
  BarChart2,
  CloudRain,
  Sparkles,
  HelpCircle,
  Terminal,
  Sliders,
  Plus,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFields } from '../../context/FieldsContext';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileBottomNav({
  currentTab,
  setTab,
  onOpenAddField,
  isMoreOpen,
  setIsMoreOpen
}) {
  const { logout } = useAuth();
  const { activeField } = useFields();
  const { t } = useLanguage();

  // Internal state if parent doesn't control `isMoreOpen`
  const [internalMoreOpen, setInternalMoreOpen] = useState(false);
  const moreOpen = isMoreOpen !== undefined ? isMoreOpen : internalMoreOpen;
  const setMoreOpen = setIsMoreOpen !== undefined ? setIsMoreOpen : setInternalMoreOpen;

  const handleTabClick = (tabId) => {
    setMoreOpen(false);
    setTab(tabId);
  };

  // Secondary pages grouped for the "More" slide-up drawer
  const moreSections = [
    {
      title: t('nav.fieldTwinAndHealth') || 'Field Twin & Health',
      items: [
        { id: 'field-monitor', label: t('nav.fieldTwin'), icon: Layers, desc: t('fieldTwin.title') },
        { id: 'plant-health', label: t('nav.plantHealth'), icon: Leaf, desc: t('plantHealth.subtitle') },
        { id: 'alerts', label: t('nav.alerts'), icon: Bell, desc: t('alerts.subtitle') }
      ]
    },
    {
      title: t('nav.insightsAndSimulation') || 'Insights & Simulation',
      items: [
        { id: 'field-history', label: t('nav.pastReadings'), icon: BarChart2, desc: t('pastReadings.subtitle') },
        { id: 'what-if', label: t('nav.whatIf'), icon: CloudRain, desc: t('whatIf.subtitle') },
        { id: 'what-may-happen', label: t('nav.whatMayHappen'), icon: Sparkles, desc: t('whatMayHappen.subtitle') },
        { id: 'reports', label: t('nav.reports'), icon: HelpCircle, desc: t('reports.subtitle') }
      ]
    },
    {
      title: t('nav.toolsAndConfig') || 'Tools & Configuration',
      items: [
        { id: 'raw-sensors', label: t('nav.sensorData'), icon: Terminal, desc: t('sensorData.subtitle') },
        { id: 'demo-controls', label: t('common.demoMode'), icon: Sliders, desc: t('demoControls.subtitle') },
        { id: 'settings', label: t('nav.settings'), icon: SettingsIcon, desc: t('settings.subtitle') },
        { id: 'how-it-works', label: t('nav.help'), icon: HelpCircle, desc: t('help.subtitle') }
      ]
    }
  ];

  // Check if active tab is one of the secondary pages inside "More"
  const isSecondaryActive = [
    'field-monitor', 'plant-health',
    'alerts', 'field-history', 'what-if', 'what-may-happen', 'reports',
    'raw-sensors', 'demo-controls', 'settings', 'how-it-works'
  ].includes(currentTab);

  return (
    <>
      {/* ====================================================================
          1. FIXED BOTTOM NAVIGATION BAR (< 1024px)
          ==================================================================== */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => handleTabClick('home')}
          className={`mobile-nav-btn ${currentTab === 'home' && !moreOpen ? 'active' : ''}`}
          aria-label={t('nav.home')}
        >
          <Home size={21} />
          <span className="mobile-nav-label">{t('nav.home')}</span>
        </button>

        {/* Tab 2: My Fields */}
        <button
          type="button"
          onClick={() => handleTabClick('my-fields')}
          className={`mobile-nav-btn ${currentTab === 'my-fields' && !moreOpen ? 'active' : ''}`}
          aria-label={t('nav.myFields')}
        >
          <MapPin size={21} />
          <span className="mobile-nav-label">{t('nav.myFields')}</span>
        </button>

        {/* Tab 3: Water */}
        <button
          type="button"
          onClick={() => handleTabClick('water')}
          className={`mobile-nav-btn ${currentTab === 'water' && !moreOpen ? 'active' : ''}`}
          aria-label={t('nav.water')}
        >
          <Droplets size={21} />
          <span className="mobile-nav-label">{t('nav.water')}</span>
        </button>

        {/* Tab 4: Weather */}
        <button
          type="button"
          onClick={() => handleTabClick('weather')}
          className={`mobile-nav-btn ${currentTab === 'weather' && !moreOpen ? 'active' : ''}`}
          aria-label={t('nav.weather')}
        >
          <CloudSun size={21} />
          <span className="mobile-nav-label">{t('nav.weather')}</span>
        </button>

        {/* Tab 5: More (Slide-Up Menu Trigger) */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`mobile-nav-btn ${moreOpen || isSecondaryActive ? 'active' : ''}`}
          aria-label={t('nav.more')}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Menu size={21} />
            {isSecondaryActive && !moreOpen && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -3,
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--emerald-400)',
                  boxShadow: '0 0 6px var(--emerald-400)'
                }}
              />
            )}
          </div>
          <span className="mobile-nav-label">{t('nav.more')}</span>
        </button>
      </nav>

      {/* ====================================================================
          2. SLIDE-UP "MORE" DRAWER SHEET
          ==================================================================== */}
      {moreOpen && (
        <div
          className="mobile-more-overlay"
          onClick={() => setMoreOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="All Farm Pages"
        >
          <div
            className="mobile-more-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Pull Handle & Header */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-handle" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{activeField?.cropIcon || '🌾'}</span>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 800 }}>
                      All AgriTwin Features
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--emerald-400)' }}>
                      Active: {activeField?.name || 'My Field'} ({activeField?.crop || 'Crop'})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="mobile-drawer-close"
                  aria-label="Close Menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quick Action: Add Field */}
            <div style={{ padding: '0 16px 12px' }}>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  if (onOpenAddField) onOpenAddField();
                }}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.92rem',
                  fontWeight: 700
                }}
              >
                <Plus size={18} />
                <span>{t('nav.addNewFieldMap') || '+ Add New Field on Map'}</span>
              </button>
            </div>

            {/* Categorized Menu Items */}
            <div className="mobile-drawer-body">
              {moreSections.map((sec, sIdx) => (
                <div key={sIdx} className="mobile-drawer-section">
                  <div className="mobile-drawer-section-title">
                    {sec.title}
                  </div>
                  <div className="mobile-drawer-items">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabClick(item.id)}
                          className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                        >
                          <div className="mobile-drawer-item-icon">
                            <Icon size={18} />
                          </div>
                          <div className="mobile-drawer-item-text">
                            <div className="mobile-drawer-item-label">{item.label}</div>
                            <div className="mobile-drawer-item-desc">{item.desc}</div>
                          </div>
                          <ChevronRight size={16} className="mobile-drawer-item-arrow" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Logout Option */}
              <div style={{ padding: '16px 4px 10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    if (logout) logout();
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700
                  }}
                >
                  <LogOut size={16} />
                  <span>{t('nav.logout') || 'Log Out of AgriTwin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
