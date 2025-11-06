-- #############################################################################
-- # تحديث نظام التقييم - ملف SQL موحد للتنفيذ المباشر
-- # تم تنفيذ الترجمات بالفعل (10/10) ✅
-- # هذا الملف لتحديث الوظيفة فقط
-- #############################################################################

BEGIN;

-- ==============================================================================
-- تحديث وظيفة evaluate_and_save_forecasts لإرجاع JSON
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.evaluate_and_save_forecasts(p_date_filter date DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    processed_count integer;
    stocks_count integer;
    result_json json;
BEGIN
    WITH new_evaluations AS (
        SELECT
            f.stock_symbol,
            s.name AS stock_name,
            f.forecast_date,
            f.predicted_price,
            f.predicted_lo,
            f.predicted_hi,
            f.confidence,
            h.low AS actual_low,
            h.high AS actual_high,
            h.close AS actual_close,
            (f.predicted_lo <= h.high AND h.low <= f.predicted_hi) AS hit_range,
            ABS(f.predicted_price - h.close) AS abs_error,
            ABS(f.predicted_price - h.close) / NULLIF(h.close, 0) AS pct_error
        FROM
            public.forecasts f
        JOIN
            public.stocks s ON f.stock_symbol = s.symbol
        JOIN
            public.historical_data h ON f.stock_symbol = h.stock_symbol AND f.forecast_date = h.date
        WHERE (p_date_filter IS NULL OR f.forecast_date = p_date_filter)
    ),
    insert_history AS (
        INSERT INTO public.forecast_check_history (
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        )
        SELECT
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        FROM new_evaluations
        ON CONFLICT (stock_symbol, forecast_date) DO UPDATE SET
            predicted_price = EXCLUDED.predicted_price,
            predicted_lo = EXCLUDED.predicted_lo,
            predicted_hi = EXCLUDED.predicted_hi,
            actual_low = EXCLUDED.actual_low,
            actual_high = EXCLUDED.actual_high,
            actual_close = EXCLUDED.actual_close,
            hit_range = EXCLUDED.hit_range,
            abs_error = EXCLUDED.abs_error,
            pct_error = EXCLUDED.pct_error,
            confidence = EXCLUDED.confidence,
            created_at = NOW()
        RETURNING 1
    ),
    upsert_latest AS (
        INSERT INTO public.forecast_check_latest (
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        )
        SELECT DISTINCT ON (stock_symbol)
            stock_symbol, forecast_date, predicted_price, predicted_lo, predicted_hi,
            actual_low, actual_high, actual_close, hit_range, abs_error, pct_error, confidence
        FROM new_evaluations
        ORDER BY stock_symbol, forecast_date DESC
        ON CONFLICT (stock_symbol) DO UPDATE SET
            forecast_date = EXCLUDED.forecast_date,
            predicted_price = EXCLUDED.predicted_price,
            predicted_lo = EXCLUDED.predicted_lo,
            predicted_hi = EXCLUDED.predicted_hi,
            actual_low = EXCLUDED.actual_low,
            actual_high = EXCLUDED.actual_high,
            actual_close = EXCLUDED.actual_close,
            hit_range = EXCLUDED.hit_range,
            abs_error = EXCLUDED.abs_error,
            pct_error = EXCLUDED.pct_error,
            confidence = EXCLUDED.confidence,
            created_at = NOW()
    ),
    insert_legacy AS (
        INSERT INTO public."Forcast_Result" (
            stock_symbol, stock_name, forecast_date, predicted_lo, predicted_hi,
            actual_low, actual_high, is_hit
        )
        SELECT
            stock_symbol, stock_name, forecast_date, predicted_lo, predicted_hi,
            actual_low, actual_high, hit_range
        FROM new_evaluations
        ON CONFLICT (stock_symbol, forecast_date) DO UPDATE SET
            stock_name = EXCLUDED.stock_name,
            predicted_lo = EXCLUDED.predicted_lo,
            predicted_hi = EXCLUDED.predicted_hi,
            actual_low = EXCLUDED.actual_low,
            actual_high = EXCLUDED.actual_high,
            is_hit = EXCLUDED.is_hit,
            created_at = NOW()
    ),
    count_stats AS (
        SELECT 
            COUNT(*) AS forecast_count,
            COUNT(DISTINCT stock_symbol) AS stock_count
        FROM new_evaluations
    )
    SELECT 
        forecast_count,
        stock_count
    INTO processed_count, stocks_count
    FROM count_stats;
    
    result_json := json_build_object(
        'forecasts_processed', COALESCE(processed_count, 0),
        'stocks_processed', COALESCE(stocks_count, 0),
        'execution_time', NOW()
    );
    
    RAISE NOTICE '% forecast(s) evaluated for % stock(s).', processed_count, stocks_count;
    
    RETURN result_json;
END;
$$;

COMMIT;

-- ==============================================================================
-- التحقق من التحديث
-- ==============================================================================

-- التحقق من الوظيفة
SELECT 
    proname AS function_name,
    pg_get_function_result(oid) AS return_type
FROM pg_proc 
WHERE proname = 'evaluate_and_save_forecasts';

-- اختبار الوظيفة
SELECT public.evaluate_and_save_forecasts(NULL) AS test_result;

