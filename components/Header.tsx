import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, setSessionPersistence } from '../services/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { createPortal } from 'react-dom';
import {
  SunIcon, MoonIcon, ArrowRightOnRectangleIcon, SpinnerIcon, SearchChartIcon,
  ChartPieIcon, UsersIcon, ShieldCheckIcon, MegaphoneIcon, DocumentTextIcon, ChartBarIcon,
  BuildingOfficeIcon, Cog6ToothIcon, ChevronDownIcon, LanguageIcon, ExclamationTriangleIcon, InformationCircleIcon,
  ClipboardListIcon, EyeIcon, PencilSquareIcon, Bars3Icon, XMarkIcon, GoogleIcon,
  EnvelopeIcon, UserPlusIcon, TrendingUpIcon
} from './icons';
import type { Profile, PageName, PageState } from '../types';
import SignUpModal from './SignUpModal';

// Helper function moved outside the main component to prevent re-declaration on every render.
const getInitials = (name?: string | null, email?: string | null) => {
  if (name?.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
  }
  return email ? email.charAt(0).toUpperCase() : '?';
};

// --- Logged In View Component ---
const LoggedInView: React.FC<{
  profile: Profile | null;
  isProfileOpen: boolean;
  setProfileOpen: (value: boolean) => void;
  profileMenuRef: React.RefObject<HTMLDivElement>;
  isSigningOut: boolean;
  signOutError: string | null;
  handleSignOut: () => Promise<void>;
}> = ({ profile, isProfileOpen, setProfileOpen, profileMenuRef, isSigningOut, signOutError, handleSignOut }) => {
  const { t } = useLanguage();
  const { session } = useAuth();
  const displayName = profile?.full_name?.trim() ? profile.full_name : profile?.email;
  
  return (
    <div className="relative" ref={profileMenuRef}>
        <button
          onClick={() => setProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
        >
          <span className="hidden sm:inline truncate max-w-[160px]">{displayName}</span>
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-base font-bold text-slate-700 dark:bg-slate-700 dark:text-white">
            {getInitials(profile?.full_name, profile?.email)}
          </span>
        </button>

        {isProfileOpen && (
        <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
            <div className="p-4 border-b dark:border-gray-700 text-start">
            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName || t('user')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile?.roles?.name ? t(`role_${profile.roles.name}`) : t('no_role')}</p>
            </div>
            <ul className="py-1">
            {!session && (
              <li className="px-4 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                {t('auth_session_missing') || '!Auth session missing'}
              </li>
            )}
            {signOutError && (
              <li className="px-4 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                {signOutError}
              </li>
            )}
            <li><button 
                onClick={handleSignOut} 
                className="w-full text-start flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-75 disabled:cursor-not-allowed"
                disabled={isSigningOut}
            >
                {isSigningOut ? (
                    <>
                        <SpinnerIcon className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0 animate-spin" />
                        {t('signing_out')}...
                    </>
                ) : (
                    <>
                        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                        {t('sign_out')}
                    </>
                )}
            </button></li>
            </ul>
        </div>
        )}
    </div>
  );
};

