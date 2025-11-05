/**
 * Forecast Metrics Utilities — TypeScript
 *
 * Pure functions to compute the visual KPIs and series used in the dashboard:
 * - Forecast Accuracy (Hit Rate)
 * - Inside-Range Ratio
 * - MAPE (high / low / mid)
 * - Average Range Width
 * - Daily time-series (hit rate / inside)
 * - Weekly aggregation
 * - Absolute-error arrays and Histogram bucketing
 * - Radial scores (normalized 0..1 for gauges)
 */

export interface ForecastRow {
  symbol: string;
  forecast_date: string | Date;
  predicted_lo: number;
  predicted_hi: number;
  actual_low?: number;
  actual_high?: number;
  is_hit?: boolean;  // optional precomputed hit flag
  confidence?: number;
}

// -----------------------------
// Helpers
// -----------------------------

/** Ensure finite number. */
const isFiniteNum = (x: number | null | undefined): x is number => {
  return Number.isFinite(x);
};

/** Normalize date to YYYY-MM-DD (local). */
const toYMD = (d: string | Date): string => {
  const dt = (d instanceof Date) ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Clamp to [0,1]. */
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Linear normalize to 0..1 over [min,max]. */
const normalize = (value: number, min: number, max: number): number => {
  if (!isFiniteNum(value) || !isFiniteNum(min) || !isFiniteNum(max) || min === max) return 0;
  return clamp01((value - min) / (max - min));
};

// -----------------------------
// Core predicates & transforms
// -----------------------------

/**
 * Returns true if the actual [low,high] fully lies inside predicted [lo,hi].
 * If actuals are missing, returns false.
 */
const isInsidePredictedRange = (r: ForecastRow): boolean => {
  if (!isFiniteNum(r.actual_low) || !isFiniteNum(r.actual_high)) return false;
  return r.actual_low >= r.predicted_lo && r.actual_high <= r.predicted_hi;
};

/** Compute mid values. */
const predictedMid = (r: ForecastRow): number => (r.predicted_lo + r.predicted_hi) / 2;

const actualMid = (r: ForecastRow): number => {
  if (isFiniteNum(r.actual_low) && isFiniteNum(r.actual_high)) {
    return (r.actual_low + r.actual_high) / 2;
  }
  return NaN;
};

/** Absolute percentage error (APE) = |y - yhat| / |y|. */
const ape = (y: number, yhat: number): number => {
  if (isFiniteNum(y) && isFiniteNum(yhat) && Math.abs(y) > 1e-12) {
    return Math.abs(y - yhat) / Math.abs(y);
  }
  return NaN;
};

// -----------------------------
// KPIs
// -----------------------------

export interface HitRateResult {
  hits: number;
  total: number;
  rate: number;
}

/**
 * Forecast Accuracy (Hit Rate).
 * Uses r.is_hit if provided; else derives via isInsidePredictedRange(r).
 */
export const hitRate = (rows: ForecastRow[]): HitRateResult => {
  const total = rows.length;
  let hits = 0;
  for (const r of rows) {
    const h = (typeof r.is_hit === 'boolean') ? r.is_hit : isInsidePredictedRange(r);
    if (h) hits++;
  }
  return { hits, total, rate: total ? hits / total : 0 };
};

/** Inside-range ratio (same as hitRate by range definition). */
export const insideRangeRatio = (rows: ForecastRow[]): HitRateResult => hitRate(rows);

/**
 * Average predicted range width = mean(predicted_hi - predicted_lo).
 * Ignores rows with invalid numbers.
 */
export const averageRangeWidth = (rows: ForecastRow[]): number => {
  let sum = 0, n = 0;
  for (const r of rows) {
    if (isFiniteNum(r.predicted_lo) && isFiniteNum(r.predicted_hi)) {
      sum += (r.predicted_hi - r.predicted_lo);
      n++;
    }
  }
  return n ? sum / n : 0;
};

/**
 * MAPE on highs.
 */
export const mapeHigh = (rows: ForecastRow[]): number => {
  let sum = 0, n = 0;
  for (const r of rows) {
    if (isFiniteNum(r.actual_high) && isFiniteNum(r.predicted_hi)) {
      const v = ape(r.actual_high, r.predicted_hi);
      if (Number.isFinite(v)) { sum += v; n++; }
    }
  }
  return n ? (sum / n) : 0;
};

/** MAPE on lows. */
export const mapeLow = (rows: ForecastRow[]): number => {
  let sum = 0, n = 0;
  for (const r of rows) {
    if (isFiniteNum(r.actual_low) && isFiniteNum(r.predicted_lo)) {
      const v = ape(r.actual_low, r.predicted_lo);
      if (Number.isFinite(v)) { sum += v; n++; }
    }
  }
  return n ? (sum / n) : 0;
};

/** MAPE on mids (average of lo/hi). */
export const mapeMid = (rows: ForecastRow[]): number => {
  let sum = 0, n = 0;
  for (const r of rows) {
    const y = actualMid(r);
    const yhat = predictedMid(r);
    const v = ape(y, yhat);
    if (Number.isFinite(v)) { sum += v; n++; }
  }
  return n ? (sum / n) : 0;
};

// -----------------------------
// Time series
// -----------------------------

export interface DailyHitRate {
  date: string;
  hits: number;
  total: number;
  rate: number;
}

/**
 * Daily hit-rate time series: [{ date, hits, total, rate }]
 */
export const dailyHitRate = (rows: ForecastRow[]): DailyHitRate[] => {
  const byDate: Record<string, { hits: number; total: number }> = {};

  for (const r of rows) {
    const d = toYMD(r.forecast_date);
    if (!byDate[d]) byDate[d] = { hits: 0, total: 0 };
    const h = (typeof r.is_hit === 'boolean') ? r.is_hit : isInsidePredictedRange(r);
    byDate[d].total++;
    if (h) byDate[d].hits++;
  }

  return Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, hits: v.hits, total: v.total, rate: v.total ? v.hits / v.total : 0 }));
};

