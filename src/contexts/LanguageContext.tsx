import React, { createContext, useContext, useState } from 'react';
import translations, { Lang, TranslationKey } from '../i18n/translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectLang(): Lang {
  const stored = localStorage.getItem('stampica_lang') as Lang | null;
  if (stored === 'en' || stored === 'sr') return stored;
  return navigator.language.startsWith('sr') ? 'sr' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('stampica_lang', l);
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let str: string = translations[lang][key] ?? translations.en[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used within LanguageProvider');
  return ctx;
}
