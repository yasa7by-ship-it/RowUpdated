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

// Enhanced stat card with visual indicator
const SimpleStatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    iconBgClass: string;
    total?: number; // For calculating percentage for visual indicator
}> = memo(({ title, value, icon, iconBgClass, total }) => {
    const numValue = parseInt(value) || 0;
    const percentage = total && total > 0 ? (numValue / total) * 100 : 0;
    
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
                <div className={`p-2 rounded-lg ${iconBgClass} text-white`}>
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{value}</p>
            {/* Visual indicator bar */}
            {total && total > 0 && (
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${iconBgClass} transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                </div>
            )}
        </div>
    );
});

// Compact success rate card - smaller and standalone
const HitRateStatCard: React.FC<{ title: string; value: number; }> = memo(({ title, value }) => {
  const radius = 55;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = !isNaN(value) ? circumference - (value / 100) * circumference : circumference;
  const displayValue = !isNaN(value) ? formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : 'N/A';
  
  // Success rate color logic
  const getColor = () => {
    if (value >= 90) return { text: 'text-nextrow-success', bg: 'bg-nextrow-success', stroke: '#00b06f' };
    if (value >= 70) return { text: 'text-yellow-500', bg: 'bg-yellow-500', stroke: '#f59e0b' };
    return { text: 'text-orange-500', bg: 'bg-orange-500', stroke: '#f97316' };
  };
  
  const colors = getColor();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
            <ChartPieIcon className={`w-4 h-4 ${colors.text}`}/>
        </div>
        
        {/* Smaller circular indicator */}
        <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <defs>
                        <linearGradient id={`successGrad-${Math.round(value)}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3"/>
                            <stop offset="100%" stopColor={colors.stroke}/>
                        </linearGradient>
                    </defs>
                    {/* Background */}
                    <circle
                        cx="60" cy="60"
                        r={normalizedRadius}
                        stroke="#e5e7eb"
                        strokeWidth={stroke}
                        fill="transparent"
                        className="dark:stroke-gray-600"
                    />
                    {/* Progress */}
                    <circle
                        cx="60" cy="60"
                        r={normalizedRadius}
                        stroke={colors.stroke}
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                {/* Center value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${colors.text}`}>
                        {displayValue}
                    </span>
                    <span className={`text-sm font-semibold ${colors.text} -mt-0.5`}>%</span>
                </div>
            </div>
            
            {/* Side info - compact */}
            <div className="flex-1">
                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
                        <p className={`text-xs font-semibold ${colors.text}`}>
                            {value >= 90 ? 'Excellent' : value >= 70 ? 'Good' : 'Fair'}
                        </p>
                    </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                </div>
            </div>
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
        <div className="p-4 bg-nextrow-danger/20 dark:bg-nextrow-danger/30 text-nextrow-danger dark:text-nextrow-danger/90 rounded-lg shadow-md">
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
                <div className="p-4 mb-8 bg-nextrow-success/10 dark:bg-nextrow-success/20 border-l-4 border-nextrow-success rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-5 w-5 text-nextrow-success" />
                        </div>
                        <div className="ml-3 rtl:mr-3">
                            <p className="text-sm text-nextrow-success dark:text-nextrow-success/90">
                                <span className="font-medium">{language === 'ar' ? 'تنبيه' : t('disclaimer_title')}:</span> {language === 'ar' ? 'المعلومات لأغراض تعليمية وليست نصيحة استثمارية.' : t('disclaimer_educational')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section - Clean & Professional */}
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {language === 'ar' ? 'آخر يوم' : t('stock_analysis_title_last_day')}
                        </h1>
                        {description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <CalendarDaysIcon className="w-5 h-5 text-nextrow-primary" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'ar' ? 'تاريخ:' : 'Date:'}
                        </span>
                        <span className="text-sm font-semibold text-nextrow-primary font-mono">
                            {forecastDate || t('n_a')}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Statistics Section - نسبة النجاح لوحدها، ثم الثلاث بطاقات */}
            <div className="mb-8 space-y-6">
                {/* نسبة النجاح - لوحدها */}
                <div className="max-w-xs">
                    <HitRateStatCard 
                        title={language === 'ar' ? 'نسبة النجاح' : t('success_rate')} 
                        value={summaryStats.hitRate * 100} 
                    />
                </div>
                
                {/* البطاقات الثلاث - مرتبة حسب الطلب */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SimpleStatCard 
                        title={language === 'ar' ? 'إجمالي التوقعات' : t('total_forecasts')} 
                        value={String(summaryStats.total)} 
                        icon={<BuildingOfficeIcon className="w-4 h-4"/>}
                        iconBgClass="bg-nextrow-primary"
                        total={summaryStats.total}
                    />
                    <SimpleStatCard 
                        title={language === 'ar' ? 'توقعات صحيحة' : t('correct_forecasts')} 
                        value={String(summaryStats.hits)} 
                        icon={<CheckCircleIcon className="w-4 h-4"/>}
                        iconBgClass="bg-nextrow-success"
                        total={summaryStats.total}
                    />
                    <SimpleStatCard 
                        title={language === 'ar' ? 'توقعات خاطئة' : t('incorrect_forecasts')} 
                        value={String(summaryStats.misses)} 
                        icon={<XCircleIcon className="w-4 h-4"/>}
                        iconBgClass="bg-nextrow-danger"
                        total={summaryStats.total}
                    />
                </div>
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

            {/* Data Table - Clean Bloomberg/TradingView Style */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                                    {t('stock')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    {t('price')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    {t('predicted_range')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    {t('actual_range')}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    {t('result')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map((item, index) => {
                                const favorited = isFavorite(item.stock_symbol);
                                return (
                                    <tr 
                                        key={item.stock_symbol} 
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.stock_symbol); }} 
                                                    className={`p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors ${favorited ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                                                >
                                                    <StarIcon className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                                                </button>
                                                <button 
                                                    onClick={() => setPage({ page: 'stock_details', symbol: item.stock_symbol })} 
                                                    className="text-sm font-bold text-nextrow-primary hover:text-nextrow-dark hover:underline"
                                                >
                                                    {item.stock_symbol}
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                                                {item.stock_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                                                {formatNumber(item.price)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm font-mono">
                                                <span className="text-nextrow-danger">{formatNumber(item.predicted_lo)}</span>
                                                <span className="mx-1 text-gray-400">-</span>
                                                <span className="text-nextrow-success">{formatNumber(item.predicted_hi)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="text-sm font-mono">
                                                <span className="text-nextrow-danger">{formatNumber(item.actual_low)}</span>
                                                <span className="mx-1 text-gray-400">-</span>
                                                <span className="text-nextrow-success">{formatNumber(item.actual_high)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {item.is_hit ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-nextrow-success/10 text-nextrow-success border border-nextrow-success/20">
                                                    <CheckCircleIcon className="w-3.5 h-3.5" /> 
                                                    {t('hit')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-nextrow-danger/10 text-nextrow-danger border border-nextrow-danger/20">
                                                    <XCircleIcon className="w-3.5 h-3.5" /> 
                                                    {t('miss')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {t('no_results_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                )}
            </div>
        </div>
    );
};

export default StockAnalysis;
