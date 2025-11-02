import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { UsersIcon, ShieldCheckIcon, Cog6ToothIcon, PlayIcon, SpinnerIcon } from '../icons';
import ProcessResultModal from './ProcessResultModal';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4 rtl:mr-0 rtl:ml-4">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const SiteSettings: React.FC = () => {
    const { t, refetchTranslations } = useLanguage();
    const { settings, updateSetting, refetchSettings } = useAppSettings();
    const { hasPermission } = useAuth();
    
    // Site settings state
    const [siteTitleEn, setSiteTitleEn] = useState('');
    const [siteTitleAr, setSiteTitleAr] = useState('');
    const [siteLogo, setSiteLogo] = useState('');
    
    // Landing page content state
    const [articleTitleEn, setArticleTitleEn] = useState('');
    const [articleTitleAr, setArticleTitleAr] = useState('');
    const [articleBodyEn, setArticleBodyEn] = useState('');
    const [articleBodyAr, setArticleBodyAr] = useState('');
    const [articleTab, setArticleTab] = useState<'en' | 'ar'>('en');

    // NEW state for stock analysis page
    const [stockAnalysisDescEn, setStockAnalysisDescEn] = useState('');
    const [stockAnalysisDescAr, setStockAnalysisDescAr] = useState('');
    const [showDisclaimer, setShowDisclaimer] = useState(true);
    
    // NEW state for watchlist disclaimer (تم توليد التوقع)
    const [showWatchlistDisclaimer, setShowWatchlistDisclaimer] = useState(true);
    const [watchlistDisclaimerColor, setWatchlistDisclaimerColor] = useState('text-gray-500');
    const [watchlistDisclaimerSize, setWatchlistDisclaimerSize] = useState('text-sm');
    const [watchlistDisclaimerCustomColor, setWatchlistDisclaimerCustomColor] = useState('');
    const [watchlistDisclaimerCustomSize, setWatchlistDisclaimerCustomSize] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Effect for fetching data that does not depend on settings, runs only on mount.
    useEffect(() => {
        const controller = new AbortController();
        const fetchTitles = async () => {
            try {
                 const { data, error } = await supabase.rpc('get_translations_for_key', { p_key: 'site_title' }).abortSignal(controller.signal);
                if (error) throw error;
                if (data) {
                    setSiteTitleEn(data.find(d => d.lang_id === 'en')?.value || '');
                    setSiteTitleAr(data.find(d => d.lang_id === 'ar')?.value || '');
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    // Log the error for debugging, but don't show it to the user.
                    console.error('Error fetching site titles:', error.message || error);
                }
            }
        };
        fetchTitles();

        return () => {
            controller.abort();
        };
    }, []); // Empty dependency array ensures this runs only once.

    // Effect for setting state from the settings context.
    useEffect(() => {
        setSiteLogo(settings.site_logo || '');
        
        let titleEn = '', titleAr = '', bodyEn = '', bodyAr = '';

        if (settings.landing_article_title) {
            try {
                const titleContent = JSON.parse(settings.landing_article_title);
                titleEn = titleContent.en || '';
                titleAr = titleContent.ar || '';
            } catch (e) { 
                console.error("Could not parse landing page title JSON", e); 
                titleEn = settings.landing_article_title_en || '';
                titleAr = settings.landing_article_title_ar || '';
            }
        } else {
            titleEn = settings.landing_article_title_en || '';
            titleAr = settings.landing_article_title_ar || '';
        }

        if (settings.landing_article_body) {
            try {
                const bodyContent = JSON.parse(settings.landing_article_body);
                bodyEn = bodyContent.en || '';
                bodyAr = bodyContent.ar || '';
            } catch (e) { 
                console.error("Could not parse landing page body JSON", e); 
                bodyEn = settings.landing_article_body_en || '';
                bodyAr = settings.landing_article_body_ar || '';
            }
        } else {
            bodyEn = settings.landing_article_body_en || '';
            bodyAr = settings.landing_article_body_ar || '';
        }

        setArticleTitleEn(titleEn);
        setArticleTitleAr(titleAr);
        setArticleBodyEn(bodyEn);
        setArticleBodyAr(bodyAr);
        
        setStockAnalysisDescEn(settings.stock_analysis_page_description_en || '');
        setStockAnalysisDescAr(settings.stock_analysis_page_description_ar || '');
        setShowDisclaimer(settings.show_educational_disclaimer !== 'false');
        
        // Watchlist disclaimer settings
        setShowWatchlistDisclaimer(settings.show_watchlist_disclaimer !== 'false');
        setWatchlistDisclaimerColor(settings.watchlist_disclaimer_color || 'text-gray-500');
        setWatchlistDisclaimerSize(settings.watchlist_disclaimer_size || 'text-sm');
        setWatchlistDisclaimerCustomColor(settings.watchlist_disclaimer_custom_color || '');
        setWatchlistDisclaimerCustomSize(settings.watchlist_disclaimer_custom_size || '');
    }, [settings]);


    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            await Promise.all([
                supabase.from('translations').upsert({ lang_id: 'en', key: 'site_title', value: siteTitleEn }, { onConflict: 'lang_id,key' }),
                supabase.from('translations').upsert({ lang_id: 'ar', key: 'site_title', value: siteTitleAr }, { onConflict: 'lang_id,key' }),
                updateSetting('site_logo', siteLogo),
                updateSetting('landing_article_title', JSON.stringify({ en: articleTitleEn, ar: articleTitleAr })),
                updateSetting('landing_article_body', JSON.stringify({ en: articleBodyEn, ar: articleBodyAr })),
                updateSetting('stock_analysis_page_description_en', stockAnalysisDescEn),
                updateSetting('stock_analysis_page_description_ar', stockAnalysisDescAr),
                updateSetting('show_educational_disclaimer', String(showDisclaimer)),
                // Watchlist disclaimer settings
                updateSetting('show_watchlist_disclaimer', String(showWatchlistDisclaimer)),
                updateSetting('watchlist_disclaimer_color', watchlistDisclaimerColor),
                updateSetting('watchlist_disclaimer_size', watchlistDisclaimerSize),
                updateSetting('watchlist_disclaimer_custom_color', watchlistDisclaimerCustomColor),
                updateSetting('watchlist_disclaimer_custom_size', watchlistDisclaimerCustomSize),
            ]);
            setSaveStatus('success');
            refetchTranslations();
            refetchSettings();
        } catch (error) {
            setSaveStatus('error');
            console.error("Failed to save settings", error);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };
    
    if (!hasPermission('manage:settings')) return null;

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('site_settings')}</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <fieldset>
                  <legend className="text-lg font-medium text-gray-900 dark:text-white">{t('general_settings')}</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                          <label htmlFor="site_title_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('site_title_en')}</label>
                          <input type="text" id="site_title_en" value={siteTitleEn} onChange={(e) => setSiteTitleEn(e.target.value)}
                                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                       <div>
                          <label htmlFor="site_title_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('site_title_ar')}</label>
                          <input type="text" id="site_title_ar" dir="rtl" value={siteTitleAr} onChange={(e) => setSiteTitleAr(e.target.value)}
                                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                          <label htmlFor="site_logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('site_logo')}</label>
                          <textarea id="site_logo" rows={4} value={siteLogo} onChange={(e) => setSiteLogo(e.target.value)}
                                    className="mt-1 block w-full font-mono text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder='<svg>...</svg>' />
                      </div>
                  </div>
                </fieldset>

                <hr className="my-8 border-gray-200 dark:border-gray-700" />
                
                <fieldset>
                    <legend className="text-lg font-medium text-gray-900 dark:text-white">{t('landing_page_content')}</legend>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
                        <nav className="-mb-px flex space-x-4 rtl:space-x-reverse" aria-label="Tabs">
                            <button
                                type="button"
                                onClick={() => setArticleTab('en')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                    articleTab === 'en'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                }`}
                                aria-current={articleTab === 'en' ? 'page' : undefined}
                            >
                                {t('lang_english')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setArticleTab('ar')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                                    articleTab === 'ar'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                }`}
                                aria-current={articleTab === 'ar' ? 'page' : undefined}
                            >
                                {t('lang_arabic')}
                            </button>
                        </nav>
                    </div>

                    <div className="mt-6">
                        {articleTab === 'en' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label htmlFor="article_title_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('article_title_en')}</label>
                                    <input type="text" id="article_title_en" value={articleTitleEn} onChange={(e) => setArticleTitleEn(e.target.value)}
                                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label htmlFor="article_body_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('article_body_en')}</label>
                                    <textarea id="article_body_en" rows={5} value={articleBodyEn} onChange={(e) => setArticleBodyEn(e.target.value)}
                                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                            </div>
                        )}
                        {articleTab === 'ar' && (
                             <div className="space-y-6 animate-fade-in">
                                <div>
                                   <label htmlFor="article_title_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('article_title_ar')}</label>
                                   <input type="text" id="article_title_ar" dir="rtl" value={articleTitleAr} onChange={(e) => setArticleTitleAr(e.target.value)}
                                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                   <label htmlFor="article_body_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('article_body_ar')}</label>
                                   <textarea id="article_body_ar" rows={5} dir="rtl" value={articleBodyAr} onChange={(e) => setArticleBodyAr(e.target.value)}
                                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                </fieldset>

                <hr className="my-8 border-gray-200 dark:border-gray-700" />
                <fieldset>
                    <legend className="text-lg font-medium text-gray-900 dark:text-white">{t('stock_analysis_page_settings')}</legend>
                    <div className="space-y-6 mt-4">
                        <div>
                            <label htmlFor="stock_analysis_desc_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('stock_analysis_page_desc_en')}</label>
                            <textarea id="stock_analysis_desc_en" rows={3} value={stockAnalysisDescEn} onChange={(e) => setStockAnalysisDescEn(e.target.value)}
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="stock_analysis_desc_ar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('stock_analysis_page_desc_ar')}</label>
                            <textarea id="stock_analysis_desc_ar" rows={3} dir="rtl" value={stockAnalysisDescAr} onChange={(e) => setStockAnalysisDescAr(e.target.value)}
                                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('show_educational_disclaimer_label')}</label>
                            <div className="mt-2 flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={showDisclaimer} onChange={(e) => setShowDisclaimer(e.target.checked)} />
                                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                             <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('show_educational_disclaimer_desc')}</p>
                        </div>
                    </div>
                </fieldset>

                <hr className="my-8 border-gray-200 dark:border-gray-700" />
                <fieldset>
                    <legend className="text-lg font-medium text-gray-900 dark:text-white">إعدادات نص التنبيه في صفحة الاتجاه القادم</legend>
                    <div className="space-y-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">إظهار/إخفاء النص</label>
                            <div className="mt-2 flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={showWatchlistDisclaimer} onChange={(e) => setShowWatchlistDisclaimer(e.target.checked)} />
                                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{showWatchlistDisclaimer ? 'النص ظاهر' : 'النص مخفي'}</span>
                            </div>
                        </div>
                        
                        {showWatchlistDisclaimer && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="watchlist_disclaimer_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اللون (من القائمة)</label>
                                        <select id="watchlist_disclaimer_color" value={watchlistDisclaimerColor} onChange={(e) => setWatchlistDisclaimerColor(e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="text-gray-500 dark:text-gray-400">رمادي (افتراضي)</option>
                                            <option value="text-blue-500 dark:text-blue-400">أزرق</option>
                                            <option value="text-green-500 dark:text-green-400">أخضر</option>
                                            <option value="text-red-500 dark:text-red-400">أحمر</option>
                                            <option value="text-yellow-500 dark:text-yellow-400">أصفر</option>
                                            <option value="text-purple-500 dark:text-purple-400">بنفسجي</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="watchlist_disclaimer_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الحجم (من القائمة)</label>
                                        <select id="watchlist_disclaimer_size" value={watchlistDisclaimerSize} onChange={(e) => setWatchlistDisclaimerSize(e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                            <option value="text-xs">صغير جداً (xs)</option>
                                            <option value="text-sm">صغير (sm) - افتراضي</option>
                                            <option value="text-base">متوسط (base)</option>
                                            <option value="text-lg">كبير (lg)</option>
                                            <option value="text-xl">كبير جداً (xl)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="watchlist_disclaimer_custom_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">لون مخصص (CSS)</label>
                                        <input type="text" id="watchlist_disclaimer_custom_color" value={watchlistDisclaimerCustomColor} onChange={(e) => setWatchlistDisclaimerCustomColor(e.target.value)}
                                               placeholder="مثال: #FF5733 أو rgb(255, 87, 51)" 
                                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">اتركه فارغاً لاستخدام اللون الافتراضي</p>
                                    </div>
                                    <div>
                                        <label htmlFor="watchlist_disclaimer_custom_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">حجم مخصص (بالبكسل)</label>
                                        <input type="number" id="watchlist_disclaimer_custom_size" value={watchlistDisclaimerCustomSize} onChange={(e) => setWatchlistDisclaimerCustomSize(e.target.value)}
                                               placeholder="مثال: 14" min="8" max="48"
                                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">اتركه فارغاً لاستخدام الحجم الافتراضي</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </fieldset>

                <div className="mt-8 flex items-center justify-end space-x-4 rtl:space-x-reverse">
                    {saveStatus === 'success' && <p className="text-sm text-green-600 dark:text-green-400">{t('save_success')}</p>}
                    {saveStatus === 'error' && <p className="text-sm text-red-600 dark:text-red-400">{t('save_error')}</p>}
                    <button onClick={handleSave} disabled={isSaving} 
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isSaving ? t('saving') : t('save')}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

const ManualTriggers: React.FC = () => {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; isLoading: boolean; result: string | number | null; error: string | null; }>({ title: '', isLoading: false, result: null, error: null });

    const handleEvaluateForecasts = async () => {
        setModalContent({ title: t('run_forecast_evaluation'), isLoading: true, result: null, error: null });
        setIsModalOpen(true);
        const { error } = await supabase.rpc('evaluate_and_save_forecasts');
        if (error) {
            setModalContent(prev => ({ ...prev, isLoading: false, error: error.message }));
        } else {
            setModalContent(prev => ({ ...prev, isLoading: false, result: 'PROCESS_STARTED' }));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setModalContent({ title: '', isLoading: false, result: null, error: null }), 300);
    };
    
    if (!hasPermission('manage:settings')) return null;

    return (
        <>
            <ProcessResultModal 
                isOpen={isModalOpen}
                onClose={closeModal}
                {...modalContent}
            />
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Cog6ToothIcon className="w-6 h-6" />
                    {t('manual_system_triggers')}
                </h2>
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('run_forecast_evaluation')}</h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('run_forecast_evaluation_desc')}</p>
                        </div>
                         <button onClick={handleEvaluateForecasts} disabled={modalContent.isLoading} className="mt-4 w-full sm:w-auto self-end flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            <PlayIcon className="w-5 h-5 mr-2 rtl:ml-2" />
                            {t('run_now')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};


// --- Caching Configuration ---
const CACHE_KEY = 'dashboardStats-v1';
const CACHE_TIMESTAMP_KEY = 'dashboardStatsTimestamp-v1';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes (stats don't change frequently)

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [userCount, setUserCount] = useState(0);
  const [roleCount, setRoleCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        // Check cache first
        const cachedDataString = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        if (cachedDataString && cachedTimestamp) {
          const cachedData = JSON.parse(cachedDataString);
          setUserCount(cachedData.user_count || 0);
          setRoleCount(cachedData.role_count || 0);

          const isCacheStale = Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION_MS;
          if (!isCacheStale) {
            return; // Use cache
          }
        }

        // Fetch fresh data
        const { data, error } = await supabase.rpc('get_dashboard_stats').abortSignal(controller.signal).single();
        if (error) throw error;
        if (data) {
          const stats = {
            user_count: (data as any).user_count || 0,
            role_count: (data as any).role_count || 0
          };
          setUserCount(stats.user_count);
          setRoleCount(stats.role_count);

          // Update cache
          localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching dashboard stats:", error);
        }
      }
    };
    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t('welcome_message')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title={t('total_users')} value={userCount} icon={<UsersIcon />} />
        <StatCard title={t('total_roles')} value={roleCount} icon={<ShieldCheckIcon />} />
      </div>
      
      <SiteSettings />
      <ManualTriggers />
    </div>
  );
};

export default Dashboard;
