import React, { ReactNode, useState, useEffect, useRef } from 'react';
import type { Profile, PageName, PageState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const navigationItems = [
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
  ].filter(item => !item.permission || hasPermission(item.permission));

  const handleNavClick = (page: PageName) => {
    setPage(page);
    setIsMenuOpen(false);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Top bar - Minimal TikTok style */}
      <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white">{t('site_title')}</h1>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          aria-label="Menu"
        >
          {isMenuOpen ? (
            <XMarkIcon className="w-6 h-6 text-white" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Side menu - TikTok style slide-in */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setIsMenuOpen(false)}>
          <div
            ref={menuRef}
            className="absolute right-0 top-0 bottom-0 w-64 bg-gray-900 p-6 shadow-2xl transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {profile && (
                <div className="pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{profile.username || profile.email}</p>
                      <p className="text-gray-400 text-xs">{profile.email}</p>
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
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
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
      <AnnouncementsBanner />

      {/* Main Content - TikTok style full screen vertical scroll */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain px-2 py-2">
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar - TikTok style */}
      <div className="bg-black border-t border-gray-800 px-2 py-2 safe-area-bottom">
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
                    ? 'text-white bg-gray-800'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add to Home Screen Prompt */}
      <AddToHomeScreenPrompt />
    </div>
  );
};

export default MobileLayout;

