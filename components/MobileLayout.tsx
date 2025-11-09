import React, { ReactNode, useState, useEffect, useRef } from 'react';
import type { Profile, PageName, PageState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import {
  ChartBarIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
} from './icons';
import AnnouncementsBanner from './AnnouncementsBanner';
import AddToHomeScreenPrompt from './AddToHomeScreenPrompt';

interface MobileLayoutProps {
  profile: Profile | null;
  children: ReactNode;
  setPage: (page: PageState) => void;
  currentPage: PageName;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ profile, children, setPage, currentPage }) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Navigation items - TikTok style bottom bar
  // Only show navigation if user is logged in
  const navigationItems = profile ? [
    {
      id: 'daily_watchlist',
      label: t('daily_watchlist'),
      icon: ChartBarIcon,
      permission: 'view:daily_watchlist',
      page: 'daily_watchlist' as PageName,
    },
    {
      id: 'stock_analysis',
      label: t('stock_analysis'),
      icon: ChartPieIcon,
      permission: 'view:stock_analysis',
      page: 'stock_analysis' as PageName,
    },
    {
      id: 'stock_management',
      label: t('stock_management'),
      icon: BuildingOfficeIcon,
      permission: 'manage:stocks',
      page: 'stock_management' as PageName,
    },
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: Cog6ToothIcon,
      permission: 'view:dashboard',
      page: 'dashboard' as PageName,
    },
  ].filter(item => !item.permission || hasPermission(item.permission)) : [];

  const handleNavClick = (page: PageName) => {
    setPage(page);
    setIsMenuOpen(false);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // For landing page, use normal layout styling
  const isLandingPage = currentPage === 'landing' || !profile;
  // Always use TikTok black background for logged-in pages
  const appBackground = 'bg-gradient-to-br from-[#091426] via-[#131b2c] to-[#050b16]';
  const bgColor = isLandingPage ? 'bg-nextrow-bg dark:bg-nextrow-bg-dark' : appBackground;
  const textColor = isLandingPage ? 'text-nextrow-text dark:text-gray-200' : 'text-white';

  return (
    <div className={`flex flex-col min-h-screen ${bgColor} ${textColor} overflow-hidden`}>
      {/* Use Header component for landing page, TikTok style bar for logged in */}
      {isLandingPage ? (
        <div className="safe-area-top">
          <Header profile={profile} setPage={setPage} currentPage={currentPage} />
        </div>
      ) : (
        profile && (
          <div className="safe-area-top sticky top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-black/80 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{t('site_title')}</h1>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors active:scale-95"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6 text-white" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        )
      )}

      {/* Side menu - TikTok style slide-in */}
      {isMenuOpen && profile && (
        <div className={`fixed inset-0 ${isLandingPage ? 'bg-gray-900/80' : 'bg-black/80'} z-40`} onClick={() => setIsMenuOpen(false)}>
          <div
            ref={menuRef}
            className={`absolute right-0 top-0 bottom-0 w-64 ${isLandingPage ? 'bg-white dark:bg-gray-800' : 'bg-gray-900'} p-6 shadow-2xl transform transition-transform`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {profile && (
                <div className={`pb-4 border-b ${isLandingPage ? 'border-gray-200 dark:border-gray-700' : 'border-gray-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`font-semibold ${isLandingPage ? 'text-gray-900 dark:text-white' : 'text-white'}`}>{profile.username || profile.email}</p>
                      <p className={`text-xs ${isLandingPage ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>{profile.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPage === item.page
                      ? isLandingPage
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : isLandingPage
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Announcements Banner */}
      <div className="px-3 py-2">
        <AnnouncementsBanner />
      </div>

      {/* Main Content - TikTok style full screen vertical scroll */}
      <main
        className={`flex-1 overflow-y-auto overscroll-y-contain ${isLandingPage ? 'px-4 py-4 bg-nextrow-bg dark:bg-nextrow-bg-dark' : 'px-0 py-0'} `}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className={`min-h-full ${isLandingPage ? '' : 'h-full'} px-4 pb-6 pt-2`}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar - TikTok style, only show if logged in and has navigation items */}
      {profile && navigationItems.length > 0 && (
        <div className={`${isLandingPage ? 'bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700' : 'bg-black border-t border-gray-800'} px-2 py-2 safe-area-bottom`}>
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.page)}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? isLandingPage 
                        ? 'text-nextrow-primary bg-gray-100 dark:bg-gray-700'
                        : 'text-white bg-gray-800'
                      : isLandingPage
                        ? 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className={`text-[10px] font-medium ${isActive ? (isLandingPage ? 'text-nextrow-primary' : 'text-white') : (isLandingPage ? 'text-gray-500' : 'text-gray-500')}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add to Home Screen Prompt */}
      <AddToHomeScreenPrompt />
    </div>
  );
};

export default MobileLayout;

