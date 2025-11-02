-- #############################################################################
-- #
-- # RESTORE: إعادة إنشاء دالة get_daily_watchlist_data()
-- #
-- # هذا هو السكربت الأصلي للدالة التي تم حذفها واستبدالها
-- # 
-- #############################################################################

BEGIN;

-- إعادة إنشاء الدالة الأصلية
CREATE OR REPLACE FUNCTION public.get_daily_watchlist_data()
RETURNS TABLE (
    symbol text,
    stock_name text,
    last_close real,
    last_updated timestamptz,
    predicted_lo real,
    predicted_hi real,
    sma20 real,
    sma50 real,
    pattern_name text,
    bullish boolean,
    forecast_date date
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    latest_forecast_date date;
    latest_indicator_date date;
BEGIN
    -- تجد آخر تاريخ توقع (الغد)
    SELECT max(f.forecast_date) INTO latest_forecast_date FROM public.forecasts f;

    -- تجد آخر تاريخ مؤشرات (اليوم - قبل تاريخ التوقع)
    SELECT max(ti.date) INTO latest_indicator_date 
    FROM public.technical_indicators ti 
    WHERE ti.date < latest_forecast_date;

    RETURN QUERY
    SELECT
        s.symbol,
        s.name AS stock_name,
        s.price AS last_close,
        s.last_updated,
        f.predicted_lo,
        f.predicted_hi,
        ti.sma20,
        ti.sma50,
        cp.pattern_name,
        cp.bullish,
        f.forecast_date
    FROM
        public.forecasts f
    JOIN
        public.stocks s ON f.stock_symbol = s.symbol
    LEFT JOIN
        public.technical_indicators ti 
        ON f.stock_symbol = ti.stock_symbol 
        AND ti.date = latest_indicator_date
    LEFT JOIN
        (
            -- تأخذ أول/أهم نمط لتاريخ المؤشر لتجنب الصفوف المكررة
            SELECT DISTINCT ON (cp_inner.stock_symbol) *
            FROM public.candle_patterns cp_inner
            WHERE cp_inner.date = latest_indicator_date
        ) cp ON f.stock_symbol = cp.stock_symbol
    WHERE
        f.forecast_date = latest_forecast_date
        AND s.is_tracked = true
    ORDER BY
        s.symbol;
END;
$$;

RAISE NOTICE 'SUCCESS: RPC function "get_daily_watchlist_data" restored.';

COMMIT;

