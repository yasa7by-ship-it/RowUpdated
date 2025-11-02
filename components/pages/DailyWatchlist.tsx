import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { DailyWatchlistItem, PageState } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, StarIcon, ArrowUpIcon, ArrowDownIcon, ChartBarIcon, SparklesIcon } from '../icons';

const formatDate = (dateString: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString + 'T00:00:00Z');
        return date.toLocaleDateString('en-CA', { timeZone: 'UTC', ...options });
    } catch { return 'Invalid Date'; }
};

const formatNumber = (num: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options }).format(num);
};

// --- Enhanced Visual Components ---

// RSI Progress Bar with Color Zones
const RsiIndicator: React.FC<{ value: number | null }> = memo(({ value }) => {
    const { t } = useLanguage();
    if (value === null) return (
        <div className="flex items-center justify-center h-8">
            <span className="text-xs text-gray-400">{t('n_a')}</span>
        </div>
    );
    
    const getZone = (val: number) => {
        if (val < 30) return { color: 'bg-green-500', label: t('oversold'), position: val };
        if (val > 70) return { color: 'bg-red-500', label: t('overbought'), position: val };
        return { color: 'bg-blue-500', label: t('neutral'), position: val };
    };
    
    const zone = getZone(value);
    const status = value > 70 ? '🔴' : value < 30 ? '🟢' : '🔵';
    
    return (
        <div className="w-full space-y-1">
            <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">RSI</span>
                <span className="font-bold" style={{color: zone.color.replace('bg-', '').replace('-500', '')}}>
                    {formatNumber(value)} {status}
                </span>
            </div>
            <div className="relative w-full h-3 bg-gradient-to-r from-green-200 via-blue-200 to-red-200 dark:from-green-900 dark:via-blue-900 dark:to-red-900 rounded-full overflow-hidden">
                <div 
                    className={`absolute top-0 left-0 h-full ${zone.color} transition-all duration-500 rounded-full shadow-sm`}
                    style={{ width: `${value}%` }}
                />
                <div 
                    className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-100 z-10"
                    style={{ left: `${value}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-500">
                <span>0</span>
                <span className="font-semibold">30</span>
                <span className="font-semibold">50</span>
                <span className="font-semibold">70</span>
                <span>100</span>
            </div>
        </div>
    );
});
RsiIndicator.displayName = 'RsiIndicator';

// MACD Histogram with Visual Bars
const MacdIndicator: React.FC<{ macd: number | null, signal: number | null }> = memo(({ macd, signal }) => {
    const { t } = useLanguage();
    if (macd === null || signal === null) return (
        <div className="flex items-center justify-center h-8">
            <span className="text-xs text-gray-400">{t('n_a')}</span>
        </div>
    );
    
    const histogram = macd - signal;
    const isPositive = histogram >= 0;
    const absValue = Math.abs(histogram);
    const maxWidth = 80;
    const width = Math.min(maxWidth, (absValue * 10));
    
    return (
        <div className="w-full space-y-1">
            <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-600 dark:text-gray-400">MACD</span>
                <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(histogram, { minimumFractionDigits: 3 })}
                </span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-full bg-gray-400 dark:bg-gray-600"></div>
                </div>
                {isPositive ? (
                    <div 
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-green-400 to-green-600 rounded-r-md transition-all duration-300"
                        style={{ width: `${width}%` }}
                    />
                ) : (
                    <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 to-red-600 rounded-l-md transition-all duration-300"
                        style={{ width: `${width}%` }}
                    />
                )}
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-red-500">-</span>
                <span className="text-green-500">+</span>
            </div>
        </div>
    );
});
MacdIndicator.displayName = 'MacdIndicator';

// SMA Indicators with Trend Arrows
const SmaIndicator: React.FC<{ price: number | null, sma: number | null, period: number }> = memo(({ price, sma, period }) => {
    const { t } = useLanguage();
    if (price === null || sma === null) return (
        <div className="flex items-center justify-center h-8">
            <span className="text-xs text-gray-400">-</span>
        </div>
    );
    
    const isAbove = price > sma;
    const diff = ((price - sma) / sma) * 100;
    const diffAbs = Math.abs(diff);
    
    return (
        <div className="flex flex-col items-center gap-1" title={`SMA${period}: ${formatNumber(sma)} | ${isAbove ? '+' : '-'}${formatNumber(diffAbs)}%`}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isAbove ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isAbove ? (
                    <ArrowUpIcon className={`w-4 h-4 text-green-600 dark:text-green-400`} />
                ) : (
                    <ArrowDownIcon className={`w-4 h-4 text-red-600 dark:text-red-400`} />
                )}
                <span className={`text-xs font-bold ${isAbove ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {period}
                </span>
            </div>
            <span className="text-[10px] text-gray-500">{formatNumber(diffAbs, { minimumFractionDigits: 1 })}%</span>
        </div>
    );
});
SmaIndicator.displayName = 'SmaIndicator';

// Price Change Badge
const PriceChangeBadge: React.FC<{ change: number; changePercent: number }> = memo(({ change, changePercent }) => {
    const isPositive = change >= 0;
    const absPercent = Math.abs(changePercent);
    
    return (
        <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition-all duration-200 ${
            isPositive 
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
        }`}>
            {isPositive ? (
                <ArrowUpIcon className="w-4 h-4" />
            ) : (
                <ArrowDownIcon className="w-4 h-4" />
            )}
            <span className="text-sm">{formatNumber(changePercent)}%</span>
        </div>
    );
});
PriceChangeBadge.displayName = 'PriceChangeBadge';

// Forecast Range Visual Card
const ForecastRangeCard: React.FC<{ low: number | null; high: number | null; price: number | null }> = memo(({ low, high, price }) => {
    if (low === null || high === null || price === null) return (
        <div className="text-center text-gray-400 text-sm">N/A</div>
    );
    
    const range = high - low;
    const pricePosition = range > 0 ? ((price - low) / range) * 100 : 50;
    const isInRange = price >= low && price <= high;
    
    return (
        <div className="relative w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Low</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Price</span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">High</span>
            </div>
            <div className="relative h-8 bg-gradient-to-r from-red-100 via-blue-100 to-green-100 dark:from-red-900/20 dark:via-blue-900/20 dark:to-green-900/20 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                    <div className="flex-1 h-full bg-red-200 dark:bg-red-800/30"></div>
                    <div className="flex-1 h-full bg-green-200 dark:bg-green-800/30"></div>
                </div>
                {price >= 0 && (
                    <div 
                        className={`absolute top-0 h-full w-1 ${isInRange ? 'bg-blue-600' : 'bg-orange-600'} z-10 shadow-lg`}
                        style={{ left: `${Math.max(0, Math.min(100, pricePosition))}%` }}
                        title={`Current: ${formatNumber(price)}`}
                    />
                )}
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-xs font-mono text-red-600 dark:text-red-400">{formatNumber(low)}</span>
                <span className={`text-xs font-mono font-bold ${isInRange ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {formatNumber(price)}
                </span>
                <span className="text-xs font-mono text-green-600 dark:text-green-400">{formatNumber(high)}</span>
            </div>
        </div>
    );
});
ForecastRangeCard.displayName = 'ForecastRangeCard';

// Pattern Badge
const PatternBadge: React.FC<{ patternName: string | null; bullish: boolean | null }> = memo(({ patternName, bullish }) => {
    const { t } = useLanguage();
    
    if (!patternName) {
        return (
            <div className="flex items-center justify-center py-2">
                <span className="text-xs text-gray-400 italic">{t('no_pattern_detected')}</span>
            </div>
        );
    }
    
    const patternKey = `pattern_name_${patternName.replace(/ /g, '_')}`;
    const signalKey = bullish ? 'pattern_signal_bullish' : 'pattern_signal_bearish';
    const icon = bullish ? '📈' : '📉';
    
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm shadow-sm ${
                bullish 
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' 
                    : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
            }`}>
                <span className="mr-1">{icon}</span>
                {t(patternKey)}
            </div>
            <span className={`text-xs font-medium ${bullish ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {t(signalKey)}
            </span>
        </div>
    );
});
PatternBadge.displayName = 'PatternBadge';

// Stock Card Component (Card-based instead of table row)
const StockCard: React.FC<{ 
    item: DailyWatchlistItem; 
    isFavorite: (symbol: string) => boolean;
    toggleFavorite: (symbol: string) => void;
    setPage: (page: PageState) => void;
}> = memo(({ item, isFavorite, toggleFavorite, setPage }) => {
    const favorited = isFavorite(item.symbol);
    const dailyChange = item.daily_change || 0;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                    <button 
                        onClick={() => toggleFavorite(item.symbol)} 
                        className={`p-1.5 rounded-full transition-all duration-200 ${
                            favorited 
                                ? 'text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        }`}
                    >
                        <StarIcon className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <button 
                            onClick={() => setPage({ page: 'stock_details', symbol: item.symbol })} 
                            className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                        >
                            {item.symbol}
                        </button>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.stock_name}</div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(item.last_price)}</div>
                    <PriceChangeBadge change={dailyChange} changePercent={item.daily_change_percent || 0} />
                </div>
            </div>
            
            {/* Forecast Range */}
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <ForecastRangeCard 
                    low={item.next_predicted_lo} 
                    high={item.next_predicted_hi} 
                    price={item.last_price}
                />
            </div>
            
            {/* Indicators Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <RsiIndicator value={item.rsi} />
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <MacdIndicator macd={item.macd} signal={item.macd_signal} />
                </div>
            </div>
            
            {/* SMA Indicators */}
            <div className="flex justify-center gap-4 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <SmaIndicator price={item.last_price} sma={item.sma20} period={20} />
                <SmaIndicator price={item.last_price} sma={item.sma50} period={50} />
            </div>
            
            {/* Pattern */}
            <div className="pt-2">
                <PatternBadge patternName={item.pattern_name} bullish={item.bullish} />
            </div>
        </div>
    );
});
StockCard.displayName = 'StockCard';

// --- Caching Configuration ---
const CACHE_KEY = 'dailyWatchlistData-v2';
const CACHE_TIMESTAMP_KEY = 'dailyWatchlistTimestamp-v2';
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12; // Changed to 12 for better grid layout

    useEffect(() => {
        const fetchData = async () => {
            setError(null);
            try {
                const cachedDataString = localStorage.getItem(CACHE_KEY);
                const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

                if (cachedDataString && cachedTimestamp) {
                    const cachedData = JSON.parse(cachedDataString);
                    setData(cachedData);
                    setLoading(false);

                    const isCacheStale = Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION_MS;
                    if (!isCacheStale) {
                        return;
                    }
                } else {
                    setLoading(true);
                }

                const { data: rpcData, error: rpcError } = await supabase.rpc('get_the_coming_trend_data');
                if (rpcError) {
                    console.error('RPC Error:', rpcError);
                    throw rpcError;
                }
                
                if (!rpcData || !Array.isArray(rpcData)) {
                    console.warn('RPC returned invalid data:', rpcData);
                    setData([]);
                } else {
                    const freshData = rpcData as DailyWatchlistItem[];
                    setData(freshData);
                    
                    if (freshData.length === 0) {
                        console.warn('No data returned from get_the_coming_trend_data');
                    } else {
                        // Save to cache only if we have valid data
                        localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
                        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
                    }
                }

            } catch (err: any) {
                console.error('Error fetching DailyWatchlist data:', err);
                setError(err.message || 'فشل تحميل البيانات');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = searchTerm === '' || 
                                  item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.stock_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFavorites = !showFavorites || isFavorite(item.symbol);
            return matchesSearch && matchesFavorites;
        });
    }, [data, searchTerm, showFavorites, isFavorite]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, showFavorites]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const nextForecastDate = useMemo(() => {
        if (data.length > 0) {
            const itemWithDate = data.find(item => item.next_forecast_date);
            return itemWithDate ? itemWithDate.next_forecast_date : null;
        }
        return null;
    }, [data]);

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <div className="text-center">
                <SpinnerIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('loading')}...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg shadow-md">
            <p><strong>{t('error_fetching_data')}:</strong> {error}</p>
        </div>
    );

    const showDisclaimer = settings.show_watchlist_disclaimer !== 'false';
    const disclaimerColor = settings.watchlist_disclaimer_color || 'text-gray-500 dark:text-gray-400';
    const disclaimerSize = settings.watchlist_disclaimer_size || 'text-sm';

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
                {nextForecastDate ? (
                    <>
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('forecasts_for')}</h2>
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                                {formatDate(nextForecastDate)}
                            </span>
                        </div>
                    </>
                ) : (
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                        <ChartBarIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        {t('daily_watchlist')}
                    </h1>
                )}
                {showDisclaimer && (
                    <p className={`${disclaimerSize} ${disclaimerColor}`} style={{
                        color: settings.watchlist_disclaimer_custom_color || undefined,
                        fontSize: settings.watchlist_disclaimer_custom_size ? `${settings.watchlist_disclaimer_custom_size}px` : undefined
                    }}>
                        {t('disclaimer_educational_purposes')}
                    </p>
                )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <input 
                        type="text"
                        placeholder={t('search_by_symbol_or_name')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    />
                    <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`flex items-center justify-center gap-2 py-3 px-6 rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${
                        showFavorites 
                            ? 'bg-yellow-400 border-2 border-yellow-500 text-black shadow-md' 
                            : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                >
                    <StarIcon className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
                    {t('favorites_filter')}
                </button>
            </div>
            
            {/* Stats Bar */}
            {filteredData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">إجمالي الأسهم</p>
                                <p className="text-3xl font-bold">{filteredData.length}</p>
                            </div>
                            <ChartBarIcon className="w-12 h-12 opacity-80" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">في المفضلة</p>
                                <p className="text-3xl font-bold">{filteredData.filter(item => isFavorite(item.symbol)).length}</p>
                            </div>
                            <StarIcon className="w-12 h-12 opacity-80 fill-current" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">أنماط مكتشفة</p>
                                <p className="text-3xl font-bold">{filteredData.filter(item => item.pattern_name).length}</p>
                            </div>
                            <SparklesIcon className="w-12 h-12 opacity-80" />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Cards Grid */}
            {paginatedData.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedData.map(item => (
                            <StockCard 
                                key={item.symbol}
                                item={item}
                                isFavorite={isFavorite}
                                toggleFavorite={toggleFavorite}
                                setPage={setPage}
                            />
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {t('page_x_of_y').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1}
                                    className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {t('previous')}
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages}
                                    className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {t('next')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-400">{t('no_results_found')}</p>
                </div>
            )}
        </div>
    );
};

export default DailyWatchlist;
