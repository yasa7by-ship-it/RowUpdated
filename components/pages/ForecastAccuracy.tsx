import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon, StarIcon, SparklesIcon } from '../icons';

// --- Types ---
interface ForecastAccuracyStats {
  overall: {
    total_forecasts: number;
    hit_range_count: number;
    miss_range_count: number;
    hit_rate: number;
    avg_abs_error: number;
    avg_pct_error: number;
    avg_confidence: number;
  };
  by_stock: Array<{
    stock_symbol: string;
    total_forecasts: number;
    hit_count: number;
    miss_count: number;
    hit_rate: number;
    avg_abs_error: number;
    avg_pct_error: number;
    avg_confidence: number;
  }>;
  by_date: Array<{
    forecast_date: string;
    total_forecasts: number;
    hit_count: number;
    hit_rate: number;
  }>;
  by_confidence: {
    high_confidence: { count: number; hit_rate: number };
    medium_confidence: { count: number; hit_rate: number };
    low_confidence: { count: number; hit_rate: number };
  };
  recent_forecasts: Array<{
    stock_symbol: string;
    stock_name: string | null;
    forecast_date: string;
    predicted_lo: number;
    predicted_hi: number;
    actual_low: number;
    actual_high: number;
    actual_close: number | null;
    hit_range: boolean;
    abs_error: number | null;
    pct_error: number | null;
    confidence: number | null;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
}

interface AdvancedStats {
  errorRange: any;
  rangeSize: any;
  timeTrends: any;
  dayOfWeek: any[];
  biasAnalysis: any;
  extremeForecasts: any;
}

// --- Helper Functions ---
const formatNumber = (num: number | null | undefined, t?: (key: string) => string, options: Intl.NumberFormatOptions = {}) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return t ? t('not_available') : 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options }).format(num);
};

const formatPercent = (num: number | null | undefined, t?: (key: string) => string) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return t ? t('not_available') : 'N/A';
  return `${formatNumber(num, t)}%`;
};

const formatDate = (dateString: string, t?: (key: string) => string) => {
  if (!dateString) return t ? t('not_available') : 'N/A';
  try {
    return new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-CA', { timeZone: 'UTC' });
  } catch {
    return t ? t('invalid_date') : 'Invalid Date';
  }
};

// --- Circular Progress Component ---
const CircularProgress: React.FC<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}> = memo(({ value, max, size = 80, strokeWidth = 8, color = 'text-blue-600', label }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${color} transition-all duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${color}`}>{Math.round(percentage)}%</span>
        </div>
      </div>
      {label && <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">{label}</span>}
    </div>
  );
});
CircularProgress.displayName = 'CircularProgress';

// --- Mini KPI Card Component ---
const MiniKPICard: React.FC<{
  title: string;
  value: string | number;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  icon?: React.ReactNode;
}> = memo(({ title, value, color = 'blue', icon }) => {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className={`rounded-lg border-2 p-3 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80 mb-1">{title}</p>
          <p className="text-lg font-black">{value}</p>
        </div>
        {icon && <div className="ml-2">{icon}</div>}
      </div>
    </div>
  );
});
MiniKPICard.displayName = 'MiniKPICard';

// --- KPI Card Component ---
const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
  icon?: React.ReactNode;
}> = memo(({ title, value, subtitle, trend, color = 'blue', icon }) => {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[color]} transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">{title}</p>
          <p className="text-2xl font-black">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
        </div>
        {icon && <div className="ml-2">{icon}</div>}
        {trend && trend !== 'neutral' && (
          <div className={`ml-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
          </div>
        )}
      </div>
    </div>
  );
});
KPICard.displayName = 'KPICard';

// --- Progress Bar Component ---
const ProgressBar: React.FC<{ value: number; max: number; label: string; color?: string; t?: (key: string) => string }> = memo(({ value, max, label, color = 'bg-blue-500', t }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span>{label}</span>
        <span>{formatPercent(percentage, t)}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// --- Badge Component ---
const Badge: React.FC<{ label: string; value: string | number; color?: string }> = memo(({ label, value, color = 'bg-gray-100 dark:bg-gray-700' }) => {
  return (
    <div className={`${color} rounded-lg px-3 py-2 text-center`}>
      <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
});
Badge.displayName = 'Badge';

// --- Hit/Miss Badge Component ---
const HitMissBadge: React.FC<{ hit: boolean; t: (key: string) => string }> = memo(({ hit, t }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
      hit 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }`}>
      {hit ? (
        <>
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          {t('hit')}
        </>
      ) : (
        <>
          <XCircleIcon className="w-3 h-3 mr-1" />
          {t('miss')}
        </>
      )}
    </span>
  );
});
HitMissBadge.displayName = 'HitMissBadge';

