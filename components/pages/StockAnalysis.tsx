import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { DailyChecklistItem, PageState } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon, ChartPieIcon, CalendarDaysIcon, StarIcon } from '../icons';

// --- Caching Configuration ---
const CACHE_KEY = 'stockAnalysisData-v3'; // Updated to force cache refresh
const CACHE_TIMESTAMP_KEY = 'stockAnalysisTimestamp-v3'; // Updated to force cache refresh
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

// Price & Date Display Component (same as DailyWatchlist, but more compact)
const PriceDateDisplay: React.FC<{ price: number | null; date: string | null }> = memo(({ price, date }) => {
    if (price === null) return <span className="text-gray-400 text-xs">N/A</span>;
    
    const formattedDate = date ? formatDate(date) : 'N/A';
    
    return (
        <div className="space-y-0.5 text-center">
            <div className="text-xs font-bold text-gray-900 dark:text-white">
                ${formatNumber(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {formattedDate}
            </div>
        </div>
    );
});
PriceDateDisplay.displayName = 'PriceDateDisplay';

// Actual Range Display Component (same as DailyWatchlist)
const ActualRangeDisplay: React.FC<{ low: number | null; high: number | null }> = memo(({ low, high }) => {
    if ((low === null || low === undefined) && (high === null || high === undefined)) {
        return <span className="text-gray-400 text-sm font-medium">N/A - N/A</span>;
    }
    
    if (low === null || low === undefined) {
        return (
            <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-400">N/A</span>
                <span className="text-xs text-gray-400">-</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatNumber(high!, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        );
    }
    
    if (high === null || high === undefined) {
        return (
            <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatNumber(low, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-xs text-gray-400">-</span>
                <span className="text-sm font-medium text-gray-400">N/A</span>
            </div>
        );
    }
    
    const actualLow = Math.min(low, high);
    const actualHigh = Math.max(low, high);
    
    return (
        <div className="flex items-center justify-center gap-1">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {formatNumber(actualLow, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">-</span>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {formatNumber(actualHigh, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
});
ActualRangeDisplay.displayName = 'ActualRangeDisplay';

// Expected Range Display Component (same as DailyWatchlist)
const ExpectedRangeDisplay: React.FC<{ low: number | null; high: number | null }> = memo(({ low, high }) => {
    if (low === null || high === null) return <span className="text-gray-400 text-sm font-medium">N/A</span>;
    
    const expectedLow = Math.min(low, high);
    const expectedHigh = Math.max(low, high);
    
    return (
        <div className="flex items-center justify-center gap-1">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {formatNumber(expectedLow, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">-</span>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {formatNumber(expectedHigh, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
});
ExpectedRangeDisplay.displayName = 'ExpectedRangeDisplay';

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

// Enhanced 3D Visual Card with animated counter
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(value * easeOutQuart));
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <>{displayValue}</>;
};

// Enhanced stat card with 3D effect and visual indicator
const SimpleStatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    iconBgClass: string;
    total?: number;
    gradient?: string;
}> = memo(({ title, value, icon, iconBgClass, total, gradient }) => {
    const numValue = parseInt(value) || 0;
    const percentage = total && total > 0 ? (numValue / total) * 100 : 0;
    
    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Gradient overlay */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${gradient || iconBgClass} opacity-10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-20 transition-opacity duration-300`}></div>
            
            {/* Icon with glow effect */}
            <div className="relative mb-4">
                <div className={`absolute inset-0 ${iconBgClass} opacity-20 blur-xl rounded-2xl group-hover:opacity-30 transition-opacity`}></div>
                <div className={`relative p-4 rounded-2xl ${iconBgClass} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
            
            {/* Title */}
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
                {title}
            </p>
            
            {/* Animated value */}
            <p className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                <AnimatedCounter value={numValue} />
            </p>
            
            {/* Animated progress ring */}
            {total && total > 0 && (
                <div className="relative w-full">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">من إجمالي</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{total}</span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`absolute top-0 left-0 h-full ${iconBgClass} transition-all duration-1000 ease-out rounded-full shadow-lg`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30"></div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                        {formatNumber(percentage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                    </p>
                </div>
            )}
        </div>
    );
});

// Enhanced success rate card with 3D circular progress
const HitRateStatCard: React.FC<{ title: string; value: number; }> = memo(({ title, value }) => {
  const radius = 70;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const [animatedValue, setAnimatedValue] = useState(0);
  const offset = !isNaN(animatedValue) ? circumference - (animatedValue / 100) * circumference : circumference;
  const displayValue = !isNaN(animatedValue) ? formatNumber(animatedValue, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0';
  
  // Animate value on mount
  useEffect(() => {
    const duration = 2000;
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(value * easeOutCubic);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setAnimatedValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);
  
  // Success rate color logic
  const getColor = () => {
    if (value >= 90) return { 
      text: 'text-nextrow-success', 
      bg: 'bg-nextrow-success', 
      stroke: '#00b06f',
      gradient: 'from-green-400 to-green-600'
    };
    if (value >= 70) return { 
      text: 'text-yellow-500', 
      bg: 'bg-yellow-500', 
      stroke: '#f59e0b',
      gradient: 'from-yellow-400 to-yellow-600'
    };
    return { 
      text: 'text-orange-500', 
      bg: 'bg-orange-500', 
      stroke: '#f97316',
      gradient: 'from-orange-400 to-orange-600'
    };
  };
  
  const colors = getColor();

  return (
    <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl hover:shadow-green-500/20 dark:hover:shadow-green-500/10 transition-all duration-300 transform hover:scale-105 border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity duration-500`}></div>
        
        {/* Title */}
        <div className="relative mb-6 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {title}
            </p>
            <ChartPieIcon className={`w-5 h-5 ${colors.text} animate-pulse`}/>
        </div>
        
        {/* Large 3D circular progress */}
        <div className="relative flex items-center justify-center py-4">
            <div className="relative w-40 h-40 flex-shrink-0">
                {/* Outer glow */}
                <div className={`absolute inset-0 ${colors.bg} opacity-20 blur-2xl rounded-full animate-pulse`}></div>
                
                {/* SVG Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <defs>
                        <linearGradient id={`successGrad-${Math.round(value)}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.8"/>
                            <stop offset="100%" stopColor={colors.stroke} stopOpacity="1"/>
                        </linearGradient>
                        <filter id={`glow-${Math.round(value)}`}>
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    {/* Background circle */}
                    <circle
                        cx="80" cy="80"
                        r={normalizedRadius}
                        stroke="#e5e7eb"
                        strokeWidth={stroke}
                        fill="transparent"
                        className="dark:stroke-gray-700"
                    />
                    {/* Animated progress circle */}
                    <circle
                        cx="80" cy="80"
                        r={normalizedRadius}
                        stroke={`url(#successGrad-${Math.round(value)})`}
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        filter={`url(#glow-${Math.round(value)})`}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                
                {/* Center value with animation */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-bold ${colors.text} drop-shadow-lg`}>
                        {displayValue}
                    </span>
                    <span className={`text-xl font-bold ${colors.text} -mt-1`}>%</span>
                    <div className="mt-2 flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${colors.bg} animate-pulse`}></div>
                        <p className={`text-xs font-semibold ${colors.text}`}>
                            {value >= 90 ? 'ممتاز' : value >= 70 ? 'جيد' : 'متوسط'}
                        </p>
                    </div>
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
                </div>
            </div>
            
            {/* Prominent Date Card - في منتصف الصفحة - حجم مناسب */}
            {forecastDate && (
                <div className="flex justify-center mb-6">
                    <div className="w-full max-w-xl">
                        <div className="group relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 md:p-8 shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] border-2 border-blue-200/50 dark:border-blue-700/50 overflow-hidden backdrop-blur-sm">
                            {/* Animated gradient backgrounds - أصغر */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 opacity-15 blur-2xl rounded-full -mr-16 -mt-16 group-hover:opacity-25 transition-all duration-500" style={{ pointerEvents: 'none' }}></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400 opacity-10 blur-xl rounded-full -ml-12 -mb-12 group-hover:opacity-20 transition-opacity duration-300" style={{ pointerEvents: 'none' }}></div>
                            
                            {/* Decorative sparkle effects - أصغر */}
                            <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400 rounded-full opacity-50 animate-pulse"></div>
                            <div className="absolute top-6 left-4 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            
                            {/* Content Layout - أفقي */}
                            <div className="relative z-10 flex items-center justify-center gap-6">
                                {/* Icon - أصغر */}
                                <div className="relative flex-shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 opacity-20 blur-xl rounded-2xl group-hover:opacity-30 transition-opacity duration-300" style={{ pointerEvents: 'none', transform: 'scale(1.3)' }}></div>
                                    <div className="relative p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg transform group-hover:scale-105 group-hover:rotate-2 transition-all duration-300 border-2 border-white/30">
                                        <CalendarDaysIcon className="w-6 h-6 md:w-7 md:h-7" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                                    </div>
                                </div>
                                
                                {/* Title and Date */}
                                <div className="flex-1 text-center md:text-left">
                                    <p className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-300 mb-2 uppercase tracking-wide">
                                        {language === 'ar' ? 'تاريخ آخر يوم عمل' : 'Last Business Day'}
                                    </p>
                                    {/* Date value - حجم مناسب */}
                                    <p className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-lg leading-tight">
                                        {forecastDate.split('-').join('/')}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Statistics Section - جميع البطاقات الأربعة في صف واحد */}
            <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* بطاقة نسبة النجاح */}
                    <div className="w-full">
                        <HitRateStatCard 
                            title={language === 'ar' ? 'نسبة النجاح' : t('success_rate')} 
                            value={summaryStats.hitRate * 100} 
                        />
                    </div>
                    
                    {/* بطاقة إجمالي التوقعات */}
                    <SimpleStatCard 
                        title={language === 'ar' ? 'إجمالي التوقعات' : t('total_forecasts')} 
                        value={String(summaryStats.total)} 
                        icon={<BuildingOfficeIcon className="w-6 h-6"/>}
                        iconBgClass="bg-gradient-to-br from-blue-500 to-blue-700"
                        gradient="from-blue-400 to-blue-600"
                        total={summaryStats.total}
                    />
                    
                    {/* بطاقة التوقعات الصحيحة */}
                    <SimpleStatCard 
                        title={language === 'ar' ? 'توقعات صحيحة' : t('correct_forecasts')} 
                        value={String(summaryStats.hits)} 
                        icon={<CheckCircleIcon className="w-6 h-6"/>}
                        iconBgClass="bg-gradient-to-br from-green-500 to-green-700"
                        gradient="from-green-400 to-green-600"
                        total={summaryStats.total}
                    />
                    
                    {/* بطاقة التوقعات الخاطئة */}
                    <SimpleStatCard 
                        title={language === 'ar' ? 'توقعات خاطئة' : t('incorrect_forecasts')} 
                        value={String(summaryStats.misses)} 
                        icon={<XCircleIcon className="w-6 h-6"/>}
                        iconBgClass="bg-gradient-to-br from-red-500 to-red-700"
                        gradient="from-red-400 to-red-600"
                        total={summaryStats.total}
                    />
                </div>
            </div>

            {/* Filters and Search - Same width as table */}
            <div className="flex justify-center mb-4">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-shrink-0 flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-md p-1">
                            <button onClick={() => setResultFilter('all')} className={`px-2 py-1 text-xs font-medium rounded-md ${resultFilter === 'all' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('all')}</button>
                            <button onClick={() => setResultFilter('hits')} className={`px-2 py-1 text-xs font-medium rounded-md ${resultFilter === 'hits' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('hits')}</button>
                            <button onClick={() => setResultFilter('misses')} className={`px-2 py-1 text-xs font-medium rounded-md ${resultFilter === 'misses' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('misses')}</button>
                        </div>
                        <input 
                            type="text"
                            placeholder={t('search_by_symbol_or_name')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                            onClick={() => setShowFavorites(!showFavorites)}
                            className={`flex items-center justify-center py-2 px-3 border rounded-md shadow-sm text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                                showFavorites ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                        >
                            <StarIcon className={`w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1 ${showFavorites ? 'fill-current' : ''}`} />
                            {t('favorites_filter')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table - Same design as DailyWatchlist, but narrower */}
            <div className="flex justify-center">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                                <tr>
                                    <th className="px-1.5 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest w-8" title={t('column_favorite')}>
                                        <span className="text-sm">★</span>
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[60px]">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // You can add sorting logic here if needed
                                            }}
                                            className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                                        >
                                            {t('column_symbol')}
                                        </button>
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[90px]">
                                        {t('column_price_date')}
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                                        {t('column_actual_range')}
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                                        {t('column_expected_range')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedData.map((item, index) => {
                                    return (
                                        <tr 
                                            key={item.stock_symbol} 
                                            className={`group transition-all duration-200 cursor-pointer ${
                                                index % 2 === 0 
                                                    ? 'bg-white dark:bg-gray-800' 
                                                    : 'bg-gray-50/50 dark:bg-gray-800/50'
                                            } hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md`}
                                            onClick={() => setPage({ page: 'stock_details', symbol: item.stock_symbol })}
                                        >
                                            <td className="px-1.5 py-2 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(item.stock_symbol);
                                                    }}
                                                    className={`p-0.5 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200 transform hover:scale-110 ${
                                                        isFavorite(item.stock_symbol) 
                                                            ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                                                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                                                    }`}
                                                >
                                                    <StarIcon className={`w-3.5 h-3.5 ${isFavorite(item.stock_symbol) ? 'fill-current' : ''}`} />
                                                </button>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-left">
                                                <div className="text-xs font-semibold text-nextrow-primary hover:text-nextrow-primary/80 hover:underline transition-colors">
                                                    {item.stock_symbol}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-center">
                                                <PriceDateDisplay price={item.price} date={item.forecast_date} />
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-center">
                                                <ActualRangeDisplay low={item.actual_low} high={item.actual_high} />
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-center">
                                                <ExpectedRangeDisplay low={item.predicted_lo} high={item.predicted_hi} />
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
                    
                    {/* Pagination - Same style as DailyWatchlist */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> من <span className="font-semibold">{processedData.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {t('previous')}
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                            currentPage === page
                                                                ? 'bg-nextrow-primary text-white'
                                                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                page === currentPage - 2 ||
                                                page === currentPage + 2
                                            ) {
                                                return <span key={page} className="text-gray-400 dark:text-gray-600">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {t('next')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockAnalysis;
