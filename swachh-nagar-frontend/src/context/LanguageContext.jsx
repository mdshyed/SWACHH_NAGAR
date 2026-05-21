import { createContext, useContext, useState } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const translations = { en, hi };

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(localStorage.getItem('language') || 'en');

  const toggleLanguage = () => {
    const next = locale === 'en' ? 'hi' : 'en';
    setLocale(next);
    localStorage.setItem('language', next);
  };

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[locale];
    for (const k of keys) { val = val?.[k]; if (!val) break; }
    return val || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, toggleLanguage, t, isHindi: locale === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
