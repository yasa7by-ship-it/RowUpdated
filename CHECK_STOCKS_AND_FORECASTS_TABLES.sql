-- #############################################################################
-- # فحص الجداول: الأسهم، البيانات التاريخية، وفحص التوقعات
-- # تنفيذ مباشر في Supabase SQL Editor
-- #############################################################################

-- ==============================================================================
-- 1. فحص جدول الأسهم (stocks)
-- ==============================================================================
SELECT 
    'جدول الأسهم (stocks)' AS table_name,
    COUNT(*) AS total_stocks,
    COUNT(*) FILTER (WHERE is_tracked = true) AS tracked_stocks,
    COUNT(*) FILTER (WHERE is_tracked = false) AS untracked_stocks,
    MIN(created_at) AS oldest_stock,
    MAX(created_at) AS newest_stock,
    MAX(updated_at) AS last_updated
FROM public.stocks;

-- عرض عينة من الأسهم
SELECT 
    symbol,
    name,
    is_tracked,
    created_at,
    updated_at
FROM public.stocks
ORDER BY created_at DESC
LIMIT 10;

-- ==============================================================================
-- 2. فحص جدول البيانات التاريخية (historical_data)
-- ==============================================================================
SELECT 
    'جدول البيانات التاريخية (historical_data)' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT stock_symbol) AS unique_stocks,
    MIN(date) AS oldest_date,
    MAX(date) AS newest_date,
    MIN(created_at) AS oldest_record,
    MAX(created_at) AS newest_record
FROM public.historical_data;

-- إحصائيات حسب السهم
SELECT 
    stock_symbol,
    COUNT(*) AS records_count,
    MIN(date) AS first_date,
    MAX(date) AS last_date,
    MAX(created_at) AS last_updated
FROM public.historical_data
GROUP BY stock_symbol
ORDER BY records_count DESC
LIMIT 10;

-- إحصائيات حسب التاريخ
SELECT 
    date,
    COUNT(*) AS records_count,
    COUNT(DISTINCT stock_symbol) AS unique_stocks
FROM public.historical_data
GROUP BY date
ORDER BY date DESC
LIMIT 10;

-- ==============================================================================
-- 3. فحص جدول فحص التوقعات - التاريخ (forecast_check_history)
-- ==============================================================================
SELECT 
    'جدول فحص التوقعات - التاريخ (forecast_check_history)' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT stock_symbol) AS unique_stocks,
    COUNT(DISTINCT forecast_date) AS unique_dates,
    MIN(forecast_date) AS oldest_forecast,
    MAX(forecast_date) AS newest_forecast,
    MIN(created_at) AS oldest_record,
    MAX(created_at) AS newest_record
FROM public.forecast_check_history;

-- إحصائيات دقة التوقعات
SELECT 
    COUNT(*) AS total_forecasts,
    COUNT(*) FILTER (WHERE hit_range = true) AS hit_count,
    COUNT(*) FILTER (WHERE hit_range = false) AS miss_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE hit_range = true) / NULLIF(COUNT(*), 0), 2) AS hit_rate_percent,
    ROUND(AVG(abs_error), 2) AS avg_abs_error,
    ROUND(AVG(pct_error), 2) AS avg_pct_error
FROM public.forecast_check_history;

-- أفضل 10 أسهم حسب دقة التوقعات
SELECT 
    stock_symbol,
    COUNT(*) AS total_forecasts,
    COUNT(*) FILTER (WHERE hit_range = true) AS hit_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE hit_range = true) / NULLIF(COUNT(*), 0), 2) AS hit_rate_percent,
    ROUND(AVG(abs_error), 2) AS avg_abs_error
FROM public.forecast_check_history
GROUP BY stock_symbol
HAVING COUNT(*) >= 5
ORDER BY hit_rate_percent DESC
LIMIT 10;

-- ==============================================================================
-- 4. فحص جدول فحص التوقعات - الأحدث (forecast_check_latest)
-- ==============================================================================
SELECT 
    'جدول فحص التوقعات - الأحدث (forecast_check_latest)' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT stock_symbol) AS unique_stocks,
    MIN(forecast_date) AS oldest_forecast,
    MAX(forecast_date) AS newest_forecast,
    MIN(created_at) AS oldest_record,
    MAX(created_at) AS newest_record
FROM public.forecast_check_latest;

-- إحصائيات دقة التوقعات الأحدث
SELECT 
    COUNT(*) AS total_forecasts,
    COUNT(*) FILTER (WHERE hit_range = true) AS hit_count,
    COUNT(*) FILTER (WHERE hit_range = false) AS miss_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE hit_range = true) / NULLIF(COUNT(*), 0), 2) AS hit_rate_percent,
    ROUND(AVG(abs_error), 2) AS avg_abs_error,
    ROUND(AVG(pct_error), 2) AS avg_pct_error
FROM public.forecast_check_latest;

-- عينة من أحدث التوقعات المفحوصة
SELECT 
    stock_symbol,
    forecast_date,
    predicted_price,
    actual_close,
    abs_error,
    ROUND(pct_error * 100, 2) AS pct_error_percent,
    hit_range,
    created_at
FROM public.forecast_check_latest
ORDER BY created_at DESC
LIMIT 10;

-- ==============================================================================
-- 5. فحص جدول التوقعات (forecasts) للتحقق من البيانات
-- ==============================================================================
SELECT 
    'جدول التوقعات (forecasts)' AS table_name,
    COUNT(*) AS total_forecasts,
    COUNT(DISTINCT stock_symbol) AS unique_stocks,
    COUNT(DISTINCT forecast_date) AS unique_dates,
    MIN(forecast_date) AS oldest_forecast,
    MAX(forecast_date) AS newest_forecast
FROM public.forecasts;

-- ==============================================================================
-- 6. ملخص شامل
-- ==============================================================================
SELECT 
    'ملخص شامل' AS summary,
    (SELECT COUNT(*) FROM public.stocks) AS total_stocks,
    (SELECT COUNT(*) FROM public.historical_data) AS total_historical_records,
    (SELECT COUNT(*) FROM public.forecasts) AS total_forecasts,
    (SELECT COUNT(*) FROM public.forecast_check_history) AS total_checked_forecasts,
    (SELECT COUNT(*) FROM public.forecast_check_latest) AS latest_checked_forecasts;

