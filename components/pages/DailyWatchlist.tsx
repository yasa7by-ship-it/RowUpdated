import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { DailyWatchlistItem, PageState } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, StarIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon, SparklesIcon, CalendarDaysIcon } from '../icons';

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00Z');
        return date.toLocaleDateString('en-CA', { timeZone: 'UTC' });
    } catch { return 'Invalid Date'; }
};

const formatNumber = (num: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  
  // Ensure fraction digits are within valid range (0-20)
  const minFrac = options.minimumFractionDigits ?? 2;
  const maxFrac = options.maximumFractionDigits ?? 2;
  
  const safeOptions: Intl.NumberFormatOptions = {
    ...options,
    minimumFractionDigits: Math.max(0, Math.min(20, typeof minFrac === 'number' ? minFrac : 2)),
    maximumFractionDigits: Math.max(0, Math.min(20, typeof maxFrac === 'number' ? maxFrac : 2)),
  };
  
  // Ensure maximum >= minimum
  if (safeOptions.maximumFractionDigits! < safeOptions.minimumFractionDigits!) {
    safeOptions.maximumFractionDigits = safeOptions.minimumFractionDigits;
  }
  
  try {
    return new Intl.NumberFormat('en-US', safeOptions).format(num);
  } catch (err) {
    console.error('formatNumber error:', err, 'num:', num, 'options:', safeOptions);
    return num.toString();
  }
};

