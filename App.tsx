import React, { useState, useEffect, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import MobileLayout from './components/MobileLayout';
import AccessDenied from './components/AccessDenied';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useIsMobile } from './hooks/useIsMobile';
import type { PageName, PageState } from './types';

// Lazy load all pages for better performance
const LandingPage = lazy(() => import('./components/pages/LandingPage'));
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const UserManagement = lazy(() => import('./components/pages/UserManagement'));
const RoleManagement = lazy(() => import('./components/pages/RoleManagement'));
const AnnouncementsManagement = lazy(() => import('./components/pages/AnnouncementsManagement'));
const SystemDocumentation = lazy(() => import('./components/pages/SystemDocumentation'));
const StockAnalysis = lazy(() => import('./components/pages/StockAnalysis'));
const DailyWatchlist = lazy(() => import('./components/pages/DailyWatchlist'));
const StockManagement = lazy(() => import('./components/pages/StockManagement'));
const StockDetails = lazy(() => import('./components/pages/StockDetails'));
const TranslationManagement = lazy(() => import('./components/pages/TranslationManagement'));
const ActivityLog = lazy(() => import('./components/pages/ActivityLog'));
const UserNotes = lazy(() => import('./components/pages/UserNotes'));
const UserNotesManagement = lazy(() => import('./components/pages/UserNotesManagement'));

