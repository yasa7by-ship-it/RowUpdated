import React, { useState, useMemo } from 'react';
import { useAnnouncements } from '../contexts/AnnouncementsContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { AnnouncementType } from '../types';
import { InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from './icons';

const AnnouncementCard: React.FC<{
  title: string;
  message: string;
  type: AnnouncementType;
  onDismiss: () => void;
}> = ({ title, message, type, onDismiss }) => {
  const styles = useMemo(() => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-500',
          icon: <CheckCircleIcon className="w-5 h-5" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-500',
          icon: <ExclamationTriangleIcon className="w-5 h-5" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-500',
          icon: <XCircleIcon className="w-5 h-5" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-500',
          icon: <InformationCircleIcon className="w-5 h-5" />,
        };
    }
  }, [type]);

  return (
    <div className={`p-4 rounded-md ${styles.bg} ${styles.text}`}>
      <div className="flex">
        <div className={`shrink-0 ${styles.iconColor}`}>{styles.icon}</div>
        <div className="ml-3 rtl:mr-3 rtl:ml-0 flex-1 md:flex md:justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-sm">{message}</p>
          </div>
          <div className="mt-2 md:mt-0 md:ml-6 rtl:md:mr-6 rtl:md:ml-0">
             <button onClick={onDismiss} className={`p-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.iconColor} ${styles.bg}`}>
                <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnnouncementsBanner: React.FC = () => {
  const { announcements, loading } = useAnnouncements();
  const { language } = useLanguage();
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    // Restore dismissed IDs from sessionStorage
    const saved = sessionStorage.getItem('dismissedAnnouncements');
    return saved ? JSON.parse(saved) : [];
  });

  const handleDismiss = (id: number) => {
    const newDismissedIds = [...dismissedIds, id];
    setDismissedIds(newDismissedIds);
    sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissedIds));
  };
  
  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (loading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      {visibleAnnouncements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          title={announcement.title[language] || announcement.title['en']}
          message={announcement.message[language] || announcement.message['en']}
          type={announcement.type}
          onDismiss={() => handleDismiss(announcement.id)}
        />
      ))}
    </div>
  );
};

export default AnnouncementsBanner;
