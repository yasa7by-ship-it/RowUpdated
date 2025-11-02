import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { GlobalAnnouncement, AnnouncementType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { PlusIcon, PencilIcon, TrashIcon, SpinnerIcon } from '../icons';
import AnnouncementEditModal from './AnnouncementEditModal';

const AnnouncementsManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [announcements, setAnnouncements] = useState<GlobalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Refactored to use RPC call instead of direct table access.
    const { data, error: fetchError } = await supabase.rpc('get_all_announcements');
    
    if (fetchError) {
      console.error('Error fetching announcements:', fetchError);
      setError(fetchError.message);
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNew = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleEdit = (announcement: GlobalAnnouncement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm(t('confirm_delete_announcement'))) {
      const { error } = await supabase.from('global_announcements').delete().eq('id', id);
      if (error) {
        setNotification({ type: 'error', message: t('announcement_delete_failed') });
      } else {
        setNotification({ type: 'success', message: t('announcement_deleted_successfully') });
        fetchData(); // Refresh list
      }
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };
  
  const getStatus = (announcement: GlobalAnnouncement) => {
      const now = new Date();
      const start = new Date(announcement.start_date);
      const end = new Date(announcement.end_date);
      
      if (!announcement.is_enabled) return { text: t('inactive'), color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
      if (now > end) return { text: t('expired'), color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
      if (now < start) return { text: t('scheduled'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
      return { text: t('active'), color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
  }

  if (loading) return (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="ml-3 rtl:mr-3 text-lg">{t('loading')}...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
        <p><strong>Error fetching data:</strong> {error}</p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('announcement_management')}</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('add_announcement')}
        </button>
      </div>

       {notification && (
          <div className={`mb-4 p-4 text-sm rounded-md ${
              notification.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
              {notification.message}
          </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('title')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('announcement_type')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('announcement_status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('start_date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('end_date')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {announcements.map((announcement) => {
                const status = getStatus(announcement);
                return (
                  <tr key={announcement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{announcement.title[language] || announcement.title['en']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-gray-500 dark:text-gray-400">{t(`type_${announcement.type}`)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(announcement.start_date).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(announcement.end_date).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                        <button onClick={() => handleEdit(announcement)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200" title={t('edit')}>
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(announcement.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200" title={t('delete')}>
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <AnnouncementEditModal
          announcement={editingAnnouncement}
          onClose={handleCloseModal}
          onSave={() => {
            fetchData();
            setNotification({ type: 'success', message: t('announcement_saved_successfully') });
            setTimeout(() => setNotification(null), 5000);
          }}
        />
      )}
    </div>
  );
};

export default AnnouncementsManagement;
