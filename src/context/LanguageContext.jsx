// AgriTwin — Multilingual Language Context (i18n)
// Supports English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी)
// Persists selection locally and updates entire UI reactively without page reloads.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, SUPPORTED_LANGUAGES } from '../i18n';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'agritwin_language';

export function LanguageProvider({ children }) {
  // 1. Initial language: localStorage -> 'en'
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'kn' || saved === 'hi')) {
        return saved;
      }
    } catch (e) {
      // LocalStorage access fallback
    }
    return 'en';
  });

  // Change language and persist to storage
  const setLanguage = useCallback((langCode) => {
    if (!['en', 'kn', 'hi'].includes(langCode)) return;
    setLanguageState(langCode);
    try {
      localStorage.setItem(STORAGE_KEY, langCode);
      document.documentElement.lang = langCode;
    } catch (e) {
      console.warn('Could not save language to storage', e);
    }
  }, []);

  // Sync document lang on load and change
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Translate a dotted key path (e.g., 'home.soilWater')
   * Automatically falls back to English if the key is missing in Kannada or Hindi.
   */
  const t = useCallback((path, params = {}) => {
    if (!path || typeof path !== 'string') return '';

    const keys = path.split('.');

    // Try current language
    let result = keys.reduce((curr, key) => (curr && curr[key] !== undefined ? curr[key] : null), translations[language]);

    // Fall back to English if translation is missing
    if (result === null || result === undefined) {
      result = keys.reduce((curr, key) => (curr && curr[key] !== undefined ? curr[key] : null), translations.en);
    }

    // Fall back to key itself if missing everywhere
    if (result === null || result === undefined) {
      return path;
    }

    // Replace {placeholder} parameters if provided
    if (typeof result === 'string' && Object.keys(params).length > 0) {
      return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
        return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, result);
    }

    return result;
  }, [language]);

  const currentLanguageObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageObj
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (path) => {
        try {
          const keys = path.split('.');
          let val = translations.en;
          for (const k of keys) {
            if (!val || typeof val !== 'object') return path;
            val = val[k];
          }
          return typeof val === 'string' ? val : path;
        } catch {
          return path;
        }
      },
      languages: SUPPORTED_LANGUAGES,
      currentLanguageObj: SUPPORTED_LANGUAGES[0]
    };
  }
  return context;
}

export default LanguageContext;

