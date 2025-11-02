-- #############################################################################
-- # QUICK TEST: تحقق من أن الدالة تعمل وتعيد البيانات الصحيحة
-- # 
-- # شغل هذا السكربت بعد تشغيل migration_160
-- #############################################################################

-- اختبار 1: تحقق من وجود الدالة
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_source
FROM pg_proc
WHERE proname = 'get_the_coming_trend_data';

-- اختبار 2: جرب الدالة مباشرة (أول 5 أسهم)
SELECT 
    symbol,
    indicator_date,
    actual_low,
    actual_high,
    next_predicted_lo,
    next_predicted_hi,
    rsi
FROM public.get_the_coming_trend_data()
LIMIT 5;

-- اختبار 3: تحقق من الأسهم التي لديها actual_low و actual_high
SELECT 
    COUNT(*) AS total_stocks,
    COUNT(actual_low) AS stocks_with_actual_low,
    COUNT(actual_high) AS stocks_with_actual_high
FROM public.get_the_coming_trend_data();

-- اختبار 4: آخر تاريخ متاح في forecast_check_history
SELECT 
    MAX(forecast_date) AS latest_check_date,
    COUNT(DISTINCT stock_symbol) AS stocks_with_data
FROM public.forecast_check_history;

-- اختبار 5: آخر تاريخ في historical_data (يستخدمه indicator_date)
SELECT 
    MAX(date) AS latest_historical_date
FROM public.historical_data;

