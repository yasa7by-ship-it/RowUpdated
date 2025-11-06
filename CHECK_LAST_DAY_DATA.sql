-- ============================================
-- سكربت التحقق من بيانات صفحة "آخر يوم"
-- ============================================

-- 1. التحقق من آخر تاريخ متاح
SELECT 
    'آخر تاريخ متاح' AS info,
    max(forecast_date) AS latest_date,
    COUNT(*) AS total_records
FROM public.forecast_check_latest;

-- 2. التحقق من الإحصائيات للتاريخ الأخير
SELECT 
    'إحصائيات آخر تاريخ' AS info,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE hit_range = true) AS hits,
    COUNT(*) FILTER (WHERE hit_range = false) AS misses,
    ROUND(COUNT(*) FILTER (WHERE hit_range = true)::numeric / COUNT(*)::numeric * 100, 2) AS hit_rate_percent
FROM public.forecast_check_latest
WHERE forecast_date = (SELECT max(forecast_date) FROM public.forecast_check_latest);

-- 3. التحقق من صحة البيانات (مقارنة مع forecast_check_history)
SELECT 
    'مقارنة مع forecast_check_history' AS info,
    fch.forecast_date,
    COUNT(*) AS total_in_history,
    COUNT(*) FILTER (WHERE fch.hit_range = true) AS hits_in_history,
    COUNT(*) FILTER (WHERE fch.hit_range = false) AS misses_in_history
FROM public.forecast_check_history fch
WHERE fch.forecast_date = (
    SELECT max(forecast_date) 
    FROM public.forecast_check_latest
)
GROUP BY fch.forecast_date;

-- 4. التحقق من البيانات التي ترجعها الدالة
SELECT 
    'بيانات من get_daily_checklist()' AS info,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE is_hit = true) AS hits,
    COUNT(*) FILTER (WHERE is_hit = false) AS misses,
    ROUND(COUNT(*) FILTER (WHERE is_hit = true)::numeric / COUNT(*)::numeric * 100, 2) AS hit_rate_percent
FROM public.get_daily_checklist();

-- 5. التحقق من البيانات المفصلة (عينة من 10 سجلات)
SELECT 
    stock_symbol,
    forecast_date,
    actual_low,
    actual_high,
    predicted_lo,
    predicted_hi,
    hit_range AS is_hit,
    CASE 
        WHEN actual_low IS NULL OR actual_high IS NULL OR predicted_lo IS NULL OR predicted_hi IS NULL 
        THEN 'بيانات ناقصة'
        ELSE 'بيانات كاملة'
    END AS data_status
FROM public.forecast_check_latest
WHERE forecast_date = (SELECT max(forecast_date) FROM public.forecast_check_latest)
ORDER BY stock_symbol
LIMIT 10;

-- 6. التحقق من السجلات التي قد تكون غير صحيحة
SELECT 
    'سجلات قد تكون غير صحيحة' AS info,
    stock_symbol,
    forecast_date,
    actual_low,
    actual_high,
    predicted_lo,
    predicted_hi,
    hit_range,
    CASE 
        WHEN actual_low IS NULL OR actual_high IS NULL THEN 'النطاق الفعلي ناقص'
        WHEN predicted_lo IS NULL OR predicted_hi IS NULL THEN 'النطاق المتوقع ناقص'
        WHEN actual_low > actual_high THEN 'الحد الأدنى أعلى من الحد الأعلى (فعلي)'
        WHEN predicted_lo > predicted_hi THEN 'الحد الأدنى أعلى من الحد الأعلى (متوقع)'
        ELSE 'OK'
    END AS issue
FROM public.forecast_check_latest
WHERE forecast_date = (SELECT max(forecast_date) FROM public.forecast_check_latest)
    AND (
        actual_low IS NULL 
        OR actual_high IS NULL 
        OR predicted_lo IS NULL 
        OR predicted_hi IS NULL
        OR actual_low > actual_high
        OR predicted_lo > predicted_hi
    );

-- 7. التحقق من كيفية حساب hit_range (مقارنة مع منطق الحساب)
SELECT 
    stock_symbol,
    forecast_date,
    actual_low,
    actual_high,
    predicted_lo,
    predicted_hi,
    hit_range AS current_hit_range,
    -- منطق الحساب الصحيح: النطاق الفعلي يتداخل مع النطاق المتوقع
    CASE 
        WHEN actual_low IS NULL OR actual_high IS NULL OR predicted_lo IS NULL OR predicted_hi IS NULL 
        THEN NULL
        WHEN (actual_low <= predicted_hi AND actual_high >= predicted_lo) 
        THEN true
        ELSE false
    END AS calculated_hit_range,
    CASE 
        WHEN hit_range IS NULL THEN 'قيمة NULL'
        WHEN hit_range != (actual_low <= predicted_hi AND actual_high >= predicted_lo) 
        THEN 'غير متطابق'
        ELSE 'متطابق'
    END AS match_status
FROM public.forecast_check_latest
WHERE forecast_date = (SELECT max(forecast_date) FROM public.forecast_check_latest)
LIMIT 20;

