import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';
// FIX: Removed unused and non-existent MsftIcon import.
import { ChartPieIcon, UsersIcon, ShieldCheckIcon, MegaphoneIcon, DocumentTextIcon, ChartBarIcon } from './icons';

interface SidebarProps {
  setPage: (page: 'dashboard' | 'users' | 'roles' | 'landing' | 'announcements' | 'system_documentation' | 'stock_analysis') => void;
  currentPage: 'dashboard' | 'users' | 'roles' | 'landing' | 'announcements' | 'system_documentation' | 'stock_analysis';
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => {
  const { direction } = useLanguage();
  const activeBarClass = direction === 'rtl' ? 'right-0 rounded-l-md' : 'left-0 rounded-r-md';

  return (
    <div className="relative">
      <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${ isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
        <span className="w-6 h-6 shrink-0">{icon}</span>
        <span className="mx-3">{label}</span>
      </a>
      {isActive && <span className={`absolute top-1/2 -translate-y-1/2 h-2/3 w-1 bg-blue-600 ${activeBarClass}`}></span>}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ setPage, currentPage }) => {
  const { t } = useLanguage();
  const { settings } = useAppSettings();
  const { hasPermission, session } = useAuth();

  if (!session) {
    return null; // Don't render sidebar if not logged in
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0">
      <nav className="flex-1 px-4 py-4 space-y-2 mt-16">
        {hasPermission('view:stock_analysis') && (
            <NavLink icon={<ChartBarIcon />} label={t('stock_analysis')} isActive={currentPage === 'stock_analysis'} onClick={() => setPage('stock_analysis')} />
        )}
        {hasPermission('view:forecast_accuracy') && (
            <NavLink icon={<ChartBarIcon />} label={t('forecast_accuracy')} isActive={currentPage === 'forecast_accuracy'} onClick={() => setPage('forecast_accuracy')} />
        )}
        {hasPermission('manage:users') && (
            <NavLink icon={<UsersIcon />} label={t('user_management')} isActive={currentPage === 'users'} onClick={() => setPage('users')} />
        )}
        {hasPermission('manage:roles') && (
            <NavLink icon={<ShieldCheckIcon />} label={t('role_management')} isActive={currentPage === 'roles'} onClick={() => setPage('roles')} />
        )}
        {hasPermission('manage:announcements') && (
            <NavLink icon={<MegaphoneIcon />} label={t('announcements')} isActive={currentPage === 'announcements'} onClick={() => setPage('announcements')} />
        )}
        {hasPermission('view:system_documentation') && (
            <NavLink icon={<DocumentTextIcon />} label={t('system_documentation')} isActive={currentPage === 'system_documentation'} onClick={() => setPage('system_documentation')} />
        )}
        {hasPermission('view:dashboard') && (
            <NavLink icon={<ChartPieIcon />} label={t('dashboard')} isActive={currentPage === 'dashboard'} onClick={() => setPage('dashboard')} />
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;