export interface WeeklyAggregate {
  week: string;
  rate: number;
}

/**
 * Weekly aggregation of a daily ratio series (array of {date, rate}).
 * Aggregates by ISO week (Mon-Sun). Output: [{ week: 'YYYY-Www', rate }]
 */
export const weeklyAggregateFromDailyRate = (daily: Array<{ date: string; rate: number }>): WeeklyAggregate[] => {
  const toISOWeekKey = (ymd: string): string => {
    const [Y, M, D] = ymd.split('-').map(Number);
    const dt = new Date(Date.UTC(Y, M - 1, D));
    // ISO week (Mon=1..Sun=7). Based on Thursday rule.
    const dayNum = (dt.getUTCDay() + 6) % 7 + 1; // Mon=1..Sun=7
    dt.setUTCDate(dt.getUTCDate() + (4 - dayNum)); // Thursday of this week
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const week = Math.floor(((dt.getTime() - yearStart.getTime()) / 86400000 + 10) / 7);
    return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  const byW: Record<string, { sum: number; n: number }> = {};

  for (const d of daily) {
    const key = toISOWeekKey(d.date);
    if (!byW[key]) byW[key] = { sum: 0, n: 0 };
    if (isFiniteNum(d.rate)) { byW[key].sum += d.rate; byW[key].n++; }
  }

  return Object.entries(byW)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, agg]) => ({ week, rate: agg.n ? agg.sum / agg.n : 0 }));
};

// -----------------------------
// Errors & Histogram
// -----------------------------

/** Absolute errors for high/low/mid arrays. */
export const absoluteErrors = {
  high: (rows: ForecastRow[]): number[] => 
    rows.map(r => Math.abs((r.actual_high ?? NaN) - r.predicted_hi)).filter(isFiniteNum),
  low: (rows: ForecastRow[]): number[] => 
    rows.map(r => Math.abs((r.actual_low ?? NaN) - r.predicted_lo)).filter(isFiniteNum),
  mid: (rows: ForecastRow[]): number[] => 
    rows.map(r => Math.abs(actualMid(r) - predictedMid(r))).filter(isFiniteNum),
};

export interface HistogramResult {
  labels: string[];
  bins: number[];
}

/** Histogram bucketing. */
export const histogram = (values: number[], binSize: number = 0.5, max: number = 6): HistogramResult => {
  const numBins = Math.max(1, Math.ceil(max / binSize));
  const bins = Array.from({ length: numBins }, () => 0);

  for (const v of values) {
    let idx = Math.floor(v / binSize);
    if (idx < 0) idx = 0;
    if (idx >= numBins) idx = numBins - 1;
    bins[idx]++;
  }

  const labels = bins.map((_, i) => `${((i + 1) * binSize).toFixed(1)} - ${(i * binSize).toFixed(1)}`);
  return { labels, bins };
};

// -----------------------------
// Radial scores (0..1) for gauges
// -----------------------------

export const radialScore = {
  accuracy: (rate: number): number => clamp01(rate),
  inside: (ratio: number): number => clamp01(ratio),
  mape: (mapeVal: number, min: number = 0.012, max: number = 0.032): number => 
    clamp01(1 - normalize(mapeVal, min, max)),
  range: (avgRange: number, min: number = 1.6, max: number = 4.8): number => 
    clamp01(1 - normalize(avgRange, min, max)),
};

// Export all utilities
export const ForecastMetrics = {
  // helpers
  toYMD,
  normalize,
  clamp01,
  isInsidePredictedRange,
  predictedMid,
  actualMid,
  ape,
  // KPIs
  hitRate,
  insideRangeRatio,
  averageRangeWidth,
  mapeHigh,
  mapeLow,
  mapeMid,
  // series
  dailyHitRate,
  weeklyAggregateFromDailyRate,
  // errors
  absoluteErrors,
  histogram,
  // radial
  radialScore,
};




