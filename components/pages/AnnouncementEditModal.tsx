import React, { useState, useEffect } from 'react';
import type { GlobalAnnouncement, AnnouncementType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../services/supabaseClient';

interface AnnouncementEditModalProps {
  announcement: GlobalAnnouncement | null;
  onClose: () => void;
  onSave: () => void;
}

const AnnouncementEditModal: React.FC<AnnouncementEditModalProps> = ({ announcement, onClose, onSave }) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  // Helper to format date for datetime-local input
  const toLocalISOString = (date: Date) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    if (announcement) {
      setTitleEn(announcement.title.en || '');
      setTitleAr(announcement.title.ar || '');
      setMessageEn(announcement.message.en || '');
      setMessageAr(announcement.message.ar || '');
      setType(announcement.type);
      setStartDate(toLocalISOString(new Date(announcement.start_date)));
      setEndDate(toLocalISOString(new Date(announcement.end_date)));
      setIsEnabled(announcement.is_enabled);
    } else {
      // Set default dates for new announcement
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setStartDate(toLocalISOString(now));
      setEndDate(toLocalISOString(oneWeekFromNow));
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    // Sanitize input to remove null characters which can cause database issues when pasting.
    const sanitize = (str: string) => (str || '').replace(/\u0000/g, '');

    const announcementData = {
        title: { en: sanitize(titleEn), ar: sanitize(titleAr) },
        message: { en: sanitize(messageEn), ar: sanitize(messageAr) },
        type,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_enabled: isEnabled
    };

    try {
      let response;
      if (announcement) {
        response = await supabase.from('global_announcements').update(announcementData).eq('id', announcement.id);
      } else {
        response = await supabase.from('global_announcements').insert(announcementData);
      }
      
      if (response.error) {
        throw response.error;
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isNew = !announcement;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full md:max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isNew ? t('add_announcement') : t('edit_announcement')}
            </h2>
          </div>
          
          <div className="p-6 space-y-4 overflow-y-auto">
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label htmlFor="title_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('title_en')}</label>
                  <input type="text" id="title_en" value={titleEn} onChange={e => setTitleEn(e.target.value)} required
                         className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="title_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('title_ar')}</label>
                  <input type="text" id="title_ar" value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl"
                         className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
            </div>

            <div>
              <label htmlFor="message_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('message_en')}</label>
              <textarea id="message_en" rows={3} value={messageEn} onChange={e => setMessageEn(e.target.value)} required
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
             <div>
              <label htmlFor="message_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('message_ar')}</label>
              <textarea id="message_ar" rows={3} value={messageAr} onChange={e => setMessageAr(e.target.value)} dir="rtl"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('announcement_type')}</label>
                    <select id="type" value={type} onChange={e => setType(e.target.value as AnnouncementType)} required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="info">{t('type_info')}</option>
                        <option value="warning">{t('type_warning')}</option>
                        <option value="success">{t('type_success')}</option>
                        <option value="error">{t('type_error')}</option>
                    </select>
                </div>
                <div>
                     <label htmlFor="is_enabled" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('is_enabled')}</label>
                      <div className="mt-2 flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer"
                            checked={isEnabled}
                            onChange={(e) => setIsEnabled(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('start_date')}</label>
                    <input type="datetime-local" id="start_date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('end_date')}</label>
                    <input type="datetime-local" id="end_date" value={endDate} onChange={e => setEndDate(e.target.value)} required
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
            </div>

          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center space-x-3 rtl:space-x-reverse mt-auto">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isSaving}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementEditModal;
