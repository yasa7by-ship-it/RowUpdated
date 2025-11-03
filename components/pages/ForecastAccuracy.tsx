import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { SpinnerIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon, CalendarDaysIcon, BuildingOfficeIcon } from '../icons';

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

// --- Helper Functions ---
const formatNumber = (num: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options }).format(num);
};

const formatPercent = (num: number | null | undefined) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return `${formatNumber(num)}%`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-CA', { timeZone: 'UTC' });
  } catch {
    return 'Invalid Date';
  }
};

// --- KPI Card Component (Investing.com Style) ---
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

// --- Progress Bar Component (Yahoo Finance Style) ---
const ProgressBar: React.FC<{ value: number; max: number; label: string; color?: string }> = memo(({ value, max, label, color = 'bg-blue-500' }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span>{label}</span>
        <span>{formatPercent(percentage)}</span>
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

// --- Hit/Miss Badge Component ---
const HitMissBadge: React.FC<{ hit: boolean }> = memo(({ hit }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
      hit 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }`}>
      {hit ? (
        <>
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Hit
        </>
      ) : (
        <>
          <XCircleIcon className="w-3 h-3 mr-1" />
          Miss
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ForecastAccuracyStats | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Set default date range (last 90 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: rpcError } = await supabase.rpc('get_forecast_accuracy_stats', {
          p_start_date: startDate,
          p_end_date: endDate,
        });

        if (rpcError) throw rpcError;
        if (!data) throw new Error('No data returned');

        setStats(data as ForecastAccuracyStats);
      } catch (err: any) {
        console.error('Error fetching forecast accuracy stats:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // Check permission
  if (!hasPermission('view:forecast_accuracy')) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-400">{t('access_denied')}</p>
      </div>
    );
  }

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ChartBarIcon className="w-8 h-8 text-nextrow-primary" />
          {t('forecast_accuracy_analysis')}
        </h1>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Overall Statistics - KPI Cards (Investing.com Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('total_forecasts')}
          value={overall.total_forecasts}
          color="blue"
          icon={<ChartBarIcon className="w-6 h-6" />}
        />
        <KPICard
          title={t('hit_rate')}
          value={formatPercent(overall.hit_rate)}
          subtitle={`${overall.hit_range_count} ${t('hit')} / ${overall.miss_range_count} ${t('miss')}`}
          color={overall.hit_rate >= 70 ? 'green' : overall.hit_rate >= 50 ? 'yellow' : 'red'}
          trend={overall.hit_rate >= 50 ? 'up' : 'down'}
          icon={<CheckCircleIcon className="w-6 h-6" />}
        />
        <KPICard
          title={t('average_error')}
          value={formatPercent(overall.avg_pct_error)}
          color={overall.avg_pct_error <= 5 ? 'green' : overall.avg_pct_error <= 10 ? 'yellow' : 'red'}
          trend={overall.avg_pct_error <= 5 ? 'up' : 'down'}
        />
        <KPICard
          title={t('average_confidence')}
          value={formatPercent(overall.avg_confidence)}
          color="blue"
        />
      </div>

      {/* Confidence Level Analysis - Progress Bars (Yahoo Finance Style) */}
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
              label={formatPercent(by_confidence.high_confidence.hit_rate)}
              color="bg-green-500"
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
              label={formatPercent(by_confidence.medium_confidence.hit_rate)}
              color="bg-yellow-500"
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
              label={formatPercent(by_confidence.low_confidence.hit_rate)}
              color="bg-red-500"
            />
          </div>
        </div>
      </div>

      {/* By Stock Performance Table (MarketWatch Style) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('by_stock_performance')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('column_symbol')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('total_forecasts')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('hit')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('miss')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('hit_rate')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('average_error')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {by_stock.slice(0, 20).map((stock, index) => (
                <tr key={stock.stock_symbol} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-nextrow-primary">{stock.stock_symbol}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{stock.total_forecasts}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-green-600 dark:text-green-400 font-semibold">{stock.hit_count}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-red-600 dark:text-red-400 font-semibold">{stock.miss_count}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`font-bold ${stock.hit_rate >= 70 ? 'text-green-600 dark:text-green-400' : stock.hit_rate >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatPercent(stock.hit_rate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    {formatPercent(stock.avg_pct_error)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Forecasts Table (TradingView Style) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('recent_forecasts')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('column_symbol')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('forecast_date')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('predicted_range')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('actual_range')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('hit')} / {t('miss')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('error_percentage')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('confidence')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recent_forecasts.map((forecast, index) => (
                <tr key={`${forecast.stock_symbol}-${forecast.forecast_date}`} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-nextrow-primary">{forecast.stock_symbol}</div>
                    {forecast.stock_name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{forecast.stock_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{formatDate(forecast.forecast_date)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {formatNumber(forecast.predicted_lo)} - {formatNumber(forecast.predicted_hi)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">
                      {formatNumber(forecast.actual_low)} - {formatNumber(forecast.actual_high)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <HitMissBadge hit={forecast.hit_range} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    {forecast.pct_error !== null ? (
                      <span className={forecast.pct_error <= 5 ? 'text-green-600 dark:text-green-400' : forecast.pct_error <= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>
                        {formatPercent(forecast.pct_error)}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                    {forecast.confidence !== null ? formatPercent(forecast.confidence) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ForecastAccuracy;

