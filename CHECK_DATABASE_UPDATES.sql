-- #############################################################################
-- # فحص حالة الجداول والوظائف
-- # تنفيذ مباشر في Supabase SQL Editor
-- #############################################################################

-- 1. فحص الترجمات
SELECT lang_id, key, value 
FROM public.translations 
WHERE key IN ('last_run_stats', 'forecasts_processed', 'stocks_processed', 'last_run_time', 'running')
ORDER BY key, lang_id;

-- 2. فحص نوع الإرجاع للوظيفة
SELECT 
    proname AS function_name,
    pg_get_function_result(oid) AS return_type,
    pg_get_function_arguments(oid) AS arguments
FROM pg_proc 
WHERE proname = 'evaluate_and_save_forecasts';

-- 3. اختبار الوظيفة (اختياري - قد يستغرق وقتاً)
-- SELECT public.evaluate_and_save_forecasts(NULL) AS test_result;

-- 4. فحص آخر سجل في forecast_check_history
SELECT 
    COUNT(*) AS total_records,
    COUNT(DISTINCT stock_symbol) AS unique_stocks,
    MAX(created_at) AS last_created_at
FROM public.forecast_check_history;

-- 5. فحص آخر سجل في forecast_check_latest
SELECT 
    COUNT(*) AS total_records,
    MAX(created_at) AS last_updated_at
FROM public.forecast_check_latest;

