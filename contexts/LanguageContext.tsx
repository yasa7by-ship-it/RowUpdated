import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import type { Language, Translations } from '../types';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

type LanguageDirection = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  direction: LanguageDirection;
  refetchTranslations: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// --- Caching State ---
let translationsCache: Translations | null = null;
// ---------------------

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session, profile, refetchProfile } = useAuth();
  
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'en'
  );
  const [translations, setTranslations] = useState<Translations>(translationsCache || {});
  const [loading, setLoading] = useState(!translationsCache);

  // This ref tracks the language that a fetch was initiated for to prevent race conditions.
  const fetchController = useRef({ lang: language });

  // Effect to load user's preferred language upon login
  useEffect(() => {
    if (profile?.preferred_language && profile.preferred_language !== language) {
        translationsCache = null;
        setTranslations({});
        setLanguageState(profile.preferred_language as Language);
    }
  }, [profile, language]);

  const fetchTranslations = useCallback(async (lang: Language, forceRefetch = false) => {
    // When a fetch starts, update the controller to signify this is the "current" fetch.
    fetchController.current.lang = lang;
    
    if (translationsCache && !forceRefetch) {
      return;
    }
    
    if (forceRefetch) {
      translationsCache = null;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc('get_translations', { p_lang_code: lang });

    // After the await, check if the language we fetched for is still the desired language.
    // If not, it means a new language change happened, and this data is stale. Discard it.
    if (fetchController.current.lang !== lang) {
        setLoading(false); // Another fetch is likely running, but we should clear this loading state.
        return; // Abort setting state with stale data.
    }

    if (error) {
      console.error('Error fetching translations:', error);
    } else {
        const newTranslations = (data || []).reduce((acc: Translations, row) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        translationsCache = newTranslations;
        setTranslations(newTranslations);
    }
    setLoading(false);
  }, []); // Keep empty deps, setters are stable & ref doesn't need to be a dependency.

  useEffect(() => {
    if (session && !profile) return;
    fetchTranslations(language);
  }, [language, fetchTranslations, session, profile]);

  const setLanguage = async (newLanguage: Language) => {
    if (newLanguage === language) return;
    
    // Clear cache and state before changing language
    translationsCache = null;
    setTranslations({});
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);

    if (session && profile) {
        const { error } = await supabase
            .from('profiles')
            .update({ preferred_language: newLanguage })
            .eq('id', profile.id);

        if (error) {
            console.error('Error saving language preference:', error);
        } else {
            // After successfully saving, refetch the profile to keep the context in sync.
            refetchProfile();
        }
    }
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };
  
  const direction: LanguageDirection = language === 'ar' ? 'rtl' : 'ltr';

  const refetchTranslations = useCallback(() => {
    fetchTranslations(language, true); // Force refetch
  }, [language, fetchTranslations]);

  const value = { language, setLanguage, t, direction, refetchTranslations };
  
  const showLoader = loading && Object.keys(translations).length === 0;

  return (
    <LanguageContext.Provider value={value}>
      {!showLoader ? children : <div className="min-h-screen flex items-center justify-center">Loading Language...</div>}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
