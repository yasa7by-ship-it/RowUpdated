-- #############################################################################
-- # WHAT HAPPENED PAGE SUPPORT FUNCTIONS
-- #
-- # This script creates the SQL functions required by the "What Happened"
-- # page. The functions expose summary data for the latest trading session and
-- # a detailed drill-down for a selected stock. No tables are created or
-- # modified – only read operations on existing tables are performed.
-- #############################################################################

BEGIN;

DROP FUNCTION IF EXISTS public.get_what_happened_summary();
DROP FUNCTION IF EXISTS public.get_what_happened_stock_details(text);

-- ============================================================================
-- Function: get_what_happened_summary
-- Returns a table summarising all stocks for the latest trading day found in
-- historical_data. Each row contains price action, change metrics, the most
-- recent indicator snapshot, latest candle pattern, and the next forecast.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_what_happened_summary()
RETURNS TABLE (
    stock_symbol text,
    stock_name text,
    trading_date date,
    open_price double precision,
    high_price double precision,
    low_price double precision,
    close_price double precision,
    volume double precision,
    price_change double precision,
    price_change_percent double precision,
    rsi double precision,
    macd double precision,
    macd_signal double precision,
    macd_histogram double precision,
    sma20 double precision,
    sma50 double precision,
    sma200 double precision,
    ema12 double precision,
    ema26 double precision,
    boll_upper double precision,
    boll_middle double precision,
    boll_lower double precision,
    stochastic_k double precision,
    stochastic_d double precision,
    williams_r double precision,
    atr14 double precision,
    volatility_20 double precision,
    pattern_name text,
    pattern_bullish boolean,
    next_forecast_price double precision,
    next_forecast_lo double precision,
    next_forecast_hi double precision,
    forecast_hit boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    latest_date date;
BEGIN
    SELECT max(h.date) INTO latest_date FROM public.historical_data h;

    IF latest_date IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH latest_hist AS (
        SELECT h.*, s.name AS stock_name
        FROM public.historical_data h
        JOIN public.stocks s ON s.symbol = h.stock_symbol
        WHERE h.date = latest_date
    ),
    indicators AS (
        SELECT DISTINCT ON (ti.stock_symbol)
            ti.stock_symbol,
            ti.rsi,
            ti.macd,
            ti.macd_signal,
            ti.macd_histogram,
            ti.sma20,
            ti.sma50,
            ti.sma200,
            ti.ema12,
            ti.ema26,
            ti.boll_upper,
            ti.boll_middle,
            ti.boll_lower,
            ti.stochastic_k,
            ti.stochastic_d,
            ti.williams_r,
            ti.atr14,
            ti.volatility_20
        FROM public.technical_indicators ti
        WHERE ti.date <= latest_date
        ORDER BY ti.stock_symbol, ti.date DESC
    ),
    patterns AS (
        SELECT DISTINCT ON (cp.stock_symbol)
            cp.stock_symbol,
            cp.pattern_name,
            cp.bullish
        FROM public.candle_patterns cp
        WHERE cp.date <= latest_date
        ORDER BY cp.stock_symbol, cp.date DESC
    ),
    previous_closes AS (
        SELECT lh.stock_symbol,
               (
                   SELECT h2.close
                   FROM public.historical_data h2
                   WHERE h2.stock_symbol = lh.stock_symbol
                     AND h2.date < lh.date
                   ORDER BY h2.date DESC
                   LIMIT 1
               )::double precision AS prev_close
        FROM latest_hist lh
    ),
    next_forecasts AS (
        SELECT DISTINCT ON (f.stock_symbol)
            f.stock_symbol,
            f.forecast_date,
            f.predicted_price,
            f.predicted_lo,
            f.predicted_hi
        FROM public.forecasts f
        WHERE f.forecast_date >= latest_date
        ORDER BY f.stock_symbol, f.forecast_date ASC
    ),
    hits AS (
        SELECT fch.stock_symbol,
               fch.forecast_date,
               fch.hit_range
        FROM public.forecast_check_history fch
        WHERE fch.forecast_date = latest_date
    )
    SELECT
        lh.stock_symbol,
        lh.stock_name,
        latest_date AS trading_date,
        lh.open::double precision AS open_price,
        lh.high::double precision AS high_price,
        lh.low::double precision AS low_price,
        lh.close::double precision AS close_price,
        lh.volume::double precision,
        (lh.close::double precision - COALESCE(pc.prev_close, lh.open::double precision)) AS price_change,
        CASE
            WHEN COALESCE(pc.prev_close, NULLIF(lh.open::double precision, 0)) = 0 THEN NULL
            ELSE ((lh.close::double precision - COALESCE(pc.prev_close, lh.open::double precision)) / COALESCE(pc.prev_close, NULLIF(lh.open::double precision, 0))) * 100
        END AS price_change_percent,
        ind.rsi::double precision,
        ind.macd::double precision,
        ind.macd_signal::double precision,
        ind.macd_histogram::double precision,
        ind.sma20::double precision,
        ind.sma50::double precision,
        ind.sma200::double precision,
        ind.ema12::double precision,
        ind.ema26::double precision,
        ind.boll_upper::double precision,
        ind.boll_middle::double precision,
        ind.boll_lower::double precision,
        ind.stochastic_k::double precision,
        ind.stochastic_d::double precision,
        ind.williams_r::double precision,
        ind.atr14::double precision,
        ind.volatility_20::double precision,
        pat.pattern_name,
        pat.bullish AS pattern_bullish,
        nf.predicted_price::double precision AS next_forecast_price,
        nf.predicted_lo::double precision AS next_forecast_lo,
        nf.predicted_hi::double precision AS next_forecast_hi,
        hit.hit_range AS forecast_hit
    FROM latest_hist lh
    LEFT JOIN indicators ind ON ind.stock_symbol = lh.stock_symbol
    LEFT JOIN patterns pat ON pat.stock_symbol = lh.stock_symbol
    LEFT JOIN previous_closes pc ON pc.stock_symbol = lh.stock_symbol
    LEFT JOIN next_forecasts nf ON nf.stock_symbol = lh.stock_symbol
    LEFT JOIN hits hit ON hit.stock_symbol = lh.stock_symbol
    ORDER BY lh.close DESC;
END;
$$;

-- ============================================================================
-- Function: get_what_happened_stock_details
-- Returns a JSON document aggregating detailed data for the selected stock for
-- the latest trading day.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_what_happened_stock_details(p_symbol text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    latest_date date;
BEGIN
    SELECT max(h.date) INTO latest_date FROM public.historical_data h;

    IF latest_date IS NULL THEN
        RETURN jsonb_build_object(
            'symbol', p_symbol,
            'error', 'no_data'
        );
    END IF;

    RETURN jsonb_build_object(
        'symbol', p_symbol,
        'trading_date', latest_date,
        'historical', (
            SELECT row_to_json(h)
            FROM public.historical_data h
            WHERE h.stock_symbol = p_symbol
              AND h.date = latest_date
        ),
        'indicators', (
            SELECT row_to_json(ti)
            FROM public.technical_indicators ti
            WHERE ti.stock_symbol = p_symbol
              AND ti.date <= latest_date
            ORDER BY ti.date DESC
            LIMIT 1
        ),
        'patterns', (
            SELECT COALESCE(json_agg(cp ORDER BY cp.date DESC), '[]'::json)
            FROM (
                SELECT *
                FROM public.candle_patterns
                WHERE stock_symbol = p_symbol
                  AND date <= latest_date
                ORDER BY date DESC
                LIMIT 15
            ) cp
        ),
        'forecast_history', (
            SELECT COALESCE(json_agg(fch ORDER BY fch.forecast_date DESC), '[]'::json)
            FROM (
                SELECT *
                FROM public.forecast_check_history
                WHERE stock_symbol = p_symbol
                ORDER BY forecast_date DESC
                LIMIT 20
            ) fch
        ),
        'forecasts', (
            SELECT COALESCE(json_agg(f ORDER BY f.forecast_date ASC), '[]'::json)
            FROM (
                SELECT *
                FROM public.forecasts
                WHERE stock_symbol = p_symbol
                  AND forecast_date >= latest_date - interval '7 days'
                ORDER BY forecast_date ASC
            ) f
        ),
        'historical_series', (
            SELECT COALESCE(json_agg(h ORDER BY h.date DESC), '[]'::json)
            FROM (
                SELECT *
                FROM public.historical_data
                WHERE stock_symbol = p_symbol
                ORDER BY date DESC
                LIMIT 30
            ) h
        )
    );
END;
$$;

COMMIT;


