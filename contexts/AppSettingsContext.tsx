import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { AppSettings } from '../types';

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateSetting: (key: string, value: string) => Promise<void>;
  refetchSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// --- Caching State ---
let settingsCache: AppSettings | null = null;
// ---------------------

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(settingsCache || {});
  const [loading, setLoading] = useState(!settingsCache);

  const fetchSettings = useCallback(async (forceRefetch = false) => {
    if (settingsCache && !forceRefetch) {
      if(loading) setLoading(false);
      return;
    }
    
    if (forceRefetch) {
        settingsCache = null;
    }
    
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_app_settings');

    if (error) {
      console.error('Error fetching app settings:', error.message || JSON.stringify(error));
      setSettings({});
    } else {
      const newSettings = (data || []).reduce((acc: AppSettings, row) => {
        if (row.key) acc[row.key] = row.value || '';
        return acc;
      }, {});
      settingsCache = newSettings;
      setSettings(newSettings);
    }
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
        console.error(`Error updating setting ${key}:`, error);
        throw error;
    } else {
        // Update local state and cache
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        settingsCache = newSettings;
    }
  };
  
  const refetchSettings = useCallback(() => {
    fetchSettings(true); // Force refetch
  }, [fetchSettings]);

  const value = { settings, loading, updateSetting, refetchSettings };

  return (
    <AppSettingsContext.Provider value={value}>
      {!loading ? children : <div className="min-h-screen flex items-center justify-center">Loading Settings...</div>}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextType => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};