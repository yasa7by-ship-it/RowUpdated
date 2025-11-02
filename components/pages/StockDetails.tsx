import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, StarIcon } from '../icons';
import type { PageState, StockDetailsPageData, TechnicalIndicators, ForecastCheckHistoryItem } from '../../types';

// --- Formatting Helpers ---
const formatNumber = (num: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options }).format(num);
};

const formatDate = (dateString: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) => {
    if (!dateString) return 'N/A';
    try {
        // Fix: Append time and timezone to ensure parsing as UTC, preventing off-by-one day errors.
        const date = new Date(dateString + 'T00:00:00Z');
        return date.toLocaleDateString('en-CA', { timeZone: 'UTC', ...options });
    } catch {
        return 'Invalid Date';
    }
};


// --- START: New Indicator Visualization Components ---

const IndicatorCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col ${className}`}>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center">{title}</h3>
        <div className="flex-grow flex flex-col justify-center items-center">
            {children}
        </div>
    </div>
);

const RsiGauge: React.FC<{ value: number | null }> = ({ value }) => {
    const { t } = useLanguage();
    if (value === null || isNaN(value)) return <div className="text-3xl font-bold text-gray-400">{t('n_a')}</div>;
    const angle = Math.max(-90, Math.min(90, (value / 100) * 180 - 90));
    const status = value > 70 ? t('overbought') : value < 30 ? t('oversold') : t('neutral_zone');
    const statusColor = value > 70 ? 'text-red-500' : value < 30 ? 'text-green-500' : 'text-gray-500';

    return (
        <div className="w-full flex flex-col items-center">
            <svg viewBox="0 0 120 70" className="w-40 h-auto -mb-2">
                <path d="M10 60 A50 50 0 0 1 110 60" fill="none" strokeWidth="12" className="stroke-gray-200 dark:stroke-gray-700"/>
                <path d="M10 60 A50 50 0 0 1 42.68 12.68" fill="none" strokeWidth="12" className="stroke-green-400"/>
                <path d="M77.32 12.68 A50 50 0 0 1 110 60" fill="none" strokeWidth="12" className="stroke-red-400" />
                <g transform={`rotate(${angle} 60 60)`}>
                    <path d="M60 60 L60 15" className="stroke-gray-800 dark:stroke-gray-200" strokeWidth="3" strokeLinecap="round" />
                </g>
                <circle cx="60" cy="60" r="5" className="fill-gray-800 dark:fill-gray-200" />
            </svg>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{formatNumber(value)}</p>
            <p className={`text-sm font-semibold ${statusColor}`}>{status}</p>
        </div>
    );
};

const StochasticGauge: React.FC<{ k: number | null, d: number | null }> = ({ k, d }) => {
    const { t } = useLanguage();
    const radiusK = 50;
    const radiusD = 38;
    const circumferenceK = 2 * Math.PI * radiusK;
    const circumferenceD = 2 * Math.PI * radiusD;
    const kOffset = k !== null && !isNaN(k) ? circumferenceK - (k / 100) * circumferenceK : circumferenceK;
    const dOffset = d !== null && !isNaN(d) ? circumferenceD - (d / 100) * circumferenceD : circumferenceD;
    
    return(
        <div className="relative w-36 h-36 flex items-center justify-center">
             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radiusK} fill="none" strokeWidth="12" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle cx="60" cy="60" r={radiusK} fill="none" strokeWidth="12" className="stroke-blue-500" strokeDasharray={circumferenceK} strokeDashoffset={kOffset} transform="rotate(-90 60 60)" strokeLinecap="round" />
                
                <circle cx="60" cy="60" r={radiusD} fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-700" />
                <circle cx="60" cy="60" r={radiusD} fill="none" strokeWidth="10" className="stroke-orange-400" strokeDasharray={circumferenceD} strokeDashoffset={dOffset} transform="rotate(-90 60 60)" strokeLinecap="round" />
            </svg>
            <div className="text-center">
                <div className="text-sm font-semibold">{t('percent_k')}: <span className="font-bold text-blue-500">{formatNumber(k)}</span></div>
                <div className="text-sm font-semibold">{t('percent_d')}: <span className="font-bold text-orange-500">{formatNumber(d)}</span></div>
            </div>
        </div>
    )
}

const WilliamsRBar: React.FC<{ value: number | null }> = ({ value }) => {
    const { t } = useLanguage();
    if (value === null || isNaN(value)) return <div className="text-3xl font-bold text-gray-400">{t('n_a')}</div>;
    const mappedValue = Math.abs(value);
    
    return (
        <div className="w-full px-4 flex flex-col items-center">
            <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                <div className="absolute top-0 left-0 h-full w-1/5 bg-red-400/30 rounded-l-full"></div>
                <div className="absolute top-0 right-0 h-full w-1/5 bg-green-400/30 rounded-r-full"></div>
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${mappedValue}%` }}></div>
            </div>
            <div className="flex justify-between w-full text-xs mt-1 text-gray-500">
                <span>{t('overbought_zone')} (-20)</span>
                <span>{t('oversold_zone')} (-80)</span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{formatNumber(value)}</p>
        </div>
    );
};

