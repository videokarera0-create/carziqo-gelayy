import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LanguageCode, TranslationKey, translate, isRTL, getLanguageFromProfile } from '@/lib/i18n';

interface LanguageContextValue {
  lang: LanguageCode;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [lang, setLang] = useState<LanguageCode>('en');

  useEffect(() => {
    setLang(getLanguageFromProfile(profile));
  }, [profile?.language]);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);
  const rtl = isRTL(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [lang, rtl]);

  return (
    <LanguageContext.Provider value={{ lang, t, isRtl: rtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
