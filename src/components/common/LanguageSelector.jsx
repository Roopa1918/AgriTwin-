// AgriTwin — Farmer-Friendly Compact Language Selector
// Displays native scripts: English, ಕನ್ನಡ, हिन्दी
// Designed for desktop & mobile headers and Settings integration

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSelector({ variant = 'compact', style = {} }) {
  const { language, setLanguage, languages, currentLanguageObj } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Variant: Segmented / Inline Pills (Great for Settings or modal)
  if (variant === 'segmented') {
    return (
      <div 
        style={{ 
          display: 'inline-flex', 
          background: 'rgba(0, 0, 0, 0.4)', 
          padding: '4px', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-subtle)',
          gap: '4px',
          ...style 
        }}
      >
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--emerald-500)' : 'transparent',
                color: isSelected ? '#000' : '#f1f5f9',
                border: 'none',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{lang.nativeName}</span>
              {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Compact Header Dropdown
  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm lang-selector-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '0.82rem',
          fontWeight: 700,
          background: 'rgba(0, 0, 0, 0.4)',
          borderColor: isOpen ? 'var(--emerald-400)' : 'var(--border-medium)',
          color: '#fff',
          borderRadius: '999px',
          minHeight: '34px'
        }}
        aria-label="Select Language"
        title="Change Language / ಭಾಷೆ ಬದಲಿಸಿ / भाषा बदलें"
      >
        <Globe size={15} color="var(--emerald-400)" />
        <span className="lang-full-name" style={{ fontWeight: 800 }}>{currentLanguageObj.nativeName}</span>
        <span className="lang-short-code" style={{ fontWeight: 800 }}>{currentLanguageObj.code.toUpperCase()}</span>
        <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--bg-surface-elevated, #0c1c14)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
            padding: '6px',
            minWidth: '160px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div style={{
            padding: '6px 10px',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            Select Language
          </div>

          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: isSelected ? 'var(--emerald-300)' : '#f1f5f9',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <span style={{ display: 'block', fontWeight: 700 }}>{lang.nativeName}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lang.name}</span>
                </div>
                {isSelected && <Check size={16} color="var(--emerald-400)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

