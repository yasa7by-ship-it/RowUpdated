import React, { useMemo, useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import type { NasdaqDailySnapshot, DailyChecklistItem, PageState } from '../../types';
import { InformationCircleIcon, TrendingUpIcon, TrendingDownIcon, StarIcon, SpinnerIcon } from '../icons';

interface NasdaqSnapshotProps {
  setPage?: (state: PageState) => void;
}

const NasdaqSnapshot: React.FC<NasdaqSnapshotProps> = ({ setPage }) => {
  const { language, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [snapshot, setSnapshot] = useState<NasdaqDailySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checklistData, setChecklistData] = useState<DailyChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'hits' | 'misses'>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const CHECKLIST_CACHE_KEY = 'stockAnalysisData-v3';
  const CHECKLIST_CACHE_TIMESTAMP_KEY = 'stockAnalysisTimestamp-v3';
  const CHECKLIST_CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .rpc('get_latest_nasdaq_snapshot')
          .abortSignal(controller.signal)
          .maybeSingle();

        if (!isMounted) return;
        if (error) throw error;
        setSnapshot(data as NasdaqDailySnapshot | null);
      } catch (err: any) {
        if (!isMounted || controller.signal.aborted) return;
        console.error('Failed to load Nasdaq snapshot:', err);
        setError(err.message || 'failed to load nasdaq snapshot');
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSnapshot();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchChecklist = async () => {
      setChecklistError(null);
      try {
        const cachedDataString = localStorage.getItem(CHECKLIST_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CHECKLIST_CACHE_TIMESTAMP_KEY);

        if (cachedDataString && cachedTimestamp) {
          try {
            const cachedData: DailyChecklistItem[] = JSON.parse(cachedDataString);
            if (isMounted) {
              setChecklistData(cachedData);
              setLoadingChecklist(false);
            }

            const isCacheStale = Date.now() - parseInt(cachedTimestamp, 10) > CHECKLIST_CACHE_DURATION_MS;
            if (!isCacheStale) {
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse cached checklist data:', parseError);
          }
        } else if (isMounted) {
          setLoadingChecklist(true);
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('get_daily_checklist');
        if (rpcError) throw rpcError;

        if (!isMounted) return;

        const freshData = (rpcData || []) as DailyChecklistItem[];
        setChecklistData(freshData);
        try {
          localStorage.setItem(CHECKLIST_CACHE_KEY, JSON.stringify(freshData));
          localStorage.setItem(CHECKLIST_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (storageError) {
          console.error('Failed to cache checklist data:', storageError);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setChecklistError(err.message || 'failed to load daily checklist');
      } finally {
        if (isMounted) {
          setLoadingChecklist(false);
        }
      }
    };

    fetchChecklist();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, resultFilter, showFavorites]);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }),
    []
  );
  const compactFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    []
  );
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }),
    []
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    []
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    []
  );

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return null;
    return `${percentFormatter.format(value)}%`;
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return null;
    return numberFormatter.format(value);
  };

  const formatCompact = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return null;
    return compactFormatter.format(value);
  };

  const formatDateTime = (isoDate: string, isoTime?: string | null) => {
    const date = new Date(isoDate);
    const datePart = dateFormatter.format(date).replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3/$1/$2');
    if (isoTime) {
      const time = new Date(isoTime);
      const timePart = timeFormatter.format(time);
      return `${datePart}  ${timePart}`;
    }
    return `${datePart}  ${timeFormatter.format(date)}`;
  };

  const processedChecklist = useMemo(() => {
    return checklistData.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.stock_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        resultFilter === 'all' ||
        (resultFilter === 'hits' && item.is_hit) ||
        (resultFilter === 'misses' && !item.is_hit);
      const matchesFavorite = !showFavorites || isFavorite(item.stock_symbol);
      return matchesSearch && matchesFilter && matchesFavorite;
    });
  }, [checklistData, searchTerm, resultFilter, showFavorites, isFavorite]);

  const totalPages = Math.ceil(processedChecklist.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChecklist = processedChecklist.slice(startIndex, startIndex + itemsPerPage);

  const PriceDateDisplay: React.FC<{ price: number | null; date: string | null }> = ({ price, date }) => {
    if (price === null || typeof price === 'undefined') {
      return <span className="text-gray-400 text-xs">N/A</span>;
    }
    const formattedDate = date ? formatDateTime(date).split('  ')[0] : 'N/A';
    return (
      <div className="space-y-0.5 text-center">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          ${numberFormatter.format(price)}
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{formattedDate}</div>
      </div>
    );
  };

  const ActualRangeDisplay: React.FC<{ low: number | null; high: number | null }> = ({ low, high }) => {
    if ((low === null || typeof low === 'undefined') && (high === null || typeof high === 'undefined')) {
      return <span className="text-gray-400 text-sm font-medium">N/A - N/A</span>;
    }

    if (low === null || typeof low === 'undefined') {
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-medium text-gray-400">N/A</span>
          <span className="text-xs text-gray-400">-</span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {numberFormatter.format(high!)}
          </span>
        </div>
      );
    }

    if (high === null || typeof high === 'undefined') {
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-bold text-red-600 dark:text-red-400">{numberFormatter.format(low)}</span>
          <span className="text-xs text-gray-400">-</span>
          <span className="text-sm font-medium text-gray-400">N/A</span>
        </div>
      );
    }

    const actualLow = Math.min(low, high);
    const actualHigh = Math.max(low, high);

    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-red-600 dark:text-red-400">{numberFormatter.format(actualLow)}</span>
        <span className="text-xs text-gray-500 font-medium">-</span>
        <span className="text-sm font-bold text-green-600 dark:text-green-400">{numberFormatter.format(actualHigh)}</span>
      </div>
    );
  };

  const ExpectedRangeDisplay: React.FC<{ low: number | null; high: number | null }> = ({ low, high }) => {
    if (low === null || high === null || typeof low === 'undefined' || typeof high === 'undefined') {
      return <span className="text-gray-400 text-sm font-medium">N/A</span>;
    }

    const expectedLow = Math.min(low, high);
    const expectedHigh = Math.max(low, high);

    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-red-600 dark:text-red-400">{numberFormatter.format(expectedLow)}</span>
        <span className="text-xs text-gray-500 font-medium">-</span>
        <span className="text-sm font-bold text-green-600 dark:text-green-400">{numberFormatter.format(expectedHigh)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        {t('loading')}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-3xl p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-4">{t('nasdaq_snapshot')}</h1>
        <p>{t('error_generic') || error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-semibold mb-3 text-gray-900 dark:text-white">{t('nasdaq_snapshot')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('nasdaq_headline_none')}</p>
      </div>
    );
  }

  const changeValue = snapshot.change_points ?? 0;
  const changePositive = typeof changeValue === 'number' ? changeValue >= 0 : false;
  const createdAtText = formatDateTime(snapshot.trading_date, snapshot.created_at ?? undefined);

  const heroStats = [
    { label: t('nasdaq_volume'), value: formatCompact(snapshot.volume) },
    { label: t('nasdaq_low'), value: formatNumber(snapshot.low_price) },
    { label: t('nasdaq_high'), value: formatNumber(snapshot.high_price) },
    { label: t('nasdaq_open'), value: formatNumber(snapshot.open_price) },
  ].filter((item) => item.value);

  const changeMetrics = [
    { label: t('nasdaq_change_points'), value: formatNumber(snapshot.change_points) },
    { label: t('nasdaq_change_percent'), value: formatPercent(snapshot.change_percent) },
  ].filter((item) => item.value);

  const notices = snapshot.metadata_json?.notices ?? [];

  return (
    <div className="flex flex-col items-center py-6 space-y-8">
      <div className="w-full max-w-5xl space-y-8">
        <section className="flex flex-col xl:flex-row gap-6">
          <div className="xl:w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-xl px-6 py-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">{t('nasdaq_change_points')}</h2>
            <div className="space-y-4">
              {changeMetrics.map(({ label, value }, idx) => (
                <div key={label} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-5 py-4 text-center">
                  <span className="block text-[0.55rem] uppercase tracking-[0.35em] text-gray-500 dark:text-gray-500">{label}</span>
                  <span className={`mt-2 block text-3xl font-extrabold tracking-tight ${idx === 0 ? (changePositive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300') : 'text-gray-900 dark:text-white'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-xl px-6 py-7">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-900/30 text-sm text-blue-700 dark:text-blue-200">
                  <span>{createdAtText}</span>
                </div>
                <div className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] uppercase text-gray-500 dark:text-gray-400">
                  <span>{t('nasdaq_snapshot')}</span>
                  <span>NASDAQ COMPOSITE · ^IXIC</span>
                </div>
              </div>

              <div className="text-[3.8rem] md:text-[4.3rem] font-black tracking-tight text-gray-900 dark:text-white leading-none">
                {formatNumber(snapshot.close_price) ?? '--'}
              </div>

              {heroStats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {heroStats.map(({ label, value }) => (
                    <div key={label} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-4 py-3 text-center">
                      <span className="block text-[0.55rem] uppercase tracking-[0.35em] text-gray-500 dark:text-gray-500">{label}</span>
                      <span className="mt-2 block text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {snapshot.headline && (
                <div className="flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
                  <InformationCircleIcon className="w-4 h-4 mt-1 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {snapshot.headline_source ? (
                      <a href={snapshot.headline_source} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-300 underline decoration-dotted">
                        {snapshot.headline}
                      </a>
                    ) : (
                      snapshot.headline
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {notices.length > 0 && (
          <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[20px] px-5 py-4 shadow">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 mb-2">
              <InformationCircleIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{t('nasdaq_metadata_notices')}</span>
            </div>
            <ul className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-2 leading-relaxed">
              {notices.map((notice) => (
                <li key={notice}>{t(notice)}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-xl px-6 py-7 space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'توقعات آخر يوم' : t('stock_analysis_title_last_day')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {language === 'ar'
                  ? 'أحدث نتائج التوقعات للأسهم المتابعة وفق بيانات آخر جلسة.'
                  : t('stock_analysis_page_description_en')}
              </p>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1">
              <button
                onClick={() => setResultFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  resultFilter === 'all'
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('all')}
              </button>
              <button
                onClick={() => setResultFilter('hits')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  resultFilter === 'hits'
                    ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('correct_forecasts')}
              </button>
              <button
                onClick={() => setResultFilter('misses')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  resultFilter === 'misses'
                    ? 'bg-white dark:bg-gray-700 shadow text-rose-600 dark:text-rose-300'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {t('incorrect_forecasts')}
              </button>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search_by_symbol_or_name')}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={() => setShowFavorites((prev) => !prev)}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                  showFavorites
                    ? 'bg-yellow-400 border-yellow-400 text-black'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <StarIcon className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                {t('favorites_filter')}
              </button>
            </div>
          </div>

          {loadingChecklist ? (
            <div className="flex justify-center py-12">
              <SpinnerIcon className="w-8 h-8 text-blue-500" />
            </div>
          ) : checklistError ? (
            <div className="p-4 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-lg">
              {checklistError}
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <tr>
                      <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest w-10">
                        <span className="text-base">★</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[70px]">
                        {t('column_symbol')}
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
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedChecklist.map((item, index) => (
                      <tr
                        key={`${item.stock_symbol}-${index}`}
                        onClick={() => setPage?.({ page: 'stock_details', symbol: item.stock_symbol })}
                        className={`transition-colors duration-200 cursor-pointer ${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50/60 dark:bg-gray-800/60'
                        } hover:bg-blue-50 dark:hover:bg-gray-800`}
                      >
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.stock_symbol);
                            }}
                            className={`p-1 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-200 ${
                              isFavorite(item.stock_symbol)
                                ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                            }`}
                          >
                            <StarIcon className={`w-4 h-4 ${isFavorite(item.stock_symbol) ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-left text-sm font-semibold text-nextrow-primary">
                          {item.stock_symbol}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <PriceDateDisplay price={item.price} date={item.last_updated} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <ActualRangeDisplay low={item.actual_low} high={item.actual_high} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <ExpectedRangeDisplay low={item.predicted_lo} high={item.predicted_hi} />
                        </td>
                      </tr>
                    ))}
                    {paginatedChecklist.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                          {t('no_results_found')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {processedChecklist.length > itemsPerPage && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{processedChecklist.length === 0 ? 0 : startIndex + 1}</span>
                    {' - '}
                    <span className="font-semibold">{Math.min(startIndex + itemsPerPage, processedChecklist.length)}</span>
                    {' '}{t('of')}{' '}
                    <span className="font-semibold">{processedChecklist.length}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="text-gray-400 dark:text-gray-600">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NasdaqSnapshot;