// --- Main Component ---
const ForecastAccuracy: React.FC = () => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ForecastAccuracyStats | null>(null);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(null);
  const [advancedStatsPerStock, setAdvancedStatsPerStock] = useState<AdvancedStats | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [byStockPage, setByStockPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const itemsPerPage = 15;

  // Map day names from database to translation keys
  const getDayNameTranslation = (dayName: string | null | undefined): string => {
    if (!dayName) return '';
    const dayKey = dayName.toLowerCase();
    return t(dayKey) || dayName;
  };

  // Set default date range (last 90 days)
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  const defaultStartDate = start.toISOString().split('T')[0];
  const defaultEndDate = end.toISOString().split('T')[0];

  // Fetch data using separate RPC functions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch basic stats
        const [overallResult, byStockResult, byDateResult, byConfidenceResult] = await Promise.all([
          supabase.rpc('get_forecast_accuracy_overall', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_accuracy_by_stock', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_accuracy_by_date', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_accuracy_by_confidence', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
        ]);

        // Fetch advanced stats (overall level)
        const [errorRangeResult, rangeSizeResult, timeTrendsResult, dayOfWeekResult, biasResult, extremeResult] = await Promise.all([
          supabase.rpc('get_forecast_error_range_stats', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_range_size_stats', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_time_trends', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_day_of_week_stats', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_bias_analysis', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
          }),
          supabase.rpc('get_forecast_extreme_analysis', {
            p_start_date: defaultStartDate,
            p_end_date: defaultEndDate,
            p_limit: 10,
          }),
        ]);

        // Check for errors
        if (overallResult.error) throw overallResult.error;
        if (byStockResult.error) throw byStockResult.error;
        if (byDateResult.error) throw byDateResult.error;
        if (byConfidenceResult.error) throw byConfidenceResult.error;

        // Fetch per-stock advanced stats if stock is selected
        let perStockStats = null;
        if (selectedStock) {
          const [errorRangePerStock, rangeSizePerStock, timeTrendsPerStock, biasPerStock] = await Promise.all([
            supabase.rpc('get_forecast_error_range_stats_by_stock', {
              p_stock_symbol: selectedStock,
              p_start_date: defaultStartDate,
              p_end_date: defaultEndDate,
            }),
            supabase.rpc('get_forecast_range_size_stats_by_stock', {
              p_stock_symbol: selectedStock,
              p_start_date: defaultStartDate,
              p_end_date: defaultEndDate,
            }),
            supabase.rpc('get_forecast_time_trends_by_stock', {
              p_stock_symbol: selectedStock,
              p_start_date: defaultStartDate,
              p_end_date: defaultEndDate,
            }),
            supabase.rpc('get_forecast_bias_analysis_by_stock', {
              p_stock_symbol: selectedStock,
              p_start_date: defaultStartDate,
              p_end_date: defaultEndDate,
            }),
          ]);

          if (!errorRangePerStock.error && !rangeSizePerStock.error && !timeTrendsPerStock.error && !biasPerStock.error) {
            perStockStats = {
              errorRange: errorRangePerStock.data,
              rangeSize: rangeSizePerStock.data,
              timeTrends: timeTrendsPerStock.data,
              dayOfWeek: [],
              biasAnalysis: biasPerStock.data,
              extremeForecasts: null,
            };
          }
        }

        // Combine results
        const combinedStats: ForecastAccuracyStats = {
          overall: overallResult.data || {
            total_forecasts: 0,
            hit_range_count: 0,
            miss_range_count: 0,
            hit_rate: 0,
            avg_abs_error: 0,
            avg_pct_error: 0,
            avg_confidence: 0,
          },
          by_stock: byStockResult.data || [],
          by_date: byDateResult.data || [],
          by_confidence: byConfidenceResult.data || {
            high_confidence: { count: 0, hit_rate: 0 },
            medium_confidence: { count: 0, hit_rate: 0 },
            low_confidence: { count: 0, hit_rate: 0 },
          },
          recent_forecasts: [],
          date_range: {
            start_date: defaultStartDate,
            end_date: defaultEndDate,
          },
        };

        const combinedAdvanced: AdvancedStats = {
          errorRange: errorRangeResult.data,
          rangeSize: rangeSizeResult.data,
          timeTrends: timeTrendsResult.data,
          dayOfWeek: dayOfWeekResult.data || [],
          biasAnalysis: biasResult.data,
          extremeForecasts: extremeResult.data,
        };

        setStats(combinedStats);
        setAdvancedStats(combinedAdvanced);
        setAdvancedStatsPerStock(perStockStats);
      } catch (err: any) {
        console.error('Error fetching forecast accuracy stats:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStock, defaultStartDate, defaultEndDate]);

  // Filter by stock data
  const filteredByStockData = useMemo(() => {
    if (!stats?.by_stock) return [];
    let filtered = stats.by_stock.filter((stock) => {
      const matchesSearch = searchTerm === '' || 
                            stock.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorites = !showFavorites || isFavorite(stock.stock_symbol);
      return matchesSearch && matchesFavorites;
    });
    return filtered;
  }, [stats?.by_stock, searchTerm, showFavorites, isFavorite]);

  // Pagination calculations - MUST be before any conditional returns (React Hooks rule)
  const byStockTotalPages = useMemo(() => {
    return Math.ceil(filteredByStockData.length / itemsPerPage);
  }, [filteredByStockData.length]);

  const byStockPaginated = useMemo(() => {
    const startIndex = (byStockPage - 1) * itemsPerPage;
    return filteredByStockData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredByStockData, byStockPage]);


  // Check permission
  if (!hasPermission('view:forecast_accuracy')) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-400">{t('access_denied')}</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <SpinnerIcon className="w-12 h-12 text-nextrow-primary mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="font-semibold text-red-700 dark:text-red-400">{t('error_fetching_data')}</p>
        <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-400">{t('no_data_available')}</p>
      </div>
    );
  }

  const { overall, by_stock, by_date, by_confidence, recent_forecasts } = stats;
  const adv = advancedStats;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ChartBarIcon className="w-8 h-8 text-nextrow-primary" />
          {t('forecast_accuracy_analysis')}
        </h1>
      </div>

      {/* Overall Statistics - KPI Cards - Main Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('total_forecasts')}
          value={overall.total_forecasts}
          color="blue"
          icon={<ChartBarIcon className="w-6 h-6" />}
        />
        <KPICard
          title={t('hit_rate')}
          value={formatPercent(overall.hit_rate, t)}
          subtitle={`${overall.hit_range_count} ${t('hit')} / ${overall.miss_range_count} ${t('miss')}`}
          color={overall.hit_rate >= 70 ? 'green' : overall.hit_rate >= 50 ? 'yellow' : 'red'}
          trend={overall.hit_rate >= 50 ? 'up' : 'down'}
          icon={<CheckCircleIcon className="w-6 h-6" />}
        />
        <KPICard
          title={t('average_error')}
          value={formatPercent(overall.avg_pct_error, t)}
          color={overall.avg_pct_error <= 5 ? 'green' : overall.avg_pct_error <= 10 ? 'yellow' : 'red'}
          trend={overall.avg_pct_error <= 5 ? 'up' : 'down'}
        />
        <KPICard
          title={t('average_confidence')}
          value={formatPercent(overall.avg_confidence, t)}
          color="blue"
        />
      </div>

      {/* Secondary Indicators - All Together */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Range Analysis */}
        {adv?.errorRange && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('error_range_analysis')}</h2>
            <div className="grid grid-cols-5 gap-3">
              <MiniKPICard
                title={t('very_low_error')}
                value={adv.errorRange.very_low_error?.count || 0}
                color="green"
              />
              <MiniKPICard
                title={t('low_error_range')}
                value={adv.errorRange.low_error?.count || 0}
                color="yellow"
              />
              <MiniKPICard
                title={t('medium_error_range')}
                value={adv.errorRange.medium_error?.count || 0}
                color="yellow"
              />
              <MiniKPICard
                title={t('high_error_range')}
                value={adv.errorRange.high_error?.count || 0}
                color="red"
              />
              <MiniKPICard
                title={t('very_high_error')}
                value={adv.errorRange.very_high_error?.count || 0}
                color="red"
              />
            </div>
          </div>
        )}

        {/* Range Size Analysis */}
        {adv?.rangeSize && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('range_size_analysis')}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <CircularProgress
                  value={adv.rangeSize.narrow_range?.hit_rate || 0}
                  max={100}
                  size={60}
                  color="text-green-600 dark:text-green-400"
                />
                <p className="text-xs mt-2 font-semibold">{t('narrow_range')}</p>
                <Badge label={t('forecasts_count')} value={adv.rangeSize.narrow_range?.count || 0} />
              </div>
              <div className="text-center">
                <CircularProgress
                  value={adv.rangeSize.medium_range?.hit_rate || 0}
                  max={100}
                  size={60}
                  color="text-yellow-600 dark:text-yellow-400"
                />
                <p className="text-xs mt-2 font-semibold">{t('medium_range')}</p>
                <Badge label={t('forecasts_count')} value={adv.rangeSize.medium_range?.count || 0} />
              </div>
              <div className="text-center">
                <CircularProgress
                  value={adv.rangeSize.wide_range?.hit_rate || 0}
                  max={100}
                  size={60}
                  color="text-blue-600 dark:text-blue-400"
                />
                <p className="text-xs mt-2 font-semibold">{t('wide_range')}</p>
                <Badge label={t('forecasts_count')} value={adv.rangeSize.wide_range?.count || 0} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Trends Comparison */}
      {adv?.timeTrends && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('time_trends')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2">{t('first_period')}</p>
              <KPICard
                title={t('hit_rate')}
                value={formatPercent(adv.timeTrends.first_period?.hit_rate || 0, t)}
                subtitle={`${adv.timeTrends.first_period?.total_forecasts || 0} ${t('forecasts')}`}
                color={adv.timeTrends.first_period?.hit_rate >= 70 ? 'green' : adv.timeTrends.first_period?.hit_rate >= 50 ? 'yellow' : 'red'}
              />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">{t('second_period')}</p>
              <KPICard
                title={t('hit_rate')}
                value={formatPercent(adv.timeTrends.second_period?.hit_rate || 0, t)}
                subtitle={`${adv.timeTrends.second_period?.total_forecasts || 0} ${t('forecasts')}`}
                color={adv.timeTrends.second_period?.hit_rate >= 70 ? 'green' : adv.timeTrends.second_period?.hit_rate >= 50 ? 'yellow' : 'red'}
              />
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">{t('trend')}</p>
              <div className={`p-4 rounded-lg border-2 ${
                adv.timeTrends.trend === 'improving' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                adv.timeTrends.trend === 'declining' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                <p className="text-lg font-black">
                  {adv.timeTrends.trend === 'improving' ? t('trend_improving') :
                   adv.timeTrends.trend === 'declining' ? t('trend_declining') :
                   t('trend_stable')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day of Week Analysis */}
      {adv?.dayOfWeek && adv.dayOfWeek.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('day_of_week_analysis')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {adv.dayOfWeek.map((day: any) => (
              <div key={day.day_of_week} className="text-center">
                <p className="text-xs font-semibold mb-2">{getDayNameTranslation(day.day_name)}</p>
                <CircularProgress
                  value={day.hit_rate || 0}
                  max={100}
                  size={60}
                  color="text-blue-600 dark:text-blue-400"
                />
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{day.total_forecasts} {t('forecasts')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bias Analysis */}
      {adv?.biasAnalysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('bias_analysis')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title={t('overestimated')}
              value={adv.biasAnalysis.overestimated?.count || 0}
              subtitle={formatPercent(adv.biasAnalysis.overestimated?.percentage || 0, t)}
              color="red"
            />
            <KPICard
              title={t('underestimated')}
              value={adv.biasAnalysis.underestimated?.count || 0}
              subtitle={formatPercent(adv.biasAnalysis.underestimated?.percentage || 0, t)}
              color="yellow"
            />
            <KPICard
              title={t('within_range')}
              value={adv.biasAnalysis.within_range?.count || 0}
              subtitle={formatPercent(adv.biasAnalysis.within_range?.percentage || 0, t)}
              color="green"
            />
          </div>
        </div>
      )}

      {/* Extreme Forecasts */}
      {adv?.extremeForecasts && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('extreme_forecasts')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-400">{t('most_accurate')}</h3>
              <div className="space-y-2">
                {adv.extremeForecasts.most_accurate?.slice(0, 5).map((forecast: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div>
                      <span className="font-semibold">{forecast.stock_symbol}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">{formatDate(forecast.forecast_date, t)}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatPercent(forecast.pct_error, t)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700 dark:text-red-400">{t('least_accurate')}</h3>
              <div className="space-y-2">
                {adv.extremeForecasts.least_accurate?.slice(0, 5).map((forecast: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <div>
                      <span className="font-semibold">{forecast.stock_symbol}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">{formatDate(forecast.forecast_date, t)}</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{formatPercent(forecast.pct_error, t)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Stock Advanced Stats */}
      {selectedStock && advancedStatsPerStock && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('advanced_statistics')} - {selectedStock}
          </h2>
          
          {/* Per-Stock Error Range */}
          {advancedStatsPerStock.errorRange && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">{t('error_range_analysis')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MiniKPICard
                  title={t('very_low_error')}
                  value={advancedStatsPerStock.errorRange.very_low_error?.count || 0}
                  color="green"
                />
                <MiniKPICard
                  title={t('low_error_range')}
                  value={advancedStatsPerStock.errorRange.low_error?.count || 0}
                  color="yellow"
                />
                <MiniKPICard
                  title={t('medium_error_range')}
                  value={advancedStatsPerStock.errorRange.medium_error?.count || 0}
                  color="yellow"
                />
                <MiniKPICard
                  title={t('high_error_range')}
                  value={advancedStatsPerStock.errorRange.high_error?.count || 0}
                  color="red"
                />
                <MiniKPICard
                  title={t('very_high_error')}
                  value={advancedStatsPerStock.errorRange.very_high_error?.count || 0}
                  color="red"
                />
              </div>
            </div>
          )}

          {/* Per-Stock Bias Analysis */}
          {advancedStatsPerStock.biasAnalysis && (
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('bias_analysis')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title={t('overestimated')}
                  value={advancedStatsPerStock.biasAnalysis.overestimated?.count || 0}
                  subtitle={formatPercent(advancedStatsPerStock.biasAnalysis.overestimated?.percentage || 0, t)}
                  color="red"
                />
                <KPICard
                  title={t('underestimated')}
                  value={advancedStatsPerStock.biasAnalysis.underestimated?.count || 0}
                  subtitle={formatPercent(advancedStatsPerStock.biasAnalysis.underestimated?.percentage || 0, t)}
                  color="yellow"
                />
                <KPICard
                  title={t('within_range')}
                  value={advancedStatsPerStock.biasAnalysis.within_range?.count || 0}
                  subtitle={formatPercent(advancedStatsPerStock.biasAnalysis.within_range?.percentage || 0, t)}
                  color="green"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confidence Level Analysis - Progress Bars */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('by_confidence_level')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">{t('high_confidence')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {by_confidence.high_confidence.count} {t('forecasts')}
              </span>
            </div>
            <ProgressBar 
              value={by_confidence.high_confidence.hit_rate} 
              max={100} 
              label={formatPercent(by_confidence.high_confidence.hit_rate, t)}
              color="bg-green-500"
              t={t}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{t('medium_confidence')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {by_confidence.medium_confidence.count} {t('forecasts')}
              </span>
            </div>
            <ProgressBar 
              value={by_confidence.medium_confidence.hit_rate} 
              max={100} 
              label={formatPercent(by_confidence.medium_confidence.hit_rate, t)}
              color="bg-yellow-500"
              t={t}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">{t('low_confidence')}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {by_confidence.low_confidence.count} {t('forecasts')}
              </span>
            </div>
            <ProgressBar 
              value={by_confidence.low_confidence.hit_rate} 
              max={100} 
              label={formatPercent(by_confidence.low_confidence.hit_rate, t)}
              color="bg-red-500"
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Stock Performance Table - Enhanced Design */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('by_stock_performance')}</h2>
          </div>
          
          {/* Search and Filters Tools */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest w-10" title={t('column_favorite')}>
                    <span className="text-base">★</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[80px]">
                    {t('column_symbol')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[70px]">
                    {t('total_forecasts')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[70px]">
                    <span className="text-green-600 dark:text-green-400">{t('hit')}</span>
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[70px]">
                    <span className="text-red-600 dark:text-red-400">{t('miss')}</span>
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[90px]">
                    {t('hit_rate')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[90px]">
                    {t('average_error')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[90px]">
                    {t('average_confidence')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(byStockPaginated || []).map((stock, index) => (
                  <tr 
                    key={stock.stock_symbol} 
                    onClick={() => {
                      if (selectedStock === stock.stock_symbol) {
                        setSelectedStock(''); // Deselect if clicking the same stock
                      } else {
                        setSelectedStock(stock.stock_symbol); // Select the stock
                      }
                    }}
                    className={`group transition-all duration-200 cursor-pointer ${
                      index % 2 === 0 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50/50 dark:bg-gray-800/50'
                    } hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md ${
                      selectedStock === stock.stock_symbol ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(stock.stock_symbol);
                        }}
                        className={`p-1 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200 transform hover:scale-110 ${
                          isFavorite(stock.stock_symbol) 
                            ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        <StarIcon className={`w-4 h-4 ${isFavorite(stock.stock_symbol) ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-left">
                      <div className="text-xs font-semibold text-nextrow-primary hover:text-nextrow-primary/80 transition-colors">
                        {stock.stock_symbol}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-medium">{stock.total_forecasts}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        {stock.hit_count}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        {stock.miss_count}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        stock.hit_rate >= 70 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : stock.hit_rate >= 50 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {formatPercent(stock.hit_rate, t)}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className={`text-xs font-bold ${
                        stock.avg_pct_error <= 5 
                          ? 'text-green-600 dark:text-green-400' 
                          : stock.avg_pct_error <= 10 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatPercent(stock.avg_pct_error, t)}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {formatPercent(stock.avg_confidence, t)}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!byStockPaginated || byStockPaginated.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('no_data_available')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {byStockTotalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{((byStockPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(byStockPage * itemsPerPage, filteredByStockData.length)}</span> {t('of') || 'of'} <span className="font-semibold">{filteredByStockData.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setByStockPage(prev => Math.max(1, prev - 1))}
                    disabled={byStockPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('previous')}
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: byStockTotalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === byStockTotalPages ||
                        (page >= byStockPage - 1 && page <= byStockPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setByStockPage(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                              byStockPage === page
                                ? 'bg-nextrow-primary text-white'
                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === byStockPage - 2 ||
                        page === byStockPage + 2
                      ) {
                        return <span key={page} className="text-gray-400 dark:text-gray-600">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() => setByStockPage(prev => Math.min(byStockTotalPages, prev + 1))}
                    disabled={byStockPage === byStockTotalPages}
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

export default ForecastAccuracy;
