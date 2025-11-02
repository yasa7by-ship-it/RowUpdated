-- #############################################################################
-- # اختبار جميع الدوال المستخدمة في صفحة "الاتجاه القادم"
-- # 
-- # شغل كل استعلام على حدة لرؤية البيانات
-- #############################################################################

-- ============================================================================
-- 1. اختبار الدالة الرئيسية: get_the_coming_trend_data
-- ============================================================================
-- هذه هي الدالة المستخدمة لجلب جميع بيانات الجدول
SELECT 
    symbol,
    stock_name,
    last_price,
    daily_change,
    daily_change_percent,
    next_forecast_date,
    next_predicted_lo,        -- النطاق المتوقع
    next_predicted_hi,        -- النطاق المتوقع
    indicator_date,
    rsi,
    macd,
    macd_signal,
    sma20,
    sma50,
    pattern_name,
    bullish,
    actual_low,              -- النطاق الفعلي
    actual_high              -- النطاق الفعلي
FROM public.get_the_coming_trend_data()
LIMIT 10;

-- ============================================================================
-- 2. اختبار: كم سهم يعرض؟
-- ============================================================================
SELECT COUNT(*) AS total_stocks FROM public.get_the_coming_trend_data();

-- ============================================================================
-- 3. اختبار: هل توجد توقعات؟
-- ============================================================================
SELECT 
    MAX(forecast_date) AS latest_forecast_date,
    COUNT(*) AS total_forecasts,
    COUNT(DISTINCT stock_symbol) AS unique_stocks
FROM public.forecasts;

-- ============================================================================
-- 4. اختبار: هل توجد بيانات في النطاق المتوقع؟
-- ============================================================================
SELECT 
    stock_symbol,
    forecast_date,
    predicted_lo,
    predicted_hi,
    predicted_price
FROM public.forecasts
WHERE forecast_date = (SELECT MAX(forecast_date) FROM public.forecasts)
LIMIT 10;

-- ============================================================================
-- 5. اختبار: هل توجد بيانات في النطاق الفعلي من forecast_check_history؟
-- ============================================================================
SELECT 
    stock_symbol,
    forecast_date,
    actual_low,
    actual_high,
    predicted_lo,
    predicted_hi
FROM public.forecast_check_history
ORDER BY forecast_date DESC
LIMIT 10;

-- ============================================================================
-- 6. اختبار: آخر تاريخ في historical_data
-- ============================================================================
SELECT 
    MAX(date) AS latest_historical_date,
    COUNT(*) AS total_records
FROM public.historical_data;

-- ============================================================================
-- 7. اختبار: مؤشرات فنية لآخر تاريخ تاريخي
-- ============================================================================
SELECT 
    stock_symbol,
    date,
    rsi,
    macd,
    macd_signal,
    sma20,
    sma50
FROM public.technical_indicators
WHERE date = (SELECT MAX(date) FROM public.historical_data)
LIMIT 10;

-- ============================================================================
-- 8. اختبار: أنماط الشموع لآخر تاريخ تاريخي
-- ============================================================================
SELECT 
    stock_symbol,
    date,
    pattern_name,
    bullish,
    confidence
FROM public.candle_patterns
WHERE date = (SELECT MAX(date) FROM public.historical_data)
LIMIT 10;

-- ============================================================================
-- 9. اختبار: بيانات من stocks (آخر سعر إغلاق)
-- ============================================================================
SELECT 
    symbol,
    name,
    price AS last_price,
    change AS daily_change,
    change_percent AS daily_change_percent,
    is_tracked
FROM public.stocks
WHERE is_tracked = true
LIMIT 10;

-- ============================================================================
-- 10. اختبار شامل: هل الدالة ترجع NULL في النطاق المتوقع؟
-- ============================================================================
SELECT 
    symbol,
    next_forecast_date,
    next_predicted_lo,
    next_predicted_hi,
    actual_low,
    actual_high,
    CASE 
        WHEN next_predicted_lo IS NULL THEN 'نعم - NULL'
        ELSE 'لا - موجود'
    END AS predicted_lo_status,
    CASE 
        WHEN next_predicted_hi IS NULL THEN 'نعم - NULL'
        ELSE 'لا - موجود'
    END AS predicted_hi_status,
    CASE 
        WHEN actual_low IS NULL THEN 'نعم - NULL'
        ELSE 'لا - موجود'
    END AS actual_low_status,
    CASE 
        WHEN actual_high IS NULL THEN 'نعم - NULL'
        ELSE 'لا - موجود'
    END AS actual_high_status
FROM public.get_the_coming_trend_data()
LIMIT 10;

