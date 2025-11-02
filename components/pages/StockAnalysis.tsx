import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { DailyChecklistItem, PageState } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon, ChartPieIcon, CalendarDaysIcon, StarIcon } from '../icons';

// --- Caching Configuration ---
const CACHE_KEY = 'stockAnalysisData-v2';
const CACHE_TIMESTAMP_KEY = 'stockAnalysisTimestamp-v2';
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// --- Helper Functions & Formatting ---
const formatNumber = (num: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options }).format(num);
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-CA'); } catch { return 'Invalid Date'; }
};

const PaginationControls: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = memo(({ currentPage, totalPages, onPageChange }) => {
    const { t } = useLanguage();
    return (
        <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('page_x_of_y').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))}
            </span>
            <div className="flex gap-2">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                    {t('previous')}
                </button>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                         className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                    {t('next')}
                </button>
            </div>
        </div>
    );
});

const SimpleStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; iconBgClass: string }> = memo(({ title, value, icon, iconBgClass }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start justify-between h-full">
        <div>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-5xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full text-white ${iconBgClass}`}>
            {icon}
        </div>
    </div>
));

const HitRateStatCard: React.FC<{ title: string; value: number; }> = memo(({ title, value }) => {
  const radius = 52;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = !isNaN(value) ? circumference - (value / 100) * circumference : circumference;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-full">
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-gray-200 dark:text-gray-700"
                    stroke="currentColor" strokeWidth={stroke} fill="transparent"
                    r={normalizedRadius} cx="60" cy="60"
                />
                <circle
                    className="text-green-500 transition-all duration-1000 ease-in-out"
                    stroke="currentColor" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset: offset }} strokeLinecap="round" fill="transparent"
                    r={normalizedRadius} cx="60" cy="60" transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {!isNaN(value) ? `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : 'N/A'}
                </span>
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300">
                <ChartPieIcon className="w-5 h-5"/>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-500">{title}</p>
        </div>
    </div>
  );
});

interface StockAnalysisProps {
  setPage: (page: PageState) => void;
}