const BollingerBandsViz: React.FC<{ price: number | null, indicators: TechnicalIndicators }> = ({ price, indicators }) => {
    const { t } = useLanguage();
    const { boll_lower, boll_middle, boll_upper } = indicators;
    if (boll_lower === null || boll_upper === null || price === null) return <div className="text-3xl font-bold text-gray-400">{t('n_a')}</div>;
    
    const range = boll_upper - boll_lower;
    const pricePosition = range > 0 ? Math.max(0, Math.min(100, ((price - boll_lower) / range) * 100)) : 50;
    const middlePosition = range > 0 ? Math.max(0, Math.min(100, ((boll_middle! - boll_lower) / range) * 100)) : 50;

    return (
        <div className="w-full px-4 flex flex-col items-center h-full justify-center">
             <div className="w-full h-4 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 dark:from-blue-900/50 dark:via-blue-800/50 dark:to-blue-900/50 rounded-full relative my-2">
                <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-400 dark:bg-gray-500" style={{ left: `${middlePosition}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${pricePosition}% - 8px)` }}>
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                </div>
            </div>
             <div className="flex justify-between w-full text-center mt-2">
                <div><p className="text-xs text-gray-500">{t('lower_band')}</p><p className="font-bold font-mono">{formatNumber(boll_lower)}</p></div>
                <div><p className="text-xs text-gray-500">{t('middle_band')}</p><p className="font-bold font-mono">{formatNumber(boll_middle)}</p></div>
                <div><p className="text-xs text-gray-500">{t('upper_band')}</p><p className="font-bold font-mono">{formatNumber(boll_upper)}</p></div>
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-3">
                {price > boll_upper ? t('price_above_band') : price < boll_lower ? t('price_below_band') : t('price_inside_bands')}
            </p>
        </div>
    );
};

