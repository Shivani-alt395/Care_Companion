import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language, Translations } from './translations';

interface I18nContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// RTL languages
const RTL_LANGUAGES: Language[] = ['ur'];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageFn] = useState<Language>(
    () => (localStorage.getItem('language') as Language) ?? 'en'
  );

  // Apply dir and lang to <html> whenever language changes
  useEffect(() => {
    const isRtl = RTL_LANGUAGES.includes(language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageFn(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = translations[language] ?? translations.en;

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslations must be used within I18nProvider');
  return ctx;
}
