import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  SpinnerIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon, 
  ArrowUpIcon, ArrowDownIcon, CalendarDaysIcon, BuildingOfficeIcon,
  TrendingUpIcon, TrendingDownIcon
} from '../icons';

// --- Types ---
interface HistorySummary {
  total_records: number;
  unique_stocks: number;
  date_range: {
    first_date: string;
    last_date: string;
    total_days: number;
  };
  hit_stats: {
    total_hits: number;
    total_misses: number;
    hit_rate: number;
  };
  error_stats: {
    avg_abs_error: number;
    max_abs_error: number;
    min_abs_error: number;
    avg_pct_error: number;
    max_pct_error: number;
  };
  confidence_stats: {
    avg_confidence: number;
    max_confidence: number;
    min_confidence: number;
    high_confidence_count: number;
    medium_confidence_count: number;
    low_confidence_count: number;
  };
}

interface MonthlyPerformance {
  year: number;
  month: number;
  month_name: string;
  total_forecasts: number;
  hits: number;
  misses: number;
  hit_rate: number;
  avg_error: number;
}

interface StockLeader {
  stock_symbol: string;
  stock_name: string | null;
  total_forecasts: number;
  hit_rate: number;
  avg_error: number;
}

interface AccuracyTrends {
  weekly_trend: Array<{
    week: string;
    total_forecasts: number;
    hit_rate: number;
  }>;
  error_distribution: {
    very_low_error: number;
    low_error: number;
    medium_error: number;
    high_error: number;
    very_high_error: number;
  };
}

// --- Helper Functions ---
const formatNumber = (num: number | null | undefined, decimals: number = 2) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
};

const formatPercent = (num: number | null | undefined) => {
  if (num === null || typeof num === 'undefined' || isNaN(num)) return 'N/A';
  return `${formatNumber(num)}%`;
};

// --- Mini KPI Card Component ---
const MiniKPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'indigo';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}> = memo(({ title, value, subtitle, trend, color = 'blue', size = 'sm', icon }) => {
  const colorClasses = {
    green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
    red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} ${sizeClasses[size]} transition-all hover:shadow-md hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 truncate">{title}</p>
          <p className={`${size === 'sm' ? 'text-xl' : 'text-2xl'} font-black mt-1 truncate`}>{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-70 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center mt-1 text-xs ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <ArrowUpIcon className="w-3 h-3 mr-1" /> : <ArrowDownIcon className="w-3 h-3 mr-1" />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {icon && <div className="ml-2 flex-shrink-0">{icon}</div>}
      </div>
    </div>
  );
});
MiniKPICard.displayName = 'MiniKPICard';

