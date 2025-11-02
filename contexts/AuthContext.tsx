import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  hasPermission: (action: string) => boolean;
  refetchProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Caching ---
const getProfileCacheKey = (userId: string) => `user-profile-${userId}`;

const saveProfileToCache = (profile: Profile) => {
  try {
    const key = getProfileCacheKey(profile.id);
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile to cache", e);
  }
};

const loadProfileFromCache = (user: User): Profile | null => {
  try {
    const key = getProfileCacheKey(user.id);
    const cachedProfileString = localStorage.getItem(key);
    if (cachedProfileString) {
      const cachedProfile: Profile = JSON.parse(cachedProfileString);
      if (cachedProfile && cachedProfile.id === user.id) {
        console.log("Loaded profile from cache.");
        return cachedProfile;
      }
    }
  } catch (e) {
    console.error("Failed to load profile from cache", e);
  }
  return null;
};

const clearProfileCache = (user: User | null) => {
  if (user) {
    try {
      const key = getProfileCacheKey(user.id);
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Failed to clear profile cache", e);
    }
  }
};
// --- End Caching ---

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  const setProfileState = (newProfile: Profile | null) => {
    if (newProfile) {
      const permissionActions = newProfile.roles?.permissions?.map(p => p.action) ?? [];
      setProfile(newProfile);
      setPermissions(new Set(permissionActions));
    } else {
      setProfile(null);
      setPermissions(new Set());
    }
  };

  const fetchProfileAndPermissions = useCallback(async (user: User, signal?: AbortSignal): Promise<boolean> => {
    let profileData: Profile | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !profileData) {
      attempts++;
      const { data, error } = await supabase
        .rpc('get_user_profile_and_permissions', { p_user_id: user.id })
        .abortSignal(signal)
        .single();

      if (signal?.aborted) {
        console.log("Profile fetch aborted.");
        return false;
      }

      if (!error && data) {
        profileData = data as Profile;
      } else {
        console.error(`Profile fetch attempt ${attempts} failed:`, error?.message || 'No profile data returned');
        if (attempts < maxAttempts) {
          await delay(500 * Math.pow(2, attempts - 1));
        }
      }
    }

    if (profileData) {
      setProfileState(profileData);
      saveProfileToCache(profileData);
      return true;
    } else {
      return false;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const controller = new AbortController();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const previousSession = sessionRef.current;
      sessionRef.current = newSession;

      if (controller.signal.aborted) {
        return;
      }
      
      if (!newSession) {
        if (previousSession?.user) {
          clearProfileCache(previousSession.user);
        }
        setSession(null);
        setProfileState(null);
        setLoading(false);
        return;
      }
      
      setSession(newSession);

      const cachedProfile = loadProfileFromCache(newSession.user);
      if (cachedProfile) {
        setProfileState(cachedProfile);
        setLoading(false);
        
        fetchProfileAndPermissions(newSession.user, controller.signal);
      } else {
        setLoading(true);
        const success = await fetchProfileAndPermissions(newSession.user, controller.signal);
        if (!success && !controller.signal.aborted) {
          console.error("Initial profile fetch failed with no cache. Forcing sign-out.");
          await supabase.auth.signOut();
        }
        setLoading(false);
      }
    });

    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            // Calling getSession() will automatically attempt to refresh the token if it's expired.
            // The onAuthStateChange listener above will handle any changes to the session state
            // (e.g., if the refresh fails and the user is logged out). This is safer than
            // refreshSession() which can error if no refresh token is present.
            await supabase.auth.getSession();
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      controller.abort();
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfileAndPermissions]);
  
  const refetchProfile = useCallback(async () => {
    if (session?.user) {
      setLoading(true);
      try {
        await fetchProfileAndPermissions(session.user);
      } catch(e) {
        console.error("Manual profile refetch failed.", e);
      } finally {
        setLoading(false);
      }
    }
  }, [session, fetchProfileAndPermissions]);

  const hasPermission = useCallback((action: string): boolean => {
    return permissions.has(action);
  }, [permissions]);

  const value = useMemo(() => ({ session, profile, loading, hasPermission, refetchProfile }), 
    [session, profile, loading, hasPermission, refetchProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