// --- Main Page Component ---
const StockAnalysis: React.FC<StockAnalysisProps> = ({ setPage }) => {
    const { t, language } = useLanguage();
    const { settings } = useAppSettings();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [checklistData, setChecklistData] = useState<DailyChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [resultFilter, setResultFilter] = useState<'all' | 'hits' | 'misses'>('all');
    const [showFavorites, setShowFavorites] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            setError(null);
            try {
                const cachedDataString = localStorage.getItem(CACHE_KEY);
                const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

                if (cachedDataString && cachedTimestamp) {
                    const data = JSON.parse(cachedDataString);
                    setChecklistData(data);
                    setLoading(false); 

                    const isCacheStale = Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION_MS;
                    if (!isCacheStale) {
                        return; 
                    }
                } else {
                    setLoading(true);
                }

                const { data: rpcData, error: rpcError } = await supabase.rpc('get_daily_checklist');
                if (rpcError) throw rpcError;
                
                const freshData = rpcData as DailyChecklistItem[];
                setChecklistData(freshData);

                localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

            } catch(e: any) {
                setError(e.message);
            } finally {
                if (loading) setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const summaryStats = useMemo(() => {
        const total = checklistData.length;
        if (total === 0) {
            return { total: 0, hits: 0, misses: 0, hitRate: 0 };
        }
        const hits = checklistData.filter(item => item.is_hit).length;
        const misses = total - hits;
        const hitRate = (hits / total);
        return { total, hits, misses, hitRate };
    }, [checklistData]);
    
    const forecastDate = useMemo(() => {
        if (checklistData.length > 0) {
            return formatDate(checklistData[0].forecast_date);
        }
        return null;
    }, [checklistData]);

    const processedData = useMemo(() => {
        return checklistData.filter(item => {
            const matchesSearch = searchTerm === '' || 
                                  item.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.stock_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = resultFilter === 'all' || 
                                  (resultFilter === 'hits' && item.is_hit) || 
                                  (resultFilter === 'misses' && !item.is_hit);
            const matchesFavorites = !showFavorites || isFavorite(item.stock_symbol);
            return matchesSearch && matchesFilter && matchesFavorites;
        });
    }, [checklistData, searchTerm, resultFilter, showFavorites, isFavorite]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, resultFilter, showFavorites]);
    
    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage, itemsPerPage]);

    if (loading) return (
        <div className="flex justify-center items-center h-full p-8"><SpinnerIcon className="w-10 h-10" /></div>
    );
    if (error) return (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg shadow-md">
            <p><strong>{t('error_fetching_data')}:</strong> {error}</p>
        </div>
    );

    const description_key_en = 'stock_analysis_page_description_en';
    const description_key_ar = 'stock_analysis_page_description_ar';
    const description = language === 'ar' ? settings[description_key_ar] : settings[description_key_en];

    return (
        <div>
            {/* Disclaimer Banner - Conditionally Rendered */}
            {settings.show_educational_disclaimer !== 'false' && (
                <div className="p-4 mb-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3 rtl:mr-3">
                            <p className="text-sm text-green-700 dark:text-green-200">
                                <span className="font-medium">{language === 'ar' ? 'تنبيه' : t('disclaimer_title')}:</span> {language === 'ar' ? 'المعلومات لأغراض تعليمية وليست نصيحة استثمارية.' : t('disclaimer_educational')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'آخر يوم' : t('stock_analysis_title_last_day')}</h1>
                {description && <p className="mt-2 text-md text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">{description}</p>}
            </div>

            <div className="flex items-center justify-center gap-3 mb-8 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm max-w-md mx-auto">
                <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{language === 'ar' ? 'فحص التوقعات ليوم:' : t('check_forecasts_for_date')}</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">{forecastDate || t('n_a')}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                 <SimpleStatCard 
                    title={language === 'ar' ? 'توقعات خاطئة' : t('incorrect_forecasts')} 
                    value={String(summaryStats.misses)} 
                    icon={<XCircleIcon className="w-8 h-8"/>}
                    iconBgClass="bg-red-500" 
                />
                <SimpleStatCard 
                    title={language === 'ar' ? 'توقعات صحيحة' : t('correct_forecasts')} 
                    value={String(summaryStats.hits)} 
                    icon={<CheckCircleIcon className="w-8 h-8"/>}
                    iconBgClass="bg-green-500" 
                />
                <SimpleStatCard 
                    title={language === 'ar' ? 'إجمالي التوقعات' : t('total_forecasts')} 
                    value={String(summaryStats.total)} 
                    icon={<BuildingOfficeIcon className="w-8 h-8"/>}
                    iconBgClass="bg-blue-500" 
                />
                <HitRateStatCard 
                    title={language === 'ar' ? 'نسبة النجاح' : t('success_rate')} 
                    value={summaryStats.hitRate * 100} 
                />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <input 
                    type="text"
                    placeholder={t('search_by_symbol_or_name')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="flex-shrink-0 flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
                    <button onClick={() => setResultFilter('all')} className={`px-3 py-1 text-sm font-medium rounded-md ${resultFilter === 'all' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('all')}</button>
                    <button onClick={() => setResultFilter('hits')} className={`px-3 py-1 text-sm font-medium rounded-md ${resultFilter === 'hits' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('hits')}</button>
                    <button onClick={() => setResultFilter('misses')} className={`px-3 py-1 text-sm font-medium rounded-md ${resultFilter === 'misses' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('misses')}</button>
                </div>
                <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`flex items-center justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                        showFavorites ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                >
                    <StarIcon className={`w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2 ${showFavorites ? 'fill-current' : ''}`} />
                    {t('favorites_filter')}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('stock')}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('price')}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('predicted_range')}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('actual_range')}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('result')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map(item => {
                            const favorited = isFavorite(item.stock_symbol);
                            return (
                                <tr key={item.stock_symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <button onClick={() => toggleFavorite(item.stock_symbol)} className={`p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors ${favorited ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                                <StarIcon className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                                            </button>
                                            <div className="ml-2">
                                                <button onClick={() => setPage({ page: 'stock_details', symbol: item.stock_symbol })} className="text-base font-bold text-blue-600 dark:text-blue-400 hover:underline">{item.stock_symbol}</button>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-40">{item.stock_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-center text-lg">{formatNumber(item.price)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-center text-lg">
                                        <span className="text-red-500">{formatNumber(item.predicted_lo)}</span>
                                        <span className="mx-1 text-gray-400">-</span>
                                        <span className="text-green-500">{formatNumber(item.predicted_hi)}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-center text-lg">
                                        <span className="text-red-500">{formatNumber(item.actual_low)}</span>
                                        <span className="mx-1 text-gray-400">-</span>
                                        <span className="text-green-500">{formatNumber(item.actual_high)}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        {item.is_hit ?
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                <CheckCircleIcon className="w-5 h-5" /> {t('hit')}
                                            </span>
                                        :
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                                                <XCircleIcon className="w-5 h-5" /> {t('miss')}
                                            </span>
                                        }
                                    </td>
                                </tr>
                            )
                        })}
                        {paginatedData.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_results_found')}</td></tr>
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                )}
            </div>
        </div>
    );
};

export default StockAnalysis;