const App: React.FC = () => {
  const { session, loading, hasPermission, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageState>('landing');
  const { direction, t, language } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);
  
  const currentPageName = typeof currentPage === 'string' ? currentPage : currentPage.page;
  
  // Effect to set the page title dynamically
  useEffect(() => {
    const pageTitleKeyMap: { [key in PageName]: string } = {
      landing: 'site_title',
      dashboard: 'dashboard',
      users: 'user_management',
      roles: 'role_management',
      announcements: 'announcement_management',
      system_documentation: 'system_documentation',
      stock_analysis: 'stock_analysis',
      daily_watchlist: 'daily_watchlist',
      stock_management: 'stock_management',
      translations: 'translation_management',
      stock_details: 'stock_details',
      activity_log: 'activity_log',
      user_notes: 'user_notes', // New
      user_notes_management: 'manage_user_notes', // New
    };
    const titleKey = pageTitleKeyMap[currentPageName];
    document.title = (currentPageName === 'landing' || !session) 
        ? t(titleKey)
        : `${t(titleKey)} | ${t('site_title')}`;
  }, [currentPageName, t, language, session]);

  // Effect to dynamically update PWA manifest and title
  useEffect(() => {
    const siteTitle = t('site_title');
    // Don't run if translation isn't ready or it's the default key
    if (!siteTitle || siteTitle === 'site_title') return;

    // Update apple-mobile-web-app-title meta tag
    const appleTitleTag = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleTag) {
      appleTitleTag.setAttribute('content', siteTitle);
    }
    
    // Create a dynamic manifest
    const manifest = {
      "short_name": siteTitle,
      "name": siteTitle,
      "description": "Professional and visually engaging stock price predictions for the U.S. markets.",
      "icons": [
        { "src": "/favicon.ico", "sizes": "64x64 32x32 24x24 16x16", "type": "image/x-icon" },
        { "src": "/icons/icon-192.png", "type": "image/png", "sizes": "192x192" },
        { "src": "/icons/icon-512.png", "type": "image/png", "sizes": "512x512" }
      ],
      "start_url": "/",
      "display": "standalone",
      "scope": "/",
      "theme_color": "#4338ca",
      "background_color": "#ffffff"
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    // Update the manifest link tag
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', manifestUrl);
    }

  }, [t, language]);

  // Effect to handle page access control and redirection
  useEffect(() => {
    if (loading || (session && !profile)) return; // Wait until authentication and profile loading is complete

    if (!session) {
      // If user is not logged in, they can only be on the landing page.
      if (currentPageName !== 'landing') {
        setCurrentPage('landing');
      }
      return;
    }

    // If user is logged in, check permissions for the current page.
    const pagePermissions: Record<PageName, string | null> = {
        landing: null, // Always allowed
        dashboard: 'view:dashboard',
        users: 'manage:users',
        roles: 'manage:roles',
        announcements: 'manage:announcements',
        system_documentation: 'view:system_documentation',
        stock_analysis: 'view:stock_analysis',
        daily_watchlist: 'view:daily_watchlist',
        stock_management: 'manage:stocks',
        translations: 'manage:translations',
        stock_details: 'view:stock_analysis', // Re-use stock_analysis permission
        activity_log: 'view:activity_log',
        user_notes: 'submit:user_notes', // Use dedicated permission
        user_notes_management: 'manage:user_notes', // Admin-only
    };
    
    const requiredPermission = pagePermissions[currentPageName];
    
    // If user is on a protected page but lacks permission, redirect them.
    if (requiredPermission && !hasPermission(requiredPermission)) {
        // Try redirecting to dashboard first. If they can't view that, send to landing.
        if (hasPermission('view:dashboard')) {
            setCurrentPage('dashboard');
        } else if (hasPermission('view:stock_analysis')) {
            setCurrentPage('stock_analysis'); // Redirect standard users to their default page
        } else {
            setCurrentPage('landing');
        }
    }
  }, [currentPageName, session, profile, hasPermission, loading]);
  
  if (loading || (session && !profile)) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">{t('loading')}...</div>;
  }
  
  // Loading skeleton component
  const PageSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );

  // The main layout is now always rendered. Header/Sidebar handle auth state.
  const renderPage = () => {
    const pageName = typeof currentPage === 'string' ? currentPage : currentPage.page;
    
    const pageContent = (() => {
      switch (pageName) {
        case 'users':
          return hasPermission('manage:users') ? <UserManagement /> : <AccessDenied />;
        case 'roles':
          return hasPermission('manage:roles') ? <RoleManagement /> : <AccessDenied />;
        case 'announcements':
          return hasPermission('manage:announcements') ? <AnnouncementsManagement /> : <AccessDenied />;
        case 'system_documentation':
          return hasPermission('view:system_documentation') ? <SystemDocumentation /> : <AccessDenied />;
        case 'stock_analysis':
          return hasPermission('view:stock_analysis') ? <StockAnalysis setPage={setCurrentPage} /> : <AccessDenied />;
        case 'daily_watchlist': 
          return hasPermission('view:daily_watchlist') ? <DailyWatchlist setPage={setCurrentPage} /> : <AccessDenied />;
        case 'stock_management':
          return hasPermission('manage:stocks') ? <StockManagement /> : <AccessDenied />;
        case 'translations':
          return hasPermission('manage:translations') ? <TranslationManagement /> : <AccessDenied />;
        case 'activity_log':
          return hasPermission('view:activity_log') ? <ActivityLog /> : <AccessDenied />;
        case 'user_notes':
          return hasPermission('submit:user_notes') ? <UserNotes /> : <AccessDenied />;
        case 'user_notes_management':
          return hasPermission('manage:user_notes') ? <UserNotesManagement /> : <AccessDenied />;
        case 'stock_details':
          if (typeof currentPage === 'object' && hasPermission('view:stock_analysis')) {
            return <StockDetails symbol={currentPage.symbol} setPage={setCurrentPage} />;
          }
          return <AccessDenied />;
        case 'dashboard':
          return hasPermission('view:dashboard') ? <Dashboard /> : <AccessDenied />;
        case 'landing':
        default:
          return <LandingPage />;
      }
    })();

    return (
      <Suspense fallback={<PageSkeleton />}>
        {pageContent}
      </Suspense>
    );
  };
  
  // Choose layout based on device type
  const LayoutComponent = isMobile ? MobileLayout : Layout;
  
  return (
    <LayoutComponent profile={profile} setPage={setCurrentPage} currentPage={currentPageName}>
      {renderPage()}
    </LayoutComponent>
  );
};

export default App;
