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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isNew ? t('add_announcement') : t('edit_announcement')}
            </h2>
          </div>
          
          {/* Compact Form Fields */}
          <div className="px-4 py-3 space-y-3 overflow-y-auto">
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs">
                {error}
              </div>
            )}
            
            {/* Titles - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="title_en" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('title_en')}
                </label>
                <input 
                  type="text" 
                  id="title_en" 
                  value={titleEn} 
                  onChange={e => setTitleEn(e.target.value)} 
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
              <div>
                <label htmlFor="title_ar" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('title_ar')}
                </label>
                <input 
                  type="text" 
                  id="title_ar" 
                  value={titleAr} 
                  onChange={e => setTitleAr(e.target.value)} 
                  dir="rtl"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
            </div>

            {/* Messages - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="message_en" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('message_en')}
                </label>
                <textarea 
                  id="message_en" 
                  rows={3} 
                  value={messageEn} 
                  onChange={e => setMessageEn(e.target.value)} 
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                />
              </div>
              <div>
                <label htmlFor="message_ar" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('message_ar')}
                </label>
                <textarea 
                  id="message_ar" 
                  rows={3} 
                  value={messageAr} 
                  onChange={e => setMessageAr(e.target.value)} 
                  dir="rtl"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Type and Toggle - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="type" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('announcement_type')}
                </label>
                <select 
                  id="type" 
                  value={type} 
                  onChange={e => setType(e.target.value as AnnouncementType)} 
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="info">{t('type_info')}</option>
                  <option value="warning">{t('type_warning')}</option>
                  <option value="success">{t('type_success')}</option>
                  <option value="error">{t('type_error')}</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label htmlFor="is_enabled" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('is_enabled')}
                </label>
                <label className="relative inline-flex items-center cursor-pointer self-start">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                  />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Dates - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="start_date" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('start_date')}
                </label>
                <input 
                  type="datetime-local" 
                  id="start_date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('end_date')}
                </label>
                <input 
                  type="datetime-local" 
                  id="end_date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
            </div>
          </div>
          
          {/* Compact Footer Buttons */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center gap-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementEditModal;
