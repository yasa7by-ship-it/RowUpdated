import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { GlobalAnnouncement } from '../types';

interface AnnouncementsContextType {
  announcements: GlobalAnnouncement[];
  loading: boolean;
  refetchAnnouncements: () => void;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

// --- Caching State ---
let announcementsCache: GlobalAnnouncement[] | null = null;
// ---------------------

export const AnnouncementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>(announcementsCache || []);
  const [loading, setLoading] = useState(!announcementsCache);

  const fetchActiveAnnouncements = useCallback(async (forceRefetch = false) => {
    // Polling should not block UI with a loader
    if (!forceRefetch) {
      setLoading(false); 
    } else {
      setLoading(true);
      announcementsCache = null;
    }
    
    const { data, error } = await supabase.rpc('get_active_announcements');

    if (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
      announcementsCache = [];
    } else {
      const newAnnouncements = data || [];
      setAnnouncements(newAnnouncements);
      announcementsCache = newAnnouncements;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch
    if (!announcementsCache) {
      fetchActiveAnnouncements(true);
    }
    
    // Set up a poller to refetch announcements periodically in the background
    const interval = setInterval(() => fetchActiveAnnouncements(false), 5 * 60 * 1000); // every 5 minutes
    
    return () => clearInterval(interval);
  }, [fetchActiveAnnouncements]);

  const refetchAnnouncements = useCallback(() => {
    fetchActiveAnnouncements(true); // Force a refetch
  }, [fetchActiveAnnouncements]);

  const value = { announcements, loading, refetchAnnouncements };

  return (
    <AnnouncementsContext.Provider value={value}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementsContextType => {
  const context = useContext(AnnouncementsContext);
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};