// Date Card Component - تصميم احترافي وعصري جداً
const DateCard: React.FC<{ 
    title: string; 
    date?: string; 
    icon: React.ReactNode; 
    iconBgClass: string;
    gradient?: string;
}> = memo(({ title, date, icon, iconBgClass, gradient }) => {
    return (
        <div className="group relative bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border-2 border-purple-200/50 dark:border-purple-700/50 overflow-hidden backdrop-blur-sm">
            {/* Animated gradient backgrounds */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient || 'from-purple-400 via-indigo-400 to-blue-400'} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
            <div className={`absolute top-0 right-0 w-40 h-40 ${iconBgClass} opacity-20 blur-3xl rounded-full -mr-20 -mt-20 group-hover:opacity-30 group-hover:scale-150 transition-all duration-700`} style={{ pointerEvents: 'none' }}></div>
            <div className={`absolute bottom-0 left-0 w-32 h-32 bg-blue-400 opacity-15 blur-2xl rounded-full -ml-16 -mb-16 group-hover:opacity-25 transition-opacity duration-500`} style={{ pointerEvents: 'none' }}></div>
            
            {/* Decorative sparkle effects */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute top-8 left-6 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-50 animate-pulse delay-300"></div>
            <div className="absolute bottom-6 right-8 w-1 h-1 bg-blue-400 rounded-full opacity-40 animate-pulse delay-700"></div>
            
            {/* Icon with 3D effect and glow */}
            <div className="relative mb-6 z-10">
                <div className={`absolute inset-0 ${iconBgClass} opacity-30 blur-2xl rounded-3xl group-hover:opacity-40 transition-opacity duration-500`} style={{ pointerEvents: 'none', transform: 'scale(1.2)' }}></div>
                <div className={`relative p-5 rounded-2xl ${iconBgClass} text-white shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border-2 border-white/30`}>
                    <div className="relative z-10">
                        {icon}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                </div>
            </div>
            
            {/* Title with accent */}
            <div className="relative mb-4 z-10">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-300 mb-3 uppercase tracking-widest letter-spacing-2">
                    {title}
                </p>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
            </div>
            
            {/* Date value with modern typography - YYYY/MM/DD format */}
            {date && (
                <div className="relative z-10">
                    <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 dark:from-purple-300 dark:via-indigo-300 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-2xl leading-tight mb-2">
                        {date.split('-').join('/')}
                    </p>
                </div>
            )}
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
    );
});
DateCard.displayName = 'DateCard';

// Price Change Component
const PriceChange: React.FC<{ change: number | null; changePercent: number | null }> = memo(({ change, changePercent }) => {
    if (change === null || changePercent === null) return <span className="text-gray-500 text-sm">N/A</span>;
    const isPositive = change >= 0;
    
    return (
        <div className="flex items-center gap-1">
            {isPositive ? (
                <ArrowUpIcon className="w-4 h-4 text-nextrow-success" />
            ) : (
                <ArrowDownIcon className="w-4 h-4 text-nextrow-danger" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-nextrow-success' : 'text-nextrow-danger'}`}>
                {isPositive ? '+' : ''}{formatNumber(changePercent)}%
            </span>
        </div>
    );
});
PriceChange.displayName = 'PriceChange';

// RSI Display
const RsiDisplay: React.FC<{ value: number | null }> = memo(({ value }) => {
    if (value === null) return <span className="text-gray-400 text-sm font-medium">N/A</span>;
    
    const getColor = () => {
        if (value > 70) return { 
            color: 'text-red-600 dark:text-red-400', 
            bg: 'bg-red-500', 
            badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
        };
        if (value < 30) return { 
            color: 'text-green-600 dark:text-green-400', 
            bg: 'bg-green-500', 
            badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
        };
        return { 
            color: 'text-gray-600 dark:text-gray-400', 
            bg: 'bg-gray-400', 
            badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
        };
    };
    
    const status = getColor();
    
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full ${status.bg} transition-all duration-300 shadow-sm`} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className={`text-sm font-bold w-14 text-right px-2 py-1 rounded ${status.badge}`}>
                {formatNumber(value, { maximumFractionDigits: 1 })}
            </span>
        </div>
    );
});
RsiDisplay.displayName = 'RsiDisplay';

// Price & Date Display
const PriceDateDisplay: React.FC<{ price: number | null; date: string | null }> = memo(({ price, date }) => {
    if (price === null) return <span className="text-gray-400 text-xs">N/A</span>;
    
    const formattedDate = date ? formatDate(date) : 'N/A';
    
    return (
        <div className="space-y-0.5 text-center">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
                ${formatNumber(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {formattedDate}
            </div>
        </div>
    );
});
PriceDateDisplay.displayName = 'PriceDateDisplay';

// Actual Range Display
const ActualRangeDisplay: React.FC<{ low: number | null; high: number | null }> = memo(({ low, high }) => {
    // Check if both values are null or undefined
    if ((low === null || low === undefined) && (high === null || high === undefined)) {
        return <span className="text-gray-400 text-sm font-medium">N/A - N/A</span>;
    }
    
    // If only one value is missing, show what's available
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
    
    // Ensure correct order: low should be less than high
    const actualLow = Math.min(low, high);
    const actualHigh = Math.max(low, high);
    
    return (
        <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                {formatNumber(actualLow, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-500 font-medium">-</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {formatNumber(actualHigh, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
});
ActualRangeDisplay.displayName = 'ActualRangeDisplay';

// Expected Range Display
const ExpectedRangeDisplay: React.FC<{ low: number | null; high: number | null }> = memo(({ low, high }) => {
    if (low === null || high === null) return <span className="text-gray-400 text-sm font-medium">N/A</span>;
    
    // Ensure correct order: low should be less than high
    const expectedLow = Math.min(low, high);
    const expectedHigh = Math.max(low, high);
    
    return (
        <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                {formatNumber(expectedLow, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-500 font-medium">-</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {formatNumber(expectedHigh, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
});
ExpectedRangeDisplay.displayName = 'ExpectedRangeDisplay';

// Pattern Display
const PatternDisplay: React.FC<{ patternName: string | null; bullish: boolean | null; patternText?: string }> = memo(({ patternName, bullish, patternText }) => {
    if (!patternName) return <span className="text-gray-400 text-sm font-medium">-</span>;
    
    return (
        <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                bullish 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}>
                {patternText || patternName}
            </div>
        </div>
    );
});
PatternDisplay.displayName = 'PatternDisplay';

// --- Caching Configuration ---
const CACHE_KEY = 'dailyWatchlistData-v3';
const CACHE_TIMESTAMP_KEY = 'dailyWatchlistTimestamp-v3';
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface DailyWatchlistProps {
  setPage: (page: PageState) => void;
}

const DailyWatchlist: React.FC<DailyWatchlistProps> = ({ setPage }) => {
    const { t } = useLanguage();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { settings } = useAppSettings();
    const [data, setData] = useState<DailyWatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showFavorites, setShowFavorites] = useState(false);
    const [sortBy, setSortBy] = useState<'symbol' | 'change' | 'rsi'>('symbol');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setError(null);
            try {
                const cachedDataString = localStorage.getItem(CACHE_KEY);
                const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

                if (cachedDataString && cachedTimestamp) {
                    try {
                        const cachedData = JSON.parse(cachedDataString);
                        if (isMounted) {
                            setData(cachedData);
                            setLoading(false);
                        }

                        const isCacheStale = Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION_MS;
                        if (!isCacheStale) {
                            return;
                        }
                    } catch (parseError) {
                        console.error('Error parsing cached data:', parseError);
                    }
                } else {
                    if (isMounted) {
                        setLoading(true);
                    }
                }

                const { data: rpcData, error: rpcError } = await supabase.rpc('get_the_coming_trend_data');
                
                if (!isMounted) return;
                
                if (rpcError) {
                    console.error('RPC Error:', rpcError);
                    setError(rpcError.message || 'فشل تحميل البيانات');
                    setLoading(false);
                    return;
                }
                
                if (!rpcData || !Array.isArray(rpcData)) {
                    console.warn('RPC returned invalid data:', rpcData);
                    setData([]);
                    setLoading(false);
                    if (rpcData === null || rpcData === undefined) {
                        setError('لا توجد بيانات متاحة. يرجى التحقق من قاعدة البيانات.');
                    }
                    return;
                }
                
                const freshData = rpcData as DailyWatchlistItem[];
                setData(freshData);
                
                if (freshData.length === 0) {
                    console.warn('No data returned from get_the_coming_trend_data');
                    setError(null);
                } else {
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
                        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
                    } catch (storageError) {
                        console.error('Error saving to localStorage:', storageError);
                    }
                }
                setLoading(false);

            } catch (err: any) {
                console.error('Error fetching DailyWatchlist data:', err);
                if (isMounted) {
                    setError(err.message || 'فشل تحميل البيانات');
                    setLoading(false);
                }
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const filteredData = useMemo(() => {
        let filtered = data.filter(item => {
            const matchesSearch = searchTerm === '' || 
                                  item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.stock_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFavorites = !showFavorites || isFavorite(item.symbol);
            return matchesSearch && matchesFavorites;
        });
        
        // Sorting
        filtered.sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortBy) {
                case 'symbol':
                    aVal = a.symbol;
                    bVal = b.symbol;
                    break;
                case 'change':
                    aVal = a.daily_change_percent ?? 0;
                    bVal = b.daily_change_percent ?? 0;
                    break;
                case 'rsi':
                    aVal = a.rsi ?? 50;
                    bVal = b.rsi ?? 50;
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }, [data, searchTerm, showFavorites, sortBy, sortOrder, isFavorite]);

    const nextForecastDate = useMemo(() => {
        if (data.length > 0) {
            const itemWithDate = data.find(item => item.next_forecast_date);
            return itemWithDate ? itemWithDate.next_forecast_date : null;
        }
        return null;
    }, [data]);

    // Reset to first page when filters change - MUST be before any conditional returns
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, showFavorites, sortBy, sortOrder]);

    // Pagination logic - MUST be before any conditional returns (all hooks must be before returns)
    const totalPages = useMemo(() => Math.ceil(filteredData.length / itemsPerPage), [filteredData.length, itemsPerPage]);
    const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
    const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
    const paginatedData = useMemo(() => filteredData.slice(startIndex, endIndex), [filteredData, startIndex, endIndex]);

    // Settings - can be after hooks but before returns
    const showDisclaimer = settings?.show_watchlist_disclaimer !== 'false';
    const disclaimerColor = settings?.watchlist_disclaimer_color || 'text-gray-500 dark:text-gray-400';
    const disclaimerSize = settings?.watchlist_disclaimer_size || 'text-sm';


    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="text-center">
                    <SpinnerIcon className="w-12 h-12 text-nextrow-primary mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">{t('loading')}...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 bg-nextrow-danger/20 dark:bg-nextrow-danger/30 text-nextrow-danger dark:text-nextrow-danger/90 rounded-lg shadow-md border border-nextrow-danger/30">
                <p className="font-semibold mb-2">{t('error_fetching_data')}</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    // Standard web layout for all devices (mobile and desktop)
    return (
        <div className="space-y-6">
            {/* Header - بطاقة توقعات ليوم */}
            <div className="flex justify-center">
                <div className="w-full max-w-3xl">
                    <DateCard 
                        title={nextForecastDate ? t('forecasts_for') : t('daily_watchlist')}
                        date={nextForecastDate ? formatDate(nextForecastDate) : undefined}
                        icon={<CalendarDaysIcon className="w-6 h-6"/>}
                        iconBgClass="bg-gradient-to-br from-purple-500 to-purple-700"
                        gradient="from-purple-400 to-purple-600"
                    />
                    {showDisclaimer && (
                        <p className={`${disclaimerSize} ${disclaimerColor} mt-4 text-center`} style={{
                            color: settings?.watchlist_disclaimer_custom_color || undefined,
                            fontSize: settings?.watchlist_disclaimer_custom_size ? `${settings.watchlist_disclaimer_custom_size}px` : undefined
                        }}>
                            {t('disclaimer_educational_purposes')}
                        </p>
                    )}
                </div>
            </div>

            {/* Search and Filters Tools */}
            <div className="flex justify-center">
                <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder={t('search_by_symbol_or_name')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nextrow-primary focus:border-nextrow-primary dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        
                        {/* Favorites Filter */}
                        <button
                            onClick={() => setShowFavorites(!showFavorites)}
                            className={`w-full px-4 py-3 rounded-md text-sm font-medium transition-all ${
                                showFavorites 
                                    ? 'bg-yellow-400 text-black border-2 border-yellow-500' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            <StarIcon className={`w-4 h-4 inline mr-1 ${showFavorites ? 'fill-current' : ''}`} />
                            {t('favorites')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            {filteredData.length > 0 ? (
                <div className="flex justify-center">
                    <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                                <tr>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest w-10" title={t('column_favorite')}>
                                        <span className="text-base">★</span>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[70px]">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSortBy('symbol');
                                                setSortOrder(sortBy === 'symbol' && sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className="flex items-center gap-2 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                                        >
                                            {t('column_symbol')}
                                            {sortBy === 'symbol' && (
                                                <span className={`text-nextrow-primary text-sm ${sortOrder === 'asc' ? '↑' : '↓'}`}>
                                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[110px]">
                                        {t('column_price_date')}
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                                        {t('column_actual_range')}
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                                        {t('column_expected_range')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedData.map((item, index) => {
                                    const patternKey = item.pattern_name ? `pattern_${item.pattern_name.toLowerCase().replace(/\s+/g, '_')}` : '';
                                    const patternText = patternKey ? t(patternKey) : item.pattern_name;
                                    
                                    return (
                                        <tr 
                                            key={item.symbol} 
                                            className={`group transition-all duration-200 cursor-pointer ${
                                                index % 2 === 0 
                                                    ? 'bg-white dark:bg-gray-800' 
                                                    : 'bg-gray-50/50 dark:bg-gray-800/50'
                                            } hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md`}
                                            onClick={() => setPage({ page: 'stock_details', symbol: item.symbol })}
                                        >
                                            <td className="px-2 py-2 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(item.symbol);
                                                    }}
                                                    className={`p-1 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200 transform hover:scale-110 ${
                                                        isFavorite(item.symbol) 
                                                            ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                                                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                                                    }`}
                                                >
                                                    <StarIcon className={`w-4 h-4 ${isFavorite(item.symbol) ? 'fill-current' : ''}`} />
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-left">
                                                <div className="text-sm font-semibold text-nextrow-primary hover:text-nextrow-primary/80 hover:underline transition-colors">
                                                    {item.symbol}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                <PriceDateDisplay price={item.last_price} date={item.indicator_date} />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                <ActualRangeDisplay low={item.actual_low} high={item.actual_high} />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                <ExpectedRangeDisplay low={item.next_predicted_lo} high={item.next_predicted_hi} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, filteredData.length)}</span> من <span className="font-semibold">{filteredData.length}</span>
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
                                                // Show first page, last page, current page, and pages around current
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
            ) : data.length === 0 && !loading && !error ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('daily_watchlist')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">لا توجد بيانات متاحة حالياً</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">يرجى التحقق من وجود بيانات في قاعدة البيانات</p>
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-400">{t('no_results_found')}</p>
                    {searchTerm && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">لا توجد نتائج تطابق: "{searchTerm}"</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DailyWatchlist;