// --- Compact Progress Bar ---
const CompactProgressBar: React.FC<{ 
  value: number; 
  max: number; 
  label: string; 
  color?: string;
  showLabel?: boolean;
}> = memo(({ value, max, label, color = 'bg-blue-500', showLabel = true }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="truncate">{label}</span>
          <span className="ml-2 flex-shrink-0">{formatPercent(percentage)}</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
CompactProgressBar.displayName = 'CompactProgressBar';

// --- Mini Trend Chart (CSS only) ---
const MiniTrendChart: React.FC<{ 
  data: number[]; 
  height?: number;
  color?: string;
}> = memo(({ data, height = 40, color = '#3b82f6' }) => {
  if (!data || data.length === 0) return <div className="h-10 flex items-center text-xs text-gray-400">No data</div>;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1 || 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={color}
          opacity="0.2"
        />
      </svg>
    </div>
  );
});
MiniTrendChart.displayName = 'MiniTrendChart';

// --- Badge Component ---
const Badge: React.FC<{ 
  label: string; 
  value: number | string; 
  variant?: 'success' | 'warning' | 'danger' | 'info';
}> = memo(({ label, value, variant = 'info' }) => {
  const variantClasses = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${variantClasses[variant]}`}>
      <span className="mr-1">{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
});
Badge.displayName = 'Badge';

// --- Main Component ---
const ForecastHistoryAnalysis: React.FC = () => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [monthlyPerf, setMonthlyPerf] = useState<MonthlyPerformance[]>([]);
  const [stockLeaders, setStockLeaders] = useState<{ best_performers: StockLeader[]; worst_performers: StockLeader[] } | null>(null);
  const [trends, setTrends] = useState<AccuracyTrends | null>(null);
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [summaryRes, monthlyRes, leadersRes, trendsRes] = await Promise.all([
          supabase.rpc('get_forecast_history_summary', { p_start_date: startDate, p_end_date: endDate }),
          supabase.rpc('get_forecast_performance_by_month', { p_start_date: startDate, p_end_date: endDate }),
          supabase.rpc('get_forecast_stock_leaders', { p_start_date: startDate, p_end_date: endDate, p_limit: 10 }),
          supabase.rpc('get_forecast_accuracy_trends', { p_start_date: startDate, p_end_date: endDate }),
        ]);

        if (summaryRes.error) throw summaryRes.error;
        if (monthlyRes.error) throw monthlyRes.error;
        if (leadersRes.error) throw leadersRes.error;
        if (trendsRes.error) throw trendsRes.error;

        setSummary(summaryRes.data);
        setMonthlyPerf(monthlyRes.data || []);
        setStockLeaders(leadersRes.data);
        setTrends(trendsRes.data);
      } catch (err: any) {
        console.error('Error fetching forecast history data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (!hasPermission('view:forecast_history_analysis')) {
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

  if (error || !summary) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="font-semibold text-red-700 dark:text-red-400">{t('error_fetching_data')}</p>
        <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error || 'No data available'}</p>
      </div>
    );
  }

  const weeklyTrendData = trends?.weekly_trend?.slice(0, 12).reverse().map(t => t.hit_rate) || [];
  const monthlyTrendData = monthlyPerf.slice(0, 12).reverse().map(m => m.hit_rate);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6 text-nextrow-primary" />
          {t('forecast_history_analysis') || 'Forecast History Analysis'}
        </h1>
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Compact Overview Cards - Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <MiniKPICard
          title={t('total_records') || 'Total Records'}
          value={summary.total_records}
          color="blue"
          icon={<ChartBarIcon className="w-4 h-4" />}
        />
        <MiniKPICard
          title={t('unique_stocks') || 'Unique Stocks'}
          value={summary.unique_stocks}
          color="indigo"
          icon={<BuildingOfficeIcon className="w-4 h-4" />}
        />
        <MiniKPICard
          title={t('hit_rate') || 'Hit Rate'}
          value={formatPercent(summary.hit_stats.hit_rate)}
          subtitle={`${summary.hit_stats.total_hits}/${summary.hit_stats.total_misses}`}
          color={summary.hit_stats.hit_rate >= 70 ? 'green' : summary.hit_stats.hit_rate >= 50 ? 'yellow' : 'red'}
          icon={<CheckCircleIcon className="w-4 h-4" />}
        />
        <MiniKPICard
          title={t('avg_error') || 'Avg Error'}
          value={formatPercent(summary.error_stats.avg_pct_error)}
          color={summary.error_stats.avg_pct_error <= 5 ? 'green' : summary.error_stats.avg_pct_error <= 10 ? 'yellow' : 'red'}
        />
        <MiniKPICard
          title={t('avg_confidence') || 'Avg Confidence'}
          value={formatPercent(summary.confidence_stats.avg_confidence)}
          color="purple"
        />
        <MiniKPICard
          title={t('total_days') || 'Days'}
          value={summary.date_range.total_days}
          color="blue"
          icon={<CalendarDaysIcon className="w-4 h-4" />}
        />
      </div>

      {/* Confidence Distribution & Error Stats - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">{t('confidence_distribution') || 'Confidence Distribution'}</h3>
          <div className="space-y-2">
            <CompactProgressBar 
              value={summary.confidence_stats.high_confidence_count} 
              max={summary.total_records} 
              label={`High (≥70%): ${summary.confidence_stats.high_confidence_count}`}
              color="bg-green-500"
            />
            <CompactProgressBar 
              value={summary.confidence_stats.medium_confidence_count} 
              max={summary.total_records} 
              label={`Medium (50-70%): ${summary.confidence_stats.medium_confidence_count}`}
              color="bg-yellow-500"
            />
            <CompactProgressBar 
              value={summary.confidence_stats.low_confidence_count} 
              max={summary.total_records} 
              label={`Low (<50%): ${summary.confidence_stats.low_confidence_count}`}
              color="bg-red-500"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">{t('error_distribution') || 'Error Distribution'}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Badge label="≤2%" value={trends?.error_distribution.very_low_error || 0} variant="success" />
            <Badge label="2-5%" value={trends?.error_distribution.low_error || 0} variant="success" />
            <Badge label="5-10%" value={trends?.error_distribution.medium_error || 0} variant="warning" />
            <Badge label="10-20%" value={trends?.error_distribution.high_error || 0} variant="warning" />
            <Badge label=">20%" value={trends?.error_distribution.very_high_error || 0} variant="danger" />
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span>{t('min_error') || 'Min'}:</span>
              <span className="font-bold">{formatPercent(summary.error_stats.min_abs_error)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{t('max_error') || 'Max'}:</span>
              <span className="font-bold text-red-600">{formatPercent(summary.error_stats.max_pct_error)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Charts - Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('weekly_trend') || 'Weekly Trend'}</h3>
          <MiniTrendChart data={weeklyTrendData} color="#3b82f6" />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>{t('last') || 'Last'} 12 {t('weeks') || 'weeks'}</span>
            <span>{formatPercent(trends?.weekly_trend[trends.weekly_trend.length - 1]?.hit_rate || 0)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('monthly_trend') || 'Monthly Trend'}</h3>
          <MiniTrendChart data={monthlyTrendData} color="#10b981" />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>{t('last') || 'Last'} 12 {t('months') || 'months'}</span>
            <span>{formatPercent(monthlyPerf[monthlyPerf.length - 1]?.hit_rate || 0)}</span>
          </div>
        </div>
      </div>

      {/* Stock Leaders - Row 4 */}
      {stockLeaders && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              {t('best_performers') || 'Best Performers'}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stockLeaders.best_performers.map((stock, idx) => (
                <div key={stock.stock_symbol} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-green-700 dark:text-green-400 truncate">
                      {stock.stock_symbol}
                    </div>
                    {stock.stock_name && (
                      <div className="text-xs text-gray-500 truncate">{stock.stock_name}</div>
                    )}
                  </div>
                  <div className="ml-2 text-right flex-shrink-0">
                    <div className="font-bold text-sm text-green-600">{formatPercent(stock.hit_rate)}</div>
                    <div className="text-xs text-gray-500">{stock.total_forecasts} {t('forecasts') || 'forecasts'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <TrendingDownIcon className="w-4 h-4" />
              {t('worst_performers') || 'Worst Performers'}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stockLeaders.worst_performers.map((stock, idx) => (
                <div key={stock.stock_symbol} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-red-700 dark:text-red-400 truncate">
                      {stock.stock_symbol}
                    </div>
                    {stock.stock_name && (
                      <div className="text-xs text-gray-500 truncate">{stock.stock_name}</div>
                    )}
                  </div>
                  <div className="ml-2 text-right flex-shrink-0">
                    <div className="font-bold text-sm text-red-600">{formatPercent(stock.hit_rate)}</div>
                    <div className="text-xs text-gray-500">{stock.total_forecasts} {t('forecasts') || 'forecasts'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastHistoryAnalysis;