// --- Logged Out View Component (Restored) ---
const LoggedOutView: React.FC<{ setPage: (page: PageState) => void; setSignUpModalOpen: (isOpen: boolean) => void; }> = ({ setPage, setSignUpModalOpen }) => {
  const { t } = useLanguage();
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('session-persistence') === 'true');
  const [email, setEmail] = useState(() => {
      const isRemembered = localStorage.getItem('session-persistence') === 'true';
      return (isRemembered && localStorage.getItem('rememberedEmail')) || '';
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'info' | 'error', message: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    try {
      setSessionPersistence(rememberMe);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (err: any) {
      const errorMessage = (err.message || '').toLowerCase();
      if (errorMessage.includes('email not confirmed') || errorMessage.includes('invalid refresh token')) {
          setNotification({ type: 'info', message: t('email_not_confirmed_message') });
      } else {
          setNotification({ type: 'error', message: t('login_failed') });
      }
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };
  
   const signInWithGoogle = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            setNotification({ type: 'error', message: t('google_sign_in_failed') + `: ${error.message}` });
            setLoading(false);
        }
        // On success, Supabase redirects.
    };

  return (
    <div className="relative">
      {/* --- Unified View for Desktop & Mobile --- */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            title={t('sign_in_with_google')}
            aria-label={t('sign_in_with_google')}
            className="h-9 w-9 flex items-center justify-center border border-transparent rounded-md shadow-sm text-white bg-[#4285F4] hover:bg-[#357ae8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
            <GoogleIcon className="w-5 h-5" />
        </button>

        <details className="relative group">
            <summary
                title={t('login_with_email')}
                aria-label={t('login_with_email')}
                className="h-9 w-9 list-none bg-nextrow-primary text-white rounded-md hover:bg-nextrow-primary/90 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-nextrow-primary">
                <EnvelopeIcon className="w-5 h-5" />
            </summary>
            <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[340px] z-10 border dark:border-gray-700 group-open:animate-fade-in-down">
                <form onSubmit={handleLogin} className="flex flex-col space-y-4">
                    <div className="flex flex-col">
                        <label htmlFor="header-email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email_or_phone')}</label>
                        <input
                            id="header-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-10 w-full px-3 text-sm border border-nextrow-border rounded-md focus:outline-none focus:ring-2 focus:ring-nextrow-primary dark:bg-gray-700 dark:border-nextrow-border-dark dark:text-white"
                        />
                    </div>
                     <div className="flex flex-col">
                        <label htmlFor="header-password" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
                        <input
                            id="header-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 w-full px-3 text-sm border border-nextrow-border rounded-md focus:outline-none focus:ring-2 focus:ring-nextrow-primary dark:bg-gray-700 dark:border-nextrow-border-dark dark:text-white"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="header-remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-400 text-nextrow-primary focus:ring-nextrow-primary dark:border-gray-500 dark:bg-gray-600 dark:ring-offset-gray-800"
                            />
                            <label htmlFor="header-remember-me" className="ml-2 rtl:ml-0 rtl:mr-2 text-sm text-gray-700 dark:text-gray-300">
                                {t('remember_me')}
                            </label>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-10 px-6 bg-nextrow-primary text-white text-sm font-bold rounded-md hover:bg-nextrow-primary/90 focus:outline-none focus:ring-2 focus:ring-nextrow-primary disabled:opacity-50"
                    >
                        {loading ? <SpinnerIcon className="w-5 h-5" /> : t('login')}
                    </button>
                </form>
            </div>
        </details>
        
        <button
            type="button"
            onClick={() => setSignUpModalOpen(true)}
            title={t('sign_up')}
            aria-label={t('sign_up')}
            className="h-9 w-9 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
            >
            <UserPlusIcon className="w-5 h-5" />
        </button>
      </div>
      
      {notification && (
          <div className={`absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 p-4 rounded-lg shadow-lg w-auto min-w-[300px] z-10 flex items-center gap-3 ${
              notification.type === 'info'
                  ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50'
                  : 'bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50'
          }`}>
              {notification.type === 'info' ? (
                  <InformationCircleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0" />
              ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500 dark:text-red-400 shrink-0" />
              )}
              <p className={`text-base font-medium ${
                  notification.type === 'info' ? 'text-blue-800 dark:text-blue-200' : 'text-red-800 dark:text-red-200'
              }`}>
                  {notification.message}
              </p>
          </div>
      )}
    </div>
  );
};


// --- Main Header Component ---
const Header: React.FC<{
  profile: Profile | null;
  setPage: (page: PageState) => void;
  currentPage: PageName;
}> = ({ profile, setPage, currentPage }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { session, hasPermission, refetchProfile } = useAuth();
  const { settings } = useAppSettings();
  
  const [isSignUpModalOpen, setSignUpModalOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLanguageOpen, setLanguageOpen] = useState(false);
  const [isSiteMgmtOpen, setSiteMgmtOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const siteMgmtMenuRef = useRef<HTMLDivElement>(null);
  const siteMgmtButtonRef = useRef<HTMLButtonElement>(null);
  const [siteMgmtMenuStyles, setSiteMgmtMenuStyles] = useState<{ top: number; left: number } | null>(null);
  
  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
        setSignOutError(error.message || t('sign_out_failed') || 'فشل تسجيل الخروج');
        setIsSigningOut(false);
        // Keep menu open to show error
        setTimeout(() => {
          setSignOutError(null);
          setProfileOpen(false);
        }, 3000);
      } else {
        // Clear any cached data before reload
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Ignore storage errors
        }
        
        // A full page reload is the most robust way to ensure all state,
        // including context and cached data, is completely cleared on sign-out.
        // This is especially reliable for OAuth sessions where state listeners might not fire immediately.
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Unexpected error during sign out:', err);
      setSignOutError(err.message || t('sign_out_failed') || 'فشل تسجيل الخروج');
      setIsSigningOut(false);
      setTimeout(() => {
        setSignOutError(null);
        setProfileOpen(false);
      }, 3000);
    }
  };

  // Check session when profile is open and session is missing
  useEffect(() => {
    if (isProfileOpen && profile && !session) {
      // Try to refresh session
      supabase.auth.getSession().then(({ data, error }) => {
        if (error || !data.session) {
          // Session is truly missing, force sign out
          console.warn('Session missing, forcing sign out');
          handleSignOut();
        } else {
          // Session refreshed, refetch profile
          refetchProfile();
        }
      });
    }
  }, [isProfileOpen, profile, session, refetchProfile, handleSignOut]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 768) { // 768px is tailwind's 'md' breakpoint
            setMobileMenuOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
      if (
        siteMgmtMenuRef.current &&
        !siteMgmtMenuRef.current.contains(event.target as Node) &&
        !(siteMgmtButtonRef.current && siteMgmtButtonRef.current.contains(event.target as Node))
      ) {
        setSiteMgmtOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // FIX: Added `isVisuallyDistinct` to all navLink objects to ensure a consistent shape and prevent destructuring errors.
  const navLinks = [
    { page: 'daily_watchlist', label: t('daily_watchlist'), Icon: EyeIcon, permission: 'view:daily_watchlist', isVisuallyDistinct: false },
    { page: 'stock_analysis', label: t('stock_analysis'), Icon: ChartBarIcon, permission: 'view:stock_analysis', isVisuallyDistinct: false },
    { page: 'forecast_accuracy', label: t('forecast_accuracy'), Icon: ChartPieIcon, permission: 'view:forecast_accuracy', isVisuallyDistinct: false },
    { page: 'forecast_history_analysis', label: t('forecast_history_analysis'), Icon: ChartBarIcon, permission: 'view:forecast_history_analysis', isVisuallyDistinct: false },
    { page: 'nasdaq_snapshot', label: t('nasdaq_snapshot'), Icon: TrendingUpIcon, permission: 'view:nasdaq_snapshot', isVisuallyDistinct: false },
    { page: 'what_happened', label: t('what_happened'), Icon: InformationCircleIcon, permission: 'view:what_happened', isVisuallyDistinct: false },
    { page: 'user_notes', label: t('user_notes'), Icon: PencilSquareIcon, permission: 'submit:user_notes', isVisuallyDistinct: true },
  ] as const;
  
  const siteManagementLinks = [
      { page: 'dashboard', label: t('dashboard'), Icon: ChartPieIcon, permission: 'view:dashboard' },
      { page: 'users', label: t('user_management'), Icon: UsersIcon, permission: 'manage:users' },
      { page: 'roles', label: t('role_management'), Icon: ShieldCheckIcon, permission: 'manage:roles' },
      { page: 'announcements', label: t('announcement_management'), Icon: MegaphoneIcon, permission: 'manage:announcements' },
      { page: 'user_notes_management', label: t('manage_user_notes'), Icon: PencilSquareIcon, permission: 'manage:user_notes'}, // New
      { page: 'stock_management', label: t('stock_management'), Icon: BuildingOfficeIcon, permission: 'manage:stocks' },
      { page: 'translations', label: t('translation_management'), Icon: LanguageIcon, permission: 'manage:translations'},
      { page: 'system_documentation', label: t('system_documentation'), Icon: DocumentTextIcon, permission: 'view:system_documentation' },
      { page: 'activity_log', label: t('activity_log'), Icon: ClipboardListIcon, permission: 'view:activity_log' },
  ] as const;
  
  const canViewSiteManagement = siteManagementLinks.some(link => hasPermission(link.permission));
  const isSiteManagementActive = siteManagementLinks.some(link => link.page === currentPage);
  const isRTL = language === 'ar';
  const iconButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800';
  const navPillBase =
    'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200';
  const getNavLinkClasses = (page: PageName, isVisuallyDistinct: boolean) => {
    const isActive = currentPage === page;
    if (isVisuallyDistinct) {
      return `${navPillBase} ${
        isActive
          ? 'border border-amber-200 bg-amber-100 text-amber-900 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-50'
          : 'border border-transparent bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20'
      }`;
    }
    return `${navPillBase} ${
      isActive
        ? 'border border-blue-200 bg-blue-100 text-blue-700 shadow-sm dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-100'
        : 'border border-transparent text-slate-600 hover:border-blue-100 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
    }`;
  };
  const siteManagementButtonClasses = `${navPillBase} ${
    isSiteManagementActive
      ? 'border border-blue-200 bg-blue-100 text-blue-700 shadow-sm dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-100'
      : 'border border-transparent text-slate-600 hover:border-blue-100 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
  }`;

  const updateSiteMgmtMenuPosition = useCallback(() => {
    if (!siteMgmtButtonRef.current || typeof window === 'undefined') return;
    const buttonRect = siteMgmtButtonRef.current.getBoundingClientRect();
    const gap = 8;
    const menuWidth = 256; // w-64
    const scrollTop = window.scrollY || 0;
    const scrollLeft = window.scrollX || 0;
    const viewportWidth = window.innerWidth;
    const minLeft = 16;
    const maxLeft = Math.max(minLeft, viewportWidth - menuWidth - 16);
    let left = isRTL
      ? buttonRect.right + scrollLeft - menuWidth
      : buttonRect.left + scrollLeft;
    left = Math.max(minLeft, Math.min(maxLeft, left));
    const top = buttonRect.bottom + scrollTop + gap;
    setSiteMgmtMenuStyles({ top, left });
  }, [isRTL]);

  useEffect(() => {
    if (!isSiteMgmtOpen) return;
    updateSiteMgmtMenuPosition();
    const handleWindowChanges = () => updateSiteMgmtMenuPosition();
    window.addEventListener('resize', handleWindowChanges);
    window.addEventListener('scroll', handleWindowChanges, true);
    return () => {
      window.removeEventListener('resize', handleWindowChanges);
      window.removeEventListener('scroll', handleWindowChanges, true);
    };
  }, [isSiteMgmtOpen, updateSiteMgmtMenuPosition]);

  const canUsePortal = typeof window !== 'undefined' && typeof document !== 'undefined';

  return (
    <>
      {isSignUpModalOpen && (
        <SignUpModal
          onClose={() => setSignUpModalOpen(false)}
          onSuccess={() => setSignUpModalOpen(false)}
        />
      )}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3">
          <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage('landing');
              }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            >
              {settings.site_logo ? (
                <span
                  className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl"
                  dangerouslySetInnerHTML={{ __html: settings.site_logo }}
                />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-sm font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
                  TV
                </span>
              )}
              <span className="hidden sm:inline">{t('site_title')}</span>
            </a>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {profile && session ? (
                <LoggedInView
                  profile={profile}
                  isProfileOpen={isProfileOpen}
                  setProfileOpen={setProfileOpen}
                  profileMenuRef={profileMenuRef}
                  isSigningOut={isSigningOut}
                  signOutError={signOutError}
                  handleSignOut={handleSignOut}
                />
              ) : (
                <LoggedOutView setPage={setPage} setSignUpModalOpen={setSignUpModalOpen} />
              )}
              <div className="hidden items-center gap-2 md:flex">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={iconButtonClass}
                  aria-label={theme === 'dark' ? t('light_theme') : t('dark_theme')}
                >
                  {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
                <div className="relative" ref={languageMenuRef}>
                  <button
                    onClick={() => setLanguageOpen(!isLanguageOpen)}
                    className={iconButtonClass}
                    aria-label={t('select_language')}
                  >
                    <LanguageIcon className="h-5 w-5" />
                  </button>
                  {isLanguageOpen && (
                    <div
                      className={`absolute mt-2 w-36 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 ${
                        isRTL ? 'left-0' : 'right-0'
                      }`}
                    >
                      <ul className="space-y-1">
                        <li>
                          <button
                            onClick={() => {
                              setLanguage('en');
                              setLanguageOpen(false);
                            }}
                            className={`w-full rounded-xl px-3 py-2 text-sm font-semibold transition ${
                              language === 'en'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            English
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setLanguage('ar');
                              setLanguageOpen(false);
                            }}
                            className={`w-full rounded-xl px-3 py-2 text-sm font-semibold transition ${
                              language === 'ar'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            العربية
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-600/20 px-3 py-1 text-xs font-bold uppercase text-blue-700 dark:bg-blue-500/20 dark:text-blue-100">
                  {language?.toUpperCase()}
                </span>
              </div>
              {profile && (
                <button
                  onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                  className={`${iconButtonClass} md:hidden`}
                  aria-label={t('toggle_navigation')}
                >
                  {isMobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
          {profile && (
            <nav className="hidden md:block">
              <div
                className={`no-scrollbar flex items-center gap-2 overflow-x-auto overflow-y-visible rounded-3xl border border-slate-200 bg-slate-50/80 px-2 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/40 ${
                  isRTL ? 'justify-end' : 'justify-start'
                }`}
              >
                {navLinks
                  .filter((link) => hasPermission(link.permission))
                  .map(({ page, label, Icon, isVisuallyDistinct }) => (
                    <a
                      key={page}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(page);
                      }}
                      className={`${getNavLinkClasses(page, isVisuallyDistinct)} gap-2`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </a>
                  ))}
                {canViewSiteManagement && (
                  <button
                    ref={siteMgmtButtonRef}
                    onClick={() => {
                      setSiteMgmtOpen((prev) => !prev);
                      if (!isSiteMgmtOpen) {
                        updateSiteMgmtMenuPosition();
                      }
                    }}
                    className={`${siteManagementButtonClasses} gap-2`}
                  >
                    {t('site_management')}
                    <ChevronDownIcon className="h-4 w-4 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
      {isMobileMenuOpen && profile && (
        <div className="border-b border-slate-200 bg-white/95 p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks
              .filter((link) => hasPermission(link.permission))
              .map(({ page, label, Icon, isVisuallyDistinct }) => (
                <a
                  key={page}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page);
                    setMobileMenuOpen(false);
                  }}
                  className={`${getNavLinkClasses(page, isVisuallyDistinct)} w-full justify-between text-base`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {label}
                  </span>
                </a>
              ))}
            {canViewSiteManagement && (
              <>
                <hr className="border-slate-200 dark:border-slate-700" />
                <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('site_management')}
                </h3>
                {siteManagementLinks.filter((link) => hasPermission(link.permission)).map(({ page, label, Icon }) => (
                  <a
                    key={page}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(page);
                      setMobileMenuOpen(false);
                    }}
                    className={`${navPillBase} w-full justify-start border border-transparent text-base text-slate-600 hover:border-blue-100 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </a>
                ))}
              </>
            )}
            <hr className="border-slate-200 dark:border-slate-700" />
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <span>{t('theme')}</span>
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
                className={iconButtonClass}
                aria-label={theme === 'dark' ? t('light_theme') : t('dark_theme')}
              >
                {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
              <span>{t('language')}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-bold transition ${
                    language === 'en'
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setLanguage('ar');
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-bold transition ${
                    language === 'ar'
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  AR
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out forwards;
        }
        .no-scrollbar {
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {canUsePortal && canViewSiteManagement && isSiteMgmtOpen && siteMgmtMenuStyles &&
        createPortal(
          <div
            ref={siteMgmtMenuRef}
            style={{
              position: 'absolute',
              top: `${siteMgmtMenuStyles.top}px`,
              left: `${siteMgmtMenuStyles.left}px`,
              zIndex: 2000,
            }}
            className="w-64 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
          >
            <ul className="space-y-1">
              {siteManagementLinks.filter((link) => hasPermission(link.permission)).length > 0 ? (
                siteManagementLinks
                  .filter((link) => hasPermission(link.permission))
                  .map(({ page, label, Icon }) => (
                    <li key={page}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(page);
                          setSiteMgmtOpen(false);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white"
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </a>
                    </li>
                  ))
              ) : (
                <li className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {t('no_permissions')}
                </li>
              )}
            </ul>
          </div>,
          document.body
        )
      }
    </>
  );
};

export default Header;
