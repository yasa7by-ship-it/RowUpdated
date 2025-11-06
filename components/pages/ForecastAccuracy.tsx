import React, { useState, useEffect, useMemo, memo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, ChartBarIcon, CheckCircleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon, StarIcon, SparklesIcon, TrendingUpIcon } from '../icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, Scatter, Cell, PieChart, Pie, RadialBarChart, RadialBar } from 'recharts';
import { 
  hitRate, 
  insideRangeRatio, 
  averageRangeWidth, 
  mapeMid, 
  dailyHitRate, 
  weeklyAggregateFromDailyRate,
  absoluteErrors,
  histogram,
  ForecastRow
} from '../../utils/forecastMetrics';

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

// Actual Range Display Component - matches StockDetails page format
const ActualRangeDisplay: React.FC<{ low: number | null; high: number | null; t?: (key: string) => string }> = memo(({ low, high, t }) => {
  if ((low === null || low === undefined) && (high === null || high === undefined)) {
    return <span className="text-gray-400 text-xs font-medium">{t ? t('not_available') : 'N/A'}</span>;
  }
  
  if (low === null || low === undefined) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-xs font-medium text-gray-400">{t ? t('not_available') : 'N/A'}</span>
        <span className="text-[10px] text-gray-400">-</span>
        <span className="text-xs font-bold text-green-600 dark:text-green-400">{formatNumber(high!, t)}</span>
      </div>
    );
  }
  
  if (high === null || high === undefined) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatNumber(low, t)}</span>
        <span className="text-[10px] text-gray-400">-</span>
        <span className="text-xs font-medium text-gray-400">{t ? t('not_available') : 'N/A'}</span>
      </div>
    );
  }
  
  const actualLow = Math.min(low, high);
  const actualHigh = Math.max(low, high);
  
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-xs font-bold text-red-600 dark:text-red-400">
        {formatNumber(actualLow, t)}
      </span>
      <span className="text-[10px] text-gray-500 font-medium">-</span>
      <span className="text-xs font-bold text-green-600 dark:text-green-400">
        {formatNumber(actualHigh, t)}
      </span>
    </div>
  );
});
ActualRangeDisplay.displayName = 'ActualRangeDisplay';

// Expected Range Display Component - matches StockDetails page format
const ExpectedRangeDisplay: React.FC<{ low: number | null; high: number | null; t?: (key: string) => string }> = memo(({ low, high, t }) => {
  if (low === null || high === null) {
    return <span className="text-gray-400 text-xs font-medium">{t ? t('not_available') : 'N/A'}</span>;
  }
  
  const expectedLow = Math.min(low, high);
  const expectedHigh = Math.max(low, high);
  
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-xs font-bold text-red-600 dark:text-red-400">
        {formatNumber(expectedLow, t)}
      </span>
      <span className="text-[10px] text-gray-500 font-medium">-</span>
      <span className="text-xs font-bold text-green-600 dark:text-green-400">
        {formatNumber(expectedHigh, t)}
      </span>
    </div>
  );
});
ExpectedRangeDisplay.displayName = 'ExpectedRangeDisplay';

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

