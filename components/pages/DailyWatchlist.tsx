import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { DailyWatchlistItem, PageState } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, StarIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon, SparklesIcon } from '../icons';

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
    if (value === null) return <span className="text-gray-400 text-sm">N/A</span>;
    
    const getColor = () => {
        if (value > 70) return { color: 'text-nextrow-danger', bg: 'bg-nextrow-danger' };
        if (value < 30) return { color: 'text-nextrow-success', bg: 'bg-nextrow-success' };
        return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-400' };
    };
    
    const status = getColor();
    
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${status.bg}`} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className={`text-sm font-medium w-12 text-right ${status.color}`}>
                {formatNumber(value, { maximumFractionDigits: 1 })}
            </span>
        </div>
    );
});
RsiDisplay.displayName = 'RsiDisplay';

// Forecast Range
const ForecastDisplay: React.FC<{ low: number | null; high: number | null }> = memo(({ low, high }) => {
    if (low === null || high === null) return <span className="text-gray-400 text-sm">N/A</span>;
    
    return (
        <div className="text-right">
            <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-semibold text-nextrow-danger">{formatNumber(low)}</span>
                <span className="text-xs text-gray-400">-</span>
                <span className="text-sm font-semibold text-nextrow-success">{formatNumber(high)}</span>
            </div>
        </div>
    );
});
ForecastDisplay.displayName = 'ForecastDisplay';

// Pattern Display
const PatternDisplay: React.FC<{ patternName: string | null; bullish: boolean | null; patternText?: string }> = memo(({ patternName, bullish, patternText }) => {
    if (!patternName) return <span className="text-gray-400 text-sm">-</span>;
    
    return (
        <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                bullish 
                    ? 'bg-nextrow-success/20 text-nextrow-success' 
                    : 'bg-nextrow-danger/20 text-nextrow-danger'
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

    const showDisclaimer = settings?.show_watchlist_disclaimer !== 'false';
    const disclaimerColor = settings?.watchlist_disclaimer_color || 'text-gray-500 dark:text-gray-400';
    const disclaimerSize = settings?.watchlist_disclaimer_size || 'text-sm';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <ChartBarIcon className="w-6 h-6 text-nextrow-primary" />
                            <span>
                                {nextForecastDate ? (
                                    <>{t('forecasts_for')} {formatDate(nextForecastDate)}</>
                                ) : (
                                    <>{t('daily_watchlist')}</>
                                )}
                            </span>
                        </h1>
                        {showDisclaimer && (
                            <p className={`${disclaimerSize} ${disclaimerColor} mt-2`} style={{
                                color: settings?.watchlist_disclaimer_custom_color || undefined,
                                fontSize: settings?.watchlist_disclaimer_custom_size ? `${settings.watchlist_disclaimer_custom_size}px` : undefined
                            }}>
                                {t('disclaimer_educational_purposes')}
                            </p>
                        )}
                    </div>
                    
                    {/* Stats */}
                    <div className="flex gap-4 text-sm">
                        <div className="text-center px-4 py-2 bg-nextrow-primary/10 rounded-lg">
                            <div className="text-2xl font-bold text-nextrow-primary">{filteredData.length}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">Total</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-nextrow-success/10 rounded-lg">
                            <div className="text-2xl font-bold text-nextrow-success">{filteredData.filter(item => isFavorite(item.symbol)).length}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">Favorites</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input 
                            type="text"
                            placeholder={t('search_by_symbol_or_name')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nextrow-primary focus:border-nextrow-primary dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    
                    <button
                        onClick={() => setShowFavorites(!showFavorites)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
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

            {/* Table */}
            {filteredData.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSortBy('symbol');
                                                setSortOrder(sortBy === 'symbol' && sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className="flex items-center gap-1 hover:text-nextrow-primary transition-colors"
                                        >
                                            Symbol
                                            {sortBy === 'symbol' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSortBy('change');
                                                setSortOrder(sortBy === 'change' && sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className="flex items-center gap-1 hover:text-nextrow-primary transition-colors"
                                        >
                                            Price & Change
                                            {sortBy === 'change' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSortBy('rsi');
                                                setSortOrder(sortBy === 'rsi' && sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                            className="flex items-center gap-1 hover:text-nextrow-primary transition-colors"
                                        >
                                            RSI
                                            {sortBy === 'rsi' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Forecast</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Pattern</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">★</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                {filteredData.map((item) => {
                                    const patternKey = item.pattern_name ? `pattern_${item.pattern_name.toLowerCase().replace(/\s+/g, '_')}` : '';
                                    const patternText = patternKey ? t(patternKey) : item.pattern_name;
                                    
                                    return (
                                        <tr 
                                            key={item.symbol} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                            onClick={() => setPage({ page: 'stock_details', symbol: item.symbol })}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-nextrow-primary hover:underline">
                                                    {item.symbol}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={item.stock_name || ''}>
                                                    {item.stock_name || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                        ${formatNumber(item.last_price)}
                                                    </div>
                                                    <PriceChange change={item.daily_change} changePercent={item.daily_change_percent} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <RsiDisplay value={item.rsi} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <ForecastDisplay low={item.next_predicted_lo} high={item.next_predicted_hi} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <PatternDisplay 
                                                    patternName={item.pattern_name} 
                                                    bullish={item.bullish}
                                                    patternText={patternText || undefined}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(item.symbol);
                                                    }}
                                                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                                        isFavorite(item.symbol) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                                >
                                                    <StarIcon className={`w-5 h-5 ${isFavorite(item.symbol) ? 'fill-current' : ''}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
