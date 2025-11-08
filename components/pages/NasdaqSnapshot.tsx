import React, { useMemo, useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import type { NasdaqDailySnapshot } from '../../types';
import { InformationCircleIcon, TrendingUpIcon, TrendingDownIcon } from '../icons';

const NasdaqSnapshot: React.FC = () => {
  const { language, t } = useLanguage();
  const [snapshot, setSnapshot] = useState<NasdaqDailySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      </div>
    </div>
  );
};

export default NasdaqSnapshot;