// --- Modern Mini KPI Card Component ---
const MiniKPICard: React.FC<{
  title: string;
  value: string | number;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  icon?: React.ReactNode;
}> = memo(({ title, value, color = 'blue', icon }) => {
  const colorConfig = {
    green: {
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      bgLight: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
      border: 'border-emerald-200/50 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      valueText: 'text-emerald-900 dark:text-emerald-100',
    },
    red: {
      gradient: 'from-red-500 via-rose-500 to-pink-500',
      bgLight: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
      border: 'border-red-200/50 dark:border-red-800/50',
      text: 'text-red-700 dark:text-red-300',
      valueText: 'text-red-900 dark:text-red-100',
    },
    blue: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      bgLight: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      border: 'border-blue-200/50 dark:border-blue-800/50',
      text: 'text-blue-700 dark:text-blue-300',
      valueText: 'text-blue-900 dark:text-blue-100',
    },
    yellow: {
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      bgLight: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
      border: 'border-amber-200/50 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      valueText: 'text-amber-900 dark:text-amber-100',
    },
  };

  const config = colorConfig[color];

  return (
    <div className={`relative group overflow-hidden rounded-xl border ${config.border} ${config.bgLight} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1`}
      style={{ 
        boxShadow: '0 0 0 0 rgba(0,0,0,0)',
      }}
      onMouseEnter={(e) => {
        const shadowColor = color === 'green' ? 'rgba(16, 185, 129, 0.2)' :
                           color === 'red' ? 'rgba(239, 68, 68, 0.2)' :
                           color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                           'rgba(245, 158, 11, 0.2)';
        e.currentTarget.style.boxShadow = `0 20px 25px -5px ${shadowColor}, 0 10px 10px -5px ${shadowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
      }}
    >
      {/* Animated gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="relative p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${config.text} mb-2 opacity-90`}>
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <p className={`text-2xl font-black ${config.valueText} leading-none`}>
                {value}
              </p>
            </div>
          </div>
          {icon && (
            <div className={`ml-3 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300 ${config.text}`}>
              {icon}
            </div>
          )}
        </div>
        
        {/* Decorative accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} opacity-5 blur-2xl -translate-y-1/2 translate-x-1/2`} />
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

// --- Modern KPI Card with Trend Component ---
const ModernKPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'green' | 'red' | 'blue' | 'yellow';
  icon?: React.ReactNode;
}> = memo(({ title, value, subtitle, trend, trendValue, color = 'blue', icon }) => {
  const colorConfig = {
    green: {
      bg: 'bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-green-950/20 dark:to-teal-950/40',
      border: 'border-emerald-200/50 dark:border-emerald-800/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      valueText: 'text-emerald-900 dark:text-emerald-100',
      iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-pink-500/10 dark:from-red-950/40 dark:via-rose-950/20 dark:to-pink-950/40',
      border: 'border-red-200/50 dark:border-red-800/50',
      text: 'text-red-700 dark:text-red-300',
      valueText: 'text-red-900 dark:text-red-100',
      iconBg: 'bg-red-500/20 dark:bg-red-500/30',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-purple-950/40',
      border: 'border-blue-200/50 dark:border-blue-800/50',
      text: 'text-blue-700 dark:text-blue-300',
      valueText: 'text-blue-900 dark:text-blue-100',
      iconBg: 'bg-blue-500/20 dark:bg-blue-500/30',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-orange-950/40',
      border: 'border-amber-200/50 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-300',
      valueText: 'text-amber-900 dark:text-amber-100',
      iconBg: 'bg-amber-500/20 dark:bg-amber-500/30',
    },
  };

  const config = colorConfig[color];

  return (
    <div className={`relative group rounded-xl border ${config.border} ${config.bg} backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${config.text} mb-1 opacity-70`}>
            {title}
          </p>
          <p className={`text-2xl font-black ${config.valueText} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs ${config.text} opacity-60`}>
              {subtitle}
            </p>
          )}
          {trend && trend !== 'neutral' && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${
              trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {trend === 'up' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${config.iconBg} rounded-lg p-2 ${config.text}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});
ModernKPICard.displayName = 'ModernKPICard';

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

// --- Gauge Chart Component (مثل Recommendation Gauge في الصورة) ---
const GaugeChart: React.FC<{
  value: number;
  min?: number;
  max?: number;
  segments?: Array<{ label: string; color: string; range: [number, number] }>;
  size?: number;
  label?: string;
  t?: (key: string) => string;
}> = memo(({ value, min = 0, max = 100, segments, size = 200, label, t }) => {
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  
  // Default segments if not provided - use translations if available
  const defaultSegments = segments || [
    { label: t ? t('strong_sell') : 'بيع قوي', color: '#ef4444', range: [0, 20] },
    { label: t ? t('sell') : 'بيع', color: '#f97316', range: [20, 40] },
    { label: t ? t('neutral') : 'محايد', color: '#eab308', range: [40, 60] },
    { label: t ? t('buy') : 'شراء', color: '#3b82f6', range: [60, 80] },
    { label: t ? t('strong_buy') : 'شراء قوي', color: '#10b981', range: [80, 100] },
  ];
  
  // Calculate angle for needle (180 degrees arc, from -90 to 90)
  const angle = (percentage / 100) * 180 - 90;
  const centerX = size / 2;
  const centerY = size * 0.85; // Bottom of gauge
  const radius = size * 0.35;
  const needleLength = radius * 0.85;
  
  // Find current segment
  const currentSegment = defaultSegments.find(seg => 
    percentage >= seg.range[0] && percentage < seg.range[1]
  ) || defaultSegments[defaultSegments.length - 1];
  
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
        <defs>
          {defaultSegments.map((seg, idx) => (
            <linearGradient key={idx} id={`gaugeGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={seg.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={seg.color} stopOpacity="1" />
            </linearGradient>
          ))}
        </defs>
        
        {/* Gauge Arc Background */}
        <path
          d={`M ${size * 0.15} ${centerY} A ${radius} ${radius} 0 0 1 ${size * 0.85} ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={size * 0.04}
          className="dark:stroke-gray-700"
        />
        
        {/* Colored Segments */}
        {defaultSegments.map((seg, idx) => {
          const startAngle = (seg.range[0] / 100) * 180 - 90;
          const endAngle = (seg.range[1] / 100) * 180 - 90;
          const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          const largeArcFlag = seg.range[1] - seg.range[0] > 50 ? 1 : 0;
          
          return (
            <path
              key={idx}
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
              fill="none"
              stroke={seg.color}
              strokeWidth={size * 0.04}
            />
          );
        })}
        
        {/* Needle */}
        <g transform={`rotate(${angle} ${centerX} ${centerY})`}>
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - needleLength}
            stroke="#1f2937"
            strokeWidth={size * 0.015}
            strokeLinecap="round"
            className="dark:stroke-gray-100"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.03}
            fill="#1f2937"
            className="dark:fill-gray-100"
          />
        </g>
        
        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={size * 0.04}
          fill="#ffffff"
          className="dark:fill-gray-800 dark:stroke-gray-100"
          stroke="#1f2937"
          strokeWidth={size * 0.01}
        />
      </svg>
      
      {/* Value Display */}
      <div className="mt-2 text-center">
        <div className={`text-2xl font-bold ${currentSegment ? `text-[${currentSegment.color}]` : 'text-gray-900 dark:text-white'}`}>
          {normalizedValue.toFixed(1)}%
        </div>
        {currentSegment && (
          <div className={`text-sm font-semibold mt-1`} style={{ color: currentSegment.color }}>
            {currentSegment.label}
          </div>
        )}
        {label && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{label}</div>
        )}
      </div>
    </div>
  );
});
GaugeChart.displayName = 'GaugeChart';

// --- Recommendation Breakdown Component (أشرطة أفقية مع أرقام) ---
const RecommendationBreakdown: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title?: string;
}> = memo(({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      )}
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
          </div>
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});
RecommendationBreakdown.displayName = 'RecommendationBreakdown';

// --- Multi-Bar Chart Component (مثل Assets & Liabilities chart) ---
const MultiBarChart: React.FC<{
  data: Array<{ period: string; [key: string]: number | string }>;
  bars: Array<{ key: string; label: string; color: string }>;
  title?: string;
  height?: number;
}> = memo(({ data, bars, title, height = 250 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
      {title && (
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 11 }} 
            angle={-45} 
            textAnchor="end" 
            height={60}
            stroke="#6b7280"
            className="dark:stroke-gray-400"
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            className="dark:stroke-gray-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
MultiBarChart.displayName = 'MultiBarChart';

// --- Multi-Line Chart Component (مثل TradingView chart) ---
const MultiLineChart: React.FC<{
  data: Array<{ [key: string]: number | string }>;
  lines: Array<{ key: string; label: string; color: string; strokeWidth?: number }>;
  title?: string;
  height?: number;
  xAxisKey?: string;
}> = memo(({ data, lines, title, height = 350, xAxisKey = 'date' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
      {title && (
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            className="dark:stroke-gray-400"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            className="dark:stroke-gray-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
MultiLineChart.displayName = 'MultiLineChart';

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
  const [hitFilter, setHitFilter] = useState<'all' | 'hit' | 'miss'>('all');
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
        const [overallResult, byStockResult, byDateResult, byConfidenceResult, recentForecastsResult] = await Promise.all([
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
          supabase.rpc('get_forecast_accuracy_recent', {
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
          recent_forecasts: recentForecastsResult.data || [],
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

  // State for latest ranges per stock
  const [latestRanges, setLatestRanges] = useState<Record<string, { 
    actualLow: number | null; 
    actualHigh: number | null; 
    predictedLow: number | null; 
    predictedHigh: number | null;
  }>>({});

  // Fetch latest ranges for each stock from forecast_check_history
  useEffect(() => {
    const fetchLatestRanges = async () => {
      try {
        // Try to use the new RPC function that gets latest ranges directly from forecast_check_history
        const { data, error } = await supabase.rpc('get_latest_ranges_from_history');

        if (!error && data && Array.isArray(data)) {
          const ranges: Record<string, { 
            actualLow: number | null; 
            actualHigh: number | null; 
            predictedLow: number | null; 
            predictedHigh: number | null;
          }> = {};
          data.forEach((item: any) => {
            if (item.stock_symbol && item.actual_low != null && item.actual_high != null && 
                item.predicted_lo != null && item.predicted_hi != null) {
              ranges[item.stock_symbol] = {
                actualLow: item.actual_low,
                actualHigh: item.actual_high,
                predictedLow: item.predicted_lo,
                predictedHigh: item.predicted_hi,
              };
            }
          });
          setLatestRanges(ranges);
          return;
        }

        // Fallback 1: Try get_latest_ranges_per_stock (old function)
        const { data: oldData, error: oldError } = await supabase.rpc('get_latest_ranges_per_stock', {
          p_start_date: defaultStartDate,
          p_end_date: defaultEndDate,
        });

        if (!oldError && oldData && Array.isArray(oldData)) {
          const ranges: Record<string, { 
            actualLow: number | null; 
            actualHigh: number | null; 
            predictedLow: number | null; 
            predictedHigh: number | null;
          }> = {};
          oldData.forEach((item: any) => {
            if (item.stock_symbol && item.actual_low != null && item.actual_high != null && 
                item.predicted_lo != null && item.predicted_hi != null) {
              ranges[item.stock_symbol] = {
                actualLow: item.actual_low,
                actualHigh: item.actual_high,
                predictedLow: item.predicted_lo,
                predictedHigh: item.predicted_hi,
              };
            }
          });
          setLatestRanges(ranges);
          return;
        }

        // Fallback 2: Use recent_forecasts if RPC functions are not available
        if (stats?.recent_forecasts && stats.recent_forecasts.length > 0) {
          const ranges: Record<string, { 
            actualLow: number | null; 
            actualHigh: number | null; 
            predictedLow: number | null; 
            predictedHigh: number | null;
          }> = {};
          const processedSymbols = new Set<string>();
          
          stats.recent_forecasts.forEach((forecast) => {
            if (!forecast.stock_symbol || processedSymbols.has(forecast.stock_symbol)) return;
            
            const stockForecasts = stats.recent_forecasts
              .filter(f => f.stock_symbol === forecast.stock_symbol && 
                           f.actual_low != null && f.actual_high != null &&
                           f.predicted_lo != null && f.predicted_hi != null)
              .sort((a, b) => new Date(b.forecast_date).getTime() - new Date(a.forecast_date).getTime());
            
            if (stockForecasts.length > 0) {
              const latest = stockForecasts[0];
              ranges[forecast.stock_symbol] = {
                actualLow: latest.actual_low,
                actualHigh: latest.actual_high,
                predictedLow: latest.predicted_lo,
                predictedHigh: latest.predicted_hi,
              };
              processedSymbols.add(forecast.stock_symbol);
            }
          });
          setLatestRanges(ranges);
        }
      } catch (err: any) {
        console.error('Error fetching latest ranges:', err);
      }
    };

    fetchLatestRanges();
  }, [stats?.recent_forecasts, defaultStartDate, defaultEndDate, t]);

  // Filter by stock data and add ranges
  const filteredByStockData = useMemo(() => {
    if (!stats?.by_stock) return [];
    let filtered = stats.by_stock.filter((stock) => {
      const matchesSearch = searchTerm === '' || 
                            stock.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorites = !showFavorites || isFavorite(stock.stock_symbol);
      const matchesHitFilter = hitFilter === 'all' || 
                               (hitFilter === 'hit' && stock.hit_count > 0 && stock.miss_count === 0) ||
                               (hitFilter === 'miss' && stock.miss_count > 0);
      return matchesSearch && matchesFavorites && matchesHitFilter;
    }).map((stock) => ({
      ...stock,
      actualLow: latestRanges[stock.stock_symbol]?.actualLow ?? null,
      actualHigh: latestRanges[stock.stock_symbol]?.actualHigh ?? null,
      predictedLow: latestRanges[stock.stock_symbol]?.predictedLow ?? null,
      predictedHigh: latestRanges[stock.stock_symbol]?.predictedHigh ?? null,
    }));
    return filtered;
  }, [stats?.by_stock, searchTerm, showFavorites, hitFilter, isFavorite, latestRanges, t]);

  // Pagination calculations - MUST be before any conditional returns (React Hooks rule)
  const byStockTotalPages = useMemo(() => {
    return Math.ceil(filteredByStockData.length / itemsPerPage);
  }, [filteredByStockData.length]);

  const byStockPaginated = useMemo(() => {
    const startIndex = (byStockPage - 1) * itemsPerPage;
    return filteredByStockData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredByStockData, byStockPage]);

  // Reset to first page when filters change - MUST be before any conditional returns
  useEffect(() => {
    setByStockPage(1);
  }, [searchTerm, showFavorites, hitFilter]);

  // Prepare chart data - MUST be before any conditional returns (Rules of Hooks)
  const dateChartData = useMemo(() => {
    if (!stats?.by_date || stats.by_date.length === 0) return [];
    return stats.by_date.slice(-15).map(item => ({
      date: formatDate(item.forecast_date, t).split('-').slice(1).join('/'),
      hitRate: parseFloat(item.hit_rate.toFixed(1)),
      forecasts: item.total_forecasts,
      hits: item.hit_count,
      misses: item.total_forecasts - item.hit_count,
    }));
  }, [stats?.by_date, t]);

  // Candlestick Chart Data with Forecast Range Overlay
  const candlestickData = useMemo(() => {
    if (!stats?.recent_forecasts || stats.recent_forecasts.length === 0) return [];
    return stats.recent_forecasts.slice(-20).map(forecast => {
      const date = formatDate(forecast.forecast_date, t).split('-').slice(1).join('/');
      const actualOpen = forecast.actual_low;
      const actualClose = forecast.actual_high;
      const actualHigh = Math.max(forecast.actual_low, forecast.actual_high, forecast.actual_close || 0);
      const actualLow = Math.min(forecast.actual_low, forecast.actual_high, forecast.actual_close || forecast.actual_low);
      const predictedHigh = forecast.predicted_hi;
      const predictedLow = forecast.predicted_lo;
      const rangeSize = ((predictedHigh - predictedLow) / predictedLow) * 100;
      
      return {
        date,
        stock: forecast.stock_symbol,
        actualOpen,
        actualClose,
        actualHigh,
        actualLow,
        predictedHigh,
        predictedLow,
        hitRange: forecast.hit_range,
        rangeSize,
        hitRate: forecast.hit_range ? 100 : 0,
      };
    });
  }, [stats?.recent_forecasts, t]);

  // Waterfall Chart Data - Daily Hit Rate Change
  const waterfallData = useMemo(() => {
    if (!stats?.by_date || stats.by_date.length === 0) return [];
    const sortedDates = [...stats.by_date].sort((a, b) => 
      new Date(a.forecast_date).getTime() - new Date(b.forecast_date).getTime()
    );
    
    let cumulative = 0;
    return sortedDates.slice(-20).map((item, index) => {
      const change = index === 0 ? item.hit_rate : item.hit_rate - sortedDates[index - 1].hit_rate;
      cumulative += change;
      return {
        date: formatDate(item.forecast_date, t).split('-').slice(1).join('/'),
        value: item.hit_rate,
        change: index === 0 ? item.hit_rate : change,
        cumulative: item.hit_rate,
        isPositive: change >= 0,
      };
    });
  }, [stats?.by_date, t]);

  // Hit Map Data - Grid of stocks with hit/miss status
  const hitMapData = useMemo(() => {
    if (!stats?.by_stock || stats.by_stock.length === 0) return [];
    return stats.by_stock.slice(0, 50).map(stock => ({
      symbol: stock.stock_symbol,
      hitRate: stock.hit_rate,
      isHit: stock.hit_rate >= 50,
      totalForecasts: stock.total_forecasts,
    }));
  }, [stats?.by_stock]);

  // Enhanced Scatter Plot - Forecast Range Size vs Hit Rate
  const scatterData = useMemo(() => {
    if (!stats?.recent_forecasts || stats.recent_forecasts.length === 0) return [];
    return stats.recent_forecasts.slice(0, 100).map(forecast => {
      const rangeSize = forecast.predicted_hi && forecast.predicted_lo 
        ? ((forecast.predicted_hi - forecast.predicted_lo) / forecast.predicted_lo) * 100
        : 0;
      return {
        x: rangeSize,
        y: forecast.hit_range ? 100 : 0,
        z: forecast.confidence || 50,
        symbol: forecast.stock_symbol,
        hitRange: forecast.hit_range,
      };
    });
  }, [stats?.recent_forecasts]);

  // KPI Indicators Data - Radial Charts (using professional forecast metrics)
  const kpiIndicators = useMemo(() => {
    if (!stats?.overall || !stats?.recent_forecasts || stats.recent_forecasts.length === 0) {
      return {
        withinRange: 0,
        rangeWidth: 0,
        mape: 0,
        accuracyRate: 0,
      };
    }

    // Convert to ForecastRow format
    const forecastRows: ForecastRow[] = stats.recent_forecasts.map(f => ({
      symbol: f.stock_symbol,
      forecast_date: f.forecast_date,
      predicted_lo: f.predicted_lo,
      predicted_hi: f.predicted_hi,
      actual_low: f.actual_low,
      actual_high: f.actual_high,
      is_hit: f.hit_range,
      confidence: f.confidence || undefined,
    }));

    // Within Range Percentage (using insideRangeRatio)
    const insideRange = insideRangeRatio(forecastRows);
    const withinRange = insideRange.rate * 100;

    // Average Range Width (as percentage)
    const avgRangeWidth = averageRangeWidth(forecastRows);
    // Convert to percentage of average predicted low
    const avgPredictedLow = forecastRows.reduce((sum, r) => sum + r.predicted_lo, 0) / forecastRows.length;
    const rangeWidth = avgPredictedLow > 0 ? (avgRangeWidth / avgPredictedLow) * 100 : 0;

    // MAPE (Mean Absolute Percentage Error) - using mapeMid
    const mape = mapeMid(forecastRows) * 100;

    // Accuracy Rate (Global KPI) - same as hit rate
    const accuracy = hitRate(forecastRows);
    const accuracyRate = accuracy.rate * 100;

    return {
      withinRange: parseFloat(withinRange.toFixed(1)),
      rangeWidth: parseFloat(rangeWidth.toFixed(1)),
      mape: parseFloat(mape.toFixed(1)),
      accuracyRate: parseFloat(accuracyRate.toFixed(1)),
    };
  }, [stats?.overall, stats?.recent_forecasts]);

  // 30-Day Trend Data - MAPE and Hit Rate (using professional metrics)
  const trend30DaysData = useMemo(() => {
    if (!stats?.recent_forecasts || stats.recent_forecasts.length === 0) return { mape: [], hitRate: [] };
    
    // Convert to ForecastRow format
    const forecastRows: ForecastRow[] = stats.recent_forecasts.map(f => ({
      symbol: f.stock_symbol,
      forecast_date: f.forecast_date,
      predicted_lo: f.predicted_lo,
      predicted_hi: f.predicted_hi,
      actual_low: f.actual_low,
      actual_high: f.actual_high,
      is_hit: f.hit_range,
      confidence: f.confidence || undefined,
    }));

    // Get daily hit rate series
    const dailySeries = dailyHitRate(forecastRows);
    const last30Days = dailySeries.slice(-30);

    // Hit Rate Trend
    const hitRateTrend = last30Days.map(item => ({
      date: formatDate(item.date, t).split('-').slice(1).join('/'),
      value: parseFloat((item.rate * 100).toFixed(1)),
    }));

    // MAPE Trend - calculate MAPE per day
    const mapeTrend = last30Days.map(item => {
      const forecastsForDate = forecastRows.filter(f => {
        const fDate = f.forecast_date instanceof Date 
          ? f.forecast_date.toISOString().split('T')[0]
          : f.forecast_date;
        return fDate === item.date;
      });
      const mapeForDate = forecastsForDate.length > 0 
        ? mapeMid(forecastsForDate) * 100 
        : 0;
      return {
        date: formatDate(item.date, t).split('-').slice(1).join('/'),
        value: parseFloat(mapeForDate.toFixed(2)),
      };
    });

    return { mape: mapeTrend, hitRate: hitRateTrend };
  }, [stats?.recent_forecasts, t]);

  // Absolute Error Distribution (using professional histogram)
  const errorDistributionData = useMemo(() => {
    if (!stats?.recent_forecasts || stats.recent_forecasts.length === 0) return [];
    
    // Convert to ForecastRow format
    const forecastRows: ForecastRow[] = stats.recent_forecasts.map(f => ({
      symbol: f.stock_symbol,
      forecast_date: f.forecast_date,
      predicted_lo: f.predicted_lo,
      predicted_hi: f.predicted_hi,
      actual_low: f.actual_low,
      actual_high: f.actual_high,
      is_hit: f.hit_range,
      confidence: f.confidence || undefined,
    }));

    // Get absolute errors (mid)
    const errors = absoluteErrors.mid(forecastRows);
    if (errors.length === 0) return [];

    // Create histogram
    const maxError = Math.max(...errors);
    const hist = histogram(errors, 0.5, Math.ceil(maxError) || 6);

    return hist.labels.map((label, index) => ({
      range: label,
      count: hist.bins[index],
    })).reverse(); // Reverse to show from smallest to largest
  }, [stats?.recent_forecasts]);

  // Weekly Cumulative Within Range (using professional weekly aggregation)
  const weeklyCumulativeData = useMemo(() => {
    if (!stats?.recent_forecasts || stats.recent_forecasts.length === 0) return [];
    
    // Convert to ForecastRow format
    const forecastRows: ForecastRow[] = stats.recent_forecasts.map(f => ({
      symbol: f.stock_symbol,
      forecast_date: f.forecast_date,
      predicted_lo: f.predicted_lo,
      predicted_hi: f.predicted_hi,
      actual_low: f.actual_low,
      actual_high: f.actual_high,
      is_hit: f.hit_range,
      confidence: f.confidence || undefined,
    }));

    // Get daily hit rate series
    const dailySeries = dailyHitRate(forecastRows);
    
    // Convert to format expected by weeklyAggregateFromDailyRate
    const dailyRateSeries = dailySeries.map(d => ({ date: d.date, rate: d.rate }));
    
    // Get weekly aggregation
    const weekly = weeklyAggregateFromDailyRate(dailyRateSeries);

    // Return last 5 weeks
    return weekly.slice(-5).map((week, index) => ({
      week: t('week') + ' ' + (index + 1),
      percentage: week.rate * 100,
    }));
  }, [stats?.recent_forecasts, t]);

  // Bias Analysis Horizontal Bar Chart Data
  const biasBarData = useMemo(() => {
    if (!advancedStats?.biasAnalysis) return [];
    return [
      { 
        name: t('overestimated'), 
        value: advancedStats.biasAnalysis.overestimated?.percentage || 0,
        count: advancedStats.biasAnalysis.overestimated?.count || 0,
        color: '#ef4444'
      },
      { 
        name: t('underestimated'), 
        value: advancedStats.biasAnalysis.underestimated?.percentage || 0,
        count: advancedStats.biasAnalysis.underestimated?.count || 0,
        color: '#f59e0b'
      },
      { 
        name: t('within_range'), 
        value: advancedStats.biasAnalysis.within_range?.percentage || 0,
        count: advancedStats.biasAnalysis.within_range?.count || 0,
        color: '#10b981'
      },
    ];
  }, [advancedStats?.biasAnalysis, t]);

  // Top Stocks Performance Data - Ranked Bar Chart (Top 10)
  const topStocksData = useMemo(() => {
    if (!stats?.by_stock || stats.by_stock.length === 0) return [];
    return stats.by_stock
      .slice()
      .sort((a, b) => b.hit_rate - a.hit_rate)
      .slice(0, 10)
      .map(stock => ({
        name: stock.stock_symbol,
        hitRate: parseFloat(stock.hit_rate.toFixed(1)),
        forecasts: stock.total_forecasts,
        hits: stock.hit_count,
        misses: stock.miss_count,
      }));
  }, [stats?.by_stock]);

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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-3">
      {/* Page Title */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-nextrow-primary" />
          {t('forecast_accuracy_analysis')}
        </h1>
      </div>

      {/* ============================================
          SECTION 1: KPI Indicators (Small - Radial Charts)
          ============================================ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('forecast_accuracy_indicators_dashboard') || 'لوحة مؤشرات دقة التوقعات'}
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Within Range */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 relative">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">
              {t('within_range') || 'داخل النطاق'}
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="50%" outerRadius="90%" data={[{ value: kpiIndicators.withinRange, fill: '#10b981' }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={5} fill="#10b981" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {kpiIndicators.withinRange.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Range Width */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 relative">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">
              {t('range_width') || 'اتساع النطاق'}
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="50%" outerRadius="90%" data={[{ value: kpiIndicators.rangeWidth, fill: '#3b82f6' }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={5} fill="#3b82f6" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {kpiIndicators.rangeWidth.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* MAPE */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 relative">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">
              {t('mape') || 'الخطأ المتوسط (MAPE)'}
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="50%" outerRadius="90%" data={[{ value: kpiIndicators.mape, fill: '#f59e0b' }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={5} fill="#f59e0b" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {kpiIndicators.mape.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Accuracy Rate (Global KPI) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 relative">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">
              {t('accuracy_rate_global') || 'نسبة الدقة (KPI Global)'}
            </h3>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="50%" outerRadius="90%" data={[{ value: kpiIndicators.accuracyRate, fill: '#10b981' }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={5} fill="#10b981" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {kpiIndicators.accuracyRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          SECTION 2: Performance Overview (Medium - Gauge + Breakdown)
          ============================================ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('forecast_performance_analysis') || 'تحليل أداء التوقعات'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gauge Chart - Overall Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-center">
              {t('overall_performance_gauge') || 'مقياس الأداء الإجمالي'}
            </h3>
            <GaugeChart
              value={overall.hit_rate}
              min={0}
              max={100}
              segments={[
                { label: t('very_low') || 'منخفض جداً', color: '#ef4444', range: [0, 30] },
                { label: t('low') || 'منخفض', color: '#f97316', range: [30, 50] },
                { label: t('medium') || 'متوسط', color: '#eab308', range: [50, 70] },
                { label: t('good') || 'جيد', color: '#3b82f6', range: [70, 85] },
                { label: t('excellent') || 'ممتاز', color: '#10b981', range: [85, 100] },
              ]}
              size={250}
              label={t('hit_rate') || 'نسبة النجاح'}
              t={t}
            />
          </div>

          {/* Recommendation Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 text-center">
              {t('forecast_breakdown') || 'تفاصيل التوقعات'}
            </h3>
            <RecommendationBreakdown
              data={[
                {
                  label: t('correct_forecasts') || 'التوقعات الصحيحة',
                  value: overall.hit_range_count,
                  color: '#10b981',
                },
                {
                  label: t('incorrect_forecasts') || 'التوقعات الخاطئة',
                  value: overall.miss_range_count,
                  color: '#ef4444',
                },
                {
                  label: t('high_confidence') || 'ثقة عالية',
                  value: by_confidence.high_confidence.count,
                  color: '#3b82f6',
                },
                {
                  label: t('medium_confidence') || 'ثقة متوسطة',
                  value: by_confidence.medium_confidence.count,
                  color: '#eab308',
                },
                {
                  label: t('low_confidence') || 'ثقة منخفضة',
                  value: by_confidence.low_confidence.count,
                  color: '#f97316',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ============================================
          SECTION 3: Trend Analysis (Medium - 30-Day Trends)
          ============================================ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('performance_trends') || 'اتجاهات الأداء - آخر 30 يوم'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* MAPE Trend */}
          {trend30DaysData.mape.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                {t('last_30_days_mape_trend') || 'آخر 30 يوم - MAPE Trend'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend30DaysData.mape} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 'dataMax + 0.5']} tick={{ fontSize: 9 }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Hit Rate Trend */}
          {trend30DaysData.hitRate.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                {t('last_30_days_hit_rate') || 'آخر 30 يوم - Hit Rate'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend30DaysData.hitRate} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          SECTION 4: Distribution Analysis (Medium - Error & Weekly)
          ============================================ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('error_distribution_absolute') || 'تحليل التوزيع'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Error Distribution */}
          {errorDistributionData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                {t('error_distribution_absolute') || 'توزيع الخطأ (Absolute Error)'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={errorDistributionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString()}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly Cumulative */}
          {weeklyCumulativeData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                {t('within_range_weekly_cumulative') || 'داخل النطاق - تجميعي أسبوعي'}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyCumulativeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          SECTION 5: Period Performance (Large - Multi-Bar Chart)
          ============================================ */}
      {dateChartData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
            {t('performance_by_period') || 'الأداء حسب الفترة'}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <MultiBarChart
              data={dateChartData.slice(-8).map(item => ({
                period: item.date,
                hits: item.hits,
                misses: item.misses,
                total: item.forecasts,
              }))}
              bars={[
                { key: 'hits', label: t('hits') || 'صحيحة', color: '#10b981' },
                { key: 'misses', label: t('misses') || 'خاطئة', color: '#ef4444' },
                { key: 'total', label: t('total') || 'إجمالي', color: '#3b82f6' },
              ]}
              title={t('performance_by_period') || 'الأداء حسب الفترة'}
              height={280}
            />
          </div>
        </div>
      )}

      {/* ============================================
          SECTION 6: Combined Trends Analysis (Large - Multi-Line Chart)
          ============================================ */}
      {trend30DaysData.mape.length > 0 && trend30DaysData.hitRate.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
            {t('performance_trends') || 'تحليل الاتجاهات المركبة'}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <MultiLineChart
              data={trend30DaysData.hitRate.map((item, index) => ({
                date: item.date,
                hitRate: item.value,
                mape: trend30DaysData.mape[index]?.value || 0,
              }))}
              lines={[
                { key: 'hitRate', label: t('hit_rate') || 'نسبة النجاح', color: '#10b981', strokeWidth: 3 },
                { key: 'mape', label: t('mape') || 'الخطأ المتوسط', color: '#f59e0b', strokeWidth: 2 },
              ]}
              title={t('performance_trends') || 'اتجاهات الأداء - آخر 30 يوم'}
              height={400}
              xAxisKey="date"
            />
          </div>
        </div>
      )}


      {/* ============================================
          SECTION 7: Stock Performance Table (Large - Full Width)
          ============================================ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
          {t('stock_performance_table')}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search and Filters Tools - Always visible */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  showFavorites 
                    ? 'bg-yellow-400 text-black border-2 border-yellow-500' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <StarIcon className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                {t('favorites')}
              </button>
              
              {/* Hit/Miss Filter Buttons */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-md p-1">
                <button
                  onClick={() => setHitFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    hitFilter === 'all'
                      ? 'bg-gray-200 dark:bg-gray-600 text-nextrow-primary dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {t('all')}
                </button>
                <button
                  onClick={() => setHitFilter('hit')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    hitFilter === 'hit'
                      ? 'bg-gray-200 dark:bg-gray-600 text-nextrow-primary dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {t('hit')}
                </button>
                <button
                  onClick={() => setHitFilter('miss')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    hitFilter === 'miss'
                      ? 'bg-gray-200 dark:bg-gray-600 text-nextrow-primary dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {t('miss')}
                </button>
              </div>
            </div>
          </div>
          {/* Table */}
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
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                        {t('actual_range')}
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                        {t('forecast_range')}
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
                          <div className="text-sm font-semibold text-nextrow-primary hover:text-nextrow-primary/80 hover:underline transition-colors">
                            {stock.stock_symbol}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center text-sm font-medium">{stock.total_forecasts}</td>
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
                          <ActualRangeDisplay low={stock.actualLow} high={stock.actualHigh} t={t} />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <ExpectedRangeDisplay low={stock.predictedLow} high={stock.predictedHigh} t={t} />
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
              
              {/* Pagination - Same style as DailyWatchlist */}
              {byStockTotalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">{((byStockPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(byStockPage * itemsPerPage, filteredByStockData.length)}</span> {t('of')} <span className="font-semibold">{filteredByStockData.length}</span>
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