const MacdViz: React.FC<{ data: TechnicalIndicators }> = ({ data }) => {
    const { t } = useLanguage();
    const { macd, macd_signal, macd_histogram, macd_cross } = data;
    const histHeight = macd_histogram !== null ? Math.min(100, Math.abs(macd_histogram) * 30) : 0;
    const histColor = macd_histogram !== null && macd_histogram > 0 ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className="w-full flex flex-col items-center h-full justify-around">
            <div className="flex justify-around w-full text-center">
                <div><p className="text-xs text-gray-500">{t('macd_line')}</p><p className="font-bold text-lg">{formatNumber(macd)}</p></div>
                <div><p className="text-xs text-gray-500">{t('signal_line')}</p><p className="font-bold text-lg">{formatNumber(macd_signal)}</p></div>
            </div>
             <div className="flex flex-col items-center">
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700/50 flex items-end justify-center">
                    <div className={histColor} style={{ height: `${histHeight}%`, width: '40%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('histogram')}: <span className="font-bold">{formatNumber(macd_histogram)}</span></p>
            </div>
            <div>
                 <p className="text-xs text-gray-500 text-center">{t('cross_status')}</p>
                 {macd_cross === 1 ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{t('bullish_cross')}</span>
                 : macd_cross === -1 ? <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{t('bearish_cross')}</span>
                 : <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{t('no_cross')}</span>}
            </div>
        </div>
    );
};

const MovingAveragesViz: React.FC<{ price: number | null, indicators: TechnicalIndicators }> = ({ price, indicators }) => {
    const { t } = useLanguage();
    const averages = [
        { key: 'sma20', label: t('price_vs_sma_20') },
        { key: 'sma50', label: t('price_vs_sma_50') },
        { key: 'sma200', label: t('price_vs_sma_200') }
    ] as const;

    return (
        <div className="w-full space-y-4 h-full flex flex-col justify-around">
            {averages.map(({ key, label }) => {
                const value = indicators[key];
                if (value === null || price === null) {
                    return (
                        <div key={key} className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">{label}</span>
                            <span className="font-mono text-gray-400">{t('n_a')}</span>
                        </div>
                    );
                }
                const isAbove = price > value;
                return (
                    <div key={key} className="text-center">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                        <div className={`flex items-center justify-center gap-2 mt-1 text-lg font-bold ${isAbove ? 'text-green-500' : 'text-red-500'}`}>
                            {isAbove ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                            <span>{isAbove ? t('above') : t('below')}</span>
                        </div>
                        <p className="font-mono text-xs text-gray-400">({formatNumber(value)})</p>
                    </div>
                );
            })}
        </div>
    );
};

const VolatilityViz: React.FC<{ atr: number | null, vol20: number | null, price: number | null }> = ({ atr, vol20, price }) => {
    const { t } = useLanguage();
    const volPercentage = vol20 !== null ? vol20 * 100 : null;
    const atrPercentageOfPrice = (price !== null && atr !== null && price > 0) ? (atr / price) * 100 : null;

    return (
        <div className="w-full h-full flex flex-col justify-around text-center">
            <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('atr_14')}</p>
                <p className="text-3xl font-bold font-mono mt-1">{formatNumber(atr)}</p>
                {atrPercentageOfPrice !== null && (
                    <p className="text-xs text-gray-400">({formatNumber(atrPercentageOfPrice)}% of price)</p>
                )}
            </div>
            <div className="w-full px-4">
                <hr className="border-gray-200 dark:border-gray-700 my-3" />
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('historical_volatility_20d')}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 my-2">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: volPercentage ? `${volPercentage}%` : '0%' }}></div>
                </div>
                <p className="text-xl font-bold font-mono">{volPercentage !== null ? `${formatNumber(volPercentage)}%` : t('n_a')}</p>
            </div>
        </div>
    );
};

const IndicatorDashboard: React.FC<{ indicators: TechnicalIndicators | null, price: number | null }> = ({ indicators, price }) => {
    const { t } = useLanguage();
    if (!indicators) return <div className="text-center p-8">{t('no_indicator_data')}</div>;
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <IndicatorCard title={t('rsi_indicator_14')}><RsiGauge value={indicators.rsi} /></IndicatorCard>
            <IndicatorCard title={t('stochastic_oscillator')}><StochasticGauge k={indicators.stochastic_k} d={indicators.stochastic_d} /></IndicatorCard>
            <IndicatorCard title={t('williams_percent_r')}><WilliamsRBar value={indicators.williams_r} /></IndicatorCard>
            <IndicatorCard title={t('volatility_indicators')}><VolatilityViz atr={indicators.atr14} vol20={indicators.volatility_20} price={price} /></IndicatorCard>
            
            <IndicatorCard title={t('macd_indicator_full')} className="sm:col-span-1"><MacdViz data={indicators} /></IndicatorCard>
            <IndicatorCard title={t('moving_averages')} className="sm:col-span-1"><MovingAveragesViz price={price} indicators={indicators} /></IndicatorCard>
            
            <IndicatorCard title={t('bollinger_bands_20_2')} className="sm:col-span-2 lg:col-span-2"><BollingerBandsViz price={price} indicators={indicators} /></IndicatorCard>
        </div>
    );
}

// --- END: New Indicator Visualization Components ---

