import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { SpinnerIcon, InformationCircleIcon, StarIcon, SparklesIcon, ArrowUpIcon, ArrowDownIcon } from '../icons';

interface WhatHappenedSummaryItem {
  stock_symbol: string;
  stock_name: string;
  trading_date: string;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  close_price: number | null;
  volume: number | null;
  price_change: number | null;
  price_change_percent: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  boll_upper: number | null;
  boll_middle: number | null;
  boll_lower: number | null;
  stochastic_k: number | null;
  stochastic_d: number | null;
  williams_r: number | null;
  atr14: number | null;
  volatility_20: number | null;
  pattern_name: string | null;
  pattern_bullish: boolean | null;
  next_forecast_price: number | null;
  next_forecast_lo: number | null;
  next_forecast_hi: number | null;
  forecast_hit: boolean | null;
}

interface WhatHappenedDetails {
  symbol: string;
  trading_date: string;
  historical: HistoricalRow | null;
  indicators: IndicatorRow | null;
  patterns: PatternRow[];
  forecast_history: ForecastHistoryRow[];
  forecasts: ForecastRow[];
  historical_series: HistoricalRow[];
}

interface HistoricalRow {
  stock_symbol: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

interface IndicatorRow {
  stock_symbol: string;
  date: string;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  boll_upper: number | null;
  boll_middle: number | null;
  boll_lower: number | null;
  stochastic_k: number | null;
  stochastic_d: number | null;
  williams_r: number | null;
  atr14: number | null;
  volatility_20: number | null;
}

interface PatternRow {
  stock_symbol: string;
  date: string;
  pattern_name: string;
  bullish: boolean | null;
  description?: string | null;
  confidence?: number | null;
}

interface ForecastHistoryRow {
  stock_symbol: string;
  forecast_date: string;
  predicted_lo: number | null;
  predicted_hi: number | null;
  actual_low: number | null;
  actual_high: number | null;
  predicted_price: number | null;
  actual_close: number | null;
  hit_range: boolean | null;
}

interface ForecastRow {
  stock_symbol: string;
  forecast_date: string;
  predicted_lo: number | null;
  predicted_hi: number | null;
  predicted_price: number | null;
  confidence: number | null;
}

const numberLocale = 'en-US';

const formatNumberByLocale = (value: number | null | undefined, _language: string, fractionDigits = 2) => {
  if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const PriceChangeCell: React.FC<{ change: number | null; changePercent: number | null; language: string }> = ({ changePercent, language }) => {
  if (changePercent === null || Number.isNaN(changePercent)) {
    return <span className="text-gray-400 text-sm font-medium">-</span>;
  }

  const isPositive = changePercent >= 0;
  return (
    <div className={`flex items-center justify-end gap-1 text-[10px] font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {isPositive ? <ArrowUpIcon className="w-3.5 h-3.5" /> : <ArrowDownIcon className="w-3.5 h-3.5" />}
      <span>
        {formatNumberByLocale(changePercent, language)}%
      </span>
    </div>
  );
};

const RangeDisplay: React.FC<{ low: number | null; high: number | null; language: string }> = ({ low, high, language }) => {
  if ((low === null || typeof low === 'undefined') && (high === null || typeof high === 'undefined')) {
    return <span className="text-gray-400 text-xs font-medium">-</span>;
  }

  const minValue = low === null || typeof low === 'undefined' ? null : formatNumberByLocale(Math.min(low, high ?? low), language);
  const maxValue = high === null || typeof high === 'undefined' ? null : formatNumberByLocale(Math.max(high, low ?? high), language);

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
      <span className="text-red-500 dark:text-red-300">{minValue ?? '-'}</span>
      <span className="text-gray-400">→</span>
      <span className="text-green-500 dark:text-green-300">{maxValue ?? '-'}</span>
    </span>
  );
};

const ForecastRangeDisplay: React.FC<{ low: number | null; high: number | null; language: string }> = ({ low, high, language }) => {
  if (low === null || high === null) {
    return <span className="text-gray-400 text-xs font-medium">-</span>;
  }
  const min = Math.min(low, high);
  const max = Math.max(low, high);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
      <span className="text-red-500 dark:text-red-300">{formatNumberByLocale(min, language)}</span>
      <span className="text-gray-400">→</span>
      <span className="text-green-500 dark:text-green-300">{formatNumberByLocale(max, language)}</span>
    </span>
  );
};

const RsiDisplay: React.FC<{ value: number | null; language: string }> = ({ value, language }) => {
  if (value === null || Number.isNaN(value)) {
    return <span className="text-gray-400 text-sm font-medium">-</span>;
  }

  const status = value > 70 ? 'overbought' : value < 30 ? 'oversold' : 'neutral';
  const theme =
    status === 'overbought'
      ? {
          badge: 'bg-gradient-to-br from-rose-400 via-red-500 to-orange-400 text-white',
          caption: 'text-red-600 dark:text-red-300',
          label: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          text: 'Overbought',
        }
      : status === 'oversold'
      ? {
          badge: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-400 text-white',
          caption: 'text-green-600 dark:text-green-300',
          label: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          text: 'Oversold',
        }
      : {
          badge: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white',
          caption: 'text-blue-600 dark:text-blue-300',
          label: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          text: 'Neutral',
        };

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shadow-sm ${theme.badge}`}>
      <span>{formatNumberByLocale(value, language, 1)}</span>
      <span className="uppercase tracking-wider text-[9px]">{theme.text}</span>
    </span>
  );
};

const PriceDisplay: React.FC<{ price: number | null; date?: string | null; language: string }> = ({ price, date, language }) => {
  if (price === null || Number.isNaN(price)) {
    return <span className="text-gray-400 text-xs font-medium">-</span>;
  }
  return (
    <div className="text-center leading-tight text-[10px]">
      <div className="font-semibold text-gray-900 dark:text-gray-100 text-[11px]">
        {formatNumberByLocale(price, language, 2)}
      </div>
      {date && (
        <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">{date.split('-').join('/')}</div>
      )}
    </div>
  );
};

const PatternBadge: React.FC<{ name: string | null; bullish: boolean | null }> = ({ name, bullish }) => {
  if (!name) {
    return <span className="text-gray-400 text-xs">-</span>;
  }
  const isBullish = bullish === null ? null : bullish;
  const classes =
    isBullish === null
      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      : isBullish
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';

  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${classes}`}>{name}</span>;
};

const getMetricBadgeClasses = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
  if (value > 0) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  }
  if (value < 0) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
};
const WhatHappened: React.FC = () => {
  const { t, language } = useLanguage();
  const { isFavorite, toggleFavorite, favoriteSymbols } = useFavorites();
  const [summary, setSummary] = useState<WhatHappenedSummaryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hit' | 'miss'>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'change' | 'rsi'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [details, setDetails] = useState<WhatHappenedDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const detailsCacheRef = useRef<Map<string, WhatHappenedDetails>>(new Map());
  const latestRequestSymbolRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      setSummaryError(null);
      try {
        const { data, error } = await supabase.rpc('get_what_happened_summary');
        if (error) throw error;
        const rows: WhatHappenedSummaryItem[] = (Array.isArray(data) ? data : []).map((item: any) => ({
          ...item,
          open_price: item.open_price === null ? null : Number(item.open_price),
          high_price: item.high_price === null ? null : Number(item.high_price),
          low_price: item.low_price === null ? null : Number(item.low_price),
          close_price: item.close_price === null ? null : Number(item.close_price),
          volume: item.volume === null ? null : Number(item.volume),
          price_change: item.price_change === null ? null : Number(item.price_change),
          price_change_percent: item.price_change_percent === null ? null : Number(item.price_change_percent),
          rsi: item.rsi === null ? null : Number(item.rsi),
          macd: item.macd === null ? null : Number(item.macd),
          macd_signal: item.macd_signal === null ? null : Number(item.macd_signal),
          macd_histogram: item.macd_histogram === null ? null : Number(item.macd_histogram),
          sma20: item.sma20 === null ? null : Number(item.sma20),
          sma50: item.sma50 === null ? null : Number(item.sma50),
          sma200: item.sma200 === null ? null : Number(item.sma200),
          ema12: item.ema12 === null ? null : Number(item.ema12),
          ema26: item.ema26 === null ? null : Number(item.ema26),
          boll_upper: item.boll_upper === null ? null : Number(item.boll_upper),
          boll_middle: item.boll_middle === null ? null : Number(item.boll_middle),
          boll_lower: item.boll_lower === null ? null : Number(item.boll_lower),
          stochastic_k: item.stochastic_k === null ? null : Number(item.stochastic_k),
          stochastic_d: item.stochastic_d === null ? null : Number(item.stochastic_d),
          williams_r: item.williams_r === null ? null : Number(item.williams_r),
          atr14: item.atr14 === null ? null : Number(item.atr14),
          volatility_20: item.volatility_20 === null ? null : Number(item.volatility_20),
          next_forecast_price: item.next_forecast_price === null ? null : Number(item.next_forecast_price),
          next_forecast_lo: item.next_forecast_lo === null ? null : Number(item.next_forecast_lo),
          next_forecast_hi: item.next_forecast_hi === null ? null : Number(item.next_forecast_hi),
        }));
        setSummary(rows);
        if (rows.length > 0) {
          setSelectedSymbol(rows[0].stock_symbol);
        }
      } catch (err: any) {
        console.error('Failed to load What Happened summary', err);
        setSummaryError(err.message || 'failed to load summary');
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    if (!selectedSymbol) {
      setDetails(null);
      setLoadingDetails(false);
      return;
    }

    const cachedDetails = detailsCacheRef.current.get(selectedSymbol);
    if (cachedDetails) {
      setDetails(cachedDetails);
      setDetailsError(null);
      setLoadingDetails(false);
      return;
    }

    let cancelled = false;
    latestRequestSymbolRef.current = selectedSymbol;
    setLoadingDetails(true);
    setDetailsError(null);

    const fetchDetails = async () => {
      try {
        const { data, error } = await supabase.rpc('get_what_happened_stock_details', { p_symbol: selectedSymbol });
        if (cancelled || latestRequestSymbolRef.current !== selectedSymbol) {
          return;
        }
        if (error) {
          throw error;
        }
        if (!data || (data as any).error === 'no_data') {
          detailsCacheRef.current.delete(selectedSymbol);
          setDetails(null);
        } else {
          const normalized = normalizeDetails(data);
          detailsCacheRef.current.set(selectedSymbol, normalized);
          setDetails(normalized);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load What Happened details', err);
        setDetailsError(err.message || 'failed to load details');
      } finally {
        if (!cancelled && latestRequestSymbolRef.current === selectedSymbol) {
          setLoadingDetails(false);
        }
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedSymbol]);

  const latestDate = useMemo(() => {
    if (!summary.length) return null;
    return summary[0].trading_date;
  }, [summary]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }), []);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const percentFormatter = useMemo(() => new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const formatNumber = (value: number | null | undefined, fractionDigits = 2) =>
    formatNumberByLocale(value, language, fractionDigits);

  const toNumberOrNull = (value: any): number | null => {
    if (value === null || typeof value === 'undefined' || value === '') {
      return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? null : numeric;
  };

  const toBooleanOrNull = (value: any): boolean | null => {
    if (value === null || typeof value === 'undefined') {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (lowered === 'true' || lowered === 't' || lowered === 'yes') return true;
      if (lowered === 'false' || lowered === 'f' || lowered === 'no') return false;
    }
    return Boolean(value);
  };

  const normalizeDetails = (payload: any): WhatHappenedDetails => {
    const historical = payload?.historical
      ? {
          stock_symbol: payload.historical.stock_symbol,
          date: payload.historical.date,
          open: toNumberOrNull(payload.historical.open),
          high: toNumberOrNull(payload.historical.high),
          low: toNumberOrNull(payload.historical.low),
          close: toNumberOrNull(payload.historical.close),
          volume: toNumberOrNull(payload.historical.volume),
        }
      : null;

    const indicators = payload?.indicators
      ? {
          stock_symbol: payload.indicators.stock_symbol,
          date: payload.indicators.date,
          rsi: toNumberOrNull(payload.indicators.rsi),
          macd: toNumberOrNull(payload.indicators.macd),
          macd_signal: toNumberOrNull(payload.indicators.macd_signal),
          macd_histogram: toNumberOrNull(payload.indicators.macd_histogram),
          sma20: toNumberOrNull(payload.indicators.sma20),
          sma50: toNumberOrNull(payload.indicators.sma50),
          sma200: toNumberOrNull(payload.indicators.sma200),
          ema12: toNumberOrNull(payload.indicators.ema12),
          ema26: toNumberOrNull(payload.indicators.ema26),
          boll_upper: toNumberOrNull(payload.indicators.boll_upper),
          boll_middle: toNumberOrNull(payload.indicators.boll_middle),
          boll_lower: toNumberOrNull(payload.indicators.boll_lower),
          stochastic_k: toNumberOrNull(payload.indicators.stochastic_k),
          stochastic_d: toNumberOrNull(payload.indicators.stochastic_d),
          williams_r: toNumberOrNull(payload.indicators.williams_r),
          atr14: toNumberOrNull(payload.indicators.atr14),
          volatility_20: toNumberOrNull(payload.indicators.volatility_20),
        }
      : null;

    const patterns: PatternRow[] = Array.isArray(payload?.patterns)
      ? payload.patterns.map((pattern: any) => ({
          stock_symbol: pattern.stock_symbol,
          date: pattern.date,
          pattern_name: pattern.pattern_name,
          bullish: toBooleanOrNull(pattern.bullish),
          description: pattern.description ?? null,
          confidence: toNumberOrNull(pattern.confidence),
        }))
      : [];

    const forecast_history: ForecastHistoryRow[] = Array.isArray(payload?.forecast_history)
      ? payload.forecast_history.map((history: any) => ({
          stock_symbol: history.stock_symbol,
          forecast_date: history.forecast_date,
          predicted_lo: toNumberOrNull(history.predicted_lo),
          predicted_hi: toNumberOrNull(history.predicted_hi),
          actual_low: toNumberOrNull(history.actual_low),
          actual_high: toNumberOrNull(history.actual_high),
          predicted_price: toNumberOrNull(history.predicted_price),
          actual_close: toNumberOrNull(history.actual_close),
          hit_range: toBooleanOrNull(history.hit_range),
        }))
      : [];

    const forecasts: ForecastRow[] = Array.isArray(payload?.forecasts)
      ? payload.forecasts.map((forecast: any) => ({
          stock_symbol: forecast.stock_symbol,
          forecast_date: forecast.forecast_date,
          predicted_lo: toNumberOrNull(forecast.predicted_lo),
          predicted_hi: toNumberOrNull(forecast.predicted_hi),
          predicted_price: toNumberOrNull(forecast.predicted_price),
          confidence: toNumberOrNull(forecast.confidence),
        }))
      : [];

    const historical_series: HistoricalRow[] = Array.isArray(payload?.historical_series)
      ? payload.historical_series.map((row: any) => ({
          stock_symbol: row.stock_symbol,
          date: row.date,
          open: toNumberOrNull(row.open),
          high: toNumberOrNull(row.high),
          low: toNumberOrNull(row.low),
          close: toNumberOrNull(row.close),
          volume: toNumberOrNull(row.volume),
        }))
      : [];

    return {
      symbol: payload.symbol,
      trading_date: payload.trading_date,
      historical,
      indicators,
      patterns,
      forecast_history,
      forecasts,
      historical_series,
    };
  };

  const totalHits = useMemo(() => summary.filter(item => item.forecast_hit === true).length, [summary]);
  const totalMisses = useMemo(() => summary.filter(item => item.forecast_hit === false).length, [summary]);

  const filteredSummary = useMemo(() => {
    let result = summary.filter((item) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        item.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.stock_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFavorites = !showFavorites || isFavorite(item.stock_symbol);
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'hit' && item.forecast_hit === true) ||
        (activeFilter === 'miss' && item.forecast_hit === false);

      return matchesSearch && matchesFavorites && matchesFilter;
    });

    result = result.sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'change': {
          const aVal = a.price_change_percent ?? 0;
          const bVal = b.price_change_percent ?? 0;
          return (aVal - bVal) * direction;
        }
        case 'rsi': {
          const aVal = a.rsi ?? 50;
          const bVal = b.rsi ?? 50;
          return (aVal - bVal) * direction;
        }
        case 'symbol':
        default:
          return a.stock_symbol.localeCompare(b.stock_symbol) * direction;
      }
    });

    return result;
  }, [summary, searchTerm, showFavorites, isFavorite, favoriteSymbols, activeFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredSummary.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSummary = useMemo(
    () => filteredSummary.slice(startIndex, startIndex + itemsPerPage),
    [filteredSummary, startIndex, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showFavorites, activeFilter]);

  useEffect(() => {
    if (filteredSummary.length === 0) {
      setSelectedSymbol(null);
    } else if (!selectedSymbol || !filteredSummary.some(item => item.stock_symbol === selectedSymbol)) {
      setSelectedSymbol(filteredSummary[0].stock_symbol);
    }
  }, [filteredSummary, selectedSymbol]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSummary.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredSummary, currentPage, itemsPerPage]);

  const indicatorGroups = useMemo(() => {
    const data = details?.indicators;
    if (!data) return [];
    return [
      {
        title: t('what_happened_indicator_rsi'),
        metrics: [
          { label: 'RSI', value: data.rsi },
        ],
      },
      {
        title: t('what_happened_indicator_macd'),
        metrics: [
          { label: 'MACD', value: data.macd },
          { label: 'Signal', value: data.macd_signal },
          { label: 'Histogram', value: data.macd_histogram },
        ],
      },
      {
        title: t('what_happened_indicator_moving_averages'),
        metrics: [
          { label: 'SMA20', value: data.sma20 },
          { label: 'SMA50', value: data.sma50 },
          { label: 'SMA200', value: data.sma200 },
          { label: 'EMA12', value: data.ema12 },
          { label: 'EMA26', value: data.ema26 },
        ],
      },
      {
        title: t('what_happened_indicator_bollinger'),
        metrics: [
          { label: 'Upper', value: data.boll_upper },
          { label: 'Middle', value: data.boll_middle },
          { label: 'Lower', value: data.boll_lower },
        ],
      },
      {
        title: t('what_happened_indicator_stochastic'),
        metrics: [
          { label: '%K', value: data.stochastic_k },
          { label: '%D', value: data.stochastic_d },
        ],
      },
      {
        title: t('what_happened_indicator_williams'),
        metrics: [
          { label: '%R', value: data.williams_r },
        ],
      },
      {
        title: t('what_happened_indicator_volatility'),
        metrics: [
          { label: 'Volatility 20', value: data.volatility_20 },
          { label: 'ATR14', value: data.atr14 },
        ],
      },
    ].filter(group => group.metrics.some(metric => metric.value !== null && typeof metric.value !== 'undefined'));
  }, [details?.indicators, t]);

  const indicatorCardStyles = useMemo(
    () => [
      {
        gradient: 'from-sky-100 via-white to-blue-50 dark:from-sky-900/40 dark:via-slate-900 dark:to-blue-900/30',
        accent: 'text-sky-600 dark:text-sky-300',
        iconBg: 'bg-sky-500/90',
      },
      {
        gradient: 'from-emerald-100 via-white to-emerald-50 dark:from-emerald-900/30 dark:via-slate-900 dark:to-emerald-900/20',
        accent: 'text-emerald-600 dark:text-emerald-300',
        iconBg: 'bg-emerald-500/80',
      },
      {
        gradient: 'from-amber-100 via-white to-orange-50 dark:from-amber-900/30 dark:via-slate-900 dark:to-orange-900/20',
        accent: 'text-amber-600 dark:text-amber-300',
        iconBg: 'bg-amber-500/80',
      },
      {
        gradient: 'from-purple-100 via-white to-indigo-50 dark:from-purple-900/30 dark:via-slate-900 dark:to-indigo-900/20',
        accent: 'text-indigo-600 dark:text-indigo-300',
        iconBg: 'bg-indigo-500/80',
      },
      {
        gradient: 'from-rose-100 via-white to-rose-50 dark:from-rose-900/30 dark:via-slate-900 dark:to-rose-900/20',
        accent: 'text-rose-600 dark:text-rose-300',
        iconBg: 'bg-rose-500/80',
      },
      {
        gradient: 'from-teal-100 via-white to-teal-50 dark:from-teal-900/30 dark:via-slate-900 dark:to-teal-900/20',
        accent: 'text-teal-600 dark:text-teal-300',
        iconBg: 'bg-teal-500/80',
      },
      {
        gradient: 'from-slate-100 via-white to-slate-50 dark:from-slate-900/40 dark:via-slate-900 dark:to-slate-900/20',
        accent: 'text-slate-600 dark:text-slate-300',
        iconBg: 'bg-slate-500/80',
      },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('what_happened')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-3xl">{t('what_happened_description')}</p>
        </div>
        {latestDate && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2 text-blue-700 dark:text-blue-200">
            <InformationCircleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{t('what_happened_last_session')}: {latestDate}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="xl:col-span-8 lg:col-span-12 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('what_happened_last_session')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('what_happened_select_stock')}</p>
              </div>
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('what_happened_filters_placeholder') || 'Search...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-nextrow-primary dark:bg-gray-800 dark:text-white text-sm"
                />
                <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeFilter === 'all' ? 'bg-white dark:bg-gray-700 text-nextrow-primary' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t('all')} ({summary.length})
                </button>
                <button
                  onClick={() => setActiveFilter('hit')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeFilter === 'hit' ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-300' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t('hits')} ({totalHits})
                </button>
                <button
                  onClick={() => setActiveFilter('miss')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeFilter === 'miss' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-300' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t('misses')} ({totalMisses})
                </button>
              </div>

              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all border ${
                  showFavorites
                    ? 'bg-yellow-400 text-black border-yellow-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                <StarIcon className={`w-4 h-4 ${showFavorites ? 'fill-current' : 'text-gray-400'}`} />
                {t('favorites')}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    setSortBy('symbol');
                    setSortOrder(sortBy === 'symbol' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${sortBy === 'symbol' ? 'border-nextrow-primary text-nextrow-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {t('symbol')}
                </button>
                <button
                  onClick={() => {
                    setSortBy('change');
                    setSortOrder(sortBy === 'change' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${sortBy === 'change' ? 'border-nextrow-primary text-nextrow-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  {t('column_change_percent')}
                </button>
                <button
                  onClick={() => {
                    setSortBy('rsi');
                    setSortOrder(sortBy === 'rsi' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${sortBy === 'rsi' ? 'border-nextrow-primary text-nextrow-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                  RSI
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingSummary ? (
              <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                <SpinnerIcon className="w-8 h-8 animate-spin" />
              </div>
            ) : summaryError ? (
              <div className="px-6 py-8 text-center text-red-600 dark:text-red-400 text-sm">{summaryError}</div>
            ) : filteredSummary.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">{t('what_happened_no_data')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                      <th className="px-2 py-2 text-center font-semibold">★</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('column_symbol')}</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('close')}</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('column_change_percent')}</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('column_actual_range')}</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('column_expected_range')}</th>
                      <th className="px-2 py-2 text-center font-semibold">RSI</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('column_pattern')}</th>
                      <th className="px-2 py-2 text-center font-semibold">{t('column_result')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 whitespace-nowrap">
                    {paginatedSummary.map((item) => {
                      const isSelected = item.stock_symbol === selectedSymbol;
                      return (
                        <tr
                          key={item.stock_symbol}
                          onClick={() => setSelectedSymbol(item.stock_symbol)}
                          className={`group transition-all duration-200 cursor-pointer ${
                            isSelected ? 'bg-nextrow-primary/10 dark:bg-nextrow-primary/20' : 'hover:bg-blue-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <td className="px-1.5 py-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.stock_symbol);
                              }}
                              className={`p-1 rounded-lg transition-transform hover:scale-110 ${
                                isFavorite(item.stock_symbol)
                                  ? 'text-yellow-500 dark:text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                              }`}
                            >
                              <StarIcon className={`w-4 h-4 ${isFavorite(item.stock_symbol) ? 'fill-current' : ''}`} />
                            </button>
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <div className="font-semibold text-nextrow-primary tracking-wide">{item.stock_symbol}</div>
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <PriceDisplay price={item.close_price} date={item.trading_date} language={language} />
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <PriceChangeCell change={item.price_change} changePercent={item.price_change_percent} language={language} />
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <RangeDisplay low={item.low_price} high={item.high_price} language={language} />
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <ForecastRangeDisplay low={item.next_forecast_lo} high={item.next_forecast_hi} language={language} />
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <RsiDisplay value={item.rsi} language={language} />
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <PatternBadge name={item.pattern_name} bullish={item.pattern_bullish} />
                          </td>
                          <td className="px-1.5 py-2 text-center">
                            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                              item.forecast_hit ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {item.forecast_hit ? t('hit') : t('miss')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredSummary.length > itemsPerPage && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredSummary.length)}</span>
                {' '}{t('of') || 'من'} <span className="font-semibold">{filteredSummary.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {t('previous')}
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="xl:col-span-4 lg:col-span-12 bg-white dark:bg-gray-900 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {selectedSymbol === null ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <InformationCircleIcon className="w-10 h-10 mb-3" />
              <p>{t('what_happened_select_stock')}</p>
            </div>
          ) : loadingDetails ? (
            <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <SpinnerIcon className="w-8 h-8 animate-spin" />
              <span className="ml-3 rtl:mr-3 text-sm font-medium">{t('what_happened_loading_details')}</span>
            </div>
          ) : detailsError ? (
            <div className="px-6 py-8 text-center text-red-600 dark:text-red-400 text-sm">{detailsError}</div>
          ) : !details ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <InformationCircleIcon className="w-10 h-10 mb-3" />
              <p>{t('what_happened_no_data')}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4 text-[11px]">
               <header className="flex items-center justify-between gap-3">
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{details.symbol}</h3>
                   <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('column_trading_date')}: {details.trading_date}</p>
                 </div>
                 <div className="text-[10px] text-gray-500 dark:text-gray-400">
                   {t('column_change_percent')}: {
                     (() => {
                       const summaryRow = summary.find((row) => row.stock_symbol === details.symbol);
                       if (!summaryRow || summaryRow.price_change_percent === null) return '-';
                       return `${percentFormatter.format(summaryRow.price_change_percent)}%`;
                     })()
                   }
                 </div>
               </header>
 
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50 via-white to-blue-100 dark:from-blue-900/30 dark:via-slate-900 dark:to-blue-900/20 p-4 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wide text-blue-500 dark:text-blue-300">{t('close')}</p>
                    <div className="mt-2 text-2xl font-semibold text-blue-800 dark:text-blue-200">{formatNumber(details.historical?.close)}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] text-blue-900 dark:text-blue-100">
                      <div>
                        <span className="block text-xs text-blue-400 dark:text-blue-300">Open</span>
                        <span className="text-sm font-semibold">{formatNumber(details.historical?.open)}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-blue-400 dark:text-blue-300">Volume</span>
                        <span className="text-sm font-semibold">{details.historical?.volume === null || typeof details.historical?.volume === 'undefined' ? '-' : numberFormatter.format(details.historical.volume)}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-blue-400 dark:text-blue-300">High</span>
                        <span className="text-sm font-semibold">{formatNumber(details.historical?.high)}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-blue-400 dark:text-blue-300">Low</span>
                        <span className="text-sm font-semibold">{formatNumber(details.historical?.low)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-900/20 dark:via-slate-900 dark:to-emerald-900/30 p-4 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-500 dark:text-emerald-300">{t('column_actual_range')}</p>
                    <div className="mt-2 text-xl font-semibold text-emerald-700 dark:text-emerald-200">
                      {formatNumber(details.historical?.low)} - {formatNumber(details.historical?.high)}
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-emerald-200/60 dark:bg-emerald-900/40 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                    </div>
                    <p className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-300">{t('what_happened_recent_prices')}</p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-900/20 dark:via-slate-900 dark:to-orange-900/30 p-4 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wide text-amber-500 dark:text-amber-300">{t('column_change_percent')}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className={`text-2xl font-semibold ${Number(details?.indicators?.rsi ?? 0) >= 50 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-500 dark:text-rose-300'}`}>
                        {formatNumber(summary.find((row) => row.stock_symbol === details.symbol)?.price_change_percent ?? null, 2)}%
                      </span>
                      <span className="text-xs text-amber-500 dark:text-amber-300">RSI {formatNumber(details.indicators?.rsi ?? null, 1)}</span>
                    </div>
                    <p className="mt-3 text-[10px] text-amber-600 dark:text-amber-300">{t('what_happened_last_session')}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {indicatorGroups.map((group, index) => {
                    const palette = indicatorCardStyles[index % indicatorCardStyles.length];
                    return (
                      <div
                        key={group.title}
                        className={`rounded-xl border border-white/60 dark:border-slate-800 bg-gradient-to-br ${palette.gradient} p-4 shadow`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className={`text-[11px] font-semibold ${palette.accent}`}>{group.title}</h5>
                            <span className="text-[9px] text-gray-500 dark:text-gray-400">{t('what_happened_technicals')}</span>
                          </div>
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold ${palette.iconBg}`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {group.metrics.map((metric) => (
                            <div key={metric.label} className="flex items-center justify-between text-[10px]">
                              <span className="uppercase tracking-wide text-gray-500 dark:text-gray-400">{metric.label}</span>
                              <span className={`px-1.5 py-0.5 rounded-full font-semibold ${getMetricBadgeClasses(metric.value)}`}>
                                {metric.value === null ? '-' : formatNumber(metric.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                

              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WhatHappened;


