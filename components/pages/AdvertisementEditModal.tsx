import React, { useState, useEffect } from 'react';
import type { Advertisement } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdvertisementEditModalProps {
  advertisement: Advertisement | null;
  onClose: () => void;
  onSave: (data: Omit<Advertisement, 'id' | 'created_at'>) => Promise<void>;
}

const AdvertisementEditModal: React.FC<AdvertisementEditModalProps> = ({ advertisement, onClose, onSave }) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [advertiserNameEn, setAdvertiserNameEn] = useState('');
  const [advertiserNameAr, setAdvertiserNameAr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
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
    if (advertisement) {
      setTitleEn(advertisement.title.en || '');
      setTitleAr(advertisement.title.ar || '');
      setAdvertiserNameEn(advertisement.advertiser_name?.en || '');
      setAdvertiserNameAr(advertisement.advertiser_name?.ar || '');
      setImageUrl(advertisement.image_url || '');
      setTargetUrl(advertisement.target_url || '');
      setStartDate(toLocalISOString(new Date(advertisement.start_date)));
      setEndDate(toLocalISOString(new Date(advertisement.end_date)));
      setIsEnabled(advertisement.is_enabled);
    } else {
      // Set default dates for new ad
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setStartDate(toLocalISOString(now));
      setEndDate(toLocalISOString(oneWeekFromNow));
    }
  }, [advertisement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    // 1. Trim whitespace and remove any leading slashes.
    let cleanedImageUrl = imageUrl.trim().replace(/^\/*/, '');
    let cleanedTargetUrl = targetUrl.trim().replace(/^\/*/, '');
    
    // 2. Prepend 'https://' if no protocol is present.
    if (cleanedImageUrl && !/^https?:\/\//i.test(cleanedImageUrl)) {
        cleanedImageUrl = 'https://' + cleanedImageUrl;
    }
    if (cleanedTargetUrl && !/^https?:\/\//i.test(cleanedTargetUrl)) {
        cleanedTargetUrl = 'https://' + cleanedTargetUrl;
    }

    const adData = {
        title: { en: titleEn, ar: titleAr },
        advertiser_name: { en: advertiserNameEn, ar: advertiserNameAr },
        image_url: cleanedImageUrl,
        target_url: cleanedTargetUrl,
        placement: 'landing_sidebar' as const,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_enabled: isEnabled
    };

    try {
      await onSave(adData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isNew = !advertisement;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isNew ? t('add_advertisement') : t('edit_advertisement')}
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

            {/* Advertiser Names - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="advertiser_name_en" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('advertiser_name_en')}
                </label>
                <input 
                  type="text" 
                  id="advertiser_name_en" 
                  value={advertiserNameEn} 
                  onChange={e => setAdvertiserNameEn(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
              <div>
                <label htmlFor="advertiser_name_ar" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('advertiser_name_ar')}
                </label>
                <input 
                  type="text" 
                  id="advertiser_name_ar" 
                  value={advertiserNameAr} 
                  onChange={e => setAdvertiserNameAr(e.target.value)} 
                  dir="rtl"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
            </div>

            {/* URLs - Side by Side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="image_url" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('image_url')}
                </label>
                <input 
                  type="url" 
                  id="image_url" 
                  value={imageUrl} 
                  onChange={e => setImageUrl(e.target.value)} 
                  required 
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
              <div>
                <label htmlFor="target_url" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('target_url')}
                </label>
                <input 
                  type="url" 
                  id="target_url" 
                  value={targetUrl} 
                  onChange={e => setTargetUrl(e.target.value)} 
                  required 
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>

            {/* Dates and Toggle - Side by Side */}
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

            {/* Toggle - Compact */}
            <div className="flex items-center justify-between py-1">
              <label htmlFor="is_enabled" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('is_enabled')}
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                />
                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {/* Note - Compact */}
            <div className="pt-1">
              <p className="text-[10px] italic text-center text-gray-500 dark:text-gray-400">
                {t('ad_placement_note')}
              </p>
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

export default AdvertisementEditModal;