const RangeBarChart: React.FC<{ data: StockDetailsPageData['forecast_history']; setHoveredIndex: (index: number | null) => void; hoveredIndex: number | null }> = ({ data, setHoveredIndex, hoveredIndex }) => {
    const { t } = useLanguage();
    if (!data || data.length < 2) {
        return <div className="flex items-center justify-center h-full text-gray-500">{t('not_enough_data_for_chart')}</div>;
    }

    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const allValues = data.flatMap(d => [d.actual_low, d.actual_high, d.predicted_lo, d.predicted_hi]);
    const minVal = Math.min(...allValues) * 0.99;
    const maxVal = Math.max(...allValues) * 1.01;
    const yRange = maxVal - minVal;

    const scaleX = (index: number) => (index / (data.length - 1)) * chartWidth;
    const scaleY = (value: number) => {
        if (yRange === 0) return chartHeight / 2;
        return chartHeight - ((value - minVal) / yRange) * chartHeight;
    };

    const yAxisTicks = 5;
    const yTicks = Array.from({ length: yAxisTicks + 1 }, (_, i) => {
        const value = minVal + (i / yAxisTicks) * yRange;
        return { value, y: scaleY(value) };
    });
    
    const xTicks = data.length > 5 
        ? data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1)
        : data;

    const barGroupWidth = (chartWidth / (data.length > 1 ? data.length - 1 : 1)) * 0.7;
    const barWidth = barGroupWidth / 2;

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                <g transform={`translate(${padding.left}, ${padding.top})`}>
                    {/* Y-axis grid lines and labels */}
                    {yTicks.map(tick => (
                        <g key={tick.value} className="text-gray-400 dark:text-gray-500">
                            <line x1="0" x2={chartWidth} y1={tick.y} y2={tick.y} className="stroke-current opacity-20" strokeDasharray="4 2"/>
                            <text x="-10" y={tick.y} dy="0.32em" textAnchor="end" className="text-xs fill-current">{formatNumber(tick.value, {minimumFractionDigits:0})}</text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                     <g className="text-gray-500 dark:text-gray-400">
                        {xTicks.map((d) => (
                           <text key={d.forecast_date} x={scaleX(data.indexOf(d))} y={chartHeight + 25} textAnchor="middle" className="text-xs fill-current">
                               {formatDate(d.forecast_date, { month: 'short', day: 'numeric' })}
                           </text>
                        ))}
                    </g>
                    
                    {/* Data Bars */}
                    {data.map((d, i) => {
                        const xCenter = scaleX(i);
                        
                        const actualX = xCenter - barGroupWidth / 2;
                        const predictedX = xCenter;

                        const actualTop = Math.max(d.actual_high, d.actual_low);
                        const actualBottom = Math.min(d.actual_high, d.actual_low);
                        const actualY = scaleY(actualTop);
                        const actualHeight = scaleY(actualBottom) - actualY;

                        const predictedTop = Math.max(d.predicted_hi, d.predicted_lo);
                        const predictedBottom = Math.min(d.predicted_hi, d.predicted_lo);
                        const predictedY = scaleY(predictedTop);
                        const predictedHeight = scaleY(predictedBottom) - predictedY;
                        
                        const hoverAreaWidth = chartWidth / (data.length > 1 ? data.length - 1 : 1);

                        return (
                            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
                                {/* Transparent rect for hover area */}
                                <rect
                                    x={xCenter - hoverAreaWidth / 2}
                                    y="0"
                                    width={hoverAreaWidth}
                                    height={chartHeight}
                                    fill="transparent"
                                />
                                {/* Actual Range Bar */}
                                <rect
                                    x={actualX}
                                    y={actualY}
                                    width={barWidth}
                                    height={actualHeight > 0 ? actualHeight : 1}
                                    className="fill-green-500/60 stroke-green-600 dark:stroke-green-500"
                                    strokeWidth="1"
                                    rx="1"
                                />
                                {/* Predicted Range Bar */}
                                <rect
                                    x={predictedX}
                                    y={predictedY}
                                    width={barWidth}
                                    height={predictedHeight > 0 ? predictedHeight : 1}
                                    className="fill-blue-500/60 stroke-blue-600 dark:stroke-blue-500"
                                    strokeWidth="1"
                                    rx="1"
                                />
                            </g>
                        );
                    })}

                    {/* Hover Interaction Line */}
                    {hoveredIndex !== null && (
                        <line
                            x1={scaleX(hoveredIndex)} x2={scaleX(hoveredIndex)}
                            y1="0" y2={chartHeight}
                            className="stroke-gray-500 dark:stroke-gray-400"
                            strokeWidth="1" strokeDasharray="4 2"
                        />
                    )}
                </g>
            </svg>
            {hoveredIndex !== null && (
                <Tooltip data={data[hoveredIndex]} x={scaleX(hoveredIndex) + padding.left} chartWidth={width} />
            )}
            <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-4 bg-green-500/60 border border-green-600 dark:border-green-500 rounded-sm"></div>
                    <span>{t('actual_range')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-4 bg-blue-500/60 border border-blue-600 dark:border-blue-500 rounded-sm"></div>
                    <span>{t('predicted_range')}</span>
                </div>
            </div>
        </div>
    );
};

const Tooltip: React.FC<{ data: ForecastCheckHistoryItem; x: number; chartWidth: number }> = ({ data, x, chartWidth }) => {
    const { t } = useLanguage();
    const tooltipWidth = 200;
    const isRight = x > chartWidth / 2;
    const tooltipX = isRight ? x - tooltipWidth - 10 : x + 10;
    
    return (
        <div className="absolute top-0 pointer-events-none transition-transform duration-100" style={{ transform: `translateX(${tooltipX}px)`, width: tooltipWidth }}>
            <div className="p-3 bg-gray-800 dark:bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700">
                <p className="font-bold mb-2">{formatDate(data.forecast_date)}</p>
                <div className="text-xs space-y-1">
                    <p>{t('predicted_range')}: <span className="font-mono">{formatNumber(data.predicted_lo)} - {formatNumber(data.predicted_hi)}</span></p>
                    <p>{t('actual_range')}: <span className="font-mono">{formatNumber(data.actual_low)} - {formatNumber(data.actual_high)}</span></p>
                    <p>{t('actual_close')}: <span className="font-mono font-bold">{formatNumber(data.actual_close)}</span></p>
                    <p>{t('forecast_result')}: <span className={`font-bold ${data.hit_range ? 'text-green-400' : 'text-red-400'}`}>{data.hit_range ? t('hit') : t('miss')}</span></p>
                </div>
            </div>
        </div>
    );
}


// --- Caching Configuration ---
const CACHE_KEY_PREFIX = 'stockDetails-';
const CACHE_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour per symbol

interface StockDetailsProps {
  symbol: string;
  setPage: (page: PageState) => void;
}

const StockDetails: React.FC<StockDetailsProps> = ({ symbol, setPage }) => {
    const { t } = useLanguage();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [data, setData] = useState<StockDetailsPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('indicators');
    const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
    
    useEffect(() => {
        document.title = `${t('stock_details')} for ${symbol} | ${t('site_title')}`;
    }, [symbol, t]);
    
    const fetchData = useCallback(async () => {
        setError(null);
        
        // Check cache for this specific symbol
        const cacheKey = `${CACHE_KEY_PREFIX}${symbol}`;
        const timestampKey = `${cacheKey}-timestamp`;
        
        try {
            const cachedDataString = localStorage.getItem(cacheKey);
            const cachedTimestamp = localStorage.getItem(timestampKey);

            if (cachedDataString && cachedTimestamp) {
                const cachedData = JSON.parse(cachedDataString);
                setData(cachedData);
                setLoading(false);

                const isCacheStale = Date.now() - parseInt(cachedTimestamp) > CACHE_DURATION_MS;
                if (!isCacheStale) {
                    return; // Use cache
                }
            } else {
                setLoading(true);
            }

            // Fetch fresh data
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_stock_details_page_data', { p_symbol: symbol }).single();
            if (rpcError) throw rpcError;
            
            const freshData = rpcData as StockDetailsPageData;
            setData(freshData);

            // Update cache
            localStorage.setItem(cacheKey, JSON.stringify(freshData));
            localStorage.setItem(timestampKey, Date.now().toString());

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (loading) return <div className="flex justify-center items-center h-full p-8"><SpinnerIcon className="w-10 h-10" /></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-800 rounded-md">Error: {error}</div>;
    if (!data || !data.details) return <div className="p-4 text-center">No data found for symbol {symbol}.</div>;
    
    const { details, next_forecast, forecast_history, latest_indicators, recent_patterns } = data;
    const favorited = isFavorite(details.symbol);

    return (
        <div className="space-y-6">
            <div>
                <button onClick={() => setPage('stock_analysis')} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4">
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('back_to_analysis')}
                </button>
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{details.name} ({details.symbol})</h1>
                    <button 
                        onClick={() => toggleFavorite(details.symbol)} 
                        className={`p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors ${favorited ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        aria-label={favorited ? t('remove_from_favorites') : t('add_to_favorites')}
                    >
                        <StarIcon className={`w-8 h-8 ${favorited ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">{t('last_price')}</p>
                    <p className="text-2xl font-bold">{formatNumber(details.price)}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">{t('change')}</p>
                    <p className={`text-2xl font-bold ${details.change && details.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(details.change)} ({formatNumber(details.change_percent)}%)
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">{t('volume')}</p>
                    <p className="text-2xl font-bold">{formatNumber(details.volume, { notation: 'compact' })}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <p className="text-sm text-gray-500">{t('market_cap')}</p>
                    <p className="text-2xl font-bold">{formatNumber(details.market_cap, { notation: 'compact' })}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('historical_performance_15d')}</h2>
                    <RangeBarChart data={forecast_history} hoveredIndex={hoveredChartIndex} setHoveredIndex={setHoveredChartIndex} />
                </div>
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center text-center">
                    <h2 className="text-xl font-semibold mb-2">{t('next_day_forecast')}</h2>
                    {next_forecast ? (
                        <>
                            <p className="text-4xl font-bold my-2">
                                <span className="text-green-500">{formatNumber(next_forecast.predicted_hi)}</span>
                                <span className="mx-3 text-gray-400 dark:text-gray-500">-</span>
                                <span className="text-red-500">{formatNumber(next_forecast.predicted_lo)}</span>
                            </p>
                            <p className="text-4xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">
                                {formatDate(next_forecast.forecast_date)}
                            </p>
                        </>
                    ) : <p>{t('no_forecast_available')}</p>}
                </div>
            </div>

            <div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('indicators')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'indicators' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('technical_indicators_tab')}</button>
                        <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('forecast_history_tab')}</button>
                        <button onClick={() => setActiveTab('patterns')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'patterns' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('candle_patterns_tab')}</button>
                    </nav>
                </div>
                <div className="py-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                    {activeTab === 'indicators' && (
                        <div className="px-4">
                           <IndicatorDashboard indicators={latest_indicators} price={details.price} />
                        </div>
                    )}
                     {activeTab === 'history' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                            <table className="min-w-full text-center">
                                <thead className="bg-gray-100 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('forecast_date')}</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('forecast_result')}</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('predicted_low')}</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('predicted_high')}</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('actual_low')}</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('actual_high')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {forecast_history.map((item) => (
                                        <tr key={item.forecast_date}>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg text-left text-gray-800 dark:text-gray-200">{formatDate(item.forecast_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${item.hit_range ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                    {item.hit_range ? t('hit') : t('miss')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-mono">{formatNumber(item.predicted_lo)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-mono">{formatNumber(item.predicted_hi)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-mono">{formatNumber(item.actual_low)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-mono">{formatNumber(item.actual_high)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                     {activeTab === 'patterns' && (
                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                             <table className="min-w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('date')}</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('pattern')}</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300 uppercase">{t('sentiment')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {recent_patterns.map((item, index) => (
                                        <tr key={`${item.date}-${item.pattern_name}`} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg text-left text-gray-800 dark:text-gray-200">{formatDate(item.date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg text-left text-gray-800 dark:text-gray-200">{item.pattern_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-lg">
                                                 <span className={`px-3 py-1 text-sm font-semibold rounded-full ${item.bullish ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                                    {item.bullish ? t('bullish') : t('bearish')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockDetails;
